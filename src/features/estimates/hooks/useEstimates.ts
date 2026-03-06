import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { estimatesApi } from '@/features/estimates/api/estimates.api'
import { useToast } from '@/shared/hooks/useToast'
import type { Estimate } from '@/entities/estimate/model'

export const estimateKeys = { all: ['estimates'] as const, list: (companyId: string) => [...estimateKeys.all, 'list', companyId] as const }

export function useEstimates() { const companyId = useCompanyId(); return useQuery({ queryKey: estimateKeys.list(companyId), queryFn: () => estimatesApi.list(companyId), enabled: companyId !== 'demo-company' }) }
export function useCreateEstimate() { const companyId = useCompanyId(); const queryClient = useQueryClient(); const toast = useToast(); return useMutation({ mutationFn: estimatesApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: estimateKeys.list(companyId) }); toast.success('Kosztorys utworzony') } }) }
export function useUpdateEstimate() { const companyId = useCompanyId(); const queryClient = useQueryClient(); const toast = useToast(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<Estimate> }) => estimatesApi.update(id, input, companyId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: estimateKeys.list(companyId) }); toast.success('Kosztorys zaktualizowany') } }) }
export function useDeleteEstimate() { const companyId = useCompanyId(); const queryClient = useQueryClient(); const toast = useToast(); return useMutation({ mutationFn: (id: string) => estimatesApi.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: estimateKeys.list(companyId) }); toast.info('Kosztorys usunięty') } }) }
