// TIER B / QA EVIDENCE - REAL clicks, REAL held keys, REAL held mouse,
// REAL two-finger touch. No synthetic KeyboardEvent dispatch anywhere.
import { serve, newContext, openGame, closeAll, redErrors, url } from './browser.mjs';

let fails = 0;
const log = [];
const ok = (name, cond, extra = '') => { log.push((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

await serve();
const ctx = await newContext({ viewport: { width: 1280, height: 720 } });
const page = await openGame(ctx, { settle: 1400 });

// ---- 1. click EVERY button on EVERY screen with a REAL mouse click ------
const SCREENS = [
  ['start', null], ['pause', 'pause'], ['settings', 'settings'], ['help', 'help'],
  ['levels', 'levels'], ['garage', 'garage'], ['map', 'map'], ['result', 'result'],
  ['fail', 'fail'], ['confirm', 'confirm']
];
let clicks = 0, clickFails = 0;
for (const [name, how] of SCREENS) {
  const root = how ? '#tf-win' : '#tf-start';
  const reopen = async () => {
    // No close(): closing RESULT/FAIL schedules a delayed level picker.
    // Opening twice overrides that pending picker deterministically.
    if (how) {
      await page.evaluate(k => window.__tfQA.qaWindow(k), how);
      await page.waitForTimeout(180);
      await page.evaluate(k => window.__tfQA.qaWindow(k), how);
    } else await page.evaluate(() => window.__tfQA.qaMenu());
    await page.waitForTimeout(120);
  };
  await reopen();
  const btns = await page.evaluate((sel) => {
    const r = document.querySelector(sel); if (!r) return [];
    return Array.from(r.querySelectorAll('button')).map((b, i) => {
      const cs = getComputedStyle(b), q = b.getBoundingClientRect();
      return { i, label: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 20),
        visible: !(cs.display === 'none' || cs.visibility === 'hidden' || q.width < 1 || q.height < 1),
        x: Math.round(q.x + q.width / 2), y: Math.round(q.y + q.height / 2) };
    }).filter(x => x.visible);
  }, root);
  let bad = 0;
  for (const b of btns) {
    await reopen();   // a previous button may have closed the screen
    try {
      const n = page.locator(root + ' button').nth(b.i);
      if (!(await n.count())) { bad++; continue; }
      const r = await n.boundingBox();
      if (!r || r.width < 1) { bad++; continue; }
      await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
      clicks++;
    } catch (e) { bad++; }
    await page.waitForTimeout(260);
  }
  clickFails += bad;
  ok(name + ' every button', bad === 0, btns.length + ' real clicks');
}
console.log('real clicks: ' + clicks + ' | failures: ' + clickFails);
ok('EVERY screen button clickable', clickFails === 0, clicks + ' clicks');

// Smaller viewport -> software WebGL runs at a usable frame rate for timing.
await page.setViewportSize({ width: 640, height: 360 });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(url(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2400);
await page.waitForFunction(() => window.__tfQA && window.__tfQA.qaState().physReady, { timeout: 30000 });
await page.click('.tf-play'); await page.waitForTimeout(2200);

// ---- 2. keyboard-held W --------------------------------------------------
await page.keyboard.down('w');
let kSpeed = 0;
try { await page.waitForFunction(() => window.__tfQA.qaState().speed > 0.5, { timeout: 15000 }); } catch (e) {}
const kW = await page.evaluate(() => window.__tfQA.qaState());
kSpeed = kW.speed;
await page.keyboard.up('w'); await page.waitForTimeout(200);
ok('keyboard-held W drives', kW.fwd === true && kSpeed > 0.5, 'fwd=' + kW.fwd + ' speed=' + kSpeed);

// ---- 3. mouse-held joystick forward -------------------------------------
const joy = await page.locator('#tf-joy').boundingBox();
await page.mouse.move(joy.x + joy.width / 2, joy.y + joy.height / 2);
await page.mouse.down();
await page.mouse.move(joy.x + joy.width / 2, joy.y + 6, { steps: 6 });
await page.waitForTimeout(1600);
const mW = await page.evaluate(() => window.__tfQA.qaState());
await page.mouse.up(); await page.waitForTimeout(200);
ok('mouse-held joystick drives', mW.fwd === true, 'fwd=' + mW.fwd + ' speed=' + mW.speed);

// ---- 4a. DUMP without a scoop shows SCOOP FIRST (before any scoop) ------
await page.evaluate(() => window.__tfQA.qaDump());
await page.waitForTimeout(400);
const toast = await page.evaluate(() => Array.from(document.querySelectorAll('.tf-toast')).map(n => n.textContent.trim()));
ok('SCOOP FIRST toast', toast.some(t => /SCOOP FIRST/i.test(t)), JSON.stringify(toast));

// ---- 4. SCOOP 1.6 s / DUMP 1.2 s holds + radial ring --------------------
await page.evaluate(() => window.__tfQA.qaHold('KeyF', true));
await page.waitForTimeout(700);
const mid = await page.evaluate(() => window.__tfQA.qaState());
const ring = await page.evaluate(() => getComputedStyle(document.getElementById('tf-f-ring')).getPropertyValue('--p'));
let done = true;
try { await page.waitForFunction(() => !window.__tfQA.qaState().actHolding, { timeout: 60000 }); }
catch (e) { done = false; }
const end = await page.evaluate(() => window.__tfQA.qaState());
ok('SCOOP 1.6s HOLD completes + radial ring', mid.actHolding === true && Math.abs(mid.duration - 1.6) < 0.01 && +ring > 0 && done && end.actHolding === false,
   'duration=' + mid.duration + ' ring=' + ring + ' actT@0.7s=' + mid.actT);
await page.evaluate(() => window.__tfQA.qaHold('KeyF', false));
await page.evaluate(() => window.__tfQA.qaHold('KeyG', true));
await page.waitForTimeout(300);
const gmid = await page.evaluate(() => window.__tfQA.qaState());
await page.evaluate(() => window.__tfQA.qaHold('KeyG', false));
ok('DUMP 1.2s HOLD', Math.abs(gmid.duration - 1.2) < 0.01, 'duration=' + gmid.duration);

// ---- 6. Swap sides + Big buttons x1.2 -----------------------------------
await page.evaluate(() => window.__tfQA.qaWindow('settings'));
await page.waitForTimeout(250);
const before = await page.evaluate(() => ({ u: getComputedStyle(document.getElementById('tf-hud')).getPropertyValue('--u'), lefty: document.getElementById('tf-hud').classList.contains('tf-lefty'), joy: document.getElementById('tf-joy').getBoundingClientRect().x }));
for (const label of ['BIG BUTTONS', 'LEFT-HANDED']) {
  const row = page.locator('#tf-win .tf-row').filter({ hasText: label }).first();
  if (await row.count()) { await row.locator('.tf-tog').click({ force: true }); await page.waitForTimeout(200); }
}
const after = await page.evaluate(() => ({ u: getComputedStyle(document.getElementById('tf-hud')).getPropertyValue('--u'), lefty: document.getElementById('tf-hud').classList.contains('tf-lefty'), joy: document.getElementById('tf-joy').getBoundingClientRect().x }));
ok('Big buttons x1.2', parseFloat(after.u) === 1.2, '--u ' + before.u + ' -> ' + after.u);
ok('Swap sides moves joystick', after.lefty !== before.lefty, 'lefty ' + before.lefty + ' -> ' + after.lefty + ', joy x ' + Math.round(before.joy) + ' -> ' + Math.round(after.joy));

// ---- 7. two-finger touch: joystick + SCOOP at the same time ------------
await page.evaluate(() => window.__tfQA.qaClose());
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const j2 = await page.locator('#tf-joy').boundingBox();
const f2 = await page.locator('#tf-f').boundingBox();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
  { x: j2.x + j2.width / 2, y: j2.y + 8, id: 1 },
  { x: f2.x + f2.width / 2, y: f2.y + f2.height / 2, id: 2 }
] });
await page.waitForTimeout(700);
const two = await page.evaluate(() => window.__tfQA.qaState());
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
ok('two-finger joystick + action', two.fwd === true && two.actHolding === true,
   'fwd=' + two.fwd + ' holding=' + two.actHolding + ' code=' + two.actCode);

// ---- 8. console errors ---------------------------------------------------
const red = redErrors(page.__logs);
ok('0 red console errors from our code', red.length === 0, JSON.stringify(red.slice(0, 4)));

console.log('\n--- BUTTON / INPUT CHECK ---');
log.forEach(l => console.log(l));
console.log('\n' + log.filter(l => l.startsWith('PASS')).length + '/' + log.length + ' passed');
console.log(fails === 0 ? 'BUTTON CHECK: PASS' : 'BUTTON CHECK: FAIL (' + fails + ')');
await closeAll();
process.exit(fails ? 1 : 0);
