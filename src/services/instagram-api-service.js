const db = require('../config/database');

class InstagramBusinessService {
    constructor() {
        this.baseURL = 'https://graph.instagram.com/v18.0';
        this.facebookGraphURL = 'https://graph.facebook.com/v18.0';
        this.fetch = null; // Will be loaded dynamically
    }

    // Dynamic import for node-fetch (ESM module)
    async getFetch() {
        if (!this.fetch) {
            const fetchModule = await import('node-fetch');
            this.fetch = fetchModule.default;
        }
        return this.fetch;
    }

    // =====================================================
    // INSTAGRAM MESSAGING API
    // =====================================================

    /**
     * Send a message to an Instagram user
     * @param {string} recipientId - Instagram scoped user ID (IGSID)
     * @param {string} message - Message text to send
     * @param {string} accessToken - Page access token with Instagram messaging permissions
     * @returns {Object} Instagram API response
     */
    async sendMessage(recipientId, message, accessToken) {
        const messageData = {
            recipient: { id: recipientId },
            message: { text: message }
        };

        console.log(`📱 Sending Instagram message to ${recipientId}`);

        const fetch = await this.getFetch();

        // Preferred: Messenger Platform via facebookGraphURL
        const tryFacebookGraph = async () => {
            const resp = await fetch(`${this.facebookGraphURL}/me/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            if (!resp.ok) {
                const errorBody = await resp.text();
                throw new Error(`Instagram API error ${resp.status}: ${errorBody}`);
            }
            return resp.json();
        };

        // Fallback: legacy graph.instagram.com (some IG Business Login flows)
        const tryInstagramGraph = async () => {
            const resp = await fetch(`${this.baseURL}/me/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            if (!resp.ok) {
                const errorBody = await resp.text();
                throw new Error(`Instagram API fallback error ${resp.status}: ${errorBody}`);
            }
            return resp.json();
        };

        try {
            // Try Facebook Graph first
            const result = await tryFacebookGraph();
            console.log(`✅ Instagram message sent successfully (facebookGraph):`, result);
            return result;
        } catch (e1) {
            const tokenLooksIGUser = (accessToken || '').startsWith('IGAA');
            console.warn(`⚠️ Primary send failed: ${e1.message}`);
            if (tokenLooksIGUser) {
                try {
                    const result2 = await tryInstagramGraph();
                    console.log(`✅ Instagram message sent successfully (instagramGraph fallback):`, result2);
                    return result2;
                } catch (e2) {
                    console.error('❌ Instagram sendMessage fallback error:', e2.message);
                    throw e2;
                }
            }
            throw e1;
        }
    }

    /**
     * Reply to an Instagram comment
     * @param {string} commentId - Instagram comment ID
     * @param {string} message - Reply text
     * @param {string} accessToken - Page access token
     * @returns {Object} API response
     */
    async replyToComment(commentId, message, accessToken) {
        try {
            const payload = { message };

            const fetch = await this.getFetch();
            const response = await fetch(`${this.facebookGraphURL}/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Instagram comment reply error ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            console.log(`💬 Replied to Instagram comment ${commentId}:`, result);
            return result;

        } catch (error) {
            console.error('❌ Instagram replyToComment error:', error.message);
            throw error;
        }
    }

    /**
     * Send a private reply (DM) to a public comment on our media
     * @param {string} commentId
     * @param {string} message
     * @param {string} accessToken
     */
    async sendPrivateReplyToComment(commentId, message, accessToken) {
        const payload = {
            recipient: { comment_id: commentId },
            message: { text: message }
        };

        const fetch = await this.getFetch();

        const tryFacebookGraph = async () => {
            const response = await fetch(`${this.facebookGraphURL}/me/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Private reply error ${response.status}: ${body}`);
            }
            return response.json();
        };

        const tryInstagramGraph = async () => {
            const response = await fetch(`${this.baseURL}/me/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Private reply fallback error ${response.status}: ${body}`);
            }
            return response.json();
        };

        try {
            const result = await tryFacebookGraph();
            console.log(`📩 Private reply sent (facebookGraph) to comment ${commentId}:`, result);
            return result;
        } catch (e1) {
            const tokenLooksIGUser = (accessToken || '').startsWith('IGAA');
            console.warn('⚠️ Private reply primary failed:', e1.message);
            if (tokenLooksIGUser) {
                const result2 = await tryInstagramGraph();
                console.log(`📩 Private reply sent (instagramGraph fallback) to comment ${commentId}:`, result2);
                return result2;
            }
            throw e1;
        }
    }

    /**
     * Get Instagram user profile information
     * @param {string} userId - Instagram scoped user ID (IGSID)
     * @param {string} accessToken - Page access token
     * @returns {Object} User profile data
     */
    async getUserProfile(userId, accessToken) {
        try {
            const fetch = await this.getFetch();
            // Use Facebook Graph for IG messaging profile lookups
            const response = await fetch(
                `${this.facebookGraphURL}/${userId}?fields=name,username,profile_pic&access_token=${accessToken}`
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Instagram profile API error ${response.status}: ${errorBody}`);
            }

            const raw = await response.json();
            const profile = {
                name: raw.name || null,
                username: raw.username || null,
                profile_pic: raw.profile_pic || null
            };
            console.log(`👤 Retrieved Instagram profile for ${userId}:`, profile);
            return profile;

        } catch (error) {
            console.error('❌ Instagram getUserProfile error:', error.message);
            throw error;
        }
    }

    /**
     * Get Facebook Messenger user profile
     * @param {string} psid - Page Scoped ID
     * @param {string} accessToken - Page access token
     */
    async getFacebookUserProfile(psid, accessToken) {
        try {
            const fetch = await this.getFetch();
            const response = await fetch(
                `${this.facebookGraphURL}/${psid}?fields=first_name,last_name,profile_pic&access_token=${accessToken}`
            );
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Facebook profile API error ${response.status}: ${errorBody}`);
            }
            const raw = await response.json();
            return {
                name: [raw.first_name, raw.last_name].filter(Boolean).join(' ') || null,
                username: null,
                profile_pic: raw.profile_pic || null
            };
        } catch (error) {
            console.error('❌ Facebook getFacebookUserProfile error:', error.message);
            throw error;
        }
    }

    // =====================================================
    // INSTAGRAM WEBHOOK SUBSCRIPTION
    // =====================================================

    /**
     * Subscribe to Instagram webhooks for a page
     * @param {string} pageId - Facebook Page ID connected to Instagram Business Account
     * @param {string} accessToken - Page access token
     * @param {string} callbackUrl - Webhook callback URL
     * @param {string} verifyToken - Webhook verification token
     * @returns {Object} Subscription result
     */
    async subscribeToWebhooks(pageId, accessToken, callbackUrl, verifyToken) {
        try {
            console.log(`🔗 Subscribing Instagram webhooks for page ${pageId}`);

            // Instagram webhooks are managed through the Facebook Page, not directly
            const subscriptionData = {
                object: 'instagram',
                callback_url: callbackUrl,
                fields: ['messages', 'messaging_postbacks', 'messaging_seen', 'message_reactions'],
                verify_token: verifyToken,
                include_values: true
            };

            const fetch = await this.getFetch();
            const response = await fetch(`${this.facebookGraphURL}/${pageId}/subscribed_apps`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Instagram webhook subscription error ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            console.log(`✅ Instagram webhook subscription successful:`, result);
            return result;

        } catch (error) {
            console.error('❌ Instagram webhook subscription error:', error.message);
            throw error;
        }
    }

    /**
     * Get Instagram Business Account information from a Facebook Page
     * @param {string} pageId - Facebook Page ID
     * @param {string} accessToken - Page access token
     * @returns {Object} Instagram Business Account data
     */
    async getInstagramBusinessAccount(pageId, accessToken) {
        try {
            const fetch = await this.getFetch();
            const response = await fetch(
                `${this.facebookGraphURL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Instagram Business Account API error ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            console.log(`🏢 Instagram Business Account info:`, result);
            return result;

        } catch (error) {
            console.error('❌ getInstagramBusinessAccount error:', error.message);
            throw error;
        }
    }

    // =====================================================
    // MULTI-TENANT CLIENT MANAGEMENT
    // =====================================================

    /**
     * Store Instagram credentials for a client (encrypted)
     * @param {string} clientId - Client UUID
     * @param {Object} credentials - Instagram credentials
     * @returns {boolean} Success status
     */
    async storeClientCredentials(clientIdOrCredentials, credentialsMaybe) {
        try {
            const hasExplicitClientId = typeof credentialsMaybe !== 'undefined';
            const clientId = hasExplicitClientId ? clientIdOrCredentials : null;
            const credentials = hasExplicitClientId ? credentialsMaybe : clientIdOrCredentials;

            // TODO: Implement encryption for access token (SOC2). For now store raw and mark to encrypt.
            const encryptedToken = credentials.page_access_token || credentials.access_token;

            if (clientId) {
                // Update existing client row by client_id
                const query = `
                    UPDATE client_integrations 
                    SET 
                        instagram_business_account_id = $1,
                        instagram_access_token_encrypted = $2,
                        instagram_webhook_verified = COALESCE($3, instagram_webhook_verified),
                        status = COALESCE($4, status),
                        last_active = NOW()
                    WHERE client_id = $5
                    RETURNING client_id, client_name, instagram_business_account_id
                `;
                const row = await db.getOne(query, [
                    credentials.instagram_business_account_id,
                    encryptedToken,
                    credentials.webhook_verified || false,
                    credentials.status || 'active',
                    clientId
                ]);
                console.log(`💾 Stored Instagram credentials for client ${clientId}`);
                return row || true;
            }

            // No client_id provided: upsert by instagram_business_account_id or facebook_page_id
            const existing = await db.getOne(
                `SELECT client_id FROM client_integrations WHERE instagram_business_account_id = $1 OR facebook_page_id = $2 LIMIT 1`,
                [credentials.instagram_business_account_id, credentials.facebook_page_id]
            );

            if (existing && existing.client_id) {
                const row = await db.getOne(
                    `UPDATE client_integrations
                     SET client_name = COALESCE($1, client_name),
                         instagram_business_account_id = $2,
                         instagram_access_token_encrypted = $3,
                         status = COALESCE($4, status),
                         last_active = NOW()
                     WHERE client_id = $5
                     RETURNING client_id, client_name, instagram_business_account_id`,
                    [
                        credentials.client_name || null,
                        credentials.instagram_business_account_id,
                        encryptedToken,
                        credentials.status || 'active',
                        existing.client_id
                    ]
                );
                console.log(`🔄 Updated client integration for IG ${credentials.instagram_business_account_id}`);
                return row || true;
            }

            const inserted = await db.getOne(
                `INSERT INTO client_integrations (
                    client_name, facebook_page_id, instagram_business_account_id, instagram_access_token_encrypted, status, last_active
                 ) VALUES ($1, $2, $3, $4, $5, NOW())
                 RETURNING client_id, client_name, instagram_business_account_id`,
                [
                    credentials.client_name,
                    credentials.facebook_page_id,
                    credentials.instagram_business_account_id,
                    encryptedToken,
                    credentials.status || 'active'
                ]
            );
            console.log(`✅ Created client integration ${inserted.client_name} (IG: ${inserted.instagram_business_account_id})`);
            return inserted || true;

        } catch (error) {
            console.error('❌ storeClientCredentials error:', error.message);
            throw error;
        }
    }

    /**
     * Get client by Instagram Business Account ID
     * @param {string} instagramAccountId - Instagram Business Account ID
     * @returns {Object} Client data
     */
    async getClientByInstagramId(instagramAccountId) {
        try {
            const query = `
                SELECT 
                    client_id,
                    client_name,
                    instagram_access_token_encrypted,
                    instagram_webhook_verified,
                    subscription_tier,
                    status
                FROM client_integrations 
                WHERE instagram_business_account_id = $1 
                AND status = 'active'
            `;

            const result = await db.getOne(query, [instagramAccountId]);
            
            if (result) {
                console.log(`🔍 Found client for Instagram account ${instagramAccountId}`);
                // TEMPORARY: Use encrypted token directly (TODO: Implement SOC2 decryption)
                result.access_token = result.instagram_access_token_encrypted;
                console.log(`🔑 Using access token: ${result.access_token ? result.access_token.substring(0, 20) + '...' : 'NULL'}`);
            }

            return result;

        } catch (error) {
            console.error('❌ getClientByInstagramId error:', error.message);
            throw error;
        }
    }

    // =====================================================
    // WEBHOOK VALIDATION
    // =====================================================

    /**
     * Validate Instagram webhook signature (Meta requirement)
     * @param {string} payload - Raw webhook payload
     * @param {string} signature - X-Hub-Signature-256 header
     * @param {string} appSecret - Instagram/Facebook App Secret
     * @returns {boolean} Signature is valid
     */
    validateWebhookSignature(payload, signature, appSecret) {
        try {
            const crypto = require('crypto');
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');

            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

            console.log(`🔐 Instagram webhook signature validation: ${isValid ? 'VALID' : 'INVALID'}`);
            return isValid;

        } catch (error) {
            console.error('❌ Instagram webhook signature validation error:', error.message);
            return false;
        }
    }

    // =====================================================
    // OAUTH 2.0 INTEGRATION HELPERS
    // =====================================================

    /**
     * Generate Instagram OAuth URL for client onboarding
     * @param {string} clientId - Internal client ID
     * @param {string} redirectUri - OAuth redirect URI
     * @returns {string} Authorization URL
     */
    generateOAuthURL(clientId, redirectUri) {
        const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
        const scopes = [
            'instagram_basic',
            'instagram_messaging',
            'pages_messaging',
            'pages_read_engagement'
        ].join(',');

        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
            `client_id=${appId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${scopes}&` +
            `response_type=code&` +
            `state=${clientId}`;

        console.log(`🔗 Generated Instagram OAuth URL for client ${clientId}`);
        return authUrl;
    }

    /**
     * Exchange OAuth code for access token
     * @param {string} code - Authorization code from OAuth callback
     * @param {string} redirectUri - Same redirect URI used in authorization
     * @returns {Object} Token exchange result
     */
    async exchangeCodeForToken(code, redirectUri) {
        try {
            const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
            const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

            const tokenUrl = `${this.facebookGraphURL}/oauth/access_token?` +
                `client_id=${appId}&` +
                `client_secret=${appSecret}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `code=${code}`;

            const fetch = await this.getFetch();
            const response = await fetch(tokenUrl, { method: 'POST' });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Token exchange error ${response.status}: ${errorBody}`);
            }

            const tokenData = await response.json();
            console.log(`🎟️ Instagram OAuth token exchange successful`);
            
            return tokenData;

        } catch (error) {
            console.error('❌ Instagram OAuth token exchange error:', error.message);
            throw error;
        }
    }
}

module.exports = InstagramBusinessService;
