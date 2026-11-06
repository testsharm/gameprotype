# V4 strict evidence report — 2026-11-06

[RAN] Score: **9/21**. This is partial Tier 1 work, not a completed tier.
[READ] Branch: arena/0ac523ae-gameprotype; base 1f091a9 (clean-v1). Arena requires keeping this branch, so fix-v4 was not created.
[RAN] Initial npm install: zero vulnerabilities. Initial and final npm run build pass. Vite reports large chunk/config-format warnings.

## Checklist

| # | Status | Evidence |
|---|---|---|
| 1 | [SEEN] PASS — fresh L1 real holds, +265 total earned | V4_NEWPLAYER.txt; screenshots/v4-result.png |
| 2 | [RAN] PASS — NEXT starts L2, clock running, modal hidden | V4_NEWPLAYER.txt; screenshots/v4-next.png |
| 3 | [SEEN] PASS — reload names L2, CONTINUE starts L2 | V4_NEWPLAYER.txt; screenshots/v4-continue.png |
| 4 | [RAN] PASS — six hold effects in about 1–2 ms | V4_NEWPLAYER.txt, lastAction.effect minus holdEnd |
| 5 | [UNKNOWN] NOT PASSED — no valid 20 km/h stop-distance test | V4_NEWPLAYER.txt shows residual dial motion; assist needs further testing |
| 6 | [SEEN] PASS — pile becomes a small patch | screenshots/v4-pile-1.png, v4-pile-2.png, v4-pile-3.png |
| 7 | [UNKNOWN] NOT PASSED — collision inputs expanded, not a full camera safety proof | source CameraManager.js; V4_WORST.md |
| 8 | [UNKNOWN] NOT PASSED — no rebuilt fifteen-level contact sheet | V4_WORST.md |
| 9 | [UNKNOWN] NOT PASSED — fifteen real-input completions not run | existing scripts/level-walk.mjs uses teleport and direct steps; do not use its PASS |
| 10 | [UNKNOWN] NOT PASSED — four special-rule negatives not proven | V4_NEWPLAYER.txt covers only L1/L2 start |
| 11 | [SEEN] PASS — waited for actual L1 expiry | V4_UI.txt; screenshots/v4-time-up.png |
| 12 | [UNKNOWN] NOT PASSED — Free Play rebuild not reached | V4_WORST.md |
| 13 | [UNKNOWN] NOT PASSED — traffic shapes not rebuilt | V4_WORST.md |
| 14 | [UNKNOWN] NOT PASSED — truck tilt/beacon rotation not implemented | V4_WORST.md |
| 15 | [UNKNOWN] NOT PASSED — five collision driving tests not run | V4_NEWPLAYER.txt |
| 16 | [RAN] PASS — real mouse wheel changes zoom 1 to 0.88 | V4_UI.txt; screenshots/v4-desktop-keycaps.png |
| 17 | [UNKNOWN] NOT PASSED — rewarded flows not tested in this pass | V4_UI.txt has no ad-flow proof |
| 18 | [UNKNOWN] NOT PASSED — no ten-minute session | V4_NEWPLAYER.txt and V4_UI.txt have zero own-code errors in shorter runs only |
| 19 | [RAN] PASS — build passes; dist about 5.34 MB, 3 files | npm run build; V4_BUILD.txt |
| 20 | [SEEN] PASS — 440x956 Chromium touch emulation, two simultaneous fingers; readable controls | V4_UI.txt; screenshots/v4-phone-two-finger.png |
| 21 | [UNKNOWN] NOT PASSED — unused-file cleanup not reached | src/docs/FILE_MAP.md; old files retained |

[READ] Item 20 is browser touch emulation, not a physical phone hardware test.
[READ] Screenshots in this report were all opened and inspected. Historical screenshots are not new evidence.

## Implemented, with limits

[READ] Resume key initialization no longer reads a const before initialization. Completion saves the next level without regressing on retries. Start info derives the first unfinished job.
[READ] Programmatic modal closes are silent; result X opens pause rather than queues the picker.
[READ] Result total includes earned load tips and bonus exactly once; refresh does not reset the amount to zero.
[READ] Holds now directly drive arm pose and complete bucket effects in the same frame. Optional TAP TO ACT is in Settings. Early cancellation returns the arm toward rest; exact 0.3 s return is not proven.
[READ] Frame dt cap is 0.25 s; physics fixed step is 1/60 with max five steps. Timer and actions use frame time, not the truncated physics accumulator. Low-fps timer accuracy has not been specifically measured.
[READ] Reverse limit is fixed at 14 km/h; stop assist is stronger. Neither top-speed brake target has a completed driving proof.
[READ] Pile no longer regenerates between loads. Active pile/truck/stage meshes now feed recursive camera raycasts. No proximity fading was added, and full collision/roll proof is outstanding.
[READ] Stage signs are 2.5 x 1.2, front-sided, placed far from the centre. Level-specific beam/sign path clearance remains unverified.
[READ] NEW picker badge/pulse, named NEXT, champion heading, desktop keys and key-down colour added. Champion path and tap option remain unverified.

## Five worst things and changes

[READ] Written before final visual fixes: V4_WORST.md.
[READ] Three addressed: giant mirrored stage signs reduced/front-sided; hidden/clipped keycaps restored and amber-lit; active pile/stage collision objects added to camera inputs.
[SEEN] Desktop keycap fix is proven by v4-desktop-keycaps.png. Camera and sign fixes remain only code-inspected, not full scene-by-scene visual acceptance.
[SEEN] Remaining worst visible issues: generic ground/horizon, simplistic machine/truck, irrelevant pile/truck still in L2, repeated layouts, weak world detail. These need the blocked later tiers.

## Browser test limitations

[RAN] Newplayer uses a fresh context, normal URL, W/S/Space/F/G and real NEXT/PLAY clicks. Read-only QA telemetry reports positions and counters; no QA function mutates gameplay.
[RAN] Initial newplayer attempt stopped on a wrong result selector. Corrected script exits nonzero for failures and subsequently passed all its assertions.
[RAN] Initial timeout test ran two WebGL pages together and timed out; a context-close attempt then crashed the single-process Chromium harness. Final test navigated the unused phone page away, focused the desktop page, and reached TIME IS UP by waiting. No timer was set through QA.
[UNKNOWN] No performance score or honest new Free Play score can be given: that tier was not tested.

[READ] PR must stay open: 9/21 is below the requested 17/21 merge threshold.
