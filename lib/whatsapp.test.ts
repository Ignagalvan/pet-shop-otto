import { describe, expect, it } from 'vitest'
import { argentinaWhatsappNumber } from './whatsapp'

describe('argentinaWhatsappNumber', () => {
  it('conserva un número argentino completo', () => {
    expect(argentinaWhatsappNumber('+54 9 351 225 6936')).toBe(
      '5493512256936',
    )
  })

  it('completa el prefijo argentino en números locales', () => {
    expect(argentinaWhatsappNumber('11 2345 6789')).toBe('5491123456789')
    expect(argentinaWhatsappNumber('351 225 6936')).toBe('5493512256936')
  })
})
