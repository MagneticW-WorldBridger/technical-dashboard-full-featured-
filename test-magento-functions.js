#!/usr/bin/env node

// Test script for Magento functions
const FunctionCallingSystem = require('./src/services/function-calling');

async function testMagentoFunctions() {
  console.log('🚀 Testing Magento Functions...\n');
  
  const functionCalling = new FunctionCallingSystem();
  
  try {
    // Test 1: Get product by SKU
    console.log('📦 Test 1: Getting product by SKU (124985831)...');
    const skuResult = await functionCalling.executeFunction('getMagentoProductBySKU', {
      sku: '124985831'
    });
    
    console.log('SKU Result:', JSON.stringify(skuResult, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Search for products
    console.log('🔍 Test 2: Searching for "sofa"...');
    const searchResult = await functionCalling.executeFunction('searchMagentoProducts', {
      query: 'sofa',
      pageSize: 5
    });
    
    console.log('Search Result:', JSON.stringify(searchResult, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Get categories
    console.log('📂 Test 3: Getting all categories...');
    const categoriesResult = await functionCalling.executeFunction('getMagentoCategories', {});
    
    console.log('Categories Result:', JSON.stringify(categoriesResult, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Get product by Loft ID
    console.log('🔗 Test 4: Getting product by Loft ID (124985831)...');
    const loftResult = await functionCalling.executeFunction('getMagentoProductByLoftID', {
      loftId: '124985831'
    });
    
    console.log('Loft ID Result:', JSON.stringify(loftResult, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Magento function tests completed!');
}

// Run the tests
testMagentoFunctions().catch(console.error);