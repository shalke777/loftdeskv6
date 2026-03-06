
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Copy } from 'lucide-react'
import { Input } from '@/shared/ui/Input/Input'
import { Select } from '@/shared/ui/Select/Select'
import type { EstimateItem } from '@/entities/estimate/model'

const VAT_OPTIONS = [
  { value: '0', label: '0% (zw.)' },
  { value: '3', label: '3%' },
  { value: '5.5', label: '5,5%' },
  { value: '8', label: '8%' },
  { value: '12', label: '12%' },
  { value: '23', label: '23%' },
]

// Wbudowany cennik (można rozbudować)
const CENNIK = [
  { name: 'Układanie płytek 60x60', unit: 'm²', unit_price: 120, vat_rate: 8 },
  { name: 'Malowanie ścian', unit: 'm²', unit_price: 18, vat_rate: 8 },
  { name: 'Tynkowanie ścian', unit: 'm²', unit_price: 35, vat_rate: 8 },
  { name: 'Montaż kabiny prysznicowej', unit: 'szt', unit_price: 350, vat_rate: 23 },
  { name: 'Instalacja elektryczna', unit: 'pkt', unit_price: 90, vat_rate: 23 },
  { name: 'Instalacja hydrauliczna', unit: 'pkt', unit_price: 110, vat_rate: 23 },
  { name: 'Posadzka cementowa', unit: 'm²', unit_price: 55, vat_rate: 8 },
  { name: 'Sufit podwieszany', unit: 'm²', unit_price: 65, vat_rate: 8 },
  { name: 'Drzwi z montażem', unit: 'szt', unit_price: 450, vat_rate: 23 },
  { name: 'Okno z montażem', unit: 'szt', unit_price: 650, vat_rate: 23 },
  { name: 'Transport materiałów', unit: 'usł', unit_price: 120, vat_rate: 23 },
  { name: 'Robocizna', unit: 'r-g', unit_price: 60, vat_rate: 23 },
  { name: 'Materiały', unit: 'kpl', unit_price: 1, vat_rate: 23 },
]


function calcGross(item: EstimateItem) {
  return item.quantity * item.unit_price * (1 + item.vat_rate / 100)
}


interface ItemRowProps {
  item: EstimateItem
  onChange: (id: string, key: keyof EstimateItem, value: string) => void
  onRemove: (id: string) => void
  onCopy: (item: EstimateItem) => void
}

function ItemRow({ item, onChange, onRemove, onCopy }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false)
  const net = item.quantity * item.unit_price
  const gross = calcGross(item)

  return (
    <div className="item-row">
      <div className="item-row__head" onClick={() => setExpanded((p) => !p)}>
        <div>
          <div className="item-row__name">{item.name || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {item.quantity} {item.unit} × {item.unit_price.toFixed(2)} zł netto
          </div>
        </div>
        <div className="item-row__price">
          <div>{net.toFixed(2)} zł <span style={{ fontSize: 11, opacity: 0.7 }}>netto</span></div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{gross.toFixed(2)} zł brutto</div>
        </div>
        <button className="item-row__expand" aria-label="rozwiń">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button className="item-row__expand" aria-label="kopiuj" style={{ marginLeft: 8 }} onClick={e => { e.stopPropagation(); onCopy(item) }}>
          <Copy size={15} />
        </button>
      </div>

      {expanded && (
        <div className="item-row__body">
          <Input
            label="Nazwa pozycji"
            value={item.name}
            onChange={(e) => onChange(item.id, 'name', e.target.value)}
          />
          <Input
            label="Opis (opcjonalnie)"
            value={item.description || ''}
            onChange={(e) => onChange(item.id, 'description', e.target.value)}
          />
          <div className="grid-2">
            <Input
              label="Cena netto (zł)"
              type="number"
              inputMode="decimal"
              value={String(item.unit_price)}
              onChange={(e) => onChange(item.id, 'unit_price', e.target.value)}
            />
            <Input
              label="Ilość"
              type="number"
              inputMode="numeric"
              value={String(item.quantity)}
              onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
            />
            <Input
              label="Jednostka"
              value={item.unit}
              onChange={(e) => onChange(item.id, 'unit', e.target.value)}
            />
            <Select
              label="Stawka VAT"
              value={String(item.vat_rate)}
              onChange={(e) => onChange(item.id, 'vat_rate', e.target.value)}
              options={VAT_OPTIONS}
              placeholder="VAT"
            />
          </div>
          <button className="item-row__remove" onClick={() => onRemove(item.id)}>
            <Trash2 size={14} /> Usuń pozycję
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  items: EstimateItem[]
  onChange: (items: EstimateItem[]) => void
}


export function ItemsEditor({ items, onChange }: Props) {
  // Cennik search
  const [cennikQuery, setCennikQuery] = useState('')
  const filteredCennik = CENNIK.filter((item) =>
    item.name.toLowerCase().includes(cennikQuery.toLowerCase())
  )

  function patch(id: string, key: keyof EstimateItem, value: string) {
    onChange(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: ['quantity', 'unit_price', 'vat_rate', 'sort_order'].includes(String(key))
                ? Number(value)
                : value,
            }
          : item,
      ),
    )
  }

  function removeRow(id: string) {
    onChange(items.filter((item) => item.id !== id).map((item, i) => ({ ...item, sort_order: i + 1 })))
  }

  function addFromCennik(cennikItem: typeof CENNIK[number]) {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        name: cennikItem.name,
        description: '',
        unit: cennikItem.unit,
        quantity: 1,
        unit_price: cennikItem.unit_price,
        vat_rate: cennikItem.vat_rate,
        sort_order: items.length + 1,
      },
    ])
  }

  function copyRow(item: EstimateItem) {
    onChange([
      ...items,
      {
        ...item,
        id: crypto.randomUUID(),
        sort_order: items.length + 1,
      },
    ])
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="quick-add">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Plus size={16} color="var(--color-brand)" />
          <strong style={{ fontSize: 14 }}>Dodaj z cennika</strong>
        </div>
        <Input
          label="Szukaj w cenniku"
          placeholder="np. płytki, malowanie, drzwi..."
          value={cennikQuery}
          onChange={e => setCennikQuery(e.target.value)}
        />
        <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 4, border: '1px solid var(--color-border-light)', borderRadius: 8, background: 'var(--color-surface)', boxShadow: 'var(--shadow-xs)' }}>
          {filteredCennik.length === 0 && <div style={{ padding: 10, color: 'var(--color-text-tertiary)', fontSize: 13 }}>Brak wyników</div>}
          {filteredCennik.map((item) => (
            <button
              key={item.name}
              style={{ display: 'flex', alignItems: 'center', width: '100%', border: 'none', background: 'none', padding: '8px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--color-border-light)' }}
              onClick={() => addFromCennik(item)}
            >
              <span style={{ flex: 1 }}>{item.name}</span>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8 }}>{item.unit_price} zł/{item.unit}</span>
              <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 8 }}>{item.vat_rate}%</span>
            </button>
          ))}
        </div>
        <div className="quick-add__hint">Kliknij pozycję, by dodać do kosztorysu. Możesz zmienić cenę/netto po dodaniu.</div>
      </div>

      {items.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 600, paddingLeft: 4 }}>
            {items.length} {items.length === 1 ? 'pozycja' : items.length < 5 ? 'pozycje' : 'pozycji'} · kliknij żeby edytować, kopiuj lub usuń
          </div>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onChange={patch} onRemove={removeRow} onCopy={copyRow} />
          ))}
        </div>
      )}
    </div>
  )
}

