import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'

const STATUS_PL: Record<string, string> = { draft: 'Szkic', sent: 'Wysłana', accepted: 'Zaakceptowana', rejected: 'Odrzucona' }

export function PortalHeader({
  estimateNumber,
  estimateName,
  customerName,
  contractorName,
  contractorEmail,
  expiresAt,
  expired,
  estimateStatus,
  totalGross,
  onAccept,
  onReject,
  decisionPending,
}: {
  estimateNumber: string
  estimateName: string
  customerName: string
  contractorName: string
  contractorEmail: string
  expiresAt: string
  expired: boolean
  estimateStatus: 'draft' | 'sent' | 'accepted' | 'rejected'
  totalGross: number
  onAccept: () => void
  onReject: () => void
  decisionPending?: boolean
}) {
  const isAccepted = estimateStatus === 'accepted'
  const isRejected = estimateStatus === 'rejected'
  const isDecided = isAccepted || isRejected
  const [expanded, setExpanded] = useState(false)

  /* ---------- collapsed green/red pill after decision ---------- */
  if (isDecided && !expanded) {
    return (
      <button
        className={`portal-bar ${isAccepted ? 'portal-bar--ok' : 'portal-bar--bad'}`}
        onClick={() => setExpanded(true)}
      >
        {isAccepted ? <Check size={16} /> : null}
        <span>{isAccepted ? 'Zaakceptowano ofertę' : 'Nie zaakceptowano'} — {estimateName}</span>
        <ChevronDown size={16} />
      </button>
    )
  }

  /* ---------- full header ---------- */
  return (
    <div className="portal-hdr">
      <div className="portal-hdr__top">
        <div className="portal-hdr__info">
          <span className="portal-hdr__number">{estimateNumber}</span>
          <h2 className="portal-hdr__name">{estimateName}</h2>
          <Badge variant={isAccepted ? 'success' : isRejected ? 'danger' : 'warning'}>{STATUS_PL[estimateStatus] || estimateStatus}</Badge>
        </div>
        <p className="portal-hdr__amount">{formatCurrency(totalGross)}</p>
      </div>

      <div className="portal-hdr__meta">
        <span>Klient: {customerName}</span>
        <span>Wykonawca: {contractorName}</span>
        {contractorEmail ? <span>Kontakt: {contractorEmail}</span> : null}
        <span>Portal: komentarze i akceptacje do tej wyceny</span>
        <span>{expired ? 'Link wygasł' : `Ważny do ${formatDate(expiresAt)}`}</span>
      </div>

      {!isDecided ? (
        <div className="portal-hdr__actions">
          <Button onClick={onAccept} disabled={decisionPending}>Akceptuję ofertę</Button>
          <Button variant="danger" onClick={onReject} disabled={decisionPending}>Nie akceptuję</Button>
        </div>
      ) : (
        <button className="portal-hdr__collapse" onClick={() => setExpanded(false)}>Zwiń ↑</button>
      )}
    </div>
  )
}