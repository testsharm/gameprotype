// TerraForm 3D - real jobs, levels, economy, ranks, daily bonus (M7a part 1).
// Pure logic plus its own small window system (briefing, result, fail, job picker).
// No THREE needed. main.js connects to it in M7a part 2.
// Coins stay in main.js (saveData.coins). This file only tells main.js how many to add.

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

export const UPGRADES = {
  engine: {
    name: 'Engine Power',
    prices: [100, 250, 500],
    lines: ['Top speed 32 km/h', 'Top speed 37 km/h', 'Top speed 42 km/h', 'Top speed 47 km/h']
  },
  hydraulic: {
    name: 'Hydraulics',
    prices: [100, 250, 500],
    lines: ['Arm speed 100%', 'Arm speed 160%', 'Arm speed 220%', 'Arm speed 280%']
  },
  bucket: {
    name: 'Big Bucket',
    prices: [150, 300, 600],
    lines: ['Tip 10 coins per load', 'Tip 16 coins per load', 'Tip 24 coins per load', 'Tip 34 coins per load']
  }
};

// bearing: 0 = north (-z), 90 = east. dist = metres from the garage. gap = pile to truck distance.
export const JOBS = [
  {
    id: 1, name: 'Clear the Highway', theme: 'Storm clean-up',
    story: 'A storm dumped dirt across the highway. Clear it before rush hour!',
    loads: 3, time: 180, reward: 150, tutorial: true, needs: {},
    scoopText: 'Scoop dirt from the pile', dumpText: 'Dump it in the blue truck',
    hints: { scoop: 'Drive to the dirt pile, then press F to scoop.', dump: 'Now drive to the blue truck and press F to dump.' },
    env: { id: 'day', sun: 1, hemi: 1, fog: 0.0011, fogColor: 0xcfe2f3 },
    site: { keep: true }
  },
  {
    id: 2, name: 'Park Clean-up', theme: 'Landslide',
    story: 'A landslide buried the paths of the city park. Move the dirt to the truck.',
    loads: 4, time: 210, reward: 220, needs: { job: 1 },
    scoopText: 'Scoop the landslide dirt', dumpText: 'Dump it in the park truck',
    hints: { scoop: 'New place, longer drive. Follow the arrow on the map.', dump: 'Truck is close. Line up and press F.' },
    env: { id: 'day', sun: 1, hemi: 1, fog: 0.0011, fogColor: 0xcfe2f3 },
    site: { bearing: 90, dist: 170, spread: 55, gap: 18 }
  },
  {
    id: 3, name: 'Bridge Repair', theme: 'Busy streets',
    story: 'The bridge approach is covered in dirt. Work fast, the streets are busy.',
    loads: 5, time: 270, reward: 300, needs: { job: 2 },
    scoopText: 'Scoop dirt at the bridge', dumpText: 'Dump it in the truck',
    hints: { scoop: 'Watch the cars when you cross a road.', dump: 'Do not rush into traffic. A crash costs time.' },
    env: { id: 'dusk', sun: 0.7, hemi: 0.8, fog: 0.0014, fogColor: 0xe8c9a8 },
    site: { bearing: 270, dist: 190, spread: 55, gap: 24 }
  },
  {
    id: 4, name: 'Night Shift', theme: 'Dark city',
    story: 'The city sleeps but the road crew works. Lights on, eyes open.',
    loads: 5, time: 250, reward: 380, needs: { job: 3 },
    scoopText: 'Scoop dirt in the dark', dumpText: 'Dump it in the truck',
    hints: { scoop: 'It is dark. Use the map arrow to find the pile.', dump: 'Find the truck. Its lights are on.' },
    env: { id: 'night', sun: 0.16, hemi: 0.32, fog: 0.0024, fogColor: 0x0a1020, lights: true },
    site: { bearing: 180, dist: 150, spread: 55, gap: 20 }
  },
  {
    id: 5, name: 'Storm Rescue', theme: 'Heavy fog',
    story: 'Fog and rain cut the city off. Dig a way through for the rescue trucks.',
    loads: 6, time: 320, reward: 480, needs: { job: 4 },
    scoopText: 'Scoop dirt in the fog', dumpText: 'Dump it in the rescue truck',
    hints: { scoop: 'You cannot see far. Slow down and use the map.', dump: 'The truck is near. Go slow in the fog.' },
    env: { id: 'storm', sun: 0.45, hemi: 0.7, fog: 0.0055, fogColor: 0x8e9aa6 },
    site: { bearing: 315, dist: 220, spread: 55, gap: 26 }
  },
  {
    id: 6, name: 'Skyline Foundation', theme: 'Big build',
    story: 'The new tower needs a flat base. Move a mountain of dirt, load by load.',
    loads: 8, time: 450, reward: 600, needs: { job: 5, engine: 2 },
    scoopText: 'Scoop dirt for the foundation', dumpText: 'Dump it in the big truck',
    hints: { scoop: 'The farthest site. A stronger engine helps a lot.', dump: 'Keep a steady rhythm: scoop, drive, dump.' },
    env: { id: 'dawn', sun: 0.85, hemi: 0.9, fog: 0.0016, fogColor: 0xf0d9bd },
    site: { bearing: 45, dist: 250, spread: 55, gap: 30 }
  }
];

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
    if (n.job && !this.isDone(n.job)) return 'Finish job ' + n.job + ' first';
    if (n.engine && (ctx.engineLevel || 1) < n.engine) return 'Needs Engine level ' + n.engine;
    return '';
  }
  isUnlocked(id, ctx) { return this.lockReason(id, ctx) === ''; }
  nextId(ctx) {
    const n = this.current.id + 1;
    return this.get(n) && this.isUnlocked(n, ctx) ? n : null;
  }
  lastPlayed() { return this.get(this.save.last) ? this.save.last : 1; }

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
  siteFor(id) { return (this._layout && this._layout.get(id)) || { ok: false }; }
}

// ---------- windows ----------
const STAR_PTS = '12,2 15.1,8.6 22.3,9.5 17,14.5 18.4,21.7 12,18.2 5.6,21.7 7,14.5 1.7,9.5 8.9,8.6';
function starSvg(on, size, delay) {
  const anim = delay >= 0 ? ' tf-jb-star' : '';
  const st = delay >= 0 ? ' style="animation-delay:' + delay + 's"' : '';
  return '<svg class="' + anim.trim() + '"' + st + ' width="' + size + '" height="' + size + '" viewBox="0 0 24 24"><polygon points="' + STAR_PTS + '" fill="' + (on ? '#fbbf24' : '#1b2535') + '" stroke="' + (on ? '#92400e' : '#0a0f18') + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}
const LOCK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" style="vertical-align:-3px"><rect x="5" y="11" width="14" height="10" rx="2" fill="#fbbf24"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#fbbf24" stroke-width="2.4"/></svg>';

const CSS = `
#tf-jb-root{position:fixed;inset:0;z-index:500;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#eef3fb;user-select:none}
.tf-jb-veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;background:rgba(4,8,15,.66);pointer-events:auto;overflow:auto;animation:tf-jb-fade .18s ease-out}
.tf-jb-card{position:relative;width:min(540px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:18px 20px 20px;border-radius:16px;background:linear-gradient(180deg,#2b384e,#18212f);border:2px solid #0a0f18;box-shadow:0 5px 0 #0a0f18,0 22px 44px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,255,255,.12);animation:tf-jb-rise .22s ease-out}
.tf-jb-card.wide{width:min(900px,100%)}
.tf-jb-tag{display:inline-block;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#0a0f18;background:#fbbf24;border-radius:6px;padding:3px 9px}
.tf-jb-h{margin:8px 0 2px;font-size:28px;line-height:1.1;font-weight:900;color:#fff;text-shadow:0 2px 0 #0a0f18}
.tf-jb-sub{margin:0 0 12px;font-size:16px;line-height:1.35;color:#c4cfdf}
.tf-jb-stars{display:flex;gap:8px;justify-content:center;margin:6px 0 12px}
.tf-jb-stars.sm{justify-content:flex-start;gap:3px;margin:8px 0 0}
.tf-jb-star{animation:tf-jb-pop .45s cubic-bezier(.2,1.6,.4,1) both}
.tf-jb-rows{border-radius:12px;background:#0f1622;border:2px solid #0a0f18;padding:6px 12px;margin:0 0 12px;box-shadow:inset 0 2px 6px rgba(0,0,0,.5)}
.tf-jb-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:16px;border-bottom:1px solid rgba(255,255,255,.07)}
.tf-jb-row:last-child{border-bottom:0}
.tf-jb-row b{font-variant-numeric:tabular-nums}
.tf-jb-row.total{font-size:21px;font-weight:900;color:#fbbf24}
.tf-jb-row.dim{color:#8fa0b8}
.tf-jb-row.good{color:#6ee7a7;font-weight:800}
.tf-jb-xp{height:12px;border-radius:7px;background:#0a0f18;overflow:hidden;border:1px solid #05080e;margin:4px 0}
.tf-jb-xp i{display:block;height:100%;width:0;background:linear-gradient(90deg,#34d399,#fbbf24);border-radius:7px;transition:width .9s ease-out}
.tf-jb-note{font-size:15px;color:#9fb0c8;margin:0 0 10px}
.tf-jb-up{color:#6ee7a7;font-weight:800;font-size:16px;margin:0 0 8px}
.tf-jb-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.tf-jb-btn{flex:1 1 130px;min-height:46px;padding:10px 14px;border-radius:12px;border:2px solid #0a0f18;font:800 17px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;color:#0a0f18;background:linear-gradient(180deg,#fcd34d,#f59e0b);box-shadow:0 4px 0 #0a0f18,inset 0 2px 0 rgba(255,255,255,.45)}
.tf-jb-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #0a0f18}
.tf-jb-btn.alt{color:#eef3fb;background:linear-gradient(180deg,#42536e,#2a384d);box-shadow:0 4px 0 #0a0f18,inset 0 2px 0 rgba(255,255,255,.18)}
.tf-jb-btn[disabled]{opacity:.45;cursor:not-allowed}
.tf-jb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin:10px 0 12px}
.tf-jb-job{position:relative;text-align:left;padding:12px;border-radius:12px;border:2px solid #0a0f18;background:linear-gradient(180deg,#34445f,#212d40);color:#eef3fb;font:inherit;cursor:pointer;box-shadow:0 4px 0 #0a0f18,inset 0 2px 0 rgba(255,255,255,.12)}
.tf-jb-job:hover{filter:brightness(1.12)}
.tf-jb-job.cur{outline:3px solid #fbbf24}
.tf-jb-job.lock{cursor:not-allowed;filter:grayscale(.6) brightness(.72)}
.tf-jb-job h3{margin:7px 0 3px;font-size:19px;line-height:1.15;color:#fff}
.tf-jb-job p{margin:0 0 8px;font-size:15px;line-height:1.3;color:#c4cfdf}
.tf-jb-meta{display:flex;gap:6px;flex-wrap:wrap}
.tf-jb-chip{font-size:14px;font-weight:700;padding:2px 8px;border-radius:7px;background:#0f1622;border:1px solid #05080e;color:#fcd34d}
.tf-jb-bar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 12px;border-radius:12px;background:#0f1622;border:2px solid #0a0f18;margin:8px 0;font-size:16px;box-shadow:inset 0 2px 6px rgba(0,0,0,.5)}
.tf-jb-bar b{color:#fbbf24}
.tf-jb-bar .tf-jb-btn{flex:0 0 auto;min-height:40px;padding:6px 16px;font-size:16px}
.tf-jb-brief{position:absolute;left:50%;top:26%;transform:translateX(-50%) translateY(-10px);width:min(520px,calc(100% - 24px));box-sizing:border-box;padding:10px 16px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(43,56,78,.96),rgba(24,33,47,.96));border:2px solid #0a0f18;box-shadow:0 4px 0 #0a0f18,0 14px 30px rgba(0,0,0,.45);text-align:center;opacity:0;transition:opacity .35s,transform .35s;pointer-events:none}
.tf-jb-brief.on{opacity:1;transform:translateX(-50%) translateY(0)}
.tf-jb-brief .tf-jb-h{font-size:24px;margin:6px 0 2px}
.tf-jb-brief .tf-jb-sub{margin:0;font-size:16px}
@keyframes tf-jb-fade{from{opacity:0}to{opacity:1}}
@keyframes tf-jb-rise{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes tf-jb-pop{from{opacity:0;transform:scale(.2) rotate(-25deg)}to{opacity:1;transform:none}}
@media (max-height:520px),(max-width:560px){
  .tf-jb-card{padding:12px 14px 14px}
  .tf-jb-h{font-size:22px}
  .tf-jb-brief .tf-jb-h{font-size:20px}
  .tf-jb-sub{font-size:15px;margin-bottom:8px}
  .tf-jb-row{padding:4px 0;font-size:15px}
  .tf-jb-row.total{font-size:18px}
  .tf-jb-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
  .tf-jb-btn{min-height:42px;font-size:16px}
  .tf-jb-brief{top:17%}
}
`;

export class JobPanels {
  constructor() {
    this.root = null;
    this.veil = null;
    this.brief = null;
    this._briefTimer = 0;
  }

  _ensure() {
    if (this.root) return;
    if (!document.getElementById('tf-jb-css')) {
      const st = document.createElement('style');
      st.id = 'tf-jb-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this.root = document.createElement('div');
    this.root.id = 'tf-jb-root';
    document.body.appendChild(this.root);
  }

  isOpen() { return !!this.veil; }

  hide() {
    if (this.veil) { this.veil.remove(); this.veil = null; }
  }

  _open(html, wide, onClick) {
    this._ensure();
    this.hide();
    const veil = document.createElement('div');
    veil.className = 'tf-jb-veil';
    veil.innerHTML = '<div class="tf-jb-card' + (wide ? ' wide' : '') + '">' + html + '</div>';
    veil.addEventListener('click', (e) => {
      const t = e.target.closest ? e.target.closest('[data-act],[data-id]') : null;
      if (!t) return;
      if (t.blur) t.blur();
      onClick(t);
    });
    this.root.appendChild(veil);
    this.veil = veil;
    return veil;
  }

  // short banner at the start of a job
  briefing(job, ms) {
    this._ensure();
    if (this.brief) this.brief.remove();
    clearTimeout(this._briefTimer);
    const el = document.createElement('div');
    el.className = 'tf-jb-brief';
    el.innerHTML = '<span class="tf-jb-tag">Job ' + job.id + ' - ' + job.theme + '</span><div class="tf-jb-h">' + job.name + '</div><p class="tf-jb-sub">' + job.story + '</p>';
    this.root.appendChild(el);
    this.brief = el;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    this._briefTimer = setTimeout(() => {
      el.classList.remove('on');
      setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
    }, ms || 5000);
  }

  showResult(r, h) {
    h = h || {};
    const rows = [];
    rows.push(['Job reward' + (r.firstClear ? '' : ' (repeat 40%)'), '+' + r.base, '']);
    if (r.starBonus) rows.push([r.stars + '-star bonus', '+' + r.starBonus, '']);
    if (r.rankBonus) rows.push(['Rank bonus (' + r.rankBefore.name + ')', '+' + r.rankBonus, '']);
    rows.push(['Load tips (already paid)', '+' + r.tips, 'dim']);
    rows.push(['Time used', fmtTime(r.timeUsed) + (r.newBest ? '  NEW BEST' : ''), r.newBest ? 'good' : 'dim']);
    rows.push(['Total reward', '+' + r.coins + ' coins', 'total']);
    const rowHtml = rows.map(x => '<div class="tf-jb-row ' + x[2] + '"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
    const stars = [1, 2, 3].map(n => starSvg(r.stars >= n, 46, 0.15 + n * 0.22)).join('');
    const after = r.rankAfter;
    const startPct = r.rankUp ? 0 : Math.round(r.rankBefore.pct * 100);
    const endPct = Math.round(after.pct * 100);
    const unlock = r.newlyUnlocked.length ? '<p class="tf-jb-up">New job unlocked: ' + r.newlyUnlocked.map(j => j.name).join(', ') + '</p>' : '';
    const rankTxt = (r.rankUp ? '<span class="tf-jb-up">RANK UP! </span>' : '') + after.name + (after.next ? ' - ' + after.into + '/' + after.need + ' XP to ' + after.next : ' - top rank') + ' (+' + r.xpGain + ' XP)';
    const html =
      '<span class="tf-jb-tag">Job ' + r.job.id + ' complete</span>' +
      '<div class="tf-jb-h">' + r.job.name + '</div>' +
      '<div class="tf-jb-stars">' + stars + '</div>' +
      '<div class="tf-jb-rows">' + rowHtml + '</div>' +
      unlock +
      '<p class="tf-jb-note">' + rankTxt + '</p>' +
      '<div class="tf-jb-xp"><i style="width:' + startPct + '%"></i></div>' +
      '<div class="tf-jb-btns">' +
      (r.nextId ? '<button class="tf-jb-btn" data-act="next">Next job</button>' : '') +
      '<button class="tf-jb-btn alt" data-act="replay">Replay</button>' +
      '<button class="tf-jb-btn alt" data-act="jobs">All jobs</button>' +
      '</div>';
    const veil = this._open(html, false, (t) => {
      const a = t.getAttribute('data-act');
      if (a === 'next' && h.onNext) h.onNext(r.nextId);
      else if (a === 'replay' && h.onReplay) h.onReplay();
      else if (a === 'jobs' && h.onJobs) h.onJobs();
    });
    const bar = veil.querySelector('.tf-jb-xp i');
    requestAnimationFrame(() => requestAnimationFrame(() => { if (bar) bar.style.width = endPct + '%'; }));
  }

  showFail(job, loads, h) {
    h = h || {};
    const html =
      '<span class="tf-jb-tag">Job ' + job.id + '</span>' +
      '<div class="tf-jb-h">Time is up</div>' +
      '<p class="tf-jb-sub">You delivered ' + loads + ' of ' + job.loads + ' loads. Try again, you can do it.</p>' +
      '<div class="tf-jb-btns">' +
      '<button class="tf-jb-btn" data-act="retry">Try again</button>' +
      (h.onAd ? '<button class="tf-jb-btn alt" data-act="ad">+60 seconds (watch ad)</button>' : '') +
      '<button class="tf-jb-btn alt" data-act="jobs">All jobs</button>' +
      '</div>';
    this._open(html, false, (t) => {
      const a = t.getAttribute('data-act');
      if (a === 'retry' && h.onRetry) h.onRetry();
      else if (a === 'ad' && h.onAd) h.onAd();
      else if (a === 'jobs' && h.onJobs) h.onJobs();
    });
  }

  showPicker(sys, ctx, h) {
    h = h || {};
    const rank = sys.rankInfo();
    const d = sys.dailyStatus();
    let cards = '';
    for (const j of sys.list()) {
      const why = sys.lockReason(j.id, ctx);
      const rec = sys.record(j.id);
      const stars = [1, 2, 3].map(n => starSvg(rec.stars >= n, 18, -1)).join('');
      const cur = sys.current.id === j.id;
      cards +=
        '<button type="button" class="tf-jb-job' + (why ? ' lock' : '') + (cur ? ' cur' : '') + '" data-id="' + j.id + '">' +
        '<span class="tf-jb-tag">Job ' + j.id + '</span>' +
        '<h3>' + j.name + '</h3>' +
        '<p>' + (why ? LOCK_SVG + ' ' + why : j.theme + ' - ' + j.story) + '</p>' +
        '<span class="tf-jb-meta"><span class="tf-jb-chip">' + j.loads + ' loads</span><span class="tf-jb-chip">' + fmtTime(j.time) + '</span><span class="tf-jb-chip">+' + j.reward + '</span></span>' +
        '<span class="tf-jb-stars sm">' + stars + '</span>' +
        '</button>';
    }
    const daily = d.canClaim
      ? '<div class="tf-jb-bar"><span>Daily bonus - day <b>' + d.day + '</b> of 7: <b>+' + d.amount + ' coins</b></span><button class="tf-jb-btn" data-act="daily">Claim</button></div>'
      : '<div class="tf-jb-bar"><span>Daily bonus taken. Tomorrow, day <b>' + d.nextDay + '</b>: <b>+' + d.nextAmount + ' coins</b></span></div>';
    const rankBar = '<div class="tf-jb-bar"><span>Rank: <b>' + rank.name + '</b>' + (rank.next ? ' - ' + rank.into + '/' + rank.need + ' XP to ' + rank.next : ' - top rank') + '</span><span>Coin bonus <b>+' + Math.round(rank.bonus * 100) + '%</b></span></div>';
    const html =
      '<span class="tf-jb-tag">City Rescue</span>' +
      '<div class="tf-jb-h">Choose a job</div>' +
      '<p class="tf-jb-sub">Finish jobs to unlock the next one. More stars, more coins.</p>' +
      rankBar + daily +
      '<div class="tf-jb-grid">' + cards + '</div>' +
      '<div class="tf-jb-btns"><button class="tf-jb-btn alt" data-act="close">Back to game</button></div>';
    this._open(html, true, (t) => {
      const id = t.getAttribute('data-id');
      const a = t.getAttribute('data-act');
      if (id) {
        const n = parseInt(id, 10);
        if (sys.lockReason(n, ctx)) return;
        if (h.onPick) h.onPick(n);
      } else if (a === 'daily') {
        const amt = sys.claimDaily(1);
        if (amt && h.onCoins) h.onCoins(amt, 'daily');
        this.showPicker(sys, ctx, h);
      } else if (a === 'close') {
        this.hide();
        if (h.onClose) h.onClose();
      }
    });
  }
}

// ---------- shop window with level dots ----------
const ICONS = {
  engine: '<svg width="34" height="34" viewBox="0 0 24 24"><rect x="4" y="9" width="14" height="9" rx="2" fill="#fbbf24" stroke="#92400e" stroke-width="1.2"/><rect x="8" y="5" width="6" height="4" fill="#fbbf24"/><rect x="18" y="11" width="3" height="5" fill="#fbbf24"/><rect x="1.5" y="11" width="2.5" height="5" fill="#fbbf24"/></svg>',
  hydraulic: '<svg width="34" height="34" viewBox="0 0 24 24"><rect x="2" y="8.5" width="12" height="7" rx="1.8" fill="#fbbf24" stroke="#92400e" stroke-width="1.2"/><rect x="14" y="11" width="8" height="2.6" fill="#e5e7eb"/><circle cx="3.6" cy="12" r="1.5" fill="#0a0f18"/></svg>',
  bucket: '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M3 7h13l5 7-3 5H6z" fill="#fbbf24" stroke="#92400e" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 19v2M12 19v2M16 19v2" stroke="#e5e7eb" stroke-width="2"/></svg>'
};
const CSS2 = `
.tf-up{display:flex;flex-direction:column;gap:7px;padding:12px;border-radius:12px;border:2px solid #0a0f18;background:linear-gradient(180deg,#34445f,#212d40);box-shadow:0 4px 0 #0a0f18,inset 0 2px 0 rgba(255,255,255,.12)}
.tf-up-top{display:flex;align-items:center;gap:10px}
.tf-up-top h3{margin:0;font-size:19px;color:#fff}
.tf-up-ico{flex:0 0 auto;width:46px;height:46px;border-radius:12px;background:#0f1622;border:2px solid #0a0f18;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 6px rgba(0,0,0,.5)}
.tf-up p{margin:0;font-size:15px;line-height:1.3;color:#c4cfdf}
.tf-up p b{color:#6ee7a7}
.tf-sp{display:inline-block;width:30px;height:13px;border-radius:4px;background:#0a0f18;border:1px solid #05080e;margin-right:5px;box-shadow:inset 0 2px 3px rgba(0,0,0,.6)}
.tf-sp.on{background:linear-gradient(180deg,#fde68a,#f59e0b);box-shadow:0 0 8px rgba(251,191,36,.6),inset 0 1px 0 rgba(255,255,255,.6)}
`;

JobPanels.prototype.showShop = function (getCtx, h, again) {
  h = h || {};
  this._ensure();
  if (!document.getElementById('tf-jb-css2')) {
    const st = document.createElement('style');
    st.id = 'tf-jb-css2';
    st.textContent = CSS2;
    document.head.appendChild(st);
  }
  const c = getCtx();
  let cards = '';
  for (const kind of ['engine', 'hydraulic', 'bucket']) {
    const u = UPGRADES[kind];
    const lv = Math.min(Math.max((c.levels && c.levels[kind]) || 1, 1), MAX_LEVEL);
    const cost = upgradeCost(kind, lv, 0);
    const pips = [1, 2, 3, 4].map(n => '<i class="tf-sp' + (n <= lv ? ' on' : '') + '"></i>').join('');
    let btn;
    if (cost === null) btn = '<button class="tf-jb-btn alt" disabled>MAX LEVEL</button>';
    else if (c.coins < cost) btn = '<button class="tf-jb-btn" disabled>' + cost + ' coins (need ' + (cost - c.coins) + ' more)</button>';
    else btn = '<button class="tf-jb-btn" data-act="buy" data-kind="' + kind + '">Buy - ' + cost + ' coins</button>';
    cards +=
      '<div class="tf-up"><div class="tf-up-top"><span class="tf-up-ico">' + ICONS[kind] + '</span><h3>' + u.name + '</h3></div>' +
      '<div>' + pips + '</div>' +
      '<p>Now: ' + u.lines[lv - 1] + '</p>' +
      '<p>' + (cost === null ? 'Fully upgraded' : 'Next: <b>' + u.lines[lv] + '</b>') + '</p>' +
      btn + '</div>';
  }
  const html =
    '<span class="tf-jb-tag">Workshop</span>' +
    '<div class="tf-jb-h">Upgrades</div>' +
    '<p class="tf-jb-sub">Better machine, faster jobs, more coins.</p>' +
    '<div class="tf-jb-bar"><span>Your coins: <b>' + c.coins + '</b></span><span>Job 6 needs Engine level 2</span></div>' +
    '<div class="tf-jb-grid">' + cards + '</div>' +
    '<div class="tf-jb-btns"><button class="tf-jb-btn alt" data-act="close">Back to game</button></div>';
  const veil = this._open(html, true, (t) => {
    const a = t.getAttribute('data-act');
    if (a === 'buy') {
      if (h.onBuy) h.onBuy(t.getAttribute('data-kind'));
      this.showShop(getCtx, h, true);
    } else if (a === 'close') {
      this.hide();
      if (h.onClose) h.onClose();
    }
  });
  if (again && veil) {
    veil.style.animation = 'none';
    if (veil.firstChild) veil.firstChild.style.animation = 'none';
  }
};

// ---------- site dressing: visual only, built once per job site ----------
export function buildSiteDressing(THREE, id, pile, truck) {
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
    box(2.4, 1.0, 0.8, x, h + 0.3, z, 0xfff4c9, yawU, { emissive: 0xffe9a8, emissiveIntensity: 3, roughness: 0.4 });
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
    const cx = pile.x + nx * 10 + nz * 6, cz = pile.z + nz * 10 - nx * 6;
    cyl(0.2, 0.2, 3.4, cx - nz * 3, 1.7, cz + nx * 3, 0x5b6573);
    cyl(0.2, 0.2, 3.4, cx + nz * 3, 1.7, cz - nx * 3, 0x5b6573);
    box(7.4, 2.4, 0.4, cx, 3.5, cz, 0x1b2535, ry);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.set(cx + nx * 0.23, 3.5, cz + nz * 0.23);
    face.rotation.y = ry;
    g.add(face);
  };

  const T = {
    2: { a: 0x6b7a47, b: 0x8a8272 },
    3: { a: 0x8d8d88, b: 0x7d7d79 },
    4: { a: 0x4f4338, b: 0x5d5a55 },
    5: { a: 0x4b4842, b: 0x5a5852 },
    6: { a: 0x8f7f6a, b: 0x9a9388 }
  }[id] || { a: 0x7a6a55, b: 0x7d7468 };
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

  const job = JOBS.find(j => j.id === id);
  if (job) sign('JOB ' + id + ' - ' + job.name.toUpperCase(), job.theme);

  if (id === 2) { // park landslide
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
  } else if (id === 3) { // bridge repair
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
  } else if (id === 4) { // night shift
    const a = P(-8, -12), b = P(-8, 12), c = P(dl + 6, 0);
    lamp(a.x, a.z, 9.5, 260); lamp(b.x, b.z, 9.5, 260); lamp(c.x, c.z, 9.5, 240);
    for (let i = 0; i < 5; i++) { const p = P(R() * 14 - 4, R() * 20 - 10, pile); box(1.3, 1.3, 1.3, p.x, 0.65, p.z, 0x6b7280, R() * 3); }
    for (let k = -1; k <= 1; k += 2) { const p = P(dl * 0.5, k * 10); beacon(p.x, 1.3, p.z); cyl(0.3, 0.3, 0.9, p.x, 0.45, p.z, 0x334155); }
  } else if (id === 5) { // storm rescue
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
  } else if (id === 6) { // skyline foundation with a tower crane
    const base = P(-2, 11);
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
  return g;
}

export default JobSystem;
