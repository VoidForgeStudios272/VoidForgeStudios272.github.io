(() => {
  const $ = (selector) => document.querySelector(selector);
  const backdrop = $("#modalBackdrop");
  const modalTitle = $("#modalTitle");
  const modalContent = $("#modalContent");
  const toast = $("#toast");
  let toastTimer;
  let selectedColor = "#e94d55";
  const colors = ["#e94d55","#4b91e8","#55c58b","#e7bd48","#a878dc","#f28c45","#f18fbd","#e7edf4","#53c8c9","#8a9bad"];
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  };
  const openModal = (title, html) => {
    modalTitle.textContent = title;
    modalContent.innerHTML = html;
    backdrop.hidden = false;
    $("#modalClose").focus();
  };
  const closeModal = () => { backdrop.hidden = true; };
  const crewBody = () => $(".crew-body");
  const renderColors = () => colors.map(color =>
    `<button class="color-choice ${color === selectedColor ? "selected" : ""}" style="background:${color}" data-color="${color}" aria-label="Choose color"></button>`
  ).join("");

  function customize() {
    openModal("CUSTOMIZE", `
      <p>Choose your suit color. Your selection is saved on this device.</p>
      <div class="choice-grid">${renderColors()}</div>
      <label class="setting-line">Display name <input class="modal-input" id="nameInput" maxlength="16" value="${localStorage.getItem("vf-amongus-name") || "CREWMATE"}" style="width:58%"></label>
      <div class="modal-row"><button class="modal-action" id="saveLook">SAVE LOADOUT</button><button class="modal-action subtle" id="randomLook">RANDOM</button></div>
    `);
    modalContent.querySelectorAll("[data-color]").forEach(button => button.addEventListener("click", () => {
      selectedColor = button.dataset.color;
      crewBody().style.background = `linear-gradient(115deg, color-mix(in srgb, ${selectedColor}, white 35%), ${selectedColor} 48%, color-mix(in srgb, ${selectedColor}, black 25%))`;
      modalContent.querySelectorAll("[data-color]").forEach(item => item.classList.toggle("selected", item === button));
    }));
    $("#saveLook").addEventListener("click", () => {
      const name = ($("#nameInput").value.trim() || "CREWMATE").slice(0,16).toUpperCase();
      localStorage.setItem("vf-amongus-name", name);
      localStorage.setItem("vf-amongus-color", selectedColor);
      $("#playerName").textContent = name;
      closeModal(); showToast("Loadout saved on this device.");
    });
    $("#randomLook").addEventListener("click", () => {
      selectedColor = colors[Math.floor(Math.random() * colors.length)];
      customize();
      showToast("Random suit selected.");
    });
  }

  function settings() {
    openModal("SETTINGS", `
      <p>Adjust the menu experience. Preferences are stored locally.</p>
      <label class="setting-line">Menu animations <input type="checkbox" id="motionSetting" checked></label>
      <label class="setting-line">Sound effects <input type="checkbox" id="soundSetting"></label>
      <label class="setting-line">Screen shake <input type="checkbox" id="shakeSetting" checked></label>
      <div class="modal-row"><button class="modal-action" id="saveSettings">SAVE SETTINGS</button></div>
    `);
    const saved = JSON.parse(localStorage.getItem("vf-amongus-settings") || "{}");
    $("#motionSetting").checked = saved.motion !== false;
    $("#soundSetting").checked = saved.sound === true;
    $("#shakeSetting").checked = saved.shake !== false;
    $("#saveSettings").addEventListener("click", () => {
      localStorage.setItem("vf-amongus-settings", JSON.stringify({
        motion: $("#motionSetting").checked,
        sound: $("#soundSetting").checked,
        shake: $("#shakeSetting").checked
      }));
      document.body.classList.toggle("no-motion", !$("#motionSetting").checked);
      closeModal(); showToast("Settings saved.");
    });
  }

  function action(type) {
    if (type === "customize") return customize();
    if (type === "settings") return settings();
    if (type === "account") {
      openModal("PLAYER PROFILE", `
        <p>Your local player profile for this menu concept.</p>
        <label class="setting-line">Player name <b>${localStorage.getItem("vf-amongus-name") || "CREWMATE"}</b></label>
        <label class="setting-line">Profile status <b style="color:#65dfa3">LOCAL PROFILE</b></label>
        <p>No account connection or personal data is required.</p>
        <div class="modal-row"><button class="modal-action" id="editProfile">EDIT PROFILE</button></div>
      `);
      $("#editProfile").addEventListener("click", customize);
      return;
    }
    if (type === "online") {
      openModal("ONLINE", `
        <p>Online matchmaking is not connected in this menu-only build. This screen is ready for a future room and matchmaking system.</p>
        <label class="setting-line">Quick match <b style="color:#f1c66c">COMING SOON</b></label>
        <div class="modal-row"><button class="modal-action" id="onlineOkay">GOT IT</button></div>
      `);
      $("#onlineOkay").addEventListener("click", closeModal);
      return;
    }
    if (type === "local") {
      openModal("LOCAL PLAY", `
        <p>Local multiplayer support can be connected here. This menu prototype does not yet create or join a real game session.</p>
        <label class="setting-line">Nearby session <b style="color:#f1c66c">NOT CONNECTED</b></label>
        <div class="modal-row"><button class="modal-action" id="localOkay">OK</button></div>
      `);
      $("#localOkay").addEventListener("click", closeModal);
      return;
    }
    if (type === "freeplay") {
      openModal("FREEPLAY", `
        <p>Freeplay is a menu placeholder for the future practice map. No gameplay is launched from this screen yet.</p>
        <label class="setting-line">Practice mode <b style="color:#f1c66c">COMING SOON</b></label>
        <div class="modal-row"><button class="modal-action" id="freeOkay">BACK TO MENU</button></div>
      `);
      $("#freeOkay").addEventListener("click", closeModal);
    }
  }

  document.querySelectorAll("[data-action]").forEach(button =>
    button.addEventListener("click", () => action(button.dataset.action))
  );
  $("#settingsTop").addEventListener("click", settings);
  $("#modalClose").addEventListener("click", closeModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !backdrop.hidden) closeModal(); });

  const savedColor = localStorage.getItem("vf-amongus-color");
  if (savedColor && colors.includes(savedColor)) {
    selectedColor = savedColor;
    crewBody().style.background = `linear-gradient(115deg, color-mix(in srgb, ${selectedColor}, white 35%), ${selectedColor} 48%, color-mix(in srgb, ${selectedColor}, black 25%))`;
  }
  const savedName = localStorage.getItem("vf-amongus-name");
  if (savedName) $("#playerName").textContent = savedName;
  const prefs = JSON.parse(localStorage.getItem("vf-amongus-settings") || "{}");
  if (prefs.motion === false) document.body.classList.add("no-motion");
})();