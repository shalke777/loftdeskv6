import { ReactNode, useEffect, useRef } from 'react'
import clsx from 'clsx'

interface Props {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ title, open, onClose, children, size = 'lg', className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const el = panelRef.current
    if (el) {
      const first = el.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !el) return
      const nodes = el.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div ref={panelRef} className={clsx('modal', `modal--${size}`, className)} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Zamknij">×</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
