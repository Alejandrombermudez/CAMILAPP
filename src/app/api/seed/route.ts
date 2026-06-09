import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { POLIGONOS, ACTIVIDADES, DETALLES } from '@/lib/catalog-data'

export async function POST(req: NextRequest) {
  const expected = process.env.SEED_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Seed no configurado en el servidor (falta SEED_SECRET).' }, { status: 503 })
  }
  if (req.headers.get('x-seed-secret') !== expected) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const supabase = createServerSupabase()

  // Insert with explicit ids (onConflict: 'id') so Supabase shares the same
  // catalog ids as the bundled fallback and the synced reportes.
  const [eP, eA, eD] = await Promise.all([
    supabase
      .from('poligonos')
      .upsert(POLIGONOS.map(p => ({ id: p.id, codigo: p.codigo, nombre: p.nombre })), { onConflict: 'id' })
      .then(r => r.error),
    supabase
      .from('actividades_catalogo')
      .upsert(ACTIVIDADES.map(a => ({ id: a.id, nombre: a.nombre })), { onConflict: 'id' })
      .then(r => r.error),
    supabase
      .from('detalles_catalogo')
      .upsert(DETALLES.map(d => ({ id: d.id, nombre: d.nombre, es_corte: d.es_corte })), { onConflict: 'id' })
      .then(r => r.error),
  ])

  const errors = [eP, eA, eD].filter(Boolean)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 500 })

  return NextResponse.json({
    ok: true,
    seeded: { poligonos: POLIGONOS.length, actividades: ACTIVIDADES.length, detalles: DETALLES.length },
  })
}
