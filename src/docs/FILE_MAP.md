## V4 continuation map (2026-11-06)

[READ] Vehicle.applyStopAssist runs once after the physics solver batch using frame game time; it snaps slow grounded horizontal motion to zero. Governors use physical speed, not the display cap.
[READ] CameraManager owns camera clearance and fading. The old main.js keepCameraClear implementation was removed. World and StageManager toggle hidden-city physics alongside visibility; TrafficPhysics follows the same stage state.
[READ] World.setPileLoads/showPileLabel implement a code-made floating count, sized in screen pixels. GameUI.announce2 accepts a duration for GET READY. Menus picker scopes its amber outline to beat button CSS specificity and scrolls its cards, not the START button.
[RAN] New browser tests: v4-handling.mjs, v4-camera-actions.mjs, v4-followup.mjs, v4-clock.mjs, v4-phone.mjs. v4-session.mjs was corrected after an idle/paused run; corrected active-session proof still pending.
[READ] window.__tfObserve is read-only instrumentation for real-input tests. Existing mutation QA shortcuts are not used to claim gameplay completion.

## V4 update (2026-11-06)

[READ] main.js: forward-only resume save, next unfinished start info, silent modal navigation, immediate hold effects, frame-time clock, five-step physics cap, action timing observations.
[READ] Vehicle.js: direct scoop/dump effects; stronger coast assist; reverse limit stays 14.
[READ] Levels.js: no pile reset between loads. Stages.js: smaller front-facing signs.
[READ] Menus.js / GameUI.js: real reward text survives refresh, named NEXT, champion label, NEW level outline, optional tap-to-act, desktop keycap visibility and amber key-down state.
[READ] CameraManager.js: recursive collision ray, closer pull-in, upright camera, corrected wheel direction.
[RAN] scripts/newplayer.mjs and scripts/v4-ui.mjs are this pass's real-input browser tests.
[UNKNOWN] See docs/V4_REPORT.md for strict checklist and outstanding work.

# FILE MAP - TerraForm 3D (depth summary of every file)

## LATEST - QUALITY PASS v3 (2026-11-05)

The table below is HISTORICAL (it describes HUD v7 and the pre-Tier-C layout).
Current source of truth: `README.md` at the repo root and `docs/DEPTH_REPORT.md`.

New/changed since this table was written:
- `src/ui/GameUI.js` → **HUD v8**: always-visible `.tf-touch`, circular speedometer,
  hidden keyboard pad, `setVerbs()`, `setLoads()`, ≥14px fonts, `.tf-ring{inset:0}`.
- `src/ui/Menus.js` → steel/amber theme, square 720×720 `#tf-map-c` map canvas.
- `src/gameplay/Stages.js` → **NEW** 15-stage environment system (`STAGE_TABLE`,
  `StageManager`, `qaStage()`, `qaAllStages()`), ground textures, skylines,
  landmarks, traffic lineup, 3 coach lines, sound beds.
- `src/gameplay/Levels.js` → `stageCoach()`, compound cone gates, tumble ≤1.5 s, `+2s`.
- `src/gameplay/Jobs.js` → six `UPGRADES` of 4 paid steps each + `UPGRADE_KEYS`.
- `src/core/CameraManager.js` → `snapTo(vehicleMesh, pos)` kills the 4 s teleport fly-in.
- `src/core/Audio.js` → `setSoundBed(name)`, `beepCount`, `engine:0.28`.
- `src/main.js` → renderFrame() QA instrumentation, `qaRender()`, `qaAudio()`,
  stage wiring, `ui.setLoads(0)` in Free Play.
- `scripts/` → `browser.mjs`, `contrast-check.mjs`, `layout-check.mjs`,
  `button-check.mjs`, `level-walk.mjs`, `screenshots.mjs`, `contact-sheet.mjs`,
  `perf-check.mjs`, `sdk-check.mjs`, `session.mjs` (all real Chromium), plus
  refreshed Node harnesses.
- `docs/` → `QA_EVIDENCE.txt`, `QA_PERF.txt`, `QA_SESSION_LOG.txt`,
  `DEPTH_REPORT.md`, `screenshots/` (48 real PNGs).

---



## LATEST (2026-11-05, FINAL PRODUCT PUSH) - new / changed files

| File | Role |
| --- | --- |
| `src/main.js` | glue: GameUI opts (`hold/tap/action/state/data/unlock`), `uiData()`, `handleUiAction`, 3 s hold action, 6 upgrades + paint, Ads, StuntPark, `mapData()`, traffic player pos. |
| `src/ui/GameUI.js` | HUD v7: exact portrait / landscape / desktop CSS, pointer controls, Menus integration, `setKey/setBig/setLefty/setActionProgress`. |
| `src/ui/Menus.js` | NEW: one window layer - start, pause, settings, help, levels, garage, result, fail, confirm, big map. Code-made SVG/CSS only. |
| `src/gameplay/Jobs.js` | economy + site finder only. Old `JobPanels` window system deleted (296 lines). |
| `src/gameplay/Levels.js` | 15 levels + LevelEngine + verbs + boss truck + RUSH miss fix. |
| `src/gameplay/Guidance.js` | ring + bobbing chevron + near fade + guide-arrows toggle. |
| `src/gameplay/StuntPark.js` | NEW: TIER 7 free-play park (32 meshes, 8 colliders). |
| `src/core/Ads.js` | NEW: safe CrazyGames v3 video-ad wrapper + `?fakeads`. |
| `src/core/Audio.js` | `setVolumes/getVolumes/setAdMuted`, one AudioContext. |
| `src/core/World.js` | traffic slows/stops for machine; water/park block flags. |
| `src/vehicle/Vehicle.js` | `setPaint`, 6 upgrade effects, body roll, light smoke, `backhoe` naming. |
| `index.html` | SDK v3 script, loading screen, `#tf-hold` minimap canvas, focus script. Old pause overlay removed. |
| `scripts/*.mjs` | Node-only checks: tier1, ui-audit, ui-runtime, layout, level-walk, garage, park, ads. |
| `src/docs/RESEARCH_UI.md` | <=10 min official SDK/MDN research notes. |
| `src/docs/UI_SPEC.md` | exact HUD boxes as built. |
| `docs/DEPTH_REPORT.md` | every button, score, evidence, NOT VERIFIED list, top 10 improvements. |
| `docs/screenshots/` | empty on purpose (no browser); see README.md. |

Internal `jcb` names are GONE from code (`this.mode = 'backhoe'`, `backhoeGroup`).
Never show the brand "JCB" to players. Old docs below mention the old names historically.

---

Written 2026-11-05 at the end of a very long chat. A new AI must read this after CONTINUE.md and STATE.md.
Rule: this map comes from memory of the previous chat. Where it says "not read in detail", ASK the user for that ONE file before you edit it. Never guess file text.

## 0. Repo and tools

- GitHub repo testsharm/gameprotype, branch clean-v1, worked in a GitHub Codespace.
- Last clean-v1 commit: 2868983 (2026-11-05 08:15) = M7a part 2 + HUD v5. Work continues on the Arena session branch.
- Executor (tools/executor.cjs, port 3002) applies blocks pasted in its Apply tab. Buttons: Preview, Apply, Check project, Undo last apply, Save to GitHub. Files tab has Copy selected.
- Game runs at port 5173 (Vite dev). Preview build 4173. Agent mode: `npx vite build` is the syntax/import check.
- URL flags: ?unlockall (all jobs open), ?rich (3000 coins, dev only), ?touch (forces touch HUD), ?debug (debug overlay).
- Stack: Three.js, @dimforge/rapier3d-compat, Vite 8, plain JS ES modules. No new packages. Every file using THREE needs: import * as THREE from 'three'.

## 1. Repo state (2026-11-05)

- M7a part 2 (Jobs.js 895 lines, main.js 1134 lines) and Round 1 / M4f (HUD v5) are BOTH in commit 2868983.
- Round 1b (root index.html fix) is a later commit on the Arena session branch. See STATE.md.

## 2. Round 1b bug (FIXED in code, awaiting the user's visual test)

Round 1 Apply said: CREATE src/index.html (86 lines). It should have been an overwrite of the ROOT file index.html (the Vite entry, in the main project folder, NOT inside src).
Result: the game still loads the OLD root index.html, so on screen we see NEW HUD (from GameUI.js, works) on top of OLD HUD pieces:
- yellow UPGRADES button and extra buttons under the minimap (top-left)
- ORBIT / CHASE / CAB / BUCKET list on the right
- big yellow ring (old minimap frame) behind the coin pill and menu button
- second key panel (DRIVE, W A S D, Space Brake) on top of the new hint panel (bottom-left)
Fix applied (Round 1b):
1. ROOT index.html = the contents of src/index.html, plus a tiny inline script that removes focus from buttons (Space stays the brake). Vite script tag is `type="module" src="/src/main.js"`.
2. src/index.html was deleted (nothing imported it).
3. main.js: removed the dead old-shop wiring, the old `.key` pointer bindings, the old `.cam-btn` click bindings and the dead Jobs-button creator. All lookups of removed ids are already null-guarded.
4. CameraManager.js: removed its `.cam-btn` click binding (only key C / the HUD camera button now changes the mode).
5. JobEffects.js: `.je-counter` (second coin counter) is disabled, `.je-popup` (+coins) now appears under the coin pill instead of the screen centre, emoji removed.
6. Guidance.js: the old centre tutorial card is gone; steps dispatch `tf-tutorial`, which GameUI.js shows as a hint + toast.
7. MobileControls.js, LevelSystem.js, MissionManager.js, WorldPolish.js are NOT imported by main.js and create nothing.
8. `npx vite build` passes. jsdom check: every new HUD id exists, zero old HUD ids in the page.

Also seen in the phone test (F12 device mode 440x956, tall): the HUD was designed for WIDE phone 844x390, so the mission card is squeezed in portrait, and touch buttons (F SCOOP, joystick, BRK) did not show because touch mode was not detected. Console warning "AudioContext was not allowed to start" before first key is normal.

## 3. Files, one by one

### index.html (ROOT, old) and src/index.html (new, stray)
- Root index.html (85 lines + focus script) IS the new HUD page: SDK script, inline SVG favicon, user-select:none, canvas #game-container, hidden #tf-hold with #minimap-canvas and #coin-count, #pause-overlay with [data-act] buttons, #loading-screen, module script. src/index.html was deleted.
- main.js guards old getElementById lookups with if checks, so removing old ids is safe.

### src/main.js (about 1135 lines) - the heart
- Imports: Vehicle, AudioHub, CameraManager, World, QAManager, JobEffects, Guidance, DigAnimator, GameUI, TrafficPhysics, { JobSystem, JobPanels, buildSiteDressing, upgradeCost } from Jobs.js, and { LevelEngine } from Levels.js. START_LEVEL reads ?job=N (1-15). level = new LevelEngine(...) is created in ensureJobs(); placeSite() calls level.start(); animate() calls level.update(); the dump path calls level.onDump(); onScooped() calls level.onScoop(); engineProgress() counts gate/trench/debris goals; finishJob() adds the bonus row.
- Globals: ui, jm, currentJob, lastLoads, panels, modalOpen, siteNow {pile,truck}, saveData {coins, engineLevel, hydraulicLevel, bucketLevel} under localStorage key terraform_city_save_v6.
- Functions: ensureJobs, jobCtx, syncCoins, refreshCard, openModalState, closeJobModal, captureBase, syncTruckCollider, placeSite(id), setEnv / updateEnv (sky colours, fog, work light), updateRain, startJobNow (calls ui.announce(j)), goJob, onScooped, deliverLoad, finishJob, onJobFail, openPicker, buyUpgrade, openShop.
- window.restartJob: closeJobModal, ensureJobs, resetDirtPile, placeSite(currentJob), lastLoads = 0, startJobNow, reset vehicle to (-35,1.2,10) yaw PI, empty the truck.
- initPhysics creates RAPIER world, Vehicle, QAManager, calls restartJob, hides loading-screen. At that moment ui does not exist yet, so announce is skipped for the very first job start (initUi then sets title 'Clear the Highway').
- updateUi creates the UI on the first frame (initUi).
- Delivery detected when hasScoopedDirt && !vehicle.hasDirt and bucket within 10 m of truckGroup.position + (0,2,-1). Else toast "Missed the truck - scoop again".
- Keys use event.code through CODE_TO_KEY: KeyJ picker, KeyU shop, KeyP pause, KeyR restart, KeyM mute, KeyC camera, KeyF/KeyE action, Space brake. togglePause is ignored while modalOpen.
- Daily bonus check calls ui.setMenuDot(true) plus toast. onCoins handler calls ui.setMenuDot(false).
- Old Jobs button block in main.js depends on #shop-btn which no longer exists in the new html: no Jobs button is created now. The menu drawer, J and U replace it.
- Rendering: quality presets low/medium/high with FPS step-down. Post: bloom 0.22, vignette, OutputPass. scene.fog = FogExp2(0xdfe9f3, 0.0020) (but World.js locks scene.fog, see World.js). Debug overlay at left 8px top 64px. keepCameraClear workaround (treats building x,z as box centre). Minimap draws target (siteNow.pile if no dirt, else siteNow.truck). window.__testTimestep().
- Passes EMPTY arrays to cameraManager.setCollidables(...), so CameraManager building collision never works. keepCameraClear is the workaround.
- Passes vehicle.currentSpeed (rounded, non-negative) to hub.setEngine, so the reverse beeper probably never fires. Fix idea: vehicle.getForwardSpeedMps() * 3.6.
- Known todo: remove fog override here and fog lock in World.js; remove double camera-button binding with CameraManager (maybe moot now).

### src/ui/GameUI.js (376 lines, HUD v5) - works
- Injects CSS (id tf-hud-css), root #tf-hud, scale var --u = clamp(min(w/844,h/390),1,1.4)px. Every size is calc(var(--u)*n).
- Touch detection: (pointer:coarse), ontouchstart, or ?touch.
- Moves #minimap-canvas from html into its round frame.
- API: setJob(title, objective, stepText) (parses "label n/m"), announce(job) (card grows 3.8 s, 5.5 s if job.tutorial, shows "JOB id" plus job.story), setTimer(sec|null) (warn style at 30 s or less), setCoins(n), setSpeed(v) (ring MAX 45), setHint(text) (9 s fade, "Press" becomes "Tap" on touch), setMenuDot(on), toast(msg, 'info'|'success'|'warn') (max 3, 2.5 s), showLocked, reset().
- Touch buttons dispatch real KeyboardEvents: F button KeyF, camera KeyC, BRK Space (held), joystick KeyW/A/S/D with 0.35 dead zone.
- Menu drawer tiles dispatch KeyJ, KeyU, KeyR, KeyC, KeyP, KeyM. Pause overlay buttons ([data-act]) call KeyP first, then KeyR / KeyJ / KeyU.
- LAYOUT: top-left timer + round minimap; top-centre mission card alone; top-right coin pill + hamburger menu (green dot = daily bonus); toasts in a lane under the coin pill; bottom-left F SCOOP round button + camera button (touch) or key hints (desktop); bottom-centre hint pill; bottom-right round speedometer and (touch) red BRK above the DRIVE joystick.
- TODO: portrait layout, bigger touch targets (see STATE.md).

### src/gameplay/Levels.js (NEW, about 790 lines) - single source of truth for all 15 levels
- Exports CHAPTERS (Rookie Yard 1-5, Contractor 6-10, Site Boss 11-15), LEVELS (15 objects), chapterOf(id), class LevelEngine, default LevelEngine.
- Each LEVEL: id, name, chapter, type, theme, story, rule, steps[{kind,n}], loads, time, reward, tutorial?, needs{job}, bonus{text,coins}, env{id,sun,hemi,fog,fogColor,lights,rain}, site{keep?|bearing,dist,spread,gap}, dressing, scoopText, dumpText, hints{scoop,dump}, gates{width,slalom}?, rush?, beam?.
- Goal kinds: haul (count on dump near truck), fill (dump into a growing pothole mound, truck hidden), move (pipe/crate snaps into the bucket, place on a pad), gate (drive through an amber cone gate in order; L14 gate 3 has a low beam), trench (count on scoop at a marked trench plate), debris (count on scoop at a marked debris pile). RUSH/MIX use ordered steps to chain checkpoints, hauls and fills.
- LevelEngine(scene, worldBuilder, siteNow, hooks): start(job, site), dispose(), update(dt, vehicle), onScoop(bucketPos, vehicle), onDump(bucketPos, vehicle), onMiss(), objective(hasDirt), stepText(), hint(), wantsDump(), active(), activeKind(), bonus(), info(), isFinished(). Hooks: onCount(tip), onToast(msg,kind), onCombo(n), onChange(), truckSolid(on,x,z).
- Internals: _buildGoals, _buildGate, _buildTrench, _buildDebris, _buildHole, _buildMoveProps, _buildMarker, _setup, _place, _setTarget, _advance, _attachCarry, _detachCarry. All geometry is code-made (Box/Cylinder/Cone/Torus/Circle/Dodecahedron). It moves worldBuilder.dirtPileGroup / truckGroup / jobSiteBase and toggles truck visibility + the fixed Rapier truck collider through hooks.
- QA-only (?qadebug) hooks in main.js: window.__levelInfo(), window.__qaLevel.{info,dbg,objects,site,teleport,step,gateTest,objective}.

### src/gameplay/Jobs.js (about 869 lines)
- Exports: MAX_LEVEL = 4, START {x:-35,y:1.2,z:10,yaw:PI}, STAR_MULT [1,1.15,1.3], TIPS [10,16,24,34], DAILY [50,75,100,150,200,300,500], RANKS, UPGRADES (only engine, hydraulic, bucket), rankInfo, tipFor, upgradeCost, class JobSystem, class JobPanels, buildSiteDressing(THREE, id, pile, truck), JOBS (= LEVELS imported from Levels.js), default JobSystem.
- JOBS = LEVELS: 15 levels in 3 chapters, each with steps, loads, time, reward, needs{job:id-1}, bonus, env, site, dressing, rule. Bearing 0 = north (-z), 90 = east. Level 1 keeps the original (0,-120) site.
- JobSystem: save key terraform_jobs_v1 (jobs{id:{done,stars,best,plays}}, xp, last, daily{last,streak}, stats{loads,jobs}). Methods: list, get, record, isDone, rankInfo, persist, lockReason(id, ctx) (empty if URL has ?unlockall), isUnlocked, nextId, lastPlayed, start(id), update(dt) (calls onTick(secInt), onFail(job,state)), addTime(sec), setPhase, objective, hint, stepText, addLoad(ctx) -> {loads,total,tip,complete}, complete(ctx) -> result, dailyStatus, claimDaily(mult), layout(buildingData, propColliders), siteFor(id).
- Result object: job, stars, timeLeft, timeUsed, firstClear, newBest, base, starBonus, rankBonus, coins, tips, xpGain, rankBefore, rankAfter, rankUp, newlyUnlocked, nextId. main.js adds r.bonus {text,coins,max,got} from LevelEngine.bonus() and adds bonus coins to r.coins; showResult prints a bonus row.
- Economy in code: reward = job.reward * (first ? 1 : 0.4) plus star bonus (x1.15 / x1.3) plus rank bonus. XP = 100 + 40*stars on first clear, else 30 + 15*stars. Rank thresholds 0/150/400/800/1400/2200 XP. Engine top speed 32/37/42/47. Hydraulics arm speed 100/160/220/280 percent. Bucket tip 10/16/24/34.
- Site finder: scans -270..270 step 4; target distance within 70 m, bearing within spread; stays clear of roads (ROAD_POS, ROAD_HALF), garage yard (|x|,|z| < 64), Job 1 site (r 34), buildings, props (capped radius 7). If no free ground, falls back to the Job 1 place. VERIFIED 2026-11-05: 15/15 levels got a distinct ok site in headless Chromium.
- JobPanels: isOpen, hide, briefing (unused now), showResult(r,{onNext,onReplay,onJobs}), showFail(job, loads,{onRetry,onAd,onJobs}), showPicker(sys, ctx,{onPick,onClose,onCoins}), showShop(getCtx,{onBuy,onClose}). Root #tf-jb-root z-index 500 (above HUD z 100 and pause overlay z 400). These windows still use the OLD look. CSS ids tf-jb-css, tf-jb-css2.
- buildSiteDressing: now keys off job.dressing (yard, course, road, park, city, trench, pipes, night, bridge, storm, crane, mega). Pads, cones, canvas sign, plus trees/benches (park), barriers (road/bridge/city), floodlights (night), fallen trees/puddles/sandbags (storm), crane (crane/mega/pipes), and lane markers + work lamps (course/trench/pipes). The sign says LEVEL n and the chapter name.
- SOLVED: the generic scoop-and-dump loop is gone (Levels.js).

### src/core/World.js (about 1601 lines) - not re-read recently
- Seeded RNG makeRng(20241102). Constants FLOOR_H 3.5, BAY_W 3, Y0 0.05, ROAD_POS [-240,-160,-80,80,160,240], ROAD_HALF 12, WORLD_EDGE 1000, ANISO 8.
- Fields: buildingData ({x,y,z,w,h,d} centre-based), propColliders (about 1000, format {x,y,z,w,h,d} centre-based VERIFIED at lines 1275-1287 and 1585-1589), dirtPileGroup, allDirtClods, _masterClods, trafficCars (70), truckGroup, truckDirtLevel, truckDirtMeshes, jobSiteBase (NEW group holding the Job 1 dirt patch + 16 cones so they move with the site), sunLight, hemiLight, sky, farBuildingCount.
- Methods: shrinkDirtPile, resetDirtPile, addDirtToTruck, createPhysicsColliders(world, RAPIER).
- Garage hub at (0,0). Job 1 site at (0,-120): 45-clod pile, blue truck at (15,0,-120), 16 cones.
- Fog lock: Object.defineProperty on scene.fog, so main.js FogExp2 0.0020 is ignored. updateEnv writes scene.fog.density and color: check it works with the lock (NOT VERIFIED).
- createJobSite read: the original patch and 16 cones are now children of jobSiteBase at (jobX,0,jobZ); main.js placeSite moves that group to the active site. Fixed the old bug where they stayed at 0,-120 on every job.

### src/core/Vehicle.js (about 608 lines)
- Rapier dynamic chassis 7000 kg, CCD on. Throttle ramp 0.35 s. Base top speed 32 km/h (32 + (engineMultiplier-1)*10, cap 60), reverse min(14+(mult-1)*2, 28) km/h. Engine multiplier 1+(engineLevel-1)*0.5, hydraulics 1+(hydraulicLevel-1)*0.6.
- Public: mesh, chassisBody, boomPivot, bucketPivot, bucketDirtGroup, pilePos, truckPos, hasDirt, currentSpeed, scoopDirt, dropDirt, spawnDirtBurst, autoAction, toggleArm, getForwardSpeedMps, setUpgrades.
- userData.cabHide marks parts hidden in CAB view. Window events: bh-dig (detail scoop or dump), bh-hint (detail text), bh-mute.
- Internal names mode = 'jcb', jcbGroup, if (this.mode === 'jcb') still exist. Never show "JCB" to players. Avoid FIND strings with those names. Clean up at the end.
- Max speed seen 36 km/h instead of 42 at Engine MAX: cause unknown.

### src/core/TrafficPhysics.js
- Kinematic colliders for traffic cars, half-size {x:1,y:0.8,z:2.25}. Car variety (M3f) must store half-size per car.

### src/core/CameraManager.js (v2)
- Modes orbit, chase, cab, bucket (starts in bucket). CAB_NEAR 0.3. Uses userData.cabHide. Binds .cam-btn clicks itself (new html has none). Building collision never works (empty arrays from main.js).

### src/core/Audio.js (971 lines, class AudioHub)
- LEVELS = { master 0.9, music 0.3, ambience 0.22, engine 0.7, sfx 0.8, reverb 0.4 }. Mute saved as terraform_muted_v1.
- API: start, startAmbience, unlock, stop, setIntensity, setEngine(speedKmh, throttle), setMuted, toggleMute, isMuted, duck(sec), dig(type, name), coin, complete, click, debugText.
- Unverified: duck about 0.50 during dump, silence when tab hidden, reverse beeper, dig sounds follow the arm. Engine too loud (lower LEVELS.engine in M8).

### src/core/DigAnimator.js
- 3.0 s eased scoop or dump, sets window.__digBusy. Touch only if the user asks.

### src/core/QAManager.js, src/gameplay/JobEffects.js, src/gameplay/Guidance.js (folders not confirmed)
- Not read in detail. JobEffects has its own CSS and DOM (.je-counter, .je-popup, .je-banner), onScoop, onDump, update, reset are used. Check whether they look for DOM that the old html had (red F12 line mentioning null) and whether the "+coins" popup sits in the screen centre.

### Old files to delete at the end (folders not confirmed)
- Already unused: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js, JobManager.js.
- Later, after checking no import points to them: MissionManager.js, MobileControls.js, LevelSystem.js, maybe JobEffects.js and Guidance.js (both still imported by main.js).
- The Executor cannot delete. Give ONE terminal command at the very end, say exactly where to run it.

### Docs
- src/docs/HANDOFF.md (master, 2026-11-02), STATE.md (live status), CONTINUE.md (17 sections, log in section 17 ends with the SESSION LOG END MARKER line), FILE_MAP.md (this file).

## 4. Rules that must never break

- Anti-flicker: no geometry thinner than 0.3 units; road lines painted in one canvas texture; window atlas with mipmaps and anisotropy 8; layers 0.02 apart plus polygonOffset; fog and antialiasing on; logarithmicDepthBuffer OFF; CAB near stays 0.3.
- Audio: one AudioContext, all sounds synthesized, resume on first input and touchend, music ducks 50% on dump, silent while tab hidden.
- Keys: event.code. Never use Escape or Ctrl+W. No custom fullscreen button. No orientation-lock code.
- All art, sound, icons made in code. No outside images, fonts or scripts except the CrazyGames SDK script.
- localStorage always in try/catch. Relative paths only.

## 5. QA tooling available in this workspace (2026-11-05)

- `npm install --no-save jsdom` gives a fast DOM check of GameUI.js (no layout).
- `npm install --no-save @sparticuz/chromium playwright-core` + `inflate(bin/al2023.tar.br)` + `setupLambdaEnvironment('/tmp/al2023/lib')` + `C.executablePath()` gives a working headless Chromium. Launch with `C.args` and `env: process.env` (LD_LIBRARY_PATH must include /tmp/al2023/lib).
- `page.screenshot()` can hang on this WebGL game; use CDP `Page.captureScreenshot` instead. Serve `dist` with `npx vite preview --host 0.0.0.0 --port 4173` and abort the external SDK request with `ctx.route`. Launch a FRESH browser per level (one browser with many contexts crashes after the first page).
- Level QA (2026-11-05): load /?unlockall&rich&job=N&qadebug, then window.__qaLevel.step() walks every goal; gateTest(x,z,bpy) drives gate detection deterministically; objects() counts level meshes; __levelInfo() reports the goal chain and all 15 site-finder results. Screenshots land in git-ignored qa/.

## UX milestone file map (2026-11-05)
- `index.html` - root page. SDK script now has `data-crazygames-sdk="1"` so Portal does not inject a
  duplicate. Global `user-select:none`/`touch-action:none` removed; only GameUI's `.tf-playing` /
  `.tf-holding` classes lock scrolling, so menus stay usable. Keeps the minimap canvas, the legacy
  (unused) pause overlay, loading screen and focus-safety script.
- `src/main.js` - `gameState`, `uiPaused`, `rawSite`, `currentStartPose`; real input API
  (`actionHold`, `actionTap`, `unlockAudio`, `uiState`, `handleUiAction`); start screen flow
  (`prepareMenu`, `startGame`, `returnToMenu`, `menuPose`, `setVehiclePose`, `pauseForMenu`,
  `resumeGame`); per-level starts via `levelStartPose`; `Portal` wired with official gameplay
  start/stop/happytime; signed engine speed; `__speedInfo()` / `__tfState()` QA hooks;
  orientationchange + visualViewport resize handling; quality saved in `terraform_quality_v1`.
- `src/ui/GameUI.js` - HUD v6 + `#tf-shell` start screen + settings/controls/confirm windows.
  Real pointer controls (capture, multi-touch, release on all 5 paths), 7-button in-game menu,
  persistent Camera/Sound/Zoom tools, PC clickable key pad, landscape/portrait CSS, safe-area insets.
- `src/core/CameraManager.js` - Chase default; camera behind the machine; portrait distance factor;
  zoom (min 0.75 / max 1.65), canZoom(), cycleMode(), showcase hero orbit for the start screen,
  CAB near 0.3 kept, smooth lerps, wheel zoom in every zoomable mode.
- `src/gameplay/Levels.js` - 15 `start` objects + `levelStartPose()`; L5/L10 replaced with the
  'rush' goal (waiting trucks, countdown rings, lane numbers, expired truck leaves, L10 crossing
  traffic + red danger strip); `_buildRushTruck`, `_updateRushRing`, `_rushExpire`,
  `_buildCrossTraffic`; RUSH text/objective/bonus no longer says Gates.
- `src/gameplay/Jobs.js` - `JobSystem.prepare(id)` shows a level on the start screen with
  `running=false` (no timer, no load counting); `start(id)` unchanged.
- `src/gameplay/Guidance.js` - floating screen arrow REMOVED; one ground ring + painted chevron
  path on Level 1 (`setChevrons`, `onFirstLoad`, fade-out, `reset`).
- `src/core/World.js` - `createCentralGarageHub()` rewritten: <=1.2 m walls with hazard texture,
  painted markings plane, yard texture with oil/tyre/cracks/puddles, lit office, wash bay, 2 parked
  machines, InstancedMesh barrels/tyres/cones, lamp posts, flag. `garageGroup` exposed.
- `src/vehicle/Vehicle.js` - `signedSpeedKmh`; dial uses signed forward speed clamped to the
  engine-level cap (32/14 base, Engine only), resetToSafe clears it.
- `src/core/Portal.js` - now imported by main.js (was unused). Only documented v3 calls used.
