# VoidForge GPU Shader Engine

The shared renderer is loaded by the 3D games through `battlezone-shaders.js`.
It applies real Three.js vertex and fragment shader hooks to supported lit mesh
materials and exposes the extended shader tools as `postFX.shaderTools`.
Unlit materials and meshes without normals are deliberately skipped so they do
not receive shader code that their base material cannot compile.

## Shader stages

- **Vertex:** GLSL vertex-stage deformation. Per-material `wind` and
  `displacement` options are available. BattleZone foliage and water use these.
- **Fragment:** GLSL fragment-stage Fresnel/rim lighting, emissive pulse and
  optional hologram scan lines. A subtle rim-light pass is enabled by default.
- **Geometry equivalent:** WebGL does not expose a geometry-shader stage.
  `createProceduralInstances()` generates procedural mesh instances on the CPU.
- **Tessellation equivalent:** WebGL does not expose native tessellation
  stages. `subdivideGeometry()` subdivides a BufferGeometry on the CPU (up to
  four levels).
- **Compute:** `createWebGPUComputeKernel()` creates a native WebGPU compute
  pipeline when WebGPU is available. `createCPUComputeFallback()` is provided
  for browsers/devices without WebGPU.

## Per-material shader options

Set `material.userData.vfShader` before the first rendered frame:

```js
material.userData.vfShader = {
  wind: 0.8,
  displacement: 0.015,
  fresnel: 0.12,
  rimPower: 2.4,
  rimColor: [0.2, 0.65, 1.0],
  emissive: 0.04,
  hologram: false
};
```

To exclude a mesh, set `mesh.userData.vfShaderDisabled = true`.
To set options for a complete mesh, set `mesh.userData.vfShader`.

## Geometry and compute helpers

```js
const detailed = postFX.shaderTools.subdivideGeometry(geometry, 1);
const instances = postFX.shaderTools.createProceduralInstances(
  geometry, material, 100,
  (index, transform) => {
    transform.position.set(index % 10, 0, Math.floor(index / 10));
    return transform;
  }
);
```

For native compute, provide WGSL source and a binding layout matching the
buffers passed to the created bind group. `createComputeKernel()` automatically
selects WebGPU when available and otherwise returns the CPU step-function
fallback. The CPU fallback is not a GPU compute shader; it keeps simulations
usable on devices without WebGPU.

## Compatibility

The existing games use WebGL through Three.js. Vertex and fragment stages run
in their WebGL renderer. Geometry and tessellation are portable CPU-side
equivalents, not native WebGL shader stages. Native compute is opt-in and
requires a secure context and WebGPU-capable browser/device. All games retain
their existing render loop and the shared visual-quality preference.
