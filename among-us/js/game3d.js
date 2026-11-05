const MAPS = {
  skeld:{title:"THE SKELD",floor:0x24394b,wall:0x8ca8b8,accent:0x55c9df,sky:0x081321,rooms:["CAFETERIA","WEAPONS","O2","NAVIGATION","SHIELDS","COMMS","STORAGE","ADMIN","ELECTRICAL","SECURITY","MEDBAY","REACTOR","UPPER ENGINE","LOWER ENGINE"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245],[280,345],[410,345]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[9,12],[10,13],[5,9],[1,6]]},
  mira:{title:"MIRA HQ",floor:0x493b56,wall:0xb8a1c9,accent:0xe39be0,sky:0x171020,rooms:["LAUNCHPAD","MEDBAY","LOCKER ROOM","CAFETERIA","BALCONY","OFFICE","ADMIN","GREENHOUSE","REACTOR","LABORATORY","DECONTAM","COMMS"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[2,6],[5,9]]},
  polus:{title:"POLUS",floor:0x344b54,wall:0xa8c5c9,accent:0x75e0e5,sky:0x10232c,rooms:["DROPSHIP","ELECTRICAL","O2","COMMS","WEAPONS","OFFICE","ADMIN","LABORATORY","MEDBAY","STORAGE","SECURITY","SPECIMEN"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[5,9],[6,10]]},
  airship:{title:"THE AIRSHIP",floor:0x4a3b35,wall:0xc5a77d,accent:0xffbd69,sky:0x1b1110,rooms:["COCKPIT","ARMORY","BRIG","RECORDS","MEETING","MAIN HALL","KITCHEN","ENGINE","ELECTRICAL","VAULT","SHOWERS","CARGO","COMMS","MEDICAL"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245],[280,345],[410,345]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11],[9,12],[10,13],[5,9],[6,10]]},
  fungle:{title:"THE FUNGLE",floor:0x294c3d,wall:0x8fc09a,accent:0x8ef0a8,sky:0x0a211b,rooms:["BEACH","SPLASH ZONE","CAFETERIA","STORAGE","LAB","KITCHEN","JUNGLE","GREENHOUSE","LOOKOUT","REACTOR","COMMS","MINING PIT"],nodes:[[150,45],[280,45],[410,45],[535,45],[150,145],[280,145],[410,145],[535,145],[150,245],[280,245],[410,245],[535,245]],edges:[[0,1],[1,2],[2,3],[0,4],[4,5],[5,6],[6,7],[7,3],[4,8],[8,9],[9,10],[10,11]]}
};

export async function start3DGame(mapId, options={}) {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  const map = MAPS[mapId] || MAPS.skeld;
  const host = document.createElement("div");
  host.className = "vf3d-shell";
  host.innerHTML = `
    <div class="vf3d-top"><div><span class="vf3d-kicker">VOIDFORGE // FREEPLAY</span><strong>${map.title}</strong></div><div class="vf3d-stats"><span id="vf3d-room">Loading deck…</span><span id="vf3d-progress">TASKS 0 / 3</span></div><button class="vf3d-exit" type="button">EXIT</button></div>
    <div class="vf3d-view"><canvas aria-label="Playable 3D spaceship map"></canvas><div class="vf3d-hint" aria-live="polite">WASD / ARROWS TO MOVE · E TO INTERACT</div><div class="vf3d-center" hidden></div>
      <div class="vf3d-controls"><div class="vf3d-pad"><button data-move="forward" aria-label="Move forward">▲</button><div><button data-move="left" aria-label="Move left">◀</button><button data-move="back" aria-label="Move backward">▼</button><button data-move="right" aria-label="Move right">▶</button></div></div><button class="vf3d-use" type="button">USE</button></div>
    </div>
    <div class="vf3d-bottom"><span>EXPLORE THE ROOMS AND REPAIR THE PANELS</span><span id="vf3d-taskname">No task nearby</span></div>`;
  document.body.append(host);
  const canvas=host.querySelector("canvas"), view=host.querySelector(".vf3d-view"), hint=host.querySelector(".vf3d-hint");
  let renderer,scene,camera,raf=0,disposed=false,completed=0,activeTask=null,nearTask=null;
  const keys=new Set(),touch=new Set(),colliders=[],taskObjects=[],clock=new THREE.Clock();
  const sceneColor=map.sky;
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));renderer.setSize(view.clientWidth,view.clientHeight);
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    scene=new THREE.Scene();scene.background=new THREE.Color(sceneColor);scene.fog=new THREE.Fog(sceneColor,38,95);
    camera=new THREE.PerspectiveCamera(58,view.clientWidth/view.clientHeight,.1,180);
    scene.add(new THREE.HemisphereLight(0xc5e9ff,0x17202a,2.0));
    const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
    const fill=new THREE.PointLight(map.accent,28,45);fill.position.set(0,8,0);scene.add(fill);
    const floorMat=new THREE.MeshStandardMaterial({color:map.floor,roughness:.86});
    const wallMat=new THREE.MeshStandardMaterial({color:map.wall,roughness:.72});
    const trimMat=new THREE.MeshStandardMaterial({color:map.accent,metalness:.25,roughness:.35});
    const darkMat=new THREE.MeshStandardMaterial({color:0x15202b,roughness:.9});
    const box=(w,h,d,mat,x,y,z,cast=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;};
    const pts=map.nodes.map(([x,z])=>({x:(x-340)*.075,z:(z-200)*.075}));
    const adj=map.nodes.map(()=>[]);
    map.edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
    // Room floors, corridor floors, and walls with real door openings.
    const rw=8.6,rd=7.4,wallH=3.25,thick=.42,door=3.2;
    pts.forEach((p,i)=>{
      const floor=box(rw,.35,rd,floorMat,p.x,-.2,p.z,false);
      box(rw,.12,rd,trimMat,p.x,-.42,p.z,false);
      // Floor markings and central light.
      for(let k=-1;k<=1;k++)box(.08,.018,rd-1,new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.1}),p.x+k*2.5,-.015,p.z,false);
      box(1.8,.09,.16,trimMat,p.x,2.45,p.z-rd/2+.3,false);
      const sides=[{dx:0,dz:-1},{dx:1,dz:0},{dx:0,dz:1},{dx:-1,dz:0}];
      sides.forEach(s=>{
        const neighbor=adj[i].find(j=>Math.abs(pts[j].x-p.x-s.dx*1)<Math.abs(pts[j].z-p.z-s.dz*1)+.01 && Math.abs((pts[j].x-p.x)*s.dz-(pts[j].z-p.z)*s.dx)<.2);
        // Only open a wall when an edge points in this direction.
        const linked=adj[i].some(j=>{const q=pts[j],vx=q.x-p.x,vz=q.z-p.z;return (s.dx!==0?Math.sign(vx)===s.dx&&Math.abs(vx)>Math.abs(vz)*1.1:Math.sign(vz)===s.dz&&Math.abs(vz)>Math.abs(vx)*1.1);});
        const horizontal=s.dx===0;
        const wallLen=horizontal?rw:rd;
        const centerX=p.x+s.dx*(rw/2),centerZ=p.z+s.dz*(rd/2);
        const makeWall=(len,offset)=>{
          if(horizontal) {box(len,wallH,thick,wallMat,p.x+offset,wallH/2-.05,centerZ);colliders.push({x:p.x+offset,z:centerZ,w:len,d:thick});}
          else {box(thick,wallH,len,wallMat,centerX,wallH/2-.05,p.z+offset);colliders.push({x:centerX,z:p.z+offset,w:thick,d:len});}
        };
        if(linked){makeWall((wallLen-door)/2,-(wallLen+door)/4);makeWall((wallLen-door)/2,(wallLen+door)/4);}
        else makeWall(wallLen,0);
      });
      // Room name plaque.
      const plaque=box(2.4,.12,.42,darkMat,p.x,2.65,p.z-rd/2+.7,false);
      const signCanvas=document.createElement("canvas");signCanvas.width=512;signCanvas.height=128;
      const ctx=signCanvas.getContext("2d");ctx.fillStyle="#dff8ff";ctx.font="bold 48px Arial";ctx.textAlign="center";ctx.fillText(map.rooms[i],256,82);
      const tex=new THREE.CanvasTexture(signCanvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.25,.56),new THREE.MeshBasicMaterial({map:tex,transparent:true}));sign.position.set(p.x,2.7,p.z-rd/2+.47);scene.add(sign);
      // Consoles, lockers and crates make every chamber distinct.
      for(let n=0;n<2;n++){const x=p.x+(n?2.6:-2.6),z=p.z+1.5;box(1.35,1.1,1.0,darkMat,x,.55,z);box(1.12,.12,.78,trimMat,x,1.12,z,false);}
      const lamp= new THREE.PointLight(map.accent,4,9);lamp.position.set(p.x,2.4,p.z);scene.add(lamp);
    });
    // Join room centers with walkable corridor floor strips.
    map.edges.forEach(([a,b])=>{
      const p=pts[a],q=pts[b],dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)-Math.min(rw,rd);
      const horizontal=Math.abs(dx)>Math.abs(dz);
      const cx=(p.x+q.x)/2,cz=(p.z+q.z)/2;
      const corridor=box(horizontal?Math.max(1,len+1):door,.28,horizontal?door:Math.max(1,len+1),floorMat,cx,-.2,cz,false);
      box(horizontal?Math.max(1,len+1):.16,.08,horizontal? .16:Math.max(1,len+1),trimMat,cx,-.03,cz,false);
    });
    // Outside deck / ambient stars.
    const ground=box(160,.5,130,new THREE.MeshStandardMaterial({color:0x070d16,roughness:1}),0,-2.4,0,false);
    const grid=new THREE.GridHelper(150,75,0x34516a,0x1b3045);grid.position.y=-2.12;scene.add(grid);
    for(let i=0;i<80;i++){const star=new THREE.Mesh(new THREE.SphereGeometry(.045,5,5),new THREE.MeshBasicMaterial({color:0x9bc8e8}));star.position.set((Math.random()-.5)*110,5+Math.random()*30,(Math.random()-.5)*90);scene.add(star);}
    // Player crewmate.
    const player=new THREE.Group();scene.add(player);
    const bodyMat=new THREE.MeshStandardMaterial({color:options.color||0xe94d55,roughness:.48,metalness:.08});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.62,.85,5,10),bodyMat);body.position.y=1.05;body.castShadow=true;player.add(body);
    const visor=new THREE.Mesh(new THREE.BoxGeometry(.95,.48,.18),new THREE.MeshStandardMaterial({color:0x9ce8f7,metalness:.3,roughness:.18}));visor.position.set(0,1.32,.53);player.add(visor);
    const visorShine=new THREE.Mesh(new THREE.BoxGeometry(.45,.08,.025),new THREE.MeshBasicMaterial({color:0xffffff}));visorShine.position.set(-.08,1.48,.635);player.add(visorShine);
    const pack=new THREE.Mesh(new THREE.BoxGeometry(.48,.9,.48),bodyMat);pack.position.set(-.58,.95,-.05);player.add(pack);
    const start=pts[0];player.position.set(start.x,0,start.z);
    // Three repair consoles, distributed across reachable rooms.
    const taskIndexes=[Math.floor(pts.length*.28),Math.floor(pts.length*.62),Math.max(1,pts.length-2)];
    taskIndexes.forEach((roomIndex,i)=>{
      const p=pts[roomIndex],g=new THREE.Group();g.position.set(p.x+(i%2?2.4:-2.4),0,p.z+(i===1?-1.7:1.7));scene.add(g);
      const pedestal=new THREE.Mesh(new THREE.BoxGeometry(1.15,1.1,.8),darkMat);pedestal.position.y=.55;g.add(pedestal);
      const screen=new THREE.Mesh(new THREE.BoxGeometry(1.0,.65,.12),new THREE.MeshStandardMaterial({color:0x173d4a,emissive:map.accent,emissiveIntensity:.35}));screen.position.set(0,1.25,.4);g.add(screen);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.055,8,24),new THREE.MeshBasicMaterial({color:map.accent}));ring.position.y=1.25;g.add(ring);
      taskObjects.push({group:g,done:false,index:i,label:["RESTORE POWER","CALIBRATE SYSTEM","UPLOAD DATA"][i]});
    });
    const updateHud=()=>{
      host.querySelector("#vf3d-progress").textContent="TASKS "+completed+" / 3";
      host.querySelector("#vf3d-room").textContent=roomNameAt(player.position);
      host.querySelector("#vf3d-taskname").textContent=nearTask?(nearTask.done?"Completed":nearTask.label+" · press E / USE"):"Find a glowing repair console";
    };
    function roomNameAt(pos){let best=0,dist=Infinity;pts.forEach((p,i)=>{const d=(p.x-pos.x)**2+(p.z-pos.z)**2;if(d<dist){dist=d;best=i;}});return map.rooms[best];}
    function attemptUse(){
      if(!nearTask||nearTask.done){hint.textContent="Move close to a glowing console to interact.";return;}
      nearTask.done=true;completed++;nearTask.group.scale.setScalar(.75);nearTask.group.children.forEach(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(0x164c2c);});
      hint.textContent=completed===3?"ALL REPAIRS COMPLETE — GREAT WORK!":"Repair complete. Find the next console.";
      updateHud();
      if(completed===3){host.querySelector(".vf3d-center").hidden=false;host.querySelector(".vf3d-center").textContent="MISSION COMPLETE";host.querySelector(".vf3d-center").classList.add("show");}
    }
    const keydown=e=>{if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyE","Space"].includes(e.code)){e.preventDefault();keys.add(e.code);if(e.code==="KeyE"&&!e.repeat)attemptUse();}};
    const keyup=e=>keys.delete(e.code);
    window.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);
    host.querySelectorAll("[data-move]").forEach(btn=>{
      const dir=btn.dataset.move;
      const down=e=>{e.preventDefault();touch.add(dir);};const up=e=>{e.preventDefault();touch.delete(dir);};
      btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",up);btn.addEventListener("pointerleave",up);
    });
    host.querySelector(".vf3d-use").addEventListener("click",attemptUse);
    const close=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(raf);window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);renderer.dispose();host.remove();};
    host.querySelector(".vf3d-exit").addEventListener("click",close);
    const resize=()=>{if(disposed)return;const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(view);
    function blocked(x,z){return colliders.some(c=>Math.abs(x-c.x)<c.w/2+.48&&Math.abs(z-c.z)<c.d/2+.48);}
    function loop(){
      if(disposed)return;raf=requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.045);
      let mx=0,mz=0;
      if(keys.has("KeyW")||keys.has("ArrowUp")||touch.has("forward"))mz-=1;
      if(keys.has("KeyS")||keys.has("ArrowDown")||touch.has("back"))mz+=1;
      if(keys.has("KeyA")||keys.has("ArrowLeft")||touch.has("left"))mx-=1;
      if(keys.has("KeyD")||keys.has("ArrowRight")||touch.has("right"))mx+=1;
      const mag=Math.hypot(mx,mz)||1;mx/=mag;mz/=mag;
      const speed=7.2*dt, nx=player.position.x+mx*speed,nz=player.position.z+mz*speed;
      if(!blocked(nx,player.position.z))player.position.x=nx;
      if(!blocked(player.position.x,nz))player.position.z=nz;
      if(mx||mz)player.rotation.y=Math.atan2(mx,mz);
      body.position.y=1.05+Math.sin(performance.now()*.008)*.035;
      nearTask=null;let best=3.0;
      taskObjects.forEach(t=>{const d=player.position.distanceTo(t.group.position);if(!t.done&&d<best){best=d;nearTask=t;}t.group.children[2].rotation.z+=dt*1.1;});
      taskObjects.forEach(t=>{if(!t.done)t.group.children[2].material.opacity=.7+.3*Math.sin(performance.now()*.005);});
      if(nearTask)hint.textContent="PRESS E OR USE TO "+nearTask.label;else if(completed<3)hint.textContent="WASD / ARROWS TO MOVE · FIND THE GLOWING CONSOLES";
      const target=new THREE.Vector3(player.position.x,2.4,player.position.z);
      const desired=new THREE.Vector3(player.position.x+9,8.5,player.position.z+11);
      camera.position.lerp(desired,1-Math.pow(.001,dt));camera.lookAt(target);
      updateHud();renderer.render(scene,camera);
    }
    loop();
    return {close};
  } catch(error) {
    host.remove();
    throw new Error("3D engine could not start: "+error.message);
  }
}
