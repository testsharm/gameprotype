# STATE - TerraForm 3D (live status)

Updated: 2026-11-02
Branch: clean-v1 (baseline 4495a5e, M1 saved as ba986e2)
Repo: testsharm/gameprotype (Codespace). Ports: 3002 Executor, 5173 game, 4173 preview.

## Milestones
- M0 baseline restored: DONE, saved.
- M1 stability pack: APPLIED and saved (ba986e2). Partly tested (see below).
- M2 audio hub: APPLIED, awaiting your test. New file src/core/Audio.js (AudioHub). main.js edited (19 edits).
- M3 world and machine visuals v2, anti-flicker, eased dig, remove the garage wall or roof blocking the camera.
- M4 HUD and screens, slim index.html, remove duplicate HUD and the Google Fonts import.
- M5 input and mobile.
- M6 portal minimal.
- M7 jobs, economy, shop, daily bonus, tutorial.
- M8 skill course, quality tiers, performance and size.
- M9 submission pack.

## M1 acceptance
1. Syntax check passed on apply: YES. Check project result: NOT REPORTED.
2. Console on 5173: no game-code errors seen. Red: favicon 404 (harmless), CrazySDK not initialized (expected outside portal), "Receiving end does not exist" (probably a browser extension, unproven).
3. __testTimestep shows 60.0 on 7 rows: NOT VERIFIED.
4. Backquote overlay about 60 steps/s: NOT VERIFIED.
5. Steps/s with 4x CPU throttle: NOT VERIFIED.
6. Keys: user has a QWERTY keyboard. W A S D, E, F work as before (user report).

## M2 acceptance (user reports)
1. Syntax check passed and Check project OK.
2. Before any key or click: no sound and no yellow AudioContext warnings in the console.
3. Backquote overlay shows "audio running | contexts 1".
4. Levels balanced (user judgment: engine, music, dig, dump, coin).
5. Dig and dump sounds follow the arm movement (scoop: whine, scrape at 1.3 s, thump at 1.9 s; dump: whine, creak, pour at 1.3 s, thud at 1.9 s).
6. Music gets quieter during the dump (overlay duck about 0.50).
7. M key mutes and unmutes.
8. Silence while the tab is hidden; sound returns after coming back.

## Facts
- Fixed physics step 1/60, max 6 steps per frame, render interpolation in Vehicle.js.
- Events: bh-dig and bh-hint. Keys read by event.code (now includes M).
- Debug overlay: backquote key, or ?debug in the URL. It now also shows audio state.
- AudioHub keeps a no-op compatibility API (init, playEngine, playScoop, playDumpThud, playDirtCrunch, playSuccess) because Vehicle.updateVisuals(audio, dt) still receives it. Vehicle.js not yet checked for what it calls.
- Old files no longer imported by main.js: audio/AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js. To be deleted after M2 passes (single command).
- Mixer levels are the LEVELS constant at the top of src/core/Audio.js.
- Only Job 1 exists until M7.

## Known issues (planned)
- Dark wall blocks Bucket camera (M3).
- Mission card text clipped, speed dial overlaps the key hints (M4).
- Google Fonts import in index.html (M4).
- logarithmicDepthBuffer on and camera near 1 (M3).
- Top speed 40 km/h, spec says 32.
- No favicon (M9).
- P key has no feature yet. No on-screen mute button until M4.
- Unseen files (GameUI, Guidance, JobManager, World, Vehicle) might still create their own audio. The overlay "contexts" number will show this.
- main.js still holds old HUD and old systems.

## Open decisions for the user
- Keep the game name?
- Keep or drop the daily bonus and paint colors?

## Working rules
- The user only copies, pastes, clicks and reports. No terminal commands for the user, except one single copy-paste command when a file must be deleted.
- One milestone at a time: Apply, Check project, play, report, Save to GitHub.
- Undo last apply first if anything looks strange.
- Executor start command if the red dot shows:
  cd "$(git rev-parse --show-toplevel)"; pkill -f executor.cjs; nohup node tools/executor.cjs > .executor.log 2>&1 & sleep 2; cat .executor.log
