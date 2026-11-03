# STATE (live status) - TerraForm 3D

Updated after M3b-2c was delivered.

## Environment
- Branch clean-v1, repo testsharm/gameprotype, Codespace.
- Ports: 3002 Executor, 5173 game, 4173 preview.
- User: non-technical, Brave on Windows, QWERTY, 144 fps screen.
- One code box per reply. One file request at a time.

## Milestones
- M0 done.
- M1 done and saved (ba986e2): fixed physics step, keys by event.code, debug overlay (backquote key).
- M2 audio done (AudioHub, v2 accepted with notes).
- M3a city done and passed (World.js).
- M3b-1 machine model done and saved (Vehicle.js).
- M3b-2 camera applied, black bar gone.
- M3b-2b applied, Check OK. Smoke came from the hood pipe but looked like a dark smudge.
- M3c far skyline: applied, Check OK. User confirms the far buildings have windows and there is more traffic.
- M3b-2c: DELIVERED, applied? awaiting your test.
  - Smoke: small, light grey, faint, darker only on throttle, fewer puffs.
  - Wheel dust: smaller and fainter.
  - Exhaust pipe hidden in CAB view (cabHide).

## NEXT
- M3d solid props: trees, poles, benches, bins, hydrants get physics colliders (World.js, already known).
- M3d-2 small traffic cars act like a balloon when hit. Needs TrafficPhysics.js (Files tab, one file).
- Then M3b-3 dig tweaks only if the user asks.
- Then M4 HUD and mobile layout.

## Open issues
- Player can drive through trees, poles and other props (no colliders yet).
- Small cars bounce the machine like a balloon (traffic physics not seen yet).
- Vanishing machine: not confirmed. Suspect keepCameraClear in main.js near walls, or just rare traffic cars.
- Engine sound too loud and tractor-like (M8).
- Top speed is 40, spec says 32 (M7).
- M4 layout: duplicate HUD text (stray "Clear" and "truck." beside mission card), two coin counters, speed dial over key hints, camera buttons hard to read, not mobile friendly.
- Google Fonts import in index.html (M4).
- Driver seat looks plain through the cab glass (later polish).
- M2 acceptance not reported: duck 0.50 on dump, silence when tab hidden, reverse beeper, dig sounds.
- Old unused files: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js. One delete command at the very end.
- Check at the end: internal names jcb / jcbGroup in Vehicle.js (player must never see JCB).
- vite.config.js ESM warning, chunk size warning (low priority).

## Save status
- M3b-1 saved on GitHub.
- M3b-2, M3b-2b, M3c, M3b-2c: NOT saved yet. Click Save to GitHub after they pass.

## Open decisions for the user
- Keep the game name?
- Keep or drop the daily bonus and paint colors?
