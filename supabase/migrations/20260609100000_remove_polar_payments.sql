-- Drop subscriptions table
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Drop subscription-related RPC functions
DROP FUNCTION IF EXISTS public.get_user_plan(uuid) CASCADE;
