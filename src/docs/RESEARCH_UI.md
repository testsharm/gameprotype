# RESEARCH_UI - compact notes for the Final Product Push

> **2026-11-05 QUALITY PASS v3:** these are historical research notes from the
> earlier phase. The SDK init gate described below IS implemented in
> `src/core/Ads.js` / `Portal.js` and verified in real Chromium by
> `node scripts/sdk-check.mjs` (0 × `CrazySDK is not initialized yet`).
> Current status: `README.md` and `docs/DEPTH_REPORT.md`.

---



Only official pages were read. No outside art, fonts, sounds or scripts were downloaded.

## Official CrazyGames SDK v3 (HTML5)
- `https://docs.crazygames.com/sdk/intro/` - script `https://sdk.crazygames.com/crazygames-sdk-v3.js`; `await window.CrazyGames.SDK.init()` before any SDK call; modules: `ad`, `banner`, `game`, `user`, `data`.
- `https://docs.crazygames.com/sdk/game/` - `game.gameplayStart()` on entering a playable state, `game.gameplayStop()` on menus / pause / level end; `happytime()`; `game.settings.muteAudio` takes priority; `addSettingsChangeListener`.
- `https://docs.crazygames.com/sdk/video-ads/` (the ad module page; `/sdk/ad/` and `/sdk/ads/` are 404) - `window.CrazyGames.SDK.ad.requestAd("midgame" | "rewarded", { adStarted, adFinished, adError })`. Mute AND pause the game in `adStarted`, restore in `adFinished` and `adError`. `adError` codes: `adsDisabled`, `unfilled`, `adblock`, `adCooldown`, `other`. Midgame ads belong at natural breaks (death / level complete); a 3-minute cooldown is normal. `ad.hasAdblock()` exists and games must still work with adblock.
- `https://docs.crazygames.com/sdk/data/` - `SDK.data` has the localStorage API (`getItem`/`setItem`/`removeItem`/`clear`). Guest data is stored in localStorage and synced later. 1 MB limit, 1 s debounce. Retrieve before setting.
- `https://docs.crazygames.com/requirements/technical/` - relative paths, mouse + keyboard + touch, the portal handles orientation prompts, safe-area insets, disable text selection on mobile, resume AudioContext in a real gesture.
- `https://docs.crazygames.com/resources/crazygames-app/` - use `env(safe-area-inset-*)` for important UI.
- MDN: `https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events`,
  `https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture`,
  `https://developer.mozilla.org/en-US/docs/Web/API/Element/lostpointercapture_event` - pointer events unify mouse/pen/touch; capture by `pointerId`; clear held inputs on `lostpointercapture`.

## What the 13 owner screenshots actually show
Mixed builds: some are the pre-PR-2 build (`RUSH HOUR LITE 0/8 Gates`, old key legend, old hamburger dropdown), others are the PR-2 build (`Trucks loaded 1/3`, CAM/SOUND/Zoom, `Click or hold`, X-less Settings, `Return to main menu?`, level picker, `MAX LEVEL` garage). Both are real evidence of the complaints.

Confirmed visible problems:
1. Debug box (`physics 60.0 steps/s | render 144 fps | audio running...`) is ON in a dev-server build and covers the minimap / top-left UI.
2. Camera/Sound/Zoom sit at the TOP RIGHT; owner wants an icon stack on the LEFT edge.
3. Mission card is tall (up to ~200 px with the `announce` story) and eats the upper third on portrait.
4. Cab view = black block in the middle + yellow hood filling the bottom half.
5. Black cubes with orange flags next to traffic cones (detached marker bases).
6. Windows (`Settings`, `Controls`, `Levels`, `Garage`, `Time is up`) are text-heavy; only a wide bottom `Close` / `Back to game` button; no round X.
7. Garage: 3 upgrades, all `MAX LEVEL` with big empty boxes (because of `?rich` test coins).
8. Level 1 times out at 0/3; smoke puff on the machine is big and constant.
9. Console: `HTML5 SDK CrazyGames HTML SDK initialized` (good) and the harmless Brave extension error `Could not establish connection. Receiving end does not exist.`

## Decisions taken (owner said "you decide")
- Portrait (440x956 / 390x844) is a FIRST-CLASS layout; 844x390 landscape and desktop stay clean. No orientation lock, no "rotate your phone" overlay.
- Left-edge icon stack: Camera, Sound, Zoom +, Zoom -. Right side keeps Drive; Action stays left; Settings offers Left-handed and Big buttons.
- Every window gets a 44x44 round red X, closes on backdrop tap, at most 3 lines of text.
- All new art is code-made canvas/SVG/WebAudio; no new npm packages.

## Browser-tool reality in this sandbox
No Chromium / Chrome / Playwright / jsdom binary and no `@sparticuz/chromium`. The owner forbade installing packages just for screenshots. Therefore: **no browser screenshots and no real click/touch test are possible in this workspace**. Verification is `node --check`, `npx vite build`, a Node-only world/level check and a static wiring audit. Anything else is reported as NOT VERIFIED.
