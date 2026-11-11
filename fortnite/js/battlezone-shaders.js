import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js";

const STORAGE_KEY = "battlezone.visuals.v2";
const PRESETS = {
  low:    { pixelRatio: 0.85, bloom: 0.12, threshold: 0.92, strength: 0.12, radius: 0.18, sharpen: 0.10, saturation: 1.04, contrast: 1.035, vignette: 0.16, grain: 0.012 },
  medium: { pixelRatio: 1.00, bloom: 0.28, threshold: 0.88, strength: 0.28, radius: 0.24, sharpen: 0.18, saturation: 1.10, contrast: 1.06, vignette: 0.22, grain: 0.018 },
  high:   { pixelRatio: 1.25, bloom: 0.48, threshold: 0.84, strength: 0.48, radius: 0.30, sharpen: 0.26, saturation: 1.15, contrast: 1.085, vignette: 0.28, grain: 0.022 },
  ultra:  { pixelRatio: 1.50, bloom: 0.68, threshold: 0.80, strength: 0.68, radius: 0.36, sharpen: 0.34, saturation: 1.20, contrast: 1.11, vignette: 0.34, grain: 0.028 }
};

const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uSaturation: { value: 1.1 },
    uContrast: { value: 1.06 },
    uSharpen: { value: 0.18 },
    uVignette: { value: 0.22 },
    uGrain: { value: 0.018 },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uSharpen;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uTime;
    varying vec2 vUv;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 17.0) * 43758.5453);
    }
    void main() {
      vec2 px = 1.0 / max(uResolution, vec2(1.0));
      vec3 center = texture2D(tDiffuse, vUv).rgb;
      vec3 north = texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb;
      vec3 south = texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb;
      vec3 east  = texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb;
      vec3 west  = texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb;
      vec3 sharpened = center + (center * 4.0 - north - south - east - west) * uSharpen * 0.16;
      float luminance = dot(sharpened, vec3(0.2126, 0.7152, 0.0722));
      vec3 color = mix(vec3(luminance), sharpened, uSaturation);
      color = (color - 0.5) * uContrast + 0.5;
      color = mix(color, color * (1.0 + vec3(0.025, 0.012, -0.008)), 0.22);
      float vignette = smoothstep(0.92, 0.18, distance(vUv, vec2(0.5)) * 1.18);
      color *= 1.0 - (1.0 - vignette) * uVignette;
      color += (noise(vUv * uResolution) - 0.5) * uGrain;
      gl_FragColor = vec4(max(color, 0.0), 1.0);
    }
  `
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      quality: PRESETS[saved.quality] ? saved.quality : "high",
      bloom: saved.bloom !== false,
      vignette: saved.vignette !== false
    };
  } catch {
    return { quality: "high", bloom: true, vignette: true };
  }
}

export function createBattleZoneShaders(renderer, scene, camera, canvas) {
  const settings = readSettings();
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.48, 0.3, 0.84);
  const cinematicPass = new ShaderPass(CinematicShader);
  const outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(cinematicPass);
  composer.addPass(outputPass);

  let width = 1, height = 1, elapsed = 0;
  const mobile = matchMedia("(pointer:coarse), (max-width:800px)").matches;
  function apply() {
    const p = PRESETS[settings.quality];
    const ratio = Math.min(devicePixelRatio || 1, mobile ? Math.min(1.15, p.pixelRatio) : p.pixelRatio);
    renderer.setPixelRatio(ratio);
    composer.setPixelRatio(ratio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = settings.quality === "ultra" ? 1.18 : settings.quality === "low" ? 1.04 : 1.12;
    bloomPass.enabled = settings.bloom && settings.quality !== "low";
    bloomPass.strength = p.strength;
    bloomPass.radius = p.radius;
    bloomPass.threshold = p.threshold;
    cinematicPass.uniforms.uSaturation.value = p.saturation;
    cinematicPass.uniforms.uContrast.value = p.contrast;
    cinematicPass.uniforms.uSharpen.value = p.sharpen;
    cinematicPass.uniforms.uVignette.value = settings.vignette ? p.vignette : 0;
    cinematicPass.uniforms.uGrain.value = p.grain;
    cinematicPass.uniforms.uResolution.value.set(width * ratio, height * ratio);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
    const quality = document.getElementById("brShaderQuality");
    const bloom = document.getElementById("brShaderBloom");
    const vignette = document.getElementById("brShaderVignette");
    if (quality) quality.value = settings.quality;
    if (bloom) bloom.checked = settings.bloom;
    if (vignette) vignette.checked = settings.vignette;
    canvas.dataset.shaderQuality = settings.quality;
  }
  function setSize(w, h) {
    width = Math.max(1, w); height = Math.max(1, h);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    cinematicPass.uniforms.uResolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
  }
  function render(delta) {
    elapsed += Math.max(0, delta || 0);
    cinematicPass.uniforms.uTime.value = elapsed;
    composer.render();
  }
  document.getElementById("brShaderQuality")?.addEventListener("change", event => {
    if (!PRESETS[event.target.value]) return;
    settings.quality = event.target.value;
    apply();
  });
  document.getElementById("brShaderBloom")?.addEventListener("change", event => {
    settings.bloom = event.target.checked;
    apply();
  });
  document.getElementById("brShaderVignette")?.addEventListener("change", event => {
    settings.vignette = event.target.checked;
    apply();
  });
  apply();
  return { render, setSize, dispose() { composer.dispose(); bloomPass.dispose(); cinematicPass.dispose(); } };
}
