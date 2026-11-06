// Renderer + cartoon-film look: neutral tone curve, soft shadows, environment light, bloom, depth of field, vignette + grain.
// Upgraded to RicksClips forensic cinematic grade (Hermite S-curve contrast, 3-way split tone, bokeh DoF).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const W = 1080, H = 1920;
const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
export const RES = +(Q.get('res') || 1), AA = +(Q.get('aa') ?? 4), SHADOW = +(Q.get('shadow') || 2048);

// Advanced RicksClips Color Grade Shader: Hermite film curve, 3-way split toning, cinematic vignette & grain
const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uVig: { value: 0.22 },
    uGrain: { value: 0.012 },
    uTime: { value: 0 },
    uSat: { value: 1.22 },
    uContrast: { value: 1.15 },
    uWarm: { value: 0.035 },
    uShadowTint: { value: new THREE.Vector3(0.02, 0.0, 0.05) },   // subtle plum/slate shadow
    uHighlightTint: { value: new THREE.Vector3(0.04, 0.02, -0.02) } // warm golden highlight
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
    uniform float uVig, uGrain, uTime, uSat, uContrast, uWarm;
    uniform vec3 uShadowTint, uHighlightTint;
    varying vec2 vUv;

    // High quality procedural grain
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 7.13) * 43758.5453);
    }

    // Monotone Hermite S-Curve for cinematic contrast
    vec3 filmCurve(vec3 c, float k) {
      vec3 s = c * c * (3.0 - 2.0 * c);
      return mix(c, s, k);
    }

    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      vec3 c = src.rgb;

      // 1. Film S-Curve Contrast
      c = filmCurve(clamp(c, 0.0, 1.0), uContrast - 1.0);

      // 2. Luma calculation (Rec. 709)
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));

      // 3. 3-Way Split Toning (Plum/slate shadows, warm golden highlights)
      float shadowWeight = 1.0 - smoothstep(0.0, 0.55, luma);
      float highlightWeight = smoothstep(0.45, 1.0, luma);
      c += shadowWeight * uShadowTint + highlightWeight * uHighlightTint;

      // 4. Targeted Saturation
      c = mix(vec3(luma), c, uSat);

      // 5. Warmth shift
      c.r += uWarm * 0.4;
      c.b -= uWarm * 0.3;

      // 6. Elliptical Vignette
      vec2 d = (vUv - 0.5) * vec2(1.0, 1.778);
      float dist = length(d);
      c *= 1.0 - uVig * smoothstep(0.35, 0.95, dist);

      // 7. Subtle Film Grain
      float g = (hash(vUv * 1200.0) - 0.5) * uGrain;
      c += g;

      gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
    }
  `
};

export function makeEngine(canvas, { w = W, h = H, samples = 4, shadowSize = 2048 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
  renderer.userData = { shadowSize };

  const composer = new EffectComposer(renderer, rt); composer.setSize(w, h);
  const rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rp);

  // Depth of field: BokehPass tuned for creamy background blur
  const bokeh = new BokehPass(rp.scene, rp.camera, { focus: 2.8, aperture: 0.0025, maxblur: 0.012 });
  composer.addPass(bokeh);

  // Bloom for glowing lamps, lanterns, chandeliers and sunlight (threshold 1.02 keeps 2D toon faces crisp)
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.60, 1.02);
  composer.addPass(bloom);

  composer.addPass(new OutputPass());

  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);

  return {
    renderer, envMap, composer,
    /** look = { bloom, bloomThreshold, focus (m), aperture, maxblur, exposure, vignette, grain, warm, sat, contrast, t } */
    render(scene, camera, look = {}) {
      rp.scene = scene; rp.camera = camera; bokeh.scene = scene; bokeh.camera = camera;
      bokeh.enabled = (look.aperture ?? 0.002) > 0;
      bokeh.uniforms.focus.value = look.focus ?? 2.8;
      bokeh.uniforms.aperture.value = look.aperture ?? 0.0022;
      bokeh.uniforms.maxblur.value = look.maxblur ?? 0.008;

      bloom.strength = look.bloom ?? 0.45;
      bloom.threshold = look.bloomThreshold ?? 1.02;
      bloom.radius = look.bloomRadius ?? 0.60;

      renderer.toneMappingExposure = look.exposure ?? 1.05;

      grade.uniforms.uVig.value = look.vignette ?? 0.22;
      grade.uniforms.uGrain.value = look.grain ?? 0.010;
      grade.uniforms.uSat.value = look.sat ?? 1.20;
      grade.uniforms.uContrast.value = look.contrast ?? 1.14;
      grade.uniforms.uWarm.value = look.warm ?? 0.03;
      grade.uniforms.uTime.value = look.t ?? 0;

      composer.render();
    },
  };
}

export function lightRig(scene, { key = '#FFE2C2', keyI = 3.2, keyPos = [2.5, 4, 3], rimCol = '#BFD8FF', rimI = 2.2, sky = '#FFF4E6', ground = '#8C6E55', hemiI = 0.9, shadowBox = 3, target = [0, 1, 0] } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const k = new THREE.DirectionalLight(key, keyI); k.position.set(...keyPos); k.target.position.set(...target); k.castShadow = true;
  k.shadow.mapSize.set(SHADOW, SHADOW); k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02; k.shadow.radius = 6;
  Object.assign(k.shadow.camera, { left: -shadowBox, right: shadowBox, top: shadowBox, bottom: -shadowBox, near: 0.1, far: 20 }); k.shadow.camera.updateProjectionMatrix();
  g.add(k, k.target);
  const r = new THREE.DirectionalLight(rimCol, rimI); r.position.set(-3, 3, -3); g.add(r);
  g.add(new THREE.HemisphereLight(sky, ground, hemiI));
  return { key: k, rim: r, group: g };
}

export function camera(fov = 45) { return new THREE.PerspectiveCamera(fov, W / H, 0.05, 1000); }

