import { useState } from 'react'
import { Card } from '@/shared/ui/Card/Card'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Button } from '@/shared/ui/Button/Button'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { AccessNotice } from '@/shared/ui/AccessNotice/AccessNotice'
import { useKsefSent, useKsefIssued, useKsefReceived, useKsefUpo } from '@/features/ksef/hooks/useKsef'
import type { Invoice } from '@/entities/invoice/model'
import type { KsefReceivedInvoice, KsefUpo } from '@/features/ksef/api/ksef.api'

type Tab = 'received' | 'issued' | 'sent' | 'upo'

function fmt(n: number) { return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function TabBar({ active, onChange, counts }: { active: Tab; onChange: (t: Tab) => void; counts: Record<Tab, number> }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'received', label: 'Odebrane' },
    { key: 'issued', label: 'Wystawione' },
    { key: 'sent', label: 'Wysłane do KSeF' },
    { key: 'upo', label: 'Potwierdzenia UPO' },
  ]
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`tab-bar__btn${active === t.key ? ' tab-bar__btn--active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          <span className="tab-bar__count">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  )
}

function ReceivedTab({ data, loading }: { data: KsefReceivedInvoice[]; loading: boolean }) {
  if (loading) return <Spinner />
  if (!data.length) return <Card><p style={{ color: 'var(--color-text-secondary)' }}>Brak odebranych faktur z KSeF.</p></Card>
  return (
    <div className="page-list__cards">
      {data.map((inv) => (
        <Card key={inv.id}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div>
              <strong>{inv.number}</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Od: {inv.sender_name} · NIP: {inv.sender_nip}
              </p>
            </div>
            <Badge variant="default">{inv.ksef_ref}</Badge>
          </div>
          <div className="actions-row" style={{ marginTop: 8, gap: 16 }}>
            <span>Netto: <strong>{fmt(inv.total_net)} zł</strong></span>
            <span>Brutto: <strong>{fmt(inv.total_gross)} zł</strong></span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Data wystawienia: {inv.issue_date} · Odebrano: {inv.received_at}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function IssuedTab({ data, loading }: { data: Invoice[]; loading: boolean }) {
  if (loading) return <Spinner />
  if (!data.length) return <Card><p style={{ color: 'var(--color-text-secondary)' }}>Brak wystawionych faktur.</p></Card>
  return (
    <div className="page-list__cards">
      {data.map((inv) => (
        <Card key={inv.id}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div>
              <strong>{inv.number}</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Status: {inv.status === 'paid' ? 'opłacona' : inv.status === 'overdue' ? 'przeterminowana' : 'nieopłacona'}
                {inv.ksef_ref ? ` · KSeF: ${inv.ksef_ref}` : ''}
              </p>
            </div>
            <Badge variant={inv.ksef_status === 'ksef_sent' ? 'success' : inv.ksef_status === 'ksef_error' ? 'danger' : 'warning'}>
              {inv.ksef_status === 'ksef_sent' ? 'Wysłana' : inv.ksef_status === 'ksef_error' ? 'Błąd' : 'Oczekuje'}
            </Badge>
          </div>
          <div className="actions-row" style={{ marginTop: 8, gap: 16 }}>
            <span>Netto: <strong>{fmt(inv.total_net)} zł</strong></span>
            <span>Brutto: <strong>{fmt(inv.total_gross)} zł</strong></span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Data: {inv.issue_date}{inv.due_date ? ` · Termin: ${inv.due_date}` : ''}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function SentTab({ data, loading }: { data: Invoice[]; loading: boolean }) {
  if (loading) return <Spinner />
  if (!data.length) return <Card><p style={{ color: 'var(--color-text-secondary)' }}>Żadna faktura nie została jeszcze wysłana do KSeF.</p></Card>
  return (
    <div className="page-list__cards">
      {data.map((inv) => (
        <Card key={inv.id}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div>
              <strong>{inv.number}</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Ref KSeF: {inv.ksef_ref ?? '—'}
              </p>
            </div>
            <Badge variant="success">Wysłana</Badge>
          </div>
          <div className="actions-row" style={{ marginTop: 8, gap: 16 }}>
            <span>Netto: <strong>{fmt(inv.total_net)} zł</strong></span>
            <span>Brutto: <strong>{fmt(inv.total_gross)} zł</strong></span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Data: {inv.issue_date}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

function UpoTab({ data, loading }: { data: KsefUpo[]; loading: boolean }) {
  if (loading) return <Spinner />
  if (!data.length) return <Card><p style={{ color: 'var(--color-text-secondary)' }}>Brak potwierdzeń UPO.</p></Card>
  return (
    <div className="page-list__cards">
      {data.map((upo) => (
        <Card key={upo.id}>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div>
              <strong>{upo.invoice_number}</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                KSeF: {upo.ksef_ref} · UPO: {upo.upo_ref}
              </p>
            </div>
            <Badge variant={upo.status === 'confirmed' ? 'success' : 'danger'}>
              {upo.status === 'confirmed' ? 'Potwierdzone' : 'Odrzucone'}
            </Badge>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>Data UPO: {upo.upo_date}</p>
        </Card>
      ))}
    </div>
  )
}

export function KsefPage() {
  const { profile } = useSettings()
  const enabled = useFeatureAccess('ksef')
  const [tab, setTab] = useState<Tab>('received')

  const received = useKsefReceived()
  const issued = useKsefIssued()
  const sent = useKsefSent()
  const upo = useKsefUpo()

  if (!enabled) {
    return <AccessNotice title="KSeF w planie Pro/Business" description="Moduł KSeF wymaga planu Pro lub Business i odpowiedniej roli." actionLabel="Przejdź do billing" onAction={() => window.location.assign('/billing')} />
  }

  const counts: Record<Tab, number> = {
    received: received.data?.length ?? 0,
    issued: issued.data?.length ?? 0,
    sent: sent.data?.length ?? 0,
    upo: upo.data?.length ?? 0,
  }

  return (
    <div>
      <PageHeader title="KSeF" subtitle="Krajowy System e-Faktur — odebrane, wystawione, wysłane i potwierdzenia UPO" />

      <Card style={{ marginBottom: 18 }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div>
            <h3 style={{ margin: 0 }}>Konfiguracja</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Środowisko: {(profile as any)?.ksef_env ?? 'test'} · NIP: {(profile as any)?.ksef_nip || 'brak'}
            </p>
          </div>
          <Badge variant={(profile as any)?.ksef_token ? 'success' : 'warning'}>
            {(profile as any)?.ksef_token ? 'Token aktywny' : 'Brak tokena'}
          </Badge>
        </div>
        {!(profile as any)?.ksef_token && (
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Uzupełnij token KSeF w ustawieniach firmy, aby korzystać z modułu.</p>
        )}
        <div className="actions-row">
          <Button size="sm" disabled={!(profile as any)?.ksef_token}>Otwórz sesję KSeF</Button>
          <Button size="sm" variant="secondary" disabled={!(profile as any)?.ksef_token}>Wyślij fakturę testową</Button>
        </div>
      </Card>

      <TabBar active={tab} onChange={setTab} counts={counts} />

      {tab === 'received' && <ReceivedTab data={received.data ?? []} loading={received.isLoading} />}
      {tab === 'issued' && <IssuedTab data={issued.data ?? []} loading={issued.isLoading} />}
      {tab === 'sent' && <SentTab data={sent.data ?? []} loading={sent.isLoading} />}
      {tab === 'upo' && <UpoTab data={upo.data ?? []} loading={upo.isLoading} />}
    </div>
  )
}
