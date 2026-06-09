'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/local-db'
import { CalendarPicker } from '@/components/CalendarPicker'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, BarChart3, RefreshCw } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { Reporte, Rendimiento, ActividadReporte, DetalleActividadReporte } from '@/types'
import { useCatalog } from '@/components/CatalogProvider'
import { estadoCorte } from '@/lib/avance'
import { EstadoCorteBadge } from '@/components/EstadoCorteBadge'

interface RendimientoRow {
  poligonoCodigo: string
  poligonNombre: string
  actividadNombre: string
  detalleNombre: string
  esCorte: boolean
  cantidadTotal: number
  operariosTotal: number
  porcentajePromedio: number | null  // null = asumir 100%
  rendimientoEfectivo: number
  fecha: string
}

export default function EstadisticasPage() {
  const { poligonos } = useCatalog()
  const [fechaInicio, setFechaInicio] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [rows, setRows] = useState<RendimientoRow[]>([])
  const [fechasSinPct, setFechasSinPct] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const calcular = async () => {
    setLoading(true)
    try {
      // 1. Get reportes in range
      const reportes: Reporte[] = await db.reportes
        .where('fecha').between(fechaInicio, fechaFin, true, true)
        .toArray()

      if (!reportes.length) { setRows([]); setFechasSinPct([]); return }

      const reporteIds = reportes.map(r => r.id)
      const reporteMap = new Map(reportes.map(r => [r.id, r]))

      // 2. Get all related records
      const [actividadesList, rendimientosList] = await Promise.all([
        db.actividades_reporte.where('reporte_id').anyOf(reporteIds).toArray(),
        db.rendimiento.where('reporte_id').anyOf(reporteIds).toArray(),
      ])

      const actMap = new Map<string, ActividadReporte>(actividadesList.map(a => [a.id, a]))

      const detallesList: DetalleActividadReporte[] = await db.detalles_actividad
        .where('actividad_reporte_id').anyOf(actividadesList.map(a => a.id))
        .toArray()
      const detMap = new Map<string, DetalleActividadReporte>(detallesList.map(d => [d.id, d]))

      // 3. Detect fechas sin porcentaje en corte
      const fechasFaltantes = new Set<string>()
      for (const rend of rendimientosList) {
        const det = detMap.get(rend.detalle_reporte_id)
        if (det?.es_corte && rend.porcentaje_area_efectiva === null) {
          const rep = reporteMap.get(rend.reporte_id)
          if (rep) fechasFaltantes.add(rep.fecha)
        }
      }
      setFechasSinPct(Array.from(fechasFaltantes).sort())

      // 4. Build rows
      const builtRows: RendimientoRow[] = rendimientosList.map(rend => {
        const rep    = reporteMap.get(rend.reporte_id)!
        const act    = actMap.get(rend.actividad_reporte_id)
        const det    = detMap.get(rend.detalle_reporte_id)
        const polig  = poligonos.find(p => p.id === rep.poligono_id)
        const esCorte = det?.es_corte ?? false
        const pct    = esCorte
          ? (rend.porcentaje_area_efectiva ?? 100)
          : 100

        const rendEfectivo = rend.num_operarios > 0
          ? (rend.cantidad_ejecutada * (pct / 100)) / rend.num_operarios / 8
          : 0

        return {
          poligonoCodigo: polig?.codigo ?? '—',
          poligonNombre:  polig?.nombre ?? '—',
          actividadNombre: act?.actividad_nombre ?? '—',
          detalleNombre:   det?.detalle_nombre ?? '—',
          esCorte,
          cantidadTotal:   rend.cantidad_ejecutada,
          operariosTotal:  rend.num_operarios,
          porcentajePromedio: rend.porcentaje_area_efectiva,
          rendimientoEfectivo: parseFloat(rendEfectivo.toFixed(4)),
          fecha: rep.fecha,
        }
      })

      setRows(builtRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { calcular() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Group rows by polígono → actividad → detalle
  const grouped: Record<string, Record<string, RendimientoRow[]>> = {}
  for (const row of rows) {
    const polyKey = `${row.poligonoCodigo} — ${row.poligonNombre}`
    const actKey  = row.actividadNombre
    if (!grouped[polyKey]) grouped[polyKey] = {}
    if (!grouped[polyKey][actKey]) grouped[polyKey][actKey] = []
    grouped[polyKey][actKey].push(row)
  }

  // Traffic-light summary for corte rows
  const cortes = rows.filter(r => r.esCorte)
  const cortesConfirmados = cortes.filter(r => r.porcentajePromedio !== null).length
  const cortesPendientes = cortes.length - cortesConfirmados

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Estadísticas de Rendimiento</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <CalendarPicker
          label="Desde"
          value={fechaInicio}
          onChange={setFechaInicio}
          maxDate={new Date()}
          className="flex-1"
        />
        <CalendarPicker
          label="Hasta"
          value={fechaFin}
          onChange={setFechaFin}
          maxDate={new Date()}
          minDate={fechaInicio ? new Date(fechaInicio) : undefined}
          className="flex-1"
        />
        <Button onClick={calcular} disabled={loading} className="bg-green-600 hover:bg-green-700 h-10">
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Calcular
        </Button>
      </div>

      {/* Semáforo resumen de cortes */}
      {cortes.length > 0 && (
        <div className="flex items-center gap-4 text-sm border rounded-lg px-4 py-2.5 bg-gray-50/50">
          <span className="font-medium text-gray-700">% Área Efectiva:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" aria-hidden />
            {cortesConfirmados} confirmados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden />
            {cortesPendientes} pendientes
          </span>
        </div>
      )}

      {/* Alerta de fechas sin % área efectiva */}
      {fechasSinPct.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle size={16} />
          <AlertTitle>Formularios sin % Área Efectiva</AlertTitle>
          <AlertDescription>
            Los siguientes días tienen subactividades de corte sin % registrado
            (se asume 100% para el cálculo):
            <div className="mt-2 flex flex-wrap gap-1">
              {fechasSinPct.map(f => (
                <span key={f} className="text-xs bg-yellow-100 border border-yellow-300 px-2 py-0.5 rounded font-mono">
                  {f}
                </span>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {rows.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground italic text-center py-12">
          Sin registros para el período seleccionado.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([polyKey, actGroups]) => (
            <div key={polyKey} className="border rounded-lg overflow-hidden">
              {/* Polígono header */}
              <div className="bg-green-50 border-b px-4 py-2">
                <p className="text-sm font-semibold text-green-800">{polyKey}</p>
              </div>

              {Object.entries(actGroups).map(([actNombre, actRows]) => (
                <div key={actNombre}>
                  <div className="bg-gray-50 border-b px-4 py-1.5">
                    <p className="text-xs font-medium text-gray-700">{actNombre}</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left px-4 py-2 font-medium">Fecha</th>
                        <th className="text-left px-4 py-2 font-medium">Subactividad</th>
                        <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                        <th className="text-right px-4 py-2 font-medium">Ops.</th>
                        <th className="text-right px-4 py-2 font-medium">% Área</th>
                        <th className="text-right px-4 py-2 font-medium">Rend. efectivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-muted-foreground">{row.fecha}</td>
                          <td className="px-4 py-2">
                            {row.detalleNombre}
                            {row.esCorte && <span className="ml-1 text-red-500">✂</span>}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">{row.cantidadTotal}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{row.operariosTotal}</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {row.esCorte ? (
                              <span className="inline-flex items-center justify-end gap-1.5">
                                <EstadoCorteBadge estado={estadoCorte(true, row.porcentajePromedio)} showLabel={false} />
                                {row.porcentajePromedio !== null
                                  ? `${row.porcentajePromedio}%`
                                  : <span className="text-amber-600">100%*</span>}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-semibold text-green-700">
                            {row.rendimientoEfectivo} u/op/h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {actRows.length > 1 && (
                      <tfoot>
                        <tr className="bg-green-50/50 font-semibold">
                          <td colSpan={2} className="px-4 py-2 text-xs text-muted-foreground">Totales</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {actRows.reduce((s, r) => s + r.cantidadTotal, 0)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {actRows.reduce((s, r) => s + r.operariosTotal, 0)}
                          </td>
                          <td />
                          <td className="px-4 py-2 text-right tabular-nums text-green-700">
                            {(actRows.reduce((s, r) => s + r.rendimientoEfectivo, 0) / actRows.length).toFixed(4)} avg
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        * Subactividades de corte sin % registrado usan 100% para el cálculo.
      </p>
    </div>
  )
}
