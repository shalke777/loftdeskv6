import { createContext, useContext } from 'react'
import type { DemoRole } from '@/shared/lib/demoDb'

export type UserRole = DemoRole

export interface SessionUser {
  id: string
  email: string
  companyId: string
  companyName: string
  role: UserRole
  plan: 'free' | 'pro' | 'business' | 'admin'
  fullName: string
}

export interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  signInDemo: (email?: string) => void
  registerDemoCompany: (input?: { email?: string; companyName?: string; fullName?: string; password?: string; nip?: string }) => void
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info'
}

export interface ToastContextValue {
  items: ToastItem[]
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  remove: (id: string) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
export const ToastContext = createContext<ToastContextValue | null>(null)

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used inside ToastProvider')
  return ctx
}
