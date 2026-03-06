-- ============================================================
-- LOFTDESK — FULL DATABASE SETUP
-- Uruchom w: Supabase Dashboard > SQL Editor
-- Kolejność: 1) schema bazowy  2) multi-tenant  3) RLS  4) migracje
-- ============================================================

-- =============================================
-- PART 1: BASE SCHEMA (tabele, indeksy, triggers)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Normalize profiles PK column name (some Supabase setups use user_id instead of id) ──
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

-- ── PROFILES (extends auth.users) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  company     TEXT,
  nip         TEXT,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business','admin')),
  ksef_token  TEXT,
  ksef_nip    TEXT,
  ksef_env    TEXT NOT NULL DEFAULT 'test' CHECK (ksef_env IN ('test','prod')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CLIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  nip            TEXT,
  address        TEXT,
  city           TEXT,
  postal_code    TEXT,
  contact_person TEXT,
  email          TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROJECTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number     TEXT NOT NULL,
  name       TEXT NOT NULL,
  client_id  UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'offer' CHECK (status IN ('offer','active','done','cancelled')),
  start_date DATE,
  end_date   DATE,
  address    TEXT,
  budget      NUMERIC(14,2),
  notes       TEXT,
  estimate_id UUID,
  costs       NUMERIC(14,2) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COST ESTIMATES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number      TEXT NOT NULL,
  name        TEXT NOT NULL,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
  total_net   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  valid_until DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COST ESTIMATE ITEMS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cost_estimate_items (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cost_estimate_id UUID REFERENCES public.cost_estimates(id) ON DELETE CASCADE NOT NULL,
  name             TEXT,
  description      TEXT NOT NULL,
  unit             TEXT NOT NULL DEFAULT 'm²',
  quantity         NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate         NUMERIC(5,2) NOT NULL DEFAULT 23,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INVOICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number      TEXT NOT NULL,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue')),
  issue_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE,
  contract_id  UUID,
  estimate_id  UUID,
  total_net    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_gross  NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  ksef_status  TEXT CHECK (ksef_status IN ('ksef_sent','ksef_pending','ksef_error')),
  ksef_ref     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INVOICE ITEMS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id  UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'kpl',
  quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate       INTEGER NOT NULL DEFAULT 23,
  tranche_label  TEXT,
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTRACTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  number     TEXT NOT NULL,
  client_id  UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'unsigned' CHECK (status IN ('unsigned','signed')),
  sign_date         DATE,
  value              NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes              TEXT,
  estimate_id        UUID,
  template_name      TEXT,
  template_content   TEXT,
  tranches           JSONB DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ENSURE ALL COLUMNS EXIST (tables may pre-exist without them) ──
-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_nip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ksef_env TEXT DEFAULT 'test';
-- clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_person TEXT;
-- projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offer';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget NUMERIC(14,2);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costs NUMERIC(14,2) DEFAULT 0;
-- cost_estimates
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS total_net NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS total_gross NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS valid_until DATE;
-- cost_estimate_items
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS cost_estimate_id UUID;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'm²';
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 23;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
-- invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unpaid';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_net NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_gross NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ksef_status TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ksef_ref TEXT;
-- invoice_items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS invoice_id UUID;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kpl';
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS vat_rate INTEGER DEFAULT 23;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS tranche_label TEXT;
-- contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unsigned';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sign_date DATE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS value NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS template_content TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS tranches JSONB DEFAULT '[]'::jsonb;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_clients_user      ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user     ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client   ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_ce_user           ON public.cost_estimates(user_id);
CREATE INDEX IF NOT EXISTS idx_ce_client         ON public.cost_estimates(client_id);
CREATE INDEX IF NOT EXISTS idx_ce_project        ON public.cost_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_cei_ce            ON public.cost_estimate_items(cost_estimate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user     ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client   ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user    ON public.contracts(user_id);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles','clients','projects','cost_estimates','invoices','contracts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_%I ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_updated_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl, tbl);
  END LOOP;
END $$;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, nip, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'nip', ''),
    'free'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PLAN LIMITS FUNCTION
CREATE OR REPLACE FUNCTION public.check_plan_limit(p_user_id UUID, p_table TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan TEXT; v_count INT; v_limit INT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;
  IF v_plan IN ('pro','business','admin') THEN RETURN TRUE; END IF;
  EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE user_id = $1', p_table) INTO v_count USING p_user_id;
  v_limit := CASE p_table
    WHEN 'invoices'       THEN 5
    WHEN 'contracts'      THEN 3
    WHEN 'clients'        THEN 10
    WHEN 'projects'       THEN 3
    WHEN 'cost_estimates' THEN 5
    ELSE 9999
  END;
  RETURN v_count < v_limit;
END;
$$;


-- =============================================
-- PART 2: MULTI-TENANT (companies, members)
-- =============================================

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  nip text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

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

-- Helper functions (SECURITY DEFINER to bypass RLS on company_members — prevents infinite recursion)
CREATE OR REPLACE FUNCTION my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.company_members WHERE user_id = auth.uid() LIMIT 1
$$;


-- =============================================
-- PART 3: AUDIT LOG
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================
-- PART 4: CLIENT PORTAL
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_estimate_id uuid REFERENCES public.cost_estimates(id) ON DELETE CASCADE,
  client_name text,
  token text UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS cost_estimate_id uuid;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.client_tokens ADD COLUMN IF NOT EXISTS expires_at timestamptz;

CREATE TABLE IF NOT EXISTS public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.client_tokens(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('client','company')),
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS token_id uuid;
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS sender text;
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;


-- =============================================
-- PART 5: COMPANY ONBOARDING FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.bootstrap_my_company(company_name text DEFAULT NULL, company_nip text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_profile record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT company_id INTO v_company_id
  FROM public.company_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;

  INSERT INTO public.companies (owner_user_id, name, nip, plan)
  VALUES (
    v_user_id,
    COALESCE(NULLIF(company_name, ''), NULLIF(v_profile.company, ''), NULLIF(v_profile.full_name, ''), 'LoftDesk Workspace'),
    COALESCE(NULLIF(company_nip, ''), NULLIF(v_profile.nip, '')),
    COALESCE(v_profile.plan, 'free')
  )
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, v_user_id, 'owner')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  UPDATE public.clients SET company_id = v_company_id WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.projects SET company_id = v_company_id WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.cost_estimates SET company_id = v_company_id WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.invoices SET company_id = v_company_id WHERE user_id = v_user_id AND company_id IS NULL;
  UPDATE public.contracts SET company_id = v_company_id WHERE user_id = v_user_id AND company_id IS NULL;

  RETURN v_company_id;
END $$;


-- =============================================
-- PART 6: INVITATIONS
-- =============================================

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

CREATE OR REPLACE FUNCTION public.accept_company_invitation(invite_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_row public.company_invitations%rowtype;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  SELECT * INTO invite_row
  FROM public.company_invitations
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF invite_row.id IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND';
  END IF;

  INSERT INTO public.company_members(company_id, user_id, role)
  VALUES (invite_row.company_id, current_user_id, invite_row.role)
  ON CONFLICT (company_id, user_id) DO UPDATE SET role = excluded.role;

  UPDATE public.company_invitations
  SET status = 'accepted'
  WHERE id = invite_row.id;

  RETURN invite_row.company_id;
END;
$$;


-- =============================================
-- PART 7: CLIENT COLLABORATION (v5.8)
-- =============================================

CREATE TABLE IF NOT EXISTS public.client_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  related_estimate_id uuid,
  title text NOT NULL,
  description text,
  decision_type text NOT NULL DEFAULT 'change',
  status text NOT NULL DEFAULT 'pending_client',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  client_comment text
);
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS related_estimate_id uuid;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS decision_type text DEFAULT 'change';
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_client';
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE public.client_decisions ADD COLUMN IF NOT EXISTS client_comment text;

CREATE TABLE IF NOT EXISTS public.handover_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  protocol_date date,
  summary text,
  notes text,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS protocol_date date;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.handover_protocols ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.project_photo_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'progress',
  taken_at timestamptz,
  image_url text,
  note text
);
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS category text DEFAULT 'progress';
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS taken_at timestamptz;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.project_photo_docs ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS public.technical_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'technical_standard',
  source_label text,
  content text NOT NULL,
  requires_client_acceptance boolean NOT NULL DEFAULT false,
  accepted_by_client boolean NOT NULL DEFAULT false
);
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS category text DEFAULT 'technical_standard';
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS source_label text;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS requires_client_acceptance boolean DEFAULT false;
ALTER TABLE public.technical_standards ADD COLUMN IF NOT EXISTS accepted_by_client boolean DEFAULT false;


-- =============================================
-- PART 8: ROW LEVEL SECURITY — FULL
-- =============================================

-- Enable RLS on ALL tables
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

-- PROFILES — user can only see/edit own
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- COMPANIES — member can see their company
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (id = my_company_id());

-- COMPANY MEMBERS
DROP POLICY IF EXISTS "members_select" ON public.company_members;
CREATE POLICY "members_select" ON public.company_members FOR SELECT USING (company_id = my_company_id());

-- CLIENTS — company-scoped + legacy fallback
DROP POLICY IF EXISTS "clients_all" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()))
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE
  USING ((company_id = my_company_id() AND my_role() IN ('owner','admin')) OR (my_company_id() IS NULL AND user_id = auth.uid()));

-- PROJECTS — company-scoped + legacy fallback
DROP POLICY IF EXISTS "projects_all" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()))
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING ((company_id = my_company_id() AND my_role() IN ('owner','admin')) OR (my_company_id() IS NULL AND user_id = auth.uid()));

-- COST ESTIMATES — company-scoped + legacy fallback
DROP POLICY IF EXISTS "ce_all" ON public.cost_estimates;
DROP POLICY IF EXISTS "estimates_select" ON public.cost_estimates;
CREATE POLICY "estimates_select" ON public.cost_estimates FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "estimates_insert" ON public.cost_estimates;
CREATE POLICY "estimates_insert" ON public.cost_estimates FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "estimates_update" ON public.cost_estimates;
CREATE POLICY "estimates_update" ON public.cost_estimates FOR UPDATE
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()))
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "estimates_delete" ON public.cost_estimates;
CREATE POLICY "estimates_delete" ON public.cost_estimates FOR DELETE
  USING ((company_id = my_company_id() AND my_role() IN ('owner','admin')) OR (my_company_id() IS NULL AND user_id = auth.uid()));

-- COST ESTIMATE ITEMS — via parent
DROP POLICY IF EXISTS "cei_select" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_insert" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_update" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cei_delete" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_select_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_insert_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_update_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_delete_v47" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_select" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_insert" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_update" ON public.cost_estimate_items;
DROP POLICY IF EXISTS "cost_estimate_items_delete" ON public.cost_estimate_items;
CREATE POLICY "cost_estimate_items_select" ON public.cost_estimate_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND (ce.company_id = my_company_id() OR (my_company_id() IS NULL AND ce.user_id = auth.uid()))));
CREATE POLICY "cost_estimate_items_insert" ON public.cost_estimate_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND (ce.company_id = my_company_id() OR (my_company_id() IS NULL AND ce.user_id = auth.uid()))));
CREATE POLICY "cost_estimate_items_update" ON public.cost_estimate_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND (ce.company_id = my_company_id() OR (my_company_id() IS NULL AND ce.user_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND (ce.company_id = my_company_id() OR (my_company_id() IS NULL AND ce.user_id = auth.uid()))));
CREATE POLICY "cost_estimate_items_delete" ON public.cost_estimate_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND (ce.company_id = my_company_id() OR (my_company_id() IS NULL AND ce.user_id = auth.uid()))));

-- INVOICES — company-scoped + legacy fallback
DROP POLICY IF EXISTS "invoices_all" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager','accountant')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()))
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager','accountant')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE
  USING ((company_id = my_company_id() AND my_role() IN ('owner','admin')) OR (my_company_id() IS NULL AND user_id = auth.uid()));

-- INVOICE ITEMS — via parent
DROP POLICY IF EXISTS "ii_select" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_update" ON public.invoice_items;
DROP POLICY IF EXISTS "ii_delete" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_select_v47" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_v47" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_v47" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_v47" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.company_id = my_company_id() OR (my_company_id() IS NULL AND i.user_id = auth.uid()))));
CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.company_id = my_company_id() OR (my_company_id() IS NULL AND i.user_id = auth.uid()))));
CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.company_id = my_company_id() OR (my_company_id() IS NULL AND i.user_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.company_id = my_company_id() OR (my_company_id() IS NULL AND i.user_id = auth.uid()))));
CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.company_id = my_company_id() OR (my_company_id() IS NULL AND i.user_id = auth.uid()))));

-- CONTRACTS — company-scoped + legacy fallback
DROP POLICY IF EXISTS "contracts_all" ON public.contracts;
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE
  USING (company_id = my_company_id() OR (my_company_id() IS NULL AND user_id = auth.uid()))
  WITH CHECK ((company_id = my_company_id() AND my_role() IN ('owner','admin','manager')) OR (my_company_id() IS NULL AND user_id = auth.uid()));
DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;
CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE
  USING ((company_id = my_company_id() AND my_role() IN ('owner','admin')) OR (my_company_id() IS NULL AND user_id = auth.uid()));

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (company_id = my_company_id());

-- CLIENT TOKENS
DROP POLICY IF EXISTS "client_tokens_select" ON public.client_tokens;
CREATE POLICY "client_tokens_select" ON public.client_tokens FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "client_tokens_insert" ON public.client_tokens;
CREATE POLICY "client_tokens_insert" ON public.client_tokens FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));
DROP POLICY IF EXISTS "client_tokens_update" ON public.client_tokens;
CREATE POLICY "client_tokens_update" ON public.client_tokens FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin','manager'));

-- PORTAL MESSAGES
DROP POLICY IF EXISTS "portal_messages_select" ON public.portal_messages;
DROP POLICY IF EXISTS "portal_messages_select_company" ON public.portal_messages;
CREATE POLICY "portal_messages_select" ON public.portal_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.client_tokens ct WHERE ct.id = token_id AND ct.company_id = my_company_id()));
DROP POLICY IF EXISTS "portal_messages_insert_company" ON public.portal_messages;
CREATE POLICY "portal_messages_insert_company" ON public.portal_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.client_tokens ct WHERE ct.id = token_id AND ct.company_id = my_company_id()) AND my_role() IN ('owner','admin','manager'));

-- INVITATIONS
DROP POLICY IF EXISTS "company_invitations_select" ON public.company_invitations;
CREATE POLICY "company_invitations_select" ON public.company_invitations FOR SELECT USING (company_id = my_company_id());
DROP POLICY IF EXISTS "company_invitations_insert" ON public.company_invitations;
CREATE POLICY "company_invitations_insert" ON public.company_invitations FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin'));
DROP POLICY IF EXISTS "company_invitations_update" ON public.company_invitations;
CREATE POLICY "company_invitations_update" ON public.company_invitations FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('owner','admin'));


-- =============================================
-- PART 9: INDEXES (hardening)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_company_members_company_user ON company_members(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_email ON company_invitations(company_id, email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_status ON company_invitations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created_at ON audit_logs(company_id, created_at DESC);


-- =============================================
-- PART 10: VIEWS (dashboard / health)
-- =============================================

CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  auth.uid() AS user_id,
  (SELECT COUNT(*) FROM public.clients WHERE company_id = my_company_id()) AS clients_count,
  (SELECT COUNT(*) FROM public.projects WHERE company_id = my_company_id()) AS projects_count,
  (SELECT COUNT(*) FROM public.cost_estimates WHERE company_id = my_company_id()) AS ce_count,
  (SELECT COUNT(*) FROM public.invoices WHERE company_id = my_company_id()) AS invoices_count,
  (SELECT COALESCE(SUM(total_gross),0) FROM public.cost_estimates WHERE company_id = my_company_id()) AS ce_total_gross,
  (SELECT COALESCE(SUM(i.quantity * i.unit_price),0) FROM public.invoice_items i JOIN public.invoices inv ON inv.id = i.invoice_id WHERE inv.company_id = my_company_id() AND inv.status = 'paid') AS revenue_paid,
  (SELECT COALESCE(SUM(i.quantity * i.unit_price),0) FROM public.invoice_items i JOIN public.invoices inv ON inv.id = i.invoice_id WHERE inv.company_id = my_company_id() AND inv.status = 'unpaid') AS revenue_unpaid;


-- ============================================================
-- DONE ✓  LoftDesk full schema ready
-- ============================================================
