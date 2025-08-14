// =====================================================
// CONTACT IDENTITY & DEDUPLICATION SERVICE
// =====================================================
// Handles session management, identity resolution, and contact deduplication
// Uses deterministic + probabilistic matching with confidence scoring

const DatabaseService = require('./database-service');
const crypto = require('crypto');

class ContactIdentityService {
  constructor() {
    this.db = new DatabaseService();
    console.log('🧩 ContactIdentityService initialized for deduplication');
  }

  // =====================================================
  // ENHANCED SESSION MANAGEMENT
  // =====================================================

  async createEnhancedSession(browserContext = {}) {
    try {
      const sessionId = `webchat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // Generate device fingerprint
      const deviceFingerprint = this.generateDeviceFingerprint(browserContext);
      
      // Extract identity signals
      const identitySignals = {
        device_fingerprint: deviceFingerprint,
        user_agent: browserContext.userAgent || 'unknown',
        timezone: browserContext.timezone || null,
        screen_resolution: browserContext.screenResolution || null,
        language: browserContext.language || 'en',
        session_start: new Date(),
        ip_hash: browserContext.ipHash || null
      };

      // Immediate probabilistic matching attempt
      const potentialMatches = await this.findPotentialContactMatches(identitySignals);

      // Store enhanced session
      await this.storeEnhancedSession(sessionId, identitySignals, potentialMatches);

      console.log(`🎯 Enhanced session created: ${sessionId}`);
      console.log(`📊 Found ${potentialMatches.length} potential contact matches`);

      return {
        sessionId,
        identitySignals,
        potentialMatches,
        confidence_scores: potentialMatches.map(m => m.confidence_score)
      };

    } catch (error) {
      console.error('❌ Error creating enhanced session:', error.message);
      throw error;
    }
  }

  generateDeviceFingerprint(context) {
    const fingerprintData = [
      context.userAgent || 'unknown',
      context.screenResolution || 'unknown',
      context.timezone || 'unknown',
      context.language || 'en',
      context.platform || 'unknown'
    ].join('|');

    return crypto.createHash('sha256').update(fingerprintData).digest('hex').slice(0, 16);
  }

  async findPotentialContactMatches(identitySignals) {
    try {
      // Query for similar device fingerprints (last 30 days)
      const similarSessions = await this.db.query(`
        SELECT DISTINCT
          ws.session_id,
          ws.device_fingerprint,
          ws.user_agent,
          ws.created_at,
          c.conversation_id,
          c.user_identifier,
          c.platform_type,
          CASE 
            WHEN ws.device_fingerprint = $1 THEN 0.9
            WHEN ws.user_agent = $2 THEN 0.7
            WHEN ws.timezone = $3 THEN 0.5
            ELSE 0.3
          END as confidence_score
        FROM webchat_sessions ws
        LEFT JOIN chatbot_conversations c ON ws.session_id = c.user_identifier
        WHERE ws.created_at > NOW() - INTERVAL '30 days'
          AND (
            ws.device_fingerprint = $1 OR
            ws.user_agent = $2 OR
            ws.timezone = $3
          )
        ORDER BY confidence_score DESC, ws.created_at DESC
        LIMIT 10
      `, [
        identitySignals.device_fingerprint,
        identitySignals.user_agent,
        identitySignals.timezone
      ]);

      return similarSessions || [];

    } catch (error) {
      console.error('❌ Error finding potential matches:', error.message);
      return [];
    }
  }

  async storeEnhancedSession(sessionId, identitySignals, potentialMatches) {
    try {
      // Ensure webchat_sessions table exists
      await this.ensureWebchatSessionsTable();

      // Store session with identity context
      await this.db.query(`
        INSERT INTO webchat_sessions (
          session_id, device_fingerprint, user_agent, timezone, 
          screen_resolution, language, ip_hash, potential_matches,
          created_at, last_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (session_id) 
        DO UPDATE SET last_active = NOW()
      `, [
        sessionId,
        identitySignals.device_fingerprint,
        identitySignals.user_agent,
        identitySignals.timezone,
        identitySignals.screen_resolution,
        identitySignals.language,
        identitySignals.ip_hash,
        JSON.stringify(potentialMatches)
      ]);

    } catch (error) {
      console.error('❌ Error storing enhanced session:', error.message);
      throw error;
    }
  }

  // =====================================================
  // PROGRESSIVE IDENTITY RESOLUTION
  // =====================================================

  async enrichIdentityFromConversation(sessionId, messageContent, functionCalls = []) {
    try {
      console.log(`🔍 Enriching identity for session: ${sessionId}`);

      // Extract identity signals from conversation
      const signals = {
        explicit_email: this.extractEmail(messageContent),
        explicit_phone: this.extractPhone(messageContent),
        explicit_name: this.extractName(messageContent),
        product_preferences: this.extractProductPreferences(functionCalls),
        conversation_style: this.analyzeConversationStyle(messageContent),
        behavioral_patterns: this.extractBehavioralPatterns(messageContent, functionCalls)
      };

      console.log(`📊 Extracted signals:`, signals);

      // Deterministic matching if explicit identifiers found
      if (signals.explicit_email || signals.explicit_phone) {
        const deterministicMatch = await this.performDeterministicMatch(sessionId, signals);
        if (deterministicMatch) {
          console.log(`✅ Deterministic match found: ${deterministicMatch.contact_id}`);
          return deterministicMatch;
        }
      }

      // Update probabilistic scores
      const probabilisticUpdate = await this.updateProbabilisticScores(sessionId, signals);
      
      return probabilisticUpdate;

    } catch (error) {
      console.error('❌ Error enriching identity:', error.message);
      return null;
    }
  }

  extractEmail(content) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0].toLowerCase() : null;
  }

  extractPhone(content) {
    const phoneRegex = /(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g;
    const matches = content.match(phoneRegex);
    return matches ? matches[0].replace(/\D/g, '') : null;
  }

  extractName(content) {
    // Simple name extraction - look for "I'm", "My name is", etc.
    const namePatterns = [
      /(?:I'm|I am|my name is|call me)\s+([A-Za-z\s]{2,30})/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/
    ];
    
    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  extractProductPreferences(functionCalls) {
    const preferences = {
      searched_categories: [],
      viewed_products: [],
      price_ranges: []
    };

    functionCalls.forEach(call => {
      if (call.function_name === 'searchMagentoProducts') {
        const params = JSON.parse(call.function_arguments || '{}');
        if (params.query) preferences.searched_categories.push(params.query);
        if (params.categoryName) preferences.searched_categories.push(params.categoryName);
        if (params.minPrice || params.maxPrice) {
          preferences.price_ranges.push({ min: params.minPrice, max: params.maxPrice });
        }
      }
    });

    return preferences;
  }

  analyzeConversationStyle(content) {
    return {
      message_length: content.length,
      formality: content.includes('please') || content.includes('thank you') ? 'formal' : 'casual',
      language_pattern: content.toLowerCase().includes('spanish') ? 'bilingual' : 'english',
      punctuation_style: (content.match(/[.!?]/g) || []).length / content.length
    };
  }

  extractBehavioralPatterns(messageContent, functionCalls) {
    return {
      message_frequency: 1, // Will be updated over time
      function_usage_pattern: functionCalls.map(c => c.function_name),
      time_of_interaction: new Date().getHours(),
      interaction_depth: functionCalls.length
    };
  }

  // =====================================================
  // DETERMINISTIC MATCHING
  // =====================================================

  async performDeterministicMatch(sessionId, signals) {
    try {
      let matchQuery = '';
      let matchParams = [];

      if (signals.explicit_email) {
        matchQuery = `
          SELECT DISTINCT c.conversation_id, c.user_identifier, c.platform_type,
                 'email' as match_type, 1.0 as confidence_score
          FROM chatbot_conversations c
          JOIN chatbot_messages m ON c.conversation_id = m.conversation_id
          WHERE LOWER(m.message_content) LIKE LOWER($1)
          ORDER BY c.last_message_at DESC
          LIMIT 5
        `;
        matchParams = [`%${signals.explicit_email}%`];
      } else if (signals.explicit_phone) {
        matchQuery = `
          SELECT DISTINCT c.conversation_id, c.user_identifier, c.platform_type,
                 'phone' as match_type, 1.0 as confidence_score
          FROM chatbot_conversations c
          JOIN chatbot_messages m ON c.conversation_id = m.conversation_id
          WHERE m.message_content ~ $1
          ORDER BY c.last_message_at DESC
          LIMIT 5
        `;
        // Remove all non-digits for phone matching
        const cleanPhone = signals.explicit_phone.replace(/\D/g, '');
        matchParams = [cleanPhone];
      }

      if (matchQuery) {
        const matches = await this.db.query(matchQuery, matchParams);
        
        if (matches && matches.length > 0) {
          // Store the deterministic match
          await this.storeDeterministicMatch(sessionId, matches[0]);
          return matches[0];
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Error performing deterministic match:', error.message);
      return null;
    }
  }

  async storeDeterministicMatch(sessionId, match) {
    try {
      // Update session with deterministic match
      await this.db.query(`
        UPDATE webchat_sessions 
        SET deterministic_match = $1, match_confidence = 1.0, match_type = 'deterministic'
        WHERE session_id = $2
      `, [JSON.stringify(match), sessionId]);

      console.log(`✅ Stored deterministic match for ${sessionId}`);

    } catch (error) {
      console.error('❌ Error storing deterministic match:', error.message);
    }
  }

  // =====================================================
  // PROBABILISTIC SCORING
  // =====================================================

  async updateProbabilisticScores(sessionId, signals) {
    try {
      // Get current session data
      const session = await this.db.getOne(`
        SELECT * FROM webchat_sessions WHERE session_id = $1
      `, [sessionId]);

      if (!session) return null;

      // Calculate behavioral similarity scores
      const behavioralScores = await this.calculateBehavioralSimilarity(sessionId, signals);

      // Update session with new scores
      await this.db.query(`
        UPDATE webchat_sessions 
        SET 
          behavioral_scores = $1,
          last_enrichment = NOW(),
          product_preferences = $2,
          conversation_style = $3
        WHERE session_id = $4
      `, [
        JSON.stringify(behavioralScores),
        JSON.stringify(signals.product_preferences),
        JSON.stringify(signals.conversation_style),
        sessionId
      ]);

      // Check if any scores warrant AI confirmation request
      const highConfidenceMatches = behavioralScores.filter(score => 
        score.confidence >= 0.8 && score.confidence < 1.0
      );

      if (highConfidenceMatches.length > 0) {
        console.log(`🤖 High confidence matches found - AI should request confirmation`);
        return {
          requiresConfirmation: true,
          matches: highConfidenceMatches,
          sessionId
        };
      }

      return {
        requiresConfirmation: false,
        scores: behavioralScores,
        sessionId
      };

    } catch (error) {
      console.error('❌ Error updating probabilistic scores:', error.message);
      return null;
    }
  }

  async calculateBehavioralSimilarity(sessionId, signals) {
    try {
      // Find similar behavioral patterns from other sessions
      const similarSessions = await this.db.query(`
        SELECT 
          ws.session_id,
          ws.device_fingerprint,
          ws.product_preferences,
          ws.conversation_style,
          c.user_identifier,
          c.platform_type,
          c.last_message_at
        FROM webchat_sessions ws
        LEFT JOIN chatbot_conversations c ON ws.session_id = c.user_identifier
        WHERE ws.session_id != $1 
          AND ws.created_at > NOW() - INTERVAL '90 days'
        ORDER BY ws.created_at DESC
        LIMIT 50
      `, [sessionId]);

      const scores = [];

      for (const session of similarSessions || []) {
        let confidence = 0;

        // Product preference similarity
        if (session.product_preferences && signals.product_preferences) {
          const prefSimilarity = this.calculateProductPreferenceSimilarity(
            JSON.parse(session.product_preferences),
            signals.product_preferences
          );
          confidence += prefSimilarity * 0.4;
        }

        // Conversation style similarity
        if (session.conversation_style && signals.conversation_style) {
          const styleSimilarity = this.calculateConversationStyleSimilarity(
            JSON.parse(session.conversation_style),
            signals.conversation_style
          );
          confidence += styleSimilarity * 0.3;
        }

        // Device fingerprint similarity
        if (session.device_fingerprint) {
          const deviceSimilarity = session.device_fingerprint === signals.device_fingerprint ? 1.0 : 0.0;
          confidence += deviceSimilarity * 0.3;
        }

        if (confidence > 0.6) {
          scores.push({
            session_id: session.session_id,
            user_identifier: session.user_identifier,
            platform_type: session.platform_type,
            confidence: Math.min(confidence, 0.95), // Cap at 0.95 for probabilistic
            match_type: 'probabilistic',
            last_interaction: session.last_message_at
          });
        }
      }

      return scores.sort((a, b) => b.confidence - a.confidence).slice(0, 5);

    } catch (error) {
      console.error('❌ Error calculating behavioral similarity:', error.message);
      return [];
    }
  }

  calculateProductPreferenceSimilarity(prefs1, prefs2) {
    if (!prefs1 || !prefs2) return 0;

    const categories1 = new Set(prefs1.searched_categories || []);
    const categories2 = new Set(prefs2.searched_categories || []);
    
    const intersection = new Set([...categories1].filter(x => categories2.has(x)));
    const union = new Set([...categories1, ...categories2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  calculateConversationStyleSimilarity(style1, style2) {
    if (!style1 || !style2) return 0;

    let similarity = 0;
    
    // Formality match
    if (style1.formality === style2.formality) similarity += 0.4;
    
    // Language pattern match
    if (style1.language_pattern === style2.language_pattern) similarity += 0.4;
    
    // Message length similarity
    const lengthDiff = Math.abs(style1.message_length - style2.message_length);
    const lengthSimilarity = Math.max(0, 1 - lengthDiff / 1000);
    similarity += lengthSimilarity * 0.2;

    return similarity;
  }

  // =====================================================
  // DATABASE SCHEMA SETUP
  // =====================================================

  async ensureWebchatSessionsTable() {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS webchat_sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          device_fingerprint VARCHAR(64),
          user_agent TEXT,
          timezone VARCHAR(50),
          screen_resolution VARCHAR(20),
          language VARCHAR(10),
          ip_hash VARCHAR(64),
          potential_matches JSONB,
          deterministic_match JSONB,
          behavioral_scores JSONB,
          product_preferences JSONB,
          conversation_style JSONB,
          match_confidence DECIMAL(3,2),
          match_type VARCHAR(20),
          created_at TIMESTAMP DEFAULT NOW(),
          last_active TIMESTAMP DEFAULT NOW(),
          last_enrichment TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_webchat_sessions_device_fingerprint 
        ON webchat_sessions(device_fingerprint);
        
        CREATE INDEX IF NOT EXISTS idx_webchat_sessions_created_at 
        ON webchat_sessions(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_webchat_sessions_match_confidence 
        ON webchat_sessions(match_confidence);
      `);

      console.log('✅ Webchat sessions table ensured');

    } catch (error) {
      console.error('❌ Error ensuring webchat sessions table:', error.message);
      throw error;
    }
  }

  // =====================================================
  // AI CONFIRMATION HELPERS
  // =====================================================

  async generateMergeConfirmationPrompt(sessionId, potentialMatches) {
    try {
      const session = await this.db.getOne(`
        SELECT * FROM webchat_sessions WHERE session_id = $1
      `, [sessionId]);

      if (!session || !potentialMatches.length) return null;

      const highestMatch = potentialMatches[0];
      
      return {
        shouldRequestConfirmation: highestMatch.confidence >= 0.8,
        confidence: highestMatch.confidence,
        prompt: `I notice you might have chatted with us before on ${highestMatch.platform_type}. ` +
               `To provide you with better personalized service, are you the same person who ` +
               `was interested in ${this.summarizeProductPreferences(session.product_preferences)}? ` +
               `Just say "yes" if that's you, or "no" if you're someone else.`,
        match_details: highestMatch
      };

    } catch (error) {
      console.error('❌ Error generating merge confirmation prompt:', error.message);
      return null;
    }
  }

  summarizeProductPreferences(preferences) {
    if (!preferences) return "furniture products";
    
    try {
      const prefs = JSON.parse(preferences);
      const categories = prefs.searched_categories || [];
      
      if (categories.length === 0) return "furniture products";
      if (categories.length === 1) return categories[0];
      if (categories.length === 2) return `${categories[0]} and ${categories[1]}`;
      
      return `${categories.slice(0, -1).join(", ")}, and ${categories[categories.length - 1]}`;
      
    } catch {
      return "furniture products";
    }
  }
}

module.exports = ContactIdentityService;
