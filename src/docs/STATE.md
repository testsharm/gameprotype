# STATE (pointer file)

The live state moved into HANDOFF.md, section 17 (LIVE STATE). This file no longer holds status.
Do not update this file. Update section 17 of src/docs/HANDOFF.md with EDIT blocks (section 18 shows how).

## Snapshot as of 2026-11-01
- Phase 1, Basic Launch QA. Applied: fixed physics timestep, keys by e.code, minimal Portal, MobileControls connected, AudioHub.
- Not proven yet: the tests in HANDOFF.md section 17 (port 5173, not 4173).
- Next task: P1.6 HUD cleanup together with P1.5b (needs index.html and GameUI.js pasted into the chat).
- Not connected yet: LevelSystem, SkillCourse, WorldPolish.
- The user does not use the terminal. Everything goes through Executor tabs and copy-paste.

## Rules that matter most (full list in HANDOFF.md)
- Test on port 5173. Port 4173 shows an old build until Run build check is clicked and the page is refreshed.
- A DeepSeek chat needs three things in order: the rules, the file from tab 3, the task card. Answers must be ONE code block.
- Small code edits are written by the host AI from the real file text. DeepSeek is for big new code only.
- "FIND text was found 0 times" means nothing was written. Often the block was already applied. Do not click Undo for it.
- A line count that drops after a change that should add code means code was deleted. Undo and investigate.
- Never write "fixed" without evidence. Write "applied, awaiting your test".
- Never show the word JCB to players. Say backhoe loader.

## Open items to remember
- Tests pending on port 5173: __testTimestep() (about 60.0 on every row), W A S D and space, tab-switch audio pause.
- Click "Game works" in tab 4 to commit and push everything applied so far.
- Run build check (tab 4) once and note the MB and file count. The limit is 20 MB for mobile.
- Old on-screen key pad and the rotate overlay are still there (tasks P1.6 and P1.5b).

## How to start a new AI chat
1. Executor tab 3, tick only `HANDOFF.md`, click Copy selected.
2. Paste the message from HANDOFF.md section 0, then the copied file.
3. The AI answers in 5 lines. Then continue with the next task.
