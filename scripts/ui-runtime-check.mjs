// Headless DOM harness: constructs the real GameUI + Menus modules and clicks
// every button. This is NOT a browser: no layout, no paint, no real touch.
// Run: node scripts/ui-runtime-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let ID = 0;
class ClassList {
  constructor(el) { this.el = el; }
  _set() { return new Set(String(this.el.attrs.class || '').split(/\s+/).filter(Boolean)); }
  add(...c) { const s = this._set(); c.forEach(x => s.add(x)); this.el.attrs.class = [...s].join(' '); }
  remove(...c) { const s = this._set(); c.forEach(x => s.delete(x)); this.el.attrs.class = [...s].join(' '); }
  toggle(c, force) { const s = this._set(); const on = force === undefined ? !s.has(c) : !!force; if (on) s.add(c); else s.delete(c); this.el.attrs.class = [...s].join(' '); return on; }
  contains(c) { return this._set().has(c); }
  get value() { return this.el.attrs.class || ''; }
}
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'use']);
function parseHTML(html, doc) {
  const root = new El('#fragment', {}, doc);
  const stack = [root];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  let last = 0, m;
  const pushText = (t) => { if (t) stack[stack.length - 1].children.push(String(t)); };
  while ((m = re.exec(html))) {
    pushText(html.slice(last, m.index));
    last = re.lastIndex;
    const [, close, tag, rawAttrs, selfClose] = m;
    if (close) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag.toLowerCase()) { stack.length = i; break; }
      }
      continue;
    }
    const attrs = {};
    const ar = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
    let a;
    while ((a = ar.exec(rawAttrs))) attrs[a[1]] = a[2];
    const el = new El(tag.toLowerCase(), attrs, doc);
    stack[stack.length - 1].children.push(el);
    el.parent = stack[stack.length - 1];
    if (!selfClose && !VOID.has(el.tag)) stack.push(el);
  }
  pushText(html.slice(last));
  return root;
}
class El {
  constructor(tag, attrs, doc) {
    this.tag = tag; this.attrs = attrs || {}; this.children = []; this.parent = null;
    this.doc = doc; this.listeners = {}; this._text = ''; this.disabled = false;
    this.value = attrs && attrs.value !== undefined ? attrs.value : '';
    this.style = { cssText: '', setProperty(k, v) { this[k] = v; } };
    this.classList = new ClassList(this);
    this.uid = ++ID;
    this.width = +(attrs && attrs.width) || 180; this.height = +(attrs && attrs.height) || 180;
  }
  get parentElement() { return this.parent; }
  get type() { return this.attrs.type || ''; }
  get firstChild() { return this.children[0]; }
  get lastChild() { return this.children[this.children.length - 1]; }
  get isConnected() { let n = this; while (n.parent) n = n.parent; return n === this.doc.documentElement || n === this.doc.body; }
  get id() { return this.attrs.id || ''; }
  set id(v) { this.attrs.id = v; }
  get dataset() { const d = {}; for (const k in this.attrs) if (k.startsWith('data-')) d[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = this.attrs[k]; return d; }
  set className(v) { this.attrs.class = v; }
  get className() { return this.attrs.class || ''; }
  set innerHTML(v) {
    this.children = [];
    const frag = parseHTML(String(v), this.doc);
    for (const c of frag.children) { if (c instanceof El) c.parent = this; this.children.push(c); }
    this._text = '';
    this.doc._reindex();
  }
  get innerHTML() { return this._html || ''; }
  set textContent(v) { this.children = []; this._text = String(v); }
  get textContent() {
    if (this._text) return this._text;
    return this.children.map(c => typeof c === 'string' ? c : c.textContent).join('');
  }
  appendChild(c) { if (c.parent) c.parent.removeChild(c); c.parent = this; this.children.push(c); this.doc._reindex(); return c; }
  insertBefore(c, ref) { const i = this.children.indexOf(ref); c.parent = this; this.children.splice(i < 0 ? this.children.length : i, 0, c); this.doc._reindex(); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parent = null; this.doc._reindex(); }
  remove() { if (this.parent) this.parent.removeChild(this); }
  replaceWith(c) { if (!this.parent) return; this.parent.insertBefore(c, this); this.remove(); }
  setAttribute(k, v) { this.attrs[k] = String(v); this.doc._reindex(); }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; this.doc._reindex(); }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener(t, fn) { if (this.listeners[t]) this.listeners[t] = this.listeners[t].filter(f => f !== fn); }
  setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return false; }
  focus() {} blur() {} getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 50, right: 100, bottom: 50 }; }
  getContext() { return new Proxy({ canvas: this }, { get: (t, k) => {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return () => ({});
    }, set: (t, k, v) => { t[k] = v; return true; } }); }
  querySelectorAll(sel) { return this.doc._query(sel, this); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) { let n = this; while (n) { if (this.doc._matches(n, sel)) return n; n = n.parent; } return null; }
  matches(sel) { return this.doc._matches(this, sel); }
  dispatch(type, props) {
    const ev = Object.assign({ type, target: this, currentTarget: this, preventDefault() {}, stopPropagation() {},
      pointerId: 1, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 }, props || {});
    let n = this;
    while (n) {
      ev.currentTarget = n;
      for (const fn of (n.listeners[type] || []).slice()) fn(ev);
      n = n.parent;
    }
    return ev;
  }
  click() { this.dispatch('click'); }
}
class Doc {
  constructor() {
    this._ids = new Map();
    this.head = new El('head', {}, this);
    this.body = new El('body', {}, this);
    this.documentElement = new El('html', {}, this);
    this.documentElement.appendChild(this.head); this.documentElement.appendChild(this.body);
    this.listeners = {}; this._ids = new Map(); this.hidden = false; this.visibilityState = 'visible';
  }
  createElement(t) { return new El(String(t).toLowerCase(), {}, this); }
  createTextNode(t) { return String(t); }
  getElementById(id) { return this._ids.get(id) || null; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  removeEventListener(t, fn) { if (this.listeners[t]) this.listeners[t] = this.listeners[t].filter(f => f !== fn); }
  dispatch(t, props) {
    const ev = Object.assign({ type: t, target: this, preventDefault() {}, stopPropagation() {} }, props || {});
    for (const fn of (this.listeners[t] || []).slice()) fn(ev);
    return ev;
  }
  _reindex() {
    this._ids.clear();
    const walk = (n) => { if (n instanceof El) { if (n.id) this._ids.set(n.id, n); for (const c of n.children) walk(c); } };
    walk(this.documentElement);
  }
  _all(node) { const out = []; const walk = (n) => { for (const c of (n.children || [])) { if (c instanceof El) { out.push(c); walk(c); } } }; walk(node); return out; }
  _query(sel, root) {
    const groups = String(sel).split(',').map(s => s.trim()).filter(Boolean);
    const pool = this._all(root);
    const found = new Set();
    for (const g of groups) for (const el of pool) if (this._matches(el, g)) found.add(el);
    return pool.filter(e => found.has(e));
  }
  _matches(el, sel) {
    const parts = String(sel).trim().split(/\s+/);
    if (!this._one(el, parts[parts.length - 1])) return false;
    let i = parts.length - 2, n = el.parent;
    while (i >= 0 && n) {
      if (n instanceof El && this._one(n, parts[i])) i--;
      n = n.parent;
    }
    return i < 0;
  }
  _one(el, s) {
    if (!(el instanceof El)) return false;
    s = String(s).trim();
    if (s.startsWith('#')) return el.id === s.slice(1);
    const m = s.match(/^([a-zA-Z0-9_-]*)((?:\.[\w-]+)*)((?:\[[^\]]+\])*)$/);
    if (!m) return false;
    if (m[1] && el.tag !== m[1].toLowerCase()) return false;
    for (const c of (m[2] || '').split('.').filter(Boolean)) if (!el.classList.contains(c)) return false;
    const br = /\[([a-zA-Z-]+)(?:=["']?([^\]"']+)["']?)?\]/g; let b;
    while ((b = br.exec(m[3] || ''))) {
      const v = el.attrs[b[1]];
      if (v === undefined) return false;
      if (b[2] !== undefined && v !== b[2]) return false;
    }
    return true;
  }
}
const doc = new Doc();
// index.html skeleton
const canvas = doc.createElement('canvas'); canvas.id = 'game-container'; doc.body.appendChild(canvas);
const hold = doc.createElement('div'); hold.id = 'tf-hold'; doc.body.appendChild(hold);
const mini = doc.createElement('canvas'); mini.id = 'minimap-canvas'; hold.appendChild(mini);
const coin = doc.createElement('span'); coin.id = 'coin-count'; hold.appendChild(coin);
const load = doc.createElement('div'); load.id = 'loading-screen'; doc.body.appendChild(load);
doc._reindex();

globalThis.document = doc;
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node', hardwareConcurrency: 4, maxTouchPoints: 0 }, configurable: true });
globalThis.location = { search: '', href: 'http://localhost/' };
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
globalThis.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 0);
globalThis.cancelAnimationFrame = id => clearTimeout(id);
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; Object.assign(this, o); } };
globalThis.window = {
  innerWidth: 440, innerHeight: 956, devicePixelRatio: 1,
  addEventListener(t, fn) { (this._l = this._l || {})[t] = (this._l[t] || []).concat(fn); },
  removeEventListener() {}, dispatchEvent(ev) { for (const fn of ((this._l || {})[ev.type] || [])) fn(ev); return true; },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: globalThis.location, localStorage: globalThis.localStorage,
  navigator: globalThis.navigator, document: doc
};
globalThis.HTMLElement = El;

const actions = [], holds = [], taps = [], errors = [];
const state = () => ({ paused: false, muted: false, playing: true, currentView: 'CHASE', zoomable: true,
  zoom: 1, quality: 'high', hasProgress: false, coins: 900, rank: 'ROOKIE', level: 1, stars: 0 });
const data = () => ({
  coins: 900, volumes: { master: 1, music: 1, effects: 1 }, muted: false, quality: 'high',
  big: false, lefty: false, guide: true,
  chapters: [{ id: 1, name: 'ROOKIE YARD' }, { id: 2, name: 'CONTRACTOR' }, { id: 3, name: 'SITE BOSS' }],
  jobs: Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: 'Level ' + (i + 1), chapter: Math.floor(i / 5) + 1,
    type: ['HAUL', 'CONE', 'FILL', 'HAUL', 'RUSH'][i % 5], rule: 'Move three loads of dirt.',
    stars: i < 4 ? 3 : 0, locked: i > 4, reason: i > 4 ? 'Clear level 5 first' : '' })),
  currentJob: 1,
  upgrades: Array.from({ length: 6 }, (_, i) => ({ key: ['engine','hydraulic','bucket','tyres','light','beacon'][i],
    name: 'UPGRADE ' + (i + 1), icon: 'gear', level: i % 5 + 1, maxPips: 5, line: 'POWER +10%', price: 100 })),
  paints: ['#ffb400','#2f6fdb','#34d399','#ef4444','#e5e7eb','#7c3aed'], paint: 0, ads: false,
  map: { blocks: [{ x: 10, z: 20, w: 20, d: 20, park: true }], goals: [{ x: 0, z: -120, color: '#fbbf24' }],
         player: { x: 0, z: 0, yaw: 0 }, landmark: { x: 15, z: -120 } }
});

// package.json is CommonJS, so copy the two modules to .mjs before importing.
const TMP = path.join(ROOT, '.ui-check');
fs.mkdirSync(TMP, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/ui/Menus.js'), path.join(TMP, 'Menus.mjs'));
fs.writeFileSync(path.join(TMP, 'GameUI.mjs'),
  fs.readFileSync(path.join(ROOT, 'src/ui/GameUI.js'), 'utf8').replace("'./Menus.js'", "'./Menus.mjs'"));
let UI;
try {
  const mod = await import(path.join(TMP, 'GameUI.mjs'));
  UI = mod.default || mod.GameUI;
  globalThis.onerror = null;
} catch (e) { errors.push('IMPORT: ' + e.stack); }
finally { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {} }

let ui = null;
if (UI) {
  try {
    ui = new UI({
      hold: (c, on, t) => holds.push([c, on, t]),
      tap: (c, t) => { taps.push(c); actions.push('tap:' + c); },
      action: (a, p) => actions.push(a + (p === undefined ? '' : ':' + (typeof p === 'object' ? JSON.stringify(p) : p))),
      state, data, unlock: () => actions.push('unlock')
    });
  } catch (e) { errors.push('CONSTRUCT: ' + e.stack); }
}

const results = [];
function clickAll(label, root, filter) {
  if (!root) { results.push([label, '(no root)', 'FAIL', 'root missing']); errors.push(label + ': no root'); return; }
  const btns = root.querySelectorAll('[data-a]').filter(b => !b.disabled && (!filter || filter(b)));
  for (const b of btns) {
    const a = b.attrs['data-a'];
    const before = actions.length;
    try {
      b.dispatch('pointerdown', { pointerId: 7 });
      b.dispatch('click', { pointerId: 7 });
      b.dispatch('pointerup', { pointerId: 7 });
      results.push([label, a, actions.length > before ? 'PASS' : 'NO-OP', actions.slice(before).join('|') || '(handled locally)']);
    } catch (e) { results.push([label, a, 'FAIL', String(e.message)]); errors.push(label + '/' + a + ': ' + e.message); }
  }
  return btns.length;
}

if (ui) {
  // Screen by screen. GameUI/Menus are real modules; only the DOM is simulated.
  clickAll('start', doc.getElementById('tf-start'));
  ui.setScreen('play'); ui.setStartInfo(state()); ui.refresh();
  clickAll('hud', doc.getElementById('tf-hud'));
  // Pause + minimap have their own click listeners (no data-a).
  for (const [id, expect] of [['tf-pause', 'pause'], ['tf-mini', 'map']]) {
    const b = doc.getElementById(id);
    const n = actions.length;
    if (b) b.dispatch('click', { pointerId: 5 });
    results.push(['hud', id, actions.slice(n).includes(expect) ? 'PASS' : 'FAIL', actions.slice(n).join('|')]);
    if (!actions.slice(n).includes(expect)) errors.push(id + ' did not emit ' + expect);
  }
  for (const k of ['pause','settings','help','levels','garage','result','fail','confirm','map']) {
    ui.showModal(k);
    const win = doc.getElementById('tf-winbox') || doc.getElementById('tf-win');
    clickAll(k, win, b => b.attrs['data-a'] !== 'close' || k === 'pause');
  }
  // Settings sliders really call hub.setVolumes through the 'setting' action.
  ui.showModal('settings');
  {
    const win = doc.getElementById('tf-winbox') || doc.getElementById('tf-win');
    for (const key of ['master', 'music', 'effects']) {
      const r = win && win.querySelector(`[data-set="${key}"]`);
      const n = actions.length;
      if (r) { r.value = '55'; r.dispatch('change', { pointerId: 3 }); }
      const hit = actions.slice(n).some(a => a.startsWith('setting:') && a.includes('"key":"' + key + '"'));
      results.push(['settings', 'slider:' + key, hit ? 'PASS' : 'FAIL', actions.slice(n).join('|')]);
      if (!hit) errors.push('slider ' + key + ' did not fire');
    }
  }
  // hold controls (real pointerdown / pointerup)
  for (const code of ['KeyW','KeyA','KeyS','KeyD','Space']) {
    const b = doc.getElementById('tf-hud').querySelector(`[data-code="${code}"]`);
    if (!b) { results.push(['hold', code, 'FAIL', 'button missing']); errors.push('missing ' + code); continue; }
    const n = holds.length;
    try { b.dispatch('pointerdown', { pointerId: 11 }); b.dispatch('pointerup', { pointerId: 11 });
      results.push(['hold', code, holds.length > n ? 'PASS' : 'FAIL', holds.slice(n).map(x => x.join(':')).join('|')]);
    } catch (e) { results.push(['hold', code, 'FAIL', e.message]); errors.push(e.message); }
  }
  // tap control: C only (F is a 3-second hold - tested below)
  for (const code of ['KeyC']) {
    const b = doc.getElementById('tf-hud').querySelector(`[data-code="${code}"]`);
    const n = taps.length;
    if (b) { b.dispatch('pointerdown', { pointerId: 12 }); b.dispatch('click', { pointerId: 12 }); b.dispatch('pointerup', { pointerId: 12 }); }
    results.push(['tap', code, taps.length > n ? 'PASS' : 'FAIL', taps.slice(n).join('|')]);
    if (taps.length <= n) errors.push('tap ' + code + ' did not fire');
  }
  // Action is a hold control; check the down/up callbacks and the progress ring.
  {
    const f = doc.getElementById('tf-hud').querySelector('[data-code="KeyF"]');
    const n = holds.length;
    if (f) { f.dispatch('pointerdown', { pointerId: 21 }); f.dispatch('pointerup', { pointerId: 21 }); }
    results.push(['hold', 'KeyF', holds.length > n ? 'PASS' : 'FAIL', holds.slice(n).map(x => x.join(':')).join('|')]);
    if (holds.length <= n) errors.push('KeyF hold did not fire');
    try { ui.setActionProgress(0.5); results.push(['method', 'setActionProgress', 'PASS', '50% ring']); }
    catch (e) { results.push(['method', 'setActionProgress', 'FAIL', e.message]); errors.push(e.message); }
  }
  // keyboard lights the on-screen key
  const kb = doc.getElementById('tf-hud').querySelector('[data-code="KeyW"]');
  // main.js keydown handler calls ui.setKey(code,true) on a real key press.
  ui.setKey('KeyW', true);
  results.push(['key', 'KeyW keydown', kb && kb.classList.contains('held') ? 'PASS' : 'FAIL', 'main.js -> ui.setKey']);
  if (!kb || !kb.classList.contains('held')) errors.push('key light-up failed');
  ui.setKey('KeyW', false);
  results.push(['key', 'KeyW keyup', kb && !kb.classList.contains('held') ? 'PASS' : 'FAIL', 'held cleared']);
  // every public HUD method must not throw
  for (const m of ['setJob','setTimer','setCoins','setSpeed','setHint','setMenuDot','toast','announce',
                   'showLocked','refresh','reset','setMuted','setBig','setLefty','setActionProgress','releaseAll']) {
    try { const args = { setJob: ['First Scoop', 'Scoop dirt', '0 / 3'], setTimer: [95], setCoins: [900],
      setSpeed: [30], setHint: ['Go to the pile'], setMenuDot: [true], toast: ['Hi', 'info'],
      announce: ['Level 1', 'Rookie Yard'], showLocked: ['Clear level 5'], setMuted: [true],
      setBig: [true], setLefty: [true] }[m] || [];
      ui[m](...args); results.push(['method', m, 'PASS', '']);
    } catch (e) { results.push(['method', m, 'FAIL', e.message]); errors.push(m + ': ' + e.message); }
  }
}

console.log('\n--- BUTTON / CONTROL REPORT (headless DOM, not a real browser) ---');
console.log('SCREEN       ACTION                       RESULT   DETAIL');
for (const [s, a, r, d] of results) console.log(s.padEnd(12) + ' ' + String(a).padEnd(28) + ' ' + r.padEnd(8) + ' ' + String(d).slice(0, 90));
const fails = results.filter(r => r[2] === 'FAIL').length;
console.log(`\n${results.length} controls exercised, ${fails} failures, ${errors.length} runtime errors`);
if (errors.length) { console.log('\nERRORS:'); errors.forEach(e => console.log('  ' + e.slice(0, 300))); }
console.log(fails === 0 && errors.length === 0 ? '\nUI RUNTIME CHECK: PASS' : '\nUI RUNTIME CHECK: FAIL');
process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
