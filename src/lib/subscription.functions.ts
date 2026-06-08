import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Polar } from "@polar-sh/sdk";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  token: z.string().min(1),
});

export const syncUserSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    // 1. Validate the user session token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(data.token);
    
    if (authError || !user) {
      console.error("[Subscription Sync] Auth validation failed:", authError?.message);
      throw new Error("Unauthorized");
    }

    const userId = user.id;
    console.log(`[Subscription Sync] Syncing subscription for user: ${userId}`);

    const isProduction = process.env.POLAR_ENV === "production" || 
                         (process.env.NODE_ENV === "production" && process.env.POLAR_ENV !== "sandbox");

    // 2. Initialize Polar SDK client
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN || "",
      server: isProduction ? "production" : "sandbox",
    });

    try {
      // 3. Fetch customer state by external ID from Polar
      const result = await polar.customers.getStateExternal({
        externalId: userId,
      });

      console.log(`[Subscription Sync] Found customer state for ${userId}:`, JSON.stringify(result));

      // 4. Extract active subscriptions
      const activeSubs = result.activeSubscriptions || [];
      if (activeSubs.length === 0) {
        console.log(`[Subscription Sync] No active subscriptions found in Polar for user ${userId}`);
        return { subscription: null };
      }

      // Sort or find the most relevant active subscription (e.g. active status preferred)
      const sub = activeSubs.find(s => s.status === "active") || activeSubs[0];

      // 5. Map product ID to standard tier identifier (STARTER/PRO/ULTRA)
      let mappedProductId = sub.productId;
      let productName = "الخطة المدفوعة (Premium)";
      
      // Starter: 79bf0142-55f1-4d58-a4d5-7653a19c7f06
      // Pro: ad8facd2-169b-45ed-b844-3cd2ee7d2470
      // Ultra: 7e54e2f0-0df7-4d80-9781-2c7cc29f7d9a
      if (sub.productId === "79bf0142-55f1-4d58-a4d5-7653a19c7f06") {
        mappedProductId = "STARTER";
        productName = "الخطة الأساسية (Starter)";
      } else if (sub.productId === "ad8facd2-169b-45ed-b844-3cd2ee7d2470") {
        mappedProductId = "PRO";
        productName = "الخطة الاحترافية (Pro)";
      } else if (sub.productId === "7e54e2f0-0df7-4d80-9781-2c7cc29f7d9a") {
        mappedProductId = "ULTRA";
        productName = "خطة الترا (Ultra)";
      }

      // Convert cents to standard currency units if needed, Polar amount is in cents
      const amount = sub.amount !== undefined && sub.amount !== null ? sub.amount / 100 : null;

      const subscriptionRecord = {
        user_id: userId,
        polar_subscription_id: sub.id,
        polar_customer_id: result.id ?? null,
        product_id: mappedProductId,
        product_name: productName,
        status: sub.status,
        current_period_start: sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString() : null,
        current_period_end: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null,
        cancel_at_period_end: sub.cancelAtPeriodEnd ?? false,
        amount,
        currency: sub.currency ?? "usd",
        recurring_interval: sub.recurringInterval ?? null,
        updated_at: new Date().toISOString(),
      };

      console.log(`[Subscription Sync] Upserting subscription record to DB:`, JSON.stringify(subscriptionRecord));

      // 6. Upsert the record into Supabase using admin permissions (bypassing RLS for write)
      const { data: upsertedSub, error: upsertError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(subscriptionRecord, { onConflict: "polar_subscription_id" })
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error(`[Subscription Sync] Database upsert failed:`, upsertError.message);
        throw new Error(`Database error: ${upsertError.message}`);
      }

      console.log(`[Subscription Sync] Subscription synced successfully for user ${userId}:`, JSON.stringify(upsertedSub));
      return { subscription: upsertedSub };
    } catch (err: any) {
      console.error(`[Subscription Sync] Sync failed:`, err.message || err);
      // Fallback: If Polar state lookup fails (e.g. customer does not exist on Polar yet), return null
      return { subscription: null };
    }
  });
