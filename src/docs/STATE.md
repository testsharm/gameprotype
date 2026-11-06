# Current Fix v4 continuation — 2026-11-06

[RAN] SAME branch arena/0ac523ae-gameprotype, SAME open PR #5. Strict score 12/21; DO NOT MERGE below 17/21.
[RAN] A published docs/SCREENSHOTS.md with actual desktop/phone captures and filmstrip. Initial 0/5/15 capture requests have delayed completion timestamps, disclosed in the page.
[RAN] B fixed the real Space/native-button timeout -> PAUSED bug. Focused 600.938-second test: 594.013 game seconds, 1354 holds, three real retries, zero unexpected pauses/focus losses/own errors. docs/V4_SESSION.txt and PAUSE_REPRO_BEFORE/AFTER.
[RAN] C group 1 has real-input finishes for L1–5. L2 six S gates + park, L3 three holes + traffic, L4 four matched material loads/two trucks with WRONG TRUCK, L5 three timed lanes + bigger final truck. Each has an independent remote floor/site. Read docs/C1_WALK.txt (failed attempts retained), C1_RETRY.txt, C1_CONE.txt, C1_CONE_VISUAL.txt. scripts/level-walk.mjs now drives real keys; unlockall only selects a starting level. No teleport/direct progress. Corrected routing runs 800x450, captures 1280x720/390x844.
[SEEN] Opened all new screenshot files. L4 mid still shows an old park hint; source corrected afterward, that frame is BAD and not recaptured. Cone contact settles correctly but the fallen cone is partly hidden under a wheel even after a real side orbit. The contact sheet deliberately blanks L6–15.
[UNKNOWN] Next required work: C group 2 L6–10, then group 3 L11–15, THEN D Free Play, THEN E art, F optional. Do not jump ahead. Do not ask the user. Push and report after every group. Old L6–15, Free Play and art are NOT rebuilt or proven. Remain honest, no score credit for partial fifteen-level criteria.
[RAN] npm run build passes; Vite config/chunk warnings remain. Preview 4173 reads current dist.

--- Historical notes below (new current block above wins) ---

## LATEST — V4 TIER 1 CONTINUATION (2026-11-06)

[RAN] Strict checklist now 11/21; see docs/V4_REPORT.md. PR #5 stays open, not merged.
[RAN] Real handling inputs: 20.21 km/h release stops in 0.906 s; 31.55 km/h Space brake stops in 0.877 s; measured reverse 14 km/h. Zero horizontal creep after stopping.
[SEEN] Camera lifts above the pile instead of entering the cab; near-wall materials fade. L3 now starts upright: hidden city colliders were tipping it. Selected L6/L11/L13/L15 starts inspected.
[RAN] Real tap-to-act and cancellation-to-rest tested. Five-frame clock: about 1 ms drift over eight seconds. Fresh normal-URL L1 -> +265 -> GET READY/NEXT L2 -> reload CONTINUE L2 passed again.
[SEEN] Picker amber outline, lock labels and START fixed at phone and landscape sizes. Floating pile label is bounded in screen size.
[UNKNOWN] Ten-minute zero-error run rejected as active-input proof: it sat paused after minute 3. Corrected harness not re-run. Do not count checklist 18.
[UNKNOWN] Tier 1 still not fully signed off: real L15 champion flow and full start/path clearance remain unverified. Tiers 2–5 remain blocked/unbuilt. Do not claim all 15 different levels or upgraded Free Play.

---

## LATEST — V4 PARTIAL TIER 1 (2026-11-06)

[READ] Base 1f091a9 from clean-v1. Session branch arena/0ac523ae-gameprotype is fixed by Arena.
[RAN] npm install and npm run build pass. No new packages.
[RAN] scripts/newplayer.mjs: normal URL, empty storage, only real W/S/Space/F/G holds and button clicks; L1 finished, +265 result, NEXT into unpaused L2, reload CONTINUE into L2. Read-only QA observations only; no teleports, unlocks, or completion shortcuts.
[SEEN] docs/screenshots/v4-*.png were opened and inspected. Real phone-sized two-touch input and real timeout screen captured separately.
[RAN] Checklist 9/21. See docs/V4_REPORT.md and raw V4_NEWPLAYER.txt / V4_UI.txt.
[UNKNOWN] Tier 1 remains INCOMPLETE. Do not advance Tier 2 or 3 yet. No claim of 15 level completion, improved Free Play, or 10-minute error-free session.
[READ] Old scripts/level-walk.mjs uses QA teleport and direct goal steps: its historical PASS is NOT evidence for the new requested standard.

---

# STATE - TerraForm 3D (live status)

## LATEST - QUALITY PASS v3 (2026-11-05) - REAL BROWSER VERIFIED

> **Read `docs/DEPTH_REPORT.md` first.** It is the current, honest report. The
> "FINAL PRODUCT PUSH - BUILT, NOT VERIFIED" section below is HISTORICAL and its
> claim that no browser/screenshots were available is FALSE for this session.

- Active branch `arena/154f02b1-gameprotype`, base `clean-v1` merge `1793af7`.
  `main` untouched. Commits: `d83a47a` Tier A, `26cd886` Tier B, `0428c15`
  Tier C, `6da2fb1` Tier D (plus the final docs/QA commit).
- Tooling: `@sparticuz/chromium@153.0.0`, `playwright-core@1.64.1`, `pngjs@7.0.0`.
  Real Chromium 153.0.8010.0 serves built `dist/` at `127.0.0.1:4179`.
- `docs/QA_EVIDENCE.txt`: contrast 0 failures; layout PASS at 5 sizes;
  button-check 20/20 (52 clicks); level-walk **29/29** (15 levels, L1 exactly
  3 held-F scoops + 3 held-G dumps, L4 wrong-truck / L7 pipe-drop / L9 fall-off
  negatives); perf PASS; sdk-check 0 × `CrazySDK is not initialized yet`;
  all 6 Node static harnesses PASS.
- `docs/QA_PERF.txt`: start 65.5 fps/246 draws, L1 53.8/253, L11 57.5/355,
  L15 53.6/305, Free Play 52.0/158 (<200). A11 reverse beeper `beeps 0→6`.
  Draw-call counter fixed with `renderer.info.autoReset=false` + explicit reset.
- `docs/QA_SESSION_LOG.txt`: 602 s real session, 108 clicks / 323 key holds /
  16 level changes / 0 crashes / 0 red errors. Honest caveat: software WebGL
  decays to ~5-8 fps over 10 min (avg 7.4); 60 fps on real hardware is NOT
  verified.
- `docs/screenshots/`: 18 named PNGs + 15 `level-XX.png` + 15 `-30s.png` +
  `levels-contact-sheet.png`. Every one was opened and inspected.
- 5 worst-looking things listed and **all 5 fixed**, including the Free Play
  timer HUD (`#tf-hud .tf-timer.off{display:none}` — the `.off` class had no
  CSS rule at all). See DEPTH_REPORT §2.
- `src/gameplay/Stages.js` is NEW: 15 distinct grounds/skies/fog/skylines/
  landmarks/yaws/verbs/3-line coaches/sound beds. `src/core/CameraManager.js`
  gained `snapTo()`. `Jobs.js` now has six 4-step upgrades (was 3).
- `README.md` at repo root is now a real project README.

---



## LATEST - FINAL PRODUCT PUSH (2026-11-05) - BUILT, NOT VERIFIED

- Branch `arena/66b14966-gameprotype`, based on `clean-v1` HEAD `8c57ed6` (PR #2 merge).
  `main` was NOT touched. No force push, no reset, no discarded work.
- Note on workflow: the master prompt asked for ONE new branch from `clean-v1`. Arena
  fixes the session to this one active branch, so work stayed here. It was fast-forwarded
  to `8c57ed6` before any code, which makes it equivalent to a branch from `clean-v1`.
- TIER 1 (`199dad0`, `bcb7c98`): no auto-complete; goal objects visible from frame 0;
  3rd load has dirt; debug box off unless `?debug` / backquote; light smoke; cab view;
  real `hub.setVolumes(master,music,effects)`; RUSH expiry is a MISS, not free progress;
  scoop and dump are ALWAYS a 3-second HOLD with a visible progress ring.
- TIER 2 (`76cd59a`): new `src/ui/GameUI.js`, portrait first-class (440x956, 390x844),
  landscape 844x390, desktop 1920x1080 / 1280x720. Left icon stack, right Drive, left
  Action, big buttons, left-handed swap. No rotate-lock / rotate overlay.
- TIER 3 (`899108c`): new `src/ui/Menus.js` - start screen before driving, PLAY 64 px,
  4 icon tiles, 2x3 pause grid, 44x44 red X on every window, 3 real volume sliders,
  graphics / big / lefty / guide toggles, 4-page HELP, level picker with 3 tabs,
  result / time-up with star + coin count-up, 6-card garage. Old `JobPanels` windows
  (296 dead lines in `Jobs.js`) deleted. `index.html` old pause overlay removed.
- TIER 4 (`d7ab7cb`): real pointer holds (mouse + touch, pointerId, capture, release on
  all 5 paths), no fake KeyboardEvent, real keyboard light-up (`scale(.94)`), zoom +/-
  buttons + Equal/NumpadAdd/Minus/NumpadSubtract + wheel, 2 px press on every button.
- TIER 5 (`72e64ad`): 15-level walk table (`scripts/level-walk.mjs`) - 15/15 walked,
  8 types, 7 skies, 15 distinct starts. Per-verb visuals (FILL mound, TRENCH deepening
  + spoil, MOVE snap/drop, CLEAR into bins, CONE penalties, RUSH 3/5 trucks + boss truck).
  Glowing ring + soft beam fading near + bobbing chevron + amber minimap target.
  Mission card = name + ONE goal line + 3 dots. Guide forced on for L1 until first dump.
- TIER 6: 6 upgrades x 4 paid steps (100/250/500/900), 5 pips, one stat, green/grey
  price button, small MAX badge, 6 paint swatches that really change machine colour,
  save migration from old 3-upgrade saves. `scripts/garage-check.mjs` PASS.
- TIER 7: new `src/gameplay/StuntPark.js` - 160x160 m park at (0,620), 6 ramps with
  physics colliders, hill, 360 turntable, 22-clod dig field, 12-cone slalom, 8 coin
  rings, pond, 3 jump pads, no timer/fail, capped 300 coin reward, best air time.
  32 meshes / draw calls (<150). `scripts/park-check.mjs` PASS.
- TIER 8: visual-only suspension body roll, wheel dust only above 18 km/h, dig dust
  only on scoop, traffic cars slow/stop for the machine, half-size car colliders,
  internal `jcb` names renamed to `backhoe`.
- TIER 9: one `src/core/Ads.js` using the documented `SDK.ad.requestAd` with
  `adStarted/adFinished/adError`; no-op without SDK; `?fakeads` 3 s overlay; mute+pause
  and restore; rewarded x2 coins / +60 s; midgame ONLY on NEXT after 120 s and 180 s
  cooldown; never during driving or on PLAY. `scripts/ads-check.mjs` PASS.
- TIER 10: full-screen big map with rounded roads, park / water blocks, player arrow,
  goal markers, landmark, compass, scale bar, X close and automatic pause.
- Docs: `src/docs/RESEARCH_UI.md`, `src/docs/UI_SPEC.md`, `docs/DEPTH_REPORT.md`.
  `docs/screenshots/` intentionally has NO PNGs - no browser exists here.
- EVIDENCE (all Node / static, NOT a browser): `npx vite build` OK; `ui-audit` PASS;
  `ui-runtime-check` 84 controls / 0 failures / 0 runtime errors; `layout-check` 5 sizes
  0 overlaps / 0 off-screen / 0 targets <48 px; `tier1-check` PASS; `level-walk` 15/15;
  `garage-check`, `park-check`, `ads-check` PASS.
- STATUS: **BUILT, NOT VERIFIED**. No real click/touch, no F12 console, no phone, no
  screenshot, no fps, no CrazyGames portal test. Do NOT claim "fixed" or "done".
- NEXT: real browser play-test at the 5 sizes, capture 15 screenshots, check console,
  then merge the PR into `clean-v1` and submit to CrazyGames.

---

Updated 2026-11-05 (end of a very long chat; a new chat must continue from here).
Read order for a new AI: CONTINUE.md, then this file, then FILE_MAP.md, then HANDOFF.md.

## Status in one look
- clean-v1 tip 2868983 (2026-11-05 08:15) already contains M7a part 2 (Jobs.js 895, main.js 1134) and HUD v5 (GameUI.js 375). All milestones M0-M4f are in the repo.
- WORKING MODE CHANGED (2026-11-05): an Arena agent edits this repository directly (read, edit, node --check, npx vite build, commit, push). The chat paste-box / Executor / "ask for ONE file" rules no longer apply. Commits are pushed to the session branch origin/arena/e2054f9b-gameprotype; the Codespace pulls that branch.
- Round 1b DONE (built + screenshots): ROOT index.html is now the new HUD page; stray src/index.html deleted; old HUD creators removed from main.js, CameraManager.js, JobEffects.js and Guidance.js.
- Round 1c DONE (built + screenshots): portrait (440x956) and short landscape (844x390) CSS layouts, reliable touch detection (coarse pointer / maxTouchPoints / ?touch / first real finger), all touch targets >= 48 px, pause buttons >= 48 px and 16 px text, hint + toast lanes moved clear of the controls.
- Evidence: `npx vite build` OK (dist/index.html 5.63 kB, main 884 kB, rapier 4.34 MB). A headless Chromium (npm @sparticuz/chromium + playwright-core) loaded the built game and took screenshots at 1910x900, 1280x720, 800x450, 844x390, 440x956 (files in qa/, git-ignored). Measured DOM boxes at all 5 sizes: 0 overlaps, 0 clipped zones, 0 old HUD ids, 0 touch targets under 48 px on the two touch sizes. Only console error is the blocked CrazyGames SDK script (expected outside the portal).
- The screenshots show ONE clean HUD: timer + minimap top-left, mission card, coin pill + menu top-right, key hints or F/camera buttons bottom-left, dial + BRK + joystick bottom-right, mission card full width on tall phones.
- Rounds 2-4 DONE (built + headless QA): NEW src/gameplay/Levels.js holds all 15 levels in 3 chapters and a real LevelEngine with 8 goal kinds (haul, fill, move, gate, trench, debris, rush combos, mix phases). Jobs.js now imports LEVELS as JOBS; main.js starts the engine, drives the mission card, counts non-dump goals, adds an optional bonus row to the result window, and moves the old Job 1 dirt patch + 16 cones with the site (they used to stay at 0,-120 forever).
- Level evidence: all 15 levels load with the right name, type, goal count, timer and objective; every goal chain walks to 100 percent and opens the result window with a bonus row; 0 page errors. 15/15 site finder results ok (distinct free ground). Level group mesh counts: HAUL 2, FILL 5, MOVE 11, CONE 32-53, TRENCH 26-38, CLEAR 50, RUSH 26-32, MIX 23. `npx vite build` OK (main 907 kB, rapier 4.34 MB). 5-size HUD re-check: 0 overlaps, 0 clipped zones, 0 old HUD ids, 0 small touch targets on phone sizes.
- QA helpers (guarded by ?qadebug): window.__levelInfo(), window.__qaLevel.info()/site()/step()/objects()/gateTest()/teleport(); ?job=N starts any level.

## UX milestone (2026-11-05, current work) - built, awaiting real play-test
- Scope fixed by the user: start screen, honest clickable controls, visible camera/sound/zoom,
  landscape-first phone HUD, per-level starts, Rush Hour Lite mismatch, garage-yard depth.
  The DEPTH PACK parts A-H remain LOCKED DESIGN for later rounds; all 15 levels were NOT rebuilt here.
- NEW: first load opens a TerraForm 3D start screen over a showcase view of the backhoe in the
  garage yard. Buttons: Play/Continue, Contracts, Garage/Upgrades, Settings, Controls/How to Play.
  No job timer starts until Play. `gameState` ('menu' | 'playing') gates jm.update/level.update/
  goal detection; `uiPaused` gates all in-game menus. JobSystem.prepare(id) shows a level without
  starting its clock. Last selected job is saved in terraform_last_job_v1 (try/catch).
- NEW: GameUI v6 owns a 7-button in-game menu (Resume, Contracts, Garage, Settings, Controls,
  Restart + confirm, Main Menu + confirm) and a shared modal window (Settings/Controls/Confirm).
  All are semantic <button>s with labels, tooltips and :focus-visible outlines.
- NEW: real input API in main.js (actionHold/actionTap). PC W/A/S/D/F/C/Space are clickable/holdable
  buttons; touch steering, F, BRK, camera, sound and zoom all call the SAME API. No fake KeyboardEvent
  dispatch remains. Pointer capture + pointerup/pointercancel/lostpointercapture/blur/hidden release.
  Multi-touch works (each pointerId is tracked separately). Keyboard still uses event.code.
- NEW: Camera/Sound/Zoom+/Zoom- are persistent HUD tools (never inside the hamburger), show the
  current camera mode and mute state, and disable with an explanation in Cab view. Chase is the
  default (was Bucket). Chase/Bucket cameras sit BEHIND the machine; portrait windows get a longer
  distance. CameraManager has zoomBy/setZoom/canZoom/setShowcase, smooth transitions, safe limits.
- NEW: 844x390 is the primary phone layout. Portrait (440x956, 360x800) stays usable; no orientation
  lock and no "rotate your phone" overlay. Safe-area insets used. Page scroll/selection is locked only
  while playing or while a control is held. Minimap no longer touches the mission card on portrait
  (card moved to top 220px). All touch targets >= 48 CSS px.
- NEW: all 15 levels have explicit `start: {back,side,face,cam}` data; levelStartPose() computes a
  safe absolute pose facing the first task. Node check: 15/15 distinct positions, 0 starts inside
  their own pile/truck. Ground chevrons on Level 1 fade after the first load; the weak floating
  screen arrow was removed. Level 1 hint now says "Drive to the highlighted dirt pile".
- FIXED: "Rush Hour Lite" is no longer "Gates 0/8". L5 is 3 waiting trucks in 3 lanes, each with a
  12-segment countdown ring + floating seconds; a truck drives away when its timer expires and the
  bonus is "No missed truck". L10 is 5 night trucks with crossing traffic and a red danger strip.
  New goal kind 'rush'; the blue truck is hidden but moved to the active lane so dump checks work.
- FIXED: speedometer shows the signed forward speed clamped to the current cap (base 32 km/h forward,
  14 reverse; only Engine Power changes it), so a physics overshoot cannot show 35 at level 1.
  hub.setEngine() now receives a signed speed so the reverse beeper can trigger. __speedInfo() added.
- FIXED: garage yard depth. All walls <= 1.2 m (no camera blocking). Painted service bays, hazard
  band, tyre arcs, oil stains, cracks and puddles in textures; low wall with posts; small lit office,
  wash bay, tool rack, 2 parked machines, cones, barrels/tyres/cones as InstancedMesh, lamp posts,
  flag. Central driving lane stays clear. No outside art/assets.
- SDK: src/core/Portal.js is now wired. Official v3 APIs used: SDK.init(), game.gameplayStart(),
  game.gameplayStop(), game.happytime(), game.settings.muteAudio, addSettingsChangeListener.
  gameplayStart fires only when the player first reaches playable state (menus excluded). Everything
  is wrapped in try/catch; all menus/controls work when the SDK is absent.
- Evidence this round: node --check OK on all 9 changed JS files; npx vite build OK
  (dist/index.html 5.60 kB, main 947.49 kB gzip 257.72 kB, rapier 4,335.49 kB, dist 5.1 MB).
  Node-only world check: sitesOk = 15/15, 486 building boxes, 947 prop colliders, 662 mesh/instanced
  objects, 15/15 distinct start poses, 0 unsafe starts, L5 rush 3/3, L10 rush 5/5.
  Static wiring audit: 33 HUD ids + 10 start/modal ids, 0 duplicate ids, 0 unbound start buttons,
  0 missing id references, no fake KeyboardEvent, all 5 pointer-release paths present.
- NOT VERIFIED: no Chromium/Playwright/jsdom binary is installed in this workspace and the user
  forbade installing new packages for screenshots, so NO browser screenshots, NO real click/touch
  test and NO measured DOM geometry were produced this round. Real Brave/F12 play-test is required.

## Known problems right now
1. (Round 1b, BUILT, awaiting visual test) Old HUD pieces should be gone: root index.html replaced, stray src/index.html deleted, JS creators disabled. If any old piece still shows, ask the user for one screenshot and inspect F12 Elements.
2. (Round 1c, BUILT, awaiting user test) Portrait layout and touch detection were rebuilt; headless-Chromium measurements show no overlap, no clipping and 48 px+ targets. Confirm on the real Brave F12 device mode.
3. (Round 1c, BUILT, awaiting user test) Touch buttons now stay in fixed corners at both phone sizes; confirm with `&touch` in the URL.
4. SOLVED: the generic scoop-and-dump loop is gone. All 15 levels now have their own place, goal objects, rule, mood and sky.
5. Job windows (picker, result, fail, shop) still use the old look and z-index 500 above the HUD. Round 5.
6. VERIFIED this round: propColliders format is {x,y,z,w,h,d} centre-based (World.js 1275-1287 / 1585-1589); site finder finds all 15 sites; the old Job 1 patch + cones now move with the site; result bonus row works; tutorial only plays on Level 1.
7. NOT VERIFIED (user must play): real driving through gates, beam height rule, feel of pipes snapping into the bucket, night/storm readability, menu drawer, pause overlay, real phone touch controls, fog lock vs updateEnv, 36 vs 42 top speed, audio items (duck, hidden-tab silence, reverse beeper, dig sounds), dust trail look, CAB/BUCKET camera views.

## Plan (about 12 rounds, one round = one paste plus one test)
- Round 1b (DONE in repo): root index.html fixed, JS HUD creators disabled, build + DOM check OK. User must still confirm on screen.
- Round 1c (DONE in repo): HUD polish: portrait layout for tall phones, touch targets 48 px or more, fixed button positions, auto touch detection check, remove double camera binding, check JobEffects popup position, remove old creators of HUD pieces if JS makes them. Acceptance: no overlap or clipped text at 800x450, 1280x720, 1920x900, 844x390 and 440x956.
- Round 2 (DONE): level engine + levels 1-5. New Levels.js (LEVELS, LevelEngine), Jobs.js imports LEVELS, main.js wired, World.js patch/cones grouped.
- Round 3 (DONE): levels 6-10 (Contractor chapter: trench, move, night haul, bridge fill, night rush).
- Round 4 (DONE): levels 11-15 (Site Boss chapter: storm clear, foundation dig, crane support, skill course, mega project mix).
- Round 5 (NEXT): garage (6 upgrades x 4 levels), contracts board, result window, fail window, picker in the new steel look (settings, profile, main menu if time).
- Round 6: phone controls polish (core/Input.js with event.code, pointer events, multi-touch; resume audio on touchend).
- Round 7: CrazyGames SDK and ads. The user pastes SDK pages (/sdk/game, /sdk/data) ONE at a time. Write core/Portal.js: init in try/catch, gameplayStart/gameplayStop, happytime on job complete, SDK data save with localStorage fallback, ads wrapper hiding buttons when no ad ready. Ad spots: result double coins, garage half price, time-is-up plus 60 s (showFail has onAd hook, jm.addTime exists), daily bonus x2 (claimDaily(mult) exists), one midgame ad on tapping Next job. Pause and silence during ads. Ads are always optional.
- Round 8: quality tiers, performance and size (limit 50 MB and 1500 files, now about 5 MB), engine sound polish, skill course, delete old files.
- Round 9 (M9): submission pack. User pastes /requirements/game-covers and /resources/getting-to-the-first-frame. Covers, favicon, loading screen, final QA, final docs.
- Progress estimate: overall about 80 percent. Driving/physics/camera 90, 3D look 76, audio 80, HUD 92, jobs/levels/economy 92 (15 levels built), shop 75, phone controls 40, SDK/ads 5, polish/submission 5.

## Locked design (do not ask the user again, no more picture prompts)
- 15 levels in 3 chapters: Rookie Yard (L1 First Scoop HAUL, L2 Cone School CONE, L3 Fill the Pothole FILL, L4 Park Clean-up HAUL, L5 Rush Hour Lite RUSH boss), Contractor (L6 Dig the Trench TRENCH, L7 Pipe Layer MOVE, L8 Night Shift HAUL, L9 Bridge Repair FILL, L10 Night Rush RUSH boss), Site Boss (L11 Storm Clean-up CLEAR, L12 Foundation Dig TRENCH, L13 Crane Support MOVE, L14 Skill Course CONE, L15 Mega Project MIX final boss).
- Each job: 3 stars by time left (over 50 percent = 3, over 20 percent = 2, else 1), 1 optional bonus goal, result window. Repeat rewards 40 percent.
- Economy: coins, stars, bonus goals, tips, combo (up to x3), XP ranks (Rookie, Operator, Foreman, Site Boss, Master Builder, Legend, each +3 percent coins), clients with reputation, daily contracts (key J), garage (key U) with Engine, Hydraulics, Bucket, Tyres, Work Light, Beacon at 4 levels (100/250/500/900), paint colours if time. Reconcile: code has only 3 upgrades now.
- Pipes and crates (L7, L13) snap into the bucket, no real physics.
- Look: steel panels gradient #34445f to #151d2b, 2px edge #0a0f18, hard shadow; amber main button #fde68a to #f59e0b; green #34d399 to #059669; red #f87171 to #b91c1c; wells #0b111a; titles weight 900 uppercase; icons 2.5px stroke. Colours: machine #f5b700, soil #8b5a2b, truck #2f6fdb, asphalt #3a3f47, grass #5fa84a, concrete #aab0b8, cone #ff6a1a, goal amber #fbbf24, success #34d399, danger #ef4444, cyan #22d3ee, default fog #dfe9f3.
- Camera: third person, 12 m behind and 6 m above, 28 degrees down, FOV 55.
- Per-level skies and fog (full table is in CONTINUE.md and HANDOFF.md): L1 morning, L6 dusk, L8 and L10 night, L11 storm, L12 dawn, L15 golden hour.

## User rules (short) - DIRECT REPO MODE wins over all older paste-box rules
- User is non-technical, poor English with typos. Answer in SIMPLE, SHORT English. Summary first, short numbered look list, ask ONE thing at a time.
- The agent edits the repo itself. NEVER ask the user to paste files, copy code, or run commands, except the ONE pull command at the end of each round: cd "$(git rev-parse --show-toplevel)" && git pull origin clean-v1
- Obsolete and REVERSED: Executor paste-box, ONE 4-backtick code box, FILE/EDIT markers, ask-for-ONE-file, Preview/Apply/Check/Save, Undo last apply. Do not follow them.
- Each round ends with: SUMMARY (3-5 lines), the exact ONE pull command, tell the user to reload with Ctrl+Shift+R, URL ?unlockall&rich (add &touch for touch test), a short numbered look list, then REPORT (DONE, VERIFIED, NOT VERIFIED, RISKS, NEXT) plus percent complete and what remains. Ask only the play-test result.
- Ask only things the agent cannot do: the user's play-test result, or SDK doc page text ONE page at a time in Round 7. Never ask design choices (design is LOCKED).
- One step = read real code first, small edits, node --check on changed JS (copy to .mjs), npx vite build, headless screenshots when useful, commit with clear message, push normally. Keep STATE.md, FILE_MAP.md and the CONTINUE.md session log updated in the SAME commit.
- Brave on Windows, 1910x900, 144 Hz. No phone: test with F12 device mode (Ctrl+Shift+M). Codespace repo testsharm/gameprotype.
- Premium (not AI-generic) look, CrazyGames submission soon, 10 earlier rejections. All content copyright free, code-made. Never show JCB or any AI name. Game name stays TerraForm 3D. Ads optional rewarded only.
- Never claim "fixed" / "done" without build output, screenshot or numbers. Say "built, awaiting your test" for visual/feel acceptance.

## Quick QA checklist
Apply and Check OK. No red F12 errors except known (favicon 404, Brave extension lines, CrazySDK not initialized outside the portal). fps about 60 or more at 144 Hz with physics 60.0 steps/s (backquote key shows debug). No flicker in any camera mode. Machine stops at trees, poles, cars, buildings. Scoop and dump 3 s each. Restart, pause, mute work. Audio starts after first input, one context. Layout has no overlap at the listed sizes. CAB view shows no pipe. BUCKET view not blocked.

## NEW CHAT START (direct repo mode)
The agent has the repository. Read src/docs/CONTINUE.md, then STATE.md, then FILE_MAP.md, then HANDOFF.md. Then continue from the last session-log entry in CONTINUE.md. No files are pasted by the user.

## Working mode (2026-11-05, read this first in future chats)
- The agent has the whole repository. It reads files itself; it does NOT ask the user to paste files or run commands (except the one pull command at the end of a round).
- One round = small edits + node --check on changed JS (copy to .mjs because package.json is CommonJS) + npx vite build + docs update + commit + push.
- The user plays on the live game and reports with a screenshot or one short sentence. Never claim "fixed" without that evidence.
- Push goes to the Arena session branch origin/arena/e2054f9b-gameprotype AND, with a normal fast-forward push, to origin/clean-v1 (the branch the user pulls). Never force-push. Never touch main. If the clean-v1 push is refused, say so and keep the work on the session branch.
