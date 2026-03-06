import { useState } from 'react'
import { Button } from '@/shared/ui/Button/Button'
import { Card } from '@/shared/ui/Card/Card'
import { Input } from '@/shared/ui/Input/Input'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { isDemoMode } from '@/shared/lib/supabase'
import { PendingInvitesNotice } from '@/features/auth/components/PendingInvitesNotice'
import { getPendingInviteToken, clearPendingInviteToken } from '@/shared/lib/inviteIntent'
import { settingsApi } from '@/features/settings/api/settings.api'
import { registerSchema } from '@/features/auth/model/auth.schema'

export function RegisterForm() {
  const { registerDemoCompany } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [fullName, setFullName] = useState('')
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const finalizeInviteIfNeeded = async () => {
    const token = getPendingInviteToken()
    if (!token) return '/dashboard'
    await settingsApi.acceptInvitation(token, email)
    clearPendingInviteToken()
    toast.success('Zaproszenie zaakceptowane', 'Nowe konto zostało przypięte do zaproszonej firmy.')
    return '/settings'
  }

  return (
    <Card className="auth-card">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Załóż konto firmowe</h1>
          <p>Tworzysz nową firmę w układzie company-first. Po starcie możesz od razu wejść do dashboardu i uzupełnić ustawienia firmy.</p>
        </div>
      </div>
      <div className="grid-2">
        <Input label="Nazwa firmy" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="np. Budowlanka Sp. z o.o." />
        <Input label="Imię i nazwisko właściciela" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="np. Jan Kowalski" />
      </div>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@firma.pl" />
        <Input label="NIP" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="opcjonalnie" />
      </div>
      <div style={{ marginTop: 16 }}>
        <Input label="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 8 znaków" />
      </div>
      <PendingInvitesNotice email={email} />
      <div className="actions-row">
        <Button
          loading={loading}
          onClick={async () => {
            const result = registerSchema.safeParse({ email, password, companyName, fullName, nip })
            if (!result.success) {
              const fieldErrors: Record<string, string> = {}
              result.error.errors.forEach((e) => { if (e.path[0]) fieldErrors[String(e.path[0])] = e.message })
              setErrors(fieldErrors)
              const firstMsg = result.error.errors[0]?.message || 'Popraw dane formularza'
              toast.error('Błąd walidacji', firstMsg)
              return
            }
            setErrors({})
            try {
              setLoading(true)
              await authApi.register({ email, password, companyName, fullName, nip })
              if (isDemoMode) {
                registerDemoCompany({ email, companyName, fullName, password, nip })
                const target = await finalizeInviteIfNeeded()
                toast.success('Workspace utworzony', `Firma ${companyName} została zainicjowana w demo.`)
                window.location.assign(target)
              } else {
                toast.success('Konto utworzone', 'Potwierdź maila i zaloguj się do LoftDesk.')
                window.location.assign('/login')
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Spróbuj ponownie.'
              toast.error('Nie udało się utworzyć konta', message)
            } finally {
              setLoading(false)
            }
          }}
        >
          Załóż konto
        </Button>
      </div>
    </Card>
  )
}
