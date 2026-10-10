import { describe, expect, it } from 'vitest'
import { residentSchema, submissionSchema } from '../lib/validation'

const wardId = '00000000-0000-4000-8000-000000000016'
const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

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

  it('accepts only an exact 10-digit Indian mobile number', () => {
    const validPhones = ['9876543210', '6789012345']

    for (const phone of validPhones) {
      const result = residentSchema.safeParse({
        fullName: 'Anu Thomas',
        houseName: 'Green Villa',
        wardId,
        phone,
        locality: 'Amballur Junction',
        incidentDescription: '',
      })
      expect(result.success, `Phone format failed: ${phone}`).toBe(true)
      if (result.success) expect(result.data.phone).toBe(phone)
    }
  })

  it('rejects invalid phone numbers', () => {
    const invalidPhones = ['123', '0123456789', '98765', 'abcdefghij', '+919876543210', '09876543210', '98765432101', '5987654321']

    for (const phone of invalidPhones) {
      const result = residentSchema.safeParse({
        fullName: 'Anu Thomas',
        houseName: 'Green Villa',
        wardId,
        phone,
        locality: '',
        incidentDescription: '',
      })
      expect(result.success, `Phone should have failed: ${phone}`).toBe(false)
    }
  })

  it('rejects an invalid ward UUID and empty names', () => {
    const result = residentSchema.safeParse({
      fullName: '   ',
      houseName: '',
      wardId: 'not-a-valid-uuid',
      phone: '',
      locality: '',
      incidentDescription: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path[0])
      expect(issues).toContain('fullName')
      expect(issues).toContain('houseName')
      expect(issues).toContain('wardId')
    }
  })

  it('enforces maximum length limits on fields', () => {
    const result = residentSchema.safeParse({
      fullName: 'A'.repeat(121),
      houseName: 'B'.repeat(161),
      wardId,
      phone: '',
      locality: 'C'.repeat(161),
      incidentDescription: 'D'.repeat(1201),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path[0])
      expect(issues).toContain('fullName')
      expect(issues).toContain('houseName')
      expect(issues).toContain('locality')
      expect(issues).toContain('incidentDescription')
    }
  })

  it('validates a complete submission payload successfully', () => {
    const result = submissionSchema.safeParse({
      fullName: 'Anu Thomas',
      houseName: 'Green Villa',
      wardId,
      phone: '9876543210',
      locality: 'Amballur West',
      incidentDescription: 'Multiple stray dogs observed near school junction.',
      signatureDataUrl: validSignature,
      consent: true,
      petitionVersionId: '00000000-0000-4000-8000-000000000002',
      idempotencyKey: '00000000-0000-4000-8000-000000000099',
      locale: 'en',
    })
    expect(result.success).toBe(true)
  })

  it('requires a PNG image signature and affirmative consent at submission time', () => {
    const result = submissionSchema.safeParse({
      fullName: 'Anu Thomas',
      houseName: 'Green Villa',
      wardId,
      phone: '',
      locality: '',
      incidentDescription: '',
      signatureDataUrl: 'data:image/jpeg;base64,invalid',
      consent: false,
      petitionVersionId: '00000000-0000-4000-8000-000000000002',
      idempotencyKey: '00000000-0000-4000-8000-000000000099',
      locale: 'ml',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path[0])
      expect(issues).toContain('signatureDataUrl')
      expect(issues).toContain('consent')
    }
  })
})

