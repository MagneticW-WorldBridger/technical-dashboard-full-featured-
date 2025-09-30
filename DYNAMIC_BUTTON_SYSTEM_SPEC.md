# 🎯 DYNAMIC BUTTON SYSTEM SPECIFICATION

**Purpose:** Complete technical specification for implementing context-aware dynamic buttons  
**Status:** 🔧 **TECHNICAL IMPLEMENTATION READY** 🔧

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Dynamic Button Engine Overview:**
```
┌─────────────────────┐    ┌─────────────────────┐
│    AI RESPONSE      │    │   CONTEXT ANALYZER  │
│                     │    │                     │
│ • Function called   │───▶│ • Last function     │
│ • Result data       │    │ • User type         │
│ • User context      │    │ • Conversation arc  │
└─────────────────────┘    └─────────────────────┘
           │                           │
           └───────────┬───────────────┘
                      │
           ┌─────────────────────┐
           │   BUTTON GENERATOR   │
           │                     │
           │ • Context rules     │
           │ • Button templates  │
           │ • Personalization   │
           └─────────────────────┘
                      │
           ┌─────────────────────┐
           │   RENDERED BUTTONS   │
           │                     │
           │ • Primary action    │
           │ • Secondary options │
           │ • Support option    │
           └─────────────────────┘
```

---

## 🎨 **BUTTON CATEGORIES & STYLING**

### **Primary Action Button:**
```html
<button class="btn btn-primary dynamic-btn" 
        data-action="primary" 
        data-context="{{context}}"
        data-analytics="{{tracking}}">
  <i class="{{icon}}"></i>
  {{label}}
</button>
```

```css
.btn-primary {
  background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 102, 204, 0.4);
}
```

### **Secondary Action Buttons:**
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--woodstock-navy);
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f8f9fa;
  border-color: #0066cc;
  transform: translateY(-1px);
}
```

### **Support Button:**
```css
.btn-support {
  background: linear-gradient(135deg, #ff6600 0%, #e55a00 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  box-shadow: 0 3px 8px rgba(255, 102, 0, 0.3);
}
```

---

## 🧠 **CONTEXT-AWARE BUTTON LOGIC**

### **Context Detection System:**
```javascript
class DynamicButtonGenerator {
  constructor() {
    this.contextRules = {
      // Customer identification context
      'customer_identified': {
        primary: { action: 'view_orders', label: '📦 View Orders', icon: 'fas fa-box' },
        secondary: [
          { action: 'recommendations', label: '⭐ Recommendations', icon: 'fas fa-star' },
          { action: 'store_info', label: '🏪 Store Info', icon: 'fas fa-store' }
        ],
        support: { action: 'help', label: '💬 Need Help?', icon: 'fas fa-question-circle' }
      },
      
      // Order history context  
      'orders_displayed': {
        primary: { action: 'order_details', label: '🔍 Order Details', icon: 'fas fa-search' },
        secondary: [
          { action: 'reorder', label: '🔄 Reorder', icon: 'fas fa-redo' },
          { action: 'track_delivery', label: '📍 Track', icon: 'fas fa-truck' }
        ],
        support: { action: 'order_support', label: '❓ Order Help', icon: 'fas fa-headset' }
      },
      
      // Product search context
      'products_displayed': {
        primary: { action: 'filter_products', label: '🔧 Filter Options', icon: 'fas fa-filter' },
        secondary: [
          { action: 'compare', label: '⚖️ Compare', icon: 'fas fa-balance-scale' },
          { action: 'save_favorites', label: '💾 Save List', icon: 'fas fa-heart' },
          { action: 'contact_sales', label: '📞 Contact Sales', icon: 'fas fa-phone' }
        ],
        support: { action: 'product_help', label: '💡 Product Help', icon: 'fas fa-info-circle' }
      },
      
      // Support ticket context
      'support_ticket_created': {
        primary: { action: 'upload_photos', label: '📸 Upload Photos', icon: 'fas fa-camera' },
        secondary: [
          { action: 'call_now', label: '☎️ Call Now', icon: 'fas fa-phone' },
          { action: 'live_chat', label: '💬 Live Chat', icon: 'fas fa-comments' }
        ],
        support: { action: 'email_updates', label: '📧 Email Updates', icon: 'fas fa-envelope' }
      },
      
      // Admin analytics context
      'admin_analytics_displayed': {
        primary: { action: 'detailed_report', label: '📊 Detailed Report', icon: 'fas fa-chart-bar' },
        secondary: [
          { action: 'export_data', label: '📤 Export', icon: 'fas fa-download' },
          { action: 'set_alerts', label: '🔔 Set Alerts', icon: 'fas fa-bell' },
          { action: 'customer_journey', label: '🗺️ Journey Map', icon: 'fas fa-route' }
        ],
        support: { action: 'admin_help', label: '🔧 Admin Help', icon: 'fas fa-cog' }
      }
    };
  }
  
  generateButtons(functionName, functionResult, userContext) {
    const context = this.detectContext(functionName, functionResult, userContext);
    const rules = this.contextRules[context];
    
    if (!rules) return this.getDefaultButtons();
    
    return {
      primary: this.createButton(rules.primary, 'primary'),
      secondary: rules.secondary.map(btn => this.createButton(btn, 'secondary')),
      support: this.createButton(rules.support, 'support')
    };
  }
  
  detectContext(functionName, result, userContext) {
    // Context detection logic based on function name and results
    if (functionName === 'get_customer_by_phone' || functionName === 'get_customer_by_email') {
      return 'customer_identified';
    }
    
    if (functionName === 'get_orders_by_customer') {
      return 'orders_displayed';
    }
    
    if (functionName === 'search_magento_products' || 
        functionName === 'show_sectional_products' || 
        functionName === 'show_recliner_products' || 
        functionName === 'show_dining_products') {
      return 'products_displayed';
    }
    
    if (functionName === 'handle_support_escalation') {
      return 'support_ticket_created';
    }
    
    if (userContext?.mode === 'admin' && 
        (functionName === 'get_customer_analytics' || 
         functionName === 'analyze_customer_patterns')) {
      return 'admin_analytics_displayed';
    }
    
    return 'general';
  }
  
  createButton(config, type) {
    return {
      type: type,
      action: config.action,
      label: config.label,
      icon: config.icon,
      clickHandler: () => this.handleButtonClick(config.action),
      analytics: {
        event: 'dynamic_button_click',
        context: config.action,
        type: type
      }
    };
  }
  
  handleButtonClick(action) {
    // Button click handler - triggers next AI interaction
    const actionMap = {
      'view_orders': () => sendMessage('What are my orders?'),
      'recommendations': () => sendMessage('Show me product recommendations'),
      'order_details': () => sendMessage('Show me details for my most recent order'),
      'filter_products': () => showFilterModal(),
      'upload_photos': () => openPhotoUploader(),
      'call_now': () => initiatePhoneCall(),
      'detailed_report': () => sendMessage('Generate detailed analytics report'),
      // ... more actions
    };
    
    const handler = actionMap[action];
    if (handler) handler();
  }
}
```

---

## 🎯 **BUTTON GENERATION BY FUNCTION**

### **Customer Functions → Button Mapping:**

#### **After `get_customer_by_phone`:**
```json
{
  "primary": {
    "action": "view_orders",
    "label": "📦 View My Orders",
    "description": "See your order history and status"
  },
  "secondary": [
    {
      "action": "product_recommendations", 
      "label": "⭐ Get Recommendations",
      "description": "Products picked just for you"
    },
    {
      "action": "store_locations",
      "label": "🏪 Find Store",
      "description": "Locations and hours"
    }
  ],
  "support": {
    "action": "customer_support",
    "label": "💬 Need Help?",
    "description": "Chat with support"
  }
}
```

#### **After `get_orders_by_customer`:**
```json
{
  "primary": {
    "action": "view_order_details",
    "label": "🔍 See Details", 
    "description": "View items in your orders"
  },
  "secondary": [
    {
      "action": "reorder_items",
      "label": "🔄 Reorder",
      "description": "Buy these items again"
    },
    {
      "action": "track_delivery",
      "label": "📦 Track Package",
      "description": "See delivery status"
    },
    {
      "action": "return_request",
      "label": "↩️ Return Item",
      "description": "Start a return process"
    }
  ]
}
```

#### **After `search_magento_products`:**
```json
{
  "primary": {
    "action": "apply_filters",
    "label": "🔧 Filter Results",
    "description": "Narrow by price, brand, etc."
  },
  "secondary": [
    {
      "action": "compare_products",
      "label": "⚖️ Compare Items",
      "description": "Side-by-side comparison"
    },
    {
      "action": "save_to_wishlist",
      "label": "💾 Save Favorites",
      "description": "Save for later"
    },
    {
      "action": "schedule_visit",
      "label": "📅 Store Visit",
      "description": "See items in person"
    }
  ]
}
```

### **Admin Functions → Button Mapping:**

#### **After `get_customer_analytics`:**
```json
{
  "primary": {
    "action": "generate_detailed_report",
    "label": "📊 Full Report",
    "description": "Complete customer analysis"
  },
  "secondary": [
    {
      "action": "export_analytics",
      "label": "📤 Export Data",
      "description": "Download as CSV/PDF"
    },
    {
      "action": "set_customer_alerts",
      "label": "🔔 Set Alerts",
      "description": "Monitor customer activity"
    },
    {
      "action": "view_customer_journey",
      "label": "🗺️ Journey Map",
      "description": "See full customer path"
    }
  ]
}
```

---

## 📱 **RESPONSIVE DESIGN SYSTEM**

### **Desktop Layout:**
```html
<div class="dynamic-button-container desktop">
  <div class="primary-action">
    <button class="btn btn-primary">{{primaryAction}}</button>
  </div>
  <div class="secondary-actions">
    {{#each secondaryActions}}
      <button class="btn btn-secondary">{{this.label}}</button>
    {{/each}}
  </div>
  <div class="support-action">
    <button class="btn btn-support">{{supportAction}}</button>
  </div>
</div>
```

### **Mobile Layout:**
```html
<div class="dynamic-button-container mobile">
  <!-- Primary action full-width -->
  <button class="btn btn-primary mobile-primary">{{primaryAction}}</button>
  
  <!-- Secondary actions as horizontal scroll -->
  <div class="secondary-scroll">
    {{#each secondaryActions}}
      <button class="btn btn-secondary mobile-secondary">{{this.label}}</button>
    {{/each}}
  </div>
  
  <!-- Support as floating action button -->
  <button class="btn btn-support floating-support">
    <i class="fas fa-question-circle"></i>
  </button>
</div>
```

```css
/* Mobile Styles */
@media (max-width: 768px) {
  .mobile-primary {
    width: 100%;
    padding: 16px;
    font-size: 1.1rem;
    margin-bottom: 12px;
  }
  
  .secondary-scroll {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 8px;
    scrollbar-width: none;
    -webkit-scrollbar: { display: none; }
  }
  
  .mobile-secondary {
    flex-shrink: 0;
    padding: 10px 16px;
    white-space: nowrap;
  }
  
  .floating-support {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    font-size: 1.2rem;
    z-index: 1000;
  }
}
```

---

## 🎨 **ANIMATION & INTERACTION**

### **Button Entrance Animation:**
```css
@keyframes buttonSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.dynamic-btn {
  animation: buttonSlideIn 0.4s ease-out forwards;
}

.dynamic-btn:nth-child(1) { animation-delay: 0.1s; }
.dynamic-btn:nth-child(2) { animation-delay: 0.2s; }
.dynamic-btn:nth-child(3) { animation-delay: 0.3s; }
.dynamic-btn:nth-child(4) { animation-delay: 0.4s; }
```

### **Interactive States:**
```css
.dynamic-btn {
  position: relative;
  overflow: hidden;
}

.dynamic-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.dynamic-btn:hover::before {
  left: 100%;
}
```

---

## 📊 **ANALYTICS & TRACKING**

### **Button Interaction Tracking:**
```javascript
class ButtonAnalytics {
  constructor() {
    this.events = [];
  }
  
  trackButtonClick(buttonData) {
    const event = {
      timestamp: Date.now(),
      action: buttonData.action,
      context: buttonData.context,
      userType: buttonData.userType,
      position: buttonData.position, // primary, secondary, support
      sessionId: this.getSessionId(),
      conversationTurn: this.getConversationTurn()
    };
    
    this.events.push(event);
    this.sendToAnalytics(event);
  }
  
  trackButtonImpression(buttons) {
    const impressionEvent = {
      timestamp: Date.now(),
      type: 'button_impression',
      buttons: buttons.map(btn => ({
        action: btn.action,
        position: btn.type,
        context: btn.context
      })),
      sessionId: this.getSessionId()
    };
    
    this.sendToAnalytics(impressionEvent);
  }
  
  generatePerformanceReport() {
    return {
      clickThroughRate: this.calculateCTR(),
      mostClickedActions: this.getMostClickedActions(),
      contextualPerformance: this.getContextualPerformance(),
      userTypePreferences: this.getUserTypePreferences()
    };
  }
}
```

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core System (Week 1)**
- [ ] Button generator class implementation
- [ ] Context detection logic
- [ ] Basic button templates (primary, secondary, support)
- [ ] CSS styling system
- [ ] Click handler infrastructure

### **Phase 2: Intelligence (Week 2)**  
- [ ] Advanced context rules for all 18 functions
- [ ] Personalization based on user history
- [ ] A/B testing framework for button layouts
- [ ] Analytics tracking implementation

### **Phase 3: Enhancement (Week 3)**
- [ ] Mobile responsive optimizations
- [ ] Animation and interaction improvements
- [ ] Performance monitoring dashboard
- [ ] User preference learning system

### **Phase 4: Optimization (Week 4)**
- [ ] Machine learning for button optimization
- [ ] Predictive next action suggestions
- [ ] Cross-platform consistency
- [ ] Advanced analytics and reporting

---

**🎯 THIS SPECIFICATION PROVIDES COMPLETE TECHNICAL IMPLEMENTATION FOR CONTEXT-AWARE DYNAMIC BUTTONS!**
