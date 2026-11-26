# Twilio SMS setup

SMS is off unless `SMS_MODE` is explicitly set to `dry-run` or `live`. Registration continues when SMS is unavailable. Existing registrations are not automatically enrolled in reminder events.

1. Back up the application database and review `source/db/sms-schema.sql`. Apply it to the appropriate MySQL database before enabling SMS. The script adds four tables and does not alter existing child/guardian tables.
2. Configure `SMS_MODE=dry-run` in the server environment. Restart the app and verify the admin event controls and message history. Dry-run messages are marked `dry_run` and are never sent later.
3. In the admin dashboard enable the desired event date **before parents register**. Registrations with valid US phone numbers are enrolled in the next enabled event on or after their registration date; texts are sent only to numbers that have opted in. Checking a child in also assigns them to today's enabled event. If there are multiple events, verify assignment is appropriate. There is no recurring schedule or automatic retroactive enrollment. Staff can explicitly assign an existing child to an enabled event in the messaging drawer; this does not grant consent. Disable a date to suppress its reminders.
4. Configure the environment securely (do not commit credentials):
   - `SMS_MODE=live`
   - `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
   - `TWILIO_MESSAGING_SERVICE_SID`
   - `SMS_PUBLIC_BASE_URL=https://your-public-host` (exact public origin, no trailing path)
5. Configure the Twilio Messaging Service to send inbound messages to `https://your-public-host/webhooks/twilio/incoming`, and enable Advanced Opt-Out. Status callbacks are supplied per outgoing message. HTTPS and correct signature validation are required. Test STOP, START and delivery callbacks before live use.
6. Register and obtain approval for the sending number and campaign, including pickup-code, reminder and staff-message use cases. Review the consent disclosure against the approved campaign and the organization's policies. This application uses a single consent record per normalized US phone number; opt-outs suppress all messages to that number. Only guardians explicitly opting in can receive texts. Existing records are not assumed to have consent.

The worker checks for due messages every ten seconds while the app is running. On enabled event dates it queues one reminder per enrolled, checked-in child between 8:45 and 9:00 p.m. and one overdue reminder between 9:15 and 9:30 p.m., in `America/Chicago` time. It rechecks check-in status, event status, phone number and consent before sending. Late reminders expire. Interrupted or timed-out provider sends are marked `unknown` for manual reconciliation rather than retried, since delivery may already have occurred. Failed sends are not automatically retried. Message acceptance is not delivery.

The existing numeric registrant ID remains the pickup code at the user's request. It is predictable and must not be treated as sufficient proof of identity. Registration is publicly accessible; apply perimeter rate limiting before enabling live SMS. The in-app per-number queue limit is not a substitute for robust abuse prevention. Monitor delivery, throughput, error rates and event-date assignment before relying on SMS for pickup coordination. See the confirmation screen for the displayed code if texting fails.