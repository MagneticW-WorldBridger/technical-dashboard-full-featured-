#!/usr/bin/env node

// Script to capture real Magento API responses for documentation
const FunctionCallingSystem = require('./src/services/function-calling');
const fs = require('fs');

async function captureResponses() {
  console.log('🔍 Capturing Magento API responses...\n');
  
  const functionCalling = new FunctionCallingSystem();
  const responses = {
    timestamp: new Date().toISOString(),
    responses: []
  };
  
  try {
    // 1. Single product by SKU
    console.log('📦 Capturing: Product by SKU (124985831)...');
    const skuResponse = await functionCalling.executeFunction('getMagentoProductBySKU', {
      sku: '124985831'
    });
    responses.responses.push({
      type: 'single_product_by_sku',
      function: 'getMagentoProductBySKU',
      parameters: { sku: '124985831' },
      response: skuResponse
    });
    
    // 2. Search for chairs (we know this has lots of results)
    console.log('🪑 Capturing: Search chairs...');
    const chairsResponse = await functionCalling.executeFunction('searchMagentoProducts', {
      query: 'chairs',
      pageSize: 5
    });
    responses.responses.push({
      type: 'product_search_chairs',
      function: 'searchMagentoProducts', 
      parameters: { query: 'chairs', pageSize: 5 },
      response: chairsResponse
    });
    
    // 3. Search for sofas
    console.log('🛋️ Capturing: Search sofas...');
    const sofasResponse = await functionCalling.executeFunction('searchMagentoProducts', {
      query: 'sofa',
      pageSize: 3
    });
    responses.responses.push({
      type: 'product_search_sofas',
      function: 'searchMagentoProducts',
      parameters: { query: 'sofa', pageSize: 3 },
      response: sofasResponse
    });
    
    // 4. Categories structure
    console.log('📂 Capturing: Categories...');
    const categoriesResponse = await functionCalling.executeFunction('getMagentoCategories', {});
    responses.responses.push({
      type: 'categories_full',
      function: 'getMagentoCategories',
      parameters: {},
      response: categoriesResponse
    });
    
    // 5. Product by Loft ID
    console.log('🔗 Capturing: Product by Loft ID...');
    const loftResponse = await functionCalling.executeFunction('getMagentoProductByLoftID', {
      loftId: '124985831'
    });
    responses.responses.push({
      type: 'product_by_loft_id',
      function: 'getMagentoProductByLoftID',
      parameters: { loftId: '124985831' },
      response: loftResponse
    });
    
    // Save to file
    const filename = `magento-api-responses-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(responses, null, 2));
    
    console.log(`\n✅ All responses captured and saved to: ${filename}`);
    console.log(`📊 Total responses: ${responses.responses.length}`);
    
    // Show summary
    console.log('\n📋 Response Summary:');
    responses.responses.forEach((resp, index) => {
      console.log(`${index + 1}. ${resp.type}: ${resp.response.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error capturing responses:', error);
  }
}

// Run the capture
captureResponses().catch(console.error);