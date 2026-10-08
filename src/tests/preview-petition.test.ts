import { describe, expect, it } from 'vitest'
import { previewPetition } from '../i18n/preview-petition'

describe('Amballur preview petition', () => {
  it('starts with Amballur and Ward 16 configuration', () => {
    expect(previewPetition.panchayatName.en).toBe('Amballur Grama Panchayat')
    expect(previewPetition.wards).toEqual([
      expect.objectContaining({ number: '16', name: 'Ward 16' }),
    ])
  })
})
