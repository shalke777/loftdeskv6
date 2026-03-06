import { useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { Input } from '@/shared/ui/Input/Input'
import { Select } from '@/shared/ui/Select/Select'
import { useClients } from '@/features/clients/hooks/useClients'
import { ItemsEditor } from '@/features/estimates/components/EstimateModal/ItemsEditor'
import type { Estimate, EstimateItem } from '@/entities/estimate/model'
import { calcTotals } from '@/features/estimates/lib/estimate.calculations'
import { shareDoc } from '@/shared/utils/share'

interface Props {
  onSubmit: (input: {
    name: string
    client_id: string | null
    notes?: string
    company_id: string
    status?: Estimate['status']
    valid_until?: string | null
    items?: EstimateItem[]
  }) => void | Promise<void>
  companyId: string
  initialEstimate?: Estimate | null
}

export function EstimateForm({ onSubmit, companyId, initialEstimate }: Props) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState<Estimate['status']>('draft')
  const [validUntil, setValidUntil] = useState('')
  const [items, setItems] = useState<EstimateItem[]>([])
  const [saving, setSaving] = useState(false)

  const { data: clients = [] } = useClients()
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )
  const totals = useMemo(() => calcTotals(items), [items])
  const selectedClient = clients.find((c) => c.id === clientId)

  useEffect(() => {
    setName(initialEstimate?.name || '')
    setNotes(initialEstimate?.notes || '')
    setClientId(initialEstimate?.client_id || '')
    setStatus(initialEstimate?.status || 'draft')
    setValidUntil(initialEstimate?.valid_until?.slice(0, 10) || '')
    setItems(
      initialEstimate?.items?.length
        ? initialEstimate.items
        : [{
            id: crypto.randomUUID(), name: '', description: '',
            unit: 'kpl', quantity: 1, unit_price: 0, vat_rate: 23, sort_order: 1,
          }],
    )
  }, [initialEstimate, companyId])

  async function save(nextStatus?: Estimate['status']) {
    setSaving(true)
    try {
      await onSubmit({
        name: name || 'Kosztorys',
        notes,
        client_id: clientId || null,
        company_id: companyId,
        status: nextStatus ?? status,
        valid_until: validUntil || null,
        items,
      })
    } finally {
      setSaving(false)
    }
  }

  async function saveAndSend() {
    await save('sent')
    const clientEmail = selectedClient?.email || undefined
    const itemLines = items.map((it) => `• ${it.name} — ${(it.quantity * it.unit_price).toFixed(2)} zł netto`).join('\n')
    await shareDoc({
      title: `Wycena: ${name || 'Kosztorys'}`,
      text: `Dzień dobry,\n\nPrzesyłam wycenę:\n${itemLines}\n\nRazem netto: ${totals.net.toFixed(2)} zł\nRazem brutto: ${totals.gross.toFixed(2)} zł\n\nW razie pytań — proszę o kontakt.`,
      email: clientEmail,
    })
  }

  return (
    <div style={{ display: 'grid', gap: 16, paddingBottom: 80 }}>
      {/* Klient i podstawowe dane */}
      <div className="grid-2" style={{ gap: 12 }}>
        <Select
          label="Klient (opcjonalnie)"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={clientOptions}
          placeholder="Bez przypisania"
        />
        <Input
          label="Nazwa wyceny"
          placeholder="np. Remont kuchni Kowalski"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Ważna do (opcjonalnie)"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus((e.target.value || 'draft') as Estimate['status'])}
          options={[
            { value: 'draft', label: 'Szkic' },
            { value: 'sent', label: 'Wysłana' },
            { value: 'accepted', label: 'Zaakceptowana' },
            { value: 'rejected', label: 'Odrzucona' },
          ]}
        />
      </div>

      {/* Pozycje kosztorysu */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Pozycje kosztorysu
        </div>
        <ItemsEditor items={items} onChange={setItems} />
      </div>

      {/* Uwagi */}
      <label className="field">
        <span className="field__label">Uwagi do wyceny (opcjonalnie)</span>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Np. dotyczy materiałów, terminu, warunków realizacji."
        />
      </label>

      {/* Sticky summary */}
      <div className="sticky-summary">
        <div className="sticky-summary__totals">
          <div className="sticky-summary__item">
            <span>Netto</span>
            <strong style={{ color: 'var(--color-brand)', fontSize: 22 }}>{totals.net.toFixed(2)} zł</strong>
          </div>
          <div className="sticky-summary__item">
            <span>VAT</span>
            <strong>{(totals.gross - totals.net).toFixed(2)} zł</strong>
          </div>
          <div className="sticky-summary__item">
            <span>Brutto</span>
            <strong>{totals.gross.toFixed(2)} zł</strong>
          </div>
        </div>
        <div className="sticky-summary__actions">
          <Button variant="secondary" onClick={() => save()} disabled={saving}>
            {initialEstimate ? 'Zapisz' : 'Zapisz szkic'}
          </Button>
          <Button
            onClick={saveAndSend}
            disabled={saving}
            icon={<Send size={15} />}
          >
            {saving ? 'Wysyłam…' : 'Wyślij klientowi'}
          </Button>
        </div>
      </div>
    </div>
  )
}

