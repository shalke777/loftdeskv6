import { ReleaseCenterPage } from '@/features/release/components/ReleaseCenterPage'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { AccessNotice } from '@/shared/ui/AccessNotice/AccessNotice'

export function ReleaseRoutePage() {
  const allowed = useFeatureAccess('release')
  if (!allowed) return <AccessNotice title="Release Center" description="Ten moduł wymaga uprawnień administratora." />
  return <ReleaseCenterPage />
}
