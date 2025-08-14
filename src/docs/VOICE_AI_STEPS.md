# Voice AI Steps (Twilio or Vapi)

## Twilio (Option A)
1) Buy number → webhook to `POST /voice/webhook`
2) Parse intents (hours, directions SMS, inventory check, warranty, order status)
3) For each call: persist transcript; upsert contact identity (phone)
4) If specialist transfer: warm transfer and log outcome

## Vapi (Option B)
1) Create assistant; set `serverUrl` to webhook
2) Map tools to existing endpoints (`/api/customer/*`, `/api/orders/*`)

## Data
- Link phone → `contacts` + `contact_identities`
- Store transcript as `conversation_messages`
