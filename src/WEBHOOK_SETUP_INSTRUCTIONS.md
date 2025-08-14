# 🔧 INSTAGRAM WEBHOOK SETUP CRÍTICO

## PASO 1: Ve al Meta Developer Console
URL: https://developers.facebook.com/apps/734207112722414/webhooks/

## PASO 2: Encontrar tu webhook existente
- Busca el webhook con URL: `https://woodstock-technical-chatbot-full-fe.vercel.app/api/webhook/unified`
- Si no existe, créalo con esa URL

## PASO 3: AGREGAR CAMPOS CRÍTICOS
**CAMPOS QUE NECESITAS ACTIVAR:**

✅ **messages** (ya configurado - funciona)
🔴 **mentions** (CRÍTICO - para detectar @ruralkingdemo en posts ajenos)
🔴 **comments** (adicional - para comentarios)

## PASO 4: Verificar Token
- Verify Token: debe ser el valor de `FACEBOOK_VERIFY_TOKEN` de tu .env

## PASO 5: Activar Suscripción
- Asegúrate que esté "Active" ✅

---

## 🎯 FLUJO ESPERADO DESPUÉS DE CONFIGURAR:

1. Usuario random: "Love my jeans! #RK5pocketJean @ruralkingdemo"
2. Instagram → Webhook → mentions field
3. Sistema detecta hashtag + mention
4. DM automático: "🎉 Thanks for tagging us..."
5. Usuario: "JEANS"
6. AI: review link completo

## 🚨 SIN MENCIONES = NO FUNCIONA
Si no agregas el campo "mentions", solo funcionarán DMs directos, NO menciones en posts externos.

