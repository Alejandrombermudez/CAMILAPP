import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { format } from 'date-fns'
import type { FormStoreState, ActividadGrupo, RendimientoFila } from '@/types'

const defaultState = () => ({
  profesional:        'María Camila Mateus Álvarez',
  fecha:              format(new Date(), 'yyyy-MM-dd'),
  poligono_id:        null as number | null,
  numeros_cuadrilla:  [] as number[],
  operarios_hombre:   0,
  operarios_mujer:    0,
  hora_ingreso:       '06:00',
  hora_salida:        '15:00',
  actividadGrupos:    [] as ActividadGrupo[],
  novedades:          '',
  rendimientoFilas:   [] as RendimientoFila[],
  avance_fecha_inicio: null as string | null,
  avance_fecha_fin:    null as string | null,
  editandoId:         null as string | null,
})

export const useFormStore = create<FormStoreState>()(
  persist(
    (set) => ({
      ...defaultState(),

      patchHoja1: (data) => set((s) => ({ ...s, ...data })),
      setActividadGrupos: (grupos) => set({ actividadGrupos: grupos }),
      setNovedades: (n) => set({ novedades: n }),
      setRendimientoFilas: (filas) => set({ rendimientoFilas: filas }),
      patchRendimientoFila: (tempId, patch) =>
        set((s) => ({
          rendimientoFilas: s.rendimientoFilas.map(f =>
            f.tempId === tempId ? { ...f, ...patch } : f
          ),
        })),
      setAvanceFechas: (inicio, fin) => set({ avance_fecha_inicio: inicio, avance_fecha_fin: fin }),
      setEditandoId: (id) => set({ editandoId: id }),
      resetForm: () => set({ ...defaultState(), fecha: format(new Date(), 'yyyy-MM-dd') }),
    }),
    {
      name: 'camilapp-form-draft',
      storage: createJSONStorage(() => localStorage),
      // The page is statically prerendered; hydrate the draft only after mount
      // (see useFormStore.persist.rehydrate() in formulario/page.tsx) to avoid
      // a server/client markup mismatch.
      skipHydration: true,
      // Persist only data fields, never the action functions.
      partialize: (s) => ({
        profesional: s.profesional,
        fecha: s.fecha,
        poligono_id: s.poligono_id,
        numeros_cuadrilla: s.numeros_cuadrilla,
        operarios_hombre: s.operarios_hombre,
        operarios_mujer: s.operarios_mujer,
        hora_ingreso: s.hora_ingreso,
        hora_salida: s.hora_salida,
        actividadGrupos: s.actividadGrupos,
        novedades: s.novedades,
        rendimientoFilas: s.rendimientoFilas,
        avance_fecha_inicio: s.avance_fecha_inicio,
        avance_fecha_fin: s.avance_fecha_fin,
        editandoId: s.editandoId,
      }),
    }
  )
)
