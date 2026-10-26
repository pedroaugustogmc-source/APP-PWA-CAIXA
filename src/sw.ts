/// <reference lib="webworker" />
// Service worker customizado (strategies: injectManifest) — precisa disso em
// vez do generateSW padrão porque notificação push só existe escrevendo os
// listeners 'push'/'notificationclick' à mão; o resto (precache, cache de
// API) replica exatamente o que generateSW fazia antes.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => url.href.includes('.supabase.co/rest/'),
  new NetworkFirst({
    cacheName: 'supabase-rest-cache',
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

registerRoute(({ url }) => url.href.includes('.supabase.co/auth/'), new NetworkOnly())

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

type PayloadNotificacao = { title?: string; body?: string; url?: string }

self.addEventListener('push', (event) => {
  let dados: PayloadNotificacao = {}
  try {
    dados = event.data?.json() ?? {}
  } catch {
    dados = { body: event.data?.text() }
  }

  const titulo = dados.title || 'PHONEITZ'
  const opcoes: NotificationOptions = {
    body: dados.body || 'Você tem uma atualização.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: dados.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) || '/'

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) await (client as WindowClient).navigate(url)
          return
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
