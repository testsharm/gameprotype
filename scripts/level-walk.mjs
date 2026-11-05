// TIER 5 level walk - run: node scripts/level-walk.mjs
// Node-only harness (no browser). Builds all 15 real LevelEngine instances,
// walks every goal, and prints the per-level design table.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_URL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;

function ctx2d() {
  const o = { fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1 };
  return new Proxy(o, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return () => ({ width: 10 });
      return () => {};
    }, set(t, k, v) { t[k] = v; return true; }
  });
}
const canvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d(), toDataURL: () => 'data:,' });
globalThis.document = { createElement: () => canvas(), createElementNS: () => canvas(),
  head: { appendChild() {} }, body: { appendChild() {}, classList: { add() {}, remove() {} } },
  addEventListener() {}, getElementById() { return null; }, querySelector() { return null; },
  querySelectorAll() { return []; }, hidden: false };
globalThis.window = { addEventListener() {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1 };
Object.defineProperty(globalThis, 'navigator', { value: { maxTouchPoints: 0 }, configurable: true });
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.location = { search: '' };
globalThis.requestAnimationFrame = () => 0;
globalThis.performance = globalThis.performance || { now: () => 0 };

const THREE = await import(THREE_URL);
const src = fs.readFileSync(path.join(ROOT, 'src/gameplay/Levels.js'), 'utf8')
  .replace("from 'three'", `from '${THREE_URL}'`);
const { LEVELS, LevelEngine, levelStartPose } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

function makeWorld(site) {
  const clods = Array.from({ length: 45 }, () => ({}));
  return {
    dirtPileGroup: { position: { x: site.pile.x, z: site.pile.z }, visible: true, clear() {}, add() {}, remove() {} },
    truckGroup: { position: { x: site.truck.x, z: site.truck.z }, visible: true },
    jobSiteBase: { visible: true },
    allDirtClods: clods.slice(), _masterClods: clods.slice(),
    shrinkDirtPile() { const floor = Math.ceil(this._masterClods.length / 3);
      for (let i = 0; i < 8 && this.allDirtClods.length > floor; i++) this.allDirtClods.pop(); },
    resetDirtPile() { this.allDirtClods = this._masterClods.slice(); this.dirtPileGroup.visible = true; }
  };
}

// Real scoop -> drive -> dump for each goal. Gate goals are driven through.
function walkGoal(engine, site) {
  const g = engine.active();
  if (!g) return false;
  if (g.kind === 'gate') { engine._advance(); return true; }
  const srcPos = (g.kind === 'trench' || g.kind === 'debris' || g.kind === 'move')
    ? new THREE.Vector3(g.x, 2, g.z) : new THREE.Vector3(site.pile.x, 2, site.pile.z);
  engine.onScoop(srcPos, null);
  const tgt = engine.rushTarget || engine.site.truck;
  const r = engine.onDump(new THREE.Vector3(tgt.x, 2, tgt.z), null);
  return !!r.count;
}

console.log('TIER 5 - 15 LEVEL WALK (Node harness, no browser)\n');
console.log('ID  NAME                 TYPE   CH  SKY      CITY(x,z)      GOALS  FIRST   RULE');
console.log('--- -------------------- ------ -- -------- -------------- ------ ------- ----------------------------------------');
const rows = [];
let failures = 0;
for (const job of LEVELS) {
  const s = job.site || { bearing: 0, dist: 120, spread: 30, gap: 20 };
  const rad = (s.bearing || 0) * Math.PI / 180;
  const cx = Math.round(Math.cos(rad) * (s.dist || 120));
  const cz = Math.round(Math.sin(rad) * (s.dist || 120));
  const site = { pile: { x: cx - 10, z: cz }, truck: { x: cx + 10, z: cz } };
  const world = makeWorld(site);
  const hooks = { onCount() {}, onChange() {}, onToast() {}, truckSolid() {}, onCombo() {} };
  const eng = new LevelEngine(new THREE.Scene(), world,
    { pile: { x: site.pile.x, z: site.pile.z }, truck: { x: site.truck.x, z: site.truck.z } }, hooks);
  let goals = 0, walk = 0;
  try { goals = eng.start(job, site); } catch (e) { failures++; console.log('START FAIL', job.id, e.message); continue; }
  const first = eng.activeKind();
  const pose = levelStartPose(job, site, eng.active());
  let guard = 0;
  while (!eng.isFinished() && guard++ < 40) {
    if (!walkGoal(eng, site)) break;
    walk++;
  }
  const ok = eng.isFinished() && walk === goals && eng.info().done === goals;
  if (!ok) failures++;
  rows.push({ id: job.id, name: job.name, type: job.type, chapter: job.chapter,
    sky: (job.env && job.env.id) || 'day', city: `${cx},${cz}`, goals, walk, first,
    start: `${Math.round(pose.x)},${Math.round(pose.z)}`, yaw: (pose.yaw * 180 / Math.PI).toFixed(0),
    theme: job.theme, rule: job.rule, ok });
  console.log(String(job.id).padEnd(3) + ' ' + job.name.slice(0, 20).padEnd(21) + ' ' +
    job.type.padEnd(6) + ' ' + String(job.chapter).padEnd(2) + ' ' +
    ((job.env && job.env.id) || 'day').padEnd(8) + ' ' + `${cx},${cz}`.padEnd(14) + ' ' +
    String(goals).padEnd(6) + ' ' + first.padEnd(7) + ' ' + (ok ? 'OK  ' : 'FAIL') + ' ' + (job.rule || '').slice(0, 42));
}
console.log('\nID  START(x,z)   YAW   THEME                  WALKED  STATUS');
for (const r of rows) console.log(String(r.id).padEnd(3) + ' ' + r.start.padEnd(13) + ' ' +
  r.yaw.padEnd(5) + ' ' + r.theme.slice(0, 22).padEnd(23) + ' ' + `${r.walk}/${r.goals}`.padEnd(7) + ' ' + (r.ok ? 'PASS' : 'FAIL'));
const types = new Set(rows.map(r => r.type));
const skies = new Set(rows.map(r => r.sky));
const starts = new Set(rows.map(r => r.start));
console.log(`\nlevels=${rows.length} types=${types.size} skies=${skies.size} distinct starts=${starts.size} failures=${failures}`);
console.log(failures === 0 && rows.length === 15 ? 'TIER 5 LEVEL WALK: PASS' : 'TIER 5 LEVEL WALK: FAIL');
process.exit(failures === 0 && rows.length === 15 ? 0 : 1);
