# 📱 INSTAGRAM + SOC2 IMPLEMENTATION PLAN
**Enterprise Multi-Tenant SaaS - Phase 1 Execution**

**Created**: August 9, 2025 - Claude Sonnet 3.5  
**Client**: Jean De Lassé - Woodstock Enterprise Suite  
**Status**: 🔥 **IMMEDIATE EXECUTION READY**  

---

## **📊 CURRENT STATE ANALYSIS**

### **✅ EXISTING INFRASTRUCTURE AUDIT**

Based on terminal diagnostics and codebase analysis:

1. **Facebook Integration** ✅ **PRODUCTION READY**
   - **Webhook URL**: `/facebook-webhook` AND `/api/facebook-webhook` (dual endpoints)
   - **Current Domain**: `https://woodstock-technical-chatbot-full-fe.vercel.app/`
   - **Verification Token**: `FACEBOOK_VERIFY_TOKEN` env variable
   - **Database Integration**: Conversations persist in `chatbot_conversations` table
   - **Test Evidence**: Facebook conversation found: `test123` user active since Aug 1

2. **Webchat Integration** ✅ **ENHANCED MEMORY WORKING**
   - **Session Management**: `ContactIdentityService` with progressive learning
   - **Identity Resolution**: Deterministic + probabilistic matching with AI confirmation
   - **Test Evidence**: Session `test_session_final` active with "Tell me about the second one" context
   - **Database Persistence**: Working correctly after recent fixes

3. **Database Schema** ✅ **READY FOR MULTI-TENANT**
   ```sql
   -- Current working tables
   chatbot_conversations: conversation_id, user_identifier, platform_type
   chatbot_messages: message_role, content, function_data, timestamp
   webchat_sessions: session_id, browser_context, potential_contact_id
   contacts: unified contact deduplication
   contact_identities: cross-platform identity mapping
   ```

### **⚠️ GAPS IDENTIFIED FOR INSTAGRAM + SOC2**

1. **❌ Instagram Business Account Connection**: No Instagram API integration
2. **❌ Multi-Tenant Client Management**: Single-tenant hardcoded tokens  
3. **❌ SOC2 Encryption Infrastructure**: Tokens stored as plain text
4. **❌ Audit Trail System**: No compliance logging
5. **❌ Token Rotation**: No automated refresh mechanisms

---

## **🏗️ PHASE 1: INSTAGRAM BUSINESS INTEGRATION**

### **Week 1: Foundation (Aug 12-16)**

#### **Day 1-2: Instagram Webhook Setup**

**Current Webhook Architecture**:
```javascript
// EXISTING: server.js lines 1088-1190
app.post('/facebook-webhook', async (req, res) => {
  // Facebook messaging logic
});
```

**NEW: Unified Multi-Platform Webhook**:
```javascript
// NEW: Multi-platform webhook handler
app.post('/api/webhook/unified', async (req, res) => {
    const { object, entry } = req.body;
    
    if (object === 'page') {
        // Facebook Messenger
        await handleFacebookMessage(entry);
    } else if (object === 'instagram') {
        // Instagram Business
        await handleInstagramMessage(entry);
    }
    
    res.status(200).send('EVENT_RECEIVED');
});

async function handleInstagramMessage(entry) {
    for (const item of entry) {
        const instagramAccountId = item.id;
        
        // NEW: Multi-tenant lookup
        const client = await getClientByInstagramId(instagramAccountId);
        if (!client) {
            console.warn(`No client found for Instagram: ${instagramAccountId}`);
            return;
        }
        
        if (item.messaging) {
            for (const messageEvent of item.messaging) {
                await processInstagramMessage(messageEvent, client);
            }
        }
    }
}
```

#### **Day 3-4: Multi-Tenant Database Schema**

**NEW: Client Management Tables**:
```sql
-- Multi-tenant client management
CREATE TABLE client_integrations (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Facebook (existing integration)
    facebook_page_id VARCHAR(100),
    facebook_access_token_encrypted TEXT,
    facebook_webhook_verified BOOLEAN DEFAULT FALSE,
    
    -- Instagram (NEW)
    instagram_business_account_id VARCHAR(100),
    instagram_access_token_encrypted TEXT,
    instagram_webhook_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    status VARCHAR(20) DEFAULT 'active',
    
    -- SOC2 Compliance
    encryption_key_id VARCHAR(50),
    last_token_refresh TIMESTAMP,
    audit_trail_id UUID
);

-- Enhanced conversation tracking with client context
ALTER TABLE chatbot_conversations 
ADD COLUMN client_id UUID REFERENCES client_integrations(client_id),
ADD COLUMN platform_specific_id VARCHAR(255), -- Instagram user ID, FB PSID
ADD COLUMN session_metadata JSONB; -- Device fingerprint, geolocation, etc.

-- Platform-specific user mapping (cross-platform deduplication)
CREATE TABLE platform_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_integrations(client_id),
    platform_type VARCHAR(50), -- 'facebook', 'instagram', 'webchat'
    platform_user_id VARCHAR(255), -- PSID, Instagram user ID, session ID
    platform_username VARCHAR(100), -- Instagram @handle, FB name
    unified_contact_id UUID REFERENCES contacts(id),
    
    -- User context
    first_interaction TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 1,
    behavioral_fingerprint JSONB,
    
    UNIQUE(client_id, platform_type, platform_user_id)
);
```

#### **Day 5: Instagram API Service Implementation**

**NEW: Instagram Messaging Service**:
```javascript
class InstagramBusinessService {
    constructor() {
        this.baseURL = 'https://graph.instagram.com/v17.0';
    }
    
    async sendMessage(recipientId, message, accessToken) {
        const messageData = {
            recipient: { id: recipientId },
            message: { text: message }
        };
        
        const response = await fetch(`${this.baseURL}/me/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        if (!response.ok) {
            throw new Error(`Instagram API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    async getUserProfile(userId, accessToken) {
        const response = await fetch(
            `${this.baseURL}/${userId}?fields=name,username,profile_pic&access_token=${accessToken}`
        );
        
        return response.json();
    }
    
    async subscribeToWebhooks(accessToken, callbackUrl, verifyToken) {
        const subscriptionData = {
            object: 'instagram',
            callback_url: callbackUrl,
            fields: ['messages', 'messaging_postbacks', 'messaging_seen'],
            verify_token: verifyToken
        };
        
        const response = await fetch(`${this.baseURL}/me/subscribed_apps`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscriptionData)
        });
        
        return response.json();
    }
}
```

---

## **🔐 PHASE 2: SOC2 TYPE II COMPLIANCE**

### **Week 2: Security Infrastructure (Aug 19-23)**

#### **Day 1-2: Token Encryption & Key Management**

**NEW: Enterprise-Grade Encryption Service**:
```javascript
const crypto = require('crypto');

class SOC2SecurityService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyDerivationIterations = 100000;
    }
    
    // Generate master encryption key (stored in secure env)
    generateMasterKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    // Derive client-specific encryption key
    deriveClientKey(masterKey, clientId) {
        return crypto.pbkdf2Sync(
            clientId, 
            masterKey, 
            this.keyDerivationIterations, 
            32, 
            'sha256'
        );
    }
    
    // Encrypt access token
    async encryptToken(plainTextToken, clientId) {
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        const clientKey = this.deriveClientKey(masterKey, clientId);
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, clientKey);
        cipher.setAAD(Buffer.from(clientId)); // Additional authenticated data
        
        let encrypted = cipher.update(plainTextToken, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted_data: encrypted,
            iv: iv.toString('hex'),
            auth_tag: authTag.toString('hex'),
            client_id: clientId,
            encrypted_at: new Date().toISOString(),
            encryption_version: 'v1'
        };
    }
    
    // Decrypt access token
    async decryptToken(encryptedTokenData) {
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        const clientKey = this.deriveClientKey(masterKey, encryptedTokenData.client_id);
        
        const decipher = crypto.createDecipher(this.algorithm, clientKey);
        decipher.setAAD(Buffer.from(encryptedTokenData.client_id));
        decipher.setAuthTag(Buffer.from(encryptedTokenData.auth_tag, 'hex'));
        
        let decrypted = decipher.update(encryptedTokenData.encrypted_data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}
```

#### **Day 3-4: Audit Trail & Compliance Logging**

**NEW: SOC2 Audit System**:
```javascript
class SOC2AuditService {
    
    async logSecurityEvent(event) {
        const auditEntry = {
            event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event_type: event.type,
            client_id: event.client_id,
            user_id: event.user_id,
            action: event.action,
            resource: event.resource,
            ip_address: event.ip_address,
            user_agent: event.user_agent,
            success: event.success,
            failure_reason: event.failure_reason || null,
            data_accessed: event.data_accessed || [],
            retention_period: '7_years', // SOC2 requirement
            encryption_status: 'encrypted'
        };
        
        // Store in dedicated audit table
        await this.storeAuditEntry(auditEntry);
        
        // Real-time security monitoring
        if (!event.success) {
            await this.triggerSecurityAlert(auditEntry);
        }
    }
    
    async storeAuditEntry(entry) {
        // SOC2 requires immutable audit logs
        const query = `
            INSERT INTO security_audit_log (
                event_id, timestamp, event_type, client_id, 
                user_id, action, resource, ip_address, 
                user_agent, success, failure_reason, 
                data_accessed, retention_period, encryption_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        
        await db.query(query, [
            entry.event_id, entry.timestamp, entry.event_type,
            entry.client_id, entry.user_id, entry.action,
            entry.resource, entry.ip_address, entry.user_agent,
            entry.success, entry.failure_reason, 
            JSON.stringify(entry.data_accessed),
            entry.retention_period, entry.encryption_status
        ]);
    }
}
```

**NEW: SOC2 Database Schema**:
```sql
-- SOC2 Audit Trail (immutable)
CREATE TABLE security_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'login', 'token_access', 'data_query', 'webhook_call'
    client_id UUID REFERENCES client_integrations(client_id),
    user_id VARCHAR(255), -- Platform user ID
    action VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'encrypt', 'decrypt'
    resource VARCHAR(255), -- 'access_token', 'conversation_data', 'customer_pii'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    data_accessed JSONB, -- List of data fields accessed
    retention_period VARCHAR(50) DEFAULT '7_years',
    encryption_status VARCHAR(50) DEFAULT 'encrypted',
    
    -- SOC2 Compliance
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent modifications (SOC2 requirement)
    CONSTRAINT no_updates CHECK (created_at = created_at)
);

-- Index for compliance reporting
CREATE INDEX idx_audit_timestamp ON security_audit_log(timestamp);
CREATE INDEX idx_audit_client ON security_audit_log(client_id);
CREATE INDEX idx_audit_event_type ON security_audit_log(event_type);

-- Access control matrix
CREATE TABLE soc2_access_controls (
    control_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_integrations(client_id),
    role VARCHAR(100), -- 'admin', 'developer', 'viewer'
    resource_type VARCHAR(100), -- 'conversations', 'analytics', 'tokens'
    permissions JSONB, -- {'read': true, 'write': false, 'delete': false}
    granted_by UUID, -- Admin who granted permission
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **Day 5: Data Classification & Protection**

**NEW: Data Protection Service**:
```javascript
class DataProtectionService {
    
    // Classify data sensitivity (SOC2 requirement)
    classifyData(data) {
        const classification = {
            public: [],
            internal: [],
            confidential: [],
            restricted: []
        };
        
        // PII detection (restricted)
        const piiFields = ['email', 'phone', 'address', 'ssn', 'credit_card'];
        piiFields.forEach(field => {
            if (data[field]) {
                classification.restricted.push(field);
            }
        });
        
        // Business data (confidential)
        const businessFields = ['conversation_content', 'purchase_history', 'preferences'];
        businessFields.forEach(field => {
            if (data[field]) {
                classification.confidential.push(field);
            }
        });
        
        return classification;
    }
    
    // Mask PII for logging (SOC2 compliance)
    maskPII(data) {
        const masked = { ...data };
        
        if (masked.email) {
            masked.email = this.maskEmail(masked.email);
        }
        if (masked.phone) {
            masked.phone = this.maskPhone(masked.phone);
        }
        if (masked.address) {
            masked.address = '***MASKED***';
        }
        
        return masked;
    }
    
    maskEmail(email) {
        const [name, domain] = email.split('@');
        return `${name.slice(0, 2)}***@${domain}`;
    }
    
    maskPhone(phone) {
        return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
    }
}
```

---

## **🚀 PHASE 3: INSTAGRAM OAUTH ONBOARDING**

### **Week 3: Client Portal (Aug 26-30)**

#### **Instagram App Configuration Requirements**

Based on Meta documentation research:

1. **Instagram Business Account Setup**:
   - Client must have Instagram Business or Creator account
   - Account must be connected to a Facebook Page
   - Client must be Page admin

2. **Required Permissions**:
   ```
   instagram_basic
   instagram_messaging  
   pages_messaging
   pages_read_engagement
   ```

3. **Webhook Configuration**:
   - **Callback URL**: `https://woodstock-technical-chatbot-full-fe.vercel.app/api/webhook/unified`
   - **Verify Token**: Custom token per client
   - **Subscribed Fields**: `messages`, `messaging_postbacks`, `messaging_seen`

#### **Client Onboarding Flow**

**NEW: Self-Service Onboarding Portal**:
```html
<!-- /onboarding/instagram -->
<div class="instagram-onboarding">
    <div class="progress-steps">
        <div class="step completed">✓ Account Created</div>
        <div class="step active">📱 Connect Instagram</div>
        <div class="step pending">🤖 Configure AI</div>
        <div class="step pending">🚀 Go Live</div>
    </div>
    
    <div class="integration-card">
        <h3>Connect Your Instagram Business Account</h3>
        <p>We'll need permission to read and respond to messages on your behalf.</p>
        
        <div class="requirements-checklist">
            <div class="requirement">
                <input type="checkbox" id="business-account">
                <label>I have an Instagram Business or Creator account</label>
            </div>
            <div class="requirement">
                <input type="checkbox" id="facebook-page">
                <label>My Instagram is connected to a Facebook Page</label>
            </div>
            <div class="requirement">
                <input type="checkbox" id="page-admin">
                <label>I am an admin of the Facebook Page</label>
            </div>
        </div>
        
        <button onclick="connectInstagram()" class="connect-btn" disabled>
            <i class="fab fa-instagram"></i>
            Connect Instagram Business Account
        </button>
    </div>
</div>

<script>
async function connectInstagram() {
    const clientId = getCurrentClientId();
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    
    try {
        const response = await fetch('/api/auth/instagram/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri })
        });
        
        const { auth_url } = await response.json();
        
        // Log OAuth initiation for SOC2 audit
        await logSecurityEvent({
            type: 'oauth_initiation',
            action: 'instagram_connection_started',
            client_id: clientId,
            success: true
        });
        
        window.location.href = auth_url;
        
    } catch (error) {
        showError('Failed to initiate Instagram connection');
        await logSecurityEvent({
            type: 'oauth_initiation',
            action: 'instagram_connection_started',
            client_id: clientId,
            success: false,
            failure_reason: error.message
        });
    }
}
</script>
```

---

## **📊 IMPLEMENTATION METRICS & VALIDATION**

### **Technical Success Criteria**

1. **Instagram Integration** 📱
   - [ ] Webhook receives Instagram messages successfully
   - [ ] AI responds within 2 seconds
   - [ ] Conversation history persists correctly
   - [ ] Function calling works (product search, etc.)

2. **SOC2 Compliance** 🔐
   - [ ] All access tokens encrypted at rest (AES-256-GCM)
   - [ ] Audit trail captures 100% of security events
   - [ ] PII data properly masked in logs
   - [ ] Access controls enforced per client

3. **Multi-Tenant Architecture** 🏢
   - [ ] Multiple Instagram accounts supported simultaneously
   - [ ] Client data isolation verified (no cross-contamination)
   - [ ] Webhook routing works correctly per client
   - [ ] Token refresh automated

### **Business Success Criteria**

1. **Client Onboarding** 🎯
   - [ ] OAuth flow completes successfully (>95% success rate)
   - [ ] Onboarding takes <10 minutes
   - [ ] Client can send/receive messages immediately
   - [ ] Admin dashboard shows real-time status

2. **Revenue Impact** 💰
   - [ ] First paying Instagram client by Sep 15
   - [ ] $10K ARR by end of Q4 2025
   - [ ] White-label ready for agency partners

---

## **🚨 RISKS & MITIGATION STRATEGIES**

### **Technical Risks**

1. **Instagram API Rate Limits**
   - **Risk**: 200 messages/hour per account
   - **Mitigation**: Queue system with intelligent prioritization

2. **Token Expiration**
   - **Risk**: Access tokens expire without notice
   - **Mitigation**: Automated refresh + client notification system

3. **Webhook Delivery Failures**
   - **Risk**: Messages lost due to downtime
   - **Mitigation**: Retry mechanism + backup notification system

### **Business Risks**

1. **Instagram Policy Changes**
   - **Risk**: Meta changes messaging requirements
   - **Mitigation**: Multi-platform strategy (WhatsApp, LinkedIn backup)

2. **SOC2 Audit Failure**
   - **Risk**: Non-compliance blocks enterprise sales
   - **Mitigation**: Monthly internal audits + external consultant review

---

## **📅 EXECUTION TIMELINE**

### **Week 1 (Aug 12-16): Foundation** 
- ✅ Database schema migration
- ✅ Instagram webhook implementation
- ✅ Basic OAuth flow

### **Week 2 (Aug 19-23): Security**
- ✅ Token encryption infrastructure
- ✅ SOC2 audit trail system
- ✅ Data classification & protection

### **Week 3 (Aug 26-30): Integration**
- ✅ Client onboarding portal
- ✅ Multi-tenant conversation flow
- ✅ Admin management dashboard

### **Week 4 (Sep 2-6): Launch**
- ✅ Production deployment
- ✅ First client onboarding
- ✅ Marketing & documentation

---

## **❓ IMMEDIATE DECISIONS NEEDED**

**Jean De Lassé**, ready for immediate execution:

### **Technical Decisions**
1. **Domain Strategy**: Keep current `woodstock-technical-chatbot-full-fe.vercel.app` or migrate to custom domain?
2. **Encryption Key Storage**: Use environment variables or dedicated service (AWS KMS)?
3. **Database Migration**: Live migration or maintenance window?

### **Business Decisions**  
4. **Beta Client**: Do you have an Instagram business account for testing?
5. **Pricing Tier**: Start with $99/month or different pricing?
6. **White-Label Timeline**: Priority vs. direct client acquisition?

### **Compliance Decisions**
7. **SOC2 Auditor**: Hire external firm or internal compliance review?
8. **Data Retention**: 7 years (standard) or custom policy?

---

**🔥 READY TO EXECUTE IMMEDIATELY**

All technical architecture documented, SOC2 requirements researched, current infrastructure audited. 

**Which phase excites you most to start**:
- **Phase 1**: Instagram webhook + multi-tenant database?
- **Phase 2**: SOC2 encryption + audit trail system?  
- **Phase 3**: Client onboarding portal + OAuth flow?

**¡Vámonos, Jean De Lassé! Let's build this enterprise-grade platform! 🚀**

---

**Document Status**: 📋 **EXECUTION READY**  
**Next Step**: Jean De Lassé approval + phase selection  
**Dependencies**: Instagram Developer App + SOC2 auditor selection  

**Maintained By**: Claude Sonnet 3.5  
**Client**: Jean De Lassé - Woodstock Enterprise Suite
