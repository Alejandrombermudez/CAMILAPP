import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import type { Reporte, ActividadReporte, DetalleActividadReporte, Rendimiento, AvanceEfectivo } from '@/types'

interface SyncPayload {
  reportes:    Reporte[]
  actividades: ActividadReporte[]
  detalles:    DetalleActividadReporte[]
  rendimientos: Rendimiento[]
  avances:     AvanceEfectivo[]
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body: SyncPayload = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strip = (arr: any[], ...keys: string[]) =>
    arr.map(item => {
      const copy = { ...item }
      keys.forEach(k => delete copy[k])
      return copy
    })

  const results = await Promise.all([
    supabase.from('reportes').upsert(
      strip(body.reportes, 'sync_status'),
      { onConflict: 'local_id' }
    ),
    supabase.from('actividades_reporte').upsert(body.actividades, { onConflict: 'id' }),
    supabase.from('detalles_actividad_reporte').upsert(body.detalles, { onConflict: 'id' }),
    supabase.from('rendimiento').upsert(body.rendimientos, { onConflict: 'id' }),
    supabase.from('avance_efectivo').upsert(body.avances, { onConflict: 'id' }),
  ])

  const errors = results.map(r => r.error).filter(Boolean)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 500 })

  return NextResponse.json({ ok: true, synced: body.reportes.length })
}
