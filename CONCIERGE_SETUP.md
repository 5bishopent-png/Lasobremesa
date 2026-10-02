# Sobre Mesa concierge

The public concierge answers questions using Vercel AI Gateway when its existing deployment identity is usable. If AI is unavailable, it explicitly displays Service guide and uses verified brand answers. No action is performed by the language model. Planning has structured fields, consent, review, a downloadable summary and a tentative calendar draft. Without private storage it uses the site's existing FormSubmit endpoint; provider activation and mailbox delivery must be verified independently. This fallback does not create calendar appointments or email reminders.

## Server configuration

Set secrets in this project's Vercel environment, never source control, then redeploy:

- `AI_GATEWAY_API_KEY` optional if automatic `VERCEL_OIDC_TOKEN` identity has AI Gateway access. `CONCIERGE_MODEL` optional; default `openai/gpt-6.1-sol`.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: dedicated private request database. Restrict its administration, retention and deletion to the owner.
- `RESEND_API_KEY`, `CONCIERGE_FROM_EMAIL`: verified sending domain; `CONCIERGE_OWNER_EMAIL`: verified owner inbox. No placeholder addresses are assumed. Validate delivery to both owner and consenting client before enabling production notifications.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`: authorized owner calendar with read availability and write event scopes. Do not confuse an existing ChatGPT calendar connection with credentials available to a website.
- `CONCIERGE_ADMIN_TOKEN`: random secret at least 32 characters. Open `/concierge-admin.html` and enter it. Never include it in a link or browser storage.
- `CRON_SECRET`: random secret; Vercel calls `/api/reminders` daily at 13:00 UTC with bearer authorization.

## Owner workflow

Review requests in the private desk. Confirm a 20-minute consultation at an explicitly chosen local time. Confirmation checks Google Calendar availability and sends an attendee invitation; this confirms a consultation only, never the catering event. Redis stores the reference and structured intake. A deterministic calendar event ID and confirmation lock prevent duplicate calendar writes. The model has no booking permissions.

Resend schedules reminders 24 hours and 1 hour before a confirmed consultation (client only when opted in, owner always). Daily cron picks up appointments outside Resend's 30-day scheduling window. Provider acceptance is not proof of mailbox delivery. Do not change or cancel confirmed events without cancelling already scheduled Resend emails in the Resend dashboard and updating their stored request status; automated rescheduling/cancellation is not implemented. Incoming chat transcripts are not saved. Only submitted planning data is stored.

## Operational checks

Run `npm test` and `npm run check`. Test a real inquiry after configuring storage, email and calendar: verify the owner record, acknowledgment, free/busy conflict, confirmation invitation, and scheduled reminder IDs. These external operations have not been tested until credentials are configured. Memory chat rate limiting is per server instance; connect Redis for shared limits. Public endpoint origin checks are a browser safeguard, not authentication. Owner endpoints require the bearer token; cron requires its own secret. Do not log personal details or tokens. Database retention/deletion must be managed by the owner; there is no public lookup endpoint.

## Call Sheet and consented transcripts

A connected Resend/ChatGPT automation sends a daily Call Sheet at 21:00 America/New_York to the owner Gmail and chef inbox. The task reads only today’s Sobre Mesa concierge archive/inquiry emails, deduplicates snapshots and linked inquiries, and includes notes, follow-up actions and full available consented website transcripts. It excludes telephone calls and test records. Subject: Call Sheet — YYYY-MM-DD. An empty archive is reported as no archived records, not no visitors. Delivery to the chef inbox still depends on its receiving/forwarding setup.

Chat sharing is opt-in. Submitted planning requests explicitly consent to share the associated transcript. Archive updates go to the owner via Resend; if Redis is connected they are additionally stored for 30 days. If Redis is unavailable but email is connected, inquiry submission uses email and reports emailed rather than privately saved. Language-model responses perform no actions. Use npm run typecheck, npm test, and npm run check.
