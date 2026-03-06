import type { CreateEstimateInput, Estimate } from '@/entities/estimate/model'
import { calcTotals } from '@/features/estimates/lib/estimate.calculations'
import { demoDb } from '@/shared/lib/demoDb'
import { isDemoMode, supabase } from '@/shared/lib/supabase'
import { applyScope, getDataScope, withScope } from '@/shared/lib/dataScope'

export const estimatesApi = {
  async list(companyId: string): Promise<Estimate[]> {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.estimates.list(companyId))
    const scope = await getDataScope(companyId)
    const query = applyScope(supabase.from('cost_estimates').select('*, items:cost_estimate_items(*)').order('created_at', { ascending: false }), scope)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row: any) => ({ id: row.id, company_id: row.company_id ?? companyId, client_id: row.client_id, number: row.number, name: row.name, status: row.status, total_net: Number(row.total_net ?? 0), total_gross: Number(row.total_gross ?? 0), notes: row.notes ?? '', valid_until: row.valid_until ?? null, created_at: row.created_at, items: (row.items ?? []).map((item: any, index: number) => ({ id: item.id, name: item.name ?? item.description, description: item.description ?? '', unit: item.unit, quantity: Number(item.quantity), unit_price: Number(item.unit_price), vat_rate: Number(item.vat_rate ?? 23), sort_order: item.sort_order ?? index })) }))
  },
  async create(input: CreateEstimateInput): Promise<Estimate> {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.estimates.create({ company_id: input.company_id, client_id: input.client_id, name: input.name, status: input.status ?? 'draft', notes: input.notes, valid_until: input.valid_until ?? null, items: input.items ?? [] }))
    const items = input.items ?? []
    const totals = calcTotals(items)
    const scope = await getDataScope(input.company_id)
    const payload = withScope(scope, { number: `KE/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`, name: input.name, client_id: input.client_id, project_id: null, status: input.status ?? 'draft', total_net: totals.net, total_gross: totals.gross, notes: input.notes ?? null, valid_until: input.valid_until ?? null })
    const { data, error } = await supabase.from('cost_estimates').insert(payload).select('*').single()
    if (error) throw error
    return { id: data.id, company_id: data.company_id ?? input.company_id, client_id: data.client_id, number: data.number, name: data.name, status: data.status, total_net: totals.net, total_gross: totals.gross, notes: data.notes ?? '', valid_until: data.valid_until ?? null, created_at: data.created_at, items }
  },
  async update(id: string, input: Partial<Estimate>, companyId?: string) {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.estimates.update(id, input))
    const scope = await getDataScope(companyId)
    const items = input.items
    const totals = items ? calcTotals(items) : null
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.client_id !== undefined) payload.client_id = input.client_id
    if (input.status !== undefined) payload.status = input.status
    if (input.notes !== undefined) payload.notes = input.notes ?? null
    if (input.valid_until !== undefined) payload.valid_until = input.valid_until ?? null
    if (totals) { payload.total_net = totals.net; payload.total_gross = totals.gross }
    const query = applyScope(supabase.from('cost_estimates').update(payload).eq('id', id).select('*').single(), scope)
    const { data, error } = await query
    if (error) throw error
    if (items && items.length > 0) {
      await supabase.from('cost_estimate_items').delete().eq('estimate_id', id)
      const rows = items.map((item, index) => ({ estimate_id: id, name: item.name, description: item.description ?? '', unit: item.unit, quantity: item.quantity, unit_price: item.unit_price, vat_rate: item.vat_rate, sort_order: item.sort_order ?? index + 1 }))
      const { error: itemsError } = await supabase.from('cost_estimate_items').insert(rows)
      if (itemsError) throw itemsError
    }
    return data
  },
  async delete(id: string, companyId?: string) {
    if (isDemoMode || !supabase) { demoDb.estimates.delete(id); return Promise.resolve() }
    const scope = await getDataScope(companyId)
    const query = applyScope(supabase.from('cost_estimates').delete().eq('id', id), scope)
    const { error } = await query
    if (error) throw error
  },
}
