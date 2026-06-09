import { db } from './local-db'
import { syncPendingReports } from './sync'

// Traffic-light state for a corte's "% área efectiva".
export type EstadoCorte = 'confirmado' | 'pendiente' | 'no-aplica'

export function estadoCorte(esCorte: boolean, porcentaje: number | null): EstadoCorte {
  if (!esCorte) return 'no-aplica'
  return porcentaje === null ? 'pendiente' : 'confirmado'
}

export interface AvanceResultado {
  actualizados: number   // rendimientos de corte modificados
  yaConfirmados: number  // cortes en el rango que ya tenían % registrado
  totalCortes: number    // cortes en el rango
}

// Apply a % área efectiva to every "corte" rendimiento inside a date range.
// By default it only fills the pending (null) ones; pass sobrescribirConfirmados
// to also overwrite the ones already set. Touched reportes are flagged for re-sync.
export async function aplicarAvanceEfectivo(
  fechaInicio: string,
  fechaFin: string,
  porcentaje: number,
  opts: { sobrescribirConfirmados?: boolean } = {},
): Promise<AvanceResultado> {
  const reportes = await db.reportes
    .where('fecha').between(fechaInicio, fechaFin, true, true)
    .toArray()
  if (!reportes.length) return { actualizados: 0, yaConfirmados: 0, totalCortes: 0 }

  const reporteIds = reportes.map(r => r.id)
  const rendimientos = await db.rendimiento.where('reporte_id').anyOf(reporteIds).toArray()

  // Keep only rendimientos whose detalle is a corte.
  const detIds = Array.from(new Set(rendimientos.map(r => r.detalle_reporte_id).filter(Boolean)))
  const detalles = await db.detalles_actividad.where('id').anyOf(detIds).toArray()
  const corteDetIds = new Set(detalles.filter(d => d.es_corte).map(d => d.id))

  const cortes = rendimientos.filter(r => corteDetIds.has(r.detalle_reporte_id))
  const yaConfirmados = cortes.filter(r => r.porcentaje_area_efectiva !== null).length

  const objetivo = opts.sobrescribirConfirmados
    ? cortes
    : cortes.filter(r => r.porcentaje_area_efectiva === null)

  if (objetivo.length > 0) {
    await db.rendimiento
      .where('id').anyOf(objetivo.map(r => r.id))
      .modify({ porcentaje_area_efectiva: porcentaje })

    const reportesAfectados = Array.from(new Set(objetivo.map(r => r.reporte_id)))
    await db.reportes.where('id').anyOf(reportesAfectados).modify({ sync_status: 'pending' })
    syncPendingReports().catch(console.error)
  }

  return { actualizados: objetivo.length, yaConfirmados, totalCortes: cortes.length }
}
