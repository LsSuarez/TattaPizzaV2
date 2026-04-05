# Tata Pizza - Sistema Completo de Automatización

## Overview

Sistema completo de automatización para Tata Pizza (Lima, Perú). Incluye:
- Portal de clientes con autenticación (Clerk)
- REST API backend (Express + PostgreSQL)
- Panel de administración React en tiempo real
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
- **Auth**: Clerk (customer portal)
- **Build**: esbuild

## Workspace Structure

```
artifacts/
  api-server/        — Express REST API (port 8080)
  admin/             — React admin panel (previewPath /admin)
  customer/          — React customer portal (previewPath /customer, port 24173)
  mockup-sandbox/    — Component preview server
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
| `customers` | id, clerkUserId, name, email, phone, address |
| `menu_items` | id, name, description, category, priceSmall, priceMedium, priceLarge, available |
| `orders` | id, customerId, clerkUserId, customerName, customerPhone, status, total, deliveryType, deliveryAddress, paymentMethod, paymentStatus, paymentProofUrl, notes |
| `order_items` | id, orderId, menuItemId, name, size, quantity, unitPrice, subtotal |
| `addresses` | id, customerId, clerkUserId, label, address, district, reference, isDefault |
| `ratings` | id, orderId, customerId, clerkUserId, productRating, deliveryRating, serviceRating, comment |

**Prices**: stored as integer cents (3500 = S/.35.00)

**Order statuses**: RECIBIDO → EN_PREPARACION → LISTO → EN_CAMINO → ENTREGADO

**Payment methods**: YAPE_PLIN | BANK_TRANSFER | CASH_ON_DELIVERY

**Payment statuses**: PENDING | PROOF_SUBMITTED | VERIFIED

## API Endpoints

### Public / Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET | /api/menu | List menu items |
| POST | /api/menu | Create menu item |
| PATCH | /api/menu/:id | Update menu item |
| GET | /api/orders | List orders |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order with items |
| PATCH | /api/orders/:id | Update order status |
| GET | /api/customers | List customers |
| GET | /api/stats/dashboard | Dashboard stats |
| POST | /api/webhook/whatsapp | n8n WhatsApp webhook |

### Portal (Clerk Auth Required)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/portal/me | Get/create customer profile |
| POST | /api/portal/me | Upsert profile |
| GET | /api/portal/orders | Get my orders |
| POST | /api/portal/orders | Create order |
| GET | /api/portal/orders/:id | Get order detail |
| POST | /api/portal/orders/:id/payment | Submit payment proof |
| POST | /api/portal/orders/:id/rating | Rate completed order |
| GET | /api/portal/addresses | List addresses |
| POST | /api/portal/addresses | Create address |
| PATCH | /api/portal/addresses/:id | Update address |
| DELETE | /api/portal/addresses/:id | Delete address |

## Customer Portal Pages

- `/` — Landing page (public)
- `/menu` — Menu browser with categories, search, size selector, add-to-cart (HU-04)
- `/cart` — Shopping cart with quantity controls (HU-06)
- `/checkout` — 3-step checkout: delivery → payment → confirm (HU-07, HU-08)
- `/mis-pedidos` — Order history with reorder button (HU-11, HU-17)
- `/mis-pedidos/:id` — Order tracking with step progress + rating form (HU-18)
- `/perfil` — Customer profile editor (HU-13)
- `/direcciones` — Address management CRUD (HU-13)
- `/sign-in`, `/sign-up` — Clerk auth flows (HU-01, HU-02, HU-03)

## Admin Panel Pages

- `/` — Dashboard: live stats, kitchen status, recent orders
- `/orders` — Orders Board: kanban by status, one-click advancement (HU-10)
- `/menu` — Menu Management: list/edit/toggle availability (HU-14)
- `/customers` — Customer directory

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema (dev only)
- `cd lib/api-client-react && pnpm exec tsc` — rebuild declaration files after codegen

## Important Notes

- Clerk proxy path: `/clerk` — mounted before body parsers in app.ts
- `lib/api-zod/src/index.ts` must only export from `./generated/api` (NOT `./generated/types`)
- Prices stored as integer cents — always display divided by 100
- After running codegen, must rebuild api-client-react declarations with `tsc`
- Seed runs on API startup via `seedMenuIfEmpty()` — 8 pizza + 3 drink items
- Admin polls every 10s for orders/dashboard stats
- Admin does NOT use Clerk auth — it's internal only

## n8n Integration

Import `n8n-flows/flujo-whatsapp-pedidos.json` into n8n. See `n8n-flows/GUIA-CONFIGURACION.md`.

Required environment variables in n8n:
- `TATA_PIZZA_API_URL` — deployed API URL
- `WHATSAPP_PHONE_NUMBER_ID` — Meta phone number ID

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (customer frontend)
- `CLERK_SECRET_KEY` — Clerk secret key (API server)
- `VITE_CLERK_PROXY_URL` — Clerk proxy URL (customer frontend)
- `VITE_API_BASE_URL` — API base URL for customer portal
