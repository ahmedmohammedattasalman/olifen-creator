# Remove Polar Integration and Keep Pricing Section

This updated implementation plan details the steps to remove all Polar-specific payment integrations, webhook handlers, and database records, while **keeping the visual Pricing section** on the homepage. Clicking on any plan will now seamlessly redirect the user to the infographic generation page with all premium features available.

## Proposed Changes

### Database Schema Updates

We will drop the `subscriptions` table and the helper RPC functions that query subscriptions.

#### [NEW] [20260609100000_remove_polar_payments.sql](file:///c:/Users/ah383/Desktop/olifen/supabase/migrations/20260609100000_remove_polar_payments.sql)
Create a new migration to drop the Polar-related tables and functions:
```sql
-- Drop subscriptions table
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Drop subscription-related RPC functions
DROP FUNCTION IF EXISTS public.get_user_plan(uuid) CASCADE;
```

---

### Configuration & Package Dependencies

We will remove Polar environment variables and package dependencies from the project.

#### [MODIFY] [.env](file:///c:/Users/ah383/Desktop/olifen/.env)
- Remove `POLAR_WEBHOOK_SECRET` and `POLAR_ACCESS_TOKEN` environment variables.
- Remove Polar-specific comments.

#### [MODIFY] [tsconfig.json](file:///c:/Users/ah383/Desktop/olifen/tsconfig.json)
- Remove the custom compiler path mapping for `npm:@polar-sh/sdk@0.47.1/webhooks`.

#### [MODIFY] [package.json](file:///c:/Users/ah383/Desktop/olifen/package.json)
- Remove `@polar-sh/checkout`, `@polar-sh/sdk`, and `@polar-sh/tanstack-start` dependencies.

---

### Routes & Components (Frontend Code)

We will modify checkout redirect logic in the pricing card component and clean up the profile page subscription references.

#### [MODIFY] [PricingCard.tsx](file:///c:/Users/ah383/Desktop/olifen/src/components/olifen/PricingCard.tsx)
- Remove imports from `@/config/pricing` and `@polar-sh/checkout`.
- Update `handleCheckout` to directly redirect the user to `/generate` and show a toast informing them that premium features are active/free.

#### [MODIFY] [profile.tsx](file:///c:/Users/ah383/Desktop/olifen/src/routes/profile.tsx)
- Remove import and usage of `syncUserSubscription`.
- Remove database queries to `subscriptions` table.
- Simplify `getPlanName()` to return a default premium/unlimited status (e.g. "الخطة الاحترافية (Pro) — مجاناً").
- Update the subscription card to show that their account is active with premium privileges.

#### [MODIFY] [index.tsx](file:///c:/Users/ah383/Desktop/olifen/src/routes/index.tsx)
- Remove the checkout success toast handler which listened for `checkout_id` query parameters.
- Keep the visual `PricingSection` component intact.

---

### Files to Delete

We will delete files and folders that were dedicated exclusively to Polar checkout flows and webhooks.

#### [DELETE] [pricing.ts](file:///c:/Users/ah383/Desktop/olifen/src/config/pricing.ts)
- Delete the pricing/checkout URLs configuration file.

#### [DELETE] [subscription.functions.ts](file:///c:/Users/ah383/Desktop/olifen/src/lib/subscription.functions.ts)
- Delete the server-side subscription synchronization functions.

#### [DELETE] [polar.ts](file:///c:/Users/ah383/Desktop/olifen/src/routes/api/webhooks/polar.ts)
- Delete the TanStack Start API webhook route for Polar.

#### [DELETE] [index.ts](file:///c:/Users/ah383/Desktop/olifen/supabase/functions/polar-webhook/index.ts)
- Delete the Supabase Edge Function directory for the Polar webhook endpoint.

---

## Verification Plan

### Automated Verification
- Run database migration/query locally using the Supabase MCP tool or CLI.
- Run `npm run build` or `npx tsc --noEmit` to verify there are no TypeScript compile or import errors.
- TanStack Router will automatically rebuild the route tree configuration (`routeTree.gen.ts`) without `/api/webhooks/polar`.

### Manual Verification
- Verify that the home page renders the Pricing section correctly.
- Verify that clicking any plan on the pricing cards redirects to the generation page.
- Verify that the profile page displays the active premium plan status without throwing errors.
