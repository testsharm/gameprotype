# STATE (live status)

Updated: 2026-11-02 (M3a applied, awaiting test)
Branch: clean-v1. Repo: testsharm/gameprotype (Codespace).
Ports: 3002 Executor, 5173 live game, 4173 preview.

## Milestones
| ID | Name | Status |
|----|------|--------|
| M0 | Baseline restored | DONE, saved (4495a5e) |
| M1 | Stability pack | DONE, saved (ba986e2) |
| M2 | Audio hub | ACCEPTED WITH NOTES, saved. Engine too loud and tractor-like (parked to M8). |
| M3a | City, roads, sky, anti-flicker, camera clear, garage opened | APPLIED? awaiting your test |
| M3b | Machine model v2, eased dig animation, camera polish | NEXT. Needs CameraManager.js and DigAnimator.js |
| M4 | HUD and screens, slim index.html, mobile layout | NOT STARTED |
| M5 | Input and mobile touch controls | NOT STARTED |
| M6 | Portal minimal | NOT STARTED |
| M7 | Jobs, economy, shop, daily bonus, tutorial | NOT STARTED |
| M8 | Skill course, quality tiers, performance and size, engine sound polish | NOT STARTED |
| M9 | Submission pack | NOT STARTED |

## M3a: what changed
- World.js fully replaced. Same public fields and methods (buildingData, trafficCars, truckGroup, dirtPileGroup, allDirtClods, truckDirtLevel, truckDirtMeshes, sunLight, hemiLight, shrinkDirtPile, resetDirtPile, addDirtToTruck, createPhysicsColliders). New field: sky.
- Roads: 2 merged meshes (straight tiles and junction tiles). All lines are painted into canvas textures. polygonOffset on ground and roads. Layers 0.02 apart.
- Buildings: merged meshes with window textures (mipmaps, anisotropy 8). Shop fronts. 1 to 3 tiers. Roofs separate. City uses a fixed random seed (same every load).
- Garage hub: walls 5 m, no roof, sign gantry. Floor is a flat textured plane.
- Dirt pile refills after restart (old bug: allDirtClods was emptied by pop).
- main.js: camera near 0.5, far 1400. logarithmicDepthBuffer false. Hemi light 0.8, ground colour lighter. Fog density 0.0020. keepCameraClear(): camera is pulled in front of any building box between it and the machine. Sky dome follows the camera.

## M3a acceptance (user reports)
1. Syntax passed and Check project OK.
2. No new red errors in the F12 console.
3. Roads show no flicker or shimmer while driving and turning.
4. Camera never sits inside or behind a wall (Bucket and Orbit).
5. Pile refills after R (restart).
6. fps in the overlay is still good (about 60 or more).
7. Look: city is lighter, windows look right, parks and trees visible.

## Known issues (later milestones)
- Machine model details thinner than 0.3 (stripes, rails, hoses), dig animation not eased: M3b.
- Engine too loud, tractor-like: M8.
- Google Fonts import in index.html (M4).
- Top speed 40 km/h, spec says 32 (M7).
- Mission card text clipped, stray "Clear" and "truck." text outside the card (duplicate HUD), speed dial overlaps WASD keys (M4).
- Camera buttons bound twice: CameraManager.js and main.js (M4).
- JobEffects has its own coin counter next to the HUD one (M4).
- Not mobile friendly (M4 and M5). Test later in F12 device mode (Ctrl+Shift+M).
- main.js still holds old HUD code and unconnected systems (M4 to M8).
- Red console lines: favicon 404 (M9), extension message (probably Brave).
- Old audio files unused on disk: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js. One delete command at the end.
- WorldPolish.js is not imported anywhere (unused). Remove later.

## Next
1. User applies M3a, tests, reports the 7 points above, sends a full-window screenshot.
2. User sends CameraManager.js and DigAnimator.js (Files tab, Copy selected).
3. M3b.
