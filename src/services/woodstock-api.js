const axios = require('axios');
require('dotenv').config();

// Base URL for all endpoints as specified in Technical Report
const API_BASE = process.env.WOODSTOCK_API_BASE || 'https://api.woodstockoutlet.com/public/index.php/april';

// API Endpoints configuration
const ENDPOINTS = {
  customerByPhone: '/GetCustomerByPhone',
  customerByEmail: '/GetCustomerByEmail', 
  ordersByCustomer: '/GetOrdersByCustomer',
  detailsByOrder: '/GetDetailsByOrder'
};

// Create axios instance with configuration
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: parseInt(process.env.WOODSTOCK_API_TIMEOUT) || 5000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Woodstock-Outlet-Chatbot/1.0.0'
  }
});

// Rate limiting configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.WOODSTOCK_API_RATE_LIMIT) || 100,
  requests: new Map()
};

// Rate limiting middleware
const checkRateLimit = (identifier) => {
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;
  
  if (!rateLimit.requests.has(identifier)) {
    rateLimit.requests.set(identifier, []);
  }
  
  const requests = rateLimit.requests.get(identifier);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= rateLimit.max) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimit.requests.set(identifier, recentRequests);
};

// API Functions as specified in Technical Report
const apiFunctions = [
  {
    name: "getCustomerByPhone",
    description: "Retrieve customer information by phone number",
    parameters: { phone: "string" },
    endpoint: ENDPOINTS.customerByPhone
  },
  {
    name: "getCustomerByEmail", 
    description: "Retrieve customer information by email address",
    parameters: { email: "string" },
    endpoint: ENDPOINTS.customerByEmail
  },
  {
    name: "getOrdersByCustomer",
    description: "Retrieve complete order history for a customer",
    parameters: { custid: "string" },
    endpoint: ENDPOINTS.ordersByCustomer
  },
  {
    name: "getDetailsByOrder",
    description: "Retrieve detailed line items for a specific order",
    parameters: { orderid: "string" },
    endpoint: ENDPOINTS.detailsByOrder
  }
];

// Enhanced Functions for CSV Analysis
const analysisFunctions = [
  {
    name: "analyzeCustomerPatterns",
    description: "Analyze customer purchase patterns from CSV data",
    parameters: { customerid: "string" }
  },
  {
    name: "getProductRecommendations", 
    description: "Generate product recommendations based on purchase history",
    parameters: { productid: "string" }
  }
];

// API Service Class
class WoodstockAPIService {
  
  // Get customer by phone number
  async getCustomerByPhone(phone) {
    try {
      checkRateLimit(`phone_${phone}`);
      
      const response = await apiClient.get(ENDPOINTS.customerByPhone, {
        params: { phone }
      });
      
      console.log(`✅ API Call: getCustomerByPhone(${phone}) - Success`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API Call: getCustomerByPhone(${phone}) - Error:`, error.message);
      throw new Error(`Failed to get customer by phone: ${error.message}`);
    }
  }
  
  // Get customer by email
  async getCustomerByEmail(email) {
    try {
      checkRateLimit(`email_${email}`);
      
      const response = await apiClient.get(ENDPOINTS.customerByEmail, {
        params: { email }
      });
      
      console.log(`✅ API Call: getCustomerByEmail(${email}) - Success`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API Call: getCustomerByEmail(${email}) - Error:`, error.message);
      throw new Error(`Failed to get customer by email: ${error.message}`);
    }
  }
  
  // Get orders by customer ID
  async getOrdersByCustomer(custid) {
    try {
      checkRateLimit(`customer_${custid}`);
      
      const response = await apiClient.get(ENDPOINTS.ordersByCustomer, {
        params: { custid }
      });
      
      console.log(`✅ API Call: getOrdersByCustomer(${custid}) - Success`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API Call: getOrdersByCustomer(${custid}) - Error:`, error.message);
      throw new Error(`Failed to get orders by customer: ${error.message}`);
    }
  }
  
  // Get order details by order ID
  async getDetailsByOrder(orderid) {
    try {
      checkRateLimit(`order_${orderid}`);
      
      const response = await apiClient.get(ENDPOINTS.detailsByOrder, {
        params: { orderid }
      });
      
      console.log(`✅ API Call: getDetailsByOrder(${orderid}) - Success`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ API Call: getDetailsByOrder(${orderid}) - Error:`, error.message);
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }
  
  // Get complete customer journey (combines multiple API calls)
  async getCustomerJourney(identifier, type = 'phone') {
    try {
      let customerData;
      
      // Step 1: Get customer information
      if (type === 'phone') {
        customerData = await this.getCustomerByPhone(identifier);
      } else if (type === 'email') {
        customerData = await this.getCustomerByEmail(identifier);
      } else {
        throw new Error('Invalid identifier type. Use "phone" or "email"');
      }
      
      if (!customerData.entry || customerData.entry.length === 0) {
        throw new Error('Customer not found');
      }
      
      const customer = customerData.entry[0];
      const customerId = customer.customerid;
      
      // Step 2: Get customer orders
      const ordersData = await this.getOrdersByCustomer(customerId);
      
      // Step 3: Get details for each order
      const ordersWithDetails = [];
      if (ordersData.entry && ordersData.entry.length > 0) {
        for (const order of ordersData.entry) {
          try {
            const detailsData = await this.getDetailsByOrder(order.orderid);
            ordersWithDetails.push({
              ...order,
              details: detailsData.entry || []
            });
          } catch (error) {
            console.warn(`Warning: Could not get details for order ${order.orderid}:`, error.message);
            ordersWithDetails.push({
              ...order,
              details: []
            });
          }
        }
      }
      
      return {
        customer,
        orders: ordersWithDetails,
        totalOrders: ordersWithDetails.length,
        totalSpent: ordersWithDetails.reduce((sum, order) => sum + parseFloat(order.sum || 0), 0)
      };
      
    } catch (error) {
      console.error(`❌ getCustomerJourney(${identifier}, ${type}) - Error:`, error.message);
      throw error;
    }
  }
  
  // Test all API endpoints with real data
  async testAPIEndpoints() {
    const testResults = {
      success: true,
      tests: []
    };
    
    try {
      // Test 1: GetCustomerByPhone with Janice Daniels
      console.log('🧪 Testing GetCustomerByPhone...');
      const phoneTest = await this.getCustomerByPhone('4072886040');
      testResults.tests.push({
        name: 'GetCustomerByPhone',
        status: 'PASS',
        data: phoneTest
      });
      
      // Test 2: GetCustomerByEmail with Janice Daniels
      console.log('🧪 Testing GetCustomerByEmail...');
      const emailTest = await this.getCustomerByEmail('jdan4sure@yahoo.com');
      testResults.tests.push({
        name: 'GetCustomerByEmail',
        status: 'PASS',
        data: emailTest
      });
      
      // Test 3: GetOrdersByCustomer with Janice Daniels
      console.log('🧪 Testing GetOrdersByCustomer...');
      const ordersTest = await this.getOrdersByCustomer('9318667506');
      testResults.tests.push({
        name: 'GetOrdersByCustomer',
        status: 'PASS',
        data: ordersTest
      });
      
      // Test 4: GetDetailsByOrder with Janice's sectional order
      console.log('🧪 Testing GetDetailsByOrder...');
      const detailsTest = await this.getDetailsByOrder('0710544II27');
      testResults.tests.push({
        name: 'GetDetailsByOrder',
        status: 'PASS',
        data: detailsTest
      });
      
      console.log('✅ All API tests passed successfully!');
      
    } catch (error) {
      testResults.success = false;
      testResults.error = error.message;
      console.error('❌ API tests failed:', error.message);
    }
    
    return testResults;
  }
  
  // Get available functions for function calling
  getAvailableFunctions() {
    return [...apiFunctions, ...analysisFunctions];
  }
}

module.exports = {
  WoodstockAPIService,
  apiFunctions,
  analysisFunctions,
  ENDPOINTS
}; 