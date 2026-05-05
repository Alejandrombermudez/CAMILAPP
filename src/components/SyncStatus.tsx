'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/local-db'
import { useSync } from '@/hooks/useSync'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SyncStatus() {
  const { isOnline, sync } = useSync()
  const pendingCount = useLiveQuery(
    () => db.reportes.where('sync_status').equals('pending').count(),
    [],
    0
  )

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
          {isOnline && (
            <Button variant="ghost" size="sm" onClick={sync} className="h-7 px-2 text-xs">
              <RefreshCw size={11} className="mr-1" />
              Sync
            </Button>
          )}
        </>
      )}
    </div>
  )
}
