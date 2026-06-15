import { describe, it, expect } from 'vitest'
import { formatDate, formatAmount } from '../src/composables/useDocxGenerator.js'

describe('formatDate', () => {
  it('formats an ISO date string to uppercase month DD, YYYY', () => {
    expect(formatDate('2026-05-26')).toBe('MAY 26, 2026')
    expect(formatDate('2026-01-09')).toBe('JANUARY 9, 2026')
    expect(formatDate('2024-10-09')).toBe('OCTOBER 9, 2024')
    expect(formatDate('2026-11-03')).toBe('NOVEMBER 3, 2026')
  })

  it('handles double-digit days', () => {
    expect(formatDate('2026-06-15')).toBe('JUNE 15, 2026')
  })
})

describe('formatAmount', () => {
  it('formats a number with two decimal places and thousand separators', () => {
    expect(formatAmount(62769)).toBe('62,769.00')
    expect(formatAmount(500)).toBe('500.00')
    expect(formatAmount(7893)).toBe('7,893.00')
    expect(formatAmount(1620.5)).toBe('1,620.50')
    expect(formatAmount(0)).toBe('0.00')
  })
})
