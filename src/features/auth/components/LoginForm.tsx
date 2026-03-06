import { useState } from 'react'
import { Button } from '@/shared/ui/Button/Button'
import { Card } from '@/shared/ui/Card/Card'
import { Input } from '@/shared/ui/Input/Input'
import { PageHeader } from '@/shared/ui/PageHeader/PageHeader'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { getPendingInviteToken, clearPendingInviteToken } from '@/shared/lib/inviteIntent'
import { settingsApi } from '@/features/settings/api/settings.api'
import { loginSchema } from '@/features/auth/model/auth.schema'

export function LoginForm() {
  const { signInDemo } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const finalizeInviteIfNeeded = async () => {
    const token = getPendingInviteToken()
    if (!token) return '/dashboard'
    await settingsApi.acceptInvitation(token, email)
    clearPendingInviteToken()
    toast.success('Zaproszenie zaakceptowane', 'Konto zostało przypięte do właściwej firmy.')
    return '/settings'
  }

  return (
    <Card className="auth-card">
      <PageHeader title="Zaloguj się" subtitle="Wpisz dane logowania do swojego konta." />
      <div style={{ display: 'grid', gap: 12 }}>
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@firma.pl" />
        <Input label="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <div className="actions-row" style={{ marginTop: 16 }}>
        <Button
          loading={loading}
          disabled={!email || !password}
          onClick={async () => {
            const result = loginSchema.safeParse({ email, password })
            if (!result.success) {
              toast.error('Błąd walidacji', result.error.errors[0]?.message || 'Popraw dane logowania')
              return
            }
            try {
              setLoading(true)
              await authApi.signIn(email, password)
              signInDemo(email)
              const target = await finalizeInviteIfNeeded()
              toast.success('Zalogowano', 'Możesz od razu przejść do pracy.')
              window.location.assign(target)
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Sprawdź dane logowania.'
              toast.error('Nie udało się zalogować', message)
            } finally {
              setLoading(false)
            }
          }}
        >
          Zaloguj
        </Button>
      </div>
    </Card>
  )
}
