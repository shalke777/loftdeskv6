-- ============================================================
-- LOFTDESK — SECURITY PATCH (SELF-CONTAINED)
-- Uruchom w Supabase Dashboard > SQL Editor
-- Tworzy brakujące tabele + naprawia RLS, indeksy, FK, funkcje
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- SECTION A: Ensure ALL tables exist
-- ─────────────────────────────────────────────

-- Normalize profiles PK column name (some Supabase setups use user_id instead of id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
  END IF;
END $$;

-- PROFILES — extend columns if table pre-exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_env TEXT DEFAULT 'test';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  nip TEXT, address TEXT, city TEXT, postal_code TEXT, contact_person TEXT, email TEXT, phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL, name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'offer' CHECK (status IN ('offer','active','done','cancelled')),
  start_date DATE, end_date DATE, address TEXT,
  budget NUMERIC(14,2), notes TEXT,
  estimate_id UUID, costs NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COST ESTIMATES
CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL, name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
  total_net NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COST ESTIMATE ITEMS
CREATE TABLE IF NOT EXISTS public.cost_estimate_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_estimate_id UUID REFERENCES public.cost_estimates(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL, name TEXT,
  unit TEXT NOT NULL DEFAULT 'm²',
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate INTEGER DEFAULT 23,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE, due_date DATE,
  contract_id UUID, estimate_id UUID,
  total_net NUMERIC(14,2) NOT NULL DEFAULT 0, total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  ksef_status TEXT, ksef_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'kpl',
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate INTEGER NOT NULL DEFAULT 23, tranche_label TEXT, sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unsigned' CHECK (status IN ('unsigned','signed')),
  sign_date DATE, value NUMERIC(14,2) NOT NULL DEFAULT 0, notes TEXT,
  estimate_id UUID, template_name TEXT, template_content TEXT, tranches JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, nip text,
  plan text NOT NULL DEFAULT 'free',
  ksef_token TEXT, ksef_nip TEXT, ksef_env TEXT DEFAULT 'test',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- COMPANY MEMBERS
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin','manager','worker','accountant')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- Add company_id to domain tables
ALTER TABLE IF EXISTS public.clients ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE IF EXISTS public.cost_estimates ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS company_id uuid;

-- Ensure client_id / project_id exist (tables may pre-exist without them)
ALTER TABLE IF EXISTS public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS public.clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE IF EXISTS public.clients ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS costs NUMERIC(14,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.cost_estimates ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.cost_estimates ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.cost_estimates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.cost_estimates ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS total_net NUMERIC(14,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS total_gross NUMERIC(14,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS public.invoice_items ADD COLUMN IF NOT EXISTS tranche_label TEXT;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS template_content TEXT;
ALTER TABLE IF EXISTS public.contracts ADD COLUMN IF NOT EXISTS tranches JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS ksef_token TEXT;
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS ksef_nip TEXT;
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS ksef_env TEXT DEFAULT 'test';
ALTER TABLE IF EXISTS public.client_decisions ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.client_decisions ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.handover_protocols ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.handover_protocols ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.project_photo_docs ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.project_photo_docs ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE IF EXISTS public.technical_standards ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE IF EXISTS public.technical_standards ADD COLUMN IF NOT EXISTS project_id UUID;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, user_id uuid,
  table_name text NOT NULL, record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert','update','delete')),
  old_data jsonb, new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CLIENT TOKENS
CREATE TABLE IF NOT EXISTS public.client_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_estimate_id uuid,
  client_name text, token text UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PORTAL MESSAGES
CREATE TABLE IF NOT EXISTS public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.client_tokens(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('client','company')),
  content text NOT NULL, read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- COMPANY INVITATIONS
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','admin','manager','worker','accountant')),
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- v5.8 TABLES
CREATE TABLE IF NOT EXISTS public.client_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, client_id uuid, project_id uuid, related_estimate_id uuid,
  title text NOT NULL, description text,
  decision_type text NOT NULL DEFAULT 'change',
  status text NOT NULL DEFAULT 'pending_client',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz, client_comment text
);

CREATE TABLE IF NOT EXISTS public.handover_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, client_id uuid, project_id uuid,
  title text NOT NULL, status text NOT NULL DEFAULT 'draft',
  protocol_date date, summary text, notes text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.project_photo_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, client_id uuid, project_id uuid,
  title text NOT NULL, category text NOT NULL DEFAULT 'progress',
  taken_at timestamptz, image_url text, note text
);

CREATE TABLE IF NOT EXISTS public.technical_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL, client_id uuid, project_id uuid,
  title text NOT NULL, category text NOT NULL DEFAULT 'technical_standard',
  source_label text, content text NOT NULL,
  requires_client_acceptance boolean NOT NULL DEFAULT false,
  accepted_by_client boolean NOT NULL DEFAULT false
);

-- VIEW alias for frontend
CREATE OR REPLACE VIEW public.client_portal_tokens AS
SELECT * FROM public.client_tokens;

-- ─────────────────────────────────────────────
-- SECTION B: Backfill profiles + set admin
-- ─────────────────────────────────────────────

DO $$
DECLARE
  pk_col TEXT;
BEGIN
  SELECT column_name INTO pk_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles'
    AND column_name IN ('id', 'user_id')
  ORDER BY CASE column_name WHEN 'id' THEN 1 ELSE 2 END
  LIMIT 1;
  IF pk_col IS NULL THEN RETURN; END IF;

  -- Backfill email
  EXECUTE format(
    'UPDATE public.profiles SET email = au.email FROM auth.users au WHERE public.profiles.%I = au.id AND (public.profiles.email IS NULL OR public.profiles.email = '''')',
    pk_col
  );

  -- Set admin plan for test@loftdesk.pl
  EXECUTE format(
    'UPDATE public.profiles SET plan = ''admin'' WHERE %I = (SELECT id FROM auth.users WHERE email = ''test@loftdesk.pl'' LIMIT 1)',
    pk_col
  );
END $$;

-- ─────────────────────────────────────────────
-- SECTION C: Functions
-- ─────────────────────────────────────────────

-- SECURITY DEFINER: prevents infinite recursion (RLS on company_members calls my_company_id → infinite loop)
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

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, nip, plan)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'nip', ''), 'free');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.accept_company_invitation(invite_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite_row public.company_invitations%rowtype;
  uid uuid; uemail text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  SELECT email INTO uemail FROM auth.users WHERE id = uid;
  SELECT * INTO invite_row FROM public.company_invitations
    WHERE token = invite_token AND status = 'pending' AND expires_at > now() LIMIT 1;
  IF invite_row.id IS NULL THEN RAISE EXCEPTION 'INVITATION_NOT_FOUND'; END IF;
  IF invite_row.email <> uemail THEN RAISE EXCEPTION 'EMAIL_MISMATCH'; END IF;
  INSERT INTO public.company_members(company_id, user_id, role)
    VALUES (invite_row.company_id, uid, invite_row.role)
    ON CONFLICT (company_id, user_id) DO UPDATE SET role = excluded.role;
  UPDATE public.company_invitations SET status = 'accepted' WHERE id = invite_row.id;
  RETURN invite_row.company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_plan_limit(p_user_id UUID, p_table TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan TEXT; v_count INT; v_limit INT; v_pk TEXT;
BEGIN
  IF p_table NOT IN ('invoices','contracts','clients','projects','cost_estimates') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table;
  END IF;
  SELECT column_name INTO v_pk FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name IN ('id','user_id')
    ORDER BY CASE column_name WHEN 'id' THEN 1 ELSE 2 END LIMIT 1;
  IF v_pk IS NULL THEN RETURN TRUE; END IF;
  EXECUTE format('SELECT plan FROM public.profiles WHERE %I = $1', v_pk) INTO v_plan USING p_user_id;
  IF v_plan IN ('pro','business','admin') THEN RETURN TRUE; END IF;
  EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE user_id = $1', p_table) INTO v_count USING p_user_id;
  v_limit := CASE p_table WHEN 'invoices' THEN 5 WHEN 'contracts' THEN 3 WHEN 'clients' THEN 10 WHEN 'projects' THEN 3 WHEN 'cost_estimates' THEN 5 ELSE 9999 END;
  RETURN v_count < v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_my_company(company_name text DEFAULT NULL, company_nip text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid(); v_cid uuid; v_profile record;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT company_id INTO v_cid FROM public.company_members WHERE user_id = v_user_id LIMIT 1;
  IF v_cid IS NOT NULL THEN RETURN v_cid; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  INSERT INTO public.companies (owner_user_id, name, nip, plan)
    VALUES (v_user_id, COALESCE(NULLIF(company_name,''), NULLIF(v_profile.company,''), 'LoftDesk Workspace'),
            COALESCE(NULLIF(company_nip,''), NULLIF(v_profile.nip,'')), COALESCE(v_profile.plan,'free'))
    RETURNING id INTO v_cid;
  INSERT INTO public.company_members (company_id, user_id, role) VALUES (v_cid, v_user_id, 'owner') ON CONFLICT DO NOTHING;
  UPDATE public.clients SET company_id = v_cid WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.projects SET company_id = v_cid WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.cost_estimates SET company_id = v_cid WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.invoices SET company_id = v_cid WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.contracts SET company_id = v_cid WHERE user_id = v_user_id AND company_id IS NULL;
  RETURN v_cid;
END $$;

-- ─────────────────────────────────────────────
-- SECTION D: RLS on ALL tables
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photo_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_standards ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- COMPANIES
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (id = my_company_id());
DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies FOR UPDATE
  USING (id = my_company_id() AND my_role() IN ('owner','admin'))
  WITH CHECK (id = my_company_id());

-- COMPANY MEMBERS
DROP POLICY IF EXISTS "members_select" ON public.company_members;
CREATE POLICY "members_select" ON public.company_members FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "members_insert" ON public.company_members;
CREATE POLICY "members_insert" ON public.company_members FOR INSERT
  WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin'));
DROP POLICY IF EXISTS "members_update" ON public.company_members;
CREATE POLICY "members_update" ON public.company_members FOR UPDATE
  USING (company_id = my_company_id() AND my_role() IN ('owner','admin'))
  WITH CHECK (company_id = my_company_id());
DROP POLICY IF EXISTS "members_delete" ON public.company_members;
CREATE POLICY "members_delete" ON public.company_members FOR DELETE
  USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- CLIENTS (with legacy fallback)
DROP POLICY IF EXISTS "clients_all" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- PROJECTS (with legacy fallback)
DROP POLICY IF EXISTS "projects_all" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- COST ESTIMATES (with legacy fallback)
DROP POLICY IF EXISTS "ce_all" ON public.cost_estimates;
DROP POLICY IF EXISTS "estimates_select" ON public.cost_estimates;
CREATE POLICY "estimates_select" ON public.cost_estimates FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "estimates_insert" ON public.cost_estimates;
CREATE POLICY "estimates_insert" ON public.cost_estimates FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "estimates_update" ON public.cost_estimates;
CREATE POLICY "estimates_update" ON public.cost_estimates FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "estimates_delete" ON public.cost_estimates;
CREATE POLICY "estimates_delete" ON public.cost_estimates FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- INVOICES (with legacy fallback)
DROP POLICY IF EXISTS "invoices_all" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager','accountant')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager','accountant'));
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- CONTRACTS (with legacy fallback)
DROP POLICY IF EXISTS "contracts_all" ON public.contracts;
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;
CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- COST ESTIMATE ITEMS (via parent)
DROP POLICY IF EXISTS "cei_select" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_insert" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_update" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_delete" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_select" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_insert" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_update" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_delete" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_select_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_insert_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_update_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_delete_v47" ON public.cost_estimate_items;
CREATE POLICY "cost_estimate_items_select" ON public.cost_estimate_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));
CREATE POLICY "cost_estimate_items_insert" ON public.cost_estimate_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));
CREATE POLICY "cost_estimate_items_update" ON public.cost_estimate_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));
CREATE POLICY "cost_estimate_items_delete" ON public.cost_estimate_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));

-- INVOICE ITEMS (via parent)
DROP POLICY IF EXISTS "ii_select" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_update" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_delete" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));
CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));
CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));
CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (company_id = my_company_id());

-- CLIENT TOKENS
DROP POLICY IF EXISTS "client_tokens_select" ON public.client_tokens;
CREATE POLICY "client_tokens_select" ON public.client_tokens FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "client_tokens_insert" ON public.client_tokens;
CREATE POLICY "client_tokens_insert" ON public.client_tokens FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "client_tokens_update" ON public.client_tokens;
CREATE POLICY "client_tokens_update" ON public.client_tokens FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id());

-- PORTAL MESSAGES
DROP POLICY IF EXISTS "portal_messages_select" ON public.portal_messages;
CREATE POLICY "portal_messages_select" ON public.portal_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.client_tokens ct WHERE ct.id = token_id AND ct.company_id = my_company_id()));
DROP POLICY IF EXISTS "portal_messages_insert_company" ON public.portal_messages;
CREATE POLICY "portal_messages_insert_company" ON public.portal_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.client_tokens ct WHERE ct.id = token_id AND ct.company_id = my_company_id()));

-- INVITATIONS
DROP POLICY IF EXISTS "company_invitations_select" ON public.company_invitations;
CREATE POLICY "company_invitations_select" ON public.company_invitations FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "company_invitations_insert" ON public.company_invitations;
CREATE POLICY "company_invitations_insert" ON public.company_invitations FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- v5.8 TABLES RLS
DROP POLICY IF EXISTS "cd_select" ON public.client_decisions;
CREATE POLICY "cd_select" ON public.client_decisions FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "cd_insert" ON public.client_decisions;
CREATE POLICY "cd_insert" ON public.client_decisions FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "cd_update" ON public.client_decisions;
CREATE POLICY "cd_update" ON public.client_decisions FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id());
DROP POLICY IF EXISTS "cd_delete" ON public.client_decisions;
CREATE POLICY "cd_delete" ON public.client_decisions FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "hp_select" ON public.handover_protocols;
CREATE POLICY "hp_select" ON public.handover_protocols FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "hp_insert" ON public.handover_protocols;
CREATE POLICY "hp_insert" ON public.handover_protocols FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "hp_update" ON public.handover_protocols;
CREATE POLICY "hp_update" ON public.handover_protocols FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id());
DROP POLICY IF EXISTS "hp_delete" ON public.handover_protocols;
CREATE POLICY "hp_delete" ON public.handover_protocols FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "ppd_select" ON public.project_photo_docs;
CREATE POLICY "ppd_select" ON public.project_photo_docs FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "ppd_insert" ON public.project_photo_docs;
CREATE POLICY "ppd_insert" ON public.project_photo_docs FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "ppd_update" ON public.project_photo_docs;
CREATE POLICY "ppd_update" ON public.project_photo_docs FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id());
DROP POLICY IF EXISTS "ppd_delete" ON public.project_photo_docs;
CREATE POLICY "ppd_delete" ON public.project_photo_docs FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "ts_select" ON public.technical_standards;
CREATE POLICY "ts_select" ON public.technical_standards FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "ts_insert" ON public.technical_standards;
CREATE POLICY "ts_insert" ON public.technical_standards FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "ts_update" ON public.technical_standards;
CREATE POLICY "ts_update" ON public.technical_standards FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id());
DROP POLICY IF EXISTS "ts_delete" ON public.technical_standards;
CREATE POLICY "ts_delete" ON public.technical_standards FOR DELETE USING (company_id = my_company_id() AND my_role() IN ('owner','admin'));

-- ─────────────────────────────────────────────
-- SECTION E: Indexes
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_user ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ce_user ON public.cost_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_ce_company ON cost_estimates(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_client_tokens_token ON client_tokens(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_cd_company ON client_decisions(company_id);
CREATE INDEX IF NOT EXISTS idx_hp_company ON handover_protocols(company_id);
CREATE INDEX IF NOT EXISTS idx_ppd_company ON project_photo_docs(company_id);
CREATE INDEX IF NOT EXISTS idx_ts_company ON technical_standards(company_id);

-- ─────────────────────────────────────────────
-- SECTION F: FK constraints (safe with exception)
-- ─────────────────────────────────────────────

DO $$ BEGIN ALTER TABLE public.clients ADD CONSTRAINT fk_clients_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projects ADD CONSTRAINT fk_projects_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cost_estimates ADD CONSTRAINT fk_ce_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contracts ADD CONSTRAINT fk_contracts_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.client_decisions ADD CONSTRAINT fk_cd_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.handover_protocols ADD CONSTRAINT fk_hp_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.project_photo_docs ADD CONSTRAINT fk_ppd_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.technical_standards ADD CONSTRAINT fk_ts_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.client_tokens ADD CONSTRAINT chk_max_expiry CHECK (expires_at <= created_at + interval '90 days'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD CONSTRAINT uq_profiles_email UNIQUE (email); EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

-- ============================================================
-- DONE ✓  Security patch applied — all tables + RLS + indexes
-- ============================================================
