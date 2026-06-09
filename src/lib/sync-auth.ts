'use client'

// Passphrase that authorises this device against /api/sync.
// Stored only on the device (localStorage); it is compared server-side
// against the SYNC_SECRET env var and is never bundled into the client.
const KEY = 'camilapp_sync_secret'

export function getSyncSecret(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(KEY)
}

export function setSyncSecret(secret: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, secret.trim())
}

export function clearSyncSecret(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}
