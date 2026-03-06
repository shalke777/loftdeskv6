import { Card } from '@/shared/ui/Card/Card'

export function PortalExpired() {
  return (
    <div className="portal-page">
      <Card>
        <h3>Link do portalu jest nieaktywny</h3>
        <p>Skontaktuj się z wykonawcą — ten link wygasł lub został wyłączony. Poproś o nowy link do wyceny/projektu.</p>
      </Card>
    </div>
  )
}