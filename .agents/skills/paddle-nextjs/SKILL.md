---
name: paddle-nextjs
description: "Use when integrating Paddle Billing as a payment gateway in a Next.js project. Triggers: Paddle checkout, Paddle webhooks, Paddle subscriptions, @paddle/paddle-js, @paddle/paddle-node-sdk, payment integration, billing, checkout overlay, subscription management, one-time payments, SaaS billing."
metadata:
  author: olifen
  version: "1.0.0"
  source: "https://github.com/walaa-horani/bookly-flow"
---

# Paddle Billing Integration for Next.js

> **Reference implementation**: [walaa-horani/bookly-flow](https://github.com/walaa-horani/bookly-flow) — an Appointment Booking SaaS built with Next.js 16, Prisma 7, Auth.js v5, and Paddle Billing.

## Overview

Paddle Billing is a payment infrastructure provider that acts as a **Merchant of Record (MoR)**, handling sales tax, VAT, invoicing, and compliance globally. Unlike Stripe where you are the merchant, Paddle sells on your behalf—meaning less compliance overhead but a different integration model.

### Two SDK Packages

| Package | Side | Purpose |
|---------|------|---------|
| `@paddle/paddle-js` | **Client** (browser) | Initialize Paddle, open checkout overlay, display localized pricing |
| `@paddle/paddle-node-sdk` | **Server** (Node.js) | Verify webhook signatures, manage subscriptions/transactions via API |

### Two Payment Flow Types

1. **Subscriptions (B2B)** — Recurring billing for SaaS tiers (e.g., Free → Pro upgrade)
2. **One-time Transactions (B2C)** — Single payments (e.g., booking fees, product purchases)

---

## Step-by-Step Integration Guide

### Step 1: Install Dependencies

```bash
npm install @paddle/paddle-js @paddle/paddle-node-sdk
```

- `@paddle/paddle-js` — Client-side checkout overlay and pricing (currently `^1.6.4`)
- `@paddle/paddle-node-sdk` — Server-side webhook verification and API calls (currently `^3.8.0`)

### Step 2: Configure Environment Variables

Create these environment variables (`.env.local` for Next.js):

```dotenv
# ── Paddle (Sandbox for development, Production for live) ──────────────────

# Server-side API key (NEVER expose to client)
# Get from: Paddle Dashboard → Developer Tools → Authentication → API Keys
PADDLE_API_KEY="your-paddle-api-key"

# Webhook signing secret (used to verify webhook signatures)
# Get from: Paddle Dashboard → Developer Tools → Notifications → Webhook Destination → Edit → Copy Secret
PADDLE_WEBHOOK_SECRET="pdl_ntfset_xxx..."

# Client-side token (safe for browser — prefixed with NEXT_PUBLIC_)
# Get from: Paddle Dashboard → Developer Tools → Authentication → Client-side tokens
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxx"

# Environment: "sandbox" for testing, "production" for live
NEXT_PUBLIC_PADDLE_ENV="sandbox"

# Price ID for your subscription plan(s)
# Get from: Paddle Dashboard → Catalog → Prices → Copy Price ID
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID="pri_01xxxxxxxxxxxx"
```

> [!CAUTION]
> **`PADDLE_API_KEY` and `PADDLE_WEBHOOK_SECRET` are server-only secrets.** Never prefix them with `NEXT_PUBLIC_`. Only `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_ENV`, and `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` are safe for the browser.

### Step 3: Create Server-Side Paddle Singleton

Create `lib/paddle.ts` (server-only):

```typescript
// lib/paddle.ts
import { Paddle, Environment } from "@paddle/paddle-node-sdk"

if (!process.env.PADDLE_API_KEY) {
  throw new Error("PADDLE_API_KEY is not set")
}

export const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment:
    process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
      ? Environment.sandbox
      : Environment.production,
})
```

**Key points:**
- This singleton is used on the **server only** (API routes, server components, webhook handlers).
- The `Environment` enum switches between sandbox and production.
- The guard `if (!process.env.PADDLE_API_KEY)` provides an immediate, clear error instead of a cryptic SDK failure.

### Step 4: Create Client-Side Paddle Initializer

Create `lib/paddle-client.ts` (client-only, `"use client"`):

```typescript
// lib/paddle-client.ts
"use client"

import { initializePaddle, type Paddle } from "@paddle/paddle-js"

let paddlePromise: Promise<Paddle | undefined> | null = null

/**
 * Lazily initialize Paddle.js (client-side). Returns a cached promise so the
 * script is only loaded once per page. Uses the public client-side token —
 * NOT the secret API key.
 */
export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      debug: process.env.NODE_ENV === "development", // enable console logs in dev
      eventCallback: (event) => {
        // Surfaces the real reason behind Paddle's generic "Something went wrong"
        console.log("[Paddle event]", event.name, JSON.stringify(event, null, 2))
      },
    })
  }
  return paddlePromise
}
```

**Key points:**
- Must be marked `"use client"` — Paddle.js loads a browser script.
- Uses a **lazy singleton pattern** — `initializePaddle` is called only once, and the promise is cached.
- The `eventCallback` is critical for debugging — Paddle's UI often shows generic errors, but the callback reveals the actual error details.
- Uses the **Client Token** (public/safe), not the API key.

### Step 5: Build the Checkout Button Component

Create a reusable checkout button component:

```tsx
// components/upgrade-button.tsx
"use client"

import { useState } from "react"
import { getPaddle } from "@/lib/paddle-client"

interface UpgradeButtonProps {
  /** Your internal user/org ID to link the subscription */
  entityId: string
  /** User's email for pre-filling checkout */
  email: string
  /** Optional: custom label */
  label?: string
}

export function UpgradeButton({ entityId, email, label = "Upgrade to Pro" }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const paddle = await getPaddle()
      if (!paddle) throw new Error("Paddle failed to load.")

      paddle.Checkout.open({
        items: [
          {
            priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!,
            quantity: 1,
          },
        ],
        // customData is delivered back via webhooks — use it to map payment to your entities
        customData: { entityId, type: "subscription_upgrade" },
        customer: email ? { email } : undefined,
        settings: {
          displayMode: "overlay",  // "overlay" (modal) or "inline" (embedded)
          theme: "light",          // "light" or "dark"
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button onClick={handleUpgrade} disabled={loading}>
        {loading ? "Opening…" : label}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

**Key concepts:**

- **`paddle.Checkout.open()`** — Opens Paddle's checkout UI. Two display modes:
  - `"overlay"` — A modal overlay on top of your page (most common)
  - `"inline"` — Embedded in a specific DOM element

- **`items`** — Array of `{ priceId, quantity }`. Price IDs come from Paddle Dashboard → Catalog → Prices.

- **`customData`** — **Critical for linking payments to your users.** This object is included in webhook payloads, so you can identify which user/org made the payment. Use it instead of Paddle's deprecated `passthrough` parameter.

- **`customer.email`** — Pre-fills the email field in checkout for a smoother UX.

### Step 6: Create the Webhook Handler

Create `app/api/paddle/webhook/route.ts`:

```typescript
// app/api/paddle/webhook/route.ts
import { NextResponse } from "next/server"
import { paddle } from "@/lib/paddle"
import type {
  EventName,
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk"

export async function POST(req: Request) {
  // 1. Extract the signature header
  const signature = req.headers.get("paddle-signature") ?? ""
  const rawBody = await req.text()

  // 2. Verify signature using the Paddle SDK
  let event
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (!event) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 })
  }

  // 3. Idempotency check (recommended — prevent duplicate processing)
  //    Store event IDs in your database and skip if already processed.
  //    Example: INSERT INTO webhook_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING
  //    If the insert fails (duplicate), return early.

  // 4. Route by event type
  try {
    switch (event.eventType as EventName) {

      // ── One-time payment completed ──
      case "transaction.completed": {
        const data = event.data as TransactionCompletedEvent["data"]
        const customData = data.customData as Record<string, string> | null

        // Use customData to identify what was purchased
        if (customData?.type === "booking_payment" && customData?.appointmentId) {
          const amount = data.details?.totals?.total
            ? Number(data.details.totals.total) / 100
            : null

          // Update your database — mark the appointment/order as paid
          // await db.appointment.update({ ... })
        }
        break
      }

      // ── Subscription activated (new or renewed) ──
      case "subscription.activated": {
        const data = event.data as SubscriptionActivatedEvent["data"]
        const customData = data.customData as Record<string, string> | null
        const entityId = customData?.entityId // your user/org ID

        if (entityId) {
          // Upgrade the user/org tier in your database
          // await db.user.update({ where: { id: entityId }, data: { tier: "PRO" } })

          // Upsert subscription record
          // await db.subscription.upsert({
          //   where: { entityId },
          //   update: {
          //     paddleSubscriptionId: data.id,
          //     paddlePriceId: data.items[0]?.price?.id ?? "",
          //     status: "ACTIVE",
          //     currentPeriodStart: new Date(data.currentBillingPeriod?.startsAt ?? Date.now()),
          //     currentPeriodEnd: new Date(data.currentBillingPeriod?.endsAt ?? Date.now()),
          //     cancelAtPeriodEnd: false,
          //   },
          //   create: { ... },
          // })
        }
        break
      }

      // ── Subscription canceled ──
      case "subscription.canceled": {
        const data = event.data as SubscriptionCanceledEvent["data"]
        // Find subscription by paddleSubscriptionId and downgrade
        // await db.subscription.update({
        //   where: { paddleSubscriptionId: data.id },
        //   data: { status: "CANCELED" },
        // })
        // await db.user.update({ ... data: { tier: "FREE" } })
        break
      }

      // ── Subscription paused ──
      case "subscription.paused": {
        const data = event.data as SubscriptionPausedEvent["data"]
        // await db.subscription.update({
        //   where: { paddleSubscriptionId: data.id },
        //   data: { status: "PAUSED" },
        // })
        break
      }

      // ── Subscription resumed ──
      case "subscription.resumed": {
        const data = event.data as SubscriptionResumedEvent["data"]
        // await db.subscription.update({
        //   where: { paddleSubscriptionId: data.id },
        //   data: { status: "ACTIVE" },
        // })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("[paddle webhook] PROCESSING ERROR:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }

  // 5. Always return 200 to acknowledge receipt
  return NextResponse.json({ ok: true })
}
```

**Webhook architecture explained:**

1. **Signature Verification** — `paddle.webhooks.unmarshal()` verifies the `paddle-signature` header using `PADDLE_WEBHOOK_SECRET`. This ensures the request genuinely came from Paddle.

2. **Idempotency** — Paddle may retry webhooks. Store `event.eventId` in a `webhook_events` table with a unique constraint. If the insert fails (duplicate), skip processing.

3. **Event Routing** — Switch on `event.eventType`. The most important events are:
   - `transaction.completed` — One-time payment succeeded
   - `subscription.activated` — New subscription or renewal
   - `subscription.canceled` — Subscription canceled
   - `subscription.paused` / `subscription.resumed` — Pause/resume lifecycle

4. **customData** — This is how you link Paddle events back to your internal entities. Whatever you passed in `customData` during checkout is available in the webhook payload via `event.data.customData`.

5. **Always return 200** — Even if you don't handle an event type, return 200. Paddle will keep retrying non-2xx responses.

### Step 7: Register the Webhook in Paddle Dashboard

1. Go to **Paddle Dashboard → Developer Tools → Notifications**
2. Click **New Destination**
3. Set the **URL** to: `https://your-domain.com/api/paddle/webhook`
4. Select the events to subscribe to:
   - `transaction.completed`
   - `subscription.activated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
5. Copy the **Webhook Secret** and set it as `PADDLE_WEBHOOK_SECRET`

> [!IMPORTANT]
> For local development, use a tunnel service like [ngrok](https://ngrok.com) or [localtunnel](https://github.com/localtunnel/localtunnel) to expose your local server, then register that URL in the Paddle sandbox dashboard.

### Step 8: Database Schema for Subscriptions

You need a `subscriptions` table (or equivalent) to persist subscription state received via webhooks:

```sql
-- Example for Supabase/PostgreSQL
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id TEXT NOT NULL UNIQUE,
  paddle_price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | PAST_DUE | CANCELED | TRIALING | PAUSED
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency table for webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

For Prisma users, the equivalent schema:

```prisma
model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  paddleSubscriptionId String             @unique
  paddlePriceId        String
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("subscriptions")
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  PAUSED
}

model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique
  occurredAt  DateTime
  processedAt DateTime @default(now())

  @@map("webhook_events")
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR NEXT.JS APP                      │
│                                                         │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │  Client Browser  │     │     Server (API Routes)  │   │
│  │                  │     │                          │   │
│  │  @paddle/        │     │  @paddle/paddle-node-sdk │   │
│  │  paddle-js       │     │                          │   │
│  │                  │     │  lib/paddle.ts            │   │
│  │  lib/paddle-     │     │  (Paddle server SDK)     │   │
│  │  client.ts       │     │                          │   │
│  │  (initializePaddle)    │  api/paddle/webhook/     │   │
│  │                  │     │  route.ts                │   │
│  │  Checkout.open() │     │  (verifies signature,    │   │
│  │  ─────────────►  │     │   updates DB)            │   │
│  │  Opens overlay   │     │                          │   │
│  └─────────────────┘     └──────────▲───────────────┘   │
│                                      │                   │
└──────────────────────────────────────│───────────────────┘
                                       │
                          ┌────────────┴───────────┐
                          │    PADDLE SERVERS       │
                          │                        │
                          │  1. Processes payment   │
                          │  2. Sends webhook POST  │
                          │     with paddle-signature│
                          │  3. Includes customData │
                          └────────────────────────┘
```

---

## Key Concepts & Best Practices

### customData — Linking Payments to Your Users

`customData` is the single most important concept for mapping Paddle events to your internal data. Always include at minimum:
- Your **user ID** or **organization ID**
- A **type** field describing the payment purpose

```typescript
// When opening checkout
paddle.Checkout.open({
  items: [{ priceId: "pri_xxx", quantity: 1 }],
  customData: {
    userId: "user_abc123",         // your internal user ID
    type: "subscription_upgrade",  // what this payment is for
  },
})
```

This data comes back in the webhook via `event.data.customData`.

### Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|------------|
| Dashboard | sandbox-sellers.paddle.com | sellers.paddle.com |
| API endpoint | sandbox-api.paddle.com | api.paddle.com |
| Client token prefix | `test_` | `live_` |
| Real charges | No | Yes |
| `NEXT_PUBLIC_PADDLE_ENV` | `"sandbox"` | `"production"` |

Always develop and test in sandbox first. Switch to production only when deploying.

### Paddle Classic vs Paddle Billing

> [!WARNING]
> **Paddle Classic** (the older API) and **Paddle Billing** (the new API) are **NOT compatible.** This skill covers **Paddle Billing only**. If you encounter tutorials referencing `Paddle.Setup()`, `passthrough`, or `vendor_id`, they are for the Classic API and should not be used.

### Webhook Security Checklist

- ✅ Always verify signatures with `paddle.webhooks.unmarshal()`
- ✅ Implement idempotency (store event IDs, skip duplicates)
- ✅ Always return 200, even for unhandled event types
- ✅ Log event details for debugging
- ✅ Validate `customData` (don't blindly trust it — verify the referenced entity exists)
- ✅ Use try/catch to prevent unhandled errors from returning 500 repeatedly

### Common Paddle Webhook Event Types

| Event | When it fires |
|-------|---------------|
| `transaction.completed` | One-time payment succeeds |
| `subscription.activated` | New subscription starts or renews |
| `subscription.updated` | Subscription plan/quantity changes |
| `subscription.canceled` | Subscription is canceled |
| `subscription.paused` | Subscription is paused |
| `subscription.resumed` | Subscription is resumed after pause |
| `subscription.past_due` | Payment failed, subscription is past due |

### Adapting for Supabase (instead of Prisma)

If using Supabase instead of Prisma:

1. **Webhook handler**: Use `createClient` with the `service_role` key (server-side only) for database writes in the webhook handler.
2. **Schema**: Create the `subscriptions` and `webhook_events` tables via Supabase migrations (SQL shown above).
3. **RLS**: Enable RLS on `subscriptions`. Users should only read their own. The webhook writes using `service_role` which bypasses RLS.
4. **Edge Functions alternative**: You can also handle webhooks via Supabase Edge Functions instead of Next.js API routes, but the Next.js route approach is simpler and keeps all code in one place.

### Adapting for TanStack Start / Vite (instead of Next.js App Router)

If using TanStack Start instead of Next.js:

1. **Client-side** (`lib/paddle-client.ts`): Works identically — it's pure browser code.
2. **Server-side** (`lib/paddle.ts`): Works identically — it's pure Node.js.
3. **Webhook route**: Create a TanStack Start API route at `src/routes/api/paddle/webhook.ts` using the `createAPIFileRoute` helper instead of Next.js `route.ts`.
4. **Environment variables**: Use `import.meta.env.VITE_PADDLE_CLIENT_TOKEN` instead of `process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` for client-side variables.

---

## Troubleshooting

### "Something went wrong" in checkout overlay
- Enable `debug: true` in `initializePaddle` options.
- Check the `eventCallback` for the actual error.
- Most common cause: invalid or mismatched Price ID / environment.

### Webhook returns 400 "Invalid signature"
- Ensure `PADDLE_WEBHOOK_SECRET` matches the secret shown in your Paddle dashboard for that specific webhook destination.
- Ensure you're reading the raw body (`req.text()`) not parsed JSON (`req.json()`).
- Make sure the webhook URL matches exactly (no trailing slash differences).

### Webhook events not arriving
- Verify the webhook URL is publicly accessible (not localhost).
- Use ngrok for local development: `ngrok http 3000`
- Check Paddle Dashboard → Developer Tools → Notifications → Event Log for delivery status.

### "PADDLE_API_KEY is not set" error
- The server-side singleton runs at module import time. Ensure env vars are loaded before the module is imported.
- In Next.js, `.env.local` is loaded automatically.

---

## File Reference Summary

| File | Purpose |
|------|---------|
| `lib/paddle.ts` | Server-side Paddle SDK singleton (webhook verification, API calls) |
| `lib/paddle-client.ts` | Client-side Paddle.js initializer (checkout overlay) |
| `components/upgrade-button.tsx` | Reusable checkout trigger component |
| `app/api/paddle/webhook/route.ts` | Webhook receiver (signature verification, DB updates) |
| `.env.local` | All Paddle environment variables |

## Required Paddle Dashboard Setup

1. **Create a Product** → Catalog → Products
2. **Create a Price** for that product → Catalog → Prices (monthly/yearly recurring or one-time)
3. **Create a Client-side Token** → Developer Tools → Authentication
4. **Create an API Key** → Developer Tools → Authentication
5. **Create a Webhook Destination** → Developer Tools → Notifications → Subscribe to events
