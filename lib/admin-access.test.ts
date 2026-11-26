import { describe, expect, it } from 'vitest'
import { isStaffRole } from './admin-access'

describe('acceso al panel', () => {
  it('permite solamente roles administrativos asignados', () => {
    for (const role of ['owner', 'admin', 'staff']) expect(isStaffRole(role)).toBe(true)
    for (const role of [null, undefined, '', 'customer', 'OWNER', {}, true]) {
      expect(isStaffRole(role)).toBe(false)
    }
  })
})
