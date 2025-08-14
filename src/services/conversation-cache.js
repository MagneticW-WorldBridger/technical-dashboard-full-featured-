// =====================================================
// CHATBOT CONVERSATION CACHE SERVICE
// =====================================================
// Redis (Upstash) caching layer for fast conversation retrieval
// Best practices: TTL management, error handling, fallback patterns

const { createClient } = require('@vercel/kv');

class ConversationCacheService {
  constructor() {
    // Initialize Redis client using Vercel KV (Upstash)
    this.redis = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    
    // Cache configuration
    this.config = {
      conversationTTL: 3600, // 1 hour for active conversations
      longTermTTL: 86400 * 7, // 7 days for inactive conversations
      maxConversationLength: 50, // Max messages to cache
      cacheKeyPrefix: 'chatbot:conversation:'
    };
    
    console.log('🔧 ConversationCacheService initialized with Redis/Upstash');
  }
  
  // =====================================================
  // CACHE KEY MANAGEMENT
  // =====================================================
  
  // Generate standardized cache key
  getCacheKey(userIdentifier, platformType) {
    return `${this.config.cacheKeyPrefix}${platformType}:${userIdentifier}`;
  }
  
  // Generate session-specific cache key
  getSessionCacheKey(conversationId) {
    return `${this.config.cacheKeyPrefix}session:${conversationId}`;
  }
  
  // =====================================================
  // CONVERSATION CACHING
  // =====================================================
  
  // Cache conversation history for fast retrieval
  async cacheConversationHistory(userIdentifier, platformType, conversationHistory, isActive = true) {
    try {
      const cacheKey = this.getCacheKey(userIdentifier, platformType);
      
      // Limit conversation length for cache efficiency
      const trimmedHistory = conversationHistory.slice(-this.config.maxConversationLength);
      
      // Add metadata
      const cacheData = {
        userIdentifier,
        platformType,
        messages: trimmedHistory,
        lastUpdated: new Date().toISOString(),
        isActive,
        messageCount: trimmedHistory.length
      };
      
      // Choose TTL based on conversation activity
      const ttl = isActive ? this.config.conversationTTL : this.config.longTermTTL;
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
      
      console.log(`💾 Cached conversation for ${userIdentifier} on ${platformType} (${trimmedHistory.length} messages, TTL: ${ttl}s)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Cache write error for ${userIdentifier}:`, error.message);
      return false;
    }
  }
  
  // Retrieve conversation history from cache
  async getCachedConversationHistory(userIdentifier, platformType) {
    try {
      const cacheKey = this.getCacheKey(userIdentifier, platformType);
      const cachedData = await this.redis.get(cacheKey);
      
      if (!cachedData) {
        console.log(`🔍 Cache miss for ${userIdentifier} on ${platformType}`);
        return null;
      }
      
      const parsedData = JSON.parse(cachedData);
      console.log(`⚡ Cache hit for ${userIdentifier} on ${platformType} (${parsedData.messageCount} messages)`);
      
      return parsedData.messages || [];
      
    } catch (error) {
      console.error(`❌ Cache read error for ${userIdentifier}:`, error.message);
      return null;
    }
  }
  
  // =====================================================
  // CACHE INVALIDATION & MANAGEMENT
  // =====================================================
  
  // Invalidate conversation cache (when updated in database)
  async invalidateConversationCache(userIdentifier, platformType) {
    try {
      const cacheKey = this.getCacheKey(userIdentifier, platformType);
      await this.redis.del(cacheKey);
      
      console.log(`🗑️ Invalidated cache for ${userIdentifier} on ${platformType}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Cache invalidation error for ${userIdentifier}:`, error.message);
      return false;
    }
  }
  
  // Cache conversation metadata for quick lookups
  async cacheConversationMetadata(conversationId, metadata) {
    try {
      const cacheKey = this.getSessionCacheKey(conversationId);
      await this.redis.setex(cacheKey, this.config.conversationTTL, JSON.stringify(metadata));
      
      console.log(`📊 Cached metadata for conversation ${conversationId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Metadata cache error for ${conversationId}:`, error.message);
      return false;
    }
  }
  
  // =====================================================
  // FUNCTION RESULT CACHING
  // =====================================================
  
  // Cache function call results to avoid repeated API calls
  async cacheFunctionResult(functionName, parameters, result, ttl = 300) {
    try {
      const paramHash = this.hashParameters(parameters);
      const cacheKey = `chatbot:function:${functionName}:${paramHash}`;
      
      const cacheData = {
        functionName,
        parameters,
        result,
        cachedAt: new Date().toISOString()
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
      
      console.log(`🔧 Cached function result: ${functionName} (TTL: ${ttl}s)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Function cache error for ${functionName}:`, error.message);
      return false;
    }
  }
  
  // Retrieve cached function result
  async getCachedFunctionResult(functionName, parameters) {
    try {
      const paramHash = this.hashParameters(parameters);
      const cacheKey = `chatbot:function:${functionName}:${paramHash}`;
      
      const cachedData = await this.redis.get(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      const parsedData = JSON.parse(cachedData);
      console.log(`⚡ Function cache hit: ${functionName}`);
      
      return parsedData.result;
      
    } catch (error) {
      console.error(`❌ Function cache read error for ${functionName}:`, error.message);
      return null;
    }
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  // Simple hash function for parameters
  hashParameters(parameters) {
    return Buffer.from(JSON.stringify(parameters)).toString('base64').slice(0, 16);
  }
  
  // Get cache statistics
  async getCacheStats() {
    try {
      // Get all chatbot cache keys
      const conversationKeys = await this.redis.keys(`${this.config.cacheKeyPrefix}*`);
      const functionKeys = await this.redis.keys('chatbot:function:*');
      
      return {
        totalKeys: conversationKeys.length + functionKeys.length,
        conversationKeys: conversationKeys.length,
        functionKeys: functionKeys.length,
        lastChecked: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Cache stats error:', error.message);
      return {
        totalKeys: 0,
        conversationKeys: 0,
        functionKeys: 0,
        error: error.message
      };
    }
  }
  
  // Clear all chatbot cache (for maintenance)
  async clearAllChatbotCache() {
    try {
      const keys = await this.redis.keys('chatbot:*');
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🧹 Cleared ${keys.length} chatbot cache keys`);
      }
      
      return keys.length;
      
    } catch (error) {
      console.error('❌ Cache clear error:', error.message);
      return 0;
    }
  }
  
  // Health check for Redis connection
  async healthCheck() {
    try {
      const testKey = 'chatbot:health:test';
      const testValue = 'ok';
      
      await this.redis.setex(testKey, 10, testValue);
      const retrieved = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      return {
        status: retrieved === testValue ? 'healthy' : 'error',
        message: retrieved === testValue ? 'Redis connection working' : 'Redis read/write failed',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = ConversationCacheService;