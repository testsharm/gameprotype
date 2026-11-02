# STATE (live file) - rewritten completely after every change

Updated: 2026-11-02. Read HANDOFF.md first (rules, final game definition, plan, recovery). Milestones are M0 to M9.

## Where we are
- M0 DONE, saved. Baseline commit 4495a5e restored, branch clean-v1, GitHub commit 9ff092f. Broken evening state kept on branch snapshot-1102-0420 (local).
- Build verified earlier: dist 4.95 MB in 3 files (limits 50 MB, 20 MB mobile, 1500 files OK).
- M1 APPLIED, AWAITING USER TEST (2026-11-02). Changes: fixed 60 Hz accumulator in main.js animate(), __testTimestep(), Backquote debug overlay (dev or ?debug), machine position/rotation interpolation (Vehicle.capturePhysicsState, resetInterpolation, renderAlpha), keys by event.code (normKey wrapper), events renamed bh-dig and bh-hint, user-select on body, index.html key highlight by code. Extras: blur resets keys, Ctrl/Alt/Meta ignored, Space/arrows preventDefault while running, hydraulic lerp made frame-rate independent.

## Status board
| ID | Milestone | Status |
|---|---|---|
| M0 | Revert to baseline | DONE, saved |
| M1 | Stability pack | APPLIED, awaiting test |
| M2 | One audio hub, delete 5 old sound files | NEXT after M1 passes |
| M3 | World and machine visuals v2, anti-flicker, dig animation | TODO |
| M4 | HUD and screens, remove duplicate HUD, remove Google Fonts import | TODO |
| M5 | Input and mobile controls | TODO |
| M6 | Portal minimal | TODO |
| M7 | Jobs, economy, shop, daily bonus, tutorial | TODO |
| M8 | Skill course, quality tiers, performance and size | TODO |
| M9 | Submission pack | TODO |

## M1 acceptance (user reports each)
1. Executor syntax OK, Check project OK. 2. No red console errors. 3. __testTimestep() shows 60.0 on all 7 rows. 4. Backquote overlay shows about 60 steps/s. 5. Same with CPU throttle 4x. 6. WASD, arrows, Space, F, E work; say QWERTY or AZERTY.
After passing: Save to GitHub, then M2.

## Facts confirmed
- Files seen on 2026-11-02: main.js (658 lines before M1), Vehicle.js, index.html. jcb- event names existed only in main.js lines 28, 66 and Vehicle.js lines 112, 120, 123.
- main.js still imports old systems: AudioManager, SoundFX, Sfx2, DigSound, Music, GameUI, JobManager, JobEffects, Guidance (M2 and later replace them).
- Known not yet fixed: Google Fonts @import and SDK script in index.html, logarithmicDepthBuffer true, camera near 1, top speed 40 km/h (spec says 32), smoothedSpeed smoothing is per-frame (cosmetic).
- Ports: 3002 Executor, 5173 live game, 4173 preview.

## Open decisions for the user
- Keep the game name? Daily bonus and paint colors keep or drop?

## Last log entries
- 2026-11-02: M1 delivered as EDIT blocks, awaiting test.
- 2026-11-02: Build OK 4.95 MB in 3 files. Save to GitHub OK (commit 9ff092f).
- 2026-11-02: Revert to baseline done.
