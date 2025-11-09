"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, TrendingUp, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { supabase, convertirMovimientoFromDB, convertirMovimientoToDB } from "@/lib/supabase"

interface Movimiento {
  id: number
  fecha: string
  capitalInvertido: number
  precioCompra: number
  cantidadDolares: number
  precioVenta: number
  totalVenta: number
  tieneComision: boolean
  tipoComision?: "porcentaje" | "montoFinal"
  comisionPorcentaje?: number
  comisionMonto?: number
  montoFinal: number
  ganancia: number
  porcentaje: number
}

export default function Home() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [capitalInvertido, setCapitalInvertido] = useState("")
  const [precioCompra, setPrecioCompra] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [tieneComision, setTieneComision] = useState(false)
  const [tipoComision, setTipoComision] = useState<"porcentaje" | "montoFinal">("porcentaje")
  const [comisionPorcentaje, setComisionPorcentaje] = useState("")
  const [montoFinalDirecto, setMontoFinalDirecto] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  // Cargar movimientos al inicio
  useEffect(() => {
    cargarMovimientos()
  }, [])

  const cargarMovimientos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error de Supabase:', error)
        throw error
      }

      console.log('Datos cargados:', data)
      const movimientosFormateados = data.map(convertirMovimientoFromDB)
      setMovimientos(movimientosFormateados)
    } catch (error) {
      console.error('Error cargando movimientos:', error)
      
      // Si es un error de tabla no existe, no mostrar error al usuario
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        console.log('La tabla movimientos no existe aún. Ejecuta el SQL en Supabase.')
        setMovimientos([]) // Inicializar con array vacío
      } else {
        toast.error('Error al cargar movimientos. Verifica la conexión a la base de datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatearNumero = (valor: string): string => {
    const sinPuntos = valor.replace(/\./g, "")
    return sinPuntos.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parsearNumero = (valor: string): number => {
    return Number.parseFloat(valor.replace(/\./g, ""))
  }

  const handleNumeroChange = (valor: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const valorLimpio = valor.replace(/[^\d]/g, "")
    setter(formatearNumero(valorLimpio))
  }

  const calcularMovimiento = (
    capitalPesos: number,
    precioCompraDolar: number,
    precioVentaDolar: number,
    conComision: boolean,
    tipo?: "porcentaje" | "montoFinal",
    valorComision?: number,
  ) => {
    const cantidadDolares = capitalPesos / precioCompraDolar
    const totalVenta = cantidadDolares * precioVentaDolar

    let montoFinal = totalVenta
    let comisionMonto: number | undefined
    let comisionPorcentajeCalculado: number | undefined

    if (conComision && valorComision !== undefined) {
      if (tipo === "porcentaje") {
        comisionPorcentajeCalculado = valorComision
        comisionMonto = (totalVenta * valorComision) / 100
        montoFinal = totalVenta - comisionMonto
      } else {
        montoFinal = valorComision
        comisionMonto = totalVenta - valorComision
        comisionPorcentajeCalculado = (comisionMonto / totalVenta) * 100
      }
    }

    const ganancia = montoFinal - capitalPesos
    const porcentaje = (ganancia / capitalPesos) * 100

    return {
      cantidadDolares,
      totalVenta,
      montoFinal,
      comisionMonto,
      comisionPorcentaje: comisionPorcentajeCalculado,
      ganancia,
      porcentaje,
    }
  }

  const agregarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()

    const capital = parsearNumero(capitalInvertido)
    const compra = parsearNumero(precioCompra)
    const venta = parsearNumero(precioVenta)

    if (isNaN(capital) || isNaN(compra) || isNaN(venta)) return

    let valorComision: number | undefined
    if (tieneComision) {
      if (tipoComision === "porcentaje") {
        valorComision = parsearNumero(comisionPorcentaje)
        if (isNaN(valorComision)) return
      } else {
        valorComision = parsearNumero(montoFinalDirecto)
        if (isNaN(valorComision)) return
      }
    }

    const resultado = calcularMovimiento(capital, compra, venta, tieneComision, tipoComision, valorComision)

    const nuevoMovimiento = {
      capitalInvertido: capital,
      precioCompra: compra,
      cantidadDolares: resultado.cantidadDolares,
      precioVenta: venta,
      totalVenta: resultado.totalVenta,
      tieneComision,
      tipoComision: tieneComision ? tipoComision : undefined,
      comisionPorcentaje: resultado.comisionPorcentaje,
      comisionMonto: resultado.comisionMonto,
      montoFinal: resultado.montoFinal,
      ganancia: resultado.ganancia,
      porcentaje: resultado.porcentaje,
    }

    try {
      const movimientoParaDB = convertirMovimientoToDB(nuevoMovimiento)
      
      const { data, error } = await supabase
        .from('movimientos')
        .insert([movimientoParaDB])
        .select()
        .single()

      if (error) throw error

      const movimientoFormateado = convertirMovimientoFromDB(data)
      setMovimientos([movimientoFormateado, ...movimientos])

      toast.success("Movimiento agregado", {
        description: `Ganancia: $${resultado.ganancia.toFixed(2)} (${resultado.porcentaje.toFixed(2)}%)`,
      })

      setCapitalInvertido("")
      setPrecioCompra("")
      setPrecioVenta("")
      setTieneComision(false)
      setTipoComision("porcentaje")
      setComisionPorcentaje("")
      setMontoFinalDirecto("")
      setModalOpen(false)
    } catch (error) {
      console.error('Error guardando movimiento:', error)
      toast.error('Error al guardar movimiento')
    }
  }

  const confirmarEliminarMovimiento = (id: number) => {
    const movimiento = movimientos.find((m) => m.id === id)
    
    if (!movimiento) return

    toast.custom((t) => (
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Trash2 className="size-5 text-destructive mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              ¿Eliminar movimiento?
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Se eliminará el movimiento con ganancia de ${movimiento.ganancia.toFixed(2)}. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  toast.dismiss(t)
                  eliminarMovimiento(id)
                }}
                className="h-8 px-3 text-xs"
              >
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.dismiss(t)}
                className="h-8 px-3 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: Infinity, // No auto-dismiss
    })
  }

  const eliminarMovimiento = async (id: number) => {
    const movimiento = movimientos.find((m) => m.id === id)
    
    try {
      const { error } = await supabase
        .from('movimientos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMovimientos(movimientos.filter((m) => m.id !== id))

      if (movimiento) {
        toast.error("Movimiento eliminado", {
          description: `Ganancia de $${movimiento.ganancia.toFixed(2)} eliminada`,
        })
      }
    } catch (error) {
      console.error('Error eliminando movimiento:', error)
      toast.error('Error al eliminar movimiento')
    }
  }

  const reinvertirMovimiento = (movimiento: Movimiento) => {
    const nuevoCapital = movimiento.capitalInvertido + movimiento.ganancia
    setCapitalInvertido(formatearNumero(nuevoCapital.toFixed(0)))
    setModalOpen(true)
  }

  const gananciaTotal = movimientos.reduce((sum, m) => sum + m.ganancia, 0)
  const promedioGanancia = movimientos.length > 0 ? gananciaTotal / movimientos.length : 0

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="size-12 object-contain" />
            <div>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">Control de Rulo</h1>
              <p className="text-pretty text-muted-foreground">Gestiona tus movimientos de compra y venta de dólares</p>
            </div>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 size-4" />
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Movimiento</DialogTitle>
                <DialogDescription>Registra un nuevo movimiento de compra y venta de dólares</DialogDescription>
              </DialogHeader>
              <form onSubmit={agregarMovimiento} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capitalInvertido">Capital Invertido ($)</Label>
                  <Input
                    id="capitalInvertido"
                    type="text"
                    placeholder="Ej: 100.000 (pesos que usaste para comprar dólares)"
                    value={capitalInvertido}
                    onChange={(e) => handleNumeroChange(e.target.value, setCapitalInvertido)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad de pesos que invertiste para comprar los dólares
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="precioCompra">Precio de Compra por Dólar ($)</Label>
                    <Input
                      id="precioCompra"
                      type="text"
                      placeholder="Ej: 1.000"
                      value={precioCompra}
                      onChange={(e) => handleNumeroChange(e.target.value, setPrecioCompra)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precioVenta">Precio de Venta por Dólar ($)</Label>
                    <Input
                      id="precioVenta"
                      type="text"
                      placeholder="Ej: 1.050"
                      value={precioVenta}
                      onChange={(e) => handleNumeroChange(e.target.value, setPrecioVenta)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comision"
                    checked={tieneComision}
                    onCheckedChange={(checked) => setTieneComision(checked as boolean)}
                  />
                  <Label htmlFor="comision" className="cursor-pointer">
                    Se cobró comisión en la venta
                  </Label>
                </div>

                {tieneComision && (
                  <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
                    <RadioGroup
                      value={tipoComision}
                      onValueChange={(value) => setTipoComision(value as "porcentaje" | "montoFinal")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="porcentaje" id="porcentaje" />
                        <Label htmlFor="porcentaje" className="cursor-pointer font-normal">
                          Ingreso porcentaje de comisión
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="montoFinal" id="montoFinal" />
                        <Label htmlFor="montoFinal" className="cursor-pointer font-normal">
                          Ingreso monto final recibido
                        </Label>
                      </div>
                    </RadioGroup>

                    {tipoComision === "porcentaje" ? (
                      <div className="space-y-2">
                        <Label htmlFor="comisionPorcentaje">Porcentaje de Comisión (%)</Label>
                        <Input
                          id="comisionPorcentaje"
                          type="text"
                          placeholder="Ej: 2.5"
                          value={comisionPorcentaje}
                          onChange={(e) => handleNumeroChange(e.target.value, setComisionPorcentaje)}
                          required={tieneComision}
                        />
                        <p className="text-xs text-muted-foreground">Porcentaje cobrado sobre el total de la venta</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="montoFinalDirecto">Monto Final Recibido ($)</Label>
                        <Input
                          id="montoFinalDirecto"
                          type="text"
                          placeholder="Ej: 103.000"
                          value={montoFinalDirecto}
                          onChange={(e) => handleNumeroChange(e.target.value, setMontoFinalDirecto)}
                          required={tieneComision}
                        />
                        <p className="text-xs text-muted-foreground">
                          Monto exacto que recibiste después de la comisión
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <Plus className="mr-2 size-4" />
                  Agregar Movimiento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{movimientos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${gananciaTotal >= 0 ? "text-accent" : "text-destructive"}`}>
                ${gananciaTotal.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Movimiento</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${promedioGanancia >= 0 ? "text-accent" : "text-destructive"}`}>
                ${promedioGanancia.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>Todos tus movimientos de compra y venta</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 size-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
                <p className="text-lg font-medium text-foreground">Cargando movimientos...</p>
              </div>
            ) : movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="mb-4 size-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">No hay movimientos registrados</p>
                <p className="text-sm text-muted-foreground">
                  Agrega tu primer movimiento usando el botón "Nuevo Movimiento"
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Capital Invertido</TableHead>
                      <TableHead className="text-right">Precio Compra</TableHead>
                      <TableHead className="text-right">USD Comprados</TableHead>
                      <TableHead className="text-right">Precio Venta</TableHead>
                      <TableHead className="text-right">Total Venta</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                      <TableHead className="text-right">Monto Final</TableHead>
                      <TableHead className="text-right">Ganancia</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell className="font-medium">{movimiento.fecha}</TableCell>
                        <TableCell className="text-right font-medium">
                          $
                          {movimiento.capitalInvertido.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {movimiento.precioCompra.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {movimiento.cantidadDolares.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {movimiento.precioVenta.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          $
                          {movimiento.totalVenta.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {movimiento.comisionMonto ? (
                            <span>
                              $
                              {movimiento.comisionMonto.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              {movimiento.comisionPorcentaje && (
                                <span className="text-xs text-muted-foreground">
                                  {" "}
                                  ({movimiento.comisionPorcentaje.toFixed(2)}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          $
                          {movimiento.montoFinal.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${movimiento.ganancia >= 0 ? "text-accent" : "text-destructive"}`}
                        >
                          $
                          {movimiento.ganancia.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${movimiento.porcentaje >= 0 ? "text-accent" : "text-destructive"}`}
                        >
                          {movimiento.porcentaje > 0 ? "+" : ""}
                          {movimiento.porcentaje.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reinvertirMovimiento(movimiento)}
                              title="Reinvertir capital + ganancias"
                            >
                              <Plus className="size-4 text-accent" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmarEliminarMovimiento(movimiento.id)}
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
