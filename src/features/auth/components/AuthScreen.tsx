import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/Button/Button'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

const tabs = [
  { key: 'login', label: 'Logowanie' },
  { key: 'register', label: 'Nowa firma' },
  { key: 'forgot', label: 'Reset hasła' },
] as const

type AuthTab = (typeof tabs)[number]['key']

export function AuthScreen() {
  const [tab, setTab] = useState<AuthTab>('login')

  return (
    <main className="auth-shell">
      <div style={{ width: 'min(480px, 100%)', display: 'grid', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#dc2626"/><path d="M8 12h16v2H8zm0 4h16v2H8zm0 4h10v2H8z" fill="#fff"/></svg>
            <span style={{ fontSize: 22, fontWeight: 800 }}>LoftDesk</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.5 }}>Dokumenty budowlane w jednym miejscu</p>
        </div>
        <div className="toolbar" style={{ justifyContent: 'center', marginBottom: 0 }}>
          <div className="toolbar__actions">
            {tabs.map((item) => (
              <Button key={item.key} variant={tab === item.key ? 'primary' : 'secondary'} onClick={() => setTab(item.key)}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        {tab === 'login' ? <LoginForm /> : null}
        {tab === 'register' ? <RegisterForm /> : null}
        {tab === 'forgot' ? <ForgotPasswordForm /> : null}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--color-muted)' }}>← Wróć na stronę główną</Link>
        </div>
      </div>
    </main>
  )
}
