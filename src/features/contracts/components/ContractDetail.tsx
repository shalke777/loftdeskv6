import { useMemo, useState } from 'react'
import type { Contract } from '@/entities/contract/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { Card } from '@/shared/ui/Card/Card'
import { formatCurrency } from '@/shared/lib/formatters'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useEstimates } from '@/features/estimates/hooks/useEstimates'
import { DocumentPreviewModal } from '@/shared/ui/DocumentPreview/DocumentPreviewModal'
import { buildContractPreview } from '@/services/pdf/documentPreview'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function ContractDetail({ contract, onSign, onEdit, canSign = true }: { contract: Contract | null; onSign: (id: string) => void; onEdit?: (contract: Contract) => void; canSign?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { data: clients = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const { data: estimates = [] } = useEstimates()
  const { user } = useAuth()
  if (!contract) return null
  const client = clients.find((item) => item.id === contract.client_id)
  const project = projects.find((item) => item.id === contract.project_id)
  const estimate = estimates.find((item) => item.id === contract.estimate_id)
  const tabs = useMemo(() => [{ key: 'pdf', label: 'Podgląd PDF', type: 'html' as const, content: buildContractPreview(contract, client?.name, project?.name, { name: user?.companyName, email: user?.email }) }], [client?.name, contract, project?.name, user?.companyName, user?.email])
  return (
    <>
      <Card>
        <div className="toolbar"><div><h3>{contract.number}</h3><p>{client?.name || 'Bez kontrahenta'} {project ? `· ${project.name}` : ''}</p></div><Badge variant={contract.status === 'signed' ? 'success' : 'warning'}>{contract.status}</Badge></div>
        <p>Powiązana wycena: {estimate?.number || 'brak'}</p>
        <p>Data podpisania: {contract.sign_date || 'Jeszcze nie podpisano'}</p>
        <p>Kwota: {formatCurrency(contract.value)}</p>
        <p>Wzór: {contract.template_name || 'Umowa standardowa'}</p>
        <p>{contract.notes || 'Brak dodatkowych ustaleń.'}</p>
        <div className="actions-row preview-links"><Button variant="ghost" onClick={() => setPreviewOpen(true)}>PDF</Button>{onEdit ? <Button variant="secondary" onClick={() => onEdit(contract)}>Edytuj</Button> : null}{contract.status !== 'signed' && canSign ? <Button onClick={() => onSign(contract.id)}>Oznacz jako podpisaną</Button> : null}</div>
      </Card>
      <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${contract.number} · Podgląd dokumentu`} tabs={tabs} />
    </>
  )
}
