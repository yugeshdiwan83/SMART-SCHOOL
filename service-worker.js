
const CACHE_NAME = "smart-school-pwa-v3";

const BASE_URL = self.registration.scope;

const APP_SHELL = [
  new URL("./", BASE_URL).href,
  new URL("./index.html", BASE_URL).href,
  new URL("./manifest.json", BASE_URL).href,
  new URL("./icons/icon-192.png", BASE_URL).href,
  new URL("./icons/icon-512.png", BASE_URL).href
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("smart-school-pwa-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (!url.href.startsWith(BASE_URL)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(new URL("./", BASE_URL).href, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return await cache.match(new URL("./", BASE_URL).href)
            || await cache.match(new URL("./index.html", BASE_URL).href);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});
