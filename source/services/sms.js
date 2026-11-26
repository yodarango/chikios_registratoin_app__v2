import { pool } from '../db/connection.js';

const disclosure = 'Kidz Quest: I agree to receive registration, pickup reminders and staff texts. Message frequency varies; message and data rates may apply. Reply STOP to opt out, HELP for help.';
const localClock = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
let working = false;

export function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!/^[+\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && !raw.startsWith('+')) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function localParts(now = new Date()) {
  const parts = Object.fromEntries(localClock.formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export async function registerSms({ registrantId, guardianId, phone, consent }) {
  const normalized = normalizePhone(phone);
  if (!normalized) return 'not_requested';
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { date } = localParts();
    const [events] = await connection.query('SELECT id FROM sms_events WHERE enabled = 1 AND event_date >= ? ORDER BY event_date ASC LIMIT 1', [date]);
    const eventId = events[0]?.id || null;
    if (eventId) await connection.query('INSERT INTO sms_enrollments (event_id, registrant_id, guardian_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE guardian_id = VALUES(guardian_id)', [eventId, registrantId, guardianId]);
    if (!consent) { await connection.commit(); return 'not_requested'; }
    await connection.query('INSERT INTO sms_consent (phone, consented, consented_at, disclosure) VALUES (?, 1, UTC_TIMESTAMP(), ?) ON DUPLICATE KEY UPDATE consented = IF(opted_out, consented, 1), consented_at = IF(opted_out, consented_at, UTC_TIMESTAMP()), disclosure = IF(opted_out, disclosure, VALUES(disclosure))', [normalized, disclosure]);
    const [[permission]] = await connection.query('SELECT consented, opted_out FROM sms_consent WHERE phone = ? FOR UPDATE', [normalized]);
    if (!permission.consented || permission.opted_out) { await connection.commit(); return 'opted_out'; }
    const [[child]] = await connection.query('SELECT first_name FROM registrant WHERE id = ?', [registrantId]);
    if (!child) throw new Error('Registrant not found');
    const key = `registration:${eventId || date}:${registrantId}:${normalized}`;
    const [[recent]] = await connection.query("SELECT COUNT(*) total FROM sms_messages WHERE phone=? AND kind='registration' AND created_at > UTC_TIMESTAMP() - INTERVAL 10 MINUTE", [normalized]);
    if (recent.total >= 10) { await connection.commit(); return 'rate_limited'; }
    await connection.query('INSERT IGNORE INTO sms_messages (event_id, registrant_id, guardian_id, phone, kind, body, scheduled_at, expires_at, automatic_key) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR), ?)', [eventId, registrantId, guardianId, normalized, 'registration', `Kidz Quest: ${child.first_name}'s pickup code is ${registrantId}. Please keep it private. Reply STOP to opt out.`, key]);
    await connection.commit();
    return 'queued';
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

export async function enqueueManual(registrantId, message) {
  if (!Number.isSafeInteger(Number(registrantId)) || Number(registrantId) < 1 || typeof message !== 'string' || !message.trim() || message.trim().length > 480) throw new Error('Enter a message of up to 480 characters.');
  const [rows] = await pool.query('SELECT g.id guardian_id, g.phone_number, r.id FROM registrant r JOIN guardian g ON g.registrant_id = r.id WHERE r.id = ? ORDER BY g.id DESC LIMIT 1', [registrantId]);
  if (!rows.length) throw new Error('Child or guardian not found.');
  const phone = normalizePhone(rows[0].phone_number);
  if (!phone) throw new Error('Guardian phone number is invalid.');
  const [[permission]] = await pool.query('SELECT consented, opted_out FROM sms_consent WHERE phone = ?', [phone]);
  if (!permission?.consented || permission.opted_out) throw new Error('This phone number has not opted in to texts or has opted out.');
  const [[recent]] = await pool.query("SELECT COUNT(*) total FROM sms_messages WHERE kind = 'manual' AND created_at > UTC_TIMESTAMP() - INTERVAL 1 MINUTE");
  if (recent.total >= 30) throw new Error('Too many messages. Please wait a minute.');
  await pool.query("INSERT INTO sms_messages (registrant_id, guardian_id, phone, kind, body, scheduled_at, expires_at) VALUES (?, ?, ?, 'manual', ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR))", [registrantId, rows[0].guardian_id, phone, message.trim()]);
}

export async function enrollAtCheckIn(registrantId) {
  const { date } = localParts();
  const [events] = await pool.query('SELECT id FROM sms_events WHERE enabled=1 AND event_date=? LIMIT 1', [date]);
  if (!events.length) return;
  const [guardians] = await pool.query('SELECT id, phone_number FROM guardian WHERE registrant_id=? ORDER BY id DESC LIMIT 1', [registrantId]);
  if (!guardians.length || !normalizePhone(guardians[0].phone_number)) return;
  await pool.query('INSERT INTO sms_enrollments (event_id, registrant_id, guardian_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE guardian_id=VALUES(guardian_id)', [events[0].id, registrantId, guardians[0].id]);
}

async function scheduleReminders(now) {
  const { date, minutes } = localParts(now);
  let kind;
  if (minutes >= 20 * 60 + 45 && minutes < 21 * 60) kind = 'reminder';
  else if (minutes >= 21 * 60 + 15 && minutes < 21 * 60 + 30) kind = 'overdue';
  else return;
  const [children] = await pool.query('SELECT e.id event_id, r.id, r.first_name, g.id guardian_id, g.phone_number FROM sms_events e JOIN sms_enrollments se ON se.event_id=e.id JOIN registrant r ON r.id=se.registrant_id JOIN guardian g ON g.id=se.guardian_id AND g.registrant_id=r.id WHERE e.enabled=1 AND e.event_date=? AND r.checked_in=1', [date]);
  for (const child of children) {
    const phone = normalizePhone(child.phone_number);
    if (!phone) continue;
    const [[permission]] = await pool.query('SELECT consented, opted_out FROM sms_consent WHERE phone=?', [phone]);
    if (!permission?.consented || permission.opted_out) continue;
    const body = kind === 'reminder' ? `Kidz Quest: Pickup for ${child.first_name} is at 9:00 PM. Please bring pickup code ${child.id}.` : `Kidz Quest: ${child.first_name} is still checked in and needs to be picked up. Please bring pickup code ${child.id}.`;
    await pool.query('INSERT IGNORE INTO sms_messages (event_id, registrant_id, guardian_id, phone, kind, body, scheduled_at, expires_at, automatic_key) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), ?)', [child.event_id, child.id, child.guardian_id, phone, kind, body, kind === 'reminder' ? 21 * 60 - minutes : 21 * 60 + 30 - minutes, `${kind}:${child.event_id}:${child.id}`]);
  }
}

async function sendMessage(message) {
  const [[allowed]] = await pool.query('SELECT c.consented, c.opted_out, r.checked_in, g.phone_number, e.enabled event_enabled FROM sms_consent c JOIN guardian g ON g.id=? AND g.registrant_id=? JOIN registrant r ON r.id=? LEFT JOIN sms_events e ON e.id=? WHERE c.phone=?', [message.guardian_id, message.registrant_id, message.registrant_id, message.event_id, message.phone]);
  if (!allowed?.consented || allowed.opted_out || normalizePhone(allowed.phone_number) !== message.phone || (['reminder', 'overdue'].includes(message.kind) && (!allowed.checked_in || !allowed.event_enabled))) {
    await pool.query("UPDATE sms_messages SET status='skipped', error_detail='Consent, number, event, or check-in status changed' WHERE id=?", [message.id]); return;
  }
  if (process.env.SMS_MODE !== 'live') { await pool.query("UPDATE sms_messages SET status='dry_run' WHERE id=?", [message.id]); return; }
  const { TWILIO_ACCOUNT_SID: account, TWILIO_AUTH_TOKEN: token, TWILIO_MESSAGING_SERVICE_SID: service, SMS_PUBLIC_BASE_URL: base } = process.env;
  if (!account || !token || !service || !base?.startsWith('https://')) { await pool.query("UPDATE sms_messages SET status='failed', error_detail='Twilio configuration incomplete' WHERE id=?", [message.id]); return; }
  const params = new URLSearchParams({ To: message.phone, MessagingServiceSid: service, Body: message.body, StatusCallback: `${base.replace(/\/$/, '')}/webhooks/twilio/status?id=${message.id}` });
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok || !data.sid) {
      const uncertain = response.status >= 500 || response.ok;
      await pool.query('UPDATE sms_messages SET status=?, error_detail=? WHERE id=?', [uncertain ? 'unknown' : 'failed', uncertain ? 'Provider outcome uncertain; reconcile before retrying' : `Twilio error ${data.code || response.status}`, message.id]);
      return;
    }
    await pool.query("UPDATE sms_messages SET status=IF(status='processing','accepted',status), provider_sid=COALESCE(provider_sid, ?) WHERE id=?", [data.sid, message.id]);
  } catch (error) {
    // A timeout may occur after Twilio accepted the request. Never retry blindly.
    await pool.query("UPDATE sms_messages SET status='unknown', error_detail='Provider outcome uncertain; reconcile before retrying' WHERE id=?", [message.id]);
  }
}

export async function runSmsWorker(now = new Date()) {
  if (working || process.env.SMS_MODE === 'off' || !process.env.SMS_MODE) return;
  working = true;
  try {
    await pool.query("UPDATE sms_messages SET status='unknown', error_detail='Processing interrupted; reconcile before retrying' WHERE status='processing' AND updated_at < UTC_TIMESTAMP() - INTERVAL 2 MINUTE");
    const [[backlog]] = await pool.query("SELECT COUNT(*) total FROM sms_messages WHERE status='queued' AND scheduled_at <= UTC_TIMESTAMP() AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())");
    if (backlog.total > 300) console.warn(`SMS backlog: ${backlog.total} messages; check provider throughput and delivery windows.`);
    await scheduleReminders(now);
    await pool.query("UPDATE sms_messages SET status='expired' WHERE status='queued' AND expires_at IS NOT NULL AND expires_at <= UTC_TIMESTAMP()");
    const [rows] = await pool.query("SELECT * FROM sms_messages WHERE status='queued' AND scheduled_at <= UTC_TIMESTAMP() ORDER BY id LIMIT 30");
    for (const row of rows) {
      const [claim] = await pool.query("UPDATE sms_messages SET status='processing' WHERE id=? AND status='queued' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP())", [row.id]);
      if (claim.affectedRows) await sendMessage(row);
    }
  } catch (error) { console.error('SMS worker error:', error.message); } finally { working = false; }
}

export function startSmsWorker() {
  if (!['dry-run', 'live'].includes(process.env.SMS_MODE)) return;
  runSmsWorker();
  const timer = setInterval(runSmsWorker, 10000);
  timer.unref();
}