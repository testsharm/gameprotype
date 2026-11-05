// TIER 1 regression check - run with:  node scripts/tier1-check.mjs
// Node-only (no browser). Proves B1 / B2 / B3 on Level 1 with real LevelEngine code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_URL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;

// Minimal DOM: Levels.js only uses canvas for RUSH countdown textures.
function ctx2d() {
  const o = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1 };
  return new Proxy(o, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 10 });
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
const canvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d(), toDataURL: () => 'data:,' });
globalThis.document = {
  createElement: () => canvas(), createElementNS: () => canvas(),
  head: { appendChild() {} }, body: { appendChild() {}, classList: { add() {}, remove() {} } },
  addEventListener() {}, getElementById() { return null; }, querySelector() { return null; },
  querySelectorAll() { return []; }, hidden: false
};
globalThis.window = { addEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true });
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.location = { search: '' };
globalThis.requestAnimationFrame = () => 0;

const THREE = await import(THREE_URL);
// Levels.js is a .js file in a CommonJS package; load it as an ES module via data URL.
const src = fs.readFileSync(path.join(ROOT, 'src/gameplay/Levels.js'), 'utf8')
  .replace("from 'three'", `from '${THREE_URL}'`);
const { LEVELS, LevelEngine } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

let counts = 0, scoops = 0, dumps = 0, resets = 0, minClods = Infinity;
// main.js translates level.onDump(...).count === true into JobSystem.addLoad().
// The harness does exactly the same thing, so `counts` is the number of loads.
const hooks = {
  onCount: () => { counts++; },
  onChange: () => {},
  onToast: () => {},
  truckSolid: () => {}
};
const site = { pile: { x: 0, z: 0 }, truck: { x: 15, z: 0 } };
const siteNow = { pile: { x: 0, z: 0 }, truck: { x: 15, z: 0 } };
const clods = Array.from({ length: 45 }, () => ({}));
const world = {
  dirtPileGroup: { position: { x: 0, z: 0 }, visible: true, clear() {}, add() {}, remove() {} },
  truckGroup: { position: { x: 15, z: 0 }, visible: true },
  jobSiteBase: { visible: true },
  allDirtClods: clods.slice(), _masterClods: clods.slice(),
  shrinkDirtPile() {
    const floor = Math.ceil(this._masterClods.length / 3);
    for (let i = 0; i < 8 && this.allDirtClods.length > floor; i++) this.allDirtClods.pop();
  },
  resetDirtPile() { resets++; this.allDirtClods = this._masterClods.slice(); this.dirtPileGroup.visible = true; }
};
const scene = new THREE.Scene();
const level = new LevelEngine(scene, world, siteNow, hooks);
const job = LEVELS[0];
const goals = level.start(job, site);

console.log('--- B2: objects visible from frame 0 ---');
console.log('goals =', goals, '| pile.visible =', world.dirtPileGroup.visible,
  '| truck.visible =', world.truckGroup.visible, '| yard.visible =', world.jobSiteBase.visible);
if (!world.dirtPileGroup.visible || !world.truckGroup.visible || !world.jobSiteBase.visible) throw new Error('B2 FAIL');

console.log('--- B1 / B3: exactly 3 scoops + 3 dumps ---');
for (let i = 0; i < 3; i++) {
  const atPile = new THREE.Vector3(site.pile.x, 1, site.pile.z);
  const atTruck = new THREE.Vector3(site.truck.x, 1, site.truck.z);
  const s = level.onScoop(atPile, null);
  scoops++;
  world.shrinkDirtPile();
  minClods = Math.min(minClods, world.allDirtClods.length);
  console.log(`load ${i + 1}: scoop count=${s.count} (must be false) | clods=${world.allDirtClods.length}`);
  if (s.count) throw new Error('B1 FAIL: a scoop completed a goal');
  const d = level.onDump(atTruck, null);
  dumps++;
  console.log(`load ${i + 1}: dump  count=${d.count} (must be true)  | resets=${resets} | clods=${world.allDirtClods.length}`);
  if (!d.count) throw new Error('B3 FAIL: dump did not count');
  counts++;   // same as main.js deliverLoad() -> JobSystem.addLoad()
}
console.log('counts =', counts, '| scoops =', scoops, '| dumps =', dumps,
  '| finished =', level.isFinished(), '| min clods =', minClods);
if (counts !== 3 || !level.isFinished() || minClods < 15) throw new Error('B1/B3 FAIL');
// B1: expiring RUSH trucks must be misses, not free progress / auto-win.
console.log('--- B1: RUSH trucks expiring is a MISS ---');
const rushJob = LEVELS.find(j => j.type === 'RUSH');
const rush = new LevelEngine(new THREE.Scene(), world, { pile: { x: 0, z: 0 }, truck: { x: 15, z: 0 } }, hooks);
rush.start(rushJob, { pile: { x: 0, z: 0 }, truck: { x: 15, z: 0 } });
const rushGoals = rush.goals.filter(g => g.kind === 'rush');
for (const g of rushGoals) rush._rushExpire(g);
console.log('rush trucks =', rushGoals.length, '| misses =', rush.info().misses,
  '| delivered =', rush.info().done, '| finished =', rush.isFinished());
if (rush.info().misses !== rushGoals.length || rush.info().done !== 0 || rush.isFinished())
  throw new Error('B1 FAIL: expired trucks completed the job');
console.log('TIER 1 CHECK: PASS');
