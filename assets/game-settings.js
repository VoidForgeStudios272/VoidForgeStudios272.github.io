/* VoidForge game settings bridge.
   Automatically injected by the VoidForge launcher into same-origin games.
   API: VoidForgeSettings.get(), .get(key), .onChange(fn), .set(key,value)
*/
(() => {
  "use strict";
  if (window.VoidForgeSettings) return;
  let current = {};
  let frameCount = 0;
  let fps = 0;
  let lastReport = performance.now();
  const listeners = new Set();
  const mediaBaseVolumes = new WeakMap();

  function reportPerformance() {
    const now = performance.now();
    const elapsed = now - lastReport;
    if (elapsed >= 1000) {
      fps = Math.round(frameCount * 1000 / elapsed);
      frameCount = 0;
      lastReport = now;
      try {
        window.parent.postMessage({
          type: "voidforge:performance",
          gameId: current.gameId || "",
          fps,
          width: window.innerWidth,
          height: window.innerHeight
        }, window.location.origin);
      } catch {}
    }
  }

  // Count game animation callbacks rather than the launcher's own display refresh.
  const nativeRAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = callback => nativeRAF(timestamp => {
    frameCount++;
    callback(timestamp);
    reportPerformance();
  });

  function applyMediaSettings(root = document) {
    const media = root.querySelectorAll ? root.querySelectorAll("audio,video") : [];
    media.forEach(element => {
      if (!mediaBaseVolumes.has(element)) mediaBaseVolumes.set(element, element.volume);
      const src = (element.currentSrc || element.src || "").toLowerCase();
      const kind = element.dataset.audioType || (/(music|bgm|soundtrack|theme)/.test(src) ? "music" : "sfx");
      const level = kind === "music" ? current.musicVolume : current.sfxVolume;
      const master = current.muted ? 0 : (Number(current.masterVolume ?? 100) / 100);
      const channel = Number(level ?? 100) / 100;
      const base = mediaBaseVolumes.get(element);
      element.volume = Math.max(0, Math.min(1, base * master * channel));
      if (current.muted) element.muted = true;
    });
  }

  function applySettings() {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.vfGraphics = current.graphics || "high";
    root.dataset.vfColorMode = current.colorMode || "system";
    root.classList.toggle("vf-reduce-motion", !!current.reduceMotion);
    root.classList.toggle("vf-no-screen-shake", current.screenShake === false);
    root.classList.toggle("vf-no-particles", current.particles === false);
    root.classList.toggle("vf-high-contrast", !!current.highContrast);
    root.classList.toggle("vf-large-cursor", !!current.largeCursor);
    root.style.fontSize = (16 * Number(current.textScale || 100) / 100) + "px";
    root.style.colorScheme = current.colorMode === "system" ? "dark" : current.colorMode;
    applyMediaSettings();
  }

  function receive(event) {
    if (event.source !== window.parent || event.origin !== window.location.origin ||
        !event.data || event.data.type !== "voidforge:settings") return;
    current = { ...(event.data.settings || {}), gameId: event.data.gameId || "" };
    applySettings();
    const detail = { ...current };
    window.dispatchEvent(new CustomEvent("voidforge:settings-change", { detail }));
    listeners.forEach(callback => { try { callback(detail); } catch (error) { console.error("[VoidForge settings]", error); } });
  }

  window.addEventListener("message", receive);
  if (window.MutationObserver) {
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches?.("audio,video")) applyMediaSettings({querySelectorAll:()=>[node]});
          applyMediaSettings(node);
        }
      }));
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

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
    request() { window.parent.postMessage({ type: "voidforge:settings-request" }, window.location.origin); }
  });

  const style = document.createElement("style");
  style.dataset.voidforgeSettings = "true";
  style.textContent = `
    .vf-reduce-motion *, .vf-reduce-motion *::before, .vf-reduce-motion *::after {
      animation-duration: .01ms !important; animation-iteration-count: 1 !important;
      scroll-behavior: auto !important; transition-duration: .01ms !important;
    }
    .vf-no-screen-shake [data-screen-shake], .vf-no-screen-shake .screen-shake,
    .vf-no-screen-shake .shake-effect { animation: none !important; transform: none !important; }
    .vf-no-particles [data-particle], .vf-no-particles .particle,
    .vf-no-particles .particles, .vf-no-particles canvas.particles { display: none !important; }
    .vf-high-contrast { filter: contrast(1.18); }
    .vf-large-cursor, .vf-large-cursor * { cursor: default; }
  `;
  (document.head || document.documentElement).appendChild(style);
  window.VoidForgeSettings.request();
})();
