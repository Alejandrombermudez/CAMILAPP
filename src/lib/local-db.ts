import Dexie, { type Table } from 'dexie'
import type {
  Poligono, ActividadCatalogo, DetalleCatalogo,
  Reporte, ActividadReporte, DetalleActividadReporte,
  Rendimiento, AvanceEfectivo,
} from '@/types'

export class CamilappDB extends Dexie {
  poligonos!:             Table<Poligono>
  actividades_catalogo!:  Table<ActividadCatalogo>
  detalles_catalogo!:     Table<DetalleCatalogo>
  reportes!:              Table<Reporte>
  actividades_reporte!:   Table<ActividadReporte>
  detalles_actividad!:    Table<DetalleActividadReporte>
  rendimiento!:           Table<Rendimiento>
  avance_efectivo!:       Table<AvanceEfectivo>

  constructor() {
    super('camilapp')
    this.version(1).stores({
      poligonos:            'id, codigo',
      actividades_catalogo: 'id, nombre',
      detalles_catalogo:    'id, nombre, es_corte',
      reportes:             'id, fecha, poligono_id, sync_status, local_id',
      actividades_reporte:  'id, reporte_id',
      detalles_actividad:   'id, actividad_reporte_id',
      rendimiento:          'id, reporte_id, actividad_reporte_id',
      avance_efectivo:      'id, reporte_id, fecha_inicio, fecha_fin',
    })
  }
}

export const db = new CamilappDB()

// Seed the local catalog with the bundled fallback only when it's still empty.
export async function seedCatalogIfEmpty(
  poligs: Poligono[],
  acts: ActividadCatalogo[],
  dets: DetalleCatalogo[],
) {
  const count = await db.poligonos.count()
  if (count > 0) return

  await db.transaction('rw', [db.poligonos, db.actividades_catalogo, db.detalles_catalogo], async () => {
    await db.poligonos.bulkPut(poligs)
    await db.actividades_catalogo.bulkPut(acts)
    await db.detalles_catalogo.bulkPut(dets)
  })
}

// Overwrite the local catalog with fresh rows from Supabase. Safe because catalog
// ids are stable (defined in catalog-data), so bulkPut updates in place without
// breaking poligono_id references in stored reportes. Rows removed upstream are
// intentionally kept locally to avoid dangling references.
export async function refreshCatalogFromServer(
  poligs: Poligono[],
  acts: ActividadCatalogo[],
  dets: DetalleCatalogo[],
) {
  await db.transaction('rw', [db.poligonos, db.actividades_catalogo, db.detalles_catalogo], async () => {
    if (poligs.length) await db.poligonos.bulkPut(poligs)
    if (acts.length)   await db.actividades_catalogo.bulkPut(acts)
    if (dets.length)   await db.detalles_catalogo.bulkPut(dets)
  })
}
