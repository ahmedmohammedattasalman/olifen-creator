-- Create Subscriptions table for Paddle
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id TEXT NOT NULL UNIQUE,
  paddle_customer_id TEXT,
  paddle_price_id TEXT NOT NULL,
  plan_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Idempotency table for webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  occurred_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Setup RLS policies optimized with cached SELECT auth.uid() subqueries
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add Foreign Key Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub_id ON public.subscriptions (paddle_subscription_id);

-- Create Database RPC Functions
-- Fetch user plan and limits
CREATE OR REPLACE FUNCTION public.get_user_plan(uid uuid)
RETURNS TABLE(plan_name text, generation_limit integer, is_active boolean)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(s.plan_name, 'free')::text AS plan_name,
    CASE
      WHEN s.plan_name ILIKE '%ultra%' THEN 99999
      WHEN s.plan_name ILIKE '%pro%' THEN 9999
      WHEN s.plan_name ILIKE '%starter%' THEN 30
      ELSE 3
    END AS generation_limit,
    (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now())) AS is_active
  FROM public.subscriptions s
  WHERE s.user_id = uid AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;
