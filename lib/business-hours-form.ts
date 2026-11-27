import type { BusinessHours, BusinessShift } from './store-settings'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function readBusinessHoursForm(form: FormData): BusinessHours {
  const days = Array.from({length: 7}, (_, day) => {
    const enabled = form.get(`day-${day}-enabled`) === 'on'
    if (!enabled) return {day, enabled, shifts: []}
    let starts = form.getAll(`day-${day}-start`).map(String)
    let ends = form.getAll(`day-${day}-end`).map(String)
    // Accept a settings page opened before the new editor was deployed.
    if (!starts.length && !ends.length) {
      starts = [String(form.get(`day-${day}-start-1`) ?? '')]
      ends = [String(form.get(`day-${day}-end-1`) ?? '')]
      const secondStart = String(form.get(`day-${day}-start-2`) ?? '')
      const secondEnd = String(form.get(`day-${day}-end-2`) ?? '')
      if (secondStart || secondEnd) { starts.push(secondStart); ends.push(secondEnd) }
    }
    if (!starts.length || starts.length !== ends.length || starts.length > 1440) {
      throw new Error(`Revisá los turnos del ${DAYS[day]}.`)
    }
    const shifts: BusinessShift[] = starts.map((start, index) => {
      const end = ends[index]
      if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end) || start >= end) {
        throw new Error(`Completá apertura y cierre del turno ${index + 1} del ${DAYS[day]}. El cierre debe ser posterior a la apertura.`)
      }
      return {start, end}
    }).sort((a, b) => a.start.localeCompare(b.start))
    if (shifts.some((shift, index) => index > 0 && shifts[index - 1].end > shift.start)) {
      throw new Error(`Los turnos del ${DAYS[day]} no pueden superponerse.`)
    }
    return {day, enabled, shifts}
  })
  return {timeZone: 'America/Argentina/Cordoba', days}
}
