import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js";
import { SHADER_TYPES, GLSL, enhanceScene, updateSceneShaderTime, createProceduralInstances, subdivideGeometry, createWebGPUComputeKernel, createCPUComputeFallback, createComputeKernel } from "./voidforge-gpu-shaders.js";

const STORAGE_KEY = "battlezone.visuals.v3";
const PRESETS = {
  low:    { pixelRatio:.82, bloom:.12, threshold:.94, strength:.12, radius:.12, sharpen:.08, saturation:1.02, contrast:1.025, vignette:.12, grain:0 },
  medium: { pixelRatio:1, bloom:.24, threshold:.9, strength:.24, radius:.22, sharpen:.14, saturation:1.08, contrast:1.05, vignette:.18, grain:.008 },
  high:   { pixelRatio:1.25, bloom:.48, threshold:.84, strength:.48, radius:.3, sharpen:.24, saturation:1.14, contrast:1.08, vignette:.25, grain:.014 },
  ultra:  { pixelRatio:1.5, bloom:.68, threshold:.78, strength:.68, radius:.38, sharpen:.32, saturation:1.2, contrast:1.11, vignette:.32, grain:.02 }
};
const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

function createCinematicShader(THREE) {
  return {
    uniforms: {
      tDiffuse:{value:null}, uResolution:{value:new THREE.Vector2(1,1)},
      uSaturation:{value:1.1}, uContrast:{value:1.06}, uSharpen:{value:.18},
      uVignette:{value:.22}, uGrain:{value:.01}, uTime:{value:0},
      uChromatic:{value:0}, uTemperature:{value:0}
    },
    vertexShader:`
      varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
    `,
    fragmentShader:`
      uniform sampler2D tDiffuse; uniform vec2 uResolution;
      uniform float uSaturation,uContrast,uSharpen,uVignette,uGrain,uTime,uChromatic,uTemperature;
      varying vec2 vUv;
      float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+uTime*17.0)*43758.5453);}
      void main(){
        vec2 px=1.0/max(uResolution,vec2(1.0));
        vec2 radial=vUv-vec2(.5);
        vec2 ca=radial*px*uChromatic*2.2;
        vec3 center=texture2D(tDiffuse,vUv).rgb;
        vec3 color=vec3(texture2D(tDiffuse,vUv+ca).r,center.g,texture2D(tDiffuse,vUv-ca).b);
        vec3 north=texture2D(tDiffuse,vUv+vec2(0.0,px.y)).rgb;
        vec3 south=texture2D(tDiffuse,vUv-vec2(0.0,px.y)).rgb;
        vec3 east=texture2D(tDiffuse,vUv+vec2(px.x,0.0)).rgb;
        vec3 west=texture2D(tDiffuse,vUv-vec2(px.x,0.0)).rgb;
        color+=(color*4.0-north-south-east-west)*uSharpen*.12;
        float lum=dot(color,vec3(.2126,.7152,.0722));
        color=mix(vec3(lum),color,uSaturation);
        color=(color-.5)*uContrast+.5;
        color.r+=uTemperature*.055; color.b-=uTemperature*.055;
        float vignette=1.0-smoothstep(.2,.9,length(radial)*1.55);
        color*=1.0-(1.0-vignette)*uVignette;
        color+=(noise(vUv*uResolution)-.5)*uGrain;
        gl_FragColor=vec4(max(color,0.0),1.0);
      }
    `
  };
}

function readSettings(storageKey) {
  const defaults={quality:"high",bloom:true,vignette:true,colorGrade:true,exposure:1.12,bloomStrength:null,saturation:null,contrast:null,sharpen:null,grain:null,chromatic:0,temperature:0,bloomThreshold:null,bloomRadius:null,renderScale:1,shadows:true,shadowQuality:"high"};
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||"{}");
    return {...defaults,...saved,quality:PRESETS[saved.quality]?saved.quality:defaults.quality,
      bloom:saved.bloom!==false,vignette:saved.vignette!==false,colorGrade:saved.colorGrade!==false,
      shadows:saved.shadows!==false,
      shadowQuality:["low","medium","high"].includes(saved.shadowQuality)?saved.shadowQuality:"high"};
  } catch { return defaults; }
}

function mountShaderPanel() {
  if (!document.body) return;
  let button=document.getElementById("inGameShadersButton");
  const buttonAlreadyExists=!!button;
  let panel=document.getElementById("inGameShadersPanel");
  if (buttonAlreadyExists) button.dataset.shaderExisting="1";
  if (!button) {
    button=document.createElement("button"); button.id="inGameShadersButton"; button.type="button";
    button.textContent="✦ Graphics"; button.setAttribute("aria-controls","inGameShadersPanel"); button.setAttribute("aria-expanded","false");
    document.body.append(button);
  }
  if (!panel) {
    panel=document.createElement("section"); panel.id="inGameShadersPanel"; panel.className="hidden";
    panel.innerHTML='<div class="shader-panel-head"><div><h2>Graphics &amp; Shaders</h2><div class="shader-panel-subtitle">Live visual controls · saved automatically</div></div><button id="closeShadersButton" type="button" aria-label="Close">×</button></div><div class="shader-panel-note">Tune lighting, image quality and cinematic effects while playing.</div>';
    document.body.append(panel);
  }
  if (!document.getElementById("closeShadersButton")) {
    const close=document.createElement("button"); close.id="closeShadersButton"; close.type="button"; close.textContent="×"; close.setAttribute("aria-label","Close"); panel.querySelector(".shader-panel-head")?.append(close);
  }
  if (!document.getElementById("brShaderQuality")) {
    const wrap=document.createElement("div"); wrap.className="option";
    wrap.innerHTML='<label for="brShaderQuality">Graphics quality</label><select id="brShaderQuality"><option value="low">Performance</option><option value="medium">Balanced</option><option value="high">Realistic</option><option value="ultra">Ultra realistic</option></select>';
    panel.append(wrap);
  }
  const groups=[
    {title:"LIGHT & BLOOM",items:[
      ["brShaderExposure","Exposure","range",.65,1.6,.01,1.12],
      ["brShaderBloomStrength","Bloom intensity","range",0,1.2,.01,.48],
      ["brShaderBloomThreshold","Bloom threshold","range",.55,1.2,.01,.84],
      ["brShaderBloomRadius","Bloom spread","range",0,1,.01,.3],
      ["brShaderBloom","Bloom glow","check",null,null,null,true]
    ]},
    {title:"COLOR & CINEMATIC",items:[
      ["brShaderSaturation","Saturation","range",0,2,.01,1.14],
      ["brShaderContrast","Contrast","range",.7,1.5,.01,1.08],
      ["brShaderTemperature","Color temperature","range",-1,1,.01,0],
      ["brShaderSharpness","Sharpness","range",0,.8,.01,.24],
      ["brShaderChromatic","Chromatic aberration","range",0,1,.01,0],
      ["brShaderGrain","Film grain","range",0,.08,.001,.014],
      ["brShaderVignette","Cinematic vignette","check",null,null,null,true],
      ["brShaderColorGrade","Cinematic color grading","check",null,null,null,true]
    ]},
    {title:"WORLD QUALITY",items:[
      ["brShaderRenderScale","Render resolution","range",.65,1.15,.01,1],
      ["brShaderShadows","Dynamic shadows","check",null,null,null,true],
      ["brShaderShadowQuality","Shadow resolution","select",null,null,null,"high"]
    ]}
  ];
  for (const group of groups) {
    const section=document.createElement("div"); section.className="shader-extra-section";
    const heading=document.createElement("div"); heading.className="shader-section-title"; heading.textContent=group.title; section.append(heading);
    for (const [id,label,type,min,max,step,initial] of group.items) {
      if (document.getElementById(id)) continue;
      const row=document.createElement("div"); row.className="option";
      if(type==="check") {
        row.innerHTML='<label><input id="'+id+'" type="checkbox"> '+label+'</label>';
      } else if(type==="select") {
        row.innerHTML='<label for="'+id+'">'+label+'</label><select id="'+id+'"><option value="low">Low · 512</option><option value="medium">Medium · 1024</option><option value="high">High · 2048</option></select>';
      } else {
        row.classList.add("shader-range");
        row.innerHTML='<label for="'+id+'">'+label+' <output id="'+id+'Value">'+Number(initial).toFixed(2)+'</output></label><input id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+initial+'">';
      }
      section.append(row);
    }
    panel.append(section);
  }
  if (!document.getElementById("brShaderReset")) {
    const reset=document.createElement("button"); reset.id="brShaderReset"; reset.type="button"; reset.textContent="Reset graphics settings"; reset.className="shader-reset"; panel.append(reset);
  }
  if (!document.getElementById("voidforgeShaderPanelStyles")) {
    const style=document.createElement("style"); style.id="voidforgeShaderPanelStyles";
    style.textContent=`
      #inGameShadersButton{position:fixed;z-index:9998;top:14px;right:14px;display:block;padding:10px 15px;border:1px solid #ffffff35;border-radius:12px;background:rgba(13,23,38,.9);color:#fff;font:800 13px system-ui;box-shadow:0 8px 28px #0006;backdrop-filter:blur(14px);cursor:pointer}
      #inGameShadersPanel{position:fixed;z-index:9999;top:62px;right:14px;width:min(370px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;padding:17px;border:1px solid #ffffff24;border-radius:18px;background:rgba(10,17,29,.97);color:#f5f8ff;box-shadow:0 24px 80px #000b;backdrop-filter:blur(22px);font:13px/1.45 system-ui}
      #inGameShadersPanel.hidden{display:none!important}#inGameShadersPanel .shader-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px}#inGameShadersPanel h2{font-size:18px;margin:0;font-weight:900}
      #inGameShadersPanel .shader-panel-subtitle,#inGameShadersPanel .shader-panel-note{color:#9eacc0;font-size:11px}#inGameShadersPanel .shader-panel-note{padding:10px 0;border-bottom:1px solid #ffffff18}
      #inGameShadersPanel .option{margin:12px 0}#inGameShadersPanel label{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#eaf1fa;font-size:12px}
      #inGameShadersPanel input[type=range]{width:100%;margin-top:7px;accent-color:#7acbff}#inGameShadersPanel input[type=checkbox]{accent-color:#7acbff}
      #inGameShadersPanel select{width:100%;margin-top:6px;padding:9px;border-radius:9px;border:1px solid #ffffff25;background:#1b2a3c;color:#fff}
      #inGameShadersPanel output{color:#86d2ff;font-weight:800;font-variant-numeric:tabular-nums}
      #inGameShadersPanel .shader-section-title{margin:15px 0 7px;padding-top:12px;border-top:1px solid #ffffff18;color:#7fcfff;font-size:10px;font-weight:900;letter-spacing:1.4px}
      #inGameShadersPanel .shader-reset{width:100%;margin-top:10px;padding:11px;border:1px solid #ffffff25;border-radius:10px;background:#20344b;color:#fff;font-weight:800}
      #closeShadersButton{width:32px;height:32px;border:0;border-radius:9px;background:#ffffff18;color:#fff;font-size:22px;cursor:pointer}
      body:not(.in-game-ui) #inGameShadersButton[data-shader-existing="1"]{display:none!important}\n      @media(max-width:600px){#inGameShadersButton{top:9px;right:9px;padding:9px 12px}#inGameShadersPanel{top:54px;right:8px;width:calc(100vw - 16px);max-height:78dvh}}
    `;
    document.head.append(style);
  }
  const open=()=>{panel.classList.remove("hidden");button.setAttribute("aria-expanded","true");};
  const close=()=>{panel.classList.add("hidden");button.setAttribute("aria-expanded","false");};
  if (!buttonAlreadyExists && !button.dataset.shaderBound) { button.addEventListener("click",()=>panel.classList.contains("hidden")?open():close());button.dataset.shaderBound="1"; }
  if (!panel.dataset.shaderBound) { panel.querySelector("#closeShadersButton")?.addEventListener("click",close);panel.dataset.shaderBound="1"; }
  return {panel,button};
}

export function createBattleZoneShaders(THREE,renderer,scene,camera,canvas,storageKey=STORAGE_KEY) {
  const settings=readSettings(storageKey);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloomPass=new UnrealBloomPass(new THREE.Vector2(1,1),.48,.3,.84);
  const cinematicPass=new ShaderPass(createCinematicShader(THREE));
  composer.addPass(bloomPass);composer.addPass(cinematicPass);composer.addPass(new OutputPass());
  let width=1,height=1,elapsed=0,composerRatio=renderer.getPixelRatio(),shaderScanFrame=0;
  const enhancedMaterials=new Set();
  const shaderTools={types:SHADER_TYPES,glsl:GLSL,enhanceScene:(options={})=>enhanceScene(THREE,scene,options,enhancedMaterials),createProceduralInstances:(geometry,material,count,configure)=>createProceduralInstances(THREE,geometry,material,count,configure),subdivideGeometry:(geometry,levels=1)=>subdivideGeometry(THREE,geometry,levels),createWebGPUComputeKernel,createCPUComputeFallback,createComputeKernel};
  const ui=mountShaderPanel();
  const $=id=>document.getElementById(id);
  function syncUI() {
    const p=PRESETS[settings.quality];
    const vals={brShaderExposure:settings.exposure,brShaderBloomStrength:settings.bloomStrength??p.strength,brShaderBloomThreshold:settings.bloomThreshold??p.threshold,brShaderBloomRadius:settings.bloomRadius??p.radius,brShaderSaturation:settings.saturation??p.saturation,brShaderContrast:settings.contrast??p.contrast,brShaderSharpness:settings.sharpen??p.sharpen,brShaderGrain:settings.grain??p.grain,brShaderTemperature:settings.temperature,brShaderChromatic:settings.chromatic,brShaderRenderScale:settings.renderScale};
    for(const [id,v] of Object.entries(vals)){const el=$(id);if(el)el.value=String(v);const out=$(id+"Value");if(out)out.value=Number(v).toFixed(2);}
    const checks={brShaderBloom:settings.bloom,brShaderVignette:settings.vignette,brShaderColorGrade:settings.colorGrade,brShaderShadows:settings.shadows};
    for(const [id,v] of Object.entries(checks)){const el=$(id);if(el)el.checked=v;}
    if($("brShaderQuality"))$("brShaderQuality").value=settings.quality;
    if($("brShaderShadowQuality"))$("brShaderShadowQuality").value=settings.shadowQuality;
  }
  function apply() {
    const p=PRESETS[settings.quality],mobile=matchMedia("(pointer:coarse),(max-width:800px)").matches;
    const ratio=Math.min(devicePixelRatio||1,mobile?1.15:1.65,p.pixelRatio*settings.renderScale);
    renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);composerRatio=ratio;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=settings.exposure;
    bloomPass.enabled=settings.bloom&&settings.quality!=="low";
    bloomPass.strength=settings.bloomStrength??p.strength;
    bloomPass.radius=settings.bloomRadius??p.radius;
    bloomPass.threshold=settings.bloomThreshold??p.threshold;
    cinematicPass.uniforms.uSaturation.value=settings.colorGrade?(settings.saturation??p.saturation):1;
    cinematicPass.uniforms.uContrast.value=settings.colorGrade?(settings.contrast??p.contrast):1;
    cinematicPass.uniforms.uSharpen.value=settings.colorGrade?(settings.sharpen??p.sharpen):0;
    cinematicPass.uniforms.uVignette.value=settings.vignette?p.vignette:0;
    cinematicPass.uniforms.uGrain.value=settings.colorGrade?(settings.grain??p.grain):0;
    cinematicPass.uniforms.uChromatic.value=settings.chromatic;
    cinematicPass.uniforms.uTemperature.value=settings.temperature;
    cinematicPass.uniforms.uResolution.value.set(width*ratio,height*ratio);
    renderer.shadowMap.enabled=settings.shadows;
    renderer.shadowMap.type=settings.shadowQuality==="low"?THREE.BasicShadowMap:settings.shadowQuality==="medium"?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;
    const shadowSize=settings.shadowQuality==="low"?512:settings.shadowQuality==="medium"?1024:2048;
    scene.traverse(obj=>{if(obj.isLight&&obj.castShadow&&obj.shadow){obj.shadow.mapSize.set(shadowSize,shadowSize);obj.shadow.needsUpdate=true;}});
    canvas.dataset.shaderQuality=settings.quality;
    try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{}
    syncUI();
  }
  function setSize(w,h){width=Math.max(1,w);height=Math.max(1,h);renderer.setSize(width,height,false);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);composerRatio=renderer.getPixelRatio();cinematicPass.uniforms.uResolution.value.set(width*composerRatio,height*composerRatio);}
  function render(delta){elapsed+=Math.max(0,delta||0);cinematicPass.uniforms.uTime.value=elapsed;const ratio=renderer.getPixelRatio();if(ratio!==composerRatio){composerRatio=ratio;composer.setPixelRatio(ratio);cinematicPass.uniforms.uResolution.value.set(width*ratio,height*ratio);}if((shaderScanFrame++%30)===0)enhanceScene(THREE,scene,{fresnel:.045,rimPower:2.6,rimColor:[.2,.42,.68]},enhancedMaterials);updateSceneShaderTime(enhancedMaterials,elapsed);composer.render();}
  const bind=(id,event,fn)=>$(id)?.addEventListener(event,fn);
  bind("brShaderQuality","change",e=>{if(PRESETS[e.target.value]){settings.quality=e.target.value;apply();}});
  bind("brShaderBloom","change",e=>{settings.bloom=e.target.checked;apply();});
  bind("brShaderVignette","change",e=>{settings.vignette=e.target.checked;apply();});
  bind("brShaderColorGrade","change",e=>{settings.colorGrade=e.target.checked;apply();});
  const numeric={brShaderExposure:"exposure",brShaderBloomStrength:"bloomStrength",brShaderBloomThreshold:"bloomThreshold",brShaderBloomRadius:"bloomRadius",brShaderSaturation:"saturation",brShaderContrast:"contrast",brShaderSharpness:"sharpen",brShaderGrain:"grain",brShaderTemperature:"temperature",brShaderChromatic:"chromatic",brShaderRenderScale:"renderScale"};
  for(const [id,key] of Object.entries(numeric))bind(id,"input",e=>{settings[key]=Number(e.target.value);const out=$(id+"Value");if(out)out.value=Number(e.target.value).toFixed(2);apply();});
  bind("brShaderShadows","change",e=>{settings.shadows=e.target.checked;apply();});
  bind("brShaderShadowQuality","change",e=>{settings.shadowQuality=e.target.value;apply();});
  bind("brShaderReset","click",()=>{try{localStorage.removeItem(storageKey);}catch{}Object.assign(settings,readSettings("__voidforge_defaults_missing__"));apply();});
  apply();
  return {render,setSize,shaderTools,dispose(){composer.dispose();bloomPass.dispose();cinematicPass.dispose();}};
}
