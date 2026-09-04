const CACHE = 'worklog-shell-v25'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
    const windows = await self.clients.matchAll({ type: 'window' })
    await Promise.all(windows.map((client) => client.navigate(client.url)))
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const request = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'no-store' })
    : event.request
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)))
    }
    return response
  }).catch(async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached
    if (event.request.mode === 'navigate') return caches.match('/')
    return Response.error()
  }))
})
