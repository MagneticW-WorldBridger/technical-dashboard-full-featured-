# Architecture Overview (Execution)

## Data Layer
- PostgreSQL: tenants, contacts, contact_identities, conversations, messages, pipelines
- Redis/Upstash: conversation cache
- External: GoHighLevel (CRM), Magento/Loft (catalog)

## Services
- Express (`server.js`): API, chat stream, inbox endpoints, static files
- FunctionCalling (`services/function-calling.js`): Magento/Loft + composites
- DatabaseService (`services/database-service.js`): tokens, categories, inbox queries

## Proposed Tables
- `contacts(id, tenant_id, primary_identity_type, primary_identity_value, full_name, normalized_name, confidence_score, ghl_contact_id, created_at)`
- `contact_identities(id, contact_id, tenant_id, identity_type, identity_value, source, confidence, verified, first_seen, last_used)`
- `conversations(id, tenant_id, contact_id, channel_type, status, priority, assigned_to, created_at)`
- `conversation_messages(id, conversation_id, tenant_id, sender_type, content, metadata_json, ai_function_calls_json, created_at)`

## Flows
1. Webchat → intent → functions → HTML → persist message
2. Inbox → list conversations → fetch messages → render
3. Search trigger → detect `searchTerm` → auto-open chat with context
4. Voice (Twilio/Vapi) → webhook → transcript → link phone identity → memory

## Tenancy (v1)
- Operar single-tenant; preparar `tenant_id` para multi-tenant

## Security
- Dev: bypass auth en inbox
- Prod: JWT + RBAC + rate limit + audit

