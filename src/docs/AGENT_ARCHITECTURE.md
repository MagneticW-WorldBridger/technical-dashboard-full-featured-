# 🤖 WOODSTOCK OUTLET AGENT ARCHITECTURE

## PROBLEMA ACTUAL ❌
El sistema actual NO es un verdadero agente conversacional:
- No hay memoria entre interacciones 
- No hay orquestación inteligente
- No hay agentes especializados
- No hay handoffs entre especialistas
- Es solo "function calling" básico

## NUEVA ARQUITECTURA SWARM 🎯

### PATRÓN: Agent-as-Tool + Orchestrator
```
MAIN ORCHESTRATOR
├── TRIAGE AGENT (Determina qué especialista necesita)
├── CUSTOMER SERVICE AGENT (Loft API specialist)  
├── PRODUCT SPECIALIST AGENT (Magento specialist)
├── APPOINTMENT AGENT (Google Calendar MCP)
└── ANALYTICS AGENT (Customer insights)
```

### COMPONENTS PRINCIPALES

#### 1. MAIN ORCHESTRATOR AGENT
- **Role**: Supervisor central que mantiene contexto completo
- **Memory**: Conversation history, customer state, previous actions
- **Decision Making**: Decide qué especialista necesita y cuándo hacer handoffs
- **Tools**: Todos los specialist agents como tools

#### 2. TRIAGE AGENT  
- **Role**: Clasificación inicial y routing inteligente
- **Speciality**: Determinar intención del usuario
- **Handoffs**: Hacia especialistas apropiados

#### 3. CUSTOMER SERVICE AGENT (Loft)
- **Role**: Especialista en customer data y order management
- **Tools**: Loft API functions
- **Context**: Customer journey, order history, analytics

#### 4. PRODUCT SPECIALIST AGENT (Magento)
- **Role**: Especialista en product catalog y search
- **Tools**: Magento API functions, search, media, categories
- **Context**: Product recommendations, inventory, pricing

#### 5. APPOINTMENT AGENT
- **Role**: Calendar management y scheduling
- **Tools**: Google Calendar MCP server
- **Context**: Available slots, customer preferences

#### 6. ANALYTICS AGENT  
- **Role**: Insights y recommendations
- **Tools**: Database queries, pattern analysis
- **Context**: Customer behavior, trends, predictions

## IMPLEMENTATION PLAN

### Phase 1: Core Orchestrator
```javascript
// New file: services/agents/orchestrator.js
class MainOrchestratorAgent {
  constructor() {
    this.conversationMemory = new Map();
    this.customerContext = new Map();
    this.specialists = {
      triage: new TriageAgent(),
      customerService: new CustomerServiceAgent(),
      productSpecialist: new ProductSpecialistAgent(),
      appointments: new AppointmentAgent(),
      analytics: new AnalyticsAgent()
    };
  }

  async processUserMessage(userId, message, history) {
    // 1. Load/update conversation memory
    const context = await this.loadConversationContext(userId);
    
    // 2. Determine specialist needed
    const specialist = await this.specialists.triage.determineSpecialist(message, context);
    
    // 3. Handoff to specialist with full context
    const response = await this.handoffToSpecialist(specialist, message, context);
    
    // 4. Update memory with results
    await this.updateConversationMemory(userId, {
      userMessage: message,
      specialist: specialist,
      response: response,
      context: context
    });
    
    return response;
  }
}
```

### Phase 2: Specialist Agents
Cada especialista implementa:
- Context awareness
- Tool specialization  
- Handoff capabilities
- Memory persistence

### Phase 3: Integration
- Replace current function-calling.js 
- Update server.js chat endpoint
- Add conversation memory layer
- Implement proper streaming with context

## BENEFITS 🚀

### For Users:
- **Contextual conversations**: "Show me more like the sofa I asked about earlier"
- **Seamless handoffs**: From product search to appointment booking
- **Personalized experience**: Remembers preferences and history

### For Development:
- **Modular**: Each agent is independent and testable
- **Scalable**: Easy to add new specialists (inventory, shipping, etc.)
- **Maintainable**: Clear separation of concerns
- **Observable**: Full tracing of agent decisions and handoffs

### For Business:
- **Better customer experience**: Feels like talking to expert humans
- **Higher conversion**: Smooth path from inquiry to sale
- **Analytics**: Deep insights into customer journey and agent performance

## DEMO SCENARIOS

### Client-Facing Scenarios:
1. **Product Discovery Journey**: "I need a dining table" → Product search → Recommendations → Appointment booking
2. **Order Inquiry**: "Where's my order?" → Customer lookup → Status update → Proactive cross-sell
3. **Complex Request**: "I want to return this and find something else" → Return process → New product search → Scheduling

### Internal Team Scenarios:
1. **Customer Analytics**: "Show me insights for customer #123" → Full journey analysis
2. **Inventory Alerts**: "Check stock levels for popular items" → Product analytics
3. **Performance Review**: "How are our appointments converting?" → Analytics dashboard

This architecture transforms the chatbot from a simple function-calling system into a true conversational AI that understands context, maintains memory, and provides expert-level assistance across all domains.