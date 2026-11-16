import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../fortnite/js/voidforge-gpu-shaders.js", import.meta.url), "utf8");
const api = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

class FakeAttribute {
  constructor(array, itemSize) { this.array = Float32Array.from(array); this.itemSize = itemSize; this.count = this.array.length / itemSize; }
  getX(i) { return this.array[i * this.itemSize]; }
  getY(i) { return this.array[i * this.itemSize + 1]; }
  getZ(i) { return this.array[i * this.itemSize + 2]; }
}
class FakeGeometry {
  constructor() { this.attributes = {}; this.disposed = false; }
  clone() { const g = new FakeGeometry(); for (const [k,a] of Object.entries(this.attributes)) g.attributes[k] = new FakeAttribute(a.array, a.itemSize); return g; }
  toNonIndexed() { return this.clone(); }
  getAttribute(name) { return this.attributes[name]; }
  setAttribute(name, attr) { this.attributes[name] = attr; return this; }
  computeVertexNormals() { this.attributes.normal = new FakeAttribute(new Array(this.attributes.position.count * 3).fill(1), 3); }
  dispose() { this.disposed = true; }
}
class FakeObject3D {
  constructor() { this.position = { x:0, y:0, z:0, set(x,y,z){this.x=x;this.y=y;this.z=z;} }; this.matrix = null; }
  updateMatrix() { this.matrix = [this.position.x,this.position.y,this.position.z]; }
}
class FakeInstancedMesh {
  constructor(geometry, material, count) { this.geometry=geometry; this.material=material; this.count=count; this.matrices=[]; this.instanceMatrix={}; }
  setMatrixAt(i,m) { this.matrices[i]=m; }
  computeBoundingSphere() { this.boundsComputed=true; }
}
const THREE = {
  Color: class { constructor(r,g,b){this.r=r;this.g=g;this.b=b;} },
  BufferGeometry: FakeGeometry,
  Float32BufferAttribute: FakeAttribute,
  Object3D: FakeObject3D,
  InstancedMesh: FakeInstancedMesh
};

test("lit material receives valid vertex and fragment shader injections", () => {
  const material = { isMeshStandardMaterial:true, userData:{}, customProgramCacheKey(){return "base-key";} };
  api.enhanceMaterial(THREE, material, { wind:1, hologram:true });
  const shader = {
    uniforms:{},
    vertexShader:"#include <common>\n#include <begin_vertex>\n#include <worldpos_vertex>",
    fragmentShader:"#include <common>\n#include <output_fragment>"
  };
  material.onBeforeCompile(shader);
  assert.match(shader.vertexShader, /uVfWind/);
  assert.match(shader.vertexShader, /vVfWorldPosition/);
  assert.doesNotMatch(shader.vertexShader, /vVfUv|= uv;/);
  assert.match(shader.fragmentShader, /uVfFresnel/);
  assert.match(shader.fragmentShader, /vfScan/);
  api.setMaterialShaderTime(material, 3.5);
  assert.equal(shader.uniforms.uVfTime.value, 3.5);
  assert.match(material.customProgramCacheKey(), /base-key/);
});

test("unlit materials are left untouched", () => {
  const material = { isMeshBasicMaterial:true, userData:{} };
  api.enhanceMaterial(THREE, material, {});
  assert.equal(material.userData.vfGpuShaderInstalled, undefined);
});

test("scene enhancement skips unlit and normal-less meshes", () => {
  const lit = { isMeshStandardMaterial:true, userData:{} };
  const basic = { isMeshBasicMaterial:true, userData:{} };
  const objects = [
    { isMesh:true, userData:{}, geometry:{attributes:{normal:{}}}, material:lit },
    { isMesh:true, userData:{}, geometry:{attributes:{normal:{}}}, material:basic },
    { isMesh:true, userData:{}, geometry:{attributes:{}}, material:{isMeshStandardMaterial:true,userData:{}} }
  ];
  const scene = { traverse(fn){objects.forEach(fn);} };
  const seen = api.enhanceScene(THREE, scene);
  assert.equal(seen.has(lit), true);
  assert.equal(seen.has(basic), false);
});

test("procedural instances write every configured transform", () => {
  const mesh = api.createProceduralInstances(THREE, {}, {}, 3, (i, transform) => {
    transform.position.set(i, i+1, i+2);
    return transform;
  });
  assert.deepEqual(mesh.matrices, [[0,1,2],[1,2,3],[2,3,4]]);
  assert.equal(mesh.boundsComputed, true);
});

test("one tessellation level splits one triangle into four", () => {
  const geometry = new FakeGeometry();
  geometry.setAttribute("position", new FakeAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  const result = api.subdivideGeometry(THREE, geometry, 1);
  assert.equal(result.getAttribute("position").count, 12);
  assert.equal(result.getAttribute("normal").count, 12);
});

test("compute kernel selects a working CPU fallback without WebGPU", async () => {
  const kernel = await api.createComputeKernel({ count:3, step:(value,index,dt)=>value+index+dt });
  assert.equal(kernel.backend, "cpu");
  kernel.dispatch(1);
  assert.deepEqual(Array.from(kernel.data), [1,2,3]);
});
