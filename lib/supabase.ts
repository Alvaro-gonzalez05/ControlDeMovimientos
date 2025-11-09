import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl ? 'Configurado' : 'NO CONFIGURADO')
console.log('Supabase Key:', supabaseAnonKey ? 'Configurado' : 'NO CONFIGURADO')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface MovimientoDB {
  id: number
  fecha: string
  capital_invertido: number
  precio_compra: number
  cantidad_dolares: number
  precio_venta: number
  total_venta: number
  tiene_comision: boolean
  tipo_comision?: 'porcentaje' | 'montoFinal'
  comision_porcentaje?: number
  comision_monto?: number
  monto_final: number
  ganancia: number
  porcentaje: number
  created_at: string
  updated_at: string
}

// Función para convertir de la BD al formato de la app
export const convertirMovimientoFromDB = (movimientoDB: MovimientoDB) => {
  return {
    id: movimientoDB.id,
    fecha: new Date(movimientoDB.fecha).toLocaleDateString('es-ES'),
    capitalInvertido: movimientoDB.capital_invertido,
    precioCompra: movimientoDB.precio_compra,
    cantidadDolares: movimientoDB.cantidad_dolares,
    precioVenta: movimientoDB.precio_venta,
    totalVenta: movimientoDB.total_venta,
    tieneComision: movimientoDB.tiene_comision,
    tipoComision: movimientoDB.tipo_comision,
    comisionPorcentaje: movimientoDB.comision_porcentaje,
    comisionMonto: movimientoDB.comision_monto,
    montoFinal: movimientoDB.monto_final,
    ganancia: movimientoDB.ganancia,
    porcentaje: movimientoDB.porcentaje,
  }
}

// Función para convertir del formato de la app a la BD
export const convertirMovimientoToDB = (movimiento: any) => {
  return {
    capital_invertido: movimiento.capitalInvertido,
    precio_compra: movimiento.precioCompra,
    cantidad_dolares: movimiento.cantidadDolares,
    precio_venta: movimiento.precioVenta,
    total_venta: movimiento.totalVenta,
    tiene_comision: movimiento.tieneComision,
    tipo_comision: movimiento.tipoComision,
    comision_porcentaje: movimiento.comisionPorcentaje,
    comision_monto: movimiento.comisionMonto,
    monto_final: movimiento.montoFinal,
    ganancia: movimiento.ganancia,
    porcentaje: movimiento.porcentaje,
  }
}