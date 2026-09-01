'use client'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { MapPin, Crosshair, Trash2, Layers, Upload } from 'lucide-react'
import { db } from '@/lib/local-db'
import { useCatalog } from '@/components/CatalogProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Punto, PuntoTipo } from '@/types'

const TIPOS: { value: PuntoTipo; label: string }[] = [
  { value: 'individuo',  label: 'Individuo vegetal' },
  { value: 'percha',     label: 'Percha para aves' },
  { value: 'nido',       label: 'Caja nido' },
  { value: 'refugio',    label: 'Refugio (reptiles/anfibios/murciélagos)' },
  { value: 'madriguera', label: 'Madriguera' },
  { value: 'muestreo',   label: 'Punto de muestreo' },
  { value: 'otro',       label: 'Otro' },
]

export default function MapaPage() {
  const { poligonos } = useCatalog()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<PuntoTipo>('individuo')
  const [poligonoId, setPoligonoId] = useState<number | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [altitud, setAltitud] = useState<number | null>(null)
  const [precision, setPrecision] = useState<number | null>(null)
  const [notas, setNotas] = useState('')
  const [capturando, setCapturando] = useState(false)
  const [origenGps, setOrigenGps] = useState(false)

  const puntos = useLiveQuery(async () => {
    const all = await db.puntos.toArray()
    return all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }, [])

  const capturarGps = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Este dispositivo no tiene GPS disponible.')
      return
    }
    setCapturando(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setAltitud(pos.coords.altitude ?? null)
        setPrecision(pos.coords.accuracy ?? null)
        setOrigenGps(true)
        setCapturando(false)
        toast.success(`Ubicación capturada (±${Math.round(pos.coords.accuracy)} m)`)
      },
      err => {
        setCapturando(false)
        toast.error(`No se pudo obtener la ubicación: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const limpiar = () => {
    setNombre(''); setTipo('individuo'); setPoligonoId(null)
    setLat(''); setLng(''); setAltitud(null); setPrecision(null)
    setNotas(''); setOrigenGps(false)
  }

  const guardar = async () => {
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    if (Number.isNaN(latN) || Number.isNaN(lngN)) {
      toast.error('Ingresa una latitud y longitud válidas (o captura por GPS).')
      return
    }
    const id = crypto.randomUUID()
    const punto: Punto = {
      id,
      poligono_id: poligonoId,
      reporte_id: null,
      nombre: nombre.trim() || TIPOS.find(t => t.value === tipo)!.label,
      tipo,
      lat: latN,
      lng: lngN,
      altitud,
      precision,
      notas: notas.trim() || null,
      origen: origenGps ? 'gps' : 'manual',
      sync_status: 'pending',
      local_id: id,
      created_at: new Date().toISOString(),
    }
    await db.puntos.add(punto)
    toast.success('Punto guardado')
    limpiar()
  }

  const eliminar = async (id: string) => {
    await db.puntos.delete(id)
    toast.success('Punto eliminado')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MapPin size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Mapa</h1>
      </div>

      {/* Nota de estado / próximos pasos */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Layers size={13} /> En construcción</p>
        <p>
          Ya puedes <strong>capturar puntos por GPS</strong> y se guardan en el dispositivo (funciona sin
          internet). Próximo paso: el <strong>mapa visual offline</strong> (se cachea el mapa base con
          internet y luego funciona en campo sin señal) y la <strong>importación de archivos</strong>{' '}
          (KML/KMZ/Shapefile) para núcleos.
        </p>
      </div>

      {/* Captura de punto */}
      <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
        <h2 className="text-sm font-semibold text-green-700">Nuevo punto</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre / etiqueta</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Opcional…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as PuntoTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Polígono (opcional)</Label>
          <Select
            value={poligonoId ? String(poligonoId) : ''}
            onValueChange={v => setPoligonoId(v ? Number(v) : null)}
          >
            <SelectTrigger><SelectValue placeholder="Sin polígono" /></SelectTrigger>
            <SelectContent>
              {poligonos.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.codigo} — {p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Coordenadas</Label>
            <Button type="button" size="sm" variant="outline" onClick={capturarGps} disabled={capturando}>
              <Crosshair size={14} className="mr-1.5" />
              {capturando ? 'Capturando…' : 'Capturar GPS'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              inputMode="decimal"
              placeholder="Latitud"
              value={lat}
              onChange={e => { setLat(e.target.value); setOrigenGps(false) }}
            />
            <Input
              inputMode="decimal"
              placeholder="Longitud"
              value={lng}
              onChange={e => { setLng(e.target.value); setOrigenGps(false) }}
            />
          </div>
          {precision !== null && (
            <p className="text-xs text-muted-foreground">
              Exactitud ±{Math.round(precision)} m{altitud !== null ? ` · altitud ${Math.round(altitud)} m` : ''}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Notas</Label>
          <Textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional…" />
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={guardar} className="flex-1 bg-green-600 hover:bg-green-700">
            Guardar punto
          </Button>
          <Button type="button" variant="outline" onClick={limpiar}>Limpiar</Button>
        </div>
      </div>

      {/* Importar (próximamente) */}
      <button
        type="button"
        onClick={() => toast.info('La importación de KML/KMZ/Shapefile llega en el siguiente paso.')}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <Upload size={15} /> Importar KML / KMZ / Shapefile (próximamente)
      </button>

      {/* Lista de puntos */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-green-700">
          Puntos guardados {puntos ? `(${puntos.length})` : ''}
        </h2>
        {puntos === undefined ? (
          <p className="text-sm text-muted-foreground text-center py-6">Cargando…</p>
        ) : puntos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6">Aún no has guardado puntos.</p>
        ) : (
          <div className="space-y-2">
            {puntos.map(p => {
              const polig = poligonos.find(x => x.id === p.poligono_id)
              return (
                <div key={p.id} className="border rounded-lg p-3 flex items-start justify-between gap-2 bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPOS.find(t => t.value === p.tipo)?.label ?? p.tipo}
                      {' · '}{p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      {polig ? ` · ${polig.codigo}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.sync_status === 'pending' && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-0.5">
                        sin sync
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminar(p.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label="Eliminar punto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
