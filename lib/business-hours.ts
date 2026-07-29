import {
  DEFAULT_STORE_SETTINGS,
  type BusinessHours,
  type BusinessShift,
} from './store-settings'

type BusinessStatus = {
  isOpen: boolean
  nextOpening: string
}
const DAY_LABELS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    weekday ?? '',
  )
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)

  return { day: Math.max(0, day), minutes: hour * 60 + minute }
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function displayTime(value: string) {
  return value.replace(/^0/, '')
}

export function getBusinessStatus(
  hours: BusinessHours = DEFAULT_STORE_SETTINGS.businessHours,
  date = new Date(),
): BusinessStatus {
  const local = localParts(date, hours.timeZone)
  const today = hours.days.find((day) => day.day === local.day)
  const isOpen = Boolean(
    today?.enabled &&
      today.shifts.some(
        (shift) =>
          local.minutes >= toMinutes(shift.start) &&
          local.minutes < toMinutes(shift.end),
      ),
  )

  if (isOpen) return { isOpen: true, nextOpening: '' }

  for (let offset = 0; offset < 8; offset += 1) {
    const dayNumber = (local.day + offset) % 7
    const schedule = hours.days.find((day) => day.day === dayNumber)
    if (!schedule?.enabled) continue

    const shift =
      offset === 0
        ? schedule.shifts.find(
            (candidate) => local.minutes < toMinutes(candidate.start),
          )
        : schedule.shifts[0]

    if (!shift) continue

    const when =
      offset === 0
        ? 'hoy'
        : offset === 1
          ? 'mañana'
          : `el ${DAY_LABELS[dayNumber]}`

    return {
      isOpen: false,
      nextOpening: `Abrimos ${when} a las ${displayTime(shift.start)} h.`,
    }
  }

  return {
    isOpen: false,
    nextOpening: 'Consultanos por WhatsApp para coordinar.',
  }
}

function shiftsKey(shifts: BusinessShift[]) {
  return shifts.map((shift) => `${shift.start}-${shift.end}`).join('|')
}

function shiftsLabel(shifts: BusinessShift[]) {
  return shifts
    .map(
      (shift) =>
        `${displayTime(shift.start)} a ${displayTime(shift.end)} h`,
    )
    .join(' · ')
}

export function formatBusinessHours(hours: BusinessHours) {
  const openDays = hours.days.filter((day) => day.enabled && day.shifts.length)
  if (!openDays.length) return 'Horarios a confirmar'

  const groups = new Map<string, number[]>()
  for (const day of openDays) {
    const key = shiftsKey(day.shifts)
    groups.set(key, [...(groups.get(key) ?? []), day.day])
  }

  return [...groups.entries()]
    .map(([key, days]) => {
      const schedule = openDays.find(
        (day) => shiftsKey(day.shifts) === key,
      )!
      const dayLabel =
        days.length === 1
          ? DAY_LABELS[days[0]]
          : `${DAY_LABELS[days[0]]} a ${DAY_LABELS[days.at(-1)!]}`
      return `${dayLabel}: ${shiftsLabel(schedule.shifts)}`
    })
    .join(' · ')
}
