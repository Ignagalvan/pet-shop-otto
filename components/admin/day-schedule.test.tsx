import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { DaySchedule } from './day-schedule'

it('empieza con un horario corrido y permite agregar sin exigir otro turno', () => {
  const html=renderToStaticMarkup(<DaySchedule day={1} label="Lunes" schedule={{day:1,enabled:true,shifts:[]}}/>)
  expect(html).toContain('Horario corrido')
  expect(html).toContain('Agregar turno')
  expect(html.match(/type="time"/g)).toHaveLength(2)
  expect(html).not.toContain('Turno 2')
})

it('conserva todos los turnos existentes al abrir el editor', () => {
  const html=renderToStaticMarkup(<DaySchedule day={1} label="Lunes" schedule={{day:1,enabled:true,shifts:[{start:'08:00',end:'10:00'},{start:'12:00',end:'14:00'},{start:'16:00',end:'18:00'}]}}/>)
  expect(html.match(/type="time"/g)).toHaveLength(6)
  expect(html).toContain('Turno 3')
  expect(html).toContain('Quitar turno 3 del lunes')
})
