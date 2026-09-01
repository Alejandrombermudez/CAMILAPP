'use client'
import { useState } from 'react'
import { useFormStore } from '@/hooks/useFormStore'
import { useCatalog } from '@/components/CatalogProvider'
import { ChipMultiSelect } from '@/components/ChipMultiSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { esCorteDetalle, subactividadesPermitidas } from '@/lib/catalog-data'
import type { ActividadGrupo, DetalleSeleccionado } from '@/types'

export default function Hoja2({
  onNext,
  onPrev,
}: {
  onNext: () => void
  onPrev: () => void
}) {
  const store = useFormStore()
  const { actividades, detalles } = useCatalog()
  const [error, setError] = useState('')

  // ── Add a new activity group ────────────────────────────────
  const addGrupo = () => {
    const nuevo: ActividadGrupo = {
      tempId: crypto.randomUUID(),
      actividadNombre: '',
      esOtra: false,
      customNombre: '',
      detalles: [],
    }
    store.setActividadGrupos([...store.actividadGrupos, nuevo])
  }

  const removeGrupo = (tempId: string) => {
    store.setActividadGrupos(store.actividadGrupos.filter(g => g.tempId !== tempId))
  }

  const updateGrupo = (tempId: string, patch: Partial<ActividadGrupo>) => {
    store.setActividadGrupos(
      store.actividadGrupos.map(g => g.tempId === tempId ? { ...g, ...patch } : g)
    )
  }

  // ── Detail management per group ─────────────────────────────
  const addDetalle = (grupoTempId: string, detalleNombre: string, esOtro = false) => {
    store.setActividadGrupos(
      store.actividadGrupos.map(g => {
        if (g.tempId !== grupoTempId) return g
        const nuevo: DetalleSeleccionado = {
          tempId: crypto.randomUUID(),
          detalleNombre,
          esOtro,
          customNombre: '',
          esCorte: esCorteDetalle(detalleNombre),
        }
        return { ...g, detalles: [...g.detalles, nuevo] }
      })
    )
  }

  const removeDetalle = (grupoTempId: string, detTempId: string) => {
    store.setActividadGrupos(
      store.actividadGrupos.map(g => {
        if (g.tempId !== grupoTempId) return g
        return { ...g, detalles: g.detalles.filter(d => d.tempId !== detTempId) }
      })
    )
  }

  const updateDetalle = (grupoTempId: string, detTempId: string, patch: Partial<DetalleSeleccionado>) => {
    store.setActividadGrupos(
      store.actividadGrupos.map(g => {
        if (g.tempId !== grupoTempId) return g
        return {
          ...g,
          detalles: g.detalles.map(d =>
            d.tempId === detTempId ? { ...d, ...patch } : d
          ),
        }
      })
    )
  }

  // ── Validate and proceed ────────────────────────────────────
  const handleNext = () => {
    if (store.actividadGrupos.length === 0) {
      setError('Debe añadir al menos una actividad operativa.')
      return
    }
    for (const g of store.actividadGrupos) {
      const nombre = g.esOtra ? g.customNombre : g.actividadNombre
      if (!nombre.trim()) {
        setError('Todas las actividades deben tener nombre.')
        return
      }
      if (g.detalles.length === 0) {
        setError(`La actividad "${nombre}" debe tener al menos una subactividad.`)
        return
      }
    }
    setError('')
    onNext()
  }

  // ── Options helpers ─────────────────────────────────────────
  const actOptions = actividades.map(a => ({ value: a.nombre, label: a.nombre }))
  const detOptions = detalles.map(d => ({ value: d.nombre, label: d.nombre }))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-green-800">Actividades Operativas</h2>

      {/* Grupo de actividades */}
      {store.actividadGrupos.map((grupo, idx) => {
        const actNombre = grupo.esOtra ? grupo.customNombre : grupo.actividadNombre
        const selectedDets = grupo.detalles.map(d => d.detalleNombre)
        // Filtra las subactividades según la actividad elegida. Si la actividad no
        // está clasificada, `permitidas` es null → se muestran todas (fallback).
        const permitidas = grupo.esOtra ? null : subactividadesPermitidas(grupo.actividadNombre)
        const detBase = permitidas
          ? detOptions.filter(o => permitidas.includes(o.value))
          : detOptions
        const availableDets = grupo.esOtra
          ? [] // Otra actividad → solo "Otro" detalle
          : detBase.filter(o => !selectedDets.includes(o.value))

        return (
          <div key={grupo.tempId} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700">Actividad {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeGrupo(grupo.tempId)}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
                aria-label="Eliminar actividad"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Actividad selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">Actividad operativa</Label>
              {!grupo.esOtra ? (
                <Select
                  value={grupo.actividadNombre}
                  onValueChange={v => {
                    if (v === '__OTRA__') {
                      updateGrupo(grupo.tempId, { esOtra: true, actividadNombre: '' })
                    } else {
                      updateGrupo(grupo.tempId, { actividadNombre: v, esOtra: false })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar actividad…" />
                  </SelectTrigger>
                  <SelectContent>
                    {actOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                    <SelectItem value="__OTRA__">✏️ Otra actividad…</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}

              {grupo.esOtra && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Otra</Badge>
                  <Input
                    placeholder="Nombre de la actividad…"
                    value={grupo.customNombre}
                    onChange={e => updateGrupo(grupo.tempId, { customNombre: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => updateGrupo(grupo.tempId, { esOtra: false, actividadNombre: '', customNombre: '' })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* Subactividades / detalles */}
            {(grupo.esOtra || grupo.actividadNombre) && (
              <div className="space-y-2">
                <Label className="text-xs">Subactividades</Label>

                {/* Selected details as chips */}
                <div className="flex flex-wrap gap-2">
                  {grupo.detalles.map(det => (
                    <Badge
                      key={det.tempId}
                      variant={det.esCorte ? 'destructive' : 'success'}
                      className="gap-1 pr-1 text-xs"
                    >
                      {det.esOtro ? (det.customNombre || 'Otro') : det.detalleNombre}
                      {det.esCorte && <span className="ml-0.5 opacity-70">✂</span>}
                      <button
                        type="button"
                        onClick={() => removeDetalle(grupo.tempId, det.tempId)}
                        className="ml-1 p-0.5 rounded-full hover:bg-black/20"
                        aria-label="Quitar"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* If "Otra" activity → only "Otro" detail allowed */}
                {grupo.esOtra ? (
                  !grupo.detalles.some(d => d.esOtro) && (
                    <button
                      type="button"
                      onClick={() => addDetalle(grupo.tempId, 'Otro', true)}
                      className="px-2.5 py-1 rounded-full border border-dashed border-gray-400 text-xs hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <Plus size={10} /> Otro detalle
                    </button>
                  )
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableDets.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => addDetalle(grupo.tempId, opt.value)}
                        className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                          esCorteDetalle(opt.value)
                            ? 'border-red-300 hover:bg-red-50 hover:border-red-500 text-red-700'
                            : 'border-green-300 hover:bg-green-50 hover:border-green-500'
                        }`}
                      >
                        {opt.label}
                        {esCorteDetalle(opt.value) && <span className="ml-1 opacity-60">✂</span>}
                      </button>
                    ))}
                    {!grupo.detalles.some(d => d.esOtro) && (
                      <button
                        type="button"
                        onClick={() => addDetalle(grupo.tempId, 'Otro', true)}
                        className="px-2.5 py-1 rounded-full border border-dashed border-gray-400 text-xs hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Plus size={10} /> Otro
                      </button>
                    )}
                  </div>
                )}

                {/* Custom name for "Otro" detail */}
                {grupo.detalles.filter(d => d.esOtro).map(det => (
                  <Input
                    key={det.tempId}
                    placeholder="Nombre del detalle/subactividad…"
                    value={det.customNombre}
                    onChange={e =>
                      updateDetalle(grupo.tempId, det.tempId, {
                        customNombre: e.target.value,
                        esCorte: esCorteDetalle(e.target.value),
                      })
                    }
                    className="max-w-xs text-sm"
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add activity button */}
      <button
        type="button"
        onClick={addGrupo}
        className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg text-sm text-green-600 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Añadir actividad operativa
      </button>

      <Separator />

      {/* Novedades */}
      <div className="space-y-1.5">
        <Label htmlFor="novedades">Novedades</Label>
        <Textarea
          id="novedades"
          placeholder="Describe cualquier novedad del día…"
          value={store.novedades}
          onChange={e => store.setNovedades(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          <ChevronLeft size={16} className="mr-1" /> Anterior
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1 bg-green-600 hover:bg-green-700">
          Guardar informe <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
