'use client'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Users, Clock, Pencil, Save, X } from 'lucide-react'
import 'react-day-picker/style.css'
import {
  getReportesPorFecha, getEstadoDias, guardarRendimientoReporte,
  type ReporteDetalle, type FilaRendimientoInput,
} from '@/lib/reportes'
import { unidadSubactividad, formatUnidad } from '@/lib/catalog-data'
import { estadoCorte } from '@/lib/avance'
import { EstadoCorteBadge } from '@/components/EstadoCorteBadge'
import { useCatalog } from '@/components/CatalogProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function fmt24to12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}
const nf = new Intl.NumberFormat('es-CO')

export default function RendimientoPage() {
  const { poligonos } = useCatalog()
  const [fecha, setFecha] = useState<string | null>(null)
  useEffect(() => { setFecha(format(new Date(), 'yyyy-MM-dd')) }, [])

  const informes = useLiveQuery<ReporteDetalle[]>(
    () => (fecha ? getReportesPorFecha(fecha) : Promise.resolve([])),
    [fecha],
  )
  const estadoDias = useLiveQuery(() => getEstadoDias(), [])

  const { diasVerde, diasAzul, diasConReporte } = useMemo(() => {
    const verde: Date[] = [], azul: Date[] = [], todos: Date[] = []
    for (const d of estadoDias ?? []) {
      const day = parseISO(d.fecha)
      todos.push(day)
      if (d.estado === 'con-rendimiento') verde.push(day)
      else azul.push(day)
    }
    return { diasVerde: verde, diasAzul: azul, diasConReporte: todos }
  }, [estadoDias])

  const selected = fecha ? parseISO(fecha) : undefined

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Rendimiento</h1>
      </div>

      {/* Calendario */}
      <div className="border rounded-lg p-2 bg-white shadow-sm flex justify-center">
        <DayPicker
          mode="single"
          required
          selected={selected}
          onSelect={(d) => d && setFecha(format(d, 'yyyy-MM-dd'))}
          locale={es}
          defaultMonth={selected}
          disabled={(day) => !diasConReporte.some(d => isSameDay(d, day))}
          modifiers={{ verde: diasVerde, azul: diasAzul }}
          modifiersStyles={{
            verde: { backgroundColor: '#16a34a', color: 'white', borderRadius: '6px', fontWeight: 700 },
            azul:  { backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', fontWeight: 700 },
          }}
        />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-green-600 inline-block" /> Con rendimiento</span>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> Falta rendimiento</span>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> Sin informe (bloqueado)</span>
      </div>

      {fecha && (
        <p className="text-sm font-medium text-green-800 first-letter:uppercase">
          {format(parseISO(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      )}

      {informes === undefined ? (
        <p className="text-sm text-muted-foreground text-center py-10">Cargando…</p>
      ) : informes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-10">
          No hay informe este día. Elige un día marcado en verde o azul.
        </p>
      ) : (
        <div className="space-y-8">
          {informes.map(inf => (
            <RendimientoDia key={inf.reporte.id} inf={inf} poligonos={poligonos} />
          ))}
        </div>
      )}
    </div>
  )
}

interface FilaEdit {
  detId: string
  actId: string
  actNombre: string
  detNombre: string
  esCorte: boolean
  cantidad: string
  operarios: string
  pct: string
}

function buildFilas(inf: ReporteDetalle): FilaEdit[] {
  const rendByDet = new Map(inf.rendimientos.filter(r => r.detalle_reporte_id).map(r => [r.detalle_reporte_id, r]))
  const detsByAct = new Map<string, typeof inf.detalles>()
  for (const d of inf.detalles) {
    const arr = detsByAct.get(d.actividad_reporte_id) ?? []
    arr.push(d); detsByAct.set(d.actividad_reporte_id, arr)
  }
  const acts = [...inf.actividades].sort((a, b) => a.orden - b.orden)
  const filas: FilaEdit[] = []
  for (const act of acts) {
    const dets = (detsByAct.get(act.id) ?? []).sort((a, b) => a.orden - b.orden)
    for (const det of dets) {
      const r = rendByDet.get(det.id)
      filas.push({
        detId: det.id,
        actId: act.id,
        actNombre: act.actividad_nombre,
        detNombre: det.detalle_nombre,
        esCorte: det.es_corte,
        cantidad: r && r.cantidad_ejecutada ? String(r.cantidad_ejecutada) : '',
        operarios: r && r.num_operarios ? String(r.num_operarios) : '',
        pct: r && r.porcentaje_area_efectiva !== null && r.porcentaje_area_efectiva !== undefined
          ? String(r.porcentaje_area_efectiva) : '',
      })
    }
  }
  return filas
}

function RendimientoDia({
  inf, poligonos,
}: {
  inf: ReporteDetalle
  poligonos: { id: number; codigo: string; nombre: string }[]
}) {
  const { reporte } = inf
  const yaTiene = inf.rendimientos.length > 0
  const [editando, setEditando] = useState(!yaTiene)
  const [filas, setFilas] = useState<FilaEdit[]>(() => buildFilas(inf))
  const [guardando, setGuardando] = useState(false)

  // Si cambian los datos base (p. ej. tras sincronizar), reconstruye en modo vista.
  useEffect(() => {
    setFilas(buildFilas(inf))
    setEditando(inf.rendimientos.length === 0)
  }, [inf])

  const polig = poligonos.find(p => p.id === reporte.poligono_id)
  const totalOps = reporte.operarios_hombre + reporte.operarios_mujer

  const setFila = (i: number, patch: Partial<FilaEdit>) =>
    setFilas(fs => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))

  const guardar = async () => {
    for (const f of filas) {
      if (f.cantidad === '' || f.operarios === '') {
        toast.error('Completa cantidad y operarios en todas las subactividades.')
        return
      }
    }
    setGuardando(true)
    try {
      const payload: FilaRendimientoInput[] = filas.map(f => ({
        detalle_reporte_id: f.detId,
        actividad_reporte_id: f.actId,
        cantidad_ejecutada: Number(f.cantidad),
        num_operarios: Number(f.operarios),
        porcentaje_area_efectiva: f.pct === '' ? null : Number(f.pct),
      }))
      await guardarRendimientoReporte(reporte.id, payload)
      toast.success('Rendimiento guardado')
      setEditando(false)
    } finally {
      setGuardando(false)
    }
  }

  // Agrupar filas por actividad, conservando el orden.
  const grupos: { actNombre: string; items: { fila: FilaEdit; i: number }[] }[] = []
  filas.forEach((fila, i) => {
    const last = grupos[grupos.length - 1]
    if (last && last.actNombre === fila.actNombre) last.items.push({ fila, i })
    else grupos.push({ actNombre: fila.actNombre, items: [{ fila, i }] })
  })

  return (
    <div className="space-y-4">
      {/* Resumen de lo que se hizo ese día */}
      <section className="rounded-lg border bg-white p-3 text-sm space-y-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={14} className="text-green-700" />
          <span>{polig ? `${polig.codigo} — ${polig.nombre}` : 'Sin polígono'}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
          <span className="flex items-center gap-1"><Users size={12} /> {totalOps} operarios ({reporte.operarios_hombre}H · {reporte.operarios_mujer}M)</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {fmt24to12(reporte.hora_ingreso)} – {fmt24to12(reporte.hora_salida)}</span>
        </div>
        {reporte.novedades && <p className="text-xs text-muted-foreground pt-1">📝 {reporte.novedades}</p>}
      </section>

      {/* Rendimiento: casilla para llenar + calcular */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-green-800">Rendimiento</h2>
          {yaTiene && !editando && (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditando(true)}>
              <Pencil size={13} className="mr-1.5" /> Editar
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {grupos.map(grupo => (
            <div key={grupo.actNombre} className="rounded-lg border bg-white overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-sm font-medium border-b">{grupo.actNombre}</div>
              <div className="divide-y">
                {grupo.items.map(({ fila, i }) => {
                  const unidad = unidadSubactividad(fila.detNombre)
                  const cant = Number(fila.cantidad)
                  const ops = Number(fila.operarios)
                  const rph = fila.cantidad !== '' && ops ? (cant / ops / 8).toFixed(2) : '—'
                  return (
                    <div key={fila.detId} className={`p-3 space-y-2 ${fila.esCorte ? 'bg-red-50/30' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {fila.detNombre}
                          {fila.esCorte && <span className="ml-1 text-red-500 text-xs">✂</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">{unidad}</span>
                      </div>

                      {editando ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Cantidad ({unidad})</Label>
                            <Input type="number" min={0} step="any" inputMode="decimal" placeholder="0"
                              value={fila.cantidad}
                              onChange={e => setFila(i, { cantidad: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Operarios (máx {totalOps})</Label>
                            <Input type="number" min={1} max={totalOps || undefined} inputMode="numeric" placeholder="0"
                              value={fila.operarios}
                              onChange={e => setFila(i, { operarios: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                          <span><span className="font-semibold tabular-nums">{nf.format(cant)}</span> <span className="text-xs text-muted-foreground">{formatUnidad(fila.detNombre, cant)}</span></span>
                          <span className="text-muted-foreground text-xs flex items-center gap-1"><Users size={11} /> {ops || '—'}</span>
                        </div>
                      )}

                      {/* % Área efectiva (solo cortes) */}
                      {fila.esCorte && (
                        <div className="flex items-center justify-between gap-2 border-t border-red-100 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-700">% Área efectiva</span>
                            <EstadoCorteBadge estado={estadoCorte(true, fila.pct === '' ? null : Number(fila.pct))} />
                          </div>
                          {editando ? (
                            <Input type="number" min={0} max={100} inputMode="numeric" placeholder="Ej: 85"
                              value={fila.pct}
                              onChange={e => setFila(i, { pct: e.target.value })}
                              className="w-24 h-8" />
                          ) : (
                            <span className="text-sm font-semibold tabular-nums text-red-700">
                              {fila.pct !== '' ? `${fila.pct}%` : 'Pendiente'}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Rendimiento = cant ÷ operarios ÷ 8h</span>
                        <span className="font-semibold text-green-700 tabular-nums">{rph}{rph !== '—' ? ' u/op/h' : ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {editando && (
          <div className="flex gap-2">
            <Button type="button" onClick={guardar} disabled={guardando} className="flex-1 bg-green-600 hover:bg-green-700">
              <Save size={15} className="mr-1.5" /> {guardando ? 'Guardando…' : 'Guardar rendimiento'}
            </Button>
            {yaTiene && (
              <Button type="button" variant="outline" onClick={() => { setFilas(buildFilas(inf)); setEditando(false) }}>
                <X size={15} className="mr-1" /> Cancelar
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
