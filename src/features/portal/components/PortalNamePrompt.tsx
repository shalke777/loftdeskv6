import { useState } from 'react'
import { Card } from '@/shared/ui/Card/Card'
import { Input } from '@/shared/ui/Input/Input'
import { Button } from '@/shared/ui/Button/Button'

export function PortalNamePrompt({
  initialValue,
  onSave,
  loading = false,
}: {
  initialValue: string
  onSave: (value: string) => void
  loading?: boolean
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <Card>
      <h3>Jak mamy Cię podpisać?</h3>
      <p>To imię/nazwa będzie widoczne przy Twoich wiadomościach i akceptacjach w portalu.</p>
      <div className="actions-row">
        <div style={{ flex: 1 }}>
          <Input label="Imię / nazwa (widoczne w portalu)" value={value} onChange={(e) => setValue(e.target.value)} placeholder="np. Jan Kowalski / Firma XYZ" />
        </div>
        <Button loading={loading} onClick={() => onSave(value)}>Zapisz</Button>
      </div>
    </Card>
  )
}