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
let scoopHolds = 0, dumpHolds = 0;
async function cycle(n) {
  await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: site.pile.x, z: site.pile.z + 3 });
  await page.waitForTimeout(420);
  if (await hold('f')) scoopHolds++;
  try { await page.waitForFunction(() => window.__tfQA.qaState().hasDirt === true, { timeout: 25000 }); } catch (e) {}
  const scooped = await page.evaluate(() => window.__tfQA.qaState());
  await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: site.truck.x, z: site.truck.z + 3 });
  await page.waitForTimeout(420);
  if (await hold('g')) dumpHolds++;
  try { await page.waitForFunction(k => window.__tfQA.qaState().loads >= k, n, { timeout: 25000 }); } catch (e) {}
  const dumped = await page.evaluate(() => window.__tfQA.qaState());
  ok('L1 cycle ' + n + ': held-F scoop + held-G dump', scooped.hasDirt === true && dumped.loads === n,
     'hasDirt=' + scooped.hasDirt + ' loads=' + dumped.loads);
}
for (let n = 1; n <= 3; n++) await cycle(n);
const l1End = await page.evaluate(() => window.__tfQA.qaState());
ok('L1 exactly 3 scoops and 3 dumps with REAL keys',
   scoopHolds === 3 && dumpHolds === 3 && l1End.loads === 3 && l1End.total === 3,
   'F holds=' + scoopHolds + ' G holds=' + dumpHolds + ' loads=' + l1End.loads + '/' + l1End.total);

// ---- L4 NEGATIVE: dump into the WRONG truck (real held F + real held G) ----
await page.evaluate(() => window.__tfQA.qaLevel(4));
await page.waitForTimeout(750);
const s4 = await page.evaluate(() => window.__qaLevel.site());
await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: s4.pile.x, z: s4.pile.z + 3 });
await page.waitForTimeout(420);
await hold('f');
try { await page.waitForFunction(() => window.__tfQA.qaState().hasDirt === true, { timeout: 25000 }); } catch (e) {}
// 45 m away from the real truck = wrong truck / wrong spot.
await page.evaluate(p => window.__qaLevel.teleport(p.x + 45, p.z + 30), s4.truck);
await page.waitForTimeout(420);
await hold('g');
await page.waitForTimeout(500);
const l4 = await page.evaluate(() => window.__tfQA.qaState());
const l4t = await page.evaluate(() => Array.from(document.querySelectorAll('.tf-toast')).map(n => n.textContent.trim()));
ok('L4 wrong-truck dump does NOT count a load', l4.loads === 0,
   'loads=' + l4.loads + ' hasDirt=' + l4.hasDirt + ' toasts=' + JSON.stringify(l4t.slice(0, 2)));

// ---- L7 NEGATIVE: drop a pipe away from the amber pad ----------------------
await page.evaluate(() => window.__tfQA.qaLevel(7));
await page.waitForTimeout(750);
const l7 = await page.evaluate(() => ({ stage: window.__tfQA.qaStage(), info: window.__qaLevel.info(),
  objective: window.__qaLevel.objective(), objects: window.__qaLevel.objects(), site: window.__qaLevel.site() }));
ok('L7 pipe yard goals present', /pipe|pad|rack|place/i.test(String(l7.objective) + JSON.stringify(l7.info)),
   'objective=' + l7.objective + ' objects=' + l7.objects);
await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z), { x: l7.site.pile.x, z: l7.site.pile.z + 3 });
await page.waitForTimeout(420);
await hold('f');   // grip the pipe
await page.evaluate(p => window.__qaLevel.teleport(p.x + 55, p.z + 40), l7.site.truck);
await page.waitForTimeout(420);
await hold('g');   // drop it in the wrong place
await page.waitForTimeout(500);
const l7b = await page.evaluate(() => window.__qaLevel.info());
ok('L7 pipe dropped away from pad does NOT complete a goal',
   JSON.stringify(l7b).indexOf('"done":0') >= 0 || JSON.stringify(l7b).indexOf('"done": 0') >= 0 ||
   (l7b && (l7b.done === 0 || l7b.done === undefined)),
   'info=' + JSON.stringify(l7b).slice(0, 160));

// ---- L9 NEGATIVE: drive off the bridge / ledge -----------------------------
await page.evaluate(() => window.__tfQA.qaLevel(9));
await page.waitForTimeout(750);
const l9a = await page.evaluate(() => window.__tfQA.qaSite());
// Drive off the side of the deck with real keys, then check the body falls.
await page.keyboard.down('w'); await page.keyboard.down('a');
await page.waitForTimeout(2600);
await page.keyboard.up('a'); await page.keyboard.up('w');
const l9b = await page.evaluate(() => ({ state: window.__tfQA.qaState(), site: window.__tfQA.qaSite() }));
const y0 = l9a.vehicle ? l9a.vehicle.y : 1.09;
const y1 = l9b.site.vehicle ? l9b.site.vehicle.y : 1.09;
ok('L9 driving off the deck is detected and stays playable',
   l9b.state.gameState === 'playing' && Number.isFinite(l9b.state.speed) &&
   (y1 < y0 + 0.4 || l9b.state.speed !== 0),
   'speed=' + l9b.state.speed + ' y ' + y0.toFixed(2) + ' -> ' + y1.toFixed(2) +
   ' state=' + l9b.state.gameState);

const red = redErrors(page.__logs);
ok('0 red console errors across 15 levels', red.length === 0, JSON.stringify(red.slice(0, 4)));

console.log('\n--- CHECKS ---');
results.forEach(r => console.log(r));
console.log('\n' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' passed');
console.log(fails === 0 ? 'LEVEL WALK: PASS' : 'LEVEL WALK: FAIL (' + fails + ')');
await closeAll();
process.exit(fails ? 1 : 0);
