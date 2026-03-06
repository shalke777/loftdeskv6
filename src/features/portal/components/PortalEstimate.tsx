import { Card } from '@/shared/ui/Card/Card'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'

export function PortalEstimate({
  totalGross,
  estimateStatus,
  onAccept,
  onReject,
  disabled,
}: {
  totalGross: number
  estimateStatus: 'draft' | 'sent' | 'accepted' | 'rejected'
  onAccept: () => void
  onReject: () => void
  disabled?: boolean
}) {
  const canDecide = estimateStatus !== 'accepted' && estimateStatus !== 'rejected'
  return (
    <Card>
      <h3>Decyzja o ofercie</h3>
      <p>Wartość brutto: {formatCurrency(totalGross)}</p>
      <p className="field__label">Status: {estimateStatus}</p>
      <div className="actions-row" style={{ marginTop: 12 }}>
        <Button onClick={onAccept} disabled={disabled || !canDecide}>Akceptuję ofertę</Button>
        <Button variant="danger" onClick={onReject} disabled={disabled || !canDecide}>Nie akceptuję</Button>
      </div>
    </Card>
  )
}