import { Calculator, Clock, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { formatCurrency } from '@/shared/lib/formatters'
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats'
import { Spinner } from '@/shared/ui/Spinner/Spinner'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function DashboardPage() {
  const { data, isLoading } = useDashboardStats()
  const { user } = useAuth()
  if (isLoading || !data) return <Spinner />

  const firstName = user?.fullName?.split(' ')[0] ?? ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Cześć' : 'Dobry wieczór'

  return (
    <div className="dash">
      {/* ---- Greeting + primary CTA ---- */}
      <div className="dash__hero">
        <div>
          <h1 className="dash__greeting">{greeting}, {firstName}</h1>
          <p className="dash__sub">Wyceniasz na miejscu — reszta robi się sama.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.assign('/estimates')}
          icon={<Plus size={16} />}
        >
          Nowy kosztorys
        </Button>
      </div>

      {/* ---- Compact pipeline glance ---- */}
      <div className="dash__glance">
        <div className="dash__glance-item">
          <span className="dash__glance-num">{data.estimatesCount}</span>
          <span className="dash__glance-label">wycen</span>
        </div>
        <div className="dash__glance-sep" />
        <div className="dash__glance-item">
          <span className="dash__glance-num">{data.contractsCount}</span>
          <span className="dash__glance-label">umów</span>
        </div>
        <div className="dash__glance-sep" />
        <div className="dash__glance-item">
          <span className="dash__glance-num">{data.invoicesCount}</span>
          <span className="dash__glance-label">faktur</span>
        </div>
        <div className="dash__glance-sep" />
        <div className="dash__glance-item dash__glance-item--accent">
          <span className="dash__glance-num">{formatCurrency(data.paidRevenue)}</span>
          <span className="dash__glance-label">opłacone</span>
        </div>
      </div>

      {/* ---- Recent activity ---- */}
      <section className="dash__section">
        <h2 className="dash__section-title"><Clock size={14} /> Ostatnie działania</h2>
        <div className="dash__recent">
          {data.recentEstimates?.length ? (
            data.recentEstimates.slice(0, 4).map((e: { id: string; title: string; total: number; status: string }) => (
              <a key={e.id} href={`/estimates`} className="dash__recent-row">
                <Calculator size={14} />
                <span className="dash__recent-name">{e.title}</span>
                <span className="dash__recent-amount">{formatCurrency(e.total)}</span>
                <span className={`badge badge--${e.status === 'accepted' ? 'success' : e.status === 'sent' ? 'warning' : 'default'}`}>
                  {e.status === 'accepted' ? 'Zaakc.' : e.status === 'sent' ? 'Wysłany' : 'Szkic'}
                </span>
              </a>
            ))
          ) : (
            <p className="dash__empty">Brak wycen — utwórz pierwszą powyżej.</p>
          )}
        </div>
      </section>
    </div>
  )
}
