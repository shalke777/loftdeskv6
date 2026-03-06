import type { CreateProjectInput, Project } from '@/entities/project/model'
import { demoDb } from '@/shared/lib/demoDb'
import { isDemoMode, supabase } from '@/shared/lib/supabase'
import { applyScope, getDataScope, withScope } from '@/shared/lib/dataScope'

export const projectsApi = {
  async list(companyId: string): Promise<Project[]> {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.projects.list(companyId))
    const scope = await getDataScope(companyId)
    const query = applyScope(supabase.from('projects').select('*').order('created_at', { ascending: false }), scope)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row: any) => ({ id: row.id, company_id: row.company_id ?? companyId, client_id: row.client_id, estimate_id: row.estimate_id ?? null, number: row.number, name: row.name, status: row.status, start_date: row.start_date, end_date: row.end_date, address: row.address ?? '', budget: Number(row.budget ?? 0), costs: Number(row.costs ?? 0), notes: row.notes ?? '', created_at: row.created_at }))
  },
  async create(input: CreateProjectInput): Promise<Project> {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.projects.create(input))
    const scope = await getDataScope(input.company_id)
    const payload = withScope(scope, { number: `PRJ/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`, client_id: input.client_id, estimate_id: input.estimate_id ?? null, name: input.name, status: input.status, start_date: input.start_date, end_date: input.end_date, address: input.address ?? null, budget: input.budget ?? null, costs: input.costs ?? 0, notes: input.notes ?? null })
    const { data, error } = await supabase.from('projects').insert(payload).select('*').single()
    if (error) throw error
    return { id: data.id, company_id: data.company_id ?? input.company_id, client_id: data.client_id, estimate_id: data.estimate_id ?? input.estimate_id ?? null, number: data.number, name: data.name, status: data.status, start_date: data.start_date, end_date: data.end_date, address: data.address ?? '', budget: Number(data.budget ?? 0), costs: Number(data.costs ?? 0), notes: data.notes ?? '', created_at: data.created_at }
  },
  async update(id: string, input: Partial<Project>, companyId?: string) {
    if (isDemoMode || !supabase) return Promise.resolve(demoDb.projects.update(id, input))
    const scope = await getDataScope(companyId)
    const query = applyScope(supabase.from('projects').update(input).eq('id', id).select('*').single(), scope)
    const { data, error } = await query
    if (error) throw error
    return data
  },
  async createFromEstimate(companyId: string, estimateId: string) { if (isDemoMode || !supabase) return Promise.resolve(demoDb.projects.createFromEstimate(companyId, estimateId)); throw new Error('Workflow estimate → projekt wymaga mapowania estimate do projects po stronie funkcji.') },
  async updateStatus(id: string, status: Project['status'], companyId?: string) { if (isDemoMode || !supabase) { demoDb.projects.updateStatus(id, status); return Promise.resolve() } const scope = await getDataScope(companyId); const query = applyScope(supabase.from('projects').update({ status }).eq('id', id), scope); const { error } = await query; if (error) throw error },
  async delete(id: string, companyId?: string) { if (isDemoMode || !supabase) { demoDb.projects.delete(id); return Promise.resolve() } const scope = await getDataScope(companyId); const query = applyScope(supabase.from('projects').delete().eq('id', id), scope); const { error } = await query; if (error) throw error },
}
