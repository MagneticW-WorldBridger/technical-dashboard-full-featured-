# Rural King Demo Plan (3 days)

## Goals
- Unified memory across chat/text/voice/social
- Search-triggered chat from URL
- Voice flows: store info/inventory + call center (warranty/order status)
- Inbox shows real conversations

## Day 1
- Implement search→chat trigger in widget (URL param `searchTerm`)
- Seed 5 SKUs (one OOS with alternative)
- Ensure Inbox pulls live rows (seed if empty)

## Day 2
- Voice: store/call-center intents; webhook persist transcript; link phone identity
- Unified memory bridge chat↔voice by phone/email identity
- QA pass and fixes

## Day 3
- Full rehearsal with script
- Capture short backup video
- Add toggles/fallback content

## Testing
- `curl http://localhost:3000/api/inbox/conversations?limit=5`
- Place two voice calls → verify messages/transcripts stored
- Navigate to site with `?searchTerm=bird%20feed` → chat auto-engages
