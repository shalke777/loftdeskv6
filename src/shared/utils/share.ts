/**
 * shareDoc — wysyła wycenę do klienta przez Web Share API (natywny sheet na mobile)
 * lub fallback: mailto link w przeglądarce.
 */
export async function shareDoc({
  title,
  text,
  url,
  email,
}: {
  title: string
  text: string
  url?: string
  email?: string
}): Promise<boolean> {
  const fullText = url ? `${text}\n\n${url}` : text

  // Natywny share sheet (mobile PWA / Android / iOS Safari)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: fullText, url })
      return true
    } catch {
      // anulowane przez użytkownika — nie traktuj jako błąd
      return false
    }
  }

  // Fallback: otwórz okno mailto
  const subject = encodeURIComponent(title)
  const body = encodeURIComponent(fullText)
  const to = email ? encodeURIComponent(email) : ''
  window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank')
  return true
}

/**
 * copyToClipboard — kopiuj tekst do schowka z fallbackiem przez execCommand.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // fallback legacy
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}
