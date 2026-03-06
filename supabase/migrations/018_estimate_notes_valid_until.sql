-- 018: Add ALL missing columns across the schema
-- Fixes PGRST204 / 400 errors caused by TS code referencing non-existent DB columns

-- ── CLIENTS: city, postal_code, contact_person ──
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- ── PROJECTS: estimate_id, costs ──
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costs NUMERIC(14,2) DEFAULT 0;

-- ── COST ESTIMATES: notes, valid_until ──
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.cost_estimates ADD COLUMN IF NOT EXISTS valid_until DATE;

-- ── COST ESTIMATE ITEMS: name, vat_rate ──
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.cost_estimate_items ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 23;

-- ── INVOICES: contract_id, estimate_id, total_net, total_gross, notes ──
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_net NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_gross NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── INVOICE ITEMS: tranche_label ──
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS tranche_label TEXT;

-- ── CONTRACTS: estimate_id, template_name, template_content, tranches ──
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS estimate_id UUID;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS template_content TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS tranches JSONB DEFAULT '[]'::jsonb;

-- ── COMPANIES: KSeF fields ──
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ksef_token TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ksef_nip TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ksef_env TEXT DEFAULT 'test';

-- ── RLS: Missing UPDATE/DELETE on items ──
DROP POLICY IF EXISTS "cost_estimate_items_update" ON public.cost_estimate_items;
CREATE POLICY "cost_estimate_items_update" ON public.cost_estimate_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));
DROP POLICY IF EXISTS "cost_estimate_items_delete" ON public.cost_estimate_items;
CREATE POLICY "cost_estimate_items_delete" ON public.cost_estimate_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.cost_estimates ce WHERE ce.id = cost_estimate_id AND ce.company_id = my_company_id()));

DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
CREATE POLICY "invoice_items_update" ON public.invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));
DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.company_id = my_company_id()));

-- ── RLS: Companies UPDATE policy ──
DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies FOR UPDATE
  USING (id = my_company_id() AND my_role() IN ('owner','admin'))
  WITH CHECK (id = my_company_id());

-- ── RLS: Company members full CRUD ──
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
