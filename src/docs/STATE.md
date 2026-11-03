# STATE (live status) - after M4c

## Done and saved to GitHub (branch clean-v1)
M0, M1 timestep and input, M2 audio, M3a to M3e city, machine, camera, skyline, props, sky, fog, smoke, top speed 32/14 (commit 1dcde4d).

## Applied, not yet saved
- M4a/M4b: index.html rewrite, GameUI.js, Pause (P key and button). Tested by user: Pause works, console clean.
- M4c: pause now mutes all sound; GameUI.js rewritten with round speedometer, new mission card, toasts. Awaiting user test.

## Next
1. User tests M4c at 1910x900, 800x450, phone size, then clicks Save to GitHub.
2. Restyle side buttons and panels (need index.html).
3. M7 jobs, economy, shop upgrades, daily bonus.
4. M6 CrazyGames SDK and optional rewarded ads (need SDK pages from user).
5. M8 quality tiers, skill course, delete old files. M9 submission pack.

## Open issues
- Side buttons and key cards still look flat (index.html).
- Job card text always says Scoop dirt (until M7).
- Only 1 job, MAX_LOADS = 3 and 150 coins are hardcoded.
- Similar traffic cars. Plain driver seat, garage and yard.
- Engine sound too loud. Reverse beeper probably never fires.
- Pause: need to check the job timer stops while paused.
- Double camera button binding. Empty setCollidables arrays. Fog lock in World.js.
- Old files to delete at the end. Internal jcb names in Vehicle.js. Vite warnings.
