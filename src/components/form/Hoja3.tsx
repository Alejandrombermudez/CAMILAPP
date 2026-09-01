'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useFormStore } from '@/hooks/useFormStore'
import { db } from '@/lib/local-db'
import { aplicarAvanceEfectivo, estadoCorte, type AvanceResultado } from '@/lib/avance'
import { EstadoCorteBadge } from '@/components/EstadoCorteBadge'
import { CalendarPicker } from '@/components/CalendarPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { unidadSubactividad } from '@/lib/catalog-data'
import type { RendimientoFila } from '@/types'

// ── Operator distribution logic ────────────────────────────────
function getMaxOperarios(filas: RendimientoFila[], rowIdx: number, total: number): number {
  const yaAsignados = filas.reduce((sum, f, i) => {
    if (i === rowIdx) return sum
    return sum + (f.numOperarios ?? 0)
  }, 0)
  const sinAsignarDespues = filas
    .slice(rowIdx + 1)
    .filter(f => f.numOperarios === null).length
  const max = total - yaAsignados - sinAsignarDespues
  return Math.max(1, max)
}

// ── Display 24h time as 12h ────────────────────────────────────
function fmt24to12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12    = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function Hoja3({
  onPrev,
  onSubmit: onFormSubmit,
}: {
  onPrev: () => void
  onSubmit: () => Promise<void>
}) {
  const store = useFormStore()
  const totalOps = store.operarios_hombre + store.operarios_mujer
  const [submitting, setSubmitting] = useState(false)
  const [conflicto, setConflicto] = useState(false)
  const [avanceError, setAvanceError] = useState('')
  const [avancePct, setAvancePct] = useState<number | null>(null)
  const [sobrescribir, setSobrescribir] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [resultadoAvance, setResultadoAvance] = useState<AvanceResultado | null>(null)

  // ── Build rendimiento rows from Hoja 2 activity groups ────────
  useEffect(() => {
    if (store.rendimientoFilas.length > 0) return
    const filas: RendimientoFila[] = []
    for (const grupo of store.actividadGrupos) {
      const actNombre = grupo.esOtra ? (grupo.customNombre || 'Otra') : grupo.actividadNombre
      for (const det of grupo.detalles) {
        const detNombre = det.esOtro ? (det.customNombre || 'Otro') : det.detalleNombre
        filas.push({
          tempId: `${grupo.tempId}__${det.tempId}`,
          actividadGrupoTempId: grupo.tempId,
          detalleTempId: det.tempId,
          actividadNombre: actNombre,
          detalleNombre: detNombre,
          esCorte: det.esCorte,
          cantidadEjecutada: null,
          numOperarios: null,
          porcentajeAreaEfectiva: null,
        })
      }
    }
    store.setRendimientoFilas(filas)
  }, [store.actividadGrupos]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-detect last cutting date for Avance Efectivo ─────────
  useEffect(() => {
    if (store.avance_fecha_inicio) return
    async function findLastDate() {
      const rendCorte = await db.rendimiento
        .filter(r => r.porcentaje_area_efectiva !== null)
        .toArray()
      if (!rendCorte.length) return
      const reporteIds = Array.from(new Set(rendCorte.map(r => r.reporte_id)))
      const reportes   = await db.reportes.where('id').anyOf(reporteIds).toArray()
      if (!reportes.length) return
      const latest = reportes.reduce((max, r) => (r.fecha > max ? r.fecha : max), '')
      store.setAvanceFechas(latest, null)
    }
    findLastDate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check for date range conflicts ────────────────────────────
  useEffect(() => {
    if (!store.avance_fecha_inicio || !store.avance_fecha_fin) { setConflicto(false); return }
    async function check() {
      const reportes = await db.reportes
        .where('fecha').between(store.avance_fecha_inicio!, store.avance_fecha_fin!, true, true)
        .toArray()
      if (!reportes.length) { setConflicto(false); return }
      const count = await db.rendimiento
        .where('reporte_id').anyOf(reportes.map(r => r.id))
        .filter(r => r.porcentaje_area_efectiva !== null)
        .count()
      setConflicto(count > 0)
    }
    check()
  }, [store.avance_fecha_inicio, store.avance_fecha_fin])

  const handleSubmit = async () => {
    // Validate rendimiento rows
    for (const f of store.rendimientoFilas) {
      if (f.cantidadEjecutada === null || f.numOperarios === null) {
        alert('Complete cantidad y operarios para todas las subactividades.')
        return
      }
    }
    setSubmitting(true)
    try {
      await onFormSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAplicarAvance = async () => {
    if (!store.avance_fecha_inicio || !store.avance_fecha_fin) {
      setAvanceError('Selecciona el rango de fechas.')
      return
    }
    if (avancePct === null || avancePct < 0 || avancePct > 100) {
      setAvanceError('Ingresa un % válido (0–100).')
      return
    }
    setAvanceError('')
    setAplicando(true)
    try {
      const res = await aplicarAvanceEfectivo(
        store.avance_fecha_inicio,
        store.avance_fecha_fin,
        avancePct,
        { sobrescribirConfirmados: sobrescribir },
      )
      setResultadoAvance(res)
      if (res.actualizados > 0) {
        toast.success(`Se actualizaron ${res.actualizados} corte(s) al ${avancePct}%`)
      } else if (res.totalCortes === 0) {
        toast.info('No hay subactividades de corte en ese rango.')
      } else {
        toast.info('No había cortes pendientes en ese rango.')
      }
    } finally {
      setAplicando(false)
    }
  }

  const filas = store.rendimientoFilas

  return (
    <div className="space-y-8">
      {/* ── MODULE A: RENDIMIENTO ─────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-green-800">Rendimiento</h2>
        <p className="text-xs text-muted-foreground">
          Total operarios: <strong>{totalOps}</strong> ({store.operarios_hombre}H + {store.operarios_mujer}M)
          · Jornada: {fmt24to12(store.hora_ingreso)} – {fmt24to12(store.hora_salida)}
        </p>

        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No hay subactividades. Regresa a Hoja 2 y agrega actividades.
          </p>
        ) : (
          <div className="space-y-3">
            {filas.map((fila, idx) => {
              const maxOps = getMaxOperarios(filas, idx, totalOps)
              const opOptions = Array.from({ length: maxOps }, (_, i) => i + 1)
              const unidad = unidadSubactividad(fila.detalleNombre)
              const rendimiento = fila.cantidadEjecutada !== null && fila.numOperarios
                ? (fila.cantidadEjecutada / fila.numOperarios / 8).toFixed(3)
                : '—'

              return (
                <div
                  key={fila.tempId}
                  className={`rounded-lg border p-4 space-y-3 ${fila.esCorte ? 'border-red-200 bg-red-50/30' : 'bg-white'}`}
                >
                  {/* Labels */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fila.actividadNombre}</p>
                      <p className="text-xs text-muted-foreground">{fila.detalleNombre}</p>
                    </div>
                    {fila.esCorte && (
                      <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        ✂ Corte
                      </span>
                    )}
                  </div>

                  {/* Inputs row */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Cantidad ejecutada */}
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad ejecutada ({unidad})</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={fila.cantidadEjecutada ?? ''}
                        onChange={e =>
                          store.patchRendimientoFila(fila.tempId, {
                            cantidadEjecutada: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>

                    {/* Número de operarios */}
                    <div className="space-y-1">
                      <Label className="text-xs">Operarios</Label>
                      <Select
                        value={fila.numOperarios ? String(fila.numOperarios) : ''}
                        onValueChange={v =>
                          store.patchRendimientoFila(fila.tempId, { numOperarios: Number(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {opOptions.map(n => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Rendimiento calculado */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Rendimiento = cant ÷ operarios ÷ 8h
                    </span>
                    <span className="font-semibold text-green-700 tabular-nums">
                      {rendimiento} {rendimiento !== '—' ? 'u/op/h' : ''}
                    </span>
                  </div>

                  {/* % Área Efectiva — solo para corte */}
                  {fila.esCorte && (
                    <div className="space-y-1 border-t border-red-200 pt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-red-700">% Área Efectiva (0–100)</Label>
                        <EstadoCorteBadge estado={estadoCorte(true, fila.porcentajeAreaEfectiva)} />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Ej: 85"
                        value={fila.porcentajeAreaEfectiva ?? ''}
                        onChange={e =>
                          store.patchRendimientoFila(fila.tempId, {
                            porcentajeAreaEfectiva: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Puede dejarse en blanco y actualizarse desde Avance Efectivo.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* ── MODULE B: AVANCE EFECTIVO ─────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-green-800">Avance Efectivo</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Aplica un <strong>% Área Efectiva</strong> a todas las subactividades de{' '}
            <strong>corte</strong> dentro de un rango de fechas, para confirmar en bloque las que
            quedaron pendientes. Es una acción independiente de guardar el informe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CalendarPicker
            label="Desde (último registro de corte)"
            value={store.avance_fecha_inicio}
            onChange={v => store.setAvanceFechas(v, store.avance_fecha_fin)}
            maxDate={new Date()}
          />
          <CalendarPicker
            label="Hasta"
            value={store.avance_fecha_fin}
            onChange={v => store.setAvanceFechas(store.avance_fecha_inicio, v)}
            maxDate={new Date()}
            minDate={store.avance_fecha_inicio ? new Date(store.avance_fecha_inicio) : undefined}
          />
        </div>

        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">% Área Efectiva a aplicar</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Ej: 85"
              value={avancePct ?? ''}
              onChange={e => setAvancePct(e.target.value ? Number(e.target.value) : null)}
              className="w-32"
            />
          </div>
          <Button
            type="button"
            onClick={handleAplicarAvance}
            disabled={aplicando || !store.avance_fecha_inicio || !store.avance_fecha_fin}
            className="bg-green-600 hover:bg-green-700"
          >
            {aplicando ? 'Aplicando…' : 'Aplicar al rango'}
          </Button>
        </div>

        {conflicto && (
          <Alert variant="warning">
            <AlertTriangle size={16} />
            <AlertTitle>Ya hay cortes confirmados en ese rango</AlertTitle>
            <AlertDescription>
              Algunos cortes del intervalo ya tienen % registrado; por defecto no se tocan.
              <label className="mt-2 flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={sobrescribir}
                  onChange={e => setSobrescribir(e.target.checked)}
                />
                Sobrescribir también los ya confirmados
              </label>
            </AlertDescription>
          </Alert>
        )}

        {store.avance_fecha_inicio && store.avance_fecha_fin && !conflicto && (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 size={15} />
            Intervalo listo: {store.avance_fecha_inicio} → {store.avance_fecha_fin}
          </div>
        )}

        {resultadoAvance && (
          <p className="text-xs text-muted-foreground">
            {resultadoAvance.totalCortes === 0
              ? 'No hay cortes en el rango seleccionado.'
              : `${resultadoAvance.actualizados} actualizados · ${resultadoAvance.yaConfirmados} ya confirmados · ${resultadoAvance.totalCortes} cortes en el rango.`}
          </p>
        )}

        {avanceError && <p className="text-sm text-red-500">{avanceError}</p>}
      </section>

      {/* ── NAVIGATION ────────────────────────────────────────── */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          <ChevronLeft size={16} className="mr-1" /> Anterior
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {submitting ? 'Guardando…' : '✓ Guardar informe'}
        </Button>
      </div>
    </div>
  )
}
