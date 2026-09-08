'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, ImageOverlay, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { tipoColor, tipoNombre, getEscenario } from '@/lib/designs-data'
import type { MapaOverlay } from '@/lib/mapas-overlay'
import type { Nucleo, Punto } from '@/types'

const DEFAULT_CENTER: [number, number] = [4.597486, -74.039872] // El Arrayán 2

// Recalcula el tamaño del mapa si el contenedor montó con tamaño 0.
function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const fix = () => map.invalidateSize()
    const t = setTimeout(fix, 200)
    const ro = new ResizeObserver(fix)
    ro.observe(map.getContainer())
    window.addEventListener('resize', fix)
    return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('resize', fix) }
  }, [map])
  return null
}

// Encajar el mapa al overlay una sola vez (cuando aparece).
function FitOverlay({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => { map.fitBounds(bounds, { padding: [10, 10] }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Volar a la ubicación del usuario cuando se captura.
function PanTo({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, Math.max(map.getZoom(), 17)) }, [pos]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function MapaNucleos({
  nucleos, puntos, overlay, overlayOpacity = 0.85, userPos = null,
}: {
  nucleos: Nucleo[]
  puntos: Punto[]
  overlay?: MapaOverlay | null
  overlayOpacity?: number
  userPos?: [number, number] | null
}) {
  const ns = nucleos.filter(n => typeof n.lat === 'number' && typeof n.lng === 'number')
  const ps = puntos.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
  const all = [...ns.map(n => [n.lat, n.lng] as [number, number]), ...ps.map(p => [p.lat, p.lng] as [number, number])]
  const center: [number, number] = overlay
    ? [(overlay.bounds[0][0] + overlay.bounds[1][0]) / 2, (overlay.bounds[0][1] + overlay.bounds[1][1]) / 2]
    : all.length
      ? [all.reduce((s, c) => s + c[0], 0) / all.length, all.reduce((s, c) => s + c[1], 0) / all.length]
      : DEFAULT_CENTER

  return (
    <MapContainer center={center} zoom={overlay || all.length ? 16 : 13} scrollWheelZoom className="h-[420px] w-full rounded-lg">
      <AutoResize />
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />

      {overlay && <ImageOverlay url={overlay.url} bounds={overlay.bounds} opacity={overlayOpacity} />}
      {overlay && <FitOverlay bounds={overlay.bounds} />}

      {ns.map(n => (
        <CircleMarker key={n.id} center={[n.lat, n.lng]} radius={8}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: tipoColor(n.tipo), fillOpacity: 0.95 }}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>{tipoNombre(n.tipo)}</strong><br />
              {getEscenario(n.escenario)?.nombre ?? n.escenario}<br />
              <span style={{ color: '#6b7280' }}>{n.lat.toFixed(5)}, {n.lng.toFixed(5)}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {ps.map(p => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={6}
          pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#6b7280', fillOpacity: 0.9 }}>
          <Popup>
            <div style={{ fontSize: 12 }}><strong>{p.nombre}</strong><br /><span style={{ color: '#6b7280' }}>{p.tipo}</span></div>
          </Popup>
        </CircleMarker>
      ))}

      {userPos && (
        <CircleMarker center={userPos} radius={7}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
          <Popup>Estás aquí</Popup>
        </CircleMarker>
      )}
      <PanTo pos={userPos} />
    </MapContainer>
  )
}
