import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PetitionDraft, SubmissionResult } from '../types/petition'
import {
  PetitionContext,
  createFreshDraft,
  type PetitionContextValue,
} from './petition-context'

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
