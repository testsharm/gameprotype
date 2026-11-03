# STATE (live status). Updated after M3e was delivered.

## Project
TerraForm 3D: browser backhoe-loader simulator for CrazyGames.
Stack: Three.js, Rapier (rapier3d-compat), Vite, plain JS modules.
Branch clean-v1, repo testsharm/gameprotype.

## Done and saved to GitHub
- M0, M1 (fixed timestep, keys by event.code), M2 (audio hub), M3a (city), M3b-1 (machine model).
- M3b-2 camera, M3b-2b, M3b-2c (cab view, smoke), M3c (far skyline).
- M3d (commit f3f7173): solid props (trees, poles, benches, bins, hydrants, parked cars),
  traffic collider centred correctly, traffic speed 25 to 47 km/h, stronger smoke.
  User confirmed: props stop the machine, no balloon bounce, cars slower.

## Applied? awaiting test: M3e
- World.js: 5 new facade styles (variant 2 glass, 4 brick, 5 concrete strips, 6 sandstone arches,
  7 fins) with their own colour sets (_pickTint). 8 window meshes in city and in skyline.
- World.js: bluer sky, fewer clouds, own FogExp2 density 0.0011 (colour 0xcfe2f3).
  The fog is locked on scene.fog with defineProperty so main.js cannot override it. Tidy in M4.
- Vehicle.js: exhaust smoke much stronger (rate 7 to 22 per s, bigger, thicker), tyre dust stronger.

## M3e acceptance (user reports)
1. Apply and Check OK, no new red errors in F12.
2. Buildings clearly differ in style and colour.
3. Sky bluer, view farther (about 1 km).
4. More visible smoke at the hood pipe.
5. fps still about 60 or more at 144 Hz.

## Next
- Test M3e. Then: car variety (vans, trucks) if the user asks, M3b-3 only if asked, then M4 (HUD, mobile).

## Open issues
- Traffic cars all look alike (one body shape). Collider is one fixed size.
- Plain driver seat (later polish).
- Engine sound too loud (M8). Top speed 40 vs spec 32 (M7).
- M4 layout: duplicate HUD, two coin counters, speed dial over key hints, camera buttons, Google Fonts.
- M2 acceptance not yet reported: duck 0.50 during dump, silence when tab hidden, reverse beeper.
- main.js passes empty arrays to cameraManager.setCollidables (keepCameraClear is the workaround).
- Old unused files to delete at the end: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js.
- Internal names mode = 'jcb' and jcbGroup in Vehicle.js (not shown to players). Check at the end.
- vite.config.js ESM warning, chunk size warning (low priority).
