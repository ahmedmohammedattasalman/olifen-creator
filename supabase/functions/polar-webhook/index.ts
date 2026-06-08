import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
};

/**
 * Verify a Standard Webhooks signature using Deno's built-in Web Crypto API.
 * Polar uses Standard Webhooks format:
 *   signed_content = "{webhook-id}.{webhook-timestamp}.{body}"
 *   signature      = base64(HMAC-SHA256(signed_content, secret))
 */
async function verifyWebhookSignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): Promise<boolean> {
  try {
    // The secret from Polar starts with "whsec_" or "polar_whs_" – strip the prefix
    let rawSecret = secret;
    if (secret.startsWith("whsec_")) rawSecret = secret.slice(6);
    if (secret.startsWith("polar_whs_")) rawSecret = secret.slice(10);

    // Decode base64 secret
    const secretBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));

    // Import the key
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify", "sign"]
    );

    // Build the signed content
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const encoder = new TextEncoder();
    const signedContentBytes = encoder.encode(signedContent);

    // The header may contain multiple space-separated "v1,<base64>" values
    const signatures = webhookSignature.split(" ");
    for (const sig of signatures) {
      const sigValue = sig.startsWith("v1,") ? sig.slice(3) : sig;
      try {
        const sigBytes = Uint8Array.from(atob(sigValue), (c) => c.charCodeAt(0));
        const valid = await crypto.subtle.verify("HMAC", key, sigBytes, signedContentBytes);
        if (valid) return true;
      } catch {
        // Try next signature
        continue;
      }
    }
    return false;
  } catch (e) {
    console.error("Signature verification error:", e.message);
    return false;
  }
}

serve(async (req) => {
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

    const isValid = await verifyWebhookSignature(
      bodyText,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 403 });
    }

    let event: any;
    try {
      event = JSON.parse(bodyText);
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
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
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
        if (!userError && userData?.user) {
          supabaseUserId = userData.user.id;
          console.log("Found user ID by email:", supabaseUserId);
        } else if (userError) {
          console.error("Error looking up user by email:", userError.message);
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
    console.error("Unhandled error:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
});
