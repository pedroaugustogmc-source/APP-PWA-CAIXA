import { useCallback, useEffect, useState } from 'react'
import { flushOutbox, listPendingMutations } from '../lib/offlineOutbox'

export function useOfflineSync() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    const pending = await listPendingMutations()
    setPendingCount(pending.length)
  }, [])

  const sync = useCallback(async () => {
    await flushOutbox()
    await refreshPendingCount()
  }, [refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()

    function handleOnline() {
      setOnline(true)
      sync()
    }
    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    if (navigator.onLine) sync()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { online, pendingCount, refreshPendingCount, sync }
}
