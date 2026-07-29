import { WHATSAPP_NUMBER } from './data'

export function waLink(message: string, number = WHATSAPP_NUMBER): string {
  const digits = number.replace(/\D/g, '') || WHATSAPP_NUMBER
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
