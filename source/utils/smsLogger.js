// Only log explicitly selected metadata, never provider response text or personal data.
export function smsLog(level, event, details = {}) {
  const safe = {};
  for (const key of ['messageId', 'httpStatus', 'errorCode']) {
    const value = String(details[key] ?? '');
    if (/^\d{1,20}$/.test(value)) safe[key] = value;
  }
  if (/^SM[0-9a-f]{32}$/i.test(details.providerSid || '')) safe.providerSid = details.providerSid;
  if (['accepted', 'queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'unknown', 'skipped'].includes(details.status)) safe.status = details.status;
  if (typeof details.applied === 'boolean') safe.applied = details.applied;
  if (['AbortError', 'TimeoutError', 'TypeError', 'Error', 'other'].includes(details.errorType)) safe.errorType = details.errorType;
  console[level](`[SMS] ${JSON.stringify({ time: new Date().toISOString(), event, ...safe })}`);
}