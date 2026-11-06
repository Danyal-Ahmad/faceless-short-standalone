---
name: faceless-shorts
description: Autonomous 6-Agent AI Video Studio architected by Danyal Ahmad. Generates finished narrated faceless shorts (Reels, TikTok, Shorts) 100% in code with neural voice, word-synced active typography, procedural 2D/3D kinetics, living particle sets, and GPU acceleration. Supports 6 visual styles (Tall Tale 3D, Deep Dive 3D, Night File 3D, Inside Out, Stick Story, Paper Atlas) and 6 specialized autonomous agents (Director, Screenwriter, Animator, Environment Designer, Sound Engineer, Viral Growth Analyst).
architect: Danyal Ahmad
github: https://github.com/Danyal-Ahmad
linkedin: https://linkedin.com/in/danyal-ahmaad
---

# Faceless Shorts 2.0: Universal Autonomous AI Video Studio

> **Architected & Created by [Danyal Ahmad](https://github.com/Danyal-Ahmad)**  
> **GitHub:** [https://github.com/Danyal-Ahmad](https://github.com/Danyal-Ahmad) | **LinkedIn:** [https://linkedin.com/in/danyal-ahmaad](https://linkedin.com/in/danyal-ahmaad)  

You make finished vertical shorts and 2–3 minute viral storytelling videos from a topic: script, voice, word-synced captions, animated shots, sound and music, rendered to MP4. **Everything is code**: canvas drawing, headless Chrome capture with Direct3D 11 GPU acceleration, ffmpeg hardware encoding, a local Kokoro voice, local Whisper word timing, and multi-track Foley sound design. $0 cost, zero API keys, zero credits.

`SKILL` = the folder this file is in. Projects live in `~/faceless-shorts/<short-name>/`.

## The 6 Autonomous Production Agents (`agents/`)
1. **Director** (`director.md`): Executive Showrunner, end-to-end shot continuity, multi-camera orchestration, and QA approval.
2. **Screenwriter** (`screenwriter.md`): Viral hook architecture (0–3s retention drop), spoken phonetic scripts, and circular loop endings.
3. **Animator** (`animator.md`): 2D/3D procedural character kinematics, customizable comic inks, multi-body archetypes, volume-preserving squash/stretch, and hand gestures.
4. **Environment Designer** (`environment-designer.md`): Living 3D Three.js sets, sunlit dust motes (`dustMotes`), active terminal screens, and dynamic lighting.
5. **Sound Engineer** (`sound-engineer.md`): Kokoro neural TTS narration, Whisper word alignment (`words.json`), and 48 kHz multi-track Foley audio.
6. **Viral Growth Analyst** (`viral-growth-analyst.md`): Trend forecasting, automated Instagram Reels publishing with humanized stealth keystrokes, and comment-to-DM lead generation.

## The 6 Visual Animation Styles
| style | what it makes | length · aspect · fps |
|---|---|---|
| **Tall Tale 3D** `tall-tale` | funny true stories & viral curiosities (RicksClips style): flat 2D cartoon people (big round heads, acting faces, custom ink outlines) acting in sunny/suburban/historical 3D Three.js worlds with living dust motes and continuous camera movement | 30-60 s (or 2-3 min) · 9:16 · 30/60 FPS |
| **Deep Dive 3D** `deep-dive` | the flagship, Zack D. Films-like: sculpted 3D people in sunlit sets, glowing x-ray bodies, camera journeys through blood vessels, shallow focus. "What happens if…?" body and science | 30-60 s (or 2-3 min) · 9:16 · 30/60 FPS |
| **Night File 3D** `night-file` | unsolved mysteries / true crime: dark 3D places with one light, faceless people (the subject glows red), typewriter dates, case-file inserts | 30-60 s (or 2-3 min) · 9:16 · 30/60 FPS |
| **Inside Out** `inside-out` | flat 2D "What happens if…?" explainer: a simple hero, x-ray cutaways, bold 1-3 word captions, punchy cuts | 25-45 s · 9:16 · 30/60 FPS |
| **Stick Story** `stick-story` | "What would you do if…?" survival steps: stick people with acting eyes, flat rooms day/night, gold step cards | 30-60 s · 9:16 · 30/60 FPS |
| **Paper Atlas** `paper-atlas` | history in cut paper: parchment maps, crimson routes, gold date ribbons, period figures | 30-60 s (or 2-3 min) · 9:16 · 30/60 FPS |

Which style: body / health / science "what happens if" → **Deep Dive 3D** (or **Inside Out** for a lighter, faster 2D look) · creepy, unexplained, true crime, "this happened in 1971" → **Night File 3D** · survival, life hacks, "here's what you do" → **Stick Story** · a historical event, "how X happened" → **Paper Atlas** · a funny or clever true story, a con, a loophole, "this guy did X" → **Tall Tale 3D**. If it isn't obvious, ask once.

Each style = `styles/<style>/style-sheet.png` (the look in one image, drawn by the style's own code) + `STYLE.md` (the rules + the engine manual) + `example/` (a complete project that renders as-is). **Read the style's STYLE.md in full before planning.**

---

## 0. First use on a computer
`bash SKILL/scripts/setup.sh` until it prints **All set** (checks Node 22+, ffmpeg, Chrome; builds `~/.faceless-shorts/venv`; downloads the Kokoro voice ~340 MB and Whisper small.en ~0.5 GB). Install anything missing the free, official way, and ask before anything that needs a password. Then `bash SKILL/scripts/selftest.sh` must print **SELFTEST PASSED**: open the contact sheet and clip it names and look at them.

---

## 1. Intake (ONE message, defaults filled in)
Ask only what's unknown, all at once:
- **Topic** (or "you pick 3 ideas")
- **Format / Length**:
  - **Quick Short**: 30–60 seconds (~90–150 words)
  - **Full Story Explainer**: 2–3 minutes (~350–450 words, 8–15 distinct scenes)
- **Target Frame Rate**: 30 FPS (standard) or **60 FPS** (ultra-smooth motion)
- **Voice**: `SKILL/scripts/py SKILL/scripts/voice.py --list` (default `am_michael`)
- **Voiceover mode**: AI voice (default) · their own recording (`words.py --audio`) · captions-only (`estimate.py`)
- **Music**: built-in comedy bounce / investigative bed · none · their own royalty-free track
- **End line / handle**: clean circular loop or custom CTA

---

## 2. Pacing & Narrative Blueprint

### A. 30–60 Second Short Structure (90–150 words)
1. **Hook (0:00–0:05)**: Drop in-medias-res into the weirdest fact or question.
2. **Setup (0:05–0:20)**: The bizarre premise, escalating stakes.
3. **Twist (0:20–0:45)**: The complication that went wrong or the ingenious trick.
4. **Loop (0:45–0:60)**: Final punchline connecting seamlessly back into the hook line.

### B. 2–3 Minute Long-Form Narrative Structure (350–450 words)
To achieve 50–70% completion on longer videos, maintain **frictionless momentum** through a 5-part micro-narrative arc:
1. **Act 1: The In-Medias-Res Hook (0:00–0:10)**: Drop straight into the action with immediate open loops. No logos, no channel intros.
2. **Act 2: The Retention Bridge & Stakes (0:10–0:30)**: Establish what is at risk and why standard solutions completely fail.
3. **Act 3: Rising Action & Escalation (0:30–1:45)**: Multi-scene journey across 5–8 distinct environments. Apply the **30-Second Rule**: deliver a mini-climax, perspective shift, or pattern interrupt every 30 seconds.
4. **Act 4: The Climax & Breakthrough (1:45–2:30)**: The intellectual or comedic turning point where the impossible trick is executed.
5. **Act 5: The Payoff & Circular Loop (2:30–3:00)**: Deliver satisfying resolution and roll cleanly into the opening hook without signaling the video is ending.

**Script rules:**
- Write for the ear: spoken rhythm with conversational connectors ("Well,", "where", "but", "so", "which means").
- **A line is a CUT, not a sentence**: change the visual every 1.5–3.5 s while narration flows smoothly.
- Write numbers phonetically ("seventy thousand dollars", not "$70,000").
- Bracket visual actions directly with each clause.

---

## 3. The 12 Disney Principles in 2D/3D Hybrid Space
When placing 2D cartoon characters into realistic 3D sets:
1. **Squash and Stretch (Volume-Preserving)**: Dynamic vertical deformation (`st.squash = -0.15..+0.25`) with exact reciprocal horizontal scaling ($scaleX = 1 / \sqrt{scaleY}$) to strictly preserve visual character mass during walking impacts, jump landings, and shock reactions.
2. **Anticipation**: Brief backward wind-up before character turns, jumps, or reaches for props.
3. **Staging**: Ground cutouts directly to 3D floor geometry (`y = 0`) with contact shadow pool meshes (`y = 0.005`) and cylindrical billboarding (`.face(cam)` rotates on Y-axis only).
4. **Straight Ahead & Pose-to-Pose**: Keyframe shot cameras with cubic Bézier easing curves.
5. **Follow-Through & Overlapping Action**: Neckwear (ties, bowties), hair tufts, and props continue moving 2–4 frames after character stops via RK4 springs.
6. **Slow In & Slow Out**: Use `lerp` and smoothstep easing (`eob`, `eoi`) for all camera dollys.
7. **Arcs**: Arm hand paths follow natural parabolic arcs, never straight mechanical lines.
8. **Secondary Action**: Natural eye blinks (`blink(t)` every 1.2–2.5s), subtle breathing bob (`st.bob`), looking pupil shifts (`st.look`), and specialized hand poses (`type`, `point`, `fist`, `open`, `thumbs_up`, `cup`, `phone`).
9. **Timing**: 8 phoneme mouth shapes (`rest`, `A`, `E`, `O`, `U`, `M`, `smile`, `shout`) syncing crisply with syllable peaks.
10. **Exaggeration**: Dynamic facial acting with 14 distinct emotions (`smug`, `shock`, `laugh`, `sly`, `suspicious`, `worried`, `rage`, `baffled`).
11. **Solid Drawing & Diverse Anatomy**:
    - **Customizable Comic Ink**: Crisp charcoal black (`#141416`), slate ink (`#181C24`), or midnight charcoal (`#0F172A`) per character—never uniform red outlines.
    - **Body Archetypes**: `lean` (slender tech developer, $bw=72$, thin limbs), `heavy` / `boss` (broad executive, $bw=118$, double chin/vest), `athletic` (V-taper shoulders), `standard` ($bw=90$), and `kid` ($bw=64$).
    - **Head Shapes**: `superellipse`, `oval` (tall intellectual), `square` (strong executive jawline), `round`.
    - **Hairstyles**: `messy` (modern spiky tech hair), `side-part` (clean classic), `slick` (executive combed back), `curly` / `afro` (volumetric crown lobes), `buzz`, `bald`, `bun`.
    - **Eyewear & Beards**: modern rectangular tech glasses, round wire frames, sunglasses; stubble, full beard, mustache, goatee.
12. **Appeal & Dynamic Lighting**: Soft crescent head shading on the unlit side (`rgba(215, 218, 235, 0.45)`), procedural floating sunlit dust motes (`dustMotes`), glowing laptop screens, and warm table/sunlight rim highlights.

---

## 4. Higher-Order Mathematical Kinetics & Dynamics Engine
To achieve indistinguishable parity with **RicksClips** and **Zack D. Films**, all movement is driven by analytical equations rather than linear approximations:

1. **Gielis Superformula for Facial & Organ Contours** (`math_kinetics.js`):
   $$r(\theta) = \left( \left|\frac{\cos(m\theta/4)}{a}\right|^{n_2} + \left|\frac{\sin(m\theta/4)}{b}\right|^{n_3} \right)^{-\frac{1}{n_1}}$$
   - Bilateral symmetry $m=4$, aspect ratio $a=1.0, b=0.94$.
   - Crown curvature: $n_2 = 2.05–2.34$.
   - Jaw taper: $n_3 = 1.80–1.95$.
   Generates organic, asymmetric head profiles, cheek bulges, and anatomical cross-sections without polygonal faceting.

2. **Runge-Kutta 4th-Order (RK4) Mass-Spring-Damper Simulation**:
   $$\ddot{x} + 2\zeta\omega_n \dot{x} + \omega_n^2 (x - x_{target}) = 0$$
   - Character Head Overshoot: $\zeta = 0.62, \omega_n = 18.0\text{ rad/s}$ (fluid underdamped rebound on sudden head turns).
   - Secondary Inertia (ties, hair tufts, hats): $\zeta = 0.42, \omega_n = 14.5\text{ rad/s}$ (springy lagging follow-through).
   - Body Landing Settle: $\zeta = 0.82, \omega_n = 22.0\text{ rad/s}$ (rapid stabilization without jitter).

3. **FABRIK 2-Joint Inverse Kinematics (`reach(arm, tx, ty)`)**:
   Solves natural shoulder, elbow, and wrist angles analytically using the law of cosines for pointing, prop interactions, and character gestures.

4. **Dynamic Living Backgrounds & Procedural Motes**:
   - `WD.dustMotes(scene, count=75)`: An InstancedMesh of micro-particles suspended in 3D room air, levitating with sinusoidal Brownian drifts ($x = \sin(0.6t), y = \sin(2t \cdot s), z = \cos(0.5t)$) to bring static 3D sets to life.
   - Animated CRT/LCD screens with moving code streams and blinking cursors.

5. **GPU Hardware-Accelerated Rendering & Video Encoding**:
   - Headless Chrome GPU flags (`--enable-gpu`, `--enable-gpu-rasterization`, `--enable-zero-copy`, `--use-gl=angle`, `--use-angle=d3d11`, `--enable-accelerated-2d-canvas`). Eliminates CPU-throttling SwiftShader.
   - Hardware ffmpeg encoders: Windows Media Foundation (`h264_mf`) and Intel QuickSync (`h264_qsv`), delivering 4x–8x real-time video compilation.

---

## 5. Build Pipeline
1. `bash SKILL/scripts/new_video.sh <style> <short-name>` copies the example into `~/faceless-shorts/<short-name>/`.
2. Write `script.json` (lines + caps + gaps; see STYLE.md).
3. Timing:
   - AI voice: `SKILL/scripts/py SKILL/scripts/voice.py <proj>` then `SKILL/scripts/py SKILL/scripts/words.py <proj>`
   - Own voice: `words.py <proj> --audio their.m4a`
   - Captions-only: `estimate.py <proj>`
4. Rewrite `src/shots.js`:
   - Initialize 3D sets once at top (`livingRoom()`, `kitchen()`, `courtroom()`, `bankVault()`, `terminal()`, `canyonRail()`).
   - Sequence shots using `cut(i)` with synchronized camera sweeps (`shoot(...)`).
5. Render & QA:
   - Standard 30 FPS: `node tools/capture.mjs video renders/<name>.mp4`
   - Ultra-Smooth 60 FPS: `node tools/capture.mjs video renders/<name>.mp4 --fps 60`
   - Long 2–3 Minute Renders: `node tools/capture.mjs video renders/<name>.mp4 --chunk 1200`
   - Contact Sheet QA: `node tools/capture.mjs sheet review/all.jpg 0.5 10`

---

## 5. QA Protocol
Never present a video without viewing the full timestamped contact sheet. Verify:
1. **Depth Separation**: 2D cutout never intersects 3D walls or furniture; feet remain firmly grounded on floor geometry.
2. **Lighting Bloom Calibration**: Bloom threshold pinned to `1.02` in Three.js UnrealBloomPass so toon heads remain crisp white without blown-out lightbulb halos while lamps/fires glow warmly.
3. **Shadow Fidelity**: Character casts both directional 3D shadow map and localized soft contact shadow pool.
4. **Caption Clarity**: 1 word per pop reveal at `y = 1360`, bold Inter Black 900 font, crisp dark plum outline, gold highlight on key punch words.
5. **Color Grade**: Hermite film S-curve with 3-way split toning (plum shadows `#221626`, warm golden highlights `#FFE500`).

---

## 6. Deliver & Publish

1. Open the MP4 for the user (`tools.browser.preview`).
2. Provide web-optimized share copy if > 25MB (`ffmpeg -i in.mp4 -c:v libx264 -crf 22 -preset fast -c:a aac -b:a 160k share.mp4`).
3. Save full-resolution cover thumbnail (`review/cover.jpg`).
4. Provide engaging title, description, and 5–8 targeted hashtags.
5. If requested, publish directly to YouTube via Zapier CLI (`youtube_upload_video`).

---

## 7. Instagram MCP Autopilot & Viral Auto-Sync

The system connects natively to the local **Instagram MCP Server** (`instagram_mcp_server.py`) and autonomous sync engine (`scripts/instagram_auto_sync.py`):

1. **Reel Auto-Publishing (`instagram_publish_reel`)**:
   - Publishes vertical 9:16 videos directly to Instagram Reels using the local session.
   - Built-in anti-ban human stealth simulation:
     - Organic pre-roll browsing (5-10s) on home feed before posting.
     - Natural human keystroke timing with punctuation dwell pauses (35-85ms).
     - Strict rate-limiting shield: max 2 posts per 24 hours with minimum 3-hour spacing.
     - Supports `--dry-run` validation.

2. **Automated Workspace Sync (`scripts/instagram_auto_sync.py`)**:
   - Scans `/faceless-shorts` project folders for finished renders (`*_share.mp4`).
   - Runs automatic format QA (9:16 aspect ratio, duration between 15-90s, framerate check).
   - Generates high-converting caption, tiered hashtags, and comment-to-DM trigger keywords.
   - Run once: `python scripts/instagram_auto_sync.py --dry-run` (or live).
   - Run in background watch mode: `python scripts/instagram_auto_sync.py --watch`.

3. **Comment-to-DM Lead Magnet (`instagram_auto_dm_reply`)**:
   - Scans comments for trigger keywords (e.g. `CODE`, `CRAWL`, `MCP`, `AGENT`, `TOOL`).
   - Posts human-varied confirmation replies on thread and delivers full source kits directly via DM.
   - Enforces 25-65s anti-ban jitter delays and prevents duplicate sends via `~/.faceless-shorts/dm_interactions_ledger.json`.

4. **Viral Retention Intelligence (`viral_trend_analyzer.py`)**:
   - Scores emerging tech and mystery topics using the calibrated Viral Intelligence Model ($> 94\%$ virality index).
   - Enforces optimal kinetics: visual cuts every $\le 1.6 - 2.2$s, narration at $3.0$ wps ($180$ WPM), audio ducking at $-14$ dB, 1-word bold subtitles with glowing yellow highlights.

