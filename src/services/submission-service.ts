import { supabase } from '../lib/supabase'
import { isSupabaseConfigured } from '../lib/env'
import { submissionSchema } from '../lib/validation'
import type { PetitionDraft, PublicPetition, SubmissionResult } from '../types/petition'

export class SubmissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubmissionError'
  }
}

export async function submitPetition(
  petition: PublicPetition,
  draft: PetitionDraft,
  idempotencyKey: string,
  locale: 'en' | 'ml',
): Promise<SubmissionResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new SubmissionError('Secure submission is unavailable until this site is connected to Supabase.')
  }

  const parsed = submissionSchema.safeParse({
    ...draft.resident,
    signatureDataUrl: draft.signatureDataUrl,
    consent: draft.consent,
    petitionVersionId: petition.versionId,
    idempotencyKey,
    locale,
    turnstileToken: draft.turnstileToken ?? undefined,
  })

  if (!parsed.success) {
    throw new SubmissionError(parsed.error.issues[0]?.message ?? 'Please review the form before submitting.')
  }

  const { data, error } = await supabase.functions.invoke('submit-petition', {
    body: parsed.data,
    headers: { 'X-Idempotency-Key': idempotencyKey },
  })

  if (error) {
    throw new SubmissionError('We could not submit your signature. Please check your connection and try again.')
  }

  const result = data as Partial<SubmissionResult>
  if (!result.reference || !result.submittedAt) {
    throw new SubmissionError('The submission service returned an invalid response. Please try again.')
  }

  return { reference: result.reference, submittedAt: result.submittedAt }
}
