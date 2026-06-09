import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase'

// sync_status is intentionally omitted: it is a local-only column and Zod's
// default strip() drops it from the parsed payload before it reaches Supabase.
const reporteSchema = z.object({
  id:                z.string().uuid(),
  profesional:       z.string(),
  fecha:             z.string(),
  poligono_id:       z.number().nullable(),
  numeros_cuadrilla: z.array(z.number()),
  operarios_hombre:  z.number(),
  operarios_mujer:   z.number(),
  hora_ingreso:      z.string(),
  hora_salida:       z.string(),
  novedades:         z.string().nullable(),
  local_id:          z.string(),
  created_at:        z.string(),
  updated_at:        z.string(),
})

const actividadSchema = z.object({
  id:               z.string().uuid(),
  reporte_id:       z.string().uuid(),
  actividad_nombre: z.string(),
  es_otra:          z.boolean(),
  orden:            z.number(),
})

const detalleSchema = z.object({
  id:                   z.string().uuid(),
  actividad_reporte_id: z.string().uuid(),
  detalle_nombre:       z.string(),
  es_otro:              z.boolean(),
  es_corte:             z.boolean(),
  orden:                z.number(),
})

const rendimientoSchema = z.object({
  id:                       z.string().uuid(),
  reporte_id:               z.string().uuid(),
  actividad_reporte_id:     z.string(),
  detalle_reporte_id:       z.string(),
  cantidad_ejecutada:       z.number(),
  num_operarios:            z.number(),
  porcentaje_area_efectiva: z.number().nullable(),
  created_at:               z.string(),
})

const avanceSchema = z.object({
  id:           z.string().uuid(),
  reporte_id:   z.string().uuid(),
  fecha_inicio: z.string(),
  fecha_fin:    z.string(),
  created_at:   z.string(),
})

const payloadSchema = z.object({
  reportes:     z.array(reporteSchema),
  actividades:  z.array(actividadSchema),
  detalles:     z.array(detalleSchema),
  rendimientos: z.array(rendimientoSchema),
  avances:      z.array(avanceSchema),
})

function authorize(req: NextRequest): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.SYNC_SECRET
  if (!expected) {
    return { ok: false, status: 503, error: 'Sincronización no configurada en el servidor (falta SYNC_SECRET).' }
  }
  if (req.headers.get('x-sync-secret') !== expected) {
    return { ok: false, status: 401, error: 'No autorizado.' }
  }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  const auth = authorize(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido.', issues: parsed.error.issues }, { status: 400 })
  }
  const body = parsed.data

  const supabase = createServerSupabase()

  // Las tablas tienen FKs encadenadas: reportes → actividades_reporte →
  // detalles_actividad_reporte → rendimiento. Hay que insertarlas EN ESTE ORDEN;
  // un Promise.all concurrente puede insertar rendimiento antes que sus padres y
  // violar las claves foráneas.
  const steps: Array<{ table: string; rows: Record<string, unknown>[]; onConflict: string }> = [
    { table: 'reportes',                   rows: body.reportes,     onConflict: 'local_id' },
    { table: 'actividades_reporte',        rows: body.actividades,  onConflict: 'id' },
    { table: 'detalles_actividad_reporte', rows: body.detalles,     onConflict: 'id' },
    { table: 'rendimiento',                rows: body.rendimientos, onConflict: 'id' },
    { table: 'avance_efectivo',            rows: body.avances,      onConflict: 'id' },
  ]

  for (const step of steps) {
    if (step.rows.length === 0) continue
    const { error } = await supabase.from(step.table).upsert(step.rows, { onConflict: step.onConflict })
    if (error) {
      return NextResponse.json({ error: `Error al guardar ${step.table}.`, details: error }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, synced: body.reportes.length })
}
