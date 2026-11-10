/* VoidForge game settings bridge.
   Automatically injected by the VoidForge launcher into same-origin games.
   API: VoidForgeSettings.get(), .get(key), .onChange(fn), .set(key,value)
*/
(() => {
  "use strict";
  if (window.VoidForgeSettings) return;
  let current = {};
  let currentGameSettings = {};
  let frameCount = 0;
  let fps = 0;
  let lastReport = performance.now();
  const listeners = new Set();
  const mediaBaseVolumes = new WeakMap();
  const mediaBaseMuted = new WeakMap();

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
  function scheduleGameFrame(callback) {
    nativeRAF(timestamp => {
      if (current.pauseOnBlur && !document.hasFocus()) {
        scheduleGameFrame(callback);
        reportPerformance();
        return;
      }
      frameCount++;
      callback(timestamp);
      reportPerformance();
    });
  }
  window.requestAnimationFrame = callback => scheduleGameFrame(callback);

  function applyMediaSettings(root = document) {
    const media = root.querySelectorAll ? root.querySelectorAll("audio,video") : [];
    media.forEach(element => {
      if (!mediaBaseVolumes.has(element)) mediaBaseVolumes.set(element, element.volume);
      if (!mediaBaseMuted.has(element)) mediaBaseMuted.set(element, element.muted);
      const src = (element.currentSrc || element.src || "").toLowerCase();
      const kind = element.dataset.audioType || (/(music|bgm|soundtrack|theme)/.test(src) ? "music" : "sfx");
      const level = kind === "music" ? current.musicVolume : current.sfxVolume;
      const backgroundMuted = !!current.muteWhenUnfocused && document.hidden;
      const master = current.muted || backgroundMuted ? 0 : (Number(current.masterVolume ?? 100) / 100);
      const channel = Number(level ?? 100) / 100;
      const base = mediaBaseVolumes.get(element);
      element.volume = Math.max(0, Math.min(1, base * master * channel));
      element.muted = !!current.muted || mediaBaseMuted.get(element);
    });
  }

  function applySettings() {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.vfGraphics = current.graphics || "high";
    root.dataset.vfColorMode = current.colorMode || "system";
    root.dataset.vfFov = String(current.fov ?? 90);
    root.dataset.vfShadows = current.shadows || "high";
    root.dataset.vfTargetFps = current.targetFps || "60";
    root.dataset.vfDifficulty = current.difficulty || "normal";
    root.dataset.vfLanguage = current.language || "system";
    root.dataset.vfUiDensity = current.uiDensity || "comfortable";
    root.dataset.vfOrientation = current.screenOrientation || "auto";
    root.dataset.vfColorBlindMode = current.colorBlindMode || "off";
    root.dataset.vfCrosshair = current.crosshairStyle || "default";
    root.dataset.vfHudOpacity = String(current.hudOpacity ?? 100);
    root.dataset.vfDisplayBrightness = String(current.displayBrightness ?? 100);
    root.dataset.vfDisplayContrast = String(current.displayContrast ?? 100);
    root.dataset.vfDisplaySaturation = String(current.displaySaturation ?? 100);
    root.dataset.vfControllerDeadzone = String(current.controllerDeadzone ?? 12);
    root.dataset.vfInvertY = current.invertY ? "true" : "false";
    root.dataset.vfRenderScale = String(current.renderScale ?? 100);
    root.dataset.vfAntiAliasing = current.antiAliasing === false ? "false" : "true";
    root.style.setProperty("--vf-fov", String(current.fov ?? 90) + "deg");
    root.style.setProperty("--vf-sensitivity", String(current.sensitivity ?? 1));
    root.style.setProperty("--vf-render-scale", String(Number(current.renderScale ?? 100) / 100));
    root.classList.toggle("vf-no-antialias", current.antiAliasing === false);
    root.classList.toggle("vf-safe-area-guide", !!current.showSafeArea);
    root.classList.toggle("vf-reduce-motion", !!current.reduceMotion);
    root.classList.toggle("vf-no-screen-shake", current.screenShake === false);
    root.classList.toggle("vf-no-particles", current.particles === false);
    root.classList.toggle("vf-high-contrast", !!current.highContrast);
    root.classList.toggle("vf-large-cursor", !!current.largeCursor);
    root.classList.toggle("vf-developer-mode", !!current.developerMode);
    root.classList.toggle("vf-left-handed", !!current.leftHandedControls);
    root.classList.toggle("vf-dyslexia-font", !!current.dyslexiaFriendlyFont);
    root.classList.toggle("vf-reduce-flashes", !!current.reduceFlashes);
    root.classList.toggle("vf-hide-cursor", !!current.hideCursor);
    root.classList.toggle("vf-compact-hud", !!current.compactHud);
    root.classList.toggle("vf-liquid-glass", !!current.liquidGlass);
    root.style.setProperty("--vf-hud-opacity", String(Number(current.hudOpacity ?? 100) / 100));
    root.style.setProperty("--vf-touch-scale", String(Number(current.touchButtonSize ?? 100) / 100));
    root.style.setProperty("--vf-text-spacing", String(Number(current.textSpacing ?? 100) / 100));
    root.style.setProperty("--vf-subtitle-scale", String(Number(current.subtitleSize ?? 100) / 100));
    root.style.setProperty("--vf-display-filter", "brightness(" + Number(current.displayBrightness ?? 100) / 100 + ") contrast(" + Number(current.displayContrast ?? 100) / 100 + ") saturate(" + Number(current.displaySaturation ?? 100) / 100 + ")");
    root.classList.toggle("vf-debug-info", !!current.showDebugInfo);
    root.style.fontSize = (16 * Number(current.textScale || 100) / 100) + "px";
    root.style.colorScheme = current.colorMode === "system" ? "dark" : current.colorMode;
    applyMediaSettings();
  }

  function receive(event) {
    if (event.source !== window.parent || event.origin !== window.location.origin ||
        !event.data || event.data.type !== "voidforge:settings") return;
    current = { ...(event.data.settings || {}), gameId: event.data.gameId || "" };
    currentGameSettings = { ...(event.data.gameSettings || {}) };
    applySettings();
    const detail = { ...current };
    window.dispatchEvent(new CustomEvent("voidforge:settings-change", { detail }));
    window.dispatchEvent(new CustomEvent("voidforge:game-settings-change", { detail:{gameId:current.gameId,settings:{...currentGameSettings}} }));
    listeners.forEach(callback => { try { callback(detail); } catch (error) { console.error("[VoidForge settings]", error); } });
  }

  window.addEventListener("message", receive);
  document.addEventListener("visibilitychange", applyMediaSettings);
  window.addEventListener("error", event => {
    if (!current.developerMode || !current.showConsoleErrors) return;
    window.parent.postMessage({type:"voidforge:game-error",gameId:current.gameId||"",message:String(event.message||"Unknown error"),source:String(event.filename||""),line:Number(event.lineno||0)},window.location.origin);
  });
  window.addEventListener("unhandledrejection", event => {
    if (!current.developerMode || !current.showConsoleErrors) return;
    window.parent.postMessage({type:"voidforge:game-error",gameId:current.gameId||"",message:String(event.reason?.message||event.reason||"Unhandled promise rejection")},window.location.origin);
  });
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
    version: 2,
    get connected() { return !!current.gameId; },
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
    notify(title, options = {}) {
      if (current.notifications === false || !("Notification" in window) || Notification.permission !== "granted") return false;
      try { new Notification(String(title || "Game notification"), options); return true; } catch { return false; }
    },
    vibrate(pattern = 30) {
      if (current.controllerVibration === false || typeof navigator.vibrate !== "function") return false;
      try { return navigator.vibrate(pattern); } catch { return false; }
    },
    requestReload() {
      window.parent.postMessage({ type: "voidforge:reload-request", gameId: current.gameId || "" }, window.location.origin);
    },
    getGame() { return { ...currentGameSettings }; },
    onGameChange(callback) {
      if (typeof callback !== "function") return () => {};
      const handler = event => { try { callback({ ...event.detail.settings }); } catch (error) { console.error("[VoidForge game settings]", error); } };
      window.addEventListener("voidforge:game-settings-change", handler);
      if (Object.keys(currentGameSettings).length) callback({ ...currentGameSettings });
      return () => window.removeEventListener("voidforge:game-settings-change", handler);
    },
    cameraOptions() {
      return { fov:Number(current.fov ?? 90), sensitivity:Number(current.sensitivity ?? 1), invertY:!!current.invertY };
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
    .vf-hide-cursor, .vf-hide-cursor * { cursor: none !important; }
    .vf-dyslexia-font { font-family: "Atkinson Hyperlegible", "Trebuchet MS", system-ui, sans-serif; }
    .vf-dyslexia-font p, .vf-dyslexia-font li, .vf-dyslexia-font label { letter-spacing: .025em; line-height: 1.55; }
    .vf-reduce-flashes *, .vf-reduce-flashes *::before, .vf-reduce-flashes *::after { animation-duration: .8s !important; }
    .vf-compact-hud [data-vf-hud], .vf-compact-hud .game-hud, .vf-compact-hud .hud { gap: 5px !important; padding: 6px !important; }
    [data-vf-hud], .game-hud, .hud { opacity: var(--vf-hud-opacity, 1); }
    [data-vf-touch-control], .touch-control, .mobile-control { font-size: calc(1em * var(--vf-touch-scale, 1)); }
    [data-vf-display-adjust], canvas[data-vf-adjust], video[data-vf-adjust] { filter: var(--vf-display-filter, none); }
    .vf-left-handed [data-control-side="left"] { order: 2; }
    .vf-left-handed [data-control-side="right"] { order: 1; }
    .vf-safe-area-guide::after {
      content:""; position:fixed; z-index:2147483000; inset:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);
      border:1px dashed rgba(80,170,255,.85); pointer-events:none;
    }
    .vf-debug-info::before {
      content:"VOIDFORGE DEV · FOV " attr(data-vf-fov) "°"; position:fixed; z-index:2147483000; left:8px; bottom:8px;
      padding:5px 8px; border-radius:5px; color:#dceaff; background:rgba(2,8,18,.8); font:11px monospace; pointer-events:none;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
  window.VoidForgeSettings.request();
})();
