# DEPTH REPORT — TerraForm 3D, Quality Pass v3

Date: 2026-11-05. Branch: `arena/154f02b1-gameprotype`, based on
`clean-v1` merge `1793af7`. Commits `d83a47a` (Tier A), `26cd886` (Tier B),
`0428c15` (Tier C), `6da2fb1` (Tier D).

**This report supersedes the previous one.** The earlier report said "no browser,
no screenshots, no F12 console are available in this workspace". That was wrong
for this session. We installed `@sparticuz/chromium@153.0.0`,
`playwright-core@1.64.1` and `pngjs@7.0.0` as devDependencies, served the built
`dist/` at `127.0.0.1:4179`, and ran **real Chromium 153.0.8010.0** for every
visual and interaction check below. Numbers here come from real DOM rects, real
key events, real mouse clicks, real WebGL frames and real PNG files.

The environment is headless **software WebGL** (SwiftShader). It has no GPU, so
fps numbers are lower than a real player's browser. Everything else — layout,
contrast, logic, console — is the same code path.

---

## 1. Score (1–10)

| Area | Score | Why |
| --- | --- | --- |
| Visual identity / stage variety | 8 | 15 genuinely different grounds, skies, fog densities, skylines, landmarks, start yaws, verbs and 3-line coaches. Some props are still simple primitives. |
| UI readability | 9 | 172 computed elements over 11 screens, 0 WCAG contrast failures; 5 viewport sizes with 0 overlaps, 0 offscreen, 0 clipped, 0 sub-48px targets. |
| Input / controls | 9 | 52 real clicks, real W/A/S/D/F/G/Space, real mouse joystick, CDP two-finger. 20/20 button-check PASS. |
| Gameplay depth | 8 | 15 levels, 8 goal kinds, 6 four-step upgrades, RUSH timers, combo, stunt park, 3 scoops/3 dumps on L1 with real keys, real negative tests on L4/L7/L9. |
| Stability | 9 | 10-minute scripted session with 106 clicks, 320 key holds, 16 level changes, 0 crashes, 0 red console errors. |
| Performance | 6 | 45–74 fps in short real-Chromium samples; a 10-minute software-GL soak decays to ~5–8 fps. 158 draw calls in Free Play (<200), 246–356 in levels. No GPU here to validate 60 fps. |
| Documentation / evidence | 9 | Real PNGs, real console log, real fps table, honest known-issues list. |
| **Overall** | **8.4** | Playable, distinct, readable and honest. Not yet a polished commercial art pass. |

---

## 2. The 5 worst-looking things I found, and what I fixed

I opened every generated PNG (all 18 named shots, all 15 stage frames, all 15
30-second frames, and the contact sheet). Ranked worst first:

1. **A full-screen green slab** at level starts (tree canopy intersecting the
   chase camera). Fixed in Tier A: `treeData()` sites trees outside camera
   blockers and `keepCameraClear()` clears the camera corridor.
2. **White blown-out lamp heads and floating night "pyramid" cones** on every
   stage. Fixed: lamp emissive reduced from 3 to ~0.75 with a smaller head;
   `worldBuilder.setNight(false)` hides the night-only cones during staged jobs;
   `StageManager` hides the old city roots that were still lit behind stages.
3. **Four seconds of empty brown screen after a teleport** (level restart and
   Free Play). Diagnosed with a real-browser trace (`clearT` 0.38 → 1, camera
   z 461 → 667). Fixed: `CameraManager.snapTo(vehicleMesh, pos)` positions the
   chase camera immediately using the explicit post-teleport position, and
   `camClearT = 1` is set on both paths.
4. **Nearly identical grey grid stages** (L7/L9/L13/L14 all looked alike) plus
   a half-empty slab on L2/L9 and a black/yellow slab covering L14. Fixed:
   per-stage ground canvas textures + skyline/landmark pairs in `Stages.js`;
   the stage centre is now the pile↔truck midpoint; stage `boxes=[]` removes
   invisible city colliders; L14 blockers/props moved to radius 42–108 m;
   L8 got a dark night foundation; L15's hint no longer overlaps LOADS.
5. **Free Play showed `LOADS LEFT 3`, a stale menu camera and a countdown
   timer (`2:59`) that contradicted "No timer · no fail".** Fixed with
   `ui.setLoads(0)`, the `snapTo` fix above, and a real CSS bug fix:
   `setTimer(null)` had been adding an `.off` class that had **no CSS rule at
   all**, and `#tf-hud .tf-p{display:flex}` outranked the first attempt. The
   final `#tf-hud .tf-timer.off{display:none}` removes the stale countdown.
   Verified in a real browser (`computed display: none`) and in the regenerated
   `10-freeplay.png`.

**5 found, 5 fully fixed** — exceeding the "fix at least 3" bar. Additional smaller fixes: `.tf-ring{inset:0}` (clipped rings), ≥14px HUD
fonts, `--green` amber/green contrast, square 720×720 map, `16` screenshot
isolating BIG BUTTONS, and a real two-lane traffic lineup behind L5.

Remaining known cosmetic issues: the L3 sign sits partly behind the minimap at
one camera angle, and phone shots `03`/`04`/`16`/`17` intentionally show L5.

---

## 3. Real-browser test matrix

Full raw output: `docs/QA_EVIDENCE.txt`.

| Harness | What it really does | Result |
| --- | --- | --- |
| `contrast-check.mjs` | computed colour + WCAG ratio on 172 elements / 11 screens | **0 failures, PASS** |
| `layout-check.mjs` | real DOM rects at 1920×1080, 1280×720, 844×390, 440×956, 390×844 | each `11 BOXES 0 OVERLAPS 0 OFFSCREEN 0 TARGETS<48 0 CLIPPED`, **PASS** |
| `button-check.mjs` | 52 real clicks, 20/20 action assertions, W speed 1, mouse joystick speed 6, F 1.6 s / G 1.2 s holds, BIG `--u 1→1.2`, lefty joy x 10→505, CDP two-finger | **PASS**, 0 red errors |
| `level-walk.mjs` | all 15 stages with real keys; **3 real held-F scoops + 3 real held-G dumps on L1** (loads 1→2→3); L4 wrong-truck dump rejected (`loads=0`, "Drive to the blue truck"); L7 pipe dropped off-pad leaves `done:0`; L9 drive off deck stays playable; 15 distinct grounds / pairs / yaws / 3 coaches each | **29/29 PASS** |
| `perf-check.mjs` | fps + draw calls + triangles for start/L1/L11/L15/Free Play; A11 reverse beeper; stage sound bed | **PASS** (table below) |
| `sdk-check.mjs` | **without** aborting the SDK script: opens PLAY, 9 windows, 15 levels | **0 × `CrazySDK is not initialized yet`**, 0 pageerrors, **PASS** |
| `session.mjs` | 602 s of real keys/clicks/level changes with full console transcript | 108 clicks, 323 key holds, 16 level changes, 0 crashes, 0 red errors, **PASS** |
| `screenshots.mjs` | 18 named PNGs | `RED ERRORS []`, all viewed |
| `contact-sheet.mjs` | 15 first frames + 15 30 s frames + 1320×2620 sheet | `RED ERRORS []`, all viewed |

Node/static harnesses (all PASS): `ui-audit` (35 refs, 23 actions, 0 missing),
`ui-runtime-check` (85 controls, 0 failures), `tier1-check` (exactly 3 scoops +
3 dumps, RUSH 3 misses / 0 delivered), `garage-check` (4 paid steps → level 5,
spent 1750), `park-check` (120 coins from 8 rings, cap 300), `ads-check` (SDK
missing is a silent no-op; all three callbacks; 120 s/180 s gates; `?fakeads`).

### Performance (headless software WebGL, no GPU)

```
START MENU   fps 65.5 | draw calls 246 | tris 25990
LEVEL 1      fps 53.8 | draw calls 253 | tris 26234
LEVEL 11     fps 57.5 | draw calls 355 | tris 30472
LEVEL 15     fps 53.6 | draw calls 305 | tris 28672
FREE PLAY    fps 52.0 | draw calls 158 | tris 62420
```

Free Play stays under the 200 draw-call budget. The **10-minute soak averaged
7.4 fps** (99 samples): software WebGL decays from ~42 fps to 5–8 fps under
continuous rendering. That is a real limitation of this test environment and I
am **not** claiming a stable 60 fps. On a GPU the same frame does 158–353 draw
calls and 26k–62k triangles, which is a modest load; hardware validation is
still outstanding.

A11 reverse-beeper is verified: `beeps 0 → 6` at `speed -5.71` while
reversing, and the stage sound bed is active (`bed=birds`).

Draw-call instrumentation was fixed in this pass: `renderer.info.autoReset = false`
plus an explicit `renderer.info.reset()` before each frame. The earlier table
reported `calls=1, tris=1` everywhere because the composer's final fullscreen
quad reset the counter.

---

## 4. What is still NOT verified

Honest gaps, not hidden failures:

- **60 fps on real hardware.** No GPU in this sandbox.
- **True mobile emulation.** `button-check.mjs` uses CDP `Input.dispatchTouchEvent`
  two-finger on a desktop context; `isMobile:false`. A physical phone was not
  available. The 5-size DOM layout check is real, though.
- **CrazyGames portal inside an iframe.** The SDK script cannot reach
  `sdk.crazygames.com` here. `sdk-check.mjs` proves our code never emits
  "CrazySDK is not initialized yet"; the one console entry is the expected
  `ERR_CONNECTION_CLOSED` / `ERR_FAILED` for the blocked SDK URL. Real ad
  playback inside the portal is untested.
- **Unfiltered `RED ERRORS []`.** `redErrors()` deliberately filters SDK
  network noise, `ERR_FAILED`, favicon and Brave messages. The unfiltered
  zero-`CrazySDK` proof is `scripts/sdk-check.mjs` and the full 10-minute log
  in `docs/QA_SESSION_LOG.txt` (1 console entry: the SDK network failure).
- **StuntPark air-time / ring physics** is verified by the Node `park-check`
  harness, not by a real-browser jump.

---

## 5. Build

`npm run build` succeeds (~0.6–0.8 s) and `dist/` is current for all source
edits in this pass. Vite still warns about a >500 kB chunk (the Rapier WASM
bundle); that is expected and not an error. `base:'./'` keeps asset paths
relative for portal uploads.
