# A2 visual refresh — matched BEFORE / AFTER

[RAN] Current branch: `arena/06e604a9-gameprotype`. Baseline is merged v4 (`5ac28a7`). PR #5 is already merged; this refresh is a new checkpoint on the active branch, not a reopened PR. Historical v4 scores below are NOT A2 acceptance scores.

[READ] Matching method: same viewport and vehicle world pose for L1 chase/world/closeup; closeup eye = vehicle + (9,6,10), target = vehicle + (0,1.7,0). Camera settings intentionally change in chase. Dump uses the same truck-relative pose (11 m behind it); truck position intentionally changes. L2/L3 use each level's unchanged starting pose. Menus use the same panel and viewport, with a blurred background that is not frame-synchronized.

[READ] Shortcut disclosure for ALL paired scene images: `?qadebug&unlockall` plus QA level/position/inspection-camera setup; real renderer and real F/G holds for dump. These are visual comparisons, NOT proof of driving or level completion. Phone BEFORE images resize a desktop context; phone AFTER HUDs additionally use Chromium touch emulation at the same stationary pose. No physical-phone claim. Fresh normal-URL driving evidence is separately identified below. Filmstrip is a caption-only re-layout of the SAME historical frames, not a new playthrough.

## A2.1 — Backhoe silhouette

[SEEN] BEFORE — BAD: front loader only, undersized wheels and dark cab. Setup: the paired-scene method disclosed above.

![A2.1 before](screenshots/a2-before-11-backhoe-closeup.png)

[SEEN] AFTER — GOOD: folded rear boom/dipper/small bucket, outriggers, larger treaded yellow-hub wheels, blue glazing, mirrors, exhaust and paired front arms. Rear assembly is a fixed folded model, not an animated digging tool. Setup: the paired-scene method disclosed above.

![A2.1 after](screenshots/a2-after-11-backhoe-closeup.png)

## A2.2 — Chase and dump clearance

[SEEN] BEFORE — BAD: oversized machine, duplicate labels and coarse soil. Setup: the paired-scene method disclosed above.

![A2.2 before](screenshots/a2-before-dump.png)

[SEEN] AFTER — OK: clearer raised truck bed, compact machine and small soil pieces; no brown screen in this matched dump. This is one pose, not an exhaustive obstruction sweep. Setup: the paired-scene method disclosed above.

![A2.2 after](screenshots/a2-after-dump.png)

## A2.3 — Pile and blue truck visible together

[SEEN] BEFORE — BAD: pile blocks the truck and vehicle dominates the view. Setup: the paired-scene method disclosed above.

![A2.3 before](screenshots/a2-before-chase.png)

[SEEN] AFTER — GOOD: pile and offset blue truck are both visible, with one load counter and a true drive-to-pile hint. Normal-play distances and driving are below; this pair itself uses QA placement. Setup: the paired-scene method disclosed above.

![A2.3 after](screenshots/a2-after-chase.png)

### A2.3 — separate fresh-player input proof

[SEEN] GOOD — normal URL, fresh localStorage, real PLAY click, no QA/unlock/save/teleport shortcuts. Initial measured distances: about 22 m to pile and 41 m to truck. The second image follows a real W hold and Space brake; both targets remain visible. No level-completion claim.

![Fresh normal URL first playing view](screenshots/a2-after-first-frame.png)
![Real forward driving](screenshots/a2-after-driving.png)

## A2.4 — Compact desktop HUD, 1920×1080

[SEEN] BEFORE — BAD: large left key panel, duplicate hint/load labels, fake notification dots and touch actions on desktop. Setup: the paired-scene method disclosed above.

![A2.4 before](screenshots/a2-before-hud1920.png)

[SEEN] AFTER — OK: small translucent bottom-left keycaps, 84 px speed dial, 110 px minimap, one hint in mission card, one load label, no fake dots or desktop touch actions. The 1280×720 pair is A2.3 above. Setup: the paired-scene method disclosed above.

![A2.4 after](screenshots/a2-after-hud1920.png)

### A2.4 — 844×390

[SEEN] BEFORE — BAD: duplicate instructions/counts and oversized instruments. Shortcut: QA pose, desktop context resized to 844×390; not real touch.

![HUD 844×390 before](screenshots/a2-before-hud844.png)

[SEEN] AFTER — OK: compact instruments and touch-only joystick/action buttons, with desktop keycaps hidden. Shortcut: same QA pose and Chromium touch emulation; not a physical handset. Tight landscape layout still merits device testing. Portrait speed was lifted above the touch actions and its tools moved into a row to reveal the truck.

![HUD 844×390 after](screenshots/a2-after-hud844.png)

### A2.4 — 390×844

[SEEN] BEFORE — BAD: duplicate instructions/counts and oversized instruments. Shortcut: QA pose, desktop context resized to 390×844; not real touch.

![HUD 390×844 before](screenshots/a2-before-hud390.png)

[SEEN] AFTER — OK: compact instruments and touch-only joystick/action buttons, with desktop keycaps hidden. Shortcut: same QA pose and Chromium touch emulation; not a physical handset. Tight landscape layout still merits device testing. Portrait speed was lifted above the touch actions and its tools moved into a row to reveal the truck.

![HUD 390×844 after](screenshots/a2-after-hud390.png)

## A2.5 — World materials and smooth soil

[SEEN] BEFORE — BAD: blank skyline boxes, dark voxel-like dirt. Setup: the paired-scene method disclosed above.

![A2.5 before](screenshots/a2-before-world.png)

[SEEN] AFTER — OK: varied windowed buildings/roof boxes, textured green stripes, smooth soil mound and small clods. L2 road is asphalt rather than blue, and giant orange scoreboard is removed. Exact sign readability from every route and every night lamp are NOT VERIFIED by this view. Setup: the paired-scene method disclosed above.

![A2.5 after](screenshots/a2-after-world.png)

## A2.6 — Explicit L1 / L2 / L3 sameness check

[SEEN] BEFORE — BAD: L3 shares the yard framing and huge pile; potholes read mostly as rings. Setup: the paired-scene method disclosed above.

![A2.6 before](screenshots/a2-before-l3.png)

[SEEN] AFTER — BAD for the complete criterion: road repair is distinguishable from L1 and L2, but the distant potholes still read as rings rather than unmistakable depressions. Fix and recapture in Tier 2 group 1; do NOT mark this accepted. Setup: the paired-scene method disclosed above.

![A2.6 after](screenshots/a2-after-l3.png)

[SEEN] OK — L2 has an asphalt cone course and no pile/truck in its first view. Shortcut: QA level selection, same starting pose; camera and art intentionally revised.

![L2 before](screenshots/a2-before-l2.png)
![L2 after](screenshots/a2-after-l2.png)

[SEEN] OK — contact sheet explicitly compares L1, L2 and L3, top BEFORE / bottom AFTER. Same source images and shortcuts as the individual pairs; no new gameplay evidence. The shared skyline remains repetitive; L3 depressions remain BAD.

![L1 L2 L3 comparison](screenshots/a2-level-contact.png)

## A2.7 — Settings with explicit state

[SEEN] BEFORE — BAD: no ON/OFF text, sound looks off despite being enabled, LOW selected by automatic detection. Setup: the paired-scene method disclosed above.

![A2.7 before](screenshots/a2-before-settings.png)

[SEEN] AFTER — OK: visible ON/OFF labels, SOUND ON by default and AUTO selected. Real sound taps tested ON/OFF/ON. AUTO policy is desktop HIGH / coarse-pointer MEDIUM; code permits HIGH to MEDIUM after sustained slow frames, never auto LOW. Exact five-second timing under controlled throttling is NOT VERIFIED. Setup: the paired-scene method disclosed above.

![A2.7 after](screenshots/a2-after-settings.png)

### A2.7 — Garage and phone menus

[SEEN] BEFORE — BAD: no next-stat comparison and unaffordable buttons appear green. Shortcut: QA navigation; 1280×720 panel.

![Garage before](screenshots/a2-before-garage-desktop.png)

[SEEN] AFTER — OK: NOW / NEXT values with units, red unaffordable prices on grey buttons, ten paints with wrap/ring padding. Shortcut: QA navigation, same 1280×720 panel. Values are not a purchase-effect test.

![Garage after](screenshots/a2-after-garage-desktop.png)

[SEEN] BEFORE — BAD: ambiguous phone sound state and no AUTO. Shortcut: desktop context resized to 390×844.

![Phone settings before](screenshots/a2-before-settings-phone.png)

[SEEN] AFTER — OK: phone ON/OFF states and AUTO. Shortcut: QA menu navigation in a fresh touch-emulated context; sound toggled through real taps and restored ON.

![Phone settings after](screenshots/a2-after-settings-phone.png)

[SEEN] OK — additional phone Garage proof, no matched phone BEFORE available. Shortcut: QA menu navigation in the same fresh touch context; no rich/save staging. Ten paint options are available; actual phone hardware is NOT VERIFIED.

![Phone garage after](screenshots/a2-after-garage-phone.png)

## A2.8 — Readable two-line filmstrip captions

[SEEN] BEFORE — BAD: single-line captions truncated. Setup: the paired-scene method disclosed above.

![A2.8 before](screenshots/a2-before-filmstrip.png)

[SEEN] AFTER — GOOD: time and compact complete action caption on separate lines, 18 px. SAME eight historical frames reused solely to compare caption layout; no new gameplay, no new timing claims. Original frames used normal URL, real inputs, no gameplay shortcuts. Setup: the paired-scene method disclosed above.

![A2.8 after](screenshots/a2-after-filmstrip.png)

### Additional diagnostic evidence

[SEEN] BAD — intermediate Garage capture retained: the arrow glyph did not render, so it was replaced with explicit NOW / NEXT text in the final Garage images above. Shortcut: QA navigation, desktop context. This intermediate image is NOT the final UI.

![Intermediate missing-arrow diagnostic](screenshots/a2-after-garage.png)

[RAN] `A2_PHONE_LAYOUT.json` checks measured speed/action/joystick and map/tool separation plus eventual toast disappearance at both phone sizes. The toast WRAPPER reported zero height when sampled, so this is not a measured active-toast overlap test. Final phone screenshots were opened and visually checked. A final 12 px desktop-toast clearance adjustment is checked separately; the earlier L3 BAD comparison predates it.

### Remaining limits / next order

[UNKNOWN] A2 is not unconditional acceptance: L3 clear depressions remain BAD; controlled auto-quality timing, exhaustive camera/pile intersections, physical iPhone behavior and every world sign/lamp remain unverified. Existing bucket/prop penetration, rewarded flows and cleanup failures are not fixed by this art pass.

[READ] Next: Tier 2 group 1 (including L3 holes), then groups 2 / 3, D, E and optional F. Historical v4 completions below are not a replay of the changed A2 build.

---

# Historical real game screenshots — Fix v4

[SEEN] Historical phone proof: fresh-player truck tipping below. Full gallery retains earlier failures and discloses all setup shortcuts.

![Latest normal-play phone truck tipping](screenshots/e-smoke-l1-mid-phone.png)

[SEEN] OK — real first delivery, normal URL and fresh storage; no shortcuts.


[RAN] Captured in Chromium from the current branch at 1280×720 and 390×844. Fresh storage; Level 1 was finished with real driving and action holds. Phone result uses that same real finish, with the viewport changed.

[READ] These are baseline images, not a claim that the level and Free Play rebuilds are finished. Every image below was opened and inspected. Only the Level 3 starting-level selection used unlockall; its caption says so.

## Eight-frame Level 1 filmstrip

[SEEN] OK — Real Level 1 input, shrinking pile and earned result; the art is still simple. No gameplay shortcut. Labels are wall times recorded when each capture finished; the first three capture requests were scheduled for 0 / 5 / 15 seconds, but screenshot processing added delay.

![Level 1 filmstrip](screenshots/filmstrip-L1.png)

## Desktop Start

[SEEN] OK — Start screen. No shortcut.

![desktop-start](screenshots/page-desktop-start.png)

## Phone Start

[SEEN] OK — Phone start screen. No shortcut.

![phone-start](screenshots/page-phone-start.png)

## Desktop L1 Start

[SEEN] OK — Level 1 first playing view. No shortcut.

![desktop-l1-start](screenshots/page-desktop-l1-start.png)

## L1 5S

[SEEN] OK — Level 1 capture requested at five seconds (finished at 9.5 seconds). No shortcut.

![l1-5s](screenshots/page-l1-5s.png)

## L1 15S

[SEEN] OK — Level 1 capture requested at fifteen seconds (finished at 19.9 seconds). No shortcut.

![l1-15s](screenshots/page-l1-15s.png)

## Phone L1 Play

[SEEN] OK — Phone two-finger driving and action hold. No shortcut.

![phone-l1-play](screenshots/page-phone-l1-play.png)

## Desktop L1 Scoop

[SEEN] OK — Real SCOOP hold with arm and pile. No shortcut. The rear view still hides part of the arm.

![desktop-l1-scoop](screenshots/page-desktop-l1-scoop.png)

## Desktop L1 Dump

[SEEN] OK — Real DUMP hold beside the truck. No shortcut. The rear view still hides part of the arm.

![desktop-l1-dump](screenshots/page-desktop-l1-dump.png)

## L1 Second Load

[SEEN] OK — Second scoop leaves a small pile. No shortcut.

![l1-second-load](screenshots/page-l1-second-load.png)

## Desktop L1 Result

[SEEN] GOOD — Level 1 result earned with real holds. No shortcut.

![desktop-l1-result](screenshots/page-desktop-l1-result.png)

## Phone Result

[SEEN] GOOD — Phone result from the same real Level 1 finish; viewport changed, no save shortcut.

![phone-result](screenshots/page-phone-result.png)

## Desktop Get Ready

[SEEN] OK — GET READY after real NEXT into Level 2. No shortcut.

![desktop-get-ready](screenshots/page-desktop-get-ready.png)

## Desktop L2 Play

[SEEN] BAD — Level 2 after real driving. No shortcut. The dirt pile and truck do not belong in a cone lesson; Step C must replace this.

![desktop-l2-play](screenshots/page-desktop-l2-play.png)

## Desktop Pause

[SEEN] GOOD — Pause opened with the P key. No shortcut.

![desktop-pause](screenshots/page-desktop-pause.png)

## Desktop Picker

[SEEN] GOOD — Picker after Level 1 unlocks Level 2. No shortcut.

![desktop-picker](screenshots/page-desktop-picker.png)

## Phone Picker

[SEEN] GOOD — Phone picker after the real Level 1 finish. No shortcut.

![phone-picker](screenshots/page-phone-picker.png)

## Desktop Garage

[SEEN] GOOD — Garage after real Level 1 earnings. No shortcut.

![desktop-garage](screenshots/page-desktop-garage.png)

## Phone Garage

[SEEN] GOOD — Phone Garage after real earnings. No shortcut.

![phone-garage](screenshots/page-phone-garage.png)

## Desktop Settings

[SEEN] GOOD — Settings opened from Pause. No shortcut.

![desktop-settings](screenshots/page-desktop-settings.png)

## Desktop L3 Start

[SEEN] BAD — Level 3 start; unlockall used ONLY to select its starting level. It still repeats the shared dirt yard; Step C must replace this.

![desktop-l3-start](screenshots/page-desktop-l3-start.png)

## Desktop Freeplay

[SEEN] BAD — Current Free Play spawn. No shortcut. Spawn faces a city wall, with stunts out of view; Step D must replace this.

![desktop-freeplay](screenshots/page-desktop-freeplay.png)

## Phone Freeplay

[SEEN] BAD — Current Free Play on phone. No shortcut. Spawn faces a city wall, with stunts out of view; Step D must replace this.

![phone-freeplay](screenshots/page-phone-freeplay.png)


## Step B — focused ten-minute test

[SEEN] OK — Start and end of the 600.938-second real-key run. No shortcut or staged save. Both remain in the game, not PAUSED; all three retries followed actual timeout.

![Session start](screenshots/v4b-session-start.png)

![Session end](screenshots/v4b-session-end.png)

# Step C — Group 1: Levels 1–5

[RAN] Each result below was earned with real Chromium keyboard driving and F/G holds (or gate/park driving). unlockall was used ONLY to select each starting level. No teleport, injected velocity, direct progress, timer edits or staged result. Phone shots are the same run with the viewport changed, not a second phone completion.

[READ] The corrected walks route at 800×450 between captures (the initial L1 walk routed at 1280×720) so software WebGL can keep up; desktop captures are 1280×720 and portrait captures 390×844. L1 completed in the first walk; L3–5 completed in the corrected walk; L2 completed in the cone-contact walk. Failed attempts are retained in the logs.

[SEEN] OK — New contact sheet; ten unfinished levels are deliberately blank, not passed. Shortcut disclosure: unlockall only for starting-level selection.

![Current level contact sheet](screenshots/levels-contact-sheet.png)

## Level 1 — Three-load rookie yard

[SEEN] OK — Desktop start: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 start desktop](screenshots/c1-l1-start-desktop.png)

[SEEN] OK — Phone start: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 start phone](screenshots/c1-l1-start-phone.png)

[SEEN] OK — Desktop mid: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 mid desktop](screenshots/c1-l1-mid-desktop.png)

[SEEN] OK — Phone mid: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 mid phone](screenshots/c1-l1-mid-phone.png)

[SEEN] GOOD — Desktop result: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 result desktop](screenshots/c1-l1-result-desktop.png)

[SEEN] GOOD — Phone result: Three-load rookie yard. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L1 result phone](screenshots/c1-l1-result-phone.png)

## Level 2 — Six S gates and a one-second park

[SEEN] OK — Desktop start: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 start desktop](screenshots/c1-l2-start-desktop.png)

[SEEN] OK — Phone start: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 start phone](screenshots/c1-l2-start-phone.png)

[SEEN] OK — Desktop mid: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 mid desktop](screenshots/c1-l2-mid-desktop.png)

[SEEN] OK — Phone mid: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 mid phone](screenshots/c1-l2-mid-phone.png)

[SEEN] GOOD — Desktop result: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 result desktop](screenshots/c1-l2-result-desktop.png)

[SEEN] GOOD — Phone result: Six S gates and a one-second park. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L2 result phone](screenshots/c1-l2-result-phone.png)

## Level 3 — Three separate potholes with moving traffic

[SEEN] OK — Desktop start: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 start desktop](screenshots/c1-l3-start-desktop.png)

[SEEN] OK — Phone start: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 start phone](screenshots/c1-l3-start-phone.png)

[SEEN] OK — Desktop mid: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 mid desktop](screenshots/c1-l3-mid-desktop.png)

[SEEN] OK — Phone mid: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 mid phone](screenshots/c1-l3-mid-phone.png)

[SEEN] GOOD — Desktop result: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 result desktop](screenshots/c1-l3-result-desktop.png)

[SEEN] GOOD — Phone result: Three separate potholes with moving traffic. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L3 result phone](screenshots/c1-l3-result-phone.png)

## Level 4 — Sand and gravel matched to two trucks

[SEEN] OK — Desktop start: Sand and gravel matched to two trucks. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 start desktop](screenshots/c1-l4-start-desktop.png)

[SEEN] OK — Phone start: Sand and gravel matched to two trucks. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 start phone](screenshots/c1-l4-start-phone.png)

[SEEN] BAD — Desktop mid: Sand and gravel matched to two trucks. This frame exposed an old park hint. The hint funnel is now corrected in source; this particular mid frame predates that correction. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 mid desktop](screenshots/c1-l4-mid-desktop.png)

[SEEN] BAD — Phone mid: Sand and gravel matched to two trucks. This frame exposed an old park hint. The hint funnel is now corrected in source; this particular mid frame predates that correction. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 mid phone](screenshots/c1-l4-mid-phone.png)

[SEEN] GOOD — Desktop result: Sand and gravel matched to two trucks. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 result desktop](screenshots/c1-l4-result-desktop.png)

[SEEN] GOOD — Phone result: Sand and gravel matched to two trucks. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L4 result phone](screenshots/c1-l4-result-phone.png)

## Level 5 — Three timed loading lanes, larger final truck

[SEEN] OK — Desktop start: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 start desktop](screenshots/c1-l5-start-desktop.png)

[SEEN] OK — Phone start: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 start phone](screenshots/c1-l5-start-phone.png)

[SEEN] OK — Desktop mid: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 mid desktop](screenshots/c1-l5-mid-desktop.png)

[SEEN] OK — Phone mid: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 mid phone](screenshots/c1-l5-mid-phone.png)

[SEEN] GOOD — Desktop result: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 result desktop](screenshots/c1-l5-result-desktop.png)

[SEEN] GOOD — Phone result: Three timed loading lanes, larger final truck. Shortcut: unlockall only for initial level selection; real driving/holds; phone viewport changed.

![L5 result phone](screenshots/c1-l5-result-phone.png)

## Special-rule proof

[SEEN] OK — Real contact registered and telemetry confirms a settled 1.42-radian cone; the fallen cone is still partly hidden by the wheel in this side view, desktop. Shortcut: unlockall only to select the starting level; all contact/driving/actions are real input.

![L2 cone-tumble desktop](screenshots/c1-l2-cone-tumble-desktop.png)

[SEEN] OK — Real contact registered and telemetry confirms a settled 1.42-radian cone; the fallen cone is still partly hidden by the wheel in this side view, phone. Shortcut: unlockall only to select the starting level; all contact/driving/actions are real input.

![L2 cone-tumble phone](screenshots/c1-l2-cone-tumble-phone.png)

[SEEN] OK — WRONG TRUCK keeps the sand in the bucket and awards zero loads, desktop. Shortcut: unlockall only to select the starting level; all contact/driving/actions are real input.

![L4 wrong-truck desktop](screenshots/c1-l4-wrong-truck-desktop.png)

[SEEN] OK — WRONG TRUCK keeps the sand in the bucket and awards zero loads, phone. Shortcut: unlockall only to select the starting level; all contact/driving/actions are real input.

![L4 wrong-truck phone](screenshots/c1-l4-wrong-truck-phone.png)

## C group 2 — Contractor levels 6–10

[RAN] Five real-input results; see [C2_WALK.txt](C2_WALK.txt) and [final bridge retest](C2_BRIDGE_FINAL.txt). Pipe drop kept loads at zero; recovery and all three placements followed. A real drive off the bridge reset once and deducted exactly ten extra seconds. Selection used unlockall; no position, velocity, progress, clock or saves were injected. Phone images are 390×844 viewport captures, not physical-iPhone verification.

[SEEN] Fixed the blue pipe-yard wallpaper and water drawn over the bridge deck after opening the first captures. L6/L7 starts were recaptured; L9 start/mid/result/reset were all retested and recaptured. L6 mid/result and L7 mid/result/drop predate those cosmetic changes. No current-art claim is made for those older frames. Forklift solid collisions remain E work.

### Level 6 — Four marked trench digs, then spoil dumping

[SEEN] OK — Desktop start: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 start desktop](screenshots/c2-l6-start-desktop.png)

[SEEN] OK — Phone start: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 start phone](screenshots/c2-l6-start-phone.png)

[SEEN] OK — Desktop mid: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 mid desktop](screenshots/c2-l6-mid-desktop.png)

[SEEN] OK — Phone mid: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 mid phone](screenshots/c2-l6-mid-phone.png)

[SEEN] GOOD — Desktop result: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 result desktop](screenshots/c2-l6-result-desktop.png)

[SEEN] GOOD — Phone result: Four marked trench digs, then spoil dumping. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L6 result phone](screenshots/c2-l6-result-phone.png)

### Level 7 — Three pipes with slow carrying and recovery

[SEEN] OK — Desktop start: Three pipes with slow carrying and recovery. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 start desktop](screenshots/c2-l7-start-desktop.png)

[SEEN] OK — Phone start: Three pipes with slow carrying and recovery. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 start phone](screenshots/c2-l7-start-phone.png)

[SEEN] BAD — Desktop mid: Old blue grid ground looked like wallpaper; current start above shows the corrected concrete. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 mid desktop](screenshots/c2-l7-mid-desktop.png)

[SEEN] BAD — Phone mid: Old blue grid ground looked like wallpaper; current start above shows the corrected concrete. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 mid phone](screenshots/c2-l7-mid-phone.png)

[SEEN] GOOD — Desktop result: Three pipes with slow carrying and recovery. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 result desktop](screenshots/c2-l7-result-desktop.png)

[SEEN] GOOD — Phone result: Three pipes with slow carrying and recovery. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L7 result phone](screenshots/c2-l7-result-phone.png)

### Level 8 — Six long hauls under work lights

[SEEN] OK — Desktop start: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 start desktop](screenshots/c2-l8-start-desktop.png)

[SEEN] OK — Phone start: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 start phone](screenshots/c2-l8-start-phone.png)

[SEEN] OK — Desktop mid: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 mid desktop](screenshots/c2-l8-mid-desktop.png)

[SEEN] OK — Phone mid: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 mid phone](screenshots/c2-l8-mid-phone.png)

[SEEN] GOOD — Desktop result: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 result desktop](screenshots/c2-l8-result-desktop.png)

[SEEN] GOOD — Phone result: Six long hauls under work lights. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L8 result phone](screenshots/c2-l8-result-phone.png)

### Level 9 — Five deck repairs on a railed narrow bridge

[SEEN] OK — Desktop start: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 start desktop](screenshots/c2-l9-start-desktop.png)

[SEEN] OK — Phone start: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 start phone](screenshots/c2-l9-start-phone.png)

[SEEN] OK — Desktop mid: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 mid desktop](screenshots/c2-l9-mid-desktop.png)

[SEEN] OK — Phone mid: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 mid phone](screenshots/c2-l9-mid-phone.png)

[SEEN] GOOD — Desktop result: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 result desktop](screenshots/c2-l9-result-desktop.png)

[SEEN] GOOD — Phone result: Five deck repairs on a railed narrow bridge. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L9 result phone](screenshots/c2-l9-result-phone.png)

### Level 10 — Five timed night trucks and moving forklifts

[SEEN] OK — Desktop start: Five timed night trucks and moving forklifts. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 start desktop](screenshots/c2-l10-start-desktop.png)

[SEEN] OK — Phone start: Five timed night trucks and moving forklifts. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 start phone](screenshots/c2-l10-start-phone.png)

[SEEN] BAD — Desktop mid: Forklift detail is visible, but it can overlap the machine; E solid collisions still required. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 mid desktop](screenshots/c2-l10-mid-desktop.png)

[SEEN] BAD — Phone mid: Forklift detail is visible, but it can overlap the machine; E solid collisions still required. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 mid phone](screenshots/c2-l10-mid-phone.png)

[SEEN] GOOD — Desktop result: Five timed night trucks and moving forklifts. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 result desktop](screenshots/c2-l10-result-desktop.png)

[SEEN] GOOD — Phone result: Five timed night trucks and moving forklifts. Shortcut: unlockall for selection only; real driving/actions; viewport changed for phone.

![L10 result phone](screenshots/c2-l10-result-phone.png)

### Contractor special-rule proof

[SEEN] OK — Desktop: Overspeed dropped the carried pipe with zero load credit; this older frame predates concrete-ground touchup. Shortcut: unlockall only for initial selection; real driving/actions; viewport changed for phone.

![L7 pipe-drop desktop](screenshots/c2-l7-pipe-drop-desktop.png)

[SEEN] OK — Phone: Overspeed dropped the carried pipe with zero load credit; this older frame predates concrete-ground touchup. Shortcut: unlockall only for initial selection; real driving/actions; viewport changed for phone.

![L7 pipe-drop phone](screenshots/c2-l7-pipe-drop-phone.png)

[SEEN] OK — Desktop: Real fall reset to the source; telemetry proves the extra ten-second deduction. Shortcut: unlockall only for initial selection; real driving/actions; viewport changed for phone.

![L9 bridge-reset desktop](screenshots/c2-l9-bridge-reset-desktop.png)

[SEEN] OK — Phone: Real fall reset to the source; telemetry proves the extra ten-second deduction. Shortcut: unlockall only for initial selection; real driving/actions; viewport changed for phone.

![L9 bridge-reset phone](screenshots/c2-l9-bridge-reset-phone.png)

## C3 — Site Boss, levels 11–15

[RAN] Level selection used `?unlockall` only. Movement and actions were real keyboard holds; no teleports, speed injection, timer changes or direct completions. Portrait images resize the same real run, not physical-iPhone proof. `C3_WALK.txt` proves L11; `C3_FINAL.txt` proves L12–15. Earlier failures are retained in `C3_ATTEMPT.txt`.

### Level 11 — Storm cleanup

![Level 11 start desktop](screenshots/c3-l11-start-desktop.png)

[SEEN] OK — Storm cleanup, start, desktop; real input; unlockall selection only.

![Level 11 start phone](screenshots/c3-l11-start-phone.png)

[SEEN] OK — Storm cleanup, start, phone; real input; unlockall selection only.

![Level 11 mid desktop](screenshots/c3-l11-mid-desktop.png)

[SEEN] OK — Storm cleanup, mid, desktop; real input; unlockall selection only.

![Level 11 mid phone](screenshots/c3-l11-mid-phone.png)

[SEEN] OK — Storm cleanup, mid, phone; real input; unlockall selection only.

![Level 11 result desktop](screenshots/c3-l11-result-desktop.png)

[SEEN] OK — Storm cleanup, result, desktop; real input; unlockall selection only.

![Level 11 result phone](screenshots/c3-l11-result-phone.png)

[SEEN] OK — Storm cleanup, result, phone; real input; unlockall selection only.

### Level 12 — Foundation

![Level 12 start desktop](screenshots/c3-l12-start-desktop.png)

[SEEN] OK — Foundation, start, desktop; real input; unlockall selection only.

![Level 12 start phone](screenshots/c3-l12-start-phone.png)

[SEEN] OK — Foundation, start, phone; real input; unlockall selection only.

![Level 12 mid desktop](screenshots/c3-l12-mid-desktop.png)

[SEEN] OK — Foundation, mid, desktop; real input; unlockall selection only.

![Level 12 mid phone](screenshots/c3-l12-mid-phone.png)

[SEEN] OK — Foundation, mid, phone; real input; unlockall selection only.

![Level 12 result desktop](screenshots/c3-l12-result-desktop.png)

[SEEN] OK — Foundation, result, desktop; real input; unlockall selection only.

![Level 12 result phone](screenshots/c3-l12-result-phone.png)

[SEEN] OK — Foundation, result, phone; real input; unlockall selection only.

### Level 13 — Crane support

![Level 13 start desktop](screenshots/c3-l13-start-desktop.png)

[SEEN] OK — Crane support, start, desktop; real input; unlockall selection only.

![Level 13 start phone](screenshots/c3-l13-start-phone.png)

[SEEN] OK — Crane support, start, phone; real input; unlockall selection only.

![Level 13 mid desktop](screenshots/c3-l13-mid-desktop.png)

[SEEN] BAD — Crane support, mid, desktop; real input; unlockall selection only; camera is too close beside the gantry; its legs have since been moved outside the approach, not yet re-captured.

![Level 13 mid phone](screenshots/c3-l13-mid-phone.png)

[SEEN] BAD — Crane support, mid, phone; real input; unlockall selection only; camera is too close beside the gantry; its legs have since been moved outside the approach, not yet re-captured.

![Level 13 result desktop](screenshots/c3-l13-result-desktop.png)

[SEEN] OK — Crane support, result, desktop; real input; unlockall selection only.

![Level 13 result phone](screenshots/c3-l13-result-phone.png)

[SEEN] OK — Crane support, result, phone; real input; unlockall selection only.

### Level 14 — Ghost trial

![Level 14 start desktop](screenshots/c3-l14-start-desktop.png)

[SEEN] OK — Ghost trial, start, desktop; real input; unlockall selection only.

![Level 14 start phone](screenshots/c3-l14-start-phone.png)

[SEEN] OK — Ghost trial, start, phone; real input; unlockall selection only.

![Level 14 mid desktop](screenshots/c3-l14-mid-desktop.png)

[SEEN] OK — Ghost trial, mid, desktop; real input; unlockall selection only.

![Level 14 mid phone](screenshots/c3-l14-mid-phone.png)

[SEEN] OK — Ghost trial, mid, phone; real input; unlockall selection only.

![Level 14 result desktop](screenshots/c3-l14-result-desktop.png)

[SEEN] OK — Ghost trial, result, desktop; real input; unlockall selection only.

![Level 14 result phone](screenshots/c3-l14-result-phone.png)

[SEEN] OK — Ghost trial, result, phone; real input; unlockall selection only.

### Level 15 — Mega project

![Level 15 start desktop](screenshots/c3-l15-start-desktop.png)

[SEEN] OK — Mega project, start, desktop; real input; unlockall selection only.

![Level 15 start phone](screenshots/c3-l15-start-phone.png)

[SEEN] OK — Mega project, start, phone; real input; unlockall selection only.

![Level 15 mid desktop](screenshots/c3-l15-mid-desktop.png)

[SEEN] OK — Mega project, mid, desktop; real input; unlockall selection only.

![Level 15 mid phone](screenshots/c3-l15-mid-phone.png)

[SEEN] OK — Mega project, mid, phone; real input; unlockall selection only.

![Level 15 result desktop](screenshots/c3-l15-result-desktop.png)

[SEEN] OK — Mega project, result, desktop; real input; unlockall selection only.

![Level 15 result phone](screenshots/c3-l15-result-phone.png)

[SEEN] OK — Mega project, result, phone; real input; unlockall selection only.

![Foundation pit at seven of eight digs, 2.63 m shown; final depth assertion is 3 m desktop](screenshots/c3-l12-foundation-depth-desktop.png)

[SEEN] OK — Foundation pit at seven of eight digs, 2.63 m shown; final depth assertion is 3 m; real input, unlockall selection only.

![Foundation pit at seven of eight digs, 2.63 m shown; final depth assertion is 3 m phone](screenshots/c3-l12-foundation-depth-phone.png)

[SEEN] OK — Foundation pit at seven of eight digs, 2.63 m shown; final depth assertion is 3 m; real input, unlockall selection only.

![High-hook attempt retained cargo and awarded no load; phone capture occurs later in the hook cycle desktop](screenshots/c3-l13-high-hook-desktop.png)

[SEEN] OK — High-hook attempt retained cargo and awarded no load; phone capture occurs later in the hook cycle; real input, unlockall selection only.

![High-hook attempt retained cargo and awarded no load; phone capture occurs later in the hook cycle phone](screenshots/c3-l13-high-hook-phone.png)

[SEEN] OK — High-hook attempt retained cargo and awarded no load; phone capture occurs later in the hook cycle; real input, unlockall selection only.

![All fifteen level starts](screenshots/levels-contact-sheet.png)

[SEEN] OK — fifteen real level starts; unlockall used only for selection. Art remains simple and some industrial backgrounds repeat, but the visible job layouts and mechanics differ.

## D — separate Stunt Park

[RAN] `D_WALK.txt`: real rings, brief measured airtime, dig, normal RESPAWN and exit. `D_VISUAL.txt`: independent three-dig followup, minimum terrain height changed from 0.09 m to -2.41 m. No QA setup shortcuts. Normal respawn used to avoid reversing into the ramp wall. Portrait is Chromium viewport resizing, not an actual iPhone.

![Park start desktop](screenshots/d-park-start-desktop.png)

[SEEN] OK — Park start, desktop; real driving/actions; no shortcuts.

![Park start phone](screenshots/d-park-start-phone.png)

[SEEN] OK — Park start, phone; real driving/actions; no shortcuts.

![Park rings desktop](screenshots/d-park-rings-desktop.png)

[SEEN] OK — Park rings, desktop; real driving/actions; no shortcuts.

![Park rings phone](screenshots/d-park-rings-phone.png)

[SEEN] OK — Park rings, phone; real driving/actions; no shortcuts.

![Park jump desktop](screenshots/d-park-jump-desktop.png)

[SEEN] OK — Park jump, desktop; real driving/actions; no shortcuts; screenshot is after the brief airborne interval, not a frozen airborne pose.

![Park jump phone](screenshots/d-park-jump-phone.png)

[SEEN] OK — Park jump, phone; real driving/actions; no shortcuts; screenshot is after the brief airborne interval, not a frozen airborne pose.

![Park dig-before desktop](screenshots/d-park-dig-before-desktop.png)

[SEEN] OK — Park dig-before, desktop; real driving/actions; no shortcuts; separate three-dig followup, orbit camera; crater shading is subtle and machine partly covers it.

![Park dig-before phone](screenshots/d-park-dig-before-phone.png)

[SEEN] OK — Park dig-before, phone; real driving/actions; no shortcuts; separate three-dig followup, orbit camera; crater shading is subtle and machine partly covers it.

![Park dig-after desktop](screenshots/d-park-dig-after-desktop.png)

[SEEN] OK — Park dig-after, desktop; real driving/actions; no shortcuts; separate three-dig followup, orbit camera; crater shading is subtle and machine partly covers it.

![Park dig-after phone](screenshots/d-park-dig-after-phone.png)

[SEEN] OK — Park dig-after, phone; real driving/actions; no shortcuts; separate three-dig followup, orbit camera; crater shading is subtle and machine partly covers it.

![Park respawn desktop](screenshots/d-park-respawn-desktop.png)

[SEEN] OK — Park respawn, desktop; real driving/actions; no shortcuts.

![Park respawn phone](screenshots/d-park-respawn-phone.png)

[SEEN] OK — Park respawn, phone; real driving/actions; no shortcuts.


## E — vehicle shapes, truck detail, and collision limits

[RAN] `E_WALK.txt`: seven shapes × ten colors = seventy unique fleet pairs, rotating beacon, five real W contacts, and a real F/G delivery. QA position/scene setup only; no injected velocity, loads, coins or timers. `E_INSPECTION.txt` additionally uses a fixed inspection camera for art closeups. These are NOT normal gameplay-camera evidence. The chassis collides but the long bucket can overlap props; strict collision criterion remains failed.

![sedan closeup](screenshots/e-shape-sedan-phone.png)

[SEEN] OK — sedan, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![hatchback closeup](screenshots/e-shape-hatchback-phone.png)

[SEEN] OK — hatchback, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![suv closeup](screenshots/e-shape-suv-phone.png)

[SEEN] OK — suv, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![pickup closeup](screenshots/e-shape-pickup-phone.png)

[SEEN] OK — pickup, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![van closeup](screenshots/e-shape-van-phone.png)

[SEEN] OK — van, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![bus closeup](screenshots/e-shape-bus-phone.png)

[SEEN] OK — bus, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![flatbed closeup](screenshots/e-shape-flatbed-phone.png)

[SEEN] OK — flatbed, simple but distinct code-made shape; unlockall/QA scene and inspection-camera setup, not gameplay proof.

![E backhoe-inspection desktop](screenshots/e-backhoe-inspection-desktop.png)

[SEEN] OK — backhoe-inspection, desktop; QA position/scene setup; inspection camera.

![E backhoe-inspection phone](screenshots/e-backhoe-inspection-phone.png)

[SEEN] BAD — backhoe-inspection, phone; QA position/scene setup; inspection camera; closeup crops the bucket.

![E bed-before-inspection desktop](screenshots/e-bed-before-inspection-desktop.png)

[SEEN] OK — bed-before-inspection, desktop; QA position/scene setup; inspection camera.

![E bed-before-inspection phone](screenshots/e-bed-before-inspection-phone.png)

[SEEN] OK — bed-before-inspection, phone; QA position/scene setup; inspection camera.

![E bed-tilt-inspection desktop](screenshots/e-bed-tilt-inspection-desktop.png)

[SEEN] OK — bed-tilt-inspection, desktop; QA position/scene setup; inspection camera.

![E bed-tilt-inspection phone](screenshots/e-bed-tilt-inspection-phone.png)

[SEEN] OK — bed-tilt-inspection, phone; QA position/scene setup; inspection camera.

![E bed-after-inspection desktop](screenshots/e-bed-after-inspection-desktop.png)

[SEEN] OK — bed-after-inspection, desktop; QA position/scene setup; inspection camera.

![E bed-after-inspection phone](screenshots/e-bed-after-inspection-phone.png)

[SEEN] OK — bed-after-inspection, phone; QA position/scene setup; inspection camera.

![E traffic-lineup desktop](screenshots/e-traffic-lineup-desktop.png)

[SEEN] OK — traffic-lineup, desktop; QA position/scene setup; normal orbit camera.

![E traffic-lineup phone](screenshots/e-traffic-lineup-phone.png)

[SEEN] BAD — traffic-lineup, phone; QA position/scene setup; normal orbit camera.

![E traffic-lineup-inspection desktop](screenshots/e-traffic-lineup-inspection-desktop.png)

[SEEN] BAD — traffic-lineup-inspection, desktop; QA position/scene setup; inspection camera; too far away, use the seven closeups above.

![E traffic-lineup-inspection phone](screenshots/e-traffic-lineup-inspection-phone.png)

[SEEN] BAD — traffic-lineup-inspection, phone; QA position/scene setup; inspection camera; too far away, use the seven closeups above.

![E garage-paints desktop](screenshots/e-garage-paints-desktop.png)

[SEEN] OK — garage-paints, desktop; actual Garage after real +10 earned load; ten visible paints; prior QA scene setup.

![E garage-paints phone](screenshots/e-garage-paints-phone.png)

[SEEN] OK — garage-paints, phone; actual Garage after real +10 earned load; ten visible paints; prior QA scene setup.

![E parked-car-inspection desktop](screenshots/e-parked-car-inspection-desktop.png)

[SEEN] OK — parked-car-inspection, desktop; QA position/scene setup; inspection camera; bucket overlaps parked SUV — strict collision failure.

![E parked-car-inspection phone](screenshots/e-parked-car-inspection-phone.png)

[SEEN] BAD — parked-car-inspection, phone; QA position/scene setup; inspection camera; bucket overlaps parked SUV — strict collision failure.

![barrier contact desktop](screenshots/e-collision-barrier-desktop.png)

[SEEN] OK — barrier contact, desktop; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![barrier contact phone](screenshots/e-collision-barrier-phone.png)

[SEEN] OK — barrier contact, phone; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![fence contact desktop](screenshots/e-collision-fence-desktop.png)

[SEEN] OK — fence contact, desktop; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![fence contact phone](screenshots/e-collision-fence-phone.png)

[SEEN] OK — fence contact, phone; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![container contact desktop](screenshots/e-collision-container-desktop.png)

[SEEN] OK — container contact, desktop; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![container contact phone](screenshots/e-collision-container-phone.png)

[SEEN] OK — container contact, phone; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![pile-edge contact desktop](screenshots/e-collision-pile-edge-desktop.png)

[SEEN] OK — pile-edge contact, desktop; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![pile-edge contact phone](screenshots/e-collision-pile-edge-phone.png)

[SEEN] OK — pile-edge contact, phone; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![parked-car contact desktop](screenshots/e-collision-parked-car-desktop.png)

[SEEN] BAD — parked-car contact, desktop; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.

![parked-car contact phone](screenshots/e-collision-parked-car-phone.png)

[SEEN] BAD — parked-car contact, phone; QA approach-position setup, then real W and brake. Chassis contact proven; bucket clipping remains, especially parked-car view.


## Final fresh-player check — normal URL, empty storage

![Final L1 start desktop](screenshots/e-smoke-l1-start-desktop.png)

[SEEN] OK — final L1 start, desktop; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 start phone](screenshots/e-smoke-l1-start-phone.png)

[SEEN] OK — final L1 start, phone; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 mid desktop](screenshots/e-smoke-l1-mid-desktop.png)

[SEEN] OK — final L1 mid, desktop; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 mid phone](screenshots/e-smoke-l1-mid-phone.png)

[SEEN] OK — final L1 mid, phone; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 result desktop](screenshots/e-smoke-l1-result-desktop.png)

[SEEN] OK — final L1 result, desktop; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 result phone](screenshots/e-smoke-l1-result-phone.png)

[SEEN] OK — final L1 result, phone; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 next-l2 desktop](screenshots/e-smoke-l1-next-l2-desktop.png)

[SEEN] OK — final L1 next-l2, desktop; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

![Final L1 next-l2 phone](screenshots/e-smoke-l1-next-l2-phone.png)

[SEEN] OK — final L1 next-l2, phone; normal URL, fresh storage, real keys and NEXT click, NO setup shortcuts. Result +242 with bonus; capture time affects time-based payout.

