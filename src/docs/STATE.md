# STATE (live status). Updated after the top speed fix and CONTINUE.md were delivered.
Full deep handoff: src/docs/CONTINUE.md (read it first). Master spec: src/docs/HANDOFF.md.

## Project
TerraForm 3D: browser backhoe-loader simulator for CrazyGames.
Stack: Three.js, Rapier (rapier3d-compat), Vite, plain JS modules.
Branch clean-v1, repo testsharm/gameprotype.

## Done and saved to GitHub
- M0, M1 (ba986e2), M2 audio hub, M3a city, M3b-1 machine, M3b-2 camera, M3b-2b, M3b-2c, M3c skyline (6109b67).
- M3d (f3f7173): solid props, traffic collider and speed fix. User confirmed.
- M3e (bac5f1c): 5 new building styles, bluer sky, own fog (FogExp2 0.0011, locked in World.js),
  stronger smoke and dust. User screenshots confirm varied buildings, far view, dust trail.

## Applied? awaiting test
- Vehicle.js: top speed 32 km/h (+5 per engine level), reverse 14 km/h.
- New file src/docs/CONTINUE.md (deep handoff for a new chat).
Acceptance: the dial stops near 32 on a straight road. Apply and Check OK.

## Next
- Test the speed. Then ask the user: M3f (car variety, garage detail) or M4 (HUD and mobile layout).
- The user is moving to a new chat: paste CONTINUE.md first, then HANDOFF.md.

## Open issues
- Traffic cars all look alike. Plain driver seat. Plain garage and yard.
- Engine sound too loud (M8).
- M4 layout: duplicate HUD, two coin counters, stray text, speed dial over key hints, camera buttons, Google Fonts,
  fog override in main.js (ignored now), duplicate camera-button binding.
- M2 acceptance not reported: duck 0.50 in dump, silence when tab hidden, reverse beeper (probably never fires).
- main.js passes empty arrays to cameraManager.setCollidables (keepCameraClear is the workaround).
- Old unused files to delete at the end: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js.
- Internal names mode = 'jcb' and jcbGroup in Vehicle.js (not shown to players). Clean at the end.
- vite.config.js ESM warning, chunk size warning (low priority).
