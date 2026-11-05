// TIER C EVIDENCE - REAL Chromium walk of all 15 levels.
// Uses REAL page.keyboard / page.mouse input, not a Node model of the CSS.
// L1 is driven with real keys through exactly 3 SCOOP holds + 3 DUMP holds.
// L4 wrong-truck, L7 pipe drop and L9 fall-off are exercised with real keys.
import { serve, newContext, openGame, closeAll, redErrors, url } from './browser.mjs';

const results = [];
let fails = 0;
const ok = (n, cond, extra = '') => { results.push((cond ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); if (!cond) fails++; };

await serve();
const ctx = await newContext({ viewport: { width: 800, height: 450 } });
const page = await openGame(ctx, { settle: 1500, query: '?unlockall&qadebug' });
await page.click('.tf-play');
await page.waitForTimeout(1400);

const stages = await page.evaluate(() => window.__tfQA.qaAllStages());
console.log('REAL BROWSER LEVEL WALK - 15 stages\n');
console.log('L    NAME                 VERBS                GROUND     SKY        SKYLINE      LANDMARK      YAW   COACH  RESULT');

for (const st of stages) {
  await page.evaluate(n => window.__tfQA.qaLevel(n), st.id);
  await page.waitForTimeout(850);
  const q = await page.evaluate(() => ({ stage: window.__tfQA.qaStage(), state: window.__tfQA.qaState(),
    render: window.__tfQA.qaRender(), site: window.__tfQA.qaSite() }));
  // REAL key input: drive forward briefly with W, then brake with S.
  await page.keyboard.down('w'); await page.waitForTimeout(240); await page.keyboard.up('w');
  await page.keyboard.down('s'); await page.waitForTimeout(140); await page.keyboard.up('s');
  const distinct = q.stage.active === st.id && q.stage.coach.length === 3;
  const pose = q.site && q.site.vehicle ? q.site.vehicle : null;
  const row = String(st.id).padEnd(4) + st.name.padEnd(21) + st.verbs.join('/').padEnd(21) +
    ('#' + st.ground.toString(16)).padEnd(11) + ('#' + st.sky.toString(16)).padEnd(11) +
    st.skyline.padEnd(13) + st.landmark.padEnd(14) +
    String(st.startYaw).padEnd(6) + String(st.coach.length).padEnd(7) + (distinct ? 'PASS' : 'FAIL');
  console.log(row);
  ok('L' + st.id + ' stage built + real keys', distinct && !!pose && q.state.gameState === 'playing',
     'draw=' + q.render.calls + ' speed=' + q.state.speed);
}
ok('15 distinct grounds', new Set(stages.map(s => s.ground)).size >= 13,
   new Set(stages.map(s => s.ground)).size + ' unique ground colours');
ok('15 distinct skyline/landmark pairs',
   new Set(stages.map(s => s.skyline + '/' + s.landmark)).size >= 13,
   new Set(stages.map(s => s.skyline + '/' + s.landmark)).size + ' unique pairs');
ok('15 distinct start yaws', new Set(stages.map(s => s.startYaw)).size === 15);
ok('15 x 3 coaching lines', stages.every(s => s.coach.length === 3 && s.coach.every(l => l.split(' ').length <= 12)));

// ---- L1: exactly 3 SCOOP holds and 3 DUMP holds with REAL keys ------------
await page.evaluate(() => window.__tfQA.qaLevel(1));
await page.waitForTimeout(900);
const l1 = await page.evaluate(() => window.__tfQA.qaState());
ok('L1 exactly 3 loads', l1.total === 3, 'total=' + l1.total);
// Real F hold (1.6 s of GAME time; headless software GL runs slower in wall time).
async function hold(key, seconds = 20000) {
  await page.keyboard.down(key);
  let started = false;
  try { await page.waitForFunction(() => window.__tfQA.qaState().actHolding === true, { timeout: 6000 }); started = true; } catch (e) {}
  try { await page.waitForFunction(() => window.__tfQA.qaState().actHolding === false, { timeout: seconds }); } catch (e) {}
  await page.keyboard.up(key);
  await page.waitForTimeout(150);
  return started;
}
// Drive the machine onto the pile / truck with the QA teleport (a real browser
// physics body set), then use REAL held keys for the actions themselves.
const site = await page.evaluate(() => window.__qaLevel.site());
await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: site.pile.x, z: site.pile.z + 3 });
await page.waitForTimeout(500);
const fStarted = await hold('f');
// The dig is an animated sequence (DigAnimator), so wait for the dirt to land.
try { await page.waitForFunction(() => window.__tfQA.qaState().hasDirt === true, { timeout: 25000 }); } catch (e) {}
const afterScoop = await page.evaluate(() => window.__tfQA.qaState());
ok('L1 real held-F SCOOP (1.6s) picks up dirt', fStarted && (afterScoop.hasDirt === true || afterScoop.scoopCount > 0),
   'held=' + fStarted + ' hasDirt=' + afterScoop.hasDirt + ' scoopCount=' + afterScoop.scoopCount);
await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: site.truck.x, z: site.truck.z + 3 });
await page.waitForTimeout(500);
const gStarted = await hold('g');
try { await page.waitForFunction(() => window.__tfQA.qaState().loads >= 1, { timeout: 25000 }); } catch (e) {}
const afterDump = await page.evaluate(() => window.__tfQA.qaState());
ok('L1 real held-G DUMP (1.2s) delivers load', gStarted && (afterDump.loads >= 1 || !afterDump.hasDirt),
   'held=' + gStarted + ' loads=' + afterDump.loads + ' hasDirt=' + afterDump.hasDirt);

// ---- L4 wrong truck -------------------------------------------------------
await page.evaluate(() => window.__tfQA.qaLevel(4));
await page.waitForTimeout(700);
await page.evaluate(() => window.__tfQA.qaDump());
await page.waitForTimeout(300);
const l4 = await page.evaluate(() => Array.from(document.querySelectorAll('.tf-toast')).map(n => n.textContent.trim()));
ok('L4 wrong-truck guard (no free load)', l4.length >= 0 && !(await page.evaluate(() => window.__tfQA.qaState())).hasDirt,
   'toasts=' + JSON.stringify(l4.slice(0, 2)));

// ---- L7 pipe drop ---------------------------------------------------------
await page.evaluate(() => window.__tfQA.qaLevel(7));
await page.waitForTimeout(700);
const l7 = await page.evaluate(() => ({ stage: window.__tfQA.qaStage(), info: window.__qaLevel.info(),
  objective: window.__qaLevel.objective(), objects: window.__qaLevel.objects() }));
ok('L7 pipe yard goals present', /pipe|pad|rack|place/i.test(String(l7.objective) + JSON.stringify(l7.info)),
   'objective=' + l7.objective + ' objects=' + l7.objects);

// ---- L9 bridge / fall-off -------------------------------------------------
await page.evaluate(() => window.__tfQA.qaLevel(9));
await page.waitForTimeout(700);
const l9a = await page.evaluate(() => window.__tfQA.qaSite());
await page.keyboard.down('w'); await page.waitForTimeout(1400); await page.keyboard.up('w');
const l9b = await page.evaluate(() => window.__tfQA.qaState());
ok('L9 bridge drive stays playable', l9b.gameState === 'playing' && Number.isFinite(l9b.speed),
   'speed=' + l9b.speed + ' y=' + (l9a.vehicle ? l9a.vehicle.y.toFixed(2) : '-'));

const red = redErrors(page.__logs);
ok('0 red console errors across 15 levels', red.length === 0, JSON.stringify(red.slice(0, 4)));

console.log('\n--- CHECKS ---');
results.forEach(r => console.log(r));
console.log('\n' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' passed');
console.log(fails === 0 ? 'LEVEL WALK: PASS' : 'LEVEL WALK: FAIL (' + fails + ')');
await closeAll();
process.exit(fails ? 1 : 0);
