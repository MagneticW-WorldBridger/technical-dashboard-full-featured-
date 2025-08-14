# 🔮 Woodstock Outlet Chatbot - Global To-Do List 🔮

This file tracks the high-level architectural and strategic initiatives for the Woodstock Outlet Chatbot platform.

---

## 🚀 **V3 Architecture: Multi-Tenant SaaS Platform**

This initiative outlines the transformation of the chatbot from a single-client application into a full-fledged, scalable, multi-tenant Software-as-a-Service (SaaS) platform.

### ✅ **Phase 1: Foundational Backend** `(Status: Pending)`

1.  **Database Schema for Multi-Tenancy**
    *   [ ] **Task**: Design and implement a new `client_integrations` table in PostgreSQL.
    *   [ ] **Purpose**: To securely store and manage connection details for multiple clients (e.g., Rural King, Woodstock Outlet).
    *   [ ] **Fields**: `client_name`, `facebook_page_id`, `encrypted_access_token`, `permissions_granted`, `token_expires_at`.
    *   [ ] **Security**: The `access_token` MUST be encrypted at rest. This is a critical step for security compliance (SOC 2, etc.).
    *   [ ] **File**: `scripts/create-multitenant-schema.sql`

2.  **Secure OAuth 2.0 Flow for Client Onboarding**
    *   [ ] **Task**: Build the server-side logic for a standard OAuth 2.0 authorization flow.
    *   [ ] **Purpose**: To allow new clients to securely grant our application access to their Facebook and Instagram pages without sharing credentials.
    *   [ ] **Endpoint 1 (`GET /api/auth/facebook/start`)**: Constructs the Facebook authorization URL and redirects the client.
    *   [ ] **Endpoint 2 (`GET /api/auth/facebook/callback`)**: Handles the callback from Facebook, exchanges the temporary `code` for a long-lived `access_token`, encrypts it, and stores it in the `client_integrations` table.

### ✅ **Phase 2: Intelligent Routing** `(Status: Pending)`

1.  **Refactor Webhooks to be Multi-Tenant**
    *   [ ] **Task**: Modify the existing Facebook webhook (`api/facebook-webhook.js`) to support multiple clients.
    *   [ ] **Logic**: Instead of using a single hardcoded `FACEBOOK_PAGE_ACCESS_TOKEN` from `.env`, the webhook will:
        1.  Extract the `page_id` from the incoming event payload.
        2.  Query the `client_integrations` table to find the corresponding client.
        3.  Decrypt and use the specific `access_token` for that client to process the request.
    *   [ ] **Benefit**: A single, intelligent webhook that can serve an unlimited number of clients.

### ✅ **Phase 3: Frontend Client Portal** `(Status: Pending)`

1.  **Client-Facing Connection UI**
    *   [ ] **Task**: Design and build a simple frontend page in the admin dashboard.
    *   [ ] **Purpose**: This page will contain a "Connect with Facebook" button that initiates the OAuth flow from Phase 1.
    *   [ ] **Feedback**: The UI should provide clear feedback to the client on the status of their connection.

---

*This document was last updated on August 07, 2025.*
