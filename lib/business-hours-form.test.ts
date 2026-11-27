import { describe, expect, it } from 'vitest'
import { readBusinessHoursForm } from './business-hours-form'
import { formatBusinessHours, getBusinessStatus } from './business-hours'
import { parseStoreSettings, type BusinessShift } from './store-settings'

function monday(shifts: BusinessShift[]) {
  const form = new FormData()
  form.set('day-1-enabled', 'on')
  for (const shift of shifts) {
    form.append('day-1-start', shift.start)
    form.append('day-1-end', shift.end)
  }
  return form
}

describe('horarios dinámicos', () => {
  it('permite un único horario corrido sin un segundo turno obligatorio', () => {
    const hours = readBusinessHoursForm(monday([{start:'08:30',end:'20:30'}]))
    expect(hours.days[1].shifts).toHaveLength(1)
    expect(hours.days[0]).toEqual({day:0,enabled:false,shifts:[]})
    expect(getBusinessStatus(hours,new Date('2026-11-23T17:00:00Z')).isOpen).toBe(true)
  })
  it('guarda, normaliza y muestra cuatro turnos sin truncarlos, ordenados por apertura', () => {
    const shifts = [{start:'20:00',end:'22:00'},{start:'08:00',end:'10:00'},{start:'16:00',end:'18:00'},{start:'12:00',end:'14:00'}]
    const saved = readBusinessHoursForm(monday(shifts))
    const parsed = parseStoreSettings({business_hours:JSON.parse(JSON.stringify(saved))}).businessHours
    expect(parsed.days[1].shifts).toHaveLength(4)
    expect(parsed.days[1].shifts[0].start).toBe('08:00')
    expect(formatBusinessHours(parsed)).toContain('20:00 a 22:00 h')
    expect(getBusinessStatus(parsed,new Date('2026-11-24T00:00:00Z')).isOpen).toBe(true) // lunes 21 h en Córdoba
    expect(getBusinessStatus(parsed,new Date('2026-11-23T22:00:00Z')).nextOpening).toContain('hoy a las 20:00')
    expect(getBusinessStatus(parsed,new Date('2026-11-24T01:00:00Z')).isOpen).toBe(false) // cierre exacto
  })
  it('rechaza turnos incompletos, invertidos, inválidos o superpuestos', () => {
    for (const shifts of [
      [{start:'08:00',end:''}], [{start:'10:00',end:'09:00'}], [{start:'25:00',end:'26:00'}],
      [{start:'08:00',end:'13:00'},{start:'12:00',end:'15:00'}],
      [{start:'08:00',end:'13:00'},{start:'08:00',end:'13:00'}],
    ]) expect(() => readBusinessHoursForm(monday(shifts))).toThrow()
  })
  it('admite turnos consecutivos y omite horarios de un día cerrado', () => {
    const form=monday([{start:'08:00',end:'12:00'},{start:'12:00',end:'15:00'}])
    expect(readBusinessHoursForm(form).days[1].shifts).toHaveLength(2)
    form.delete('day-1-enabled')
    form.append('day-1-end','dato inválido descartado al cerrar el día')
    expect(readBusinessHoursForm(form).days[1]).toEqual({day:1,enabled:false,shifts:[]})
  })
  it('acepta formularios antiguos con dos turnos mientras se actualiza la página', () => {
    const form = new FormData()
    form.set('day-1-enabled','on')
    form.set('day-1-start-1','08:30'); form.set('day-1-end-1','13:00')
    form.set('day-1-start-2','16:30'); form.set('day-1-end-2','20:30')
    expect(readBusinessHoursForm(form).days[1].shifts).toHaveLength(2)
  })
  it('no anuncia como abiertos los días intermedios que en realidad están cerrados', () => {
    const form=monday([{start:'08:00',end:'18:00'}])
    form.set('day-5-enabled','on'); form.append('day-5-start','08:00'); form.append('day-5-end','18:00')
    expect(formatBusinessHours(readBusinessHoursForm(form))).toContain('lunes, viernes:')
    expect(formatBusinessHours(readBusinessHoursForm(form))).not.toContain('lunes a viernes')
  })
})
