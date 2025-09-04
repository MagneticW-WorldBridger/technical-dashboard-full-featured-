# 🚀 Vercel Deployment para Facebook Messenger

## ✅ **VENTAJAS DE VERCEL SERVERLESS:**

- ✅ **Dominio público automático** (no necesitas ngrok)
- ✅ **SSL automático** (HTTPS)
- ✅ **Escalabilidad automática**
- ✅ **Logs en tiempo real**
- ✅ **Variables de entorno seguras**
- ✅ **Deploy automático** desde GitHub

## 📋 **PASOS PARA DEPLOY:**

### **Paso 1: Instalar Vercel CLI**
```bash
npm install -g vercel
```

### **Paso 2: Login a Vercel**
```bash
vercel login
```

### **Paso 3: Configurar Variables de Entorno**
```bash
vercel env add FACEBOOK_PAGE_ACCESS_TOKEN
vercel env add FACEBOOK_VERIFY_TOKEN
vercel env add FACEBOOK_APP_ID
vercel env add FACEBOOK_APP_SECRET
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
```

### **Paso 4: Deploy**
```bash
vercel --prod
```

## 🎯 **CONFIGURACIÓN EN FACEBOOK:**

Una vez que tengas la URL de Vercel (ejemplo: `https://woodstock-chatbot.vercel.app`):

1. **Ve a Facebook App Dashboard**
2. **En "Webhooks"** → Selecciona **"Page"**
3. **Configura:**
   - **Callback URL**: `https://woodstock-chatbot.vercel.app/api/facebook-webhook`
   - **Verify Token**: `woodstock_verify_token_2024`
4. **Suscribe a Alfred:**
   - ✅ `messages`
   - ✅ `messaging_postbacks`

## 🔧 **ESTRUCTURA DEL PROYECTO:**

```
woodstock_technical_chatbot_full_featured/
├── api/
│   └── facebook-webhook.js    # Endpoint específico para Vercel
├── services/
│   ├── ai-agent.js           # AI Agent
│   ├── function-calling.js   # Function calling system
│   └── woodstock-api.js      # Woodstock API integration
├── vercel.json               # Configuración de Vercel
└── package.json              # Dependencies
```

## 🚀 **COMANDOS RÁPIDOS:**

```bash
# Deploy a producción
npm run deploy

# Deploy a preview
vercel

# Ver logs
vercel logs

# Ver variables de entorno
vercel env ls
```

## 📱 **TESTING:**

1. **Deploy el proyecto**
2. **Configura el webhook en Facebook**
3. **Envía un mensaje a Alfred**
4. **Verifica los logs en Vercel Dashboard**

## 🎯 **VENTAJAS SOBRE ngrok:**

- ✅ **Dominio permanente** (no cambia cada vez)
- ✅ **HTTPS automático**
- ✅ **Mejor rendimiento**
- ✅ **Logs profesionales**
- ✅ **Escalabilidad automática**
- ✅ **Gratis para proyectos pequeños**

## 🔍 **TROUBLESHOOTING:**

### Error: "Function timeout"
- Aumenta `maxDuration` en `vercel.json`

### Error: "Environment variables not found"
- Verifica que las variables estén configuradas en Vercel

### Error: "Module not found"
- Asegúrate de que todas las dependencias estén en `package.json`

## 🚀 **PRÓXIMO PASO:**

¿Quieres que procedamos con el deploy a Vercel? ¡Es súper fácil y rápido! 