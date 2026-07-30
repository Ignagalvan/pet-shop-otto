export const PAYMENT_METHODS = [
  'local',
  'transferencia',
  'entrega',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type BusinessShift = {
  start: string
  end: string
}

export type BusinessDay = {
  day: number
  enabled: boolean
  shifts: BusinessShift[]
}

export type BusinessHours = {
  timeZone: string
  days: BusinessDay[]
}

export type StoreSettings = {
  instagram: string
  whatsappNumber: string
  address: string
  email: string
  businessHours: BusinessHours
  deliveryEnabled: boolean
  pickupEnabled: boolean
  shippingCost: number
  freeShippingThreshold: number | null
  paymentMethods: PaymentMethod[]
  transferAlias: string
  transferHolder: string
  transferBank: string
  transferCbu: string
  transferInstructions: string
  closedStoreMessage: string
}

const DEFAULT_SHIFTS: BusinessShift[] = [
  { start: '08:30', end: '13:00' },
  { start: '16:30', end: '20:30' },
]

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  instagram: 'pet_shop.otto',
  whatsappNumber: '5491100000000',
  address: 'General Paz 62, Salsipuedes, Córdoba',
  email: '',
  businessHours: {
    timeZone: 'America/Argentina/Cordoba',
    days: Array.from({ length: 7 }, (_, day) => ({
      day,
      enabled: day !== 0,
      shifts: day === 0 ? [] : DEFAULT_SHIFTS.map((shift) => ({ ...shift })),
    })),
  },
  deliveryEnabled: true,
  pickupEnabled: true,
  shippingCost: 4500,
  freeShippingThreshold: 40000,
  paymentMethods: [...PAYMENT_METHODS],
  transferAlias: '',
  transferHolder: '',
  transferBank: '',
  transferCbu: '',
  transferInstructions:
    'Después de transferir, enviá el comprobante por WhatsApp.',
  closedStoreMessage:
    'Podés hacer tu pedido con normalidad y lo vamos a preparar apenas abramos.',
}

type StoreSettingsRow = {
  instagram?: unknown
  whatsapp_number?: unknown
  address?: unknown
  email?: unknown
  business_hours?: unknown
  delivery_enabled?: unknown
  pickup_enabled?: unknown
  shipping_cost?: unknown
  free_shipping_threshold?: unknown
  payment_methods?: unknown
  transfer_alias?: unknown
  transfer_holder?: unknown
  transfer_bank?: unknown
  transfer_cbu?: unknown
  transfer_instructions?: unknown
  closed_store_message?: unknown
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function validShift(value: unknown): value is BusinessShift {
  if (!value || typeof value !== 'object') return false
  const shift = value as Record<string, unknown>
  return (
    typeof shift.start === 'string' &&
    typeof shift.end === 'string' &&
    TIME_PATTERN.test(shift.start) &&
    TIME_PATTERN.test(shift.end) &&
    shift.start < shift.end
  )
}

function normalizeBusinessHours(value: unknown): BusinessHours {
  if (!value || typeof value !== 'object') {
    return DEFAULT_STORE_SETTINGS.businessHours
  }

  const candidate = value as Record<string, unknown>
  if (!Array.isArray(candidate.days)) {
    return DEFAULT_STORE_SETTINGS.businessHours
  }
  const candidateDays = candidate.days as unknown[]

  const days = Array.from({ length: 7 }, (_, day) => {
    const source = candidateDays.find(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        Number((entry as Record<string, unknown>).day) === day,
    ) as Record<string, unknown> | undefined

    const shifts = Array.isArray(source?.shifts)
      ? source.shifts.filter(validShift).slice(0, 2)
      : []

    return {
      day,
      enabled: source?.enabled === true && shifts.length > 0,
      shifts,
    }
  })

  return {
    timeZone:
      typeof candidate.timeZone === 'string' && candidate.timeZone
        ? candidate.timeZone
        : DEFAULT_STORE_SETTINGS.businessHours.timeZone,
    days,
  }
}

function money(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, '')
}

export function whatsappDisplay(value: string) {
  const digits = normalizeWhatsappNumber(value)
  if (digits.startsWith('549') && digits.length > 10) {
    return `+54 9 ${digits.slice(3)}`
  }
  return digits ? `+${digits}` : 'WhatsApp no configurado'
}

export function normalizeInstagram(value: string) {
  return value.trim().replace(/^@/, '')
}

export function parseStoreSettings(rowInput?: unknown): StoreSettings {
  if (!rowInput || typeof rowInput !== 'object') {
    return DEFAULT_STORE_SETTINGS
  }
  const row = rowInput as StoreSettingsRow

  const methods = Array.isArray(row.payment_methods)
    ? row.payment_methods.filter((method): method is PaymentMethod =>
        PAYMENT_METHODS.includes(method as PaymentMethod),
      )
    : []

  const freeShipping = Number(row.free_shipping_threshold)

  return {
    instagram:
      typeof row.instagram === 'string'
        ? normalizeInstagram(row.instagram)
        : DEFAULT_STORE_SETTINGS.instagram,
    whatsappNumber:
      typeof row.whatsapp_number === 'string'
        ? normalizeWhatsappNumber(row.whatsapp_number)
        : DEFAULT_STORE_SETTINGS.whatsappNumber,
    address:
      typeof row.address === 'string'
        ? row.address
        : DEFAULT_STORE_SETTINGS.address,
    email: typeof row.email === 'string' ? row.email : '',
    businessHours: normalizeBusinessHours(row.business_hours),
    deliveryEnabled:
      typeof row.delivery_enabled === 'boolean'
        ? row.delivery_enabled
        : DEFAULT_STORE_SETTINGS.deliveryEnabled,
    pickupEnabled:
      typeof row.pickup_enabled === 'boolean'
        ? row.pickup_enabled
        : DEFAULT_STORE_SETTINGS.pickupEnabled,
    shippingCost: money(
      row.shipping_cost,
      DEFAULT_STORE_SETTINGS.shippingCost,
    ),
    freeShippingThreshold:
      Number.isFinite(freeShipping) && freeShipping > 0 ? freeShipping : null,
    paymentMethods:
      methods.length > 0
        ? methods
        : DEFAULT_STORE_SETTINGS.paymentMethods,
    transferAlias:
      typeof row.transfer_alias === 'string' ? row.transfer_alias.trim() : '',
    transferHolder:
      typeof row.transfer_holder === 'string' ? row.transfer_holder.trim() : '',
    transferBank:
      typeof row.transfer_bank === 'string' ? row.transfer_bank.trim() : '',
    transferCbu:
      typeof row.transfer_cbu === 'string' ? row.transfer_cbu.trim() : '',
    transferInstructions:
      typeof row.transfer_instructions === 'string' &&
      row.transfer_instructions.trim()
        ? row.transfer_instructions.trim()
        : DEFAULT_STORE_SETTINGS.transferInstructions,
    closedStoreMessage:
      typeof row.closed_store_message === 'string' &&
      row.closed_store_message.trim()
        ? row.closed_store_message.trim()
        : DEFAULT_STORE_SETTINGS.closedStoreMessage,
  }
}

export function calculateShipping(
  subtotal: number,
  settings: StoreSettings,
  fulfillment: 'envio' | 'retiro' = 'envio',
) {
  if (fulfillment === 'retiro') return 0
  if (
    settings.freeShippingThreshold !== null &&
    subtotal >= settings.freeShippingThreshold
  ) {
    return 0
  }
  return settings.shippingCost
}
