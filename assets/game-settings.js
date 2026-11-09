/* VoidForge game settings bridge.
   Available in every game launched by the Studio.
   API: VoidForgeSettings.get(), .get(key), .onChange(callback), .set(key,value)
*/
(() => {
  "use strict";
  if (window.VoidForgeSettings) return;
  let current = {};
  const listeners = new Set();
  function receive(event) {
    if (event.source !== window.parent || !event.data || event.data.type !== "voidforge:settings") return;
    current = { ...(event.data.settings || {}) };
    const detail = { ...current, gameId: event.data.gameId || "" };
    window.dispatchEvent(new CustomEvent("voidforge:settings-change", { detail }));
    listeners.forEach(callback => { try { callback(detail); } catch (error) { console.error("[VoidForge settings]", error); } });
  }
  window.addEventListener("message", receive);
  window.VoidForgeSettings = Object.freeze({
    get(key) { return key ? current[key] : { ...current }; },
    onChange(callback) {
      if (typeof callback !== "function") return () => {};
      listeners.add(callback);
      if (Object.keys(current).length) callback({ ...current });
      return () => listeners.delete(callback);
    },
    set(key, value) {
      if (typeof key !== "string" || !key) return;
      window.parent.postMessage({ type: "voidforge:settings-update", settings: { [key]: value } }, window.location.origin);
    },
    request() {
      window.parent.postMessage({ type: "voidforge:settings-request" }, window.location.origin);
    }
  });
  window.VoidForgeSettings.request();
})();
