import { useMemo, useState } from 'react'
import { ExternalLink, Link as LinkIcon, Copy, XCircle } from 'lucide-react'
import { Card } from '@/shared/ui/Card/Card'
import { Button } from '@/shared/ui/Button/Button'
import { Badge } from '@/shared/ui/Badge/Badge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCompanyId } from '@/features/auth/hooks/useAuth'
import { usePortalTokens, useDeactivatePortalToken } from '@/features/portal/hooks/usePortalData'
import { useEstimates } from '@/features/estimates/hooks/useEstimates'
import { useToast } from '@/shared/hooks/useToast'
import { PortalLinksCard } from '@/features/portal/components/PortalLinksCard'

export function PortalManagementPage() {
  const { user } = useAuth()
  const companyId = useCompanyId()
  const toast = useToast()
  const { data: tokens = [], isLoading: tokensLoading } = usePortalTokens(companyId)
  const { data: estimates = [] } = useEstimates()
  const deactivateToken = useDeactivatePortalToken(companyId)
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)

  const activeTokens = useMemo(() => tokens.filter((t) => t.active), [tokens])
  const inactiveTokens = useMemo(() => tokens.filter((t) => !t.active), [tokens])
  const acceptedEstimates = useMemo(() => estimates.filter((e) => e.status === 'accepted' || e.status === 'sent'), [estimates])
  const selectedEstimate = useMemo(() => estimates.find((e) => e.id === selectedEstimateId), [estimates, selectedEstimateId])

  if (!user) return null

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Portal klienta</h1>
          <p className="page__subtitle">Udostępniaj klientom linki do konkretnych wycen, zbieraj komentarze i akceptacje — bez plików w załącznikach i bez chaosu w ustaleniach.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Generate new link section */}
        {acceptedEstimates.length > 0 && (
          <Card>
            <h3 style={{ marginBottom: 12 }}>Wygeneruj link do portalu klienta</h3>
            <p className="field__label" style={{ marginBottom: 12 }}>Wybierz wycenę. Link działa jak „jedno miejsce” dla tej sprawy: komentarze, zdjęcia i decyzja klienta.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {acceptedEstimates.map((est) => (
                <button
                  key={est.id}
                  onClick={() => setSelectedEstimateId(est.id === selectedEstimateId ? null : est.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: est.id === selectedEstimateId ? 'var(--color-brand-light)' : 'var(--color-surface-alt)',
                    border: est.id === selectedEstimateId ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div>
                    <strong>{est.number}</strong> · {est.name}
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      Netto: {est.total_net.toFixed(2)} zł · Brutto: {est.total_gross.toFixed(2)} zł
                    </div>
                  </div>
                  <Badge variant={est.status === 'accepted' ? 'success' : 'warning'}>
                    {est.status === 'accepted' ? 'Zaakceptowana' : 'Wysłana'}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}

        {selectedEstimate && <PortalLinksCard estimate={selectedEstimate} />}

        {/* Active tokens */}
        {activeTokens.length > 0 && (
          <Card>
            <h3 style={{ marginBottom: 12 }}>Aktywne linki ({activeTokens.length})</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {activeTokens.map((item) => {
                const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${item.url}` : item.url
                return (
                  <div key={item.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <strong>{item.client_name}</strong>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                          {item.estimate_number} · {item.estimate_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          Wygasa: {new Date(item.expires_at).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                      <Badge variant="success">aktywny</Badge>
                    </div>
                    <div className="actions-row">
                      <Button size="sm" variant="secondary" icon={<Copy size={14} />} onClick={async () => { await navigator.clipboard?.writeText(fullUrl); toast.info('Skopiowano link') }}>
                        Kopiuj
                      </Button>
                      <a href={fullUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="secondary" icon={<ExternalLink size={14} />}>Otwórz</Button>
                      </a>
                      <Button size="sm" variant="ghost" icon={<XCircle size={14} />} loading={deactivateToken.isPending && deactivateToken.variables === item.id} onClick={() => deactivateToken.mutate(item.id)}>
                        Dezaktywuj
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Inactive tokens */}
        {inactiveTokens.length > 0 && (
          <Card>
            <h3 style={{ marginBottom: 12, color: 'var(--color-text-secondary)' }}>Nieaktywne linki ({inactiveTokens.length})</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {inactiveTokens.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--color-surface-alt)', opacity: 0.7 }}>
                  <div>
                    <strong>{item.client_name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>{item.estimate_number}</span>
                  </div>
                  <Badge variant="danger">wyłączony</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!tokensLoading && tokens.length === 0 && !selectedEstimate && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <LinkIcon size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 16 }} />
              <h3>Brak aktywnych linków</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
                {acceptedEstimates.length > 0
                  ? 'Wybierz wycenę powyżej, aby wygenerować link dla klienta i zebrać komentarze/akceptację.'
                  : 'Najpierw utwórz i wyślij wycenę klientowi, a potem wygeneruj link portalu.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}