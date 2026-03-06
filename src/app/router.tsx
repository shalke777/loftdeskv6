import { lazy } from 'react'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootDocument } from '@/app/routes/__root'
import { AuthLayout } from '@/app/routes/_auth'
import { PublicLayout } from '@/app/routes/_public'
import { AuthScreen } from '@/features/auth/components/AuthScreen'

// Code-split all page routes — layouts + auth screen stay eager
const LandingRoutePage = lazy(() => import('@/app/routes/index').then(m => ({ default: m.LandingRoutePage })))
const DashboardRoutePage = lazy(() => import('@/app/routes/dashboard').then(m => ({ default: m.DashboardRoutePage })))
const ClientsRoutePage = lazy(() => import('@/app/routes/clients').then(m => ({ default: m.ClientsRoutePage })))
const EstimatesRoutePage = lazy(() => import('@/app/routes/estimates').then(m => ({ default: m.EstimatesRoutePage })))
const InvoicesRoutePage = lazy(() => import('@/app/routes/invoices').then(m => ({ default: m.InvoicesRoutePage })))
const ContractsRoutePage = lazy(() => import('@/app/routes/contracts').then(m => ({ default: m.ContractsRoutePage })))
const ProjectsRoutePage = lazy(() => import('@/app/routes/projects').then(m => ({ default: m.ProjectsRoutePage })))
const ReportsRoutePage = lazy(() => import('@/app/routes/reports').then(m => ({ default: m.ReportsRoutePage })))
const KsefRoutePage = lazy(() => import('@/app/routes/ksef').then(m => ({ default: m.KsefRoutePage })))
const SettingsRoutePage = lazy(() => import('@/app/routes/settings').then(m => ({ default: m.SettingsRoutePage })))
const TeamRoutePage = lazy(() => import('@/app/routes/team').then(m => ({ default: m.TeamRoutePage })))
const BillingRoutePage = lazy(() => import('@/app/routes/billing').then(m => ({ default: m.BillingRoutePage })))
const OnboardingRoutePage = lazy(() => import('@/app/routes/onboarding').then(m => ({ default: m.OnboardingRoutePage })))
const AdminRoutePage = lazy(() => import('@/app/routes/admin').then(m => ({ default: m.AdminRoutePage })))
const PortalTokenRoutePage = lazy(() => import('@/app/routes/portal/$token').then(m => ({ default: m.PortalTokenRoutePage })))
const ReleaseRoutePage = lazy(() => import('@/app/routes/release').then(m => ({ default: m.ReleaseRoutePage })))
const JoinInvitationRoutePage = lazy(() => import('@/app/routes/join.$token').then(m => ({ default: m.JoinInvitationRoutePage })))
const HealthRoutePage = lazy(() => import('@/app/routes/health').then(m => ({ default: m.HealthRoutePage })))
const GoLiveRoutePage = lazy(() => import('@/app/routes/go-live').then(m => ({ default: m.GoLiveRoutePage })))
const DocumentationRoutePage = lazy(() => import('@/app/routes/documentation').then(m => ({ default: m.DocumentationRoutePage })))
const PortalManagementRoutePage = lazy(() => import('@/app/routes/portal-management').then(m => ({ default: m.PortalManagementRoutePage })))

const rootRoute = createRootRoute({ component: RootDocument })

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: 'login', component: AuthScreen })
const authLayoutRoute = createRoute({ getParentRoute: () => rootRoute, id: '_auth', component: AuthLayout })
const publicLayoutRoute = createRoute({ getParentRoute: () => rootRoute, id: '_public', component: PublicLayout })

const landingRoute = createRoute({ getParentRoute: () => publicLayoutRoute, path: '/', component: LandingRoutePage })
const portalRoute = createRoute({ getParentRoute: () => publicLayoutRoute, path: 'portal/$token', component: PortalTokenRoutePage })
const joinRoute = createRoute({ getParentRoute: () => publicLayoutRoute, path: 'join/$token', component: JoinInvitationRoutePage })

const dashboardRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'dashboard', component: DashboardRoutePage })
const clientsRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'clients', component: ClientsRoutePage })
const estimatesRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'estimates', component: EstimatesRoutePage })
const invoicesRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'invoices', component: InvoicesRoutePage })
const contractsRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'contracts', component: ContractsRoutePage })
const projectsRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'projects', component: ProjectsRoutePage })
const reportsRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'reports', component: ReportsRoutePage })
const ksefRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'ksef', component: KsefRoutePage })
const settingsRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'settings', component: SettingsRoutePage })
const billingRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'billing', component: BillingRoutePage })
const teamRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'team', component: TeamRoutePage })
const onboardingRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'onboarding', component: OnboardingRoutePage })
const adminRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'admin', component: AdminRoutePage })
const releaseRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'release', component: ReleaseRoutePage })
const healthRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'health', component: HealthRoutePage })
const goLiveRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'go-live', component: GoLiveRoutePage })
const documentationRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'documentation', component: DocumentationRoutePage })
const portalManagementRoute = createRoute({ getParentRoute: () => authLayoutRoute, path: 'portal-management', component: PortalManagementRoutePage })

const routeTree = rootRoute.addChildren([
  loginRoute,
  publicLayoutRoute.addChildren([landingRoute, portalRoute, joinRoute]),
  authLayoutRoute.addChildren([
    dashboardRoute,
    clientsRoute,
    estimatesRoute,
    invoicesRoute,
    contractsRoute,
    projectsRoute,
    reportsRoute,
    ksefRoute,
    billingRoute,
    teamRoute,
    onboardingRoute,
    settingsRoute,
    documentationRoute,
    portalManagementRoute,
    adminRoute,
    releaseRoute,
    healthRoute,
    goLiveRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />
}
