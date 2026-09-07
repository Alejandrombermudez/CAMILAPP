'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useFormStore } from '@/hooks/useFormStore'
import { saveReporte } from '@/lib/sync'
import { esCorteDetalle } from '@/lib/catalog-data'
import Hoja1 from '@/components/form/Hoja1'
import Hoja2 from '@/components/form/Hoja2'
import type { ActividadReporte, DetalleActividadReporte, Nucleo } from '@/types'

const TABS = ['hoja1', 'hoja2'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  hoja1: 'Hoja 1 — General',
  hoja2: 'Hoja 2 — Actividades',
}

export default function FormularioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('hoja1')
  const [hydrated, setHydrated] = useState(false)
  const store = useFormStore()
  const router = useRouter()
  const savingRef = useRef(false)

  // Load any saved draft from localStorage after mount (store uses skipHydration).
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

  // Guarda el informe con General + Actividades. El RENDIMIENTO no se captura aquí:
  // se registra después, día por día, en la sección Rendimiento (calendario).
  const handleSubmit = async () => {
    if (savingRef.current) return
    savingRef.current = true
    try {
      const local_id = crypto.randomUUID()
      const actividades: Omit<ActividadReporte, 'reporte_id'>[] = []
      const detalles: DetalleActividadReporte[] = []
      const nucleos: Omit<Nucleo, 'reporte_id' | 'sync_status' | 'created_at'>[] = []

      store.actividadGrupos.forEach((grupo, i) => {
        const actId = crypto.randomUUID()
        const actNombre = grupo.esOtra ? (grupo.customNombre || 'Otra') : grupo.actividadNombre
        actividades.push({ id: actId, actividad_nombre: actNombre, es_otra: grupo.esOtra, orden: i })

        grupo.detalles.forEach((det, j) => {
          const detNombre = det.esOtro ? (det.customNombre || 'Otro') : det.detalleNombre
          detalles.push({
            id: crypto.randomUUID(),
            actividad_reporte_id: actId,
            detalle_nombre: detNombre,
            es_otro: det.esOtro,
            es_corte: esCorteDetalle(detNombre),
            orden: j,
          })
          // Trazado con punto GPS → núcleo
          const tz = det.trazado
          if (tz && tz.escenario && tz.tipo && tz.lat != null && tz.lng != null) {
            const nid = crypto.randomUUID()
            nucleos.push({
              id: nid,
              poligono_id: store.poligono_id,
              escenario: tz.escenario,
              tipo: tz.tipo,
              lat: tz.lat,
              lng: tz.lng,
              altitud: null,
              precision: null,
              notas: null,
              origen: 'gps',
              local_id: nid,
            })
          }
        })
      })

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
        rendimientos: [],   // se llena después en la sección Rendimiento
        avances: [],
        nucleos,
      })

      toast.success('Informe guardado. Registra el rendimiento en la sección Rendimiento cuando lo tengas.')
      store.resetForm()
      router.push('/mis-formularios')
    } finally {
      savingRef.current = false
    }
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
            {activeTab === 'hoja2' && <Hoja2 onNext={handleSubmit} onPrev={prev} />}
          </>
        )}
      </div>
    </div>
  )
}
