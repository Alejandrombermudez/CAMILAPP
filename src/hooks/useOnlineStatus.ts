'use client'
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  // Start as `true` so server and first client render agree (avoids a hydration
  // mismatch when the device loads offline); sync to the real value after mount.
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    update()
    window.addEventListener('online',  update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online',  update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return isOnline
}
