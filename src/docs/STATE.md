# STATE (live status)

Updated: 2026-11-03 (M3a passed. M3b step 1 applied, awaiting test)
Branch: clean-v1. Repo: testsharm/gameprotype (Codespace).
Ports: 3002 Executor, 5173 live game, 4173 preview.

## Milestones
| ID | Name | Status |
|----|------|--------|
| M0 | Baseline restored | DONE, saved (4495a5e) |
| M1 | Stability pack | DONE, saved (ba986e2) |
| M2 | Audio hub | ACCEPTED WITH NOTES. Engine too loud and tractor-like (parked to M8). |
| M3a | City, roads, sky, anti-flicker, camera clear, garage opened | PASSED (syntax OK, 24 files OK, 144 fps, no road flicker, pile refills after R). Save to GitHub requested. |
| M3b-1 | Machine model v2 (Vehicle.js only) | APPLIED? awaiting your test |
| M3b-2 | Camera polish (CameraManager.js uses building boxes, remove duplicate cam-btn binding) | NEXT. Needs CameraManager.js |
| M3b-3 | Dig animation tweaks | DigAnimator.js already eased 3 s, only touch if user asks |
| M4 | HUD and screens, slim index.html, mobile layout | NOT STARTED |
| M5 | Input and mobile touch controls | NOT STARTED |
| M6 | Portal minimal | NOT STARTED |
| M7 | Jobs, economy, shop, daily bonus, tutorial | NOT STARTED |
| M8 | Skill course, quality tiers, performance and size, engine sound polish | NOT STARTED |
| M9 | Submission pack | NOT STARTED |

## M3b-1: what changed
- Vehicle.js fully replaced. Physics, controller, dig helpers, particles and updateVisuals are copied unchanged.
- Only createMesh is new. New import: RoundedBoxGeometry from three/examples/jsm (part of three, no new package).
- Same public names kept: mesh, chassisBody, boomPivot (0,1.0,2.0), bucketPivot (0,-0.2,2.8), bucketDirtGroup, wheelMeshes {group, baseY}, exhaustTip, beaconMesh.
- Model: rounded body and hood, cab with 4 pillars + transparent glass + seat + steering wheel, roof lights and vent, beacon, exhaust, mirrors, steps, tool boxes, fenders, mudguards, counterweight with hazard band, tail lights, stabiliser legs, thick boom with pins and hydraulic cylinders, bigger bucket with thick walls, edge and 6 teeth, wheels with tread blocks, rims and hubs.
- No transmission glass (cheaper). All materials are MeshStandardMaterial.

## M3b-1 acceptance (user reports)
1. Syntax passed and Check project OK (RoundedBoxGeometry import resolves).
2. No new red errors in the F12 console.
3. Machine looks deeper and rounder from behind (Bucket) and from the front (Orbit). No flicker on the body.
4. Driving feels the same as before.
5. Scoop and dump still work, dirt shows in the bucket.
6. CAB camera view is not blocked by the new cab.
7. fps still about 60 or more.

## Known issues (later milestones)
- Engine too loud, tractor-like: M8.
- Google Fonts import in index.html (M4).
- Top speed 40 km/h, spec says 32 (M7).
- Mission card text clipped, stray "Clear" and "truck." text outside the card (duplicate HUD), speed dial overlaps WASD keys (M4).
- Camera buttons bound twice: CameraManager.js and main.js (M4).
- Two coin counters (HUD and JobEffects) (M4).
- Not mobile friendly (M4 and M5). Test later in F12 device mode (Ctrl+Shift+M).
- main.js still holds old HUD code and unconnected systems (M4 to M8).
- Red console lines: favicon 404 (M9), extension message (probably Brave).
- Old audio files unused on disk: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js. One delete command at the end.
- WorldPolish.js is not imported anywhere (unused). Remove later.

## Next
1. User applies M3b-1, tests, reports the points above with 2 screenshots (behind and front).
2. User clicks Save to GitHub.
3. User sends CameraManager.js (one file). Then M3b-2.
