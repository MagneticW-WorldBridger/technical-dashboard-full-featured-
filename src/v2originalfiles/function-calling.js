const { WoodstockAPIService } = require('./woodstock-api');
const DatabaseService = require('./database-service');
const ProactiveIntelligenceEngine = require('./proactive-intelligence');

class FunctionCallingSystem {
  constructor() {
    this.apiService = new WoodstockAPIService();
    this.dbService = new DatabaseService();
    this.proactiveEngine = new ProactiveIntelligenceEngine();
    this.databaseService = new (require('./database-service'))();
  }
  
  // =====================================================
  // CORE API FUNCTIONS (4 Endpoints)
  // =====================================================
  
  async getCustomerByPhone(phone) {
    try {
      console.log(`🔧 Function Call: getCustomerByPhone(${phone})`);
      
      // Validate phone format
      if (!this.validatePhoneFormat(phone)) {
        throw new Error('Invalid phone number format');
      }
      
      const result = await this.apiService.getCustomerByPhone(phone);
      
      return {
        function: 'getCustomerByPhone',
        status: 'success',
        data: result,
        message: `Customer information retrieved for phone: ${phone}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getCustomerByPhone(${phone})`, error.message);
      return {
        function: 'getCustomerByPhone',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getCustomerByEmail(email) {
    try {
      console.log(`🔧 Function Call: getCustomerByEmail(${email})`);
      
      // Validate email format
      if (!this.validateEmailFormat(email)) {
        throw new Error('Invalid email format');
      }
      
      const result = await this.apiService.getCustomerByEmail(email);
      
      return {
        function: 'getCustomerByEmail',
        status: 'success',
        data: result,
        message: `Customer information retrieved for email: ${email}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getCustomerByEmail(${email})`, error.message);
      return {
        function: 'getCustomerByEmail',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getOrdersByCustomer(custid) {
    try {
      console.log(`🔧 Function Call: getOrdersByCustomer(${custid})`);
      
      // Validate customer ID format
      if (!this.validateCustomerIdFormat(custid)) {
        throw new Error('Invalid customer ID format');
      }
      
      const result = await this.apiService.getOrdersByCustomer(custid);
      
      return {
        function: 'getOrdersByCustomer',
        status: 'success',
        data: result,
        message: `Order history retrieved for customer: ${custid}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getOrdersByCustomer(${custid})`, error.message);
      return {
        function: 'getOrdersByCustomer',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getDetailsByOrder(orderid) {
    try {
      console.log(`🔧 Function Call: getDetailsByOrder(${orderid})`);
      
      // Validate order ID format
      if (!this.validateOrderIdFormat(orderid)) {
        throw new Error('Invalid order ID format');
      }
      
      const result = await this.apiService.getDetailsByOrder(orderid);
      
      return {
        function: 'getDetailsByOrder',
        status: 'success',
        data: result,
        message: `Order details retrieved for order: ${orderid}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getDetailsByOrder(${orderid})`, error.message);
      return {
        function: 'getDetailsByOrder',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // MAGENTO API FUNCTIONS (Product Information)
  // =====================================================
  
  async getMagentoToken(forceRefresh = false) {
    try {
      // First, check if we need to refresh the token
      if (!forceRefresh) {
        const existingToken = await this.dbService.getMagentoToken();
        if (existingToken) {
          console.log('🔑 Using valid Magento token from database');
          return existingToken;
        }
      }
      
      // Check if token needs refresh or is missing
      const needsRefresh = await this.dbService.needsTokenRefresh();
      if (!needsRefresh && !forceRefresh) {
        const token = await this.dbService.getMagentoToken();
        if (token) return token;
      }
      
      console.log('🔄 Refreshing Magento token from API...');
      
      // Generate new token from Magento API
      const response = await fetch('https://woodstockoutlet.com/rest/all/V1/integration/admin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: process.env.MAGENTO_USERNAME || 'jlasse@aiprlassist.com',
          password: process.env.MAGENTO_PASSWORD || 'bV38.O@3&/a{'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Magento token request failed: ${response.status}`);
      }
      
      const newToken = await response.json();
      const cleanToken = newToken.replace(/"/g, '');
      
      // Store the new token in database
      await this.dbService.storeMagentoToken(cleanToken);
      
      console.log('✅ Magento token refreshed and stored in database');
      return cleanToken;
      
    } catch (error) {
      console.error('❌ Magento token error:', error.message);
      throw error;
    }
  }
  
  async makeAuthenticatedMagentoRequest(url, options = {}) {
    try {
      const token = await this.getMagentoToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // If we get 401, token might be expired - mark as expired and try once with fresh token
      if (response.status === 401) {
        console.log('🔄 Token expired (401), marking as expired and refreshing...');
        await this.dbService.expireMagentoToken();
        const freshToken = await this.getMagentoToken(true);
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        
        return retryResponse;
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Authenticated Magento request error:', error.message);
      throw error;
    }
  }
  
  async getMagentoProductBySKU(sku) {
    try {
      console.log(`🔧 Function Call: getMagentoProductBySKU(${sku})`);
      
      const response = await this.makeAuthenticatedMagentoRequest(`https://woodstockoutlet.com/rest/V1/products/${sku}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Magento API error: ${response.status}`);
      }
      
      const product = await response.json();
      
      return {
        function: 'getMagentoProductBySKU',
        status: 'success',
        data: product,
        message: `Product details retrieved for SKU: ${sku}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getMagentoProductBySKU(${sku})`, error.message);
      return {
        function: 'getMagentoProductBySKU',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getMagentoProductByLoftID(loftId) {
    try {
      console.log(`🔧 Function Call: getMagentoProductByLoftID(${loftId})`);
      
      const token = await this.getMagentoToken();
      
      const searchParams = new URLSearchParams({
        'searchCriteria[filter_groups][0][filters][0][field]': 'pim_unique_id',
        'searchCriteria[filter_groups][0][filters][0][condition_type]': 'notnull',
        'searchCriteria[filter_groups][1][filters][0][field]': 'loft_id',
        'searchCriteria[filter_groups][1][filters][0][value]': loftId,
        'searchCriteria[filter_groups][1][filters][0][conditionType]': 'eq'
      });
      
      const response = await fetch(`https://woodstockoutlet.com/rest/V1/products?${searchParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Magento API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        function: 'getMagentoProductByLoftID',
        status: 'success',
        data: result,
        message: `Product details retrieved for Loft ID: ${loftId}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getMagentoProductByLoftID(${loftId})`, error.message);
      return {
        function: 'getMagentoProductByLoftID',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async searchMagentoProducts(
    query,
    pageSize = 20,
    categoryId = null,
    currentPage = 1,
    tokens = null,
    maxPrice = null,
    categoryName = null,
    materialLabels = null,
    minPrice = null,
    brandLabels = null,
    styleLabels = null,
    recliningLabels = null
  ) {
    try {
      console.log(`🔧 Function Call: searchMagentoProducts("${query}", ${pageSize})`);
      
      const token = await this.getMagentoToken();
 
       // Resolve categoryId from categoryName via DB first, then API tree fallback
       if (!categoryId && categoryName) {
         try {
           const dbCatId = await this.databaseService.findMagentoCategoryIdByNameLike(categoryName);
           if (dbCatId) categoryId = dbCatId;
         } catch {}
         try {
           const cats = await this.getMagentoCategories();
           const tree = cats.data;
           const needle = categoryName.toString().toLowerCase();
           const match = (node) => {
             if (!node) return null;
             const n = (node.name || '').toString().toLowerCase();
             if (n.includes(needle)) return node.id;
             if (Array.isArray(node.children_data)) {
               for (const child of node.children_data) {
                 const found = match(child);
                 if (found) return found;
               }
             }
             return null;
           };
           const resolved = match(tree);
           if (resolved) categoryId = resolved;
         } catch (e) {
           console.warn('⚠️ Unable to resolve category by name:', e.message);
         }
       }
       
       const searchParams = new URLSearchParams({
         'searchCriteria[pageSize]': pageSize.toString(),
         'searchCriteria[currentPage]': currentPage.toString(),
         // Only live, visible, with pim id
         'searchCriteria[filter_groups][0][filters][0][field]': 'pim_unique_id',
         'searchCriteria[filter_groups][0][filters][0][condition_type]': 'notnull',
         'searchCriteria[filter_groups][1][filters][0][field]': 'status',
         'searchCriteria[filter_groups][1][filters][0][value]': '2',
         'searchCriteria[filter_groups][1][filters][0][condition_type]': 'eq',
         'searchCriteria[filter_groups][2][filters][0][field]': 'visibility',
         'searchCriteria[filter_groups][2][filters][0][value]': '4',
         'searchCriteria[filter_groups][2][filters][0][condition_type]': 'eq'
       });
       
       // Build dynamic AND filters starting from group 3
       let nextGroup = 3;
 
       // Clean input
       const rawTokens = Array.isArray(tokens) ? tokens.filter(Boolean).map(t => t.toString().toLowerCase().trim()).filter(t => t.length > 0) : [];
 
       // Tokens that will be handled via attributes/categories and should not be AND'ed on name
       const handledTokens = new Set();
 
       // Material labels -> option IDs via attribute options
       const appendOptionFilters = async (attributeCode, labels) => {
         if (!Array.isArray(labels) || labels.length === 0) return false;
         try {
           const optsRes = await this.getMagentoAttributeOptions(attributeCode);
           const opts = optsRes.data || [];
           const wanted = new Set();
           for (const lab of labels) {
             const needle = (lab || '').toString().toLowerCase();
             for (const o of opts) {
               const lbl = (o.label || '').toString().toLowerCase();
               if (needle && lbl.includes(needle) && o.value) wanted.add(String(o.value));
             }
           }
           if (wanted.size > 0) {
             let idx = 0;
             for (const val of Array.from(wanted)) {
               searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][${idx}][field]`, attributeCode);
               searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][${idx}][value]`, val);
               searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][${idx}][condition_type]`, 'finset');
               idx++;
             }
             nextGroup++;
             return true;
           }
         } catch (e) {
           console.warn(`⚠️ Unable to map labels for ${attributeCode}:`, e.message);
         }
         return false;
       };
 
       // Apply attribute filters first
       if (await appendOptionFilters('material', materialLabels)) {
         handledTokens.add('leather');
         handledTokens.add('fabric');
       }
       await appendOptionFilters('brand', brandLabels);
       await appendOptionFilters('style', styleLabels);
       if (await appendOptionFilters('reclining_type', recliningLabels)) {
         handledTokens.add('reclining');
         handledTokens.add('power');
       }
 
       // Category by hints (e.g., Sectionals, Recliners) if not already resolved
       if (!categoryId && categoryName) {
         // already tried resolving above; nothing else here
       }
 
       if (categoryId) {
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][field]`, 'category_id');
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][value]`, String(categoryId));
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][condition_type]`, 'eq');
         nextGroup++;
         handledTokens.add('sectional'); // treat sectional as handled via category
       }
 
       if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][field]`, 'price');
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][value]`, String(minPrice));
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][condition_type]`, 'gteq');
         nextGroup++;
       }
       if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][field]`, 'price');
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][value]`, String(maxPrice));
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][condition_type]`, 'lteq');
         nextGroup++;
       }
 
       // If no explicit query but we have residual tokens, promote the first token as query for better recall
       if ((!query || String(query).trim().length === 0) && Array.isArray(rawTokens) && rawTokens.length > 0) {
         query = rawTokens[0];
       }

       // Primary query by name
       if (query) {
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][field]`, 'name');
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][value]`, `%${query}%`);
         searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][condition_type]`, 'like');
         nextGroup++;
       }
 
       // If primary query already targets recliner intent, do not require token 'recliner' again (prevents over-constraining AND)
       if (query && /reclin/i.test(String(query))) {
         handledTokens.add('recliner');
       }
       // Residual tokens for name LIKE (exclude handled ones)
       const residualTokens = rawTokens.filter(t => !handledTokens.has(t));
       if (residualTokens.length > 0) {
         for (const t of residualTokens) {
           searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][field]`, 'name');
           searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][value]`, `%${t}%`);
           searchParams.append(`searchCriteria[filter_groups][${nextGroup}][filters][0][condition_type]`, 'like');
           nextGroup++;
         }
       }
 
       const response = await fetch(`https://woodstockoutlet.com/rest/V1/products?${searchParams}`, {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         }
       });
 
       if (!response.ok) {
         throw new Error(`Magento API error: ${response.status}`);
       }
 
       const result = await response.json();
 
        return {
         function: 'searchMagentoProducts',
         status: 'success',
         data: result,
         message: `Found ${result.total_count || 0} products${query ? ` matching "${query}"` : ''}${categoryId ? ` in category ${categoryId}` : ''}${maxPrice ? ` under $${maxPrice}` : ''}${minPrice ? ` over $${minPrice}` : ''}`,
         query: query,
         categoryId: categoryId,
         pageSize: pageSize,
         currentPage: currentPage,
         tokens: rawTokens,
         maxPrice: maxPrice ?? null,
         categoryName: categoryName || null,
         materialLabels: materialLabels || [],
         minPrice: minPrice ?? null,
         brandLabels: brandLabels || [],
         styleLabels: styleLabels || [],
         recliningLabels: recliningLabels || []
       };
 
     } catch (error) {
       console.error(`❌ Function Call Error: searchMagentoProducts("${query}")`, error.message);
       return {
         function: 'searchMagentoProducts',
         status: 'error',
         error: error.message
       };
     }
   }
  
  
  async getMagentoCategories() {
    try {
      console.log(`🔧 Function Call: getMagentoCategories()`);
      
      const token = await this.getMagentoToken();
      
      const response = await fetch('https://woodstockoutlet.com/rest/V1/categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Magento API error: ${response.status}`);
      }
      
      const categories = await response.json();
      
      return {
        function: 'getMagentoCategories',
        status: 'success',
        data: categories,
        message: 'Product categories retrieved successfully'
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getMagentoCategories()`, error.message);
      return {
        function: 'getMagentoCategories',
        status: 'error',
        error: error.message
      };
    }
  }

  // Convenience: search by category name directly
  async searchMagentoByCategoryName(categoryName, pageSize = 20, currentPage = 1) {
    return await this.searchMagentoProducts(
      null,
      pageSize,
      null,
      currentPage,
      null,
      null,
      categoryName,
      null,
      null,
      null,
      null,
      null
    );
  }

  async refreshMagentoCategoriesCache() {
    const token = await this.getMagentoToken();
    const resp = await fetch('https://woodstockoutlet.com/rest/V1/categories', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!resp.ok) throw new Error(`Magento categories fetch failed: ${resp.status}`);
    const tree = await resp.json();
    const flat = [];
    const walk = (node, parentId = null) => {
      if (!node) return;
      flat.push({ id: node.id, parent_id: parentId, name: node.name, path: node.path });
      if (Array.isArray(node.children_data)) {
        for (const child of node.children_data) walk(child, node.id);
      }
    };
    walk(tree, null);
    const upserted = await this.databaseService.upsertMagentoCategories(flat);
    return { status: 'success', count: upserted };
  }

  // Fetch attribute options (e.g., brand, color) and cache them in-memory for the process lifetime
  async getMagentoAttributeOptions(code) {
    try {
      console.log(`🔧 Function Call: getMagentoAttributeOptions(${code})`);
      if (!this.__attributeOptionsCache) {
        this.__attributeOptionsCache = new Map();
      }
      if (this.__attributeOptionsCache.has(code)) {
        return {
          function: 'getMagentoAttributeOptions',
          status: 'success',
          data: this.__attributeOptionsCache.get(code),
          message: `Attribute options (cached) for ${code}`
        };
      }
      const token = await this.getMagentoToken();
      const url = `https://woodstockoutlet.com/rest/V1/products/attributes/${encodeURIComponent(code)}/options`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        throw new Error(`Magento API error: ${response.status}`);
      }
      const options = await response.json();
      this.__attributeOptionsCache.set(code, options);
      return {
        function: 'getMagentoAttributeOptions',
        status: 'success',
        data: options,
        message: `Attribute options fetched for ${code}`
      };
    } catch (error) {
      console.error(`❌ Function Call Error: getMagentoAttributeOptions(${code})`, error.message);
      return {
        function: 'getMagentoAttributeOptions',
        status: 'error',
        error: error.message
      };
    }
  }

  // Fetch media gallery by SKU
  async getMagentoProductMedia(sku) {
    try {
      console.log(`🔧 Function Call: getMagentoProductMedia(${sku})`);
      const token = await this.getMagentoToken();
      const url = `https://woodstockoutlet.com/rest/V1/products/${encodeURIComponent(sku)}/media`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        throw new Error(`Magento API error: ${response.status}`);
      }
      const media = await response.json();
      return {
        function: 'getMagentoProductMedia',
        status: 'success',
        data: media,
        message: `Media fetched for SKU: ${sku}`
      };
    } catch (error) {
      console.error(`❌ Function Call Error: getMagentoProductMedia(${sku})`, error.message);
      return {
        function: 'getMagentoProductMedia',
        status: 'error',
        error: error.message
      };
    }
  }

  // =====================================================
  // ENHANCED ANALYSIS FUNCTIONS (CSV Data)
  // =====================================================
  
  async analyzeCustomerPatterns(customerid) {
    try {
      console.log(`🔧 Function Call: analyzeCustomerPatterns(${customerid})`);
      
      // Validate customer ID format
      if (!this.validateCustomerIdFormat(customerid)) {
        throw new Error('Invalid customer ID format');
      }
      
      const patterns = await this.dbService.analyzeCustomerPatterns(customerid);
      
      return {
        function: 'analyzeCustomerPatterns',
        status: 'success',
        data: patterns,
        message: `Customer patterns analyzed for customer: ${customerid}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: analyzeCustomerPatterns(${customerid})`, error.message);
      return {
        function: 'analyzeCustomerPatterns',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getProductRecommendations(productid) {
    try {
      console.log(`🔧 Function Call: getProductRecommendations(${productid})`);
      
      // Validate product ID format
      if (!this.validateProductIdFormat(productid)) {
        throw new Error('Invalid product ID format');
      }
      
      const recommendations = await this.dbService.getProductRecommendations(productid);
      
      return {
        function: 'getProductRecommendations',
        status: 'success',
        data: recommendations,
        message: `Product recommendations generated for product: ${productid}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getProductRecommendations(${productid})`, error.message);
      return {
        function: 'getProductRecommendations',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // PROACTIVE INTELLIGENCE FUNCTIONS
  // =====================================================
  
  async handleOrderConfirmationAndCrossSell(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: handleOrderConfirmationAndCrossSell(${identifier}, ${type})`);
      
      const result = await this.proactiveEngine.handleOrderConfirmationAndCrossSell(identifier, type);
      
      return {
        function: 'handleOrderConfirmationAndCrossSell',
        status: 'success',
        data: result,
        message: result.message
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: handleOrderConfirmationAndCrossSell`, error.message);
      return {
        function: 'handleOrderConfirmationAndCrossSell',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async handleSupportEscalation(identifier, issueDescription, type = 'phone') {
    try {
      console.log(`🔧 Function Call: handleSupportEscalation(${identifier}, "${issueDescription}")`);
      
      const result = await this.proactiveEngine.handleSupportEscalation(identifier, issueDescription, type);
      
      return {
        function: 'handleSupportEscalation',
        status: 'success',
        data: result,
        message: result.message
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: handleSupportEscalation`, error.message);
      return {
        function: 'handleSupportEscalation',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async handleLoyaltyUpgrade(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: handleLoyaltyUpgrade(${identifier}, ${type})`);
      
      const result = await this.proactiveEngine.handleLoyaltyUpgrade(identifier, type);
      
      return {
        function: 'handleLoyaltyUpgrade',
        status: 'success',
        data: result,
        message: result.message
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: handleLoyaltyUpgrade`, error.message);
      return {
        function: 'handleLoyaltyUpgrade',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async handleProductRecommendations(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: handleProductRecommendations(${identifier}, ${type})`);
      
      const result = await this.proactiveEngine.handleProductRecommendations(identifier, type);
      
      return {
        function: 'handleProductRecommendations',
        status: 'success',
        data: result,
        message: result.message
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: handleProductRecommendations`, error.message);
      return {
        function: 'handleProductRecommendations',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // NEW COMPOSITE FUNCTIONS (Loft + Magento Integration)
  // =====================================================
  
  // Get complete customer product journey with Magento details
  async getCustomerProductJourney(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: getCustomerProductJourney(${identifier}, ${type})`);
      
      // Step 1: Get customer journey from Loft
      const loftJourney = await this.getCustomerJourney(identifier, type);
      
      if (loftJourney.status !== 'success' || !loftJourney.data.orders.length) {
        return {
          function: 'getCustomerProductJourney',
          status: 'error',
          error: 'No customer orders found for product journey'
        };
      }
      
      // Step 2: Enhance each order with Magento product details
      const enhancedOrders = [];
      for (const order of loftJourney.data.orders) {
        const enhancedDetails = [];
        
        for (const detail of order.details) {
          try {
            // Get Magento product details
            const magentoProduct = await this.getMagentoProductByLoftID(detail.productid);
            
            const enhancedDetail = {
              ...detail,
              magento_product: magentoProduct.status === 'success' ? {
                name: magentoProduct.data.items[0]?.name || detail.description,
                price: magentoProduct.data.items[0]?.price || detail.itemprice,
                brand: this.extractBrandFromMagento(magentoProduct.data.items[0]),
                features: this.extractFeaturesFromMagento(magentoProduct.data.items[0]),
                dimensions: this.extractDimensionsFromMagento(magentoProduct.data.items[0]),
                images_count: magentoProduct.data.items[0]?.media_gallery_entries?.length || 0
              } : null
            };
            
            enhancedDetails.push(enhancedDetail);
            
          } catch (error) {
            // If Magento fails, use Loft data only
            enhancedDetails.push({
              ...detail,
              magento_product: null
            });
          }
        }
        
        enhancedOrders.push({
          ...order,
          details: enhancedDetails
        });
      }
      
      return {
        function: 'getCustomerProductJourney',
        status: 'success',
        data: {
          ...loftJourney.data,
          orders: enhancedOrders,
          magento_integration: true
        },
        message: `Complete customer product journey retrieved for ${identifier}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getCustomerProductJourney(${identifier})`, error.message);
      return {
        function: 'getCustomerProductJourney',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // Get personalized product recommendations using Magento catalog
  async getPersonalizedProductRecommendations(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: getPersonalizedProductRecommendations(${identifier}, ${type})`);
      
      // Step 1: Get customer purchase patterns
      const customerData = type === 'phone' 
        ? await this.getCustomerByPhone(identifier)
        : await this.getCustomerByEmail(identifier);
        
      if (customerData.status !== 'success') {
        throw new Error('Customer not found');
      }
      
      const customerId = customerData.data.entry[0].customerid;
      const patterns = await this.analyzeCustomerPatterns(customerId);
      
      if (patterns.status !== 'success' || !patterns.data.categories.length) {
        return {
          function: 'getPersonalizedProductRecommendations',
          status: 'error',
          error: 'No purchase history for recommendations'
        };
      }
      
      // Step 2: Get Magento categories and search for similar products
      const recommendations = [];
      
      // Get top 2 favorite categories
      const topCategories = patterns.data.categories.slice(0, 2);
      
      for (const category of topCategories) {
        try {
          // Search Magento for products in this category
          const searchResults = await this.searchMagentoProducts(category.category.toLowerCase());
          
          if (searchResults.status === 'success' && searchResults.data.items) {
            const categoryRecommendations = searchResults.data.items.slice(0, 3).map(item => ({
              product_id: item.sku,
              name: item.name,
              price: item.price,
              category: category.category,
              reason: `Based on your ${category.category} purchases ($${category.total_spent})`,
              magento_details: {
                brand: this.extractBrandFromMagento(item),
                features: this.extractFeaturesFromMagento(item),
                image_url: item.media_gallery_entries?.[0]?.file || null
              }
            }));
            
            recommendations.push(...categoryRecommendations);
          }
        } catch (error) {
          console.warn(`Warning: Could not get recommendations for ${category.category}:`, error.message);
        }
      }
      
      return {
        function: 'getPersonalizedProductRecommendations',
        status: 'success',
        data: {
          customer: customerData.data.entry[0],
          purchase_patterns: patterns.data.categories,
          recommendations: recommendations,
          total_recommendations: recommendations.length
        },
        message: `${recommendations.length} personalized recommendations generated for ${identifier}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getPersonalizedProductRecommendations(${identifier})`, error.message);
      return {
        function: 'getPersonalizedProductRecommendations',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // Helper functions for Magento data extraction
  extractBrandFromMagento(item) {
    if (!item || !item.custom_attributes) return 'Unknown';
    const brandAttr = item.custom_attributes.find(attr => attr.attribute_code === 'brand');
    return brandAttr ? brandAttr.value : 'Unknown';
  }
  
  extractFeaturesFromMagento(item) {
    if (!item || !item.custom_attributes) return [];
    const featuresAttr = item.custom_attributes.find(attr => attr.attribute_code === 'features');
    return featuresAttr ? featuresAttr.value.split(',') : [];
  }
  
  extractDimensionsFromMagento(item) {
    if (!item || !item.custom_attributes) return {};
    const width = item.custom_attributes.find(attr => attr.attribute_code === 'width')?.value;
    const depth = item.custom_attributes.find(attr => attr.attribute_code === 'depth')?.value;
    const height = item.custom_attributes.find(attr => attr.attribute_code === 'height')?.value;
    
    return {
      width: width ? `${width}"` : null,
      depth: depth ? `${depth}"` : null,
      height: height ? `${height}"` : null
    };
  }

  // =====================================================
  // COMPOSITE FUNCTIONS (Multiple API Calls)
  // =====================================================
  
  async getCustomerJourney(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: getCustomerJourney(${identifier}, ${type})`);
      
      const result = await this.apiService.getCustomerJourney(identifier, type);
      
      return {
        function: 'getCustomerJourney',
        status: 'success',
        data: result,
        message: `Complete customer journey retrieved for ${type}: ${identifier}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getCustomerJourney`, error.message);
      return {
        function: 'getCustomerJourney',
        status: 'error',
        error: error.message
      };
    }
  }
  
  async getCustomerAnalytics(identifier, type = 'phone') {
    try {
      console.log(`🔧 Function Call: getCustomerAnalytics(${identifier}, ${type})`);
      
      // Get customer from database with analytics
      const customer = type === 'phone' 
        ? await this.dbService.getCustomerByPhone(identifier)
        : await this.dbService.getCustomerByEmail(identifier);
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Get additional analytics
      const orders = await this.dbService.getCustomerOrders(customer.customerid);
      const loyaltyInfo = await this.dbService.checkLoyaltyUpgrade(customer.customerid);
      const favoriteCategories = await this.dbService.getCustomerFavoriteCategories(customer.customerid);
      
      const analytics = {
        customer,
        orders,
        loyaltyInfo,
        favoriteCategories,
        riskScore: this.calculateRiskScore(customer.days_since_last_order, customer.total_spent)
      };
      
      return {
        function: 'getCustomerAnalytics',
        status: 'success',
        data: analytics,
        message: `Customer analytics retrieved for ${type}: ${identifier}`
      };
      
    } catch (error) {
      console.error(`❌ Function Call Error: getCustomerAnalytics`, error.message);
      return {
        function: 'getCustomerAnalytics',
        status: 'error',
        error: error.message
      };
    }
  }
  
  // =====================================================
  // VALIDATION FUNCTIONS
  // =====================================================
  
  validatePhoneFormat(phone) {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }
  
  validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  validateCustomerIdFormat(customerid) {
    // Customer IDs are typically alphanumeric strings
    return typeof customerid === 'string' && customerid.length > 0;
  }
  
  validateOrderIdFormat(orderid) {
    // Order IDs are typically alphanumeric strings
    return typeof orderid === 'string' && orderid.length > 0;
  }
  
  validateProductIdFormat(productid) {
    // Product IDs are typically alphanumeric strings
    return typeof productid === 'string' && productid.length > 0;
  }
  
  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  
  calculateRiskScore(daysSinceLastOrder, totalSpent) {
    let riskScore = 0;
    
    // Higher risk for longer inactivity
    if (daysSinceLastOrder > 90) riskScore += 40;
    else if (daysSinceLastOrder > 60) riskScore += 25;
    else if (daysSinceLastOrder > 30) riskScore += 10;
    
    // Lower risk for higher spenders
    if (totalSpent > 2000) riskScore -= 20;
    else if (totalSpent > 1000) riskScore -= 10;
    else if (totalSpent > 500) riskScore -= 5;
    
    return Math.max(0, Math.min(100, riskScore));
  }
  
  // =====================================================
  // FUNCTION REGISTRY
  // =====================================================
  
  getAvailableFunctions() {
    return [
      // Core API Functions
      {
        name: "searchMagentoByCategoryName",
        description: "Search Magento products by a human category name (maps to category_id automatically)",
        parameters: {
          type: "object",
          properties: {
            categoryName: { type: "string", description: "Category name, e.g., 'As Seen On TV'" },
            pageSize: { type: "number", description: "Page size (default 20)" },
            currentPage: { type: "number", description: "Page number (default 1)" }
          },
          required: ["categoryName"]
        },
        category: "magento"
      },
      {
        name: "getMagentoAttributeOptions",
        description: "Get attribute options (labels) for a given attribute code (e.g., brand, color)",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string", description: "Attribute code, e.g., brand, color" }
          },
          required: ["code"]
        },
        category: "magento"
      },
      {
        name: "getMagentoProductMedia",
        description: "Get media gallery for a product by SKU",
        parameters: {
          type: "object",
          properties: {
            sku: { type: "string", description: "Product SKU" }
          },
          required: ["sku"]
        },
        category: "magento"
      },
      {
        name: "getCustomerByPhone",
        description: "Retrieve customer information by phone number",
        parameters: {
          type: "object",
          properties: {
            phone: {
              type: "string",
              description: "Phone number to search for"
            }
          },
          required: ["phone"]
        },
        category: "api"
      },
      {
        name: "getCustomerByEmail",
        description: "Retrieve customer information by email address",
        parameters: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Email address to search for"
            }
          },
          required: ["email"]
        },
        category: "api"
      },
      {
        name: "getOrdersByCustomer",
        description: "Retrieve complete order history for a customer",
        parameters: {
          type: "object",
          properties: {
            custid: {
              type: "string",
              description: "Customer ID to search for"
            }
          },
          required: ["custid"]
        },
        category: "api"
      },
      {
        name: "getDetailsByOrder",
        description: "Retrieve detailed line items for a specific order",
        parameters: {
          type: "object",
          properties: {
            orderid: {
              type: "string",
              description: "Order ID to get details for"
            }
          },
          required: ["orderid"]
        },
        category: "api"
      },
      
      // Analysis Functions
      {
        name: "analyzeCustomerPatterns",
        description: "Analyze customer purchase patterns from CSV data",
        parameters: {
          type: "object",
          properties: {
            customerid: {
              type: "string",
              description: "Customer ID to analyze"
            }
          },
          required: ["customerid"]
        },
        category: "analysis"
      },
      {
        name: "getProductRecommendations",
        description: "Generate product recommendations based on purchase history",
        parameters: {
          type: "object",
          properties: {
            productid: {
              type: "string",
              description: "Product ID to get recommendations for"
            }
          },
          required: ["productid"]
        },
        category: "analysis"
      },
      
      // Proactive Intelligence Functions
      {
        name: "handleOrderConfirmationAndCrossSell",
        description: "Handle order confirmation with cross-selling opportunities",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "proactive"
      },
      {
        name: "handleSupportEscalation",
        description: "Handle support escalation with ticket creation",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            issueDescription: {
              type: "string",
              description: "Description of the support issue"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier", "issueDescription"]
        },
        category: "proactive"
      },
      {
        name: "handleLoyaltyUpgrade",
        description: "Handle loyalty tier upgrades and notifications",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "proactive"
      },
      {
        name: "handleProductRecommendations",
        description: "Handle personalized product recommendations",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "proactive"
      },
      
      // Magento Functions
      {
        name: "getMagentoProductBySKU",
        description: "Get detailed product information from Magento by SKU",
        parameters: {
          type: "object",
          properties: {
            sku: {
              type: "string",
              description: "Product SKU to search for"
            }
          },
          required: ["sku"]
        },
        category: "magento"
      },
      {
        name: "getMagentoProductByLoftID",
        description: "Get Magento product information using Loft product ID",
        parameters: {
          type: "object",
          properties: {
            loftId: {
              type: "string",
              description: "Loft product ID to search for in Magento"
            }
          },
          required: ["loftId"]
        },
        category: "magento"
      },
      {
        name: "searchMagentoProducts",
        description: "Search for products in Magento catalog by name or keyword",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for product name or keyword"
            },
            pageSize: {
              type: "number",
              description: "Number of results to return (default: 20)"
            }
          },
          required: ["query"]
        },
        category: "magento"
      },
      {
        name: "getMagentoCategories",
        description: "Get all product categories from Magento",
        parameters: {
          type: "object",
          properties: {},
          required: []
        },
        category: "magento"
      },
      {
        name: "refreshMagentoCategoriesCache",
        description: "Refresh the in-memory cache of Magento categories from the API",
        parameters: {},
        category: "magento"
      },
      {
        name: "getMagentoAttributeOptions",
        description: "Get attribute options (labels and values) for a Magento attribute code",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string", description: "Attribute code (e.g., material, brand, style)" }
          },
          required: ["code"]
        },
        category: "magento"
      },
      {
        name: "getMagentoProductMedia",
        description: "Get media gallery for a Magento product by SKU",
        parameters: {
          type: "object",
          properties: {
            sku: { type: "string", description: "Product SKU" }
          },
          required: ["sku"]
        },
        category: "magento"
      },
      
      // Composite Functions
      {
        name: "getCustomerJourney",
        description: "Get complete customer journey with orders and details",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "composite"
      },
      
      // NEW COMPOSITE FUNCTIONS (Loft + Magento)
      {
        name: "getCustomerProductJourney",
        description: "Get complete customer product journey enhanced with Magento product details",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "composite"
      },
      
      {
        name: "getPersonalizedProductRecommendations",
        description: "Get personalized product recommendations using Magento catalog based on customer purchase patterns",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "composite"
      },
      {
        name: "getCustomerAnalytics",
        description: "Get comprehensive customer analytics and insights",
        parameters: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "Customer identifier (phone or email)"
            },
            type: {
              type: "string",
              description: "Type of identifier (phone or email)",
              enum: ["phone", "email"]
            }
          },
          required: ["identifier"]
        },
        category: "composite"
      }
    ];
  }
  
  // =====================================================
  // MAIN FUNCTION CALLING INTERFACE
  // =====================================================
  
  async executeFunction(functionName, parameters) {
    try {
      console.log(`🚀 Executing function: ${functionName} with parameters:`, parameters);
      
      switch (functionName) {
        case 'getCustomerByPhone':
          return await this.getCustomerByPhone(parameters.phone);
          
        case 'getCustomerByEmail':
          return await this.getCustomerByEmail(parameters.email);
          
        case 'getOrdersByCustomer':
          return await this.getOrdersByCustomer(parameters.custid);
          
        case 'getDetailsByOrder':
          return await this.getDetailsByOrder(parameters.orderid);
          
        case 'analyzeCustomerPatterns':
          return await this.analyzeCustomerPatterns(parameters.customerid);
          
        case 'getProductRecommendations':
          return await this.getProductRecommendations(parameters.productid);
          
        case 'handleOrderConfirmationAndCrossSell':
          return await this.handleOrderConfirmationAndCrossSell(parameters.identifier, parameters.type);
          
        case 'handleSupportEscalation':
          return await this.handleSupportEscalation(parameters.identifier, parameters.issueDescription, parameters.type);
          
        case 'handleLoyaltyUpgrade':
          return await this.handleLoyaltyUpgrade(parameters.identifier, parameters.type);
          
        case 'handleProductRecommendations':
          return await this.handleProductRecommendations(parameters.identifier, parameters.type);
          
        case 'getCustomerJourney':
          return await this.getCustomerJourney(parameters.identifier, parameters.type);
          
        case 'getCustomerProductJourney':
          return await this.getCustomerProductJourney(parameters.identifier, parameters.type);
          
        case 'getPersonalizedProductRecommendations':
          return await this.getPersonalizedProductRecommendations(parameters.identifier, parameters.type);
          
        case 'getCustomerAnalytics':
          return await this.getCustomerAnalytics(parameters.identifier, parameters.type);
        
        case 'getMagentoProductBySKU':
          return await this.getMagentoProductBySKU(parameters.sku);
          
        case 'getMagentoProductByLoftID':
          return await this.getMagentoProductByLoftID(parameters.loftId);
          
        case 'searchMagentoProducts':
          return await this.searchMagentoProducts(
            parameters.query,
            parameters.pageSize,
            parameters.categoryId,
            parameters.currentPage || 1,
            parameters.tokens || null,
            typeof parameters.maxPrice === 'number' ? parameters.maxPrice : null,
            parameters.categoryName || null,
            parameters.materialLabels || null,
            typeof parameters.minPrice === 'number' ? parameters.minPrice : null,
            parameters.brandLabels || null,
            parameters.styleLabels || null,
            parameters.recliningLabels || null
          );
        case 'searchMagentoByCategoryName':
          return await this.searchMagentoByCategoryName(
            parameters.categoryName,
            parameters.pageSize,
            parameters.currentPage || 1
          );
        case 'refreshMagentoCategoriesCache':
          return await this.refreshMagentoCategoriesCache();
        case 'getMagentoAttributeOptions':
          return await this.getMagentoAttributeOptions(parameters.code);
        case 'getMagentoProductMedia':
          return await this.getMagentoProductMedia(parameters.sku);
        
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
      
    } catch (error) {
      console.error(`❌ Function execution error: ${functionName}`, error.message);
      return {
        function: functionName,
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = FunctionCallingSystem; 