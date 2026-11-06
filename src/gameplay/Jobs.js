// TerraForm 3D - real jobs, levels, economy, ranks, daily bonus (M7a part 1).
// Economy and progression, plus code-made site dressing.
import * as THREE from 'three';
// Coins stay in main.js (saveData.coins). This file only tells main.js how many to add.
// Round 2: the 15 real levels live in Levels.js; this file keeps economy, save and windows.
import { LEVELS, chapterOf } from './Levels.js';

const SAVE_KEY = 'terraform_jobs_v1';
const ROAD_POS = [-240, -160, -80, 80, 160, 240];
const ROAD_HALF = 12;
let SITE_R = 11;

export const MAX_LEVEL = 4;
export const START = { x: -35, y: 1.2, z: 10, yaw: Math.PI };
export const STAR_MULT = [1, 1.15, 1.3];
export const TIPS = [10, 16, 24, 34];
export const DAILY = [50, 75, 100, 150, 200, 300, 500];

export const RANKS = [
  { name: 'Rookie', xp: 0 },
  { name: 'Operator', xp: 150 },
  { name: 'Foreman', xp: 400 },
  { name: 'Site Boss', xp: 800 },
  { name: 'Master Builder', xp: 1400 },
  { name: 'Legend', xp: 2200 }
];

// TIER E: ONE source of truth for the SIX garage upgrades, four paid steps
// (100 / 250 / 500 / 900). main.js GARAGE mirrors this table exactly.
export const UPGRADES = {
  engine:    { name: 'Engine Power', prices: [100, 250, 500, 900],
    lines: ['32 km/h', '37 km/h', '42 km/h', '47 km/h', '52 km/h'] },
  hydraulic: { name: 'Hydraulics', prices: [100, 250, 500, 900],
    lines: ['Arm speed 100%', 'Arm speed 160%', 'Arm speed 220%', 'Arm speed 280%', 'Arm speed 340%'] },
  bucket:    { name: 'Big Bucket', prices: [100, 250, 500, 900],
    lines: ['Tip 10 coins', 'Tip 16 coins', 'Tip 24 coins', 'Tip 34 coins', 'Tip 44 coins'] },
  tyres:     { name: 'Tyres', prices: [100, 250, 500, 900],
    lines: ['Grip 100%', 'Grip 115%', 'Grip 130%', 'Grip 145%', 'Grip 160%'] },
  light:     { name: 'Work Light', prices: [100, 250, 500, 900],
    lines: ['Night light 100%', 'Night light 125%', 'Night light 150%', 'Night light 175%', 'Night light 200%'] },
  beacon:    { name: 'Beacon', prices: [100, 250, 500, 900],
    lines: ['Coin bonus +0%', 'Coin bonus +3%', 'Coin bonus +6%', 'Coin bonus +10%', 'Coin bonus +15%'] }
};
export const UPGRADE_KEYS = Object.keys(UPGRADES);

// bearing: 0 = north (-z), 90 = east. dist = metres from the garage. gap = pile to truck distance.
// LEVELS (Levels.js) is the single source of truth for all 15 jobs: goals, rules, mood and site.
export const JOBS = LEVELS;

// ---------- helpers ----------
function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function pad2(n) { return String(n).padStart(2, '0'); }
function dayStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function today() { return dayStr(new Date()); }
function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); }

function defaultSave() {
  return { v: 1, jobs: {}, xp: 0, last: 1, daily: { last: '', streak: 0 }, stats: { loads: 0, jobs: 0 } };
}
function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    const b = defaultSave();
    return {
      ...b, ...d,
      jobs: { ...(d.jobs || {}) },
      daily: { ...b.daily, ...(d.daily || {}) },
      stats: { ...b.stats, ...(d.stats || {}) }
    };
  } catch (e) { return defaultSave(); }
}
function freshState(job) {
  return { loads: 0, elapsed: 0, extra: 0, timeLeft: job.time, running: false, done: false, failed: false, phase: 'scoop', tips: 0, result: null };
}

export function rankInfo(xp) {
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].xp) i = k;
  const cur = RANKS[i];
  const nxt = RANKS[i + 1] || null;
  const into = xp - cur.xp;
  const need = nxt ? nxt.xp - cur.xp : 0;
  return { index: i, name: cur.name, xp, next: nxt ? nxt.name : null, into, need, pct: nxt ? Math.min(1, into / need) : 1, bonus: i * 0.03 };
}
export function tipFor(level) {
  const l = Math.min(Math.max(level || 1, 1), MAX_LEVEL);
  return TIPS[l - 1];
}
export function upgradeCost(kind, level, discount) {
  const u = UPGRADES[kind];
  if (!u || level >= MAX_LEVEL) return null;
  return Math.round(u.prices[level - 1] * (1 - (discount || 0)));
}

// ---------- site finder (finds free ground for each job, uses the real buildings) ----------
const CELL = 32;
const PAD = 14;

function buildIndex(buildings, props) {
  const rects = [];
  const add = (cx, cz, hw, hd, kind) => {
    if (!Number.isFinite(cx) || !Number.isFinite(cz) || !Number.isFinite(hw) || !Number.isFinite(hd)) return;
    if (Math.abs(cx) > 420 || Math.abs(cz) > 420) return;
    rects.push([cx, cz, hw, hd, kind]);
  };
  for (const b of buildings || []) {
    if (!b) continue;
    const hw = (b.w || 0) / 2, hd = (b.d || 0) / 2;
    add(b.x, b.z, hw, hd, 0);              // box centred on x,z
    // (x,z is the box centre, confirmed by main.js keepCameraClear)    // same box if x,z is a corner (safe both ways)
  }
  for (const c of props || []) {
    if (!c) continue;
    const x = c.x !== undefined ? c.x : (c.position ? c.position.x : undefined);
    const z = c.z !== undefined ? c.z : (c.position ? c.position.z : undefined);
    let hw = c.hx !== undefined ? c.hx : c.hw !== undefined ? c.hw : c.w !== undefined ? c.w / 2 : c.r !== undefined ? c.r : 1.2;
    let hd = c.hz !== undefined ? c.hz : c.hd !== undefined ? c.hd : c.d !== undefined ? c.d / 2 : c.r !== undefined ? c.r : hw;
    add(x, z, hw, hd, 1);
  }
  const grid = new Map();
  const key = (i, j) => i * 10007 + j;
  for (let k = 0; k < rects.length; k++) {
    const r = rects[k];
    const i0 = Math.floor((r[0] - r[2] - PAD) / CELL), i1 = Math.floor((r[0] + r[2] + PAD) / CELL);
    const j0 = Math.floor((r[1] - r[3] - PAD) / CELL), j1 = Math.floor((r[1] + r[3] + PAD) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const kk = key(i, j);
      let a = grid.get(kk);
      if (!a) { a = []; grid.set(kk, a); }
      a.push(k);
    }
  }
  return { rects, grid, key, used: [{ x: 0, z: -120, r: 34 }] };
}

function isClear(idx, x, z, r) {
  for (const R of ROAD_POS) {
    if (Math.abs(x - R) < ROAD_HALF + r || Math.abs(z - R) < ROAD_HALF + r) return false;
  }
  if (Math.abs(x) < 64 && Math.abs(z) < 64) return false; // garage yard
  for (const u of idx.used) {
    if (Math.hypot(x - u.x, z - u.z) < u.r + r) return false;
  }
  const list = idx.grid.get(idx.key(Math.floor(x / CELL), Math.floor(z / CELL)));
  if (list) {
    for (let n = 0; n < list.length; n++) {
      const q = idx.rects[list[n]];
      const rr = q[4] === 1 ? Math.min(r, 7) : r;
      if (Math.abs(x - q[0]) < q[2] + rr && Math.abs(z - q[1]) < q[3] + rr) return false;
    }
  }
  return true;
}

const OFFSETS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function resolveAll(idx) {
  const out = new Map();
  for (const job of JOBS) {
    const s = job.site;
    if (!s || s.keep) { out.set(job.id, { ok: true, keep: true }); continue; }
    let best = null;
    for (let x = -270; x <= 270; x += 4) {
      for (let z = -270; z <= 270; z += 4) {
        const d = Math.hypot(x, z);
        if (Math.abs(d - s.dist) > 70) continue;
        let a = Math.atan2(x, -z) * 180 / Math.PI;
        if (a < 0) a += 360;
        const diff = Math.abs(((a - s.bearing + 540) % 360) - 180);
        if (diff > s.spread) continue;
        const score = Math.abs(d - s.dist) + diff * 0.6;
        if (best && score >= best.score) continue;
        if (!isClear(idx, x, z, SITE_R)) continue;
        for (const o of OFFSETS) {
          const tx = x + o[0] * s.gap, tz = z + o[1] * s.gap;
          if (Math.hypot(tx, tz) < 290 && isClear(idx, tx, tz, SITE_R)) {
            best = { score, x, z, tx, tz };
            break;
          }
        }
      }
    }
    if (best) {
      out.set(job.id, { ok: true, keep: false, pile: { x: best.x, z: best.z }, truck: { x: best.tx, z: best.tz } });
      idx.used.push({ x: best.x, z: best.z, r: 30 }, { x: best.tx, z: best.tz, r: 30 });
    } else {
      out.set(job.id, { ok: false });
    }
  }
  return out;
}

// ---------- the job system ----------
export class JobSystem {
  constructor() {
    this.save = readSave();
    this.current = JOBS[0];
    this.state = freshState(this.current);
    this.onTick = null;   // (secondsLeft:int) => void
    this.onFail = null;   // (job, state) => void
    this._sec = -1;
    this._layout = null;
  }

  list() { return JOBS; }
  get(id) { return JOBS.find(j => j.id === id) || null; }
  record(id) { return this.save.jobs[id] || { done: false, stars: 0, best: 0, plays: 0 }; }
  isDone(id) { return !!(this.save.jobs[id] && this.save.jobs[id].done); }
  rankInfo() { return rankInfo(this.save.xp); }
  persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { /* ignore */ } }

  lockReason(id, ctx) {
    ctx = ctx || {};
    const j = this.get(id);
    if (!j) return 'Unknown job';
    try { if (/[?&]unlockall/.test(location.search)) return ''; } catch (e) { /* ignore */ }
    const n = j.needs || {};
    if (n.job && !this.isDone(n.job)) return 'FINISH LEVEL ' + n.job;
    return '';
  }
  isUnlocked(id, ctx) { return this.lockReason(id, ctx) === ''; }
  nextId(ctx) {
    const n = this.current.id + 1;
    return this.get(n) && this.isUnlocked(n, ctx) ? n : null;
  }
  lastPlayed() { return this.get(this.save.last) ? this.save.last : 1; }

  // Show a level on the start screen WITHOUT starting its clock.
  // freshState() leaves running=false, so addLoad()/update() cannot advance it.
  prepare(id) {
    const j = this.get(id) || JOBS[0];
    this.current = j;
    this.state = freshState(j);
    this._sec = -1;
    return j;
  }

  start(id) {
    const j = this.get(id) || JOBS[0];
    this.current = j;
    this.state = freshState(j);
    this.state.running = true;
    this.save.last = j.id;
    this.persist();
    this._sec = -1;
    if (this.onTick) this.onTick(j.time);
    return j;
  }

  update(dt) {
    const s = this.state;
    if (!s.running) return;
    s.elapsed += dt;
    s.timeLeft = Math.max(0, this.current.time + s.extra - s.elapsed);
    const sec = Math.ceil(s.timeLeft);
    if (sec !== this._sec) { this._sec = sec; if (this.onTick) this.onTick(sec); }
    if (s.timeLeft <= 0) {
      s.running = false;
      s.failed = true;
      if (this.onFail) this.onFail(this.current, s);
    }
  }

  addTime(sec) {
    const s = this.state;
    s.extra += sec;
    if (s.failed && !s.done) { s.failed = false; s.running = true; this._sec = -1; }
    s.timeLeft = Math.max(0, this.current.time + s.extra - s.elapsed);
  }

  setPhase(p) { this.state.phase = p === 'dump' ? 'dump' : 'scoop'; }
  objective() { return this.state.phase === 'dump' ? this.current.dumpText : this.current.scoopText; }
  hint() { return this.state.phase === 'dump' ? this.current.hints.dump : this.current.hints.scoop; }
  stepText() {
    const s = this.state;
    return (s.phase === 'dump' ? 'Dump in truck ' : 'Scoop dirt ') + s.loads + '/' + this.current.loads;
  }

  addLoad(ctx) {
    const s = this.state;
    if (!s.running || s.done) return null;
    s.loads++;
    s.phase = 'scoop';
    const tip = tipFor((ctx || {}).bucketLevel);
    s.tips += tip;
    this.save.stats.loads++;
    return { loads: s.loads, total: this.current.loads, tip, complete: s.loads >= this.current.loads };
  }

  complete(ctx) {
    ctx = ctx || {};
    const s = this.state, job = this.current;
    if (s.done && s.result) return s.result;
    s.running = false;
    s.done = true;
    const unlockedBefore = JOBS.filter(j => this.isUnlocked(j.id, ctx)).map(j => j.id);
    const left = Math.max(0, s.timeLeft);
    const ratio = left / job.time;
    const stars = ratio > 0.5 ? 3 : ratio > 0.2 ? 2 : 1;
    const rec = this.record(job.id);
    const first = !rec.done;
    const rankBefore = this.rankInfo();
    const base = Math.round(job.reward * (first ? 1 : 0.4));
    const starBonus = Math.round(base * (STAR_MULT[stars - 1] - 1));
    const rankBonus = Math.round((base + starBonus) * rankBefore.bonus);
    const coins = base + starBonus + rankBonus;
    const xpGain = first ? 100 + 40 * stars : 30 + 15 * stars;
    const used = Math.round(s.elapsed);
    const newBest = !rec.best || used < rec.best;
    rec.done = true;
    rec.stars = Math.max(rec.stars || 0, stars);
    rec.best = newBest ? used : rec.best;
    rec.plays = (rec.plays || 0) + 1;
    this.save.jobs[job.id] = rec;
    this.save.xp += xpGain;
    this.save.stats.jobs++;
    this.persist();
    const rankAfter = this.rankInfo();
    const newlyUnlocked = JOBS.filter(j => this.isUnlocked(j.id, ctx) && unlockedBefore.indexOf(j.id) < 0);
    s.result = {
      job, stars, timeLeft: left, timeUsed: used, firstClear: first, newBest,
      base, starBonus, rankBonus, coins, tips: s.tips, xpGain,
      rankBefore, rankAfter, rankUp: rankAfter.index > rankBefore.index,
      newlyUnlocked, nextId: this.nextId(ctx)
    };
    return s.result;
  }

  // daily bonus
  dailyStatus() {
    const d = this.save.daily, t = today();
    if (d.last === t) {
      return { canClaim: false, streak: d.streak, day: ((d.streak - 1) % 7) + 1, amount: 0, nextDay: (d.streak % 7) + 1, nextAmount: DAILY[d.streak % 7] };
    }
    const streak = d.last === yesterday() ? d.streak + 1 : 1;
    const day = ((streak - 1) % 7) + 1;
    return { canClaim: true, streak, day, amount: DAILY[day - 1], nextDay: 0, nextAmount: 0 };
  }
  claimDaily(mult) {
    const st = this.dailyStatus();
    if (!st.canClaim) return 0;
    this.save.daily = { last: today(), streak: st.streak };
    this.persist();
    return Math.round(st.amount * (mult || 1));
  }

  // where the pile and truck go for each job (null-safe, cached)
  layout(buildingData, propColliders) {
    if (!this._layout) {
      try {
        let out = resolveAll(buildIndex(buildingData, propColliders));
        if ([...out.values()].some(v => !v.ok)) { SITE_R = 7; out = resolveAll(buildIndex(buildingData, propColliders)); SITE_R = 11; }
        this._layout = out;
      }
      catch (e) { console.warn('[Jobs] site finder failed', e); this._layout = new Map(); }
    }
    return this._layout;
  }
  siteFor(id) {
    // Independent job sites: no shared street/building/pile coordinates.
    if (id <= 15) { const x = id * 1100, z = 1800;
      return {ok:true, keep:false, pile:{x,z}, truck:{x:x+(id===2?80:id===8?70:id===9?80:30),z}};
    }
    return (this._layout && this._layout.get(id)) || { ok: false };
  }
}

// TIER 3: the old JobPanels window system (briefing / result / fail / picker /
// shop) was removed. All windows now live in src/ui/Menus.js with one steel
// look, a round red X and no long sentences. Nothing here creates DOM.

// ---------- site dressing: visual only, built once per job site ----------
export function buildSiteDressing(THREE, id, pile, truck) {
  const job = JOBS.find(j => j.id === id) || JOBS[0];
  const dress = job.dressing || 'yard';
  const g = new THREE.Group();
  g.name = 'jobSite' + id;
  let seed = id * 7919 + 13;
  const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const dx = truck.x - pile.x, dz = truck.z - pile.z;
  const dl = Math.hypot(dx, dz) || 1;
  const ux = dx / dl, uz = dz / dl, vx = -uz, vz = ux;
  const yawU = Math.atan2(ux, uz);
  const P = (a, b, o) => { const q = o || pile; return { x: q.x + ux * a + vx * b, z: q.z + uz * a + vz * b }; };
  const onCorridor = (x, z) => {
    const ax = (x - pile.x) * ux + (z - pile.z) * uz;
    const bx = (x - pile.x) * vx + (z - pile.z) * vz;
    return ax > -14 && ax < dl + 12 && Math.abs(bx) < 9;
  };
  const mats = {};
  const M = (c, extra) => {
    const k = c + JSON.stringify(extra || {});
    if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0.05 }, extra || {}));
    return mats[k];
  };
  const add = (geo, mat, x, y, z, ry, shadow) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    m.castShadow = shadow !== false;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const box = (w, h, d, x, y, z, c, ry, extra) => add(new THREE.BoxGeometry(w, h, d), M(c, extra), x, y, z, ry);
  const cyl = (rt, rb, h, x, y, z, c, extra) => add(new THREE.CylinderGeometry(rt, rb, h, 12), M(c, extra), x, y, z, 0);
  const pad = (p, r, c, y) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ color: c, roughness: 1, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, y, p.z);
    m.receiveShadow = true;
    g.add(m);
  };
  const cone = (x, z) => {
    cyl(0.16, 0.42, 1.0, x, 0.5, z, 0xf97316);
    cyl(0.25, 0.3, 0.2, x, 0.55, z, 0xffffff);
  };
  const tree = (x, z) => {
    const s = 0.8 + R() * 0.6;
    cyl(0.4 * s, 0.55 * s, 3.2 * s, x, 1.6 * s, z, 0x6b4a2b);
    add(new THREE.ConeGeometry(2.3 * s, 3.6 * s, 10), M(0x2f6f3a), x, 4.4 * s, z, 0);
    add(new THREE.ConeGeometry(1.7 * s, 3.0 * s, 10), M(0x3a8546), x, 6.2 * s, z, 0);
  };
  const rock = (x, z) => {
    const s = 0.9 + R() * 1.3;
    const m = add(new THREE.DodecahedronGeometry(s, 0), M(0x7d7468, { flatShading: true }), x, s * 0.55, z, R() * 6);
    m.scale.set(1, 0.7, 1.1);
  };
  const lamp = (x, z, h, power) => {
    cyl(0.28, 0.4, h, x, h / 2, z, 0x5b6573);
    box(1.8, 0.7, 0.6, x, h + 0.3, z, 0xfff4c9, yawU, { emissive: 0xffe9a8, emissiveIntensity: 0.75, roughness: 0.4 });
    if (power) {
      const L = new THREE.PointLight(0xfff0c8, power, 70, 2);
      L.position.set(x, h - 0.5, z);
      g.add(L);
    }
  };
  const beacon = (x, y, z) => {
    add(new THREE.SphereGeometry(0.42, 12, 8), M(0xffb020, { emissive: 0xff9a00, emissiveIntensity: 2.6 }), x, y, z, 0, false);
  };
  const sign = (text, sub) => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 160;
    const c = cv.getContext('2d');
    c.fillStyle = '#1b2535'; c.fillRect(0, 0, 512, 160);
    c.fillStyle = '#fbbf24'; c.fillRect(0, 0, 512, 14); c.fillRect(0, 146, 512, 14);
    c.textAlign = 'center';
    let fs = 54;
    c.font = 'bold ' + fs + 'px system-ui,sans-serif';
    while (c.measureText(text).width > 470 && fs > 24) { fs -= 2; c.font = 'bold ' + fs + 'px system-ui,sans-serif'; }
    c.fillStyle = '#ffffff'; c.fillText(text, 256, 84);
    c.fillStyle = '#fcd34d'; c.font = 'bold 30px system-ui,sans-serif'; c.fillText(sub, 256, 126);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const len = Math.hypot(pile.x, pile.z) || 1;
    const nx = -pile.x / len, nz = -pile.z / len;
    const ry = Math.atan2(nx, nz);
    const cx = pile.x + nx * 50 + nz * 30, cz = pile.z + nz * 50 - nx * 30;
    cyl(0.2, 0.2, 3.4, cx - nz, 1.7, cz + nx, 0x5b6573);
    cyl(0.2, 0.2, 3.4, cx + nz, 1.7, cz - nx, 0x5b6573);
    box(2.5, 1.2, 0.4, cx, 3.5, cz, 0x1b2535, ry);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 1.16), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.set(cx + nx * 0.23, 3.5, cz + nz * 0.23);
    face.rotation.y = ry;
    g.add(face);
  };

  const T = {
    yard:   { a: 0x7a6a55, b: 0x7d7468 },
    course: { a: 0x9aa4ad, b: 0x4b5563 },
    road:   { a: 0x8d8d88, b: 0x7d7d79 },
    park:   { a: 0x6b7a47, b: 0x8a8272 },
    city:   { a: 0x6f7681, b: 0x4b5563 },
    trench: { a: 0x7a6a55, b: 0x8a8272 },
    pipes:  { a: 0x6b7280, b: 0x4b5563 },
    night:  { a: 0x4f4338, b: 0x5d5a55 },
    bridge: { a: 0x8d8d88, b: 0x6b7280 },
    storm:  { a: 0x4b4842, b: 0x5a5852 },
    crane:  { a: 0x8f7f6a, b: 0x9a9388 },
    mega:   { a: 0x8d7a5c, b: 0x6b7280 }
  }[dress] || { a: 0x7a6a55, b: 0x7d7468 };
  pad(pile, 13, T.a, 0.12);
  pad(truck, 9.5, T.b, 0.13);

  // cones around both spots (not in the driving corridor)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = pile.x + Math.cos(a) * 14.6, z = pile.z + Math.sin(a) * 14.6;
    if (!onCorridor(x, z)) cone(x, z);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const x = truck.x + Math.cos(a) * 11, z = truck.z + Math.sin(a) * 11;
    if (!onCorridor(x, z)) cone(x, z);
  }

  sign('LEVEL ' + id + ' - ' + job.name.toUpperCase(), (job.type || '') + ' - ' + chapterOf(id).name);

  if (dress === 'park') { // park landslide
    for (let i = 0; i < 10; i++) { const a = R() * 6.28, r = 7 + R() * 6; rock(pile.x + Math.cos(a) * r, pile.z + Math.sin(a) * r); }
    for (let i = 0; i < 12; i++) {
      const a = R() * 6.28, r = 19 + R() * 9;
      const x = pile.x + Math.cos(a) * r, z = pile.z + Math.sin(a) * r;
      if (!onCorridor(x, z)) tree(x, z);
    }
    for (let k = -1; k <= 1; k += 2) {
      const p = P(dl * 0.5, k * 12);
      box(2.6, 0.4, 0.9, p.x, 0.75, p.z, 0x8a5a2b, yawU);
      box(2.6, 0.9, 0.35, p.x + vx * k * 0.4, 1.25, p.z + vz * k * 0.4, 0x8a5a2b, yawU);
    }
  } else if (dress === 'bridge' || dress === 'road' || dress === 'city') { // road / bridge / city works
    for (let b = -12; b <= 12.1; b += 3.6) {
      const p = P(-12, b);
      box(3.2, 1.1, 0.9, p.x, 0.55, p.z, 0xb9b9b3, yawU + Math.PI / 2);
      box(3.22, 0.3, 0.92, p.x, 1.2, p.z, 0xf59e0b, yawU + Math.PI / 2);
    }
    for (let b = -14; b <= 14.1; b += 3.5) {
      const p = P(dl + 8, b);
      box(0.5, 1.5, 0.5, p.x, 0.75, p.z, 0x9ca3af);
    }
    { const p = P(dl + 8, 0); box(0.45, 0.45, 28.5, p.x, 1.35, p.z, 0xd1d5db, yawU + Math.PI / 2); }
    for (const k of [-14, 14]) { const p = P(-12, k); box(1.7, 1.7, 0.35, p.x, 1.9, p.z, 0xf59e0b, yawU + Math.PI / 4); beacon(p.x, 3.1, p.z); }
  } else if (dress === 'night') { // night shift
    const a = P(-8, -12), b = P(-8, 12), c = P(dl + 6, 0);
    lamp(a.x, a.z, 9.5, 260); lamp(b.x, b.z, 9.5, 260); lamp(c.x, c.z, 9.5, 240);
    for (let i = 0; i < 5; i++) { const p = P(R() * 14 - 4, R() * 20 - 10, pile); box(1.3, 1.3, 1.3, p.x, 0.65, p.z, 0x6b7280, R() * 3); }
    for (let k = -1; k <= 1; k += 2) { const p = P(dl * 0.5, k * 10); beacon(p.x, 1.3, p.z); cyl(0.3, 0.3, 0.9, p.x, 0.45, p.z, 0x334155); }
  } else if (dress === 'storm') { // storm rescue
    for (let i = 0; i < 4; i++) {
      const a = R() * 6.28, r = 12 + R() * 6;
      const x = pile.x + Math.cos(a) * r, z = pile.z + Math.sin(a) * r;
      if (onCorridor(x, z)) continue;
      const m = add(new THREE.CylinderGeometry(0.65, 0.75, 9, 10), M(0x5b4630), x, 0.7, z, R() * 3);
      m.rotation.z = Math.PI / 2;
      const f = add(new THREE.SphereGeometry(2.1, 10, 8), M(0x2f4a2a), x + 4, 1.2, z, 0);
      f.scale.set(1, 0.7, 1);
    }
    for (let i = 0; i < 8; i++) { const a = R() * 6.28, r = 6 + R() * 9; box(1 + R() * 0.7, 0.9 + R() * 0.6, 1 + R() * 0.7, pile.x + Math.cos(a) * r, 0.6, pile.z + Math.sin(a) * r, [0x7a6a55, 0x6b7280, 0x8a5a2b][i % 3], R() * 3); }
    for (let i = 0; i < 5; i++) {
      const a = R() * 6.28, r = 4 + R() * 9, s = 2.5 + R() * 1.5;
      const m = new THREE.Mesh(new THREE.CircleGeometry(s, 24), new THREE.MeshStandardMaterial({ color: 0x5d7488, roughness: 0.12, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }));
      m.rotation.x = -Math.PI / 2; m.position.set(truck.x + Math.cos(a) * r, 0.14, truck.z + Math.sin(a) * r); g.add(m);
    }
    for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) { const p = P(dl - 7 + row * 0.8, -4 + i * 1.3, pile); box(1.2, 0.5, 0.8, p.x, 0.3 + row * 0.5, p.z, 0xb6a27a, yawU + Math.PI / 2); }
  } else if (dress === 'crane' || dress === 'mega' || dress === 'pipes') { // tower crane / final site / pipe yard
    const base = P(12, 35);
    box(3.4, 1.0, 3.4, base.x, 0.5, base.z, 0x6b7280);
    box(1.2, 26, 1.2, base.x, 13.5, base.z, 0xf5b301);
    box(24, 0.9, 0.9, base.x + ux * 8, 26.6, base.z + uz * 8, 0xf5b301, Math.atan2(uz, -ux) + Math.PI / 2 * 0 + 0, {});
    box(2.2, 2.2, 2.2, base.x, 25.6, base.z, 0x1f2937);
    box(5, 1.6, 1.6, base.x - ux * 5, 27, base.z - uz * 5, 0x6b7280, Math.atan2(uz, -ux));
    cyl(0.22, 0.22, 11, base.x + ux * 12, 21, base.z + uz * 12, 0x111827);
    box(2.2, 1.4, 2.2, base.x + ux * 12, 15, base.z + uz * 12, 0xea580c, yawU);
    for (let i = 0; i < 3; i++) { const p = P(dl - 6, -6 + i * 6, pile); box(0.55, 0.55, 8, p.x, 0.4 + (i % 2) * 0.55, p.z, 0xc2410c, yawU + 0.2 * i); }
    for (let i = 0; i < 3; i++) { const p = P(-6, -9 + i * 1.4); box(7, 0.5, 0.5, p.x, 0.3, p.z, 0x374151, yawU + Math.PI / 2); }
    for (let k = -1; k <= 1; k += 2) { const p = P(-10, k * 11); beacon(p.x, 1.4, p.z); cyl(0.3, 0.3, 1, p.x, 0.5, p.z, 0x334155); }
  }
  if (dress === 'course' || dress === 'trench' || dress === 'pipes') {
    for (let i = 0; i < 6; i++) {
      const p = P(-12 + i * (dl + 20) / 5, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 0.7), M(dress === 'course' ? 0xf1f5f9 : 0xfbbf24, { emissive: 0x3a2a05, emissiveIntensity: 0.3 }));
      m.position.set(p.x, 0.16, p.z);
      m.rotation.y = yawU + Math.PI / 2;
      m.receiveShadow = true;
      g.add(m);
    }
    for (const k of [-1, 1]) {
      const p = P(dl * 0.5, k * 13);
      cyl(0.22, 0.3, 7, p.x, 3.5, p.z, 0x5b6573);
      box(1.8, 0.8, 0.6, p.x, 7.2, p.z, 0xfff4c9, yawU, { emissive: 0xffe9a8, emissiveIntensity: 2.2 });
    }
  }
  return g;
}

export default JobSystem;
