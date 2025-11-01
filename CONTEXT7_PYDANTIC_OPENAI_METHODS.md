# 🔬 CONTEXT7 METHODS - PYDANTIC AI + OPENAI FUNCTION CALLING BEST PRACTICES

**Source:** Context7 MCP Server - `/pydantic/pydantic-ai` + `/openai/openai-python`  
**Date:** October 31, 2025  
**Purpose:** Reference for fixing Woodstock AI function calling issues

---

## 🎯 METHOD 1: GOOGLE-STYLE DOCSTRINGS FOR FUNCTION TOOLS

**What OpenAI sees:** The function description + parameter descriptions become the JSON schema sent to OpenAI.

### ✅ CORRECT PATTERN (from Context7):

```python
@agent.tool_plain(docstring_format='google', require_parameter_descriptions=True)
def search_products(query: str, max_price: float, category: str) -> str:
    """Search for furniture products matching criteria.

    Args:
        query: Search term like 'grey sofa', 'recliner', 'sectional'
        max_price: Maximum price filter in dollars
        category: Product category like 'living room', 'bedroom', 'dining'
    """
    return search_results
```

**What OpenAI receives:**
```json
{
  "name": "search_products",
  "description": "Search for furniture products matching criteria.",
  "parameters": {
    "properties": {
      "query": {
        "type": "string",
        "description": "Search term like 'grey sofa', 'recliner', 'sectional'"
      },
      "max_price": {
        "type": "number",
        "description": "Maximum price filter in dollars"
      },
      "category": {
        "type": "string",
        "description": "Product category like 'living room', 'bedroom', 'dining'"
      }
    }
  }
}
```

### 🔥 KEY INSIGHTS:

1. **First line = function PURPOSE** (what it does)
2. **Args section = parameter MEANINGS** (what each param is)
3. **Examples in descriptions** help OpenAI understand usage
4. **NO keywords needed** - OpenAI reasons semantically

---

## 🎯 METHOD 2: COMPOSITE/CHAINED FUNCTIONS - OUTPUT_TYPE PATTERN

**Problem:** Functions that call other functions internally confuse OpenAI.

### ❌ WRONG PATTERN (what we have now):

```python
@agent.tool
async def analyze_customer_patterns(ctx, identifier):
    """Analyze customer patterns"""
    # Calls get_customer_by_phone internally
    customer = await get_customer_by_phone(ctx, identifier)
    # Calls get_orders internally
    orders = await get_orders_by_customer(ctx, customer.id)
    # Calls get_order_details multiple times
    for order in orders:
        details = await get_order_details(ctx, order.id)
    # OpenAI sees this and thinks: "Too complex, might fail, I'll avoid it"
```

### ✅ CORRECT PATTERN (from Context7 - output_type + hand-off):

```python
class CustomerAnalysis(BaseModel):
    """Analysis result"""
    total_spent: float
    favorite_categories: List[str]
    customer_tier: str

class AnalysisFailure(BaseModel):
    """Unrecoverable failure"""
    explanation: str

async def analyze_customer_workflow(ctx: RunContext, identifier: str) -> CustomerAnalysis:
    """Complete customer analysis workflow.
    
    This function handles the entire workflow:
    1. Look up customer by identifier
    2. Fetch all orders
    3. Analyze spending patterns
    4. Return structured analysis
    
    OpenAI knows this is ONE atomic operation, not multiple risky calls.
    """
    try:
        # Do all the chaining internally
        customer = await get_customer(identifier)
        orders = await get_orders(customer.id)
        analysis = analyze(orders)
        return CustomerAnalysis(**analysis)
    except Exception as e:
        raise ModelRetry(f"Analysis failed: {e}")

# Register as output_type (not @agent.tool)
agent = Agent(
    output_type=[analyze_customer_workflow, AnalysisFailure],
    instructions="You can perform customer analysis when asked."
)
```

**WHY THIS WORKS:**
- OpenAI sees it as ONE operation with structured output
- `ModelRetry` tells OpenAI it can retry if it fails
- Clearer intent: "This function does X completely"

---

## 🎯 METHOD 3: TOOL DESCRIPTION BEST PRACTICES (OpenAI)

**From OpenAI Python docs - what makes a good tool description:**

### ✅ GOOD DESCRIPTIONS:

```python
def get_weather(location: str, units: str = "celsius") -> str:
    """
    Get current weather information for a location.
    
    Call this when the user asks about weather, temperature, or current conditions
    for a city or address. Returns temperature, conditions, and forecast.
    """
```

**WHY GOOD:**
- Clear PURPOSE: "Get current weather information"
- Clear WHEN: "when user asks about weather, temperature, conditions"
- Clear WHAT: "for a location"
- Clear RETURNS: "temperature, conditions, forecast"

### ❌ BAD DESCRIPTIONS:

```python
def get_weather(location: str, units: str = "celsius") -> str:
    """Get weather - provide location"""
```

**WHY BAD:**
- Vague PURPOSE: "Get weather" (weather what? current? forecast? historical?)
- No WHEN: Doesn't say when to use it
- Vague WHAT: "provide location" (city? coordinates? zip code?)
- No RETURNS: What format? What data?

---

## 🎯 METHOD 4: REDUCING TOOL COUNT - CONSOLIDATION PATTERN

**From Context7 research:**

**❌ DON'T DO THIS (tool explosion):**
```python
@agent.tool
def search_sectionals(): ...

@agent.tool
def search_recliners(): ...

@agent.tool  
def search_dining(): ...

@agent.tool
def search_mattresses(): ...
# Result: 4 tools that do the same thing
```

**✅ DO THIS (one flexible tool):**
```python
@agent.tool
def search_products(category: str, filters: dict = None) -> str:
    """Search furniture products by category with optional filters.
    
    Args:
        category: Product type like 'sectional', 'recliner', 'dining', 'mattress'
        filters: Optional dict with price_max, color, brand, etc.
    """
    # One tool handles all product searches
```

**OPTIMAL TOOL COUNT:** 10-15 tools per agent (Context7 best practice)

---

## 🎯 METHOD 5: PROMPT SIZE OPTIMIZATION

**From OpenAI research:**

**Optimal prompt structure:**
```
Total tokens: 500-1000 tokens (~300-600 words = 75-150 lines)

Breakdown:
- Core identity & behavior: 50-100 lines
- Business context (if needed): 50-100 lines  
- Function calling rules: 10-20 lines (MINIMAL!)
- Error handling: 10-20 lines
```

**Current monolith:**
```
Total: 622 lines = ~3000 tokens
OpenAI's attention span: Diminishes after 1000 tokens
Result: Second half of prompt is mostly ignored
```

**KEY INSIGHT:**
- **Function docstrings are PART of the prompt** that OpenAI sees
- 31 functions × 10 lines each = 310 lines of implicit prompt
- 622 explicit + 310 implicit = **932 lines total!**
- **OpenAI can't process this effectively**

---

## 🎯 METHOD 6: TOOL PARAMETER AUTO-DETECTION

**Don't force users to specify parameter types - let the function detect:**

### ✅ SMART PATTERN (from our code - this is actually GOOD):

```python
async def analyze_customer_patterns(ctx: RunContext, customer_identifier: str) -> str:
    """Analyze patterns.
    
    Args:
        customer_identifier: Can be phone (770-653-7383), email (user@email.com), 
                           or customer_id (9318667375). Function auto-detects type.
    """
    if "@" in customer_identifier:
        # It's email
        customer = await get_customer_by_email(ctx, customer_identifier)
    elif len(customer_identifier) == 10 and customer_identifier.isdigit():
        # It's customer_id
        customer_id = customer_identifier
    else:
        # It's phone
        customer = await get_customer_by_phone(ctx, customer_identifier)
```

**WHY GOOD:**
- User doesn't need to specify `type="phone"` vs `type="email"`
- Function handles ambiguity
- Docstring explains this clearly

**APPLY TO ALL HYBRID FUNCTIONS:**
- `analyze_customer_patterns` ✅ Already has this
- `get_product_recommendations` ✅ Already has this
- `handle_support_escalation` ✅ Already has this

---

## 🎯 METHOD 7: STRUCTURED OUTPUTS WITH PYDANTIC (Advanced)

**For complex returns, use Pydantic models:**

```python
class ProductSearchResult(BaseModel):
    """Structured product search result"""
    products: List[Dict[str, Any]]
    total_found: int
    query: str
    carousel_html: str  # Pre-rendered HTML
    suggested_filters: List[str]

@agent.tool
async def search_with_structured_output(query: str) -> ProductSearchResult:
    """Search products and return structured result"""
    products = await search_magento(query)
    return ProductSearchResult(
        products=products,
        total_found=len(products),
        query=query,
        carousel_html=render_carousel(products),
        suggested_filters=["color", "brand", "price"]
    )
```

**Benefits:**
- Type-safe
- Frontend gets predictable structure
- OpenAI can't mess up the format

**CONSIDERATION FOR WOODSTOCK:**
- Current CAROUSEL_DATA JSON approach works
- Could wrap in Pydantic model for extra safety
- Not urgent, but nice-to-have

---

## 🎯 METHOD 8: DEBUGGING TOOL SELECTION

**From Context7 - how to debug why tools aren't being called:**

```python
# Test what OpenAI sees:
from pydantic_ai.models.test import TestModel

test_model = TestModel()
agent = Agent(test_model, tools=[...])

result = agent.run_sync('customer 770-653-7383')

# Check which tools were presented to model:
print(test_model.last_model_request_parameters.function_tools)

# This shows EXACTLY what OpenAI received
for tool in test_model.last_model_request_parameters.function_tools:
    print(f"Tool: {tool.name}")
    print(f"Description: {tool.description}")
    print(f"Parameters: {tool.parameters_json_schema}")
```

**USE THIS to verify:**
- Which tools OpenAI can see
- What descriptions OpenAI receives
- If parameter schemas are correct

---

## 🎯 METHOD 9: MODELRETRY FOR COMPOSITE FUNCTIONS

**From Context7 - how to make composite functions reliable:**

```python
from pydantic_ai import ModelRetry

@agent.tool
async def complex_workflow(ctx: RunContext, identifier: str) -> str:
    """Multi-step workflow with error recovery.
    
    This function chains multiple operations and can retry if any step fails.
    """
    try:
        # Step 1
        customer = await get_customer(identifier)
        if not customer:
            raise ModelRetry("Customer not found. Ask user for different identifier.")
        
        # Step 2
        orders = await get_orders(customer.id)
        if not orders:
            # Don't fail - return partial result
            return f"Customer {customer.name} found but no orders yet."
        
        # Step 3
        analysis = await analyze(orders)
        return analysis
        
    except APIError as e:
        # Retryable errors
        raise ModelRetry(f"API temporarily unavailable: {e}")
    except ValueError as e:
        # Non-retryable errors
        return f"Cannot complete analysis: {e}"
```

**KEY INSIGHT:**
- `ModelRetry` tells OpenAI "try again with different approach"
- Regular return = success (even if partial)
- Regular exception = fatal error (don't retry)

---

## 🎯 METHOD 10: CONDITIONAL TOOL AVAILABILITY

**From Context7 - tools can be conditionally available:**

```python
async def only_for_authenticated(
    ctx: RunContext[UserContext], tool_def: ToolDefinition
) -> ToolDefinition | None:
    if ctx.deps.is_authenticated():
        return tool_def
    else:
        return None  # Tool not available

@agent.tool(prepare=only_for_authenticated)
async def get_order_history(ctx: RunContext[UserContext]) -> str:
    """Get user's order history - only for authenticated users"""
    # This tool only appears when user is authenticated
```

**APLICACIÓN PARA WOODSTOCK:**
- Some tools only for authenticated users
- Some tools only for admin
- Reduces tool count based on context

---

## 📊 SUMMARY OF METHODS:

1. **Google-style docstrings** - Clear descriptions with examples
2. **output_type for composites** - NOT @agent.tool for complex workflows
3. **Tool descriptions** - PURPOSE + WHEN + WHAT + RETURNS
4. **Tool consolidation** - One flexible tool > many specific tools
5. **Prompt reduction** - 150 lines max, let docstrings do the work
6. **Smart parameters** - Auto-detect type (phone vs email vs id)
7. **Structured outputs** - Pydantic models for complex returns
8. **Debug tool selection** - TestModel to see what OpenAI receives
9. **ModelRetry** - Graceful retry for composite functions
10. **Conditional tools** - prepare() to show/hide tools based on context

---

## 🚨 CRITICAL INSIGHTS FOR WOODSTOCK:

### **Why Our Functions Don't Trigger:**

1. **Docstrings too vague**
   - Current: "Analyze customer purchase patterns - provide phone, email, or customer ID"
   - Better: "Analyze customer's spending patterns and preferences. Use when user asks 'analyze spending', 'purchase patterns', 'what does customer buy'. Args: customer_identifier: Phone (770-653-7383), email, or ID - auto-detected."

2. **Composite functions scare OpenAI**
   - Current: `analyze_customer_patterns` calls 3-5 functions internally
   - OpenAI sees: "Risky, might fail at multiple points, I'll avoid it"
   - Fix: Use `output_type` pattern OR add `ModelRetry` for error recovery

3. **Too many tools**
   - Current: 31 tools registered
   - Optimal: 10-15 tools
   - Fix: Remove wrappers, consolidate similar functions

4. **Prompt too long**
   - Current: 622 lines of keywords + 31 functions = ~932 lines effective prompt
   - OpenAI attention: Diminishes after 300-400 lines
   - Fix: Reduce to 150 lines, move business info to RAG

---

## ✅ IMPLEMENTATION CHECKLIST:

### **PHASE 1: Clean Up Tools (30 min)**
- [ ] Remove `handle_loyalty_upgrade` (never used)
- [ ] Remove `handle_order_confirmation_cross_sell` (never used)
- [ ] Keep fast-path wrappers (show_sectional/recliner/dining) - they're useful
- [ ] Result: 31 → 29 tools

### **PHASE 2: Rewrite Critical Docstrings - Google Format (2 hours)**

**Priority order (broken functions first):**

1. [ ] `get_customer_by_phone` - Add clear "Use when" + examples
2. [ ] `analyze_customer_patterns` - Explain composite workflow + add ModelRetry
3. [ ] `get_product_recommendations` - Clear trigger words + workflow explanation
4. [ ] `get_complete_customer_journey` - Explicit "ONLY when user asks for EVERYTHING"
5. [ ] `search_magento_products` - Already good, minor tweaks
6. [ ] `search_products_by_price_range` - Add CAROUSEL_DATA return format
7. [ ] `get_featured_best_seller_products` - Add CAROUSEL_DATA return format
8. [ ] All remaining 22 functions - Google format + parameter descriptions

**Template for EACH function:**
```python
@agent.tool
async def function_name(ctx: RunContext, param: str) -> str:
    """One-line PURPOSE statement.
    
    Detailed explanation of what this function does and when to use it.
    Be specific about trigger phrases and use cases.
    
    Args:
        param: Clear description with examples (e.g., "770-653-7383" or "user@email.com")
        
    Returns:
        Exact description of return format (e.g., "HTML customer card with name, ID, orders")
        
    Examples:
        - "customer 770-653-7383" → triggers this function
        - "look up user@email.com" → triggers this function
        
    Note:
        Any important caveats (e.g., "This is a composite function that chains 3 API calls")
    """
```

### **PHASE 3: Reduce Prompt (1 hour)**

- [ ] Remove lines 407-433 (keyword trigger lists - 27 lines)
- [ ] Remove lines 498-558 (HTML templates - 60 lines)
- [ ] Remove lines 674-788 (mode switching logic - 114 lines)
- [ ] Simplify lines 947-975 (off-topic - 28 lines → 5 lines)
- [ ] Keep lines 789-946 (business info - will move to RAG later)
- [ ] Target: 622 → 150 lines (76% reduction)

### **PHASE 4: Add ModelRetry to Composite Functions (30 min)**

```python
from pydantic_ai import ModelRetry

@agent.tool
async def analyze_customer_patterns(ctx: RunContext, customer_identifier: str) -> str:
    """[Google docstring here]"""
    try:
        # Step 1: Customer lookup
        if "@" in customer_identifier:
            customer_result = await get_customer_by_email(ctx, customer_identifier)
        else:
            customer_result = await get_customer_by_phone(ctx, customer_identifier)
        
        if "❌" in customer_result:
            raise ModelRetry(f"Customer not found: {customer_identifier}. Ask user for different phone/email.")
        
        # Step 2: Get customer_id
        customer_id_match = re.search(r'Customer ID: (\d+)', customer_result)
        if not customer_id_match:
            raise ModelRetry("Could not extract customer ID. Try different lookup method.")
        
        customer_id = customer_id_match.group(1)
        
        # Step 3: Get orders
        orders_result = await get_orders_by_customer(ctx, customer_id)
        if "❌" in orders_result or "no orders" in orders_result.lower():
            # Partial success - customer found but no orders
            return f"Customer {customer_identifier} found but no purchase history available yet."
        
        # Step 4: Analyze
        # ... analysis code ...
        
        return analysis_result
        
    except Exception as error:
        # Log but don't expose internal errors
        print(f"❌ Error in analyze_customer_patterns: {error}")
        raise ModelRetry(f"Analysis temporarily unavailable. Try again or contact support.")
```

### **PHASE 5: Test & Debug (1 hour)**

Use TestModel to verify:
```python
from pydantic_ai.models.test import TestModel

test_model = TestModel()
agent_test = Agent(test_model, tools=[get_customer_by_phone, analyze_customer_patterns])

result = agent_test.run_sync('analyze spending patterns for 770-653-7383')

# Check what OpenAI saw:
for tool in test_model.last_model_request_parameters.function_tools:
    print(f"✅ Tool: {tool.name}")
    print(f"   Description: {tool.description}")
    print(f"   Parameters: {list(tool.parameters_json_schema['properties'].keys())}")
```

---

## 🔥 SPECIFIC FIXES FOR WOODSTOCK BUGS:

### **BUG-045: get_customer_by_phone not triggering**

**Current docstring:**
```python
"""👤 CUSTOMER IDENTIFICATION: Look up customer by phone number. Use ONLY when customer provides their phone for identification, NOT when they just want order data."""
```

**PROBLEMS:**
- "Use ONLY when" is RESTRICTIVE - confuses OpenAI
- "NOT when they just want order data" adds confusion
- Missing examples

**FIXED docstring (Context7 method):**
```python
"""Look up customer information using their phone number.

Call this function when user provides a phone number to identify a customer
or retrieve their profile. Common use cases include customer lookup, order 
history requests, or any query that starts with a phone number.

Args:
    phone: Customer's phone number in format 770-653-7383 or 7706537383
    
Returns:
    HTML customer card with name, customer ID, email, address, and next action suggestions
    
Examples:
    - "customer 770-653-7383"
    - "look up 404-555-1234"  
    - "my phone number is 678-123-4567"
    - "show me orders for 770-653-7383" (call this first, then get_orders_by_customer)
"""
```

### **BUG-038: analyze_customer_patterns not triggering**

**Current docstring:**
```python
"""Analyze customer purchase patterns - provide phone, email, or customer ID"""
```

**PROBLEMS:**
- Too vague - doesn't say WHEN to use
- No mention of what it returns
- No examples

**FIXED docstring (Context7 method):**
```python
"""Analyze customer's purchase history to identify spending patterns and product preferences.

Use this function when the user asks to analyze, review, or understand a customer's
buying behavior, spending habits, or purchase patterns. This is a composite function
that handles the complete analysis workflow.

Args:
    customer_identifier: Phone number (770-653-7383), email (user@email.com), 
                        or customer_id (9318667375). Function auto-detects the type
                        and performs necessary lookups automatically.

Returns:
    Analysis report containing:
    - Total spending across all orders
    - Favorite product categories
    - Customer value tier (high-value vs regular)
    - Formatted as readable text with spending breakdown

Examples:
    - "analyze spending patterns for 770-653-7383"
    - "what does customer 9318667375 usually buy"
    - "show me purchase patterns for selene@email.com"
    
Workflow:
    This function automatically chains:
    1. Customer lookup (by phone/email/id)
    2. Order history retrieval
    3. Order details extraction
    4. Pattern analysis
    Trust this function to handle the complete workflow.
"""
```

---

## 🎯 RECOMMENDED EXECUTION ORDER:

1. **Remove useless functions** (15 min) → 31 to 29 tools
2. **Rewrite 6 critical docstrings** (1 hour) → Fix broken functions
3. **Test those 6 functions** (30 min) → Verify they trigger
4. **Rewrite remaining 23 docstrings** (2 hours) → Consistency
5. **Reduce prompt** (1 hour) → 622 to 150 lines
6. **Final testing** (1 hour) → All 17 production tests

**Total time: 6-7 hours for complete fix**

---

**This document is the REFERENCE for all fixes. Keep it updated as we learn more.**

