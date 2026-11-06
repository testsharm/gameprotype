# Tier 2 group 1 checkpoint — 2026-11-06

[RAN] Same active branch `arena/06e604a9-gameprotype`, after A2 commit `638d056`. PR #5 remains already merged. No new PR or branch.

[SEEN] L1 yard, L2 cone course and L3 road repair are explicitly compared in t2g1-contact.png. All scene/replay/diagnostic screenshots were opened. L2 has no pile/truck. L3's road now aligns to the actual repair targets and has cut openings, sloped walls, a dark bottom and raised rims. Closeup shows depth; starting-view holes remain distant. The tutorial's driving collider stays flat: no wheel-descent claim. The first grass-over-asphalt failure is retained and graded BAD.

[RAN] Production build passes. T2G1_LOW.txt contains five real-input results: L1–L5. LOW was explicitly selected through the Settings UI, not automatically forced. Unlockall selects initial levels only; readonly telemetry guides actual driving and F/G holds, with no teleport, completion mutation or staged save. Phone replay images resize a desktop context; they do not emulate touch. Separate scene captures use actual CDP touch to show touch controls.

[RAN] L4 negative: WRONG TRUCK visible, loads=0 and cargo retained. L2 follow-up negative: coneHits=1, tipped angle −1.42 radians from real contact, then genuine completion. No own-code errors observed in passing runs.

[READ] Found and fixed real accounting mismatch: JobManager.addLoad always accumulated a default tip even when gate/parking progress explicitly awarded zero to the wallet. addLoad now accepts the actual override and deliverLoad credits exactly its returned tip. Earlier L2 displayed +415 while wallet increase was 345; that old result remains BAD accounting evidence, not acceptance.

[RAN] Post-fix real L2 replay with cone contact: initialWallet=0, finalWallet=220, delta=220, resultShown=220. T2G1_WALLET.txt asserts exact equality. Different stars/bonus from the earlier clean run explain the different base reward. This does not verify rewarded SDK flows or every economy path.

[RAN] Initial AUTO/software-rendered L1 replay made one delivery and then missed the route driver's 65-second deadline on trip two; retained in T2G1_REPLAY.txt and six screenshots. Explicit LOW retry succeeded. This is NOT a default AUTO performance pass and is not erased by the retry.

[UNKNOWN] Worst remaining issues: default AUTO performance on target hardware; distant L3 holes/stray line artifacts and floating landmark art; existing bucket/prop penetration; rewarded SDK flows; physical iPhone and full current L6–L15/D/E/F replay. No new global acceptance score is claimed.

[READ] Next requested order: push/link this group, then Tier 2 group 2 (L6–L10), group 3 (L11–L15), D, E, optional F. Preserve all failures and disclose manual graphics choice in every replay caption.
