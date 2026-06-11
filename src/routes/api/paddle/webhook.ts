import { createFileRoute } from "@tanstack/react-router";
import { paddle } from "@/lib/paddle";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";

export const Route = createFileRoute("/api/paddle/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const signature = request.headers.get("paddle-signature") ?? "";
        const rawBody = await request.text();

      const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not set");
        return new Response(JSON.stringify({ error: "Configuration error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      let event;
      try {
        event = await paddle.webhooks.unmarshal(
          rawBody,
          webhookSecret,
          signature
        );
      } catch (err: any) {
        console.error("[Paddle Webhook] Signature verification failed:", err?.message || err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!event) {
        return new Response(JSON.stringify({ error: "Unknown event" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check event idempotency
      const { data: existingEvent, error: checkError } = await supabaseAdmin
        .from("webhook_events")
        .select("event_id")
        .eq("event_id", event.eventId)
        .maybeSingle();

      if (checkError) {
        console.error("[Paddle Webhook] Error checking idempotency:", checkError);
      }

      if (existingEvent) {
        console.log(`[Paddle Webhook] Duplicate event detected: ${event.eventId}. Skipping.`);
        return new Response(JSON.stringify({ ok: true, message: "Duplicate event" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Record the event in DB
      const { error: insertEventError } = await supabaseAdmin
        .from("webhook_events")
        .insert({
          event_id: event.eventId,
          occurred_at: new Date(event.occurredAt).toISOString(),
        });

      if (insertEventError) {
        console.error("[Paddle Webhook] Error recording webhook event:", insertEventError);
      }

      // Process event by type
      try {
        console.log(`[Paddle Webhook] Processing event type: ${event.eventType}`);
        
        switch (event.eventType) {
          case "subscription.activated":
          case "subscription.updated": {
            const data = event.data as SubscriptionActivatedEvent["data"] | SubscriptionUpdatedEvent["data"];
            const customData = data.customData as Record<string, any> | null;
            const userId = customData?.userId;

            if (userId) {
              const currentPeriodStart = data.currentBillingPeriod?.startsAt 
                ? new Date(data.currentBillingPeriod.startsAt).toISOString() 
                : null;
              const currentPeriodEnd = data.currentBillingPeriod?.endsAt 
                ? new Date(data.currentBillingPeriod.endsAt).toISOString() 
                : null;
              
              const { error } = await supabaseAdmin
                .from("subscriptions")
                .upsert({
                  user_id: userId,
                  paddle_subscription_id: data.id,
                  paddle_customer_id: data.customerId || null,
                  paddle_price_id: data.items[0]?.price?.id ?? "",
                  plan_name: customData?.planName || "starter",
                  status: data.status,
                  current_period_start: currentPeriodStart,
                  current_period_end: currentPeriodEnd,
                  cancel_at_period_end: data.scheduledChange?.action === "cancel",
                  amount: data.items[0]?.price?.unitPrice?.amount ? Number(data.items[0].price.unitPrice.amount) : null,
                  currency: data.items[0]?.price?.unitPrice?.currencyCode || "usd",
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: "paddle_subscription_id"
                });

              if (error) {
                console.error("[Paddle Webhook] Error upserting subscription:", error);
                throw error;
              }
              console.log(`[Paddle Webhook] Successfully upserted subscription for user ${userId}`);
            } else {
              console.warn("[Paddle Webhook] No userId found in customData for subscription:", data.id);
            }
            break;
          }

          case "subscription.paused":
          case "subscription.resumed": {
            const data = event.data as SubscriptionPausedEvent["data"] | SubscriptionResumedEvent["data"];
            const currentPeriodStart = data.currentBillingPeriod?.startsAt 
              ? new Date(data.currentBillingPeriod.startsAt).toISOString() 
              : null;
            const currentPeriodEnd = data.currentBillingPeriod?.endsAt 
              ? new Date(data.currentBillingPeriod.endsAt).toISOString() 
              : null;

            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: data.status,
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              })
              .eq("paddle_subscription_id", data.id);

            if (error) {
              console.error("[Paddle Webhook] Error updating paused/resumed subscription status:", error);
              throw error;
            }
            console.log(`[Paddle Webhook] Successfully updated subscription ${data.id} status to ${data.status}`);
            break;
          }

          case "subscription.canceled": {
            const data = event.data as SubscriptionCanceledEvent["data"];
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update({
                status: data.status,
                updated_at: new Date().toISOString(),
              })
              .eq("paddle_subscription_id", data.id);

            if (error) {
              console.error("[Paddle Webhook] Error canceling subscription:", error);
              throw error;
            }
            console.log(`[Paddle Webhook] Successfully updated canceled subscription ${data.id} status to ${data.status}`);
            break;
          }
          
          default:
            console.log(`[Paddle Webhook] Unhandled event type: ${event.eventType}`);
            break;
        }
      } catch (err: any) {
        console.error("[Paddle Webhook] Error processing event details:", err);
        return new Response(JSON.stringify({ error: "Database error during processing" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
    },
  },
});
