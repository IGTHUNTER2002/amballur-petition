import { isDevelopmentPreview, isSupabaseConfigured, supabaseUrl } from '../lib/env'
import { previewPetition } from '../i18n/preview-petition'
import type { PublicPetition } from '../types/petition'

class PetitionServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PetitionServiceError'
  }
}

export async function getPublishedPetition(): Promise<PublicPetition> {
  if (!isSupabaseConfigured || !supabaseUrl) {
    if (isDevelopmentPreview) return previewPetition
    throw new PetitionServiceError('The petition service has not been configured.')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/get-public-petition`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new PetitionServiceError('The published petition could not be loaded. Please try again later.')
  }

  return (await response.json()) as PublicPetition
}

export { PetitionServiceError }
