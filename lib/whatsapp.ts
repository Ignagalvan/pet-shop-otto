import { WHATSAPP_NUMBER } from './data'

export function waLink(message: string, number = WHATSAPP_NUMBER): string {
  const digits = number.replace(/\D/g, '') || WHATSAPP_NUMBER
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function argentinaWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('549')) return digits
  if (digits.startsWith('54')) return `549${digits.slice(2)}`

  const local = digits.replace(/^0/, '')
  return local.length >= 9 && local.length <= 11 ? `549${local}` : local
}
