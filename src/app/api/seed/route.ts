import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { POLIGONOS, ACTIVIDADES, DETALLES } from '@/lib/catalog-data'

export async function POST() {
  const supabase = createServerSupabase()

  const [eP, eA, eD] = await Promise.all([
    supabase
      .from('poligonos')
      .upsert(POLIGONOS.map(p => ({ codigo: p.codigo, nombre: p.nombre })), { onConflict: 'codigo' })
      .then(r => r.error),
    supabase
      .from('actividades_catalogo')
      .upsert(ACTIVIDADES.map(a => ({ nombre: a.nombre })), { onConflict: 'nombre' })
      .then(r => r.error),
    supabase
      .from('detalles_catalogo')
      .upsert(DETALLES.map(d => ({ nombre: d.nombre, es_corte: d.es_corte })), { onConflict: 'nombre' })
      .then(r => r.error),
  ])

  const errors = [eP, eA, eD].filter(Boolean)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 500 })

  return NextResponse.json({
    ok: true,
    seeded: { poligonos: POLIGONOS.length, actividades: ACTIVIDADES.length, detalles: DETALLES.length },
  })
}
