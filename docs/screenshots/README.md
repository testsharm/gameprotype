# Screenshots - NOT AVAILABLE

No PNG files were added here. This workspace has no browser binary, no Chromium,
no Playwright, no jsdom, and installing new packages just for screenshots is
forbidden by the project rules. Generating mock "screenshots" would be fake
evidence, so this folder is intentionally empty.

The 15 required names are:
01-start-1920x1080, 02-game-1920x1080, 03-game-1280x720,
04-phone-landscape-844x390, 05-phone-portrait-440x956,
06-pause, 07-settings, 08-how-to-play, 09-garage, 10-result,
11-truck-closeup, 12-traffic-cars, 13-guide-ring, 14-big-map, 15-free-play.

To produce them: open the live preview (or `npm run dev`) in a real browser,
set each viewport in device mode, press Ctrl+Shift+R, and save each PNG here.
Also copy the F12 console text into `docs/DEPTH_REPORT.md`.

`node scripts/layout-check.mjs` is a CSS geometry model, NOT a screenshot.
`node scripts/ui-runtime-check.mjs` is a Node DOM simulation, NOT a real click.
Both are labelled as such in the depth report.
