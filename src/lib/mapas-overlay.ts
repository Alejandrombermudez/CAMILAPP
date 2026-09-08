// Mapas de diseño georreferenciados para superponer en el mapa (estilo Avenza).
// Los bounds están en WGS84 [[sur, oeste], [norte, este]], reproyectados desde el
// sistema MAGNA Ciudad Bogotá (EPSG:6247) del grid de la cartografía original.
export interface MapaOverlay {
  id: string
  nombre: string
  url: string
  bounds: [[number, number], [number, number]] // [[S, W], [N, E]]
}

export const OVERLAYS: MapaOverlay[] = [
  {
    id: 'arrayan2',
    nombre: 'El Arrayán 2 — diseño',
    url: '/mapas/arrayan2.jpg',
    bounds: [[4.594413, -74.054120], [4.610687, -74.037903]],
  },
]
