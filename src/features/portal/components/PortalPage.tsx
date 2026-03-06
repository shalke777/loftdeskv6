import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { Card } from '@/shared/ui/Card/Card'
import {
  usePortalApprovalDecision,
  usePortalData,
  usePortalDecision,
  usePortalIdentity,
  usePortalProtocolDecision,
  usePortalStandardAccept,
} from '@/features/portal/hooks/usePortalData'
import { PortalChat } from '@/features/portal/components/PortalChat'
import { PortalHeader } from '@/features/portal/components/PortalHeader'
import { PortalExpired } from '@/features/portal/components/PortalExpired'
import { PortalNamePrompt } from '@/features/portal/components/PortalNamePrompt'

function readTokenFromPath() {
  if (typeof window === 'undefined') return 'demo-token'
  const last = window.location.pathname.split('/').filter(Boolean).pop()
  return last || 'demo-token'
}

type ApprovalStatus = 'pending_client' | 'accepted' | 'rejected' | 'revision_requested'

const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending_client: 'Czeka na Twoją decyzję',
  accepted: 'Zaakceptowane',
  rejected: 'Odrzucone',
  revision_requested: 'Wysłano uwagi',
}

function prettyType(raw: string) {
  const t = (raw || '').trim()
  const map: Record<string, string> = {
    change: 'Zmiana',
    change_order: 'Zmiana',
    variation: 'Zmiana',
    decision: 'Decyzja',
    approval: 'Akceptacja',
  }
  if (!t) return '—'
  return map[t] || t.replace(/_/g, ' ')
}

/**
 * Bez backendu: wyciągamy “wpływ” z description.
 * Obsługuje teksty typu: “+480 zł / +1 dzień”, “-200 zł”, “+2 dni”.
 */
function parseImpact(description: string) {
  const text = (description || '').toString()

  const amountMatch = text.match(/([+-]?\s*\d[\d\s.,]*)\s*zł/iu)
  const daysMatch = text.match(/([+-]?\s*\d+)\s*(dzień|dni|dnia)/iu)

  const amountText = amountMatch ? amountMatch[0].replace(/\s+/g, ' ').trim() : ''
  const daysText = daysMatch ? daysMatch[0].replace(/\s+/g, ' ').trim() : ''

  return { amountText, daysText }
}

export function PortalPage({ token }: { token?: string }) {
  const resolvedToken = token || readTokenFromPath()
  const { data, isLoading, error } = usePortalData(resolvedToken)
  const decision = usePortalDecision(resolvedToken)
  const identity = usePortalIdentity(resolvedToken)
  const approvalDecision = usePortalApprovalDecision(resolvedToken)
  const protocolDecision = usePortalProtocolDecision(resolvedToken)
  const standardAccept = usePortalStandardAccept(resolvedToken)

  if (isLoading) return <Spinner />
  if (error || !data) {
    return (
      <div className="portal-page">
        <Card>
          <h3>Link portalu jest nieaktywny</h3>
          <p>Ten link nie został znaleziony, wygasł albo został wyłączony przez firmę.</p>
        </Card>
      </div>
    )
  }

  if (data.expired || !data.active) return <PortalExpired />

  const isDecided = data.estimateStatus === 'accepted' || data.estimateStatus === 'rejected'

  return (
    <div className="portal-page">
      <a href="/dashboard" className="portal-back">
        <ArrowLeft size={16} /> Wróć do aplikacji
      </a>

      {/* ── chat input (sama góra) ── */}
      <div className="portal-input">
        <PortalChat token={resolvedToken} />
      </div>

      {/* ── messages ── */}
      {data.messages.length ? (
        <div className="portal-msgs">
          {data.messages.map((message) => (
            <div
              key={message.id}
              className={`portal-msg ${message.author === 'company' ? 'portal-msg--co' : 'portal-msg--cl'}`}
            >
              <span className="portal-msg__author">{message.author === 'company' ? 'Firma' : 'Klient'}</span>
              {message.image_url ? (
                <a href={message.image_url} target="_blank" rel="noreferrer" className="portal-msg__img-link">
                  <img src={message.image_url} alt="Załącznik" className="portal-msg__img" />
                </a>
              ) : null}
              {message.text ? <p className="portal-msg__text">{message.text}</p> : null}
              <span className="portal-msg__time">{new Date(message.created_at).toLocaleString('pl-PL')}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── header: estimate context + accept/reject ── */}
      <PortalHeader
        estimateNumber={data.estimateNumber}
        estimateName={data.estimateName}
        customerName={data.customerName}
        contractorName={data.contractorName}
        contractorEmail={data.contractorEmail}
        expiresAt={data.expiresAt}
        expired={data.expired}
        estimateStatus={data.estimateStatus}
        totalGross={data.totalGross}
        onAccept={() => decision.mutate('accepted')}
        onReject={() => decision.mutate('rejected')}
        decisionPending={decision.isPending}
      />

      {/* ── name prompt (only before decision) ── */}
      {!isDecided ? (
        <PortalNamePrompt
          initialValue={data.customerName}
          onSave={(value) => identity.mutate(value)}
          loading={identity.isPending}
        />
      ) : null}

      {/* ── approvals (Change Order style, bez backendu) ── */}
      {data.approvals.length ? (
        <Card>
          <h3>Zmiany i decyzje do potwierdzenia</h3>
          <p className="field__label" style={{ marginTop: 6 }}>
            Te pozycje mogą wpływać na <strong>zakres</strong>, <strong>cenę</strong> lub <strong>termin</strong>.
            Zatwierdź je, żeby uniknąć nieporozumień — decyzja zapisze się w historii.
          </p>

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {data.approvals.map((item) => {
              const impact = parseImpact(item.description)
              const statusLabel = APPROVAL_STATUS_LABEL[item.status as ApprovalStatus] || item.status
              const canAct = item.status === 'pending_client'
              const busy = approvalDecision.isPending

              return (
                <div key={item.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <strong>{item.title}</strong>
                      <span className="hero-pill">{statusLabel}</span>
                      {impact.amountText ? <span className="hero-pill">Kwota: {impact.amountText}</span> : null}
                      {impact.daysText ? <span className="hero-pill">Termin: {impact.daysText}</span> : null}
                    </div>

                    {item.description ? (
                      <div className="field__label" style={{ marginTop: 6 }}>
                        {item.description}
                      </div>
                    ) : null}

                    <div className="field__label" style={{ marginTop: 6 }}>
                      Typ: {prettyType(item.type)}
                    </div>
                  </div>

                  <div className="actions-row" style={{ marginTop: 0 }}>
                    {canAct ? (
                      <>
                        <button
                          className="btn btn--secondary btn--sm"
                          disabled={busy}
                          onClick={() => approvalDecision.mutate({ id: item.id, decision: 'accepted' })}
                        >
                          Akceptuję
                        </button>

                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={busy}
                          onClick={() =>
                            approvalDecision.mutate({
                              id: item.id,
                              decision: 'revision_requested',
                              comment: 'Mam uwagi do tej pozycji — proszę o doprecyzowanie / korektę.',
                            })
                          }
                        >
                          Mam uwagi
                        </button>

                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={busy}
                          onClick={() => approvalDecision.mutate({ id: item.id, decision: 'rejected' })}
                        >
                          Odrzucam
                        </button>
                      </>
                    ) : (
                      <span className="field__label">Decyzja jest już zapisana.</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {/* ── protocols ── */}
      {data.protocols.length ? (
        <Card>
          <h3>Protokoły odbioru</h3>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {data.protocols.map((item) => (
              <div key={item.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{item.title}</strong>
                  <div className="field__label" style={{ marginTop: 6 }}>
                    {item.summary}
                  </div>
                  <div className="field__label" style={{ marginTop: 6 }}>
                    Status: {item.status}
                  </div>
                </div>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => protocolDecision.mutate({ id: item.id, decision: 'accepted' })}
                  >
                    Akceptuj odbiór
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => protocolDecision.mutate({ id: item.id, decision: 'rejected' })}
                  >
                    Zgłoś uwagi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* ── standards ── */}
      {data.standards.length ? (
        <Card>
          <h3>Regulaminy i standardy</h3>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {data.standards.map((item) => (
              <div key={item.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{item.title}</strong>
                  <div className="field__label" style={{ marginTop: 6 }}>
                    {item.content}
                  </div>
                </div>
                <div className="actions-row" style={{ marginTop: 0 }}>
                  {item.accepted ? (
                    <span className="hero-pill">Zaakceptowane</span>
                  ) : (
                    <button className="btn btn--secondary btn--sm" onClick={() => standardAccept.mutate(item.id)}>
                      Akceptuję standard
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}