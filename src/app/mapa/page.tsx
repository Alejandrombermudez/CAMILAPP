'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { MapPin, Crosshair, Trash2, Layers, LocateFixed } from 'lucide-react'
import { db } from '@/lib/local-db'
import { useCatalog } from '@/components/CatalogProvider'
import { TIPOS_NUCLEO, tipoColor } from '@/lib/designs-data'
import { OVERLAYS } from '@/lib/mapas-overlay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Punto, PuntoTipo } from '@/types'

const MapaNucleos = dynamic(() => import('@/components/MapaNucleos'), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full rounded-lg bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">Cargando mapa…</div>,
})

const TIPOS: { value: PuntoTipo; label: string }[] = [
  { value: 'nido',       label: 'Caja nido' },
  { value: 'percha',     label: 'Percha para aves' },
  { value: 'refugio',    label: 'Refugio (reptiles/anfibios/murciélagos)' },
  { value: 'madriguera', label: 'Madriguera' },
  { value: 'muestreo',   label: 'Punto de muestreo' },
  { value: 'individuo',  label: 'Individuo vegetal' },
  { value: 'otro',       label: 'Otro' },
]

export default function MapaPage() {
  const { poligonos } = useCatalog()
  const nucleos = useLiveQuery(() => db.nucleos.toArray(), [])
  const puntos = useLiveQuery(async () => (await db.puntos.toArray()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), [])

  // Overlay del mapa de diseño + ubicación del usuario
  const overlay = OVERLAYS[0]
  const [overlayOn, setOverlayOn] = useState(true)
  const [opacidad, setOpacidad] = useState(0.85)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [ubicando, setUbicando] = useState(false)

  const ubicarme = () => {
    if (!('geolocation' in navigator)) { toast.error('Este dispositivo no tiene GPS.'); return }
    setUbicando(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setUbicando(false); toast.success(`Ubicación (±${Math.round(pos.coords.accuracy)} m)`) },
      err => { setUbicando(false); toast.error(`No se pudo ubicar: ${err.message}`) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<PuntoTipo>('nido')
  const [poligonoId, setPoligonoId] = useState<number | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [precision, setPrecision] = useState<number | null>(null)
  const [notas, setNotas] = useState('')
  const [capturando, setCapturando] = useState(false)
  const [origenGps, setOrigenGps] = useState(false)

  const capturarGps = () => {
    if (!('geolocation' in navigator)) { toast.error('Este dispositivo no tiene GPS.'); return }
    setCapturando(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6))
        setPrecision(pos.coords.accuracy ?? null); setOrigenGps(true); setCapturando(false)
        toast.success(`Ubicación capturada (±${Math.round(pos.coords.accuracy)} m)`)
      },
      err => { setCapturando(false); toast.error(`No se pudo obtener la ubicación: ${err.message}`) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }
  const limpiar = () => { setNombre(''); setTipo('nido'); setPoligonoId(null); setLat(''); setLng(''); setPrecision(null); setNotas(''); setOrigenGps(false) }

  const guardar = async () => {
    const latN = parseFloat(lat), lngN = parseFloat(lng)
    if (Number.isNaN(latN) || Number.isNaN(lngN)) { toast.error('Latitud/longitud inválidas (o captura por GPS).'); return }
    const id = crypto.randomUUID()
    const punto: Punto = {
      id, poligono_id: poligonoId, reporte_id: null,
      nombre: nombre.trim() || TIPOS.find(t => t.value === tipo)!.label,
      tipo, lat: latN, lng: lngN, altitud: null, precision, notas: notas.trim() || null,
      origen: origenGps ? 'gps' : 'manual', sync_status: 'pending', local_id: id, created_at: new Date().toISOString(),
    }
    await db.puntos.add(punto); toast.success('Punto guardado'); limpiar()
  }
  const eliminarPunto = async (id: string) => { await db.puntos.delete(id); toast.success('Punto eliminado') }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MapPin size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Mapa</h1>
      </div>

      {/* Mapa */}
      <MapaNucleos
        nucleos={nucleos ?? []}
        puntos={puntos ?? []}
        overlay={overlayOn ? overlay : null}
        overlayOpacity={opacidad}
        userPos={userPos}
      />

      {/* Controles del mapa */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={overlayOn} onChange={e => setOverlayOn(e.target.checked)} />
          <Layers size={14} className="text-green-700" /> {overlay.nombre}
        </label>
        {overlayOn && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Opacidad
            <input type="range" min={0.2} max={1} step={0.05} value={opacidad}
              onChange={e => setOpacidad(Number(e.target.value))} className="w-24" />
          </label>
        )}
        <Button type="button" size="sm" variant="outline" onClick={ubicarme} disabled={ubicando} className="ml-auto">
          <LocateFixed size={14} className="mr-1.5" /> {ubicando ? 'Ubicando…' : 'Mi ubicación'}
        </Button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        <span className="font-medium text-muted-foreground">Núcleos:</span>
        {Object.values(TIPOS_NUCLEO).map(t => (
          <span key={t.tipo} className="flex items-center gap-1.5">
            <i className="w-3 h-3 rounded-full inline-block border border-white shadow" style={{ background: t.color }} />
            {t.nombre}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-full inline-block border border-white shadow bg-gray-500" /> Puntos de fauna
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {(nucleos?.length ?? 0)} núcleo(s) · {(puntos?.length ?? 0)} punto(s). Los núcleos se crean al registrar el
        <strong> Trazado de los diseños</strong> en el formulario.
      </p>

      {/* Captura de punto de fauna */}
      <details className="border rounded-lg bg-white">
        <summary className="px-4 py-3 text-sm font-semibold text-green-700 cursor-pointer">
          + Registrar punto de fauna (caja nido, percha, refugio…)
        </summary>
        <div className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre / etiqueta</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Opcional…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as PuntoTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Polígono (opcional)</Label>
            <Select value={poligonoId ? String(poligonoId) : ''} onValueChange={v => setPoligonoId(v ? Number(v) : null)}>
              <SelectTrigger><SelectValue placeholder="Sin polígono" /></SelectTrigger>
              <SelectContent>
                {poligonos.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.codigo} — {p.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Coordenadas</Label>
              <Button type="button" size="sm" variant="outline" onClick={capturarGps} disabled={capturando}>
                <Crosshair size={14} className="mr-1.5" />{capturando ? 'Capturando…' : 'Capturar GPS'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input inputMode="decimal" placeholder="Latitud" value={lat} onChange={e => { setLat(e.target.value); setOrigenGps(false) }} />
              <Input inputMode="decimal" placeholder="Longitud" value={lng} onChange={e => { setLng(e.target.value); setOrigenGps(false) }} />
            </div>
            {precision !== null && <p className="text-xs text-muted-foreground">Exactitud ±{Math.round(precision)} m</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional…" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={guardar} className="flex-1 bg-green-600 hover:bg-green-700">Guardar punto</Button>
            <Button type="button" variant="outline" onClick={limpiar}>Limpiar</Button>
          </div>
        </div>
      </details>

      {/* Lista de puntos */}
      {puntos && puntos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-green-700">Puntos de fauna ({puntos.length})</h2>
          <div className="space-y-2">
            {puntos.map(p => {
              const polig = poligonos.find(x => x.id === p.poligono_id)
              return (
                <div key={p.id} className="border rounded-lg p-3 flex items-start justify-between gap-2 bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPOS.find(t => t.value === p.tipo)?.label ?? p.tipo} · {p.lat.toFixed(5)}, {p.lng.toFixed(5)}{polig ? ` · ${polig.codigo}` : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => eliminarPunto(p.id)} className="text-red-500 hover:text-red-700 p-1" aria-label="Eliminar punto">
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
