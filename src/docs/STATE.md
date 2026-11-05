# STATE - TerraForm 3D (live status)

Updated 2026-11-05 (end of a very long chat; a new chat must continue from here).
Read order for a new AI: CONTINUE.md, then this file, then FILE_MAP.md, then HANDOFF.md.

## Status in one look
- clean-v1 tip 2868983 (2026-11-05 08:15) already contains M7a part 2 (Jobs.js 895, main.js 1134) and HUD v5 (GameUI.js 375). All milestones M0-M4f are in the repo.
- WORKING MODE CHANGED (2026-11-05): an Arena agent edits this repository directly (read, edit, node --check, npx vite build, commit, push). The chat paste-box / Executor / "ask for ONE file" rules no longer apply. Commits are pushed to the session branch origin/arena/e2054f9b-gameprotype; the Codespace pulls that branch.
- Round 1b DONE (built + screenshots): ROOT index.html is now the new HUD page; stray src/index.html deleted; old HUD creators removed from main.js, CameraManager.js, JobEffects.js and Guidance.js.
- Round 1c DONE (built + screenshots): portrait (440x956) and short landscape (844x390) CSS layouts, reliable touch detection (coarse pointer / maxTouchPoints / ?touch / first real finger), all touch targets >= 48 px, pause buttons >= 48 px and 16 px text, hint + toast lanes moved clear of the controls.
- Evidence: `npx vite build` OK (dist/index.html 5.63 kB, main 884 kB, rapier 4.34 MB). A headless Chromium (npm @sparticuz/chromium + playwright-core) loaded the built game and took screenshots at 1910x900, 1280x720, 800x450, 844x390, 440x956 (files in qa/, git-ignored). Measured DOM boxes at all 5 sizes: 0 overlaps, 0 clipped zones, 0 old HUD ids, 0 touch targets under 48 px on the two touch sizes. Only console error is the blocked CrazyGames SDK script (expected outside the portal).
- The screenshots show ONE clean HUD: timer + minimap top-left, mission card, coin pill + menu top-right, key hints or F/camera buttons bottom-left, dial + BRK + joystick bottom-right, mission card full width on tall phones.

## Known problems right now
1. (Round 1b, BUILT, awaiting visual test) Old HUD pieces should be gone: root index.html replaced, stray src/index.html deleted, JS creators disabled. If any old piece still shows, ask the user for one screenshot and inspect F12 Elements.
2. (Round 1c, BUILT, awaiting user test) Portrait layout and touch detection were rebuilt; headless-Chromium measurements show no overlap, no clipping and 48 px+ targets. Confirm on the real Brave F12 device mode.
3. (Round 1c, BUILT, awaiting user test) Touch buttons now stay in fixed corners at both phone sizes; confirm with `&touch` in the URL.
4. Game feels generic: every job is the same scoop and dump loop. Solved by the 15-level engine (rounds 2-4).
5. Job windows (picker, result, fail, shop) still use the old look and z-index 500 above the HUD.
6. Not verified: menu drawer, pause overlay, touch controls, site finder on free ground, prop collider format guess, sky colours at night, fixed Rapier box at moved truck, old Job 1 dirt patch and cones stay visible in other jobs, fog lock vs updateEnv, 36 vs 42 top speed, audio items (duck, silence when hidden, reverse beeper, dig sounds), dust trail look.

## Plan (about 12 rounds, one round = one paste plus one test)
- Round 1b (DONE in repo): root index.html fixed, JS HUD creators disabled, build + DOM check OK. User must still confirm on screen.
- Round 1c (DONE in repo): HUD polish: portrait layout for tall phones, touch targets 48 px or more, fixed button positions, auto touch detection check, remove double camera binding, check JobEffects popup position, remove old creators of HUD pieces if JS makes them. Acceptance: no overlap or clipped text at 800x450, 1280x720, 1920x900, 844x390 and 440x956.
- Round 2 (NEXT): level engine plus levels 1-5 (rewrite or extend Jobs.js: JOBS from 6 to 15, job types HAUL, CONE, FILL, TRENCH, RUSH, CLEAR, MOVE, MIX, level dressing, per-level sky and fog). Ask for World.js createJobSite and propColliders format first.
- Round 3: levels 6-10. Round 4: levels 11-15.
- Round 5: garage (6 upgrades x 4 levels), contracts board, result window, fail window, picker in the new steel look (settings, profile, main menu if time).
- Round 6: phone controls polish (core/Input.js with event.code, pointer events, multi-touch; resume audio on touchend).
- Round 7: CrazyGames SDK and ads. The user pastes SDK pages (/sdk/game, /sdk/data) ONE at a time. Write core/Portal.js: init in try/catch, gameplayStart/gameplayStop, happytime on job complete, SDK data save with localStorage fallback, ads wrapper hiding buttons when no ad ready. Ad spots: result double coins, garage half price, time-is-up plus 60 s (showFail has onAd hook, jm.addTime exists), daily bonus x2 (claimDaily(mult) exists), one midgame ad on tapping Next job. Pause and silence during ads. Ads are always optional.
- Round 8: quality tiers, performance and size (limit 50 MB and 1500 files, now about 5 MB), engine sound polish, skill course, delete old files.
- Round 9 (M9): submission pack. User pastes /requirements/game-covers and /resources/getting-to-the-first-frame. Covers, favicon, loading screen, final QA, final docs.
- Progress estimate: overall about 68 percent. Driving/physics/camera 90, 3D look 72, audio 80, HUD 85 (needs the fix), jobs/levels/economy 70 (needs rebuild), shop 75, phone controls 40, SDK/ads 5, polish/submission 5.

## Locked design (do not ask the user again, no more picture prompts)
- 15 levels in 3 chapters: Rookie Yard (L1 First Scoop HAUL, L2 Cone School CONE, L3 Fill the Pothole FILL, L4 Park Clean-up HAUL, L5 Rush Hour Lite RUSH boss), Contractor (L6 Dig the Trench TRENCH, L7 Pipe Layer MOVE, L8 Night Shift HAUL, L9 Bridge Repair FILL, L10 Night Rush RUSH boss), Site Boss (L11 Storm Clean-up CLEAR, L12 Foundation Dig TRENCH, L13 Crane Support MOVE, L14 Skill Course CONE, L15 Mega Project MIX final boss).
- Each job: 3 stars by time left (over 50 percent = 3, over 20 percent = 2, else 1), 1 optional bonus goal, result window. Repeat rewards 40 percent.
- Economy: coins, stars, bonus goals, tips, combo (up to x3), XP ranks (Rookie, Operator, Foreman, Site Boss, Master Builder, Legend, each +3 percent coins), clients with reputation, daily contracts (key J), garage (key U) with Engine, Hydraulics, Bucket, Tyres, Work Light, Beacon at 4 levels (100/250/500/900), paint colours if time. Reconcile: code has only 3 upgrades now.
- Pipes and crates (L7, L13) snap into the bucket, no real physics.
- Look: steel panels gradient #34445f to #151d2b, 2px edge #0a0f18, hard shadow; amber main button #fde68a to #f59e0b; green #34d399 to #059669; red #f87171 to #b91c1c; wells #0b111a; titles weight 900 uppercase; icons 2.5px stroke. Colours: machine #f5b700, soil #8b5a2b, truck #2f6fdb, asphalt #3a3f47, grass #5fa84a, concrete #aab0b8, cone #ff6a1a, goal amber #fbbf24, success #34d399, danger #ef4444, cyan #22d3ee, default fog #dfe9f3.
- Camera: third person, 12 m behind and 6 m above, 28 degrees down, FOV 55.
- Per-level skies and fog (full table is in CONTINUE.md and HANDOFF.md): L1 morning, L6 dusk, L8 and L10 night, L11 storm, L12 dawn, L15 golden hour.

## User rules (short)
- User is non-technical, poor English with typos. Answer in simple short English. Summary first, numbered click steps, ask for ONE thing.
- ONE code box per reply, 4-backtick fence. Markers at line start: full file = FILE path ... END; change = EDIT path, --- FIND ---, --- REPLACE ---, END. FIND must appear exactly once. Use full FILE for index.html and GameUI.js. Never refer to code "above".
- Code must be in the same reply when code is expected. Do not shrink files. Say clearly if a shrink warning is expected.
- After every change, a REPORT (DONE, VERIFIED, NOT VERIFIED, RISKS, NEXT). Update STATE.md and add an entry to CONTINUE.md in the same box. Never claim fixed without evidence.
- Ask for files ONE at a time via Files tab, Copy selected. Never ask the user to run terminal commands except the final delete command.
- Brave on Windows, 1910x900, 144 Hz. No phone: test with F12 device mode (Ctrl+Shift+M). Codespace repo testsharm/gameprotype.
- The user wants fast, deep progress and a premium (not AI-generic) look, and wants CrazyGames submission soon. 10 earlier rejections. All content copyright free, code-made. Do not show JCB or any AI name. Game name stays TerraForm 3D.
- Old rule: after a strange result, Undo first, investigate second.

## Quick QA checklist
Apply and Check OK. No red F12 errors except known (favicon 404, Brave extension lines, CrazySDK not initialized outside the portal). fps about 60 or more at 144 Hz with physics 60.0 steps/s (backquote key shows debug). No flicker in any camera mode. Machine stops at trees, poles, cars, buildings. Scoop and dump 3 s each. Restart, pause, mute work. Audio starts after first input, one context. Layout has no overlap at the listed sizes. CAB view shows no pipe. BUCKET view not blocked.

## NEW CHAT START (what the user pastes)
Message 1: the starter text plus CONTINUE.md. Message 2: STATE.md. Message 3: FILE_MAP.md. Message 4 (optional): HANDOFF.md. Then say: continue.
Starter text: "Hello. I am a non-technical user. My English is poor. You are the lead engineer of my browser game TerraForm 3D. I pasted CONTINUE.md. Read it fully and follow it exactly (ONE code box per answer, EDIT/FILE blocks, simple English, ask for ONE file at a time). Start with the short first reply described in section 0."
The new AI first reply must be short: say it read the files, the state in 3 lines, ask for ONE file (src/index.html), no code before that.

## Working mode (2026-11-05, read this first in future chats)
- The agent has the whole repository. It reads files itself; it does NOT ask the user to paste files or run commands (except the one pull command at the end of a round).
- One round = small edits + node --check on changed JS (copy to .mjs because package.json is CommonJS) + npx vite build + docs update + commit + push.
- The user plays on the live game and reports with a screenshot or one short sentence. Never claim "fixed" without that evidence.
- Push goes to origin/arena/e2054f9b-gameprotype (Arena session rule); the user pulls that branch in the Codespace. main and clean-v1 are never force-pushed.
