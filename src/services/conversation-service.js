// =====================================================
// CHATBOT CONVERSATION SERVICE
// =====================================================
// Hybrid service combining PostgreSQL persistence + Redis caching
// Implements conversation memory for Facebook Messenger & Webchat

const DatabaseService = require('./database-service');
const ConversationCacheService = require('./conversation-cache');

class ConversationService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new ConversationCacheService();
    
    console.log('🔧 ConversationService initialized with hybrid storage (PostgreSQL + Redis)');
  }
  
  // =====================================================
  // MAIN CONVERSATION MANAGEMENT
  // =====================================================
  
  // Get conversation history with cache-first strategy
  async getConversationHistory(userIdentifier, platformType) {
    try {
      console.log(`📚 Getting conversation history for ${userIdentifier} on ${platformType}`);
      
      // 1. Try cache first (ultra fast)
      const cachedHistory = await this.cache.getCachedConversationHistory(userIdentifier, platformType);
      
      if (cachedHistory && cachedHistory.length > 0) {
        console.log(`⚡ Serving from cache: ${cachedHistory.length} messages`);
        return cachedHistory;
      }
      
      // 2. Fallback to database
      console.log(`🔍 Cache miss, querying database...`);
      const dbHistory = await this.db.getConversationHistory(userIdentifier, platformType);
      
      // 3. Cache the result for next time
      if (dbHistory && dbHistory.length > 0) {
        await this.cache.cacheConversationHistory(userIdentifier, platformType, dbHistory, true);
        console.log(`💾 Cached ${dbHistory.length} messages from database`);
      }
      
      return dbHistory || [];
      
    } catch (error) {
      console.error(`❌ Error getting conversation history for ${userIdentifier}:`, error.message);
      
      // Try to return cached data even if database fails
      try {
        const cachedHistory = await this.cache.getCachedConversationHistory(userIdentifier, platformType);
        if (cachedHistory) {
          console.log(`🚨 Database error, serving stale cache: ${cachedHistory.length} messages`);
          return cachedHistory;
        }
      } catch (cacheError) {
        console.error(`❌ Cache fallback also failed:`, cacheError.message);
      }
      
      return [];
    }
  }
  
  // Save conversation history with cache update
  async saveConversationHistory(userIdentifier, platformType, conversationHistory) {
    try {
      console.log(`💾 Saving conversation history for ${userIdentifier} on ${platformType}: ${conversationHistory.length} messages`);
      
      // 1. Save to database (source of truth)
      const dbSuccess = await this.db.saveConversationHistory(userIdentifier, platformType, conversationHistory);
      
      if (!dbSuccess) {
        console.error(`❌ Failed to save to database for ${userIdentifier}`);
        return false;
      }
      
      // 2. Update cache
      const cacheSuccess = await this.cache.cacheConversationHistory(userIdentifier, platformType, conversationHistory, true);
      
      if (!cacheSuccess) {
        console.warn(`⚠️ Cache update failed for ${userIdentifier}, but database save succeeded`);
      }
      
      console.log(`✅ Conversation saved successfully for ${userIdentifier} (DB: ✅, Cache: ${cacheSuccess ? '✅' : '❌'})`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error saving conversation history for ${userIdentifier}:`, error.message);
      return false;
    }
  }
  
  // Add a single message to conversation
  async addMessageToConversation(userIdentifier, platformType, messageRole, messageContent, functionData = null) {
    try {
      console.log(`💬 Adding ${messageRole} message for ${userIdentifier} on ${platformType}`);
      
      // 1. Save to database
      const savedMessage = await this.db.saveMessageToConversation(
        userIdentifier, 
        platformType, 
        messageRole, 
        messageContent, 
        functionData
      );
      
      if (!savedMessage) {
        console.error(`❌ Failed to save message to database for ${userIdentifier}`);
        return false;
      }
      
      // 2. Invalidate cache to force refresh on next read
      await this.cache.invalidateConversationCache(userIdentifier, platformType);
      
      console.log(`✅ Message added and cache invalidated for ${userIdentifier}`);
      return savedMessage;
      
    } catch (error) {
      console.error(`❌ Error adding message for ${userIdentifier}:`, error.message);
      return false;
    }
  }
  
  // =====================================================
  // FUNCTION RESULT CACHING
  // =====================================================
  
  // Cache function results to avoid repeated API calls
  async cacheFunctionResult(functionName, parameters, result, ttl = 300) {
    return await this.cache.cacheFunctionResult(functionName, parameters, result, ttl);
  }
  
  // Get cached function result
  async getCachedFunctionResult(functionName, parameters) {
    return await this.cache.getCachedFunctionResult(functionName, parameters);
  }
  
  // =====================================================
  // PLATFORM-SPECIFIC HELPERS
  // =====================================================
  
  // Facebook Messenger specific conversation handling
  async getFacebookConversationHistory(facebookPSID) {
    return await this.getConversationHistory(facebookPSID, 'facebook_messenger');
  }
  
  // Save Facebook conversation
  async saveFacebookConversationHistory(facebookPSID, conversationHistory) {
    return await this.saveConversationHistory(facebookPSID, 'facebook_messenger', conversationHistory);
  }
  
  // Webchat specific conversation handling  
  async getWebchatConversationHistory(sessionId) {
    return await this.getConversationHistory(sessionId, 'webchat');
  }
  
  // Save webchat conversation
  async saveWebchatConversationHistory(sessionId, conversationHistory) {
    return await this.saveConversationHistory(sessionId, 'webchat', conversationHistory);
  }
  
  // =====================================================
  // CONVERSATION ANALYTICS & MANAGEMENT
  // =====================================================
  
  // Get conversation statistics
  async getConversationStats() {
    try {
      const [dbStats, cacheStats] = await Promise.all([
        this.db.getConversationStats(),
        this.cache.getCacheStats()
      ]);
      
      return {
        database: dbStats,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error.message);
      return null;
    }
  }
  
  // Clean up old conversations and cache
  async cleanupOldData(retentionDays = 90) {
    try {
      console.log(`🧹 Starting cleanup of data older than ${retentionDays} days...`);
      
      const [dbCleanup, cacheCleanup] = await Promise.all([
        this.db.cleanupOldConversations(retentionDays),
        this.cache.clearAllChatbotCache()
      ]);
      
      console.log(`✅ Cleanup completed: ${dbCleanup} DB conversations, ${cacheCleanup} cache keys`);
      
      return {
        databaseConversationsDeleted: dbCleanup,
        cacheKeysCleared: cacheCleanup,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
      return null;
    }
  }
  
  // Health check for both database and cache
  async healthCheck() {
    try {
      const [dbHealth, cacheHealth] = await Promise.all([
        this.testDatabaseConnection(),
        this.cache.healthCheck()
      ]);
      
      return {
        database: dbHealth,
        cache: cacheHealth,
        overall: dbHealth.status === 'healthy' && cacheHealth.status === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        database: { status: 'error', message: error.message },
        cache: { status: 'error', message: error.message },
        overall: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Test database connection
  async testDatabaseConnection() {
    try {
      const result = await this.db.getConversationStats();
      return {
        status: result ? 'healthy' : 'error',
        message: result ? 'Database connection working' : 'Database query failed'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  // Format conversation history for AI agent
  formatForAIAgent(conversationHistory) {
    return conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.function_name && {
        function_call: {
          name: msg.function_name,
          arguments: msg.function_arguments
        }
      }),
      ...(msg.function_result && {
        function_result: msg.function_result
      })
    }));
  }
  
  // Validate conversation data
  validateConversationData(userIdentifier, platformType, conversationHistory) {
    if (!userIdentifier || typeof userIdentifier !== 'string') {
      throw new Error('Invalid userIdentifier');
    }
    
    if (!platformType || typeof platformType !== 'string') {
      throw new Error('Invalid platformType');
    }
    
    if (!Array.isArray(conversationHistory)) {
      throw new Error('conversationHistory must be an array');
    }
    
    // Validate each message
    conversationHistory.forEach((msg, index) => {
      if (!msg.role || !msg.content) {
        throw new Error(`Invalid message at index ${index}: missing role or content`);
      }
      
      if (!['user', 'assistant', 'function'].includes(msg.role)) {
        throw new Error(`Invalid message role at index ${index}: ${msg.role}`);
      }
    });
    
    return true;
  }
}

module.exports = ConversationService;