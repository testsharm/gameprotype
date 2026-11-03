# STATE (live status) - TerraForm 3D

Updated after M3d was delivered.

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
- M3b-2, M3b-2b, M3c, M3b-2c: applied, Check OK, SAVED to GitHub (6109b67).
  - CAB view is free of the black pipe (user screenshot). Far buildings have windows.
- M3d solid props and traffic fix: DELIVERED, applied? awaiting your test.
  - Trees, poles, traffic light poles, benches, bins, hydrants and parked cars get solid boxes (World.propColliders, one fixed body).
  - Traffic car collider moved up (centre y 1.0) so the machine does not ride on it (TrafficPhysics.js is in src/core).
  - Traffic speed lowered from 72-126 km/h to about 25-47 km/h.
  - Smoke made a little stronger (it was too faint to see).

## NEXT
- Test M3d. If the machine still bounces off cars, check whether main.js calls trafficPhysics.update() every physics step.
- Then M3b-3 dig tweaks only if the user asks.
- Then M4 HUD and mobile layout.

## Open issues
- Vanishing machine: not confirmed. It was probably fast traffic cars driving away.
- Driver seat looks plain through the cab glass (later polish).
- Engine sound too loud and tractor-like (M8).
- Top speed is 40, spec says 32 (M7).
- M4 layout: stray "Clear" and "truck." beside the mission card, two coin counters, speed dial over key hints, camera buttons hard to read, not mobile friendly.
- Google Fonts import in index.html (M4).
- M2 acceptance not reported: duck 0.50 on dump, silence when tab hidden, reverse beeper, dig sounds.
- Old unused files: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js. One delete command at the very end.
- Check at the end: internal names jcb / jcbGroup in Vehicle.js (player must never see JCB).
- vite.config.js ESM warning, chunk size warning (low priority).

## Save status
- Saved: everything up to M3b-2c (6109b67).
- M3d: NOT saved yet.

## Open decisions for the user
- Keep the game name?
- Keep or drop the daily bonus and paint colors?
