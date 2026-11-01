# HANDOFF v2 - TerraForm 3D (backhoe simulator for CrazyGames)

ONE file. Stable rules first, LIVE STATE at the end (section 17). A new AI needs only this file.
Version 2, written 2026-11-01. VERIFIED = read from real source or docs. UNVERIFIED = not seen, do not rely on it.
Any example below that shows Executor markers is indented 4 spaces on purpose, so this file can be applied safely. In a real message the marker lines start in the first column.

---

## 0. START HERE (new host AI)

You are the HOST AI (Claude, ChatGPT, Gemini or similar). The user cannot read code and does NOT run terminal commands. The user can only copy, paste, click and report what they see (screenshots, console text).
Your job: architect, QA lead, prompt writer, release manager. DeepSeek writes big code. You write small exact edits. The Executor applies everything safely.

First 5 steps in a new chat:
1. Read this whole file, especially sections 3, 6, 7 and 17.
2. Say in 5 lines what you understood: phase, last action, what is applied, what is unproven, next task.
3. Ask for nothing the file already tells you. If you need a real source file, tell the user exactly which file to tick in Executor tab 3 and to paste it into the chat (section 3).
4. Never claim "fixed" without evidence (section 12). Write "applied, awaiting your test".
5. After any change in status, give a LIVE STATE update block (section 18).

Message the user pastes into a new host AI chat, followed by this file:

    You are the host AI for my game project. I am not technical and I do not use the terminal.
    Read the handoff file I paste next. Then tell me in 5 lines where we are and what the next step is.
    Give me steps that use only the Executor tabs and copy-paste, and always say exactly which file to
    copy and where to paste it. Anything I must paste into DeepSeek goes in ONE code block.
    Write small code edits yourself as Executor blocks from the real files I paste. Use DeepSeek only for big new code.
    After every answer that changes something, give me an update block for the LIVE STATE section.

---

## 1. The project

A 3D browser game: drive a yellow backhoe loader in a low-poly city, scoop dirt from a pile, dump it into a blue truck, earn coins, buy engine and hydraulic upgrades. Goal: get accepted on CrazyGames (rejected 10 times with earlier games).
Stack: Three.js, Rapier (`@dimforge/rapier3d-compat`, NOT cannon-es), Vite, plain JavaScript ES modules. Dev host: GitHub Codespace `testsharm/gameprotype`, branch `main`, project root `/workspaces/gameprotype`.
Name caution: the user says "JCB". That is very likely a trademark. Never show "JCB" to players or CrazyGames (title, HUD, store text). Say "backhoe loader". Internal names like the events `jcb-dig` and `jcb-hint` are fine.

---

## 2. Roles

| Who | Does | Must not |
|---|---|---|
| User (Kandel) | Copies, pastes, clicks, plays, reports with screenshots | Edit code by hand, use the terminal, run scripts |
| Host AI | Plans, reads pasted files, writes exact EDIT blocks (small), writes DeepSeek prompts (big), finds root causes, keeps LIVE STATE current | Guess file contents, say "done" without evidence, hand out terminal commands |
| DeepSeek (web chat) | Writes large new code as Executor blocks, only blocks, in one code block | Explain, plan, invent files, guess old text |
| Executor v3 | Applies blocks, syntax-checks, backs up, builds, saves to GitHub | See the browser, run the game, delete files |
| Gemini (optional) | Visual mockups as HTML | Be trusted for facts |
| CrazyGames docs | Only truth for requirements | - |

Who writes what (lesson learned): small glue code (about 40 lines or less, hooking a module, one-line changes) is written by the HOST AI as an EDIT block from the real file text the user pasted. That worked first time. DeepSeek failed on exact FIND text again and again. DeepSeek is used for large new modules where there is no exact old text to match.

---

## 3. The user and how to talk to them (important)

- Not technical. Types fast with typos. Gets frustrated when instructions are unclear about WHICH file to copy and WHERE to paste. Stay calm, no long apologies, fix fast.
- Never give terminal commands. If you need facts about a file, ask the user to open Executor tab 3, tick the file, click "Copy selected" and paste it into THIS chat. If a message is too long to send, one file per message.
- Every instruction block uses numbered steps and names the exact tab, button and file.
- Everything the user must copy goes in a code block (prompts for DeepSeek, Executor blocks).
- Say clearly when NOTHING is needed from the user right now.
- One task at a time. End with: what to test, what "works" looks like, what to do if it fails (Undo last apply).
- DeepSeek answers must come as ONE code block so one click copies it. DeepSeek often ignores this. The user can send: "Put your whole answer in one code block." The Executor ignores fences outside blocks, so a code-block answer is safe to paste.

---

## 4. Executor v3 (VERIFIED from its reference, 2026-11-01)

Node page on port 3002 (`nohup node tools/executor.cjs > .executor.log 2>&1 &`). Live game port 5173 (`npm run dev -- --host`). Production preview port 4173 (`npm run build && npx vite preview --host --port 4173`). Keep all ports Private. The user opens them from the VS Code Ports tab.

Block formats (marker lines start in the first column, single spaces):

    @@@ FILE path/to/file.js @@@
    (complete file)
    @@@ END @@@

    @@@ EDIT path/to/file.js @@@
    --- FIND ---
    (exact old text, appears exactly once)
    --- REPLACE ---
    (new text)
    --- FIND ---
    (second old text)
    --- REPLACE ---
    (second new text)
    @@@ END @@@

Rules it enforces: all-or-nothing; ONE `@@@ END @@@` per block at the very end (never after each pair); number of block starts must equal number of END lines; each FIND must match exactly once; pairs apply in order and each FIND is searched in the file AFTER the earlier pairs changed it; syntax check only for .js .mjs .cjs .json (HTML and CSS unchecked); a file that would shrink under 50% is refused unless the shrink box is ticked; code fences outside blocks are ignored, inside a block they are written into the file; paths relative with forward slashes; cannot delete or rename files; cannot write images or sounds.

Tabs: 1 Apply (paste, Preview, Apply, Undo, Copy rules, Clear). 2 Status (21 listed features "connected" = another file mentions the name, NOT proof it works; GitHub state; restore points). 3 Files (filter, tick, Copy selected as FILE blocks; lists only index.html, package.json, vite.config.js and src/). 4 Check project, Run build check, four save buttons ("Before changes", "Game works", ...), Test connection, Show server log.

Messages and what they mean:
- `APPLIED ... Syntax check passed` = files parse. NOT proof the game runs. A missing import or undefined name passes this check and crashes in the browser.
- `FIND text was found 0 times` = the old text is not in the file. Either DeepSeek guessed, or the same block was ALREADY applied (the old text is gone). Nothing was written. Harmless. Never click Undo for this.
- Check the line counts in Preview and Apply. `706 -> 665 lines` after a change that should ADD code means code was deleted. Undo and investigate (this happened once: a FIND that held a whole block with a REPLACE that dropped it).
- `Incomplete answer: found N block starts but only M with an END line` = DeepSeek cut off or wrote `--- END @@@` markers that do not exist.
- Undo last apply restores the newest apply. Status lists the last 15 restore points. Backups are local to the Codespace, GitHub is the real safety net.

TEST ON PORT 5173. Port 4173 is a stale production build: it shows the OLD game until the user clicks "Run build check" in tab 4 and refreshes that page. A console file name like `index-ef75RmIj.js` means the user is looking at the 4173 build. (This confused one mobile test.)

---

## 5. The working loop v2 (every task)

1. Host AI picks the next task from section 15 and LIVE STATE.
2. If it needs real code, host AI tells the user which files to tick in tab 3 and paste into the chat. Host AI never edits a file it has not seen in this chat or in this file.
3. Small change: host AI writes the EDIT block itself, user pastes it in tab 1. Big change: host AI writes a DeepSeek prompt (section 7) and says which file to attach.
4. User: Preview, check the line counts, Apply, tab 4 Check project, reload port 5173, test.
5. User reports works / does not work with a screenshot or red console text.
6. Host AI judges evidence, gives a LIVE STATE update, closes the task or writes a small fix.
7. On success user clicks "Game works" (tab 4) = commit and push.

Safety rules: one concern per task. After every Apply the game must still start. If not, Undo first, diagnose second. Do not add files unless the roadmap says so.

When the host AI has a code tool, verify its own EDIT blocks before giving them: save the pasted file to disk, count FIND occurrences (must be 1), apply the pairs in order in a script, run `node --check` on the result. Do the same for DeepSeek answers the user pastes back. This replicates the Executor and catches 90% of refusals.

---

## 6. Lessons learned (mistakes already made, do not repeat)

1. DeepSeek received rules only, or a task card with no file. It then asked for the task, or INVENTED edits (random `dig` and `dm.was` lines). Fix: three parts in order every time (rules, file, task). Section 7.
2. DeepSeek invented marker lines (`--- END @@@` after every pair). Fix: the rules prompt shows a correct example and lists wrong examples.
3. FIND text typed from memory or guessed by the host AI (first P1.1 card) found 0 matches. Fix: FIND text only from the real file.
4. The same block pasted twice gave "found 0 times". It is the Executor protecting the file. Check the file with Files tab or grep-like evidence before re-sending.
5. A task card got cut off when pasted ("If any name below a"). Always paste the complete card, check its last line.
6. A "replace helper block with nothing" edit passed the syntax check and would have crashed at runtime. Always read the line counts and the REPLACE side.
7. Terminal commands were never run by the user. Use Files tab copy-paste instead.
8. Looking at port 4173 hid new changes. Use 5173.
9. Long notes and long chats: the DeepSeek web chat shows "Length limit reached" on big projects. New chat per task, DeepThink OFF for copy work, one or two files.
10. Check project cannot see a missing `import * as THREE from 'three'` or a class used but never imported. Those show as `X is not defined` in the F12 console.

---

## 7. DeepSeek protocol

When to use DeepSeek: large new code (a new module, a big feature). Not for one-line changes.

Message order (one chat per task, DeepThink OFF):
- Message 1: the MASTER RULES below (once per chat).
- Message 2: the file(s) from tab 3, Copy selected.
- Message 3: the task card. Messages 2 and 3 may be one message (file first, card under it).
If DeepSeek replies asking for the task, it only had the rules. Send the file and the card.
If DeepSeek answers `NEED: ...`, it could not find something. Send that line to the host AI.
If DeepSeek answers in plain text, tell it: "Put your whole answer in one code block."

MASTER RULES (paste as message 1):

    READ THIS FIRST. A program reads your answer automatically. One wrong marker line, one wrong character
    in a FIND text, or a missing END line and your WHOLE answer is thrown away. Be a careful copy machine,
    not a designer. Do not improve, rename, refactor, reformat, explain, run or test anything.
    Only the two block types below exist.
    Type 1, create or replace a whole file (complete file, never a part):
    @@@ FILE path/to/file.js @@@
    (complete file contents)
    @@@ END @@@
    Type 2, change parts of a file. ONE block holds ALL changes for that file:
    @@@ EDIT path/to/file.js @@@
    --- FIND ---
    (exact old text 1)
    --- REPLACE ---
    (new text 1)
    --- FIND ---
    (exact old text 2)
    --- REPLACE ---
    (new text 2)
    @@@ END @@@
    WRONG: an END after every pair; the made-up line "--- END @@@"; no final END; '...' or '// unchanged';
    three backticks inside a block; a FIND text typed from memory.
    MARKER RULES: only these markers exist: @@@ EDIT path @@@, @@@ FILE path @@@, @@@ END @@@,
    --- FIND ---, --- REPLACE ---. Each marker is alone on its line, first column. Exactly ONE END per block,
    at its end. Path relative, forward slashes. Each FIND is copied character for character from the
    attached file and appears EXACTLY ONCE (add a neighbouring line to make it unique, keep FIND short).
    Pairs apply in order; never use text an earlier pair changed. New code must be valid JavaScript.
    IF YOU CANNOT DO IT SAFELY answer only with a code block containing one line: NEED: (what is missing).
    OUTPUT: your ENTIRE answer in ONE code block (a line of three backticks, the blocks, a line of three
    backticks). Nothing before or after. No headings, no bold, no explanation. If you run out of space,
    stop after a finished block and write CONTINUE.
    SELF-CHECK (silent): every FIND exists once in the file; one END per block; no made-up markers; braces
    balance; every new name declared once and not clashing; only what the task asked was touched.
    Now wait for the files and the task.

(The Executor "Copy rules for DeepSeek" button also works, but the text above is stricter.)

TASK CARD template (host AI fills it, DeepSeek must make no decisions):

    TASK ID / TITLE:
    PROJECT: Three.js + Rapier + Vite, plain JS ES modules. File(s) attached above. Change ONLY: (list).
    BACKGROUND: (why, 2 to 4 lines)
    METHOD: STEP A find the real lines (give approximate line numbers). STEP B check names do not exist
            (list them, rename with prefix fx if they do). STEP C write the pairs. STEP D self-check.
    PAIRS: exact FIND (copied from the real file) and exact REPLACE, numbered, in order.
    DO NOT: touch other lines or files, add packages or files, reformat, add comments to old code,
            use cannon-es, load external fonts or images, add a fullscreen button, add links, write "JCB" in visible text.
    SELF-CHECK: 6 to 8 yes/no lines.
    OUTPUT: one code block with the blocks only.

Common DeepSeek failures: shrinks big files; wrong physics library; changes export default to named export; forgets `import * as THREE`; invents files; DeepThink hits the length limit; stops mid-block; guesses FIND text.

---

## 8. Mobile and device testing

The user has no phone. Use Chrome device emulation on port 5173: F12, Ctrl+Shift+M, pick a phone, then RELOAD the page (MobileControls decides touch mode once at load, so toggling without reload shows nothing). A real phone or the CrazyGames QA tool is needed for final iOS audio and Safari proof (UNVERIFIED so far).
Console noise that is normal: "AudioContext was not allowed to start" before the first click; `favicon.ico 404` (low priority, add a favicon later); "Unsafe attempt to load URL github.dev/pf-signin" (Codespaces page, ignore).

---

## 9. CrazyGames requirements (VERIFIED 2026-11-01 from docs.crazygames.com)

Read: /requirements/intro, technical, gameplay, quality, /resources/basic-launch-metrics. NOT read yet: /requirements/ads, game-covers, account-integration, /sdk/game, /sdk/user, /sdk/data, /resources/getting-to-the-first-frame, /resources/html5/common-fixes. Read the relevant page before its phase.

Two-step launch: Basic Launch needs no SDK, ads disabled. It lasts until the game has been live 7 days AND has 500 plays, or 21 days if under 500 plays. Strong results move to Full Launch (SDK and ads required). KPIs: average play time 10+ min, day-1 retention 10 to 15%, 80%+ of plays reach 1 minute (load under 10 s, build under 20 MB).
Technical: initial download at most 50 MB (20 MB for the mobile homepage), total 250 MB, at most 1500 files. With the SDK, size counts until the first `gameplayStart`. Externally loaded files: time to gameplay at most 20 s. Relative paths only (`base: './'`). Chrome and Edge must work; Safari and Chromebook (4 GB) poor performance gets the game disabled there. Mouse, keyboard and touch. Do NOT write orientation lock logic and no rotate overlay (the site asks to rotate). Add `user-select:none` (+ vendor prefixes) on body. Respect safe areas. iOS audio: call `audioContext.resume()` inside a touchend or click handler; a visibilitychange listener alone is not enough.
Gameplay: text readable at devicePixelRatio 1 in iframe sizes 907x510, 1216x684, 1077x606, 821x462, 1366x768, 1920x1080, 1536x864, 1280x720, 800x450 (mobile), 1080x607 (tablet). Physics must behave the same at 144 Hz and 165 Hz. English required. Avoid Escape and Ctrl+W as controls; prefer layouts that survive AZERTY. No custom fullscreen button. No cross-promotion of other games or platforms. PEGI 12 (audience 13+). Original names and assets.
Full Launch extras: land in gameplay in at most 1 click, skippable visual onboarding, consistent art style (not mixing realistic and cartoon), consistent audio levels, easy to extend with levels.

---

## 10. Quality bar

Art: stylized low-poly, flat-shaded, soft light, one consistent look. Palette: asphalt #2b2f36, sidewalk #8b8f97, grass #3f6b2f to #5a8a3a, machine yellow #f5b301, truck blue #1d4ed8, UI navy glass rgba(15,23,42,0.75), accent amber #fbbf24.
UI: system-ui font only, 16 px minimum, 44 px touch targets, never cover the screen center, English strings in one place, no delays on buttons.
Audio: one master chain, music about 12 dB below effects, ducking on dump, mute button, resume on touchend, nothing plays before the first user input.
Feel: every action gets visual, sound and a small physical response within 100 ms. Camera shake under 0.1 units. Arm motion eased.
Budgets: 60 FPS on the developer laptop, 30 FPS with Chrome CPU throttled 4x, under 300 draw calls, first frame under 5 s, gameplay under 10 s, build under 20 MB, under 1500 files.

---

## 11. Known issues and risks

Severity H = likely rejection, M = quality, L = polish. Status here is the latest; LIVE STATE (section 17) wins on conflict.

| ID | Sev | Issue | Status |
|---|---|---|---|
| R1 | H | Physics speed depended on frame rate (world.step once per frame) | FIXED IN CODE (accumulator, 60 steps/s). Proof pending: console `__testTimestep()` shows about 60.0 on every row |
| R2 | H | Distant flicker on road lines and building edges. Tried: logarithmic depth buffer, near 1 far 900, MSAA 4 on composer targets, anisotropy. Still flickers per user | OPEN. P1.2 |
| R3 | H | Five audio systems, levels unbalanced, no iOS resume | PARTLY. AudioHub pauses, resumes and unlocks all contexts. Levels, mute button, duplicate sounds still open. Sfx2.js never read |
| R4 | H | Modules built but not connected | Portal DONE (minimal), MobileControls DONE (not visually confirmed), LevelSystem, SkillCourse, WorldPolish NOT connected |
| R5 | M | Duplicate HUD: old UPGRADES, RESTART JOB, W A S D E F key pad shown next to new GameUI and the new touch controls | OPEN. P1.6 and P1.5b |
| R6 | M | MobileControls still has the "Rotate your phone" overlay (Play anyway button). CrazyGames does orientation | OPEN. P1.5b |
| R7 | M | Keys used e.key (AZERTY fails) | FIXED IN CODE (normKey uses e.code). Other files may still read e.key |
| R8 | M | Word "JCB" in visible text | OPEN. P1.6 (only events jcb-dig, jcb-hint seen in main.js, other folders not searched) |
| R9 | M | Performance on 4 GB Chromebook unknown | OPEN. P1.7 |
| R10 | M | Build size and file count never measured | OPEN. tab 4 Run build check |
| R11 | M | Scoop and dump animation judged jerky (smoothing patch dm.* in main.js, not confirmed) | UNCONFIRMED |
| R12 | L | Executor is blind to the browser | X1 |
| R13 | L | MissionManager.js maybe dead code | unknown |
| R14 | M | logarithmicDepthBuffer true can cost speed and clash with post-processing | decide in P1.2 |
| R15 | M | Truck collider created once, truck stays fixed | rule |
| R16 | M | Progress is saved only to localStorage with try/catch. Portal.save/load (SDK data with fallback) not wired | OPEN. P1.3b |
| R17 | L | Visuals update 60 times per second physics on 144 Hz screens, may look slightly steppy | P1.1b (interpolation) |
| R18 | L | LevelSystem.toJSON returns a constant; MobileControls.destroy cannot remove bound listeners | fix when connecting P2.1 |

---

## 12. Evidence rules (when a task counts as done)

1. Executor said "Syntax check passed" and the Preview line counts make sense.
2. Tab 4 Check project: all files OK.
3. Game reloads on port 5173 with no red errors in the F12 console.
4. The user confirms every acceptance line with a screenshot, console text, or a clear yes/no.
5. Performance or size tasks: numbers pasted (FPS, MB).
6. LIVE STATE updated and "Game works" clicked.
Host wording: "applied, awaiting your test" until evidence arrives. Never invent file contents, line numbers or console output.

---

## 13. Code map (VERIFIED for the files marked V; others as last known)

| File | Purpose |
|---|---|
| `index.html` | HUD markup and styles, loading screen `#loading-screen`, shop overlay. Not seen in this chat |
| `src/main.js` (V, about 753 lines) | Scene, camera, renderer (logarithmic depth), composer (bloom, vignette), quality presets, input (`input` object, `normKey(e)`), save data, shop, minimap, `updateDig`, `updateUi`, `updateFx`, fixed-timestep block, `animate()`, `window.restartJob`, `new Portal()`, `new MobileControls(input, {...})` |
| `src/audio/AudioHub.js` (V, new) | Wraps `window.AudioContext`, tracks every context, `__audioHub.hold/release/states()`. Imported FIRST in main.js so it installs before other audio code |
| `src/core/Portal.js` (V) | `export class Portal` (init, loadingStart/Stop, gameplayStart/Stop, happytime, requestMidgame, requestRewarded, save/load, onPause/onResume/onAdStart/onAdEnd) and `export class LoadingScreen` (NOT used; it would rewrite `#loading-screen`) |
| `src/ui/MobileControls.js` (V) | default export class, touch only (`pointer: coarse` or ontouchstart). Joystick zone, DIG/DUMP, BRAKE, CAM, MENU, rotate overlay |
| `src/gameplay/LevelSystem.js` (V) | default export class. 5 levels, environments, props, menu, completion card. NOT connected |
| `src/audio/AudioManager.js`, `SoundFX.js`, `Music.js`, `DigSound.js` (V) | Each makes its own AudioContext. `Sfx2.js` not read |
| `src/core/World.js` | City, job site, traffic (own requestAnimationFrame), lights, `createPhysicsColliders`. Not re-read |
| `src/vehicle/Vehicle.js`, `DigAnimator.js` | Backhoe and Rapier controller, dig animation |
| `src/core/CameraManager.js`, `QAManager.js`, `TrafficPhysics.js`, `MissionManager.js` | Cameras (modes chase, orbit, cab, bucket), diagnostics, traffic colliders, unknown |
| `src/gameplay/JobEffects.js`, `Guidance.js`, `JobManager.js`, `SkillCourse.js` | Effects, guidance, timer and stars, obstacle course (NOT connected) |
| `src/ui/GameUI.js` | Job card, timer, coin pill, toasts, speed gauge |
| `src/core/WorldPolish.js` | NOT connected |
| `tools/executor.cjs`, `src/docs/HANDOFF.md`, `src/docs/STATE.md` | Executor and these docs |

Wiring facts in main.js (V): `portalPaused`, `portalHold`, `portalRelease` call `audioHub.hold('portal')` and `audioHub.release('portal')`; `animate()` skips its body when `portalPaused`; shop open calls `portal.gameplayStop()`, shop close calls `portal.gameplayStart()`; `window.CrazyGames.SDK.game.happytime()` is still called directly in try/catch at job complete; `mobileControls.onMenu` clicks `#shop-btn`; `onCamera` cycles `cameraManager` modes.

---

## 14. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-11-01 | Docs in `src/docs/` | Files tab lists only src/ and 3 root files |
| 2026-11-01 | Basic Launch QA first, ads in Phase 4 | Ads disabled in Basic Launch |
| 2026-11-01 | No terminal for the user | The user does not run commands |
| 2026-11-01 | Host AI writes small EDIT blocks itself from real files, DeepSeek only for big new code | DeepSeek failed exact FIND text repeatedly |
| 2026-11-01 | DeepSeek answers in ONE code block, rules prompt has right and wrong examples | Easy copy, fewer marker mistakes |
| 2026-11-01 | One audio hub (AudioHub wraps AudioContext) instead of rewriting five audio files | Smallest safe change |
| 2026-11-01 | Single combined handoff with a LIVE STATE section updated by EDIT blocks | One paste for any new AI |
| 2026-11-01 | Remove rotate overlay (planned) | CrazyGames handles orientation |
| 2026-11-01 | Avoid the word JCB in visible text | Probable trademark |
| Earlier | Truck stays fixed; Rapier not cannon-es; new small files over big rewrites | Collider created once; project stack; chat limits |

---

## 15. Roadmap (IDs are stable, statuses in LIVE STATE)

Phase 0: P0.1 Executor v3 running. P0.2 Status, Check project, build size. P0.3 baseline commit ("Before changes" or "Game works"). P0.4 docs installed.
Phase 1, pass Basic Launch QA:
- P1.1 fixed timestep. P1.1b optional render interpolation for 144 Hz.
- P1.2 flicker. Plan: first add URL switches by a small EDIT (for example `?nobloom`, `?noshadow`, `?nolog`, `?noaa`), so the user tests by changing the address, no console typing. Then fix what the experiment proves.
- P1.3 Portal. P1.3a done (SDK, loading and gameplay events, auto-pause). P1.3b: save and load progress through `portal.save/load` with the existing localStorage key as fallback; replace the direct `happytime()` call with `portal.happytime()`; decide about LoadingScreen (keep the current `#loading-screen`).
- P1.4 audio. P1.4a AudioHub done. P1.4b mute button, master volume, level balance (read Sfx2.js first), duck music on dump.
- P1.5 mobile. P1.5a keys done. P1.5 connect done. P1.5b hide the old W A S D E F key pad and old buttons when `body.touch-mode` is set, remove the rotate overlay and its `orientationchange` code, set `user-select:none` on body.
- P1.6 HUD cleanup: duplicate HUD, readable at 800x450 and DPR 1, no fullscreen button, no "JCB" in visible text, no external links, favicon. Needs `index.html` and `GameUI.js` pasted.
- P1.7 performance (draw calls, FPS with CPU 4x throttle, quality presets, build under 20 MB).
- P1.8 scoop and dump feel.
Phase 2, depth for 10+ minute sessions: P2.1 LevelSystem connected (game still starts directly in job 1), P2.2 WorldPolish, P2.3 economy and daily bonus, P2.4 SkillCourse, P2.5 onboarding (visual, skippable, inside gameplay).
Phase 3, submission pack: read game-covers and getting-to-the-first-frame first; covers, video, description; test all iframe sizes, Chrome and Edge, throttled profile, QA tool; final dist build (`base: './'`).
Phase 4, Full Launch only after selection: read ads and SDK pages first; midgame and rewarded ads with ad-block fallback; mute during ads (hub already holds audio on `portal.onAdStart`).
Executor track: X1 runtime telemetry (errors and FPS posted to the Executor), X2 optional DeepSeek API mode (needs user decision, account, key, spending cap, verify model names and prices), X3 DELETE block.

---

## 16. DeepSeek facts (UNVERIFIED)

Third-party pages (June to October 2026) mention API models `deepseek-v4-flash` and `deepseek-v4-pro` with 1M context and large output, and older aliases retired. Web chat limits are unknown. The user's experience is the ground truth: "Length limit reached" appears on big projects, long thinking and long answers. Working budget: about 20K tokens per chat, one concern, one or two files, DeepThink OFF. Verify at api-docs.deepseek.com before relying on any number.

---

## 17. LIVE STATE (update this section only, with EDIT blocks)

Last updated: 2026-11-01 (about 14:30 Codespace time).

Phase: 1 (Basic Launch QA). Last action: AudioHub applied. Main.js is about 753 lines.

| ID | Task | Status |
|---|---|---|
| P0.1 | Executor v3 running | DONE |
| P0.2 | Status, Check project, build size | PARTLY DONE. Build size not measured |
| P0.3 | Baseline commit | WAITING FOR USER (click "Game works" or "Before changes" in tab 4) |
| P0.4 | Docs installed in src/docs | DONE (this file replaces the old HANDOFF.md and STATE.md) |
| P1.1 | Fixed timestep | APPLIED. Proof pending (`__testTimestep()` about 60.0 on every row) |
| P1.5a | Keys via e.code (normKey) | APPLIED. grep showed normKey in place, test W A S D and space pending |
| P1.3a | Portal minimal | APPLIED (Preview 724 -> 737). Not tested on CrazyGames (SDK only works there) |
| P1.5 | MobileControls connected | APPLIED (737 -> 752). Not visually confirmed: the screenshot was of port 4173 (stale build) |
| P1.4a | AudioHub | APPLIED (752 -> 753). Tab-switch test pending |
| P1.5b | Hide old key pad in touch mode, remove rotate overlay | TODO |
| P1.6 | HUD cleanup | NEXT. Needs index.html and GameUI.js pasted |
| P1.2 | Flicker investigation | TODO |
| P1.3b | Portal save, happytime via portal | TODO |
| P1.4b | Mute button, balance, duck | TODO (read Sfx2.js first) |
| P1.7, P1.8, P1.1b | Performance, scoop feel, interpolation | TODO |
| P2.x | Levels, polish, economy, course, onboarding | TODO |

Next task: P1.6 (and P1.5b with it). Ask the user for `index.html` and `GameUI.js` (tab 3, Copy selected, paste into the chat).
Waiting for the user: tests for P1.1, P1.5a, P1.4a on port 5173; "Game works" save; Run build check numbers; phone-mode screenshot on 5173 after reload; is scoop and dump smooth (R11).
Open decisions: optional DeepSeek API mode (X2).

Last log entries (newest first):
- 2026-11-01: AudioHub applied; combined HANDOFF v2 written. Lessons recorded in section 6.
- 2026-11-01: MobileControls connected (2 pairs). Portal connected (7 pairs). Key fix applied twice (second time after Undo of a faulty DeepSeek edit).
- 2026-11-01: Fixed timestep applied. First DeepSeek attempts refused (guessed FIND text, invented markers).
- 2026-10-31: 28 files pushed to GitHub as the first backup.

---

## 18. How to update this file

- The only part that changes often is section 17. Update it with a small EDIT block, never a full rewrite (the file is big).
- Change one status row: FIND the full old row, REPLACE with the new row. Add a log entry: FIND the line `Last log entries (newest first):` and REPLACE with that line plus the new entry under it. Change the date line the same way.
- Rarely change other sections, and add a row to section 14 when a decision is made.
- Give the user the update block at the end of every answer that changed status. Format:

      STATE UPDATE (paste into Executor tab 1, Preview, Apply)
      @@@ EDIT src/docs/HANDOFF.md @@@
      --- FIND ---
      | P1.6 | HUD cleanup | NEXT. Needs index.html and GameUI.js pasted |
      --- REPLACE ---
      | P1.6 | HUD cleanup | APPLIED, awaiting test |
      @@@ END @@@

  (Indented here. In a real message the marker lines start in the first column.)
- Every FIND must match exactly once. Check section 17 as it stands before writing one.
- When the host AI context runs low: give the final LIVE STATE update plus the message from section 0, and tell the user to paste this file (Executor tab 3, tick `HANDOFF.md`, Copy selected) into the new AI.
