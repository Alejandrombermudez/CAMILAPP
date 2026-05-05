'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { db, seedCatalogIfEmpty } from '@/lib/local-db'
import { POLIGONOS, ACTIVIDADES, DETALLES } from '@/lib/catalog-data'
import type { Poligono, ActividadCatalogo, DetalleCatalogo } from '@/types'

interface CatalogCtx {
  poligonos: Poligono[]
  actividades: ActividadCatalogo[]
  detalles: DetalleCatalogo[]
  isLoading: boolean
}

const CatalogContext = createContext<CatalogCtx>({
  poligonos: [], actividades: [], detalles: [], isLoading: true,
})

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<CatalogCtx>({
    poligonos: [], actividades: [], detalles: [], isLoading: true,
  })

  useEffect(() => {
    async function init() {
      let sbPoligs:  Poligono[]          = []
      let sbActs:    ActividadCatalogo[] = []
      let sbDets:    DetalleCatalogo[]   = []

      try {
        const [rP, rA, rD] = await Promise.all([
          supabase.from('poligonos').select('*'),
          supabase.from('actividades_catalogo').select('*'),
          supabase.from('detalles_catalogo').select('*'),
        ])
        sbPoligs = (rP.data ?? []) as Poligono[]
        sbActs   = (rA.data ?? []) as ActividadCatalogo[]
        sbDets   = (rD.data ?? []) as DetalleCatalogo[]
      } catch { /* offline */ }

      // Fallback data with synthetic ids
      const fbPoligs = POLIGONOS.map((p, i) => ({ id: i + 1, ...p })) as Poligono[]
      const fbActs   = ACTIVIDADES.map((a, i) => ({ id: i + 1, nombre: a.nombre })) as ActividadCatalogo[]
      const fbDets   = DETALLES.map((d, i) => ({ id: i + 1, nombre: d.nombre, es_corte: d.es_corte })) as DetalleCatalogo[]

      await seedCatalogIfEmpty(sbPoligs, sbActs, sbDets, fbPoligs, fbActs, fbDets)

      const [poligs, acts, dets] = await Promise.all([
        db.poligonos.toArray(),
        db.actividades_catalogo.toArray(),
        db.detalles_catalogo.toArray(),
      ])

      setCtx({ poligonos: poligs, actividades: acts, detalles: dets, isLoading: false })
    }
    init()
  }, [])

  return <CatalogContext.Provider value={ctx}>{children}</CatalogContext.Provider>
}

export const useCatalog = () => useContext(CatalogContext)
