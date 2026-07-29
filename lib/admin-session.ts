export const ADMIN_DAY_COOKIE = 'otto-admin-day'
export const ADMIN_TIME_ZONE = 'America/Argentina/Cordoba'

const adminDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ADMIN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getAdminDay(value: Date | string | number = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = adminDayFormatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return year && month && day ? `${year}-${month}-${day}` : null
}

export function isAdminLoginFromToday(
  lastSignInAt: string | null | undefined,
  now: Date = new Date(),
) {
  if (!lastSignInAt) return false
  return getAdminDay(lastSignInAt) === getAdminDay(now)
}

export function adminDayCookieValue(day: string, sessionId: string) {
  return `${day}.${sessionId}`
}
