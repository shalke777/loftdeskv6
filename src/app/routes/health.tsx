import { SystemHealthPage } from '@/features/release/components/SystemHealthPage'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { AccessNotice } from '@/shared/ui/AccessNotice/AccessNotice'

export function HealthRoutePage() {
  const allowed = useFeatureAccess('release')
  if (!allowed) return <AccessNotice title="System Health" description="Ten moduł wymaga uprawnień administratora." />
  return <SystemHealthPage />
}
