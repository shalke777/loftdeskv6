import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/shared/ui/Input/Input'
import { Button } from '@/shared/ui/Button/Button'
import { Select } from '@/shared/ui/Select/Select'
import type { Contract, ContractTranche, CreateContractInput } from '@/entities/contract/model'
import { useClients } from '@/features/clients/hooks/useClients'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { useEstimates } from '@/features/estimates/hooks/useEstimates'

const TEMPLATE_OPTIONS = [
  { value: 'Umowa standardowa', label: 'Umowa standardowa (2 transze)' },
  { value: 'Umowa z etapami płatności', label: 'Z etapami (3 transze)' },
  { value: 'Umowa skrócona', label: 'Skrócona (całość od razu)' },
]

function makeDefaultTranches(total: number, variant: string): ContractTranche[] {
  if (variant === 'Umowa skrócona') {
    return [{ id: crypto.randomUUID(), label: 'Całość', amount: total, due_date: '', status: 'planned' }]
  }
  if (variant === 'Umowa z etapami płatności') {
    const deposit = Math.round(total * 0.3 * 100) / 100
    const stage = Math.round(total * 0.4 * 100) / 100
    const end = Math.round((total - deposit - stage) * 100) / 100
    return [
      { id: crypto.randomUUID(), label: 'Zaliczka (30%)', amount: deposit, due_date: '', status: 'planned' },
      { id: crypto.randomUUID(), label: 'Etap prac (40%)', amount: stage, due_date: '', status: 'planned' },
      { id: crypto.randomUUID(), label: 'Rozliczenie końcowe (30%)', amount: end, due_date: '', status: 'planned' },
    ]
  }
  return [
    { id: crypto.randomUUID(), label: 'Zaliczka (40%)', amount: Math.round(total * 0.4 * 100) / 100, due_date: '', status: 'planned' },
    { id: crypto.randomUUID(), label: 'Rozliczenie końcowe (60%)', amount: Math.round(total * 0.6 * 100) / 100, due_date: '', status: 'planned' },
  ]
}

interface Props {
  companyId: string
  onSubmit: (input: CreateContractInput) => Promise<void>
  initialContract?: Contract | null
}

export function ContractForm({ companyId, onSubmit, initialContract }: Props) {
  const [value, setValue] = useState('30000')
  const [notes, setNotes] = useState('')
  const [reserved, setReserved] = useState('')
  const [signDate, setSignDate] = useState(new Date().toISOString().slice(0, 10))
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [estimateId, setEstimateId] = useState('')
  const [templateName, setTemplateName] = useState('Umowa standardowa')
  const [tranches, setTranches] = useState<ContractTranche[]>([])

  const { data: clients = [] } = useClients()
  const { data: projects = [] } = useProjects()
  const { data: estimates = [] } = useEstimates()

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients])
  const estimateOptions = useMemo(() => estimates.map((e) => ({ value: e.id, label: `${e.number} · ${e.name}` })), [estimates])
  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.id, label: `${p.number} · ${p.name}` })), [projects])

  const totalValue = Number(value || 0)
  const tranchesTotal = tranches.reduce((s, t) => s + Number(t.amount), 0)
  const trancheDiff = Math.abs(totalValue - tranchesTotal)

  useEffect(() => {
    const v = String(initialContract?.value ?? 30000)
    setValue(v)
    setNotes(initialContract?.notes || '')
    setReserved(initialContract?.reserved_notes || '')
    setSignDate(initialContract?.sign_date || new Date().toISOString().slice(0, 10))
    setClientId(initialContract?.client_id || '')
    setProjectId(initialContract?.project_id || '')
    setEstimateId(initialContract?.estimate_id || '')
    const tmpl = initialContract?.template_name || 'Umowa standardowa'
    setTemplateName(tmpl)
    setTranches(
      initialContract?.tranches?.length
        ? initialContract.tranches
        : makeDefaultTranches(Number(v), tmpl),
    )
  }, [initialContract])

  const applyEstimate = useCallback((nextId: string) => {
    setEstimateId(nextId)
    const est = estimates.find((e) => e.id === nextId)
    if (!est) return
    setClientId(est.client_id || '')
    const newVal = String(est.total_gross)
    setValue(newVal)
    if (!notes.trim()) setNotes(`Umowa przygotowana z wyceny ${est.number} — ${est.name}.`)
    setTranches(makeDefaultTranches(est.total_gross, templateName))
    const mp = projects.find(
      (p) => p.estimate_id === est.id || (p.client_id === est.client_id && p.name === est.name),
    )
    if (mp) setProjectId(mp.id)
  }, [estimates, notes, projects, templateName])

  const applyTemplate = useCallback((tmpl: string) => {
    setTemplateName(tmpl)
    setTranches(makeDefaultTranches(totalValue, tmpl))
  }, [totalValue])

  const patchTranche = useCallback((id: string, key: keyof ContractTranche, val: string) => {
    setTranches((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, [key]: key === 'amount' ? Number(val) : val } : t,
      ),
    )
  }, [])

  const addTranche = useCallback(() => {
    const remaining = Math.max(0, totalValue - tranchesTotal)
    setTranches((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: `Transza ${prev.length + 1}`, amount: remaining, due_date: '', status: 'planned' },
    ])
  }, [totalValue, tranchesTotal])

  const removeTranche = useCallback((id: string) => {
    setTranches((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Sekcja Wycena — kluczowy pre-fill */}
      <div style={{ background: 'var(--color-brand-light)', border: '1px solid var(--color-brand-border)', borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand)', marginBottom: 10 }}>
          1. Wybierz wycenę — wszystkie dane uzupełnią się automatycznie
        </div>
        <Select
          label="Wycena źródłowa"
          value={estimateId}
          onChange={(e) => applyEstimate(e.target.value)}
          options={estimateOptions}
          placeholder="Wybierz wycenę…"
        />
      </div>

      {/* Podstawowe dane */}
      <div className="grid-2" style={{ gap: 12 }}>
        <Input
          label="Kwota umowy (brutto, zł)"
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => { setValue(e.target.value); setTranches(makeDefaultTranches(Number(e.target.value), templateName)) }}
        />
        <Input
          label="Data podpisania"
          type="date"
          value={signDate}
          onChange={(e) => setSignDate(e.target.value)}
        />
        <Select
          label="Kontrahent"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={clientOptions}
          placeholder="Bez przypisania"
        />
        <Select
          label="Projekt (opcjonalnie)"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={projectOptions}
          placeholder="Bez przypisania"
        />
        <div style={{ gridColumn: 'span 2' }}>
          <Select
            label="Wzór umowy"
            value={templateName}
            onChange={(e) => applyTemplate(e.target.value || 'Umowa standardowa')}
            options={TEMPLATE_OPTIONS}
          />
        </div>
      </div>

      {/* Transze — wizualny edytor */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Terminy i transze płatności</div>
            {trancheDiff > 0.5 && (
              <div style={{ fontSize: 12, color: 'var(--color-warning)', marginTop: 4 }}>
                ⚠ Transze różnią się od kwoty umowy o {trancheDiff.toFixed(2)} zł
              </div>
            )}
          </div>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontWeight: 700, fontSize: 13 }}
            onClick={addTranche}
          >
            <Plus size={15} /> Dodaj transzę
          </button>
        </div>

        <div className="tranche-list">
          {tranches.map((t, i) => {
            const pct = totalValue > 0 ? Math.round((Number(t.amount) / totalValue) * 100) : 0
            return (
              <div key={t.id} className="tranche-row">
                <div className="tranche-row__header">
                  <Input
                    label={`Transza ${i + 1} — nazwa`}
                    value={t.label}
                    onChange={(e) => patchTranche(t.id, 'label', e.target.value)}
                  />
                  <div className="tranche-row__pct">{pct}%</div>
                  <button
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-error)', display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8 }}
                    onClick={() => removeTranche(t.id)}
                    title="Usuń transzę"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid-2" style={{ gap: 10 }}>
                  <Input
                    label="Kwota brutto (zł)"
                    type="number"
                    inputMode="decimal"
                    value={String(t.amount)}
                    onChange={(e) => patchTranche(t.id, 'amount', e.target.value)}
                  />
                  <Input
                    label="Termin płatności"
                    type="date"
                    value={t.due_date || ''}
                    onChange={(e) => patchTranche(t.id, 'due_date', e.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ustalenia i zastrzeżenia */}
      <label className="field">
        <span className="field__label">Dodatkowe ustalenia z klientem</span>
        <textarea
          className="input"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Np. materiały dostarcza klient, przerwy świąteczne, kolejność etapów…"
        />
      </label>

      <label className="field">
        <span className="field__label">Zastrzeżenia wykonawcy (opcjonalnie)</span>
        <textarea
          className="input"
          rows={3}
          value={reserved}
          onChange={(e) => setReserved(e.target.value)}
          placeholder="Np. brak odpowiedzialności za wilgoć, warunki odbioru, gwarancja…"
        />
      </label>

      <div className="actions-row">
        <Button onClick={() => onSubmit({
          company_id: companyId,
          client_id: clientId || null,
          project_id: projectId || null,
          estimate_id: estimateId || null,
          status: initialContract?.status || 'unsigned',
          sign_date: signDate,
          value: totalValue,
          notes: [notes, reserved].filter(Boolean).join('\n\n---\nZastrzeżenia wykonawcy:\n'),
          template_name: templateName,
          template_content: '',
          tranches,
        })}>
          {initialContract ? 'Zapisz zmiany' : 'Zapisz umowę'}
        </Button>
      </div>
    </div>
  )
}
