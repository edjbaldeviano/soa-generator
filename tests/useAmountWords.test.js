import { describe, it, expect } from 'vitest'
import { amountToWords } from '../src/composables/useAmountWords.js'

describe('amountToWords', () => {
  it('converts a PHP amount in the thousands', () => {
    expect(amountToWords(5398, 'PHP')).toBe('FIVE THOUSAND THREE HUNDRED NINETY EIGHT PESOS ONLY')
  })

  it('converts a larger PHP amount across thousands and hundreds', () => {
    expect(amountToWords(62769, 'PHP')).toBe('SIXTY TWO THOUSAND SEVEN HUNDRED SIXTY NINE PESOS ONLY')
  })

  it('converts a PHP amount with round thousands and a teen remainder', () => {
    expect(amountToWords(3020, 'PHP')).toBe('THREE THOUSAND TWENTY PESOS ONLY')
  })

  it('converts a PHP amount with an exact thousand', () => {
    expect(amountToWords(19995, 'PHP')).toBe('NINETEEN THOUSAND NINE HUNDRED NINETY FIVE PESOS ONLY')
  })

  it('converts a USD amount', () => {
    expect(amountToWords(3773, 'USD')).toBe('THREE THOUSAND SEVEN HUNDRED SEVENTY THREE DOLLARS ONLY')
  })

  it('converts a USD amount ending in an even hundred', () => {
    expect(amountToWords(2840, 'USD')).toBe('TWO THOUSAND EIGHT HUNDRED FORTY DOLLARS ONLY')
  })

  it('converts a hundreds-only amount', () => {
    expect(amountToWords(500, 'PHP')).toBe('FIVE HUNDRED PESOS ONLY')
  })

  it('converts a teen number', () => {
    expect(amountToWords(15, 'PHP')).toBe('FIFTEEN PESOS ONLY')
  })

  it('converts a million amount', () => {
    expect(amountToWords(1500000, 'PHP')).toBe('ONE MILLION FIVE HUNDRED THOUSAND PESOS ONLY')
  })

  it('returns ZERO for 0', () => {
    expect(amountToWords(0, 'PHP')).toBe('ZERO PESOS ONLY')
    expect(amountToWords(0, 'USD')).toBe('ZERO DOLLARS ONLY')
  })

  it('truncates decimal part (uses floor of whole number)', () => {
    expect(amountToWords(62769.99, 'PHP')).toBe('SIXTY TWO THOUSAND SEVEN HUNDRED SIXTY NINE PESOS ONLY')
  })
})
