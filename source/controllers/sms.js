import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db/connection.js';
import { enqueueManual, normalizePhone } from '../services/sms.js';

export const smsAdminRouter = express.Router();
export const smsWebhookRouter = express.Router();

function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  const expected = process.env.SMS_PUBLIC_BASE_URL;
  const local = `${req.protocol}://${req.get('host')}`;
  if (!origin || (origin !== local && origin !== expected?.replace(/\/$/, ''))) return res.status(403).json({ success: false, error: 'Invalid request origin.' });
  next();
}

smsAdminRouter.get('/events', async (req, res) => {
  try { const [events] = await pool.query("SELECT id, DATE_FORMAT(event_date, '%Y-%m-%d') event_date, enabled FROM sms_events ORDER BY event_date DESC LIMIT 30"); res.json({ success: true, events, mode: process.env.SMS_MODE || 'off' }); }
  catch { res.status(503).json({ success: false, error: 'SMS database setup is required.' }); }
});

smsAdminRouter.post('/events', sameOrigin, async (req, res) => {
  const date = req.body.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) return res.status(400).json({ success: false, error: 'Enter a valid event date.' });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (date < today) return res.status(400).json({ success: false, error: 'Choose today or a future event date.' });
  try { await pool.query('INSERT INTO sms_events (event_date, enabled) VALUES (?, 1) ON DUPLICATE KEY UPDATE enabled=1', [date]); res.json({ success: true }); }
  catch { res.status(503).json({ success: false, error: 'Could not save event.' }); }
});

smsAdminRouter.post('/events/:eventId/enroll/:registrantId', sameOrigin, async (req, res) => {
  const eventId = Number(req.params.eventId);
  const registrantId = Number(req.params.registrantId);
  if (!Number.isSafeInteger(eventId) || eventId < 1 || !Number.isSafeInteger(registrantId) || registrantId < 1) return res.status(400).json({ success: false, error: 'Invalid event or child.' });
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [events] = await pool.query('SELECT id FROM sms_events WHERE id=? AND enabled=1 AND event_date>=?', [eventId, today]);
    const [guardians] = await pool.query('SELECT id, phone_number FROM guardian WHERE registrant_id=? ORDER BY id DESC LIMIT 1', [registrantId]);
    if (!events.length || !guardians.length) return res.status(404).json({ success: false, error: 'Enabled event or guardian not found.' });
    if (!normalizePhone(guardians[0].phone_number)) return res.status(400).json({ success: false, error: 'Guardian phone number is invalid.' });
    await pool.query('INSERT INTO sms_enrollments (event_id, registrant_id, guardian_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE guardian_id=VALUES(guardian_id)', [eventId, registrantId, guardians[0].id]);
    res.json({ success: true });
  } catch { res.status(503).json({ success: false, error: 'Could not assign event.' }); }
});

smsAdminRouter.delete('/events/:id', sameOrigin, async (req, res) => {
  try { await pool.query('UPDATE sms_events SET enabled=0 WHERE id=?', [req.params.id]); res.json({ success: true }); }
  catch { res.status(503).json({ success: false, error: 'Could not disable event.' }); }
});

smsAdminRouter.get('/messages/:id', async (req, res) => {
  try {
    const [children] = await pool.query('SELECT r.first_name, r.last_name, g.phone_number FROM registrant r JOIN guardian g ON g.registrant_id=r.id WHERE r.id=? ORDER BY g.id DESC LIMIT 1', [req.params.id]);
    if (!children.length) return res.status(404).json({ success: false, error: 'Child not found.' });
    const [messages] = await pool.query('SELECT kind, body, status, created_at FROM sms_messages WHERE registrant_id=? ORDER BY id DESC LIMIT 30', [req.params.id]);
    const phone = normalizePhone(children[0].phone_number);
    const [consent] = phone ? await pool.query('SELECT consented, opted_out FROM sms_consent WHERE phone=?', [phone]) : [[]];
    const [events] = await pool.query("SELECT e.id, DATE_FORMAT(e.event_date, '%Y-%m-%d') event_date, IF(se.registrant_id IS NULL, 0, 1) enrolled FROM sms_events e LEFT JOIN sms_enrollments se ON se.event_id=e.id AND se.registrant_id=? WHERE e.enabled=1 AND e.event_date >= ? ORDER BY e.event_date ASC LIMIT 30", [req.params.id, new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())]);
    res.json({ success: true, child: children[0], canText: !!consent[0]?.consented && !consent[0].opted_out, messages, events, mode: process.env.SMS_MODE || 'off' });
  } catch { res.status(503).json({ success: false, error: 'SMS database setup is required.' }); }
});

smsAdminRouter.post('/messages/:id', sameOrigin, async (req, res) => {
  if (!['dry-run', 'live'].includes(process.env.SMS_MODE)) return res.status(503).json({ success: false, error: 'Text messaging is disabled.' });
  try { await enqueueManual(req.params.id, req.body.message); res.json({ success: true }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
});

function verifyTwilio(req, res, next) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const base = process.env.SMS_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (!token || !base?.startsWith('https://') || !req.is('application/x-www-form-urlencoded')) return res.sendStatus(403);
  let data = base + req.originalUrl;
  for (const key of Object.keys(req.body).sort()) {
    const values = Array.isArray(req.body[key]) ? [...new Set(req.body[key])].sort() : [req.body[key]];
    for (const value of values) data += key + value;
  }
  const expected = Buffer.from(crypto.createHmac('sha1', token).update(data).digest('base64'));
  const received = Buffer.from(req.get('X-Twilio-Signature') || '');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return res.sendStatus(403);
  next();
}

smsWebhookRouter.post('/status', verifyTwilio, async (req, res) => {
  const { MessageSid, MessageStatus } = req.body;
  const allowed = ['accepted', 'queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed'];
  if (!MessageSid || !allowed.includes(MessageStatus)) return res.sendStatus(400);
  try {
    await pool.query("UPDATE sms_messages SET status=?, provider_sid=COALESCE(provider_sid, ?) WHERE id=? AND (provider_sid IS NULL OR provider_sid=?) AND status IN ('processing','unknown','accepted','queued','sending','sent') AND NOT (status='sent' AND ? IN ('accepted','queued','sending')) AND NOT (status='sending' AND ? IN ('accepted','queued'))", [MessageStatus, MessageSid, req.query.id, MessageSid, MessageStatus, MessageStatus]);
    res.sendStatus(204);
  } catch { res.sendStatus(503); }
});

smsWebhookRouter.post('/incoming', verifyTwilio, async (req, res) => {
  const phone = normalizePhone(req.body.From);
  const action = req.body.OptOutType;
  if (!phone || !['STOP', 'START', 'HELP'].includes(action)) return res.type('text/xml').send('<Response/>');
  try {
    if (action === 'STOP') await pool.query('INSERT INTO sms_consent (phone, opted_out) VALUES (?, 1) ON DUPLICATE KEY UPDATE opted_out=1', [phone]);
    if (action === 'START') await pool.query('UPDATE sms_consent SET opted_out=0 WHERE phone=?', [phone]);
    res.type('text/xml').send('<Response/>');
  } catch { res.sendStatus(503); }
});