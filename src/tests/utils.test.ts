import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, toDataUrlSize } from '../lib/utils'

describe('utility helper functions', () => {
  it('correctly calculates approximate byte size from data URL length', () => {
    const empty = ''
    expect(toDataUrlSize(empty)).toBe(0)

    const sampleString = 'A'.repeat(100)
    expect(toDataUrlSize(sampleString)).toBe(75)
  })

  it('formats dates consistently in en-IN and ml-IN locales', () => {
    const testDate = '2026-10-08T10:00:00.000Z'
    const formattedEn = formatDate(testDate, 'en-IN')
    expect(formattedEn).toContain('2026')

    const formattedMl = formatDate(testDate, 'ml-IN')
    expect(formattedMl.length).toBeGreaterThan(0)
  })

  it('formats date and time accurately', () => {
    const testDate = '2026-10-08T10:30:00.000Z'
    const formatted = formatDateTime(testDate)
    expect(formatted).toContain('2026')
  })
})
