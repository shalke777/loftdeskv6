import {
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Link2,
  LogOut,
  MoreHorizontal,
  Receipt,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Button } from '@/shared/ui/Button/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { useFeatureAccess } from '@/features/auth/hooks/usePermissions'
import { APP_NAME } from '@/shared/lib/constants'
import { InstallAppButton } from '@/shared/ui/InstallAppButton/InstallAppButton'

type MainNavItem = {
  type?: 'route'
  to: '/dashboard' | '/clients' | '/estimates' | '/contracts' | '/invoices' | '/projects' | '/ksef' | '/settings' | '/portal-management'
  label: string
  icon: typeof LayoutDashboard
  feature?: 'ksef' | 'portal'
}

type ExternalNavItem = {
  type: 'external'
  href: string
  label: string
  icon: typeof Link2
  feature?: 'ksef' | 'portal'
}

type NavItem = MainNavItem | ExternalNavItem

const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Tablica', icon: LayoutDashboard },
  { to: '/clients', label: 'Kontrahenci', icon: Users },
  { to: '/estimates', label: 'Wycena', icon: Calculator },
  { to: '/contracts', label: 'Umowa', icon: FileText },
  { to: '/invoices', label: 'Faktura', icon: Receipt },
  { to: '/portal-management', label: 'Portal', icon: Link2, feature: 'portal' },
  { to: '/projects', label: 'Projekty', icon: FolderKanban },
  { to: '/ksef', label: 'KSeF', icon: Shield, feature: 'ksef' },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
]

const mobileNav: NavItem[] = [
  { to: '/dashboard', label: 'Start', icon: LayoutDashboard },
  { to: '/clients', label: 'Klient', icon: Users },
  { to: '/estimates', label: 'Wyceny', icon: Calculator },
  { to: '/contracts', label: 'Umowy', icon: FileText },
  { to: '/invoices', label: 'Faktury', icon: Receipt },
  { to: '/portal-management', label: 'Portal', icon: Link2, feature: 'portal' },
  { to: '/settings', label: 'Więcej', icon: MoreHorizontal },
]

function isActive(pathname: string, item: NavItem) {
  if (item.type === 'external') return pathname.startsWith('/portal/')
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AuthLayout() {
  const { user, signOut, loading } = useAuth()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const canUsePortal = useFeatureAccess('portal')
  const canUseKsef = useFeatureAccess('ksef')

  if (loading) return <div className="page-loading">Ładowanie sesji...</div>
  if (!user) return <AuthScreen />

  const featureFlags = { ksef: canUseKsef, portal: canUsePortal } as const
  const visibleMainNav = mainNavItems.filter((item) => !item.feature || featureFlags[item.feature])
  const visibleMobileNav = mobileNav.filter((item) => !item.feature || featureFlags[item.feature])

  return (
    <div className="app-shell">
      <aside className="sidebar" role="complementary" aria-label="Menu boczne">
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">LD</div>
          <div>
            <strong>{APP_NAME}</strong>
            <span>Prawa ręka fachowca</span>
          </div>
        </div>

        <div className="sidebar__company">
          <strong>{user.companyName}</strong>
          <span>{user.fullName}</span>
          <span>{user.email}</span>
        </div>

        <nav className="sidebar__nav sidebar__nav--main" role="navigation" aria-label="Menu główne">
          {visibleMainNav.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item)
            if (item.type === 'external') {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={active ? 'sidebar__link sidebar__link--active' : 'sidebar__link'}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </a>
              )
            }

            return (
              <Link key={item.to} to={item.to} className={active ? 'sidebar__link sidebar__link--active' : 'sidebar__link'}>
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <InstallAppButton compact />
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); window.location.assign('/login') }} icon={<LogOut size={15} />}>
            Wyloguj
          </Button>
        </div>
      </aside>

      <section className="shell-main">
        <main className="shell-content">
          <Suspense fallback={<div className="page-loading">Ładowanie...</div>}>
            <Outlet />
          </Suspense>
        </main>
        <nav className="mobile-nav" role="navigation" aria-label="Menu mobilne">
          {visibleMobileNav.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item)
            if (item.type === 'external') {
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={active ? 'mobile-nav__link mobile-nav__link--active' : 'mobile-nav__link'}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              )
            }
            return (
              <Link key={item.to} to={item.to} className={active ? 'mobile-nav__link mobile-nav__link--active' : 'mobile-nav__link'}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </section>
    </div>
  )
}
