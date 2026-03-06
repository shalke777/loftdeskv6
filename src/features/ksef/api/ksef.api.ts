import type { Invoice } from '@/entities/invoice/model'
import { demoDb } from '@/shared/lib/demoDb'
import { isDemoMode, supabase } from '@/shared/lib/supabase'
import { applyScope, getDataScope } from '@/shared/lib/dataScope'

export type KsefDirection = 'sent' | 'received'

export interface KsefUpo {
  id: string
  invoice_id: string
  invoice_number: string
  ksef_ref: string
  upo_ref: string
  upo_date: string
  status: 'confirmed' | 'rejected'
}

export interface KsefReceivedInvoice {
  id: string
  company_id: string
  sender_name: string
  sender_nip: string
  number: string
  issue_date: string
  total_net: number
  total_gross: number
  ksef_ref: string
  received_at: string
}

const demoPlusDay = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)

const demoReceivedInvoices: KsefReceivedInvoice[] = [
  { id: 'kr1', company_id: 'cmp-wisniewski', sender_name: 'Hurtownia BudMat Sp. z o.o.', sender_nip: '5210018764', number: 'FZ/2026/00341', issue_date: demoPlusDay(-5), total_net: 4200, total_gross: 5166, ksef_ref: 'PL2026KSF0000841', received_at: demoPlusDay(-4) },
  { id: 'kr2', company_id: 'cmp-wisniewski', sender_name: 'Ceramed Materiały', sender_nip: '6340012345', number: 'FV/03/2026/128', issue_date: demoPlusDay(-3), total_net: 1850, total_gross: 2275.5, ksef_ref: 'PL2026KSF0000912', received_at: demoPlusDay(-2) },
  { id: 'kr3', company_id: 'cmp-wisniewski', sender_name: 'TransBud Logistyka', sender_nip: '9510044567', number: 'FV/2026/0087', issue_date: demoPlusDay(-1), total_net: 620, total_gross: 762.6, ksef_ref: 'PL2026KSF0000955', received_at: demoPlusDay(0) },
]

const demoUpos: KsefUpo[] = [
  { id: 'upo1', invoice_id: 'f1', invoice_number: 'FV/2026/001', ksef_ref: 'PL2026KSF0000123', upo_ref: 'UPO-2026-00123', upo_date: demoPlusDay(-10), status: 'confirmed' },
]

export const ksefApi = {
  async listSent(companyId: string): Promise<Invoice[]> {
    if (isDemoMode || !supabase) {
      return demoDb.invoices.list(companyId).filter((inv) => inv.ksef_status === 'ksef_sent')
    }
    const scope = await getDataScope(companyId)
    const query = applyScope(
      supabase.from('invoices').select('*, items:invoice_items(*)').eq('ksef_status', 'ksef_sent').order('created_at', { ascending: false }),
      scope,
    )
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async listIssued(companyId: string): Promise<Invoice[]> {
    if (isDemoMode || !supabase) {
      return demoDb.invoices.list(companyId)
    }
    const scope = await getDataScope(companyId)
    const query = applyScope(
      supabase.from('invoices').select('*, items:invoice_items(*)').order('created_at', { ascending: false }),
      scope,
    )
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async listReceived(companyId: string): Promise<KsefReceivedInvoice[]> {
    if (isDemoMode || !supabase) {
      return demoReceivedInvoices.filter((inv) => inv.company_id === companyId)
    }
    const scope = await getDataScope(companyId)
    const query = applyScope(
      supabase.from('ksef_received_invoices').select('*').order('received_at', { ascending: false }),
      scope,
    )
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async listUpo(companyId: string): Promise<KsefUpo[]> {
    if (isDemoMode || !supabase) {
      return demoUpos
    }
    const scope = await getDataScope(companyId)
    const query = applyScope(
      supabase.from('ksef_upo').select('*').order('upo_date', { ascending: false }),
      scope,
    )
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },
}
