'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Crosshair, MapPin } from 'lucide-react'
import { ESCENARIOS, getEscenario, getModulo, tipoNombre, tipoColor } from '@/lib/designs-data'
import { NucleoDiagrama } from './NucleoDiagrama'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TrazadoNucleo } from '@/types'

export function TrazadoPanel({
  value,
  onChange,
}: {
  value?: TrazadoNucleo
  onChange: (t: TrazadoNucleo) => void
}) {
  const [capturando, setCapturando] = useState(false)
  const escenario = value?.escenario ?? ''
  const tipo = value?.tipo ?? 0
  const lat = value?.lat ?? null
  const lng = value?.lng ?? null

  const esc = getEscenario(escenario)
  const modulo = escenario && tipo ? getModulo(escenario, tipo) : undefined

  const emit = (patch: Partial<TrazadoNucleo>) =>
    onChange({ escenario, tipo, lat, lng, ...patch })

  const capturar = () => {
    if (!('geolocation' in navigator)) { toast.error('Este dispositivo no tiene GPS.'); return }
    setCapturando(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        emit({ lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) })
        setCapturando(false)
        toast.success(`Punto capturado (±${Math.round(pos.coords.accuracy)} m)`)
      },
      err => { setCapturando(false); toast.error(`No se pudo ubicar: ${err.message}`) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/40 p-3 space-y-3">
      <p className="text-xs font-semibold text-green-800">Trazado del diseño florístico</p>

      {/* Escenario */}
      <div className="space-y-1.5">
        <Label className="text-xs">Escenario</Label>
        <Select value={escenario} onValueChange={v => emit({ escenario: v, tipo: 0 })}>
          <SelectTrigger><SelectValue placeholder="Elegir escenario…" /></SelectTrigger>
          <SelectContent>
            {ESCENARIOS.map(e => <SelectItem key={e.clave} value={e.clave}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        {esc && <p className="text-[11px] text-muted-foreground">{esc.descripcion}</p>}
      </div>

      {/* Tipo */}
      {esc && (
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de núcleo</Label>
          <Select value={tipo ? String(tipo) : ''} onValueChange={v => emit({ tipo: Number(v) })}>
            <SelectTrigger><SelectValue placeholder="Elegir tipo…" /></SelectTrigger>
            <SelectContent>
              {esc.modulos.map(m => (
                <SelectItem key={m.tipo} value={String(m.tipo)}>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: tipoColor(m.tipo) }} />
                    {tipoNombre(m.tipo)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info + diagrama + especies */}
      {modulo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: tipoColor(tipo) }} />
            <span className="font-medium">{modulo.titulo}</span>
            <span className="text-muted-foreground">· {modulo.especies.length} especies · sep. 2 m</span>
          </div>

          <NucleoDiagrama especies={modulo.especies} tipo={tipo} kind={modulo.kind} />

          <div className="rounded-md border bg-white divide-y">
            {modulo.especies.map((sp, i) => (
              <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 text-xs">
                <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: tipoColor(tipo) }}>{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{sp.comun} <span className="text-muted-foreground">· {sp.cantidad}</span></p>
                  <p className="text-muted-foreground italic truncate">{sp.cientifico} · {sp.fase} / {sp.gremio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Captura GPS del punto de trazado */}
      {modulo && (
        <div className="space-y-2 border-t border-green-200 pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1"><MapPin size={12} /> Punto del trazado</Label>
            <Button type="button" size="sm" variant="outline" onClick={capturar} disabled={capturando}>
              <Crosshair size={13} className="mr-1.5" />
              {capturando ? 'Capturando…' : 'Capturar GPS'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder="Latitud" value={lat ?? ''}
              onChange={e => emit({ lat: e.target.value ? Number(e.target.value) : null })} />
            <Input inputMode="decimal" placeholder="Longitud" value={lng ?? ''}
              onChange={e => emit({ lng: e.target.value ? Number(e.target.value) : null })} />
          </div>
          {lat != null && lng != null && (
            <p className="text-[11px] text-green-700">✓ Núcleo ubicado en {lat}, {lng}</p>
          )}
        </div>
      )}
    </div>
  )
}
