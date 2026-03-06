import { useCallback, useState } from 'react'

/**
 * Custom hook to manage modal state for CRUD operations
 * Consolidates duplicated modal state management across feature pages
 */
export function useModalState<T>() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)

  const openCreate = useCallback(() => {
    setEditing(null)
    setOpen(true)
  }, [])

  const openEdit = useCallback((item: T) => {
    setEditing(item)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setEditing(null)
  }, [])

  return {
    open,
    editing,
    openCreate,
    openEdit,
    close,
    setOpen,
    setEditing,
  }
}
