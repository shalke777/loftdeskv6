import { KsefPage } from '@/features/ksef/components/KsefPage'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { AccessNotice } from '@/shared/ui/AccessNotice/AccessNotice'

export function KsefRoutePage() {
  const allowed = useFeatureAccess('ksef')
  if (!allowed) return <AccessNotice title="KSeF w planie Pro/Business" description="Integracja KSeF jest dostępna od planu Pro dla ról owner/admin/manager/accountant." actionLabel="Przejdź do billing" onAction={() => window.location.assign('/billing')} />
  return <KsefPage />
}
