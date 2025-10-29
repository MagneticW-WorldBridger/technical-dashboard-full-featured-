"""
MODULAR AGENT ARCHITECTURE FOR WOODSTOCK FURNISHINGS
=====================================================

This architecture splits the monolithic agent into specialized micro-agents,
each responsible for a single domain/tool, coordinated by a main orchestrator.

Based on the principle: 1 agent = 1 tool/responsibility
"""

import asyncio
from typing import Dict, Any, List, Optional, Union
from pydantic_ai import Agent
from pydantic import BaseModel
from enum import Enum
from abc import ABC, abstractmethod
import json

# ============================================================================
# DOMAIN MODELS
# ============================================================================

class AgentCapability(Enum):
    """Defines what each specialized agent can do"""
    CUSTOMER_SEARCH = "customer_search"
    ORDER_MANAGEMENT = "order_management" 
    PRODUCT_SEARCH = "product_search"
    MEMORY_OPERATIONS = "memory_operations"
    ANALYTICS = "analytics"
    PHONE_INTEGRATION = "phone_integration"
    SUPPORT_ESCALATION = "support_escalation"

class TaskPriority(Enum):
    """Task priority levels for async execution"""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4

class ChainedCommand(BaseModel):
    """Represents a multi-step operation"""
    id: str
    steps: List[Dict[str, Any]]
    current_step: int = 0
    context: Dict[str, Any] = {}
    results: List[Dict[str, Any]] = []
    status: str = "pending"

# ============================================================================
# BASE AGENT INTERFACE
# ============================================================================

class SpecializedAgent(ABC):
    """Base class for all specialized agents"""
    
    def __init__(self, name: str, capability: AgentCapability):
        self.name = name
        self.capability = capability
        self.agent = None
        
    @abstractmethod
    async def initialize(self, model: str):
        """Initialize the PydanticAI agent with specific tools"""
        pass
    
    @abstractmethod
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single task and return results"""
        pass
    
    @abstractmethod
    def can_handle(self, task_type: str) -> bool:
        """Check if this agent can handle the given task type"""
        pass

# ============================================================================
# SPECIALIZED AGENTS
# ============================================================================

class CustomerSearchAgent(SpecializedAgent):
    """Agent specialized in customer lookup operations"""
    
    def __init__(self):
        super().__init__("CustomerSearchAgent", AgentCapability.CUSTOMER_SEARCH)
        
    async def initialize(self, model: str):
        """Initialize with customer search tools only"""
        from pydantic_ai import Tool
        
        # Define customer search tools
        @Tool
        async def search_customer_by_phone(phone: str) -> Dict:
            """Search customer by phone number"""
            # Implementation here
            return {"customer_id": "CUST123", "name": "John Doe", "phone": phone}
        
        @Tool
        async def search_customer_by_email(email: str) -> Dict:
            """Search customer by email"""
            # Implementation here
            return {"customer_id": "CUST123", "name": "John Doe", "email": email}
        
        # Create agent with ONLY customer search tools
        self.agent = Agent(
            model=model,
            tools=[search_customer_by_phone, search_customer_by_email],
            instructions="""You are a customer search specialist. 
            Your ONLY job is to find customers by phone or email.
            Return customer_id and basic info."""
        )
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute customer search task"""
        search_type = task.get("search_type")
        search_value = task.get("search_value")
        
        if search_type == "phone":
            prompt = f"Find customer with phone: {search_value}"
        elif search_type == "email":
            prompt = f"Find customer with email: {search_value}"
        else:
            return {"error": "Invalid search type"}
        
        result = await self.agent.run(prompt)
        return {"customer_data": result.data, "status": "success"}
    
    def can_handle(self, task_type: str) -> bool:
        return task_type in ["search_customer_phone", "search_customer_email"]

class OrderManagementAgent(SpecializedAgent):
    """Agent specialized in order operations"""
    
    def __init__(self):
        super().__init__("OrderManagementAgent", AgentCapability.ORDER_MANAGEMENT)
        
    async def initialize(self, model: str):
        """Initialize with order management tools only"""
        from pydantic_ai import Tool
        
        @Tool
        async def get_customer_orders(customer_id: str) -> List[Dict]:
            """Get all orders for a customer"""
            # Implementation here
            return [
                {"order_id": "ORD001", "date": "2024-01-15", "total": 1299.99},
                {"order_id": "ORD002", "date": "2024-02-20", "total": 899.99}
            ]
        
        @Tool
        async def get_order_details(order_id: str) -> Dict:
            """Get detailed order information"""
            # Implementation here
            return {
                "order_id": order_id,
                "items": [
                    {"sku": "SOFA123", "name": "Modern Sofa", "price": 899.99}
                ],
                "status": "Delivered",
                "delivery_date": "2024-02-25"
            }
        
        self.agent = Agent(
            model=model,
            tools=[get_customer_orders, get_order_details],
            instructions="""You are an order management specialist.
            Handle order lookups and details ONLY."""
        )
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute order management task"""
        task_type = task.get("type")
        
        if task_type == "list_orders":
            customer_id = task.get("customer_id")
            result = await self.agent.run(f"Get all orders for customer {customer_id}")
            return {"orders": result.data, "status": "success"}
            
        elif task_type == "order_details":
            order_id = task.get("order_id")
            result = await self.agent.run(f"Get details for order {order_id}")
            return {"order_details": result.data, "status": "success"}
        
        return {"error": "Unknown task type"}
    
    def can_handle(self, task_type: str) -> bool:
        return task_type in ["list_orders", "order_details"]

class ProductSearchAgent(SpecializedAgent):
    """Agent specialized in product search and recommendations"""
    
    def __init__(self):
        super().__init__("ProductSearchAgent", AgentCapability.PRODUCT_SEARCH)
        
    async def initialize(self, model: str):
        # Similar pattern - tools for product search only
        pass
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        # Product search execution
        pass
    
    def can_handle(self, task_type: str) -> bool:
        return task_type in ["search_products", "get_product_details", "price_filter"]

# ============================================================================
# ORCHESTRATOR AGENT
# ============================================================================

class OrchestratorAgent:
    """
    Main orchestrator that:
    1. Analyzes user intent
    2. Routes to appropriate specialized agents
    3. Manages chained operations
    4. Handles async execution
    """
    
    def __init__(self, model: str):
        self.model = model
        self.agents: Dict[AgentCapability, SpecializedAgent] = {}
        self.active_chains: Dict[str, ChainedCommand] = {}
        self.agent = None
        
    async def initialize(self):
        """Initialize orchestrator and all specialized agents"""
        
        # Initialize the main orchestrator agent (NO TOOLS)
        self.agent = Agent(
            model=self.model,
            instructions="""You are the main orchestrator. 
            Your job is to:
            1. Understand user intent
            2. Break down complex requests into steps
            3. Route tasks to specialized agents
            4. Coordinate multi-step operations
            
            You have access to these specialists:
            - CustomerSearchAgent: Find customers by phone/email
            - OrderManagementAgent: Handle orders and order details
            - ProductSearchAgent: Search and filter products
            - MemoryAgent: Remember and recall information
            - PhoneAgent: Handle phone call operations
            
            DO NOT try to execute tasks yourself. Always delegate."""
        )
        
        # Initialize all specialized agents
        await self._initialize_specialized_agents()
    
    async def _initialize_specialized_agents(self):
        """Initialize all specialized agents"""
        
        # Customer Search Agent
        customer_agent = CustomerSearchAgent()
        await customer_agent.initialize(self.model)
        self.agents[AgentCapability.CUSTOMER_SEARCH] = customer_agent
        
        # Order Management Agent
        order_agent = OrderManagementAgent()
        await order_agent.initialize(self.model)
        self.agents[AgentCapability.ORDER_MANAGEMENT] = order_agent
        
        # Product Search Agent
        product_agent = ProductSearchAgent()
        await product_agent.initialize(self.model)
        self.agents[AgentCapability.PRODUCT_SEARCH] = product_agent
        
        # Add more agents as needed...
        
        print(f"✅ Initialized {len(self.agents)} specialized agents")
    
    async def process_request(self, user_input: str, context: Dict = None) -> Dict[str, Any]:
        """
        Main entry point for processing user requests
        """
        
        # Step 1: Analyze intent and create execution plan
        plan = await self._create_execution_plan(user_input, context)
        
        # Step 2: Check if this is a chained operation
        if plan.get("is_chained"):
            return await self._execute_chained_command(plan)
        
        # Step 3: Single operation - route to appropriate agent
        return await self._execute_single_task(plan)
    
    async def _create_execution_plan(self, user_input: str, context: Dict = None) -> Dict[str, Any]:
        """
        Use orchestrator agent to analyze intent and create execution plan
        """
        
        prompt = f"""
        Analyze this request and create an execution plan:
        User Input: {user_input}
        Context: {json.dumps(context or {})}
        
        Determine:
        1. Is this a multi-step operation? 
        2. What agents are needed?
        3. What is the order of operations?
        4. What data needs to be passed between steps?
        
        Return a structured plan.
        """
        
        result = await self.agent.run(prompt)
        
        # Parse the orchestrator's analysis
        # In real implementation, this would return structured data
        
        # Example for the customer order lookup scenario
        if "order" in user_input.lower() and ("phone" in user_input.lower() or "email" in user_input.lower()):
            return {
                "is_chained": True,
                "chain_id": "order_lookup_001",
                "steps": [
                    {
                        "step": 1,
                        "agent": AgentCapability.CUSTOMER_SEARCH,
                        "task": {"type": "search_customer_phone", "search_value": context.get("phone")}
                    },
                    {
                        "step": 2,
                        "agent": AgentCapability.ORDER_MANAGEMENT,
                        "task": {"type": "list_orders", "customer_id": "{step_1.customer_id}"}
                    },
                    {
                        "step": 3,
                        "agent": AgentCapability.ORDER_MANAGEMENT,
                        "task": {"type": "order_details", "order_id": "{user_selection}"}
                    }
                ]
            }
        
        # Default single task
        return {
            "is_chained": False,
            "agent": self._determine_agent(user_input),
            "task": self._create_task(user_input)
        }
    
    async def _execute_chained_command(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a multi-step chained operation
        """
        
        chain = ChainedCommand(
            id=plan["chain_id"],
            steps=plan["steps"],
            current_step=0
        )
        
        self.active_chains[chain.id] = chain
        
        try:
            for step in chain.steps:
                # Get the appropriate agent
                agent_capability = step["agent"]
                agent = self.agents.get(agent_capability)
                
                if not agent:
                    raise ValueError(f"No agent found for capability: {agent_capability}")
                
                # Prepare task with context from previous steps
                task = self._prepare_task_with_context(step["task"], chain.results)
                
                # Execute the step
                result = await agent.execute(task)
                
                # Store result
                chain.results.append(result)
                chain.current_step += 1
                
                # Check if user input is needed (e.g., selecting an order)
                if "{user_selection}" in str(step.get("task", {})):
                    # Return intermediate results for user selection
                    return {
                        "status": "awaiting_user_input",
                        "chain_id": chain.id,
                        "data": result,
                        "prompt": "Please select an order from the list"
                    }
            
            # All steps completed
            chain.status = "completed"
            
            # Format final result as HTML (as requested)
            html_result = self._format_results_as_html(chain.results)
            
            return {
                "status": "success",
                "chain_id": chain.id,
                "html": html_result,
                "raw_data": chain.results
            }
            
        except Exception as e:
            chain.status = "failed"
            return {
                "status": "error",
                "chain_id": chain.id,
                "error": str(e)
            }
    
    async def _execute_single_task(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single task with the appropriate agent"""
        
        agent_capability = plan["agent"]
        agent = self.agents.get(agent_capability)
        
        if not agent:
            return {"error": f"No agent found for capability: {agent_capability}"}
        
        return await agent.execute(plan["task"])
    
    def _prepare_task_with_context(self, task: Dict, previous_results: List[Dict]) -> Dict:
        """Replace placeholders in task with actual values from previous steps"""
        
        task_str = json.dumps(task)
        
        # Replace placeholders like {step_1.customer_id}
        for i, result in enumerate(previous_results, 1):
            if "customer_data" in result:
                task_str = task_str.replace(
                    f"{{step_{i}.customer_id}}", 
                    result["customer_data"].get("customer_id", "")
                )
            # Add more replacements as needed
        
        return json.loads(task_str)
    
    def _format_results_as_html(self, results: List[Dict]) -> str:
        """Format chain results as HTML"""
        
        html = "<div class='order-details'>"
        
        # Extract order details from last result
        if results and "order_details" in results[-1]:
            details = results[-1]["order_details"]
            
            html += f"""
            <h2>Order Details</h2>
            <div class='order-info'>
                <p><strong>Order ID:</strong> {details.get('order_id')}</p>
                <p><strong>Status:</strong> {details.get('status')}</p>
                <p><strong>Delivery Date:</strong> {details.get('delivery_date')}</p>
            </div>
            <h3>Items</h3>
            <ul>
            """
            
            for item in details.get('items', []):
                html += f"""
                <li>
                    <strong>{item['name']}</strong> (SKU: {item['sku']})
                    <span class='price'>${item['price']}</span>
                </li>
                """
            
            html += "</ul></div>"
        
        return html
    
    def _determine_agent(self, user_input: str) -> AgentCapability:
        """Simple intent detection to determine which agent to use"""
        
        input_lower = user_input.lower()
        
        if "customer" in input_lower or "phone" in input_lower or "email" in input_lower:
            return AgentCapability.CUSTOMER_SEARCH
        elif "order" in input_lower:
            return AgentCapability.ORDER_MANAGEMENT
        elif "product" in input_lower or "furniture" in input_lower:
            return AgentCapability.PRODUCT_SEARCH
        elif "remember" in input_lower or "recall" in input_lower:
            return AgentCapability.MEMORY_OPERATIONS
        
        # Default
        return AgentCapability.CUSTOMER_SEARCH
    
    def _create_task(self, user_input: str) -> Dict:
        """Create a task definition from user input"""
        # Simplified - in real implementation would use NLP
        return {"raw_input": user_input}

# ============================================================================
# ASYNC EXECUTION MANAGER
# ============================================================================

class AsyncExecutionManager:
    """
    Manages async execution of tasks across multiple agents
    Implements the suggestion from Jorge G about non-blocking async calls
    """
    
    def __init__(self, orchestrator: OrchestratorAgent):
        self.orchestrator = orchestrator
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.results_cache: Dict[str, Any] = {}
        
    async def submit_tasks_async(self, tasks: List[Dict], priority: TaskPriority = TaskPriority.NORMAL):
        """
        Submit multiple tasks for async execution
        Returns immediately with task IDs
        """
        
        task_ids = []
        
        for task in tasks:
            task_id = f"task_{len(self.results_cache) + 1}"
            task_ids.append(task_id)
            
            # Add to queue with priority
            await self.task_queue.put((priority.value, task_id, task))
            
            # Start async execution
            asyncio.create_task(self._execute_task_async(task_id, task))
        
        return task_ids
    
    async def _execute_task_async(self, task_id: str, task: Dict):
        """Execute a task asynchronously and cache results"""
        
        try:
            # Determine which agent should handle this
            agent_capability = task.get("agent")
            agent = self.orchestrator.agents.get(agent_capability)
            
            if agent:
                result = await agent.execute(task.get("task_data"))
                self.results_cache[task_id] = {
                    "status": "completed",
                    "result": result
                }
            else:
                self.results_cache[task_id] = {
                    "status": "error",
                    "error": "No suitable agent found"
                }
                
        except Exception as e:
            self.results_cache[task_id] = {
                "status": "error",
                "error": str(e)
            }
    
    async def wait_for_results(self, task_ids: List[str], timeout: int = 30) -> Dict[str, Any]:
        """
        Wait for multiple async tasks to complete
        Implements the waiting strategy suggested by Jorge G
        """
        
        start_time = asyncio.get_event_loop().time()
        results = {}
        
        while len(results) < len(task_ids):
            # Check timeout
            if asyncio.get_event_loop().time() - start_time > timeout:
                break
            
            # Check for completed tasks
            for task_id in task_ids:
                if task_id in self.results_cache and task_id not in results:
                    results[task_id] = self.results_cache[task_id]
            
            # Small delay to prevent busy waiting
            await asyncio.sleep(0.1)
        
        return results
    
    async def execute_parallel_search(self, search_queries: List[str]) -> Dict[str, Any]:
        """
        Example: Execute multiple searches in parallel across different agents
        """
        
        tasks = []
        
        for query in search_queries:
            if "customer" in query.lower():
                tasks.append({
                    "agent": AgentCapability.CUSTOMER_SEARCH,
                    "task_data": {"type": "search", "query": query}
                })
            elif "product" in query.lower():
                tasks.append({
                    "agent": AgentCapability.PRODUCT_SEARCH,
                    "task_data": {"type": "search", "query": query}
                })
        
        # Submit all tasks async
        task_ids = await self.submit_tasks_async(tasks, TaskPriority.HIGH)
        
        # Wait for all results
        results = await self.wait_for_results(task_ids)
        
        return results

# ============================================================================
# INTEGRATION WITH EXISTING BACKEND
# ============================================================================

async def create_modular_backend():
    """
    Factory function to create the modular backend
    Replaces the monolithic agent initialization
    """
    
    import os
    model = f"openai:{os.getenv('OPENAI_MODEL', 'gpt-4')}"
    
    # Create orchestrator
    orchestrator = OrchestratorAgent(model)
    await orchestrator.initialize()
    
    # Create async execution manager
    async_manager = AsyncExecutionManager(orchestrator)
    
    return orchestrator, async_manager

# ============================================================================
# FASTAPI INTEGRATION
# ============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Global references
orchestrator: Optional[OrchestratorAgent] = None
async_manager: Optional[AsyncExecutionManager] = None

@app.on_event("startup")
async def startup_event():
    """Initialize the modular agent system on startup"""
    global orchestrator, async_manager
    orchestrator, async_manager = await create_modular_backend()
    print("✅ Modular agent system initialized")

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None
    chain_id: Optional[str] = None

@app.post("/v1/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint using the modular architecture
    """
    
    try:
        # Check if this is a continuation of a chained command
        if request.chain_id and request.chain_id in orchestrator.active_chains:
            # Continue the chain with user input
            chain = orchestrator.active_chains[request.chain_id]
            # Process continuation...
        
        # New request - process through orchestrator
        result = await orchestrator.process_request(
            request.message, 
            request.context
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/chat/async")
async def async_chat_endpoint(request: ChatRequest):
    """
    Async endpoint for parallel operations
    """
    
    # Example: User wants to search multiple things at once
    # "Find customer John Doe and also show me all sofas under $1000"
    
    searches = [
        "Find customer John Doe",
        "Show sofas under $1000"
    ]
    
    results = await async_manager.execute_parallel_search(searches)
    
    return {"status": "success", "results": results}

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

async def example_usage():
    """
    Example of how the modular system handles the customer order lookup flow
    """
    
    # Initialize system
    orchestrator, async_manager = await create_modular_backend()
    
    # User says: "Show me orders for customer with phone 555-1234"
    result = await orchestrator.process_request(
        "Show me orders for customer with phone 555-1234",
        {"phone": "555-1234"}
    )
    
    print("Step 1 Result:", result)
    
    # If awaiting user selection
    if result["status"] == "awaiting_user_input":
        # User selects order ORD001
        result = await orchestrator.process_request(
            "I want to see order ORD001",
            {"chain_id": result["chain_id"], "order_id": "ORD001"}
        )
    
    print("Final Result HTML:", result.get("html"))

if __name__ == "__main__":
    # Run example
    asyncio.run(example_usage())
