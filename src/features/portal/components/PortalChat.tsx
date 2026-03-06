import { useRef, useState } from 'react'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { Input } from '@/shared/ui/Input/Input'
import { usePortalChat } from '@/features/portal/hooks/usePortalData'
import { useToast } from '@/shared/hooks/useToast'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PortalChat({ token }: { token: string }) {
  const [message, setMessage] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const mutation = usePortalChat(token)
  const toast = useToast()

  async function handleFileChange(file?: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Tylko pliki graficzne', 'Wybierz JPG, PNG lub WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Za duży plik', 'Maksymalny rozmiar to 5 MB.')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setImagePreview(dataUrl)
    setImageName(file.name)
  }

  function clearImage() {
    setImagePreview(null)
    setImageName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSend() {
    if (!message.trim() && !imagePreview) return
    mutation.mutate({ message, imageUrl: imagePreview ?? undefined }, {
      onSuccess: () => {
        setMessage('')
        clearImage()
        toast.success('Wysłano', 'Twoja wiadomość trafiła do wykonawcy.')
      },
      onError: (error) => {
        const msg = error instanceof Error ? error.message : 'Spróbuj ponownie.'
        toast.error('Nie udało się wysłać', msg)
      },
    })
  }

  return (
    <div className="portal-chat">
      {imagePreview ? (
        <div className="portal-chat__preview">
          <img src={imagePreview} alt={imageName} />
          <button className="portal-chat__preview-remove" onClick={clearImage} type="button"><X size={14} /></button>
          <span className="portal-chat__preview-name">{imageName}</span>
        </div>
      ) : null}
      <div className="portal-chat__row">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e.target.files?.[0])} />
        <button className="portal-chat__attach" type="button" onClick={() => fileRef.current?.click()} title="Dodaj zdjęcie (opcjonalnie)">
          <Paperclip size={18} />
        </button>
        <Input label="" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Napisz komentarz do tej wyceny..." onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
        <Button onClick={handleSend} disabled={mutation.isPending}>Wyślij</Button>
      </div>
    </div>
  )
}