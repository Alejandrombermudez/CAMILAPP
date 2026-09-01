'use client'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
        <WifiOff size={26} className="text-green-700" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-green-800">Sin conexión</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Esta pantalla aún no está guardada en el dispositivo. Vuelve a una sección ya
          abierta, o reintenta cuando tengas señal.
        </p>
      </div>
      <Button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-green-600 hover:bg-green-700"
      >
        <RefreshCw size={15} className="mr-1.5" /> Reintentar
      </Button>
      <p className="text-xs text-muted-foreground">
        Tus informes y datos guardados siguen disponibles sin conexión.
      </p>
    </div>
  )
}
