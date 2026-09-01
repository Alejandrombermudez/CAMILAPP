import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CatalogProvider } from '@/components/CatalogProvider'
import { SyncStatus } from '@/components/SyncStatus'
import { Toaster } from 'sonner'
import Link from 'next/link'
import { BarChart3, FileText, ClipboardList, CalendarDays, Map } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CAMILAPP — Informes de Campo',
  description: 'Registro de informes de restauración ambiental',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'CAMILAPP' },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <CatalogProvider>
          <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-green-700 text-lg tracking-tight">🌿 CAMILAPP</span>
              <div className="flex items-center gap-3">
                <nav className="flex items-center gap-1">
                  <Link
                    href="/formulario"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    <FileText size={14} />
                    <span className="hidden sm:inline">Formulario</span>
                  </Link>
                  <Link
                    href="/rendimiento"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    <CalendarDays size={14} />
                    <span className="hidden sm:inline">Rendimiento</span>
                  </Link>
                  <Link
                    href="/mis-formularios"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    <ClipboardList size={14} />
                    <span className="hidden sm:inline">Mis formularios</span>
                  </Link>
                  <Link
                    href="/mapa"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    <Map size={14} />
                    <span className="hidden sm:inline">Mapa</span>
                  </Link>
                  <Link
                    href="/estadisticas"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    <BarChart3 size={14} />
                    <span className="hidden sm:inline">Estadísticas</span>
                  </Link>
                </nav>
                <SyncStatus />
              </div>
            </div>
          </header>
          <main className="max-w-2xl mx-auto px-4 pb-24 pt-6">
            {children}
          </main>
        </CatalogProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
