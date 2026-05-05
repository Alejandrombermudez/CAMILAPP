'use client'
import { useEffect, useCallback } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { syncPendingReports } from '@/lib/sync'

export function useSync() {
  const isOnline = useOnlineStatus()

  const sync = useCallback(() => {
    if (isOnline) syncPendingReports().catch(console.error)
  }, [isOnline])

  useEffect(() => { if (isOnline) sync() }, [isOnline, sync])

  useEffect(() => {
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [sync])

  return { isOnline, sync }
}
