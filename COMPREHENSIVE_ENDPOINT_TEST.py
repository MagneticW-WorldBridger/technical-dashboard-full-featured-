#!/usr/bin/env python3
"""
🔥 COMPREHENSIVE CONVERSATIONAL ENDPOINT TESTING SCRIPT
Tests ALL Magento and LOFT endpoints in conversational format
Outputs real conversation logs to Markdown file
"""

import requests
import json
import time
from datetime import datetime
import sys

# Server configuration
SERVER_URL = "http://localhost:8001"
OUTPUT_FILE = "LIVE_CONVERSATION_TEST_RESULTS.md"

class ConversationTester:
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.results.append(log_entry)
        
    def test_conversation(self, user_input, description=""):
        """Test a conversational input and capture the response"""
        self.log(f"\n{'='*60}")
        self.log(f"🗣️ TESTING: {description}")
        self.log(f"👤 USER: {user_input}")
        self.log(f"{'='*60}")
        
        try:
            response = requests.post(
                f"{SERVER_URL}/v1/chat/completions",
                headers={"Content-Type": "application/json"},
                json={
                    "messages": [{"role": "user", "content": user_input}],
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data['choices'][0]['message']['content']
                
                self.log(f"✅ SUCCESS (200)")
                self.log(f"🤖 AI RESPONSE:")
                self.log(f"{ai_response[:500]}{'...' if len(ai_response) > 500 else ''}")
                
                # Check for function calls in response
                if "Function Result" in ai_response:
                    self.log(f"🔧 FUNCTION CALLED: Detected function execution")
                    
                return True, ai_response
            else:
                self.log(f"❌ FAILED ({response.status_code})")
                self.log(f"Error: {response.text}")
                return False, response.text
                
        except Exception as e:
            self.log(f"❌ EXCEPTION: {str(e)}")
            return False, str(e)
    
    def write_markdown_report(self):
        """Write the complete test results to markdown"""
        with open(OUTPUT_FILE, 'w') as f:
            f.write(f"""# 🔥 COMPREHENSIVE ENDPOINT TEST RESULTS
## Live Conversational Testing Session

**Test Started:** {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}  
**Test Completed:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Server:** {SERVER_URL}

---

## 📋 TEST LOG

```
""")
            for result in self.results:
                f.write(result + "\n")
            f.write("```\n\n---\n\n**🎯 Test completed successfully!**")
            
    def run_comprehensive_tests(self):
        """Run all endpoint tests"""
        
        self.log("🚀 STARTING COMPREHENSIVE ENDPOINT TESTING")
        self.log(f"Server: {SERVER_URL}")
        
        # Test server health first
        try:
            health_response = requests.get(f"{SERVER_URL}/health", timeout=10)
            if health_response.status_code == 200:
                self.log("✅ Server is healthy and ready")
            else:
                self.log(f"⚠️ Server health check returned {health_response.status_code}")
        except:
            self.log("❌ Server appears to be down!")
            return
        
        # CONVERSATIONAL TESTS FOR ALL ENDPOINTS
        
        test_cases = [
            # 1. CUSTOMER IDENTIFICATION (LOFT)
            ("407-288-6040", "🧠 Customer Recognition by Phone (LOFT)"),
            ("jdan4sure@yahoo.com", "📧 Customer Recognition by Email (LOFT)"),
            ("999-999-9999", "❌ Non-existent Customer Error Recovery"),
            
            # 2. ORDER MANAGEMENT (LOFT)  
            ("show me my orders", "📦 Order History Request"),
            ("what's the status of order 12345", "🔍 Specific Order Status"),
            
            # 3. BASIC PRODUCT SEARCH (Magento)
            ("show me sectionals", "🛒 Basic Product Search - Sectionals"),
            ("show me recliners", "🪑 Basic Product Search - Recliners"),
            ("show me dining tables", "🍽️ Basic Product Search - Dining"),
            
            # 4. BUDGET-SPECIFIC SEARCH (Magento Price Range)
            ("sectionals under 2000", "💰 Budget Search - Under $2000"),
            ("recliners under 500", "💰 Budget Search - Under $500"),
            ("dining tables between 800 and 1500", "💰 Budget Search - Price Range"),
            
            # 5. BRAND DISCOVERY (NEW Magento)
            ("what brands do you have", "🏭 Brand Discovery Function"),
            ("show me Ashley furniture", "🏷️ Brand-Specific Search"),
            
            # 6. COLOR FILTERING (NEW Magento)
            ("what colors are available", "🎨 Color Discovery Function"),
            ("show me brown sectionals", "🤎 Color-Specific Search"),
            
            # 7. BEST SELLERS (NEW Magento)
            ("show me your best sellers", "⭐ Best Sellers Function"),
            ("what's popular right now", "📈 Popular Products"),
            
            # 8. PHOTO/MEDIA LOOKUP (NEW Magento)
            ("get photos for SKU 694056266", "📸 Direct SKU Photo Lookup"),
            
            # 9. MEMORY RECALL (NEW)
            ("do you remember what I told you", "🧠 Memory Recall Function"),
            ("what are my preferences", "💭 Memory Retrieval"),
            
            # 10. SUPPORT ESCALATION (LOFT)
            ("My delivery was damaged and I'm frustrated", "🚨 Support Escalation - Emotional"),
            ("I need to return this item", "↩️ Return Request"),
            ("I have a problem with my order", "⚠️ General Support Issue"),
            
            # 11. VAPI PHONE INTEGRATION
            ("call me at 3323339453", "📞 VAPI Phone Call Request"),
            ("can you call me", "☎️ Phone Call Request"),
            
            # 12. ANALYTICS (LOFT)
            ("analyze my purchase patterns", "📊 Customer Analytics"),
            ("give me recommendations", "🎯 Product Recommendations"),
            
            # 13. CONTEXT PASSING (Photo Lookup)
            ("show me sectionals", "📋 Context Setup - Product Search"),
            ("see photos of the second one", "🔗 Context Passing - Photo Request"),
            
            # 14. ERROR RECOVERY SCENARIOS
            ("blah blah nonsense query", "🤔 Nonsense Input Handling"),
            ("", "❓ Empty Input Handling"),
            ("#$%^&*()", "🚫 Special Characters Handling"),
            
            # 15. CONVERSATION REPAIR
            ("That is not what I meant", "🔧 Conversation Repair"),
            ("I meant something different", "↩️ Clarification Request"),
        ]
        
        # Execute all test cases
        for i, (user_input, description) in enumerate(test_cases, 1):
            self.log(f"\n🧪 TEST {i}/{len(test_cases)}")
            success, response = self.test_conversation(user_input, description)
            
            # Brief pause between tests
            time.sleep(1)
        
        # Write final report
        self.log("\n" + "="*60)
        self.log("📊 TESTING COMPLETE - Writing Markdown Report")
        self.log("="*60)
        
        self.write_markdown_report()
        self.log(f"✅ Report written to: {OUTPUT_FILE}")

if __name__ == "__main__":
    tester = ConversationTester()
    tester.run_comprehensive_tests()
    print(f"\n🎉 ALL TESTS COMPLETED! Check: {OUTPUT_FILE}")
