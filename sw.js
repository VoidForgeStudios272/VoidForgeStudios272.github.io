const CACHE_NAME = "voidforge-shell-v3";
const OFFLINE_URL = "./index.html";

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

  // Only handle GET requests from this origin
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== location.origin
  ) {
    return;
  }

  const url = new URL(request.url);

  // -----------------------------------------
  // Updated logo
  // Always fetch newest version from network
  // -----------------------------------------
  if (url.pathname.endsWith("/assets/voidforge-mark.svg")) {
    event.respondWith(
      fetch(request, {
        cache: "reload"
      })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }

  // -----------------------------------------
  // games.json
  // Network first, cache fallback
  // -----------------------------------------
  if (url.pathname.endsWith("/games.json")) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }

  // -----------------------------------------
  // CSS / JS
  // Always try the newest version
  // -----------------------------------------
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }

  // -----------------------------------------
  // HTML
  // Network first, offline fallback
  // -----------------------------------------
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => {
              return cached || caches.match(OFFLINE_URL);
            });
        })
    );

    return;
  }

  // -----------------------------------------
  // Images, icons, manifest, etc.
  // Cache first, network fallback
  // -----------------------------------------
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {
            if (response.ok) {
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
