import { describe, expect, it } from 'vitest'
import { submitPetition, SubmissionError } from '../services/submission-service'
import {
  demoAdminProfile,
  getDemoDashboardMetrics,
  getDemoAdminSubmissions,
  updateDemoSubmissionReview,
} from '../services/demo-data'
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

  it('provides demo dashboard metrics with valid figures and charts', async () => {
    const metrics = await getDemoDashboardMetrics()
    expect(metrics.validSignatures).toBeGreaterThan(0)
    expect(metrics.byWard.length).toBeGreaterThan(0)
    expect(metrics.byDay.length).toBeGreaterThan(0)
  })

  it('provides filtered and paginated demo submissions', async () => {
    const data = await getDemoAdminSubmissions('Anu', '', 1)
    expect(data.total).toBeGreaterThan(0)
    expect(data.items[0].residentName).toContain('Anu')
  })

  it('updates demo submission review status in sandbox mode', () => {
    updateDemoSubmissionReview('00000000-0000-4000-8000-000000000101', 'needs_review')
    const data = getDemoAdminSubmissions('Anu', '', 1)
    expect(data.items[0].reviewStatus).toBe('needs_review')
  })

  it('provides configured demo admin profile for demo-admin-uuid', () => {
    expect(demoAdminProfile.id).toBe('demo-admin-uuid')
    expect(demoAdminProfile.displayName).toBe('Demo Administrator')
    expect(demoAdminProfile.isPrimary).toBe(true)
  })
})
