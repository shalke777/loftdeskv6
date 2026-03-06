import { supabase } from '@/shared/lib/supabase'
import { requireSupabaseUserId } from '@/shared/lib/legacySupabase'

export type DataScope = {
  mode: 'multi-tenant' | 'legacy'
  userId: string
  companyId: string
  role?: string | null
}

export async function getDataScope(companyIdHint?: string): Promise<DataScope> {
  const userId = await requireSupabaseUserId()
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany')

  let { data: memberRow } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  // Auto-bootstrap company if user has none
  if (!memberRow?.company_id) {
    try {
      await supabase.rpc('bootstrap_my_company')
      const { data: freshMember } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      if (freshMember?.company_id) memberRow = freshMember
    } catch {
      // fall through to legacy mode
    }
  }

  if (memberRow?.company_id) {
    return {
      mode: 'multi-tenant',
      userId,
      companyId: memberRow.company_id,
      role: memberRow.role,
    }
  }

  return {
    mode: 'legacy',
    userId,
    companyId: companyIdHint ?? userId,
    role: 'owner',
  }
}

export function applyScope(query: any, scope: DataScope) {
  return scope.mode === 'multi-tenant'
    ? query.eq('company_id', scope.companyId)
    : query.eq('user_id', scope.userId)
}

export function withScope<T extends Record<string, unknown>>(scope: DataScope, payload: T) {
  return scope.mode === 'multi-tenant'
    ? compact({ ...payload, company_id: scope.companyId, user_id: scope.userId })
    : compact({ ...payload, user_id: scope.userId })
}

export function compact<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as T
}
