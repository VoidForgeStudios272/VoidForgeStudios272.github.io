(() => {
  "use strict";

  /* =========================================================
     DOM HELPERS
  ========================================================= */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  function createElement(tagName, className = "", text = null) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (text !== null && text !== undefined) {
      element.textContent = String(text);
    }

    return element;
  }

  function appendChildren(parent, ...children) {
    children.forEach((child) => {
      if (child) {
        parent.appendChild(child);
      }
    });

    return parent;
  }

  function setupPanic() {
    if (panicButton) panicButton.addEventListener("click", triggerPanic);
    document.addEventListener("keydown", (event) => {
      if (!currentGame) return;
      const key = getPanicKey();
      if (!key || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      const pressed = event.key.toLowerCase();
      if (pressed === key || event.code.toLowerCase() === key) { event.preventDefault(); triggerPanic(); }
    });
  }

  /* =========================================================
     GAME VIEW
  ========================================================= */

  const gameView = $("#gameView");
  const gameFrame = $("#gameFrame");
  const gameLoader = $("#gameLoader");
  const gameError = $("#gameError");

  const gameTitle = $("#gameTitle");
  const gameStatus = $("#gameStatus");
  const gameInfo = $("#gameInfo");

  const reloadButton = $("#reloadGame");
  const fullscreenButton = $("#gameFullscreen");
  const gameBookmarkButton = $("#gameBookmark");
  const panicButton = $("#panicButton");

  const closeButton =
    $("#gameClose") ||
    $("#gameCloseButton") ||
    $('[data-action="close-game"]');

  const PANIC_URL_KEY = "voidforgePanicUrl";
  const PANIC_KEY_KEY = "voidforgePanicKey";

  function getPanicUrl() {
    return localStorage.getItem(PANIC_URL_KEY) || "";
  }

  function getPanicKey() {
    return (localStorage.getItem(PANIC_KEY_KEY) || "").trim().toLowerCase();
  }

  const FAKE_BRAND_KEY = "voidforgeFakeBrandV1";
  const FAKE_BRAND_PRESETS = {
    google: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 0 262 262"><path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/><path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/><path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"/><path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/></svg>',
    classroom: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 578.9 500"><path fill="#0F9D58" d="M52.6 52.6h473.7v394.7H52.6V52.6z"/><path fill="#57BB8A" d="M394.7 263.2c16.4 0 29.6-13.3 29.6-29.6S411 204 394.7 204s-29.6 13.3-29.6 29.6 13.3 29.6 29.6 29.6zm0 19.7c-31.7 0-65.8 16.8-65.8 37.6v21.6h131.6v-21.6c0-20.8-34.1-37.6-65.8-37.6zm-210.5-19.7c16.4 0 29.6-13.3 29.6-29.6S200.5 204 184.2 204s-29.6 13.3-29.6 29.6 13.3 29.6 29.6 29.6zm0 19.7c-31.7 0-65.8 16.8-65.8 37.6v21.6H250v-21.6c0-20.8-34.1-37.6-65.8-37.6z"/><path fill="#F7F7F7" d="M289.5 236.8c21.8 0 39.5-17.7 39.4-39.5 0-21.8-17.7-39.5-39.5-39.4-21.8 0-39.4 17.7-39.4 39.5s17.7 39.4 39.5 39.4zm0 26.4c-44.4 0-92.1 23.6-92.1 52.6v26.3h184.2v-26.3c0-29.1-47.7-52.6-92.1-52.6z"/><path fill="#F1F1F1" d="M342.1 421.1h118.4v26.3H342.1v-26.3z"/><path fill="#F4B400" d="M539.5 0h-500C17.7 0 0 17.7 0 39.5v421.1C0 482.3 17.7 500 39.5 500h500c21.8 0 39.5-17.7 39.5-39.5v-421C578.9 17.7 561.3 0 539.5 0zm-13.2 447.4H52.6V52.6h473.7v394.8z"/></svg>'
  };
  function readFakeBrand() {
    try { const value=JSON.parse(localStorage.getItem(FAKE_BRAND_KEY)||"{}"); return value&&typeof value==="object"?value:{}; }
    catch { return {}; }
  }
  function applyFakeBrand() {
    const config=readFakeBrand();
    const title=config.enabled && typeof config.title==="string" && config.title.trim()
      ? config.title.trim()
      : "Teams";
    document.title=title;
    // iPadOS reads this Apple-specific title for Home Screen web apps.
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = title;

    // iPadOS expects a raster Apple touch icon. Convert our SVG presets to PNG
    // before Safari reads the page metadata for Add to Home Screen.
    const icon=document.querySelector('link[rel="icon"]');
    const shortcutIcon=document.querySelector('link[rel="shortcut icon"]');
    const appleIcon=document.querySelector('link[rel="apple-touch-icon"]');
    const fallbackIcon="./assets/bookmark-icon.svg?v=16";
    let iconUrl=fallbackIcon;
    let appleSource=fallbackIcon;
    const isRasterIcon=url=>/\.(png|jpe?g|webp)(?:[?#]|$)/i.test(String(url||""));
    function getAppleIconUrl(url) {
      const value=String(url||"").trim();
      if(isRasterIcon(value)) return value;
      // Wikimedia's SVGs are excellent browser icons, but iPad Home Screen
      // icons need a raster image. Use Wikimedia's own PNG thumbnail so
      // Safari never has to rasterize a cross-origin SVG through canvas.
      try {
        const parsed=new URL(value,window.location.href);
        const match=parsed.pathname.match(/^\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+\.svg)$/i);
        if(parsed.hostname==="upload.wikimedia.org" && match) {
          const file=match[3];
          return "https://thumb.wikimedia.org/wikipedia/commons/thumb/"+match[1]+"/"+match[2]+"/"+file+"/180px-"+file+".png";
        }
      } catch {}
      return value;
    }
    if(config.enabled) {
      if(config.preset==="google" || config.preset==="classroom") {
        iconUrl="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(FAKE_BRAND_PRESETS[config.preset]);
        appleSource=iconUrl;
      } else if(config.preset==="svg" && typeof config.svgCode==="string" && config.svgCode.trim()) {
        iconUrl="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(config.svgCode.trim());
        appleSource=iconUrl;
      } else if(config.preset==="custom" && typeof config.logoUrl==="string" && config.logoUrl.trim()) {
        iconUrl=config.logoUrl.trim().replace(/\\\\&/g,"&").replace(/\\\\_/g,"_");
        appleSource=getAppleIconUrl(iconUrl);
      }
    }
    [icon,shortcutIcon].filter(Boolean).forEach(link=>link.href=iconUrl);
    if(appleIcon) {
      if(isRasterIcon(appleSource)) {
        appleIcon.href=appleSource;
        appleIcon.type=appleSource.toLowerCase().includes(".jpg")||appleSource.toLowerCase().includes(".jpeg") ? "image/jpeg" : "image/png";
        appleIcon.sizes="180x180";
      } else {
        appleIcon.href=fallbackIcon;
        appleIcon.type="image/svg+xml";
        appleIcon.sizes="any";
        const touchImage=new Image();
        // CORS-enabled rasterization works for remote SVGs that permit it.
        if(/^https?:/i.test(appleSource)) touchImage.crossOrigin="anonymous";
        touchImage.onload=()=>{
          try {
            const canvas=document.createElement("canvas");
            canvas.width=180;
            canvas.height=180;
            const context=canvas.getContext("2d");
            if(!context) return;
            context.clearRect(0,0,180,180);
            context.drawImage(touchImage,0,0,180,180);
            appleIcon.href=canvas.toDataURL("image/png");
            appleIcon.type="image/png";
            appleIcon.sizes="180x180";
          } catch(error) {
            console.warn("Could not prepare the iPad Home Screen icon:",error);
          }
        };
        touchImage.onerror=()=>console.warn("Could not load the selected Home Screen icon.");
        touchImage.src=appleSource;
      }
    }

    // Keep the real, static manifest URL. iPadOS Safari uses Apple touch-icon
    // and apple-mobile-web-app-title metadata instead of the Web App Manifest.
    let ogTitle=document.querySelector('meta[property="og:title"]');
    if(!ogTitle) {
      ogTitle=document.createElement("meta");
      ogTitle.setAttribute("property","og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content=title;
  }

  function triggerPanic() {
    const url = getPanicUrl();
    if (!url) {
      showToast("Set a Panic URL in Settings first.");
      return;
    }
    try {
      const parsed = new URL(url, window.location.href);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      window.location.replace(parsed.href);
    } catch {
      showToast("Your Panic URL is invalid.");
    }
  }

  /* =========================================================
     STATE
  ========================================================= */

  let games = [];
  let currentGame = null;


  /* =========================================================
     LOCAL PLAYER PROFILES
     Profiles are browser-local; no account or backend required.
  ========================================================= */
  const PROFILE_STORAGE_KEY = "voidforgeProfilesV1";
  const ACTIVE_PROFILE_KEY = "voidforgeActiveProfileV1";
  const PROFILE_COLORS = ["#6d9cff", "#8b7cff", "#48c7a5", "#e4a35e", "#e47d9b", "#65b9d8"];
  let profiles = [];
  let activeProfileId = "";

  function loadProfiles() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "[]");
      profiles = Array.isArray(saved) ? saved.filter(p => p && typeof p.id === "string" && typeof p.name === "string") : [];
    } catch { profiles = []; }
    if (!profiles.length) profiles = [{ id: "player-default", name: "Player", color: PROFILE_COLORS[0], createdAt: Date.now() }];
    activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY) || profiles[0].id;
    if (!profiles.some(p => p.id === activeProfileId)) activeProfileId = profiles[0].id;
    saveProfiles();
    updateProfileHeader();
  }

  function saveProfiles() {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } catch (error) {
      console.warn("[VoidForge] Could not save local profiles:", error);
      showToast("Profiles could not be saved in this browser.");
    }
  }

  function getActiveProfile() {
    return profiles.find(p => p.id === activeProfileId) || profiles[0];
  }

  function updateProfileHeader() {
    const profile = getActiveProfile();
    if (!profile) return;
    const name = $("#activeProfileName");
    const avatar = $("#activeProfileAvatar");
    const subtitle = $("#activeProfileSubtitle");
    if (name) name.textContent = profile.name;
    if (avatar) {
      avatar.textContent = profile.name.trim().charAt(0).toUpperCase() || "P";
      avatar.style.background = profile.color || PROFILE_COLORS[0];
    }
    if (subtitle) subtitle.textContent = "Local profile";
  }

  function renderProfilesView(root) {
    const section = createLauncherView("profiles-view");
    section.appendChild(createViewHeading("Profiles", "Choose who is playing on this device."));
    const note = createElement("p", "profiles-note", "Profiles are saved in this browser on this device. They are not online accounts and do not sync between devices.");
    section.appendChild(note);

    const grid = createElement("div", "profiles-grid");
    profiles.forEach(profile => {
      const card = createElement("article", "profile-card" + (profile.id === activeProfileId ? " is-current" : ""));
      const avatar = createElement("div", "profile-card-avatar", profile.name.trim().charAt(0).toUpperCase() || "P");
      avatar.style.background = profile.color || PROFILE_COLORS[0];
      const info = createElement("div", "profile-card-info");
      info.appendChild(createElement("strong", "", profile.name));
      info.appendChild(createElement("small", "", profile.id === activeProfileId ? "Currently active" : "Local profile"));
      const top = createElement("div", "profile-card-top");
      appendChildren(top, avatar, info);
      card.appendChild(top);

      const actions = createElement("div", "profile-card-actions");
      if (profile.id !== activeProfileId) {
        const select = createElement("button", "secondary-button profile-action", "Use profile");
        select.type = "button";
        select.addEventListener("click", () => {
          activeProfileId = profile.id;
          saveProfiles();
          updateProfileHeader();
          renderProfilesView(root);
          showToast("Switched to " + profile.name + ".");
        });
        actions.appendChild(select);
      } else {
        actions.appendChild(createElement("span", "profile-current-label", "ACTIVE"));
      }

      const rename = createElement("button", "icon-button profile-small-action", "✎");
      rename.type = "button"; rename.title = "Rename " + profile.name; rename.setAttribute("aria-label", rename.title);
      rename.addEventListener("click", () => {
        const next = window.prompt("New profile name", profile.name);
        if (next === null) return;
        const clean = next.trim().slice(0, 24);
        if (!clean) { showToast("Enter a profile name."); return; }
        profile.name = clean; saveProfiles(); updateProfileHeader(); renderProfilesView(root);
      });
      actions.appendChild(rename);

      if (profiles.length > 1) {
        const remove = createElement("button", "icon-button profile-small-action profile-remove", "×");
        remove.type = "button"; remove.title = "Delete " + profile.name; remove.setAttribute("aria-label", remove.title);
        remove.addEventListener("click", () => {
          if (!window.confirm("Delete the local profile \"" + profile.name + "\"?")) return;
          profiles = profiles.filter(p => p.id !== profile.id);
          if (activeProfileId === profile.id) activeProfileId = profiles[0].id;
          saveProfiles(); updateProfileHeader(); renderProfilesView(root);
          showToast("Profile deleted.");
        });
        actions.appendChild(remove);
      }
      card.appendChild(actions);
      grid.appendChild(card);
    });
    section.appendChild(grid);

    const createPanel = createElement("form", "profile-create-panel");
    createPanel.addEventListener("submit", event => {
      event.preventDefault();
      const input = $("#newProfileName", createPanel);
      const name = (input?.value || "").trim().slice(0, 24);
      if (!name) { input?.focus(); return; }
      if (profiles.length >= 12) { showToast("You can create up to 12 profiles."); return; }
      const color = PROFILE_COLORS[profiles.length % PROFILE_COLORS.length];
      const profile = { id: "profile-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name, color, createdAt: Date.now() };
      profiles.push(profile);
      activeProfileId = profile.id;
      saveProfiles(); updateProfileHeader(); renderProfilesView(root);
      showToast("Profile created.");
    });
    createPanel.appendChild(createElement("h2", "", "Add a profile"));
    const row = createElement("div", "profile-create-row");
    const input = createElement("input");
    input.id = "newProfileName"; input.type = "text"; input.maxLength = 24; input.placeholder = "Enter a profile name"; input.autocomplete = "off"; input.required = true; input.setAttribute("aria-label", "New profile name");
    const add = createElement("button", "primary-button", "Create profile"); add.type = "submit";
    appendChildren(row, input, add);
    createPanel.appendChild(row);
    createPanel.appendChild(createElement("small", "hint", "Up to 12 profiles. Each profile has its own name and color."));
    section.appendChild(createPanel);
    root.replaceChildren(section);
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function showToast(message, duration = 3000) {
    let toast = $("#vfToast");

    if (!toast) {
      toast = createElement("div", "vf-toast");
      toast.id = "vfToast";
      document.body.appendChild(toast);
    }

    toast.textContent = String(message ?? "");
    toast.classList.add("show");

    clearTimeout(toast._timeout);

    toast._timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  /* =========================================================
     GAME HELPERS
  ========================================================= */

  function normalizeFolder(entry) {
    if (!entry) {
      return "";
    }

    let value = String(entry).trim();

    value = value
      .replace(/^\.\/+/, "")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    if (!value) {
      return "";
    }

    if (
      value.includes("\\") ||
      value.includes("..") ||
      value.includes(":") ||
      value.startsWith("//")
    ) {
      return "";
    }

    return value;
  }

  function gameUrl(game) {
    const folder = normalizeFolder(game?.entry);

    if (!folder) {
      return "";
    }

    return `./${folder}/index.html`;
  }

  function setText(element, value) {
    if (!element) {
      return;
    }

    element.textContent =
      value === undefined || value === null
        ? ""
        : String(value);
  }

  function showLoader(show) {
    if (!gameLoader) {
      return;
    }

    gameLoader.hidden = !show;
  }

  function showError(message) {
    if (!gameError) {
      return;
    }

    gameError.hidden = false;

    const messageElement =
      $("#gameErrorMessage", gameError) ||
      $(".game-error-message", gameError) ||
      $("p", gameError);

    if (messageElement) {
      messageElement.textContent = String(message ?? "");
      return;
    }

    gameError.textContent = String(message ?? "");
  }

  function hideError() {
    if (!gameError) {
      return;
    }

    gameError.hidden = true;
  }

  /* =========================================================
     SAFE URL HELPERS
  ========================================================= */

  function getSafeImageUrl(value) {
    if (!value) {
      return "";
    }

    try {
      const url = new URL(
        String(value),
        document.baseURI
      );

      const isRemoteImage =
        url.protocol === "http:" ||
        url.protocol === "https:";

      const isLocalImage =
        document.location.protocol === "file:" &&
        url.protocol === "file:";

      if (!isRemoteImage && !isLocalImage) {
        return "";
      }

      return url.href;
    } catch {
      return "";
    }
  }

  /* =========================================================
     GAME REGISTRY
  ========================================================= */

  function validateGames(data) {
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.games)
        ? data.games
        : null;

    if (!list) {
      throw new Error(
        "games.json must contain an array of games."
      );
    }

    return list.filter((game) => {
      return (
        game &&
        typeof game === "object" &&
        game.id !== undefined &&
        game.id !== null &&
        String(game.id).trim() !== "" &&
        game.entry !== undefined &&
        game.entry !== null &&
        normalizeFolder(game.entry) !== ""
      );
    });
  }

  function getRegistryPath() {
    const embedded = $("#embeddedGameRegistry");

    if (!embedded) {
      return "./games.json";
    }

    try {
      const parsed = JSON.parse(
        embedded.textContent.trim()
      );

      if (
        typeof parsed === "string" &&
        parsed.trim()
      ) {
        return sanitizeRegistryPath(parsed);
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        typeof parsed.source === "string" &&
        parsed.source.trim()
      ) {
        return sanitizeRegistryPath(parsed.source);
      }
    } catch {
      // Fall back to default registry.
    }

    return "./games.json";
  }

  function sanitizeRegistryPath(value) {
    const path = String(value).trim();

    if (
      !path ||
      path.includes("\\") ||
      path.includes("..") ||
      path.includes(":") ||
      path.startsWith("//")
    ) {
      return "./games.json";
    }

    return path.startsWith("./")
      ? path
      : `./${path.replace(/^\/+/, "")}`;
  }

  function getEmbeddedGames() {
    const embedded = $("#embeddedGameRegistry");

    if (!embedded) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        embedded.textContent.trim()
      );

      return Array.isArray(parsed)
        ? validateGames(parsed)
        : null;
    } catch {
      return null;
    }
  }

  async function loadGames() {
    try {
      const registryPath = getRegistryPath();

      const response = await fetch(registryPath, {
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load ${registryPath} (${response.status})`
        );
      }

      const data = await response.json();

      games = validateGames(data);

      console.log(
        `[VoidForge] Loaded ${games.length} game(s) from ${registryPath}`
      );

      renderGames();

      return games;
    } catch (error) {
      console.error(
        "[VoidForge] Failed to load the game registry:",
        error
      );

      const fallbackGames = getEmbeddedGames();

      if (
        fallbackGames &&
        fallbackGames.length
      ) {
        games = fallbackGames;

        console.warn(
          "[VoidForge] Using embedded game registry fallback."
        );

        renderGames();

        showToast(
          "Using the embedded game registry because the game registry could not be loaded."
        );

        return games;
      }

      games = [];

      renderGames();

      showToast(
        "Unable to load the game library."
      );

      return [];
    }
  }

  /* =========================================================
     GAME CARD CREATION
     
     CSS / DOM STRUCTURE:

     article.game-card
       ├── div.game-card-image
       └── div.game-card-content
           ├── div.game-card-header
           │   ├── title/subtitle
           │   └── span.game-status
           ├── p.game-card-description
           ├── div.game-tags
           └── div.game-card-footer
               ├── span.game-platform
               └── button.play-game
  ========================================================= */

  function createGameCard(game) {
    const title =
      game.name ||
      game.title ||
      game.id ||
      "Game";

    const subtitle =
      game.subtitle ||
      "";

    const status =
      game.status ||
      "Available";

    const platform =
      game.platform ||
      "Browser";

    /*
     * FIX:
     * The outer card must use .game-card because
     * that is what the stylesheet targets.
     */
    const card = createElement(
      "article",
      "game-card"
    );

    card.dataset.gameId = String(game.id);

    /* -------------------------------------------------------
       IMAGE
    ------------------------------------------------------- */

    /*
     * FIX:
     * .game-art -> .game-card-image
     */
    const imageWrapper = createElement(
      "div",
      "game-card-image"
    );

    const imageSource = getSafeImageUrl(
      game.image ||
      game.thumbnail ||
      game.cover
    );

    if (imageSource) {
      const image = document.createElement("img");

      image.src = imageSource;
      image.alt = String(title);
      image.loading = "lazy";

      image.addEventListener(
        "error",
        () => {
          image.remove();

          imageWrapper.classList.add(
            "game-card-placeholder"
          );

          if (!imageWrapper.firstElementChild) {
            imageWrapper.appendChild(
              createElement(
                "span",
                "",
                String(title)
                  .charAt(0)
                  .toUpperCase()
              )
            );
          }
        },
        { once: true }
      );

      imageWrapper.appendChild(image);
    } else {
      imageWrapper.classList.add(
        "game-card-placeholder"
      );

      imageWrapper.appendChild(
        createElement(
          "span",
          "",
          String(title)
            .charAt(0)
            .toUpperCase()
        )
      );
    }

    const favoriteButton=document.createElement("button");
    favoriteButton.type="button";
    favoriteButton.className="vf-game-favorite";
    favoriteButton.textContent=readFavoriteGameIds().has(String(game.id))?"★":"☆";
    favoriteButton.setAttribute("aria-label",(favoriteButton.textContent==="★"?"Remove from":"Add to")+" favorites: "+String(title));
    favoriteButton.setAttribute("aria-pressed",String(favoriteButton.textContent==="★"));
    favoriteButton.addEventListener("click",event=>{
      event.stopPropagation();
      const favorites=readFavoriteGameIds();
      if(favorites.has(String(game.id)))favorites.delete(String(game.id));else favorites.add(String(game.id));
      saveFavoriteGameIds(favorites);
      favoriteButton.textContent=favorites.has(String(game.id))?"★":"☆";
      favoriteButton.setAttribute("aria-pressed",String(favorites.has(String(game.id))));
      favoriteButton.setAttribute("aria-label",(favorites.has(String(game.id))?"Remove from":"Add to")+" favorites: "+String(title));
      const search=($("#searchInput")||$("#gameSearch")||$('input[type="search"]'))?.value||"";
      renderGameList(card.closest("#gamesGrid,#gameGrid,#libraryGrid,.games-grid,.game-grid")||card.parentElement,search);
    });
    imageWrapper.appendChild(favoriteButton);

    /* -------------------------------------------------------
       CONTENT
    ------------------------------------------------------- */

    const content = createElement(
      "div",
      "game-card-content"
    );

    /*
     * FIX:
     * This was incorrectly "game-card".
     * It must be "game-card-header".
     */
    const header = createElement(
      "div",
      "game-card-header"
    );

    const headingGroup = createElement(
      "div"
    );

    const titleElement = createElement(
      "h3",
      "game-card-title",
      title
    );

    headingGroup.appendChild(
      titleElement
    );

    if (subtitle) {
      headingGroup.appendChild(
        createElement(
          "p",
          "game-card-subtitle",
          subtitle
        )
      );
    }

    header.appendChild(
      headingGroup
    );

    header.appendChild(
      createElement(
        "span",
        "game-status",
        status
      )
    );

    content.appendChild(
      header
    );

    /* -------------------------------------------------------
       DESCRIPTION
    ------------------------------------------------------- */

    if (game.description) {
      content.appendChild(
        createElement(
          "p",
          "game-card-description",
          game.description
        )
      );
    }

    /* -------------------------------------------------------
       TAGS
    ------------------------------------------------------- */

    const tags = Array.isArray(game.tags)
      ? game.tags
      : [];

    if (tags.length) {
      const tagContainer = createElement(
        "div",
        "game-tags"
      );

      tags.forEach((tag) => {
        if (
          tag === undefined ||
          tag === null
        ) {
          return;
        }

        tagContainer.appendChild(
          createElement(
            "span",
            "game-tag",
            tag
          )
        );
      });

      content.appendChild(
        tagContainer
      );
    }

    /* -------------------------------------------------------
       FOOTER
    ------------------------------------------------------- */

    const footer = createElement(
      "div",
      "game-card-footer"
    );

    footer.appendChild(
      createElement(
        "span",
        "game-platform",
        platform
      )
    );

    const playButton = createElement(
      "button",
      "play-game",
      "Play now"
    );

    playButton.type = "button";

    playButton.dataset.gameId =
      String(game.id);

    playButton.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        launchGame(game.id);
      }
    );

    footer.appendChild(
      playButton
    );

    content.appendChild(
      footer
    );

    /* -------------------------------------------------------
       FINAL CARD
    ------------------------------------------------------- */

    card.appendChild(
      imageWrapper
    );

    card.appendChild(
      content
    );

    /*
     * Double-click launches the game.
     */
    card.addEventListener(
      "dblclick",
      () => {
        launchGame(game.id);
      }
    );

    return card;
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  function createEmptyState(
    title,
    message
  ) {
    const emptyState = createElement(
      "div",
      "empty-state"
    );

    emptyState.appendChild(
      createElement(
        "h3",
        "",
        title
      )
    );

    emptyState.appendChild(
      createElement(
        "p",
        "",
        message
      )
    );

    return emptyState;
  }

  /* =========================================================
     GAME CARD RENDERING
  ========================================================= */

  function renderGames() {
    const containers = [
      $("#gamesGrid"),
      $("#gameGrid"),
      $("#libraryGrid"),
      $(".games-grid"),
      $(".game-grid")
    ].filter(Boolean);

    if (!containers.length) {
      return;
    }

    const uniqueContainers = [
      ...new Set(containers)
    ];

    uniqueContainers.forEach(
      (container) => {
        ensureGameLibraryTools(container);
        renderGameList(container);
      }
    );
  }

  const VF_FAVORITE_GAMES_KEY = "voidforgeFavoriteGamesV1";
  function readFavoriteGameIds() {
    try { const value=JSON.parse(localStorage.getItem(VF_FAVORITE_GAMES_KEY)||"[]");return new Set(Array.isArray(value)?value.map(String):[]); }
    catch { return new Set(); }
  }
  function saveFavoriteGameIds(ids) {
    try { localStorage.setItem(VF_FAVORITE_GAMES_KEY,JSON.stringify([...ids])); } catch {}
  }
  const VF_RECENT_GAMES_KEY = "voidforgeRecentGamesV1";

  function readRecentGameIds() {
    try {
      const value = JSON.parse(localStorage.getItem(VF_RECENT_GAMES_KEY) || "[]");
      return Array.isArray(value) ? value.map(String).slice(0, 30) : [];
    } catch { return []; }
  }

  function ensureGameLibraryTools(container) {
    if (!container || container.dataset.vfToolsReady === "true") return;
    const toolbar = document.createElement("div");
    toolbar.className = "vf-library-tools";
    const count = document.createElement("span");
    count.className = "vf-library-count";
    count.textContent = games.length + " games";
    const categoryLabel = document.createElement("label");
    categoryLabel.className = "vf-library-field";
    categoryLabel.append(document.createTextNode("Category"));
    const category = document.createElement("select");
    category.setAttribute("aria-label", "Filter games by category");
    const all = document.createElement("option"); all.value = ""; all.textContent = "All categories"; category.append(all);
    const tags = [...new Set(games.flatMap(game => Array.isArray(game.tags) ? game.tags : [game.category]).filter(Boolean).map(String))].sort((a,b)=>a.localeCompare(b));
    tags.forEach(tag => { const option=document.createElement("option");option.value=tag;option.textContent=tag;category.append(option); });
    categoryLabel.append(category);
    const sortLabel = document.createElement("label");
    sortLabel.className = "vf-library-field";
    sortLabel.append(document.createTextNode("Sort"));
    const sort = document.createElement("select");
    sort.setAttribute("aria-label", "Sort games");
    [["featured","Featured"],["az","A–Z"],["recent","Recently played"],["newest","Newest first"]].forEach(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;sort.append(option);});
    sortLabel.append(sort);
    const favoriteLabel=document.createElement("label");
    favoriteLabel.className="vf-library-favorites";
    const favoriteOnly=document.createElement("input");
    favoriteOnly.type="checkbox";
    favoriteOnly.checked=container.dataset.vfFavoritesOnly==="true";
    favoriteOnly.setAttribute("aria-label","Show favorites only");
    favoriteOnly.addEventListener("change",()=>{container.dataset.vfFavoritesOnly=String(favoriteOnly.checked);renderGameList(container,(($("#searchInput")||$("#gameSearch")||$('input[type="search"]'))?.value)||"");});
    favoriteLabel.append(favoriteOnly,document.createTextNode("Favorites only"));
    const clear = document.createElement("button");
    clear.type = "button"; clear.className = "vf-library-clear"; clear.textContent = "Reset";
    clear.addEventListener("click",()=>{category.value="";sort.value="featured";const input=$("#searchInput")||$("#gameSearch")||$('input[type="search"]');if(input)input.value="";renderGameList(container,"");});
    category.addEventListener("change",()=>renderGameList(container,($("#searchInput")||$("#gameSearch")||$('input[type="search"]'))?.value||""));
    sort.addEventListener("change",()=>renderGameList(container,($("#searchInput")||$("#gameSearch")||$('input[type="search"]'))?.value||""));
    toolbar.append(count,categoryLabel,sortLabel,favoriteLabel,clear);
    container.parentNode?.insertBefore(toolbar,container);
    container.dataset.vfToolsReady="true";
    container._vfLibraryTools={category,sort,count};
  }

  function renderGameList(
    container,
    searchTerm = ""
  ) {
    if (!container) {
      return;
    }

    const query = String(
      searchTerm || ""
    )
      .trim()
      .toLowerCase();

    const tools = container._vfLibraryTools || {};
    const categoryFilter = tools.category?.value || "";
    const filteredGames = games.filter((game) => {
      const searchable = [game.name,game.title,game.subtitle,game.description,game.category,game.platform,...(Array.isArray(game.tags)?game.tags:[])].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !query || searchable.includes(query);
      const tags = [...(Array.isArray(game.tags)?game.tags:[]),game.category].filter(Boolean).map(String);
      const isFavorite=readFavoriteGameIds().has(String(game.id));
      return matchesQuery && (!categoryFilter || tags.includes(categoryFilter)) && (container.dataset.vfFavoritesOnly!=="true" || isFavorite);
    });
    const sortMode = tools.sort?.value || "featured";
    const recentIds = readRecentGameIds();
    if (sortMode === "az") filteredGames.sort((a,b)=>String(a.name||a.title||a.id).localeCompare(String(b.name||b.title||b.id)));
    else if (sortMode === "newest") filteredGames.reverse();
    else if (sortMode === "recent") filteredGames.sort((a,b)=>{const ai=recentIds.indexOf(String(a.id)),bi=recentIds.indexOf(String(b.id));return (ai<0?999:ai)-(bi<0?999:bi);});
    if (tools.count) tools.count.textContent = filteredGames.length + " / " + games.length + " games";

    container.replaceChildren();

    if (!filteredGames.length) {
      container.appendChild(
        createEmptyState(
          "No games found",
          query
            ? "Try a different search."
            : "No games are currently available."
        )
      );

      return;
    }

    const fragment =
      document.createDocumentFragment();

    filteredGames.forEach(
      (game) => {
        fragment.appendChild(
          createGameCard(game)
        );
      }
    );

    container.appendChild(
      fragment
    );
  }

  /* =========================================================
     LAUNCH GAME
  ========================================================= */

  function launchGame(gameOrId) {
    let game = gameOrId;

    if (
      typeof gameOrId === "string" ||
      typeof gameOrId === "number"
    ) {
      game = games.find(
        (item) =>
          String(item.id) ===
          String(gameOrId)
      );
    }

    if (!game) {
      showToast(
        "Game not found."
      );

      return;
    }

    const url = gameUrl(game);

    if (!url) {
      showToast(
        "This game does not have a valid entry path."
      );

      return;
    }

    currentGame = game;
    const recentIds = readRecentGameIds().filter(id => id !== String(game.id));
    recentIds.unshift(String(game.id));
    try { localStorage.setItem(VF_RECENT_GAMES_KEY, JSON.stringify(recentIds.slice(0,30))); } catch {}
    latestGameFps = null; latestGameSize = ""; gameSessionStartedAt = Date.now(); ensureGameStatsOverlay();
    renderGames();

    setText(
      gameTitle,
      game.name ||
        game.title ||
        game.id ||
        "Game"
    );

    setText(
      gameStatus,
      game.status ||
        "Available"
    );

    if (gameInfo) {
      const infoParts = [];

      if (game.subtitle) {
        infoParts.push(
          String(game.subtitle)
        );
      }

      if (game.version) {
        infoParts.push(
          `v${String(game.version)}`
        );
      }

      if (game.platform) {
        infoParts.push(
          String(game.platform)
        );
      }

      gameInfo.textContent =
        infoParts.join(" • ");
    }

    hideError();
    showLoader(true);

    if (gameView) {
      gameView.hidden = false;

      gameView.classList.add(
        "active"
      );
    }

    document.body.classList.add(
      "game-open"
    );

    if (gameFrame) {
      if (
        gameFrame.getAttribute("src") ===
        url
      ) {
        gameFrame.src =
          "about:blank";

        requestAnimationFrame(() => {
          if (
            currentGame === game &&
            gameFrame
          ) {
            gameFrame.src = url;
          }
        });
      } else {
        gameFrame.src = url;
      }
    }

    window.dispatchEvent(
      new CustomEvent(
        "voidforge:game-launch",
        {
          detail: game
        }
      )
    );
  }

  /* =========================================================
     CLOSE GAME
  ========================================================= */

  function closeGame() {
    currentGame = null;
    latestGameFps = null; latestGameSize = ""; updateGameStatsOverlay();

    if (gameFrame) {
      gameFrame.src =
        "about:blank";
    }

    if (gameView) {
      gameView.classList.remove(
        "active"
      );

      gameView.hidden = true;
    }

    document.body.classList.remove(
      "game-open"
    );

    showLoader(false);
    hideError();

    window.dispatchEvent(
      new CustomEvent(
        "voidforge:game-close"
      )
    );
  }

  /* =========================================================
     RELOAD GAME
  ========================================================= */

  function reloadGame() {
    if (
      !gameFrame ||
      !currentGame
    ) {
      return;
    }

    const url = gameUrl(
      currentGame
    );

    if (!url) {
      showToast(
        "Unable to reload this game."
      );

      return;
    }

    hideError();
    showLoader(true);

    gameFrame.src =
      "about:blank";

    requestAnimationFrame(() => {
      if (currentGame) {
        gameFrame.src = url;
      }
    });
  }

  /* =========================================================
     GAME WINDOW EVENTS
  ========================================================= */

  function setupGameEvents() {
    setupStudioSettingsBridge();
    if (gameFrame) {
      gameFrame.addEventListener(
        "load",
        () => {
          if (currentGame && gameFrame.contentWindow) {
            latestGameFps=null; latestGameSize=""; gameSessionStartedAt=Date.now(); updateGameStatsOverlay();
            try {
              const gameDocument = gameFrame.contentDocument;
              if (gameDocument && !gameDocument.querySelector("[data-voidforge-settings-bridge]")) {
                const bridgeScript = gameDocument.createElement("script");
                // Resolve from the launcher page so GitHub Pages project paths are preserved.
                bridgeScript.src = new URL("assets/game-settings.js", window.location.href).href;
                bridgeScript.dataset.voidforgeSettingsBridge = "true";
                bridgeScript.onload = () => broadcastStudioSettings();
                bridgeScript.onerror = () => console.warn("[VoidForge] Could not load the game settings API:", bridgeScript.src);
                (gameDocument.head || gameDocument.documentElement).appendChild(bridgeScript);
              }
            } catch (error) {
              console.warn("[VoidForge] Game settings bridge could not be injected:", error);
            }
            window.setTimeout(broadcastStudioSettings, 0);
          }
          if (
            gameFrame.src !==
              "about:blank" &&
            currentGame
          ) {
            showLoader(false);
            hideError();
          }
        }
      );

      gameFrame.addEventListener(
        "error",
        () => {
          showLoader(false);

          showError(
            "The game could not be loaded. Please check the game folder and try again."
          );
        }
      );
    }

    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeGame
      );
    }

    if (reloadButton) {
      reloadButton.addEventListener(
        "click",
        reloadGame
      );
    }

    const bookmarkButton = $("#gameBookmark");

    if (bookmarkButton) {
      bookmarkButton.addEventListener("click", () => {
        if (!currentGame) {
          return;
        }

        const url = new URL(window.location.href);
        url.hash = "game=" + encodeURIComponent(String(currentGame.id));
        history.replaceState(null, "", url.href);
        showToast("Bookmark ready — press Ctrl+D (Windows/Linux) or ⌘D (Mac) to save it.");
      });
    }

    if (fullscreenButton) {
      fullscreenButton.addEventListener(
        "click",
        async () => {
          if (!gameFrame) {
            return;
          }

          try {
            if (
              document.fullscreenElement
            ) {
              await document.exitFullscreen();
            } else {
              await gameFrame.requestFullscreen();
            }
          } catch (error) {
            console.error(
              "[VoidForge] Fullscreen error:",
              error
            );

            showToast(
              "Fullscreen is not available."
            );
          }
        }
      );
    }

    if (gameInfo) {
      gameInfo.addEventListener(
        "click",
        () => {
          if (!currentGame) {
            return;
          }

          const description =
            currentGame.description ||
            currentGame.subtitle ||
            "No additional information is available.";

          showToast(
            description,
            5000
          );
        }
      );
    }
  }

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  function setupKeyboardEvents() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          if (
            document.fullscreenElement
          ) {
            document
              .exitFullscreen()
              .catch(() => {});

            return;
          }

          if (
            currentGame &&
            gameView &&
            !gameView.hidden
          ) {
            closeGame();
          }

          return;
        }

        if (
          event.key === "/" &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const activeElement =
            document.activeElement;

          const isTyping =
            activeElement &&
            (
              activeElement.tagName ===
                "INPUT" ||
              activeElement.tagName ===
                "TEXTAREA" ||
              activeElement.isContentEditable
            );

          if (!isTyping) {
            const searchInput =
              $("#searchInput") ||
              $("#gameSearch") ||
              $('input[type="search"]');

            if (searchInput) {
              event.preventDefault();
              searchInput.focus();
            }
          }
        }
      }
    );
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function setupNavigation() {
    const navItems = $$(
      "[data-view], [data-nav]"
    );

    navItems.forEach(
      (item) => {
        item.addEventListener(
          "click",
          () => {
            const view =
              item.dataset.view ||
              item.dataset.nav;

            if (!view) {
              return;
            }

            navItems.forEach(
              (nav) => {
                nav.classList.remove(
                  "active",
                  "is-active"
                );

                nav.setAttribute(
                  "aria-current",
                  "false"
                );
              }
            );

            item.classList.add(
              "active",
              "is-active"
            );

            item.setAttribute(
              "aria-current",
              "page"
            );

            renderView(view);
          }
        );
      }
    );
  }

  function createViewHeading(
    title,
    subtitle
  ) {
    const heading = createElement(
      "div",
      "view-heading"
    );

    const inner =
      createElement("div");

    inner.appendChild(
      createElement(
        "h1",
        "",
        title
      )
    );

    if (subtitle) {
      inner.appendChild(
        createElement(
          "p",
          "",
          subtitle
        )
      );
    }

    heading.appendChild(
      inner
    );

    return heading;
  }

  function createLauncherView(
    className = ""
  ) {
    return createElement(
      "section",
      `launcher-view${
        className
          ? ` ${className}`
          : ""
      }`
    );
  }

  function renderView(view) {
    if (String(view).toLowerCase() !== "chat") stopChatListener();
    const viewRoot =
      $("#viewRoot");

    if (!viewRoot) {
      return;
    }

    switch (
      String(view).toLowerCase()
    ) {
      case "library":
      case "home":
        renderLibraryView(
          viewRoot
        );
        break;

      case "discover":
        renderDiscoverView(
          viewRoot
        );
        break;

      case "school":
        renderSchoolView(viewRoot);
        break;

      case "updates":
        renderUpdatesView(
          viewRoot
        );
        break;

      case "chat":
        renderChatView(viewRoot);
        break;

      case "about":
        renderAboutView(
          viewRoot
        );
        break;

      case "profiles":
        renderProfilesView(viewRoot);
        break;

      case "settings":
        renderSettingsView(
          viewRoot
        );
        break;

      default:
        renderLibraryView(
          viewRoot
        );
        break;
    }
  }

  /* =========================================================
     LIBRARY VIEW
  ========================================================= */

  function renderLibraryView(root) {
    const section =
      createLauncherView(
        "library-view"
      );

    section.appendChild(
      createViewHeading(
        "Library",
        "Your VoidForge games."
      )
    );

    const grid = createElement(
      "div",
      "games-grid"
    );

    grid.id = "gamesGrid";

    section.appendChild(
      grid
    );

    root.replaceChildren(
      section
    );

    renderGameList(grid);
  }

  /* =========================================================
     DISCOVER VIEW
  ========================================================= */

  function renderDiscoverView(root) {
    const section =
      createLauncherView(
        "discover-view"
      );

    section.appendChild(
      createViewHeading(
        "Discover",
        "Explore the games available in VoidForge."
      )
    );

    const grid = createElement(
      "div",
      "games-grid"
    );

    grid.id = "gamesGrid";

    section.appendChild(
      grid
    );

    root.replaceChildren(
      section
    );

    renderGameList(grid);
  }

  /* =========================================================
     UPDATES VIEW
  ========================================================= */

  function renderUpdatesView(root) {
    const section =
      createLauncherView();

    section.appendChild(
      createViewHeading(
        "Updates",
        "Latest VoidForge updates."
      )
    );

    section.appendChild(
      createEmptyState(
        "You're up to date",
        "No new launcher updates are available."
      )
    );

    root.replaceChildren(
      section
    );
  }

  /* =========================================================
     ABOUT VIEW
  ========================================================= */

  function renderAboutView(root) {
    const section =
      createLauncherView();

    section.appendChild(
      createViewHeading(
        "About VoidForge",
        "VoidForge Studios browser game launcher."
      )
    );

    const content =
      createElement(
        "div",
        "about-content"
      );

    content.appendChild(
      createElement(
        "p",
        "",
        "VoidForge is a browser-based game launcher built for VoidForge Studios."
      )
    );

    const registryParagraph =
      createElement("p");

    registryParagraph.appendChild(
      document.createTextNode(
        "Games are loaded dynamically from "
      )
    );

    registryParagraph.appendChild(
      createElement(
        "code",
        "",
        "/games.json"
      )
    );

    registryParagraph.appendChild(
      document.createTextNode(".")
    );

    content.appendChild(
      registryParagraph
    );

    section.appendChild(
      content
    );

    root.replaceChildren(
      section
    );
  }

  /* =========================================================
     SCHOOL TOOLS
  ========================================================= */

  const SCHOOL_NOTES_KEY = "voidforgeSchoolNotesV1";
  const SCHOOL_CARDS_KEY = "voidforgeSchoolCardsV1";

  function renderSchoolView(root) {
    const section=createLauncherView("school-view");
    section.appendChild(createViewHeading("School","A focused space for homework, calculations and revision."));
    const layout=createElement("div","school-tools-grid");

    const calculator=createElement("article","school-tool-card school-calculator");
    calculator.appendChild(createElement("div","school-tool-kicker","QUICK TOOL"));
    calculator.appendChild(createElement("h2","","Calculator"));
    const calcForm=createElement("div","school-calculator-form");
    const first=createElement("input","school-number-input"); first.type="number"; first.inputMode="decimal"; first.placeholder="First number"; first.setAttribute("aria-label","First number");
    const operation=createElement("select","school-operation");
    [["add","+ Add"],["subtract","− Subtract"],["multiply","× Multiply"],["divide","÷ Divide"],["percent","% Percent of"]].forEach(([v,t])=>{const o=createElement("option","",t);o.value=v;operation.appendChild(o);});
    const second=createElement("input","school-number-input"); second.type="number"; second.inputMode="decimal"; second.placeholder="Second number"; second.setAttribute("aria-label","Second number");
    const result=createElement("output","school-calculator-result","Result will appear here"); result.setAttribute("aria-live","polite");
    const calculate=createElement("button","primary-button","Calculate"); calculate.type="button";
    calculate.addEventListener("click",()=>{
      const a=Number(first.value),b=Number(second.value);
      if(first.value.trim()===""||second.value.trim()===""||!Number.isFinite(a)||!Number.isFinite(b)){result.textContent="Enter two valid numbers.";return;}
      let value;
      switch(operation.value){case "add":value=a+b;break;case "subtract":value=a-b;break;case "multiply":value=a*b;break;case "divide":if(b===0){result.textContent="Division by zero is not possible.";return;}value=a/b;break;case "percent":value=a*b/100;break;default:return;}
      result.textContent="= "+Number(value.toPrecision(12)).toLocaleString(undefined,{maximumFractionDigits:10});
    });
    calcForm.append(first,operation,second,calculate,result); calculator.appendChild(calcForm);
    layout.appendChild(calculator);

    const notes=createElement("article","school-tool-card school-notes");
    notes.appendChild(createElement("div","school-tool-kicker","YOUR WORKSPACE"));
    notes.appendChild(createElement("h2","","Study notes"));
    const noteHint=createElement("p","school-tool-description","Write down homework, reminders or lesson notes. They are saved on this device.");
    const noteArea=createElement("textarea","school-notes-input"); noteArea.placeholder="Start writing your notes…"; noteArea.rows=9; noteArea.setAttribute("aria-label","Study notes");
    try{noteArea.value=localStorage.getItem(SCHOOL_NOTES_KEY)||"";}catch{}
    const noteStatus=createElement("p","school-save-status","Saved locally");
    noteArea.addEventListener("input",()=>{try{localStorage.setItem(SCHOOL_NOTES_KEY,noteArea.value);noteStatus.textContent="Saved";}catch{noteStatus.textContent="Could not save on this device";}});
    notes.append(noteHint,noteArea,noteStatus);layout.appendChild(notes);

    const flashcards=createElement("article","school-tool-card school-flashcards");
    flashcards.appendChild(createElement("div","school-tool-kicker","REVISION"));
    flashcards.appendChild(createElement("h2","","Flashcards"));
    flashcards.appendChild(createElement("p","school-tool-description","Create a small deck and test what you remember."));
    const question=createElement("input","school-card-input");question.placeholder="Question or term";question.setAttribute("aria-label","Flashcard question");
    const answer=createElement("textarea","school-card-input");answer.placeholder="Answer or definition";answer.rows=2;answer.setAttribute("aria-label","Flashcard answer");
    const addCard=createElement("button","primary-button","Add flashcard");addCard.type="button";
    const deck=createElement("div","school-card-deck");
    let cards=[];try{const saved=JSON.parse(localStorage.getItem(SCHOOL_CARDS_KEY)||"[]");if(Array.isArray(saved))cards=saved.filter(x=>x&&typeof x.q==="string"&&typeof x.a==="string");}catch{}
    let current=0,showAnswer=false;
    const persist=()=>{try{localStorage.setItem(SCHOOL_CARDS_KEY,JSON.stringify(cards));}catch{}};
    const draw=()=>{
      deck.replaceChildren();
      if(!cards.length){deck.appendChild(createElement("p","school-tool-description","No flashcards yet."));return;}
      current=Math.min(current,cards.length-1);
      const card=createElement("button","school-study-card",showAnswer?cards[current].a:cards[current].q);card.type="button";card.setAttribute("aria-label","Flip flashcard");card.addEventListener("click",()=>{showAnswer=!showAnswer;draw();});
      const controls=createElement("div","school-card-controls");
      const prev=createElement("button","secondary-button","Previous");prev.type="button";prev.disabled=current===0;prev.addEventListener("click",()=>{current--;showAnswer=false;draw();});
      const count=createElement("span","school-card-count",(current+1)+" / "+cards.length);
      const next=createElement("button","secondary-button","Next");next.type="button";next.disabled=current===cards.length-1;next.addEventListener("click",()=>{current++;showAnswer=false;draw();});
      const remove=createElement("button","secondary-button","Delete");remove.type="button";remove.addEventListener("click",()=>{cards.splice(current,1);persist();showAnswer=false;draw();});
      controls.append(prev,count,next,remove);deck.append(card,controls);
    };
    addCard.addEventListener("click",()=>{const q=question.value.trim(),a=answer.value.trim();if(!q||!a){showToast("Enter both a question and an answer.");return;}cards.push({q,a});persist();question.value="";answer.value="";current=cards.length-1;showAnswer=false;draw();});
    flashcards.append(question,answer,addCard,deck);layout.appendChild(flashcards);

    // Homework checklist — saved locally on this device.
    const homework=createElement("article","school-tool-card school-homework");
    homework.appendChild(createElement("div","school-tool-kicker","STAY ON TRACK"));
    homework.appendChild(createElement("h2","","Homework planner"));
    homework.appendChild(createElement("p","school-tool-description","Add assignments and tick them off when they are finished."));
    const taskForm=createElement("form","school-homework-form");
    const taskInput=createElement("input","school-card-input");taskInput.placeholder="e.g. Maths exercises 1–5";taskInput.maxLength=120;taskInput.required=true;taskInput.setAttribute("aria-label","New homework task");
    const taskAdd=createElement("button","primary-button","Add task");taskAdd.type="submit";
    taskForm.append(taskInput,taskAdd);
    const taskList=createElement("div","school-homework-list");
    let tasks=[];try{const saved=JSON.parse(localStorage.getItem("voidforgeSchoolTasksV1")||"[]");if(Array.isArray(saved))tasks=saved.filter(t=>t&&typeof t.id==="string"&&typeof t.text==="string");}catch{}
    const saveTasks=()=>{try{localStorage.setItem("voidforgeSchoolTasksV1",JSON.stringify(tasks));}catch{showToast("Homework list could not be saved.");}};
    const drawTasks=()=>{
      taskList.replaceChildren();
      if(!tasks.length){taskList.appendChild(createElement("p","school-tool-description","Your homework list is empty."));return;}
      tasks.forEach(task=>{
        const row=createElement("div","school-homework-item"+(task.done?" is-done":""));
        const check=createElement("input");check.type="checkbox";check.checked=!!task.done;check.setAttribute("aria-label","Mark "+task.text+" as complete");
        check.addEventListener("change",()=>{task.done=check.checked;saveTasks();drawTasks();});
        const label=createElement("span","",task.text);
        const remove=createElement("button","secondary-button","Remove");remove.type="button";remove.setAttribute("aria-label","Remove "+task.text);
        remove.addEventListener("click",()=>{tasks=tasks.filter(item=>item.id!==task.id);saveTasks();drawTasks();});
        row.append(check,label,remove);taskList.appendChild(row);
      });
      const summary=createElement("p","school-save-status",tasks.filter(t=>t.done).length+" of "+tasks.length+" completed");
      taskList.appendChild(summary);
    };
    taskForm.addEventListener("submit",event=>{event.preventDefault();const value=taskInput.value.trim();if(!value)return;tasks.push({id:"task-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:value,done:false});saveTasks();taskInput.value="";drawTasks();taskInput.focus();});
    homework.append(taskForm,taskList);drawTasks();layout.appendChild(homework);

    // Grade average calculator.
    const grades=createElement("article","school-tool-card school-grades");
    grades.appendChild(createElement("div","school-tool-kicker","CHECK YOUR PROGRESS"));
    grades.appendChild(createElement("h2","","Grade calculator"));
    grades.appendChild(createElement("p","school-tool-description","Enter grades separated by commas. This calculates a simple average."));
    const gradeInput=createElement("input","school-card-input");gradeInput.placeholder="e.g. 2, 1, 3, 2";gradeInput.inputMode="decimal";gradeInput.setAttribute("aria-label","Grades separated by commas");
    const gradeButton=createElement("button","primary-button","Calculate average");gradeButton.type="button";
    const gradeResult=createElement("output","school-calculator-result","Your average will appear here.");gradeResult.setAttribute("aria-live","polite");
    gradeButton.addEventListener("click",()=>{
      const raw=gradeInput.value.split(",").map(v=>v.trim());
      if(!gradeInput.value.trim()||raw.some(v=>v===""||!Number.isFinite(Number(v))||Number(v)<=0)){gradeResult.textContent="Enter valid positive grades separated by commas.";return;}
      const values=raw.map(Number);const average=values.reduce((sum,n)=>sum+n,0)/values.length;
      gradeResult.textContent="Average: "+Number(average.toFixed(2)).toLocaleString()+" ("+values.length+" grades)";
    });
    grades.append(gradeInput,gradeButton,gradeResult);layout.appendChild(grades);

    // Common unit converter.
    const converter=createElement("article","school-tool-card school-converter");
    converter.appendChild(createElement("div","school-tool-kicker","QUICK CONVERSION"));
    converter.appendChild(createElement("h2","","Unit converter"));
    const conversionInput=createElement("input","school-number-input");conversionInput.type="number";conversionInput.inputMode="decimal";conversionInput.placeholder="Value";conversionInput.setAttribute("aria-label","Value to convert");
    const conversionType=createElement("select","school-operation");
    [["km-mi","Kilometres → Miles"],["mi-km","Miles → Kilometres"],["cm-m","Centimetres → Metres"],["m-cm","Metres → Centimetres"],["kg-g","Kilograms → Grams"],["g-kg","Grams → Kilograms"],["c-f","Celsius → Fahrenheit"],["f-c","Fahrenheit → Celsius"],["l-ml","Litres → Millilitres"],["ml-l","Millilitres → Litres"]].forEach(([v,t])=>{const option=createElement("option","",t);option.value=v;conversionType.appendChild(option);});
    const convertButton=createElement("button","primary-button","Convert");convertButton.type="button";
    const conversionResult=createElement("output","school-calculator-result","Converted value will appear here.");conversionResult.setAttribute("aria-live","polite");
    convertButton.addEventListener("click",()=>{
      if(conversionInput.value.trim()===""||!Number.isFinite(Number(conversionInput.value))){conversionResult.textContent="Enter a valid number.";return;}
      const n=Number(conversionInput.value);const factors={"km-mi":n*.621371,"mi-km":n/ .621371,"cm-m":n/100,"m-cm":n*100,"kg-g":n*1000,"g-kg":n/1000,"c-f":n*9/5+32,"f-c":(n-32)*5/9,"l-ml":n*1000,"ml-l":n/1000};
      conversionResult.textContent="= "+Number(factors[conversionType.value].toFixed(6)).toLocaleString();
    });
    converter.append(conversionInput,conversionType,convertButton,conversionResult);layout.appendChild(converter);


    // Weekly timetable.
    const timetable=createElement("article","school-tool-card school-timetable");
    timetable.append(createElement("div","school-tool-kicker","PLAN YOUR WEEK"),createElement("h2","","Timetable"),createElement("p","school-tool-description","Save your lessons with a weekday and start time."));
    const timetableForm=createElement("form","school-planner-form");
    const subjectInput=createElement("input","school-card-input");subjectInput.placeholder="Subject / lesson";subjectInput.maxLength=60;subjectInput.required=true;subjectInput.setAttribute("aria-label","Subject");
    const daySelect=createElement("select","school-operation");daySelect.setAttribute("aria-label","Weekday");
    [["1","Monday"],["2","Tuesday"],["3","Wednesday"],["4","Thursday"],["5","Friday"],["6","Saturday"],["0","Sunday"]].forEach(([v,t])=>{const o=createElement("option","",t);o.value=v;daySelect.appendChild(o);});
    const timeInput=createElement("input","school-card-input");timeInput.type="time";timeInput.required=true;timeInput.setAttribute("aria-label","Lesson start time");
    const lessonAdd=createElement("button","primary-button","Add lesson");lessonAdd.type="submit";
    timetableForm.append(subjectInput,daySelect,timeInput,lessonAdd);
    const lessonList=createElement("div","school-saved-list");
    let lessons=[];try{const saved=JSON.parse(localStorage.getItem("voidforgeSchoolTimetableV1")||"[]");if(Array.isArray(saved))lessons=saved.filter(x=>x&&typeof x.id==="string"&&typeof x.subject==="string"&&typeof x.day==="string"&&typeof x.time==="string");}catch{}
    const saveLessons=()=>{try{localStorage.setItem("voidforgeSchoolTimetableV1",JSON.stringify(lessons));}catch{showToast("Timetable could not be saved.");}};
    const drawLessons=()=>{
      lessonList.replaceChildren();
      if(!lessons.length){lessonList.appendChild(createElement("p","school-tool-description","No lessons added yet."));return;}
      const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      [...lessons].sort((a,b)=>Number(a.day)-Number(b.day)||a.time.localeCompare(b.time)).forEach(lesson=>{
        const row=createElement("div","school-saved-row");
        const info=createElement("div","school-saved-copy");
        info.append(createElement("strong","",lesson.subject),createElement("small","",dayNames[Number(lesson.day)]+" · "+lesson.time));
        const remove=createElement("button","secondary-button","×");remove.type="button";remove.setAttribute("aria-label","Remove "+lesson.subject);
        remove.addEventListener("click",()=>{lessons=lessons.filter(x=>x.id!==lesson.id);saveLessons();drawLessons();});
        row.append(info,remove);lessonList.appendChild(row);
      });
    };
    timetableForm.addEventListener("submit",event=>{event.preventDefault();const subject=subjectInput.value.trim();if(!subject||!timeInput.value)return;lessons.push({id:"lesson-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),subject,day:daySelect.value,time:timeInput.value});saveLessons();subjectInput.value="";drawLessons();});
    timetable.append(timetableForm,lessonList);drawLessons();layout.appendChild(timetable);

    // Exam and deadline tracker.
    const exams=createElement("article","school-tool-card school-exams");
    exams.append(createElement("div","school-tool-kicker","IMPORTANT DATES"),createElement("h2","","Exam planner"),createElement("p","school-tool-description","Keep upcoming tests and deadlines in one place."));
    const examForm=createElement("form","school-planner-form");
    const examName=createElement("input","school-card-input");examName.placeholder="Exam / deadline";examName.maxLength=70;examName.required=true;examName.setAttribute("aria-label","Exam or deadline name");
    const examDate=createElement("input","school-card-input");examDate.type="date";examDate.required=true;examDate.min=new Date().toISOString().slice(0,10);examDate.setAttribute("aria-label","Exam date");
    const examAdd=createElement("button","primary-button","Add date");examAdd.type="submit";
    examForm.append(examName,examDate,examAdd);
    const examList=createElement("div","school-saved-list");
    let examItems=[];try{const saved=JSON.parse(localStorage.getItem("voidforgeSchoolExamsV1")||"[]");if(Array.isArray(saved))examItems=saved.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&typeof x.date==="string");}catch{}
    const saveExams=()=>{try{localStorage.setItem("voidforgeSchoolExamsV1",JSON.stringify(examItems));}catch{showToast("Exam planner could not be saved.");}};
    const drawExams=()=>{
      examList.replaceChildren();
      if(!examItems.length){examList.appendChild(createElement("p","school-tool-description","No exams or deadlines added."));return;}
      const today=new Date();today.setHours(0,0,0,0);
      [...examItems].sort((a,b)=>a.date.localeCompare(b.date)).forEach(item=>{
        const target=new Date(item.date+"T00:00:00");const days=Math.round((target-today)/86400000);
        const row=createElement("div","school-saved-row");
        const info=createElement("div","school-saved-copy");
        info.append(createElement("strong","",item.name),createElement("small","",target.toLocaleDateString()+" · "+(days<0?"Past date":days===0?"Today":days+" days left")));
        const remove=createElement("button","secondary-button","×");remove.type="button";remove.setAttribute("aria-label","Remove "+item.name);
        remove.addEventListener("click",()=>{examItems=examItems.filter(x=>x.id!==item.id);saveExams();drawExams();});
        row.append(info,remove);examList.appendChild(row);
      });
    };
    examForm.addEventListener("submit",event=>{event.preventDefault();if(!examName.value.trim()||!examDate.value)return;examItems.push({id:"exam-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:examName.value.trim(),date:examDate.value});saveExams();examName.value="";drawExams();});
    exams.append(examForm,examList);drawExams();layout.appendChild(exams);

    // Focus timer (25-minute focus session).
    const focus=createElement("article","school-tool-card school-focus");
    focus.append(createElement("div","school-tool-kicker","FOCUS MODE"),createElement("h2","","Study timer"),createElement("p","school-tool-description","A simple 25-minute focus session. Keep this tab open while it runs."));
    const timerDisplay=createElement("div","school-timer-display","25:00");timerDisplay.setAttribute("role","timer");timerDisplay.setAttribute("aria-live","off");
    const timerActions=createElement("div","school-timer-actions");
    const timerStart=createElement("button","primary-button","Start");timerStart.type="button";
    const timerReset=createElement("button","secondary-button","Reset");timerReset.type="button";
    const timerStatus=createElement("p","school-save-status","Ready when you are.");
    let remaining=25*60*1000,deadline=0,running=false;
    if(window.__vfSchoolTimerInterval){clearInterval(window.__vfSchoolTimerInterval);window.__vfSchoolTimerInterval=null;}
    const paintTimer=()=>{
      const seconds=Math.max(0,Math.ceil(remaining/1000));
      timerDisplay.textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
      timerStart.textContent=running?"Pause":(remaining===0?"Start again":"Start");
    };
    const stopTimer=()=>{if(window.__vfSchoolTimerInterval){clearInterval(window.__vfSchoolTimerInterval);window.__vfSchoolTimerInterval=null;}running=false;};
    timerStart.addEventListener("click",()=>{
      if(running){remaining=Math.max(0,deadline-Date.now());stopTimer();timerStatus.textContent="Paused.";paintTimer();return;}
      if(remaining<=0)remaining=25*60*1000;
      running=true;deadline=Date.now()+remaining;timerStatus.textContent="Focus session in progress.";
      window.__vfSchoolTimerInterval=setInterval(()=>{
        remaining=Math.max(0,deadline-Date.now());paintTimer();
        if(remaining<=0){stopTimer();timerStatus.textContent="Session complete — nice work!";showToast("Your 25-minute study session is complete.");paintTimer();}
      },250);
      paintTimer();
    });
    timerReset.addEventListener("click",()=>{stopTimer();remaining=25*60*1000;timerStatus.textContent="Timer reset.";paintTimer();});
    timerActions.append(timerStart,timerReset);focus.append(timerDisplay,timerActions,timerStatus);layout.appendChild(focus);


    // Attendance tracker.
    const attendance=createElement("article","school-tool-card school-attendance");
    attendance.append(createElement("div","school-tool-kicker","CLASS RECORD"),createElement("h2","","Attendance tracker"),createElement("p","school-tool-description","Record attended and missed lessons for each subject."));
    const attendanceForm=createElement("form","school-planner-form");
    const attendanceSubject=createElement("input","school-card-input");attendanceSubject.placeholder="Subject";attendanceSubject.required=true;attendanceSubject.maxLength=50;attendanceSubject.setAttribute("aria-label","Attendance subject");
    const attendanceState=createElement("select","school-operation");[["present","Present"],["absent","Absent"],["late","Late"]].forEach(([v,t])=>{const o=createElement("option","",t);o.value=v;attendanceState.appendChild(o);});
    const attendanceAdd=createElement("button","primary-button","Record");attendanceAdd.type="submit";attendanceForm.append(attendanceSubject,attendanceState,attendanceAdd);
    const attendanceList=createElement("div","school-saved-list");
    let attendanceRows=[];try{const v=JSON.parse(localStorage.getItem("voidforgeSchoolAttendanceV1")||"[]");if(Array.isArray(v))attendanceRows=v.filter(x=>x&&typeof x.id==="string"&&typeof x.subject==="string"&&["present","absent","late"].includes(x.state));}catch{}
    const saveAttendance=()=>{try{localStorage.setItem("voidforgeSchoolAttendanceV1",JSON.stringify(attendanceRows));}catch{showToast("Attendance could not be saved.");}};
    const drawAttendance=()=>{attendanceList.replaceChildren();if(!attendanceRows.length){attendanceList.appendChild(createElement("p","school-tool-description","No attendance records yet."));return;}const counts=attendanceRows.reduce((a,x)=>(a[x.state]++,a),{present:0,absent:0,late:0});attendanceList.appendChild(createElement("p","school-save-status",counts.present+" present · "+counts.absent+" absent · "+counts.late+" late"));attendanceRows.slice().reverse().forEach(item=>{const row=createElement("div","school-saved-row");const info=createElement("div","school-saved-copy");info.append(createElement("strong","",item.subject),createElement("small","",item.state.charAt(0).toUpperCase()+item.state.slice(1)+" · "+new Date(item.date).toLocaleDateString()));const del=createElement("button","secondary-button","×");del.type="button";del.setAttribute("aria-label","Delete attendance record");del.addEventListener("click",()=>{attendanceRows=attendanceRows.filter(x=>x.id!==item.id);saveAttendance();drawAttendance();});row.append(info,del);attendanceList.appendChild(row);});};
    attendanceForm.addEventListener("submit",e=>{e.preventDefault();const subject=attendanceSubject.value.trim();if(!subject)return;attendanceRows.push({id:"att-"+Date.now()+Math.random().toString(36).slice(2,5),subject,state:attendanceState.value,date:new Date().toISOString()});saveAttendance();attendanceSubject.value="";drawAttendance();});attendance.append(attendanceForm,attendanceList);drawAttendance();layout.appendChild(attendance);

    // Weighted grade calculator.
    const weighted=createElement("article","school-tool-card school-weighted-grades");
    weighted.append(createElement("div","school-tool-kicker","WEIGHTED RESULTS"),createElement("h2","","Weighted grade calculator"),createElement("p","school-tool-description","Enter grades and their weights as grade:weight, separated by commas (for example 2:50, 1:50)."));
    const weightedInput=createElement("input","school-card-input");weightedInput.placeholder="2:50, 1:50";weightedInput.setAttribute("aria-label","Grades and weights");
    const weightedButton=createElement("button","primary-button","Calculate weighted average");weightedButton.type="button";
    const weightedResult=createElement("output","school-calculator-result","Your weighted average will appear here.");weightedResult.setAttribute("aria-live","polite");
    weightedButton.addEventListener("click",()=>{const parts=weightedInput.value.split(",").map(x=>x.trim());if(!weightedInput.value.trim()){weightedResult.textContent="Enter at least one grade and weight.";return;}let sum=0,weights=0;for(const part of parts){const m=part.match(/^(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)$/);if(!m){weightedResult.textContent="Use grade:weight pairs, e.g. 2:50, 1:50.";return;}const grade=Number(m[1].replace(",",".")),weight=Number(m[2].replace(",","."));if(!Number.isFinite(grade)||!Number.isFinite(weight)||grade<=0||weight<=0){weightedResult.textContent="Grades and weights must be positive numbers.";return;}sum+=grade*weight;weights+=weight;}weightedResult.textContent="Weighted average: "+(sum/weights).toFixed(2)+" · Total weight: "+weights;});
    weighted.append(weightedInput,weightedButton,weightedResult);layout.appendChild(weighted);

    // Weekly study goal.
    const goals=createElement("article","school-tool-card school-study-goals");
    goals.append(createElement("div","school-tool-kicker","BUILD A ROUTINE"),createElement("h2","","Weekly study goal"),createElement("p","school-tool-description","Set a weekly target and log your focused study minutes."));
    const goalInput=createElement("input","school-card-input");goalInput.type="number";goalInput.min="1";goalInput.max="100";goalInput.placeholder="Weekly target in hours";goalInput.setAttribute("aria-label","Weekly study target in hours");
    const goalSave=createElement("button","secondary-button","Save target");goalSave.type="button";
    const minutesInput=createElement("input","school-card-input");minutesInput.type="number";minutesInput.min="1";minutesInput.max="1440";minutesInput.placeholder="Minutes studied";minutesInput.setAttribute("aria-label","Minutes studied");
    const logMinutes=createElement("button","primary-button","Log study time");logMinutes.type="button";
    const goalProgress=createElement("div","school-saved-list");let goalData={target:5,minutes:0,week:""};
    try{const saved=JSON.parse(localStorage.getItem("voidforgeSchoolGoalV1")||"null");if(saved&&typeof saved==="object")goalData={...goalData,...saved};}catch{}
    const weekKey=(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.toISOString().slice(0,10);})();
    if(goalData.week!==weekKey)goalData={target:goalData.target||5,minutes:0,week:weekKey};
    goalInput.value=goalData.target;
    const saveGoal=()=>{try{localStorage.setItem("voidforgeSchoolGoalV1",JSON.stringify(goalData));}catch{showToast("Study goal could not be saved.");}};
    const drawGoal=()=>{goalProgress.replaceChildren();const targetMinutes=Math.max(1,Number(goalData.target)||5)*60;const pct=Math.min(100,Math.round(goalData.minutes/targetMinutes*100));goalProgress.append(createElement("p","school-save-status",Math.floor(goalData.minutes/60)+"h "+(goalData.minutes%60)+"m / "+goalData.target+"h · "+pct+"%"));const track=createElement("div","school-goal-track");const fill=createElement("div","school-goal-fill");fill.style.width=pct+"%";track.appendChild(fill);goalProgress.appendChild(track);};
    goalSave.addEventListener("click",()=>{const n=Number(goalInput.value);if(!Number.isFinite(n)||n<1||n>100){showToast("Choose a weekly goal from 1 to 100 hours.");return;}goalData.target=n;saveGoal();drawGoal();});
    logMinutes.addEventListener("click",()=>{const n=Number(minutesInput.value);if(!Number.isInteger(n)||n<1||n>1440){showToast("Enter study time from 1 to 1440 minutes.");return;}goalData.minutes+=n;minutesInput.value="";saveGoal();drawGoal();});goals.append(goalInput,goalSave,minutesInput,logMinutes,goalProgress);drawGoal();layout.appendChild(goals);

    // Random revision topic picker.
    const picker=createElement("article","school-tool-card school-topic-picker");
    picker.append(createElement("div","school-tool-kicker","BEAT PROCRASTINATION"),createElement("h2","","Random study picker"),createElement("p","school-tool-description","Add topics and let the picker choose what to revise next."));
    const topicInput=createElement("input","school-card-input");topicInput.placeholder="Add a subject or topic";topicInput.maxLength=70;topicInput.setAttribute("aria-label","Study topic");
    const topicAdd=createElement("button","primary-button","Add topic");topicAdd.type="button";
    const pickButton=createElement("button","secondary-button","Pick for me");pickButton.type="button";
    const picked=createElement("output","school-calculator-result","Your next topic will appear here.");picked.setAttribute("aria-live","polite");
    const topicList=createElement("div","school-saved-list");let topics=[];try{const saved=JSON.parse(localStorage.getItem("voidforgeSchoolTopicsV1")||"[]");if(Array.isArray(saved))topics=saved.filter(x=>typeof x==="string");}catch{}
    const saveTopics=()=>{try{localStorage.setItem("voidforgeSchoolTopicsV1",JSON.stringify(topics));}catch{showToast("Topics could not be saved.");}};
    const drawTopics=()=>{topicList.replaceChildren();topics.forEach((topic,index)=>{const row=createElement("div","school-saved-row");row.appendChild(createElement("span","",topic));const del=createElement("button","secondary-button","×");del.type="button";del.setAttribute("aria-label","Remove "+topic);del.addEventListener("click",()=>{topics.splice(index,1);saveTopics();drawTopics();});row.appendChild(del);topicList.appendChild(row);});};
    topicAdd.addEventListener("click",()=>{const v=topicInput.value.trim();if(!v)return;if(topics.length>=100){showToast("You can save up to 100 topics.");return;}topics.push(v);topicInput.value="";saveTopics();drawTopics();});
    pickButton.addEventListener("click",()=>{if(!topics.length){picked.textContent="Add some topics first.";return;}picked.textContent="Next up: "+topics[Math.floor(Math.random()*topics.length)];});
    picker.append(topicInput,topicAdd,pickButton,picked,topicList);drawTopics();layout.appendChild(picker);

    section.appendChild(layout);root.replaceChildren(section);
  }

  /* =========================================================
     SETTINGS VIEW
  ========================================================= */

  const STUDIO_SETTINGS_KEY = "voidforgeStudioSettingsV1";
  const STUDIO_SETTINGS_DEFAULTS = {
    masterVolume:80,musicVolume:70,sfxVolume:85,muted:false,graphics:"high",
    showFps:false,showPerformance:false,reduceMotion:false,screenShake:true,particles:true,
    language:"system",textScale:100,difficulty:"normal",autosave:true,notifications:true,
    confirmExit:true,controllerVibration:true,subtitles:true,colorMode:"system",
    showGameTimer:false,showGameResolution:false,highContrast:false,largeCursor:false,
    pauseOnBlur:false,autoReload:false,
    developerMode:false,showDebugInfo:false,showConsoleErrors:false,showNetworkStatus:false,
    fov:90,sensitivity:1,invertY:false,renderScale:100,
    shadows:"high",antiAliasing:true,targetFps:"60",showSafeArea:false,
    audioBalance:0,audioDucking:true,spatialAudio:false,muteWhenUnfocused:false,masterLimiter:true,
    displayBrightness:100,displayContrast:100,displaySaturation:100,uiDensity:"comfortable",hudOpacity:100,fullscreenOnLaunch:false,screenOrientation:"auto",
    showHints:true,showLoadingTips:true,autoRestart:false,pauseWhenHidden:true,confirmRestart:true,quickStart:false,dynamicDifficulty:false,
    colorBlindMode:"off",dyslexiaFriendlyFont:false,textSpacing:100,subtitleSize:100,reduceFlashes:true,monoAudio:false,holdToConfirm:false,
    touchControls:true,leftHandedControls:false,touchButtonSize:100,controllerDeadzone:12,aimAssist:false,tapToInteract:true,
    showScore:true,showBestScore:true,showControlHints:true,compactHud:false,hideCursor:false,crosshairStyle:"default",
    rememberLastGame:true,saveGameProgress:true,localTelemetry:false,clearDataOnExit:false,reduceDataUsage:false,cacheAssets:true,
    apiDiagnostics:false,verboseLogs:false,showHitboxes:false,showFrameGraph:false,disableGameCache:false,
    liquidGlass:false
  };
  const STUDIO_SETTING_HELP = {
    masterVolume:"Sets the overall volume for game audio.",musicVolume:"Controls background music separately from effects.",sfxVolume:"Controls clicks, impacts and other game sound effects.",muted:"Turns off all game audio.",audioBalance:"Moves sound toward the left or right speaker when supported.",audioDucking:"Temporarily lowers music when an important sound plays.",spatialAudio:"Lets compatible games position sounds around you.",muteWhenUnfocused:"Mutes game audio while you are using another tab or app.",masterLimiter:"Helps prevent sudden loud volume spikes.",
    graphics:"Balances visual detail and game performance.",renderScale:"Uses a lower or higher internal 3D resolution to balance clarity and speed.",shadows:"Controls the detail of shadows in compatible 3D games.",antiAliasing:"Smooths jagged edges in games that support it.",targetFps:"Sets the preferred maximum frame rate when a game can follow it.",displayBrightness:"Brightens or darkens the game view.",displayContrast:"Makes light and dark areas more distinct.",displaySaturation:"Controls how vivid game colors appear.",uiDensity:"Choose tighter or more open spacing in game menus.",hudOpacity:"Changes how transparent supported game overlays look.",fullscreenOnLaunch:"Requests fullscreen when a game and browser allow it.",screenOrientation:"Tells compatible games which screen layout you prefer.",showFps:"Displays the frames-per-second counter when a game reports it.",showPerformance:"Shows available performance details.",textScale:"Changes the size of game interface text.",colorMode:"Selects the preferred light or dark game theme.",
    difficulty:"Sets the starting difficulty for games that read this preference.",autosave:"Allows compatible games to save progress automatically.",showHints:"Displays tips in games that provide hints.",showLoadingTips:"Shows helpful messages while supported games are starting.",autoRestart:"Restarts a round automatically when supported.",confirmExit:"Helps prevent accidental exits.",confirmRestart:"Asks before starting a round over.",quickStart:"Skips extra start screens in compatible games.",dynamicDifficulty:"Allows supported games to adjust challenge based on play.",controllerVibration:"Allows supported controllers to vibrate.",subtitles:"Displays spoken dialogue as text when available.",pauseWhenHidden:"Requests a pause when the game is not visible.",
    reduceMotion:"Reduces animations and transitions.",screenShake:"Turns supported camera-shake effects on or off.",particles:"Controls decorative particle effects in compatible games.",language:"Sets the preferred language when a game offers it.",notifications:"Allows games to send browser notifications.",highContrast:"Improves separation between text and backgrounds.",largeCursor:"Makes the pointer easier to see.",colorBlindMode:"Provides a color-vision mode to games that support it.",dyslexiaFriendlyFont:"Requests a clearer reading font where available.",textSpacing:"Adjusts letter and word spacing in compatible interfaces.",subtitleSize:"Changes subtitle text size when supported.",reduceFlashes:"Reduces flashing effects in compatible games.",monoAudio:"Requests mono sound output where supported.",holdToConfirm:"Helps avoid accidental activation of important actions.",
    fov:"Controls how wide the camera view appears in compatible 3D games.",sensitivity:"Changes how quickly the camera responds to mouse or touch movement.",invertY:"Reverses up-and-down camera movement.",touchControls:"Shows touch buttons on supported mobile games.",leftHandedControls:"Moves supported touch controls to the opposite side.",touchButtonSize:"Makes on-screen controls larger or smaller.",controllerDeadzone:"Sets how far a stick must move before input is detected.",aimAssist:"Requests aiming help in games that implement it.",tapToInteract:"Lets you tap objects or buttons to interact on touchscreens.",
    showGameTimer:"Shows how long the current game session has lasted.",showGameResolution:"Shows the game's reported screen size.",showScore:"Shows the current score when the game provides one.",showBestScore:"Shows your best saved score when available.",showControlHints:"Displays available keyboard or touch controls.",compactHud:"Uses a tighter layout for supported game overlays.",hideCursor:"Hides the pointer while a game is active where possible.",crosshairStyle:"Chooses the reticle style in games that expose one.",showSafeArea:"Draws a guide around screen edges for mobile layouts.",pauseOnBlur:"Requests a pause when the game window loses focus.",autoReload:"Allows a game to request a reload from the launcher.",
    rememberLastGame:"Remembers which game you opened most recently on this device.",saveGameProgress:"Allows game progress to be stored in this browser.",localTelemetry:"Enables optional local diagnostics; it does not upload data to a server.",clearDataOnExit:"Clears temporary game data when you leave a game.",reduceDataUsage:"Asks compatible games to prefer smaller downloads.",cacheAssets:"Allows game files to be cached for faster loading.",disableGameCache:"Forces fresh game files to be requested on the next load.",
    developerMode:"Enables extra development features.",showDebugInfo:"Shows additional game and launcher details.",showConsoleErrors:"Forwards JavaScript errors from the active game.",showNetworkStatus:"Displays whether the browser is online.",apiDiagnostics:"Shows whether the active game connected to the VoidForge settings API.",verboseLogs:"Enables more detailed debugging messages.",showHitboxes:"Shows collision areas in games that expose them.",showFrameGraph:"Shows frame timing information when a game reports it.",liquidGlass:"Applies an experimental translucent glass appearance to the launcher. You can turn it off at any time."
  };
  let studioSettings = readStudioSettings();
  const GAME_PROFILE_KEY = "voidforgeGameProfilesV1";
  const GAME_PROFILE_DEFINITIONS = {
    minecraft:{title:"Minecraft",fields:[
      ["fov","Field of view","range",55,100,75,"°"],["sensitivity","Look sensitivity","range",1,10,4,"×"],
      ["renderDistance","Render distance","select",[["35","Low"],["55","Medium"],["75","High"]],"55"],
      ["graphicsQuality","Graphics quality","select",[["low","Low"],["medium","Medium"],["high","High"]],"medium"],
      ["brightness","Brightness","range",70,130,100,"%"],["uiScale","Mobile controls size","range",80,130,100,"%"],
      ["invertY","Invert look","toggle",false],["autoSave","Auto save","toggle",true],["showHelp","In-game help","toggle",true]
    ]},
    snake:{title:"Multiplayer Snake",fields:[["cameraZoom","Camera zoom","range",1,4,2.15,"×",0.05],["interpolationMs","Movement smoothing","range",50,200,90," ms",5]]},
    jarvis:{title:"J.A.R.V.I.S",fields:[["chatScale","Chat text size","range",80,130,100,"%"],["compactMessages","Compact messages","toggle",false]]},
    pong:{title:"Pong",fields:[["ballSpeed","Ball speed","range",2,10,5,"×",0.5],["paddleSpeed","Paddle speed","range",2,12,6,"×",0.5]]},
    breakout:{title:"Breakout",fields:[["ballSpeed","Ball speed","range",2,8,4,"×",0.5],["paddleSpeed","Paddle speed","range",10,60,30," px",2]]},
    flappy:{title:"Flappy",fields:[["gravity","Gravity","range",0.15,0.6,0.35,"",0.01],["flapStrength","Flap strength","range",5,12,8,"",0.1],["pipeSpeed","Pipe speed","range",1,6,3,"×",0.25]]},
    minesweeper:{title:"Minesweeper",fields:[["gridSize","Grid size","select",[["8","8 × 8"],["10","10 × 10"],["12","12 × 12"]],"10"],["mineCount","Number of mines","range",8,35,15,"",1]]},
    "2048":{title:"2048",fields:[["spawnChance","Tile spawn chance","range",50,100,90,"%"],["startingTiles","Starting tiles","select",[["1","1 tile"],["2","2 tiles"],["3","3 tiles"]],"2"]]},
    tetris:{title:"Tetris",fields:[["dropInterval","Drop speed","range",150,900,450," ms",25],["ghostPiece","Ghost piece preview","toggle",false]]},
    tictactoe:{title:"Tic-Tac-Toe",fields:[["firstTurn","Starting player","select",[["X","Player X"],["O","Player O"]],"X"]]},
    memory:{title:"Memory",fields:[["flipDelay","Card reveal delay","range",200,1000,500," ms",50],["symbolTheme","Card symbols","select",[["classic","Classic"],["space","Space"],["nature","Nature"]],"classic"]]},
    asteroids:{title:"Asteroids",fields:[["thrust","Ship acceleration","range",0.06,0.2,0.12,"",0.01],["rotationSpeed","Rotation speed","range",0.04,0.12,0.07,"",0.01],["fireCooldown","Weapon cooldown","range",100,350,180," ms",10]]},
    invaders:{title:"Invaders",fields:[["playerSpeed","Player speed","range",2,8,5,"×",0.5],["enemySpeed","Enemy speed","range",0.2,1.2,0.5,"×",0.05],["fireCooldown","Weapon cooldown","range",100,350,180," ms",10]]},
    imposter:{title:"Imposter",fields:[["category","Word category","select",[["all","Random mix"],["food","Food"],["animals","Animals"],["places","Places"],["objects","Objects"],["people","People"],["nature","Nature"],["entertainment","Entertainment"],["sports","Sports"],["technology","Technology"],["school","School"],["vehicles","Vehicles"],["household","Household"]],"all"],["rounds","Clue rounds","select",[["1","1 round"],["2","2 rounds"],["3","3 rounds"]],"2"],["soundEnabled","Sound effects","toggle",true]]}
  };
  function readGameProfiles() {
    try { const saved=JSON.parse(localStorage.getItem(GAME_PROFILE_KEY)||"{}"); const result={};
      Object.entries(GAME_PROFILE_DEFINITIONS).forEach(([id,def])=>{result[id]={};def.fields.forEach(field=>{const key=field[0],type=field[2],fallback=type==="range"?field[5]:type==="select"?field[4]:field[3];const value=saved?.[id]?.[key];result[id][key]=value===undefined?fallback:value;});});return result;
    } catch { const result={};Object.entries(GAME_PROFILE_DEFINITIONS).forEach(([id,def])=>{result[id]=Object.fromEntries(def.fields.map(f=>[f[0],f[2]==="range"?f[5]:f[2]==="select"?f[4]:f[3]]));});return result; }
  }
  let studioGameProfiles=readGameProfiles();
  function persistGameProfiles(){try{localStorage.setItem(GAME_PROFILE_KEY,JSON.stringify(studioGameProfiles));}catch(error){console.warn("[VoidForge] Game profiles could not be saved:",error);}}
  function updateGameProfile(gameId,key,value){
    const def=GAME_PROFILE_DEFINITIONS[gameId],field=def?.fields.find(f=>f[0]===key);if(!field)return;
    const type=field[2];
    if(type==="toggle"&&typeof value!=="boolean")return;
    if(type==="range"){value=Number(value);if(!Number.isFinite(value))return;value=Math.max(field[3],Math.min(field[4],value));}
    if(type==="select"&&!field[3].some(option=>option[0]===String(value)))return;
    studioGameProfiles[gameId][key]=value;persistGameProfiles();broadcastStudioSettings();
    window.dispatchEvent(new CustomEvent("voidforge:game-profile-change",{detail:{gameId,settings:{...studioGameProfiles[gameId]}}}));
  }
  function readStudioSettings() {
    try { const saved=JSON.parse(localStorage.getItem(STUDIO_SETTINGS_KEY)||"{}"); return {...STUDIO_SETTINGS_DEFAULTS,...(saved&&typeof saved==="object"?saved:{})}; }
    catch { return {...STUDIO_SETTINGS_DEFAULTS}; }
  }
  function persistStudioSettings() {
    try { localStorage.setItem(STUDIO_SETTINGS_KEY,JSON.stringify(studioSettings)); }
    catch(error) { console.warn("[VoidForge] Settings could not be saved:",error); }
  }
  function broadcastStudioSettings() {
    if(!gameFrame?.contentWindow||!currentGame) return;
    gameFrame.contentWindow.postMessage({type:"voidforge:settings",version:1,gameId:String(currentGame.id),settings:{...studioSettings},gameSettings:currentGame?{...(studioGameProfiles[currentGame.id]||{})}:{}} ,window.location.origin);
  }
  function updateStudioSetting(key,value) {
    if(!Object.prototype.hasOwnProperty.call(STUDIO_SETTINGS_DEFAULTS,key)) return;
    const base=STUDIO_SETTINGS_DEFAULTS[key];
    if(typeof base==="boolean"&&typeof value!=="boolean") return;
    if(typeof base==="number") { value=Number(value); if(!Number.isFinite(value)) return;
      const bounds={textScale:[75,150],fov:[60,120],sensitivity:[0.1,5],renderScale:[50,100],masterVolume:[0,100],musicVolume:[0,100],sfxVolume:[0,100],audioBalance:[-100,100],displayBrightness:[50,150],displayContrast:[75,150],displaySaturation:[0,150],hudOpacity:[20,100],textSpacing:[80,150],subtitleSize:[75,175],touchButtonSize:[75,150],controllerDeadzone:[0,40]};
      const range=bounds[key]||[0,100]; value=Math.max(range[0],Math.min(range[1],value)); }
    if(typeof base==="string") {
      if(typeof value!=="string") return;
      const allowed={
        graphics:["low","medium","high","ultra"],language:["system","en","de","fr","es"],
        difficulty:["easy","normal","hard","adaptive"],colorMode:["system","dark","light"],
        shadows:["off","low","medium","high"],targetFps:["30","60","120","unlimited"],
        uiDensity:["compact","comfortable","spacious"],screenOrientation:["auto","landscape","portrait"],
        colorBlindMode:["off","protanopia","deuteranopia","tritanopia"],crosshairStyle:["default","dot","circle","cross","off"]
      };
      if(allowed[key]&&!allowed[key].includes(value)) return;
    }
    studioSettings[key]=value; persistStudioSettings(); broadcastStudioSettings(); updateGameStatsOverlay(); applyStudioAppearanceSettings();
    window.dispatchEvent(new CustomEvent("voidforge:settings-change",{detail:{...studioSettings,key,value}}));
  }
  let gameStatsOverlay = null;
  let latestGameFps = null;
  let latestGameSize = "";
  let gameSessionStartedAt = 0;
  let gameStatsInterval = null;
  function ensureGameStatsOverlay() {
    if(!gameView) return;
    if(!gameStatsOverlay) {
      gameStatsOverlay=document.createElement("output");
      gameStatsOverlay.className="vf-game-stats";
      gameStatsOverlay.setAttribute("aria-live","off");
      gameStatsOverlay.setAttribute("aria-label","Game performance");
      gameView.appendChild(gameStatsOverlay);
    }
    if(!gameStatsInterval) gameStatsInterval=window.setInterval(updateGameStatsOverlay,1000);
    updateGameStatsOverlay();
  }
  function updateGameStatsOverlay() {
    if(!gameStatsOverlay) return;
    const visible=Boolean(studioSettings.showFps||studioSettings.showPerformance||studioSettings.developerMode||studioSettings.showDebugInfo||studioSettings.showNetworkStatus);
    gameStatsOverlay.hidden=!visible;
    if(!visible) return;
    const fps=latestGameFps===null?"FPS —":("FPS "+latestGameFps);
    const size=(studioSettings.showPerformance||studioSettings.showGameResolution)&&latestGameSize?" · "+latestGameSize:"";
    const elapsed=gameSessionStartedAt?Math.max(0,Math.floor((Date.now()-gameSessionStartedAt)/1000)):0;
    const timer=studioSettings.showGameTimer?" · "+String(Math.floor(elapsed/60)).padStart(2,"0")+":"+String(elapsed%60).padStart(2,"0"):"";
    const debug=studioSettings.developerMode||studioSettings.showDebugInfo?" · DEV "+String(currentGame?.id||"game"):"";
    const network=studioSettings.showNetworkStatus?" · "+(navigator.onLine?"ONLINE":"OFFLINE"):"";
    gameStatsOverlay.textContent=fps+size+timer+debug+network;
    gameStatsOverlay.dataset.state=latestGameFps===null?"waiting":"live";
  }
  function applyStudioAppearanceSettings() {
    const root=document.documentElement;
    const enabled=!!studioSettings.liquidGlass;
    root.classList.toggle("vf-liquid-glass",enabled);
    document.body?.classList.toggle("vf-liquid-glass",enabled);
    root.style.setProperty("--vf-hud-opacity",String(Number(studioSettings.hudOpacity??100)/100));
    root.style.setProperty("--vf-touch-scale",String(Number(studioSettings.touchButtonSize??100)/100));
  }
  function setupStudioSettingsBridge() {
    applyStudioAppearanceSettings();
    ensureGameStatsOverlay();
    window.addEventListener("message",event=>{
      if(!gameFrame?.contentWindow||event.source!==gameFrame.contentWindow) return;
      const msg=event.data; if(!msg||typeof msg!=="object") return;
      if(event.origin!==window.location.origin) return;
      if(msg.type==="voidforge:settings-request") broadcastStudioSettings();
      if(msg.type==="voidforge:settings-update"&&msg.settings&&typeof msg.settings==="object")
        Object.entries(msg.settings).forEach(([key,value])=>{if(Object.prototype.hasOwnProperty.call(STUDIO_SETTINGS_DEFAULTS,key)) updateStudioSetting(key,value);});
      if(msg.type==="voidforge:performance"&&msg.gameId===String(currentGame?.id||"")) {
        latestGameFps=Number.isFinite(msg.fps)?Math.max(0,Math.round(msg.fps)):null;
        latestGameSize=msg.width&&msg.height?(msg.width+"×"+msg.height):"";
        updateGameStatsOverlay();
      }
      if(msg.type==="voidforge:reload-request"&&msg.gameId===String(currentGame?.id||"")) {
        if(studioSettings.autoReload) reloadGame();
        else showToast("This game requested a reload, but automatic reload is disabled in Studio Settings.");
      }
      if(msg.type==="voidforge:game-error"&&studioSettings.developerMode&&studioSettings.showConsoleErrors) {
        console.error("[VoidForge game]",msg.message||"Game error",msg.source||"",msg.line||"");
        showToast("Game error captured — check the browser console.");
      }

    });
    window.addEventListener("storage",event=>{if(event.key===STUDIO_SETTINGS_KEY){studioSettings=readStudioSettings();broadcastStudioSettings();updateGameStatsOverlay();}});
  }
  function renderSettingsView(root) {
    const section=createLauncherView("settings-view");
    section.appendChild(createViewHeading("Studio Settings","One shared settings profile for every game in your VoidForge library."));
    const content=createElement("div","settings-content");
    content.appendChild(createElement("p","settings-intro","Adjust your console experience once. Supported games receive these preferences automatically when they launch and whenever you change them."));
    const groups=[
      {title:"Sound",desc:"Set overall volume and how game audio behaves.",fields:[["masterVolume","Master volume","range",0,100,"%"],["musicVolume","Background music volume","range",0,100,"%"],["sfxVolume","Sound effects volume","range",0,100,"%"],["muted","Mute all game audio","toggle"],["audioBalance","Left / right audio balance","range",-100,100,"",1],["audioDucking","Lower music during important sounds","toggle"],["spatialAudio","Enable spatial audio when supported","toggle"],["muteWhenUnfocused","Mute games when this tab is in the background","toggle"],["masterLimiter","Prevent sudden loud audio peaks","toggle"]]},
      {title:"Display & Graphics",desc:"Choose image quality and tune how the game looks on your screen.",fields:[["graphics","Graphics quality","select",["low","medium","high","ultra"]],["displayBrightness","Game brightness","range",50,150,"%"],["displayContrast","Game contrast","range",75,150,"%"],["displaySaturation","Game color intensity","range",0,150,"%"],["uiDensity","Interface spacing","select",["compact","comfortable","spacious"]],["hudOpacity","HUD transparency","range",20,100,"%"],["fullscreenOnLaunch","Open games in fullscreen when possible","toggle"],["screenOrientation","Preferred screen orientation","select",["auto","landscape","portrait"]],["showFps","Show FPS counter","toggle"],["showPerformance","Show performance information","toggle"],["textScale","Game text size","range",75,150,"%"],["colorMode","Game color theme","select",["system","dark","light"]],["renderScale","3D render resolution","range",50,100,"%",5],["shadows","Shadow detail","select",["off","low","medium","high"]],["antiAliasing","Smooth jagged edges","toggle"],["targetFps","Frame-rate limit","select",["30","60","120","unlimited"]]]},
      {title:"Gameplay",desc:"Choose helpful defaults. A game uses an option when it supports that feature.",fields:[["difficulty","Default difficulty","select",["easy","normal","hard","adaptive"]],["autosave","Save progress automatically when supported","toggle"],["showHints","Show hints and helpful tips","toggle"],["showLoadingTips","Show tips while a game is loading","toggle"],["autoRestart","Restart a game automatically after a round","toggle"],["confirmExit","Ask before leaving a game","toggle"],["confirmRestart","Ask before starting a round over","toggle"],["quickStart","Skip the title screen when possible","toggle"],["dynamicDifficulty","Let supported games adjust difficulty over time","toggle"],["controllerVibration","Allow controller vibration","toggle"],["subtitles","Show subtitles when available","toggle"],["pauseWhenHidden","Pause games when the tab is hidden","toggle"]]},
      {title:"Accessibility",desc:"Make text, motion, color and input easier to use.",fields:[["reduceMotion","Reduce animations and movement","toggle"],["screenShake","Allow screen-shake effects","toggle"],["particles","Show decorative particle effects","toggle"],["language","Preferred game language","select",["system","en","de","fr","es"]],["notifications","Allow game notifications","toggle"],["highContrast","Increase contrast for better readability","toggle"],["largeCursor","Use a larger pointer","toggle"],["colorBlindMode","Color-vision assistance","select",["off","protanopia","deuteranopia","tritanopia"]],["dyslexiaFriendlyFont","Use a dyslexia-friendly font when supported","toggle"],["textSpacing","Text spacing","range",80,150,"%"],["subtitleSize","Subtitle size","range",75,175,"%"],["reduceFlashes","Reduce flashing and rapid brightness changes","toggle"],["monoAudio","Use mono audio when supported","toggle"],["holdToConfirm","Require a short hold for important actions","toggle"]]},
      {title:"Camera & Controls",desc:"Adjust camera movement and touch or controller input.",fields:[["fov","Field of view","range",60,120,"°",1],["sensitivity","Look sensitivity","range",0.1,5,"×",0.1],["invertY","Invert vertical camera movement","toggle"],["touchControls","Show touch controls on phones and tablets","toggle"],["leftHandedControls","Move touch controls for left-handed play","toggle"],["touchButtonSize","Touch button size","range",75,150,"%"],["controllerDeadzone","Controller stick dead zone","range",0,40,"%",1],["aimAssist","Enable aim assistance when supported","toggle"],["tapToInteract","Use a tap to interact on touchscreens","toggle"]]},
      {title:"HUD & Game Screen",desc:"Choose which game information and visual helpers stay on screen.",fields:[["showGameTimer","Show the session timer","toggle"],["showGameResolution","Show game resolution","toggle"],["showScore","Show the current score when available","toggle"],["showBestScore","Show your best score when available","toggle"],["showControlHints","Show keyboard and touch hints","toggle"],["compactHud","Use a smaller, more compact game HUD","toggle"],["hideCursor","Hide the pointer while playing","toggle"],["crosshairStyle","Crosshair appearance","select",["default","dot","circle","cross","off"]],["showSafeArea","Show the screen safe-area guide","toggle"],["pauseOnBlur","Ask games to pause when they lose focus","toggle"],["autoReload","Allow games to request a reload","toggle"]]},
      {title:"Privacy, Saves & Storage",desc:"Control local progress, optional diagnostics and downloaded game files.",fields:[["rememberLastGame","Remember the last game you opened","toggle"],["saveGameProgress","Allow games to save progress in this browser","toggle"],["localTelemetry","Allow anonymous local diagnostics","toggle"],["clearDataOnExit","Clear temporary game data when leaving","toggle"],["reduceDataUsage","Prefer lighter downloads when supported","toggle"],["cacheAssets","Cache game files for faster repeat visits","toggle"],["disableGameCache","Always load the latest game files instead of using cache","toggle"]]},
      {title:"Developer Tools",desc:"Extra diagnostics for testing games. These options do not change online game servers.",fields:[["developerMode","Enable Developer Mode","toggle"],["showDebugInfo","Show developer information","toggle"],["showConsoleErrors","Send game errors to the Studio console","toggle"],["showNetworkStatus","Show online / offline status","toggle"],["apiDiagnostics","Show settings API connection diagnostics","toggle"],["verboseLogs","Show more detailed game logs","toggle"],["showHitboxes","Show collision boxes when a game supports them","toggle"],["showFrameGraph","Show a frame-time graph when available","toggle"]]},
      {title:"Experimental Appearance · Beta",desc:"Try the new translucent Liquid Glass look. This preview is experimental and may affect readability or performance on some devices.",fields:[["liquidGlass","Enable Liquid Glass style (Beta)","toggle"]]}
    ];
    groups.forEach(group=>{
      const panel=createElement("section","studio-settings-group"),head=createElement("div","studio-settings-heading");
      head.appendChild(createElement("h2","",group.title)); head.appendChild(createElement("p","",group.desc)); panel.appendChild(head);
      const list=createElement("div","studio-settings-list");
      group.fields.forEach(field=>{
        const key=field[0],label=field[1],type=field[2],a=field[3],b=field[4],suffix=field[5],step=field[6],row=createElement("div","studio-setting-row"),copy=createElement("div","studio-setting-copy");
        copy.appendChild(createElement("strong","",label));
        if(STUDIO_SETTING_HELP[key]) copy.appendChild(createElement("small","studio-setting-help",STUDIO_SETTING_HELP[key]));
        if(type==="range"){
          const wrap=createElement("div","studio-range-wrap"),input=createElement("input","studio-range"),out=createElement("output","studio-range-value",String(studioSettings[key])+suffix);
          input.type="range";input.min=String(a);input.max=String(b);input.step=step?String(step):"1";input.value=String(studioSettings[key]);
          input.addEventListener("input",()=>{out.textContent=input.value+suffix;updateStudioSetting(key,Number(input.value));});
          appendChildren(wrap,input,out);appendChildren(row,copy,wrap);
        } else if(type==="toggle"){
          const input=createElement("input","studio-toggle");input.type="checkbox";input.checked=Boolean(studioSettings[key]);input.setAttribute("role","switch");input.setAttribute("aria-label",label);
          input.addEventListener("change",()=>updateStudioSetting(key,input.checked));appendChildren(row,copy,input);
        } else {
          const select=createElement("select","studio-select");
          a.forEach(option=>select.appendChild(new Option(option.charAt(0).toUpperCase()+option.slice(1),option)));
          select.value=studioSettings[key];select.setAttribute("aria-label",label);select.addEventListener("change",()=>updateStudioSetting(key,select.value));
          appendChildren(row,copy,select);
        }
        list.appendChild(row);
      });
      panel.appendChild(list);content.appendChild(panel);
    });
    const profilePanel=createElement("section","studio-settings-group studio-game-profile");
    const profileHead=createElement("div","studio-settings-heading");
    profileHead.appendChild(createElement("h2","","Game-specific settings"));
    profileHead.appendChild(createElement("p","","Choose a game to view and edit its own settings profile. Profiles are saved separately and sent to that game when it launches."));
    profilePanel.appendChild(profileHead);
    const profileSelect=createElement("select","studio-select");
    Object.entries(GAME_PROFILE_DEFINITIONS).forEach(([id,def])=>profileSelect.appendChild(new Option(def.title,id)));
    const profileList=createElement("div","studio-settings-list");
    function renderGameProfile(gameId){
      profileList.replaceChildren();const def=GAME_PROFILE_DEFINITIONS[gameId];if(!def)return;
      def.fields.forEach(field=>{
        const [key,label,type,a,b,suffix,step]=field,row=createElement("div","studio-setting-row"),copy=createElement("div","studio-setting-copy");
        copy.appendChild(createElement("strong","",label));
        const value=studioGameProfiles[gameId][key];
        if(type==="range"){
          const wrap=createElement("div","studio-range-wrap"),input=createElement("input","studio-range"),out=createElement("output","studio-range-value",String(value)+(suffix||""));
          input.type="range";input.min=String(a);input.max=String(b);input.step=step?String(step):"1";input.value=String(value);
          input.addEventListener("input",()=>{out.textContent=input.value+(suffix||"");updateGameProfile(gameId,key,Number(input.value));});
          appendChildren(wrap,input,out);appendChildren(row,copy,wrap);
        }else if(type==="toggle"){
          const input=createElement("input","studio-toggle");input.type="checkbox";input.checked=Boolean(value);input.setAttribute("role","switch");input.setAttribute("aria-label",label);
          input.addEventListener("change",()=>updateGameProfile(gameId,key,input.checked));appendChildren(row,copy,input);
        }else{
          const select=createElement("select","studio-select");
          a.forEach(option=>select.appendChild(new Option(option[1],option[0])));
          select.value=String(value);select.setAttribute("aria-label",label);select.addEventListener("change",()=>updateGameProfile(gameId,key,select.value));appendChildren(row,copy,select);
        }
        profileList.appendChild(row);
      });
    }
    profileSelect.addEventListener("change",()=>renderGameProfile(profileSelect.value));
    const selectedProfile=GAME_PROFILE_DEFINITIONS[currentGame?.id]?currentGame.id:Object.keys(GAME_PROFILE_DEFINITIONS)[0];
    profileSelect.value=selectedProfile;profilePanel.appendChild(profileSelect);profilePanel.appendChild(profileList);renderGameProfile(selectedProfile);
    content.appendChild(profilePanel);
    const info=createElement("section","studio-settings-group studio-settings-info");
    info.appendChild(createElement("h2","","Game integration"));
    info.appendChild(createElement("p","","Games in the VoidForge player can request these preferences and listen for live changes. Preferences are stored locally in this browser; unsupported games simply ignore settings they do not use."));
    const reset=createElement("button","secondary-button","Reset all Studio settings");reset.type="button";
    reset.addEventListener("click",()=>{studioSettings={...STUDIO_SETTINGS_DEFAULTS};persistStudioSettings();localStorage.removeItem(GAME_PROFILE_KEY);studioGameProfiles=readGameProfiles();persistGameProfiles();renderSettingsView(root);broadcastStudioSettings();showToast("All Studio and game-specific settings restored to defaults.");});
    info.appendChild(reset);content.appendChild(info);

    // Advanced panic shortcut: configured locally and only active while a game is open.
    const panicPanel=createElement("section","studio-settings-group studio-panic-settings");
    const panicHead=createElement("div","studio-settings-heading");
    panicHead.appendChild(createElement("h2","","Advanced Panic System"));
    panicHead.appendChild(createElement("p","","Quickly leave a game using a custom destination and optional keyboard shortcut. Settings stay on this device."));
    panicPanel.appendChild(panicHead);
    const panicList=createElement("div","studio-settings-list");
    const panicUrlRow=createElement("div","studio-setting-row"),panicUrlCopy=createElement("div","studio-setting-copy");
    panicUrlCopy.appendChild(createElement("strong","","Panic destination URL"));
    panicUrlCopy.appendChild(createElement("small","","Use a trusted page such as a dashboard or another site."));
    const panicUrlInput=createElement("input","studio-select");panicUrlInput.type="url";panicUrlInput.autocomplete="url";panicUrlInput.placeholder="https://example.com";panicUrlInput.value=getPanicUrl();panicUrlInput.setAttribute("aria-label","Panic destination URL");
    appendChildren(panicUrlRow,panicUrlCopy,panicUrlInput);panicList.appendChild(panicUrlRow);
    const panicKeyRow=createElement("div","studio-setting-row"),panicKeyCopy=createElement("div","studio-setting-copy");
    panicKeyCopy.appendChild(createElement("strong","","Panic keyboard shortcut"));
    panicKeyCopy.appendChild(createElement("small","","Optional single key, for example Q. It only works while a game is open."));
    const panicKeyInput=createElement("input","studio-select");panicKeyInput.type="text";panicKeyInput.maxLength=1;panicKeyInput.autocomplete="off";panicKeyInput.placeholder="Off";panicKeyInput.value=getPanicKey();panicKeyInput.setAttribute("aria-label","Panic keyboard shortcut");
    panicKeyInput.addEventListener("input",()=>{panicKeyInput.value=panicKeyInput.value.slice(-1).toLowerCase().replace(/[^a-z0-9]/g,"");});
    appendChildren(panicKeyRow,panicKeyCopy,panicKeyInput);panicList.appendChild(panicKeyRow);
    panicPanel.appendChild(panicList);
    const panicActions=createElement("div","profile-card-actions");
    const savePanic=createElement("button","secondary-button","Save panic settings");savePanic.type="button";
    savePanic.addEventListener("click",()=>{
      const url=panicUrlInput.value.trim();
      if(url){try{const parsed=new URL(url,window.location.href);if(!["http:","https:"].includes(parsed.protocol))throw new Error("Invalid URL");localStorage.setItem(PANIC_URL_KEY,parsed.href);}catch{showToast("Enter a valid http or https panic URL.");panicUrlInput.focus();return;}}
      else localStorage.removeItem(PANIC_URL_KEY);
      const key=panicKeyInput.value.trim().toLowerCase();
      if(key)localStorage.setItem(PANIC_KEY_KEY,key);else localStorage.removeItem(PANIC_KEY_KEY);
      showToast("Advanced panic settings saved on this device.");
    });
    const clearPanic=createElement("button","icon-button","Clear");clearPanic.type="button";
    clearPanic.addEventListener("click",()=>{localStorage.removeItem(PANIC_URL_KEY);localStorage.removeItem(PANIC_KEY_KEY);panicUrlInput.value="";panicKeyInput.value="";showToast("Panic shortcut settings cleared.");});
    appendChildren(panicActions,savePanic,clearPanic);panicPanel.appendChild(panicActions);
    content.appendChild(panicPanel);

    // Optional decoy branding for the console startup screen.
    const fakePanel=createElement("section","studio-settings-group studio-fake-brand-settings");
    const fakeHead=createElement("div","studio-settings-heading");
    fakeHead.appendChild(createElement("h2","","App & Browser Branding"));
    fakeHead.appendChild(createElement("p","","Set the name and icon used by browser tabs and new iPad Home Screen shortcuts on this device. Remove an old shortcut and add it again to refresh its icon."));
    fakePanel.appendChild(fakeHead);
    const fakeList=createElement("div","studio-settings-list");
    const enabledRow=createElement("div","studio-setting-row"),enabledCopy=createElement("div","studio-setting-copy");
    enabledCopy.appendChild(createElement("strong","","Enable fake branding"));
    enabledCopy.appendChild(createElement("small","","When enabled, your selected name and icon are also used for new Home Screen shortcuts where iPadOS supports them."));
    const enabledInput=createElement("input");enabledInput.type="checkbox";enabledInput.checked=!!readFakeBrand().enabled;enabledInput.setAttribute("aria-label","Enable fake branding");
    appendChildren(enabledRow,enabledCopy,enabledInput);fakeList.appendChild(enabledRow);
    const presetRow=createElement("div","studio-setting-row"),presetCopy=createElement("div","studio-setting-copy");
    presetCopy.appendChild(createElement("strong","","App icon preset"));
    const presetInput=createElement("select","studio-select");
    [["none","Default icon"],["google","Google"],["classroom","Google Classroom"],["custom","Custom image URL"],["svg","Paste SVG code"]].forEach(([value,label])=>{const option=createElement("option","",label);option.value=value;presetInput.appendChild(option);});
    const savedBrand=readFakeBrand();presetInput.value=savedBrand.preset||"google";
    appendChildren(presetRow,presetCopy,presetInput);fakeList.appendChild(presetRow);
    const titleRow=createElement("div","studio-setting-row"),titleCopy=createElement("div","studio-setting-copy");
    titleCopy.appendChild(createElement("strong","","App name"));
    const titleInput=createElement("input","studio-select");titleInput.type="text";titleInput.maxLength=48;titleInput.placeholder="e.g. Google";titleInput.value=savedBrand.title||"Google";titleInput.setAttribute("aria-label","Fake title");
    appendChildren(titleRow,titleCopy,titleInput);fakeList.appendChild(titleRow);
    const urlRow=createElement("div","studio-setting-row"),urlCopy=createElement("div","studio-setting-copy");
    urlCopy.appendChild(createElement("strong","","App icon URL (PNG or SVG)"));
    urlCopy.appendChild(createElement("small","","SVG files work as browser icons. Wikimedia SVG links are automatically paired with a PNG thumbnail for iPad Home Screen icons."));
    const logoUrlInput=createElement("input","studio-select");logoUrlInput.type="url";logoUrlInput.placeholder="https://example.com/logo.png";logoUrlInput.value=savedBrand.logoUrl||"";logoUrlInput.setAttribute("aria-label","Custom logo URL");
    appendChildren(urlRow,urlCopy,logoUrlInput);fakeList.appendChild(urlRow);
    const svgRow=createElement("div","studio-setting-row"),svgCopy=createElement("div","studio-setting-copy");
    svgCopy.appendChild(createElement("strong","","Custom SVG markup"));
    svgCopy.appendChild(createElement("small","","Paste a complete SVG element. Scripts, embedded HTML, event handlers, and external references are rejected."));
    const svgInput=createElement("textarea","studio-select");svgInput.rows=7;svgInput.placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">…</svg>';svgInput.value=savedBrand.svgCode||"";svgInput.setAttribute("aria-label","Custom SVG code");
    appendChildren(svgRow,svgCopy,svgInput);fakeList.appendChild(svgRow);
    fakePanel.appendChild(fakeList);
    const fakeActions=createElement("div","profile-card-actions");
    const saveFake=createElement("button","secondary-button","Save fake branding");saveFake.type="button";
    saveFake.addEventListener("click",()=>{
      const preset=presetInput.value,logoUrl=logoUrlInput.value.trim(),svgCode=svgInput.value.trim();
      if(preset==="custom"&&logoUrl){try{const parsed=new URL(logoUrl);if(!["https:","http:"].includes(parsed.protocol))throw new Error();}catch{showToast("Enter a valid http or https logo URL.");logoUrlInput.focus();return;}}
      if(preset==="custom"&&!logoUrl){showToast("Add a logo URL for the custom preset.");logoUrlInput.focus();return;}
      if(preset==="svg"){
        if(!svgCode){showToast("Paste your SVG code first.");svgInput.focus();return;}
        try {
          const parsed=new DOMParser().parseFromString(svgCode,"image/svg+xml");
          const svg=parsed.documentElement;
          if(svg.localName!=="svg" || parsed.querySelector("parsererror,script,foreignObject,iframe,object,embed")) throw new Error();
          if([...svg.querySelectorAll("*")].some(node=>[...node.attributes].some(attr=>/^on/i.test(attr.name)||((attr.name==="href"||attr.name==="xlink:href")&&!attr.value.startsWith("#"))||(/url\s*\(/i.test(attr.value)&&!/^url\(#[^)]+\)$/.test(attr.value.trim()))))) throw new Error();
          if([...svg.querySelectorAll("style")].some(node=>/@import|https?:|data:/i.test(node.textContent))) throw new Error();
        } catch {showToast("That SVG is invalid or contains unsupported active/external content.");svgInput.focus();return;}
      }
      const config={enabled:enabledInput.checked,preset,title:titleInput.value.trim()||" ",logoUrl,svgCode};
      localStorage.setItem(FAKE_BRAND_KEY,JSON.stringify(config));applyFakeBrand();showToast("Branding saved. Wait a moment for the iPad icon to update, then re-add the Home Screen shortcut.");
    });
    const resetFake=createElement("button","icon-button","Reset");resetFake.type="button";
    resetFake.addEventListener("click",()=>{localStorage.removeItem(FAKE_BRAND_KEY);enabledInput.checked=false;presetInput.value="none";titleInput.value="";logoUrlInput.value="";svgInput.value="";applyFakeBrand();showToast("App and browser branding reset.");});
    appendChildren(fakeActions,saveFake,resetFake);fakePanel.appendChild(fakeActions);content.appendChild(fakePanel);

    section.appendChild(content);root.replaceChildren(section);
  }

  /* =========================================================
     FIREBASE ONLINE + PRIVATE CHAT
     Private rooms are invite-code based, two participants max.
  ========================================================= */
  let chatUnsubscribe = null;
  let chatFirebase = null;
  let chatBusy = false;
  let activePrivateRoom = null;
  const PRIVATE_ROOMS_KEY = "voidforgePrivateRoomsV1";

  function stopChatListener() {
    if (chatUnsubscribe) {
      chatUnsubscribe();
      chatUnsubscribe = null;
    }
  }

  function getPrivateRooms() {
    try {
      const value = JSON.parse(localStorage.getItem(PRIVATE_ROOMS_KEY) || "[]");
      return Array.isArray(value) ? value.filter(room => room && typeof room.roomId === "string" && typeof room.code === "string") : [];
    } catch { return []; }
  }

  function savePrivateRoom(room) {
    const rooms = getPrivateRooms().filter(item => item.roomId !== room.roomId);
    rooms.unshift(room);
    try { localStorage.setItem(PRIVATE_ROOMS_KEY, JSON.stringify(rooms.slice(0, 50))); }
    catch (error) { console.warn("[VoidForge Chat] Could not save private room locally:", error); }
  }

  function makePrivateCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
  }

  function chatButton(label, className, action) {
    const button = createElement("button", className, label);
    button.type = "button";
    button.addEventListener("click", action);
    return button;
  }

  function renderChatView(root, mode = "global") {
    stopChatListener();
    activePrivateRoom = null;
    const section = createLauncherView("chat-view");
    section.appendChild(createViewHeading("Online Chat", "Talk with players across VoidForge in real time."));
    const tabs = createElement("div", "chat-tabs");
    tabs.appendChild(chatButton("Global Lobby", "chat-tab" + (mode === "global" ? " is-active" : ""), () => renderChatView(root, "global")));
    tabs.appendChild(chatButton("Private Chats", "chat-tab" + (mode === "private" ? " is-active" : ""), () => renderChatView(root, "private")));
    section.appendChild(tabs);
    if (mode === "private") {
      renderPrivateChatHome(section, root);
    } else {
      renderGlobalChat(section);
    }
    root.replaceChildren(section);
  }

  function renderGlobalChat(section) {
    const shell = createElement("section", "chat-shell");
    const header = createElement("div", "chat-room-header");
    const roomInfo = createElement("div", "chat-room-info");
    const live = createElement("span", "chat-live-dot");
    const roomText = createElement("div");
    roomText.appendChild(createElement("strong", "", "Global Lobby"));
    roomText.appendChild(createElement("small", "", "Everyone on VoidForge can join"));
    appendChildren(roomInfo, live, roomText);
    const status = createElement("span", "chat-connection-status", "Connecting…");
    status.id = "vfChatStatus";
    appendChildren(header, roomInfo, status);
    const messages = createElement("div", "chat-messages");
    messages.id = "vfChatMessages";
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-live", "polite");
    messages.setAttribute("aria-label", "Global chat messages");
    const empty = createChatEmpty("Welcome to the lobby", "Messages from other VoidForge players will appear here.");
    messages.appendChild(empty);
    const form = createElement("form", "chat-compose");
    const input = createElement("input");
    input.id = "vfChatInput";
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = "Message the lobby…";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Chat message");
    input.required = true;
    const send = createElement("button", "primary-button", "Send");
    send.type = "submit";
    appendChildren(form, input, send);
    const hint = createElement("p", "chat-hint", "Be respectful. Never share passwords, personal details, or private information.");
    appendChildren(shell, header, messages, form, hint);
    section.appendChild(shell);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      await sendChatMessage("global", input, send);
    });
    connectFirebaseChat(messages, status, empty);
  }

  function createChatEmpty(title, description) {
    const empty = createElement("div", "chat-empty");
    empty.className = "chat-empty";
    empty.appendChild(createElement("div", "chat-empty-icon", "✦"));
    empty.appendChild(createElement("strong", "", title));
    empty.appendChild(createElement("p", "", description));
    return empty;
  }

  function renderPrivateChatHome(section, root) {
    const panel = createElement("section", "private-chat-home");
    const intro = createElement("div", "private-chat-intro");
    intro.appendChild(createElement("span", "private-chat-symbol", "🔒"));
    const copy = createElement("div");
    copy.appendChild(createElement("h2", "", "Your private conversations"));
    copy.appendChild(createElement("p", "", "Create a private room and share its one-time invite code with one other player."));
    intro.appendChild(copy);
    panel.appendChild(intro);

    const actions = createElement("div", "private-chat-actions");
    const createPanel = createElement("form", "private-chat-action-card");
    createPanel.appendChild(createElement("h3", "", "Start a private chat"));
    createPanel.appendChild(createElement("p", "", "Create a private two-person conversation and invite someone."));
    const createButton = createElement("button", "primary-button", "Create private chat");
    createButton.type = "submit";
    createPanel.appendChild(createButton);
    createPanel.addEventListener("submit", async event => {
      event.preventDefault();
      createButton.disabled = true;
      try {
        await ensureFirebaseChat();
        const code = makePrivateCode();
        const roomRef = chatFirebase.doc(chatFirebase.collection(chatFirebase.db, "rooms"));
        const profile = getActiveProfile();
        const displayName = (profile?.name || "Player").trim().slice(0, 24) || "Player";
        await chatFirebase.setDoc(roomRef, {
          type: "private",
          participants: [chatFirebase.user.uid],
          createdBy: chatFirebase.user.uid,
          createdAt: chatFirebase.serverTimestamp()
        });
        await chatFirebase.setDoc(chatFirebase.doc(chatFirebase.db, "invites", code), {
          roomId: roomRef.id,
          createdBy: chatFirebase.user.uid,
          createdAt: chatFirebase.serverTimestamp()
        });
        savePrivateRoom({ roomId: roomRef.id, code, title: "Private chat", createdAt: Date.now(), owner: true, displayName });
        renderChatView(root, "private");
        showPrivateInvite(root, roomRef.id, code);
      } catch (error) {
        console.error("[VoidForge Chat] Private room creation failed:", error);
        showToast("Could not create a private chat. Check Firebase setup and rules.");
      } finally { createButton.disabled = false; }
    });

    const joinPanel = createElement("form", "private-chat-action-card");
    joinPanel.appendChild(createElement("h3", "", "Join with an invite code"));
    joinPanel.appendChild(createElement("p", "", "Enter the code shared by the other player."));
    const codeInput = createElement("input");
    codeInput.type = "text";
    codeInput.maxLength = 8;
    codeInput.minLength = 8;
    codeInput.placeholder = "8-CHARACTER CODE";
    codeInput.autocomplete = "off";
    codeInput.spellcheck = false;
    codeInput.setAttribute("aria-label", "Private chat invite code");
    codeInput.className = "private-code-input";
    const joinButton = createElement("button", "secondary-button", "Join private chat");
    joinButton.type = "submit";
    appendChildren(joinPanel, codeInput, joinButton);
    joinPanel.addEventListener("submit", async event => {
      event.preventDefault();
      const code = codeInput.value.trim().toUpperCase();
      if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) {
        showToast("Enter a valid 8-character invite code.");
        codeInput.focus();
        return;
      }
      joinButton.disabled = true;
      try {
        await ensureFirebaseChat();
        const inviteRef = chatFirebase.doc(chatFirebase.db, "invites", code);
        const inviteSnap = await chatFirebase.getDoc(inviteRef);
        if (!inviteSnap.exists()) throw new Error("Invite not found");
        const roomId = inviteSnap.data().roomId;
        const roomRef = chatFirebase.doc(chatFirebase.db, "rooms", roomId);
        const roomSnap = await chatFirebase.getDoc(roomRef);
        if (!roomSnap.exists()) throw new Error("Room no longer exists");
        const room = roomSnap.data();
        if (room.type !== "private") throw new Error("Invalid room");
        if (room.participants.includes(chatFirebase.user.uid)) {
          savePrivateRoom({ roomId, code, title: "Private chat", createdAt: Date.now(), owner: false });
        } else {
          if (room.participants.length >= 2) throw new Error("This private chat is already full");
          await chatFirebase.updateDoc(roomRef, {
            participants: chatFirebase.arrayUnion(chatFirebase.user.uid)
          });
          savePrivateRoom({ roomId, code, title: "Private chat", createdAt: Date.now(), owner: false });
        }
        renderPrivateRoom(section, root, roomId, code);
      } catch (error) {
        console.error("[VoidForge Chat] Join private room failed:", error);
        showToast(error.message === "This private chat is already full" ? error.message : "Invite is invalid, expired, or the room is unavailable.");
      } finally { joinButton.disabled = false; }
    });
    actions.appendChild(createPanel);
    actions.appendChild(joinPanel);
    panel.appendChild(actions);

    const list = createElement("div", "private-chat-list");
    list.appendChild(createElement("h3", "", "Recent private chats"));
    const rooms = getPrivateRooms();
    if (!rooms.length) {
      list.appendChild(createChatEmpty("No private chats yet", "Create a private chat or join one using an invite code."));
    } else {
      rooms.forEach(room => {
        const item = createElement("article", "private-chat-list-item");
        const details = createElement("div", "private-chat-list-details");
        details.appendChild(createElement("strong", "", room.title || "Private conversation"));
        details.appendChild(createElement("small", "", "Invite code: " + room.code));
        const open = chatButton("Open", "secondary-button", () => renderPrivateRoom(section, root, room.roomId, room.code));
        appendChildren(item, details, open);
        list.appendChild(item);
      });
    }
    panel.appendChild(list);
    section.appendChild(panel);
  }

  async function showPrivateInvite(root, roomId, code) {
    const overlay = createElement("div", "private-invite-overlay");
    const card = createElement("section", "private-invite-card");
    card.appendChild(createElement("span", "private-chat-symbol", "🔒"));
    card.appendChild(createElement("h2", "", "Your private invite"));
    card.appendChild(createElement("p", "", "Share this code with exactly one person. Anyone with the code can try to join until the room is full."));
    const codeValue = createElement("strong", "private-invite-code", code);
    card.appendChild(codeValue);
    const copy = chatButton("Copy invite code", "primary-button", () => {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(() => showToast("Invite code copied.")).catch(() => showToast("Copy failed. Select the code manually."));
      else showToast("Select and copy the invite code.");
    });
    const open = chatButton("Open private chat", "secondary-button", () => {
      overlay.remove();
      const section = $(".chat-view", root);
      renderPrivateRoom(section || root.querySelector(".launcher-view"), root, roomId, code);
    });
    appendChildren(card, copy, open);
    overlay.appendChild(card);
    root.appendChild(overlay);
  }

  function renderPrivateRoom(section, root, roomId, code) {
    stopChatListener();
    activePrivateRoom = roomId;
    const shell = createElement("section", "chat-shell private-room-shell");
    const header = createElement("div", "chat-room-header");
    const info = createElement("div", "chat-room-info");
    info.appendChild(createElement("span", "private-chat-symbol", "🔒"));
    const title = createElement("div");
    title.appendChild(createElement("strong", "", "Private conversation"));
    title.appendChild(createElement("small", "", "Invite-only • 2 participants maximum"));
    info.appendChild(title);
    const status = createElement("span", "chat-connection-status", "Connecting…");
    appendChildren(header, info, status);
    const back = chatButton("← Back to private chats", "secondary-button private-back-button", () => renderChatView(root, "private"));
    const messages = createElement("div", "chat-messages");
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-live", "polite");
    const empty = createChatEmpty("Your private chat is ready", "Send a message to start the conversation.");
    messages.appendChild(empty);
    const form = createElement("form", "chat-compose");
    const input = createElement("input");
    input.type = "text"; input.maxLength = 500; input.placeholder = "Write a private message…"; input.autocomplete = "off"; input.required = true;
    input.setAttribute("aria-label", "Private message");
    const send = createElement("button", "primary-button", "Send");
    send.type = "submit";
    appendChildren(form, input, send);
    const hint = createElement("p", "chat-hint", "Only the two members of this room can read its messages.");
    appendChildren(shell, header, back, messages, form, hint);
    section.replaceChildren(section.querySelector(".view-heading"), section.querySelector(".chat-tabs"), shell);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      await sendChatMessage(roomId, input, send);
    });
    connectPrivateRoom(roomId, messages, status, empty);
  }

  async function ensureFirebaseChat() {
    if (chatFirebase?.db && chatFirebase?.user) return chatFirebase;
    const configModule = await import("./firebase-config.js");
    const config = configModule.firebaseConfig;
    if (!config || !config.apiKey || String(config.apiKey).includes("YOUR_")) {
      throw new Error("Firebase configuration required");
    }
    const [appSdk, authSdk, firestoreSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js")
    ]);
    const existingApp = appSdk.getApps().find(item => item.name === "voidforge-chat");
    const app = existingApp || appSdk.initializeApp(config, "voidforge-chat");
    const auth = authSdk.getAuth(app);

    // Keep the anonymous identity stable across page reloads. This is
    // essential for private-room membership, which is stored by UID.
    await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
    const user = await new Promise((resolve, reject) => {
      let unsubscribe = () => {};
      unsubscribe = authSdk.onAuthStateChanged(auth, async currentUser => {
        unsubscribe();
        if (currentUser) {
          resolve(currentUser);
          return;
        }
        try {
          const credential = await authSdk.signInAnonymously(auth);
          resolve(credential.user);
        } catch (error) {
          reject(error);
        }
      }, reject);
    });

    const db = firestoreSdk.getFirestore(app);
    chatFirebase = { db, user, ...firestoreSdk };
    return chatFirebase;
  }

  async function sendChatMessage(roomId, input, sendButton) {
    const message = input.value.trim();
    if (!message || chatBusy) return;
    chatBusy = true;
    sendButton.disabled = true;
    try {
      await ensureFirebaseChat();
      const profile = getActiveProfile();
      const safeName = (profile?.name || "Player").trim().slice(0, 24) || "Player";
      await chatFirebase.addDoc(
        chatFirebase.collection(chatFirebase.db, "rooms", roomId, "messages"),
        {
          text: message,
          senderName: safeName,
          senderUid: chatFirebase.user.uid,
          createdAt: chatFirebase.serverTimestamp()
        }
      );
      input.value = "";
      input.focus();
    } catch (error) {
      console.error("[VoidForge Chat] Send failed:", error);
      showToast("Message could not be sent. Check your connection and Firebase rules.");
    } finally {
      chatBusy = false;
      sendButton.disabled = false;
    }
  }

  function subscribeToChatMessages(roomId, messages, status, empty, onError) {
    const setStatus = (label, state = "") => {
      if (!status._vfChatActive) return;
      status.textContent = label;
      status.dataset.state = state;
    };
    status._vfChatActive = true;
    const messagesRef = chatFirebase.collection(chatFirebase.db, "rooms", roomId, "messages");
    const recentQuery = chatFirebase.query(
      messagesRef,
      chatFirebase.orderBy("createdAt", "desc"),
      chatFirebase.limit(50)
    );
    stopChatListener();
    chatUnsubscribe = chatFirebase.onSnapshot(recentQuery, snapshot => {
      const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      messages.replaceChildren();
      if (!rows.length) {
        empty.hidden = false;
        messages.appendChild(empty);
        return;
      }
      empty.hidden = true;
      rows.forEach(row => {
        const own = row.senderUid === chatFirebase.user.uid;
        const item = createElement("article", "chat-message" + (own ? " is-own" : ""));
        const meta = createElement("div", "chat-message-meta");
        meta.appendChild(createElement("strong", "", String(row.senderName || "Player").slice(0, 24)));
        const date = row.createdAt?.toDate ? row.createdAt.toDate() : null;
        meta.appendChild(createElement("time", "", date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"));
        item.appendChild(meta);
        item.appendChild(createElement("p", "chat-message-text", String(row.text || "").slice(0, 500)));
        messages.appendChild(item);
      });
      messages.scrollTop = messages.scrollHeight;
    }, error => {
      console.error("[VoidForge Chat] Message listener failed:", error);
      setStatus("Access denied", "offline");
      if (onError) onError(error);
      showToast("Could not load this chat. Check Firestore rules.");
    });
    setStatus("Connected", "online");
  }

  async function connectFirebaseChat(messages, status, empty) {
    const setStatus = (label, state = "") => {
      if (!status._vfChatActive) return;
      status.textContent = label;
      status.dataset.state = state;
    };
    status._vfChatActive = true;
    if (!navigator.onLine) {
      setStatus("Offline", "offline");
      return;
    }
    try {
      setStatus("Loading Firebase…", "pending");
      // Do not leave the UI spinning forever if a blocked SDK request,
      // browser storage restriction, or stalled auth request never resolves.
      await Promise.race([
        ensureFirebaseChat(),
        new Promise((_, reject) => window.setTimeout(
          () => reject(Object.assign(
            new Error("Firebase initialization timed out after 15 seconds. Check network access to www.gstatic.com and Firebase Authentication settings."),
            { code: "voidforge/connection-timeout" }
          )),
          15000
        ))
      ]);
      setStatus("Opening lobby…", "pending");
      subscribeToChatMessages("global", messages, status, empty);
    } catch (error) {
      console.error("[VoidForge Chat] Firebase initialization failed:", error);
      const code = error?.code || "";
      const message = code === "voidforge/connection-timeout"
        ? "Firebase did not finish connecting within 15 seconds. Check that this browser can load www.gstatic.com, that Firebase Authentication → Anonymous is enabled, and that Firestore Database is created."
        : code === "auth/operation-not-allowed"
        ? "Enable Anonymous sign-in in Firebase Authentication → Sign-in method."
        : code === "auth/unauthorized-domain"
          ? "Add this website's domain to Firebase Authentication → Settings → Authorized domains."
          : code === "permission-denied"
            ? "Firestore denied access. Publish the latest firestore.rules in Firebase Console."
            : code === "unavailable"
              ? "Firestore is unavailable. Check your connection and database region."
              : (error?.message || "Check Firebase configuration, Anonymous Authentication, and Cloud Firestore.");
      setStatus("Connection failed", "offline");
      empty.replaceChildren(
        createElement("strong", "", "Chat could not connect"),
        createElement("p", "", message),
        createElement("small", "", code ? "Firebase error: " + code : "Open the browser console for details.")
      );
    }
  }

  async function connectPrivateRoom(roomId, messages, status, empty) {
    try {
      await ensureFirebaseChat();
      const roomRef = chatFirebase.doc(chatFirebase.db, "rooms", roomId);
      const roomSnap = await chatFirebase.getDoc(roomRef);
      if (!roomSnap.exists() || roomSnap.data().type !== "private" || !roomSnap.data().participants.includes(chatFirebase.user.uid)) {
        throw new Error("You are not a member of this private room.");
      }
      subscribeToChatMessages(roomId, messages, status, empty, () => {
        empty.hidden = false;
        empty.replaceChildren(createElement("strong", "", "Private chat unavailable"), createElement("p", "", "You may no longer be a member of this room."));
      });
    } catch (error) {
      console.error("[VoidForge Chat] Private room connection failed:", error);
      status.textContent = "Unavailable";
      status.dataset.state = "offline";
      empty.hidden = false;
      empty.replaceChildren(createElement("strong", "", "Private chat unavailable"), createElement("p", "", "Check the invite, your membership, and the Firestore rules."));
    }
  }

  /* =========================================================
     SEARCH
  ========================================================= */

  function setupSearch() {
    const searchInput =
      $("#searchInput") ||
      $("#gameSearch") ||
      $('input[type="search"]');

    if (!searchInput) {
      return;
    }

    searchInput.addEventListener(
      "input",
      () => {
        const value =
          searchInput.value;

        const grids = [
          $("#gamesGrid"),
          $("#gameGrid"),
          $("#libraryGrid"),
          $(".games-grid"),
          $(".game-grid")
        ].filter(Boolean);

        const uniqueGrids = [
          ...new Set(grids)
        ];

        uniqueGrids.forEach(
          (grid) => {
            renderGameList(
              grid,
              value
            );
          }
        );
      }
    );
  }

  /* =========================================================
     HARD REFRESH
  ========================================================= */

  async function hardRefreshLauncher() {
    const button = $("#hardRefreshLauncher");

    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.title = "Refreshing…";
    }

    showToast("Refreshing VoidForge…", 1500);

    try {
      // Remove cached launcher files and release the current service worker.
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch (error) {
      console.warn("[VoidForge] Hard refresh cleanup skipped:", error);
    } finally {
      // Cache-bust the document request without touching saved settings.
      const url = new URL(window.location.href);
      url.searchParams.set("vf_refresh", String(Date.now()));
      window.location.replace(url.href);
    }
  }


  /* =========================================================
     HARD RESET
     Clears VoidForge launcher preferences and its own offline
     shell cache. It deliberately does not erase unrelated
     applications' storage on the same origin.
  ========================================================= */
  async function hardResetLauncher() {
    const firstConfirm = window.confirm(
      "Hard reset VoidForge?\n\nThis removes local profiles, the active profile, Panic settings and the VoidForge offline shell cache. Your game files and games.json will not be deleted."
    );
    if (!firstConfirm) return;

    const typed = window.prompt('Type RESET to confirm the hard reset:');
    if (typed !== "RESET") {
      if (typed !== null) showToast("Reset cancelled. Type RESET exactly to continue.");
      return;
    }

    const button = $("#hardResetLauncher");
    if (button) {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    }
    showToast("Resetting VoidForge…", 2500);

    try {
      [
        PROFILE_STORAGE_KEY,
        ACTIVE_PROFILE_KEY,
        PANIC_URL_KEY,
        PANIC_KEY_KEY
      ].forEach(key => localStorage.removeItem(key));

      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(
          names.filter(name => name.startsWith("voidforge-shell-"))
            .map(name => caches.delete(name))
        );
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const ownScope = new URL("./", window.location.href).href;
        await Promise.all(
          registrations
            .filter(registration => registration.scope.startsWith(ownScope))
            .map(registration => registration.unregister())
        );
      }

      const url = new URL(window.location.href);
      url.searchParams.set("vf_reset", String(Date.now()));
      url.hash = "";
      window.location.replace(url.href);
    } catch (error) {
      console.error("[VoidForge] Hard reset failed:", error);
      if (button) {
        button.disabled = false;
        button.removeAttribute("aria-busy");
      }
      showToast("Reset could not finish. Check browser storage permissions.");
    }
  }

  function setupHardReset() {
    const button = $("#hardResetLauncher");
    if (button) button.addEventListener("click", hardResetLauncher);
  }

  /* =========================================================
     LAUNCHER FULLSCREEN
  ========================================================= */

  function setupHardRefresh() {
    const button = $("#hardRefreshLauncher");

    if (button) {
      button.addEventListener("click", hardRefreshLauncher);
    }
  }

  function setupLauncherFullscreen() {
    const buttons = $$(
      '[data-action="fullscreen"], #fullscreenButton, #launcherFullscreen, #fullscreenLauncher'
    );

    buttons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          async () => {
            try {
              if (
                document.fullscreenElement
              ) {
                await document.exitFullscreen();
              } else {
                await document.documentElement.requestFullscreen();
              }
            } catch (error) {
              console.error(
                "[VoidForge] Launcher fullscreen error:",
                error
              );

              showToast(
                "Launcher fullscreen is not available."
              );
            }
          }
        );
      }
    );
  }

  /* =========================================================
     MOBILE MENU
  ========================================================= */

  function setupMobileMenu() {
    const menuButton =
      $("#mobileMenu") ||
      $("#mobileMenuButton") ||
      $("#menuButton") ||
      $('[data-action="menu"]');

    const sidebar =
      $("#sidebar") ||
      $(".sidebar");

    if (
      !menuButton ||
      !sidebar
    ) {
      return;
    }

    menuButton.setAttribute(
      "aria-expanded",
      document.body.classList.contains(
        "nav-open"
      )
        ? "true"
        : "false"
    );

    menuButton.addEventListener(
      "click",
      () => {
        const isOpen =
          document.body.classList.toggle(
            "nav-open"
          );

        menuButton.setAttribute(
          "aria-expanded",
          isOpen
            ? "true"
            : "false"
        );
      }
    );

    $$(
      "[data-view], [data-nav]",
      sidebar
    ).forEach(
      (item) => {
        item.addEventListener(
          "click",
          () => {
            document.body.classList.remove(
              "nav-open"
            );

            menuButton.setAttribute(
              "aria-expanded",
              "false"
            );
          }
        );
      }
    );
  }

  /* =========================================================
     CONNECTION STATUS
  ========================================================= */

  function setupConnectionStatus() {
    const updateConnectionStatus =
      () => {
        const statusElements =
          $$(
            "#connectionStatus, .connection-status, [data-connection-status]"
          );

        statusElements.forEach(
          (element) => {
            if (
              navigator.onLine
            ) {
              element.textContent =
                "Online";

              element.classList.remove(
                "offline"
              );

              element.classList.add(
                "online"
              );
            } else {
              element.textContent =
                "Offline";

              element.classList.remove(
                "online"
              );

              element.classList.add(
                "offline"
              );
            }
          }
        );
      };

    window.addEventListener(
      "online",
      updateConnectionStatus
    );

    window.addEventListener(
      "offline",
      updateConnectionStatus
    );

    updateConnectionStatus();
  }

  /* =========================================================
     SERVICE WORKER
  ========================================================= */

  async function registerServiceWorker() {
    if (
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    if (
      location.protocol !== "https:" &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      return;
    }

    try {
      const registration =
        await navigator.serviceWorker.register(
          "./sw.js"
        );

      console.log(
        "[VoidForge] Service worker registered:",
        registration.scope
      );
    } catch (error) {
      console.warn(
        "[VoidForge] Service worker registration failed:",
        error
      );
    }
  }

  /* =========================================================
     FAVICON HARD RESET
  ========================================================= */


  /* =========================================================
     GLOBAL API
  ========================================================= */

  window.launchGame =
    launchGame;

  window.launch =
    launchGame;

  window.VoidForge = {
    get games() {
      return games;
    },

    get currentGame() {
      return currentGame;
    },

    loadGames,
    renderGames,
    launchGame,
    closeGame,
    reloadGame,
    hardRefreshLauncher
  };

  /* =========================================================
     STARTUP
  ========================================================= */

  async function init() {
    setupGameEvents();
    loadProfiles();
    setupPanic();
    setupKeyboardEvents();
    setupNavigation();
    setupSearch();
    setupHardRefresh();
    setupHardReset();
    setupLauncherFullscreen();
    setupMobileMenu();
    setupConnectionStatus();
    applyFakeBrand();

    /*
     * FIX: renderView() was previously only ever triggered by a
     * nav-item click. On first load nothing rendered the initial
     * view, so #viewRoot stayed empty until the user clicked a
     * nav item. Render the default "library" view up front so
     * there's something in the DOM for loadGames()/renderGames()
     * to fill in once the registry has loaded.
     */
    renderView("library");

    await loadGames();

    const hashMatch = window.location.hash.match(/^#game=([^&]+)/);
    if (hashMatch) {
      const bookmarkedGame = decodeURIComponent(hashMatch[1]);
      if (games.some(game => String(game.id) === bookmarkedGame)) {
        launchGame(bookmarkedGame);
      }
    }

    await registerServiceWorker();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
