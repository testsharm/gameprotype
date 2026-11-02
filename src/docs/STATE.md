# STATE (live status)

Updated: 2026-11-02 (M2 depth pass 2)
Branch: clean-v1. Repo: testsharm/gameprotype (Codespace).
Ports: 3002 Executor, 5173 live game, 4173 preview.

## Milestones
| ID | Name | Status |
|----|------|--------|
| M0 | Baseline restored | DONE, saved (4495a5e) |
| M1 | Stability pack | DONE, saved (ba986e2). Steps/s 60.6 at 143 fps and 60.0 at 144 fps seen. |
| M2 | Audio hub | Version 1 applied and saved (ba0ae22). User said it sounds cheap. Version 2 (deeper) APPLIED? awaiting your test. |
| M3 | World and machine visuals v2, anti-flicker, eased dig, remove dark wall | NOT STARTED |
| M4 | HUD and screens, slim index.html | NOT STARTED |
| M5 | Input and mobile | NOT STARTED |
| M6 | Portal minimal | NOT STARTED |
| M7 | Jobs, economy, shop, daily bonus, tutorial | NOT STARTED |
| M8 | Skill course, quality tiers, performance and size | NOT STARTED |
| M9 | Submission pack | NOT STARTED |

## M2 version 2: what changed in src/core/Audio.js
- Engine: diesel knock (sharp pulses), clatter, exhaust rumble, turbo whistle, body boost around 240 Hz. Engine strains while digging.
- Space: reverb with pre-delay and early reflections, warm low shelf and soft high shelf on the master.
- Music: stereo pad, sub drone, ping-pong echo, slow lead line, drums by intensity.
- Ambience: wind, gravel rumble that follows speed, birds, rare distant clank.
- Reverse beeper when speed is below -1.5 (needs signed speed from main.js, UNVERIFIED).
- Dig and dump: valve clicks, extra body boom on the dump thud.
- Debug box is now 3 short lines under the first green line, so the mission card does not hide it.
- LEVELS: master 0.9, music 0.3, ambience 0.22, engine 0.7, sfx 0.8, reverb 0.4.

## M2 acceptance (user reports)
1. Syntax passed and Check project OK: passed for version 1. Version 2 not yet.
2. No sound and no yellow warning before first input: no yellow warning seen (v1).
3. Overlay shows contexts 1: NOT SEEN yet.
4. Levels balanced and not cheap: re-test with version 2.
5. Dig and dump follow the arm: not reported.
6. Music ducks during dump (duck about 0.50): not reported.
7. M key mutes and unmutes: user says M works.
8. Silence while tab is hidden: not reported.

## Known issues (later milestones)
- Google Fonts import in index.html (M4).
- logarithmicDepthBuffer true and camera near 1 (M3).
- Top speed 40 km/h, spec says 32 (M7).
- Mission card text clipped; speed dial overlaps WASD keys (M4).
- Big dark wall blocks the Bucket camera (M3).
- main.js still holds old HUD code and unconnected systems (M4 to M8).
- Red console lines: favicon 404 (M9), CrazySDK not initialized (expected outside portal), extension message (probably Brave).
- Old audio files still on disk, unused: AudioManager.js, SoundFX.js, Sfx2.js, DigSound.js, Music.js. Delete after M2 passes.

## Next
1. User pastes this Audio.js, tests, reports levels and whether it still feels cheap.
2. If good: Save to GitHub, one delete command for old audio files, then M3.
