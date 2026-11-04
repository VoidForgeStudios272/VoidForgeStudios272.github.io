(() => {
  const $ = (selector) => document.querySelector(selector);
  const backdrop = $("#modalBackdrop");
  const modalTitle = $("#modalTitle");
  const modalContent = $("#modalContent");
  const toast = $("#toast");
  let toastTimer;
  let selectedColor = "#e94d55";
  const colors = ["#e94d55","#4b91e8","#55c58b","#e7bd48","#a878dc","#f28c45","#f18fbd","#e7edf4","#53c8c9","#8a9bad"];
  const safeRead = (key, fallback) => {
    try { const value = localStorage.getItem(key); return value === null ? fallback : value; }
    catch { return fallback; }
  };
  const safeWrite = (key, value) => {
    try { localStorage.setItem(key, value); return true; }
    catch { showToast("Browser storage is unavailable."); return false; }
  };
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
  const applyColor = (color) => {
    crewBody().style.background = `linear-gradient(115deg, color-mix(in srgb, ${color}, white 35%), ${color} 48%, color-mix(in srgb, ${color}, black 25%))`;
  };
  const renderColors = () => colors.map(color =>
    `<button class="color-choice ${color === selectedColor ? "selected" : ""}" style="background:${color}" data-color="${color}" aria-label="Choose suit color"></button>`
  ).join("");

  function customize() {
    openModal("CUSTOMIZE", `
      <p>Choose your suit color and display name. Your loadout is saved on this device.</p>
      <div class="choice-grid">${renderColors()}</div>
      <label class="setting-line">Display name <input class="modal-input" id="nameInput" maxlength="16" value="${safeRead("vf-amongus-name", "CREWMATE").replace(/[&<>"']/g, "")}" style="width:58%"></label>
      <div class="modal-row"><button class="modal-action" id="saveLook">SAVE LOADOUT</button><button class="modal-action subtle" id="randomLook">RANDOM</button></div>
    `);
    modalContent.querySelectorAll("[data-color]").forEach(button => button.addEventListener("click", () => {
      selectedColor = button.dataset.color;
      applyColor(selectedColor);
      modalContent.querySelectorAll("[data-color]").forEach(item => item.classList.toggle("selected", item === button));
    }));
    $("#saveLook").addEventListener("click", () => {
      const name = ($("#nameInput").value.trim() || "CREWMATE").slice(0,16).toUpperCase();
      safeWrite("vf-amongus-name", name);
      safeWrite("vf-amongus-color", selectedColor);
      $("#playerName").textContent = name;
      closeModal();
      showToast("Loadout saved.");
    });
    $("#randomLook").addEventListener("click", () => {
      selectedColor = colors[Math.floor(Math.random() * colors.length)];
      customize();
      applyColor(selectedColor);
      showToast("Random suit selected.");
    });
  }

  function settings() {
    const saved = JSON.parse(safeRead("vf-amongus-settings", "{}"));
    openModal("SETTINGS", `
      <p>Adjust the menu experience. Preferences are saved locally.</p>
      <label class="setting-line">Menu animations <input type="checkbox" id="motionSetting"></label>
      <label class="setting-line">Sound effects <input type="checkbox" id="soundSetting"></label>
      <label class="setting-line">Screen shake <input type="checkbox" id="shakeSetting"></label>
      <div class="modal-row"><button class="modal-action" id="saveSettings">SAVE SETTINGS</button></div>
    `);
    $("#motionSetting").checked = saved.motion !== false;
    $("#soundSetting").checked = saved.sound === true;
    $("#shakeSetting").checked = saved.shake !== false;
    $("#saveSettings").addEventListener("click", () => {
      const prefs = { motion: $("#motionSetting").checked, sound: $("#soundSetting").checked, shake: $("#shakeSetting").checked };
      safeWrite("vf-amongus-settings", JSON.stringify(prefs));
      document.body.classList.toggle("no-motion", !prefs.motion);
      closeModal();
      showToast("Settings saved.");
    });
  }

  function profile() {
    openModal("PLAYER PROFILE", `
      <p>Your local player profile for this menu.</p>
      <label class="setting-line">Player name <b>${safeRead("vf-amongus-name", "CREWMATE").replace(/[&<>"']/g, "")}</b></label>
      <label class="setting-line">Profile status <b style="color:#65dfa3">LOCAL PROFILE</b></label>
      <label class="setting-line">Completed tasks <b id="profileTasks">${Number(safeRead("vf-amongus-tasks", "0"))}</b></label>
      <p>No account or personal data is required.</p>
      <div class="modal-row"><button class="modal-action" id="editProfile">EDIT PROFILE</button></div>
    `);
    $("#editProfile").addEventListener("click", customize);
  }

  function online() {
    openModal("ONLINE PLAY", `
      <p>The online menu is prepared, but this GitHub Pages project does not currently have a multiplayer server or matchmaking service connected.</p>
      <label class="setting-line">Matchmaking <b style="color:#f1c66c">SERVER NOT CONFIGURED</b></label>
      <p>Creating a room here without a real server would not let other players join. The next step is connecting a shared realtime backend.</p>
      <div class="modal-row"><button class="modal-action" id="onlineClose">BACK</button></div>
    `);
    $("#onlineClose").addEventListener("click", closeModal);
  }

  function startPractice() {
    let tasks = 0;
    let wires = [false, false, false];
    const draw = () => {
      openModal("FREEPLAY // THE SKELD", `
        <p>Practice in a small interactive ship task room. Complete all three wiring connections.</p>
        <div class="setting-line"><span>Task progress</span><b id="taskCount">${tasks} / 3</b></div>
        <div style="display:grid;gap:10px;margin:16px 0">
          ${wires.map((done, i) => `<button class="menu-button task-button" data-task="${i}" ${done ? "disabled" : ""} style="justify-content:space-between;opacity:${done ? ".55" : "1"}"><span><b>WIRING PANEL ${i + 1}</b><small>${done ? "Connection restored" : "Connect the power cables"}</small></span><strong>${done ? "✓" : "›"}</strong></button>`).join("")}
        </div>
        <div class="setting-line"><span>Ship status</span><b id="shipStatus" style="color:${tasks === 3 ? "#65dfa3" : "#f1c66c"}">${tasks === 3 ? "ALL TASKS COMPLETE" : "REPAIR IN PROGRESS"}</b></div>
        <div class="modal-row"><button class="modal-action subtle" id="resetPractice">RESTART</button><button class="modal-action" id="leavePractice">LEAVE</button></div>
      `);
      modalContent.querySelectorAll("[data-task]").forEach(button => button.addEventListener("click", () => {
        const index = Number(button.dataset.task);
        if (!wires[index]) {
          wires[index] = true;
          tasks++;
          safeWrite("vf-amongus-tasks", String(Number(safeRead("vf-amongus-tasks", "0")) + 1));
          draw();
          if (tasks === 3) showToast("All ship tasks completed!");
        }
      }));
      $("#resetPractice").addEventListener("click", () => { tasks = 0; wires = [false, false, false]; draw(); });
      $("#leavePractice").addEventListener("click", closeModal);
    };
    draw();
  }

  function localPlay() {
    openModal("LOCAL PRACTICE", `
      <p>Start a solo practice session on this device. This mode does not require an internet connection.</p>
      <label class="setting-line">Crew members <select class="modal-select" id="crewCount" style="width:100px"><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
      <div class="modal-row"><button class="modal-action" id="startLocal">START PRACTICE</button></div>
    `);
    $("#startLocal").addEventListener("click", startPractice);
  }

  function action(type) {
    if (type === "customize") return customize();
    if (type === "settings") return settings();
    if (type === "account") return profile();
    if (type === "online") return online();
    if (type === "local" || type === "freeplay") return localPlay();
  }

  document.querySelectorAll("[data-action]").forEach(button =>
    button.addEventListener("click", () => action(button.dataset.action))
  );
  $("#settingsTop").addEventListener("click", settings);
  $("#modalClose").addEventListener("click", closeModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !backdrop.hidden) closeModal(); });

  const savedColor = safeRead("vf-amongus-color", null);
  if (savedColor && colors.includes(savedColor)) { selectedColor = savedColor; applyColor(savedColor); }
  const savedName = safeRead("vf-amongus-name", null);
  if (savedName) $("#playerName").textContent = savedName;
  const prefs = JSON.parse(safeRead("vf-amongus-settings", "{}"));
  if (prefs.motion === false) document.body.classList.add("no-motion");
  if (prefs.sound === true) {
    document.addEventListener("click", event => {
      if (!event.target.closest("button")) return;
      try {
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.frequency.value = 520; gain.gain.value = 0.025;
        oscillator.start(); oscillator.stop(audio.currentTime + 0.045);
        oscillator.onended = () => audio.close();
      } catch {}
    });
  }
})();