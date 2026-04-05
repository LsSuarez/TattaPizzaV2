# Guía de Configuración - Tata Pizza con n8n

## Arquitectura del sistema

```
Cliente WhatsApp → Meta Business API → n8n Webhook
                                           ↓
                              IA (GPT-4o-mini) analiza pedido
                                           ↓
                              API Tata Pizza → Base de datos
                                           ↓
                              WhatsApp Business → Cliente
                                           ↓
                              Panel Admin → Vista en tiempo real
```

## Costos estimados mensuales (en soles)

| Servicio | Costo | Notas |
|---------|-------|-------|
| n8n Cloud (Starter) | ~S/.19/mes | 5,000 ejecuciones/mes |
| OpenAI (GPT-4o-mini) | ~S/.4-8/mes | ~500-1000 pedidos |
| Railway/Render (API) | S/.0 gratis | Plan gratuito |
| Meta WhatsApp API | S/.0 | 1,000 conv. gratis/mes |
| **Total** | **~S/.25-30/mes** | |

---

## PASO 1: Instalar y configurar n8n

### Opción A: n8n Cloud (recomendado, más fácil)
1. Ir a https://n8n.io y crear cuenta
2. Elegir plan "Starter" (~$5/mes)
3. Tu URL de n8n será: `https://tu-nombre.n8n.cloud`

### Opción B: Railway (gratis)
1. Ir a https://railway.app y crear cuenta
2. Crear nuevo proyecto → "Deploy from template" → buscar "n8n"
3. Configurar variables de entorno:
   - `N8N_HOST`: tu-dominio.railway.app
   - `N8N_PROTOCOL`: https
   - `WEBHOOK_URL`: https://tu-dominio.railway.app

---

## PASO 2: Configurar Meta WhatsApp Business API

1. Ir a https://developers.facebook.com
2. Crear aplicación tipo "Business"
3. Agregar producto "WhatsApp"
4. En "Configuración" → "Números de teléfono" → agregar tu número
5. Copiar:
   - **Phone Number ID** (para `WHATSAPP_PHONE_NUMBER_ID`)
   - **Token de acceso** (para la credencial en n8n)

---

## PASO 3: Desplegar la API de Tata Pizza

1. Publicar esta app haciendo clic en "Publish" en Replit
2. Tu URL será: `https://tu-app.replit.app`
3. Verificar que funciona: `https://tu-app.replit.app/api/healthz`

---

## PASO 4: Importar el flujo en n8n

1. En n8n, ir a **Workflows** → **Import from file**
2. Seleccionar el archivo `flujo-whatsapp-pedidos.json`
3. Configurar las **variables de entorno** en n8n:
   - `TATA_PIZZA_API_URL` = `https://tu-app.replit.app`
   - `WHATSAPP_PHONE_NUMBER_ID` = (el ID copiado en Paso 2)

---

## PASO 5: Configurar credenciales en n8n

### OpenAI
1. En n8n → **Credentials** → **New Credential**
2. Seleccionar "OpenAI API"
3. Pegar tu API Key de https://platform.openai.com/api-keys

### WhatsApp Bearer Token
1. En n8n → **Credentials** → **New Credential**
2. Seleccionar "HTTP Header Auth"
3. Nombre: `WhatsApp Bearer Token`
4. Header Name: `Authorization`
5. Header Value: `Bearer TU_TOKEN_DE_META`

---

## PASO 6: Configurar el Webhook en Meta

1. En n8n, hacer clic en el nodo "WhatsApp Webhook (Meta)"
2. Copiar la URL del webhook (algo como: `https://tu-n8n.cloud/webhook/whatsapp-tata-pizza`)
3. En Meta Developers → tu app → WhatsApp → Configuración
4. En "Webhooks" → "Suscribirse":
   - **Callback URL**: la URL copiada de n8n
   - **Verify Token**: cualquier texto (ej: `tata-pizza-2024`)
5. Suscribirse a `messages`

---

## PASO 7: Activar el flujo

1. En n8n, hacer clic en el toggle para activar el flujo
2. Enviar un mensaje de WhatsApp de prueba
3. Verificar en el panel admin que el pedido aparece

---

## Flujo de conversación

El bot maneja estos escenarios:

```
Cliente: "Hola, quiero una pizza"
Bot: "¡Hola! Soy el asistente de Tata Pizza. ¿Qué te traemos hoy? 
      Tenemos Pepperoni, Hawaiana, Especial Tata y más."

Cliente: "Una Pepperoni mediana"
Bot: "¡Perfecto! Pepperoni mediana = S/.38. ¿La llevas a domicilio 
      o recoges en tienda?"

Cliente: "Domicilio a Av. Javier Prado 234"
Bot: "Listo! ¿Algo más o confirmamos el pedido?"

Cliente: "Eso es todo"
Bot: "¡Confirmado! Pepperoni Mediana = S/.38. Llegará en 30-40 min."
     → El pedido aparece automáticamente en tu panel admin
```

---

## Endpoints de la API para n8n

Puedes usar estos endpoints directamente en flujos de n8n:

### Consultar menú
```
GET https://tu-app.replit.app/api/menu?available=true
```

### Crear pedido (webhook)
```
POST https://tu-app.replit.app/api/webhook/whatsapp
Content-Type: application/json

{
  "customerName": "Juan García",
  "customerPhone": "51987654321",
  "deliveryType": "delivery",
  "deliveryAddress": "Av. Larco 123, Miraflores",
  "items": [
    {
      "name": "Pepperoni",
      "size": "Mediana",
      "quantity": 1,
      "unitPrice": 3800
    }
  ]
}
```

### Ver pedidos activos
```
GET https://tu-app.replit.app/api/orders?status=RECIBIDO
GET https://tu-app.replit.app/api/orders?status=EN_PREPARACION
```

### Actualizar estado de pedido
```
PATCH https://tu-app.replit.app/api/orders/{id}
Content-Type: application/json

{
  "status": "EN_PREPARACION"
}
```

---

## Estados del pedido

| Estado | Significado |
|--------|-------------|
| `RECIBIDO` | Pedido recibido, pendiente de confirmar |
| `EN_PREPARACION` | En la cocina |
| `LISTO` | Listo para entrega/recojo |
| `ENTREGADO` | Pedido completado |

---

## PASO 8: Configurar notificaciones a cocina (Telegram)

El flujo envía automáticamente un mensaje a Telegram cuando llega un pedido nuevo.

1. En Telegram, busca `@BotFather` y crea un bot con `/newbot`
2. Copia el token del bot
3. Crea un grupo de Telegram para la cocina (ej: "Cocina Tata Pizza")
4. Agrega el bot al grupo
5. Obtén el Chat ID del grupo: visita `https://api.telegram.org/bot{TOKEN}/getUpdates` y busca el `id` negativo
6. En n8n, configura las variables de entorno:
   - `TELEGRAM_BOT_TOKEN` = token del bot
   - `TELEGRAM_COOK_CHAT_ID` = ID del grupo (número negativo, ej: -1001234567890)

Cuando llegue un pedido, la cocina recibirá:
```
NUEVO PEDIDO #5

Cliente: Juan García
Tel: 51987654321
Entrega: delivery
Dirección: Av. Larco 123, Miraflores

Items:
• 1x Pepperoni (Mediana)
• 2x Coca-Cola 600ml (Pequeña)

Nota: sin aceitunas

Total: S/.46
```

---

## Futura integración Twilio (voz)

Para agregar atención por llamadas:
1. Crear cuenta en https://twilio.com
2. Comprar número peruano (~$1/mes)
3. En Twilio → "Programmable Voice" → configurar webhook
4. Usar n8n para manejar la llamada con Twilio + OpenAI Whisper (transcripción)
5. El mismo flujo de pedido aplica

---

## Futura integración Izipay (pagos)

Para cobros en línea:
1. Crear cuenta en https://izipay.pe
2. Obtener credenciales API
3. Agregar endpoint `/api/payments/create-session` en la API
4. En el flujo de n8n, después de confirmar pedido, crear sesión de pago
5. Enviar link de pago al cliente por WhatsApp
