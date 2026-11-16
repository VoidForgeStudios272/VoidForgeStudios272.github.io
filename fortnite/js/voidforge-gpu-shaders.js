/**
 * VoidForge GPU Shader Toolkit
 * WebGL2: real vertex + fragment shader hooks.
 * WebGL geometry/tessellation equivalents: procedural geometry + CPU subdivision.
 * Compute: optional native WebGPU kernels with a portable CPU fallback.
 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const SHADER_TYPES = Object.freeze([
  "vertex", "fragment", "geometry", "tessellation", "compute"
]);

export const GLSL = Object.freeze({
  vertex: `
    varying vec3 vVfWorldPosition;
    varying vec3 vVfWorldNormal;
    varying vec2 vVfUv;
    uniform float uVfTime;
    uniform float uVfWind;
    uniform float uVfDisplacement;
    void vfVertex(inout vec3 transformed, in vec3 objectNormal) {
      float wave = sin(transformed.x * 1.7 + uVfTime * 1.4)
                 * cos(transformed.z * 1.3 + uVfTime) * uVfWind;
      transformed.y += wave * max(0.0, transformed.y) * 0.08;
      transformed += objectNormal * sin(uVfTime + transformed.x * 2.0) * uVfDisplacement;
    }
  `,
  fragment: `
    uniform float uVfFresnel;
    uniform float uVfRimPower;
    uniform float uVfEmissive;
    uniform vec3 uVfRimColor;
    uniform float uVfTime;
    varying vec3 vVfWorldPosition;
    varying vec3 vVfWorldNormal;
    varying vec2 vVfUv;
    vec3 vfShade(vec3 baseColor, vec3 viewDir, vec3 normal) {
      float rim = pow(1.0 - max(dot(normalize(normal), normalize(viewDir)), 0.0), uVfRimPower);
      float pulse = 0.94 + 0.06 * sin(uVfTime * 1.8 + vVfWorldPosition.y * 2.0);
      return baseColor + uVfRimColor * rim * uVfFresnel + baseColor * uVfEmissive * pulse;
    }
  `,
  hologramFragment: `
    float vfScan = 0.82 + 0.18 * sin(gl_FragCoord.y * 0.65 + uVfTime * 5.0);
    float vfFlicker = 0.94 + 0.06 * sin(uVfTime * 19.0);
    gl_FragColor.rgb *= vfScan * vfFlicker;
  `
});

const DEFAULTS = Object.freeze({
  wind: 0, displacement: 0, fresnel: 0.12, rimPower: 2.4,
  emissive: 0, rimColor: [0.24, 0.68, 1.0], hologram: false
});

export function enhanceMaterial(THREE, material, options = {}) {
  if (!material || material.userData?.vfGpuShaderInstalled) return material;
  const opts = { ...DEFAULTS, ...options };
  material.userData ||= {};
  material.userData.vfGpuShaderInstalled = true;
  const previousCompile = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    previousCompile?.(shader);
    shader.uniforms.uVfTime = { value: 0 };
    shader.uniforms.uVfWind = { value: opts.wind };
    shader.uniforms.uVfDisplacement = { value: opts.displacement };
    shader.uniforms.uVfFresnel = { value: opts.fresnel };
    shader.uniforms.uVfRimPower = { value: opts.rimPower };
    shader.uniforms.uVfEmissive = { value: opts.emissive };
    shader.uniforms.uVfRimColor = { value: new THREE.Color(...opts.rimColor) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
        varying vec3 vVfWorldPosition; varying vec3 vVfWorldNormal; varying vec2 vVfUv;
        uniform float uVfTime; uniform float uVfWind; uniform float uVfDisplacement;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float vfWave = sin(transformed.x * 1.7 + uVfTime * 1.4) * cos(transformed.z * 1.3 + uVfTime);
        transformed.y += vfWave * uVfWind * max(0.0, transformed.y) * 0.08;
        transformed += objectNormal * sin(uVfTime + transformed.x * 2.0) * uVfDisplacement;`)
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>
        vVfWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vVfWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        vVfUv = uv;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vVfWorldPosition; varying vec3 vVfWorldNormal; varying vec2 vVfUv;
        uniform float uVfTime; uniform float uVfFresnel; uniform float uVfRimPower;
        uniform float uVfEmissive; uniform vec3 uVfRimColor;`)
      .replace("#include <output_fragment>", `#include <output_fragment>
        float vfRim = pow(1.0 - max(dot(normalize(vVfWorldNormal), normalize(cameraPosition - vVfWorldPosition)), 0.0), uVfRimPower);
        float vfPulse = 0.94 + 0.06 * sin(uVfTime * 1.8 + vVfWorldPosition.y * 2.0);
        gl_FragColor.rgb += uVfRimColor * vfRim * uVfFresnel + gl_FragColor.rgb * uVfEmissive * vfPulse;`);
    if (opts.hologram) shader.fragmentShader = shader.fragmentShader.replace(
      "#include <output_fragment>",
      `#include <output_fragment>
       float vfScan = 0.82 + 0.18 * sin(gl_FragCoord.y * 0.65 + uVfTime * 5.0);
       gl_FragColor.rgb *= vfScan;`
    );
    material.userData.vfShaderUniforms = shader.uniforms;
  };
  material.customProgramCacheKey = () => `voidforge-gpu-v1-${opts.wind}-${opts.displacement}-${opts.fresnel}-${opts.hologram}`;
  material.needsUpdate = true;
  return material;
}

export function setMaterialShaderTime(material, time) {
  const uniforms = material?.userData?.vfShaderUniforms;
  if (uniforms?.uVfTime) uniforms.uVfTime.value = time;
}

export function enhanceScene(THREE, scene, options = {}, seen = new WeakSet()) {
  scene.traverse(object => {
    if (!object.isMesh || object.userData?.vfShaderDisabled) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      const preset = object.userData?.vfShader || material.userData?.vfShader || options;
      enhanceMaterial(THREE, material, preset);
    }
  });
  return seen;
}

export function updateSceneShaderTime(scene, time) {
  if (scene && typeof scene[Symbol.iterator] === "function") {
    for (const material of scene) setMaterialShaderTime(material, time);
    return;
  }
  scene.traverse(object => {
    if (!object.isMesh) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) setMaterialShaderTime(material, time);
  });
}

/** WebGL has no geometry-shader stage; this generates equivalent mesh geometry on the CPU. */
export function createProceduralInstances(THREE, geometry, material, count, configure) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(0, count | 0));
  const dummy = new THREE.Object3D();
  for (let i = 0; i < mesh.count; i++) {
    const configured = configure?.(i, dummy);
    const transform = configured || dummy;
    transform.updateMatrix?.();
    mesh.setMatrixAt(i, transform.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** CPU tessellation fallback: split each triangle into four triangles. */
export function subdivideGeometry(geometry, levels = 1) {
  let current = geometry.clone();
  const iterations = clamp(Math.floor(levels), 0, 4);
  for (let level = 0; level < iterations; level++) {
    const source = current.toNonIndexed();
    const position = source.getAttribute("position");
    const normal = source.getAttribute("normal");
    const uv = source.getAttribute("uv");
    const out = { position: [], normal: [], uv: [] };
    const midpoint = (a, b) => [(a[0]+b[0])*.5, (a[1]+b[1])*.5, (a[2]+b[2])*.5];
    const read3 = (attr, i) => [attr.getX(i), attr.getY(i), attr.getZ(i)];
    const read2 = (attr, i) => [attr.getX(i), attr.getY(i)];
    const pushVertex = (p, n, t) => { out.position.push(...p); if (normal) out.normal.push(...n); if (uv) out.uv.push(...t); };
    for (let i = 0; i < position.count; i += 3) {
      const p = [0,1,2].map(j => read3(position, i+j));
      const n = normal ? [0,1,2].map(j => read3(normal, i+j)) : null;
      const t = uv ? [0,1,2].map(j => read2(uv, i+j)) : null;
      const ab=midpoint(p[0],p[1]), bc=midpoint(p[1],p[2]), ca=midpoint(p[2],p[0]);
      const nab=n?midpoint(n[0],n[1]):null, nbc=n?midpoint(n[1],n[2]):null, nca=n?midpoint(n[2],n[0]):null;
      const tab=t?[(t[0][0]+t[1][0])*.5,(t[0][1]+t[1][1])*.5]:null;
      const tbc=t?[(t[1][0]+t[2][0])*.5,(t[1][1]+t[2][1])*.5]:null;
      const tca=t?[(t[2][0]+t[0][0])*.5,(t[2][1]+t[0][1])*.5]:null;
      const triangles=[[p[0],ab,ca],[ab,p[1],bc],[ca,bc,p[2]],[ab,bc,ca]];
      const normals=n?[[n[0],nab,nca],[nab,n[1],nbc],[nca,nbc,n[2]],[nab,nbc,nca]]:null;
      const uvs=t?[[t[0],tab,tca],[tab,t[1],tbc],[tca,tbc,t[2]],[tab,tbc,tca]]:null;
      triangles.forEach((tri,k)=>tri.forEach((v,j)=>pushVertex(v,normals?.[k][j]||[0,1,0],uvs?.[k][j]||[0,0])));
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(out.position,3));
    if (normal) next.setAttribute("normal", new THREE.Float32BufferAttribute(out.normal,3));
    if (uv) next.setAttribute("uv", new THREE.Float32BufferAttribute(out.uv,2));
    if (!normal) next.computeVertexNormals();
    source.dispose(); current.dispose(); current=next;
  }
  return current;
}

/** Native WebGPU compute kernel. Returns null when WebGPU is unavailable. */
export async function createWebGPUComputeKernel({ code, entryPoint = "main", workgroupSize = 64, bindings = [] } = {}) {
  if (!globalThis.navigator?.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  const device = await adapter.requestDevice();
  const module = device.createShaderModule({ code });
  const layoutEntries = bindings.map((binding, index) => ({
    binding: index, visibility: GPUShaderStage.COMPUTE,
    buffer: { type: binding.type || "storage" }
  }));
  const bindGroupLayout = device.createBindGroupLayout({ entries: layoutEntries });
  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module, entryPoint, constants: { WORKGROUP_SIZE: workgroupSize } }
  });
  return {
    device, pipeline, bindGroupLayout,
    dispatch(bindGroup, workgroups = 1) {
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline); pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(Math.max(1, workgroups | 0)); pass.end();
      device.queue.submit([encoder.finish()]);
    },
    destroy() { device.destroy(); }
  };
}

export function createCPUComputeFallback(count, step) {
  const size = Math.max(0, count | 0);
  const data = new Float32Array(size);
  return { data, dispatch(delta = 1 / 60) { for (let i=0;i<size;i++) data[i]=step(data[i],i,delta); } };
}
