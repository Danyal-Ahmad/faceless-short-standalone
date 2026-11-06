// Captions: strictly ONE word at a time (short articles pair up when spoken fast),
// crisp Inter Black with a heavy dark outline and deep drop shadow, centered at y = 1360.
// Features dynamic syllable pop animation (1.14x scale punch on entry with elastic bounce).
import { ctx, clamp, lerp, seg, eob } from './lib.js';
import { T, lineWords } from './timing.js';

export const CAP = { y: 1360, size: 94, maxW: 980 };
let caps = [];

// Punch words that get the signature RicksClips vivid golden highlight
const HIGHLIGHT_WORDS = /^(1925|sold|eiffel|tower|scrap|again|broke|rusting|eyesore|fake|secret|hotel|whispered|7,000|bribe|relaxed|cash|\$70,000|vienna|embarrassed|returned|twice)$/i;

export function buildCaptions(script) {
  caps = [];
  script.lines.forEach((ln, i) => {
    const ws = lineWords(i); if (!ws.length) return;
    
    // Strict 1-word chunking: only pair short connecting words (< 3 chars) with next if gap is tiny (< 0.08s)
    let k = 0;
    while (k < ws.length) {
      const cur = ws[k];
      const next = ws[k + 1];
      const cleanCur = cur.w.replace(/[^a-zA-Z0-9']/g, '');
      const isShort = cleanCur.length <= 2 && /^(a|in|on|to|at|by|of|so|he)$/i.test(cleanCur);
      
      if (isShort && next && (next.s - cur.e) < 0.08 && !/[,.?!;:]$/.test(cur.w)) {
        // Pair short word with next word
        caps.push({
          line: i,
          s: cur.s - 0.02,
          e: next.e + 0.04,
          text: cur.w + ' ' + next.w,
          hi: HIGHLIGHT_WORDS.test(cleanCur) || HIGHLIGHT_WORDS.test(next.w.replace(/[^a-zA-Z0-9']/g, ''))
        });
        k += 2;
      } else {
        caps.push({
          line: i,
          s: cur.s - 0.02,
          e: cur.e + 0.04,
          text: cur.w,
          hi: HIGHLIGHT_WORDS.test(cleanCur)
        });
        k += 1;
      }
    }
  });

  // Clamp end times smoothly so captions never overlap but flow without empty flashes
  for (let j = 0; j < caps.length; j++) {
    const c = caps[j];
    const next = caps[j + 1];
    if (next) {
      if (next.s > c.e) {
        // If gap is small (< 0.18s), extend caption to meet next word
        if (next.s - c.e < 0.18) c.e = next.s;
      } else {
        c.e = Math.max(c.s + 0.08, next.s);
      }
    } else {
      c.e = T.dur;
    }
  }

  return caps;
}

export const captionList = () => caps.map((c) => ({ ...c, words: [{ txt: c.text, hi: c.hi }] }));

/** draw one caption text at x, y with heavy outline, deep shadow, and pop punch */
export function captionText(text, x = 540, y = CAP.y, sc = 1, isYellow = false) {
  const size = CAP.size;
  ctx.save();
  ctx.font = `900 ${size}px Inter`;
  ctx.letterSpacing = '-1px';
  const fit = Math.min(1, CAP.maxW / (ctx.measureText(text).width + 10));
  
  ctx.translate(x, y);
  ctx.scale(sc * fit, sc * fit);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  // 1. Deep Soft Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(10, 8, 18, 0.75)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#0C0A14';
  ctx.strokeText(text, 0, 0);
  ctx.restore();

  // 2. Thick Crisp Dark Plum Outline
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#0C0A14';
  ctx.strokeText(text, 0, 0);

  // 3. Inner Vivid Fill (Golden Yellow for punch words, Crisp White for standard)
  ctx.fillStyle = isYellow ? '#FFE500' : '#FFFFFF';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

export function drawCaption(t) {
  const c = caps.find((c) => t >= c.s && t < c.e);
  if (!c) return;

  const lt = t - c.s;
  // Dynamic scale punch: 1.15x -> 1.0x with elastic overshoot bounce on entry
  const sc = lt < 0.14 ? lerp(1.15, 1.0, eob(seg(lt, 0, 0.14))) : 1.0;
  captionText(c.text, 540, CAP.y, sc, c.hi);
}
