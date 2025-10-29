#!/bin/bash

PROD_URL="https://woodstocknew-production.up.railway.app/v1/chat/completions"

echo "🧪 WOODSTOCK PRODUCTION TEST SUITE"
echo "=================================="
echo ""

# Test 1: Anonymous user (no auth)
echo "Test 1: Anonymous User - General Question"
echo "-------------------------------------------"
curl -s -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "what are your store hours?"}],
    "stream": false
  }' | jq -r '.choices[0].message.content' | head -20
echo ""
echo "✅ Test 1 Complete"
echo ""

# Test 2: Authenticated user with customer_id (Daniele)
echo "Test 2: Authenticated User - Customer 404-916-2522 (Daniele)"
echo "-------------------------------------------------------------"
curl -s -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "my phone is 404-916-2522"}],
    "customer_id": "9318667498",
    "auth_level": "authenticated",
    "stream": false
  }' | jq -r '.choices[0].message.content' | head -30
echo ""
echo "✅ Test 2 Complete"
echo ""

# Test 3: Product search (BUG-022 fix test)
echo "Test 3: Product Search - Test Context Manager"
echo "----------------------------------------------"
curl -s -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "search grey sofas"}],
    "stream": false
  }' | jq -r '.choices[0].message.content' | grep -i "sofa" | head -10
echo ""
echo "✅ Test 3 Complete"
echo ""

# Test 4: Chained command
echo "Test 4: Chained Command - Complete Customer Journey"
echo "---------------------------------------------------"
curl -s -X POST "$PROD_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "tell me everything about customer 404-916-2522"}],
    "stream": false
  }' | jq -r '.choices[0].message.content' | head -40
echo ""
echo "✅ Test 4 Complete"
echo ""

echo "=================================="
echo "🎉 ALL TESTS COMPLETE"
echo "=================================="
