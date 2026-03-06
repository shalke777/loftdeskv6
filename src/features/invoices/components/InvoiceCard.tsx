import { useMemo, useState } from 'react'
import { Invoice } from '@/entities/invoice/model'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'
import { DocumentPreviewModal } from '@/shared/ui/DocumentPreview/DocumentPreviewModal'
import { buildInvoicePreview, buildInvoiceXml } from '@/services/pdf/documentPreview'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useAuth } from '@/features/auth/hooks/useAuth'

const STATUS_LABEL: Record<string, string> = { draft: 'Szkic', sent: 'Wysłana', paid: 'Opłacona', overdue: 'Po terminie', cancelled: 'Anulowana' }
function statusVariant(status: Invoice['status']) { if (status === 'paid') return 'success'; if (status === 'overdue') return 'danger'; return 'warning' }

export function InvoiceCard({ invoice, onDelete, onMarkPaid, onOpen, onEdit, canDelete = true, canMarkPaid = true }: { invoice: Invoice; onDelete: (id: string) => void; onMarkPaid: (id: string) => void; onOpen: (invoice: Invoice) => void; onEdit?: (invoice: Invoice) => void; canDelete?: boolean; canMarkPaid?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { data: clients = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const { user } = useAuth()
  const client = clients.find((item) => item.id === invoice.client_id)
  const project = projects.find((item) => item.id === invoice.project_id)
  const tabs = useMemo(() => ([
    { key: 'pdf', label: 'Podgląd PDF', type: 'html' as const, content: buildInvoicePreview(invoice, client ? { name: client.name, address: client.address, postalCity: `${client.postal_code || ''} ${client.city || ''}`.trim(), nip: client.nip, email: client.email, phone: client.phone } : undefined, project?.name, { name: user?.companyName, email: user?.email }) },
    { key: 'xml', label: 'Podgląd XML', type: 'xml' as const, content: buildInvoiceXml(invoice) },
  ]), [client, invoice, project?.name, user?.companyName, user?.email])

  return <><div className="ecard" onClick={() => onOpen(invoice)} style={{ cursor: 'pointer' }}>
    <div className="ecard__head"><span className="ecard__title">{invoice.number}</span><Badge variant={statusVariant(invoice.status)}>{STATUS_LABEL[invoice.status] || invoice.status}</Badge></div>
    {client ? <p className="ecard__client">{client.name}</p> : null}
    <p className="ecard__client">Termin: {invoice.due_date || 'brak'}{invoice.ksef_status ? ` · KSeF: ${invoice.ksef_status}` : ''}</p>
    <p className="ecard__amount">{formatCurrency(invoice.total_gross)}</p>
    <div className="ecard__actions" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(true)}>PDF</Button>
      {onEdit && invoice.ksef_status !== 'ksef_sent' ? <Button size="sm" variant="ghost" onClick={() => onEdit(invoice)}>Edytuj</Button> : null}
      {invoice.status !== 'paid' && canMarkPaid ? <Button size="sm" variant="secondary" onClick={() => onMarkPaid(invoice.id)}>Opłacona</Button> : null}
      {canDelete ? <Button size="sm" variant="danger" onClick={() => onDelete(invoice.id)}>Usuń</Button> : null}
    </div>
  </div><DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${invoice.number} · Podgląd dokumentu`} tabs={tabs} /></>
}
