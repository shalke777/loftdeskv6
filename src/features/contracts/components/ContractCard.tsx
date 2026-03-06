import { useMemo, useState } from 'react'
import { Contract } from '@/entities/contract/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'
import { DocumentPreviewModal } from '@/shared/ui/DocumentPreview/DocumentPreviewModal'
import { buildContractPreview } from '@/services/pdf/documentPreview'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useAuth } from '@/features/auth/hooks/useAuth'

const STATUS_LABEL: Record<string, string> = { draft: 'Szkic', sent: 'Wysłana', signed: 'Podpisana', cancelled: 'Anulowana' }

export function ContractCard({ contract, onDelete, onOpen, onEdit, canDelete = true }: { contract: Contract; onDelete: (id: string) => void; onOpen: (contract: Contract) => void; onEdit?: (contract: Contract) => void; canDelete?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { data: clients = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const { user } = useAuth()
  const client = clients.find((item) => item.id === contract.client_id)
  const project = projects.find((item) => item.id === contract.project_id)
  const tabs = useMemo(() => [{ key: 'pdf', label: 'Podgląd PDF', type: 'html' as const, content: buildContractPreview(contract, client?.name, project?.name, { name: user?.companyName, email: user?.email }) }], [client?.name, contract, project?.name, user?.companyName, user?.email])
  return <><div className="ecard" onClick={() => onOpen(contract)} style={{ cursor: 'pointer' }}>
    <div className="ecard__head"><span className="ecard__title">{contract.number}</span><Badge variant={contract.status === 'signed' ? 'success' : 'warning'}>{STATUS_LABEL[contract.status] || contract.status}</Badge></div>
    {client ? <p className="ecard__client">{client.name}</p> : null}
    <p className="ecard__client">Podpisano: {contract.sign_date || 'brak'} · Transze: {contract.tranches?.length || 0}</p>
    <p className="ecard__amount">{formatCurrency(contract.value)}</p>
    <div className="ecard__actions" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(true)}>PDF</Button>
      {onEdit ? <Button size="sm" variant="ghost" onClick={() => onEdit(contract)}>Edytuj</Button> : null}
      {canDelete ? <Button size="sm" variant="danger" onClick={() => onDelete(contract.id)}>Usuń</Button> : null}
    </div>
  </div><DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${contract.number} · Podgląd dokumentu`} tabs={tabs} /></>
}
