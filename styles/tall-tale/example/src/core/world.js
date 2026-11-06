// The Tall Tale world: a sunny, saturated, slightly old-timey cartoon world built in 3D with painted canvas textures.
//   sky(scene, { top, horizon, sunset }) · sunlight(scene, opts) · clouds(scene, list)
//   mainStreet(E, opts) -> { scene, sun, people: [...] }      a small-town street with shops, poles, wires, hills
//   interior(E, opts)  -> { scene, sun, counter, window }      a wallpapered shop/office room with a counter and a window
//   meadow(E, opts)    -> { scene, sun }                       grass, hills, fence, trees, flowers (day or sunset)
// Textures: planks, wallpaper, brick, dirt, grass, siding, facade(name, ...), sign(text) — all drawn in code.
import * as THREE from 'three';
import { lightRig } from './engine.js';
import { Toon } from './toon.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TEX = {};
export function canvasTex(key, w, h, draw, rep = [1, 1]) {
  let t = TEX[key];
  if (!t) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; TEX[key] = t;
  }
  const u = t.clone(); u.repeat.set(rep[0], rep[1]); u.needsUpdate = true; return u;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
export const mat = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0, parent) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (parent) parent.add(b); return b; };
const cyl = (r1, r2, h, m, x, y, z, parent, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; if (parent) parent.add(c); return c; };

// ---------- painted textures ----------
export const T = {
  planks: (col = '#A8693E', rep = [1, 1]) => canvasTex('planks' + col, 512, 512, (g, w, h) => {
    const n = 8, ph = h / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(col, 0.86 + rnd(i * 3) * 0.24); g.fillRect(0, i * ph, w, ph);
      g.strokeStyle = shade(col, 0.7); g.globalAlpha = 0.35; g.lineWidth = 2;
      for (let k = 0; k < 4; k++) { g.beginPath(); const y = i * ph + 8 + rnd(i * 7 + k) * (ph - 16); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 2); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = shade(col, 0.45); g.fillRect(0, i * ph, w, 4);
      const jx = rnd(i * 11) * w; g.fillRect(jx, i * ph, 4, ph);
      g.fillStyle = shade(col, 0.5); [jx - 14, jx + 18].forEach((x) => { g.beginPath(); g.arc(x, i * ph + ph / 2, 3, 0, 7); g.fill(); });
    }
  }, rep),
  wallpaper: (col = '#9E2E3A', motif = '#B8414C', rep = [1, 1]) => canvasTex('wp' + col + motif, 256, 256, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = motif; g.strokeStyle = motif; g.lineWidth = 5;
    const fleur = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(18, -20, 18, 0, 0, 14); g.bezierCurveTo(-18, 0, -18, -20, 0, -40); g.fill(); g.beginPath(); g.arc(-22, 4, 12, 0, 7); g.arc(22, 4, 12, 0, 7); g.fill(); g.fillRect(-3, 10, 6, 26); g.restore(); };
    [[64, 64], [192, 192], [192, 64 - 256], [64, 192]].forEach(([x, y], i) => i < 2 && fleur(x, y, 0.9));
    g.globalAlpha = 0.5; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(i % 2 ? 192 : 64, i < 2 ? 192 : 64, 6, 0, 7); g.fill(); } g.globalAlpha = 1;
  }, rep),
  brick: (col = '#B5553C', rep = [1, 1]) => canvasTex('brick' + col, 512, 512, (g, w, h) => {
    g.fillStyle = shade(col, 0.6); g.fillRect(0, 0, w, h); const bh = 32, bw = 85;
    for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) { const x = c * bw + (r % 2) * bw / 2; g.fillStyle = shade(col, 0.85 + rnd(r * 31 + c) * 0.3); g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6); }
  }, rep),
  siding: (col = '#6FA3B8', rep = [1, 1]) => canvasTex('siding' + col, 256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) { const y = i * 32; const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, shade(col, 1.06)); gr.addColorStop(1, shade(col, 0.86)); g.fillStyle = gr; g.fillRect(0, y, w, 32); g.fillStyle = shade(col, 0.6); g.fillRect(0, y + 30, w, 2); }
  }, rep),
  dirt: (col = '#C8763F', rep = [1, 1], tracks = true) => canvasTex('dirt' + col + tracks, 512, 512, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = shade(col, 0.75 + rnd(i) * 0.5); g.globalAlpha = 0.5; g.beginPath(); g.arc(rnd(i * 2.1) * w, rnd(i * 3.7) * h, 1 + rnd(i * 5.3) * 2.5, 0, 7); g.fill(); }
    g.globalAlpha = 0.18; g.fillStyle = shade(col, 0.6);
    if (tracks) [0.3, 0.38, 0.62, 0.7].forEach((x) => g.fillRect(x * w, 0, 14, h));
    g.globalAlpha = 1;
  }, rep),
  grass: (col = '#6DBB4A', rep = [1, 1]) => canvasTex('grass' + col, 512, 512, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const x = rnd(i * 1.3) * w, y = rnd(i * 2.9) * h; g.strokeStyle = shade(col, 0.7 + rnd(i * 7.7) * 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd(i) - 0.5) * 6, y - 6 - rnd(i * 9) * 8); g.stroke(); }
  }, rep),
  felt: (col = '#1F5A45') => canvasTex('felt' + col, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = shade(col, 0.85 + rnd(i) * 0.3); g.fillRect(rnd(i * 3) * w, rnd(i * 7) * h, 2, 2); } }),
  checker: (col1 = '#389E96', col2 = '#EBF5F4', rep = [1, 1], size = 64) => canvasTex('chk' + col1 + col2 + size, 256, 256, (g, w, h) => {
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        g.fillStyle = ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) ? col1 : col2;
        g.fillRect(x, y, size, size);
        g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 1; g.strokeRect(x, y, size, size);
      }
    }
  }, rep),
  rug: (base = '#E8DEC8', border = '#C96238', rep = [1, 1]) => canvasTex('rug' + base + border, 512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 4);
    g.strokeStyle = border; g.lineWidth = 20; g.strokeRect(30, 30, w - 60, h - 60);
    g.lineWidth = 6; g.strokeRect(52, 52, w - 104, h - 104);
  }, rep),
  canyonWall: (rep = [1, 1]) => canvasTex('canyon', 512, 512, (g, w, h) => {
    const strata = ['#C95632', '#B84224', '#D97A4A', '#8F2E1E', '#E8965E', '#A63C22'];
    let y = 0;
    while (y < h) {
      const sh = 16 + Math.floor(rnd(y * 3) * 44);
      g.fillStyle = strata[Math.floor(rnd(y * 7) * strata.length)];
      g.fillRect(0, y, w, sh);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y + sh - 3, w, 3);
      y += sh;
    }
  }, rep),
  cobblestone: (col = '#4A4650', rep = [1, 1]) => canvasTex('cobble' + col, 512, 512, (g, w, h) => {
    g.fillStyle = shade(col, 0.55); g.fillRect(0, 0, w, h);
    const sz = 42;
    for (let y = 0; y < h; y += sz) {
      const rowShift = (Math.floor(y / sz) % 2) * (sz / 2);
      for (let x = -sz; x < w + sz; x += sz) {
        const ox = x + rowShift + (rnd(x * 13 + y) - 0.5) * 8;
        const oy = y + (rnd(y * 17 + x) - 0.5) * 8;
        const cw = sz - 6 + (rnd(x * 3) - 0.5) * 6;
        const ch = sz - 6 + (rnd(y * 7) - 0.5) * 6;
        g.fillStyle = shade(col, 0.75 + rnd(x * 31 + y * 19) * 0.45);
        g.beginPath(); g.roundRect(ox + 3, oy + 3, cw, ch, 8); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
        g.beginPath(); g.arc(ox + cw * 0.35, oy + ch * 0.35, cw * 0.25, 0, 7); g.stroke();
      }
    }
  }, rep),
  parquet: (col = '#6B4226', rep = [1, 1]) => canvasTex('parquet' + col, 512, 512, (g, w, h) => {
    g.fillStyle = shade(col, 0.6); g.fillRect(0, 0, w, h);
    const sw = 32, sl = 96;
    for (let y = 0; y < h; y += sl) {
      for (let x = 0; x < w; x += sl) {
        const flip = ((Math.floor(x / sl) + Math.floor(y / sl)) % 2 === 0);
        for (let k = 0; k < 3; k++) {
          const sx = flip ? x + k * sw : x;
          const sy = flip ? y : y + k * sw;
          const pw = flip ? sw : sl;
          const ph = flip ? sl : sw;
          g.fillStyle = shade(col, 0.85 + rnd(x * 11 + y * 7 + k) * 0.3);
          g.fillRect(sx + 1, sy + 1, pw - 2, ph - 2);
          g.strokeStyle = shade(col, 0.45); g.lineWidth = 1;
          g.strokeRect(sx + 1, sy + 1, pw - 2, ph - 2);
        }
      }
    }
  }, rep),
  damask: (col = '#1C2942', motif = '#2E4366', rep = [1, 1]) => canvasTex('damask' + col + motif, 256, 256, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = motif; g.strokeStyle = shade(motif, 1.25); g.lineWidth = 3;
    const motifFn = (mx, my, sc) => {
      g.save(); g.translate(mx, my); g.scale(sc, sc);
      g.beginPath(); g.moveTo(0, -35);
      g.bezierCurveTo(24, -15, 20, 10, 0, 25);
      g.bezierCurveTo(-20, 10, -24, -15, 0, -35);
      g.fill(); g.stroke();
      g.beginPath(); g.arc(-16, 2, 8, 0, 7); g.arc(16, 2, 8, 0, 7); g.fill();
      g.restore();
    };
    [[64, 64], [192, 192], [192, 64], [64, 192]].forEach(([x, y]) => motifFn(x, y, 0.85));
  }, rep),
};

/** a painted shopfront (front face of a building) */
export function facade(name, { wall = '#C9603F', kind = 'brick', trim = '#F2E6CF', sign = '#2E4E3F', signText = '#F2D37A', awning = null, w = 5, h = 7, seed = 1 } = {}) {
  const px = 110, cw = Math.round(w * px), ch = Math.round(h * px);
  return canvasTex('fac' + name + wall + w + h + seed, cw, ch, (g) => {
    if (kind === 'brick') { const b = T.brick(wall).image; for (let y = 0; y < ch; y += 512) for (let x = 0; x < cw; x += 512) g.drawImage(b, x, y); }
    else { const b = T.siding(wall).image; for (let y = 0; y < ch; y += 256) for (let x = 0; x < cw; x += 256) g.drawImage(b, x, y); }
    // cornice
    g.fillStyle = trim; g.fillRect(0, 0, cw, 40); g.fillStyle = shade(trim, 0.7); g.fillRect(0, 40, cw, 10);
    for (let x = 10; x < cw; x += 34) { g.fillStyle = trim; g.fillRect(x, 50, 16, 16); }
    // upper windows
    const nw = Math.max(2, Math.round(w / 1.6)), ww = cw / nw;
    for (let i = 0; i < nw; i++) {
      const x = i * ww + ww * 0.22, y = ch * 0.16, wd = ww * 0.56, ht = ch * 0.22;
      g.fillStyle = trim; g.fillRect(x - 10, y - 14, wd + 20, ht + 28);
      const gr = g.createLinearGradient(x, y, x + wd, y + ht); gr.addColorStop(0, '#7FB3D8'); gr.addColorStop(0.5, '#3F6E9A'); gr.addColorStop(1, '#2B4A70'); g.fillStyle = gr; g.fillRect(x, y, wd, ht);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x + wd * 0.1, y + ht); g.lineTo(x + wd * 0.45, y); g.lineTo(x + wd * 0.6, y); g.lineTo(x + wd * 0.25, y + ht); g.fill();
      g.fillStyle = trim; g.fillRect(x + wd / 2 - 4, y, 8, ht); g.fillRect(x, y + ht / 2 - 4, wd, 8);
      if (rnd(seed * 13 + i) > 0.5) { g.fillStyle = shade(wall, 0.8); g.fillRect(x, y, wd, ht * 0.35); }
    }
    // sign board
    const sy = ch * 0.47, sh = ch * 0.1;
    g.fillStyle = sign; g.fillRect(cw * 0.06, sy, cw * 0.88, sh); g.strokeStyle = signText; g.lineWidth = 5; g.strokeRect(cw * 0.06 + 8, sy + 8, cw * 0.88 - 16, sh - 16);
    g.fillStyle = signText; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = sh * 0.56; g.font = `700 ${fs}px Caladea, Georgia, serif`;
    while (g.measureText(name).width > cw * 0.78 && fs > 10) { fs -= 2; g.font = `700 ${fs}px Caladea, Georgia, serif`; }
    g.fillText(name, cw / 2, sy + sh / 2 + 2);
    // shop window + door
    const by = sy + sh + 16, bh = ch - by;
    g.fillStyle = shade(trim, 0.9); g.fillRect(0, by, cw, bh);
    const dw = cw * 0.2, dx = rnd(seed) > 0.5 ? cw * 0.08 : cw * 0.72;
    g.fillStyle = '#5A3A26'; g.fillRect(dx, by + 14, dw, bh - 14); g.fillStyle = '#3F6E9A'; g.fillRect(dx + 12, by + 30, dw - 24, bh * 0.4);
    g.fillStyle = '#E8C060'; g.beginPath(); g.arc(dx + dw - 18, by + bh * 0.62, 6, 0, 7); g.fill();
    const wx = dx < cw / 2 ? dx + dw + 20 : cw * 0.06, wwid = cw * 0.66 - 20;
    const gr = g.createLinearGradient(wx, by, wx + wwid, by + bh); gr.addColorStop(0, '#9CC7E4'); gr.addColorStop(0.45, '#4C7FA8'); gr.addColorStop(1, '#2A4565');
    g.fillStyle = '#4A2E1E'; g.fillRect(wx - 8, by + 14, wwid + 16, bh * 0.7 + 16); g.fillStyle = gr; g.fillRect(wx, by + 22, wwid, bh * 0.7);
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#E7B04A', '#D8584A', '#7DB36A', '#F2E6CF', '#8A6FC0'][(i + seed) % 5]; g.fillRect(wx + 16 + i * (wwid - 32) / 5, by + bh * 0.55, (wwid - 32) / 5 - 10, bh * 0.2); }
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(wx + wwid * 0.15, by + 22 + bh * 0.7); g.lineTo(wx + wwid * 0.4, by + 22); g.lineTo(wx + wwid * 0.52, by + 22); g.lineTo(wx + wwid * 0.27, by + 22 + bh * 0.7); g.fill();
    if (awning) { const ay = by - 4; for (let x = 0, i = 0; x < cw; x += 40, i++) { g.fillStyle = i % 2 ? '#F4EFE4' : awning; g.fillRect(x, ay, 40, 46); g.beginPath(); g.arc(x + 20, ay + 46, 20, 0, Math.PI); g.fill(); } }
  });
}

/** a flat painted sign (plank board with text) as a plane mesh */
export function signBoard(text, { w = 2, h = 0.5, bg = '#2E4E3F', fg = '#F2D37A', font = 'Caladea' } = {}) {
  const t = canvasTex('sign' + text + bg + fg + w + h, Math.round(w * 200), Math.round(h * 200), (g, cw, ch) => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, cw - 20, ch - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = ch * 0.5; g.font = `700 ${fs}px ${font}, Georgia, serif`;
    while (g.measureText(text).width > cw * 0.86) { fs -= 2; g.font = `700 ${fs}px ${font}, Georgia, serif`; }
    g.fillText(text, cw / 2, ch / 2 + 3);
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), [mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ color: shade(bg, 0.7) }), mat({ map: t }), mat({ color: shade(bg, 0.7) })]);
  m.castShadow = true; return m;
}

// ---------- sky, sun, clouds ----------
export function sky(scene, { top = '#3D8EE0', horizon = '#BFE4F7', ground = '#BFE4F7', r = 380 } = {}) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, gnd: { value: new THREE.Color(ground) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, hor, gnd; varying vec3 vP; void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(hor, top, pow(clamp(y * 1.6, 0.0, 1.0), 0.7)) : gnd; gl_FragColor = vec4(c, 1.0); }' });
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), m); s.renderOrder = -10; scene.add(s); return s;
}
let cloudT = null;
function cloudTex() {
  if (cloudT) return cloudT;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const puffs = [[110, 175, 58], [185, 140, 80], [285, 118, 96], [380, 150, 70], [250, 178, 70], [440, 180, 44], [70, 190, 36]];
  g.filter = 'blur(3px)';
  g.fillStyle = '#B9CCE6'; puffs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x + 4, y + 14, r, 0, 7); g.fill(); });
  g.fillStyle = '#FFFFFF'; puffs.forEach(([x, y, r]) => { g.beginPath(); g.arc(x - 2, y - 2, r * 0.92, 0, 7); g.fill(); });
  g.globalCompositeOperation = 'destination-out'; g.filter = 'blur(10px)'; g.fillRect(0, 214, 512, 60);
  cloudT = new THREE.CanvasTexture(c); cloudT.colorSpace = THREE.SRGBColorSpace; return cloudT;
}
export function clouds(scene, list, tint = '#FFFFFF') {
  const out = [];
  list.forEach(([x, y, z, s]) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(), color: tint, fog: false, toneMapped: false, depthWrite: false })); sp.position.set(x, y, z); sp.scale.set(s * 2, s, 1); scene.add(sp); out.push(sp); });
  return out;
}
export function sunlight(scene, E, { col = '#FFF0D6', i = 2.6, pos = [6, 10, 6], target = [0, 0, 0], box = 12, sky = '#CFE6FF', ground = '#C48A5A', hemi = 1.25, env = 0.25 } = {}) {
  scene.environment = E.envMap; scene.environmentIntensity = env;
  const r = lightRig(scene, { key: col, keyI: i, keyPos: pos, target, shadowBox: box, rimCol: '#FFFFFF', rimI: 0.4, sky, ground, hemiI: hemi });
  r.key.shadow.camera.far = 80; r.key.shadow.bias = -0.0006; r.key.shadow.camera.updateProjectionMatrix();
  return r;
}

// ---------- reusable bits ----------
export function hills(scene, { col = '#79C25A', z = -90, list } = {}) {
  const g = new THREE.Group(); scene.add(g);
  (list || [[-40, z, 34, 12], [10, z - 10, 46, 16], [60, z + 4, 36, 11], [-90, z + 10, 40, 10]]).forEach(([x, zz, r, h], i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat({ color: shade(col, 0.92 + rnd(i) * 0.16), map: T.grass(col, [6, 3]) }));
    m.scale.set(r, h, r * 0.6); m.position.set(x, -h * 0.25, zz); g.add(m);
    for (let k = 0; k < 6; k++) { const a = rnd(i * 9 + k) * 2 - 1; const t = tree(0.5 + rnd(k) * 0.4); t.position.set(x + a * r * 0.6, h * (0.75 - Math.abs(a) * 0.45) - 1, zz + r * 0.25); t.scale.multiplyScalar(2.2); g.add(t); }
  });
  return g;
}
export function tree(s = 1, col = '#4E9A3C', kind = 'round') {
  const g = new THREE.Group();
  cyl(0.12 * s, 0.18 * s, 1.6 * s, mat({ color: '#7A5234' }), 0, 0.8 * s, 0, g);
  const lm = mat({ color: col });
  if (kind === 'cypress') { const c = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), lm); c.scale.set(0.7 * s, 2.6 * s, 0.7 * s); c.position.y = 3.2 * s; c.castShadow = true; g.add(c); }
  else [[0, 2.3, 0, 1.0], [0.6, 2.0, 0.2, 0.75], [-0.6, 2.0, -0.1, 0.8], [0.1, 2.9, -0.2, 0.75], [0.2, 2.2, 0.6, 0.7]].forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 2), mat({ color: shade(col, 0.9 + rnd(i) * 0.2) })); m.position.set(x * s, y * s, z * s); m.castShadow = true; g.add(m);
  });
  return g;
}
export function pole(h = 7) {
  const g = new THREE.Group(), w = mat({ color: '#6E4E36' });
  cyl(0.09, 0.12, h, w, 0, h / 2, 0, g, 8); box(1.8, 0.1, 0.1, w, 0, h - 0.6, 0, g); box(1.2, 0.08, 0.08, w, 0, h - 1.1, 0, g);
  [-0.8, -0.3, 0.3, 0.8].forEach((x) => cyl(0.03, 0.03, 0.12, mat({ color: '#CFE3E8' }), x, h - 0.5, 0, g, 6));
  return g;
}
export function wire(a, b, sag = 0.6, col = '#2A2A33') {
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * sag; pts.push(p); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.015, 4), new THREE.MeshBasicMaterial({ color: col })); return m;
}
export function lamp() {
  const g = new THREE.Group(), m = mat({ color: '#2E3A35', metalness: 0.3, roughness: 0.5 });
  cyl(0.05, 0.07, 3.2, m, 0, 1.6, 0, g, 8); cyl(0.18, 0.1, 0.3, m, 0, 3.3, 0, g, 8);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF3C8', emissive: '#FFE7A0', emissiveIntensity: 0.6 })); b.position.y = 3.15; g.add(b);
  return g;
}
export function barrel() { const g = new THREE.Group(); cyl(0.33, 0.33, 0.8, mat({ color: '#9A6337', map: T.planks('#9A6337') }), 0, 0.4, 0, g, 16); [0.12, 0.68].forEach((y) => cyl(0.345, 0.345, 0.05, mat({ color: '#3A3A3F', metalness: 0.4 }), 0, y, 0, g, 16)); return g; }
export function crate(s = 0.6) { const g = new THREE.Group(); box(s, s, s, mat({ map: T.planks('#B07A48', [0.5, 0.5]) }), 0, s / 2, 0, g); return g; }
export function car(col = '#2C3A4A') {
  const g = new THREE.Group(), m = mat({ color: col, roughness: 0.4, metalness: 0.2 }), dark = mat({ color: '#1E1E24', roughness: 0.6 });
  box(1.5, 0.5, 3.2, m, 0, 0.75, 0, g); box(1.3, 0.8, 1.4, m, 0, 1.4, -0.3, g);
  box(1.2, 0.5, 0.05, mat({ color: '#9CC7E4', roughness: 0.1 }), 0, 1.5, 0.41, g);
  [[-0.78, 1.1], [0.78, 1.1], [-0.78, -1.1], [0.78, -1.1]].forEach(([x, z]) => { const w = cyl(0.36, 0.36, 0.22, dark, x, 0.36, z, g, 16); w.rotation.z = Math.PI / 2; const hub = cyl(0.12, 0.12, 0.24, mat({ color: '#D9D2C2' }), x, 0.36, z, g, 10); hub.rotation.z = Math.PI / 2; });
  [-0.5, 0.5].forEach((x) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat({ color: '#FFF3C8', emissive: '#FFE7A0', emissiveIntensity: 0.3 })); l.position.set(x, 0.95, 1.62); g.add(l); });
  return g;
}
export function fence(len = 10, col = '#F4EFE4') {
  const g = new THREE.Group(), m = mat({ color: col });
  for (let x = 0; x <= len; x += 1.5) box(0.1, 1.0, 0.1, m, x, 0.5, 0, g);
  [0.45, 0.85].forEach((y) => box(len, 0.08, 0.06, m, len / 2, y, 0, g));
  return g;
}
export function bunting(a, b, cols = ['#D8343F', '#F4EFE4', '#3C6FB6', '#F2C230']) {
  const g = new THREE.Group(); g.add(wire(a, b, 0.5, '#3A2A2A'));
  const n = Math.round(a.distanceTo(b) / 0.5);
  for (let i = 1; i < n; i++) {
    const t = i / n, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(t * Math.PI) * 0.5;
    const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.16, 0, 0), new THREE.Vector3(0.16, 0, 0), new THREE.Vector3(0, -0.32, 0)]), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    tri.position.copy(p); tri.lookAt(p.x + (b.z - a.z), p.y, p.z - (b.x - a.x)); g.add(tri);
  }
  return g;
}
const LOOKS = [
  { body: '#5C8FD6', hat: 'bowler', hatCol: '#3B3346' }, { body: '#E8734A', hat: 'cap', hatCol: '#6E8A4F' }, { body: '#F2B8C6', hat: 'flower', pattern: 'apron' },
  { body: '#9BC46A', hat: 'boater', hatCol: '#E8C77A' }, { body: '#8C6FC9', hat: 'tophat', hatCol: '#2A2638' }, { body: '#F2C230', hat: 'beanie', hatCol: '#D8343F', pattern: 'overalls' },
  { body: '#4FB3A9', hat: 'none', neck: 'tie' }, { body: '#D8584A', hat: 'cap', hatCol: '#3B3346', pattern: 'stripes' },
];
/** cheap background extras: small cut-outs at low resolution */
export function extras(scene, spots, moodFn) {
  return spots.map(([x, z, k, mood], i) => { const p = new Toon(LOOKS[(k ?? i) % LOOKS.length], { height: 1.7, res: 0.5 }); p.set({ mood: mood || 'neutral', armL: [8, 6], armR: [8, 6] }); p.at(x, 0, z); scene.add(p.group); return p; });
}

// ---------- SETS ----------
const SHOPS = [['BAKERY', '#C9603F', 'brick', '#D8343F'], ['GENERAL STORE', '#6FA3B8', 'wood', null], ['BARBER', '#E3C16F', 'wood', '#3C6FB6'], ['GRAND HOTEL', '#9E4A3A', 'brick', null],
  ['POST OFFICE', '#7FA36A', 'wood', null], ['TAILOR', '#B98ACF', 'wood', '#2E4E3F'], ['HARDWARE', '#B5553C', 'brick', '#F2C230'], ['CAFE', '#E58A6A', 'wood', '#2E4E3F'],
  ['BANK', '#C7B79A', 'brick', null], ['PHARMACY', '#5FA39A', 'wood', '#D8343F'], ['SHOES', '#D9A34A', 'wood', null], ['THEATER', '#A3485A', 'brick', '#F2C230']];

/** a small-town main street running along -z. The road is x -4..4; boardwalks x ±4..6; shop fronts at x ±6. */
export function mainStreet(E, { len = 70, people = true, cars = true, dusk = false, shops = SHOPS } = {}) {
  const buildings = [];
  const scene = new THREE.Scene();
  sky(scene, dusk ? { top: '#3B3F8F', horizon: '#F59C6B' } : {});
  const sun = sunlight(scene, E, dusk ? { col: '#FFB27A', i: 2.0, pos: [-8, 5, -14], sky: '#B9A2D8', ground: '#7A4A3A', hemi: 0.9 } : { pos: [9, 13, 5], box: 16 });
  clouds(scene, [[-30, 26, -100, 16], [20, 34, -110, 20], [55, 22, -90, 12], [-60, 30, -80, 14], [5, 20, -70, 9]], dusk ? '#FFC9B0' : '#FFFFFF');
  hills(scene, { z: -len - 30 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, len + 40), mat({ map: T.dirt('#C98A52', [2, (len + 40) / 8]) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -len / 2 + 10); road.receiveShadow = true; scene.add(road);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat({ map: T.grass('#79C25A', [60, 60]) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  [-1, 1].forEach((s) => {
    const walk = box(2.2, 0.18, len + 20, mat({ map: T.planks('#A8693E', [(len + 20) / 3, 1]) }), s * 5.1, 0.09, -len / 2 + 5, scene);
    walk.material.map.rotation = Math.PI / 2;
    let z = 8, k = s > 0 ? 0 : 5;
    while (z > -len) {
      const [name, wall, kind, aw] = shops[k % shops.length]; const w = 5 + rnd(k) * 2.5, h = 6 + rnd(k * 3) * 3.5; k++;
      const front = mat({ map: facade(name, { wall, kind, awning: aw, w, h, seed: k }) }), side = mat({ color: shade(wall, 0.85) });
      const b = new THREE.Mesh(new THREE.BoxGeometry(6, h, w), s < 0 ? [front, side, side, side, side, side] : [side, front, side, side, side, side]);
      b.position.set(s * 9.2, h / 2, z - w / 2); b.castShadow = b.receiveShadow = true; scene.add(b); buildings.push({ name, side: s, z: z - w / 2, w, h, x: s * 6.2 });
      if (aw) { const a = box(1.4, 0.06, w - 0.4, mat({ color: aw }), s * 5.6, 2.9, z - w / 2, scene); a.rotation.z = s * 0.35; }
      z -= w + 0.15;
    }
    for (let zz = 4; zz > -len; zz -= 12) { const p = pole(7.5); p.position.set(s * 4.4, 0, zz); scene.add(p); }
    for (let zz = -2; zz > -len; zz -= 16) { const l = lamp(); l.position.set(s * 4.3, 0.18, zz); scene.add(l); }
  });
  for (let zz = 4; zz > -len + 12; zz -= 12) [-1, 1].forEach((s) => [-0.8, -0.3, 0.3, 0.8].forEach((dx) => scene.add(wire(new THREE.Vector3(s * 4.4 + dx, 6.95, zz), new THREE.Vector3(s * 4.4 + dx, 6.95, zz - 12), 0.45))));
  for (let zz = -6; zz > -len; zz -= 22) scene.add(bunting(new THREE.Vector3(-4.4, 6.2, zz), new THREE.Vector3(4.4, 6.2, zz - 2)));
  [[-4.6, -3], [4.7, -9], [-4.8, -20], [4.6, -27]].forEach(([x, z], i) => { const o = i % 2 ? barrel() : crate(); o.position.set(x, 0.18, z); scene.add(o); });
  const carsList = [];
  if (cars) [[2, -14, '#2C3A4A'], [-2, -30, '#7A2E2E'], [2, -44, '#2E5A44']].forEach(([x, z, c]) => { const v = car(c); v.position.set(x, 0, z); if (x < 0) v.rotation.y = Math.PI; scene.add(v); carsList.push(v); });
  const crowd = people ? extras(scene, [[-5.3, -6], [5.0, -10, 2], [-5.0, -15], [5.4, -18, 4], [-5.4, -24, 3], [4.9, -31, 5], [-5.0, -36, 6], [5.3, -42, 7], [-5.2, -48, 1]]) : [];
  if (dusk) crowd.forEach((p) => p.tint('#D9B9C9'));
  return { scene, sun, people: crowd, cars: carsList, buildings, faceAll(cam) { crowd.forEach((p) => p.face(cam)); } };
}

/** a shop / office interior. Back wall z = -depth, window in it; counter along the right side. */
export function interior(E, { w = 8, depth = 7, h = 4.2, wall = '#9E2E3A', motif = '#B8414C', floor = '#A8693E', ceiling = '#24524A', view = null, bulbs = true, signText = 'NO CREDIT · CASH ONLY', picture = true, counterOn = true, litter = true } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A1418');
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, depth + 2), mat({ map: T.planks(floor, [w / 2.5, (depth + 2) / 2.5]) })); fl.rotation.x = -Math.PI / 2; fl.position.z = -depth / 2 + 1; fl.receiveShadow = true; scene.add(fl);
  fl.material.map.rotation = Math.PI / 2;
  const wp = (len) => mat({ map: T.wallpaper(wall, motif, [len / 1.4, h / 1.4]) });
  const wain = (len) => mat({ map: T.planks('#6B3E26', [len / 2, 0.5]) });
  // back wall with a window hole: 4 boxes around the opening
  const ww = 3.2, wh = 1.9, wy = 1.1;
  const back = new THREE.Group(); back.position.z = -depth; scene.add(back);
  box((w - ww) / 2, h, 0.2, wp((w - ww) / 2), -(w + ww) / 4, h / 2, 0, back); box((w - ww) / 2, h, 0.2, wp((w - ww) / 2), (w + ww) / 4, h / 2, 0, back);
  box(ww, wy, 0.2, wain(ww), 0, wy / 2, 0, back); box(ww, h - wy - wh, 0.2, wp(ww), 0, h - (h - wy - wh) / 2, 0, back);
  const frameM = mat({ color: '#2F5C52' });
  box(ww + 0.2, 0.14, 0.3, frameM, 0, wy, 0.05, back); box(ww + 0.2, 0.14, 0.3, frameM, 0, wy + wh, 0.05, back); box(0.12, wh, 0.3, frameM, -ww / 2, wy + wh / 2, 0.05, back); box(0.12, wh, 0.3, frameM, ww / 2, wy + wh / 2, 0.05, back); box(0.06, wh, 0.1, frameM, 0, wy + wh / 2, 0.05, back);
  const viewPlane = new THREE.Mesh(new THREE.PlaneGeometry(ww * 2.6, wh * 2.6), new THREE.MeshBasicMaterial({ color: '#BFE4F7', toneMapped: false })); viewPlane.position.set(0, wy + wh / 2, -2.5); back.add(viewPlane);
  if (view) { viewPlane.material.map = view; viewPlane.material.color.set('#FFFFFF'); }
  [-1, 1].forEach((s) => { const sw = box(0.2, h, depth + 2, wp(depth + 2), s * w / 2, h / 2, -depth / 2 + 1, scene); sw.material.map.repeat.set((depth + 2) / 1.4, h / 1.4); });
  [-1, 1].forEach((s) => box(0.24, 1.0, depth + 2, wain(depth + 2), s * (w / 2 - 0.02), 0.5, -depth / 2 + 1, scene));
  box((w - ww) / 2, 1.0, 0.24, wain(2), -(w + ww) / 4, 0.5, -depth + 0.02, scene); box((w - ww) / 2, 1.0, 0.24, wain(2), (w + ww) / 4, 0.5, -depth + 0.02, scene);
  const ceil = box(w, 0.2, depth + 2, mat({ map: T.wallpaper(ceiling, shade(ceiling, 1.25), [w / 1.2, (depth + 2) / 1.2]) }), 0, h + 0.1, -depth / 2 + 1, scene);
  box(w, 0.16, 0.3, mat({ color: '#E8DCC0' }), 0, h - 0.08, -depth + 0.1, scene);
  // counter on the right
  const counter = new THREE.Group(); counter.position.set(w / 2 - 1.3, 0, -depth / 2 + 0.6); if (counterOn) scene.add(counter);
  box(1.0, 1.1, depth - 1.5, mat({ map: T.planks('#7A3E24', [1, 2]) }), 0, 0.55, 0, counter);
  box(1.2, 0.08, depth - 1.3, mat({ map: T.felt('#1F5A45') }), 0, 1.14, 0, counter);
  box(0.1, 0.06, depth - 1.3, mat({ color: '#C9A13B', metalness: 0.6, roughness: 0.3 }), -0.62, 1.12, 0, counter);
  // picture frame + sign
  const pic = canvasTex('pic', 256, 200, (g) => { g.fillStyle = '#E9DCC0'; g.fillRect(0, 0, 256, 200); g.strokeStyle = '#3A2A22'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 140); g.quadraticCurveTo(90, 60, 140, 120); g.quadraticCurveTo(170, 80, 220, 140); g.stroke(); g.fillStyle = '#C9603F'; g.beginPath(); g.arc(190, 60, 22, 0, 7); g.fill(); });
  if (picture) { const pf = box(0.9, 0.7, 0.05, [mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ color: '#C9A13B' }), mat({ map: pic }), mat({ color: '#C9A13B' })], -w / 2 + 0.13, 2.4, -depth / 2, scene); pf.rotation.y = Math.PI / 2; }
  if (signText) { const sb = signBoard(signText, { w: 2.2, h: 0.4, bg: '#3A2A2A', fg: '#F2E6CF' }); sb.position.set(w / 2 - 0.13, 2.9, -depth / 2 + 0.6); sb.rotation.y = -Math.PI / 2; scene.add(sb); }
  // light: warm sun through the window + bulbs
  const sun = new THREE.DirectionalLight('#FFE4B8', 2.4); sun.position.set(-2, 6, -depth - 6); sun.target.position.set(0.5, 0, -1); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 }); sun.shadow.bias = -0.0006; sun.shadow.camera.updateProjectionMatrix(); sun.shadow.radius = 4;
  scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight('#FFE9D2', '#5A3A2A', 1.1));
  const fill = new THREE.PointLight('#FFD9A8', 6, 12, 1.4); fill.position.set(0, 3.2, -1); scene.add(fill);
  if (bulbs) [[-1.5, -2.2], [1.6, -4.5]].forEach(([x, z]) => {
    const cord = cyl(0.008, 0.008, 1.0, new THREE.MeshBasicMaterial({ color: '#C9A13B' }), x, h - 0.5, z, scene, 4);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#FFF6DA', emissive: '#FFE7A0', emissiveIntensity: 2.2 })); b.position.set(x, h - 1.05, z); scene.add(b);
    const pl = new THREE.PointLight('#FFD9A0', 3, 6, 1.6); pl.position.set(x, h - 1.15, z); scene.add(pl);
  });
  // floor litter (betting slips / paper) for life
  const slips = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshStandardMaterial({ color: '#F2E6CF', side: THREE.DoubleSide }), 140);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 140; i++) { e.set(-Math.PI / 2, 0, rnd(i * 3) * 6.3); q.setFromEuler(e); m4.compose(new THREE.Vector3((rnd(i) - 0.5) * (w - 1), 0.005 + i * 0.00005, -rnd(i * 7) * depth + 0.8), q, new THREE.Vector3(1, 1, 1)); slips.setMatrixAt(i, m4); slips.setColorAt(i, new THREE.Color(['#F2E6CF', '#E9D7A5', '#F4C7B0', '#CFE3D0'][i % 4])); }
  slips.receiveShadow = true; if (litter) scene.add(slips);
  return { scene, sun: { key: sun }, counter, window: viewPlane, w, depth, h };
}

/** 3D Suburban Living Room (RicksClips "The Burglar Who Only Moved Furniture") */
export function livingRoom(E, { w = 8, depth = 7, h = 4.2, wall = '#F6F0E2', floor = '#9A633E', sofaCol = '#C73B32', dusk = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(dusk ? '#161324' : '#E8F4FC');
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  // Floor
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, depth + 2), mat({ map: T.planks(floor, [w / 2.5, (depth + 2) / 2.5]) }));
  fl.rotation.x = -Math.PI / 2; fl.position.z = -depth / 2 + 1; fl.receiveShadow = true; scene.add(fl);
  // Carpet / Rug
  const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), mat({ map: T.rug('#EFE4CE', '#C96238') }));
  rugMesh.rotation.x = -Math.PI / 2; rugMesh.position.set(0, 0.015, -depth / 2 + 0.6); rugMesh.receiveShadow = true; scene.add(rugMesh);
  // Walls
  const wallM = mat({ color: wall });
  const wainM = mat({ color: '#FFFFFF' });
  const back = new THREE.Group(); back.position.z = -depth; scene.add(back);
  box(w, h, 0.2, wallM, 0, h / 2, 0, back);
  box(w, 0.9, 0.24, wainM, 0, 0.45, 0.02, back); // wainscoting
  [-1, 1].forEach((s) => {
    const sw = box(0.2, h, depth + 2, wallM, s * w / 2, h / 2, -depth / 2 + 1, scene);
    box(0.24, 0.9, depth + 2, wainM, s * (w / 2 - 0.02), 0.45, -depth / 2 + 1, scene);
  });
  // Window on the back wall
  const winW = 2.8, winH = 1.8, winY = 1.4;
  const frameM = mat({ color: '#FFFFFF' });
  box(winW + 0.2, 0.12, 0.3, frameM, 0, winY, 0.1, back);
  box(winW + 0.2, 0.12, 0.3, frameM, 0, winY + winH, 0.1, back);
  box(0.12, winH, 0.3, frameM, -winW / 2, winY + winH / 2, 0.1, back);
  box(0.12, winH, 0.3, frameM, winW / 2, winY + winH / 2, 0.1, back);
  box(0.06, winH, 0.1, frameM, 0, winY + winH / 2, 0.1, back);
  const viewPlane = new THREE.Mesh(new THREE.PlaneGeometry(winW * 1.5, winH * 1.5), new THREE.MeshBasicMaterial({ color: dusk ? '#2B385E' : '#7CBCE6' }));
  viewPlane.position.set(0, winY + winH / 2, -1.2); back.add(viewPlane);
  // Couch (sofa group)
  const couch = new THREE.Group(); couch.position.set(0, 0, -depth / 2 + 0.6); scene.add(couch);
  const sofaM = mat({ color: sofaCol, roughness: 0.9 });
  const cushionM = mat({ color: shade(sofaCol, 1.08), roughness: 0.85 });
  box(2.8, 0.38, 1.1, sofaM, 0, 0.28, 0, couch); // base
  box(1.3, 0.22, 0.95, cushionM, -0.68, 0.52, 0.04, couch); // left cushion
  box(1.3, 0.22, 0.95, cushionM, 0.68, 0.52, 0.04, couch);  // right cushion
  box(2.8, 0.72, 0.32, sofaM, 0, 0.82, -0.42, couch); // backrest
  [-1, 1].forEach((s) => box(0.32, 0.56, 1.14, sofaM, s * 1.52, 0.64, 0, couch)); // armrests
  [[-1.4, -0.45], [1.4, -0.45], [-1.4, 0.45], [1.4, 0.45]].forEach(([x, z]) => {
    cyl(0.04, 0.03, 0.14, mat({ color: '#4A2A1A' }), x, 0.07, z, couch, 6);
  });
  // Side Table with Lamp
  const table = new THREE.Group(); table.position.set(2.2, 0, -depth / 2 + 0.6); scene.add(table);
  box(0.7, 0.62, 0.7, mat({ map: T.planks('#6B3E26') }), 0, 0.31, 0, table);
  // Lamp
  cyl(0.12, 0.16, 0.04, mat({ color: '#D4AF37' }), 0, 0.64, 0, table);
  cyl(0.02, 0.02, 0.36, mat({ color: '#D4AF37' }), 0, 0.82, 0, table);
  const shadeMesh = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 16, 1, true), mat({ color: '#E8D5B5', side: THREE.DoubleSide }));
  shadeMesh.position.set(0, 1.05, 0); table.add(shadeMesh);
  const lampLight = new THREE.PointLight('#FFE2A6', 3.2, 6, 1.6); lampLight.position.set(0, 1.0, 0); table.add(lampLight);
  // Gallery Wall (art frames above couch)
  [[-1.6, 2.6, 0.7, 0.9], [-0.5, 2.8, 0.9, 0.6], [0.6, 2.5, 0.8, 0.8], [1.7, 2.7, 0.6, 0.8]].forEach(([x, y, fw, fh], i) => {
    const frame = box(fw, fh, 0.04, mat({ color: ['#8A4B2A', '#D4AF37', '#2A2633', '#FFFFFF'][i] }), x, y, -depth + 0.12, scene);
    box(fw - 0.12, fh - 0.12, 0.05, mat({ color: ['#F2D7B5', '#A5D6A7', '#90CAF9', '#FFE082'][i] }), x, y, -depth + 0.13, scene);
  });
  // Houseplant in ceramic pot
  const plant = new THREE.Group(); plant.position.set(-2.4, 0, -depth / 2 - 0.6); scene.add(plant);
  cyl(0.24, 0.18, 0.44, mat({ color: '#F2E8DC' }), 0, 0.22, 0, plant);
  cyl(0.22, 0.22, 0.04, mat({ color: '#3A2016' }), 0, 0.42, 0, plant);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.25;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.45), mat({ color: '#2E7D32', side: THREE.DoubleSide }));
    leaf.position.set(Math.cos(a) * 0.12, 0.55 + i * 0.08, Math.sin(a) * 0.12);
    leaf.rotation.set(-0.4, a, 0.5); plant.add(leaf);
  }
  // Lighting
  const sun = new THREE.DirectionalLight(dusk ? '#3A4870' : '#FFE8C8', dusk ? 0.8 : 2.4);
  sun.position.set(-3, 6, -depth - 4); sun.target.position.set(0, 0.5, -depth / 2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 });
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(dusk ? '#2A3050' : '#FFEEDD', '#4A3A2A', 1.0));
  return { scene, sun: { key: sun }, couch, rug: rugMesh, table, lampLight, window: viewPlane, w, depth, h };
}

/** 3D Suburban Kitchen (RicksClips "The Burglar Who Only Moved Furniture") */
export function kitchen(E, { w = 8, depth = 7, h = 4.2, wall = '#FDEEAA', fridgeCol = '#3EB8AB' } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#FFF8EE');
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  // Floor: turquoise/white checkerboard
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, depth + 2), mat({ map: T.checker('#2D8A82', '#FFFFFF', [w / 1.5, (depth + 2) / 1.5]) }));
  fl.rotation.x = -Math.PI / 2; fl.position.z = -depth / 2 + 1; fl.receiveShadow = true; scene.add(fl);
  // Walls
  const wallM = mat({ color: wall });
  const back = new THREE.Group(); back.position.z = -depth; scene.add(back);
  box(w, h, 0.2, wallM, 0, h / 2, 0, back);
  [-1, 1].forEach((s) => box(0.2, h, depth + 2, wallM, s * w / 2, h / 2, -depth / 2 + 1, scene));
  // Door on back wall
  const doorM = mat({ color: '#FFFFFF' });
  box(1.3, 2.5, 0.24, doorM, 1.8, 1.25, 0.02, back);
  cyl(0.04, 0.04, 0.08, mat({ color: '#D4AF37' }), 1.3, 1.2, 0.16, back);
  // Refrigerator (RicksClips sliding turquoise fridge covered in sticky notes)
  const fridge = new THREE.Group(); fridge.position.set(-0.2, 0, -depth + 0.8); scene.add(fridge);
  const fMat = mat({ color: fridgeCol, roughness: 0.35, metalness: 0.1 });
  box(1.2, 2.4, 1.1, fMat, 0, 1.2, 0, fridge);
  box(1.22, 0.04, 1.12, mat({ color: '#257068' }), 0, 1.5, 0, fridge); // door seam
  // Handles
  box(0.04, 0.45, 0.06, mat({ color: '#E8E8E8', metalness: 0.8, roughness: 0.2 }), 0.5, 1.75, 0.58, fridge);
  box(0.04, 0.45, 0.06, mat({ color: '#E8E8E8', metalness: 0.8, roughness: 0.2 }), 0.5, 1.05, 0.58, fridge);
  // Sticky notes on fridge door: "DON'T MOVE!"
  const noteCols = ['#FFF59D', '#F48FB1', '#81D4FA', '#A5D6A7'];
  for (let i = 0; i < 8; i++) {
    const nx = -0.35 + (i % 3) * 0.35, ny = 1.3 + Math.floor(i / 3) * 0.35;
    const note = box(0.22, 0.22, 0.01, mat({ color: noteCols[i % noteCols.length] }), nx, ny, 0.56, fridge);
    note.rotation.z = (rnd(i * 5) - 0.5) * 0.2;
  }
  // Kitchen counter + Sink
  const counter = new THREE.Group(); counter.position.set(-2.2, 0, -depth / 2 + 0.4); scene.add(counter);
  box(1.2, 0.95, depth - 1.5, mat({ color: '#2D8A82' }), 0, 0.475, 0, counter);
  box(1.3, 0.08, depth - 1.3, mat({ color: '#FFFFFF', roughness: 0.3 }), 0, 0.99, 0, counter);
  // Faucet
  cyl(0.02, 0.02, 0.25, mat({ color: '#E8E8E8', metalness: 0.8, roughness: 0.2 }), 0, 1.15, 0, counter);
  // Red rotary wall telephone mounted with blue tape
  const phoneGroup = new THREE.Group(); phoneGroup.position.set(0.9, 1.8, -depth + 0.15); scene.add(phoneGroup);
  box(0.3, 0.4, 0.12, mat({ color: '#C93B3B' }), 0, 0, 0, phoneGroup);
  cyl(0.08, 0.08, 0.04, mat({ color: '#FFFFFF' }), 0, 0.05, 0.07, phoneGroup); // dial
  // Blue painter tape strips holding it
  box(0.36, 0.06, 0.01, mat({ color: '#3A74B8' }), 0, 0.22, 0.08, phoneGroup);
  box(0.36, 0.06, 0.01, mat({ color: '#3A74B8' }), 0, -0.22, 0.08, phoneGroup);
  // Hanging ceiling pendant lamp
  const lampP = new THREE.Group(); lampP.position.set(0, h - 0.1, -depth / 2 + 0.6); scene.add(lampP);
  cyl(0.01, 0.01, 1.0, mat({ color: '#333333' }), 0, -0.5, 0, lampP);
  const shadeP = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 16, 1, true), mat({ color: '#3EB8AB', side: THREE.DoubleSide }));
  shadeP.position.set(0, -1.0, 0); lampP.add(shadeP);
  const kLight = new THREE.PointLight('#FFF0D6', 4.5, 9, 1.5); kLight.position.set(0, -1.1, 0); lampP.add(kLight);
  // Lighting
  const sun = new THREE.DirectionalLight('#FFE6C2', 2.2); sun.position.set(2, 6, -depth - 3); sun.target.position.set(0, 0.5, -depth / 2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 });
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#FFF6EE', '#4A423A', 1.1));
  return { scene, sun: { key: sun }, fridge, counter, phone: phoneGroup, kLight, w, depth, h };
}

/** 3D Canyon Railroad (RicksClips "Why Perfect Railroads Don't Work") */
export function canyonRail(E, { len = 80, dusk = false } = {}) {
  const scene = new THREE.Scene();
  sky(scene, dusk ? { top: '#4A3B7A', horizon: '#F58A5A' } : { top: '#2E80D8', horizon: '#BDE0F5' });
  const sun = sunlight(scene, E, dusk ? { col: '#FF9E68', i: 2.2, pos: [-8, 6, -14], box: 18 } : { pos: [8, 14, 6], box: 18 });
  clouds(scene, [[-30, 26, -100, 16], [20, 32, -110, 20], [55, 20, -90, 12]], dusk ? '#FFC4B0' : '#FFFFFF');
  // High stratified canyon cliffs on left and right
  [-1, 1].forEach((s) => {
    const cliff = box(6, 32, len + 40, mat({ map: T.canyonWall([1, 4]) }), s * 9.5, 12, -len / 2 + 10, scene);
    cliff.castShadow = cliff.receiveShadow = true;
  });
  // Gorge river far below
  const river = new THREE.Mesh(new THREE.PlaneGeometry(16, len + 40), mat({ color: '#2B6E96', roughness: 0.2 }));
  river.rotation.x = -Math.PI / 2; river.position.set(0, -10, -len / 2 + 10); scene.add(river);
  // Bridge ballast & ties & steel rails
  const bridge = new THREE.Group(); scene.add(bridge);
  // Steel truss supports
  for (let z = 10; z > -len; z -= 14) {
    [-1, 1].forEach((s) => {
      const leg = cyl(0.12, 0.12, 12, mat({ color: '#3A3842' }), s * 2.8, -5, z, bridge, 4);
      leg.castShadow = true;
    });
  }
  // Ballast bed
  box(3.8, 0.4, len + 20, mat({ color: '#6A635E', roughness: 0.95 }), 0, -0.2, -len / 2 + 10, bridge);
  // Wooden railroad ties
  const tieM = mat({ map: T.planks('#5A3825', [1, 1]) });
  for (let z = 14; z > -len - 4; z -= 0.65) {
    box(2.8, 0.14, 0.28, tieM, 0, 0.05, z, bridge);
  }
  // Steel rails (with gap capability!)
  const railM = mat({ color: '#C4C8D0', metalness: 0.85, roughness: 0.25 });
  const railL = box(0.1, 0.16, len + 20, railM, -0.85, 0.18, -len / 2 + 10, bridge);
  const railR = box(0.1, 0.16, len + 20, railM, 0.85, 0.18, -len / 2 + 10, bridge);
  railL.castShadow = railR.castShadow = true;
  return { scene, sun, bridge, railL, railR };
}

/** grass, hills, a fence, trees, flowers. sunset: true = pink/orange evening */
export function meadow(E, { sunset = false, flowers = true, fenceOn = true, treesOn = true } = {}) {
  const scene = new THREE.Scene();
  sky(scene, sunset ? { top: '#5B4FA8', horizon: '#FF9E6E' } : { top: '#3D8EE0', horizon: '#CBEAF8' });
  const sun = sunlight(scene, E, sunset ? { col: '#FFB27A', i: 2.4, pos: [-12, 4, -18], sky: '#C9A6E0', ground: '#6A4A3A', hemi: 1.0, box: 14 } : { pos: [8, 12, 6], box: 14 });
  clouds(scene, [[-30, 22, -90, 14], [25, 30, -100, 18], [60, 18, -80, 11], [-5, 16, -60, 8]], sunset ? '#FFB8A0' : '#FFFFFF');
  const geo = new THREE.PlaneGeometry(200, 200, 100, 100); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 0.08) * 0.6 + Math.cos(y * 0.06 + 1) * 0.8 + (Math.abs(x) < 6 && Math.abs(y) < 10 ? 0 : 0)); }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat({ map: T.grass(sunset ? '#7DB55A' : '#6DBB4A', [50, 50]) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; ground.receiveShadow = true; scene.add(ground);
  const flat = new THREE.Mesh(new THREE.CircleGeometry(12, 48), mat({ map: T.grass(sunset ? '#7DB55A' : '#6DBB4A', [6, 6]) })); flat.rotation.x = -Math.PI / 2; flat.receiveShadow = true; scene.add(flat);
  hills(scene, { z: -70, col: sunset ? '#86B860' : '#79C25A' });
  (treesOn ? [[-7, -9, 'round'], [8, -14, 'round'], [-14, -20, 'cypress'], [-11, -22, 'cypress'], [14, -26, 'cypress'], [17, -25, 'cypress']] : []).forEach(([x, z, k], i) => { const t = tree(1.1 + rnd(i) * 0.4, '#4E9A3C', k); t.position.set(x, 0, z); scene.add(t); });
  if (fenceOn) { const f = fence(16); f.position.set(-8, 0, -6); scene.add(f); }
  if (flowers) {
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 1600), m4 = new THREE.Matrix4();
    for (let i = 0; i < 1600; i++) { const a = rnd(i) * 6.28, r = 2 + rnd(i * 3.3) * 22; m4.makeTranslation(Math.cos(a) * r, 0.1, Math.sin(a) * r - 4); fl.setMatrixAt(i, m4); fl.setColorAt(i, new THREE.Color(['#F2D23A', '#F29BB5', '#FFFFFF', '#B98ACF', '#F28C4A'][i % 5])); }
    scene.add(fl);
    const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.025, 0.16, 3), mat({ color: sunset ? '#6FA650' : '#5DA83E' }), 4000);
    for (let i = 0; i < 4000; i++) { const a = rnd(i * 1.7) * 6.28, r = 1 + rnd(i * 5.1) * 14; m4.makeTranslation(Math.cos(a) * r, 0.07, Math.sin(a) * r - 3); tufts.setMatrixAt(i, m4); }
    scene.add(tufts);
  }
  return { scene, sun };
}

/** Parisian Train Terminal (Gare de l'Est / Vaulted Canopy) */
export function gareDeLEst(E, { len = 70 } = {}) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#1E355B', horizon: '#98BBD6' });
  const sun = sunlight(scene, E, { col: '#FFE2B8', i: 2.8, pos: [-10, 18, 12], box: 22 });
  
  // Platform floor
  const floor = box(14, 0.4, len + 30, mat({ map: T.cobblestone('#5A5660', [8, 24]), roughness: 0.65 }), 0, -0.2, -len / 2 + 10, scene);
  // Terminal back brick wall
  const wall = box(22, 16, 1, mat({ map: T.brick('#4E2F27', [4, 3]), roughness: 0.8 }), 0, 8, -len + 5, scene);
  // Arched cast-iron vaulted canopy
  const ironM = mat({ color: '#252930', metalness: 0.85, roughness: 0.3 });
  for (let z = 10; z > -len + 10; z -= 12) {
    [-1, 1].forEach((s) => {
      const col = cyl(0.18, 0.22, 11, ironM, s * 6.2, 5.5, z, scene);
      col.castShadow = true;
    });
    // Arch rib across ceiling
    const arch = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.12, 8, 24, Math.PI), ironM);
    arch.position.set(0, 11, z); arch.rotation.z = Math.PI; scene.add(arch);
  }
  // Tracks & Train
  const tracks = new THREE.Group(); tracks.position.set(3.5, 0, 0); scene.add(tracks);
  box(2.4, 0.15, len + 20, mat({ color: '#3A3840' }), 0, 0, -len/2 + 10, tracks);
  [-0.7, 0.7].forEach((x) => box(0.1, 0.14, len + 20, mat({ color: '#B5BAC4', metalness: 0.9 }), x, 0.1, -len/2 + 10, tracks));
  
  // Hanging station pendant lamps
  for (let z = 4; z > -len + 15; z -= 16) {
    const lamp = cyl(0.015, 0.015, 3.5, ironM, 0, 9.2, z, scene);
    const shadeL = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 16, 1, true), mat({ color: '#2B4A3E', side: THREE.DoubleSide }));
    shadeL.position.set(0, 7.3, z); scene.add(shadeL);
    const pl = new THREE.PointLight('#FFE2A0', 3.5, 12, 1.6); pl.position.set(0, 7.1, z); scene.add(pl);
  }
  return { scene, sun, floor, wall, tracks };
}

/** 3D Courtroom Set (Oak judge bench, witness stand, jury box, brass railing) */
export function courtroom(E, { w = 14, depth = 16, h = 8 } = {}) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#161F30', horizon: '#2D3B50' });
  const sun = sunlight(scene, E, { col: '#FFEED2', i: 2.4, pos: [6, 14, 8], box: 16 });
  
  // Polished herringbone parquet floor
  box(w, 0.2, depth, mat({ map: T.parquet('#54331C', [6, 6]), roughness: 0.45 }), 0, -0.1, -depth/2, scene);
  // Rich wood paneling walls
  box(w, h, 0.3, mat({ map: T.planks('#3E2314', [4, 2]), roughness: 0.7 }), 0, h/2, -depth, scene);
  [-1, 1].forEach((s) => box(0.3, h, depth, mat({ map: T.planks('#3E2314', [4, 2]), roughness: 0.7 }), s * w/2, h/2, -depth/2, scene));
  
  // Elevated Judge's Bench
  const bench = new THREE.Group(); bench.position.set(0, 0, -depth + 2.5); scene.add(bench);
  box(4.6, 0.5, 2.8, mat({ color: '#2E190E' }), 0, 0.25, 0, bench); // Dais platform
  box(4.2, 1.4, 1.2, mat({ map: T.planks('#4A2A18', [2, 1]) }), 0, 1.2, 0.6, bench); // Bench front
  box(4.4, 0.1, 1.4, mat({ color: '#3A1E10' }), 0, 1.95, 0.6, bench); // Desk top
  
  // Witness Stand
  const witness = box(1.4, 1.1, 1.2, mat({ map: T.planks('#4A2A18', [1, 1]) }), -3.2, 0.55, -depth + 3.2, scene);
  // Jury Box Railing
  const jury = box(1.2, 1.0, 5.0, mat({ map: T.planks('#4A2A18', [1, 3]) }), 3.8, 0.5, -depth + 5.5, scene);
  // Brass Gallery Railing
  cyl(0.04, 0.04, w - 2, mat({ color: '#D4AF37', metalness: 0.85, roughness: 0.25 }), 0, 1.0, -depth/2 + 2, scene).rotation.z = Math.PI / 2;
  
  return { scene, sun, bench, witness, jury };
}

/** 3D Bank Vault Set (Massive round steel door, safety deposit boxes, polished granite) */
export function bankVault(E, { w = 12, depth = 14, h = 7 } = {}) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#0E141E', horizon: '#1A2330' });
  const sun = sunlight(scene, E, { col: '#E0E8FF', i: 2.2, pos: [4, 12, 6], box: 14 });
  
  // Polished granite floor
  box(w, 0.2, depth, mat({ map: T.checker('#1E2228', '#2C323C', [12, 12], 32), roughness: 0.25 }), 0, -0.1, -depth/2, scene);
  // Reinforced concrete back wall
  box(w, h, 0.4, mat({ color: '#4A505A', roughness: 0.9 }), 0, h/2, -depth, scene);
  
  // Giant circular steel vault door
  const steelM = mat({ color: '#8892A0', metalness: 0.92, roughness: 0.22 });
  const doorGroup = new THREE.Group(); doorGroup.position.set(0, 3.2, -depth + 0.3); scene.add(doorGroup);
  cyl(2.4, 2.4, 0.6, steelM, 0, 0, 0, doorGroup, 32).rotation.x = Math.PI / 2; // Main door disk
  cyl(0.3, 0.3, 0.9, mat({ color: '#D4AF37', metalness: 0.9, roughness: 0.15 }), 0, 0, 0.2, doorGroup).rotation.x = Math.PI / 2; // Center hub
  // 6 spoke locking wheel handles
  for (let a = 0; a < 6; a++) {
    const spoke = cyl(0.04, 0.04, 1.6, mat({ color: '#C8D0DC', metalness: 0.9 }), 0, 0, 0.55, doorGroup);
    spoke.rotation.z = (a / 6) * Math.PI;
  }
  // Safety deposit box wall grid
  const depositWall = box(3.8, 5.0, 0.4, mat({ map: T.checker('#5C6470', '#4A525E', [8, 12], 16), metalness: 0.7, roughness: 0.4 }), -3.8, 2.5, -depth + 0.3, scene);
  
  return { scene, sun, door: doorGroup, depositWall };
}

/** Grand Canyon Trestle Beam Set (Sedimentary rock canyon wall + suspended timber beam) */
export function canyonBeam(E, { len = 40, wallDist = 14 } = {}) {
  const scene = new THREE.Scene();
  sky(scene, { top: '#1668C4', horizon: '#89C8F5' });
  const sun = sunlight(scene, E, { col: '#FFF0D0', i: 3.2, pos: [-14, 22, 16], box: 24 });

  // Sedimentary canyon wall texture generator
  const canyonTex = canvasTex('canyonWall', 512, 1024, (g) => {
    const stripes = ['#8C2218', '#B83824', '#D6582E', '#E88438', '#F2AE4E', '#C25032', '#781A12'];
    for (let y = 0; y < 1024; y += 16) {
      g.fillStyle = stripes[Math.floor((y / 16 + Math.sin(y * 0.05) * 2) % stripes.length)];
      g.fillRect(0, y, 512, 18);
    }
  });

  // Massive Canyon Wall receding along -Z
  const wallGeo = new THREE.PlaneGeometry(len + 20, 36);
  const wallMat = mat({ map: canyonTex, roughness: 0.95 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(-wallDist, 10, -len / 2 + 5);
  wall.rotation.y = Math.PI / 2.2;
  scene.add(wall);

  // Suspended Wooden Timber Beam (Where characters sit)
  const beamM = mat({ map: T.planks('#8C6242', [1, 12]), roughness: 0.75 });
  const beam = box(0.65, 0.45, len, beamM, 0, 0, -len / 2 + 5, scene);
  beam.castShadow = beam.receiveShadow = true;

  // Support Trestle Pillars
  const woodM = mat({ color: '#5A3D28', roughness: 0.85 });
  for (let z = 2; z > -len + 4; z -= 8) {
    const post = box(0.35, 14, 0.35, woodM, -0.4, -7, z, scene);
    post.castShadow = true;
  }

  return { scene, sun, beam, wall };
}

/** render a set into a texture once (for windows, picture-in-picture, spyglass views) */
export function snapshot(E, scene, cam, w = 1024, h = 768) {
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });
  const r = E.renderer; const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.render(scene, cam); r.setRenderTarget(prev);
  return rt.texture;
}

/** Dynamic living particles: Floating sunlit dust motes in room sunbeams */
export function dustMotes(scene, count = 75, bounds = { x: 6, y: 3.5, z: 6 }) {
  const geo = new THREE.SphereGeometry(0.016, 6, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: '#FFF8D6',
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3();
  const seeds = [];
  for (let i = 0; i < count; i++) {
    const bx = (rnd(i * 1.3) - 0.5) * bounds.x;
    const by = 0.4 + rnd(i * 2.7) * (bounds.y - 0.4);
    const bz = -rnd(i * 3.9) * bounds.z;
    const speed = 0.08 + rnd(i * 5.1) * 0.12;
    const amp = 0.12 + rnd(i * 7.3) * 0.15;
    seeds.push({ bx, by, bz, speed, amp, phase: rnd(i * 9.1) * Math.PI * 2 });
    pos.set(bx, by, bz);
    m4.setPosition(pos);
    mesh.setMatrixAt(i, m4);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  return {
    mesh,
    update(t = 0) {
      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        const y = s.by + Math.sin(t * s.speed * 2 + s.phase) * s.amp;
        const x = s.bx + Math.sin(t * 0.6 + s.phase) * 0.08;
        const z = s.bz + Math.cos(t * 0.5 + s.phase) * 0.06;
        pos.set(x, y, z);
        m4.setPosition(pos);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  };
}

