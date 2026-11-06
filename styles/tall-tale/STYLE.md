# Tall Tale 3D: funny true stories & viral curiosities, 9:16
(Engineered directly from forensic analysis of 80+ top `@RicksClips3000` shorts & multi-scene explainers)

Playful, clever, cheeky, viral. Flat 2D cartoon people (thick ink outlines, big round white heads, bean bodies, stick limbs) acting inside a sunny, saturated 3D world: suburban living rooms, checkered kitchens, small-town streets, canyon railroads, wallpapered betting shops, meadows, train terminals, Art Deco banks, courtrooms. The camera moves in every shot, faces react on every beat, captions come one word at a time.
Supports **30s–60s Shorts** and **2–3 Minute Long-Form Multi-Scene Stories** at **30 FPS & 60 FPS**.

---

## 1. RicksClips Forensic Formula
- **People are 2D, the world is 3D.** Every person is a `Toon` cut-out that turns to face the camera and casts a real 3D shadow.
  Never build people in 3D; never draw sets flat. Pets are `ToonPet` cut-outs (e.g. orange tabby cat).
- **Faces do the acting.** Change the mood on the beat: `smug` when someone's clever, `shock` on the reveal, `laugh` / `happy` for the payoff,
  `worried` + `sweat` for trouble, `suspicious` for side-eye, `baffled` for confusion, `rage` for purple steam-puffing fury.
  Blink with `blink(t)`, talk with `talk(t)` (supports 8 phonemes). Eyeglasses feature specular glare arcs.
- **One hat + one neck thing per character; consistent look all video.**
  Archetypes: Burglar (`hat: 'balaclava'`, black bean body, belt), Dad (`hairCol: '#5A3825'`, `extra: ['glasses']`),
  Police (`hat: 'police'`), Railroad Engineer (`hat: 'engineer'`), Captain (`hat: 'captain'`), Chef (`hat: 'chef'`),
  Detective (`hat: 'fedora'`), Banker/Tycoon (`hat: 'tophat'`, `pattern: 'vest'`), Judge (`hat: 'wig'`, black robe),
  Doctor (`extra: ['stethoscope']`, white coat).
- **Camera always moving:** Continuous push-ins (`dt * 0.042/s`), orbital pans, crane-downs, and a 1.2x punch-in on reveal words. New cut every 1.5–3.5 s.
- **Lighting & Depth:** Midday sun outside, warm table bulbs inside, cool blue night spotlight beams for sneaks, atmospheric fog (`FogExp2`), and creamy bokeh blur. Bloom threshold pinned to `1.02` in UnrealBloomPass so toon faces never blow out.
- **Captions:** One word at a time, bold Inter Black 900 font with a heavy dark plum outline (`#0C0A14`) and deep drop shadow, centered at `y = 1360`. Golden yellow highlight (`#FFE500`) on punch words.
- **Sound Design:** Upbeat storyteller, `am_michael` x1.05. Music `"bounce"` (120 BPM light comedy march). Procedural Foley cues: `pop`, `plop`, `boing`, `stamp`, `ding`, `snip`, `clink`, `whoosh` on cuts.

---

## 2. 2–3 Minute Multi-Scene Narrative Architecture (120s – 180s)
For longer 2–3 minute videos (~350–450 words), maintain audience retention via the **5-Part Micro-Narrative Arc**:
1. **Act 1: The In-Medias-Res Hook (0:00–0:10)**: Drop straight into the action with immediate open loops.
2. **Act 2: The Retention Bridge & Stakes (0:10–0:30)**: Establish what is at risk and why standard solutions fail.
3. **Act 3: Multi-Scene Rising Action (0:30–1:45)**: 6–8 distinct environments. Apply the **30-Second Rule**: deliver a mini-climax, perspective shift, or pattern interrupt every 30 seconds.
4. **Act 4: The Climax & Breakthrough (1:45–2:30)**: The intellectual or comedic turning point where the impossible trick is executed.
5. **Act 5: The Payoff & Circular Loop (2:30–3:00)**: Deliver satisfying resolution and roll cleanly into the opening hook without signaling the video is ending.

### Multi-Scene Setup Pattern (`src/shots.js`):
```javascript
// Pre-instantiate all 3D sets at top of file
const sets = {
  living: livingRoom(E),
  kitchen: kitchen(E),
  terminal: gareDeLEst(E),
  bank: bankVault(E),
  court: courtroom(E),
  canyon: canyonRail(E)
};

// Switch scenes smoothly on clause cuts
function renderShot(t) {
  if (t < 28.5) shoot(sets.living.scene, ...);
  else if (t < 65.2) shoot(sets.terminal.scene, ...);
  else if (t < 112.0) shoot(sets.bank.scene, ...);
  else shoot(sets.court.scene, ...);
}
```

---

## 3. Engine Map (`example/src/`)
| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine` (neutral tone curve, soft shadows, bloom threshold 1.02, BokehPass DoF, Hermite S-curve split-toning), `camera(fov)` |
| `core/toon.js` | `drawToon` (superellipse crown 1.72 / jaw 2.28, crescent shadow, 3.5 HH proportions, squash/stretch), `new Toon(look, { height, res })`, `drawCat`, `new ToonPet(look, { height })`, `PROPS` |
| `core/world.js` | 3D Sets: `livingRoom`, `kitchen`, `canyonRail`, `gareDeLEst` (Parisian terminal), `courtroom`, `bankVault`, `mainStreet`, `interior`, `meadow`; painted & procedural PBR textures `T.cobblestone, T.parquet, T.damask, T.planks, T.checker, T.rug, T.canyonWall, T.wallpaper, T.brick` |
| `core/props.js` | `house()`, `train()`, `platformScale()`, `rails`, `desk`, `chickCrate()`, `signpost`, `cash`, `briefcase` |
| `core/captions.js` | Dynamic 1-word pop reveals with gold highlights at `y = 1360`, `captionText(text, x, y, sc, isYellow)` |

---

## 4. 60 FPS Capture & Render Modes
- **Quick Preview**: `node tools/capture.mjs check`
- **Standard 30 FPS Render**: `node tools/capture.mjs video renders/<name>.mp4`
- **Ultra-Smooth 60 FPS Render**: `node tools/capture.mjs video renders/<name>.mp4 --fps 60`
- **Long 2–3 Minute Render (Chunked Pipeline)**: `node tools/capture.mjs video renders/<name>.mp4 --chunk 1200`
- **Forensic Contact Sheet QA**: `node tools/capture.mjs sheet review/all.jpg 0.5 10`

---

## 5. QA Pitfalls
- **Bloom Halo on Faces**: Ensure `bloom.threshold = 1.02` in `engine.js`. Setting threshold < 1.0 causes the 2D toon head to glow like a lightbulb.
- **Side-Sliver Billboard**: A cut-out seen edge-on disappears. Always use `.face(cam)` every frame so cutouts rotate around the vertical Y-axis to face the lens.
- **Ground Penetration**: Ensure toon cutouts are positioned with feet resting cleanly on floor geometry (`y = 0` or furniture tops).
- **Z-Fighting on Shadows**: Contact shadow pool mesh sits at `y = 0.005` with `depthWrite: false` to eliminate shadow flicker.
