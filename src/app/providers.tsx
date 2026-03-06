import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { queryClient } from '@/shared/lib/queryClient'
import { ToastViewport } from '@/shared/ui/Toast/Toast'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { demoDb } from '@/shared/lib/demoDb'
import { isDemoMode, supabase } from '@/shared/lib/supabase'
import { resolveSupabaseSession } from '@/shared/lib/backend'
import {
  AuthContext,
  ToastContext,
  type SessionUser,
  type AuthContextValue,
  type ToastItem,
  type ToastContextValue,
} from '@/app/contexts'

// Re-export for backward compat (consumers importing types from providers)
export type { UserRole, SessionUser } from '@/app/contexts'
export { useAuthContext, useToastContext } from '@/app/contexts'

function mapUser(email?: string): SessionUser {
  const demoUser = (email && demoDb.users.byEmail(email)) || demoDb.users.byEmail('adam@budowlanka.pl') || demoDb.users.list()[0]
  return {
    id: demoUser.id,
    email: demoUser.email,
    companyId: demoUser.company_id,
    companyName: demoUser.company_name,
    role: demoUser.role,
    plan: demoUser.plan,
    fullName: demoUser.full_name,
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUser, setStoredUser] = useLocalStorage<SessionUser | null>('loftdesk-v4-session', isDemoMode ? mapUser() : null)
  const [user, setUser] = useState<SessionUser | null>(storedUser)
  const [loading, setLoading] = useState(!isDemoMode)

  const refreshSession = async () => {
    if (isDemoMode) {
      setUser((prev) => {
        const next = prev ? mapUser(prev.email) : prev
        setStoredUser(next)
        return next
      })
      return
    }
    setLoading(true)
    try {
      const resolved = await resolveSupabaseSession()
      setUser(resolved.user)
      setStoredUser(resolved.user)
    } catch {
      setUser(null)
      setStoredUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isDemoMode) {
      setUser(storedUser)
      setLoading(false)
      return
    }
    void refreshSession()
    const subscription = supabase?.auth.onAuthStateChange(() => {
      void refreshSession()
    })
    return () => subscription?.data.subscription.unsubscribe()
    // Only run on mount - refreshSession and storedUser are not needed as dependencies
    // refreshSession is stable and storedUser is only used for initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInDemo: (email) => {
        const next = mapUser(email)
        setUser(next)
        setStoredUser(next)
      },
      registerDemoCompany: (input) => {
        const created = demoDb.users.createCompanyOwner({
          email: input?.email || 'nowy@loftdesk.pl',
          companyName: input?.companyName,
          fullName: input?.fullName,
          password: input?.password,
          nip: input?.nip,
        })
        const next = mapUser(created.email)
        setUser(next)
        setStoredUser(next)
      },
      signOut: async () => {
        if (!isDemoMode && supabase) await supabase.auth.signOut()
        setUser(null)
        setStoredUser(null)
      },
      refreshSession,
    }),
    [loading, setStoredUser, storedUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timeoutsRef = useRef<Map<string, number>>(new Map())

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      window.clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const push = useCallback((variant: ToastItem['variant'], title: string, description?: string) => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, title, description, variant }])
    const timeout = window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
      timeoutsRef.current.delete(id)
    }, 3200)
    timeoutsRef.current.set(id, timeout)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      items,
      remove,
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [items, remove, push],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          {children}
          <ToastViewport />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
