import { useCallback } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'

interface UseCrudSubmitOptions<T, TInput> {
  createMutation: UseMutationResult<T, Error, TInput, unknown>
  updateMutation: UseMutationResult<T, Error, { id: string; input: TInput }, unknown>
  editing: T & { id: string } | null
  onSuccess?: () => void
}

/**
 * Custom hook to handle CRUD submit logic
 * Consolidates duplicated submit handlers across feature pages
 */
export function useCrudSubmit<T, TInput>({
  createMutation,
  updateMutation,
  editing,
  onSuccess,
}: UseCrudSubmitOptions<T, TInput>) {
  return useCallback(
    async (input: TInput) => {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      onSuccess?.()
    },
    [editing, createMutation, updateMutation, onSuccess]
  )
}
