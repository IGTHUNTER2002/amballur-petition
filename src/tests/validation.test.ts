import { describe, expect, it } from 'vitest'
import { residentSchema, submissionSchema } from '../lib/validation'

const wardId = '00000000-0000-4000-8000-000000000016'

describe('resident submission validation', () => {
  it('accepts the minimal required resident fields', () => {
    const result = residentSchema.safeParse({
      fullName: 'Anu Thomas',
      houseName: 'Green Villa',
      wardId,
      phone: '',
      locality: '',
      incidentDescription: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid ward and phone number', () => {
    const result = residentSchema.safeParse({
      fullName: 'Anu Thomas',
      houseName: 'Green Villa',
      wardId: 'not-a-ward',
      phone: '123',
      locality: '',
      incidentDescription: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires an image signature and affirmative consent at submission time', () => {
    const result = submissionSchema.safeParse({
      fullName: 'Anu Thomas',
      houseName: 'Green Villa',
      wardId,
      phone: '',
      locality: '',
      incidentDescription: '',
      signatureDataUrl: '',
      consent: false,
      petitionVersionId: '00000000-0000-4000-8000-000000000002',
      idempotencyKey: '00000000-0000-4000-8000-000000000099',
    })
    expect(result.success).toBe(false)
  })
})
