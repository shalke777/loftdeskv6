import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/shared/ui/Input/Input'
import { Button } from '@/shared/ui/Button/Button'
import { Select } from '@/shared/ui/Select/Select'
import type { CreateInvoiceInput, Invoice, InvoiceItem } from '@/entities/invoice/model'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useContracts } from '@/features/contracts/hooks/useContracts'
import { calcInvoiceTotals } from '@/features/invoices/lib/invoice.calculations'

const VAT_OPTIONS = [
  { value: '0', label: '0% (zw.)' },
  { value: '3', label: '3%' },
  { value: '5.5', label: '5,5%' },
  { value: '8', label: '8%' },
  { value: '12', label: '12%' },
  { value: '23', label: '23%' },
]

interface Props { companyId: string; onSubmit: (input: CreateInvoiceInput) => Promise<void>; initialInvoice?: Invoice | null }

export function InvoiceForm({ companyId, onSubmit, initialInvoice }: Props) {
  const [dueDate, setDueDate] = useState('')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [contractId, setContractId] = useState('')
  const [selectedTrancheId, setSelectedTrancheId] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [notes, setNotes] = useState('')
  const { data: clients = [] } = useClients(); const { data: projects = [] } = useProjects(); const { data: contracts = [] } = useContracts()
  const clientOptions = useMemo(() => clients.map((client) => ({ value: client.id, label: client.name })), [clients])
  const projectOptions = useMemo(() => projects.map((project) => ({ value: project.id, label: `${project.number} · ${project.name}` })), [projects])
  const contractOptions = useMemo(() => contracts.map((contract) => ({ value: contract.id, label: `${contract.number} · ${contract.value.toFixed(2)} zł` })), [contracts])
  const selectedContract = useMemo(() => contracts.find((item) => item.id === contractId) || null, [contracts, contractId])
  const trancheOptions = useMemo(() => (selectedContract?.tranches ?? []).map((item) => ({ value: item.id, label: `${item.label} · ${item.amount.toFixed(2)} zł` })), [selectedContract])
  const totals = useMemo(() => calcInvoiceTotals(items), [items])

  useEffect(() => {
    setDueDate(initialInvoice?.due_date || '')
    setClientId(initialInvoice?.client_id || '')
    setProjectId(initialInvoice?.project_id || '')
    setContractId(initialInvoice?.contract_id || '')
    setSelectedTrancheId('')
    setItems(initialInvoice?.items?.length ? initialInvoice.items : [{ id: crypto.randomUUID(), description: 'Usługa', unit: 'kpl', quantity: 1, unit_price: 0, vat_rate: 23, sort_order: 1, tranche_label: '' }])
    setNotes(initialInvoice?.notes || '')
  }, [initialInvoice])

  function patchItem(id: string, key: keyof InvoiceItem, value: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [key]: ['quantity','unit_price','vat_rate','sort_order'].includes(String(key)) ? Number(value) : value } : item))
  }
  function addItem() { setItems((prev) => [...prev, { id: crypto.randomUUID(), description: 'Nowa pozycja', unit: 'kpl', quantity: 1, unit_price: 0, vat_rate: 23, sort_order: prev.length + 1, tranche_label: '' }]) }
  function removeItem(id: string) { setItems((prev) => prev.filter((item) => item.id !== id).map((item, index) => ({ ...item, sort_order: index + 1 }))) }
  function applyTranche(trancheId: string) {
    setSelectedTrancheId(trancheId)
    const tranche = selectedContract?.tranches?.find((item) => item.id === trancheId)
    if (!tranche) return
    const vatRate = 23
    const netAmount = Math.round((tranche.amount / (1 + vatRate / 100)) * 100) / 100
    setItems([{ id: crypto.randomUUID(), description: `${selectedContract?.number} · ${tranche.label}`, unit: 'transza', quantity: 1, unit_price: netAmount, vat_rate: vatRate, sort_order: 1, tranche_label: tranche.label }])
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-2">
        <Input label="Termin płatności" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <Select label="Klient" value={clientId} onChange={(e) => setClientId(e.target.value)} options={clientOptions} placeholder="Bez przypisania" />
        <Select label="Projekt" value={projectId} onChange={(e) => setProjectId(e.target.value)} options={projectOptions} placeholder="Bez przypisania" />
        <Select label="Umowa" value={contractId} onChange={(e) => setContractId(e.target.value)} options={contractOptions} placeholder="Bez umowy" />
        {selectedContract?.tranches?.length ? <Select label="Transza / rata z umowy" value={selectedTrancheId} onChange={(e) => applyTranche(e.target.value)} options={trancheOptions} placeholder="Wybierz transzę" /> : null}
        <Input label="Uwagi" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => <div key={item.id} className="card" style={{ display: 'grid', gap: 12 }}><div className="grid-2"><Input label="Opis pozycji" value={item.description} onChange={(e) => patchItem(item.id, 'description', e.target.value)} /><Input label="Jednostka" value={item.unit} onChange={(e) => patchItem(item.id, 'unit', e.target.value)} /><Input label="Ilość" type="number" value={String(item.quantity)} onChange={(e) => patchItem(item.id, 'quantity', e.target.value)} /><Input label="Cena netto" type="number" value={String(item.unit_price)} onChange={(e) => patchItem(item.id, 'unit_price', e.target.value)} /><Select label="Stawka VAT" value={String(item.vat_rate)} onChange={(e) => patchItem(item.id, 'vat_rate', e.target.value)} options={VAT_OPTIONS} placeholder="VAT" /><Input label="Etykieta transzy" value={item.tranche_label || ''} onChange={(e) => patchItem(item.id, 'tranche_label', e.target.value)} /></div><div className="actions-row"><Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>Usuń pozycję</Button></div></div>)}
      </div>
      <div className="actions-row"><Button variant="secondary" onClick={addItem}>Dodaj pozycję</Button></div>
      <div className="card"><strong>Rozbicie</strong><div>Netto: {totals.totalNet.toFixed(2)} zł · Brutto: {totals.totalGross.toFixed(2)} zł</div></div>
      <div className="actions-row"><Button onClick={() => onSubmit({ company_id: companyId, client_id: clientId || null, project_id: projectId || null, contract_id: contractId || null, status: 'unpaid', notes, issue_date: new Date().toISOString().slice(0, 10), due_date: dueDate || null, items })}>{initialInvoice ? 'Zapisz zmiany' : 'Zapisz fakturę'}</Button></div>
    </div>
  )
}
