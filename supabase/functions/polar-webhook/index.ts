import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { validateEvent, WebhookVerificationError } from "npm:@polar-sh/sdk@0.47.1/webhooks";

// Declare Deno global for standard TypeScript environments (e.g. VS Code / Node.js)
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Missing webhook headers");
      return new Response("Missing webhook headers", { status: 400 });
    }

    const bodyText = await req.text();
    const webhookSecret = Deno.env.get("POLAR_WEBHOOK_SECRET") ?? "";

    if (!webhookSecret) {
      console.error("Missing POLAR_WEBHOOK_SECRET env var");
      return new Response("Server misconfiguration", { status: 500 });
    }

    let event: any;
    try {
      const headers = Object.fromEntries(req.headers.entries());
      event = validateEvent(bodyText, headers, webhookSecret);
      console.log("Signature verified successfully via Polar SDK");
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Signature verification error:", errorMsg);
      return new Response(`Signature verification error: ${errorMsg}`, { status: 400 });
    }

    console.log("Received Polar event:", event.type);

    // Handle all relevant subscription lifecycle events
    if (
      event.type === "subscription.created" ||
      event.type === "subscription.updated" ||
      event.type === "subscription.active"
    ) {
      const sub = event.data;
      let supabaseUserId = sub.customer?.external_id;
      const email = sub.customer?.email;

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      if (!supabaseUserId && email) {
        console.log("Looking up user by email:", email);
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!profileError && profileData) {
          supabaseUserId = profileData.id;
          console.log("Found user ID by email:", supabaseUserId);
        } else if (profileError) {
          console.error("Error looking up user by email:", profileError.message);
        }
      }

      if (!supabaseUserId) {
        console.error("Missing customer mapping (no external_id or matching email found) for subscription:", sub.id);
        return new Response("Missing customer mapping", { status: 400 });
      }

      // Log the full subscription object to make debugging easy
      console.log("Subscription data payload:", JSON.stringify(sub, null, 2));

      // Helper function to scan a metadata object for keys or values matching starter/pro
      const scanMetadata = (metadataObj: any): string | null => {
        if (!metadataObj || typeof metadataObj !== "object") return null;
        console.log("Scanning metadata object:", JSON.stringify(metadataObj));
        
        // Check for common keys like 'plan', 'product', 'tier'
        const keysToCheck = ["plan", "product", "tier", "subscription", "starter", "pro"];
        for (const k of keysToCheck) {
          const val = metadataObj[k];
          if (val) {
            const valStr = String(val).toLowerCase();
            if (valStr.includes("pro")) return "PRO";
            if (valStr.includes("starter") || valStr.includes("infographic")) return "STARTER";
          }
        }
        
        // Scan all keys and values in the object
        for (const [key, value] of Object.entries(metadataObj)) {
          const kLower = key.toLowerCase();
          const vLower = String(value).toLowerCase();
          
          if (kLower === "pro" || vLower.includes("pro")) {
            return "PRO";
          }
          if (kLower === "starter" || vLower.includes("starter") || vLower.includes("infographic")) {
            return "STARTER";
          }
        }
        return null;
      };

      // Try scanning metadata from different possible locations in the Polar payload
      let mappedProductId = null;
      
      const metadataSources = [
        sub.metadata,
        sub.product?.metadata,
        sub.custom_metadata,
        sub.checkout?.metadata,
        sub.order?.metadata
      ];
      
      for (const src of metadataSources) {
        if (src) {
          const match = scanMetadata(src);
          if (match) {
            mappedProductId = match;
            console.log("Mapped subscription based on metadata scan result:", mappedProductId);
            break;
          }
        }
      }

      if (!mappedProductId) {
        const productName = sub.product?.name || "";
        const lowerName = productName.toLowerCase();
        if (lowerName.includes("pro")) {
          mappedProductId = "PRO";
          console.log("Mapped subscription product to PRO based on name:", productName);
        } else if (lowerName.includes("starter") || lowerName.includes("infographic")) {
          mappedProductId = "STARTER";
          console.log("Mapped subscription product to STARTER based on name:", productName);
        } else if (productName) {
          mappedProductId = productName;
          console.log("Mapped subscription product to raw name:", productName);
        } else {
          mappedProductId = sub.product_id ?? null;
        }
      }

      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: supabaseUserId,
          polar_subscription_id: sub.id,
          status: sub.status,
          price_id: sub.price_id ?? null,
          product_id: mappedProductId,
          current_period_start: sub.current_period_start ?? null,
          current_period_end: sub.current_period_end ?? null,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "polar_subscription_id" }
      );

      if (error) {
        console.error("Supabase upsert error:", error.message);
        return new Response("Database error", { status: 500 });
      }

      console.log("Subscription upserted for user:", supabaseUserId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unhandled error:", error instanceof Error ? error.message : String(error));
    return new Response("Internal Server Error", { status: 500 });
  }
});
