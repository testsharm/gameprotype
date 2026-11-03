# TerraForm 3D - STATE (live status)

Last update: M3b-2 delivered (camera polish). Branch clean-v1, repo testsharm/gameprotype.

## Milestones
- M0 baseline: DONE
- M1 stability pack: DONE, saved (ba986e2)
- M2 audio hub (Audio.js v2, 971 lines): ACCEPTED with notes. Engine too loud and tractor-like (parked to M8)
- M3a city, roads, sky, anti-flicker, camera clear, garage opened: PASSED (World.js 1328 lines)
- M3b-1 machine model v2 (Vehicle.js, 538 lines): APPLIED and saved by user. User reports in CAB view: black bar at the top, flicker, smoke origin looks different inside and outside
- M3b-2 camera polish (CameraManager.js): APPLIED? awaiting your test
- M3b-3 dig animation tweaks: only if the user asks (DigAnimator already eased 3 s)
- M4 HUD and screens, slim index.html, mobile layout: TODO
- M5 input and mobile touch controls: TODO
- M6 Portal minimal (read /sdk/game and /sdk/data first): TODO
- M7 jobs, economy, shop, daily bonus, tutorial, top speed 32: TODO
- M8 skill course, quality tiers, performance, engine sound polish: TODO
- M9 submission pack: TODO

## M3b-2 changes
- Cab mode hides the roof, roof lights and glass that surround or sit above the camera (restored when leaving cab)
- Cab mode near plane 0.15, other modes keep the main.js value
- Camera smoothing is time based (same feel at 60 and 144 fps)
- Speed zoom uses km/h (max +12 degrees at 40 km/h)
- Building collision is still done by keepCameraClear in main.js

## Open issues
- Smoke origin looks different in cab and orbit view (code is in Vehicle.js, not seen again yet)
- Engine sound too loud (M8)
- Top speed 40, spec 32 (M7)
- Two coin counters, stray mission text, speed dial over key hints, layout not mobile friendly (M4)
- Google Fonts import in index.html (M4)
- Reverse beeper, duck 0.50 during dump, silence when tab hidden: not yet reported by user

## Console
- Only 2 known red lines: favicon.ico 404 and Could not establish connection (browser extension)

## Save status
- M3b-1 saved to GitHub by user
- M3a and M2 v2 save: user says all saved

## Cleanup at the very end (one terminal command)
- Unused old files: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js
