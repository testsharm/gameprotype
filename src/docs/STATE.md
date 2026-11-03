# STATE (live status)

## Done and saved on GitHub (branch clean-v1)
M0, M1, M2 audio, M3a to M3e, top speed 32/14 plus CONTINUE.md, M4a to M4d (last commit 5072948).

## Applied, not yet saved
- M4e dial v3 and smaller mission card (user says OK, no screenshot).
- M7a part 1: new file src/gameplay/Jobs.js (job table, economy, ranks, daily bonus, site finder, result/fail/picker windows). NOT wired into main.js yet, so no visible change.

## Next
1. User clicks Check project, then Save to GitHub.
2. User sends src/main.js (ONE file). M7a part 2 wires Jobs.js into main.js (real jobs, real loads, rewards, result window, job picker, site per job).
3. M7b shop with level pips, Bucket upgrade, daily bonus button.
4. M5 input, M6 SDK and optional ads (user pastes SDK pages one at a time), M8 polish, M9 submission.

## Open issues
- Mission card text is still always Clear the Highway until part 2.
- MAX_LOADS = 3 and 150 coins are still hardcoded in main.js until part 2.
- Max speed seen 36 instead of 42, cause unknown (check Vehicle.js governor).
- Night, fog and dusk looks need World.js sky and fog access (env data is ready in Jobs.js).
- Shop is plain, no Bucket upgrade yet. Engine and hydraulic max level is 3 in main.js, Jobs.js allows 4.
- Similar traffic cars. Plain driver seat, garage and yard.
- Loud engine. The reverse beeper probably never fires.
- Double camera button binding. Empty setCollidables arrays. Fog lock in World.js.
- Old files to delete at the end. Internal jcb names in Vehicle.js. Vite warnings.
- Red webextension.js console line is a Brave extension, not the game.
