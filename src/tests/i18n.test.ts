import { describe, expect, it } from 'vitest'
import { copy, localize } from '../i18n/copy'
import { previewPetition } from '../i18n/preview-petition'

describe('i18n and localization completeness', () => {
  it('has non-empty English and Malayalam translations for all top-level copy keys', () => {
    expect(copy.petition.en.length).toBeGreaterThan(0)
    expect(copy.petition.ml.length).toBeGreaterThan(0)
    expect(copy.continue.en.length).toBeGreaterThan(0)
    expect(copy.continue.ml.length).toBeGreaterThan(0)
    expect(copy.signature.title.en.length).toBeGreaterThan(0)
    expect(copy.signature.title.ml.length).toBeGreaterThan(0)
    expect(copy.signature.consent.en.length).toBeGreaterThan(0)
    expect(copy.signature.consent.ml.length).toBeGreaterThan(0)
    expect(copy.review.submit.en.length).toBeGreaterThan(0)
    expect(copy.review.submit.ml.length).toBeGreaterThan(0)
    expect(copy.confirmation.shareText.en.length).toBeGreaterThan(0)
    expect(copy.confirmation.shareText.ml.length).toBeGreaterThan(0)
  })

  it('correctly resolves text via localize helper for both locales', () => {
    const bilingual = {
      en: 'Amballur Grama Panchayat',
      ml: 'അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
    }
    expect(localize(bilingual, 'en')).toBe('Amballur Grama Panchayat')
    expect(localize(bilingual, 'ml')).toBe('അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്ത്')
  })

  it('contains parallel English and Malayalam action items in the preview petition', () => {
    expect(previewPetition.requestedActions.length).toBeGreaterThan(0)
    for (const action of previewPetition.requestedActions) {
      expect(action.en.trim().length).toBeGreaterThan(10)
      expect(action.ml.trim().length).toBeGreaterThan(10)
    }
  })
})
