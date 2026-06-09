'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-db'
import { useSync } from '@/hooks/useSync'
import { getSyncSecret, setSyncSecret } from '@/lib/sync-auth'
import { Wifi, WifiOff, RefreshCw, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { isOnline, sync, result } = useSync()
  const pendingCount = useLiveQuery(
    () => db.reportes.where('sync_status').equals('pending').count(),
    [],
    0
  )

  const [open, setOpen] = useState(false)
  const [secretInput, setSecretInput] = useState('')

  const needsSecret = result?.status === 'no-secret' || result?.status === 'auth-failed'

  const openConfig = () => {
    setSecretInput(getSyncSecret() ?? '')
    setOpen(true)
  }

  const handleManualSync = async () => {
    const r = await sync()
    if (!r) return
    if (r.status === 'ok') toast.success(`Sincronizados ${r.synced} informe(s)`)
    else if (r.status === 'auth-failed') toast.error('Clave de sincronización rechazada.')
    else if (r.status === 'error') toast.error('No se pudo sincronizar. Reintenta más tarde.')
    else if (r.status === 'no-secret') openConfig()
  }

  const saveSecret = () => {
    if (!secretInput.trim()) return
    setSyncSecret(secretInput)
    setOpen(false)
    sync()
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOnline
        ? <Wifi size={15} className="text-green-600" />
        : <WifiOff size={15} className="text-red-500" />
      }
      <span className={cn('hidden sm:inline', isOnline ? 'text-green-700' : 'text-red-600')}>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </span>

      {(pendingCount ?? 0) > 0 && (
        <>
          <span className="text-orange-600 text-xs">• {pendingCount} pend.</span>
          {isOnline && !needsSecret && (
            <Button variant="ghost" size="sm" onClick={handleManualSync} className="h-7 px-2 text-xs">
              <RefreshCw size={11} className="mr-1" />
              Sync
            </Button>
          )}
        </>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={openConfig}
            className={cn('h-7 px-2', needsSecret && 'text-amber-600 hover:text-amber-700')}
            aria-label="Configurar clave de sincronización"
          >
            <KeyRound size={13} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sync-secret" className="text-sm font-medium">Clave de sincronización</Label>
            <p className="text-xs text-muted-foreground">
              Necesaria para enviar los informes al servidor. Te la da el administrador y se guarda solo en este dispositivo.
            </p>
          </div>
          {result?.status === 'auth-failed' && (
            <p className="text-xs text-red-500">La clave fue rechazada por el servidor.</p>
          )}
          <Input
            id="sync-secret"
            type="password"
            value={secretInput}
            onChange={e => setSecretInput(e.target.value)}
            placeholder="Clave…"
            onKeyDown={e => { if (e.key === 'Enter') saveSecret() }}
          />
          <Button
            onClick={saveSecret}
            disabled={!secretInput.trim()}
            className="w-full bg-green-600 hover:bg-green-700 h-8 text-sm"
          >
            Guardar y sincronizar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
