# Search Trigger → Chat Integration

## Behavior
- If landing URL has `?searchTerm=...`, auto-open chat and send initial user message with that term.

## Steps (Widget)
- On widget init, parse `new URLSearchParams(window.location.search).get('searchTerm')`
- If present: open chat UI; POST `/api/chat` with history including the term
- Render AI response into chat stream

## Notes
- Sanitize/trim term; cap at ~120 chars
- Log term for analytics
