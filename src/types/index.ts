export type SyncStatus = 'pending' | 'synced'

// ── Catalog ──────────────────────────────────────────────────
export interface Poligono {
  id: number
  codigo: string
  nombre: string
}

export interface ActividadCatalogo {
  id: number
  nombre: string
}

export interface DetalleCatalogo {
  id: number
  nombre: string
  es_corte: boolean
}

// ── Stored form records (mirrors Supabase + IndexedDB) ────────
export interface Reporte {
  id: string
  profesional: string
  fecha: string            // 'YYYY-MM-DD'
  poligono_id: number | null
  numeros_cuadrilla: number[]
  operarios_hombre: number
  operarios_mujer: number
  hora_ingreso: string     // 'HH:mm' 24h
  hora_salida: string
  novedades: string | null
  sync_status: SyncStatus
  local_id: string
  created_at: string
  updated_at: string
}

export interface ActividadReporte {
  id: string
  reporte_id: string
  actividad_nombre: string
  es_otra: boolean
  orden: number
}

export interface DetalleActividadReporte {
  id: string
  actividad_reporte_id: string
  detalle_nombre: string
  es_otro: boolean
  es_corte: boolean
  orden: number
}

export interface Rendimiento {
  id: string
  reporte_id: string
  actividad_reporte_id: string
  detalle_reporte_id: string
  cantidad_ejecutada: number
  num_operarios: number
  porcentaje_area_efectiva: number | null  // only when es_corte
  created_at: string
}

export interface AvanceEfectivo {
  id: string
  reporte_id: string
  fecha_inicio: string
  fecha_fin: string
  created_at: string
}

// ── Form-level types (used in Zustand store + components) ─────
export interface DetalleSeleccionado {
  tempId: string
  detalleNombre: string
  esOtro: boolean
  customNombre: string
  esCorte: boolean
}

export interface ActividadGrupo {
  tempId: string
  actividadNombre: string
  esOtra: boolean
  customNombre: string
  detalles: DetalleSeleccionado[]
}

export interface RendimientoFila {
  tempId: string                          // actGrupoTempId + '__' + detTempId
  actividadGrupoTempId: string
  detalleTempId: string
  actividadNombre: string
  detalleNombre: string
  esCorte: boolean
  cantidadEjecutada: number | null
  numOperarios: number | null
  porcentajeAreaEfectiva: number | null   // only when esCorte
}

// ── Zustand form store ────────────────────────────────────────
export interface FormStoreState {
  // Hoja 1
  profesional: string
  fecha: string
  poligono_id: number | null
  numeros_cuadrilla: number[]
  operarios_hombre: number
  operarios_mujer: number
  hora_ingreso: string
  hora_salida: string

  // Hoja 2
  actividadGrupos: ActividadGrupo[]
  novedades: string

  // Hoja 3
  rendimientoFilas: RendimientoFila[]
  avance_fecha_inicio: string | null
  avance_fecha_fin: string | null

  // Actions
  patchHoja1: (data: Partial<Pick<FormStoreState,
    'profesional' | 'fecha' | 'poligono_id' | 'numeros_cuadrilla' |
    'operarios_hombre' | 'operarios_mujer' | 'hora_ingreso' | 'hora_salida'
  >>) => void
  setActividadGrupos: (grupos: ActividadGrupo[]) => void
  setNovedades: (n: string) => void
  setRendimientoFilas: (filas: RendimientoFila[]) => void
  patchRendimientoFila: (tempId: string, patch: Partial<RendimientoFila>) => void
  setAvanceFechas: (inicio: string | null, fin: string | null) => void
  resetForm: () => void
}
