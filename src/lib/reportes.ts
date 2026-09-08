import { db } from './local-db'
import { syncPendingReports } from './sync'
import { esTrazado } from './catalog-data'
import type {
  Reporte, ActividadReporte, DetalleActividadReporte, Rendimiento,
  ActividadGrupo, DetalleSeleccionado,
} from '@/types'

// ── Resumen para las tarjetas de "Mis formularios" ──────────────
export interface ReporteResumen {
  reporte: Reporte
  numActividades: number
  numSubactividades: number
  numCortes: number
  tienePctPendiente: boolean   // ≥1 corte con % área efectiva sin confirmar (null)
}

// Carga los reportes (opcionalmente acotados por rango de fechas) ya con el
// estado calculado para pintarlos. Pensado para usarse con useLiveQuery: lee
// reportes + actividades + detalles + rendimiento, así Dexie re-ejecuta la
// query cuando cualquiera de esas tablas cambia (sync, confirmar %, borrar).
export async function getReportesResumen(
  opts: { desde?: string; hasta?: string } = {},
): Promise<ReporteResumen[]> {
  const { desde, hasta } = opts
  const coll =
    desde && hasta ? db.reportes.where('fecha').between(desde, hasta, true, true)
    : desde        ? db.reportes.where('fecha').aboveOrEqual(desde)
    : hasta        ? db.reportes.where('fecha').belowOrEqual(hasta)
    :                db.reportes.toCollection()
  const reportes = await coll.toArray()

  if (reportes.length === 0) return []

  // Más reciente primero (por fecha y, a igualdad, por creación).
  reportes.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.created_at.localeCompare(a.created_at))

  const reporteIds = reportes.map(r => r.id)
  const actividades = await db.actividades_reporte.where('reporte_id').anyOf(reporteIds).toArray()
  const actIds = actividades.map(a => a.id)
  const [detalles, rendimientos] = await Promise.all([
    db.detalles_actividad.where('actividad_reporte_id').anyOf(actIds).toArray(),
    db.rendimiento.where('reporte_id').anyOf(reporteIds).toArray(),
  ])

  const actsByReporte = groupBy(actividades, a => a.reporte_id)
  const detsByAct     = groupBy(detalles, d => d.actividad_reporte_id)
  const rendsByReporte = groupBy(rendimientos, r => r.reporte_id)
  const corteDetIds = new Set(detalles.filter(d => d.es_corte).map(d => d.id))

  return reportes.map(rep => {
    const acts = actsByReporte.get(rep.id) ?? []
    const numSubactividades = acts.reduce((sum, a) => sum + (detsByAct.get(a.id)?.length ?? 0), 0)
    const cortesRends = (rendsByReporte.get(rep.id) ?? []).filter(r => corteDetIds.has(r.detalle_reporte_id))
    return {
      reporte: rep,
      numActividades: acts.length,
      numSubactividades,
      numCortes: cortesRends.length,
      tienePctPendiente: cortesRends.some(r => r.porcentaje_area_efectiva === null),
    }
  })
}

// ── Detalle completo de un reporte (vista de lectura) ───────────
export interface ReporteDetalle {
  reporte: Reporte
  actividades: ActividadReporte[]
  detalles: DetalleActividadReporte[]
  rendimientos: Rendimiento[]
}

export async function getReporteDetalle(reporteId: string): Promise<ReporteDetalle | null> {
  const reporte = await db.reportes.get(reporteId)
  if (!reporte) return null

  const actividades = await db.actividades_reporte.where('reporte_id').equals(reporteId).toArray()
  const actIds = actividades.map(a => a.id)
  const [detalles, rendimientos] = await Promise.all([
    db.detalles_actividad.where('actividad_reporte_id').anyOf(actIds).toArray(),
    db.rendimiento.where('reporte_id').equals(reporteId).toArray(),
  ])
  return { reporte, actividades, detalles, rendimientos }
}

// ── Vista diaria (sección Rendimiento por calendario) ───────────
// Todos los informes de una fecha, con su detalle completo. Para useLiveQuery:
// toca reportes/actividades/detalles/rendimiento, así se re-ejecuta al sincronizar.
export async function getReportesPorFecha(fecha: string): Promise<ReporteDetalle[]> {
  const reportes = await db.reportes.where('fecha').equals(fecha).toArray()
  if (!reportes.length) return []
  reportes.sort((a, b) => a.created_at.localeCompare(b.created_at))
  const detalles = await Promise.all(reportes.map(r => getReporteDetalle(r.id)))
  return detalles.filter((d): d is ReporteDetalle => d !== null)
}

// Estado de cada fecha para pintar el calendario:
//   'con-rendimiento' (verde) = todos los informes del día ya tienen rendimiento.
//   'sin-rendimiento'  (azul) = hay informe pero a alguno le falta el rendimiento.
// Las fechas sin informe no aparecen aquí (el calendario las bloquea en gris).
export type EstadoDia = 'con-rendimiento' | 'sin-rendimiento'

export async function getEstadoDias(): Promise<{ fecha: string; estado: EstadoDia }[]> {
  const reportes = await db.reportes.toArray()
  if (!reportes.length) return []
  const rendimientos = await db.rendimiento.where('reporte_id').anyOf(reportes.map(r => r.id)).toArray()
  const conRend = new Set(rendimientos.map(r => r.reporte_id))

  const byFecha = groupBy(reportes, r => r.fecha)
  const out: { fecha: string; estado: EstadoDia }[] = []
  for (const [fecha, reps] of byFecha) {
    const todos = reps.every(r => conRend.has(r.id))
    out.push({ fecha, estado: todos ? 'con-rendimiento' : 'sin-rendimiento' })
  }
  return out
}

// Estado de cortes por día — para el modo "Avance efectivo" del calendario.
// Solo aparecen las fechas que tienen ≥1 rendimiento de corte (aplicables). El
// resto de días quedan bloqueados (no se les puede aplicar %). `confirmados` > 0
// marca conflicto (ya tienen % puesto).
export interface EstadoCortesDia {
  fecha: string
  confirmados: number   // cortes con % ya puesto
  pendientes: number    // cortes con % en null
}

export async function getEstadoCortesDias(): Promise<EstadoCortesDia[]> {
  const reportes = await db.reportes.toArray()
  if (!reportes.length) return []
  const fechaById = new Map(reportes.map(r => [r.id, r.fecha]))
  const rendimientos = await db.rendimiento.where('reporte_id').anyOf(reportes.map(r => r.id)).toArray()

  const detIds = Array.from(new Set(rendimientos.map(r => r.detalle_reporte_id).filter(Boolean)))
  const detalles = await db.detalles_actividad.where('id').anyOf(detIds).toArray()
  const corteDetIds = new Set(detalles.filter(d => d.es_corte).map(d => d.id))

  const byFecha = new Map<string, { confirmados: number; pendientes: number }>()
  for (const r of rendimientos) {
    if (!corteDetIds.has(r.detalle_reporte_id)) continue
    const fecha = fechaById.get(r.reporte_id)
    if (!fecha) continue
    const cur = byFecha.get(fecha) ?? { confirmados: 0, pendientes: 0 }
    if (r.porcentaje_area_efectiva !== null) cur.confirmados++
    else cur.pendientes++
    byFecha.set(fecha, cur)
  }
  return Array.from(byFecha.entries()).map(([fecha, v]) => ({ fecha, ...v }))
}

// ── Guardar / editar el rendimiento de un informe ya existente ──
// El rendimiento se captura DESPUÉS de crear el informe (sección Rendimiento por
// día). Mantiene el id de cada fila estable (update in-place) para que el upsert
// de /api/sync — que concilia por `id` — actualice sin dejar duplicados.
export interface FilaRendimientoInput {
  detalle_reporte_id: string
  actividad_reporte_id: string
  cantidad_ejecutada: number
  num_operarios: number
  porcentaje_area_efectiva: number | null
}

export async function guardarRendimientoReporte(
  reporteId: string,
  filas: FilaRendimientoInput[],
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', [db.rendimiento, db.reportes], async () => {
    const existentes = await db.rendimiento.where('reporte_id').equals(reporteId).toArray()
    const porDetalle = new Map(existentes.map(r => [r.detalle_reporte_id, r]))
    for (const f of filas) {
      const prev = porDetalle.get(f.detalle_reporte_id)
      if (prev) {
        await db.rendimiento.update(prev.id, {
          actividad_reporte_id: f.actividad_reporte_id,
          cantidad_ejecutada: f.cantidad_ejecutada,
          num_operarios: f.num_operarios,
          porcentaje_area_efectiva: f.porcentaje_area_efectiva,
        })
      } else {
        await db.rendimiento.add({
          id: crypto.randomUUID(),
          reporte_id: reporteId,
          actividad_reporte_id: f.actividad_reporte_id,
          detalle_reporte_id: f.detalle_reporte_id,
          cantidad_ejecutada: f.cantidad_ejecutada,
          num_operarios: f.num_operarios,
          porcentaje_area_efectiva: f.porcentaje_area_efectiva,
          created_at: now,
        })
      }
    }
    await db.reportes.update(reporteId, { sync_status: 'pending', updated_at: now })
  })
  syncPendingReports().catch(console.error)
}

// ── Cargar un informe para editarlo en el formulario ───────────
export interface EdicionReporte {
  reporteId: string
  hoja1: Pick<Reporte,
    'profesional' | 'fecha' | 'poligono_id' | 'numeros_cuadrilla' |
    'operarios_hombre' | 'operarios_mujer' | 'hora_ingreso' | 'hora_salida'>
  novedades: string
  actividadGrupos: ActividadGrupo[]
}

export async function prepararEdicion(reporteId: string): Promise<EdicionReporte | null> {
  const d = await getReporteDetalle(reporteId)
  if (!d) return null
  const nucleos = await db.nucleos.where('reporte_id').equals(reporteId).toArray()
  const acts = [...d.actividades].sort((a, b) => a.orden - b.orden)

  const actividadGrupos: ActividadGrupo[] = acts.map(act => {
    const dets = d.detalles.filter(x => x.actividad_reporte_id === act.id).sort((a, b) => a.orden - b.orden)
    const detalles: DetalleSeleccionado[] = dets.map(det => {
      const nuc = esTrazado(det.detalle_nombre) ? nucleos.shift() : undefined
      return {
        tempId: crypto.randomUUID(),
        detalleNombre: det.es_otro ? '' : det.detalle_nombre,
        esOtro: det.es_otro,
        customNombre: det.es_otro ? det.detalle_nombre : '',
        esCorte: det.es_corte,
        trazado: nuc ? { escenario: nuc.escenario, tipo: nuc.tipo, lat: nuc.lat, lng: nuc.lng } : undefined,
      }
    })
    return {
      tempId: crypto.randomUUID(),
      actividadNombre: act.es_otra ? '' : act.actividad_nombre,
      esOtra: act.es_otra,
      customNombre: act.es_otra ? act.actividad_nombre : '',
      detalles,
    }
  })

  const r = d.reporte
  return {
    reporteId,
    hoja1: {
      profesional: r.profesional, fecha: r.fecha, poligono_id: r.poligono_id,
      numeros_cuadrilla: r.numeros_cuadrilla, operarios_hombre: r.operarios_hombre,
      operarios_mujer: r.operarios_mujer, hora_ingreso: r.hora_ingreso, hora_salida: r.hora_salida,
    },
    novedades: r.novedades ?? '',
    actividadGrupos,
  }
}

// ── Confirmar % área efectiva de cortes ─────────────────────────
// Aplica un % por cada rendimiento de corte indicado, marca el reporte como
// pendiente de re-sincronizar y dispara el sync. Todo en una transacción.
export async function confirmarPorcentajesCorte(
  reporteId: string,
  updates: { rendimientoId: string; pct: number }[],
): Promise<void> {
  if (updates.length === 0) return
  await db.transaction('rw', [db.rendimiento, db.reportes], async () => {
    for (const u of updates) {
      await db.rendimiento.update(u.rendimientoId, { porcentaje_area_efectiva: u.pct })
    }
    await db.reportes.update(reporteId, {
      sync_status: 'pending',
      updated_at: new Date().toISOString(),
    })
  })
  syncPendingReports().catch(console.error)
}

// ── Eliminar un reporte y todos sus hijos (solo en el dispositivo) ──
export async function eliminarReporte(reporteId: string): Promise<void> {
  await db.transaction('rw', [
    db.reportes, db.actividades_reporte, db.detalles_actividad,
    db.rendimiento, db.avance_efectivo,
  ], async () => {
    const actIds = (await db.actividades_reporte.where('reporte_id').equals(reporteId).toArray())
      .map(a => a.id)
    await db.detalles_actividad.where('actividad_reporte_id').anyOf(actIds).delete()
    await db.actividades_reporte.where('reporte_id').equals(reporteId).delete()
    await db.rendimiento.where('reporte_id').equals(reporteId).delete()
    await db.avance_efectivo.where('reporte_id').equals(reporteId).delete()
    await db.reportes.delete(reporteId)
  })
}

// ── helper ──────────────────────────────────────────────────────
function groupBy<T, K>(items: T[], keyOf: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const arr = map.get(key)
    if (arr) arr.push(item)
    else map.set(key, [item])
  }
  return map
}
