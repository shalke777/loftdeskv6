import { useQuery } from '@tanstack/react-query'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { ksefApi } from '@/features/ksef/api/ksef.api'

const ksefKeys = {
  all: ['ksef'] as const,
  sent: (companyId: string) => [...ksefKeys.all, 'sent', companyId] as const,
  issued: (companyId: string) => [...ksefKeys.all, 'issued', companyId] as const,
  received: (companyId: string) => [...ksefKeys.all, 'received', companyId] as const,
  upo: (companyId: string) => [...ksefKeys.all, 'upo', companyId] as const,
}

export function useKsefSent() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ksefKeys.sent(companyId), queryFn: () => ksefApi.listSent(companyId), enabled: companyId !== 'demo-company' })
}

export function useKsefIssued() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ksefKeys.issued(companyId), queryFn: () => ksefApi.listIssued(companyId), enabled: companyId !== 'demo-company' })
}

export function useKsefReceived() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ksefKeys.received(companyId), queryFn: () => ksefApi.listReceived(companyId), enabled: companyId !== 'demo-company' })
}

export function useKsefUpo() {
  const companyId = useCompanyId()
  return useQuery({ queryKey: ksefKeys.upo(companyId), queryFn: () => ksefApi.listUpo(companyId), enabled: companyId !== 'demo-company' })
}
