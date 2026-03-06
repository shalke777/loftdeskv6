import { useMemo, useState } from 'react'
import type { Estimate } from '@/entities/estimate/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'
import { DocumentPreviewModal } from '@/shared/ui/DocumentPreview/DocumentPreviewModal'
import { buildEstimatePreview } from '@/services/pdf/documentPreview'
import { useClients } from '@/features/clients/hooks/useClients'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { STATUS_META } from '@/shared/lib/constants'

function variant(status: Estimate['status']) { if (status === 'accepted') return 'success'; if (status === 'rejected') return 'danger'; if (status === 'sent') return 'warning'; return 'default' }

interface Props {
  estimate: Estimate
  onDelete?: (id: string) => void
  onCreateContract?: (id: string) => void
  onCreateInvoice?: (id: string) => void
  onCreateProject?: (id: string) => void
  onEdit?: (estimate: Estimate) => void
}

export function EstimateCard({ estimate, onDelete, onCreateContract, onCreateInvoice, onCreateProject, onEdit }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { data: clients = [] } = useClients()
  const { user } = useAuth()
  const client = clients.find((item) => item.id === estimate.client_id)
  const tabs = useMemo(() => [{ key: 'pdf', label: 'Podgląd PDF', type: 'html' as const, content: buildEstimatePreview(estimate, client ? { name: client.name, address: client.address, postalCity: `${client.postal_code || ''} ${client.city || ''}`.trim(), nip: client.nip, email: client.email, phone: client.phone } : undefined, { name: user?.companyName, email: user?.email }) }], [client, estimate, user?.companyName, user?.email])
  const ready = estimate.status === 'accepted'
  const statusMeta = STATUS_META[estimate.status] ?? { label: estimate.status, tone: 'default' }

  return (
    <>
      <div className="ecard">
        <div className="ecard__head">
          <div className="ecard__title">{estimate.name || estimate.number}</div>
          <Badge variant={variant(estimate.status)}>{statusMeta.label}</Badge>
        </div>
        <div className="ecard__client">
          {client ? `${client.name} · ${client.address || ''}`.replace(/ · $/, '') : 'Brak kontrahenta'}
        </div>
        <div className="ecard__amount">{formatCurrency(estimate.total_gross)}</div>
        <div className="ecard__actions">
          {ready && onCreateContract ? <Button size="sm" onClick={() => onCreateContract(estimate.id)}>Zrób umowę</Button> : null}
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>PDF</Button>
          {onEdit ? <Button variant="ghost" size="sm" onClick={() => onEdit(estimate)}>Edytuj</Button> : null}
          {ready && onCreateInvoice ? <Button variant="ghost" size="sm" onClick={() => onCreateInvoice(estimate.id)}>Faktura</Button> : null}
          {onDelete ? <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={() => onDelete(estimate.id)}>Usuń</Button> : null}
        </div>
      </div>
      <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${estimate.number} · Podgląd dokumentu`} tabs={tabs} />
    </>
  )
}
