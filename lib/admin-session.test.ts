import { describe, expect, it } from 'vitest'
import {
  adminDayCookieValue,
  getAdminDay,
  isAdminLoginFromToday,
} from './admin-session'

describe('sesión administrativa diaria', () => {
  it('usa el día de Córdoba aunque la fecha esté expresada en UTC', () => {
    expect(getAdminDay('2026-07-30T02:30:00.000Z')).toBe('2026-07-29')
    expect(getAdminDay('2026-07-30T03:30:00.000Z')).toBe('2026-07-30')
  })

  it('acepta un login del mismo día y rechaza uno del día anterior', () => {
    const now = new Date('2026-07-30T15:00:00.000Z')

    expect(isAdminLoginFromToday('2026-07-30T11:00:00.000Z', now)).toBe(true)
    expect(isAdminLoginFromToday('2026-07-29T11:00:00.000Z', now)).toBe(false)
    expect(isAdminLoginFromToday(null, now)).toBe(false)
  })

  it('vincula la marca diaria con la sesión autenticada', () => {
    expect(adminDayCookieValue('2026-07-30', 'sesion-123')).toBe(
      '2026-07-30.sesion-123',
    )
  })
})
