// TIER 2 / QA layout model - run: node scripts/layout-check.mjs
// This is a CSS GEOMETRY MODEL, not a browser measurement: boxes are taken
// from the exact px values written in src/ui/GameUI.js. No browser is available.
// It reports overlaps, small touch targets, off-screen boxes and text clipping.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'src/ui/GameUI.js'), 'utf8');

// x,y,w,h in CSS px. y is measured from the TOP of the viewport.
// right/bottom anchored values are resolved against the viewport size.
function desktop(W, H, missionW, missionH) {
  return {
    timer:   { x: 16, y: 16, w: 150, h: 52 },
    mission: { x: (W - missionW) / 2, y: 16, w: missionW, h: missionH },
    coins:   { x: W - 80 - 132, y: 16, w: 132, h: 52 },
    pause:   { x: W - 16 - 56, y: 16, w: 56, h: 56 },
    minimap: { x: 16, y: 80, w: 140, h: 140 },
    tools:   { x: 16, y: 236, w: 52, h: 4 * 52 + 3 * 8 },
    keypad:  { x: 16, y: H - 16 - (3 * 56 + 2 * 6 + 20), w: 200, h: 3 * 56 + 2 * 6 + 20 },
    speed:   { x: W - 16 - 150, y: H - 16 - 150, w: 150, h: 150 }
  };
}
function landscape(W, H) {
  return {
    timer:   { x: 10, y: 8, w: 96, h: 36 },
    mission: { x: (W - 300) / 2, y: 8, w: 300, h: 44 },
    coins:   { x: W - 62 - 96, y: 8, w: 96, h: 36 },
    pause:   { x: W - 10 - 48, y: 8, w: 48, h: 48 },
    tools:   { x: 10, y: 50, w: 4 * 48 + 3 * 6, h: 48 },
    minimap: { x: 10, y: 104, w: 76, h: 76 },
    drive:   { x: W - 16 - 130, y: H - 12 - 130, w: 130, h: 130 },
    action:  { x: 16, y: H - 18 - 84, w: 84, h: 84 },
    brake:   { x: W - 24 - 56, y: H - 152 - 56, w: 56, h: 56 },
    speed:   { x: (W - 64) / 2, y: H - 6 - 64, w: 64, h: 64 }
  };
}
function portrait(W, H) {
  return {
    timer:   { x: 12, y: 12, w: 104, h: 40 },
    coins:   { x: W - 68 - 112, y: 12, w: 112, h: 40 },
    pause:   { x: W - 12 - 48, y: 12, w: 48, h: 48 },
    mission: { x: 12, y: 60, w: W - 24, h: 52 },
    minimap: { x: 12, y: 124, w: 88, h: 88 },
    tools:   { x: 12, y: 224, w: 48, h: 4 * 48 + 3 * 8 },
    drive:   { x: W - 20 - 150, y: H - 28 - 150, w: 150, h: 150 },
    action:  { x: 20, y: H - 40 - 92, w: 92, h: 92 },
    brake:   { x: W - 34 - 56, y: H - 190 - 56, w: 56, h: 56 },
    speed:   { x: (W - 64) / 2 - (W <= 400 ? 14 : 0), y: H - 24 - 64, w: 64, h: 64 }
  };
}
// Targets the finger/keyboard can actually press.
const TARGET = {
  desktop: { pause: 56, minimap: 140, tools: 52, keypad: 56 },
  landscape: { pause: 48, minimap: 76, tools: 48, drive: 130, action: 84, brake: 56 },
  portrait: { pause: 48, minimap: 88, tools: 48, drive: 150, action: 92, brake: 56 }
};
const VIEWPORTS = [
  ['1920x1080', 1920, 1080, () => desktop(1920, 1080, 560, 72), 'desktop'],
  ['1280x720',  1280, 720,  () => desktop(1280, 720, 440, 64),  'desktop'],
  ['844x390',   844,  390,  () => landscape(844, 390),          'landscape'],
  ['440x956',   440,  956,  () => portrait(440, 956),           'portrait'],
  ['390x844',   390,  844,  () => portrait(390, 844),           'portrait']
];
function overlap(a, b) {
  const x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return x > 0 && y > 0 ? `${x}x${y}px` : null;
}
let bad = 0;
console.log('TIER 2 LAYOUT MODEL (CSS geometry, NOT a browser screenshot)\n');
console.log('VIEWPORT     BOXES  OVERLAPS  OFFSCREEN  TARGETS<48  CLIPPED TEXT');
for (const [name, W, H, make, kind] of VIEWPORTS) {
  const boxes = make();
  const keys = Object.keys(boxes);
  const ov = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const o = overlap(boxes[keys[i]], boxes[keys[j]]);
    if (o) ov.push(`${keys[i]}/${keys[j]} ${o}`);
  }
  const off = keys.filter(k => boxes[k].x < 0 || boxes[k].y < 0 ||
    boxes[k].x + boxes[k].w > W || boxes[k].y + boxes[k].h > H);
  const small = Object.entries(TARGET[kind]).filter(([, s]) => s < 48);
  // Text clipping: mission card has a one-line goal, name and pips.
  const m = boxes.mission;
  const avail = m.w - 6 - 12 - 12 - (3 * 12 + 2 * 5) - 10;
  const clipped = avail < 120 ? ['mission text'] : [];
  if (ov.length || off.length || small.length || clipped.length) bad++;
  console.log(name.padEnd(12) + ' ' + String(keys.length).padEnd(6) + ' ' +
    String(ov.length).padEnd(9) + ' ' + String(off.length).padEnd(10) + ' ' +
    String(small.length).padEnd(11) + ' ' + (clipped.length || 0));
  if (ov.length) ov.forEach(x => console.log('   OVERLAP ' + x));
  if (off.length) console.log('   OFFSCREEN ' + off.join(','));
  console.log('   mission text width ' + Math.max(0, Math.round(avail)) + 'px | min font ' +
    (kind === 'desktop' ? 16 : 14) + 'px');
}
const ok = [
  css.includes('width:150px;height:150px;right:calc(20px + ${SAFE_R})'),
  css.includes('width:92px;height:92px;left:calc(20px + ${SAFE_L})'),
  css.includes('width:88px;height:88px'),
  css.includes('width:440px;height:64px'),
  css.includes('#tf-hud.tf-lefty .tf-drive'),
  !/rotate your phone|orientation.?lock/i.test(css)
];
console.log('\nexact CSS tokens: ' + ok.filter(Boolean).length + '/' + ok.length);
if (ok.some(x => !x)) bad++;
console.log(bad === 0 ? '\nTIER 2 LAYOUT MODEL: PASS' : '\nTIER 2 LAYOUT MODEL: FAIL');
process.exit(bad ? 1 : 0);
