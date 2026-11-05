// Static UI wiring audit - run with: node scripts/ui-audit.mjs
// No browser needed: checks ids, actions, icons, CSS sizes and API coverage.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const hud = read('src/ui/GameUI.js');
const menus = read('src/ui/Menus.js');
const main = read('src/main.js');
let failures = 0;
const ok = (cond, label, extra) => {
  console.log((cond ? 'OK   ' : 'FAIL ') + label + (extra ? '  ' + extra : ''));
  if (!cond) failures++;
};

// ---- 1. ids referenced by GameUI must exist in its own HUD markup or index.html
const hudIds = [...hud.matchAll(/id="(tf-[A-Za-z0-9_-]+)"/g)].map(m => m[1]);
const menuIds = [...menus.matchAll(/id="(tf-[A-Za-z0-9_-]+)"/g)].map(m => m[1]);
const html = read('index.html');
const indexIds = [...html.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]);
const allIds = new Set([...hudIds, ...menuIds, ...indexIds]);
const refs = [...hud.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]);
const missing = [...new Set(refs.filter(r => !allIds.has(r)))];
ok(missing.length === 0, 'every GameUI id reference resolves', missing.length ? JSON.stringify(missing) : `${refs.length} refs`);
const dup = [...new Set([...hudIds, ...menuIds, ...indexIds].filter((x, i, a) => a.indexOf(x) !== i))];
ok(dup.length === 0, 'no duplicate ids', JSON.stringify(dup));

// ---- 2. every emitted action has a handler in main.js
const emitted = new Set([
  ...[...hud.matchAll(/data-a="([a-z-]+)"/g)].map(m => m[1]),
  ...[...menus.matchAll(/data-a="([a-z-]+)"/g)].map(m => m[1]),
  ...[...hud.matchAll(/_act\('([a-z-]+)'/g)].map(m => m[1]),
  ...[...menus.matchAll(/_act\('([a-z-]+)'/g)].map(m => m[1])
]);
const block = main.slice(main.indexOf('function handleUiAction('), main.indexOf('function setUiSetting('));
const cases = new Set([...block.matchAll(/case '([a-z-]+)'/g)].map(m => m[1]));
// actions handled inside Menus itself or by the browser, not by main.js
const local = new Set(['close', 'help-next', 'help-back', 'chapter', 'select', 'paint', 'buy',
  'setting', 'confirm-yes', 'window-open', 'window-close', 'map-close', 'menu-open',
  'menu-close', 'modal-closed-play', 'modal-closed-menu']);
const unhandled = [...emitted].filter(a => !cases.has(a) && !local.has(a));
ok(unhandled.length === 0, 'every UI action has a handler', unhandled.length ? JSON.stringify(unhandled) : `${emitted.size} actions`);

// ---- 3. every icon name used exists in the icon tables
const hudIcons = new Set([...hud.matchAll(/^\s*([a-z]+): '</gm)].map(m => m[1]));
const menuIcons = new Set([...menus.matchAll(/^\s*([a-z]+): '<path|^\s*([a-z]+): '<rect|^\s*([a-z]+): '<circle/gm)].map(m => m[1] || m[2] || m[3]).filter(Boolean));
const usedHud = new Set([...hud.matchAll(/svg\('([a-z]+)'/g)].map(m => m[1]));
const usedMenus = new Set([...menus.matchAll(/svg\('([a-z]+)'/g)].map(m => m[1]));
const iconTable = new Set([...hud.matchAll(/^\s{2}([a-z]+): '</gm)].map(m => m[1]));
const iconTable2 = new Set([...menus.matchAll(/^\s{2}([a-z]+): /gm)].map(m => m[1]));
const missingHudIcons = [...usedHud].filter(n => !iconTable.has(n));
const missingMenuIcons = [...usedMenus].filter(n => !iconTable2.has(n) && !iconTable.has(n));
ok(missingHudIcons.length === 0 && missingMenuIcons.length === 0, 'all SVG icon names exist',
   JSON.stringify([...missingHudIcons, ...missingMenuIcons]));
void hudIcons; void menuIcons;

// ---- 4. pointer release paths
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'visibilitychange']) {
  ok(hud.includes(ev), 'pointer release path: ' + ev);
}
ok(!hud.includes('new KeyboardEvent'), 'no fake keyboard events');

// ---- 5. TIER 2 exact layout tokens (CSS px)
const css = hud.slice(hud.indexOf('const CSS = `'), hud.indexOf('const HOLD_CODES'));
for (const [label, token] of [
  ['portrait mission card 52px', 'height:52px;transform:none'],
  ['portrait minimap 88px', 'width:88px;height:88px'],
  ['portrait icon stack at y=224', 'top:calc(224px + ${SAFE_T})'],
  ['portrait Drive 150px on right', 'width:150px;height:150px;right:calc(20px + ${SAFE_R})'],
  ['portrait Action 92px on left', 'width:92px;height:92px;left:calc(20px + ${SAFE_L})'],
  ['landscape 844x390 query', '@media (max-height:480px)'],
  ['portrait phone query', '@media (max-width:600px) and (min-height:481px)'],
  ['safe-area insets', 'SAFE_L'],
  ['left-handed swap', '#tf-hud.tf-lefty .tf-drive'],
  ['no rotate overlay', true]
]) {
  ok(token === true ? !/rotate your phone|orientation.?lock/i.test(hud + menus) : css.includes(token), label);
}

// ---- 6. touch targets >= 48px in every media query
const sizes = [...css.matchAll(/\.tf-tools button\{width:(\d+)px;height:(\d+)px/g)].map(m => +m[1]);
ok(sizes.length >= 3 && sizes.every(n => n >= 48), 'icon stack buttons >= 48px in all layouts', JSON.stringify(sizes));

// ---- 7. windows have X and are short
for (const kind of ['pause', 'settings', 'help', 'levels', 'garage', 'result', 'fail', 'confirm', 'map']) {
  ok(menus.includes(`case '${kind}'`), 'window kind built: ' + kind);
}
ok(menus.includes('class="tf-x tf-red" data-a="close"'), 'every window has a round red X');
ok(menus.includes('class="tf-scrim" data-a="close"'), 'backdrop tap closes the window');
const helpLines = [...menus.matchAll(/line: '([^']+)'/g)].map(m => m[1]);
ok(helpLines.length === 4 && helpLines.every(l => l.split(/\s+/).length <= 8), 'HELP pages <= 8 words', JSON.stringify(helpLines));

// ---- 8. main.js API coverage for GameUI
for (const m of ['setScreen','setStartInfo','setJob','setTimer','setCoins','setSpeed','setHint',
                 'setMenuDot','toast','announce','showLocked','refresh','reset','toggleMenu',
                 'openMenu','closeMenu','isMenuOpen','isMenuScreen','showModal','hideModal',
                 'confirm','setMuted','setKey','setBig','setLefty','showResult','showFail',
                 'showPicker','showGarage','showMap','releaseAll','setTouch']) {
  ok(new RegExp(`\\n  ${m}\\(`).test(hud), 'GameUI method: ' + m);
}

// ---- 9. SDK safety
const ads = read('src/core/Ads.js');
ok(ads.includes('requestAd(kind, {'), 'Ads uses the documented requestAd API');
ok(ads.includes('adStarted') && ads.includes('adFinished') && ads.includes('adError'), 'Ads handles all 3 callbacks');
ok(/if \(!ad\) return Promise\.resolve\(false\)/.test(ads), 'Ads is a no-op when SDK is missing');

console.log('\n' + (failures === 0 ? 'UI AUDIT: PASS' : `UI AUDIT: ${failures} FAILURE(S)`));
process.exit(failures ? 1 : 0);
