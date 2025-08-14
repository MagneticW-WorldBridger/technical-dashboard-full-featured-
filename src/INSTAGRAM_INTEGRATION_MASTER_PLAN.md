# 📱 INSTAGRAM INTEGRATION - MASTER PLAN
**Enterprise Multi-Tenant SaaS Implementation**

**Created**: August 9, 2025 - Claude Sonnet 3.5  
**Client**: Jean De Lassé - Woodstock Enterprise Suite  
**Scope**: Production-grade Instagram campaign integration for billion-dollar scale  

---

## **🎯 EXECUTIVE SUMMARY**

**Vision**: Transform the Woodstock Enterprise Suite from single-tenant Facebook integration to a **multi-tenant SaaS platform** supporting unlimited Instagram business accounts through secure OAuth 2.0 flows.

**Business Impact**: 
- **Revenue Multiplication**: Each new client = recurring SaaS revenue
- **Market Expansion**: Instagram's 2+ billion users accessible
- **Competitive Advantage**: Done-for-you AI automation across platforms

---

## **📋 CURRENT STATUS ASSESSMENT**

### **✅ EXISTING INFRASTRUCTURE (Production Ready)**

1. **Facebook Messenger Integration** ✅
   - Single-tenant webhook (`/facebook-webhook`)
   - Hardcoded `FACEBOOK_PAGE_ACCESS_TOKEN`
   - Conversation persistence working
   - AI function calling operational

2. **Database Architecture** ✅
   - PostgreSQL + Redis hybrid storage
   - `chatbot_conversations` + `chatbot_messages` tables
   - 24 business functions operational
   - Contact identity deduplication system

3. **AI Engine** ✅
   - OpenAI GPT-4 with function calling
   - Enhanced memory system with progressive learning
   - Cross-platform conversation continuity
   - Anti-hallucination merge logic

### **⚠️ GAPS FOR MULTI-TENANT INSTAGRAM**

1. **❌ Multi-tenant database schema**
2. **❌ OAuth 2.0 client onboarding flow**  
3. **❌ Instagram API integration**
4. **❌ Encrypted token storage & rotation**
5. **❌ Dynamic webhook routing per client**

### **📱 CRITICAL: Instagram Messaging API Access (2024)**

**IMPORTANT**: To enable Instagram API messaging access, the Instagram business account must enable:

**Path**: `Instagram App → SETTINGS → MESSAGES AND STORY REPLIES → MESSAGE REQUESTS → CONNECTED TOOLS → ALLOW ACCESS TO MESSAGES`

**Note**: The old "Connected Tools" toggle documentation is deprecated. This is the current 2024 path.

---

## **🏗️ TECHNICAL ARCHITECTURE PLAN**

### **Phase 1: Multi-Tenant Foundation (Week 1)**

#### **1.1 Database Schema Evolution**
```sql
-- NEW: Client management table
CREATE TABLE client_integrations (
    client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    
    -- Facebook Integration
    facebook_page_id VARCHAR(100),
    facebook_access_token_encrypted TEXT,
    facebook_permissions_granted JSONB,
    facebook_token_expires_at TIMESTAMP,
    
    -- Instagram Integration (NEW)
    instagram_business_account_id VARCHAR(100),
    instagram_access_token_encrypted TEXT,
    instagram_permissions_granted JSONB,
    instagram_webhook_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    
    -- Security
    encryption_key_id VARCHAR(50),
    last_token_refresh TIMESTAMP
);

-- Enhanced conversations with client context
ALTER TABLE chatbot_conversations 
ADD COLUMN client_id UUID REFERENCES client_integrations(client_id),
ADD COLUMN platform_specific_id VARCHAR(255); -- Instagram user ID, Facebook PSID, etc.

-- NEW: Platform-specific user mapping
CREATE TABLE platform_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES client_integrations(client_id),
    platform_type VARCHAR(50), -- 'facebook', 'instagram', 'webchat'
    platform_user_id VARCHAR(255), -- PSID, Instagram user ID
    platform_username VARCHAR(100), -- Instagram @handle
    unified_contact_id UUID, -- Links to contact deduplication system
    
    -- User context
    first_interaction TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 1,
    
    UNIQUE(client_id, platform_type, platform_user_id)
);
```

#### **1.2 OAuth 2.0 Implementation**
```javascript
// NEW: Multi-platform OAuth service
class MultiPlatformOAuthService {
    
    // Instagram OAuth Flow
    async initiateInstagramOAuth(clientId, redirectUri) {
        const scopes = [
            'instagram_basic',
            'instagram_messaging', 
            'pages_messaging',
            'pages_read_engagement'
        ];
        
        const authUrl = `https://api.instagram.com/oauth/authorize?` +
            `client_id=${process.env.INSTAGRAM_APP_ID}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${scopes.join(',')}&` +
            `response_type=code&` +
            `state=${clientId}`;
            
        return authUrl;
    }
    
    async handleInstagramCallback(code, state) {
        // Exchange code for access token
        const tokenResponse = await this.exchangeCodeForToken(code);
        
        // Get Instagram business account info
        const accountInfo = await this.getInstagramBusinessAccount(tokenResponse.access_token);
        
        // Encrypt and store token
        const encryptedToken = await this.encryptToken(tokenResponse.access_token);
        
        // Store in client_integrations table
        await this.storeClientIntegration(state, {
            instagram_business_account_id: accountInfo.id,
            instagram_access_token_encrypted: encryptedToken,
            instagram_permissions_granted: tokenResponse.permissions,
            instagram_token_expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000)
        });
        
        return { success: true, client_id: state };
    }
}
```

### **Phase 2: Instagram API Integration (Week 2)**

#### **2.1 Instagram Webhook Implementation**
```javascript
// NEW: Unified webhook handler
app.post('/api/webhook/instagram', async (req, res) => {
    const { object, entry } = req.body;
    
    if (object === 'instagram') {
        for (const item of entry) {
            const pageId = item.id; // Instagram business account ID
            
            // NEW: Multi-tenant lookup
            const client = await getClientByInstagramId(pageId);
            if (!client) {
                console.warn(`No client found for Instagram account: ${pageId}`);
                continue;
            }
            
            // Process messaging events
            if (item.messaging) {
                for (const messageEvent of item.messaging) {
                    await processInstagramMessage(messageEvent, client);
                }
            }
        }
    }
    
    res.status(200).send('EVENT_RECEIVED');
});

async function processInstagramMessage(messageEvent, client) {
    const senderId = messageEvent.sender.id;
    const message = messageEvent.message?.text || '';
    
    // Get or create platform user
    const platformUser = await getOrCreatePlatformUser(
        client.client_id,
        'instagram', 
        senderId
    );
    
    // Get conversation history with client context
    const conversationHistory = await getConversationHistory(
        platformUser.user_id,
        'instagram',
        client.client_id
    );
    
    // Process with AI (existing logic enhanced with client context)
    const aiResponse = await processWithAI(conversationHistory, message, client);
    
    // Send response via Instagram API
    await sendInstagramMessage(senderId, aiResponse, client.instagram_access_token_encrypted);
}
```

#### **2.2 Instagram Messaging API**
```javascript
class InstagramMessagingService {
    
    async sendMessage(recipientId, message, encryptedAccessToken) {
        const accessToken = await this.decryptToken(encryptedAccessToken);
        
        const messageData = {
            recipient: { id: recipientId },
            message: { text: message }
        };
        
        const response = await fetch(
            `https://graph.instagram.com/v17.0/me/messages?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            }
        );
        
        return response.json();
    }
    
    async getUserProfile(userId, encryptedAccessToken) {
        const accessToken = await this.decryptToken(encryptedAccessToken);
        
        const response = await fetch(
            `https://graph.instagram.com/v17.0/${userId}?fields=name,username,profile_pic&access_token=${accessToken}`
        );
        
        return response.json();
    }
}
```

### **Phase 3: Client Onboarding Portal (Week 3)**

#### **3.1 Self-Service Onboarding UI**
```html
<!-- NEW: Client onboarding page -->
<div class="onboarding-portal">
    <h1>Connect Your Instagram Business Account</h1>
    
    <div class="integration-steps">
        <div class="step completed">
            <h3>1. Account Setup</h3>
            <p>Create your Woodstock AI account</p>
        </div>
        
        <div class="step active">
            <h3>2. Instagram Connection</h3>
            <button onclick="connectInstagram()" class="connect-btn">
                <i class="fab fa-instagram"></i>
                Connect Instagram Business Account
            </button>
            <p class="permissions-note">
                We'll need permission to read and respond to messages
            </p>
        </div>
        
        <div class="step pending">
            <h3>3. AI Configuration</h3>
            <p>Customize your AI assistant's personality and responses</p>
        </div>
    </div>
</div>

<script>
async function connectInstagram() {
    try {
        const response = await fetch('/api/auth/instagram/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                client_id: getCurrentClientId(),
                redirect_uri: `${window.location.origin}/auth/instagram/callback`
            })
        });
        
        const { auth_url } = await response.json();
        window.location.href = auth_url;
        
    } catch (error) {
        showError('Failed to initiate Instagram connection');
    }
}
</script>
```

#### **3.2 OAuth Callback Handler**
```javascript
// NEW: OAuth callback handling
app.get('/auth/instagram/callback', async (req, res) => {
    const { code, state: clientId, error } = req.query;
    
    if (error) {
        return res.redirect(`/onboarding?error=${encodeURIComponent(error)}`);
    }
    
    try {
        const oauthService = new MultiPlatformOAuthService();
        const result = await oauthService.handleInstagramCallback(code, clientId);
        
        if (result.success) {
            // Redirect to success page with setup completion
            res.redirect(`/onboarding/success?platform=instagram&client_id=${clientId}`);
        } else {
            res.redirect(`/onboarding?error=integration_failed`);
        }
        
    } catch (error) {
        console.error('Instagram OAuth callback error:', error);
        res.redirect(`/onboarding?error=server_error`);
    }
});
```

---

## **🔐 SECURITY & COMPLIANCE REQUIREMENTS**

### **Token Encryption Strategy**
```javascript
class SecurityService {
    
    // AES-256-GCM encryption for access tokens
    async encryptToken(plainTextToken) {
        const key = await this.getOrCreateEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);
        
        let encrypted = cipher.update(plainTextToken, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted_data: encrypted,
            iv: iv.toString('hex'),
            auth_tag: authTag.toString('hex'),
            encryption_version: 'v1'
        };
    }
    
    async decryptToken(encryptedTokenData) {
        const key = await this.getEncryptionKey(encryptedTokenData.key_id);
        const decipher = crypto.createDecipher('aes-256-gcm', key);
        
        decipher.setAuthTag(Buffer.from(encryptedTokenData.auth_tag, 'hex'));
        
        let decrypted = decipher.update(encryptedTokenData.encrypted_data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
}
```

### **SOC 2 Compliance Features**
- **Audit Logging**: All client interactions logged
- **Access Controls**: Role-based permissions per client
- **Data Isolation**: Client data never cross-contaminated
- **Token Rotation**: Automatic token refresh before expiry
- **Encryption at Rest**: All sensitive data encrypted
- **Secure Transmission**: HTTPS/TLS 1.3 only

---

## **📊 BUSINESS MODEL INTEGRATION**

### **Subscription Tiers**
```javascript
const SUBSCRIPTION_TIERS = {
    starter: {
        monthly_price: 99,
        message_limit: 1000,
        platforms: ['instagram'],
        ai_functions: ['basic_chat', 'product_search'],
        support: 'email'
    },
    
    professional: {
        monthly_price: 299,
        message_limit: 10000,
        platforms: ['instagram', 'facebook', 'webchat'],
        ai_functions: ['full_suite'],
        support: 'priority_email',
        custom_branding: true
    },
    
    enterprise: {
        monthly_price: 899,
        message_limit: 'unlimited',
        platforms: ['all'],
        ai_functions: ['full_suite', 'custom_functions'],
        support: 'dedicated_success_manager',
        custom_branding: true,
        white_label: true,
        sla: '99.9%'
    }
};
```

### **Revenue Projections**
- **Year 1**: 50 clients × $299/month = $179,400 ARR
- **Year 2**: 200 clients × $450/month (mix) = $1,080,000 ARR  
- **Year 3**: 500 clients × $500/month (mix) = $3,000,000 ARR

---

## **🚀 IMPLEMENTATION TIMELINE**

### **Week 1: Foundation** (Aug 12-16)
- **Day 1-2**: Database schema migration + OAuth service
- **Day 3-4**: Instagram API integration + webhook handling
- **Day 5**: Security implementation + token encryption

### **Week 2: Integration** (Aug 19-23)
- **Day 1-2**: Multi-tenant conversation flow
- **Day 3-4**: Client onboarding portal UI
- **Day 5**: Testing + debugging

### **Week 3: Polish** (Aug 26-30)
- **Day 1-2**: Admin dashboard for client management
- **Day 3-4**: Documentation + deployment
- **Day 5**: Beta testing with first clients

### **Week 4: Launch** (Sep 2-6)
- **Day 1-2**: Production deployment + monitoring
- **Day 3-5**: Marketing launch + client acquisition

---

## **❓ QUESTIONS FOR JEAN DE LASSÉ**

### **Technical Decisions**
1. **Instagram App Registration**: Do you have Instagram Developer account, or should I guide through setup?
2. **Encryption Key Management**: AWS KMS, HashiCorp Vault, or custom implementation?
3. **Webhook URL**: What domain will host the production webhooks?
4. **Database Migration**: Live migration strategy for existing Facebook data?

### **Business Decisions** 
5. **Pricing Strategy**: Start with freemium model or paid-only?
6. **Beta Clients**: Do you have initial clients lined up for testing?
7. **White-Label**: Priority for agency reseller features?
8. **Geographic Scope**: US-only initially or international from day 1?

### **Integration Priorities**
9. **Platform Order**: Instagram first, then expand to WhatsApp/LinkedIn?
10. **AI Customization**: Per-client personality/knowledge customization needed?
11. **Analytics Dashboard**: Real-time client analytics priority level?
12. **Support Structure**: In-app support chat vs. traditional ticketing?

---

## **📈 SUCCESS METRICS**

### **Technical KPIs**
- **OAuth Success Rate**: >95% successful connections
- **Message Delivery**: <2 second response time
- **Uptime**: 99.9% availability SLA
- **Token Refresh**: 100% automated, zero manual intervention

### **Business KPIs**
- **Client Acquisition**: 10 new clients/month by Month 3
- **Revenue Growth**: $100K ARR by end of Year 1
- **Client Retention**: >90% monthly retention rate
- **Support Tickets**: <5% of clients create support tickets monthly

---

**Document Status**: 📋 **READY FOR EXECUTION**  
**Next Step**: Jean De Lassé review + technical decisions  
**Implementation Start**: Upon approval  

**Maintained By**: Claude Sonnet 3.5  
**Client**: Jean De Lassé - Woodstock Enterprise Suite
