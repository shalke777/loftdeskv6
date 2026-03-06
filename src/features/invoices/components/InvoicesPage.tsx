import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState'
import { Modal } from '@/shared/ui/Modal/Modal'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { useCreateInvoice, useDeleteInvoice, useInvoices, useMarkInvoicePaid, useSendInvoiceToKsef, useUpdateInvoice } from '@/features/invoices/hooks/useInvoices'
import { InvoiceCard } from '@/features/invoices/components/InvoiceCard'
import { InvoiceForm } from '@/features/invoices/components/InvoiceModal/InvoiceForm'
import { InvoiceDetail } from '@/features/invoices/components/InvoiceDetail'
import type { Invoice } from '@/entities/invoice/model'
import { useCan } from '@/features/auth/hooks/usePermissions'

export function InvoicesPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const companyId = useCompanyId()
  const { data, isLoading } = useInvoices()
  const createInvoice = useCreateInvoice(); const updateInvoice = useUpdateInvoice(); const deleteInvoice = useDeleteInvoice(); const markPaid = useMarkInvoicePaid(); const sendToKsef = useSendInvoiceToKsef()
  const summary = useMemo(() => ({ paid: data?.filter((item) => item.status === 'paid').length ?? 0, unpaid: data?.filter((item) => item.status !== 'paid').length ?? 0 }), [data])
  const canCreate = useCan('invoices.create'); const canDelete = useCan('invoices.delete'); const canMarkPaid = useCan('invoices.markPaid'); const canSendToKsef = useCan('invoices.sendToKsef')
  async function submit(input: any) { if (editing) await updateInvoice.mutateAsync({ id: editing.id, input }); else await createInvoice.mutateAsync(input); setEditing(null); setOpen(false) }

  return (
    <div className="page-list">
      <header className="page-list__head">
        <h1 className="page-list__title">Faktury</h1>
        <p className="page-list__sub">{summary.paid} opłaconych · {summary.unpaid} otwartych</p>
      </header>
      {selected ? <InvoiceDetail invoice={selected} onEdit={(item) => { setEditing(item); setOpen(true) }} onMarkPaid={(id) => { markPaid.mutate(id); setSelected((prev) => prev && prev.id === id ? { ...prev, status: 'paid' } : prev) }} onSendToKsef={(id) => sendToKsef.mutate(id)} canMarkPaid={canMarkPaid} canSendToKsef={canSendToKsef} /> : null}
      {isLoading ? <Spinner /> : null}
      {!isLoading && !data?.length ? <EmptyState title="Brak faktur" description="Dodaj pierwszą fakturę klikając +" /> : null}
      <div className="page-list__cards">{data?.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} onOpen={setSelected} onEdit={(item) => { setEditing(item); setOpen(true) }} onDelete={(id) => deleteInvoice.mutate(id)} onMarkPaid={(id) => markPaid.mutate(id)} canDelete={canDelete} canMarkPaid={canMarkPaid} />)}</div>
      {canCreate ? <button className="fab" onClick={() => { setEditing(null); setOpen(true) }} aria-label="Nowa faktura"><Plus size={22} /></button> : null}
      {canCreate ? <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edytuj fakturę' : 'Nowa faktura'}><InvoiceForm companyId={companyId} initialInvoice={editing} onSubmit={submit} /></Modal> : null}
    </div>
  )
}
