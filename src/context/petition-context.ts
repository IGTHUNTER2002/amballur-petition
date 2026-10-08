import { createContext } from 'react'
import type { PetitionDraft, ResidentDetails, SubmissionResult } from '../types/petition'

export const emptyResident: ResidentDetails = {
  fullName: '',
  houseName: '',
  wardId: '',
  phone: '',
  locality: '',
  incidentDescription: '',
}

export interface PetitionContextValue {
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

export const PetitionContext = createContext<PetitionContextValue | null>(null)

export const createFreshDraft = (): PetitionDraft => ({
  resident: emptyResident,
  signatureDataUrl: null,
  consent: false,
  turnstileToken: null,
})
