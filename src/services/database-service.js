const db = require('../config/database');

class DatabaseService {
  
  // =====================================================
  // CUSTOMER IDENTIFICATION QUERIES
  // =====================================================
  
  // Get customer by phone number with analytics
  async getCustomerByPhone(phone) {
    const query = `
      SELECT 
        c.customerid,
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        c.address1,
        c.city,
        c.state,
        c.zipcode,
        ca.total_orders,
        ca.total_spent,
        ca.loyalty_tier,
        ca.days_since_last_order
      FROM customers c
      LEFT JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE c.phonenumber = $1
    `;
    
    return await db.getOne(query, [phone]);
  }
  
  // Get customer by email with analytics
  async getCustomerByEmail(email) {
    const query = `
      SELECT 
        c.customerid,
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        c.address1,
        c.city,
        c.state,
        c.zipcode,
        ca.total_orders,
        ca.total_spent,
        ca.loyalty_tier,
        ca.days_since_last_order
      FROM customers c
      LEFT JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE c.email = $1
    `;
    
    return await db.getOne(query, [email]);
  }
  
  // =====================================================
  // ORDER HISTORY QUERIES
  // =====================================================
  
  // Get customer's order history
  async getCustomerOrders(customerId) {
    const query = `
      SELECT 
        o.orderid,
        o.orderdate,
        o.status,
        COALESCE(SUM(od.itemprice * od.qtyordered), 0) as sum,
        o.deliverydate,
        o.deliverytype,
        COUNT(od.orderid) as item_count
      FROM orders o
      LEFT JOIN order_details od ON o.orderid = od.orderid
      WHERE o.customerid = $1
      GROUP BY o.orderid, o.orderdate, o.status, o.deliverydate, o.deliverytype
      ORDER BY o.orderdate DESC
    `;
    
    return await db.getMany(query, [customerId]);
  }
  
  // Get detailed order information
  async getOrderDetails(orderId) {
    const query = `
      SELECT 
        od.orderid,
        od.lineid,
        od.productid,
        od.productid as description,
        od.qtyordered,
        od.itemprice,
        od.itemprice as delivereditemprice,
        o.deliverydate,
        o.status
      FROM order_details od
      JOIN orders o ON od.orderid = o.orderid
      WHERE od.orderid = $1
      ORDER BY od.lineid
    `;
    
    return await db.getMany(query, [orderId]);
  }
  
  // =====================================================
  // LOYALTY PROGRAM QUERIES
  // =====================================================
  
  // Check if customer qualifies for loyalty upgrade
  async checkLoyaltyUpgrade(customerId) {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        ca.total_spent,
        ca.loyalty_tier,
        lt.tier_name as next_tier,
        lt.min_spend as next_tier_min,
        (lt.min_spend - ca.total_spent) as amount_needed
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      JOIN loyalty_tiers lt ON lt.tier_name = 
        CASE 
          WHEN ca.total_spent >= 5000 THEN 'PLATINUM'
          WHEN ca.total_spent >= 2000 THEN 'GOLD'
          WHEN ca.total_spent >= 500 THEN 'SILVER'
          ELSE 'BRONZE'
        END
      WHERE c.customerid = $1
    `;
    
    return await db.getOne(query, [customerId]);
  }
  
  // Get customers at risk of churning (no orders in 90+ days)
  async getAtRiskCustomers() {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        ca.days_since_last_order,
        ca.total_spent,
        ca.loyalty_tier
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE ca.days_since_last_order >= 90
      ORDER BY ca.days_since_last_order DESC
    `;
    
    return await db.getMany(query);
  }
  
  // =====================================================
  // PRODUCT RECOMMENDATION QUERIES
  // =====================================================
  
  // Get products frequently bought together
  async getFrequentlyBoughtTogether(productId) {
    const query = `
      SELECT 
        od1.productid as main_product,
        od1.productid as main_product_name,
        od2.productid as companion_product,
        od2.productid as companion_product_name,
        COUNT(*) as frequency,
        (COUNT(*) * 100.0 / total_orders.total_count) as confidence_percentage
      FROM order_details od1
      JOIN order_details od2 ON od1.orderid = od2.orderid 
        AND od1.productid != od2.productid
      JOIN (
        SELECT productid, COUNT(DISTINCT orderid) as total_count
        FROM order_details
        WHERE productid = $1
        GROUP BY productid
      ) total_orders ON od1.productid = total_orders.productid
      WHERE od1.productid = $1
      GROUP BY od1.productid, od2.productid, total_orders.total_count
      ORDER BY frequency DESC
      LIMIT 5
    `;
    
    return await db.getMany(query, [productId]);
  }
  
  // Get customer's favorite product categories
  async getCustomerFavoriteCategories(customerId) {
    const query = `
      SELECT 
        pa.category,
        COUNT(*) as purchase_count,
        SUM(od.itemprice * od.qtyordered) as total_spent
      FROM order_details od
      JOIN orders o ON od.orderid = o.orderid
      JOIN product_analytics pa ON od.productid = pa.productid
      WHERE o.customerid = $1
      GROUP BY pa.category
      ORDER BY total_spent DESC
    `;
    
    return await db.getMany(query, [customerId]);
  }
  
  // =====================================================
  // DELIVERY TRACKING QUERIES
  // =====================================================
  
  // Get upcoming deliveries
  async getUpcomingDeliveries() {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.phonenumber,
        o.orderid,
        o.deliverydate,
        o.status,
        COUNT(od.orderid) as item_count,
        COALESCE(SUM(od.itemprice * od.qtyordered), 0) as total_amount
      FROM orders o
      JOIN customers c ON o.customerid = c.customerid
      LEFT JOIN order_details od ON o.orderid = od.orderid
      WHERE o.deliverydate >= CURRENT_DATE
        AND o.deliverydate <= CURRENT_DATE + INTERVAL '7 days'
        AND o.status IN ('O', 'F')
      GROUP BY c.firstname, c.lastname, c.phonenumber, o.orderid, o.deliverydate, o.status
      ORDER BY o.deliverydate
    `;
    
    return await db.getMany(query);
  }

    async getAllCustomers() {
        const query = `
            SELECT
                c.customerid,
                c.firstname,
                c.lastname,
                c.email,
                c.phonenumber,
                COALESCE(ca.loyalty_tier, 'BRONZE') as loyalty_tier,
                COALESCE(ca.total_spent, 0) as total_spent
            FROM customers c
            LEFT JOIN customer_analytics ca ON c.customerid = ca.customerid
            WHERE c.firstname IS NOT NULL AND c.email IS NOT NULL AND c.phonenumber IS NOT NULL
            ORDER BY COALESCE(ca.total_spent, 0) DESC
            LIMIT 100;
        `;
        return await db.getMany(query);
    }

    async getAllOrders() {
        const query = `
            SELECT o.orderid, o.customerid, c.firstname, c.lastname, o.status, o.orderdate, 
                   COALESCE(SUM(od.itemprice * od.qtyordered), 0) as total_amount
            FROM orders o
            JOIN customers c ON o.customerid = c.customerid
            LEFT JOIN order_details od ON o.orderid = od.orderid
            GROUP BY o.orderid, c.customerid, c.firstname, c.lastname
            ORDER BY o.orderdate DESC 
            LIMIT 100;
        `;
        return await db.getMany(query);
    }
  
  // Get delayed deliveries
  async getDelayedDeliveries() {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.phonenumber,
        o.orderid,
        o.deliverydate,
        o.status,
        (CURRENT_DATE - o.deliverydate) as days_delayed
      FROM orders o
      JOIN customers c ON o.customerid = c.customerid
      WHERE o.deliverydate < CURRENT_DATE
        AND o.status IN ('O', 'F')
      ORDER BY days_delayed DESC
    `;
    
    return await db.getMany(query);
  }
  
  // =====================================================
  // CROSS-SELLING QUERIES
  // =====================================================
  
  // Get customers who bought specific product and suggest companions
  async getCrossSellOpportunities(productId) {
    const query = `
      SELECT 
        c.customerid,
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        od1.productid as purchased_product,
        od2.productid as suggested_product,
        pp.confidence_score
      FROM customers c
      JOIN orders o ON c.customerid = o.customerid
      JOIN order_details od1 ON o.orderid = od1.orderid
      JOIN purchase_patterns pp ON od1.productid = pp.productid
      JOIN order_details od2 ON pp.companion_productid = od2.productid
      WHERE od1.productid = $1
        AND pp.confidence_score > 50
      ORDER BY pp.confidence_score DESC
    `;
    
    return await db.getMany(query, [productId]);
  }
  
  // =====================================================
  // RETENTION QUERIES
  // =====================================================
  
  // Get customers who haven't ordered recently
  async getInactiveCustomers() {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        ca.days_since_last_order,
        ca.total_spent,
        ca.loyalty_tier,
        ca.favorite_product_category
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE ca.days_since_last_order BETWEEN 30 AND 90
        AND ca.total_spent > 100
      ORDER BY ca.total_spent DESC
    `;
    
    return await db.getMany(query);
  }
  
  // =====================================================
  // REVENUE ANALYTICS QUERIES
  // =====================================================
  
  // Get top customers by revenue
  async getTopCustomers(limit = 20) {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        ca.total_spent,
        ca.total_orders,
        ca.loyalty_tier,
        ca.average_order_value
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE ca.total_spent > 0
      ORDER BY ca.total_spent DESC
      LIMIT $1
    `;
    
    return await db.getMany(query, [limit]);
  }
  
  // Get customers who recently upgraded loyalty tier
  async getRecentLoyaltyUpgrades() {
    const query = `
      SELECT 
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        ca.loyalty_tier,
        ca.total_spent,
        ca.last_order_date
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      WHERE ca.loyalty_tier IN ('GOLD', 'PLATINUM')
        AND ca.last_order_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY ca.total_spent DESC
    `;
    
    return await db.getMany(query);
  }
  
  // =====================================================
  // CAMPAIGN TRIGGER QUERIES
  // =====================================================
  
  // Get customers eligible for loyalty upgrade campaign
  async getLoyaltyUpgradeCandidates() {
    const query = `
      SELECT 
        c.customerid,
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        ca.total_spent,
        ca.loyalty_tier,
        lt.next_tier,
        (lt.min_spend - ca.total_spent) as amount_needed
      FROM customers c
      JOIN customer_analytics ca ON c.customerid = ca.customerid
      JOIN (
        SELECT 
          tier_name,
          LEAD(tier_name) OVER (ORDER BY min_spend) as next_tier,
          LEAD(min_spend) OVER (ORDER BY min_spend) as min_spend
        FROM loyalty_tiers
      ) lt ON ca.loyalty_tier = lt.tier_name
      WHERE ca.total_spent >= (lt.min_spend * 0.8)
        AND ca.last_order_date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY amount_needed
    `;
    
    return await db.getMany(query);
  }
  
  // Get customers for cross-selling campaign
  async getCrossSellCandidates() {
    const query = `
      SELECT 
        c.customerid,
        c.firstname,
        c.lastname,
        c.email,
        c.phonenumber,
        od.productid as purchased_product,
        pp.companion_product_name,
        pp.confidence_score
      FROM customers c
      JOIN orders o ON c.customerid = o.customerid
      JOIN order_details od ON o.orderid = od.orderid
      JOIN purchase_patterns pp ON od.productid = pp.productid
      WHERE o.orderdate >= CURRENT_DATE - INTERVAL '30 days'
        AND pp.confidence_score > 60
        AND NOT EXISTS (
          SELECT 1 FROM order_details od2 
          JOIN orders o2 ON od2.orderid = o2.orderid
          WHERE o2.customerid = c.customerid 
            AND od2.productid = pp.companion_productid
        )
      ORDER BY pp.confidence_score DESC
    `;
    
    return await db.getMany(query);
  }
  
  // =====================================================
  // PROACTIVE INTELLIGENCE QUERIES
  // =====================================================
  
  // Analyze customer patterns for proactive engagement
  async analyzeCustomerPatterns(customerId) {
    const patterns = {
      customer: await this.getCustomerByPhone(customerId),
      orders: await this.getCustomerOrders(customerId),
      loyalty: await this.checkLoyaltyUpgrade(customerId),
      categories: await this.getCustomerFavoriteCategories(customerId),
      riskScore: 0
    };
    
    // Calculate risk score based on inactivity
    if (patterns.customer && patterns.customer.days_since_last_order > 90) {
      patterns.riskScore = Math.min(100, patterns.customer.days_since_last_order / 2);
    }
    
    return patterns;
  }
  
  // Get product recommendations based on purchase history
  async getProductRecommendations(productId) {
    const recommendations = {
      frequentlyBoughtTogether: await this.getFrequentlyBoughtTogether(productId),
      crossSellOpportunities: await this.getCrossSellOpportunities(productId)
    };
    
    return recommendations;
  }
  
  // =====================================================
  // VERIFICATION QUERIES
  // =====================================================
  
  // Verify data integrity
  async verifyDataIntegrity() {
    const checks = {
      customers: await db.getOne('SELECT COUNT(*) as count FROM customers'),
      orders: await db.getOne('SELECT COUNT(*) as count FROM orders'),
      orderDetails: await db.getOne('SELECT COUNT(*) as count FROM order_details'),
      customerAnalytics: await db.getOne('SELECT COUNT(*) as count FROM customer_analytics'),
      productAnalytics: await db.getOne('SELECT COUNT(*) as count FROM product_analytics')
    };
    
    return checks;
  }
  
  // Test sample queries with real data
  async testSampleQueries() {
    const tests = {
      janiceByPhone: await this.getCustomerByPhone('407-288-6040'),
      janiceByEmail: await this.getCustomerByEmail('jdan4sure@yahoo.com'),
      janiceOrders: await this.getCustomerOrders('9318667506'),
      janiceOrderDetails: await this.getOrderDetails('0710544II27'),
      loyaltyUpgrade: await this.checkLoyaltyUpgrade('9318667506'),
      upcomingDeliveries: await this.getUpcomingDeliveries(),
      topCustomers: await this.getTopCustomers(5)
    };
    
    return tests;
  }
  
  // =====================================================
  // CHATBOT CONVERSATION HISTORY METHODS
  // =====================================================
  
  // Get or create conversation for a user on a platform
  async getOrCreateConversation(userIdentifier, platformType, sessionIdentifier = null) {
    try {
      // First try to get existing active conversation
      let conversation = await db.getOne(`
        SELECT conversation_id, user_identifier, platform_type, conversation_started_at, last_message_at
        FROM chatbot_conversations 
        WHERE user_identifier = $1 AND platform_type = $2 AND is_active = true
      `, [userIdentifier, platformType]);
      
      // If no active conversation exists, create a new one
      if (!conversation) {
        conversation = await db.getOne(`
          INSERT INTO chatbot_conversations (user_identifier, platform_type, session_identifier)
          VALUES ($1, $2, $3)
          RETURNING conversation_id, user_identifier, platform_type, conversation_started_at, last_message_at
        `, [userIdentifier, platformType, sessionIdentifier]);
        
        console.log(`📝 Created new conversation for ${userIdentifier} on ${platformType}`);
      }
      
      return conversation;
      
    } catch (error) {
      console.error(`❌ Error getting/creating conversation for ${userIdentifier}:`, error.message);
      throw error;
    }
  }
  
  // Get conversation history with messages
  async getConversationHistory(userIdentifier, platformType, limit = 50) {
    try {
      const conversation = await this.getOrCreateConversation(userIdentifier, platformType);
      
      if (!conversation) {
        return [];
      }
      
      const messages = await db.getMany(`
        SELECT 
          message_role,
          message_content,
          executed_function_name,
          function_input_parameters,
          function_output_result,
          function_execution_status,
          message_created_at
        FROM chatbot_messages 
        WHERE conversation_id = $1
        ORDER BY message_created_at ASC
        LIMIT $2
      `, [conversation.conversation_id, limit]);
      
      // Transform to format expected by AI agent
      return messages.map(msg => {
        const baseMessage = {
          role: msg.message_role === 'function_call' || msg.message_role === 'function_result' ? 'function' : msg.message_role,
          content: msg.message_content,
          timestamp: msg.message_created_at
        };
        
        // Add function data if present
        if (msg.executed_function_name) {
          baseMessage.function_name = msg.executed_function_name;
          baseMessage.function_arguments = msg.function_input_parameters;
          baseMessage.function_result = msg.function_output_result;
          baseMessage.function_status = msg.function_execution_status;
        }
        
        return baseMessage;
      });
      
    } catch (error) {
      console.error(`❌ Error getting conversation history for ${userIdentifier}:`, error.message);
      return [];
    }
  }
  
  // Save a message to conversation history
  async saveMessageToConversation(userIdentifier, platformType, messageRole, messageContent, functionData = null) {
    try {
      const conversation = await this.getOrCreateConversation(userIdentifier, platformType);
      
      const messageData = {
        conversation_id: conversation.conversation_id,
        message_role: messageRole,
        message_content: messageContent,
        executed_function_name: functionData?.name || null,
        function_input_parameters: functionData?.parameters || null,
        function_output_result: functionData?.result || null,
        function_execution_status: functionData?.status || null
      };
      
      const savedMessage = await db.getOne(`
        INSERT INTO chatbot_messages (
          conversation_id, 
          message_role, 
          message_content,
          executed_function_name,
          function_input_parameters,
          function_output_result,
          function_execution_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING message_id, message_created_at
      `, [
        messageData.conversation_id,
        messageData.message_role,
        messageData.message_content,
        messageData.executed_function_name,
        messageData.function_input_parameters,
        messageData.function_output_result,
        messageData.function_execution_status
      ]);
      
      console.log(`💬 Saved ${messageRole} message for ${userIdentifier} on ${platformType}`);
      return savedMessage;
      
    } catch (error) {
      console.error(`❌ Error saving message for ${userIdentifier}:`, error.message);
      throw error;
    }
  }
  
  // Save complete conversation history (batch operation)
  async saveConversationHistory(userIdentifier, platformType, messages) {
    try {
      const conversation = await this.getOrCreateConversation(userIdentifier, platformType);
      
      // Clear existing messages for this conversation (optional - for full replacement)
      // await db.query('DELETE FROM chatbot_messages WHERE conversation_id = $1', [conversation.conversation_id]);
      
      // Insert all messages
      for (const message of messages) {
        await this.saveMessageToConversation(
          userIdentifier, 
          platformType, 
          message.role, 
          message.content,
          message.function_name ? {
            name: message.function_name,
            parameters: message.function_arguments,
            result: message.function_result,
            status: message.function_status || 'success'
          } : null
        );
      }
      
      console.log(`💾 Saved ${messages.length} messages for ${userIdentifier} on ${platformType}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error saving conversation history for ${userIdentifier}:`, error.message);
      return false;
    }
  }
  
  // Get conversation statistics
  async getConversationStats() {
    try {
      const result = await db.getOne('SELECT * FROM chatbot_get_usage_statistics()');
      return result;
      
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error.message);
      return null;
    }
  }

  // =====================================================
  // ADMIN INBOX SUPPORT QUERIES
  // =====================================================
  
  // Ensure contacts/identities/link tables exist
  async ensureContactSchema() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS contacts (
          contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS contact_identities (
          identity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contact_id UUID NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
          identity_type VARCHAR(50) NOT NULL, -- 'email' | 'phone' | 'instagram' | 'facebook' | 'webchat_session'
          identity_value VARCHAR(255) NOT NULL,
          source VARCHAR(50),
          confidence NUMERIC(4,3) DEFAULT 1.0,
          verified BOOLEAN DEFAULT false,
          first_seen TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP DEFAULT NOW(),
          UNIQUE(identity_type, identity_value)
        );

        CREATE TABLE IF NOT EXISTS conversation_contact_links (
          conversation_id UUID NOT NULL REFERENCES chatbot_conversations(conversation_id) ON DELETE CASCADE,
          contact_id UUID NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
          linked_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(conversation_id)
        );
      `);
      return true;
    } catch (error) {
      console.error('❌ Error ensuring contact schema:', error.message);
      return false;
    }
  }

  // Ensure platform_users table exists
  async ensurePlatformUsersTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS platform_users (
          platform_user_id VARCHAR(255) NOT NULL,
          platform_type VARCHAR(50) NOT NULL,
          display_name VARCHAR(255),
          username VARCHAR(255),
          avatar_url TEXT,
          first_seen TIMESTAMP DEFAULT NOW(),
          last_seen TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (platform_user_id, platform_type)
        );
      `);
      return true;
    } catch (error) {
      console.error('❌ Error ensuring platform_users table:', error.message);
      return false;
    }
  }

  // Upsert a contact by identity
  async upsertContactWithIdentity(identityType, identityValue, fullName = null, source = 'inbox') {
    await this.ensureContactSchema();
    try {
      // Check if identity exists
      const existing = await db.getOne(`
        SELECT c.contact_id, c.full_name
        FROM contact_identities ci
        JOIN contacts c ON c.contact_id = ci.contact_id
        WHERE ci.identity_type = $1 AND ci.identity_value = $2
      `, [identityType, identityValue]);
      let contactId = existing?.contact_id || null;
      if (!contactId) {
        const created = await db.getOne(`
          INSERT INTO contacts(full_name) VALUES ($1) RETURNING contact_id
        `, [fullName]);
        contactId = created.contact_id;
        await db.query(`
          INSERT INTO contact_identities(contact_id, identity_type, identity_value, source, verified)
          VALUES ($1, $2, $3, $4, $5)
        `, [contactId, identityType, identityValue, source, identityType !== 'phone' ? true : false]);
      }
      return { contact_id: contactId };
    } catch (error) {
      console.error('❌ Error upserting contact with identity:', error.message);
      throw error;
    }
  }

  // Upsert platform user profile
  async upsertPlatformUser(platformType, platformUserId, { display_name = null, username = null, avatar_url = null } = {}) {
    await this.ensurePlatformUsersTable();
    try {
      await db.query(`
        INSERT INTO platform_users(platform_user_id, platform_type, display_name, username, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(platform_user_id, platform_type)
        DO UPDATE SET display_name = COALESCE(EXCLUDED.display_name, platform_users.display_name),
                      username = COALESCE(EXCLUDED.username, platform_users.username),
                      avatar_url = COALESCE(EXCLUDED.avatar_url, platform_users.avatar_url),
                      last_seen = NOW()
      `, [platformUserId, platformType, display_name, username, avatar_url]);
      return true;
    } catch (error) {
      console.error('❌ Error upserting platform user:', error.message);
      return false;
    }
  }

  // Link a conversation to a contact
  async linkConversationToContact(conversationId, contactId) {
    await this.ensureContactSchema();
    try {
      await db.query(`
        INSERT INTO conversation_contact_links(conversation_id, contact_id)
        VALUES ($1, $2)
        ON CONFLICT (conversation_id) DO UPDATE SET contact_id = EXCLUDED.contact_id, linked_at = NOW()
      `, [conversationId, contactId]);
      return true;
    } catch (error) {
      console.error('❌ Error linking conversation to contact:', error.message);
      throw error;
    }
  }

  // Lookup linked contact for a conversation
  async getLinkedContactForConversation(conversationId) {
    await this.ensureContactSchema();
    try {
      const row = await db.getOne(`
        SELECT c.contact_id, c.full_name
        FROM conversation_contact_links l
        JOIN contacts c ON c.contact_id = l.contact_id
        WHERE l.conversation_id = $1
      `, [conversationId]);
      return row || null;
    } catch (error) {
      console.error('❌ Error getting linked contact:', error.message);
      return null;
    }
  }

  // List recent conversations for a platform with last message preview
  async getRecentConversations(platformType = 'webchat', limit = 25) {
    console.log(`🔍 getRecentConversations(${platformType}, ${limit})`);
    try {
      await this.ensurePlatformUsersTable();
      console.log(`📊 Executing query for platform: ${platformType}`);
      const rows = await db.getMany(`
        SELECT 
          c.conversation_id,
          c.user_identifier,
          c.platform_type,
          c.conversation_started_at,
          c.last_message_at,
          (
            SELECT message_content 
            FROM chatbot_messages m 
            WHERE m.conversation_id = c.conversation_id 
            ORDER BY m.message_created_at DESC 
            LIMIT 1
          ) AS last_message_content,
          pu.display_name,
          pu.username,
          pu.avatar_url
        FROM chatbot_conversations c
        LEFT JOIN platform_users pu
          ON pu.platform_user_id = c.user_identifier AND pu.platform_type = c.platform_type
        WHERE c.platform_type = $1
        ORDER BY c.last_message_at DESC NULLS LAST, c.conversation_started_at DESC
        LIMIT $2
      `, [platformType, limit]);
      if (rows && rows.length > 0) {
        console.log(`✅ getRecentConversations with profiles: ${rows.length} rows for ${platformType}`);
        return rows;
      }
      // Fallback without profile join
      const fallback = await db.getMany(`
        SELECT 
          c.conversation_id,
          c.user_identifier,
          c.platform_type,
          c.conversation_started_at,
          c.last_message_at,
          (
            SELECT message_content 
            FROM chatbot_messages m 
            WHERE m.conversation_id = c.conversation_id 
            ORDER BY m.message_created_at DESC 
            LIMIT 1
          ) AS last_message_content
        FROM chatbot_conversations c
        WHERE c.platform_type = $1
        ORDER BY c.last_message_at DESC NULLS LAST, c.conversation_started_at DESC
        LIMIT $2
      `, [platformType, limit]);
      console.log(`✅ getRecentConversations fallback: ${fallback.length} rows for ${platformType}`);
      return fallback || [];
    } catch (error) {
      console.error(`❌ Error getRecentConversations(${platformType}):`, error.message, error.stack);
      // Last-chance fallback
      try {
        const fallback = await db.getMany(`
          SELECT 
            c.conversation_id,
            c.user_identifier,
            c.platform_type,
            c.conversation_started_at,
            c.last_message_at,
            (
              SELECT message_content 
              FROM chatbot_messages m 
              WHERE m.conversation_id = c.conversation_id 
              ORDER BY m.message_created_at DESC 
              LIMIT 1
            ) AS last_message_content
          FROM chatbot_conversations c
          WHERE c.platform_type = $1
          ORDER BY c.last_message_at DESC NULLS LAST, c.conversation_started_at DESC
          LIMIT $2
        `, [platformType, limit]);
        return fallback || [];
      } catch (e2) {
        console.error('❌ Error getRecentConversations fallback:', e2.message);
        return [];
      }
    }
  }

  // Get messages by conversation id
  async getMessagesByConversationId(conversationId, limit = 200, order = 'asc', tail = true) {
    try {
      const orderDir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      const useTail = tail === true || String(tail).toLowerCase() === 'true';
      let rows;
      if (useTail) {
        // Fetch last N messages and return in ascending order for natural chat reading
        rows = await db.getMany(`
          SELECT * FROM (
            SELECT 
              message_role,
              message_content,
              executed_function_name,
              function_input_parameters,
              function_output_result,
              function_execution_status,
              message_created_at
            FROM chatbot_messages
            WHERE conversation_id = $1
            ORDER BY message_created_at DESC
            LIMIT $2
          ) AS recent
          ORDER BY message_created_at ASC
        `, [conversationId, limit]);
      } else {
        rows = await db.getMany(`
          SELECT 
            message_role,
            message_content,
            executed_function_name,
            function_input_parameters,
            function_output_result,
            function_execution_status,
            message_created_at
          FROM chatbot_messages
          WHERE conversation_id = $1
          ORDER BY message_created_at ${orderDir}
          LIMIT $2
        `, [conversationId, limit]);
      }
      return rows || [];
    } catch (error) {
      console.error('❌ Error getMessagesByConversationId:', error.message);
      return [];
    }
  }

  // Get conversation metadata by id
  async getConversationById(conversationId) {
    try {
      const row = await db.getOne(`
        SELECT conversation_id, user_identifier, platform_type, conversation_started_at, last_message_at
        FROM chatbot_conversations
        WHERE conversation_id = $1
        LIMIT 1
      `, [conversationId]);
      return row || null;
    } catch (error) {
      console.error('❌ Error getConversationById:', error.message);
      return null;
    }
  }

  // Get webchat session row by session id
  async getWebchatSessionById(sessionId) {
    try {
      const row = await db.getOne(`
        SELECT session_id, device_fingerprint, user_agent, timezone, potential_matches, created_at, last_active
        FROM webchat_sessions
        WHERE session_id = $1
        LIMIT 1
      `, [sessionId]);
      return row || null;
    } catch (error) {
      console.error('❌ Error getWebchatSessionById:', error.message);
      return null;
    }
  }

  // Clean up old conversations
  async cleanupOldConversations(retentionDays = 90) {
    try {
      const result = await db.getOne('SELECT chatbot_cleanup_old_conversations($1) as deleted_count', [retentionDays]);
      console.log(`🧹 Cleaned up ${result.deleted_count} old conversations`);
      return result.deleted_count;
      
    } catch (error) {
      console.error('❌ Error cleaning up conversations:', error.message);
      return 0;
    }
  }
  
  // =====================================================
  // MAGENTO TOKEN MANAGEMENT
  // =====================================================
  
  // Get current valid Magento token from database
  async getMagentoToken() {
    try {
      const result = await db.getOne(`
        SELECT access_token, expires_at 
        FROM magento_tokens 
        WHERE service_name = 'magento_api' 
          AND is_active = true 
          AND expires_at > NOW()
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      if (result) {
        console.log('🔑 Valid Magento token found in database');
        return result.access_token;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting Magento token from database:', error.message);
      return null;
    }
  }
  
  // Store/update Magento token in database
  async storeMagentoToken(token) {
    try {
      const expiresAt = new Date(Date.now() + (50 * 60 * 1000)); // 50 minutes from now
      
      const result = await db.getOne(`
        INSERT INTO magento_tokens (service_name, access_token, expires_at)
        VALUES ('magento_api', $1, $2)
        ON CONFLICT (service_name) 
        DO UPDATE SET 
          access_token = EXCLUDED.access_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
        RETURNING id, expires_at
      `, [token, expiresAt]);
      
      console.log(`💾 Magento token stored in database, expires at: ${result.expires_at}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error storing Magento token in database:', error.message);
      throw error;
    }
  }
  
  // Check if token needs refresh (expires in next 5 minutes)
  async needsTokenRefresh() {
    try {
      const result = await db.getOne(`
        SELECT 
          CASE 
            WHEN expires_at <= NOW() + INTERVAL '5 minutes' THEN true
            ELSE false
          END as needs_refresh
        FROM magento_tokens 
        WHERE service_name = 'magento_api' 
          AND is_active = true
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      return result ? result.needs_refresh : true;
      
    } catch (error) {
      console.error('❌ Error checking token refresh status:', error.message);
      return true; // Assume refresh needed on error
    }
  }
  
  // Mark token as expired/inactive
  async expireMagentoToken() {
    try {
      await db.query(`
        UPDATE magento_tokens 
        SET is_active = false, updated_at = NOW()
        WHERE service_name = 'magento_api'
      `);
      
      console.log('🔄 Magento token marked as expired');
      
    } catch (error) {
      console.error('❌ Error expiring Magento token:', error.message);
    }
  }
  
  // Get token status for monitoring
  async getMagentoTokenStatus() {
    try {
      const result = await db.getOne(`
        SELECT 
          service_name,
          expires_at,
          created_at,
          updated_at,
          is_active,
          CASE 
            WHEN expires_at <= NOW() THEN 'expired'
            WHEN expires_at <= NOW() + INTERVAL '5 minutes' THEN 'expiring_soon'
            ELSE 'valid'
          END as status
        FROM magento_tokens 
        WHERE service_name = 'magento_api'
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error getting token status:', error.message);
      return null;
    }
  }

  // =====================================================
  // MAGENTO CATEGORIES CACHE (DB)
  // =====================================================

  async ensureMagentoCategoriesTable() {
    const createSql = `
      CREATE TABLE IF NOT EXISTS magento_categories (
        category_id INTEGER PRIMARY KEY,
        parent_id INTEGER NULL,
        name TEXT NOT NULL,
        path TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_magento_categories_name ON magento_categories (LOWER(name));
    `;
    await db.query(createSql);
  }

  async upsertMagentoCategories(categories) {
    // categories: array of {id, parent_id, name, path}
    if (!Array.isArray(categories) || categories.length === 0) return 0;
    await this.ensureMagentoCategoriesTable();
    const values = [];
    const placeholders = [];
    let i = 1;
    for (const c of categories) {
      placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
      values.push(Number(c.id) || null);
      values.push(c.parent_id != null ? Number(c.parent_id) : null);
      values.push(c.name || null);
      values.push(c.path || null);
    }
    const sql = `
      INSERT INTO magento_categories (category_id, parent_id, name, path)
      VALUES ${placeholders.join(',')}
      ON CONFLICT (category_id)
      DO UPDATE SET 
        parent_id = EXCLUDED.parent_id,
        name = EXCLUDED.name,
        path = EXCLUDED.path,
        updated_at = NOW()
      RETURNING category_id
    `;
    const res = await db.getMany(sql, values);
    return res.length;
  }

  async findMagentoCategoryIdByNameLike(nameLike) {
    const q = `
      SELECT category_id 
      FROM magento_categories
      WHERE LOWER(name) LIKE LOWER($1)
      ORDER BY LENGTH(name) ASC
      LIMIT 1
    `;
    const row = await db.getOne(q, [`%${nameLike}%`]);
    return row ? row.category_id : null;
  }

  async getAllMagentoCategories() {
    const q = `SELECT category_id, parent_id, name, path FROM magento_categories ORDER BY category_id`;
    return await db.getMany(q);
  }

  // =====================================================
  // INSTAGRAM ACCOUNTS (MULTI-TENANT)
  // =====================================================
  async getConnectedInstagramAccounts() {
    const q = `
      SELECT 
        client_id,
        client_name,
        instagram_business_account_id,
        (instagram_access_token_encrypted IS NOT NULL) AS has_token,
        status,
        last_active,
        created_at
      FROM client_integrations
      WHERE status IN ('active','trial')
      ORDER BY last_active DESC NULLS LAST, created_at DESC
    `;
    return await db.getMany(q);
  }

  // Generic query proxy for SELECT statements returning multiple rows
  async query(sql, params = []) {
    return await db.getMany(sql, params);
  }
}

module.exports = DatabaseService; 