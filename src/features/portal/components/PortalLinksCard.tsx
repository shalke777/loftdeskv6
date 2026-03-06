import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card } from '@/shared/ui/Card/Card'
import { Button } from '@/shared/ui/Button/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCreatePortalToken, useDeactivatePortalToken, usePortalTokens } from '@/features/portal/hooks/usePortalData'
import type { Estimate } from '@/entities/estimate/model'
import { STATUS_META } from '@/shared/lib/constants'
import { Badge } from '@/shared/ui/Badge/Badge'
import { Input } from '@/shared/ui/Input/Input'
import { useToast } from '@/shared/hooks/useToast'

export function PortalLinksCard({ estimate }: { estimate: Estimate }) {
  const { user } = useAuth()
  const toast = useToast()
  const companyId = user?.companyId ?? ''
  const tokens = usePortalTokens(companyId)
  const createToken = useCreatePortalToken(companyId)
  const deactivateToken = useDeactivatePortalToken(companyId)
  const [clientName, setClientName] = useState('')

  const estimateTokens = useMemo(() => (tokens.data ?? []).filter((item) => item.estimate_id === estimate.id), [tokens.data, estimate.id])
  const statusMeta = STATUS_META[estimate.status]

  return (
    <Card>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div>
          <h3>Portal klienta: link do wyceny</h3>
          <p className="field__label">{estimate.number} · {estimate.name}</p>
        </div>
        <Badge variant={(statusMeta?.tone as any) ?? 'default'}>{statusMeta?.label ?? estimate.status}</Badge>
      </div>

      <p>Wygeneruj link do <strong>konkretnej wyceny</strong>. Klient może komentować zakres, dosłać zdjęcia i zaakceptować ofertę — wszystko w jednym miejscu, z historią decyzji.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <span className="hero-pill">1) Link</span>
        <span className="hero-pill">2) Komentarze</span>
        <span className="hero-pill">3) Akceptacja</span>
      </div>

      <div className="actions-row" style={{ marginTop: 12, marginBottom: 12 }}>
        <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Imię / nazwa klienta (widoczne w portalu)" />
        <Button
          disabled={estimate.status === 'draft' || !user}
          loading={createToken.isPending}
          onClick={async () => {
            try {
              const created = await createToken.mutateAsync({
                estimateId: estimate.id,
                userId: user?.id ?? '',
                clientName: clientName || 'Klient',
              })
              const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${created.url}` : created.url

              try {
                await navigator.clipboard?.writeText(fullUrl)
                toast.success('Link gotowy', 'Adres portalu został skopiowany do schowka.')
              } catch {
                toast.success('Link gotowy', fullUrl)
              }

              setClientName('')
            } catch (error) {
              toast.error('Nie udało się wygenerować linku', error instanceof Error ? error.message : undefined)
            }
          }}
        >
          Wygeneruj i skopiuj link
        </Button>
      </div>

      {!estimateTokens.length ? <p className="field__label">Brak aktywnych linków dla tej wyceny.</p> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {estimateTokens.map((item) => {
          const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${item.url}` : item.url
          return (
            <div key={item.id} className="card" style={{ padding: 12 }}>
              <div className="toolbar" style={{ marginBottom: 8 }}>
                <div>
                  <strong>{item.client_name}</strong>
                  <div className="field__label">Wygasa: {new Date(item.expires_at).toLocaleDateString('pl-PL')}</div>
                </div>
                <Badge variant={item.active ? 'success' : 'danger'}>{item.active ? 'aktywny' : 'wyłączony'}</Badge>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{fullUrl}</code>
                <div className="actions-row">
                  <Button variant="secondary" onClick={async () => {
                    try {
                      await navigator.clipboard?.writeText(fullUrl)
                      toast.info('Skopiowano link portalu')
                    } catch {
                      toast.info('Link portalu', fullUrl)
                    }
                  }}>Kopiuj link</Button>
                  <a href={fullUrl} target="_blank" rel="noreferrer"><Button variant="secondary" icon={<ExternalLink size={16} />}>Otwórz link</Button></a>
                  {item.active ? (
                    <Button variant="ghost" loading={deactivateToken.isPending && deactivateToken.variables === item.id} onClick={() => deactivateToken.mutate(item.id)}>
                      Dezaktywuj
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}