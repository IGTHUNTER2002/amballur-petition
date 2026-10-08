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

describe('service behavior in development sandbox mode', () => {
  it('throws SubmissionError if resident draft fails validation', async () => {
    const invalidDraft = { ...emptyDraft, consent: false }
    await expect(
      submitPetition(previewPetition, invalidDraft, '00000000-0000-4000-8000-000000000001', 'en'),
    ).rejects.toThrow(SubmissionError)
  })

  it('safely provides simulated submission response in development sandbox mode', async () => {
    const result = await submitPetition(previewPetition, emptyDraft, '00000000-0000-4000-8000-000000000001', 'en')
    expect(result.reference).toMatch(/^AMB-2026-DEMO\d{4}$/)
    expect(result.submittedAt).toBeDefined()
  })

  it('provides demo dashboard metrics with valid figures and charts', async () => {
    const metrics = await getDashboardMetrics()
    expect(metrics.validSignatures).toBeGreaterThan(0)
    expect(metrics.byWard.length).toBeGreaterThan(0)
    expect(metrics.byDay.length).toBeGreaterThan(0)
  })

  it('provides filtered and paginated demo submissions', async () => {
    const data = await getAdminSubmissions('Anu', '', 1)
    expect(data.total).toBeGreaterThan(0)
    expect(data.items[0].residentName).toContain('Anu')
  })

  it('resolves demo admin profile for demo-admin-uuid and rejects unknown users', async () => {
    const demoUser = { id: 'demo-admin-uuid', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
    const profile = await getAdminProfile(demoUser)
    expect(profile?.displayName).toBe('Demo Administrator')

    const unknownUser = { id: 'unknown-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' }
    await expect(getAdminProfile(unknownUser)).rejects.toThrow(AdminServiceError)
  })
})
