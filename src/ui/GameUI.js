// GameUI.js - mission card, round speedometer, toasts, hint, coin counter.
// All styles are injected here (class prefix "tf-"). No outside fonts, images or scripts.
// Public API (used by main.js): setJob, setTimer, setCoins, setSpeed, toast, showLocked, setHint, reset.

const SVGNS = 'http://www.w3.org/2000/svg';
const MAX_KMH = 50;                    // dial scale end
const R_TRACK = 76;
const ARC = 2 * Math.PI * R_TRACK;     // full circle length
const SWEEP = ARC * 0.75;              // 270 degrees

const CSS = `
:root{--tf-dial:clamp(104px,min(26vh,34vw),190px);}
.tf-card,.tf-dial,.tf-toasts,.tf-hint,.tf-locked{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none;-webkit-user-select:none;}
.speedometer-ui{visibility:hidden !important;}

.tf-card{position:fixed;top:12px;left:50%;transform:translateX(-50%);width:min(440px,calc(100vw - 360px));min-width:230px;z-index:4;pointer-events:none;border-radius:14px;overflow:hidden;color:#fff;
 background:linear-gradient(180deg,rgba(46,60,82,.95),rgba(14,22,34,.95));border:1px solid rgba(255,255,255,.12);
 box-shadow:0 12px 30px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.16);}
.tf-stripe{height:7px;background:repeating-linear-gradient(-45deg,#fbbf24 0 10px,#151b27 10px 20px);}
.tf-body{padding:10px 14px 12px;}
.tf-row{display:flex;align-items:center;gap:10px;}
.tf-ico{width:22px;height:22px;flex:none;}
.tf-title{flex:1;min-width:0;font-size:18px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#fbbf24;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 2px 4px rgba(0,0,0,.5);}
.tf-timer{flex:none;display:flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.14);font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;color:#e2e8f0;}
.tf-timer svg{width:16px;height:16px;}
.tf-timer.warn{color:#fbbf24;border-color:rgba(251,191,36,.65);}
.tf-timer.danger{color:#fca5a5;border-color:rgba(239,68,68,.85);animation:tf-pulse .8s ease-in-out infinite;}
.tf-timer.off{display:none;}
.tf-obj{margin:6px 0 8px;font-size:16px;color:#cbd5e1;line-height:1.3;}
.tf-stepline{display:flex;justify-content:space-between;align-items:baseline;font-size:16px;font-weight:700;}
.tf-count{color:#fbbf24;font-variant-numeric:tabular-nums;}
.tf-bar{margin-top:6px;height:10px;border-radius:6px;background:rgba(0,0,0,.45);box-shadow:inset 0 2px 3px rgba(0,0,0,.6);overflow:hidden;}
.tf-fill{height:100%;width:0;border-radius:6px;background:linear-gradient(180deg,#fde68a,#f59e0b 55%,#d97706);box-shadow:0 0 10px rgba(251,191,36,.6);transition:width .45s cubic-bezier(.2,.8,.2,1);}

.tf-toasts{position:fixed;left:50%;top:calc(var(--tf-card-h,130px) + 24px);transform:translateX(-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;}
.tf-toast{display:flex;align-items:center;gap:10px;padding:8px 16px 8px 12px;border-radius:12px;font-size:18px;font-weight:700;color:#fff;max-width:90vw;text-align:center;
 background:linear-gradient(180deg,rgba(46,60,82,.96),rgba(16,24,37,.96));border:1px solid rgba(255,255,255,.14);border-left:5px solid #fbbf24;
 box-shadow:0 8px 22px rgba(0,0,0,.45);animation:tf-in .28s cubic-bezier(.2,.9,.3,1.2) both;}
.tf-toast::before{content:"";width:12px;height:12px;border-radius:50%;background:#fbbf24;flex:none;box-shadow:0 0 10px #fbbf24;}
.tf-toast.tf-success{border-left-color:#22c55e;}
.tf-toast.tf-success::before{background:#22c55e;box-shadow:0 0 10px #22c55e;}
.tf-toast.tf-warn{border-left-color:#f97316;}
.tf-toast.tf-warn::before{background:#f97316;box-shadow:0 0 10px #f97316;}
.tf-toast.out{animation:tf-out .3s ease-in both;}

.tf-hint{position:fixed;left:50%;bottom:calc(var(--tf-dial) + 22px);transform:translateX(-50%);z-index:4;padding:6px 16px;border-radius:999px;font-size:18px;font-weight:700;
 background:rgba(10,16,26,.82);border:1px solid rgba(251,191,36,.5);color:#fde68a;pointer-events:none;max-width:90vw;text-align:center;}
.tf-hint.off{display:none;}

.tf-locked{position:fixed;left:50%;top:42%;z-index:7;display:flex;align-items:center;gap:10px;padding:12px 22px;border-radius:14px;font-size:20px;font-weight:800;color:#fff;pointer-events:none;
 background:linear-gradient(180deg,rgba(60,32,38,.97),rgba(26,14,18,.97));border:1px solid rgba(239,68,68,.6);box-shadow:0 12px 30px rgba(0,0,0,.55);animation:tf-lock 2.2s ease both;}
.tf-locked svg{width:24px;height:24px;flex:none;}

.tf-dial{position:fixed;left:50%;bottom:8px;width:var(--tf-dial);height:var(--tf-dial);transform:translateX(-50%);z-index:4;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.55));}
.tf-dial svg{width:100%;height:100%;display:block;overflow:visible;}
.tf-prog{filter:drop-shadow(0 0 5px rgba(251,191,36,.7));}
.tf-lbl{font-size:20px;font-weight:700;fill:#cbd5e1;}
.tf-num{font-size:34px;font-weight:800;fill:#fff;}
.tf-unit{font-size:18px;font-weight:700;fill:#94a3b8;letter-spacing:.08em;}

@media (max-height:520px),(max-width:560px){ .tf-lbl,.tf-unit{display:none;} }
@media (max-width:560px),(max-height:420px){
 .tf-card{top:8px;left:64px;right:104px;transform:none;width:auto;min-width:0;max-width:440px;margin:0 auto;}
 .tf-title{font-size:16px;}
 .tf-timer{font-size:16px;padding:2px 8px;}
 .tf-obj{display:none;}
 .tf-body{padding:8px 10px 10px;}
}
@keyframes tf-in{from{opacity:0;transform:translateY(-12px) scale(.94);}to{opacity:1;transform:none;}}
@keyframes tf-out{to{opacity:0;transform:translateY(-8px) scale(.96);}}
@keyframes tf-pulse{50%{opacity:.55;}}
@keyframes tf-lock{0%{opacity:0;transform:translate(-50%,-50%) scale(.9);}12%,80%{opacity:1;transform:translate(-50%,-50%) scale(1);}100%{opacity:0;transform:translate(-50%,-60%) scale(1);}}
`;

function mk(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function sv(tag, attrs) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

export class GameUI {
  constructor() {
    // remove leftovers (hot reload safety)
    document.querySelectorAll('.tf-card,.tf-dial,.tf-toasts,.tf-hint,.tf-locked').forEach((n) => n.remove());
    if (!document.getElementById('tf-ui-css')) {
      const st = document.createElement('style');
      st.id = 'tf-ui-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this._speedIn = 0;
    this._shown = 0;
    this._lastNum = -1;
    this._lastColor = '';
    this._timerTxt = '';
    this._coinRaf = 0;
    this._speedEl = null;
    this._lastT = 0;

    this._buildCard();
    this._buildDial();

    this.toasts = mk('div', 'tf-toasts');
    this.hint = mk('div', 'tf-hint off');
    document.body.appendChild(this.toasts);
    document.body.appendChild(this.hint);

    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        document.documentElement.style.setProperty('--tf-card-h', this.card.offsetHeight + 'px');
      }).observe(this.card);
    }
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  /* ---------- mission card ---------- */
  _buildCard() {
    const card = mk('div', 'tf-card');
    card.appendChild(mk('div', 'tf-stripe'));
    const body = mk('div', 'tf-body');

    const row = mk('div', 'tf-row');
    const flag = sv('svg', { viewBox: '0 0 24 24', class: 'tf-ico', fill: 'none', stroke: '#fbbf24', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    flag.appendChild(sv('path', { d: 'M5 3v18M5 4h13l-3 4.5 3 4.5H5' }));
    this._title = mk('div', 'tf-title', '');
    const timer = mk('div', 'tf-timer off');
    const clock = sv('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.6', 'stroke-linecap': 'round' });
    clock.appendChild(sv('circle', { cx: '12', cy: '13', r: '8' }));
    clock.appendChild(sv('path', { d: 'M12 9v4.5l3 2M9 2.5h6' }));
    this._timerTxtEl = mk('span', null, '0:00');
    timer.appendChild(clock);
    timer.appendChild(this._timerTxtEl);
    this._timer = timer;
    row.appendChild(flag);
    row.appendChild(this._title);
    row.appendChild(timer);

    this._obj = mk('div', 'tf-obj', '');
    const sl = mk('div', 'tf-stepline');
    this._step = mk('span', null, '');
    this._count = mk('span', 'tf-count', '');
    sl.appendChild(this._step);
    sl.appendChild(this._count);
    const bar = mk('div', 'tf-bar');
    this._fill = mk('div', 'tf-fill');
    bar.appendChild(this._fill);

    body.appendChild(row);
    body.appendChild(this._obj);
    body.appendChild(sl);
    body.appendChild(bar);
    card.appendChild(body);
    document.body.appendChild(card);
    this.card = card;
  }

  /* ---------- round speedometer ---------- */
  _buildDial() {
    const wrap = mk('div', 'tf-dial');
    const s = sv('svg', { viewBox: '0 0 200 200' });
    const defs = sv('defs', {});
    const g1 = sv('linearGradient', { id: 'tfBez', x1: '0', y1: '0', x2: '0', y2: '1' });
    g1.appendChild(sv('stop', { offset: '0', 'stop-color': '#8190a8' }));
    g1.appendChild(sv('stop', { offset: '.5', 'stop-color': '#27344a' }));
    g1.appendChild(sv('stop', { offset: '1', 'stop-color': '#0d1420' }));
    const g2 = sv('radialGradient', { id: 'tfFace', cx: '.5', cy: '.42', r: '.62' });
    g2.appendChild(sv('stop', { offset: '0', 'stop-color': '#26364d' }));
    g2.appendChild(sv('stop', { offset: '1', 'stop-color': '#0a111c' }));
    defs.appendChild(g1);
    defs.appendChild(g2);
    s.appendChild(defs);

    s.appendChild(sv('circle', { cx: 100, cy: 100, r: 98, fill: 'url(#tfBez)' }));
    s.appendChild(sv('circle', { cx: 100, cy: 100, r: 92, fill: '#0b1220', stroke: '#fbbf24', 'stroke-opacity': '.55', 'stroke-width': 2 }));
    s.appendChild(sv('circle', { cx: 100, cy: 100, r: 89, fill: 'url(#tfFace)' }));

    const rot = 'rotate(135 100 100)';
    s.appendChild(sv('circle', { cx: 100, cy: 100, r: R_TRACK, fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': SWEEP + ' ' + ARC, transform: rot }));
    this._prog = sv('circle', { cx: 100, cy: 100, r: R_TRACK, fill: 'none', stroke: '#fbbf24', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': '0.01 ' + ARC, transform: rot, class: 'tf-prog' });
    s.appendChild(this._prog);

    for (let v = 0; v <= MAX_KMH; v += 5) {
      const a = ((135 + 270 * v / MAX_KMH) * Math.PI) / 180;
      const major = v % 10 === 0;
      const r1 = 66, r2 = major ? 56 : 60;
      s.appendChild(sv('line', {
        x1: 100 + r1 * Math.cos(a), y1: 100 + r1 * Math.sin(a),
        x2: 100 + r2 * Math.cos(a), y2: 100 + r2 * Math.sin(a),
        stroke: major ? '#e2e8f0' : '#64748b', 'stroke-width': major ? 3 : 2, 'stroke-linecap': 'round',
      }));
      if (major) {
        const t = sv('text', { x: 100 + 44 * Math.cos(a), y: 100 + 44 * Math.sin(a) + 7, 'text-anchor': 'middle', class: 'tf-lbl' });
        t.textContent = String(v);
        s.appendChild(t);
      }
    }

    this._num = sv('text', { x: 100, y: 150, 'text-anchor': 'middle', class: 'tf-num' });
    this._num.textContent = '0';
    const unit = sv('text', { x: 100, y: 172, 'text-anchor': 'middle', class: 'tf-unit' });
    unit.textContent = 'km/h';
    s.appendChild(this._num);
    s.appendChild(unit);

    this._needle = sv('g', { transform: 'rotate(135 100 100)' });
    this._needle.appendChild(sv('path', { d: 'M86 100 L98 95.5 L150 99 L150 101 L98 104.5 Z', fill: '#ef4444', stroke: '#7f1d1d', 'stroke-width': 0.8 }));
    s.appendChild(this._needle);
    s.appendChild(sv('circle', { cx: 100, cy: 100, r: 9, fill: '#1b2638', stroke: '#fbbf24', 'stroke-width': 2 }));
    s.appendChild(sv('circle', { cx: 100, cy: 100, r: 3, fill: '#fbbf24' }));

    wrap.appendChild(s);
    document.body.appendChild(wrap);
    this.dial = wrap;
  }

  _tick(t) {
    this._raf = requestAnimationFrame(this._tick);
    const dt = Math.min(0.1, this._lastT ? (t - this._lastT) / 1000 : 0.016);
    this._lastT = t;
    if (!this._speedEl) this._speedEl = document.getElementById('speed-val');
    let target = this._speedIn;
    if (this._speedEl) {
      const n = parseFloat(this._speedEl.textContent);
      if (isFinite(n)) target = n;
    }
    target = Math.max(0, Math.min(MAX_KMH + 8, target));
    this._shown += (target - this._shown) * Math.min(1, dt * 12);
    const v = Math.min(this._shown, MAX_KMH);
    const rounded = Math.round(this._shown);
    if (rounded !== this._lastNum) {
      this._lastNum = rounded;
      this._num.textContent = String(rounded);
    }
    this._needle.setAttribute('transform', 'rotate(' + (135 + 270 * v / MAX_KMH).toFixed(2) + ' 100 100)');
    this._prog.setAttribute('stroke-dasharray', Math.max(0.01, SWEEP * v / MAX_KMH).toFixed(2) + ' ' + ARC.toFixed(2));
    const col = v >= 40 ? '#f97316' : '#fbbf24';
    if (col !== this._lastColor) {
      this._lastColor = col;
      this._prog.setAttribute('stroke', col);
    }
  }

  /* ---------- public API ---------- */
  setJob(title, objective, stepText) {
    this._title.textContent = title || '';
    this._obj.textContent = objective || '';
    const txt = String(stepText == null ? '' : stepText);
    const m = /^(.*?)\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(txt);
    let pct = 0;
    if (m) {
      this._step.textContent = m[1] || 'Progress';
      this._count.textContent = m[2] + '/' + m[3];
      const total = parseInt(m[3], 10);
      pct = total > 0 ? (parseInt(m[2], 10) / total) * 100 : 0;
    } else {
      this._step.textContent = txt;
      this._count.textContent = '';
    }
    this._fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  setTimer(sec) {
    if (sec == null || !isFinite(sec)) {
      this._timer.classList.add('off');
      return;
    }
    sec = Math.max(0, Math.ceil(sec));
    const txt = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    this._timer.classList.remove('off');
    if (txt !== this._timerTxt) {
      this._timerTxt = txt;
      this._timerTxtEl.textContent = txt;
    }
    this._timer.classList.toggle('danger', sec <= 10);
    this._timer.classList.toggle('warn', sec > 10 && sec <= 30);
  }

  setCoins(n) {
    n = Math.max(0, Math.round(Number(n) || 0));
    const el = document.getElementById('coin-count');
    if (!el) return;
    cancelAnimationFrame(this._coinRaf);
    const from = parseInt(String(el.textContent).replace(/\D/g, ''), 10) || 0;
    if (from === n) {
      el.textContent = String(n);
      return;
    }
    const t0 = performance.now();
    const dur = 600;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(from + (n - from) * e));
      if (k < 1) this._coinRaf = requestAnimationFrame(step);
    };
    this._coinRaf = requestAnimationFrame(step);
  }

  setSpeed(v) {
    const n = Number(v);
    if (isFinite(n)) this._speedIn = n;
  }

  toast(message, type) {
    const kind = type === 'success' || type === 'warn' ? type : 'info';
    const t = mk('div', 'tf-toast tf-' + kind, String(message == null ? '' : message));
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.removeChild(this.toasts.firstChild);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 320);
    }, 2500);
  }

  showLocked(text) {
    document.querySelectorAll('.tf-locked').forEach((n) => n.remove());
    const box = mk('div', 'tf-locked');
    const lock = sv('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: '#fca5a5', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    lock.appendChild(sv('rect', { x: '5', y: '11', width: '14', height: '10', rx: '2' }));
    lock.appendChild(sv('path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }));
    box.appendChild(lock);
    box.appendChild(mk('span', null, String(text || 'Locked')));
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2300);
  }

  setHint(text) {
    if (!text) {
      this.hint.classList.add('off');
      return;
    }
    this.hint.textContent = String(text);
    this.hint.classList.remove('off');
  }

  reset() {
    this.toasts.innerHTML = '';
    this.hint.classList.add('off');
    document.querySelectorAll('.tf-locked').forEach((n) => n.remove());
  }
}

export default GameUI;
