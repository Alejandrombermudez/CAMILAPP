'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { db, seedCatalogIfEmpty, refreshCatalogFromServer } from '@/lib/local-db'
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

      if (sbPoligs.length || sbActs.length || sbDets.length) {
        // Online: refresh local catalog from Supabase (stable ids → safe upsert).
        await refreshCatalogFromServer(sbPoligs, sbActs, sbDets)
      } else {
        // Offline / empty server: seed bundled fallback the first time only.
        await seedCatalogIfEmpty(POLIGONOS, ACTIVIDADES, DETALLES)
      }

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
