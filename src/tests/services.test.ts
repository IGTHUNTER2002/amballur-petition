import { describe, expect, it } from 'vitest'
import { submitPetition, SubmissionError } from '../services/submission-service'
import {
  getAdminProfile,
  getDashboardMetrics,
  getAdminSubmissions,
  AdminServiceError,
} from '../services/admin-service'
import { previewPetition } from '../i18n/preview-petition'
import type { PetitionDraft } from '../types/petition'

const emptyDraft: PetitionDraft = {
  resident: {
    fullName: 'Anu Thomas',
    houseName: 'Green Villa',
    wardId: '00000000-0000-4000-8000-000000000016',
    phone: '9876543210',
    locality: 'Amballur',
    incidentDescription: '',
  },
  signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  consent: true,
  turnstileToken: null,
}

describe('service error handling when unconfigured', () => {
  it('throws SubmissionError when Supabase is not configured', async () => {
    await expect(
      submitPetition(previewPetition, emptyDraft, '00000000-0000-4000-8000-000000000001', 'en'),
    ).rejects.toThrow(SubmissionError)
  })

  it('throws AdminServiceError on getAdminProfile when Supabase is not configured', async () => {
    const mockUser = { id: '00000000-0000-4000-8000-000000000001', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
    await expect(getAdminProfile(mockUser)).rejects.toThrow(AdminServiceError)
  })

  it('throws AdminServiceError on getDashboardMetrics when Supabase is not configured', async () => {
    await expect(getDashboardMetrics()).rejects.toThrow(AdminServiceError)
  })

  it('throws AdminServiceError on getAdminSubmissions when Supabase is not configured', async () => {
    await expect(getAdminSubmissions('', '', 1)).rejects.toThrow(AdminServiceError)
  })
})
