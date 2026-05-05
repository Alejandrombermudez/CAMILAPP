import { create } from 'zustand'
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
})

export const useFormStore = create<FormStoreState>((set) => ({
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
  resetForm: () => set({ ...defaultState(), fecha: format(new Date(), 'yyyy-MM-dd') }),
}))
