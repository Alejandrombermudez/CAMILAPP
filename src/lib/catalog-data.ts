// Auto-generated from Libro1.xlsx — DO NOT EDIT MANUALLY
import type { Poligono, ActividadCatalogo, DetalleCatalogo } from '@/types'

// es_corte = true when the detalle name contains "corte" (case-insensitive).
// This is the single source of truth — DETALLES below derives its flag from it.
export function esCorteDetalle(nombre: string): boolean {
  return nombre.toLowerCase().includes('corte')
}

// Subactividad que dispara el flujo de trazado (escenario + tipo + GPS → núcleo).
export const TRAZADO_DETALLE = 'Trazado de los diseños establecidos'
export function esTrazado(nombre: string): boolean {
  return nombre.trim().toLowerCase() === TRAZADO_DETALLE.toLowerCase()
}

// Catalog ids are defined here (not auto-assigned by Supabase) so the offline
// fallback, the Supabase seed and the synced reportes all reference the SAME id.
const POLIGONOS_RAW: Omit<Poligono, 'id'>[] = [
  { codigo: 'RECB0081', nombre: 'Arborizadora Alta' },
  { codigo: 'RECB0161', nombre: 'Arborizadora Alta' },
  { codigo: 'RECB0194', nombre: 'Cerro Seco (SIMA)' },
  { codigo: 'RESC0060', nombre: 'Cantera' },
  { codigo: 'RESC0155', nombre: 'Quebrada Verejones' },
  { codigo: 'RESC0195', nombre: 'Zuque SIMA' },
  { codigo: 'RESC0055', nombre: 'Quebrada Toches' },
  { codigo: 'RESC0305', nombre: 'El Delirio -La Hoya de San Cristóbal' },
  { codigo: 'RESC0142', nombre: 'Futuro Parque Metropolitano La Arboleda' },
  { codigo: 'RESC0054', nombre: 'Serranía del Zuque' },
  { codigo: 'RESF0217', nombre: 'FA07_1 Los Laches' },
  { codigo: 'RESF0068', nombre: 'Monserrate La Calera I' },
  { codigo: 'RESF0058', nombre: 'Monserrate La Calera I' },
  { codigo: 'REUS0316', nombre: 'La Regadera (Usme)' },
  { codigo: 'RESF0216', nombre: 'FA06_1 El Dorado' },
  { codigo: 'REUQ0315', nombre: 'La Serranía Componente 3' },
  { codigo: 'RESF0218', nombre: 'FA08_1 La Peña' },
  { codigo: 'REUQ0305', nombre: 'La serranía Componente 1' },
  { codigo: 'RECP0300', nombre: 'Calasanz' },
  { codigo: 'RECP0299', nombre: 'FA_Mindefensa' },
  { codigo: 'RESC0049', nombre: 'Aguas Claras' },
  { codigo: 'REUQ0302', nombre: 'FA_21_1' },
  { codigo: 'RECB0317', nombre: 'La Regadera (Ciudad Bolivar)' },
  { codigo: 'RESF0323', nombre: 'La Calera Monserrate 1' },
  { codigo: 'REUQ0321', nombre: 'FA_La Serranía' },
]

const ACTIVIDADES_RAW: string[] = [
  '1. Plantación (Siembra)',
  '2. Control Retamo liso',
  '3. Control Chusque y helecho',
  '4. Control Retamo espinoso',
  '5. Control especies forestales exóticas',
  '6. Instalación perchas para aves',
  '7. Instalación cajas nido tipo balcón',
  '8. Instalación refugios para reptiles y anfibios',
  '9. Instalación refugios para murciélagos',
  '10. Instalación madrigueras',
  '11. Georreferenciación arreglos florísticos, Fauna',
  '12. Georreferenciación de áreas de control',
  '13. Ortofoto',
  '14. Primer Mantenimiento',
  '15. Reposición',
  '16. Tutorado',
  '17. Instalación Cercas',
  '3. Control Chusque y helecho marranero',
  '11. Georreferenciación de los arreglos florísticos',
  '12. Georreferenciación áreas y control cambio cobertura',
  '13. Toma de ortoimágenes antes y después',
  '14. Mantenimiento individuo vegetal',
  '15. Replante y enriquecimiento',
  '17. Instalación o adecuación de cercas',
]

const DETALLES_RAW: string[] = [
  'Cal.',
  'Hidroretenedor.',
  'Humus.',
  'Compost.',
  'Pino.',
  'Acacia.',
  'Eucalipto.',
  'Ahoyado.',
  'Llenado.',
  'Individuo plantado.',
  'Plateo.',
  'Fertilizacion.',
  'Fertiriego.',
  'Control Fitosanitario.',
  'Riego.',
  'Elaboracion de fajina',
  'Corte de flor del retamo',
  'Corte material somatico',
  'Destoconado',
  'Transporte para incineración',
  'Recolección de material cortado',
  'Triturado/chipeado y Empaque en globos',
  'Trazado de los diseños establecidos',
]

// ── Subactividades permitidas por actividad ───────────────────
// Clasificación aportada por la profesional de campo (Excel, ago-2026).
// La clave es el NÚMERO de la actividad (1–17), por lo que aplica por igual
// a las dos variantes de nombre que comparten número en el catálogo.
// Una actividad SIN entrada aquí no está clasificada → se muestran todas las
// subactividades (fallback no bloqueante).
const SUBACTIVIDADES_POR_ACTIVIDAD: Record<number, string[]> = {
  1: ['Cal.', 'Hidroretenedor.', 'Humus.', 'Ahoyado.', 'Llenado.', 'Individuo plantado.', 'Riego.', 'Trazado de los diseños establecidos'],
  2: ['Corte de flor del retamo', 'Corte material somatico', 'Destoconado', 'Transporte para incineración', 'Recolección de material cortado', 'Triturado/chipeado y Empaque en globos'],
  3: ['Elaboracion de fajina', 'Corte material somatico', 'Destoconado', 'Recolección de material cortado'],
  4: ['Corte de flor del retamo', 'Corte material somatico', 'Destoconado', 'Transporte para incineración', 'Recolección de material cortado', 'Triturado/chipeado y Empaque en globos'],
  5: ['Pino.', 'Acacia.', 'Eucalipto.', 'Elaboracion de fajina'],
  14: ['Plateo.', 'Fertilizacion.', 'Fertiriego.', 'Control Fitosanitario.', 'Riego.'],
}

// Extrae el número inicial del nombre de la actividad ("14. Primer Mantenimiento" → 14).
export function actividadNumero(nombre: string): number | null {
  const m = nombre.match(/^\s*(\d+)\s*\./)
  return m ? parseInt(m[1], 10) : null
}

// Devuelve la lista de subactividades permitidas para una actividad, o `null`
// si la actividad no está clasificada (el llamador debe mostrar todas).
export function subactividadesPermitidas(actividadNombre: string): string[] | null {
  const num = actividadNumero(actividadNombre)
  if (num === null) return null
  return SUBACTIVIDADES_POR_ACTIVIDAD[num] ?? null
}

// ── Unidad de medida por subactividad ─────────────────────────
// 'm²' para las que miden área; 'unidad' para conteo de elementos discretos.
// Por defecto (subactividad "Otro"/personalizada): corte → m², resto → unidad.
// Ajustable aquí si alguna va distinto (revisar con la profesional).
export type Unidad = 'm²' | 'unidad'

const UNIDAD_POR_SUBACTIVIDAD: Record<string, Unidad> = {
  'Cal.': 'unidad',
  'Hidroretenedor.': 'unidad',
  'Humus.': 'unidad',
  'Compost.': 'unidad',
  'Pino.': 'unidad',
  'Acacia.': 'unidad',
  'Eucalipto.': 'unidad',
  'Ahoyado.': 'unidad',
  'Llenado.': 'unidad',
  'Individuo plantado.': 'unidad',
  'Plateo.': 'unidad',
  'Fertilizacion.': 'unidad',
  'Fertiriego.': 'unidad',
  'Control Fitosanitario.': 'unidad',
  'Riego.': 'unidad',
  'Elaboracion de fajina': 'm²',
  'Corte de flor del retamo': 'm²',
  'Corte material somatico': 'm²',
  'Destoconado': 'unidad',
  'Transporte para incineración': 'unidad',
  'Recolección de material cortado': 'm²',
  'Triturado/chipeado y Empaque en globos': 'unidad',
  'Trazado de los diseños establecidos': 'm²',
}

export function unidadSubactividad(nombre: string): Unidad {
  return UNIDAD_POR_SUBACTIVIDAD[nombre] ?? (esCorteDetalle(nombre) ? 'm²' : 'unidad')
}

// Etiqueta legible: "m²" o "unidad"/"unidades" según cantidad.
export function formatUnidad(nombre: string, cantidad: number): string {
  const u = unidadSubactividad(nombre)
  if (u === 'm²') return 'm²'
  return cantidad === 1 ? 'unidad' : 'unidades'
}

export const POLIGONOS: Poligono[] = POLIGONOS_RAW.map((p, i) => ({ id: i + 1, ...p }))

export const ACTIVIDADES: ActividadCatalogo[] = ACTIVIDADES_RAW.map((nombre, i) => ({ id: i + 1, nombre }))

export const DETALLES: DetalleCatalogo[] = DETALLES_RAW.map((nombre, i) => ({
  id: i + 1,
  nombre,
  es_corte: esCorteDetalle(nombre),
}))
