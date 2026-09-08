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

// ── Mapa / Georreferenciación ─────────────────────────────────
export type OrigenGeo = 'gps' | 'import' | 'manual'

export type PuntoTipo =
  | 'individuo'    // individuo vegetal plantado
  | 'percha'       // percha para aves
  | 'nido'         // caja nido
  | 'refugio'      // refugio reptiles / anfibios / murciélagos
  | 'madriguera'
  | 'muestreo'
  | 'otro'

export interface LatLng {
  lat: number
  lng: number
}

// Punto georreferenciado individual (marcador). Igual que los reportes: vive en
// IndexedDB y sube por sync; no se lee de Supabase con la anon key.
export interface Punto {
  id: string
  poligono_id: number | null
  reporte_id: string | null     // informe donde se capturó (opcional)
  nombre: string
  tipo: PuntoTipo
  lat: number
  lng: number
  altitud: number | null        // m
  precision: number | null      // m (exactitud reportada por el GPS)
  notas: string | null
  origen: OrigenGeo
  sync_status: SyncStatus
  local_id: string
  created_at: string
}

// Núcleo de restauración = punto donde se traza un módulo de nucleación, con su
// escenario (diseño florístico) y tipo (1-4). Se captura por GPS al registrar la
// subactividad "Trazado de los diseños establecidos". Local-first como los reportes.
export interface Nucleo {
  id: string
  reporte_id: string | null     // informe donde se capturó
  poligono_id: number | null
  escenario: string             // clave del escenario (ver designs-data)
  tipo: number                  // 1-4 (tipo de núcleo)
  lat: number
  lng: number
  altitud: number | null
  precision: number | null
  notas: string | null
  origen: OrigenGeo
  sync_status: SyncStatus
  local_id: string
  created_at: string
}

// ── Form-level types (used in Zustand store + components) ─────
// Datos del trazado (solo para la subactividad "Trazado de los diseños establecidos"):
// escenario + tipo elegidos y el punto GPS capturado. Al guardar el informe se
// materializa en un registro `Nucleo`.
export interface TrazadoNucleo {
  escenario: string
  tipo: number
  lat: number | null
  lng: number | null
}

export interface DetalleSeleccionado {
  tempId: string
  detalleNombre: string
  esOtro: boolean
  customNombre: string
  esCorte: boolean
  trazado?: TrazadoNucleo
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

  // Edición: id del informe que se está editando (null = nuevo)
  editandoId: string | null

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
  setEditandoId: (id: string | null) => void
  resetForm: () => void
}
