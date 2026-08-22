import { useOfflineSync } from '../hooks/useOfflineSync'
import { IconCloudOff } from './icons'

export function SyncStatusBadge() {
  const { online, pendingCount } = useOfflineSync()

  if (online && pendingCount === 0) return null

  return (
    <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
      <IconCloudOff className="h-3.5 w-3.5" />
      {!online ? 'Offline' : `Enviando ${pendingCount}`}
    </span>
  )
}
