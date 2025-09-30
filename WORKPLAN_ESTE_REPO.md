# 🎯 PLAN DE TRABAJO - ESTE REPO (WOODSTOCK)
## **QUE NECESITAMOS HACER AQUI**

**Situación Actual:** ✅ Ya tienes 221 conversaciones y 86,420 mensajes en producción  
**Meta:** 🔗 Hacer la integración perfecta con el inbox  

---

## 📊 **ESTADO ACTUAL - LO QUE YA FUNCIONA**

### **✅ PERFECTO Y LISTO:**
- **Database:** PostgreSQL con schema completo y datos reales
- **Backend:** FastAPI + PydanticAI funcionando en Railway 
- **Memory:** Sistema de memoria conversacional operativo
- **Functions:** 14 funciones LOFT todas probadas
- **Frontend:** Chat UI con componentes HTML dinámicos
- **API:** Endpoints `/v1/chat/completions` y `/v1/sessions/{user_id}` 

---

## 🔧 **LO QUE NECESITAMOS AGREGAR AQUI**

### **1. 📡 WEBHOOK PARA INBOX (PRIORIDAD 1)**

**Archivo:** `loft-chat-chingon/backend/main.py`

**Agregar endpoint nuevo:**
```python
# Nuevo endpoint para notificar inbox
@app.post("/webhook/inbox/new-message")  
async def notify_inbox_new_message(conversation_id: str, message_data: dict):
    """Notify unified inbox of new message"""
    # Send to your inbox webhook URL
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://your-inbox-webhook.com/woodstock-messages",
            json={
                "conversation_id": conversation_id,
                "source": "woodstock_ai",
                "message": message_data,
                "timestamp": datetime.now().isoformat()
            }
        )
```

**Modificar memoria para trigger webhook:**
```python
# En conversation_memory.py
async def save_assistant_message(self, conversation_id: str, content: str, ...):
    # ... existing save code ...
    
    # NUEVO: Trigger webhook to inbox
    await self.trigger_inbox_webhook(conversation_id, {
        "role": "assistant", 
        "content": content,
        "function_name": function_name
    })
```

### **2. 📋 API ENDPOINTS FOR INBOX (PRIORIDAD 2)**

**Agregar estos endpoints en main.py:**

```python
@app.get("/api/conversations")
async def get_all_conversations(
    limit: int = 50, 
    offset: int = 0,
    platform: Optional[str] = None,
    active_only: bool = True
):
    """Get conversations for inbox integration"""
    # Query database with filters
    # Return formatted for inbox consumption

@app.get("/api/conversations/{conversation_id}/messages")  
async def get_conversation_messages(conversation_id: str):
    """Get all messages for a conversation"""
    # Return with proper HTML formatting preserved

@app.post("/api/conversations/{conversation_id}/mark-read")
async def mark_conversation_read(conversation_id: str):
    """Mark conversation as read from inbox"""
    # Update read status

@app.get("/api/conversations/recent")
async def get_recent_activity(hours: int = 24):
    """Get recent conversation activity for inbox polling"""
    # Return conversations with activity in last N hours
```

### **3. 🔄 REAL-TIME WEBSOCKET (PRIORIDAD 3)**

**Agregar WebSocket support:**
```python
from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    async def broadcast_new_message(self, conversation_id: str, message: dict):
        for connection in self.active_connections:
            await connection.send_json({
                "type": "new_message",
                "conversation_id": conversation_id, 
                "message": message
            })

manager = ConnectionManager()

@app.websocket("/ws/inbox")
async def websocket_inbox(websocket: WebSocket):
    """WebSocket for real-time inbox updates"""
    await manager.connect(websocket)
    # Keep connection alive for real-time updates
```

### **4. 📊 CONVERSATION METADATA ENHANCEMENT**

**Mejorar context extraction:**
```python  
# En conversation_memory.py
async def get_conversation_summary(self, conversation_id: str) -> Dict:
    """Get rich conversation summary for inbox"""
    return {
        "customer_info": await self.extract_customer_context(conversation_id),
        "functions_used": await self.get_functions_used(conversation_id),
        "key_topics": await self.extract_topics(conversation_id),
        "sentiment": await self.analyze_sentiment(conversation_id),
        "priority_level": await self.calculate_priority(conversation_id)
    }
```

---

## 🗄️ **SCHEMA ENHANCEMENTS NEEDED**

### **Agregar campos para inbox integration:**

```sql
-- Add inbox-related fields to chatbot_conversations
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS inbox_status VARCHAR(50) DEFAULT 'new';
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS assigned_agent_id UUID;  
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal';
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for inbox queries
CREATE INDEX IF NOT EXISTS idx_conversations_inbox_status ON chatbot_conversations(inbox_status, last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_priority ON chatbot_conversations(priority_level, last_message_at);
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS NUEVOS**

```
loft-chat-chingon/
├── backend/
│   ├── main.py                     # ✅ Ya existe - AGREGAR endpoints
│   ├── conversation_memory.py      # ✅ Ya existe - AGREGAR webhooks  
│   ├── schemas.py                  # ✅ Ya existe - AGREGAR inbox schemas
│   ├── inbox_integration.py        # 🆕 CREAR - Webhook logic
│   ├── websocket_manager.py        # 🆕 CREAR - Real-time updates
│   └── conversation_enrichment.py  # 🆕 CREAR - Metadata extraction
├── frontend/                       # ✅ Ya perfecto
└── requirements.txt               # ✅ Agregar: websockets, httpx
```

---

## ⏰ **TIMELINE REALISTA**

### **🔥 ESTA SEMANA (Prioridad Alta):**
1. **Lunes:** Agregar endpoints `/api/conversations` y `/api/conversations/{id}/messages`
2. **Martes:** Implementar webhook system para notificar inbox
3. **Miércoles:** Testing con el inbox team - primera integración
4. **Jueves:** WebSocket real-time updates  
5. **Viernes:** Schema enhancements y metadata enrichment

### **📅 PRÓXIMA SEMANA (Optimización):**
1. **Performance tuning** para queries de inbox
2. **Caching layer** para conversaciones frecuentes  
3. **Advanced filtering** y search endpoints
4. **Monitoring** y error handling mejorado

---

## 🎯 **CRITERIOS DE ÉXITO**

### **✅ CUANDO ESTÉ LISTO:**
1. **Inbox puede pull** todas las 221 conversaciones existentes
2. **Real-time notifications** cuando llegan mensajes nuevos
3. **Rich message formatting** preservado (HTML components)
4. **Customer context** disponible para cada conversación
5. **WebSocket updates** funcionando sin lag
6. **API performance** < 500ms para queries típicos

---

## 💡 **QUICK WINS - EMPEZAR CON ESTO**

### **🚀 PRIMERA HORA (Fácil):**
```python
# Agregar este endpoint YA en main.py
@app.get("/api/conversations/for-inbox")
async def get_conversations_for_inbox():
    """Quick endpoint for inbox team testing"""
    # Simple query to get recent conversations
    # No fancy features - just basic data
    # INBOX team puede usar esto INMEDIATAMENTE
```

### **🔥 PRIMERA TARDE (2-3 horas):**
1. **Setup webhook endpoint** básico
2. **Test con Postman** - verificar que funciona
3. **Coordinación con inbox team** - first integration test

### **⚡ PRIMER DÍA (8 horas):**
- **Full API endpoints** para inbox consumption  
- **Basic webhook system** funcionando
- **Inbox team** puede ver conversaciones de Woodstock

---

## 🤝 **COORDINACIÓN CON INBOX TEAM**

### **Lo que necesito de ellos:**
1. **Webhook URL** - ¿adónde mando las notificaciones?
2. **Message format** - ¿cómo quieren recibir los datos?
3. **Authentication** - ¿API key, JWT, qué usan?
4. **WebSocket endpoint** - ¿URL para real-time updates?

### **Lo que les doy:**
1. **Database access** - ya tienen connection string
2. **API endpoints** - as soon as I build them
3. **Sample data** - 86K messages listos para testing
4. **Documentation** - technical report ya está listo

---

**🎯 RESUMEN: Tienes el 80% listo. Solo necesitas agregar la integración layer para que el inbox pueda consumir tus conversaciones. 2-3 días de trabajo máximo!**




