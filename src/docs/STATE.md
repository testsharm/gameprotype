# STATE (live status) - after M4d

## Done and saved to GitHub (branch clean-v1)
M0, M1 timestep and input, M2 audio, M3a to M3e city, machine, camera, skyline, props, sky, fog, smoke, top speed 32/14, M4a to M4c (HUD base, Pause, pause mutes sound, round dial). Last commit 91065ab.

## Applied, not yet saved
- M4d: new HUD look. index.html and GameUI.js rewritten (solid steel panels, icon buttons, camera switch, dial bottom right in #dial-slot). Awaiting user test.

## Next
1. User tests M4d at 1910x900, 800x450, phone size, then clicks Save to GitHub.
2. M7 jobs, economy, shop upgrades, daily bonus (need JobManager.js from the user).
3. M6 CrazyGames SDK and optional rewarded ads (need SDK pages from the user).
4. M8 quality tiers, skill course, delete old files. M9 submission pack.

## Open issues
- Job card text always says Scoop dirt (until M7).
- Only 1 job, MAX_LOADS = 3 and 150 coins are hardcoded.
- Shop window is still plain (no level pips) until M7.
- Similar traffic cars. Plain driver seat, garage and yard.
- Engine sound too loud. Reverse beeper probably never fires.
- Double camera button binding. Empty setCollidables arrays. Fog lock in World.js.
- Old files to delete at the end. Internal jcb names in Vehicle.js. Vite warnings.
- Red console line "webextension.js ... reading '1'" is a Brave extension, not the game.
