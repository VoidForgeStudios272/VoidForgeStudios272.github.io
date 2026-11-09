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
        renderGameList(container);
      }
    );
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

    const filteredGames =
      games.filter((game) => {
        if (!query) {
          return true;
        }

        const searchable = [
          game.name,
          game.title,
          game.subtitle,
          game.description,
          game.category,
          game.platform,
          ...(Array.isArray(game.tags)
            ? game.tags
            : [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          query
        );
      });

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
    latestGameFps = null; latestGameSize = ""; gameSessionStartedAt = Date.now(); ensureGameStatsOverlay();

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
                bridgeScript.src = new URL("/assets/game-settings.js", window.location.origin).href;
                bridgeScript.dataset.voidforgeSettingsBridge = "true";
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
    shadows:"high",antiAliasing:true,targetFps:"60",showSafeArea:false
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
      const bounds={textScale:[75,150],fov:[60,120],sensitivity:[0.1,5],renderScale:[50,100],masterVolume:[0,100],musicVolume:[0,100],sfxVolume:[0,100]};
      const range=bounds[key]||[0,100]; value=Math.max(range[0],Math.min(range[1],value)); }
    if(typeof base==="string") {
      if(typeof value!=="string") return;
      const allowed={
        graphics:["low","medium","high","ultra"],language:["system","en","de","fr","es"],
        difficulty:["easy","normal","hard","adaptive"],colorMode:["system","dark","light"],
        shadows:["off","low","medium","high"],targetFps:["30","60","120","unlimited"]
      };
      if(allowed[key]&&!allowed[key].includes(value)) return;
    }
    studioSettings[key]=value; persistStudioSettings(); broadcastStudioSettings(); updateGameStatsOverlay();
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
  function setupStudioSettingsBridge() {
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
      {title:"Audio",desc:"Control game sound levels.",fields:[["masterVolume","Master volume","range",0,100,"%"],["musicVolume","Music volume","range",0,100,"%"],["sfxVolume","Sound effects","range",0,100,"%"],["muted","Mute all game audio","toggle"]]},
      {title:"Display & Graphics",desc:"Choose visual quality and performance overlays.",fields:[["graphics","Graphics quality","select",["low","medium","high","ultra"]],["showFps","Show FPS counter","toggle"],["showPerformance","Performance overlay","toggle"],["textScale","Game UI scale","range",75,150,"%"],["colorMode","Game color mode","select",["system","dark","light"]]]},
      {title:"Gameplay",desc:"Set shared gameplay preferences.",fields:[["difficulty","Default difficulty","select",["easy","normal","hard","adaptive"]],["autosave","Enable autosave when supported","toggle"],["confirmExit","Confirm before leaving a game","toggle"],["controllerVibration","Controller vibration","toggle"],["subtitles","Subtitles when supported","toggle"]]},
      {title:"Accessibility & Experience",desc:"Make games more comfortable to play.",fields:[["reduceMotion","Reduce motion and animations","toggle"],["screenShake","Screen shake effects","toggle"],["particles","Particle effects","toggle"],["language","Preferred language","select",["system","en","de","fr","es"]],["notifications","Game notifications","toggle"],["highContrast","High contrast","toggle"],["largeCursor","Larger cursor","toggle"]]},
      {title:"Camera & Controls",desc:"Camera and input preferences are shared with games that support them.",fields:[["fov","Field of view (FOV)","range",60,120,"°",1],["sensitivity","Look sensitivity","range",0.1,5,"×",0.1],["invertY","Invert vertical look","toggle"],]},
      {title:"Graphics Advanced",desc:"Fine-tune rendering preferences for compatible games.",fields:[["renderScale","Render scale","range",50,100,"%",5],["shadows","Shadow quality","select",["off","low","medium","high"]],["antiAliasing","Anti-aliasing","toggle"],["targetFps","Frame-rate target","select",["30","60","120","unlimited"]]]},
      {title:"Game HUD & Behavior",desc:"Studio overlays work automatically; other options are sent to games that implement them.",fields:[["showGameTimer","Show session timer","toggle"],["showGameResolution","Show game resolution","toggle"],["pauseOnBlur","Request pause when game loses focus","toggle"],["autoReload","Allow games to request automatic reload","toggle"],["showSafeArea","Show safe-area guide","toggle"]]},
      {title:"Developer Mode",desc:"Unlock diagnostics and advanced game debugging options.",fields:[["developerMode","Enable Developer Mode","toggle"],["showDebugInfo","Show debug information","toggle"],["showConsoleErrors","Forward game errors to Studio","toggle"],["showNetworkStatus","Show network status","toggle"]]}
    ];
    groups.forEach(group=>{
      const panel=createElement("section","studio-settings-group"),head=createElement("div","studio-settings-heading");
      head.appendChild(createElement("h2","",group.title)); head.appendChild(createElement("p","",group.desc)); panel.appendChild(head);
      const list=createElement("div","studio-settings-list");
      group.fields.forEach(field=>{
        const key=field[0],label=field[1],type=field[2],a=field[3],b=field[4],suffix=field[6],step=field[7],row=createElement("div","studio-setting-row"),copy=createElement("div","studio-setting-copy");
        copy.appendChild(createElement("strong","",label));
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
    info.appendChild(reset);content.appendChild(info);section.appendChild(content);root.replaceChildren(section);
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
