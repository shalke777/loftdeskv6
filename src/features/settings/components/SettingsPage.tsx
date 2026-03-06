import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Camera, ChartColumn, CreditCard, Download, LogOut, RotateCcw, ShieldCheck, Upload, Users } from 'lucide-react'
import { Card } from '@/shared/ui/Card/Card'
import { Button } from '@/shared/ui/Button/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { demoDb } from '@/shared/lib/demoDb'
import { useToast } from '@/shared/hooks/useToast'
import { PLAN_DEFS } from '@/shared/lib/constants'
import { CompanyProfileCard } from '@/features/settings/components/CompanyProfileCard'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { downloadBlob } from '@/shared/lib/downloads'
import { useTheme } from '@/shared/hooks/useTheme'

const THEMES = [
  { id: 'craft', name: 'LoftDesk Red', color: '#dc2626', description: 'Czerwień · domyślny' },
  { id: 'steel', name: 'Stalowy Warsztat', color: '#2563eb', description: 'Niebieska stal' },
  { id: 'clean', name: 'Czysta Łazienka', color: '#059669', description: 'Zieleń · minimalizm' },
  { id: 'dark', name: 'Nocny Warsztat', color: '#f97316', description: 'Ciemny motyw' },
]

const SECTION_COLORS: Record<string, string> = {
  motyw: '#dc2626',
  konto: '#2563eb',
  firma: '#059669',
  ksef: '#475569',
  portal: '#7c3aed',
  backup: '#f97316',
  demo: '#64748b',
  skroty: '#0ea5e9',
}

function SectionTitle({ children, accent }: { children: ReactNode; accent?: string }) {
  const color = accent ? SECTION_COLORS[accent] ?? 'var(--color-text-tertiary)' : 'var(--color-text-tertiary)'
  return (
    <h2 className="settings-section">
      <span className="settings-section__dot" style={{ background: color }} />
      {children}
    </h2>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-row">
      <span className="settings-row__label">{label}</span>
      <span className="settings-row__value">{value}</span>
    </div>
  )
}

function QuickLink({ icon, title, desc, href }: { icon: ReactNode; title: string; desc: string; href: string }) {
  return (
    <a href={href} className="settings-link">
      <div className="settings-link__icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <div className="field__label">{desc}</div>
      </div>
    </a>
  )
}

export function SettingsPage() {
  const { user, signOut, refreshSession } = useAuth()
  const toast = useToast()
  const { profile } = useSettings()
  const canUseKsef = useFeatureAccess('ksef')
  const canUsePortal = useFeatureAccess('portal')
  const portalLinks = user ? demoDb.portal.listForCompany(user.companyId).length : 0
  const importRef = useRef<HTMLInputElement | null>(null)
  const { theme, setTheme } = useTheme()

  async function exportBackup() {
    const blob = new Blob([demoDb.exportState()], { type: 'application/json;charset=utf-8' })
    downloadBlob(`loftdesk-backup-${new Date().toISOString().slice(0, 10)}.json`, blob)
  }

  async function importBackup(file?: File | null) {
    if (!file) return
    const text = await file.text()
    demoDb.importState(text)
    await refreshSession()
    toast.success('Backup przywrócony')
  }

  const plan = user?.plan ? PLAN_DEFS[user.plan] : null

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1>Ustawienia</h1>
        <p className="field__label">Motyw, dane firmy, backup i narzędzia.</p>
      </div>

      {/* ── 1. MOTYW ── */}
      <SectionTitle accent="motyw">Motyw</SectionTitle>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-swatch${theme === t.id ? ' theme-swatch--active' : ''}`}
            onClick={() => { setTheme(t.id); toast.success(`Motyw: ${t.name}`) }}
          >
            <div className="theme-swatch__dot" style={{ background: t.color }} />
            <div className="theme-swatch__name">{t.name}</div>
            <div className="theme-swatch__desc">{t.description}</div>
          </button>
        ))}
      </div>

      {/* ── 2. KONTO ── */}
      <SectionTitle accent="konto">Konto</SectionTitle>
      <Card>
        <InfoRow label="Użytkownik" value={user?.fullName ?? '—'} />
        <InfoRow label="E-mail" value={user?.email ?? '—'} />
        <InfoRow label="Rola" value={user?.role ?? '—'} />
        <InfoRow label="Firma" value={user?.companyName ?? '—'} />
        <InfoRow label="Plan" value={plan?.name ?? '—'} />
        <div className="actions-row" style={{ marginTop: 12 }}>
          <Button variant="ghost" onClick={async () => { await signOut(); window.location.assign('/login') }}>
            <LogOut size={14} /> Wyloguj
          </Button>
        </div>
      </Card>

      {/* ── 3. FIRMA ── */}
      <SectionTitle accent="firma">Dane firmy</SectionTitle>
      <CompanyProfileCard />

      {/* ── 4. KSeF ── */}
      <SectionTitle accent="ksef">KSeF</SectionTitle>
      <Card>
        <InfoRow label="Środowisko" value={profile?.ksef_env ?? 'test'} />
        <InfoRow label="NIP" value={profile?.ksef_nip ?? 'brak'} />
        <InfoRow label="Token" value={profile?.ksef_token ? '✓ ustawiony' : '✗ brak'} />
        <InfoRow label="Status" value={canUseKsef ? 'Aktywny' : 'Zablokowany (plan Free)'} />
        <div className="actions-row" style={{ marginTop: 12 }}>
          <Button variant="secondary" onClick={() => window.location.assign('/ksef')}>Przejdź do KSeF</Button>
        </div>
      </Card>

      {/* ── 5. PORTAL ── */}
      <SectionTitle accent="portal">Portal klienta</SectionTitle>
      <Card>
        <InfoRow label="Status" value={canUsePortal ? 'Aktywny' : 'Zablokowany'} />
        <InfoRow label="Linki" value={String(portalLinks)} />
        {canUsePortal ? (
          <div className="actions-row" style={{ marginTop: 12 }}>
            <a href="/portal/demo-token" target="_blank" rel="noreferrer"><Button variant="secondary">Podgląd portalu</Button></a>
          </div>
        ) : null}
      </Card>

      {/* ── 6. BACKUP ── */}
      <SectionTitle accent="backup">Backup</SectionTitle>
      <Card>
        <p className="field__label" style={{ marginBottom: 12 }}>Pobierz kopię danych lub przywróć wcześniejszy backup.</p>
        <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => importBackup(e.target.files?.[0] || null)} />
        <div className="actions-row" style={{ marginTop: 0 }}>
          <Button variant="secondary" onClick={exportBackup}><Download size={14} /> Pobierz</Button>
          <Button onClick={() => importRef.current?.click()}><Upload size={14} /> Przywróć</Button>
        </div>
      </Card>

      {/* ── 7. DANE DEMO ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Dane demo</strong>
            <div className="field__label">Zresetuj testowe dane firmy do stanu początkowego.</div>
          </div>
          <Button variant="ghost" onClick={async () => { demoDb.reset(); await refreshSession(); toast.success('Dane demo zresetowane') }}>
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </Card>

      {/* ── 8. SKRÓTY ── */}
      <SectionTitle accent="skroty">Szybki dostęp</SectionTitle>
      <div className="settings-links">
        <QuickLink icon={<ChartColumn size={18} />} title="Raporty" desc="Marża, przychód, koszty" href="/reports" />
        <QuickLink icon={<Camera size={18} />} title="Dokumentacja" desc="Zdjęcia, odbiory, protokoły" href="/documentation" />
        <QuickLink icon={<CreditCard size={18} />} title="Plan i limity" desc="Fakturowanie produktu" href="/billing" />
        <QuickLink icon={<Users size={18} />} title="Zespół" desc="Role, zaproszenia, dostęp" href="/team" />
        <QuickLink icon={<ShieldCheck size={18} />} title="Admin" desc="Narzędzia techniczne" href="/admin" />
      </div>
    </div>
  )
}
