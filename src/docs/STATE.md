# TerraForm 3D - STATE (live status)

Last update: M3b-2 cab fix 2 and smoke delivered. Branch clean-v1, repo testsharm/gameprotype.

## Milestones
- M0 baseline: DONE
- M1 stability pack: DONE, saved (ba986e2)
- M2 audio hub (Audio.js v2, 971 lines): ACCEPTED with notes. Engine too loud and tractor-like (parked to M8)
- M3a city, roads, sky, anti-flicker, camera clear, garage opened: PASSED (World.js 1328 lines)
- M3b-1 machine model v2 (Vehicle.js, 538 lines): APPLIED, saved by user
- M3b-2 camera polish (CameraManager.js, 237 lines): APPLIED. User screenshot 7:52 PM: black bar at top of CAB view is gone. Console only favicon 404
- M3b-2b cab fix 2 and smoke (CameraManager.js + Vehicle.js edits): APPLIED? awaiting your test
- M3b-3 dig animation tweaks: only if the user asks (DigAnimator already eased 3 s)
- M3c far skyline (flat grey boxes, no windows, in World.js): NEXT after M3b-2b passes. Needs World.js sent alone via Files tab
- M4 HUD and screens, slim index.html, mobile layout: TODO
- M5 input and mobile touch controls: TODO
- M6 Portal minimal (read /sdk/game and /sdk/data first): TODO
- M7 jobs, economy, shop, daily bonus, tutorial, top speed 32: TODO
- M8 skill course, quality tiers, performance, engine sound polish: TODO
- M9 submission pack: TODO

## M3b-2b changes
- Exhaust stack moved to the front-right of the hood (x 0.9, z 1.15), taller (top about y 3.45), smoke tip at y 3.55
- Smoke and wheel dust are now soft round sprite puffs (canvas gradient texture, no image files); dirt burst still uses cubes
- Smoke also at idle; spawn counted by time, not per frame
- Roof, roof gear, roof lights and glass carry userData.cabHide; CameraManager hides exactly those in CAB view and restores them in other views
- CAB near plane 0.3 (was 0.15)

## Open issues
- Far skyline looks flat and pale (World.js, M3c)
- Machine may vanish when the camera is pushed in near a wall: main.js keepCameraClear can bring the camera within 12% of the distance. Waiting for the user to say if it happens
- Engine sound too loud (M8)
- Top speed 40, spec 32 (M7)
- Two coin counters, stray mission text, speed dial over key hints, layout not mobile friendly (M4)
- Google Fonts import in index.html (M4)
- Reverse beeper, duck 0.50 during dump, silence when tab hidden: not yet reported by user
- User says the word jcb was removed from the game; internal names in Vehicle.js may still exist (check at the end)

## Console
- Only known red line now: favicon.ico 404 (M9). The Brave extension line may appear sometimes

## Save status
- M3b-1 saved to GitHub by user
- M3a and M2 v2: user says all saved
- M3b-2 and M3b-2b: not saved yet

## Cleanup at the very end (one terminal command)
- Unused old files: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js, WorldPolish.js
