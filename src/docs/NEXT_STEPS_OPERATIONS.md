# NEXT_STEPS_OPERATIONS (Jean Only)

All actions are in production: https://woodstock-technical-chatbot-full-fe.vercel.app/

1) Vercel auth bypass (Meta webhooks)
- Project → Settings → Authentication → Add Bypass
  - Path: /api/webhook/unified
  - Methods: GET, POST
- Test:
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/webhook/unified?hub.mode=subscribe&hub.verify_token=woodstock_verify_token_2024&hub.challenge=999" | cat
  - Expect: 999

2) Instagram OAuth connect (optional extra accounts)
- Open: https://woodstock-technical-chatbot-full-fe.vercel.app/oauth-instagram.html
- Complete Meta login and grant required scopes
- Verify accounts:
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/instagram/accounts" | jq

3) Inbox sanity
- Conversations merged count:
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations?limit=50" | jq '.data | length'
- Load a conversation (replace CID):
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations/CID/messages?limit=200&order=asc&tail=true" | jq '.data | {count: length, last: .[-1].message_content}'

4) Dedup preview + link (pick a CID from sidebar)
- Preview:
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations/CID/dedup-preview" | jq
- Link (example by email):
  - curl -s -X POST "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations/CID/link-contact" -H 'Content-Type: application/json' -d '{"identity_type":"email","identity_value":"user@example.com","full_name":"User Name"}' | jq
- Check link:
  - curl -s "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations/CID/contact" | jq

5) Profile enrich (optional)
- curl -s -X POST "https://woodstock-technical-chatbot-full-fe.vercel.app/api/inbox/conversations/CID/profile/enrich" | jq
- Hard refresh inbox UI; verify avatar/name.

6) Rural King campaign test
- Comment on IG with: "Loving these jeans! #RK5pocketJean @ruralkingdemo"
- Observe Vercel logs for auto-reply. If DM blocked by 24h rule, public reply instructs to DM "JEANS".

7) Confirm UI
- Open inbox: https://woodstock-technical-chatbot-full-fe.vercel.app/admin-inbox-v2.html
- Search for keyword you just used (e.g., AYPORDIOS) and click the conversation.

If any step fails, paste the exact curl output and I will fix immediately. 