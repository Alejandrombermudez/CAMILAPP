import { db } from './local-db'
import type {
  Reporte, ActividadReporte, DetalleActividadReporte,
  Rendimiento, AvanceEfectivo,
} from '@/types'

let isSyncing = false

export async function syncPendingReports(): Promise<void> {
  if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine) return
  isSyncing = true
  try {
    const pending = await db.reportes.where('sync_status').equals('pending').toArray()
    if (pending.length === 0) return

    const reporteIds = pending.map(r => r.id)

    const actividadesAll = await db.actividades_reporte.where('reporte_id').anyOf(reporteIds).toArray()
    const actIds = actividadesAll.map(a => a.id)

    const [detalles, rendimientos, avances] = await Promise.all([
      db.detalles_actividad.where('actividad_reporte_id').anyOf(actIds).toArray(),
      db.rendimiento.where('reporte_id').anyOf(reporteIds).toArray(),
      db.avance_efectivo.where('reporte_id').anyOf(reporteIds).toArray(),
    ])

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportes: pending,
        actividades: actividadesAll,
        detalles,
        rendimientos,
        avances,
      }),
    })

    if (res.ok) {
      await db.reportes.where('id').anyOf(reporteIds).modify({ sync_status: 'synced' })
    }
  } finally {
    isSyncing = false
  }
}

interface SaveReporteInput {
  local_id: string
  profesional: string
  fecha: string
  poligono_id: number | null
  numeros_cuadrilla: number[]
  operarios_hombre: number
  operarios_mujer: number
  hora_ingreso: string
  hora_salida: string
  novedades: string | null
  actividades: Omit<ActividadReporte, 'reporte_id'>[]
  detalles: DetalleActividadReporte[]
  rendimientos: Omit<Rendimiento, 'reporte_id' | 'created_at'>[]
  avances: Omit<AvanceEfectivo, 'reporte_id' | 'created_at'>[]
}

export async function saveReporte(input: SaveReporteInput): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const reporte: Reporte = {
    id,
    profesional: input.profesional,
    fecha: input.fecha,
    poligono_id: input.poligono_id,
    numeros_cuadrilla: input.numeros_cuadrilla,
    operarios_hombre: input.operarios_hombre,
    operarios_mujer: input.operarios_mujer,
    hora_ingreso: input.hora_ingreso,
    hora_salida: input.hora_salida,
    novedades: input.novedades,
    sync_status: 'pending',
    local_id: input.local_id,
    created_at: now,
    updated_at: now,
  }

  const actividades: ActividadReporte[] = input.actividades.map(a => ({ ...a, reporte_id: id }))
  const rendimientos: Rendimiento[] = input.rendimientos.map(r => ({
    ...r,
    reporte_id: id,
    created_at: now,
  }))
  const avances: AvanceEfectivo[] = input.avances.map(av => ({
    ...av,
    reporte_id: id,
    created_at: now,
  }))

  await db.transaction('rw', [
    db.reportes,
    db.actividades_reporte,
    db.detalles_actividad,
    db.rendimiento,
    db.avance_efectivo,
  ], async () => {
    await db.reportes.put(reporte)
    await db.actividades_reporte.bulkPut(actividades)
    await db.detalles_actividad.bulkPut(input.detalles)
    await db.rendimiento.bulkPut(rendimientos)
    await db.avance_efectivo.bulkPut(avances)
  })

  syncPendingReports().catch(console.error)
  return id
}

export async function bulkUpdatePorcentaje(
  fechaInicio: string,
  fechaFin: string,
  porcentaje: number,
): Promise<void> {
  const reportesEnRango = await db.reportes
    .where('fecha').between(fechaInicio, fechaFin, true, true)
    .toArray()

  if (reportesEnRango.length === 0) return
  const reporteIds = reportesEnRango.map(r => r.id)

  await db.rendimiento
    .where('reporte_id').anyOf(reporteIds)
    .filter(r => r.porcentaje_area_efectiva === null)
    .modify({ porcentaje_area_efectiva: porcentaje })
}
