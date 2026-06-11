# Paddle Integration — Reference Source Code

> These files are extracted from [walaa-horani/bookly-flow](https://github.com/walaa-horani/bookly-flow) and represent a working Paddle Billing integration in a Next.js 16 + Prisma 7 project.

---

## lib/paddle.ts — Server-side SDK Singleton

```typescript
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

---

## lib/paddle-client.ts — Client-side Initializer

```typescript
"use client"

import { initializePaddle, type Paddle } from "@paddle/paddle-js"

let paddlePromise: Promise<Paddle | undefined> | null = null

export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      debug: true,
      eventCallback: (event) => {
        console.log("[Paddle event]", event.name, JSON.stringify(event, null, 2))
      },
    })
  }
  return paddlePromise
}
```

---

## components/dashboard/upgrade-button.tsx — Checkout Button

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getPaddle } from "@/lib/paddle-client"

export function UpgradeButton({ orgId, email }: { orgId: string; email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const paddle = await getPaddle()
      if (!paddle) throw new Error("Paddle failed to load.")
      paddle.Checkout.open({
        items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID!, quantity: 1 }],
        customData: { orgId, type: "subscription_upgrade" },
        customer: email ? { email } : undefined,
        settings: { displayMode: "overlay", theme: "light" },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handleUpgrade} disabled={loading}>
        {loading ? "Opening…" : "Upgrade to Pro"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

---

## app/api/paddle/webhook/route.ts — Full Webhook Handler

```typescript
import { NextResponse } from "next/server"
import { paddle } from "@/lib/paddle"
import { prisma } from "@/lib/prisma"
import type {
  EventName,
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk"

export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature") ?? ""
  const rawBody = await req.text()

  let event
  try {
    event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (!event) return NextResponse.json({ error: "Unknown event" }, { status: 400 })

  // Idempotency: INSERT … ON CONFLICT DO NOTHING
  const occurredAt = new Date((event as { occurredAt?: string }).occurredAt ?? Date.now())
  try {
    await prisma.webhookEvent.create({
      data: { eventId: event.eventId ?? event.notificationId ?? "", occurredAt },
    })
  } catch {
    return NextResponse.json({ ok: true, deduplicated: true })
  }

  try {
    switch (event.eventType as EventName) {
      case "transaction.completed": {
        const data = event.data as TransactionCompletedEvent["data"]
        const customData = data.customData as Record<string, string> | null

        if (customData?.type === "booking_payment" && customData?.appointmentId) {
          const amount = data.details?.totals?.total
            ? Number(data.details.totals.total) / 100
            : null

          await prisma.appointment.update({
            where: { id: customData.appointmentId },
            data: { status: "CONFIRMED", paddleTransactionId: data.id, amountPaid: amount },
          })
        }
        break
      }

      case "subscription.activated": {
        const data = event.data as SubscriptionActivatedEvent["data"]
        const customData = data.customData as Record<string, string> | null
        const orgId = customData?.orgId

        if (orgId) {
          const org = await prisma.organization.findUnique({ where: { id: orgId } })
          if (!org) break

          await prisma.organization.update({
            where: { id: orgId },
            data: { tier: "PRO", paddleSubscriptionId: data.id },
          })
          await prisma.subscription.upsert({
            where: { orgId },
            update: {
              paddleSubscriptionId: data.id,
              paddlePriceId: data.items[0]?.price?.id ?? "",
              status: "ACTIVE",
              currentPeriodStart: new Date(data.currentBillingPeriod?.startsAt ?? Date.now()),
              currentPeriodEnd: new Date(data.currentBillingPeriod?.endsAt ?? Date.now()),
              cancelAtPeriodEnd: false,
            },
            create: {
              orgId,
              paddleSubscriptionId: data.id,
              paddlePriceId: data.items[0]?.price?.id ?? "",
              status: "ACTIVE",
              currentPeriodStart: new Date(data.currentBillingPeriod?.startsAt ?? Date.now()),
              currentPeriodEnd: new Date(data.currentBillingPeriod?.endsAt ?? Date.now()),
            },
          })
        }
        break
      }

      case "subscription.canceled": {
        const data = event.data as SubscriptionCanceledEvent["data"]
        const sub = await prisma.subscription.findUnique({
          where: { paddleSubscriptionId: data.id },
        })
        if (sub?.orgId) {
          await prisma.subscription.update({
            where: { paddleSubscriptionId: data.id },
            data: { status: "CANCELED" },
          })
          await prisma.organization.update({
            where: { id: sub.orgId },
            data: { tier: "FREE" },
          })
        }
        break
      }

      case "subscription.paused": {
        const data = event.data as SubscriptionPausedEvent["data"]
        await prisma.subscription.updateMany({
          where: { paddleSubscriptionId: data.id },
          data: { status: "PAUSED" },
        })
        break
      }

      case "subscription.resumed": {
        const data = event.data as SubscriptionResumedEvent["data"]
        await prisma.subscription.updateMany({
          where: { paddleSubscriptionId: data.id },
          data: { status: "ACTIVE" },
        })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error("[webhook] PROCESSING ERROR:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

---

## prisma/schema.prisma — Paddle-related Models (excerpt)

```prisma
// ── Paddle subscription ──────────────────────────────────────────────────────
model Subscription {
  id                   String             @id @default(cuid())
  orgId                String             @unique
  paddleSubscriptionId String             @unique
  paddlePriceId        String
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)

  org Organization @relation("OrgSubscription", fields: [orgId], references: [id], onDelete: Cascade)

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

// ── Webhook idempotency ──────────────────────────────────────────────────────
model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique
  occurredAt  DateTime
  processedAt DateTime @default(now())

  @@map("webhook_events")
}
```

---

## .env.example — Paddle Variables

```dotenv
# ── Paddle (Sandbox) ───────────────────────────────────────────────────────────
PADDLE_API_KEY="your-paddle-sandbox-api-key"
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_ENV="sandbox"
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID="pri_01xxxxxxxxx"
```
