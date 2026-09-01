'use client'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Users, Clock, Pencil, Save, X, Percent, AlertTriangle } from 'lucide-react'
import 'react-day-picker/style.css'
import {
  getReportesPorFecha, getEstadoDias, getEstadoCortesDias, guardarRendimientoReporte,
  type ReporteDetalle, type FilaRendimientoInput,
} from '@/lib/reportes'
import { estadoCorte, aplicarAvanceEfectivoFechas } from '@/lib/avance'
import { unidadSubactividad, formatUnidad } from '@/lib/catalog-data'
import { EstadoCorteBadge } from '@/components/EstadoCorteBadge'
import { CalendarPicker } from '@/components/CalendarPicker'
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

type Modo = 'dia' | 'avance'

export default function RendimientoPage() {
  const { poligonos } = useCatalog()
  const [modo, setModo] = useState<Modo>('dia')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Rendimiento</h1>
      </div>

      {/* Toggle de modo */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([['dia', 'Por día'], ['avance', 'Avance efectivo (%)']] as [Modo, string][]).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
              modo === m ? 'bg-white shadow-sm font-medium text-green-800' : 'text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === 'dia' ? <ModoDia poligonos={poligonos} /> : <ModoAvance />}
    </div>
  )
}

// ════════════════════════════════════════════ MODO POR DÍA ═════════
function ModoDia({ poligonos }: { poligonos: { id: number; codigo: string; nombre: string }[] }) {
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
      const day = parseISO(d.fecha); todos.push(day)
      if (d.estado === 'con-rendimiento') verde.push(day); else azul.push(day)
    }
    return { diasVerde: verde, diasAzul: azul, diasConReporte: todos }
  }, [estadoDias])

  const selected = fecha ? parseISO(fecha) : undefined

  return (
    <div className="space-y-5">
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
      <Leyenda items={[
        ['bg-green-600', 'Con rendimiento'],
        ['bg-blue-600', 'Falta rendimiento'],
        ['bg-gray-200', 'Sin informe (bloqueado)'],
      ]} />

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
          {informes.map(inf => <RendimientoDia key={inf.reporte.id} inf={inf} poligonos={poligonos} />)}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════ MODO AVANCE EFECTIVO ═══════
function ModoAvance() {
  const estadoCortes = useLiveQuery(() => getEstadoCortesDias(), [])
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [desde, setDesde] = useState<string | null>(null)
  const [hasta, setHasta] = useState<string | null>(null)
  const [pct, setPct] = useState('')
  const [sobrescribir, setSobrescribir] = useState(false)
  const [aplicando, setAplicando] = useState(false)

  const { aplicableDates, conflictoDates, conflictoSet } = useMemo(() => {
    const apt: Date[] = [], conf: Date[] = [], cset = new Set<string>()
    for (const d of estadoCortes ?? []) {
      apt.push(parseISO(d.fecha))
      if (d.confirmados > 0) { conf.push(parseISO(d.fecha)); cset.add(d.fecha) }
    }
    return { aplicableDates: apt, conflictoDates: conf, conflictoSet: cset }
  }, [estadoCortes])

  // Al fijar un intervalo, autoselecciona los días aplicables (con cortes) del rango.
  useEffect(() => {
    if (!desde || !hasta) return
    const inRange = (estadoCortes ?? []).filter(d => d.fecha >= desde && d.fecha <= hasta).map(d => d.fecha)
    setSeleccion(new Set(inRange))
  }, [desde, hasta, estadoCortes])

  const selectedArr = [...seleccion]
  const nConflicto = selectedArr.filter(f => conflictoSet.has(f)).length

  const aplicar = async () => {
    const p = Number(pct)
    if (selectedArr.length === 0) { toast.error('Selecciona al menos un día.'); return }
    if (pct === '' || p < 0 || p > 100) { toast.error('Ingresa un % válido (0–100).'); return }
    setAplicando(true)
    try {
      const res = await aplicarAvanceEfectivoFechas(selectedArr, p, { sobrescribirConfirmados: sobrescribir })
      if (res.actualizados > 0) toast.success(`${res.actualizados} corte(s) actualizados al ${p}%`)
      else if (res.totalCortes === 0) toast.info('No hay cortes en los días seleccionados.')
      else toast.info('Esos cortes ya tienen % — marca "sobrescribir" para reemplazarlos.')
    } finally { setAplicando(false) }
  }

  const limpiar = () => { setSeleccion(new Set()); setDesde(null); setHasta(null) }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Aplica un <strong>% de área efectiva</strong> a los cortes de varios días. Elige un intervalo o
        marca los días directamente en el calendario. Solo se pueden elegir días con cortes registrados.
      </p>

      <div className="border rounded-lg p-2 bg-white shadow-sm flex justify-center">
        <DayPicker
          mode="multiple"
          selected={selectedArr.map(f => parseISO(f))}
          onSelect={(days) => setSeleccion(new Set((days ?? []).map(d => format(d, 'yyyy-MM-dd'))))}
          locale={es}
          disabled={(day) => !aplicableDates.some(d => isSameDay(d, day))}
          modifiers={{ conflicto: conflictoDates }}
          modifiersStyles={{
            conflicto: { backgroundColor: '#fde68a', color: '#92400e', borderRadius: '6px' },
            selected:  { outline: '2px solid #16a34a', outlineOffset: '-2px', borderRadius: '6px', fontWeight: 700 },
          }}
        />
      </div>
      <Leyenda items={[
        ['bg-white border border-gray-300', 'Se puede aplicar'],
        ['bg-amber-300', 'Ya tiene % (conflicto)'],
        ['bg-gray-200', 'Sin cortes (bloqueado)'],
      ]} />

      {/* Intervalo */}
      <div className="grid grid-cols-2 gap-2">
        <CalendarPicker label="Desde" value={desde} onChange={setDesde} maxDate={new Date()} placeholder="—" />
        <CalendarPicker label="Hasta" value={hasta} onChange={setHasta} maxDate={new Date()}
          minDate={desde ? parseISO(desde) : undefined} placeholder="—" />
      </div>

      {/* Panel de aplicación */}
      <div className="border rounded-lg p-3 bg-gray-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Percent size={14} className="text-green-700" />
            {selectedArr.length} día{selectedArr.length === 1 ? '' : 's'} seleccionado{selectedArr.length === 1 ? '' : 's'}
          </p>
          {selectedArr.length > 0 && (
            <button type="button" onClick={limpiar} className="text-xs text-muted-foreground underline hover:text-foreground">
              Limpiar
            </button>
          )}
        </div>

        {nConflicto > 0 && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 space-y-1.5">
            <p className="flex items-center gap-1.5 font-medium">
              <AlertTriangle size={13} /> {nConflicto} día{nConflicto === 1 ? '' : 's'} ya {nConflicto === 1 ? 'tiene' : 'tienen'} % puesto
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sobrescribir} onChange={e => setSobrescribir(e.target.checked)} />
              Sobrescribir también los que ya tienen %
            </label>
            {!sobrescribir && <p className="text-amber-700">Sin sobrescribir, esos días se omiten.</p>}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">% Área efectiva a aplicar</Label>
            <Input type="number" min={0} max={100} inputMode="numeric" placeholder="Ej: 85"
              value={pct} onChange={e => setPct(e.target.value)} className="w-28" />
          </div>
          <Button type="button" onClick={aplicar} disabled={aplicando || selectedArr.length === 0}
            className="bg-green-600 hover:bg-green-700">
            {aplicando ? 'Aplicando…' : 'Aplicar %'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Leyenda({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
      {items.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <i className={`w-3 h-3 rounded-sm inline-block ${cls}`} /> {label}
        </span>
      ))}
    </div>
  )
}

// ═══════════════════════════════════ VISTA/CAPTURA DE UN DÍA ═══════
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

  const grupos: { actNombre: string; items: { fila: FilaEdit; i: number }[] }[] = []
  filas.forEach((fila, i) => {
    const last = grupos[grupos.length - 1]
    if (last && last.actNombre === fila.actNombre) last.items.push({ fila, i })
    else grupos.push({ actNombre: fila.actNombre, items: [{ fila, i }] })
  })

  return (
    <div className="space-y-4">
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
                              value={fila.cantidad} onChange={e => setFila(i, { cantidad: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">Operarios (máx {totalOps})</Label>
                            <Input type="number" min={1} max={totalOps || undefined} inputMode="numeric" placeholder="0"
                              value={fila.operarios} onChange={e => setFila(i, { operarios: e.target.value })} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                          <span><span className="font-semibold tabular-nums">{nf.format(cant)}</span> <span className="text-xs text-muted-foreground">{formatUnidad(fila.detNombre, cant)}</span></span>
                          <span className="text-muted-foreground text-xs flex items-center gap-1"><Users size={11} /> {ops || '—'}</span>
                        </div>
                      )}

                      {fila.esCorte && (
                        <div className="flex items-center justify-between gap-2 border-t border-red-100 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-700">% Área efectiva</span>
                            <EstadoCorteBadge estado={estadoCorte(true, fila.pct === '' ? null : Number(fila.pct))} />
                          </div>
                          {editando ? (
                            <Input type="number" min={0} max={100} inputMode="numeric" placeholder="Ej: 85"
                              value={fila.pct} onChange={e => setFila(i, { pct: e.target.value })} className="w-24 h-8" />
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
