#!/bin/bash

echo "🔍 TESTING WOODSTOCK DEMO LINKS"
echo "================================"
echo ""

PROD="https://woodstocknew-production.up.railway.app/v1/chat/completions"

echo "✅ Test 1: Backend Health Check"
echo "-------------------------------"
curl -s -X POST "$PROD" -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "hello"}],
  "stream": false
}' | jq -r '.choices[0].message.content' | head -5
echo ""
echo "Expected: Welcome message"
echo ""

echo "✅ Test 2: Customer Lookup"
echo "--------------------------"
curl -s -X POST "$PROD" -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "customer 404-916-2522"}],
  "stream": false
}' | jq -r '.choices[0].message.content' | grep -i "daniele\|selene" | head -3
echo ""
echo "Expected: Customer name (Daniele & Selene)"
echo ""

echo "✅ Test 3: Leather Sofas (Jessica's Exact Query)"
echo "------------------------------------------------"
curl -s -X POST "$PROD" -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "do you have leather sofas"}],
  "stream": false
}' | jq -r '.choices[0].message.content' | grep -E "Butler|Newport|leather" | head -5
echo ""
echo "Expected: List of leather sofas with names/prices"
echo ""

echo "✅ Test 4: Product Search with CAROUSEL_DATA"
echo "---------------------------------------------"
RESPONSE=$(curl -s -X POST "$PROD" -H "Content-Type: application/json" -d '{
  "messages": [{"role": "user", "content": "show me grey sofas"}],
  "stream": false
}')

echo "$RESPONSE" | jq -r '.choices[0].message.content' | grep "CAROUSEL_DATA" | head -3
if echo "$RESPONSE" | grep -q "CAROUSEL_DATA"; then
    echo "✅ CAROUSEL_DATA present"
else
    echo "❌ CAROUSEL_DATA missing"
fi
echo ""

echo "================================"
echo "🎯 FRONTEND MANUAL TEST"
echo "================================"
echo ""
echo "Open in browser:"
echo "  https://woodstock.demo.aiprlassist.com"
echo ""
echo "Check:"
echo "  1. Is chat box in bottom right (not center)?"
echo "  2. Does welcome message show 3-column grid?"
echo "  3. Type: 'show me grey sofas' - does carousel appear?"
echo "  4. Type: 'my phone is 404-916-2522' - does it recognize customer?"
echo ""
echo "If ALL YES → ✅ Send Jessica confirmation email"
echo "If ANY NO → ⚠️ Debug frontend issues"
echo ""

