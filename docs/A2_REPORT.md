# A2 visual checkpoint — 2026-11-06

[RAN] Branch `arena/06e604a9-gameprotype`; baseline `5ac28a7`, merged PR #5. New work cannot retroactively become part of that merged diff.

[SEEN] Matched BEFORE/AFTER pairs lead SCREENSHOTS.md for A2.1–A2.8. Every retained A2 image was opened, including intermediate diagnostics. Captions disclose QA setup, touch emulation, non-synchronized blurred menu backgrounds and historical filmstrip reuse.

[RAN] npm ci: 40 packages / no reported vulnerabilities. Production builds pass. No runtime packages added. Two application JavaScript bundles total about 5.4 MB uncompressed, plus the small HTML file. Standard Vite large-chunk/config warnings remain. No configured npm unit-test suite; browser scripts are the executed checks.

[RAN] a2-views.mjs: baseline and revised real Chromium renders at matched poses, including real F/G holds. Browser error logs empty. a2-extras.mjs: normal URL/fresh storage/real PLAY and W drive; initial pile distance 21.8888 m, truck 40.8915 m. This is not a full level completion. Separate touch contexts reported maxTouchPoints=1 and active touch controls at 844×390 and 390×844. Real sound taps passed ON/OFF/ON; Garage paint count=10.

[RAN] First extras attempt ended because closing the last Chromium context terminates this single-process browser. Harness lifecycle fixed, partial fresh-drive evidence retained, touch/menu checks successfully re-run. No app error was observed. a2-phone-layout.mjs checks speed/action/joystick and map/tool separation and eventual level-toast disappearance; its zero-height toast-wrapper sample is NOT a measurement of active toast overlap.

[READ] Camera base offset is 12 m behind / 6 m above with look target 4 m forward and 0.8 m up. Desktop base FOV widened to 82 to keep the machine compact; portrait keeps FOV 65 and a longer distance multiplier. Existing obstruction code remains, not an exhaustive new collision proof. Soil clods use radii 0.08–0.1 m with small scale variation. Rear folded tool is visual, not a newly simulated excavator.

[SEEN] A2.1 GOOD: rear assembly and backhoe details recognizable. A2.2 OK: compact chase and unobstructed matched dump. A2.3 GOOD: both targets visible in normal fresh play and after actual forward driving. A2.4 OK with phone layout iteration: actual touch proof revealed speed/dump overlap, fixed by lifting portrait speed and moving its tools into a row; screenshots retaken. A2.5 OK: windows/roof boxes, grass/road/soil improvements; giant orange scoreboard removed. A2.6 BAD for full acceptance: no pile/truck in L2, but L3 holes still read as rings. A2.7 OK: explicit states, AUTO and NOW/NEXT values, unaffordable styling and unclipped wrapped paints. A2.8 GOOD: two-line 18 px captions, same old frames re-used strictly as a layout comparison.

[UNKNOWN] Controlled five-second quality downgrade timing, every sign/lamp, exhaustive camera clearance, physical iPhone, and complete post-A2 level replay are unverified. Existing bucket/prop penetration, rewarded flows and optional cleanup failures remain. No fresh overall acceptance score is claimed; old 18/21 is historical.

[READ] Next requested order: after pushing and posting this A2 gallery checkpoint, Tier 2 group 1 (including actual visible L3 depressions), groups 2 and 3, D, E, then optional F. Not yet replayed in this checkpoint.
