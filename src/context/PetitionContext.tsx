import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PetitionDraft, ResidentDetails, SubmissionResult } from '../types/petition'

const emptyResident: ResidentDetails = {
  fullName: '',
  houseName: '',
  wardId: '',
  phone: '',
  locality: '',
  incidentDescription: '',
}

interface PetitionContextValue {
  draft: PetitionDraft
  idempotencyKey: string
  confirmation: SubmissionResult | null
  updateResident: (update: Partial<ResidentDetails>) => void
  setSignature: (signatureDataUrl: string | null) => void
  setConsent: (consent: boolean) => void
  setTurnstileToken: (token: string | null) => void
  recordConfirmation: (confirmation: SubmissionResult) => void
  reset: () => void
}

const PetitionContext = createContext<PetitionContextValue | null>(null)

const createFreshDraft = (): PetitionDraft => ({
  resident: emptyResident,
  signatureDataUrl: null,
  consent: false,
  turnstileToken: null,
})

export function PetitionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PetitionDraft>(createFreshDraft)
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const [confirmation, setConfirmation] = useState<SubmissionResult | null>(null)

  const value = useMemo<PetitionContextValue>(
    () => ({
      draft,
      idempotencyKey,
      confirmation,
      updateResident: (update) => setDraft((current) => ({ ...current, resident: { ...current.resident, ...update } })),
      setSignature: (signatureDataUrl) => setDraft((current) => ({ ...current, signatureDataUrl })),
      setConsent: (consent) => setDraft((current) => ({ ...current, consent })),
      setTurnstileToken: (turnstileToken) => setDraft((current) => ({ ...current, turnstileToken })),
      recordConfirmation: (nextConfirmation) => setConfirmation(nextConfirmation),
      reset: () => {
        setDraft(createFreshDraft())
        setIdempotencyKey(crypto.randomUUID())
        setConfirmation(null)
      },
    }),
    [confirmation, draft, idempotencyKey],
  )

  return <PetitionContext.Provider value={value}>{children}</PetitionContext.Provider>
}

export function usePetitionDraft() {
  const context = useContext(PetitionContext)
  if (!context) {
    throw new Error('usePetitionDraft must be used inside PetitionProvider')
  }
  return context
}
