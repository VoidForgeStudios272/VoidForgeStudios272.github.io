import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(() => {
  "use strict";
  const root = document.getElementById("brGame");
  const canvas = document.getElementById("brCanvas");
  if (!root || !canvas) return;
  const $ = id => document.getElementById(id);
  const hud = {
    kills:$("brKills"), alive:$("brAlive"), storm:$("brStorm"), ammo:$("brAmmo"),
    health:$("brHealth"), shield:$("brShield"), hint:$("brHint"), end:$("brEnd"),
    endTitle:$("brEndTitle"), endText:$("brEndText")
  };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bc9e8);
  scene.fog = new THREE.Fog(0x9bc9e8, 115, 330);
  const camera = new THREE.PerspectiveCamera(70, 1, .1, 650);
  const renderer = new THREE.WebGLRenderer({canvas, antialias: matchMedia("(pointer:fine)").matches, powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia("(pointer:coarse), (max-width:800px)").matches ? 1.2 : 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const hemi = new THREE.HemisphereLight(0xd8edff, 0x536d3c, 2.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffedcf, 3.0);
  sun.position.set(-85, 125, 65); sun.castShadow = true;
  sun.shadow.mapSize.set(matchMedia("(pointer:coarse), (max-width:800px)").matches ? 768 : 1536,matchMedia("(pointer:coarse), (max-width:800px)").matches ? 768 : 1536);
  sun.shadow.camera.left=-145; sun.shadow.camera.right=145;
  sun.shadow.camera.top=145; sun.shadow.camera.bottom=-145;
  sun.shadow.bias=-.00025; scene.add(sun);
  const world = {size:420, half:210};
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const groundTargets = [];
  // Solid meshes that stop bullets and enemy line of sight.
  const solidBlockers = [];
  const bots = [], bullets = [], pickups = [], builds = [], trees = [];
  const keys = new Set();
  const pointer = {locked:false, fire:false, lookId:null, lastX:0,lastY:0};
  const joystick = {id:null,x:0,y:0};
  const mobileMode=matchMedia("(pointer:coarse), (max-width:800px)").matches;
  root.classList.toggle("mobile-mode",mobileMode);
  let stormRing=null, battleBus=null, glider=null;
  let phase="bus", phaseTime=0, dropStart=0;
  let running=false, raf=0, kills=0, ammo=30, reserve=150, reloadUntil=0, fireCooldown=0, elapsed=0, stormRadius=195, stormTimer=0, medkits=2, health=100, shield=50, yaw=0, pitch=.12, jumpVelocity=0, grounded=true;
  const player = {position:new THREE.Vector3(0,2,0), velocity:new THREE.Vector3(), mesh:null, mixer:null};
  const mats = {};
  const textureLoader = new THREE.TextureLoader();
  const textureRoot = new URL("../assets/textures/", import.meta.url);
  function loadTexture(file, repeatX=1, repeatY=1){
    const texture=textureLoader.load(new URL(file,textureRoot).href);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(repeatX,repeatY);
    return texture;
  }
  const textures={grass:loadTexture("grass.svg",18,18),sand:loadTexture("sand.svg",12,12),water:loadTexture("water.svg",8,8),bus:loadTexture("battle-bus.svg",2,1),player:loadTexture("player-suit.svg"),heal:loadTexture("healing-item.svg"),rock:loadTexture("block-rock.svg")};
  const mat=(color,roughness=.88,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  mats.grass=mat(0xffffff); mats.grass.map=textures.grass; mats.darkGrass=mat(0x477a42); mats.sand=mat(0xffffff); mats.sand.map=textures.sand;
  mats.bark=mat(0x765039); mats.leaf=mat(0x2e7042); mats.leaf2=mat(0x4a914e); mats.rock=mat(0xffffff);mats.rock.map=textures.rock;
  mats.roof=mat(0x9b5742); mats.wall=mat(0xd7c7a5);
  mats.blue=mat(0x397fc0,.55); mats.red=mat(0xc94f45,.6); mats.yellow=mat(0xf1c84a,.5);
  const box=(w,h,d,material,x,y,z,group=scene)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
  function terrainHeight(x,z){return Math.sin(x*.025)*2.1+Math.cos(z*.031)*1.7+Math.sin((x+z)*.018)*1.4+Math.max(0,1-Math.hypot(x+65,z-75)/115)*10;}
  function makeTerrain(){
    const geo=new THREE.PlaneGeometry(world.size,world.size,100,100);geo.rotateX(-Math.PI/2);
    const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrainHeight(x,z));}
    geo.computeVertexNormals();
    const ground=new THREE.Mesh(geo,mats.grass);ground.receiveShadow=true;scene.add(ground);groundTargets.push(ground);
    const beach=new THREE.Mesh(new THREE.CircleGeometry(204,96),mats.sand);beach.rotation.x=-Math.PI/2;beach.position.y=-.45;scene.add(beach);
    const waterMat=new THREE.MeshStandardMaterial({color:0xffffff,map:textures.water,roughness:.3,metalness:.12});const water=new THREE.Mesh(new THREE.PlaneGeometry(900,900),waterMat);
    water.rotation.x=-Math.PI/2;water.position.y=-1.1;scene.add(water);
    const patchGeo=new THREE.CircleGeometry(1,10);
    for(let i=0;i<230;i++){const x=THREE.MathUtils.randFloatSpread(385),z=THREE.MathUtils.randFloatSpread(385);if(Math.hypot(x,z)>198)continue;const patch=new THREE.Mesh(patchGeo, i%3?mats.darkGrass:mats.grass);patch.rotation.x=-Math.PI/2;patch.scale.set(THREE.MathUtils.randFloat(1,4),THREE.MathUtils.randFloat(1,3),1);patch.position.set(x,terrainHeight(x,z)+.04,z);scene.add(patch);}
  }
  function makeTree(x,z,scale=1){
    const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.scale.setScalar(scale);
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,4,7),mats.bark);trunk.position.y=2;trunk.castShadow=true;g.add(trunk);
    for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry(2.3-i*.25,4.2,7),i%2?mats.leaf:mats.leaf2);crown.position.y=4.3+i*1.35;crown.castShadow=true;g.add(crown);}
    scene.add(g);trees.push(g);solidBlockers.push(...g.children);
  }
  function makeHouse(x,z,rot=0,scale=1){
    const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);
    box(12,6,10,mats.wall,0,3,0,g);
    const roof= new THREE.Mesh(new THREE.ConeGeometry(9,4.2,4),mats.roof);roof.position.y=8;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
    box(2.1,3.5,.18,mats.bark,0,1.75,5.08,g);
    for(const side of [-1,1]){const win=box(1.8,1.5,.2,mats.blue,side*3.5,3.8,5.1,g);win.material=new THREE.MeshStandardMaterial({color:0x70b9dc,roughness:.25,metalness:.2});}
    scene.add(g);groundTargets.push(...g.children.filter(o=>o.isMesh));solidBlockers.push(...g.children.filter(o=>o.isMesh));return g;
  }
  function makeWorld(){
    makeTerrain();
    for(let i=0;i<105;i++){const x=THREE.MathUtils.randFloatSpread(385),z=THREE.MathUtils.randFloatSpread(385);if(Math.hypot(x,z)>194||Math.hypot(x,z)<23)continue;makeTree(x,z,THREE.MathUtils.randFloat(.75,1.35));}
    [[-78,-64,.4,1],[-112,48,1.1,.85],[75,-96,.8,1.1],[110,54,-.5,1],[-12,115,.3,.9],[145,-8,1.4,.75]].forEach(v=>makeHouse(...v));
    for(let i=0;i<46;i++){const x=THREE.MathUtils.randFloatSpread(370),z=THREE.MathUtils.randFloatSpread(370);if(Math.hypot(x,z)>190)continue;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(1,3),0),mats.rock);rock.position.set(x,terrainHeight(x,z)+1,z);rock.scale.y=.7;rock.castShadow=true;scene.add(rock);solidBlockers.push(rock);}
    const islandRing=new THREE.Mesh(new THREE.TorusGeometry(199,.65,8,128),new THREE.MeshStandardMaterial({color:0x4ed6ed,emissive:0x137eaa,emissiveIntensity:1.2}));islandRing.rotation.x=Math.PI/2;islandRing.position.y=1;scene.add(islandRing);
    stormRing=new THREE.Mesh(new THREE.TorusGeometry(195,.85,8,160),new THREE.MeshBasicMaterial({color:0x43d9ff,transparent:true,opacity:.88}));stormRing.rotation.x=Math.PI/2;stormRing.position.y=3.5;scene.add(stormRing);
    battleBus=makeBattleBus();glider=makeGlider();
  }

  function makeBattleBus(){
    const bus=new THREE.Group();
    const blue=mat(0xffffff,.48);blue.map=textures.bus;const light=mat(0xd9efff,.25,.12),rubber=mat(0x17202b),yellow=mat(0xf3c83e,.4);
    box(12,4.4,5.3,blue,0,0,0,bus);
    box(12.2,.35,5.5,yellow,0,-1.65,0,bus);
    box(12.1,.35,5.5,blue,0,2.25,0,bus);
    box(2.4,1.1,1.2,blue,0,-.45,3.05,bus);box(12.8,.32,.45,yellow,0,-1.55,2.8,bus);
    for(let i=-2;i<=2;i++)box(1.65,1.5,.12,light,i*2.05,.35,2.68,bus);
    for(let i=-2;i<=2;i++)box(1.65,1.5,.12,light,i*2.05,.35,-2.68,bus);
    for(let x of [-4.2,4.2])for(let z of [-2.45,2.45]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.45,16),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,-2,z);bus.add(wheel);}
    const balloon=new THREE.Mesh(new THREE.SphereGeometry(6.8,24,18),new THREE.MeshStandardMaterial({color:0x3c91e8,roughness:.48,metalness:.05}));balloon.position.y=10;balloon.scale.set(1.12,1.28,1.12);balloon.castShadow=true;bus.add(balloon);
    const stripe=new THREE.Mesh(new THREE.TorusGeometry(6.5,.22,8,32),yellow);stripe.position.y=10;stripe.rotation.x=Math.PI/2;bus.add(stripe);
    for(let x of [-3.7,3.7]){const cable=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,7,6),rubber);cable.position.set(x,6.3,0);bus.add(cable);}
    const lamp=new THREE.PointLight(0x8bd9ff,35,38);lamp.position.set(0,7,0);bus.add(lamp);
    bus.position.set(-220,88,0);bus.rotation.y=Math.PI/2;scene.add(bus);return bus;
  }
  function makeGlider(){
    const g=new THREE.Group();const wing=new THREE.Mesh(new THREE.BoxGeometry(11,.25,3.2),new THREE.MeshStandardMaterial({color:0xe8eaf0,roughness:.5,side:THREE.DoubleSide}));wing.position.y=6.4;wing.castShadow=true;g.add(wing);
    const canopy=new THREE.Mesh(new THREE.SphereGeometry(2.1,16,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x4bb7e8,transparent:true,opacity:.9,metalness:.12,roughness:.2,side:THREE.DoubleSide}));canopy.scale.set(2.4,.75,1.5);canopy.position.y=6.5;g.add(canopy);
    for(const x of [-3.5,3.5]){const rope=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,5.6,5),new THREE.MeshStandardMaterial({color:0x29384a}));rope.position.set(x,3.7,0);g.add(rope);}
    g.visible=false;scene.add(g);return g;
  }
  function setPhase(title,sub){const el=$("brPhase");if(el){el.querySelector("strong").textContent=title;el.querySelector("span").textContent=sub;}}
  function jumpFromBus(){
    if(!running||phase!=="bus")return;
    phase="glide";phaseTime=0;dropStart=performance.now();player.position.set(battleBus.position.x, battleBus.position.y-5, battleBus.position.z);
    if(glider){glider.visible=true;glider.position.copy(player.position);glider.position.y+=1;}
    $("brDropBtn").style.display="none";setPhase("DEPLOYING GLIDER","Steer toward your landing spot");hud.hint.textContent=mobileMode?"Left stick: steer · Drag screen: look · FIRE to shoot after landing":"WASD: steer · Mouse: look · Glider opens automatically";
    yaw=Math.PI/2;pitch=.28;
  }
  function character(color,isPlayer=false){
    const group=new THREE.Group(),bodyMat=mat(color,.55),skin=mat(0xf0c6a0),dark=mat(0x172437,.6);if(color===0x347bd1)bodyMat.map=textures.player;
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.68,.95,4,8),bodyMat);torso.position.y=1.65;torso.castShadow=true;group.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.43,12,10),skin);head.position.y=2.65;head.castShadow=true;group.add(head);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.8,.95,.35),dark);pack.position.set(0,1.65,-.58);group.add(pack);
    for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.65,3,6),dark);leg.position.set(side*.3,.52,0);leg.castShadow=true;group.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.72,3,6),bodyMat);arm.position.set(side*.78,1.75,-.05);arm.rotation.z=side*.12;group.add(arm);}
    const gun=box(.18,.16,1.2,mat(0x252b31,.4,.65),0,1.8,.75,group);gun.rotation.x=-.08;
    if(isPlayer){const marker=new THREE.Mesh(new THREE.TorusGeometry(.72,.055,6,24),new THREE.MeshBasicMaterial({color:0x65d9ff}));marker.rotation.x=Math.PI/2;marker.position.y=.07;group.add(marker);}
    return group;
  }
  function spawnBots(){
    for(let i=0;i<12;i++){let x,z;do{x=THREE.MathUtils.randFloatSpread(320);z=THREE.MathUtils.randFloatSpread(320);}while(Math.hypot(x,z)<42);const mesh=character([0xef785a,0xd8b84f,0x9d8ce2,0x59b9a0][i%4]);mesh.position.set(x,terrainHeight(x,z),z);scene.add(mesh);bots.push({mesh,hp:100,alive:true,fire:THREE.MathUtils.randFloat(1,3),wander:Math.random()*6,target:new THREE.Vector3(x,0,z),speed:THREE.MathUtils.randFloat(3.1,4.8),color:0xff765d});}
  }
  function spawnPickups(){
    const types=["ammo","shield","med","ammo","shield","ammo"];
    for(let i=0;i<34;i++){const x=THREE.MathUtils.randFloatSpread(350),z=THREE.MathUtils.randFloatSpread(350),type=types[i%types.length];const color=type==="ammo"?0xf4c84b:type==="shield"?0x4dbdff:0x5de18b;const g=new THREE.Group();const gemMat=new THREE.MeshStandardMaterial({color:type==="med"?0xffffff:color,map:type==="med"?textures.heal:null,emissive:color,emissiveIntensity:.45,metalness:.25,roughness:.3});const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.8,0),gemMat);gem.position.y=1.2;gem.castShadow=true;g.add(gem);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.07,6,20),new THREE.MeshBasicMaterial({color}));ring.rotation.x=Math.PI/2;ring.position.y=.25;g.add(ring);g.position.set(x,terrainHeight(x,z),z);scene.add(g);pickups.push({group:g,type,active:true,x,z});}
  }
  function reset(){
    for(const b of bots)scene.remove(b.mesh);bots.length=0;
    for(const p of pickups)scene.remove(p.group);pickups.length=0;
    for(const b of builds){scene.remove(b.mesh);const blockerIndex=solidBlockers.indexOf(b.mesh);if(blockerIndex>=0)solidBlockers.splice(blockerIndex,1);}builds.length=0;
    bullets.forEach(b=>scene.remove(b.mesh));bullets.length=0;
    kills=0;phase="bus";phaseTime=0;ammo=30;reserve=150;reloadUntil=0;fireCooldown=0;elapsed=0;stormRadius=195;stormTimer=0;medkits=2;health=100;shield=50;yaw=0;pitch=.12;jumpVelocity=0;grounded=true;
    player.position.set(-220,84,0);if(battleBus)battleBus.position.set(-220,88,0);if(glider)glider.visible=false;
    if(player.mesh)scene.remove(player.mesh);player.mesh=character(0x347bd1,true);scene.add(player.mesh);
    spawnBots();spawnPickups();hud.end.classList.remove("show");hud.hint.style.display="block";$("brDropBtn").style.display="block";$("brDropBtn").textContent="JUMP";setPhase("THE BATTLE BUS","Jump when you are ready · Auto-drop in 14s");updateHud();
  }
  function updateHud(){hud.kills.textContent=kills;hud.alive.textContent=1+bots.filter(b=>b.alive).length;hud.storm.textContent=Math.round(stormRadius/195*100)+"%";hud.ammo.textContent=reloadUntil>performance.now()?"RELOADING":ammo+" / "+reserve;hud.health.style.width=Math.max(0,health)+"%";hud.shield.style.width=Math.max(0,shield)+"%";}
  function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  function showEnd(win){running=false;document.exitPointerLock?.();$("brDropBtn").style.display="none";hud.endTitle.textContent=win?"VICTORY ROYALE":"ELIMINATED";hud.endText.textContent=win?"You secured the island with "+kills+" eliminations.":"You scored "+kills+" eliminations. Drop back in and try again.";hud.end.classList.add("show");}
  function damage(amount){let n=amount;if(shield>0){const used=Math.min(shield,n);shield-=used;n-=used;}health=Math.max(0,health-n);if(health<=0)showEnd(false);updateHud();}
  function addTracer(from,to,color=0xffdf86){const geo=new THREE.BufferGeometry().setFromPoints([from.clone(),to.clone()]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.9}));scene.add(line);setTimeout(()=>{scene.remove(line);geo.dispose();line.material.dispose();},95);}
  function shoot(){if(!running||reloadUntil>performance.now()||fireCooldown>0)return;if(ammo<=0){reload();return;}ammo--;fireCooldown=.14;
    const origin=camera.position.clone();const dir=new THREE.Vector3();camera.getWorldDirection(dir);const target=origin.clone().addScaledVector(dir,180);raycaster.set(origin,dir);raycaster.far=180;
    const targets=bots.filter(b=>b.alive).map(b=>b.mesh);const hits=raycaster.intersectObjects([...solidBlockers,...targets],true);
    let end=target;if(hits.length){const hit=hits[0];end=hit.point;let obj=hit.object;while(obj.parent&&!bots.some(b=>b.mesh===obj))obj=obj.parent;const bot=bots.find(b=>b.mesh===obj);if(bot){bot.hp-=34;if(bot.hp<=0){bot.alive=false;scene.remove(bot.mesh);kills++;if(Math.random()<.7)dropPickup(bot.mesh.position.x,bot.mesh.position.z,"ammo");}}}
    addTracer(origin,end);updateHud();
  }
  function dropPickup(x,z,type){const color=type==="ammo"?0xf4c84b:0x5de18b;const g=new THREE.Group();const m=new THREE.Mesh(new THREE.OctahedronGeometry(.8),new THREE.MeshStandardMaterial({color:type==="med"?0xffffff:color,map:type==="med"?textures.heal:null,emissive:color,emissiveIntensity:.4}));m.position.y=1;g.add(m);g.position.set(x,terrainHeight(x,z),z);scene.add(g);pickups.push({group:g,type,active:true,x,z});}
  function reload(){if(!running||reloadUntil>performance.now()||ammo===30||reserve<=0)return;reloadUntil=performance.now()+1150;setTimeout(()=>{if(!running)return;const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloadUntil=0;updateHud();},1150);updateHud();}
  function build(){if(!running||builds.length>=24)return;const dir=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const pos=player.position.clone().addScaledVector(dir,3.8);pos.y=terrainHeight(pos.x,pos.z)+1.5;const mesh=box(5,3,.35,mats.blue,pos.x,pos.y,pos.z);mesh.rotation.y=yaw;builds.push({mesh,life:22});solidBlockers.push(mesh);}
  function hasLineOfSight(from,to){
    const origin=from.clone().add(new THREE.Vector3(0,1.8,0));
    const target=to.clone().add(new THREE.Vector3(0,1.55,0));
    const delta=target.sub(origin);const distance=delta.length();
    if(distance<.1)return true;
    raycaster.set(origin,delta.normalize());raycaster.near=.05;raycaster.far=Math.max(.05,distance-.45);
    const hit=raycaster.intersectObjects(solidBlockers,true)[0];
    raycaster.near=0;raycaster.far=Infinity;
    return !hit;
  }
  function heal(){if(!running||medkits<=0||health>=100)return;medkits--;health=Math.min(100,health+45);updateHud();}
  function jump(){if(running&&grounded){jumpVelocity=8.2;grounded=false;}}
  function collect(){for(const p of pickups){if(!p.active)continue;if(Math.hypot(p.x-player.position.x,p.z-player.position.z)<2.8){p.active=false;scene.remove(p.group);if(p.type==="ammo")reserve=Math.min(240,reserve+45);if(p.type==="shield")shield=Math.min(100,shield+25);if(p.type==="med")medkits=Math.min(5,medkits+1);updateHud();}}}
  function update(dt){
    elapsed+=dt;stormTimer+=dt;fireCooldown=Math.max(0,fireCooldown-dt);
    if(phase==="bus"){phaseTime+=dt;if(battleBus){battleBus.position.x=-220+Math.min(phaseTime/14,1)*440;battleBus.position.y=88+Math.sin(elapsed*1.7)*1.2;battleBus.position.z=Math.sin(elapsed*.3)*8;}player.position.set(battleBus?battleBus.position.x:-220,84,battleBus?battleBus.position.z:0);player.mesh.position.copy(player.position);player.mesh.rotation.y=Math.PI/2;camera.position.lerp(player.position.clone().add(new THREE.Vector3(0,13,28)),.06);camera.lookAt(player.position.clone().add(new THREE.Vector3(0,4,-12)));if(phaseTime>14)jumpFromBus();return;}
    if(phase==="glide"){phaseTime+=dt;const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));let mx=(keys.has("d")?1:0)-(keys.has("a")?1:0)+joystick.x;let mz=(keys.has("s")?1:0)-(keys.has("w")?1:0)+joystick.y;const steer=forward.multiplyScalar(-mz).add(right.multiplyScalar(mx));if(steer.lengthSq()>1)steer.normalize();player.position.addScaledVector(steer,19*dt);player.position.x=THREE.MathUtils.clamp(player.position.x,-198,198);player.position.z=THREE.MathUtils.clamp(player.position.z,-198,198);player.position.y-=10.5*dt;const floor=terrainHeight(player.position.x,player.position.z);if(glider){glider.position.copy(player.position);glider.position.y+=.2;glider.rotation.z=-mx*.12;}player.mesh.position.copy(player.position);player.mesh.rotation.y=yaw;camera.position.lerp(player.position.clone().add(new THREE.Vector3(Math.sin(yaw)*10,7,Math.cos(yaw)*10)),.08);camera.lookAt(player.position.clone().add(new THREE.Vector3(0,3,-8)));if(player.position.y<=floor+1.5){player.position.y=floor;phase="landed";if(glider)glider.visible=false;setPhase("LANDED","Good luck — survive the island");$("brDropBtn").style.display="none";hud.hint.textContent=mobileMode?"Left stick: move · Drag screen: aim · FIRE · BUILD · HEAL":"WASD move · Mouse aim · Click fire · Q build · R reload · E heal";}return;}
    if(reloadUntil&&performance.now()>=reloadUntil){const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloadUntil=0;}
    if(stormTimer>12){stormTimer=0;stormRadius=Math.max(38,stormRadius-12);if(stormRing)stormRing.scale.setScalar(stormRadius/195);}
    const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    let mx=(keys.has("d")||keys.has("arrowright")?1:0)-(keys.has("a")||keys.has("arrowleft")?1:0)+joystick.x;
    let mz=(keys.has("s")||keys.has("arrowdown")?1:0)-(keys.has("w")||keys.has("arrowup")?1:0)+joystick.y;
    const move=forward.multiplyScalar(-mz).add(right.multiplyScalar(mx));if(move.lengthSq()>1)move.normalize();
    const speed=(keys.has("shift")?13.5:8.2);player.position.addScaledVector(move,speed*dt);
    player.position.x=THREE.MathUtils.clamp(player.position.x,-198,198);player.position.z=THREE.MathUtils.clamp(player.position.z,-198,198);
    const floor=terrainHeight(player.position.x,player.position.z);
    if(!grounded){jumpVelocity-=22*dt;player.position.y+=jumpVelocity*dt;if(player.position.y<=floor){player.position.y=floor;grounded=true;jumpVelocity=0;}}
    else player.position.y=floor;
    player.mesh.position.copy(player.position);player.mesh.rotation.y=yaw;
    const desired=camera.position.copy(player.position).add(new THREE.Vector3(Math.sin(yaw)*7,4.1+pitch*9,Math.cos(yaw)*7));
    camera.position.lerp(desired,.22);const look=player.position.clone().add(new THREE.Vector3(-Math.sin(yaw)*10,2.1+pitch*10,-Math.cos(yaw)*10));camera.lookAt(look);
    if(phase==="landed"&&pointer.fire)shoot();
    for(const b of bots){if(!b.alive||phase!=="landed")continue;const pos=b.mesh.position,dx=player.position.x-pos.x,dz=player.position.z-pos.z,d=Math.hypot(dx,dz);b.fire-=dt;
      if(d>11){pos.x+=dx/(d||1)*b.speed*dt;pos.z+=dz/(d||1)*b.speed*dt;}else if(d<7){pos.x-=dx/(d||1)*b.speed*.65*dt;pos.z-=dz/(d||1)*b.speed*.65*dt;}
      if(d<65&&b.fire<=0&&hasLineOfSight(pos,player.position)){b.fire=THREE.MathUtils.randFloat(1.1,2.2);damage(THREE.MathUtils.randFloat(4,9));}
      pos.y=terrainHeight(pos.x,pos.z);b.mesh.rotation.y=Math.atan2(dx,dz);
    }
    for(const p of pickups)if(p.active){p.group.rotation.y+=dt*1.4;p.group.position.y=terrainHeight(p.x,p.z)+.25+Math.sin(elapsed*2+p.x)*.18;}
    for(let i=builds.length-1;i>=0;i--){builds[i].life-=dt;if(builds[i].life<=0){scene.remove(builds[i].mesh);const blockerIndex=solidBlockers.indexOf(builds[i].mesh);if(blockerIndex>=0)solidBlockers.splice(blockerIndex,1);builds.splice(i,1);}}
    collect();
    if(phase==="landed"&&Math.hypot(player.position.x,player.position.z)>stormRadius)damage(7*dt);
    if(bots.every(b=>!b.alive))showEnd(true);
    updateHud();
  }
  function frame(){if(!running)return;const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera);raf=requestAnimationFrame(frame);}
  function start(){if(running)return;root.classList.add("active");running=true;clock.start();reset();resize();camera.position.set(-220,100,30);frame();}
  function stop(){running=false;cancelAnimationFrame(raf);root.classList.remove("active");pointer.fire=false;keys.clear();joystick.x=joystick.y=0;document.exitPointerLock?.();}
  canvas.addEventListener("click",()=>{if(running&&matchMedia("(pointer:fine)").matches&&!pointer.locked)canvas.requestPointerLock?.();});
  document.addEventListener("pointerlockchange",()=>{pointer.locked=document.pointerLockElement===canvas;});
  document.addEventListener("mousemove",e=>{if(!running||!pointer.locked)return;yaw-=e.movementX*.0025;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018,-.35,.65);});
  canvas.addEventListener("pointerdown",e=>{if(!running)return;if(e.pointerType==="mouse"){pointer.fire=true;}else if(pointer.lookId===null){pointer.lookId=e.pointerId;pointer.lastX=e.clientX;pointer.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener("pointermove",e=>{if(e.pointerId===pointer.lookId){yaw-=(e.clientX-pointer.lastX)*.006;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-pointer.lastY)*.004,-.35,.65);pointer.lastX=e.clientX;pointer.lastY=e.clientY;}});
  const releaseLook=e=>{if(e.pointerId===pointer.lookId)pointer.lookId=null;pointer.fire=false;};canvas.addEventListener("pointerup",releaseLook);canvas.addEventListener("pointercancel",releaseLook);
  window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(!running)return;if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," ","shift","q","e","r"].includes(k))e.preventDefault();keys.add(k);if(k==="q")build();if(k==="e")heal();if(k==="r")reload();if(k===" ")jump();});
  window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
  const joyRoot=$("brJoystick"),stick=$("brStick");
  function moveJoy(e){const r=joyRoot.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),s=Math.min(1,42/(len||1));joystick.x=dx*s/42;joystick.y=dy*s/42;stick.style.transform="translate("+joystick.x*30+"px,"+joystick.y*30+"px)";}
  joyRoot.addEventListener("pointerdown",e=>{e.preventDefault();joystick.id=e.pointerId;joyRoot.setPointerCapture(e.pointerId);moveJoy(e);});
  joyRoot.addEventListener("pointermove",e=>{if(e.pointerId===joystick.id)moveJoy(e);});
  const endJoy=e=>{if(e.pointerId!==joystick.id)return;joystick.id=null;joystick.x=joystick.y=0;stick.style.transform="";};joyRoot.addEventListener("pointerup",endJoy);joyRoot.addEventListener("pointercancel",endJoy);
  document.querySelectorAll("[data-br]").forEach(btn=>{const action=btn.dataset.br;btn.addEventListener("pointerdown",e=>{e.preventDefault();if(action==="fire"){pointer.fire=true;shoot();}if(action==="build")build();if(action==="heal")heal();if(action==="jump"){if(phase==="bus")jumpFromBus();else if(phase==="landed")jump();}});btn.addEventListener("pointerup",()=>{if(action==="fire")pointer.fire=false;});btn.addEventListener("pointercancel",()=>{if(action==="fire")pointer.fire=false;});});
  $("brDropBtn").addEventListener("click",jumpFromBus);
  $("brExit").addEventListener("click",stop);$("brBack").addEventListener("click",stop);$("brAgain").addEventListener("click",()=>{running=false;start();});
  window.addEventListener("resize",resize);
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&running){pointer.fire=false;keys.clear();}});
  window.BattleZonePractice={start,stop};
  makeWorld();
  window.addEventListener("pagehide",()=>{stop();renderer.dispose();},{once:true});
})();
