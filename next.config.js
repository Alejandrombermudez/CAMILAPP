/** @type {import('next').NextConfig} */

// Parte del runtime caching POR DEFECTO de next-pwa. Cubre lo esencial para que la
// app funcione sin conexión: documentos/navegación de páginas ('others'), chunks JS
// y CSS, /_next/data, imágenes, fuentes, etc. Antes había un runtimeCaching custom
// que SOLO cacheaba /_next/static y Supabase, y al reemplazar los defaults se perdía
// el cacheo de las páginas → la app no cargaba offline.
const defaultCache = require('next-pwa/cache')
const runtimeCaching = [...defaultCache]

// Regla específica de Supabase (NetworkFirst) construida desde la env var, para que
// el catálogo quede cacheado y disponible offline, y siga funcionando si cambia la URL.
try {
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  runtimeCaching.unshift({
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

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Cachea las páginas al navegar por el menú (estando online) para que queden
  // disponibles offline aunque no se hayan abierto con recarga completa.
  cacheOnFrontEndNav: true,
  runtimeCaching,
})

const nextConfig = {}

module.exports = withPWA(nextConfig)
