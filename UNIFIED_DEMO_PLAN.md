# Unified Demo Plan (Rural King) - Instagram + Webchat + SMS

## Priorities (per meetingaiprl.md)
- Unified experience over channel specifics.
- Demo a clear customer journey that spans IG → AI response → optional SMS follow-up.
- Prove campaign automation: hashtag + mention triggers.

## Target User Journey
1) Customer posts a comment or caption that includes both: `@ruralkingdemo` and `#RK5pocketJean`.
2) Our webhook receives the Instagram change event.
3) We auto-reply on the comment and attempt a DM to the author with a review link.
4) Customer DMs “JEANS”; AI replies and can hand off a link or coupon code.
5) Optionally, capture phone via DM and send SMS confirmation via Twilio.

## What’s Implemented Now
- IG DM handler with tool-calls and HTML sanitization (server.js → processInstagramMessage).
- IG change handler: auto-reply to comments matching campaign regex; DM mention author if IG user id is present (server.js → handleInstagramChanges).
- Comment reply helper in `services/instagram-api-service.js`.

## What to Test First (Production)
- Step A: DM test
  - Send a DM to `@ruralkingdemo`.
  - Expect: AI reply (plain text), conversation saved.
- Step B: Campaign tag test
  - Comment on any post: “Loving these jeans! #RK5pocketJean @ruralkingdemo”.
  - Expect: webhook change event, auto-reply to comment, attempt DM to author; if DM not possible, comment reply instructs to DM “JEANS”.

## Logs to Watch
- `/api/webhook/unified` entries with object=instagram.
- “🧩 Instagram change” entries and field=comments/mentions.
- “✅ Auto-replied to comment …” or “✅ Sent DM to mention author …”.

## Fast Follow (post-demo)
- Map our product cards/carousels to IG Generic Template and Quick Replies.
- Store per-brand campaign regex/response in DB.
- Add mention auto-DM fallback flows.
- Add SMS via Twilio (endpoint: `/api/notify/sms`) to confirm reward delivery.

## Rollback/Disable
- To disable campaign auto-replies quickly: comment out `handleInstagramChanges` routing or tighten regex.


