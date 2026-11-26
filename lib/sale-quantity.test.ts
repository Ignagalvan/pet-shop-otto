import {expect,it} from 'vitest'
import {toKilograms,quantityLabel} from './sale-quantity'
it('convierte gramos y kilos sin redondear pesos inválidos',()=>{
 expect(toKilograms('500','g')).toBe(0.5)
 expect(toKilograms('1,5','kg')).toBe(1.5)
 expect(toKilograms('1','g')).toBe(0.001)
 for(const input of ['', '0','-1','0.0001','Infinity','NaN'])expect(toKilograms(input,'kg')).toBeNull()
 expect(quantityLabel(0.5,'kg')).toBe('0,5 kg sueltos')
})
