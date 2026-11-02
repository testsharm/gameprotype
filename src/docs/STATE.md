# STATE (live file) - rewritten completely after every change

Updated: 2026-11-02. Read HANDOFF.md first (rules, final game definition, plan, recovery). Milestones are M0 to M9.

## Where we are
- **M0 is DONE and verified by the user's output:** baseline commit 4495a5e restored, `src/main.js` = 658 lines (was 2165), working branch `clean-v1`, snapshot of the broken state on `snapshot-1102-0420`. The game loads again (user report).
- Not yet on GitHub: the revert, the new docs and the newer Executor. Next action is to Save to GitHub.
- Leftover clutter in `src/`: many `*.bak*` files (git-ignored, harmless, optional delete).
- The Executor in use has tabs Apply, Check/Build/Save, Files, Status, Help. The Help tab gives the start command (HANDOFF section 15).

## Status board
| ID | Milestone | Status |
|---|---|---|
| M0 | Revert to baseline, branch clean-v1 | DONE (not yet pushed to GitHub) |
| M1 | Stability: fixed timestep, interpolation, keys by event.code, rename jcb events, user-select | NEXT (task card for step 1 already given) |
| M2 | One audio hub, delete 5 old sound files | TODO |
| M3 | World and machine visuals v2, anti-flicker rules, dig animation | TODO |
| M4 | HUD and screens, remove duplicate HUD | TODO |
| M5 | Input and mobile controls | TODO |
| M6 | Portal minimal (SDK, loading bar, save) | TODO |
| M7 | Jobs, economy, shop, daily bonus, tutorial | TODO |
| M8 | Skill course, quality tiers, performance and size | TODO |
| M9 | Submission pack | TODO |

## Next task (exact)
1. Executor tab 1: paste the docs pack v3 (HANDOFF.md and STATE.md), Preview, Apply.
2. Executor tab 2: Check project, then Build check. Paste the result lines (MB and file count).
3. Executor tab 2: Save to GitHub. If it says no upstream, run once in the terminal: `git push -u origin clean-v1`.
4. Optional cleanup: `find src -name "*.bak*" -delete`.
5. Email or download HANDOFF.md and STATE.md to yourself (Plan B, HANDOFF section 15).
6. Upload the PDF "Getting 10 game rejection..." itself if you want it used (only its icon was visible). It is treated as UNVERIFIED until checked against docs.crazygames.com.
Then M1 step 1: the fixed-timestep task card (given earlier) is still valid because main.js is the same 658-line baseline. Attach only src/main.js.

## Facts confirmed
- Baseline (2026-11-01): main.js 658 lines, 22 JS files, 8385 lines, Check project OK (23 files), 16 of 21 features connected.
- Not connected in the baseline: Portal, MobileControls, LevelSystem, SkillCourse, WorldPolish.
- main.js lines 576 to 578: frame time, `vehicle.updateController`, `world.step()` once per frame (frame-rate dependent physics, R1).
- main.js lines 356 and 376: keys by `e.key` (AZERTY risk, R6).
- No fullscreen button and no external links in index.html, main.js, src/ui. Other folders not searched for the word JCB.
- Arena help page (2026-02-25): TXT and CSV uploads not supported. No other AI's limits tested (use the canary test, HANDOFF section 0).
- Executor Help tab (2026-11-02): start command, red dot means not running, "Copy error report" and "Copy error + related files" exist.

## Open decisions for the user (defaults are in HANDOFF section 3)
- Keep the game name? Daily bonus and paint colors: keep or drop? Which AI writes the big milestones (run the canary test)?

## Waiting for the user
- Docs pack applied, Check and Build results, Save result, the PDF file (optional).

## Last log entries
- 2026-11-02: M0 revert run by the user: 658 lines, clean-v1, game loads. Added HANDOFF section 15 (recovery and Plan B) and the Executor Help tab facts.
- 2026-11-02: Game page had a main.js parse error at line 2158 after the evening changes; decided to discard them.
- 2026-11-01: Executor v3 delivered; recon confirmed R1 and keys by e.key.
- 2026-10-31: 28 files pushed to GitHub as the first backup.
