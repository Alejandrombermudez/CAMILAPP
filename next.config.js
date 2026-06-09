/** @type {import('next').NextConfig} */

// Build the Supabase cache rule from the env var instead of a hardcoded host,
// so the PWA cache keeps matching if the project URL changes.
const runtimeCaching = [
  {
    urlPattern: /\/_next\/static\/.*/i,
    handler: 'CacheFirst',
    options: { cacheName: 'next-static' },
  },
]

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
  // NEXT_PUBLIC_SUPABASE_URL missing or invalid — skip the Supabase cache rule.
}

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
})

const nextConfig = {}

module.exports = withPWA(nextConfig)
