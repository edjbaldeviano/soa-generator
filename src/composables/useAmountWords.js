const ONES = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN',
  'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
]
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']

function convertHundreds(n) {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')
  return ONES[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convertHundreds(n % 100) : '')
}

export function amountToWords(amount, currency = 'PHP') {
  const whole = Math.floor(amount)
  const suffix = currency === 'USD' ? 'DOLLARS ONLY' : 'PESOS ONLY'

  if (whole === 0) return 'ZERO ' + suffix

  const parts = []
  if (whole >= 1000000) parts.push(convertHundreds(Math.floor(whole / 1000000)) + ' MILLION')
  if (whole % 1000000 >= 1000) parts.push(convertHundreds(Math.floor((whole % 1000000) / 1000)) + ' THOUSAND')
  if (whole % 1000 > 0) parts.push(convertHundreds(whole % 1000))

  return parts.join(' ') + ' ' + suffix
}
