import { Suspense } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'

export function PublicLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const shellClass = pathname.startsWith('/portal/') || pathname.startsWith('/join/') ? 'public-shell public-shell--portal' : 'public-shell public-shell--landing'
  return (
    <main className={shellClass}>
      <Suspense fallback={<div className="page-loading">Ładowanie...</div>}>
        <Outlet />
      </Suspense>
    </main>
  )
}
