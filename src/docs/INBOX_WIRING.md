# Inbox Wiring (No Marketing)

## Serve via HTTP (not file://)
1) Run server: `npm start` → `http://localhost:3000`
2) Open: `http://localhost:3000/admin-inbox-v2.html`

## API (from server.js)
- GET `/api/inbox/conversations?platform=webchat&limit=25`
- GET `/api/inbox/conversations/:id/messages?limit=200`

## Client Config (in HTML)
- `DataLoader.apiBase = 'http://localhost:3000'`
- Graceful fallback to demo if API fails or returns empty

## Seed if empty
- Hit `POST /api/chat` with a short history to generate messages
- Or insert rows into conversation tables (see Architecture doc)

## Troubleshooting
- If styles/scripts blocked: Helmet CSP may block CDNs → run from localhost or temporarily relax CSP in dev
- CORS: ensure you use `http://localhost:3000` (never `file://`)
