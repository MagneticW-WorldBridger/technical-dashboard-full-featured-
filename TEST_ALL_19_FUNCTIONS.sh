#!/bin/bash

PROD="https://woodstocknew-production.up.railway.app/v1/chat/completions"

echo "🧪 TESTING ALL 19+ AI FUNCTIONS"
echo "================================="
echo ""

function test_function() {
    local test_name=$1
    local query=$2
    local expected_function=$3
    
    echo "🔍 TEST: $test_name"
    echo "Query: '$query'"
    
    RESPONSE=$(curl -s -X POST "$PROD" \
        -H "Content-Type: application/json" \
        -d "{\"messages\": [{\"role\": \"user\", \"content\": \"$query\"}], \"stream\": false}")
    
    CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' 2>/dev/null)
    
    if echo "$CONTENT" | grep -i "$expected_function" > /dev/null; then
        echo "✅ FUNCTION TRIGGERED: $expected_function"
    else
        echo "❌ FUNCTION NOT TRIGGERED: $expected_function"
    fi
    
    if [ ${#CONTENT} -gt 100 ]; then
        echo "✅ Response length: ${#CONTENT} chars (good)"
    else
        echo "❌ Response too short: ${#CONTENT} chars"
    fi
    
    echo "Response preview: ${CONTENT:0:150}..."
    echo ""
}

# 1-4: LOFT API Functions
test_function "Customer Phone Lookup" "customer 404-916-2522" "get_customer_by_phone"
test_function "Customer Email Lookup" "customer selenebarcia448@gmail.com" "get_customer_by_email" 
test_function "Order History" "my orders for customer 9318667498" "get_orders_by_customer"
test_function "Order Details" "order details for order 14001095652" "get_order_details"

# 5-8: Composite Functions
test_function "Customer Journey" "complete customer journey 404-916-2522" "get_customer_journey"
test_function "Customer Analytics" "analytics for customer 404-916-2522" "analyze_customer_patterns"
test_function "Product Recommendations" "product recommendations 404-916-2522" "get_product_recommendations"
test_function "Complete Journey" "tell me everything about customer 404-916-2522" "get_complete_customer_journey"

# 9-12: Support Functions
test_function "Support Escalation" "my sofa is damaged" "handle_support_escalation"
test_function "Connect Support" "connect me to support John Doe" "connect_to_support"
test_function "Show Directions" "directions to Acworth store" "show_directions" 
test_function "Cross-sell" "order confirmation for customer 404-916-2522" "handle_order_confirmation_cross_sell"

# 13-19: Magento Product Functions  
test_function "Product Search" "show me sectionals" "search_magento_products"
test_function "Price Range Search" "recliners under 500" "search_products_by_price_range"
test_function "Brand Search" "Ashley sectionals" "search_products_by_brand_and_category"
test_function "Product Photos" "photos of SKU 688570546" "get_product_photos"
test_function "All Brands" "what brands do you have" "get_all_furniture_brands"
test_function "All Colors" "what colors do you have" "get_all_furniture_colors"
test_function "Best Sellers" "show me best sellers" "get_featured_best_seller_products"

# 20-23: Context Functions
test_function "Product by Position" "show me the second one" "get_product_by_position"
test_function "Loyalty Upgrade" "loyalty upgrade for customer 404-916-2522" "handle_loyalty_upgrade"
test_function "Memory Recall" "do you remember what I asked before" "recall_user_memory"

# 24-25: Phone Integration 
test_function "Demo Call" "call me at 332-333-9453" "start_demo_call"

echo "================================="
echo "✅ ALL FUNCTION TESTS COMPLETED"
echo "================================="
