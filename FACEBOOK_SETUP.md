# 🚀 Facebook Messenger Integration Setup - OFFICIAL DOCUMENTATION

## ✅ **CONFIGURACIÓN ACTUAL**
- **App**: AiPRL Assist (1580245996190079)
- **Página**: Alfred (345256628674690)
- **Token**: Configurado y verificado ✅
- **Servidor**: Deployed on Vercel ✅

## 📋 **OFFICIAL FACEBOOK MESSENGER PLATFORM SETUP**

Based on: https://developers.facebook.com/docs/messenger-platform/webhooks/

### **Paso 1: Configurar Webhook en Facebook**

1. Ve a [Facebook App Dashboard](https://developers.facebook.com/apps/1580245996190079)
2. Selecciona tu app "AiPRL Assist"
3. Ve a "Messenger" → "Settings"
4. En "Webhooks", haz clic en "Add Callback URL"
5. Configura:
   - **Callback URL**: `https://tu-dominio.com/facebook-webhook`
   - **Verify Token**: `woodstock_verify_token_2024`
   - **Webhook Fields**: Selecciona:
     - ✅ `messages`
     - ✅ `messaging_postbacks`

### **Paso 2: Configurar Dominio Público**

Para que Facebook pueda acceder a tu webhook, necesitas un dominio público. Opciones:

**Opción A: ngrok (para pruebas)**
```bash
# Instalar ngrok
brew install ngrok

# Exponer tu servidor
ngrok http 3000

# Usar la URL que te da ngrok como Callback URL
# Ejemplo: https://abc123.ngrok.io/facebook-webhook
```

**Opción B: Vercel/Netlify (para producción)**
- Deploy tu servidor a Vercel
- Usar la URL de Vercel como Callback URL

### **Paso 3: Probar la Integración**

1. **Con ngrok:**
   ```bash
   ngrok http 3000
   # Copia la URL HTTPS que te da
   ```

2. **En Facebook App Dashboard:**
   - Callback URL: `https://tu-url-ngrok.ngrok.io/facebook-webhook`
   - Verify Token: `woodstock_verify_token_2024`

3. **Enviar mensaje de prueba:**
   - Ve a la página "Alfred" en Facebook
   - Envía un mensaje: "Hello Woodstock"
   - Verifica los logs en tu terminal

## 🔧 **WEBHOOK IMPLEMENTATION REQUIREMENTS (OFFICIAL)**

### **✅ Required Node.js Server Configuration:**

```javascript
// Facebook Webhook Verification (GET request)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Facebook Webhook Event Processing (POST request)
app.post('/webhook', (req, res) => {
  const body = req.body;
  
  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});
```

### **✅ Send API Implementation:**

```javascript
function callSendAPI(sender_psid, response) {
  const request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };

  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
```

## 🔧 **FUNCIONALIDADES INCLUIDAS**

✅ **Webhook Verification** - Facebook verifica tu endpoint (GET /webhook)
✅ **Message Processing** - Recibe mensajes de Facebook (POST /webhook)
✅ **AI Integration** - Usa tu AI Agent existente con streaming
✅ **Function Calling** - Ejecuta todas las 12 funciones del chatbot
✅ **Conversation History** - Mantiene contexto por usuario (PSID)
✅ **Error Handling** - Maneja errores gracefully

## 📱 **FLUJO DE MENSAJES**

1. **Usuario envía mensaje** → Facebook
2. **Facebook envía webhook** → Tu servidor (`/facebook-webhook`)
3. **Tu AI Agent procesa** → Usa toda la lógica existente
4. **Respuesta se envía** → Facebook → Usuario

## 🎯 **VENTAJAS DE ESTA IMPLEMENTACIÓN**

- ✅ **No interfiere** con Chatrace
- ✅ **Misma AI** que tu webchat
- ✅ **Todas las funciones** disponibles
- ✅ **Persistencia** de conversación
- ✅ **Escalable** para Instagram también

## 🚨 **IMPORTANTE**

- **NO cambies** el webhook de Chatrace
- **SÍ puedes** tener ambos webhooks activos
- **Facebook permite** múltiples webhooks por app
- **Tu app ya está** verificada y aprobada

## 🔍 **TROUBLESHOOTING**

### Error: "Invalid access token"
- Verifica que el token sea de la página correcta
- Asegúrate de que tenga permisos de messaging

### Error: "Webhook verification failed"
- Verifica que el verify token coincida
- Asegúrate de que el endpoint esté público

### Error: "Function execution error"
- Verifica que todas las funciones estén disponibles
- Revisa los logs del servidor

## 📞 **SOPORTE**

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Confirma que el webhook esté configurado correctamente

## 🚀 **PRÓXIMO PASO**

¿Quieres que te ayude a configurar ngrok para hacer las pruebas? ¡Es súper fácil! 