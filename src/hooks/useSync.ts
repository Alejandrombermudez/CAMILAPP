'use client'
import { useEffect, useCallback, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { syncPendingReports, type SyncResult } from '@/lib/sync'

export function useSync() {
  const isOnline = useOnlineStatus()
  const [result, setResult] = useState<SyncResult | null>(null)

  const sync = useCallback(async () => {
    if (!isOnline) return
    const r = await syncPendingReports()
    setResult(r)
    return r
  }, [isOnline])

  useEffect(() => { if (isOnline) sync() }, [isOnline, sync])

  useEffect(() => {
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [sync])

  return { isOnline, sync, result }
}
