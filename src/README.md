# 🚀 Woodstock Outlet AI-Powered Customer Service Chatbot

> **Un chatbot inteligente y proactivo para el servicio al cliente de Woodstock Outlet**

## 📋 Descripción del Proyecto

Este proyecto implementa un chatbot de servicio al cliente completamente funcional para Woodstock Outlet, con capacidades de inteligencia proactiva y integración completa con APIs externas y bases de datos PostgreSQL.

### ✨ Características Principales

- 🤖 **Chatbot Inteligente**: Proactivo y basado en datos reales
- 🔗 **Integración API**: Conexión completa con Woodstock Outlet API
- 📊 **Base de Datos PostgreSQL**: Almacenamiento robusto con Neon
- 🎯 **8 Escenarios Proactivos**: Automatización inteligente del servicio al cliente
- 🔧 **Sistema de Function Calling**: Arquitectura modular y extensible
- 🛡️ **Producción-Ready**: Seguridad, logging, rate limiting, y más

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express       │    │   PostgreSQL    │
│   (Chatbot UI)  │◄──►│   Server        │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Woodstock     │
                       │   API Service   │
                       └─────────────────┘
```

## 📦 Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.0.0
- PostgreSQL (Neon Database configurado)
- Redis (opcional, para caching)

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd woodstock_technical_chatbot_full_featured
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/woodstock_outlet_chatbot

# Woodstock Outlet API Configuration
WOODSTOCK_API_BASE=https://api.woodstockoutlet.com/public/index.php/april

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Configurar Base de Datos

```bash
# Crear tablas y esquema
npm run setup-db

# Importar datos CSV
npm run import-data
```

### 5. Iniciar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **`customers`**: Información de clientes
- **`orders`**: Pedidos de clientes
- **`order_details`**: Detalles de productos en pedidos

### Tablas de Analytics

- **`customer_analytics`**: Análisis de comportamiento de clientes
- **`product_analytics`**: Análisis de productos
- **`purchase_patterns`**: Patrones de compra

### Tablas de Proactividad

- **`loyalty_tiers`**: Niveles de lealtad
- **`campaign_triggers`**: Disparadores de campañas
- **`delivery_tracking`**: Seguimiento de entregas

## 🔌 API Endpoints

### Health Checks

```http
GET /health
GET /health/detailed
```

### Core Functions

```http
GET /api/customer/phone/:phone
GET /api/customer/email/:email
GET /api/orders/customer/:custid
GET /api/orders/:orderid/details
```

### Proactive Intelligence

```http
POST /api/proactive/order-confirmation
POST /api/proactive/support-escalation
POST /api/proactive/loyalty-upgrade
POST /api/proactive/product-recommendations
```

### Analytics

```http
GET /api/analytics/customer/:identifier
GET /api/analytics/patterns/:customerid
GET /api/analytics/recommendations/:productid
```

### Function Calling

```http
GET /api/functions
POST /api/functions/execute
```

### Proactive Campaigns

```http
POST /api/proactive/run-campaigns
GET /api/proactive/delivery-updates
GET /api/proactive/retention-campaigns
GET /api/proactive/issue-resolutions
GET /api/proactive/loyalty-activations
```

### Testing

```http
GET /api/test/endpoints
GET /api/test/database
```

## 🎯 Escenarios Proactivos Implementados

### 1. **Order Confirmation & Cross-Sell**
- Confirma pedidos recientes
- Sugiere productos complementarios
- Basado en patrones de compra

### 2. **Automated Support Escalation**
- Analiza problemas del cliente
- Crea tickets de soporte automáticamente
- Determina prioridad basada en keywords

### 3. **Proactive Loyalty & Retention**
- Detecta oportunidades de upgrade
- Calcula beneficios de lealtad
- Sugiere próximos niveles

### 4. **Proactive Product Recommendations**
- Analiza categorías favoritas
- Sugiere productos similares
- Basado en historial de compras

### 5. **Proactive Delivery Updates**
- Notifica entregas próximas
- Alerta sobre retrasos
- Proactivo en comunicación

### 6. **Proactive Customer Retention**
- Identifica clientes inactivos
- Sugiere re-engagement
- Basado en patrones de actividad

### 7. **Proactive Issue Resolution**
- Detecta entregas retrasadas
- Crea tickets automáticamente
- Comunica proactivamente

### 8. **Proactive Loyalty Program Activation**
- Identifica candidatos para upgrade
- Calcula beneficios próximos
- Activa campañas automáticamente

## 🔧 Function Calling System

El sistema de function calling permite al chatbot ejecutar funciones específicas:

### Core API Functions
- `getCustomerByPhone(phone)`
- `getCustomerByEmail(email)`
- `getOrdersByCustomer(custid)`
- `getDetailsByOrder(orderid)`

### Analysis Functions
- `analyzeCustomerPatterns(customerid)`
- `getProductRecommendations(productid)`

### Proactive Functions
- `handleOrderConfirmationAndCrossSell(identifier, type)`
- `handleSupportEscalation(identifier, issueDescription, type)`
- `handleLoyaltyUpgrade(identifier, type)`
- `handleProductRecommendations(identifier, type)`

### Composite Functions
- `getCustomerJourney(identifier, type)`
- `getCustomerAnalytics(identifier, type)`

## 📊 Ejemplos de Uso

### Obtener Información de Cliente

```bash
curl -X GET "http://localhost:3000/api/customer/phone/407-288-6040"
```

### Ejecutar Escenario Proactivo

```bash
curl -X POST "http://localhost:3000/api/proactive/order-confirmation" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "407-288-6040", "type": "phone"}'
```

### Obtener Analytics de Cliente

```bash
curl -X GET "http://localhost:3000/api/analytics/customer/407-288-6040?type=phone"
```

### Ejecutar Function Calling

```bash
curl -X POST "http://localhost:3000/api/functions/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "functionName": "getCustomerJourney",
    "parameters": {
      "identifier": "407-288-6040",
      "type": "phone"
    }
  }'
```

## 🛡️ Características de Seguridad

- **Helmet**: Headers de seguridad
- **CORS**: Configuración de origen
- **Rate Limiting**: Protección contra abuso
- **Input Validation**: Validación de datos
- **Error Handling**: Manejo robusto de errores

## 📈 Monitoreo y Logging

- **Winston**: Logging estructurado
- **Health Checks**: Monitoreo de servicios
- **Error Tracking**: Captura de errores
- **Performance Metrics**: Métricas de rendimiento

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Testing
npm test

# Database setup
npm run setup-db

# Import CSV data
npm run import-data
```

## 📁 Estructura del Proyecto

```
woodstock_technical_chatbot_full_featured/
├── config/
│   └── database.js              # Configuración de base de datos
├── services/
│   ├── woodstock-api.js         # Integración con API externa
│   ├── database-service.js      # Servicio de base de datos
│   ├── proactive-intelligence.js # Motor de inteligencia proactiva
│   └── function-calling.js      # Sistema de function calling
├── scripts/
│   ├── setup-database.js        # Script de configuración de BD
│   └── import-csv-data.js       # Script de importación de datos
├── logs/                        # Archivos de log
├── server.js                    # Servidor principal
├── package.json                 # Dependencias del proyecto
├── .env                         # Variables de entorno
└── README.md                    # Documentación
```

## 🔍 Testing

### Probar Endpoints de API

```bash
curl http://localhost:3000/api/test/endpoints
```

### Probar Base de Datos

```bash
curl http://localhost:3000/api/test/database
```

### Health Check Detallado

```bash
curl http://localhost:3000/health/detailed
```

## 📝 Logs

Los logs se almacenan en el directorio `logs/`:

- `error.log`: Errores del sistema
- `combined.log`: Todos los logs
- Console output en desarrollo

## 🎯 Criterios de Éxito

- ✅ **4 API endpoints** funcionando con datos reales
- ✅ **Base de datos PostgreSQL** poblada y verificada
- ✅ **8 escenarios proactivos** implementados
- ✅ **Function calling** operacional
- ✅ **Producción-ready** con todas las características

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:

- 📧 Email: support@woodstockoutlet.com
- 📱 Teléfono: (555) 123-4567
- 🌐 Website: https://woodstockoutlet.com

---

**Desarrollado con ❤️ por el equipo de Woodstock Outlet**

*"Haciendo el servicio al cliente más inteligente, un chatbot a la vez"* 