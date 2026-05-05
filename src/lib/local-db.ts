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

export async function seedCatalogIfEmpty(
  sbPoligs: Poligono[],
  sbActs: ActividadCatalogo[],
  sbDets: DetalleCatalogo[],
  fallbackPoligs: Poligono[],
  fallbackActs: ActividadCatalogo[],
  fallbackDets: DetalleCatalogo[],
) {
  const count = await db.poligonos.count()
  if (count > 0) return

  const poligs = sbPoligs.length ? sbPoligs : fallbackPoligs
  const acts   = sbActs.length   ? sbActs   : fallbackActs
  const dets   = sbDets.length   ? sbDets   : fallbackDets

  await db.transaction('rw', [db.poligonos, db.actividades_catalogo, db.detalles_catalogo], async () => {
    await db.poligonos.bulkPut(poligs)
    await db.actividades_catalogo.bulkPut(acts)
    await db.detalles_catalogo.bulkPut(dets)
  })
}
