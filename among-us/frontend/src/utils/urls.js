// URL helpers for API + Socket.IO.
//
// Local dev (default): empty base → browser hits the Vite origin (port 8080),
// and Vite proxies /rooms, /player, /isImposter, /socket.io to the backend.
// That avoids CORS entirely during development.
//
// Production / direct backend: set VITE_BACKEND_URL (and optionally VITE_SOCKET_URL)
// to the absolute backend origin. API and Socket.IO share one server/port.

function normalizeUrl(url) {
  return String(url).replace(/\/$/, '');
}

/**
 * Base URL for REST API calls.
 * @returns {string} Absolute origin, or '' for same-origin (Vite proxy).
 */
export function getBackendBase() {
  if (import.meta.env.VITE_BACKEND_URL) {
    return normalizeUrl(import.meta.env.VITE_BACKEND_URL);
  }
  // Same-origin: Vite dev proxy (or reverse proxy in production) handles routing.
  return '';
}

/**
 * Build a full API path URL.
 * @param {string} path e.g. '/rooms' or 'rooms'
 */
export function apiUrl(path) {
  const base = getBackendBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Socket.IO server URL.
 * Returns undefined so socket.io-client connects to the page origin
 * (Vite proxies /socket.io in dev).
 * @returns {string|undefined}
 */
export function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return normalizeUrl(import.meta.env.VITE_SOCKET_URL);
  }
  // Same process serves HTTP + Socket.IO — reuse backend URL when set.
  if (import.meta.env.VITE_BACKEND_URL) {
    return normalizeUrl(import.meta.env.VITE_BACKEND_URL);
  }
  // Same-origin (Vite proxy)
  return undefined;
}
