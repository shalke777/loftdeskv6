import { useToastContext } from '@/app/providers'

export function ToastViewport() {
  const { items, remove } = useToastContext()

  return (
    <div className="toast-viewport" role="status" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.variant}`} role="alert">
          <div>
            <strong>{item.title}</strong>
            {item.description ? <div>{item.description}</div> : null}
          </div>
          <button className="toast__close" onClick={() => remove(item.id)} aria-label="Zamknij powiadomienie">×</button>
        </div>
      ))}
    </div>
  )
}
