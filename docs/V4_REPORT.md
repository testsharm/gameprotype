# V4 strict evidence report — 2026-11-06

[RAN] Score: **11/21**. This is partial Tier 1 work, not a completed tier.
[READ] Branch: arena/0ac523ae-gameprotype; base 1f091a9 (clean-v1). Arena requires keeping this branch, so fix-v4 was not created.
[RAN] Initial npm install: zero vulnerabilities. Initial and final npm run build pass. Vite reports large chunk/config-format warnings.

## Checklist

| # | Status | Evidence |
|---|---|---|
| 1 | [SEEN] PASS — fresh L1 real holds, +265 total earned | V4_NEWPLAYER.txt; screenshots/v4-result.png |
| 2 | [RAN] PASS — NEXT starts L2, clock running, modal hidden | V4_NEWPLAYER.txt; screenshots/v4-next.png |
| 3 | [SEEN] PASS — reload names L2, CONTINUE starts L2 | V4_NEWPLAYER.txt; screenshots/v4-continue.png |
| 4 | [RAN] PASS — six hold effects in about 1–2 ms | V4_NEWPLAYER.txt, lastAction.effect minus holdEnd |
| 5 | [RAN] PASS — 20.21 km/h to zero in 0.906 s, about 1.74 m; 31.55 km/h brake to zero in 0.877 s | V4_HANDLING.txt; V4_HANDLING_SAMPLES.json; screenshots/v4b-coast-stop.png |
| 6 | [SEEN] PASS — pile becomes a small patch | screenshots/v4-pile-1.png, v4-pile-2.png, v4-pile-3.png |
| 7 | [SEEN] PASS in the requested pile/orbit/wall scenarios — camera lifts rather than enters the cab; near surfaces fade | V4_CAMERA_ACTIONS.txt; V4_FOLLOWUP.txt; screenshots/v4b-camera-pile-approach.png, v4b-camera-past-pile.png, v4b-camera-wall.png |
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
| 18 | [UNKNOWN] NOT PASSED — ten-minute run had zero errors, but spent most of its time paused; rejected as active-input proof | V4_SESSION.txt; screenshots/v4b-session-end.png |
| 19 | [RAN] PASS — build passes; dist about 5.34 MB, 3 files | npm run build; V4_BUILD.txt |
| 20 | [SEEN] PASS — 440x956 Chromium touch emulation, two simultaneous fingers, readable controls and picker START | V4_PHONE.txt; screenshots/v4b-phone-two-finger.png, v4b-phone-picker.png |
| 21 | [UNKNOWN] NOT PASSED — unused-file cleanup not reached | src/docs/FILE_MAP.md; old files retained |

[READ] Item 20 is browser touch emulation, not a physical phone hardware test.
[READ] Screenshots in this report were all opened and inspected. Historical screenshots are not new evidence.

## Implemented, with limits

[READ] Resume key initialization no longer reads a const before initialization. Completion saves the next level without regressing on retries. Start info derives the first unfinished job.
[READ] Programmatic modal closes are silent; result X opens pause rather than queues the picker.
[READ] Result total includes earned load tips and bonus exactly once; refresh does not reset the amount to zero.
[RAN] Holds drive the arm pose and complete bucket effects in the same frame. Optional TAP TO ACT was enabled through Settings and completed a real tap action. Early release cancels and the arm returns to rest on a fixed 0.3 s curve: V4_CAMERA_ACTIONS.txt.
[READ] Frame dt cap is 0.25 s; physics fixed step is 1/60 with max five steps. Timer and actions use frame time, not the truncated physics accumulator. [RAN] At a forced five-frame render schedule, eight real seconds and eight game seconds differed by about 1 ms: V4_CLOCK.txt. This measures the job clock, not a claim of 60 physics steps per real second at five render frames: the required five-step cap drops excess physics debt.
[RAN] Reverse measured 14 km/h on the physical chassis. Post-solver coast assist removes creep and meets the tested stopping targets. Handling setup uses a QA teleport to open ground, then real W/Space input earns all speed; no velocity is injected. Initial attempts near the park hit a building/collider and were rejected.
[SEEN] Pile no longer regenerates between loads. Its floating label now stays a readable screen size rather than growing across the camera. Expanded world-space bounds sweep the camera volume; it lifts above the pile before attempting a cab-obscuring pull-in. Mesh materials within three metres fade, then restore. Pile, orbit and wall screenshots were opened; V4_FOLLOWUP.txt records three faded surfaces at the wall.
[SEEN] Stage and site-dressing signs are at most 2.5 x 1.2. Site-dressing signs and the near crane moved away from spawn. Starts in L3/L6/L11/L13/L15 were inspected. L3 was actually tipping on a hidden city collider; hiding the city now disables its physics and traffic bodies as well. The underlying floor remains active. New stage-solid colliders remain Tier 4 work.
[SEEN] NEW card has a real amber outline and badge, lock instructions no longer overlap, and START remains visible in the landscape and portrait picker. A stronger button selector had overridden the earlier outline; that was fixed. Named NEXT and a two-second GET READY banner were verified after actual L1 completion. Champion final-job flow is still not verified through a real L15 finish.

## Five worst things and changes

[READ] Written before final visual fixes: V4_WORST.md.
[READ] Earlier three fixes retained. Continuation listed five further visual problems in V4_WORST.md, then fixed its first three: missing amber card outline, overlapping lock labels, and off-screen picker START.
[SEEN] Desktop keycap, camera, picker and selected start fixes have opened screenshots. This does not establish all fifteen level layouts, complete sign/camera routes, or any upgraded machine art.
[SEEN] Remaining worst visible issues: generic ground/horizon, simplistic machine/truck, irrelevant pile/truck still in L2, repeated layouts, weak world detail. These need the blocked later tiers.

## Browser test limitations

[RAN] Newplayer uses a fresh context, normal URL, W/S/Space/F/G and real NEXT/PLAY clicks. Read-only QA telemetry reports positions and counters; no QA function mutates gameplay.
[RAN] Initial newplayer attempt stopped on a wrong result selector. Corrected script exits nonzero for failures and subsequently passed all its assertions.
[RAN] Initial timeout test ran two WebGL pages together and timed out; a context-close attempt then crashed the single-process Chromium harness. Final test navigated the unused phone page away, focused the desktop page, and reached TIME IS UP by waiting. No timer was set through QA.
[UNKNOWN] No performance score or honest new Free Play score can be given: that tier was not tested.

[READ] PR must stay open: 11/21 is below the requested 17/21 merge threshold.

## Continuation validation and honest exclusions

[RAN] Latest scripts/newplayer.mjs again completed L1 using three real F holds and three real G holds, then NEXT and reload CONTINUE into L2. Latest effect observations are about 1–4 ms. It also captured GET READY.
[RAN] A concurrent software-rendering run briefly dropped below the supported five-frame clock target. The old test released F on a fixed wall timeout before the game's ring completed; that attempt failed and was not counted. The harness now holds the real key until the observed action completes, with a timeout and no gameplay mutation. Low-frame clock proof remains the separate controlled five-frame test.
[READ] Camera followup uses QA only to set a stationary starting location outside the shed, then the real C key. The synthetic result-close check in V4_FOLLOWUP.txt is a component test only, not a level-completion claim.
[RAN] Ten-minute run: 600.237 s, 432 real key holds, zero own-code errors. [SEEN] Its final screenshot was PAUSED; holds stopped after minute 3. The original weak harness PASS was explicitly rejected. Checklist 18 is NOT passed. Harness now handles Resume and checks active duration, but that corrected ten-minute run is NOT yet executed.
[UNKNOWN] No Tier 2 environment/mechanic rebuild, Tier 3 Free Play rebuild, Tier 4 vehicle art/solid-world rebuild, or Tier 5 ad/settings/dead-file cleanup is claimed. In particular, the irrelevant pile/truck/loads text in L2 still needs the specified Tier 2 replacement.
