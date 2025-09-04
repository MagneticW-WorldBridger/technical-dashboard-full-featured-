const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();
const path = require('path'); // Added for static file serving

// Import services
const { WoodstockAPIService } = require('./services/woodstock-api');
const DatabaseService = require('./services/database-service');
const ProactiveIntelligenceEngine = require('./services/proactive-intelligence');
const FunctionCallingSystem = require('./services/function-calling');
const AIAgent = require('./services/ai-agent');
const ConversationService = require('./services/conversation-service');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// LOGGING CONFIGURATION
// =====================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'woodstock-chatbot' },
  transports: [
    // Only use console transport in serverless environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// =====================================================
// STATIC FILE SERVING
// =====================================================

// Serve static files from public directory
app.use(express.static('public'));

// Serve the main frontend interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================================================
// UNIFIED PLATFORM ROUTES
// =============================================================================

// Main enterprise dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Module routes
app.get('/inbox', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-inbox-v2.html'));
});

app.get('/voice', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'voice', 'index.html'));
});

app.get('/automation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'automation', 'index.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'analytics', 'index.html'));
});

app.get('/pipeline', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'pipeline', 'index.html'));
});

app.get('/copilot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'modules', 'copilot', 'index.html'));
});

// =====================================================
// MIDDLEWARE CONFIGURATION
// =====================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://woodstockoutlet.com', 'https://api.woodstockoutlet.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// =====================================================
// SERVICE INITIALIZATION
// =====================================================

const apiService = new WoodstockAPIService();
const dbService = new DatabaseService();
const proactiveEngine = new ProactiveIntelligenceEngine();
const functionCalling = new FunctionCallingSystem();
const aiAgent = new AIAgent();
const conversationService = new ConversationService();

// =====================================================
// HEALTH CHECK ENDPOINTS
// =====================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Woodstock Outlet Chatbot',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

app.get('/health/detailed', async (req, res) => {
  try {
    const healthChecks = {
      database: 'unknown',
      api: 'unknown',
      proactive: 'unknown'
    };
    
    // Test database connection
    try {
      await dbService.verifyDataIntegrity();
      healthChecks.database = 'healthy';
    } catch (error) {
      healthChecks.database = 'unhealthy';
      logger.error('Database health check failed:', error);
    }
    
    // Test API connection
    try {
      await apiService.testAPIEndpoints();
      healthChecks.api = 'healthy';
    } catch (error) {
      healthChecks.api = 'unhealthy';
      logger.error('API health check failed:', error);
    }
    
    // Test proactive engine
    try {
      await proactiveEngine.runProactiveScenarios();
      healthChecks.proactive = 'healthy';
    } catch (error) {
      healthChecks.proactive = 'unhealthy';
      logger.error('Proactive engine health check failed:', error);
    }
    
    res.json({
      status: 'detailed',
      timestamp: new Date().toISOString(),
      checks: healthChecks
    });
    
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// =====================================================
// URL VALIDATION / RESOLUTION (Woodstock site)
// =====================================================

app.get('/api/magento/resolve-url', async (req, res) => {
  try {
    const { url_key, url_path, name, sku } = req.query;
    const host = 'https://www.woodstockoutlet.com';

    const ensureHtml = (s) => String(s || '').trim().replace(/^\/+/, '').replace(/"|'|%22/g, '').replace(/\.html$/i, '') + '.html';
    const make = (p) => new URL(p, host).toString();

    const candidates = [];
    if (url_key) candidates.push(make('/' + ensureHtml(url_key)));
    if (url_path) candidates.push(make('/' + ensureHtml(url_path)));
    if (url_key) candidates.push(make('/' + String(url_key).trim().replace(/^\/+/, '')));
    if (url_path) candidates.push(make('/' + String(url_path).trim().replace(/^\/+/, '')));
    const term = name || sku;
    if (term) candidates.push(make(`/catalogsearch/result/?q=${encodeURIComponent(term)}`));

    const results = [];
    const controller = new AbortController();
    const withTimeout = (ms) => setTimeout(() => controller.abort(), ms);
    for (const url of candidates) {
      let status = 0;
      let ok = false;
      const t = withTimeout(3500);
      try {
        let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        status = r.status;
        ok = [200, 301, 302].includes(r.status);
        if (!ok && r.status === 405) {
          // try GET when HEAD not allowed
          r = await fetch(url, { method: 'GET', redirect: 'follow' });
          status = r.status;
          ok = [200, 301, 302].includes(r.status);
        }
      } catch (e) {
        status = 0;
        ok = false;
      } finally {
        clearTimeout(t);
      }
      results.push({ url, status, ok });
      if (ok) {
        return res.json({ status: 'success', bestUrl: url, candidates: results });
      }
    }
    // nothing validated; fall back to first candidate or host
    const best = results[0]?.url || host;
    return res.json({ status: 'fallback', bestUrl: best, candidates: results });
  } catch (error) {
    logger.error('resolve-url error:', error);
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

// =====================================================
// API ENDPOINTS - CORE FUNCTIONS
// =====================================================

// Get customer by phone
app.get('/api/customer/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const result = await functionCalling.getCustomerByPhone(phone);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Get customer by phone error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - ADMIN INBOX (WEBCHAT DEMO)
// =====================================================

// List recent conversations (webchat by default)
app.get('/api/inbox/conversations', async (req, res) => {
  try {
    const { platform = 'webchat', limit = 25 } = req.query;
    const rows = await dbService.getRecentConversations(platform, Math.min(parseInt(limit, 10) || 25, 200));
    res.json({ status: 'success', data: rows });
  } catch (error) {
    logger.error('Inbox conversations error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Get messages for a conversation id
app.get('/api/inbox/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 200 } = req.query;
    const rows = await dbService.getMessagesByConversationId(id, Math.min(parseInt(limit, 10) || 200, 500));
    res.json({ status: 'success', data: rows });
  } catch (error) {
    logger.error('Inbox messages error:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Get customer by email
app.get('/api/customer/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await functionCalling.getCustomerByEmail(email);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Get customer by email error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get orders by customer
app.get('/api/orders/customer/:custid', async (req, res) => {
  try {
    const { custid } = req.params;
    const result = await functionCalling.getOrdersByCustomer(custid);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Get orders by customer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get order details
app.get('/api/orders/:orderid/details', async (req, res) => {
  try {
    const { orderid } = req.params;
    const result = await functionCalling.getDetailsByOrder(orderid);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Get order details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - PROACTIVE INTELLIGENCE
// =====================================================

// Order confirmation and cross-sell
app.post('/api/proactive/order-confirmation', async (req, res) => {
  try {
    const { identifier, type = 'phone' } = req.body;
    
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing required parameter: identifier'
      });
    }
    
    const result = await functionCalling.handleOrderConfirmationAndCrossSell(identifier, type);
    res.json(result);
    
  } catch (error) {
    logger.error('Order confirmation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Support escalation
app.post('/api/proactive/support-escalation', async (req, res) => {
  try {
    const { identifier, issueDescription, type = 'phone' } = req.body;
    
    if (!identifier || !issueDescription) {
      return res.status(400).json({
        error: 'Missing required parameters: identifier, issueDescription'
      });
    }
    
    const result = await functionCalling.handleSupportEscalation(identifier, issueDescription, type);
    res.json(result);
    
  } catch (error) {
    logger.error('Support escalation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Loyalty upgrade
app.post('/api/proactive/loyalty-upgrade', async (req, res) => {
  try {
    const { identifier, type = 'phone' } = req.body;
    
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing required parameter: identifier'
      });
    }
    
    const result = await functionCalling.handleLoyaltyUpgrade(identifier, type);
    res.json(result);
    
  } catch (error) {
    logger.error('Loyalty upgrade error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Product recommendations
app.post('/api/proactive/product-recommendations', async (req, res) => {
  try {
    const { identifier, type = 'phone' } = req.body;
    
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing required parameter: identifier'
      });
    }
    
    const result = await functionCalling.handleProductRecommendations(identifier, type);
    res.json(result);
    
  } catch (error) {
    logger.error('Product recommendations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - ANALYTICS
// =====================================================

// Get customer analytics
app.get('/api/analytics/customer/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const type = isNaN(parseInt(identifier.charAt(0))) ? 'email' : 'phone';
        const result = await functionCalling.getCustomerAnalytics(identifier, type);
        res.json(result);
    } catch (error) {
        logger.error('Get customer analytics error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await dbService.getAllCustomers();
        res.json({ status: 'success', data: customers });
    } catch (error) {
        logger.error('Get all customers error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await dbService.getAllOrders();
        res.json({ status: 'success', data: orders });
    } catch (error) {
        logger.error('Get all orders error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Analyze customer patterns
app.get('/api/analytics/patterns/:customerid', async (req, res) => {
  try {
    const { customerid } = req.params;
    const result = await functionCalling.analyzeCustomerPatterns(customerid);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Analyze customer patterns error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get product recommendations
app.get('/api/analytics/recommendations/:productid', async (req, res) => {
  try {
    const { productid } = req.params;
    const result = await functionCalling.getProductRecommendations(productid);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
    
  } catch (error) {
    logger.error('Get product recommendations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// MAGENTO TOKEN MONITORING ENDPOINTS
// =====================================================

// Get Magento token status
app.get('/api/magento/token/status', async (req, res) => {
  try {
    const tokenStatus = await dbService.getMagentoTokenStatus();
    
    if (tokenStatus) {
      res.json({
        status: 'success',
        data: tokenStatus
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'No Magento token found in database'
      });
    }
    
  } catch (error) {
    logger.error('Magento token status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Force refresh Magento token
app.post('/api/magento/token/refresh', async (req, res) => {
  try {
    const newToken = await functionCalling.getMagentoToken(true);
    const tokenStatus = await dbService.getMagentoTokenStatus();
    
    res.json({
      status: 'success',
      message: 'Magento token refreshed successfully',
      data: tokenStatus
    });
    
  } catch (error) {
    logger.error('Magento token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - FUNCTION CALLING
// =====================================================

// Get available functions
app.get('/api/functions', (req, res) => {
  try {
    const functions = functionCalling.getAvailableFunctions();
    res.json({
      status: 'success',
      functions,
      total: functions.length
    });
  } catch (error) {
    logger.error('Get available functions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Execute function
app.post('/api/functions/execute', async (req, res) => {
  try {
    const { functionName, parameters } = req.body;
    
    if (!functionName) {
      return res.status(400).json({
        error: 'Missing required parameter: functionName'
      });
    }
    
    const result = await functionCalling.executeFunction(functionName, parameters || {});
    res.json(result);
    
  } catch (error) {
    logger.error('Execute function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - PROACTIVE CAMPAIGNS
// =====================================================

// Run proactive scenarios
app.post('/api/proactive/run-campaigns', async (req, res) => {
  try {
    const result = await proactiveEngine.runProactiveScenarios();
    res.json(result);
    
  } catch (error) {
    logger.error('Run proactive campaigns error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get delivery updates
app.get('/api/proactive/delivery-updates', async (req, res) => {
  try {
    const result = await proactiveEngine.handleDeliveryUpdates();
    res.json(result);
    
  } catch (error) {
    logger.error('Get delivery updates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get customer retention campaigns
app.get('/api/proactive/retention-campaigns', async (req, res) => {
  try {
    const result = await proactiveEngine.handleCustomerRetention();
    res.json(result);
    
  } catch (error) {
    logger.error('Get retention campaigns error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get issue resolutions
app.get('/api/proactive/issue-resolutions', async (req, res) => {
  try {
    const result = await proactiveEngine.handleIssueResolution();
    res.json(result);
    
  } catch (error) {
    logger.error('Get issue resolutions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get loyalty activations
app.get('/api/proactive/loyalty-activations', async (req, res) => {
  try {
    const result = await proactiveEngine.handleLoyaltyActivation();
    res.json(result);
    
  } catch (error) {
    logger.error('Get loyalty activations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// API ENDPOINTS - THE BRAIN WITH MEMORY & IDENTITY
// =====================================================

// Load contact identity service
const ContactIdentityService = require('./services/contact-identity-service');
let contactIdentityService = null;

// Initialize contact identity service with error handling
async function initializeContactIdentityService() {
    if (!contactIdentityService) {
        try {
            contactIdentityService = new ContactIdentityService();
            await contactIdentityService.ensureWebchatSessionsTable();
            console.log('✅ Contact identity service initialized');
        } catch (error) {
            console.error('❌ Error initializing contact identity service:', error.message);
            contactIdentityService = null;
        }
    }
    return contactIdentityService;
}

app.post('/api/chat', async (req, res) => {
    const { history, sessionId, browserContext } = req.body;

    if (!history) {
        return res.status(400).json({ error: 'Chat history is required.' });
    }

    try {
        // Step 1: Initialize contact identity service safely
        const identityService = await initializeContactIdentityService();
        
        // Step 2: Handle session management with identity awareness
        let effectiveSessionId = sessionId;
        let sessionContext = null;

        if (!effectiveSessionId) {
            if (identityService) {
                // Create new enhanced session with contact awareness
                sessionContext = await identityService.createEnhancedSession(browserContext || {});
                effectiveSessionId = sessionContext.sessionId;
                console.log(`🆕 Created new session: ${effectiveSessionId}`);
            } else {
                // Fallback session ID generation
                effectiveSessionId = `webchat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                console.log(`🔄 Fallback session created: ${effectiveSessionId}`);
            }
        } else {
            console.log(`🔄 Using existing session: ${effectiveSessionId}`);
        }

        // Step 2: Get existing conversation history from database
        let dbHistory = [];
        try {
            dbHistory = await getConversationHistory(effectiveSessionId, 'webchat');
            console.log(`📚 Retrieved ${dbHistory.length} messages from database`);
        } catch (dbError) {
            console.warn('⚠️ Could not retrieve conversation history:', dbError.message);
        }

        // Step 3: Merge database history with incoming frontend history
        const mergedHistory = await mergeConversationHistories(dbHistory, history);
        console.log(`🔄 Merged history: ${mergedHistory.length} total messages`);

        // Step 4: Process with AI Agent
        const stream = await aiAgent.run(mergedHistory);
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        let fullResponse = '';
        let pendingToolCalls = new Map();
        let executedFunctions = []; // Track function calls for identity enrichment
        let updatedHistory = [...mergedHistory]; // Track complete conversation
        
        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            
            // Handle content
            if (choice?.delta?.content) {
                const content = choice.delta.content;
                fullResponse += content;
                res.write(content);
            }
            
            // Handle function calls (accumulate until complete)
            if (choice?.delta?.tool_calls) {
                const toolCalls = choice.delta.tool_calls;
                for (const toolCall of toolCalls) {
                    if (toolCall.index !== undefined) {
                        const index = toolCall.index;
                        
                        // Initialize or get existing tool call
                        if (!pendingToolCalls.has(index)) {
                            pendingToolCalls.set(index, {
                                id: toolCall.id || '',
                                type: toolCall.type || 'function',
                                function: {
                                    name: '',
                                    arguments: ''
                                }
                            });
                        }
                        
                        const pending = pendingToolCalls.get(index);
                        
                        // Accumulate function data
                        if (toolCall.function) {
                            if (toolCall.function.name) {
                                pending.function.name += toolCall.function.name;
                            }
                            if (toolCall.function.arguments) {
                                pending.function.arguments += toolCall.function.arguments;
                            }
                        }
                    }
                }
            }
            
            // Check if we have a finish reason, execute any complete function calls
            if (choice?.finish_reason === 'tool_calls') {
                for (const [index, toolCall] of pendingToolCalls) {
                    if (toolCall.function.name && toolCall.function.arguments) {
                        logger.info(`🔧 Executing function: ${toolCall.function.name}`);
                        console.log(`🔧 Function args:`, toolCall.function.arguments);
                        
                        try {
                            const functionResult = await functionCalling.executeFunction(
                                toolCall.function.name, 
                                JSON.parse(toolCall.function.arguments)
                            );

                            // Store function call for identity enrichment
                            executedFunctions.push({
                                function_name: toolCall.function.name,
                                function_arguments: toolCall.function.arguments,
                                function_result: JSON.stringify(functionResult),
                                timestamp: new Date()
                            });

                            // Add tool call and result to conversation history (OpenAI standard)
                            updatedHistory.push({
                                role: 'assistant',
                                content: null,
                                tool_calls: [toolCall]
                            });
                            updatedHistory.push({
                                role: 'tool',
                                content: JSON.stringify(functionResult),
                                tool_call_id: toolCall.id
                            });
                            
                            // Always format function results for frontend component rendering
                            const resultText = `\n\n**Function Result (${toolCall.function.name}):**\n${JSON.stringify(functionResult, null, 2)}\n\n`;
                            res.write(resultText);
                            fullResponse += resultText;
                        } catch (funcError) {
                            logger.error(`Function execution error: ${toolCall.function.name}`, funcError);
                            const errorText = `\n\n**Function Error (${toolCall.function.name}):** ${funcError.message}\n\n`;
                            res.write(errorText);
                            fullResponse += errorText;

                            // Still add error to conversation history
                            updatedHistory.push({
                                role: 'tool',
                                content: JSON.stringify({ error: funcError.message }),
                                tool_call_id: toolCall.id
                            });
                        }
                    }
                }
                pendingToolCalls.clear();
            }
        }

        // Add final assistant response to history
        if (fullResponse.trim()) {
            updatedHistory.push({
                role: 'assistant',
                content: fullResponse
            });
        }

        // Step 5: Save conversation with identity enrichment
        try {
            await saveConversationHistory(effectiveSessionId, 'webchat', updatedHistory);
            console.log(`💾 Saved conversation: ${updatedHistory.length} messages`);

            // Step 6: Enrich identity from conversation content
            if (identityService && (executedFunctions.length > 0 || fullResponse.length > 0)) {
                try {
                    const lastUserMessage = history[history.length - 1]?.content || '';
                    const identityEnrichment = await identityService.enrichIdentityFromConversation(
                        effectiveSessionId, 
                        lastUserMessage, 
                        executedFunctions
                    );

                    if (identityEnrichment?.requiresConfirmation) {
                        console.log(`🤖 High confidence match found - should request confirmation`);
                        // TODO: Add confirmation prompt to next response
                    }
                } catch (enrichError) {
                    console.warn('⚠️ Identity enrichment failed:', enrichError.message);
                }
            }

        } catch (saveError) {
            console.error('❌ Error saving conversation:', saveError.message);
        }
        
        res.end();
        logger.info(`Chat response completed. Session: ${effectiveSessionId}, Length: ${fullResponse.length} chars`);

    } catch (error) {
        logger.error('Chat processing error:', error);
        res.status(500).json({ error: 'Failed to process chat message.' });
    }
});

// Helper function to merge conversation histories
async function mergeConversationHistories(dbHistory, frontendHistory) {
    // If no database history, return frontend history
    if (!dbHistory || dbHistory.length === 0) {
        return frontendHistory;
    }

    // If no frontend history, return database history
    if (!frontendHistory || frontendHistory.length === 0) {
        return dbHistory;
    }

    // Find the last timestamp in database history
    const lastDbMessage = dbHistory[dbHistory.length - 1];
    const lastDbTimestamp = lastDbMessage?.timestamp ? new Date(lastDbMessage.timestamp) : new Date(0);

    // Filter frontend history to only include messages newer than database
    const newFrontendMessages = frontendHistory.filter(msg => {
        // If message has no timestamp, include it (likely new)
        if (!msg.timestamp) return true;
        
        const msgTimestamp = new Date(msg.timestamp);
        return msgTimestamp > lastDbTimestamp;
    });

    // Combine database history with new frontend messages
    const merged = [...dbHistory, ...newFrontendMessages];
    
    console.log(`🔄 Merged: ${dbHistory.length} DB + ${newFrontendMessages.length} new = ${merged.length} total`);
    
    return merged;
}

// =====================================================
// API ENDPOINTS - TESTING
// =====================================================

// Test API endpoints
app.get('/api/test/endpoints', async (req, res) => {
  try {
    const result = await apiService.testAPIEndpoints();
    res.json(result);
    
  } catch (error) {
    logger.error('Test API endpoints error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test database queries
app.get('/api/test/database', async (req, res) => {
  try {
    const result = await dbService.testSampleQueries();
    res.json({
      status: 'success',
      data: result
    });
    
  } catch (error) {
    logger.error('Test database error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// FACEBOOK MESSENGER INTEGRATION
// =====================================================

// Facebook Messenger Integration
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'woodstock_verify_token_2024';

// Facebook Webhook Verification
app.get('/facebook-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
    console.log('✅ Facebook webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Facebook webhook verification failed');
    res.sendStatus(403);
  }
});

// Facebook Webhook Verification (API route)
app.get('/api/facebook-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
    console.log('✅ Facebook webhook verified (API route)');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Facebook webhook verification failed (API route)');
    res.sendStatus(403);
  }
});

// =====================================================
// UNIFIED MULTI-PLATFORM WEBHOOK
// =====================================================

// Instagram + Facebook Unified Webhook Verification
app.get('/api/webhook/unified', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log(`🔍 Unified webhook verification: mode=${mode}, token=${token}`);
  
  if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
    console.log('✅ Unified webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Unified webhook verification failed');
    res.sendStatus(403);
  }
});

// Instagram + Facebook Unified Webhook Handler
app.post('/api/webhook/unified', async (req, res) => {
  try {
    const { body } = req;
    console.log(`📱 Unified webhook received:`, JSON.stringify(body, null, 2));
    
    if (body.object === 'page') {
      // Facebook Messenger
      await handleFacebookMessage(body.entry, res);
    } else if (body.object === 'instagram') {
      // Instagram Business
      await handleInstagramMessage(body.entry, res);
    } else {
      console.warn(`❓ Unknown webhook object type: ${body.object}`);
      res.sendStatus(404);
      return;
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Unified webhook error:', error);
    res.sendStatus(500);
  }
});

// Instagram Message Handler
async function handleInstagramMessage(entries, res) {
  const InstagramBusinessService = require('./services/instagram-api-service');
  const instagramService = new InstagramBusinessService();
  
  for (const entry of entries) {
    const instagramAccountId = entry.id;
    console.log(`📱 Instagram message for account: ${instagramAccountId}`);
    
    // Multi-tenant lookup: Find client by Instagram Business Account ID
    const client = await instagramService.getClientByInstagramId(instagramAccountId);
    if (!client) {
      console.warn(`❌ No client found for Instagram account: ${instagramAccountId}`);
      continue;
    }
    
    console.log(`🔍 Found client: ${client.client_name} (${client.client_id})`);
    
    // Process Instagram messaging events
    if (entry.messaging) {
      for (const messageEvent of entry.messaging) {
        await processInstagramMessage(messageEvent, client);
      }
    }
  }
}

// Process individual Instagram message
async function processInstagramMessage(messageEvent, client) {
  try {
    const senderId = messageEvent.sender.id; // Instagram Scoped ID (IGSID)
    const message = messageEvent.message?.text || '';
    
    if (!message) {
      console.log(`📱 Non-text Instagram message from ${senderId}, skipping`);
      return;
    }
    
    console.log(`📱 Instagram message from ${senderId}: ${message}`);
    
    // Get or create conversation history with client context
    let conversationHistory = await getConversationHistory(senderId, 'instagram', client.client_id);
    
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      platform: 'instagram',
      client_id: client.client_id
    });
    
    // Process message with AI Agent
    const stream = await aiAgent.run(conversationHistory);
    
    let fullResponse = '';
    const pendingToolCalls = new Map();
    
    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (choice?.delta?.content) {
        const content = choice.delta.content;
        fullResponse += content;
      }
      if (choice?.delta?.tool_calls) {
        for (const toolCall of choice.delta.tool_calls) {
          if (!pendingToolCalls.has(toolCall.index)) {
            pendingToolCalls.set(toolCall.index, { ...toolCall, function: { arguments: '' } });
          }
          const pending = pendingToolCalls.get(toolCall.index);
          if (toolCall.function?.arguments) {
            pending.function.arguments += toolCall.function.arguments;
          }
        }
      }
      if (choice?.finish_reason === 'tool_calls') {
        // Execute tool calls
        for (const [index, toolCall] of pendingToolCalls) {
          try {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            
            console.log(`🔧 Instagram Function call: ${functionName} with args:`, args);
            
            const result = await functionCalling.executeFunction(functionName, args);
            
            // Add function result to conversation
            conversationHistory.push({
              role: 'assistant',
              content: `Function result: ${JSON.stringify(result)}`
            });
            
            // Send function result via Instagram API
            const InstagramBusinessService = require('./services/instagram-api-service');
            const instagramService = new InstagramBusinessService();
            await instagramService.sendMessage(senderId, `Function executed: ${functionName}`, client.access_token);
            
          } catch (error) {
            console.error(`❌ Instagram function execution error:`, error);
            const InstagramBusinessService = require('./services/instagram-api-service');
            const instagramService = new InstagramBusinessService();
            await instagramService.sendMessage(senderId, 'Sorry, there was an error processing your request.', client.access_token);
          }
        }
        pendingToolCalls.clear();
      }
    }
    
    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: fullResponse
    });
    
    // Save conversation history with client context
    await saveConversationHistory(senderId, 'instagram', conversationHistory, client.client_id);
    
    // Send response via Instagram API
    const InstagramBusinessService = require('./services/instagram-api-service');
    const instagramService = new InstagramBusinessService();
    await instagramService.sendMessage(senderId, fullResponse, client.access_token);
    
  } catch (error) {
    console.error('❌ Instagram message processing error:', error);
    const InstagramBusinessService = require('./services/instagram-api-service');
    const instagramService = new InstagramBusinessService();
    await instagramService.sendMessage(messageEvent.sender.id, 'Sorry, I encountered an error. Please try again.', client.access_token);
  }
}

// Legacy Facebook Webhook (maintain backward compatibility)
app.post('/facebook-webhook', async (req, res) => {
  try {
    const { body } = req;
    
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            const senderId = event.sender.id;
            const message = event.message.text;
            
            console.log(`📱 Facebook message from ${senderId}: ${message}`);
            
            // Get or create conversation history for this user
            let conversationHistory = await getConversationHistory(senderId, 'facebook');
            
            // Add user message to history
            conversationHistory.push({
              role: 'user',
              content: message
            });
            
            // Process with AI Agent
            try {
              const stream = await aiAgent.run(conversationHistory);
              let fullResponse = '';
              let pendingToolCalls = new Map();
              
              for await (const chunk of stream) {
                const choice = chunk.choices[0];
                if (choice?.delta?.content) {
                  const content = choice.delta.content;
                  fullResponse += content;
                }
                if (choice?.delta?.tool_calls) {
                  for (const toolCall of choice.delta.tool_calls) {
                    if (!pendingToolCalls.has(toolCall.index)) {
                      pendingToolCalls.set(toolCall.index, { ...toolCall, function: { arguments: '' } });
                    }
                    const pending = pendingToolCalls.get(toolCall.index);
                    if (toolCall.function?.arguments) {
                      pending.function.arguments += toolCall.function.arguments;
                    }
                  }
                }
                if (choice?.finish_reason === 'tool_calls') {
                  // Execute tool calls
                  for (const [index, toolCall] of pendingToolCalls) {
                    try {
                      const functionName = toolCall.function.name;
                      const args = JSON.parse(toolCall.function.arguments);
                      
                      console.log(`🔧 Facebook Function call: ${functionName} with args:`, args);
                      
                      const result = await functionCalling.executeFunction(functionName, args);
                      
                      // Add function result to conversation
                      conversationHistory.push({
                        role: 'assistant',
                        content: `Function result: ${JSON.stringify(result)}`
                      });
                      
                      // Send function result to Facebook
                      await sendFacebookMessage(senderId, `Function executed: ${functionName}`);
                      
                    } catch (error) {
                      console.error(`❌ Facebook function execution error:`, error);
                      await sendFacebookMessage(senderId, `Sorry, there was an error processing your request.`);
                    }
                  }
                  pendingToolCalls.clear();
                }
              }
              
              // Add AI response to history
              conversationHistory.push({
                role: 'assistant',
                content: fullResponse
              });
              
              // Save conversation history
              await saveConversationHistory(senderId, 'facebook', conversationHistory);
              
              // Send response to Facebook
              await sendFacebookMessage(senderId, fullResponse);
              
            } catch (error) {
              console.error('❌ Facebook AI processing error:', error);
              await sendFacebookMessage(senderId, 'Sorry, I encountered an error. Please try again.');
            }
          }
        }
      }
      
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Facebook webhook error:', error);
    res.sendStatus(500);
  }
});

// Facebook Webhook Message Handler (API route)
app.post('/api/facebook-webhook', async (req, res) => {
  try {
    const { body } = req;
    
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          if (event.message && event.message.text) {
            const senderId = event.sender.id;
            const message = event.message.text;
            
            console.log(`📱 Facebook message from ${senderId}: ${message} (API route)`);
            
            // Get or create conversation history for this user
            let conversationHistory = await getConversationHistory(senderId, 'facebook');
            
            // Add user message to history
            conversationHistory.push({
              role: 'user',
              content: message
            });
            
            // Process with AI Agent
            try {
              console.log('🤖 Running AI agent with history length:', conversationHistory.length);
              const availableTools = aiAgent.functionCalling.getAvailableFunctions();
              console.log('🔧 Available tools:', availableTools.length);
              
              const pendingToolCalls = [];
              let assistantResponse = null;
              
                             // Send request to AI agent
               const stream = await aiAgent.run(conversationHistory);
               
               // Process the stream from OpenAI (like webchat but collect full response)
               let fullContent = '';
               let pendingToolCallsMap = new Map(); // Store partial tool calls like webchat
               
               for await (const chunk of stream) {
                 const choice = chunk.choices[0];
                 
                 // Handle content
                 if (choice?.delta?.content) {
                   fullContent += choice.delta.content;
                 }
                 
                 // Handle function calls (accumulate until complete) - same as webchat
                 if (choice?.delta?.tool_calls) {
                   const toolCalls = choice.delta.tool_calls;
                   for (const toolCall of toolCalls) {
                     if (toolCall.index !== undefined) {
                       const index = toolCall.index;
                       
                       // Initialize or get existing tool call
                       if (!pendingToolCallsMap.has(index)) {
                         pendingToolCallsMap.set(index, {
                           id: toolCall.id || '',
                           type: toolCall.type || 'function',
                           function: {
                             name: '',
                             arguments: ''
                           }
                         });
                       }
                       
                       const pending = pendingToolCallsMap.get(index);
                       
                       // Accumulate function data
                       if (toolCall.function) {
                         if (toolCall.function.name) {
                           pending.function.name += toolCall.function.name;
                         }
                         if (toolCall.function.arguments) {
                           pending.function.arguments += toolCall.function.arguments;
                         }
                       }
                     }
                   }
                 }
                 
                 // Check if we have a finish reason, execute any complete function calls
                 if (choice?.finish_reason === 'tool_calls') {
                                      for (const [index, toolCall] of pendingToolCallsMap) {
                     if (toolCall.function.name && toolCall.function.arguments) {
                       try {
                         const functionName = toolCall.function.name;
                         const args = JSON.parse(toolCall.function.arguments);
                         
                         console.log(`🔧 Facebook Function call: ${functionName} with args:`, args);
                         
                         const result = await functionCalling.executeFunction(functionName, args);
                         conversationHistory.push({
                           role: 'assistant',
                           content: null,
                           tool_calls: [toolCall]
                         });
                         conversationHistory.push({
                           role: 'tool',
                           content: JSON.stringify(result),
                           tool_call_id: toolCall.id
                         });
                       } catch (toolError) {
                         console.error('❌ Facebook Tool execution error:', toolError);
                         conversationHistory.push({
                           role: 'tool',
                           content: JSON.stringify({ error: toolError.message }),
                           tool_call_id: toolCall.id
                         });
                       }
                     }
                   }
                  
                  // Get final response after tool execution
                  const finalStream = await aiAgent.run(conversationHistory);
                  let finalContent = '';
                  for await (const chunk of finalStream) {
                    if (chunk.choices[0]?.delta?.content) {
                      finalContent += chunk.choices[0].delta.content;
                    }
                  }
                  if (finalContent) {
                    assistantResponse = finalContent;
                  }
                  pendingToolCallsMap.clear();
                }
              }
               
              // Use text response if no tool calls
              if (!assistantResponse && fullContent) {
                assistantResponse = fullContent;
              }
              
              if (!assistantResponse) {
                assistantResponse = "¡Hola! ¿En qué puedo ayudarte hoy?";
              }
              
              // Add assistant response to history
              conversationHistory.push({
                role: 'assistant',
                content: assistantResponse
              });
              
              // Save updated conversation history
              await saveConversationHistory(senderId, 'facebook', conversationHistory);
              
              // Send response back to Facebook
              await sendFacebookMessage(senderId, assistantResponse);
              
            } catch (aiError) {
              console.error('❌ AI Agent error:', aiError);
              await sendFacebookMessage(senderId, "Lo siento, hubo un error procesando tu mensaje. ¿Puedes intentar de nuevo?");
            }
          }
        }
      }
      
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Facebook webhook error (API route):', error);
    res.sendStatus(500);
  }
});

// Send message to Facebook
async function sendFacebookMessage(recipientId, message) {
  try {
    console.log(`📤 Sending Facebook message to ${recipientId}: ${message}`);
    console.log(`🔑 Using token: ${FACEBOOK_PAGE_ACCESS_TOKEN ? 'Token exists' : 'NO TOKEN FOUND'}`);
    
    const requestBody = {
      recipient: { id: recipientId },
      message: { text: message },
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN
    };
    
    console.log(`📦 Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Facebook API error response: ${errorText}`);
      throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log(`✅ Facebook API response:`, responseData);
    console.log(`✅ Facebook message sent to ${recipientId}`);
  } catch (error) {
    console.error('❌ Facebook send message error:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// =====================================================
// CONVERSATION MANAGEMENT ENDPOINTS
// =====================================================

// Get conversation statistics
app.get('/api/conversation/stats', async (req, res) => {
  try {
    const stats = await conversationService.getConversationStats();
    
    if (!stats) {
      return res.status(500).json({
        error: 'Failed to retrieve conversation statistics'
      });
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Conversation stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// =====================================================
// CONVERSATION PERSISTENCE - REAL IMPLEMENTATION
// =====================================================

// Get conversation history using hybrid storage (PostgreSQL + Redis)
async function getConversationHistory(userId, platform) {
  try {
    // Use the conversation service for hybrid storage
    const history = await conversationService.getConversationHistory(userId, platform);
    console.log(`📚 Retrieved ${history.length} messages for ${userId} on ${platform}`);
    return history;
  } catch (error) {
    console.error(`❌ Error getting conversation history for ${userId}:`, error.message);
    return [];
  }
}

// Save conversation history using hybrid storage (PostgreSQL + Redis)
async function saveConversationHistory(userId, platform, history) {
  try {
    // Use the conversation service for hybrid storage
    const success = await conversationService.saveConversationHistory(userId, platform, history);
    
    if (success) {
      console.log(`💾 Saved ${history.length} messages for ${userId} on ${platform}`);
    } else {
      console.error(`❌ Failed to save conversation for ${userId} on ${platform}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Error saving conversation history for ${userId}:`, error.message);
    return false;
  }
}

// =====================================================
// ERROR HANDLING MIDDLEWARE
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api/conversation/stats',
      'GET /api/customer/phone/:phone',
      'GET /api/customer/email/:email',
      'GET /api/orders/customer/:custid',
      'GET /api/orders/:orderid/details',
      'POST /api/proactive/order-confirmation',
      'POST /api/proactive/support-escalation',
      'POST /api/proactive/loyalty-upgrade',
      'POST /api/proactive/product-recommendations',
      'GET /api/analytics/customer/:identifier',
      'GET /api/functions',
      'POST /api/functions/execute',
      'POST /api/chat',
      'GET /facebook-webhook',
      'POST /facebook-webhook',
      'GET /api/facebook-webhook',
      'POST /api/facebook-webhook'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// SERVER STARTUP
// =====================================================

const server = app.listen(PORT, () => {
  console.log(`🚀 Woodstock Outlet Chatbot Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/functions`);
  
  // Log startup information
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

module.exports = app; 