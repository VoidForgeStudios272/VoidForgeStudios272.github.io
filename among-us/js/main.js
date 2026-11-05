(() => {
  const $ = (selector) => document.querySelector(selector);
  const backdrop = $("#modalBackdrop"), modalTitle = $("#modalTitle"), modalContent = $("#modalContent"), toast = $("#toast");
  let toastTimer, selectedColor = "#e94d55";
  const colors = ["#e94d55","#4b91e8","#55c58b","#e7bd48","#a878dc","#f28c45","#f18fbd","#e7edf4","#53c8c9","#8a9bad"];
  const maps = [
    {id:"skeld",name:"THE SKELD",type:"Spaceship",size:"Medium",vents:"14 vents",security:"4 camera views",desc:"A classic ship with tight corridors and a central cafeteria.",rooms:["Cafeteria","Weapons","O2","Navigation","Shields","Communications","Storage","Admin","Electrical","Security","MedBay","Reactor","Upper Engine","Lower Engine"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245],[280,345],[410,345]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[9,12],[10,13],[5,9],[1,6]]},
    {id:"mira",name:"MIRA HQ",type:"High-altitude facility",size:"Small",vents:"11 linked vents",security:"Doorlog sensors",desc:"A compact research headquarters with a connected vent network.",rooms:["Launchpad","MedBay","Locker Room","Cafeteria","Balcony","Office","Admin","Greenhouse","Reactor","Laboratory","Decontamination","Communications"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[2,6],[5,9]]},
    {id:"polus",name:"POLUS",type:"Planetary outpost",size:"Large",vents:"12 vents",security:"6 camera views",desc:"A snowy research base with outdoor routes and a specimen wing.",rooms:["Dropship","Electrical","O2","Communications","Weapons","Office","Admin","Laboratory","MedBay","Storage","Security","Specimen Room"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[5,9],[6,10]]},
    {id:"airship",name:"THE AIRSHIP",type:"Flying airship",size:"Huge",vents:"12 vents",security:"Security cameras",desc:"A sprawling airship with multiple decks, long routes and many rooms.",rooms:["Cockpit","Armory","Brig","Records","Meeting Room","Main Hall","Kitchen","Engine Room","Electrical","Vault","Showers","Cargo Bay","Communications","Medical"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245],[280,345],[410,345]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[9,12],[10,13],[5,9],[6,10]]},
    {id:"fungle",name:"THE FUNGLE",type:"Jungle island",size:"Large",vents:"3 vent chains",security:"Security cameras",desc:"A jungle island with beaches, mushrooms and separated travel routes.",rooms:["Beach","Splash Zone","Cafeteria","Storage","Laboratory","Kitchen","Jungle","Greenhouse","Lookout","Reactor","Communications","Mining Pit"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11]]}
  ];
  const safeRead=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:v;}catch{return fallback;}};
  const safeWrite=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{showToast("Browser storage is unavailable.");return false;}};
  const safeSettings=()=>{try{return JSON.parse(safeRead("vf-amongus-settings","{}"))||{};}catch{return {};}};
  const showToast=(message)=>{toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2500);};
  const openModal=(title,html)=>{modalTitle.textContent=title;modalContent.innerHTML=html;backdrop.hidden=false;$("#modalClose").focus();};
  const closeModal=()=>{backdrop.hidden=true;};
  const crewBody=()=>$(".crew-body");
  const applyColor=(color)=>{crewBody().style.background=`linear-gradient(115deg, color-mix(in srgb, ${color}, white 35%), ${color} 48%, color-mix(in srgb, ${color}, black 25%))`;};
  const renderColors=()=>colors.map(color=>`<button class="color-choice ${color===selectedColor?"selected":""}" style="background:${color}" data-color="${color}" aria-label="Choose suit color"></button>`).join("");
  function customize(){
    openModal("CUSTOMIZE",`<p>Choose your suit color and display name. Your loadout is saved on this device.</p><div class="choice-grid">${renderColors()}</div><label class="setting-line">Display name <input class="modal-input" id="nameInput" maxlength="16" value="${safeRead("vf-amongus-name","CREWMATE").replace(/[&<>"']/g,"")}" style="width:58%"></label><div class="modal-row"><button class="modal-action" id="saveLook">SAVE LOADOUT</button><button class="modal-action subtle" id="randomLook">RANDOM</button></div>`);
    modalContent.querySelectorAll("[data-color]").forEach(b=>b.addEventListener("click",()=>{selectedColor=b.dataset.color;applyColor(selectedColor);modalContent.querySelectorAll("[data-color]").forEach(x=>x.classList.toggle("selected",x===b));}));
    $("#saveLook").addEventListener("click",()=>{const name=($("#nameInput").value.trim()||"CREWMATE").slice(0,16).toUpperCase();safeWrite("vf-amongus-name",name);safeWrite("vf-amongus-color",selectedColor);$("#playerName").textContent=name;closeModal();showToast("Loadout saved.");});
    $("#randomLook").addEventListener("click",()=>{selectedColor=colors[Math.floor(Math.random()*colors.length)];customize();applyColor(selectedColor);showToast("Random suit selected.");});
  }
  function settings(){
    const saved=safeSettings();
    openModal("SETTINGS",`<p>Adjust the menu experience. Preferences are saved locally.</p><label class="setting-line">Menu animations <input type="checkbox" id="motionSetting"></label><label class="setting-line">Sound effects <input type="checkbox" id="soundSetting"></label><label class="setting-line">Screen shake <input type="checkbox" id="shakeSetting"></label><div class="modal-row"><button class="modal-action" id="saveSettings">SAVE SETTINGS</button></div>`);
    $("#motionSetting").checked=saved.motion!==false;$("#soundSetting").checked=saved.sound===true;$("#shakeSetting").checked=saved.shake!==false;
    $("#saveSettings").addEventListener("click",()=>{const prefs={motion:$("#motionSetting").checked,sound:$("#soundSetting").checked,shake:$("#shakeSetting").checked};safeWrite("vf-amongus-settings",JSON.stringify(prefs));document.body.classList.toggle("no-motion",!prefs.motion);closeModal();showToast("Settings saved.");});
  }
  function profile(){
    openModal("PLAYER PROFILE",`<p>Your local player profile for this menu.</p><label class="setting-line">Player name <b>${safeRead("vf-amongus-name","CREWMATE").replace(/[&<>"']/g,"")}</b></label><label class="setting-line">Profile status <b style="color:#65dfa3">LOCAL PROFILE</b></label><label class="setting-line">Completed tasks <b>${Math.max(0,Number(safeRead("vf-amongus-tasks","0"))||0)}</b></label><p>No account or personal data is required.</p><div class="modal-row"><button class="modal-action" id="editProfile">EDIT PROFILE</button></div>`);
    $("#editProfile").addEventListener("click",customize);
  }
  function online(){
    openModal("ONLINE PLAY",`<p>The online menu is prepared, but this GitHub Pages project does not currently have a multiplayer server or matchmaking service connected.</p><label class="setting-line">Matchmaking <b style="color:#f1c66c">SERVER NOT CONFIGURED</b></label><p>Creating a room here without a real server would not let other players join. A shared realtime backend is required.</p><div class="modal-row"><button class="modal-action" id="onlineClose">BACK</button></div>`);
    $("#onlineClose").addEventListener("click",closeModal);
  }
  function mapSvg(map){
    const lines=map.edges.map(([a,b])=>{const p=map.nodes[a],q=map.nodes[b];return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" />`;}).join("");
    const nodes=map.nodes.map((p,i)=>`<g><rect x="${p[0]-43}" y="${p[1]-17}" width="86" height="34" rx="8"/><text x="${p[0]}" y="${p[1]+4}">${map.rooms[i].replace(/&/g,"&amp;")}</text></g>`).join("");
    return `<svg class="map-diagram" viewBox="0 0 680 400" role="img" aria-label="Stylized room connection overview for ${map.name}"><g class="map-routes">${lines}</g><g class="map-rooms">${nodes}</g></svg>`;
  }
  function mapDetails(map){
    openModal(map.name,`<p>${map.desc}</p><div class="map-meta"><span>${map.type}</span><span>${map.size}</span><span>${map.vents}</span><span>${map.security}</span></div>${mapSvg(map)}<p class="map-disclaimer">Original simplified room-connection illustration for this fan concept; not an exact in-game floor plan.</p><div class="modal-row"><button class="modal-action" id="chooseMap">SELECT MAP</button><button class="modal-action subtle" id="backMaps">ALL MAPS</button></div>`);
    $("#chooseMap").addEventListener("click",()=>{safeWrite("vf-amongus-map",map.id);showToast(map.name+" selected.");mapPicker();});
    $("#backMaps").addEventListener("click",mapPicker);
  }
  function mapPicker(){
    const chosen=safeRead("vf-amongus-map","skeld");
    openModal("SELECT A MAP",`<p>Choose a location for your practice session. Select a map to inspect its overview.</p><div class="map-picker">${maps.map(m=>`<button class="map-card ${chosen===m.id?"active":""}" data-map="${m.id}"><span class="map-card-icon">${({skeld:"✦",mira:"⌂",polus:"❄",airship:"✈",fungle:"✿"})[m.id]}</span><span><b>${m.name}</b><small>${m.type} · ${m.size}</small></span><strong>${chosen===m.id?"✓":"›"}</strong></button>`).join("")}</div><div class="modal-row"><button class="modal-action" id="launchSelected">START PRACTICE</button></div>`);
    modalContent.querySelectorAll("[data-map]").forEach(b=>b.addEventListener("click",()=>mapDetails(maps.find(m=>m.id===b.dataset.map))));
    $("#launchSelected").addEventListener("click",()=>startPractice(maps.find(m=>m.id===chosen)||maps[0]));
  }
  function startPractice(map){
    let tasks=0,wires=[false,false,false];
    const draw=()=>{
      openModal("FREEPLAY // "+map.name,`<p>${map.desc}</p><div class="map-practice-preview">${mapSvg(map)}</div><div class="setting-line"><span>Task progress</span><b>${tasks} / 3</b></div><div style="display:grid;gap:10px;margin:16px 0">${wires.map((done,i)=>`<button class="menu-button task-button" data-task="${i}" ${done?"disabled":""} style="justify-content:space-between;opacity:${done?".55":"1"}"><span><b>WIRING PANEL ${i+1}</b><small>${done?"Connection restored":"Connect the power cables"}</small></span><strong>${done?"✓":"›"}</strong></button>`).join("")}</div><div class="setting-line"><span>Ship status</span><b style="color:${tasks===3?"#65dfa3":"#f1c66c"}">${tasks===3?"ALL TASKS COMPLETE":"REPAIR IN PROGRESS"}</b></div><div class="modal-row"><button class="modal-action subtle" id="resetPractice">RESTART</button><button class="modal-action subtle" id="changeMap">CHANGE MAP</button><button class="modal-action" id="leavePractice">LEAVE</button></div>`);
      modalContent.querySelectorAll("[data-task]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.task);if(!wires[i]){wires[i]=true;tasks++;safeWrite("vf-amongus-tasks",String((Number(safeRead("vf-amongus-tasks","0"))||0)+1));draw();if(tasks===3)showToast("All practice tasks completed!");}}));
      $("#resetPractice").addEventListener("click",()=>{tasks=0;wires=[false,false,false];draw();});
      $("#changeMap").addEventListener("click",mapPicker);$("#leavePractice").addEventListener("click",closeModal);
    };draw();
  }
  function action(type){if(type==="customize")return customize();if(type==="settings")return settings();if(type==="account")return profile();if(type==="online")return online();if(type==="local"||type==="freeplay")return mapPicker();}
  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>action(b.dataset.action)));
  $("#settingsTop").addEventListener("click",settings);$("#modalClose").addEventListener("click",closeModal);
  backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!backdrop.hidden)closeModal();});
  const savedColor=safeRead("vf-amongus-color",null);if(savedColor&&colors.includes(savedColor)){selectedColor=savedColor;applyColor(savedColor);}
  const savedName=safeRead("vf-amongus-name",null);if(savedName)$("#playerName").textContent=savedName;
  const prefs=safeSettings();if(prefs.motion===false)document.body.classList.add("no-motion");
  document.addEventListener("click",e=>{if(!e.target.closest("button")||!safeSettings().sound)return;try{const audio=new(window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=520;gain.gain.value=.025;osc.start();osc.stop(audio.currentTime+.045);osc.onended=()=>audio.close();}catch{}});
})();