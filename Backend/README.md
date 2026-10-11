# Booking Demo Class — Backend

Node.js / Express / MongoDB API for the Booking Demo Class project.

## Meeting links (Jitsi Meet)

When a booking is confirmed, the backend generates a unique, non-guessable
room name and saves the full meeting URL on the booking (`meetingLink`) in
MongoDB. The same URL is returned to the frontend and embedded in the parent
and mentor notification emails.

- The room URL is built as `${JITSI_BASE_URL}/BookingDemoClass-<token>`,
  where `<token>` is 32 random bytes (64 hex characters, ~256 bits of entropy).
- `JITSI_BASE_URL` defaults to the public service `https://meet.jit.si`. Set it
  in `.env` to use your own Jitsi deployment instead.
- Room creation is idempotent: confirming the same booking again (or opening
  the link) reuses the existing saved URL and never creates a new room.

### Migrating existing bookings

Bookings created before the Jitsi rollout may still hold a dummy link such as
`http://localhost:8000/demo-class/<token>`. Run the idempotent migration to
rewrite them to the real Jitsi URL (reusing the existing token, so the room
identity is preserved):

```bash
npm run migrate:meetings
# preview only:
node -r dotenv/config src/scripts/migrateMeetingLinks.js --dry-run
```

Re-confirming a booking also upgrades its legacy link in place. Any link that is
missing or is not a URL on the configured Jitsi deployment is treated as invalid
and is never returned as a usable meeting link.

### Privacy caveat

Public Jitsi rooms are **not private or access-controlled by default**. Anyone
who knows or guesses the room name can join. The generated room name is random
and non-guessable and should be treated as a secret, but it is not an
authentication mechanism. For confidential meetings, self-host Jitsi and/or
enable authentication, then point `JITSI_BASE_URL` at that deployment.

### Email delivery caveat

Email delivery is simulated by default (`SMTP_TRANSPORT=json`) and no real
emails are sent locally. The notification records report delivery status, but
real inbox delivery is only verified once valid SMTP credentials are configured
and a real SMTP server is used.
