// A1 EVIDENCE - real Chromium, real computed styles.
// Walks EVERY screen, every button, computes WCAG contrast of its label/icon
// against the effective background (including CSS gradients), and reports
// the full table. Fails on white-on-white, default buttonface, tiny labels.
import { serve, newContext, openGame, closeAll } from './browser.mjs';

const SCREENS = [
  ['start',    null],
  ['play',     'play'],
  ['pause',    'pause'],
  ['settings', 'settings'],
  ['help',     'help'],
  ['levels',   'levels'],
  ['garage',   'garage'],
  ['map',      'map'],
  ['result',   'result'],
  ['fail',     'fail'],
  ['confirm',  'confirm']
];

const rgb = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
};
const lum = (c) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
// chain = the computed background of the element, then each ancestor.
const effectiveBg = (chain) => {
  for (const step of chain) {
    if (step.bi && step.bi !== 'none') {
      const cols = [];
      for (const m of step.bi.matchAll(/rgba?\([^)]+\)/g)) { const c = rgb(m[0]); if (c) cols.push(c); }
      if (cols.length) return cols;
    }
    const c = rgb(step.bc);
    if (c && c[3] > 0.55) return [c];
  }
  return [[11, 17, 26, 1]];   // the app well colour
};

let fails = 0, total = 0;
const rows = [];
console.log('REAL BROWSER CONTRAST TABLE (computed styles, Chromium 153)\n');
console.log('SCREEN      ELEMENT                       FG        BG SAMPLES   MIN RATIO  SIZE  RESULT');

await serve();
const ctx = await newContext({ viewport: { width: 1280, height: 720 } });
const page = await openGame(ctx, { settle: 1600 });

for (const [name, how] of SCREENS) {
  if (how === 'play') {
    await page.click('.tf-play'); await page.waitForTimeout(700);
  } else if (how) {
    await page.evaluate(k => window.__tfQA && window.__tfQA.qaWindow(k), how);
    await page.waitForTimeout(300);
  }
  const found = await page.evaluate(() => {
    const res = [];
    const roots = [document.getElementById('tf-start'), document.getElementById('tf-win'), document.getElementById('tf-hud')]
      .filter(e => e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden');
    for (const root of roots) {
      const nodes = root.querySelectorAll('button, [role="button"], .tf-row label, .tf-h2, .tf-help-line, .tf-confirm p');
      for (const n of nodes) {
        const r = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden') continue;
        if (cs.display === 'none' || parseFloat(cs.opacity) < 0.3) continue;
        let label = (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 26);
        if (!label) label = n.getAttribute('aria-label') || n.id || String(n.className);
        const icon = n.querySelector('.tf-ic');
        const chain = [];
        let a = n;
        while (a && chain.length < 7) {
          const c = getComputedStyle(a);
          chain.push({ bc: c.backgroundColor, bi: c.backgroundImage });
          a = a.parentElement;
        }
        res.push({ label, tag: n.tagName, cls: String(n.className),
          fg: cs.color, iconFg: icon ? getComputedStyle(icon).color : null,
          chain, size: Math.round(parseFloat(cs.fontSize)),
          w: Math.round(r.width), h: Math.round(r.height), bgc: cs.backgroundColor });
      }
    }
    return res;
  });
  for (const e of found) {
    total++;
    const bgs = effectiveBg(e.chain);
    const fgs = [rgb(e.fg), rgb(e.iconFg)].filter(Boolean);
    let min = 99;
    for (const f of fgs) for (const b of bgs) min = Math.min(min, ratio(f, b));
    const isButton = e.tag === 'BUTTON';
    const whiteDefault = /rgb\(239, 239, 239\)/.test(e.bgc);
    const tooSmall = isButton && e.size && e.size < 11;
    const bad = min < 4.5 || whiteDefault || tooSmall;
    if (bad) fails++;
    rows.push({ screen: name, ...e, min: Number(min.toFixed(2)), bad });
    console.log(name.padEnd(11) + ' ' + String(e.label).slice(0, 25).padEnd(26) + ' ' +
      String(rgb(e.fg) ? rgb(e.fg).slice(0, 3).join(',') : '-').padEnd(9) + ' ' +
      String(bgs.length).padEnd(11) + ' ' + min.toFixed(2).padEnd(10) + ' ' +
      String(e.size).padEnd(5) + ' ' + (bad ? 'FAIL' : 'OK'));
  }
}
console.log('\nchecked ' + total + ' elements across ' + SCREENS.length + ' screens');
console.log('default buttonface / white-on-white: ' + rows.filter(r => /rgb\(239, 239, 239\)/.test(r.bgc)).length);
console.log('contrast failures (<4.5): ' + rows.filter(r => r.min < 4.5).length);
console.log('total FAIL rows: ' + fails);
console.log(fails === 0 ? '\nCONTRAST CHECK: PASS (0 fails)' : '\nCONTRAST CHECK: FAIL');
if (fails) for (const r of rows.filter(x => x.bad).slice(0, 20)) console.log('  BAD', r.screen, r.label, r.min, r.bgc);
await closeAll();
process.exit(fails ? 1 : 0);
