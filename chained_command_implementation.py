"""
CHAINED COMMAND IMPLEMENTATION
Customer Order Lookup Flow with Async Execution
================================================

This implementation demonstrates the specific chained command scenario:
1. Search customer by phone/email → get customer_id
2. Use customer_id → search all orders
3. User chooses order → get order_id  
4. Use order_id → get order details and display in HTML

Following Jorge G's recommendations:
- Modular agents (1 agent = 1 tool)
- Async execution to not block main thread
- Waiting strategy for responses
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import uuid
from pydantic import BaseModel
from pydantic_ai import Agent, Tool

# ============================================================================
# MODELS & TYPES
# ============================================================================

class ChainStatus(Enum):
    """Status of a chained command execution"""
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_USER_INPUT = "awaiting_user_input"
    COMPLETED = "completed"
    FAILED = "failed"

class ChainStep(BaseModel):
    """Individual step in a chain"""
    id: str
    agent_name: str
    action: str
    params: Dict[str, Any]
    depends_on: Optional[str] = None  # ID of previous step
    requires_user_input: bool = False
    result: Optional[Dict] = None
    status: str = "pending"

class ChainContext(BaseModel):
    """Context passed between chain steps"""
    chain_id: str
    user_id: str
    conversation_id: str
    steps: List[ChainStep]
    current_step_index: int = 0
    status: ChainStatus = ChainStatus.PENDING
    results: Dict[str, Any] = {}
    created_at: datetime = datetime.now()
    completed_at: Optional[datetime] = None

# ============================================================================
# SPECIALIZED AGENTS FOR ORDER LOOKUP FLOW
# ============================================================================

class CustomerSearchAgent:
    """Agent specialized in customer search operations"""
    
    def __init__(self, model: str, db_connection):
        self.model = model
        self.db = db_connection
        self.agent = None
        
    async def initialize(self):
        """Initialize with customer search tools"""
        
        @Tool
        async def search_by_phone(phone: str) -> Dict:
            """Search customer by phone number"""
            async with self.db.acquire() as conn:
                result = await conn.fetchone(
                    """
                    SELECT customer_id, name, email, phone, 
                           created_at, loyalty_status
                    FROM customers 
                    WHERE phone = $1
                    """, 
                    phone
                )
                
                if result:
                    return {
                        "found": True,
                        "customer": dict(result)
                    }
                return {
                    "found": False,
                    "message": f"No customer found with phone {phone}"
                }
        
        @Tool
        async def search_by_email(email: str) -> Dict:
            """Search customer by email"""
            async with self.db.acquire() as conn:
                result = await conn.fetchone(
                    """
                    SELECT customer_id, name, email, phone, 
                           created_at, loyalty_status
                    FROM customers 
                    WHERE email = $1
                    """, 
                    email
                )
                
                if result:
                    return {
                        "found": True,
                        "customer": dict(result)
                    }
                return {
                    "found": False,
                    "message": f"No customer found with email {email}"
                }
        
        self.agent = Agent(
            model=self.model,
            tools=[search_by_phone, search_by_email],
            instructions="""
            You are a customer search specialist.
            Search for customers by phone or email.
            Return customer_id and basic information.
            """
        )
    
    async def execute(self, action: str, params: Dict) -> Dict:
        """Execute customer search action"""
        
        if action == "search_by_phone":
            prompt = f"Search for customer with phone: {params['phone']}"
        elif action == "search_by_email":
            prompt = f"Search for customer with email: {params['email']}"
        else:
            return {"error": f"Unknown action: {action}"}
        
        result = await self.agent.run(prompt)
        return result.data

class OrderManagementAgent:
    """Agent specialized in order operations"""
    
    def __init__(self, model: str, db_connection):
        self.model = model
        self.db = db_connection
        self.agent = None
        
    async def initialize(self):
        """Initialize with order management tools"""
        
        @Tool
        async def get_customer_orders(customer_id: str) -> Dict:
            """Get all orders for a customer"""
            async with self.db.acquire() as conn:
                orders = await conn.fetch(
                    """
                    SELECT o.order_id, o.order_date, o.total_amount,
                           o.status, o.shipping_address,
                           COUNT(oi.item_id) as item_count
                    FROM orders o
                    LEFT JOIN order_items oi ON o.order_id = oi.order_id
                    WHERE o.customer_id = $1
                    GROUP BY o.order_id
                    ORDER BY o.order_date DESC
                    LIMIT 20
                    """, 
                    customer_id
                )
                
                return {
                    "customer_id": customer_id,
                    "order_count": len(orders),
                    "orders": [dict(o) for o in orders]
                }
        
        @Tool
        async def get_order_details(order_id: str) -> Dict:
            """Get detailed information for an order"""
            async with self.db.acquire() as conn:
                # Get order info
                order = await conn.fetchone(
                    """
                    SELECT o.*, c.name as customer_name, c.email
                    FROM orders o
                    JOIN customers c ON o.customer_id = c.customer_id
                    WHERE o.order_id = $1
                    """,
                    order_id
                )
                
                if not order:
                    return {"error": f"Order {order_id} not found"}
                
                # Get order items
                items = await conn.fetch(
                    """
                    SELECT oi.*, p.name, p.description, p.image_url
                    FROM order_items oi
                    JOIN products p ON oi.product_sku = p.sku
                    WHERE oi.order_id = $1
                    """,
                    order_id
                )
                
                return {
                    "order": dict(order),
                    "items": [dict(i) for i in items]
                }
        
        self.agent = Agent(
            model=self.model,
            tools=[get_customer_orders, get_order_details],
            instructions="""
            You are an order management specialist.
            Handle order lookups and provide order details.
            """
        )
    
    async def execute(self, action: str, params: Dict) -> Dict:
        """Execute order management action"""
        
        if action == "list_orders":
            prompt = f"Get all orders for customer {params['customer_id']}"
        elif action == "get_details":
            prompt = f"Get details for order {params['order_id']}"
        else:
            return {"error": f"Unknown action: {action}"}
        
        result = await self.agent.run(prompt)
        return result.data

# ============================================================================
# CHAIN EXECUTOR WITH ASYNC HANDLING
# ============================================================================

class ChainedCommandExecutor:
    """
    Executes chained commands with async handling
    Implements Jorge's suggestion for non-blocking execution
    """
    
    def __init__(self, agents: Dict[str, Any]):
        self.agents = agents
        self.active_chains: Dict[str, ChainContext] = {}
        self.execution_tasks: Dict[str, asyncio.Task] = {}
        
    def create_order_lookup_chain(self, search_type: str, search_value: str, user_id: str) -> ChainContext:
        """
        Create a chain for the customer order lookup flow
        """
        
        chain_id = str(uuid.uuid4())
        
        steps = [
            # Step 1: Search customer
            ChainStep(
                id="step_1",
                agent_name="customer",
                action=f"search_by_{search_type}",
                params={search_type: search_value},
                depends_on=None,
                requires_user_input=False
            ),
            # Step 2: Get customer orders
            ChainStep(
                id="step_2",
                agent_name="order",
                action="list_orders",
                params={"customer_id": "${step_1.customer.customer_id}"},
                depends_on="step_1",
                requires_user_input=False
            ),
            # Step 3: User selects order (requires input)
            ChainStep(
                id="step_3",
                agent_name="user_input",
                action="select_order",
                params={},
                depends_on="step_2",
                requires_user_input=True
            ),
            # Step 4: Get order details
            ChainStep(
                id="step_4",
                agent_name="order",
                action="get_details",
                params={"order_id": "${step_3.order_id}"},
                depends_on="step_3",
                requires_user_input=False
            )
        ]
        
        chain = ChainContext(
            chain_id=chain_id,
            user_id=user_id,
            conversation_id=f"conv_{user_id}",
            steps=steps
        )
        
        self.active_chains[chain_id] = chain
        return chain
    
    async def execute_chain(self, chain_id: str) -> Dict[str, Any]:
        """
        Execute a chain asynchronously
        Returns immediately, processing happens in background
        """
        
        chain = self.active_chains.get(chain_id)
        if not chain:
            return {"error": "Chain not found"}
        
        # Start async execution
        task = asyncio.create_task(self._execute_chain_async(chain))
        self.execution_tasks[chain_id] = task
        
        # Return immediately with chain status
        return {
            "chain_id": chain_id,
            "status": "started",
            "message": "Chain execution started in background"
        }
    
    async def _execute_chain_async(self, chain: ChainContext):
        """
        Internal async chain execution
        Runs in background without blocking
        """
        
        try:
            chain.status = ChainStatus.RUNNING
            
            for i, step in enumerate(chain.steps):
                chain.current_step_index = i
                
                # Check if this step requires user input
                if step.requires_user_input:
                    chain.status = ChainStatus.AWAITING_USER_INPUT
                    # Wait for user input (will be resumed by continue_chain)
                    return
                
                # Resolve parameters with previous results
                resolved_params = self._resolve_parameters(step.params, chain.results)
                
                # Execute step with appropriate agent
                if step.agent_name in self.agents:
                    agent = self.agents[step.agent_name]
                    
                    # Execute asynchronously
                    result = await agent.execute(step.action, resolved_params)
                    
                    # Store result
                    step.result = result
                    step.status = "completed"
                    chain.results[step.id] = result
                    
                    print(f"✅ Completed {step.id}: {step.action}")
                
            # All steps completed
            chain.status = ChainStatus.COMPLETED
            chain.completed_at = datetime.now()
            
            # Generate final HTML output
            chain.results["final_output"] = self._generate_html_output(chain)
            
        except Exception as e:
            chain.status = ChainStatus.FAILED
            chain.results["error"] = str(e)
            print(f"❌ Chain {chain.chain_id} failed: {e}")
    
    async def continue_chain(self, chain_id: str, user_input: Dict) -> Dict[str, Any]:
        """
        Continue a chain that's waiting for user input
        """
        
        chain = self.active_chains.get(chain_id)
        if not chain:
            return {"error": "Chain not found"}
        
        if chain.status != ChainStatus.AWAITING_USER_INPUT:
            return {"error": "Chain not awaiting input"}
        
        # Store user input in current step
        current_step = chain.steps[chain.current_step_index]
        current_step.result = user_input
        current_step.status = "completed"
        chain.results[current_step.id] = user_input
        
        # Resume execution
        chain.status = ChainStatus.RUNNING
        task = asyncio.create_task(self._resume_chain_async(chain))
        self.execution_tasks[chain_id] = task
        
        return {
            "chain_id": chain_id,
            "status": "resumed",
            "message": "Chain execution resumed"
        }
    
    async def _resume_chain_async(self, chain: ChainContext):
        """Resume chain execution from current position"""
        
        # Continue from next step
        chain.current_step_index += 1
        
        # Execute remaining steps
        for i in range(chain.current_step_index, len(chain.steps)):
            step = chain.steps[i]
            chain.current_step_index = i
            
            if step.requires_user_input:
                chain.status = ChainStatus.AWAITING_USER_INPUT
                return
            
            resolved_params = self._resolve_parameters(step.params, chain.results)
            
            if step.agent_name in self.agents:
                agent = self.agents[step.agent_name]
                result = await agent.execute(step.action, resolved_params)
                
                step.result = result
                step.status = "completed"
                chain.results[step.id] = result
        
        chain.status = ChainStatus.COMPLETED
        chain.completed_at = datetime.now()
        chain.results["final_output"] = self._generate_html_output(chain)
    
    def _resolve_parameters(self, params: Dict, results: Dict) -> Dict:
        """
        Resolve parameters with values from previous steps
        e.g., ${step_1.customer.customer_id} → actual customer_id
        """
        
        resolved = {}
        for key, value in params.items():
            if isinstance(value, str) and value.startswith("${"):
                # Extract reference: ${step_1.customer.customer_id}
                path = value[2:-1].split(".")
                
                # Navigate through results
                current = results
                for part in path:
                    if isinstance(current, dict):
                        current = current.get(part)
                
                resolved[key] = current
            else:
                resolved[key] = value
        
        return resolved
    
    def _generate_html_output(self, chain: ChainContext) -> str:
        """Generate beautiful HTML output for order details"""
        
        # Get the final order details from step 4
        order_details = chain.results.get("step_4", {})
        
        if "error" in order_details:
            return f"<div class='error'>Error: {order_details['error']}</div>"
        
        order = order_details.get("order", {})
        items = order_details.get("items", [])
        
        html = f"""
        <div class="order-details-container">
            <div class="order-header">
                <h2>📦 Order Details</h2>
                <span class="order-id">#{order.get('order_id', 'N/A')}</span>
            </div>
            
            <div class="customer-info">
                <h3>👤 Customer Information</h3>
                <p><strong>Name:</strong> {order.get('customer_name', 'N/A')}</p>
                <p><strong>Email:</strong> {order.get('email', 'N/A')}</p>
            </div>
            
            <div class="order-info">
                <h3>📋 Order Information</h3>
                <p><strong>Date:</strong> {order.get('order_date', 'N/A')}</p>
                <p><strong>Status:</strong> <span class="status-{order.get('status', '').lower()}">{order.get('status', 'N/A')}</span></p>
                <p><strong>Total:</strong> <span class="price">${order.get('total_amount', 0):.2f}</span></p>
                <p><strong>Shipping Address:</strong> {order.get('shipping_address', 'N/A')}</p>
            </div>
            
            <div class="order-items">
                <h3>🛍️ Items ({len(items)})</h3>
                <div class="items-grid">
        """
        
        for item in items:
            html += f"""
                <div class="item-card">
                    <img src="{item.get('image_url', '/placeholder.jpg')}" alt="{item.get('name', 'Product')}">
                    <div class="item-details">
                        <h4>{item.get('name', 'N/A')}</h4>
                        <p class="sku">SKU: {item.get('product_sku', 'N/A')}</p>
                        <p class="description">{item.get('description', '')[:100]}...</p>
                        <div class="item-pricing">
                            <span class="quantity">Qty: {item.get('quantity', 1)}</span>
                            <span class="price">${item.get('price', 0):.2f}</span>
                        </div>
                    </div>
                </div>
            """
        
        html += """
                </div>
            </div>
            
            <style>
                .order-details-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 900px;
                    margin: 20px auto;
                    padding: 25px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    color: white;
                }
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid rgba(255,255,255,0.2);
                }
                .order-id {
                    font-size: 1.2em;
                    background: rgba(255,255,255,0.2);
                    padding: 5px 15px;
                    border-radius: 20px;
                }
                .customer-info, .order-info {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                }
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }
                .item-card {
                    background: rgba(255,255,255,0.15);
                    border-radius: 12px;
                    padding: 15px;
                    transition: transform 0.3s ease;
                }
                .item-card:hover {
                    transform: translateY(-5px);
                }
                .item-card img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .price {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #4ade80;
                }
                .status-delivered { color: #4ade80; }
                .status-pending { color: #fbbf24; }
                .status-processing { color: #60a5fa; }
            </style>
        </div>
        """
        
        return html
    
    async def get_chain_status(self, chain_id: str) -> Dict[str, Any]:
        """
        Get current status of a chain (for polling)
        """
        
        chain = self.active_chains.get(chain_id)
        if not chain:
            return {"error": "Chain not found"}
        
        return {
            "chain_id": chain_id,
            "status": chain.status.value,
            "current_step": chain.current_step_index,
            "total_steps": len(chain.steps),
            "results": chain.results if chain.status == ChainStatus.COMPLETED else None,
            "requires_input": chain.status == ChainStatus.AWAITING_USER_INPUT,
            "final_output": chain.results.get("final_output") if chain.status == ChainStatus.COMPLETED else None
        }

# ============================================================================
# FASTAPI INTEGRATION
# ============================================================================

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
import asyncpg
import os

app = FastAPI(title="Chained Order Lookup API")

# Global references
db_pool = None
executor = None

@app.on_event("startup")
async def startup():
    """Initialize database and agents"""
    global db_pool, executor
    
    # Create database connection pool
    db_pool = await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", 5432),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "woodstock")
    )
    
    # Initialize agents
    model = f"openai:{os.getenv('OPENAI_MODEL', 'gpt-4')}"
    
    customer_agent = CustomerSearchAgent(model, db_pool)
    await customer_agent.initialize()
    
    order_agent = OrderManagementAgent(model, db_pool)
    await order_agent.initialize()
    
    # Create executor with agents
    executor = ChainedCommandExecutor({
        "customer": customer_agent,
        "order": order_agent
    })
    
    print("✅ System initialized")

@app.post("/v1/order-lookup/start")
async def start_order_lookup(request: Dict):
    """
    Start the order lookup chain
    Example: {"search_type": "phone", "search_value": "555-1234", "user_id": "user123"}
    """
    
    search_type = request.get("search_type")  # "phone" or "email"
    search_value = request.get("search_value")
    user_id = request.get("user_id")
    
    if not all([search_type, search_value, user_id]):
        raise HTTPException(400, "Missing required parameters")
    
    # Create the chain
    chain = executor.create_order_lookup_chain(search_type, search_value, user_id)
    
    # Start async execution (non-blocking)
    await executor.execute_chain(chain.chain_id)
    
    return {
        "chain_id": chain.chain_id,
        "status": "started",
        "message": "Order lookup started. Poll /status endpoint for updates."
    }

@app.get("/v1/order-lookup/{chain_id}/status")
async def get_chain_status(chain_id: str):
    """Get current status of the chain"""
    
    status = await executor.get_chain_status(chain_id)
    
    if "error" in status:
        raise HTTPException(404, status["error"])
    
    return status

@app.post("/v1/order-lookup/{chain_id}/continue")
async def continue_chain(chain_id: str, request: Dict):
    """
    Continue chain with user input
    Example: {"order_id": "ORD001"}
    """
    
    result = await executor.continue_chain(chain_id, request)
    
    if "error" in result:
        raise HTTPException(400, result["error"])
    
    return result

@app.get("/v1/order-lookup/{chain_id}/result", response_class=HTMLResponse)
async def get_final_result(chain_id: str):
    """Get final HTML result"""
    
    status = await executor.get_chain_status(chain_id)
    
    if status.get("status") != "completed":
        return "<div>Chain not completed yet</div>"
    
    return status.get("final_output", "<div>No output available</div>")

# ============================================================================
# USAGE EXAMPLE
# ============================================================================

async def example_flow():
    """
    Complete example of the order lookup flow
    """
    
    import httpx
    
    async with httpx.AsyncClient() as client:
        # Step 1: Start the chain
        response = await client.post(
            "http://localhost:8000/v1/order-lookup/start",
            json={
                "search_type": "phone",
                "search_value": "555-1234",
                "user_id": "user123"
            }
        )
        chain_data = response.json()
        chain_id = chain_data["chain_id"]
        print(f"✅ Chain started: {chain_id}")
        
        # Step 2: Poll for status
        while True:
            await asyncio.sleep(1)
            response = await client.get(f"http://localhost:8000/v1/order-lookup/{chain_id}/status")
            status = response.json()
            
            print(f"📊 Status: {status['status']}, Step: {status['current_step']}/{status['total_steps']}")
            
            if status["status"] == "awaiting_user_input":
                # Chain needs user to select an order
                print("🔔 User input required - showing order list")
                
                # In real app, show orders to user and get selection
                # For demo, select first order
                response = await client.post(
                    f"http://localhost:8000/v1/order-lookup/{chain_id}/continue",
                    json={"order_id": "ORD001"}
                )
                print("✅ User selected order ORD001")
                
            elif status["status"] == "completed":
                # Get final HTML result
                response = await client.get(f"http://localhost:8000/v1/order-lookup/{chain_id}/result")
                html = response.text
                print(f"✅ Completed! HTML output length: {len(html)} chars")
                
                # Save or display HTML
                with open("order_details.html", "w") as f:
                    f.write(html)
                break
                
            elif status["status"] == "failed":
                print(f"❌ Chain failed: {status.get('error')}")
                break

if __name__ == "__main__":
    # Run the example
    asyncio.run(example_flow())
