/** @type {import('next').NextConfig} */
const withPWAInit = require('@ducanh2912/next-pwa').default

// Revisión que cambia en cada build/deploy → invalida el precache de las páginas
// cuando cambia el contenido. En Vercel usa el SHA del commit; en local, timestamp.
const REVISION = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())

// Precachea los DOCUMENTOS de las rutas estáticas para que la app cargue offline
// desde el primer arranque (sin depender de haber visitado cada pantalla online).
// Las rutas dinámicas (p. ej. /mis-formularios/[id]) caen al fallback offline.
const rutasEstaticas = ['/formulario', '/rendimiento', '/mapa', '/mis-formularios', '/estadisticas']
const additionalManifestEntries = rutasEstaticas.map((url) => ({ url, revision: REVISION }))
// Mapas de diseño georreferenciados → precacheados para el mapa offline.
additionalManifestEntries.push({ url: '/mapas/arrayan2.jpg', revision: REVISION })

// Regla específica de Supabase (NetworkFirst) para cachear el catálogo offline.
const runtimeCaching = []
try {
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  runtimeCaching.push({
    urlPattern: new RegExp('^https://' + supabaseHost.replace(/\./g, '\\.') + '/.*', 'i'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-cache',
      expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
    },
  })
} catch {
  // NEXT_PUBLIC_SUPABASE_URL ausente o inválida — se omite la regla de Supabase.
}

// Teselas del mapa (OpenStreetMap): CacheFirst para que el mapa funcione offline
// tras verlo online (se cachean las teselas de la zona visitada).
runtimeCaching.push({
  urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'osm-tiles',
    expiration: { maxEntries: 3000, maxAgeSeconds: 30 * 24 * 60 * 60 },
    cacheableResponse: { statuses: [0, 200] },
  },
})

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  reloadOnOnline: true,
  // Cachea las pantallas al navegar por el menú (online) → disponibles offline.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // Muestra una página offline propia cuando una navegación no está en caché
  // (en vez del error "sin conexión" del navegador).
  fallbacks: { document: '/offline' },
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching,
    additionalManifestEntries,
  },
})

module.exports = withPWA({})
