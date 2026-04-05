# Guía de Despliegue — Tata Pizza

## Resumen del sistema completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA FINAL                            │
│                                                                  │
│  WhatsApp   →  Meta Business API  →  n8n Cloud                  │
│  Cliente                                  ↓                     │
│                                    GPT-4o-mini                  │
│                                           ↓                     │
│  Portal Web  →  /customer/        →  API (Render/Replit)        │
│  Admin       →  /admin/           →  PostgreSQL                 │
│  Cocina      →  /admin/cocina     →  Auto-refresh               │
│  Repartidor  →  /admin/repartidor →  Auto-refresh               │
│  Cuadre Caja →  /admin/caja       →                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## OPCIÓN A — Replit Publish ⭐ RECOMENDADO (más fácil, 5 minutos)

### Por qué es la mejor opción:
- Un solo clic
- Toda la app queda en `https://tatapizza.replit.app` (o similar)
- El proxy ya está configurado, no hay que cambiar nada en el código
- Incluye SSL automático
- Escala automáticamente

### Pasos:
1. En Replit, hacer clic en el botón **"Publish"** (arriba a la derecha)
2. Seguir el proceso de configuración (tarda ~3 minutos)
3. Tu URL quedará como: `https://nombre-del-proyecto.replit.app`
4. Verificar: `https://nombre-del-proyecto.replit.app/api/healthz` → debe responder `{"status":"ok"}`

### URLs después del deploy:
| Panel | URL |
|-------|-----|
| Portal cliente | `https://tu-app.replit.app/customer/` |
| Admin / Dueño | `https://tu-app.replit.app/admin/` |
| Vista Cocina | `https://tu-app.replit.app/admin/cocina` |
| Vista Repartidor | `https://tu-app.replit.app/admin/repartidor` |
| Cuadre de Caja | `https://tu-app.replit.app/admin/caja` |

---

## OPCIÓN B — Render (deploy manual, ~30 minutos)

Render es buena opción si quieres más control o un dominio personalizado.

### Paso B1: Crear base de datos en Render

1. Ir a https://render.com y crear cuenta
2. **New** → **PostgreSQL**
3. Nombre: `tatapizza-db`
4. Plan: Free (suficiente para empezar)
5. Copiar la **Internal Database URL** → la necesitarás en el paso B2

### Paso B2: Desplegar la API

1. **New** → **Web Service**
2. Conectar con tu repositorio GitHub (primero necesitas subir el código a GitHub)
3. Configurar:
   - **Name**: `tatapizza-api`
   - **Build Command**: `npm install -g pnpm && pnpm install && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `pnpm --filter @workspace/api-server run start`
4. Variables de entorno (Environment Variables):

| Variable | Valor |
|----------|-------|
| `PORT` | `8080` |
| `DATABASE_URL` | (la URL copiada en B1) |
| `NODE_ENV` | `production` |
| `CLERK_SECRET_KEY` | (de https://clerk.com → tu app → API Keys) |
| `CLERK_PUBLISHABLE_KEY` | (de https://clerk.com → tu app → API Keys) |

5. Hacer clic en **Create Web Service**
6. Esperar ~5 minutos hasta que aparezca el URL: `https://tatapizza-api.onrender.com`
7. Verificar: `https://tatapizza-api.onrender.com/api/healthz`

### Paso B3: Desplegar el Admin (panel del dueño)

1. **New** → **Static Site**
2. Conectar el mismo repositorio
3. Configurar:
   - **Name**: `tatapizza-admin`
   - **Build Command**: `npm install -g pnpm && pnpm install && BASE_PATH=/admin/ VITE_API_URL=https://tatapizza-api.onrender.com pnpm --filter @workspace/admin run build`
   - **Publish Directory**: `artifacts/admin/dist/public`
4. **Create Static Site**
5. Tu URL: `https://tatapizza-admin.onrender.com`

### Paso B4: Desplegar el Portal Cliente

1. **New** → **Static Site**
2. Mismo repositorio
3. Configurar:
   - **Name**: `tatapizza-customer`
   - **Build Command**: `npm install -g pnpm && pnpm install && BASE_PATH=/customer/ VITE_API_URL=https://tatapizza-api.onrender.com pnpm --filter @workspace/customer run build`
   - **Publish Directory**: `artifacts/customer/dist/public`
4. **Create Static Site**
5. Tu URL: `https://tatapizza-customer.onrender.com`

---

## PASO FINAL — Activar n8n con el número de WhatsApp

Una vez tengas tu URL desplegada y el número de WhatsApp de Meta:

### 1. Configurar n8n (n8n.io → Plan Starter ~$5/mes)

Ir a https://n8n.io → crear cuenta → nuevo workflow → importar archivo:
```
n8n-flows/flujo-whatsapp-pedidos.json
```

### 2. Variables de entorno en n8n

En tu instancia de n8n → **Settings** → **Variables**:

| Variable | Valor |
|----------|-------|
| `TATA_PIZZA_API_URL` | `https://tu-app.replit.app` (o URL de Render) |
| `WHATSAPP_PHONE_NUMBER_ID` | **← TU NÚMERO AQUÍ** (de Meta Business) |

### 3. Credenciales en n8n

En n8n → **Credentials** → **New**:

**OpenAI:**
- Tipo: `OpenAI API`
- API Key: (obtener en https://platform.openai.com/api-keys, ~S/.4-8/mes)

**WhatsApp Bearer Token:**
- Tipo: `HTTP Header Auth`
- Header Name: `Authorization`
- Value: `Bearer {TOKEN_DE_META_BUSINESS}`

### 4. Configurar Webhook en Meta Business

1. Meta Developers → tu app → WhatsApp → Configuration
2. Webhook URL: `https://tu-n8n.n8n.cloud/webhook/whatsapp-tata-pizza`
3. Verify Token: `tata-pizza-2024` (o el que quieras)
4. Suscribirse a: `messages`

### 5. Activar el flujo en n8n

- Toggle ON en el flujo `Tata Pizza - WhatsApp Orders`
- Enviar un mensaje de prueba por WhatsApp
- Verificar que aparezca el pedido en `/admin/orders`

---

## Flujo de conversación del bot

```
Cliente: "Hola quiero una pizza"
Bot:     "¡Hola! Bienvenido a Tata Pizza 🍕 
          Tenemos Pepperoni, Hawaiana, Especial Tata, 4 Quesos y más.
          ¿Qué te preparo hoy?"

Cliente: "Una pepperoni mediana"
Bot:     "Pepperoni Mediana = S/.38 ✅
          ¿La llevas a domicilio o recoges en tienda?"

Cliente: "Domicilio a Jr. Lima 234, Miraflores"
Bot:     "¡Perfecto! ¿Algo más o confirmamos?
          📋 Resumen: 1x Pepperoni Mediana = S/.38
          Delivery: Jr. Lima 234, Miraflores"

Cliente: "Confirmo"
Bot:     "✅ ¡Pedido confirmado! #7
          Llegará en aproximadamente 35-45 minutos.
          Pago: efectivo al recibir"
          
→ Pedido aparece automáticamente en /admin/cocina
```

---

## Costos mensuales estimados

| Servicio | Costo mensual |
|----------|---------------|
| Replit (deploy) | S/.0 - S/.15 |
| n8n Starter | S/.19 |
| OpenAI (GPT-4o-mini) | S/.4-8 |
| Meta WhatsApp API | S/.0 (1,000 conv gratis) |
| **TOTAL** | **~S/.25-42/mes** |

Vs. operadora humana: S/.800-1,200/mes  
**Ahorro: ~S/.760-1,170/mes** 🎉

---

## Checklist de activación

- [ ] App desplegada (Replit Publish o Render)
- [ ] `/api/healthz` responde OK
- [ ] Menú cargado correctamente en `/customer/menu`
- [ ] Número de WhatsApp registrado en Meta Business
- [ ] n8n importado y variables configuradas
- [ ] Credenciales de OpenAI y Meta en n8n
- [ ] Webhook de Meta apuntando a n8n
- [ ] Flujo activo en n8n
- [ ] Prueba de pedido por WhatsApp exitosa
- [ ] Pedido aparece en panel cocina ✅
