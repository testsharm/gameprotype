# DEPTH REPORT - TerraForm 3D "FINAL PRODUCT PUSH"

Date: 2026-11-05. Branch: `arena/66b14966-gameprotype` (based on `clean-v1` HEAD `8c57ed6`).
This is an honest engineering report. **No browser, no real phone, no F12 console and no
screenshots are available in this workspace.** Every number below comes from a Node
build, a Node harness, a CSS geometry model or a static source audit. Nothing here is
a real click/touch/visual play-test. Where that matters the status says **NOT VERIFIED**.

---

## 1. Score (1-10)

| Area | Score | Why |
| --- | --- | --- |
| Code completeness | 9 | All 10 tiers have real code; no stubs that pretend to work. |
| Layout (CSS model) | 8 | 5 viewports, 0 overlaps, 0 small targets. Not browser-measured. |
| Buttons / wiring (Node DOM) | 8 | 84 controls exercised, 0 exceptions. Not real touch. |
| Gameplay logic (Node) | 8 | 15/15 levels walked, 3 scoop + 3 dump hold enforced. |
| Visual quality | 5 | Code-made only; no screenshot to judge flicker, readability or feel. |
| Audio | 5 | Volumes, ducking, beeper written; no listening test. |
| Ads / SDK | 5 | Documented API wrapped + no-op fallback; portal behaviour untested. |
| Performance / fps | 4 | 60 Hz fixed step verified by arithmetic only; no runtime fps measured. |
| **Overall** | **6.5 / 10 built** | **0 / 10 browser-verified.** Do not submit to CrazyGames yet. |

Generic look: steel-blue panels, amber accents, rounded boxes, code-drawn SVG icons,
no outside art/font/sound. The game still looks like a clean 3D prototype rather than a
polished commercial machine: flat shading, simple boxes, no environment reflections.

---

## 2. Every button on every screen

`Pos/Size` is the CSS box (see `src/docs/UI_SPEC.md`). `Key` = real `event.code`.
`Touch` = pointerdown / pointerup / click with pointer capture. `Status` = BUILT (Node
DOM harness passed) and NOT VERIFIED in a real browser. Evidence = `scripts/ui-runtime-check.mjs`.

### Start screen (no HUD before PLAY)
| Button | Pos / Size | Action | Key | Touch | Status / Evidence |
| --- | --- | --- | --- | --- | --- |
| PLAY | centre, 64 px high | start game, unlock audio | - | click | BUILT, headless PASS |
| Sound (top-right) | 48x48 | toggle mute | M | click | BUILT, headless PASS |
| LEVELS | icon tile 96x96 | level picker | J | click | BUILT, headless PASS |
| GARAGE | icon tile 96x96 | garage | U | click | BUILT, headless PASS |
| SETTINGS | icon tile 96x96 | settings | - | click | BUILT, headless PASS |
| HELP | icon tile 96x96 | 4-page help | - | click | BUILT, headless PASS |
| FREE PLAY | button | stunt park | - | click | BUILT, headless PASS |

### In-game HUD
| Button | Pos / Size | Action | Key | Touch | Status / Evidence |
| --- | --- | --- | --- | --- | --- |
| Timer | 104x40 / 150x52 | display only | - | - | BUILT |
| Coins | 112x40 / 132x52 | display only | - | - | BUILT |
| Mission card | W-24 x 52 / 560x72 | name + 1 goal + 3 dots | - | - | BUILT |
| PAUSE | 48x48 / 56x56 | pause window | P | click | BUILT, headless PASS |
| Minimap | 88 / 76 / 140 round | open big map | - | click | BUILT, headless PASS |
| CAMERA | icon 48/52 | cycle view | C | click | BUILT, headless PASS |
| SOUND | icon 48/52 | mute | M | click | BUILT, headless PASS |
| ZOOM + | icon 48/52 | zoom in | Equal, NumpadAdd, wheel | click | BUILT, headless PASS |
| ZOOM - | icon 48/52 | zoom out | Minus, NumpadSubtract, wheel | click | BUILT, headless PASS |
| W / A / S / D | 56 px keycaps (PC), joystick (phone) | HOLD drive | KeyW/A/S/D, Arrows | pointer hold | BUILT, headless PASS |
| SPACE / BRK | 56 px | HOLD brake | Space | pointer hold | BUILT, headless PASS |
| ACTION / F | 92 / 84 / 56 px | **HOLD 3 s** scoop or dump | KeyF | pointer hold | BUILT, headless PASS |
| Speedometer | 64 / 150 round | display only | - | - | BUILT |

### Pause window
| Button | Pos / Size | Action | Key | Touch | Status / Evidence |
| --- | --- | --- | --- | --- | --- |
| RESUME (green, big) | 96x96 | close + resume | P | click | BUILT, headless PASS |
| RESTART | 96x96 | confirm then restart | R | click | BUILT, headless PASS |
| LEVELS | 96x96 | picker | J | click | BUILT, headless PASS |
| GARAGE | 96x96 | garage | U | click | BUILT, headless PASS |
| SETTINGS | 96x96 | settings | - | click | BUILT, headless PASS |
| HOME | 96x96 | confirm then start screen | - | click | BUILT, headless PASS |
| Red X | 44x44 top-right | close | - | click | BUILT, headless PASS |
| Backdrop | full screen | close on tap outside | - | click | BUILT, headless PASS |

### Settings
| Control | Pos / Size | Action | Key | Touch | Status / Evidence |
| --- | --- | --- | --- | --- | --- |
| MASTER slider | row | `hub.setVolumes(master,...)` | - | change | BUILT, headless PASS |
| MUSIC slider | row | `hub.setVolumes(...,music,...)` | - | change | BUILT, headless PASS |
| EFFECTS slider | row | `hub.setVolumes(...,effects)` | - | change | BUILT, headless PASS |
| SOUND toggle | row | mute | M | click | BUILT, headless PASS |
| GRAPHICS LOW/MED/HIGH | 3 segments | `setQuality` | - | click | BUILT, headless PASS |
| BIG BUTTONS | toggle | x1.2 controls | - | click | BUILT, headless PASS |
| LEFT-HANDED | toggle | swap Drive/Action | - | click | BUILT, headless PASS |
| GUIDE ARROWS | toggle | ring + chevrons | - | click | BUILT, headless PASS |
| Red X | 44x44 | close | - | click | BUILT |

### Help (4 pages)
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| BACK | bottom | previous page (max 8 words) | BUILT, headless PASS |
| NEXT | bottom | next page | BUILT, headless PASS |
| 4 dots | bottom | page index | BUILT |
| Red X | 44x44 | close | BUILT |

### Level picker
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| 3 chapter tabs | top | filter | BUILT, headless PASS x3 |
| 15 cards, 2 columns | scroll inside | select (locked cards disabled) | BUILT, headless PASS x5 |
| START (green, bottom bar) | bottom | `goJob(id)` | BUILT, headless PASS |
| Red X | 44x44 | close | BUILT |

### Garage
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| 6 price buttons | card | `buyUpgrade(key)` (green if affordable, grey if not) | BUILT, headless PASS x5 (6th MAX) |
| 6 paint swatches | row | `vehicle.setPaint(hex)` | BUILT, headless PASS x6 |
| MAX badge | 11 px text | small, no empty box | BUILT |
| Red X | 44x44 | close | BUILT |

### Result / Time up
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| NEXT | big | next level + optional midgame ad | BUILT, headless PASS |
| RETRY | big | restart | BUILT, headless PASS |
| DOUBLE COINS (ad) | optional, hidden outside portal | rewarded x2 | BUILT (ads-check) |
| +60 s (ad) | Time up only, hidden outside portal | `jm.addTime(60)` | BUILT (ads-check) |
| Coin count-up | display | - | BUILT |
| Big stars | display | - | BUILT |

### Confirm
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| YES | big | run pending action | BUILT, headless PASS |
| Red X / backdrop | 44x44 | cancel | BUILT |

### Big map
| Button | Pos / Size | Action | Status / Evidence |
| --- | --- | --- | --- |
| Red X | 44x44 | close + resume | BUILT |
| Pause | automatic | `gameplayStop` on open | BUILT |

---

## 3. Numbers from headless checks (all reproducible)

| Check | Command | Result |
| --- | --- | --- |
| Build | `npx vite build` | OK, 34 modules, dist ~5.1 MB / 3 files |
| UI static wiring | `node scripts/ui-audit.mjs` | PASS, 23 actions, 0 missing ids/icons |
| UI runtime (Node DOM) | `node scripts/ui-runtime-check.mjs` | 84 controls, 0 failures, 0 runtime errors |
| Layout CSS model | `node scripts/layout-check.mjs` | 5 sizes, 0 overlaps, 0 off-screen, 0 targets < 48 px |
| Tier 1 (3 scoops/dumps) | `node scripts/tier1-check.mjs` | PASS, 3/3, RUSH expiry = 3 misses / 0 delivered |
| All 15 levels | `node scripts/level-walk.mjs` | 15/15 walked, 8 types, 7 skies, 15 distinct starts |
| Garage | `node scripts/garage-check.mjs` | 6 upgrades, 4 paid steps (100/250/500/900), 6 paints |
| Stunt park | `node scripts/park-check.mjs` | 32 meshes, 8 colliders, 8 rings, cap 300 coins |
| Ads / SDK | `node scripts/ads-check.mjs` | no-op without SDK, 120 s + 180 s gate, pause/mute/restore |
| Fixed step | `window.__testTimestep()` | 60.0 steps/s at 30/60/75/120/144/165/240 Hz (arithmetic) |

## 4. NOT VERIFIED (must be done before CrazyGames submission)

- Real click / touch / multi-touch on a phone or in a browser. No browser binary, no
  Playwright, no jsdom; installing new packages for screenshots is forbidden.
- Real screenshots at the 15 required names. `docs/screenshots/` is empty on purpose;
  generating fake "screenshots" would be dishonest evidence.
- Console: no red errors checked. Real fps, 60+ target, no flicker in chase/cab/bucket.
- Driving feel, gate/beams, pipe snap, trench depth, night/storm readability.
- Audio: one AudioContext after first input, music duck 50% on dump, reverse beeper,
  silent hidden tab, ad mute/restore.
- CrazyGames SDK inside the portal: `gameplayStart/Stop`, `happytime`, `requestAd`,
  `SDK.data` progress save, adblock, `settings.muteAudio`.
- Ads: rewarded x2 coins, half-price garage, +60 s, midgame only on NEXT.
- All 15 levels with real 3-second holds, L1 again with real scoop/dump.
- 5 viewport screenshots with 0 real overlaps / 0 clipped text.

## 5. Generic look / top 10 improvements still needed

1. Real browser + phone play-test, then fix what it finds. **Blocking.**
2. 15 real screenshots with console logs. **Blocking for submission evidence.**
3. Replace flat box meshes with rounded, bevelled, weathered machine panels.
4. Add proper PBR-ish materials, contact shadows, AO and softer fog.
5. Add per-action animation (scoop arm, dump tilt, suspension) with real timing.
6. Vary the 15 sites more: landmarks, skyline silhouettes, unique props per level.
7. Improve traffic: 5 distinct car silhouettes, brake lights, horn, real avoidance feel.
8. Add a proper soundtrack + layered engine/dig/dump/reverse sounds.
9. Reduce main bundle (currently ~965 kB + 4.34 MB Rapier) and measure fps on a phone.
10. Localise / shorten all remaining text and add a first-run interactive tutorial.

## 6. Appendix - headless button report (verbatim)

```
SCREEN       ACTION                       RESULT   DETAIL
start        sound                        PASS     unlock|sound
start        play                         PASS     unlock|play
start        levels                       PASS     unlock|levels
start        garage                       PASS     unlock|garage
start        settings                     PASS     unlock|settings
start        help                         PASS     unlock|help
start        freeplay                     PASS     unlock|freeplay
hud          camera                       PASS     unlock|camera
hud          sound                        PASS     unlock|sound
hud          zoomIn                       PASS     unlock|zoomIn
hud          zoomOut                      PASS     unlock|zoomOut
hud          tf-pause                     PASS     pause
hud          tf-mini                      PASS     map
pause        close                        PASS     window-close:pause
pause        resume                       PASS     resume
pause        restart                      PASS     restart
pause        levels                       PASS     levels
pause        garage                       PASS     garage
pause        settings                     PASS     settings
pause        home                         PASS     home
settings     setting (mute/quality x3/big/lefty/guide)  PASS x7
settings     slider:master/music/effects  PASS x3
help         help-back / help-next        PASS x2
levels       chapter x3 / select x5 / start  PASS x9
garage       buy x5 / paint x6            PASS x11
result       retry / next                 PASS x2
fail         levels / retry               PASS x2
confirm      confirm-yes                  PASS
hold         KeyW/A/S/D/Space/KeyF        PASS x5 (down + up)
tap          KeyC                         PASS
key          KeyW keydown / keyup         PASS x2
method       16 GameUI methods            PASS x16
84 controls exercised, 0 failures, 0 runtime errors
UI RUNTIME CHECK: PASS
```
