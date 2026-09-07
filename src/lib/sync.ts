import { db } from './local-db'
import { getSyncSecret } from './sync-auth'
import type {
  Reporte, ActividadReporte, DetalleActividadReporte,
  Rendimiento, AvanceEfectivo, Nucleo,
} from '@/types'

export type SyncResult =
  | { status: 'idle' }          // nada que sincronizar / ya hay un sync en curso
  | { status: 'offline' }
  | { status: 'no-secret' }     // falta configurar la clave de sincronización
  | { status: 'auth-failed' }   // el servidor rechazó la clave (401)
  | { status: 'error' }
  | { status: 'ok'; synced: number }

let isSyncing = false

export async function syncPendingReports(): Promise<SyncResult> {
  if (isSyncing) return { status: 'idle' }
  if (typeof navigator === 'undefined' || !navigator.onLine) return { status: 'offline' }

  const secret = getSyncSecret()
  if (!secret) return { status: 'no-secret' }

  isSyncing = true
  try {
    const pending = await db.reportes.where('sync_status').equals('pending').toArray()
    if (pending.length === 0) return { status: 'idle' }

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
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': secret },
      body: JSON.stringify({
        reportes: pending,
        actividades: actividadesAll,
        detalles,
        rendimientos,
        avances,
      }),
    })

    if (res.status === 401) return { status: 'auth-failed' }
    if (!res.ok) return { status: 'error' }

    await db.reportes.where('id').anyOf(reporteIds).modify({ sync_status: 'synced' })
    return { status: 'ok', synced: pending.length }
  } catch {
    return { status: 'error' }
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
  // Núcleos de trazado (local-first; aún no entran en el sync a Supabase).
  nucleos?: Omit<Nucleo, 'reporte_id' | 'sync_status' | 'created_at'>[]
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
  const nucleos: Nucleo[] = (input.nucleos ?? []).map(n => ({
    ...n,
    reporte_id: id,
    sync_status: 'pending',
    created_at: now,
  }))

  await db.transaction('rw', [
    db.reportes,
    db.actividades_reporte,
    db.detalles_actividad,
    db.rendimiento,
    db.avance_efectivo,
    db.nucleos,
  ], async () => {
    await db.reportes.put(reporte)
    await db.actividades_reporte.bulkPut(actividades)
    await db.detalles_actividad.bulkPut(input.detalles)
    await db.rendimiento.bulkPut(rendimientos)
    await db.avance_efectivo.bulkPut(avances)
    if (nucleos.length) await db.nucleos.bulkPut(nucleos)
  })

  syncPendingReports().catch(console.error)
  return id
}
