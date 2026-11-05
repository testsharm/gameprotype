// TIER B EVIDENCE - REAL Chromium DOM measurements, not a CSS model.
// Sizes: 1920x1080, 1280x720, 844x390, 440x956, 390x844.
// Reports overlaps, off-screen boxes, touch targets <48px, clipped text.
import { serve, newContext, openGame, closeAll, url } from './browser.mjs';

const VIEWPORTS = [
  ['1920x1080', 1920, 1080],
  ['1280x720',  1280, 720],
  ['844x390',   844, 390],
  ['440x956',   440, 956],
  ['390x844',   390, 844]
];

// Solid HUD boxes that must never overlap each other.
const BOXES = {
  timer:   '#tf-timer',
  mission: '#tf-mission',
  coins:   '#tf-coins',
  pause:   '#tf-pause',
  minimap: '#tf-mini',
  tools:   '#tf-tools',
  speed:   '#tf-speed',
  joy:     '#tf-joy',
  scoop:   '#tf-f',
  dump:    '#tf-g',
  brake:   '#tf-brk'
};

const overlap = (a, b) => {
  const x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return x > 1 && y > 1 ? `${Math.round(x)}x${Math.round(y)}px` : null;
};

console.log('REAL BROWSER LAYOUT CHECK (Chromium 153, actual getBoundingClientRect)\n');
console.log('VIEWPORT     BOXES  OVERLAPS  OFFSCREEN  TARGETS<48  CLIPPED  RESULT');
let bad = 0;
await serve();
const ctx = await newContext({ viewport: { width: 1280, height: 720 } });
const page = await openGame(ctx, { settle: 1200 });

for (const [name, W, H] of VIEWPORTS) {
  await page.setViewportSize({ width: W, height: H });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(url(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1700);
  await page.click('.tf-play', { timeout: 20000 });
  await page.waitForTimeout(900);

  const data = await page.evaluate((sel) => {
    const out = { boxes: {}, targets: [], clipped: [], fonts: [] };
    for (const [k, s] of Object.entries(sel)) {
      const n = document.querySelector(s);
      if (!n) { out.boxes[k] = null; continue; }
      const r = n.getBoundingClientRect();
      const cs = getComputedStyle(n);
      out.boxes[k] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        display: cs.display, bg: cs.backgroundColor };
      if (n.tagName === 'BUTTON' && cs.display !== 'none' && r.width > 0)
        out.targets.push({ k, w: Math.round(r.width), h: Math.round(r.height) });
    }
    for (const n of document.querySelectorAll('#tf-hud button, #tf-mission .nm, #tf-mission .st')) {
      if (getComputedStyle(n).display === 'none') continue;
      if (n.scrollWidth > n.clientWidth + 1 && n.clientWidth > 0)
        out.clipped.push((n.id || n.className || n.tagName) + ' ' + n.scrollWidth + '>' + n.clientWidth);
      out.fonts.push(parseFloat(getComputedStyle(n).fontSize));
    }
    // All visible HUD buttons, including the icon stack.
    for (const n of document.querySelectorAll('#tf-hud button')) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = n.getBoundingClientRect();
      if (r.width < 1) continue;
      if (!n.id) out.targets.push({ k: (n.textContent || n.getAttribute('aria-label') || 'btn').trim().slice(0, 14), w: Math.round(r.width), h: Math.round(r.height) });
    }
    return out;
  }, BOXES);

  const keys = Object.keys(data.boxes).filter(k => data.boxes[k]);
  const ovs = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const o = overlap(data.boxes[keys[i]], data.boxes[keys[j]]);
    if (o) ovs.push(`${keys[i]}/${keys[j]} ${o}`);
  }
  const off = keys.filter(k => { const b = data.boxes[k]; return b.x < -1 || b.y < -1 || b.x + b.w > W + 1 || b.y + b.h > H + 1; });
  const small = data.targets.filter(t => t.w < 48 || t.h < 48);
  const clipped = data.clipped;
  const isBad = ovs.length || off.length || small.length || clipped.length;
  if (isBad) bad++;
  console.log(name.padEnd(12) + ' ' + String(keys.length).padEnd(6) + ' ' + String(ovs.length).padEnd(9) + ' ' +
    String(off.length).padEnd(10) + ' ' + String(small.length).padEnd(11) + ' ' + String(clipped.length).padEnd(8) + ' ' +
    (isBad ? 'FAIL' : 'PASS'));
  if (ovs.length) ovs.forEach(x => console.log('   OVERLAP ' + x));
  if (off.length) console.log('   OFFSCREEN ' + off.map(k => k + ' ' + JSON.stringify(data.boxes[k])).join(' | '));
  if (small.length) console.log('   SMALL ' + JSON.stringify(small));
  if (clipped.length) console.log('   CLIPPED ' + clipped.join(' | '));
  console.log('   min font ' + (data.fonts.length ? Math.min(...data.fonts) : '-') + 'px | targets ' + data.targets.length);
}
console.log('\n' + (bad === 0 ? 'LAYOUT CHECK: PASS (0 overlaps / 0 clipped / >=48px)' : 'LAYOUT CHECK: FAIL (' + bad + ' sizes)'));
await closeAll();
process.exit(bad ? 1 : 0);
