# QA Tests (CLI-first)

## Health
- `curl -s http://localhost:3000/health | jq .status` → `healthy`

## Inbox
- `curl -s "http://localhost:3000/api/inbox/conversations?limit=3" | jq '.status,.data|length'`
- If 0 → seed via `/api/chat` with a short history

## Chat
- `curl -s -N -H 'Content-Type: application/json' -d '{"history":[{"role":"user","content":"hello"}]}' http://localhost:3000/api/chat | head -c 200`

## Functions
- `curl -s http://localhost:3000/api/functions | jq '.total'`

## Facebook Webhook (dev)
- `curl -s "http://localhost:3000/api/facebook-webhook?hub.mode=subscribe&hub.verify_token=woodstock_verify_token_2024&hub.challenge=123"`
