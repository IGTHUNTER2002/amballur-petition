import { useContext } from 'react'
import { PetitionContext } from '../context/petition-context'

export function usePetitionDraft() {
  const context = useContext(PetitionContext)
  if (!context) {
    throw new Error('usePetitionDraft must be used inside PetitionProvider')
  }
  return context
}
