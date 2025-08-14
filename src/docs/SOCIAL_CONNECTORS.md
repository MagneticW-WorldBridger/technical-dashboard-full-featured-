# Social Connectors (Facebook/IG)

## Webhook
- Verify GET `/facebook-webhook` (or `/api/facebook-webhook`)
- Receive messages on POST; append to conversation history; respond via Graph API

## Storage
- Key by senderId + platform `facebook`; persist in `conversations` + `conversation_messages`

## Identity
- When user provides email/phone, add to `contact_identities` for unified memory
