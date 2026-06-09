'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormStore } from '@/hooks/useFormStore'
import { saveReporte } from '@/lib/sync'
import { esCorteDetalle } from '@/lib/catalog-data'
import Hoja1 from '@/components/form/Hoja1'
import Hoja2 from '@/components/form/Hoja2'
import Hoja3 from '@/components/form/Hoja3'
import type { ActividadReporte, DetalleActividadReporte, Rendimiento, AvanceEfectivo } from '@/types'

const TABS = ['hoja1', 'hoja2', 'hoja3'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  hoja1: 'Hoja 1 — General',
  hoja2: 'Hoja 2 — Actividades',
  hoja3: 'Hoja 3 — Rendimiento',
}

export default function FormularioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hoja1')
  const [hydrated, setHydrated] = useState(false)
  const store = useFormStore()
  const router = useRouter()

  // Load any saved draft from localStorage after mount (store uses skipHydration).
  // Gate the steps on this so react-hook-form in Hoja1 mounts with the draft values.
  useEffect(() => {
    Promise.resolve(useFormStore.persist.rehydrate()).then(() => setHydrated(true))
  }, [])

  const goTo = (tab: Tab) => setActiveTab(tab)
  const next = () => {
    const idx = TABS.indexOf(activeTab)
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1])
  }
  const prev = () => {
    const idx = TABS.indexOf(activeTab)
    if (idx > 0) setActiveTab(TABS[idx - 1])
  }

  const handleSubmit = async () => {
    const local_id = crypto.randomUUID()

    // Build actividades + detalles records, tracking the generated ids by tempId
    const actividades: Omit<ActividadReporte, 'reporte_id'>[] = []
    const detalles: DetalleActividadReporte[] = []
    const actIdByTempId = new Map<string, string>()
    const detIdByTempId = new Map<string, string>()

    store.actividadGrupos.forEach((grupo, i) => {
      const actId = crypto.randomUUID()
      actIdByTempId.set(grupo.tempId, actId)
      const actNombre = grupo.esOtra ? (grupo.customNombre || 'Otra') : grupo.actividadNombre

      actividades.push({
        id: actId,
        actividad_nombre: actNombre,
        es_otra: grupo.esOtra,
        orden: i,
      })

      grupo.detalles.forEach((det, j) => {
        const detId = crypto.randomUUID()
        detIdByTempId.set(det.tempId, detId)
        const detNombre = det.esOtro ? (det.customNombre || 'Otro') : det.detalleNombre
        detalles.push({
          id: detId,
          actividad_reporte_id: actId,
          detalle_nombre: detNombre,
          es_otro: det.esOtro,
          es_corte: esCorteDetalle(detNombre),
          orden: j,
        })
      })
    })

    // Build rendimiento records — resolve record ids directly via the tempId maps
    const rendimientos: Omit<Rendimiento, 'reporte_id' | 'created_at'>[] = store.rendimientoFilas.map(fila => ({
      id: crypto.randomUUID(),
      actividad_reporte_id: actIdByTempId.get(fila.actividadGrupoTempId) ?? '',
      detalle_reporte_id: detIdByTempId.get(fila.detalleTempId) ?? '',
      cantidad_ejecutada: fila.cantidadEjecutada ?? 0,
      num_operarios: fila.numOperarios ?? 1,
      porcentaje_area_efectiva: fila.porcentajeAreaEfectiva,
    }))

    // Build avance efectivo record
    const avances: Omit<AvanceEfectivo, 'reporte_id' | 'created_at'>[] = []
    if (store.avance_fecha_inicio && store.avance_fecha_fin) {
      avances.push({
        id: crypto.randomUUID(),
        fecha_inicio: store.avance_fecha_inicio,
        fecha_fin:    store.avance_fecha_fin,
      })
    }

    await saveReporte({
      local_id,
      profesional:       store.profesional,
      fecha:             store.fecha,
      poligono_id:       store.poligono_id,
      numeros_cuadrilla: store.numeros_cuadrilla,
      operarios_hombre:  store.operarios_hombre,
      operarios_mujer:   store.operarios_mujer,
      hora_ingreso:      store.hora_ingreso,
      hora_salida:       store.hora_salida,
      novedades:         store.novedades || null,
      actividades,
      detalles,
      rendimientos,
      avances,
    })

    toast.success('Informe guardado correctamente')
    store.resetForm()
    router.push('/estadisticas')
  }

  const progressStep = TABS.indexOf(activeTab) + 1

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <div>
        <h1 className="text-xl font-bold text-green-800">Informe de Campo</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{TAB_LABELS[activeTab]}</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => goTo(tab)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i < progressStep ? 'bg-green-600' : 'bg-gray-200'
            }`}
            aria-label={TAB_LABELS[tab]}
          />
        ))}
      </div>

      {/* Form steps */}
      <div className="min-h-[400px]">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground text-center py-12">Cargando borrador…</p>
        ) : (
          <>
            {activeTab === 'hoja1' && <Hoja1 onNext={next} />}
            {activeTab === 'hoja2' && <Hoja2 onNext={next} onPrev={prev} />}
            {activeTab === 'hoja3' && <Hoja3 onPrev={prev} onSubmit={handleSubmit} />}
          </>
        )}
      </div>
    </div>
  )
}
