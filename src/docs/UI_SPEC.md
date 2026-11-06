# UI SPEC - TerraForm 3D (exact boxes AS BUILT)

> **2026-11-05 QUALITY PASS v3:** the CSS geometry below describes HUD v7 and is
> HISTORICAL. The current HUD is v8 in `src/ui/GameUI.js`. The authoritative
> measurements are now real Chromium rects, not a CSS model:
> `node scripts/layout-check.mjs` covers 1920×1080, 1280×720, 844×390,
> 440×956 and 390×844 (0 overlaps / 0 clipped / 0 sub-48px targets), and
> `node scripts/contrast-check.mjs` covers 172 elements over 11 screens
> (0 WCAG failures). See `docs/QA_EVIDENCE.txt` and `docs/DEPTH_REPORT.md`.

---



Written 2026-11-05. Source of truth: `src/ui/GameUI.js` (HUD CSS) and `src/ui/Menus.js` (windows).
All values are CSS px, measured from the top-left of the viewport. Safe-area insets
(`env(safe-area-inset-*)`) are added to every edge offset. This file describes the CSS
geometry; it is NOT a browser measurement (no browser is available in this workspace).

## Look tokens (exact)
| Token | Value |
| --- | --- |
| Panel | `linear-gradient(180deg,#34445f,#151d2b)` |
| Border | `2px #0a0f18` |
| Radius | `14px` (windows), `12px` (pills/buttons), `10px` (wells) |
| Shadow | `0 4px 0 #0a0f18` |
| Well | `#0b111a`, radius `10px` |
| Amber button | `linear-gradient(#fde68a,#f59e0b)`, text `#1a1204` |
| Green button | `#34d399` -> `#059669` |
| Red button / X | `#f87171` -> `#b91c1c` |
| Text | `#f1f5f9` main, `#94a3b8` muted |
| Titles | weight 900, uppercase, letter-spacing `.04em` |
| Icon stroke | `2.5px` |
| Accents | goal `#fbbf24`, success `#34d399`, danger `#ef4444`, cyan `#22d3ee` |
| Min font | 14 px phone, 16 px desktop |

Every window: round red X 44x44 top-right, closes on tap outside, max 3 lines of text,
no paragraph longer than 12 words, button label <= 2 words + icon.

## Portrait phone (440x956 and 390x844) - FIRST CLASS
| Box | x | y | w | h |
| --- | --- | --- | --- | --- |
| Timer | 12 | 12 | 104 | 40 |
| Pause | W-60 | 12 | 48 | 48 |
| Coins | W-180 | 12 | 112 | 40 |
| Mission card | 12 | 60 | W-24 | 52 |
| Minimap (tap -> big map) | 12 | 124 | 88 | 88 |
| Icon stack (Camera/Sound/Zoom+/Zoom-) | 12 | 224 | 48 | 4x48 + 3x8 = 216 |
| Drive pad | W-170 | H-178 | 150 | 150 |
| Action (3 s hold) | 20 | H-132 | 92 | 92 |
| Brake | W-90 | H-246 | 56 | 56 |
| Speedometer | (W-64)/2 (-14 if W<=400) | H-88 | 64 | 64 |
| Toasts | 112..W-12 | 120 | - | - |

Amber 6 px bar on the mission card, name + ONE goal line + 3 step dots.
On 390x844 the speed dial is nudged 14 px left so it cannot touch the Drive pad.
`Settings > Big buttons` scales all controls x1.2; `Left-handed` swaps Drive and Action.
No rotate-lock code and no "rotate your phone" overlay.

## Landscape phone (844x390)
| Box | x | y | w | h |
| --- | --- | --- | --- | --- |
| Timer | 10 | 8 | 96 | 36 |
| Mission pill (centred) | 272 | 8 | 300 | 44 |
| Coins | 686 | 8 | 96 | 36 |
| Pause | 786 | 8 | 48 | 48 |
| Icon row (4 buttons, gap 6) | 10 | 50 | 210 | 48 |
| Minimap | 10 | 104 | 76 | 76 |
| Drive pad | 698 | 248 | 130 | 130 |
| Action | 16 | 288 | 84 | 84 |
| Brake | 764 | 182 | 56 | 56 |
| Speedometer | 390 | 320 | 64 | 64 |

Minimap is at y=104 (not 96) so the 48 px icon row has a clear 6 px gap. Centre 40% is
free of driving controls.

## Desktop 1920x1080 / 1280x720
| Box | 1920 | 1280 |
| --- | --- | --- |
| Timer | (16,16) 150x52 | (16,16) 150x52 |
| Mission | (680,16) 560x72 | (420,16) 440x64 |
| Coins | (1708,16) 132x52 | (1068,16) 132x52 |
| Pause | (1848,16) 56x56 | (1208,16) 56x56 |
| Minimap | (16,80) 140x140 | (16,80) 140x140 |
| Icon stack | (16,236) 52x232 | (16,236) 52x232 |
| W/A/S/D/F/C/Space keycaps | (16,H-216) 200x200, 56 px caps | same |
| Speedometer | (W-166,H-166) 150x150 | same |

## Layout model evidence
`node scripts/layout-check.mjs` computes pairwise box overlaps, off-screen boxes,
touch targets < 48 px and available mission text width at all five sizes.
Result: 0 overlaps, 0 off-screen, 0 small targets, 0 clipped zones at
1920x1080, 1280x720, 844x390, 440x956, 390x844. This is a CSS geometry model,
not a browser screenshot.

## Windows (src/ui/Menus.js)
- Start screen `#tf-start`: title, PLAY 64 px high, four icon tiles LEVELS / GARAGE /
  SETTINGS / HELP, top-right sound, bottom coins / level / rank, code-made SVG machine.
- Pause: centred 2x3 grid of 96x96 icon tiles (RESUME green big, RESTART, LEVELS,
  GARAGE, SETTINGS, HOME) + 44x44 red X. No hamburger dropdown.
- Settings: three real sliders (Master / Music / Effects) -> `hub.setVolumes()`,
  Mute, Graphics Low/Medium/High, Big buttons, Left-handed, Guide arrows. No sentences.
- Help: 4 pages, one drawn picture + one line <= 8 words + dots + Next/Back.
- Levels: 2 columns portrait, three chapter tabs, scroll inside the window, cards show
  number / name / 3 stars / lock / tag only; description is in the bottom bar with green START.
- Result / Time up: steel look, big stars, coin count-up, max 2 buttons (NEXT / RETRY).
- Garage: 6 upgrade cards (icon / name / 5 pips / one stat / price button), small MAX badge,
  6 paint swatches.
- Big map: roads, building blocks, parks, water, player arrow, goal markers, landmark,
  compass, scale bar, X closes and the game is paused while open.
