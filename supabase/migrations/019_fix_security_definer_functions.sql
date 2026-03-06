-- 019: Fix my_company_id() and my_role() — add SECURITY DEFINER
-- Without SECURITY DEFINER these functions trigger RLS on company_members
-- which calls my_company_id() again → infinite recursion → statement_timeout (54001)
--
-- Original migration 001 created them WITHOUT SECURITY DEFINER.
-- patch-security.sql fixed it but was never deployed as a migration.

CREATE OR REPLACE FUNCTION my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.company_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC LIMIT 1
$$;
