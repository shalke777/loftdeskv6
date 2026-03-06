import { useMemo, useState } from 'react'
import type { Invoice } from '@/entities/invoice/model'
import { Card } from '@/shared/ui/Card/Card'
import { Badge } from '@/shared/ui/Badge/Badge'
import { formatCurrency } from '@/shared/lib/formatters'
import { Button } from '@/shared/ui/Button/Button'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { DocumentPreviewModal } from '@/shared/ui/DocumentPreview/DocumentPreviewModal'
import { buildInvoicePreview, buildInvoiceXml } from '@/services/pdf/documentPreview'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function InvoiceDetail({ invoice, onMarkPaid, onSendToKsef, onEdit, canMarkPaid = true, canSendToKsef = true }: { invoice: Invoice | null; onMarkPaid: (id: string) => void; onSendToKsef: (id: string) => void; onEdit?: (invoice: Invoice) => void; canMarkPaid?: boolean; canSendToKsef?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const { data: clients = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const { user } = useAuth()
  if (!invoice) return null

  const client = clients.find((item) => item.id === invoice.client_id)
  const project = projects.find((item) => item.id === invoice.project_id)
  const clientMeta = client ? { name: client.name, address: client.address, postalCity: `${client.postal_code || ''} ${client.city || ''}`.trim(), nip: client.nip, email: client.email, phone: client.phone } : undefined
  const companyMeta = { name: user?.companyName, email: user?.email }

  const tabs = useMemo(
    () => ([
      { key: 'pdf', label: 'Podgląd PDF', type: 'html' as const, content: buildInvoicePreview(invoice, clientMeta, project?.name, companyMeta) },
      { key: 'xml', label: 'Podgląd XML', type: 'xml' as const, content: buildInvoiceXml(invoice) },
    ]),
    [clientMeta, companyMeta, invoice, project?.name],
  )

  return (
    <>
      <Card>
        <div className="toolbar">
          <div>
            <h3>{invoice.number}</h3>
            <p>{client?.name || 'Bez klienta'} {project ? `· ${project.name}` : ''}</p>
          </div>
          <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'danger' : 'warning'}>{invoice.status}</Badge>
        </div>
        <p>Data wystawienia: {invoice.issue_date}</p>
        <p>Termin płatności: {invoice.due_date || 'brak'}</p>
        <p>Łącznie netto: {formatCurrency(invoice.total_net)}</p>
        <p>Łącznie brutto: {formatCurrency(invoice.total_gross)}</p>
        <h4>Pozycje</h4>
        <ul>{invoice.items.map((item) => <li key={item.id}>{item.description} · {item.quantity} {item.unit} · {formatCurrency(item.unit_price)} · VAT {item.vat_rate}% {item.tranche_label ? `· ${item.tranche_label}` : ''}</li>)}</ul>
        <div className="actions-row preview-links">
          <Button variant="ghost" onClick={() => setPreviewOpen(true)}>PDF / XML</Button>
          {onEdit && invoice.ksef_status !== 'ksef_sent' ? <Button variant="secondary" onClick={() => onEdit(invoice)}>Edytuj</Button> : null}
          {invoice.status !== 'paid' && canMarkPaid ? <Button variant="secondary" onClick={() => onMarkPaid(invoice.id)}>Oznacz jako opłaconą</Button> : null}
          {invoice.ksef_status !== 'ksef_sent' && canSendToKsef ? <Button onClick={() => onSendToKsef(invoice.id)}>Wyślij do KSeF</Button> : null}
        </div>
      </Card>
      <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${invoice.number} · Podgląd dokumentu`} tabs={tabs} />
    </>
  )
}
