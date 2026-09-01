'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, MapPin, Users, Clock } from 'lucide-react'
import { getReporteDetalle, confirmarPorcentajesCorte } from '@/lib/reportes'
import { estadoCorte } from '@/lib/avance'
import { EstadoCorteBadge } from '@/components/EstadoCorteBadge'
import { useCatalog } from '@/components/CatalogProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { DetalleActividadReporte, Rendimiento } from '@/types'

export default function DetalleFormularioPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')
  const { poligonos } = useCatalog()

  const detalle = useLiveQuery(() => getReporteDetalle(id), [id])

  const [pcts, setPcts] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const initRef = useRef(false)

  // Inicializa los inputs de % una sola vez (los refrescos de useLiveQuery por
  // sync no deben pisar lo que la usuaria está escribiendo).
  useEffect(() => {
    if (initRef.current || !detalle) return
    const init: Record<string, string> = {}
    for (const r of detalle.rendimientos) {
      init[r.id] = r.porcentaje_area_efectiva != null ? String(r.porcentaje_area_efectiva) : ''
    }
    setPcts(init)
    initRef.current = true
  }, [detalle])

  if (detalle === undefined) {
    return <p className="text-sm text-muted-foreground text-center py-12">Cargando…</p>
  }
  if (detalle === null) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-sm text-muted-foreground italic">Informe no encontrado.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/mis-formularios"><ChevronLeft size={14} className="mr-1" /> Volver</Link>
        </Button>
      </div>
    )
  }

  const { reporte, actividades, detalles, rendimientos } = detalle
  const polig = poligonos.find(p => p.id === reporte.poligono_id)
  const operarios = reporte.operarios_hombre + reporte.operarios_mujer

  // Índices para render jerárquico actividad → subactividad → rendimiento
  const actsOrdenadas = [...actividades].sort((a, b) => a.orden - b.orden)
  const detsByAct = new Map<string, DetalleActividadReporte[]>()
  for (const d of detalles) {
    const arr = detsByAct.get(d.actividad_reporte_id)
    if (arr) arr.push(d); else detsByAct.set(d.actividad_reporte_id, [d])
  }
  for (const arr of detsByAct.values()) arr.sort((a, b) => a.orden - b.orden)
  const rendByDetId = new Map<string, Rendimiento>()
  for (const r of rendimientos) rendByDetId.set(r.detalle_reporte_id, r)

  const cortesRends = rendimientos.filter(r => {
    const det = detalles.find(d => d.id === r.detalle_reporte_id)
    return det?.es_corte
  })
  const hayCortes = cortesRends.length > 0

  const handleGuardar = async () => {
    const updates: { rendimientoId: string; pct: number }[] = []
    for (const r of cortesRends) {
      const raw = (pcts[r.id] ?? '').trim()
      if (raw === '') continue // se queda pendiente
      const num = Number(raw)
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        toast.error('Los % deben ser un número entre 0 y 100.')
        return
      }
      if (num !== r.porcentaje_area_efectiva) updates.push({ rendimientoId: r.id, pct: num })
    }
    if (updates.length === 0) { toast.info('No hay cambios en los % que guardar.'); return }
    setGuardando(true)
    try {
      await confirmarPorcentajesCorte(reporte.id, updates)
      toast.success(`${updates.length} corte(s) confirmado(s)`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Volver */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/mis-formularios"><ChevronLeft size={16} className="mr-1" /> Mis formularios</Link>
      </Button>

      {/* Encabezado */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-green-800 first-letter:uppercase">
            {format(parseISO(reporte.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </h1>
          {reporte.sync_status === 'pending'
            ? <Badge variant="destructive">Sin sincronizar</Badge>
            : <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Sincronizado</Badge>}
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin size={13} /> {polig ? `${polig.codigo} — ${polig.nombre}` : 'Sin polígono'}
        </p>
      </div>

      {/* Datos generales (lectura) */}
      <section className="rounded-lg border p-4 space-y-2 text-sm bg-white">
        <p className="font-medium text-foreground">{reporte.profesional}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1"><Users size={13} /> {operarios} operarios ({reporte.operarios_hombre}H + {reporte.operarios_mujer}M)</span>
          <span className="flex items-center gap-1"><Clock size={13} /> {reporte.hora_ingreso} – {reporte.hora_salida}</span>
        </div>
        {reporte.numeros_cuadrilla.length > 0 && (
          <p className="text-muted-foreground">Cuadrilla: {reporte.numeros_cuadrilla.join(', ')}</p>
        )}
        {reporte.novedades && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">Novedades:</span> {reporte.novedades}</p>
        )}
      </section>

      {/* Actividades + rendimiento (lectura, % editable en cortes) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-green-800">Actividades y rendimiento</h2>
        {actsOrdenadas.map(act => (
          <div key={act.id} className="rounded-lg border overflow-hidden">
            <div className="bg-gray-50 border-b px-3 py-1.5">
              <p className="text-xs font-medium text-gray-700">{act.actividad_nombre}</p>
            </div>
            <div className="divide-y">
              {(detsByAct.get(act.id) ?? []).map(det => {
                const rend = rendByDetId.get(det.id)
                return (
                  <div
                    key={det.id}
                    className={det.es_corte ? 'p-3 space-y-2 bg-red-50/30' : 'p-3 space-y-2'}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">
                        {det.detalle_nombre}
                        {det.es_corte && <span className="ml-1 text-red-500">✂</span>}
                      </p>
                      {rend && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {rend.cantidad_ejecutada} · {rend.num_operarios} op.
                        </span>
                      )}
                    </div>

                    {det.es_corte && rend && (
                      <div className="flex items-end gap-2 border-t border-red-200 pt-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-red-700">% Área Efectiva</Label>
                            <EstadoCorteBadge estado={estadoCorte(true, rend.porcentaje_area_efectiva)} />
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            inputMode="numeric"
                            placeholder="Ej: 85"
                            value={pcts[rend.id] ?? ''}
                            onChange={e => setPcts(prev => ({ ...prev, [rend.id]: e.target.value }))}
                            className="w-28"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Guardar % */}
      {hayCortes && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Confirma el % de cada corte para pasarlo de <span className="text-amber-700 font-medium">pendiente</span> a confirmado.
            </p>
            <Button onClick={handleGuardar} disabled={guardando} className="bg-green-600 hover:bg-green-700 flex-shrink-0">
              {guardando ? 'Guardando…' : 'Guardar %'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
