const CACHE_NAME = "voidforge-shell-v8";
const CACHE_PREFIX = "voidforge-shell-";
const OFFLINE_URL = new URL("./index.html", self.registration.scope).href;

const SHELL = [
  new URL("./", self.registration.scope).href,
  new URL("./index.html", self.registration.scope).href,
  new URL("./assets/voidforge-mark.svg", self.registration.scope).href,
  new URL("./assets/favicon.svg", self.registration.scope).href,
  new URL("./games.json", self.registration.scope).href,
  new URL("./manifest.json", self.registration.scope).href
];

const SHELL_URLS = new Set(SHELL);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isSameOriginRequest(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isNavigationRequest(request) {
  const url = new URL(request.url);
  return request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/";
}

function isShellRequest(request) {
  return SHELL_URLS.has(new URL(request.url).href);
}

async function updateShellCache(request) {
  const response = await fetch(request, { cache: "no-store" });

  if (response.ok && isShellRequest(request)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET" || !isSameOriginRequest(request)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      updateShellCache(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;

        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" }
        });
      })
    );
    return;
  }

  // Do not cache arbitrary same-origin requests. Only shell assets use the
  // cache-first strategy; their network refresh runs in the background.
  if (!isShellRequest(request)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const refresh = updateShellCache(request).catch(() => undefined);
      event.waitUntil(refresh);

      return cached || refresh.then(() => caches.match(request));
    })
  );
});
