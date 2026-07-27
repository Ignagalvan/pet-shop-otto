export type BusinessShift = {
  start: number
  end: number
  opensAt: string
}

export const BUSINESS_HOURS = {
  timeZone: 'America/Argentina/Cordoba',
  display: '8:30 a 13 h · 16:30 a 20:30 h',
  shifts: [
    { start: 8 * 60 + 30, end: 13 * 60, opensAt: '8:30' },
    { start: 16 * 60 + 30, end: 20 * 60 + 30, opensAt: '16:30' },
  ] satisfies BusinessShift[],
} as const

type BusinessStatus = {
  isOpen: boolean
  nextOpening: string
}

function getLocalMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_HOURS.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)

  return hour * 60 + minute
}

export function getBusinessStatus(date = new Date()): BusinessStatus {
  const minutes = getLocalMinutes(date)
  const isOpen = BUSINESS_HOURS.shifts.some(
    (shift) => minutes >= shift.start && minutes < shift.end,
  )

  if (isOpen) {
    return { isOpen: true, nextOpening: '' }
  }

  const nextShift = BUSINESS_HOURS.shifts.find((shift) => minutes < shift.start)

  return {
    isOpen: false,
    nextOpening: nextShift
      ? `Abrimos hoy a las ${nextShift.opensAt} h.`
      : `Abrimos mañana a las ${BUSINESS_HOURS.shifts[0].opensAt} h.`,
  }
}
