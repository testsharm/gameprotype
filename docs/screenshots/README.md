# Screenshots — real Chromium, 2026-11-05

All PNGs in this folder were captured from the built `dist/` running in
**real Chromium 153.0.8010.0** via `playwright-core` + `@sparticuz/chromium`.
They are not mockups. `node scripts/screenshots.mjs` regenerates the 18 named
shots; `AFTER=30 node scripts/contact-sheet.mjs` regenerates the stage frames
and the contact sheet. Both report `RED ERRORS []` (see `docs/QA_EVIDENCE.txt`
for the unfiltered SDK console proof in `scripts/sdk-check.mjs`).

## The 18 named screenshots

| File | Size | What it shows |
| --- | --- | --- |
| `01-start.png` | 1280×720 | Start screen: amber PLAY, steel level cards, garage/settings/help/map buttons, backhoe on the yard behind the menu. |
| `02-play-desktop.png` | 1280×720 | Level 1 First Scoop: dirt pile, blue truck, cones, guidance ring, full HUD. |
| `03-play-portrait.png` | 440×956 | Phone portrait, level 5: joystick left, DUMP/SCOOP right, circular speed, minimap. |
| `04-play-landscape.png` | 844×390 | Phone landscape, level 5: compact icon stack, no rotate overlay, no clipped controls. |
| `05-levels.png` | 1280×720 | LEVELS window: chapter cards, 5 visible level cards, START button. |
| `06-garage.png` | 1280×720 | GARAGE: six 100-coin upgrade cards (engine/hydraulic/bucket/tyres/light/beacon) + paints. |
| `07-settings.png` | 1280×720 | SETTINGS: three volume sliders, LOW graphics, BIG BUTTONS, LEFT-HANDED, GUIDE ARROWS. |
| `08-help.png` | 1280×720 | HOW TO PLAY step 1 with the steel card layout. |
| `09-map.png` | 1280×720 | Square 720×720 site map (`#tf-map-c`), SITE MAP · FIRST SCOOP, pile/truck/vehicle markers. |
| `10-freeplay.png` | 1280×720 | Free Play: no `LOADS LEFT` and **no countdown timer** (matches "No timer · no fail"), coins 0/300, best air 0.0s, rings 0/8. |
| `11-backhoe-closeup.png` | 1280×720 | L1 closeup: backhoe bucket next to the dirt pile. |
| `11b-truck-closeup.png` | 1280×720 | L1 closeup: blue dump truck bed. |
| `12-traffic-lineup.png` | 1280×720 | L5 RUSH HOUR LITE: sepia city skyline, barriers, two lanes of queued traffic cars (the `props:'cars'` stage prop), timed 4:00. |
| `13-result.png` | 1280×720 | JOB COMPLETE: 3 stars, +100 coins. |
| `14-fail.png` | 1280×720 | TIME IS UP: 1 of 3 loads delivered. |
| `15-pause.png` | 1280×720 | PAUSED: six buttons. |
| `16-phone-big-buttons.png` | 440×956 | Phone portrait with BIG BUTTONS on (joystick enlarged) and normal left/right sides. |
| `17-phone-swap-sides.png` | 440×956 | Phone portrait with LEFT-HANDED on (joystick right, actions left), level 5. |

All 18 were opened and visually inspected. `12` and `16` were regenerated after
the traffic-lineup prop fix and the big-buttons isolation fix.

## Stage frames and contact sheet

`level-01.png` … `level-15.png` are the first playable frame of each level;
`level-01-30s.png` … `level-15-30s.png` are the same levels after 30 s of
camera turntable. `levels-contact-sheet.png` (1320×2620) stacks all 15 first
frames with their names. The fresh full `AFTER=30` run produced **15 distinct
ground colours, 15 distinct skyline/landmark pairs, 15 distinct start yaws
and 3 coaching lines per level**, with `RED ERRORS []`.

## Known issues visible in the screenshots (honest)

1. `03`/`04`/`16`/`17` phone shots show level 5, not level 1. That is
   deliberate for the stage-variety check, not a bug.
2. In `level-03.png` the road-work sign is partly behind the minimap at this
   camera angle. It is readable from other angles and does not block input.
3. Headless software WebGL is darker/flatter than a real GPU. Colours and
   shadows will look better in a hardware-accelerated browser.
