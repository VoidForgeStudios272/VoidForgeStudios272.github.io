const CACHE_NAME = "voidforge-shell-v5";
const OFFLINE_URL = "./index.html";
const NETWORK_TIMEOUT = 3000;

const SHELL = [
  "./",
  "./index.html",
  "./assets/voidforge-mark.svg",
  "./games.json",
  "./manifest.webmanifest"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate and remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", event => {
  const request = event.request;

  // Only handle GET requests from this origin.
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== location.origin
  ) {
    return;
  }

  const url = new URL(request.url);
  const isNavigation =
    request.mode === "navigate" ||
    url.pathname.endsWith(".html");

  // Always start a network request. A successful response replaces the cached
  // response, so the cache stays as current as the network allows.
  const networkRequest = fetch(request, {
    cache: "no-store"
  }).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;
  });

  // Do not make users wait indefinitely on a slow or unreliable connection.
  // The network request continues in the background and can still update the
  // cache after the timeout has fired.
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Network request timed out")), NETWORK_TIMEOUT);
  });

  const response = Promise.race([networkRequest, timeout])
    .catch(() => caches.match(request))
    .then(cached => {
      if (cached) {
        return cached;
      }

      // If there is no cached copy yet, wait for the network request rather
      // than returning an empty response.
      return networkRequest.catch(() => {
        if (isNavigation) {
          return caches.match(OFFLINE_URL);
        }

        throw new Error("Network unavailable and no cached response exists");
      });
    });

  // Keep the service worker alive long enough for a slow network response to
  // update the cache, even when a cached response was returned to the page.
  event.waitUntil(networkRequest.catch(() => undefined));
  event.respondWith(response);
});
