import { GoLivePage } from '@/features/release/components/GoLivePage'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { AccessNotice } from '@/shared/ui/AccessNotice/AccessNotice'

export function GoLiveRoutePage() {
  const allowed = useFeatureAccess('release')
  if (!allowed) return <AccessNotice title="Go Live" description="Ten moduł wymaga uprawnień administratora." />
  return <GoLivePage />
}
