# TerraForm 3D

A 3D backhoe-loader construction game for the browser / CrazyGames portal. All art is
generated in code with Three.js — no external images, fonts or audio files. Physics is
Rapier3D. Fifteen hand-authored levels, a free-play stunt park, a garage with six
four-step upgrades, and touch + keyboard controls.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ (relative asset paths, ready for a static portal upload)
npm run preview    # serve dist/
```

Open `?unlockall` to unlock every level for QA, `?qadebug` for the debug overlay,
and `?fakeads` to exercise the ad wrapper outside the CrazyGames portal.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Drive / steer | `W` `A` `S` `D` (or arrows) | left joystick |
| Brake | `Space` | `BRK` |
| Scoop / dig / grip (1.6 s hold) | `F` | amber `SCOOP` button |
| Dump / place / drop (1.2 s hold) | `G` | blue `DUMP` button |
| Raise / lower bucket | `E` / `Q` | — |
| Camera, zoom, map, sound, pause | `C`, `+`/`-`, `M`, `N`, `Esc` | right icon stack |

Settings include BIG BUTTONS, LEFT-HANDED (swap joystick/action sides), GUIDE ARROWS,
volume sliders and a LOW/MED/HIGH graphics preset. There is no rotate-your-phone
overlay; both orientations are fully playable.

## Quality assurance

Every check below runs against **real Chromium 153** (`@sparticuz/chromium` +
`playwright-core`) serving the built `dist/`. See `docs/QA_EVIDENCE.txt`,
`docs/QA_PERF.txt`, `docs/QA_SESSION_LOG.txt` and `docs/DEPTH_REPORT.md`.

```bash
node scripts/contrast-check.mjs     # WCAG contrast, 11 screens, 0 failures
node scripts/layout-check.mjs       # 5 viewport sizes, 0 overlaps / 0 clipped
node scripts/button-check.mjs       # 52 real clicks, keys, mouse, two-finger
node scripts/level-walk.mjs         # all 15 levels, 3 scoops + 3 dumps, negative tests
node scripts/perf-check.mjs         # fps / draw calls / reverse beeper / sound bed
node scripts/sdk-check.mjs          # zero "CrazySDK is not initialized yet"
node scripts/screenshots.mjs        # 18 named screenshots
node scripts/contact-sheet.mjs      # 15 stage frames + contact sheet
node scripts/session.mjs            # 10-minute scripted play with full console log
```

## Screenshots

`docs/screenshots/` holds 18 named PNGs (`01-start.png` … `17-phone-swap-sides.png`
plus `11b-truck-closeup.png`), 15 `level-XX.png` frames, 15 `level-XX-30s.png`
frames and `levels-contact-sheet.png`. See `docs/screenshots/README.md`.

## Layout of the source

| Path | What it is |
| --- | --- |
| `index.html` | loading screen, single `:root` theme, SDK script tag |
| `src/main.js` | glue: renderer, physics, input, game states, QA hooks |
| `src/ui/Menus.js` | one window layer: start/pause/settings/help/levels/garage/result/fail/confirm/map |
| `src/ui/GameUI.js` | HUD v8: joystick, action buttons, speedometer, minimap, toasts |
| `src/core/` | Camera, Audio, Ads, Portal, World, Input, FX, quality |
| `src/gameplay/` | `Levels.js` (goal engine), `Stages.js` (15 distinct environments), `Jobs.js` (economy), `StuntPark.js`, `Guidance.js` |
| `src/vehicle/` | backhoe mesh, bucket, dig animator |
| `scripts/` | real-browser QA harnesses |
| `docs/` | evidence, screenshots, depth report |
| `src/docs/` | design spec and handoff notes |
