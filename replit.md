# Tata Pizza - Automatización de Pedidos

## Overview

Sistema completo de automatización para Tata Pizza (Lima, Perú). Reemplaza la toma de pedidos telefónica con un chatbot de WhatsApp impulsado por n8n e IA. Costo objetivo: ~S/.30/mes vs S/.800-1,200/mes por un operador humano.

**Sistema compuesto de:**
- REST API backend (Express + PostgreSQL)
- Panel de admin React en tiempo real
- Flujo n8n para WhatsApp → IA → API

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **TypeScript**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec → React Query hooks)
- **Frontend**: React + Vite + shadcn/ui + Tailwind CSS + wouter
- **Build**: esbuild

## Workspace Structure

```
artifacts/
  api-server/        — Express REST API (port 8080 in dev)
  admin/             — React admin panel (previewPath /)
  mockup-sandbox/    — Component preview server (port 8081)
lib/
  db/                — Drizzle schema + migrations
  api-spec/          — OpenAPI YAML (source of truth)
  api-zod/           — Generated Zod validators (from codegen)
  api-client-react/  — Generated React Query hooks (from codegen)
n8n-flows/
  flujo-whatsapp-pedidos.json   — n8n workflow JSON (import directly)
  GUIA-CONFIGURACION.md         — Setup guide (Spanish)
```

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `customers` | id, name, phone, address, notes |
| `menu_items` | id, name, description, category, priceSmall, priceMedium, priceLarge, available |
| `orders` | id, customerId, customerName, customerPhone, status, total, deliveryType, deliveryAddress, notes |
| `order_items` | id, orderId, name, size, quantity, unitPrice, subtotal |

**Prices**: stored as integer cents (3500 = S/.35.00)

**Order statuses**: RECIBIDO → EN_PREPARACION → LISTO → ENTREGADO

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET | /api/menu | List menu items (filter: category, available) |
| POST | /api/menu | Create menu item |
| PATCH | /api/menu/:id | Update menu item |
| GET | /api/orders | List orders (filter: status, limit) |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order with items |
| PATCH | /api/orders/:id | Update order status |
| GET | /api/customers | List customers (filter: phone) |
| GET | /api/customers/:id | Get customer |
| GET | /api/stats/dashboard | Dashboard stats |
| POST | /api/webhook/whatsapp | n8n webhook — creates order from WhatsApp |

## Admin Panel Pages

- `/` — Dashboard: live stats (revenue, orders, customers), kitchen status, recent orders
- `/orders` — Orders Board: kanban columns by status, one-click status advancement
- `/menu` — Menu Management: list/search/edit items, toggle availability, prices in S/.
- `/customers` — Customer directory: searchable by phone

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/admin run dev` — run admin panel

## Important Notes

- `lib/api-zod/src/index.ts` must only export from `./generated/api` (NOT `./generated/types`) — avoids duplicate export conflicts
- Seed runs on API startup via `seedMenuIfEmpty()` — 8 pizza + 3 drink items
- Admin polls every 10s for orders/dashboard stats
- n8n webhook expects items as JSON in request body

## n8n Integration

Import `n8n-flows/flujo-whatsapp-pedidos.json` into n8n. See `n8n-flows/GUIA-CONFIGURACION.md` for step-by-step setup.

Required environment variables in n8n:
- `TATA_PIZZA_API_URL` — deployed API URL
- `WHATSAPP_PHONE_NUMBER_ID` — Meta phone number ID

Required n8n credentials:
- OpenAI API key
- WhatsApp Bearer Token (HTTP Header Auth)
