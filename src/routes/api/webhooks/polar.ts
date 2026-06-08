import { createFileRoute } from "@tanstack/react-router";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Polar Webhook Handler
 *
 * Receives webhook events from Polar and syncs subscription state to Supabase.
 * Uses supabaseAdmin (service_role key) to bypass RLS for server-side writes.
 *
 * Polar sends `customer_external_id` which we set to the Supabase user ID
 * during checkout (see PricingCard.tsx).
 */

/** Extract the user_id from a Polar subscription/order payload */
function getUserId(data: any): string | null {
  return data?.customer?.external_id ?? null;
}

/** Extract product info from the subscription payload */
function getProductInfo(data: any) {
  const product = data?.product;
  return {
    product_id: product?.id ?? "unknown",
    product_name: product?.name ?? null,
  };
}

/** Extract price info from a subscription payload */
function getPriceInfo(data: any) {
  const price = data?.price;
  return {
    amount: price?.amount_type === "fixed" ? price?.price_amount : null,
    currency: price?.price_currency ?? "usd",
    recurring_interval: data?.recurring_interval ?? price?.recurring_interval ?? null,
  };
}

/** Upsert a subscription record in Supabase */
async function upsertSubscription(data: any, statusOverride?: string) {
  const userId = getUserId(data);
  if (!userId) {
    console.error("[Polar Webhook] No customer.external_id found, cannot resolve user:", JSON.stringify(data?.customer));
    return;
  }

  const { product_id, product_name } = getProductInfo(data);
  const { amount, currency, recurring_interval } = getPriceInfo(data);

  const subscriptionRecord = {
    user_id: userId,
    polar_subscription_id: data.id,
    polar_customer_id: data.customer?.id ?? null,
    product_id,
    product_name,
    status: statusOverride ?? data.status ?? "active",
    current_period_start: data.current_period_start ?? null,
    current_period_end: data.current_period_end ?? null,
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    amount,
    currency,
    recurring_interval,
  };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionRecord, {
      onConflict: "polar_subscription_id",
    });

  if (error) {
    console.error("[Polar Webhook] Failed to upsert subscription:", error);
  } else {
    console.log(`[Polar Webhook] Upserted subscription ${data.id} for user ${userId} — status: ${subscriptionRecord.status}`);
  }
}

export const Route = createFileRoute("/api/webhooks/polar")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.text();
          const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

          if (!webhookSecret) {
            console.error("[Polar Webhook] POLAR_WEBHOOK_SECRET is not configured");
            return new Response("Webhook secret not configured", { status: 500 });
          }

          // Validate the webhook signature using Polar SDK
          let event: any;
          try {
            event = validateEvent(body, Object.fromEntries(request.headers.entries()), webhookSecret);
          } catch (err) {
            if (err instanceof WebhookVerificationError) {
              console.error("[Polar Webhook] Signature verification failed:", err.message);
              return new Response("Invalid signature", { status: 403 });
            }
            throw err;
          }

          const { type, data } = event;
          console.log(`[Polar Webhook] Received event: ${type}`);

          switch (type) {
            case "subscription.created":
              await upsertSubscription(data);
              break;

            case "subscription.active":
              await upsertSubscription(data, "active");
              break;

            case "subscription.updated":
              await upsertSubscription(data);
              break;

            case "subscription.canceled":
              await upsertSubscription(data, "canceled");
              break;

            case "subscription.revoked":
              await upsertSubscription(data, "revoked");
              break;

            case "subscription.uncanceled": {
              const userId = getUserId(data);
              if (userId) {
                await supabaseAdmin
                  .from("subscriptions")
                  .update({
                    status: "active",
                    cancel_at_period_end: false,
                  })
                  .eq("polar_subscription_id", data.id);
              }
              break;
            }

            case "order.created": {
              // For renewal orders, update the subscription period
              const order = data;
              const subscriptionId = order.subscription_id ?? order.subscription?.id;
              if (subscriptionId && order.subscription) {
                await upsertSubscription(order.subscription, "active");
              }
              break;
            }

            default:
              console.log(`[Polar Webhook] Unhandled event type: ${type}`);
          }

          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("[Polar Webhook] Unexpected error:", error);
          return new Response("Internal server error", { status: 500 });
        }
      },
    },
  },
});
