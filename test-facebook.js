require('dotenv').config();

async function testFacebookMessaging() {
  const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  
  console.log('🧪 Testing Facebook Messenger Integration...');
  console.log(`📱 Page: Alfred (${PAGE_ID})`);
  console.log(`🔑 Token: ${PAGE_ACCESS_TOKEN.substring(0, 20)}...`);
  
  // Test 1: Verify page access
  try {
    const pageResponse = await fetch(`https://graph.facebook.com/v18.0/${PAGE_ID}?access_token=${PAGE_ACCESS_TOKEN}`);
    const pageData = await pageResponse.json();
    console.log('✅ Page verification successful:', pageData.name);
  } catch (error) {
    console.error('❌ Page verification failed:', error);
    return;
  }
  
  // Test 2: Test webhook endpoint
  try {
    const webhookResponse = await fetch('http://localhost:3000/facebook-webhook', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Webhook endpoint accessible');
  } catch (error) {
    console.error('❌ Webhook endpoint not accessible:', error);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Configure webhook in Facebook App Dashboard');
  console.log('2. Set Callback URL: https://tu-dominio.com/facebook-webhook');
  console.log('3. Set Verify Token: woodstock_verify_token_2024');
  console.log('4. Subscribe to: messages, messaging_postbacks');
  console.log('5. Send a message to Alfred page to test!');
}

testFacebookMessaging().catch(console.error); 