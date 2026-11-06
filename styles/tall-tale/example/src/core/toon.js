// Toon people: flat 2D cartoon characters that live inside the 3D world as camera-facing cut-outs with real shadows.
// Upgraded 2D-3D Animation Engine:
//   - Parameterized Ink (NO global hardcoded red outlines; default crisp comic ink #141416)
//   - Diverse Body Types ('standard', 'lean', 'heavy'/'boss', 'athletic', 'kid')
//   - Diverse Head Shapes ('superellipse', 'oval', 'square', 'round')
//   - Hairstyle System ('messy'/'hacker', 'side-part', 'slick', 'curly'/'afro', 'buzz', 'bald', 'bun', 'waves')
//   - Eyewear Variety ('tech' rectangular, 'round' wireframe, 'sunglasses')
//   - Facial Hair ('stubble', 'full', 'goatee', 'mustache')
//   - Volume-preserving Squash and Stretch (scaleX = 1 / sqrt(scaleY))
//   - Expressive Hand Types ('type', 'point', 'fist', 'open', 'thumbs_up', 'cup', 'phone')
//   - Procedural Secondary Breathing & Overlapping Action
import * as THREE from 'three';
import { gielisRadius, RK4Spring, solveFABRIK2D, computeContactShadow } from './math_kinetics.js';

export const DEFAULT_INK = '#141416';
export const INK = DEFAULT_INK;
const LW = 10;
const R2D = Math.PI / 180;

export function shadeOf(hex, k = 0.78) {
  if (!hex || hex[0] !== '#') return '#111116';
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + ((1 << 24) + (f(r) << 16) + (f(gg) << 8) + f(b)).toString(16).slice(1);
}

// Generates heads based on superellipse / Lamé / oval / square profiles
function makeHeadPath(hx, hy, r, shape = 'superellipse') {
  const path = new Path2D();
  const N = 56;
  if (shape === 'oval') {
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x = hx + r * Math.cos(a) * 0.92;
      const y = hy + r * Math.sin(a) * 1.12;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
  } else if (shape === 'square') {
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rad = gielisRadius(a, 1.0, 0.95, 4, 3.2, 3.2, 3.0);
      const x = hx + r * rad * Math.cos(a) * 1.06;
      const y = hy + r * rad * Math.sin(a) * 0.98;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
  } else if (shape === 'round') {
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x = hx + r * Math.cos(a) * 1.02;
      const y = hy + r * Math.sin(a) * 1.0;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
  } else {
    // Default Gielis Superformula / Lamé
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rad = gielisRadius(a, 1.0, 0.94, 4, 2.0, 2.05, 1.95);
      const x = hx + r * rad * Math.cos(a) * 1.04;
      const y = hy + r * rad * Math.sin(a) * 0.94;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
  }
  path.closePath();
  return path;
}

// ---------- the drawing ----------
export function drawToon(g, look = {}, st = {}) {
  const L = {
    body: '#3A8F58',
    head: '#FDE4D2',
    hat: 'none',
    neck: 'none',
    pattern: 'plain',
    extra: [],
    bodyType: 'standard',
    headShape: 'superellipse',
    ink: DEFAULT_INK,
    hair: 'messy',
    hairCol: '#3D2514',
    ...look
  };
  const S = {
    mood: 'neutral',
    look: [0, 0],
    blink: 0,
    talk: 0,
    armL: [8, 6],
    armR: [8, 6],
    legs: 'stand',
    phase: 0,
    lean: 0,
    bob: 0,
    squash: 0,
    ...st
  };

  const ink = L.ink || (L.dark ? '#0A0A0C' : DEFAULT_INK);
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (S.flip) { g.translate(512, 0); g.scale(-1, 1); }

  // Pivot at the feet for lean
  g.translate(256, 1000); g.rotate((S.lean || 0) * R2D); g.translate(-256, -1000);

  // Volume-conserving squash and stretch
  const sqY = 1 + (S.squash || 0);
  const sqX = 1 / Math.sqrt(Math.max(0.1, sqY));
  g.translate(256, 1000);
  g.scale(sqX, sqY);
  g.translate(-256, -1000);

  const sit = S.legs === 'sit', jump = S.legs === 'jump';
  // Subtle procedural breathing
  const breath = S.breathe !== false ? Math.sin((S.phase || 0) * 1.8 + (st.t || 0) * 2.8) * 2.0 : 0;
  const by = (sit ? 210 : 0) + (L.kid ? 190 : 0) + (S.bob || 0) + (jump ? -60 : 0) + breath;

  // Body Dimensions & Silhouette Archetypes
  let bw = 90, top = 330 + by, bot = 600 + by * 0.98, legLW = 15, bodyLW = LW, armLW = 14;
  let shoulderW = 66;

  if (L.bodyType === 'lean' || L.bodyType === 'slim') {
    bw = 72; top = 345 + by; bot = 590 + by * 0.98;
    shoulderW = 54; legLW = 13; bodyLW = 8.5; armLW = 12;
  } else if (L.bodyType === 'heavy' || L.bodyType === 'broad' || L.bodyType === 'boss') {
    bw = 118; top = 315 + by; bot = 618 + by * 0.98;
    shoulderW = 82; legLW = 18; bodyLW = 13; armLW = 16;
  } else if (L.bodyType === 'athletic') {
    bw = 82; top = 325 + by; bot = 600 + by * 0.98;
    shoulderW = 76; legLW = 15; bodyLW = 10; armLW = 14;
  } else if (L.bodyType === 'kid') {
    bw = 64; top = 380 + by; bot = 560 + by * 0.98;
    shoulderW = 46; legLW = 11; bodyLW = 8; armLW = 10;
  }

  const bx = 256;
  const hipY = bot - 26;

  // ---- legs (behind the body) ----
  g.strokeStyle = ink; g.lineWidth = legLW;
  const leg = (sx, side) => {
    let kx, ky, fx, fy;
    if (sit) {
      const kx2 = sx + side * 30, ky2 = hipY + 44; fx = sx + side * 34; fy = 1000;
      g.beginPath(); g.moveTo(sx, hipY); g.lineTo(kx2, ky2); g.lineTo(fx, fy); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.ellipse(fx + side * 10, fy - 4, 20, 10, 0, 0, Math.PI * 2); g.fill(); return;
    }
    else if (S.legs === 'walk' || S.legs === 'run') {
      const amp = S.legs === 'run' ? 1.0 : 0.55, a = Math.sin(S.phase + (side > 0 ? Math.PI : 0)) * amp;
      const lift = Math.max(0, -Math.cos(S.phase + (side > 0 ? Math.PI : 0))) * (S.legs === 'run' ? 70 : 34);
      kx = sx + a * 22 + side * 6; ky = hipY + 200 - lift * 0.6; fx = sx + a * 34 + side * 8; fy = 1000 - lift;
    } else if (jump) { kx = sx + side * 40; ky = hipY + 170; fx = sx + side * 18; fy = 940; }
    else { kx = sx + side * 4; ky = hipY + 210; fx = sx + side * 10; fy = 1000; }
    g.beginPath(); g.moveTo(sx, hipY); g.quadraticCurveTo(kx, ky, fx, fy); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.ellipse(fx + side * 10, fy - 4, 20, 10, 0, 0, Math.PI * 2); g.fill();
  };
  leg(bx - bw * 0.45, -1); leg(bx + bw * 0.45, 1);

  // ---- body silhouette ----
  const body = new Path2D();
  body.moveTo(bx - shoulderW, top + 10);
  body.bezierCurveTo(bx - shoulderW * 1.25, top + 40, bx - bw - 6, bot - 120, bx - bw, bot - 50);
  body.bezierCurveTo(bx - bw + 4, bot + 6, bx + bw - 4, bot + 6, bx + bw, bot - 50);
  body.bezierCurveTo(bx + bw + 6, bot - 120, bx + shoulderW * 1.25, top + 40, bx + shoulderW, top + 10);
  body.bezierCurveTo(bx + shoulderW * 0.5, top - 8, bx - shoulderW * 0.5, top - 8, bx - shoulderW, top + 10);
  body.closePath();

  g.fillStyle = L.body; g.fill(body);
  g.save(); g.clip(body);
  drawPattern(g, L, bx, top, bot, bw, ink);
  // Soft volumetric 3D shadow & ambient highlight
  g.fillStyle = L.shade || shadeOf(L.body, 0.78); g.globalAlpha = 0.85;
  g.beginPath(); g.ellipse(bx + bw + 35, (top + bot) / 2 + 20, 70, 260, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 0.28; g.fillStyle = '#FFFFFF';
  g.beginPath(); g.ellipse(bx - shoulderW * 0.75, top + 90, 16, 60, 0.2, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1; g.restore();

  g.strokeStyle = ink; g.lineWidth = bodyLW; g.stroke(body);
  drawNeckwear(g, L, bx, top, ink);

  // ---- arms (in front of body) ----
  const hands = {};
  const arm = (side, [a, e], hold, handGesture) => {
    const sx = bx + side * shoulderW, sy = top + 46;
    const u = 118, lo = 112;
    const a1 = a * R2D, a2 = (a + e) * R2D;
    const ex = sx + side * Math.sin(a1) * u, ey = sy + Math.cos(a1) * u;
    const hx = ex + side * Math.sin(a2) * lo, hy = ey + Math.cos(a2) * lo;
    g.strokeStyle = ink; g.lineWidth = armLW;
    g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(ex, ey, hx, hy); g.stroke();
    if (hold) { g.save(); hold(g, hx, hy, side * (a + e) * R2D, side); g.restore(); }

    // Hand Gestures
    g.fillStyle = ink;
    if (handGesture === 'point') {
      g.beginPath(); g.ellipse(hx, hy, 15, 17, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.roundRect(hx + side * 12, hy - 6, side * 22, 10, 5); g.fill();
    } else if (handGesture === 'type') {
      // Rapid keyboard fingers
      g.beginPath(); g.ellipse(hx, hy, 15, 15, 0, 0, Math.PI * 2); g.fill();
      const fT = (st.t || 0) * 20;
      for (let fi = -1; fi <= 1; fi++) {
        const tap = Math.sin(fT + fi * 2) * 5;
        g.beginPath(); g.roundRect(hx + fi * 8 - 4, hy + 6 + tap, 7, 14, 3); g.fill();
      }
    } else if (handGesture === 'fist') {
      g.beginPath(); g.roundRect(hx - 16, hy - 16, 32, 32, 8); g.fill();
    } else if (handGesture === 'open') {
      g.beginPath(); g.ellipse(hx, hy, 18, 14, side * 0.3, 0, Math.PI * 2); g.fill();
      [-1, 0, 1].forEach((fi) => {
        g.beginPath(); g.roundRect(hx + side * 12 + fi * 4, hy - 14 + fi * 8, 8, 16, 4); g.fill();
      });
    } else {
      // Classic cartoon mitten
      g.beginPath(); g.ellipse(hx, hy, 15, 17, 0, 0, Math.PI * 2); g.fill();
    }
    hands[side < 0 ? 'L' : 'R'] = [hx, hy];
  };
  arm(-1, S.armL, S.holdL, S.handL);
  arm(1, S.armR, S.holdR, S.handR);

  // ---- head ----
  const hx = 256, hy = 178 + by * 0.99, r = 138;
  g.save();
  g.translate(hx, hy);
  // Volume-conserving head squash on impact
  const hsqY = 1 + (S.squash || 0) * 0.5;
  const hsqX = 1 / Math.sqrt(Math.max(0.2, hsqY));
  g.scale(hsqX, hsqY);
  g.translate(-hx, -hy);

  if (L.hat === 'bun') {
    g.fillStyle = L.hatCol || '#6B4A3A';
    g.beginPath(); g.arc(hx + 10, hy - r - 8, 46, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink; g.lineWidth = LW; g.stroke();
  }

  const head = makeHeadPath(hx, hy, r, L.headShape);
  g.fillStyle = L.head; g.fill(head);
  g.save(); g.clip(head);

  // Soft crescent shadow on the side away from the light
  g.fillStyle = 'rgba(215, 218, 235, 0.45)';
  g.beginPath(); g.arc(hx + 42, hy + 38, r * 1.05, 0, Math.PI * 2); g.rect(hx - 400, hy - 400, 800, 800); g.fill('evenodd');

  // Balaclava mask for stealth
  if (L.hat === 'balaclava' || L.mask) {
    g.fillStyle = L.hatCol || '#221F2C';
    g.fillRect(hx - 200, hy - 200, 400, 400);
    g.fillStyle = L.head;
    [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(hx + s * 46, hy + 4, 32, 26, 0, 0, Math.PI * 2); g.fill(); });
    g.beginPath(); g.ellipse(hx, hy + 66, 28, 18, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();

  g.strokeStyle = ink; g.lineWidth = LW + 2; g.stroke(head);

  // Draw Hairstyle
  drawHair(g, L, hx, hy, r, ink);

  // Draw Face & Facial Details
  drawFace(g, L, S, hx, hy, ink);

  // Draw Hat
  drawHat(g, L, hx, hy, r, ink);

  g.restore();
  g.restore();
  return hands;
}

// ---------- Hair Styles ----------
function drawHair(g, L, hx, hy, r, ink) {
  if (L.hat === 'balaclava' || L.mask || L.hair === 'none' || L.hair === false) return;
  const hc = L.hairCol || '#3D2514';
  g.fillStyle = hc; g.strokeStyle = ink; g.lineWidth = 7;

  if (L.hair === 'side-part') {
    g.beginPath();
    g.moveTo(hx - r * 0.82, hy - r * 0.2);
    g.bezierCurveTo(hx - r * 0.88, hy - r * 0.9, hx - 10, hy - r * 1.06, hx + 40, hy - r * 0.92);
    g.bezierCurveTo(hx + r * 0.84, hy - r * 0.82, hx + r * 0.92, hy - r * 0.2, hx + r * 0.78, hy);
    g.bezierCurveTo(hx + r * 0.7, hy - r * 0.5, hx + 30, hy - r * 0.65, hx - 10, hy - r * 0.52);
    g.bezierCurveTo(hx - 50, hy - r * 0.45, hx - r * 0.68, hy - r * 0.35, hx - r * 0.82, hy - r * 0.2);
    g.closePath(); g.fill(); g.stroke();
  } else if (L.hair === 'curly' || L.hair === 'afro') {
    // Volumetric cloud lobes encircling crown
    const lobes = [[-0.8, -0.3], [-0.7, -0.7], [-0.35, -0.95], [0, -1.02], [0.35, -0.95], [0.7, -0.7], [0.8, -0.3]];
    g.beginPath();
    lobes.forEach(([dx, dy]) => {
      g.arc(hx + dx * r, hy + dy * r, 38, 0, Math.PI * 2);
    });
    g.fill();
    lobes.forEach(([dx, dy]) => {
      g.beginPath(); g.arc(hx + dx * r, hy + dy * r, 38, 0, Math.PI * 2); g.stroke();
    });
  } else if (L.hair === 'slick' || L.hair === 'exec') {
    // Executive sleek combed hair
    g.beginPath();
    g.moveTo(hx - r * 0.85, hy - r * 0.1);
    g.bezierCurveTo(hx - r * 0.95, hy - r * 0.85, hx, hy - r * 1.15, hx + r * 0.85, hy - r * 0.75);
    g.bezierCurveTo(hx + r * 0.95, hy - r * 0.2, hx + r * 0.75, hy - r * 0.4, hx + 40, hy - r * 0.6);
    g.bezierCurveTo(hx - 20, hy - r * 0.6, hx - r * 0.65, hy - r * 0.35, hx - r * 0.85, hy - r * 0.1);
    g.closePath(); g.fill(); g.stroke();
  } else if (L.hair === 'buzz') {
    // Clean close buzzcut hairline
    g.lineWidth = 4;
    g.beginPath();
    g.arc(hx, hy, r + 2, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  } else {
    // Modern Casual Spiky / Hacker 'messy'
    g.beginPath();
    g.moveTo(hx - r * 0.85, hy - r * 0.15);
    g.lineTo(hx - r * 0.92, hy - r * 0.65);
    g.lineTo(hx - r * 0.72, hy - r * 0.6);
    g.lineTo(hx - r * 0.78, hy - r * 0.95);
    g.lineTo(hx - r * 0.45, hy - r * 0.85);
    g.lineTo(hx - r * 0.3, hy - r * 1.12);
    g.lineTo(hx, hy - r * 0.92);
    g.lineTo(hx + r * 0.25, hy - r * 1.08);
    g.lineTo(hx + r * 0.45, hy - r * 0.82);
    g.lineTo(hx + r * 0.75, hy - r * 0.92);
    g.lineTo(hx + r * 0.72, hy - r * 0.55);
    g.lineTo(hx + r * 0.88, hy - r * 0.4);
    g.lineTo(hx + r * 0.82, hy - r * 0.05);
    g.bezierCurveTo(hx + r * 0.6, hy - r * 0.4, hx + 20, hy - r * 0.55, hx - 10, hy - r * 0.45);
    g.bezierCurveTo(hx - 50, hy - r * 0.4, hx - r * 0.68, hy - r * 0.28, hx - r * 0.85, hy - r * 0.15);
    g.closePath(); g.fill(); g.stroke();
  }
}

function drawPattern(g, L, bx, top, bot, bw, ink) {
  const pc = L.patCol || shadeOf(L.body, 0.7);
  if (L.pattern === 'check') {
    g.strokeStyle = pc; g.globalAlpha = 0.55; g.lineWidth = 6;
    for (let x = bx - 120; x < bx + 120; x += 34) { g.beginPath(); g.moveTo(x, top - 20); g.lineTo(x, bot + 20); g.stroke(); }
    for (let y = top; y < bot + 20; y += 34) { g.beginPath(); g.moveTo(bx - 130, y); g.lineTo(bx + 130, y); g.stroke(); }
    g.lineWidth = 2; g.globalAlpha = 0.5; g.strokeStyle = L.patCol2 || '#B5372E';
    for (let x = bx - 103; x < bx + 120; x += 68) { g.beginPath(); g.moveTo(x, top - 20); g.lineTo(x, bot + 20); g.stroke(); }
    g.globalAlpha = 1;
  } else if (L.pattern === 'stripes') {
    g.fillStyle = pc; for (let x = bx - 130; x < bx + 130; x += 36) g.fillRect(x, top - 20, 14, bot - top + 40);
  } else if (L.pattern === 'overalls') {
    g.fillStyle = L.patCol || '#3E5FA8';
    g.beginPath(); g.roundRect(bx - 62, top + 110, 124, 110, 14); g.fill(); g.fillRect(bx - 130, top + 190, 260, 200);
    g.strokeStyle = shadeOf(g.fillStyle, 0.75); g.lineWidth = 4; g.setLineDash([8, 7]); g.strokeRect(bx - 48, top + 124, 96, 80); g.setLineDash([]);
    g.fillStyle = L.patCol || '#3E5FA8'; g.fillRect(bx - 58, top, 16, 120); g.fillRect(bx + 42, top, 16, 120);
    g.fillStyle = '#F1C24B'; [[-50, 118], [50, 118]].forEach(([dx, dy]) => { g.beginPath(); g.arc(bx + dx, top + dy, 8, 0, 7); g.fill(); });
  } else if (L.pattern === 'vest') {
    g.fillStyle = L.patCol || '#3B3346';
    g.beginPath(); g.moveTo(bx - 140, top - 10); g.lineTo(bx - 8, top + 120); g.lineTo(bx - 8, bot + 20); g.lineTo(bx - 140, bot + 20); g.fill();
    g.beginPath(); g.moveTo(bx + 140, top - 10); g.lineTo(bx + 8, top + 120); g.lineTo(bx + 8, bot + 20); g.lineTo(bx + 140, bot + 20); g.fill();
    g.fillStyle = '#E9C46A'; [150, 195, 240].forEach((dy) => { g.beginPath(); g.arc(bx + 26, top + dy, 6, 0, 7); g.fill(); });
  } else if (L.pattern === 'apron') {
    g.fillStyle = L.patCol || '#F4EFE4'; g.beginPath(); g.roundRect(bx - 70, top + 90, 140, bot - top, 18); g.fill();
    g.strokeStyle = shadeOf(L.patCol || '#F4EFE4', 0.8); g.lineWidth = 4; g.beginPath(); g.roundRect(bx - 40, top + 190, 80, 60, 8); g.stroke();
  }
}

function drawNeckwear(g, L, bx, top, ink) {
  const c = L.neckCol || '#D8343F';
  g.strokeStyle = ink; g.lineWidth = 6;
  if (L.neck === 'bowtie') {
    const y = top + 24, bt = new Path2D();
    bt.moveTo(bx, y); bt.bezierCurveTo(bx - 30, y - 30, bx - 64, y - 26, bx - 62, y); bt.bezierCurveTo(bx - 64, y + 26, bx - 30, y + 30, bx, y);
    bt.bezierCurveTo(bx + 30, y - 30, bx + 64, y - 26, bx + 62, y); bt.bezierCurveTo(bx + 64, y + 26, bx + 30, y + 30, bx, y);
    g.fillStyle = c; g.fill(bt);
    g.stroke(bt); g.fillStyle = shadeOf(c, 0.75); g.beginPath(); g.roundRect(bx - 13, y - 13, 26, 26, 6); g.fill(); g.stroke();
  } else if (L.neck === 'tie') {
    g.fillStyle = c; g.beginPath();
    g.moveTo(bx - 14, top + 10); g.lineTo(bx + 14, top + 10);
    g.lineTo(bx + 20, top + 140); g.lineTo(bx, top + 170); g.lineTo(bx - 20, top + 140);
    g.closePath(); g.fill(); g.stroke();
  } else if (L.neck === 'collar') {
    g.fillStyle = '#FFFFFF';
    [-1, 1].forEach((s) => {
      g.beginPath(); g.moveTo(bx, top + 18); g.lineTo(bx + s * 56, top + 2); g.lineTo(bx + s * 40, top + 46); g.closePath();
      g.fill(); g.stroke();
    });
  }
}

function eye(g, x, y, S, side, L, ink) {
  const [lx, ly] = S.look; const m = S.mood; const bl = S.blink || 0;
  g.fillStyle = ink; g.strokeStyle = ink;
  if (m === 'happy' || m === 'laugh') {
    g.lineWidth = 10; g.beginPath(); g.arc(x, y + 10, 20, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); return;
  }
  if (m === 'dizzy') {
    g.lineWidth = 6; g.beginPath();
    for (let a = 0; a < 12; a += 0.3) { const rr = a * 1.6; g.lineTo(x + Math.cos(a * side) * rr, y + Math.sin(a * side) * rr); }
    g.stroke(); return;
  }
  if (m === 'shock') {
    g.fillStyle = '#FFFFFF'; g.lineWidth = 6; g.beginPath(); g.ellipse(x, y, 26, 30, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(x + lx * 8, y + ly * 8, 7, 0, 7); g.fill(); return;
  }
  if (bl > 0.6) {
    g.lineWidth = 8; g.beginPath(); g.moveTo(x - 14, y + 4); g.quadraticCurveTo(x, y + 10, x + 14, y + 4); g.stroke(); return;
  }
  // Pupil with dynamic shine
  const px = x + lx * 9, py = y + ly * 8;
  g.beginPath(); g.ellipse(px, py, 13, 17 * (1 - bl * 0.6), 0, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF';
  g.beginPath(); g.arc(px - 3, py - 4, 3.5, 0, Math.PI * 2); g.fill();

  if (m === 'smug' || m === 'tired' || m === 'sly' || m === 'proud') {
    g.fillStyle = L.head; g.fillRect(x - 24, y - 28, 48, 26 + (m === 'tired' ? 6 : 0));
    g.lineWidth = 7; g.strokeStyle = ink;
    g.beginPath(); g.moveTo(x - 20, y - 2 + (m === 'tired' ? 6 : 0)); g.lineTo(x + 20, y - 2 + (m === 'tired' ? 6 : 0)); g.stroke();
  }
}

function drawFace(g, L, S, hx, hy, ink) {
  const m = S.mood, ex = 46, ey = hy + 4;
  // Eyebrows
  const brow = {
    neutral: [4, 0], smug: [-8, 10], happy: [8, 0], laugh: [10, 0], shock: [24, 0],
    worried: [10, -16], angry: [-10, 22], sad: [8, -18], sly: [-6, 12], proud: [6, 4],
    tired: [-2, 0], dizzy: [14, 0], suspicious: [16, 20], baffled: [20, -14], scheming: [-12, 16], rage: [-18, 28]
  }[m] || [4, 0];
  g.strokeStyle = ink; g.lineWidth = 12;
  [-1, 1].forEach((s) => {
    let lift = brow[0], tilt = brow[1] * s;
    if ((m === 'smug' || m === 'sly') && s > 0) { lift = 16; tilt = -4; }
    if (m === 'suspicious' && s > 0) { lift = -4; tilt = 10; }
    const y = ey - 44 - lift;
    g.beginPath(); g.moveTo(hx + s * (ex - 26), y + tilt * 0.5); g.quadraticCurveTo(hx + s * ex, y - 7, hx + s * (ex + 26), y - tilt * 0.5);
    g.stroke();
  });

  // Eyes
  eye(g, hx - ex, ey, S, -1, L, ink);
  eye(g, hx + ex, ey, S, 1, L, ink);

  // Glasses Variety
  const hasGlasses = L.glasses || L.extra.includes('glasses');
  if (hasGlasses) {
    const gStyle = L.glasses || 'round';
    if (gStyle === 'tech' || gStyle === 'square') {
      // Modern rectangular developer frames
      g.fillStyle = 'rgba(230,245,255,0.25)';
      g.strokeStyle = ink; g.lineWidth = 6;
      [-1, 1].forEach((s) => {
        g.beginPath(); g.roundRect(hx + s * ex - 28, ey - 22, 56, 44, 8); g.fill(); g.stroke();
        // Specular glint
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3.5;
        g.beginPath(); g.moveTo(hx + s * ex - 18, ey - 14); g.lineTo(hx + s * ex - 6, ey - 14); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 6;
      });
      g.beginPath(); g.moveTo(hx - 12, ey); g.lineTo(hx + 12, ey); g.stroke();
    } else if (gStyle === 'sunglasses') {
      // Dark polarized cool sunglasses
      g.fillStyle = '#1A1824'; g.strokeStyle = ink; g.lineWidth = 6;
      [-1, 1].forEach((s) => {
        g.beginPath(); g.roundRect(hx + s * ex - 30, ey - 24, 60, 48, 10); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(hx + s * ex - 20, ey - 16); g.lineTo(hx + s * ex + 10, ey + 14); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 6;
      });
      g.beginPath(); g.moveTo(hx - 10, ey - 8); g.lineTo(hx + 10, ey - 8); g.stroke();
    } else {
      // Classic round frames
      g.fillStyle = 'rgba(230,245,255,0.2)';
      g.strokeStyle = ink; g.lineWidth = 6;
      [-1, 1].forEach((s) => {
        g.beginPath(); g.arc(hx + s * ex, ey, 30, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4;
        g.beginPath(); g.arc(hx + s * ex - 8, ey - 8, 15, -Math.PI * 0.55, 0.05); g.stroke();
        g.strokeStyle = ink; g.lineWidth = 6;
      });
      g.beginPath(); g.moveTo(hx - 16, ey - 4); g.lineTo(hx + 16, ey - 4); g.stroke();
    }
  }

  if (L.extra.includes('freckles')) {
    g.fillStyle = '#C98A64';
    [-1, 1].forEach((s) => [[0, 0], [12, 8], [-10, 10]].forEach(([dx, dy]) => {
      g.beginPath(); g.arc(hx + s * (74 + dx), ey + 36 + dy, 3.5, 0, 7); g.fill();
    }));
  }

  // Mouth
  const my = ey + 62, t = S.talk || 0;
  g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 8;
  const openMouth = (w, h, tongue = true) => {
    g.beginPath(); g.ellipse(hx, my + h * 0.3, w, Math.max(4, h), 0, 0, 7); g.fillStyle = '#3A1A2A'; g.fill(); g.stroke();
    if (tongue && h > 12) {
      g.save(); g.clip(); g.fillStyle = '#E2697A';
      g.beginPath(); g.ellipse(hx, my + h * 1.1, w * 0.7, h * 0.6, 0, 0, 7); g.fill(); g.restore();
    }
  };

  if (m === 'shock') openMouth(18, 26 + t * 6);
  else if (m === 'laugh') {
    g.beginPath(); g.moveTo(hx - 40, my - 6); g.quadraticCurveTo(hx, my - 2, hx + 40, my - 6);
    g.quadraticCurveTo(hx + 34, my + 52, hx, my + 52); g.quadraticCurveTo(hx - 34, my + 52, hx - 40, my - 6);
    g.closePath(); g.fillStyle = '#3A1A2A'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#E2697A'; g.beginPath(); g.ellipse(hx, my + 50, 24, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.fillRect(hx - 40, my - 10, 80, 12); g.restore(); g.stroke();
  } else if (t > 0.05) openMouth(14 + t * 10, 6 + t * 18);
  else if (m === 'happy' || m === 'proud') { g.beginPath(); g.moveTo(hx - 28, my); g.quadraticCurveTo(hx, my + 26, hx + 28, my); g.stroke(); }
  else if (m === 'smug' || m === 'sly') { g.beginPath(); g.moveTo(hx - 22, my + 6); g.quadraticCurveTo(hx + 4, my + 16, hx + 24, my - 4); g.stroke(); }
  else if (m === 'worried') { g.beginPath(); g.moveTo(hx - 26, my + 8); g.bezierCurveTo(hx - 12, my - 4, hx + 8, my + 14, hx + 26, my + 2); g.stroke(); }
  else if (m === 'angry') { g.beginPath(); g.moveTo(hx - 30, my + 12); g.quadraticCurveTo(hx, my - 8, hx + 30, my + 12); g.stroke(); }
  else { g.beginPath(); g.moveTo(hx - 20, my + 2); g.quadraticCurveTo(hx, my + 14, hx + 20, my + 2); g.stroke(); }

  // Facial Hair (Mustache / Beard)
  if (L.extra.includes('mustache') || L.beard === 'mustache') {
    g.fillStyle = L.mustacheCol || '#231815'; g.strokeStyle = ink; g.lineWidth = 4;
    g.beginPath(); g.moveTo(hx, my - 18);
    g.bezierCurveTo(hx - 20, my - 32, hx - 60, my - 22, hx - 64, my - 2);
    g.bezierCurveTo(hx - 44, my - 8, hx - 20, my - 4, hx, my - 10);
    g.bezierCurveTo(hx + 20, my - 4, hx + 44, my - 8, hx + 64, my - 2);
    g.bezierCurveTo(hx + 60, my - 22, hx + 20, my - 32, hx, my - 18);
    g.fill(); g.stroke();
  } else if (L.beard === 'stubble') {
    g.fillStyle = 'rgba(40,30,25,0.45)';
    for (let si = 0; si < 24; si++) {
      const sx = hx - 45 + (si % 8) * 12 + ((si % 2) ? 4 : 0);
      const sy = my + 12 + Math.floor(si / 8) * 10;
      g.beginPath(); g.arc(sx, sy, 1.8, 0, Math.PI * 2); g.fill();
    }
  }

  // Sweat Drop
  if (S.sweat || m === 'worried') {
    const k = S.sweat ?? 1; g.globalAlpha = Math.min(1, k);
    g.fillStyle = '#8FD3F4'; g.strokeStyle = ink; g.lineWidth = 4;
    g.beginPath(); const sx = hx + 104, sy = hy - 70;
    g.moveTo(sx, sy - 26); g.quadraticCurveTo(sx + 18, sy, sx, sy + 12); g.quadraticCurveTo(sx - 18, sy, sx, sy - 26);
    g.fill(); g.stroke(); g.globalAlpha = 1;
  }
}

function drawHat(g, L, hx, hy, r, ink) {
  if (L.hat === 'none') return;
  const c = L.hatCol || '#3B3346', top = hy - r * 0.97;
  g.strokeStyle = ink; g.lineWidth = LW; g.fillStyle = c;
  const band = (y, w, col) => { g.fillStyle = col; g.fillRect(hx - w, y - 12, w * 2, 24); g.strokeRect(hx - w, y - 12, w * 2, 24); };

  if (L.hat === 'bowler') {
    g.beginPath(); g.ellipse(hx, top + 26, r * 1.02, 22, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(hx, top + 14, r * 0.66, 80, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    band(top + 4, r * 0.64, L.band || shadeOf(c, 0.6));
  } else if (L.hat === 'cap') {
    g.beginPath(); g.ellipse(hx + 6, top + 34, r * 0.98, 62, -0.05, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shadeOf(c, 0.75); g.beginPath(); g.ellipse(hx - 24, top + 40, r * 0.78, 22, 0.05, 0, Math.PI); g.fill(); g.stroke();
    g.fillStyle = shadeOf(c, 1.15); g.beginPath(); g.arc(hx + 6, top - 26, 12, 0, 7); g.fill(); g.stroke();
  } else if (L.hat === 'beanie') {
    g.beginPath(); g.ellipse(hx, top + 50, r * 0.95, 96, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = shadeOf(c, 0.8); g.beginPath(); g.roundRect(hx - r * 0.98, top + 30, r * 1.96, 40, 18); g.fill(); g.stroke();
    g.fillStyle = L.band || '#F4EFE4'; g.beginPath(); g.arc(hx, top - 52, 22, 0, 7); g.fill(); g.stroke();
  }
}

// ---------- Handheld Props ----------
export const PROPS = {
  rotaryPhone: (g, x, y) => {
    g.save(); g.translate(x, y - 40);
    g.fillStyle = '#C93B3B'; g.strokeStyle = DEFAULT_INK; g.lineWidth = 5;
    g.beginPath(); g.ellipse(-14, -20, 18, 22, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(14, 20, 18, 22, 0, 0, 7); g.fill(); g.stroke();
    g.fillRect(-10, -14, 20, 28); g.strokeRect(-10, -14, 20, 28);
    g.restore();
  },
  cup: (g, x, y) => {
    g.fillStyle = '#F4EFE4'; g.strokeStyle = DEFAULT_INK; g.lineWidth = 6;
    g.beginPath(); g.roundRect(x - 30, y - 70, 60, 70, [4, 4, 14, 14]); g.fill(); g.stroke();
    g.beginPath(); g.arc(x + 34, y - 36, 16, -1.4, 1.4); g.stroke();
    g.fillStyle = '#7A4A2A'; g.fillRect(x - 24, y - 64, 48, 10);
  },
  coffeeMug: (g, x, y) => {
    g.fillStyle = '#10B981'; g.strokeStyle = DEFAULT_INK; g.lineWidth = 6;
    g.beginPath(); g.roundRect(x - 26, y - 60, 52, 60, [4, 4, 12, 12]); g.fill(); g.stroke();
    g.beginPath(); g.arc(x + 30, y - 30, 14, -1.4, 1.4); g.stroke();
    g.fillStyle = '#3A2016'; g.fillRect(x - 20, y - 56, 40, 8);
    // Steam curls
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 8, y - 68); g.quadraticCurveTo(x - 14, y - 82, x - 6, y - 96); g.stroke();
    g.beginPath(); g.moveTo(x + 8, y - 68); g.quadraticCurveTo(x + 14, y - 82, x + 6, y - 96); g.stroke();
  },
  smartphone: (g, x, y) => {
    g.save(); g.translate(x, y - 45); g.rotate(-0.15);
    g.fillStyle = '#1E293B'; g.strokeStyle = DEFAULT_INK; g.lineWidth = 5;
    g.beginPath(); g.roundRect(-24, -45, 48, 90, 8); g.fill(); g.stroke();
    // Glowing active screen
    g.fillStyle = '#38BDF8'; g.fillRect(-20, -38, 40, 76);
    g.fillStyle = '#FFFFFF'; g.fillRect(-14, -28, 28, 6); g.fillRect(-14, -16, 20, 4);
    g.restore();
  },
  cash: (n = 1) => (g, x, y) => {
    for (let i = 0; i < n; i++) {
      g.save(); g.translate(x - 30, y - 34 - i * 12); g.rotate(0.06 * (i % 2 ? -1 : 1));
      g.fillStyle = '#9ED39A'; g.strokeStyle = DEFAULT_INK; g.lineWidth = 5;
      g.beginPath(); g.roundRect(-10, -26, 100, 52, 6); g.fill(); g.stroke();
      g.strokeStyle = '#4F8F55'; g.lineWidth = 3; g.beginPath(); g.roundRect(-2, -18, 84, 36, 4); g.stroke();
      g.fillStyle = '#4F8F55'; g.beginPath(); g.arc(40, 0, 11, 0, 7); g.fill(); g.restore();
    }
  }
};

// ---------- 3D Toon Mesh Cut-Out ----------
let shadowTex = null;
function blobTex() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(20,20,30,0.7)'); gr.addColorStop(0.6, 'rgba(20,20,30,0.2)'); gr.addColorStop(1, 'rgba(20,20,30,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(c); return shadowTex;
}

export class Toon {
  constructor(look = {}, { height = 1.75, res = 2, castShadow = true } = {}) {
    this.look = look; this.res = res;
    this.canvas = document.createElement('canvas'); this.canvas.width = 512 * res; this.canvas.height = 1024 * res;
    this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    const H = height / 0.96, Wd = H / 2;
    const geo = new THREE.PlaneGeometry(Wd, H); geo.translate(0, H / 2 - H * (24 / 1024), 0);
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = castShadow;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(Wd * 0.9, Wd * 0.34), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.55 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.01;
    this.group = new THREE.Group(); this.pivot = new THREE.Group(); this.pivot.add(this.mesh); this.group.add(this.pivot, this.blob);
    this.key = ''; this.H = H;

    // Advanced RK4 Springs
    this.headSpring = new RK4Spring({ zeta: 0.62, omega: 18.0, initial: 0 });
    this.clothSpring = new RK4Spring({ zeta: 0.42, omega: 14.5, initial: 0 });
    this.squashSpring = new RK4Spring({ zeta: 0.82, omega: 22.0, initial: 0 });

    this.set({});
  }

  set(st = {}) {
    const key = JSON.stringify(st, (k, v) => (typeof v === 'function' ? (v.name || String(v).length) : typeof v === 'number' ? Math.round(v * 100) / 100 : v));
    if (key === this.key) return this;
    this.key = key; this.st = st;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.scale(this.res, this.res); this.hands = drawToon(g, this.look, st);
    this.tex.needsUpdate = true; return this;
  }

  face(cam) {
    const p = new THREE.Vector3(); this.group.getWorldPosition(p);
    this.pivot.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.group.rotation.y;
    return this;
  }

  tint(col) { this.mat.color.set(col); return this; }
  restyle(patch) { Object.assign(this.look, patch); this.key = ''; return this; }
  at(x, y, z) { this.group.position.set(x, y, z); return this; }
}
