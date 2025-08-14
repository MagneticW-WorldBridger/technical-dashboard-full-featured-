const DatabaseService = require('./database-service');
const { WoodstockAPIService } = require('./woodstock-api');

class ProactiveIntelligenceEngine {
  constructor() {
    this.dbService = new DatabaseService();
    this.apiService = new WoodstockAPIService();
  }
  
  // =====================================================
  // SCENARIO 1: PROACTIVE ORDER CONFIRMATION & CROSS-SELL
  // =====================================================
  
  async handleOrderConfirmationAndCrossSell(customerIdentifier, type = 'phone') {
    try {
      console.log(`🎯 Scenario 1: Order Confirmation & Cross-Sell for ${customerIdentifier}`);
      
      // Step 1: Get customer journey from API
      const customerJourney = await this.apiService.getCustomerJourney(customerIdentifier, type);
      const customer = customerJourney.customer;
      const orders = customerJourney.orders;
      
      if (!orders || orders.length === 0) {
        return {
          scenario: 'Order Confirmation & Cross-Sell',
          status: 'no_orders',
          message: `Hi ${customer.firstname}, I don't see any recent orders in your account. Is there anything I can help you with today?`
        };
      }
      
      // Step 2: Find most recent order
      const recentOrder = orders[0];
      const orderDetails = recentOrder.details;
      
      // Step 3: Analyze purchase patterns for cross-selling
      const crossSellOpportunities = [];
      for (const detail of orderDetails) {
        if (detail.productid) {
          const recommendations = await this.dbService.getFrequentlyBoughtTogether(detail.productid);
          crossSellOpportunities.push(...recommendations);
        }
      }
      
      // Step 4: Generate response
      const deliveryDate = new Date(recentOrder.deliverydate);
      const isUpcoming = deliveryDate > new Date();
      
      let response = `Hi ${customer.firstname}! `;
      
      if (isUpcoming) {
        response += `Your ${recentOrder.orderid} order is scheduled for delivery on ${deliveryDate.toLocaleDateString()}. `;
      } else {
        response += `Your ${recentOrder.orderid} order has been delivered. `;
      }
      
      if (crossSellOpportunities.length > 0) {
        const topRecommendation = crossSellOpportunities[0];
        response += `I noticed you purchased some great items. Many customers also love our ${topRecommendation.companion_product_name} to complete their space. Would you like to see some matching options?`;
      }
      
      return {
        scenario: 'Order Confirmation & Cross-Sell',
        status: 'success',
        customer: customer,
        order: recentOrder,
        crossSellOpportunities: crossSellOpportunities.slice(0, 3),
        message: response
      };
      
    } catch (error) {
      console.error('❌ Scenario 1 Error:', error.message);
      return {
        scenario: 'Order Confirmation & Cross-Sell',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 2: AUTOMATED SUPPORT ESCALATION
  // =====================================================
  
  async handleSupportEscalation(customerIdentifier, issueDescription, type = 'phone') {
    try {
      console.log(`🎯 Scenario 2: Support Escalation for ${customerIdentifier}`);
      
      // Step 1: Get customer information
      const customerJourney = await this.apiService.getCustomerJourney(customerIdentifier, type);
      const customer = customerJourney.customer;
      const orders = customerJourney.orders;
      
      // Step 2: Analyze issue keywords
      const issueKeywords = this.analyzeIssueKeywords(issueDescription);
      const priority = this.determinePriority(issueKeywords);
      
      // Step 3: Create support ticket
      const ticketId = this.generateTicketId();
      const ticketData = {
        ticketId,
        customerId: customer.customerid,
        customerName: `${customer.firstname} ${customer.lastname}`,
        customerPhone: customer.phonenumber,
        issueDescription,
        priority,
        orders: orders.map(o => o.orderid),
        createdAt: new Date()
      };
      
      // Step 4: Generate response
      let response = `I'm very sorry to hear that, ${customer.firstname}. `;
      
      if (orders.length > 0) {
        const recentOrder = orders[0];
        response += `I can see your recent order ${recentOrder.orderid}. `;
      }
      
      response += `I've opened a ${priority} priority support ticket (#${ticketId}) and a member of our support team will contact you at ${customer.phonenumber} within the next 30 minutes to resolve this.`;
      
      return {
        scenario: 'Support Escalation',
        status: 'success',
        ticket: ticketData,
        priority,
        message: response
      };
      
    } catch (error) {
      console.error('❌ Scenario 2 Error:', error.message);
      return {
        scenario: 'Support Escalation',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 3: PROACTIVE LOYALTY & RETENTION
  // =====================================================
  
  async handleLoyaltyUpgrade(customerIdentifier, type = 'phone') {
    try {
      console.log(`🎯 Scenario 3: Loyalty Upgrade for ${customerIdentifier}`);
      
      // Step 1: Get customer analytics
      const customer = type === 'phone' 
        ? await this.dbService.getCustomerByPhone(customerIdentifier)
        : await this.dbService.getCustomerByEmail(customerIdentifier);
      
      if (!customer) {
        return {
          scenario: 'Loyalty Upgrade',
          status: 'customer_not_found',
          message: 'Customer not found in our system.'
        };
      }
      
      // Step 2: Check loyalty tier
      const loyaltyInfo = await this.dbService.checkLoyaltyUpgrade(customer.customerid);
      
      if (!loyaltyInfo) {
        return {
          scenario: 'Loyalty Upgrade',
          status: 'no_loyalty_data',
          message: `Hi ${customer.firstname}, I can see your order is confirmed. Thank you for choosing Woodstock Outlet!`
        };
      }
      
      // Step 3: Check if customer qualifies for upgrade
      const currentTier = loyaltyInfo.loyalty_tier;
      const nextTier = loyaltyInfo.next_tier;
      const amountNeeded = loyaltyInfo.amount_needed;
      
      let response = `Hi ${customer.firstname}, I can see your order is confirmed. `;
      
      if (amountNeeded <= 0) {
        // Customer has already qualified for next tier
        response += `Congratulations! This purchase has upgraded you to our ${nextTier} Member tier! This unlocks exclusive benefits, including ${this.getTierBenefits(nextTier)}. Welcome to the VIP club!`;
      } else if (amountNeeded <= 100) {
        // Customer is close to next tier
        response += `You're just $${amountNeeded.toFixed(2)} away from reaching our ${nextTier} Member tier! This would unlock ${this.getTierBenefits(nextTier)}. Would you like to see some items that could help you reach that goal?`;
      } else {
        // Customer has good spending but not close to upgrade
        response += `Thank you for being a valued ${currentTier} Member! You've spent $${loyaltyInfo.total_spent.toFixed(2)} with us so far.`;
      }
      
      return {
        scenario: 'Loyalty Upgrade',
        status: 'success',
        customer,
        loyaltyInfo,
        message: response
      };
      
    } catch (error) {
      console.error('❌ Scenario 3 Error:', error.message);
      return {
        scenario: 'Loyalty Upgrade',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 4: PROACTIVE PRODUCT RECOMMENDATIONS
  // =====================================================
  
  async handleProductRecommendations(customerIdentifier, type = 'phone') {
    try {
      console.log(`🎯 Scenario 4: Product Recommendations for ${customerIdentifier}`);
      
      // Step 1: Get customer purchase history
      const customer = type === 'phone' 
        ? await this.dbService.getCustomerByPhone(customerIdentifier)
        : await this.dbService.getCustomerByEmail(customerIdentifier);
      
      if (!customer) {
        return {
          scenario: 'Product Recommendations',
          status: 'customer_not_found',
          message: 'Customer not found in our system.'
        };
      }
      
      // Step 2: Get customer's favorite categories
      const favoriteCategories = await this.dbService.getCustomerFavoriteCategories(customer.customerid);
      
      // Step 3: Get recent orders for product analysis
      const recentOrders = await this.dbService.getCustomerOrders(customer.customerid);
      
      // Step 4: Generate recommendations based on purchase patterns
      const recommendations = [];
      
      for (const order of recentOrders.slice(0, 3)) { // Last 3 orders
        const orderDetails = await this.dbService.getOrderDetails(order.orderid);
        
        for (const detail of orderDetails) {
          if (detail.productid) {
            const productRecs = await this.dbService.getFrequentlyBoughtTogether(detail.productid);
            recommendations.push(...productRecs);
          }
        }
      }
      
      // Step 5: Generate response
      let response = `Hi ${customer.firstname}! `;
      
      if (favoriteCategories.length > 0) {
        const topCategory = favoriteCategories[0];
        response += `I noticed you love our ${topCategory.category} collection. `;
      }
      
      if (recommendations.length > 0) {
        const topRecommendation = recommendations[0];
        response += `Many customers who bought similar items also love our ${topRecommendation.companion_product_name}. Would you like to see our current selection?`;
      } else {
        response += `We have some great new arrivals that might interest you. Would you like to see our latest collection?`;
      }
      
      return {
        scenario: 'Product Recommendations',
        status: 'success',
        customer,
        favoriteCategories,
        recommendations: recommendations.slice(0, 5),
        message: response
      };
      
    } catch (error) {
      console.error('❌ Scenario 4 Error:', error.message);
      return {
        scenario: 'Product Recommendations',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 5: PROACTIVE DELIVERY UPDATES
  // =====================================================
  
  async handleDeliveryUpdates() {
    try {
      console.log(`🎯 Scenario 5: Delivery Updates`);
      
      // Step 1: Get upcoming deliveries
      const upcomingDeliveries = await this.dbService.getUpcomingDeliveries();
      
      const notifications = [];
      
      for (const delivery of upcomingDeliveries) {
        const deliveryDate = new Date(delivery.deliverydate);
        const daysUntilDelivery = Math.ceil((deliveryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDelivery <= 2) {
          const message = `Hi ${delivery.firstname}! Your order #${delivery.orderid} is scheduled for delivery ${daysUntilDelivery === 0 ? 'today' : `in ${daysUntilDelivery} day${daysUntilDelivery === 1 ? '' : 's'}`}. Our delivery team will contact you 30 minutes before arrival. Would you like delivery notifications?`;
          
          notifications.push({
            customer: {
              firstname: delivery.firstname,
              lastname: delivery.lastname,
              phonenumber: delivery.phonenumber
            },
            order: {
              orderid: delivery.orderid,
              deliverydate: delivery.deliverydate,
              total_amount: delivery.total_amount
            },
            message,
            daysUntilDelivery
          });
        }
      }
      
      return {
        scenario: 'Delivery Updates',
        status: 'success',
        notifications,
        totalNotifications: notifications.length
      };
      
    } catch (error) {
      console.error('❌ Scenario 5 Error:', error.message);
      return {
        scenario: 'Delivery Updates',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 6: PROACTIVE CUSTOMER RETENTION
  // =====================================================
  
  async handleCustomerRetention() {
    try {
      console.log(`🎯 Scenario 6: Customer Retention`);
      
      // Step 1: Get inactive customers
      const inactiveCustomers = await this.dbService.getInactiveCustomers();
      
      const retentionCampaigns = [];
      
      for (const customer of inactiveCustomers) {
        const daysInactive = customer.days_since_last_order;
        const totalSpent = customer.total_spent;
        
        let message = `Hi ${customer.firstname}! We miss you at Woodstock Outlet. `;
        
        if (customer.favorite_product_category) {
          message += `I noticed you haven't visited in a while, and we have new arrivals in your favorite ${customer.favorite_product_category} category. `;
        } else {
          message += `I noticed you haven't visited in a while, and we have some great new arrivals. `;
        }
        
        message += `Would you like to see our latest selection?`;
        
        retentionCampaigns.push({
          customer,
          daysInactive,
          totalSpent,
          message,
          priority: this.calculateRetentionPriority(daysInactive, totalSpent)
        });
      }
      
      return {
        scenario: 'Customer Retention',
        status: 'success',
        campaigns: retentionCampaigns,
        totalCampaigns: retentionCampaigns.length
      };
      
    } catch (error) {
      console.error('❌ Scenario 6 Error:', error.message);
      return {
        scenario: 'Customer Retention',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 7: PROACTIVE ISSUE RESOLUTION
  // =====================================================
  
  async handleIssueResolution() {
    try {
      console.log(`🎯 Scenario 7: Issue Resolution`);
      
      // Step 1: Get delayed deliveries
      const delayedDeliveries = await this.dbService.getDelayedDeliveries();
      
      const issueResolutions = [];
      
      for (const delivery of delayedDeliveries) {
        const daysDelayed = delivery.days_delayed;
        
        if (daysDelayed > 0) {
          const ticketId = this.generateTicketId();
          
          const message = `Hi ${delivery.firstname}, I wanted to let you know that your order #${delivery.orderid} delivery has been rescheduled to ensure the best possible service. I've created a support ticket (#${ticketId}) and our team will contact you with the new delivery time. Thank you for your patience!`;
          
          issueResolutions.push({
            customer: {
              firstname: delivery.firstname,
              lastname: delivery.lastname,
              phonenumber: delivery.phonenumber
            },
            order: {
              orderid: delivery.orderid,
              deliverydate: delivery.deliverydate,
              days_delayed: daysDelayed
            },
            ticketId,
            message,
            priority: daysDelayed > 7 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
      
      return {
        scenario: 'Issue Resolution',
        status: 'success',
        resolutions: issueResolutions,
        totalResolutions: issueResolutions.length
      };
      
    } catch (error) {
      console.error('❌ Scenario 7 Error:', error.message);
      return {
        scenario: 'Issue Resolution',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // SCENARIO 8: PROACTIVE LOYALTY PROGRAM ACTIVATION
  // =====================================================
  
  async handleLoyaltyActivation() {
    try {
      console.log(`🎯 Scenario 8: Loyalty Program Activation`);
      
      // Step 1: Get customers eligible for loyalty upgrade
      const loyaltyCandidates = await this.dbService.getLoyaltyUpgradeCandidates();
      
      const activations = [];
      
      for (const candidate of loyaltyCandidates) {
        const amountNeeded = candidate.amount_needed;
        const currentTier = candidate.loyalty_tier;
        const nextTier = candidate.next_tier;
        
        let message = `Congratulations ${candidate.firstname}! `;
        
        if (amountNeeded <= 0) {
          message += `You've just reached our ${nextTier} Member tier with your latest purchase! This unlocks exclusive benefits including ${this.getTierBenefits(nextTier)}. Welcome to the VIP club!`;
        } else {
          message += `You're just $${amountNeeded.toFixed(2)} away from reaching our ${nextTier} Member tier! This would unlock ${this.getTierBenefits(nextTier)}. Would you like to see some items that could help you reach that goal?`;
        }
        
        activations.push({
          customer: {
            firstname: candidate.firstname,
            lastname: candidate.lastname,
            email: candidate.email,
            phonenumber: candidate.phonenumber
          },
          loyalty: {
            currentTier,
            nextTier,
            totalSpent: candidate.total_spent,
            amountNeeded
          },
          message
        });
      }
      
      return {
        scenario: 'Loyalty Program Activation',
        status: 'success',
        activations,
        totalActivations: activations.length
      };
      
    } catch (error) {
      console.error('❌ Scenario 8 Error:', error.message);
      return {
        scenario: 'Loyalty Program Activation',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  
  analyzeIssueKeywords(description) {
    const keywords = {
      broken: ['broken', 'damaged', 'defective', 'not working'],
      delivery: ['delivery', 'shipping', 'arrival', 'when'],
      refund: ['refund', 'return', 'money back', 'cancel'],
      quality: ['quality', 'poor', 'cheap', 'disappointed'],
      service: ['service', 'support', 'help', 'assistance']
    };
    
    const foundKeywords = [];
    const lowerDescription = description.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lowerDescription.includes(word)) {
          foundKeywords.push(category);
          break;
        }
      }
    }
    
    return foundKeywords;
  }
  
  determinePriority(keywords) {
    if (keywords.includes('broken') || keywords.includes('quality')) {
      return 'HIGH';
    } else if (keywords.includes('delivery') || keywords.includes('service')) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
  
  generateTicketId() {
    return 'TICK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  getTierBenefits(tier) {
    const benefits = {
      'SILVER': '10% off all orders, priority support, early access to sales',
      'GOLD': '15% off all orders, VIP support, exclusive offers, free delivery',
      'PLATINUM': '20% off all orders, concierge support, exclusive events, free delivery & setup'
    };
    
    return benefits[tier] || 'standard benefits';
  }
  
  calculateRetentionPriority(daysInactive, totalSpent) {
    if (daysInactive > 120 && totalSpent > 1000) return 'HIGH';
    if (daysInactive > 90 && totalSpent > 500) return 'MEDIUM';
    return 'LOW';
  }
  
  // =====================================================
  // MAIN PROACTIVE INTELLIGENCE ENGINE
  // =====================================================
  
  async runProactiveScenarios() {
    console.log('🚀 Running Proactive Intelligence Engine...');
    
    const results = {
      timestamp: new Date(),
      scenarios: {}
    };
    
    try {
      // Run all 8 scenarios
      results.scenarios.scenario1 = await this.handleDeliveryUpdates();
      results.scenarios.scenario2 = await this.handleCustomerRetention();
      results.scenarios.scenario3 = await this.handleIssueResolution();
      results.scenarios.scenario4 = await this.handleLoyaltyActivation();
      
      console.log('✅ Proactive Intelligence Engine completed successfully');
      
    } catch (error) {
      console.error('❌ Proactive Intelligence Engine Error:', error.message);
      results.error = error.message;
    }
    
    return results;
  }
}

module.exports = ProactiveIntelligenceEngine; 