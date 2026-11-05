// TerraForm 3D HUD v5 (locked layout, steel panels, amber accent)
// Everything is built here. The minimap canvas (#minimap-canvas) comes from index.html and is moved into the HUD.
// Touch controls send the same keyboard events as the keyboard, so main.js does not change.
const U = n => `calc(var(--u)*${n})`;
const SAFE_L = 'env(safe-area-inset-left,0px)', SAFE_R = 'env(safe-area-inset-right,0px)', SAFE_B = 'env(safe-area-inset-bottom,0px)';
const MONO = 'ui-monospace,Menlo,Consolas,"Courier New",monospace';

const CSS = `
#tf-hud{position:fixed;inset:0;z-index:100;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e2e8f0;font-weight:600;font-size:${U(14)};line-height:1.25;user-select:none;-webkit-user-select:none}
#tf-hud *{box-sizing:border-box}
#tf-hud button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;outline:none;margin:0}
#tf-hud .ic{width:${U(24)};height:${U(24)};fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
.tf-p{background:linear-gradient(180deg,#34445f,#151d2b);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.35),0 ${U(4)} 0 #0a0f18,0 ${U(8)} ${U(16)} rgba(0,0,0,.45)}
.tf-b{background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 ${U(5)} 0 #0a0f18,0 ${U(9)} ${U(14)} rgba(0,0,0,.4)}
.tf-b:active{transform:translateY(${U(3)});box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 ${U(2)} 0 #0a0f18}

/* top-left: timer and minimap */
.tf-tl{position:absolute;left:calc(${U(14)} + ${SAFE_L});top:${U(12)};display:flex;flex-direction:column;align-items:flex-start;gap:${U(10)}}
.tf-timer{display:flex;align-items:center;gap:${U(8)};padding:${U(6)} ${U(12)};border-radius:${U(10)};color:#fbbf24}
.tf-timer.off{display:none}
.tf-timer span{font:900 ${U(20)}/1.1 ${MONO};letter-spacing:.06em;text-shadow:0 2px 0 #0a0f18}
.tf-timer.warn{color:#f87171;animation:tfpulse .8s ease-in-out infinite alternate}
@keyframes tfpulse{from{filter:none}to{filter:drop-shadow(0 0 ${U(8)} rgba(239,68,68,.8))}}
.tf-map{position:relative;width:${U(96)};height:${U(96)};border-radius:50%;padding:${U(5)}}
.tf-map canvas{display:block;width:100%;height:100%;border-radius:50%;background:#0b111a;box-shadow:inset 0 3px 8px rgba(0,0,0,.65)}
.tf-n{position:absolute;top:${U(-6)};left:50%;transform:translateX(-50%);width:${U(22)};height:${U(22)};border-radius:50%;background:#fbbf24;color:#1a1204;border:2px solid #0a0f18;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:${U(14)}}

/* top-centre: mission card */
.tf-card{position:absolute;top:${U(12)};left:50%;transform:translateX(-50%);display:flex;border-radius:${U(10)};overflow:hidden;width:min(${U(340)},calc(100vw - ${U(380)}))}
.tf-bar{width:${U(10)};flex:none;background:linear-gradient(#fde68a,#f59e0b);box-shadow:0 0 ${U(10)} rgba(251,191,36,.6)}
.tf-cb{flex:1;min-width:0;padding:${U(8)} ${U(12)} ${U(10)}}
.tf-row{display:flex;justify-content:space-between;align-items:baseline;gap:${U(8)}}
#tf-title{color:#fbbf24;font-weight:900;font-size:${U(15)};text-transform:uppercase;letter-spacing:.07em;text-shadow:0 2px 0 #0a0f18;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tf-count{color:#a9b8cc;font-weight:800;font-family:${MONO};white-space:nowrap}
.tf-goal{margin-top:${U(2)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#a9b8cc}
.tf-goal b{color:#fff;font-weight:800}
.tf-segs{display:flex;gap:${U(6)};margin-top:${U(7)}}
.tf-segs i{flex:1;height:${U(10)};border-radius:${U(4)};background:#0b111a;box-shadow:inset 0 2px 3px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.12);overflow:hidden}
.tf-segs i.on{background:linear-gradient(#fde68a,#f59e0b);box-shadow:0 0 ${U(8)} rgba(251,191,36,.55),inset 0 1px 0 rgba(255,255,255,.5)}
.tf-segs u{display:block;height:100%;border-radius:${U(4)};background:linear-gradient(#fde68a,#f59e0b);text-decoration:none;transition:width .3s}
.tf-story{max-height:0;opacity:0;overflow:hidden;color:#cbd5e1;transition:max-height .35s ease,opacity .35s ease,margin .35s ease}
.tf-story b{display:block;color:#fbbf24;font-weight:900;letter-spacing:.1em;font-size:${U(14)};margin-bottom:${U(2)}}
.tf-card.big .tf-story{max-height:${U(80)};opacity:1;margin-top:${U(8)}}

/* top-right: coins, menu, toast lane */
.tf-tr{position:absolute;right:calc(${U(14)} + ${SAFE_R});top:${U(12)};display:flex;align-items:flex-start;gap:${U(10)}}
.tf-coin{height:${U(48)};display:flex;align-items:center;gap:${U(8)};padding:0 ${U(16)} 0 ${U(9)};border-radius:${U(24)}}
.tf-c{width:${U(30)};height:${U(30)};border-radius:50%;background:radial-gradient(circle at 35% 30%,#fde68a,#d98f06);color:#1a1204;display:grid;place-items:center;font-style:normal;font-weight:900;box-shadow:0 0 0 2px #0a0f18,0 2px 0 2px #0a0f18}
#tf-coins{font:900 ${U(18)}/1 ${MONO};color:#fbbf24;text-shadow:0 2px 0 #0a0f18}
.tf-menu{position:relative;width:${U(48)};height:${U(48)};padding:0;border-radius:${U(12)};display:grid;place-items:center;color:#fbbf24}
.tf-dot{position:absolute;top:${U(-5)};right:${U(-5)};width:${U(16)};height:${U(16)};border-radius:50%;background:#34d399;border:2px solid #0a0f18;box-shadow:0 0 ${U(8)} #34d399;display:none}
.tf-dot.on{display:block}
.tf-lane{position:absolute;right:calc(${U(14)} + ${SAFE_R});top:${U(74)};width:${U(290)};display:flex;flex-direction:column;align-items:flex-end;gap:${U(8)}}
.tf-t{max-width:100%;display:flex;align-items:center;gap:${U(8)};padding:${U(8)} ${U(14)};border-radius:${U(20)};color:#fff;font-weight:700;animation:tfin .25s ease-out}
.tf-t i{width:${U(10)};height:${U(10)};border-radius:50%;flex:none;background:#60a5fa;box-shadow:0 0 ${U(8)} #60a5fa}
.tf-t.success i{background:#34d399;box-shadow:0 0 ${U(8)} #34d399}
.tf-t.warn i{background:#fbbf24;box-shadow:0 0 ${U(8)} #fbbf24}
.tf-t.out{opacity:0;transform:translateX(${U(20)});transition:opacity .3s,transform .3s}
@keyframes tfin{from{opacity:0;transform:translateX(${U(24)})}to{opacity:1;transform:none}}
.tf-drawer{position:absolute;right:calc(${U(14)} + ${SAFE_R});top:${U(74)};z-index:3;display:none;grid-template-columns:repeat(3,${U(88)});gap:${U(10)};padding:${U(10)};border-radius:${U(14)};pointer-events:auto}
.tf-drawer.open{display:grid;animation:tfin .18s ease-out}
.tf-tile{position:relative;height:${U(78)};padding:0;border-radius:${U(12)};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${U(4)};font-weight:800;color:#e2e8f0}
.tf-tile .ic{color:#fbbf24}
.tf-tile .tf-dot{top:${U(4)};right:${U(6)}}

/* bottom-left: touch F button and camera, or key hints */
.tf-bl{position:absolute;left:calc(${U(14)} + ${SAFE_L});bottom:calc(${U(14)} + ${SAFE_B});display:flex;align-items:flex-end;gap:${U(12)}}
.tf-fbtn{width:${U(92)};height:${U(92)};padding:0;border-radius:50%;border-width:${U(4)};display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#3f5272,#223044 55%,#141d2a)}
.tf-fbtn b{font-size:${U(34)};line-height:1;font-weight:900;color:#fbbf24;text-shadow:0 2px 0 #0a0f18}
.tf-fbtn span{font-size:${U(14)};font-weight:900;letter-spacing:.1em;color:#a9b8cc}
.tf-cam{width:${U(52)};height:${U(52)};padding:0;border-radius:${U(14)};display:grid;place-items:center;color:#e2e8f0;margin-bottom:${U(4)}}
.tf-keys{display:flex;flex-direction:column;gap:${U(6)};padding:${U(8)} ${U(12)};border-radius:${U(12)};transition:opacity 1.2s}
.tf-keys.dim{opacity:.4}
.tf-keys div{display:flex;align-items:center;gap:${U(8)};white-space:nowrap}
.tf-k{display:inline-grid;place-items:center;min-width:${U(28)};height:${U(26)};padding:0 ${U(7)};border-radius:${U(6)};color:#fbbf24;font-weight:900;background:linear-gradient(#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:0 ${U(2)} 0 #0a0f18}
.tf-t-only{display:none}
#tf-hud.tf-touch .tf-t-only{display:flex}
#tf-hud.tf-touch .tf-d-only{display:none}

/* bottom-centre: hint */
.tf-hint{position:absolute;left:50%;bottom:calc(${U(14)} + ${SAFE_B});transform:translate(-50%,${U(10)});opacity:0;transition:opacity .35s,transform .35s;display:flex;align-items:center;gap:${U(10)};padding:${U(8)} ${U(18)} ${U(8)} ${U(10)};border-radius:${U(26)};max-width:calc(100vw - ${U(440)});white-space:nowrap}
.tf-hint.on{opacity:1;transform:translate(-50%,0)}
.tf-hint em{flex:none;width:${U(30)};height:${U(30)};border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;color:#fbbf24;background:#0b111a;box-shadow:inset 0 2px 4px rgba(0,0,0,.7);border:2px solid #0a0f18}
.tf-hint span{overflow:hidden;text-overflow:ellipsis}

/* bottom-right: speedometer and driving controls */
.tf-br{position:absolute;right:calc(${U(14)} + ${SAFE_R});bottom:calc(${U(14)} + ${SAFE_B});display:flex;align-items:flex-end;gap:${U(14)}}
.tf-dial{position:relative;width:${U(104)};height:${U(104)};border-radius:50%;margin-bottom:${U(4)}}
.tf-dial svg{position:absolute;left:${U(6)};top:${U(6)};width:calc(100% - ${U(12)});height:calc(100% - ${U(12)});fill:none}
.tf-dial circle{fill:none;stroke-width:9;stroke-linecap:round}
.tf-dial .trk{stroke:#0b111a}
.tf-well{position:absolute;inset:${U(20)};border-radius:50%;background:radial-gradient(circle at 50% 30%,#18212f,#0b111a);box-shadow:inset 0 ${U(4)} ${U(8)} rgba(0,0,0,.75),0 1px 0 rgba(255,255,255,.12);display:flex;flex-direction:column;align-items:center;justify-content:center}
#tf-spd{font:900 ${U(26)}/1 ${MONO};color:#fff;text-shadow:0 2px 0 #000}
.tf-well span{font-size:${U(14)};font-weight:800;color:#8fa1ba;line-height:1.1}
.tf-tr2{display:none;flex-direction:column;align-items:center;gap:${U(12)}}
#tf-hud.tf-touch .tf-tr2{display:flex}
.tf-brk{width:${U(64)};height:${U(48)};padding:0;border-radius:${U(12)};font-weight:900;letter-spacing:.06em;color:#fff;background:linear-gradient(#f87171,#b91c1c);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 ${U(5)} 0 #450a0a}
.tf-brk:active{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 ${U(2)} 0 #450a0a}
.tf-joy{position:relative;width:${U(124)};height:${U(124)};border-radius:50%;border:${U(3)} dashed rgba(203,213,225,.5);background:rgba(8,12,20,.38);display:grid;place-items:center;pointer-events:auto;touch-action:none}
.tf-thumb{width:${U(54)};height:${U(54)};border-radius:50%;pointer-events:none}
.tf-joy span{position:absolute;bottom:${U(6)};left:0;right:0;text-align:center;font-weight:900;letter-spacing:.14em;color:#a9b8cc;pointer-events:none}
`;

const ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  list: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v2h6V4M9 11h6M9 15h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  redo: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  spkOn: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  spkOff: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const KEYCODE = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', Space: ' ', KeyF: 'f', KeyC: 'c', KeyR: 'r', KeyP: 'p', KeyM: 'm', KeyJ: 'j', KeyU: 'u' };

export default class GameUI {
  constructor() {
    this._down = new Set();
    this._toasts = [];
    this._seg = -1; this._sp = -1;
    this._touch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window) || /[?&]touch/.test(location.search);

    const old = document.getElementById('tf-hud');
    if (old) old.remove();
    let st = document.getElementById('tf-hud-css');
    if (!st) { st = document.createElement('style'); st.id = 'tf-hud-css'; document.head.appendChild(st); }
    st.textContent = CSS;

    const root = document.createElement('div');
    root.id = 'tf-hud';
    if (this._touch) root.classList.add('tf-touch');
    root.innerHTML = `
      <div class="tf-tl">
        <div class="tf-p tf-timer off" id="tf-timer">${ic('clock')}<span id="tf-time">0:00</span></div>
        <div class="tf-p tf-map" id="tf-map"><i class="tf-n">N</i></div>
      </div>
      <div class="tf-p tf-card" id="tf-card">
        <i class="tf-bar"></i>
        <div class="tf-cb">
          <div class="tf-row"><b id="tf-title"></b><span id="tf-count"></span></div>
          <div class="tf-goal" id="tf-goal"></div>
          <div class="tf-segs" id="tf-segs"></div>
          <div class="tf-story" id="tf-story"></div>
        </div>
      </div>
      <div class="tf-tr">
        <div class="tf-p tf-coin"><i class="tf-c">$</i><span id="tf-coins">0</span></div>
        <button class="tf-b tf-menu" id="tf-menu" tabindex="-1" aria-label="Menu">${ic('menu')}<i class="tf-dot" id="tf-mdot"></i></button>
      </div>
      <div class="tf-lane" id="tf-lane"></div>
      <div class="tf-p tf-drawer" id="tf-drawer">
        <button class="tf-b tf-tile" data-code="KeyJ" tabindex="-1">${ic('list')}Contracts<i class="tf-dot" id="tf-cdot"></i></button>
        <button class="tf-b tf-tile" data-code="KeyU" tabindex="-1">${ic('gear')}Garage</button>
        <button class="tf-b tf-tile" data-code="KeyR" tabindex="-1">${ic('redo')}Restart</button>
        <button class="tf-b tf-tile" data-code="KeyC" tabindex="-1">${ic('cam')}Camera</button>
        <button class="tf-b tf-tile" data-code="KeyP" tabindex="-1">${ic('pause')}Pause</button>
        <button class="tf-b tf-tile" data-code="KeyM" id="tf-mute" tabindex="-1"><span id="tf-mute-ic">${ic('spkOn')}</span><span id="tf-mute-tx">Sound</span></button>
      </div>
      <div class="tf-bl">
        <button class="tf-b tf-fbtn tf-t-only" id="tf-f" tabindex="-1"><b>F</b><span id="tf-f-tx">SCOOP</span></button>
        <button class="tf-b tf-cam tf-t-only" id="tf-cam" tabindex="-1" aria-label="Camera">${ic('cam')}</button>
        <div class="tf-p tf-keys tf-d-only" id="tf-keys">
          <div><span class="tf-k">W A S D</span>Drive</div>
          <div><span class="tf-k">F</span>Scoop / dump</div>
          <div><span class="tf-k">C</span>Camera</div>
          <div><span class="tf-k">Space</span>Brake</div>
        </div>
      </div>
      <div class="tf-p tf-hint" id="tf-hint"><em id="tf-hk">F</em><span id="tf-ht"></span></div>
      <div class="tf-br">
        <div class="tf-p tf-dial">
          <svg viewBox="0 0 100 100"><g transform="rotate(135 50 50)">
            <circle class="trk" cx="50" cy="50" r="42" stroke-dasharray="197.9 263.9"/>
            <circle id="tf-arc" cx="50" cy="50" r="42" stroke="#34d399" stroke-dasharray="0 263.9" stroke-opacity="0"/>
          </g></svg>
          <div class="tf-well"><div id="tf-spd">0</div><span>km/h</span></div>
        </div>
        <div class="tf-tr2">
          <button class="tf-brk" id="tf-brk" tabindex="-1">BRK</button>
          <div class="tf-joy" id="tf-joy"><div class="tf-p tf-thumb" id="tf-thumb"></div><span>DRIVE</span></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    const $ = id => root.querySelector('#' + id);
    this.el = { timer: $('tf-timer'), time: $('tf-time'), card: $('tf-card'), title: $('tf-title'), count: $('tf-count'), goal: $('tf-goal'), segs: $('tf-segs'), story: $('tf-story'), coins: $('tf-coins'), lane: $('tf-lane'), drawer: $('tf-drawer'), menu: $('tf-menu'), mdot: $('tf-mdot'), cdot: $('tf-cdot'), hint: $('tf-hint'), hk: $('tf-hk'), ht: $('tf-ht'), spd: $('tf-spd'), arc: $('tf-arc'), ftx: $('tf-f-tx'), keys: $('tf-keys'), map: $('tf-map'), muteIc: $('tf-mute-ic'), muteTx: $('tf-mute-tx') };

    // move the minimap canvas (made in index.html) into the round frame
    const mc = document.getElementById('minimap-canvas');
    if (mc) this.el.map.appendChild(mc);

    this._scale();
    window.addEventListener('resize', () => this._scale());
    this._bind();
    setTimeout(() => { if (this.el.keys) this.el.keys.classList.add('dim'); }, 20000);
  }

  _scale() {
    const s = Math.max(1, Math.min(1.4, Math.min(window.innerWidth / 844, window.innerHeight / 390)));
    this.root.style.setProperty('--u', s + 'px');
  }

  // ---- keyboard events (same path as a real key press) ----
  _key(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code, key: KEYCODE[code] || '', bubbles: true, cancelable: true }));
  }
  _tap(code) { this._key('keydown', code); this._key('keyup', code); }
  _hold(code, on) {
    if (on && !this._down.has(code)) { this._down.add(code); this._key('keydown', code); }
    else if (!on && this._down.has(code)) { this._down.delete(code); this._key('keyup', code); }
  }
  _releaseAll() { Array.from(this._down).forEach(c => this._hold(c, false)); }

  _bind() {
    const el = this.el;
    const closeDrawer = () => el.drawer.classList.remove('open');
    el.menu.addEventListener('click', () => { el.menu.blur(); el.drawer.classList.toggle('open'); });
    el.drawer.querySelectorAll('.tf-tile').forEach(b => b.addEventListener('click', () => {
      b.blur(); closeDrawer(); this._tap(b.dataset.code);
    }));
    document.addEventListener('pointerdown', (e) => {
      if (!el.drawer.classList.contains('open')) return;
      if (el.drawer.contains(e.target) || el.menu.contains(e.target)) return;
      closeDrawer();
    });
    window.addEventListener('bh-mute', (e) => {
      const m = !!e.detail;
      el.muteIc.innerHTML = ic(m ? 'spkOff' : 'spkOn');
      el.muteTx.textContent = m ? 'Muted' : 'Sound';
    });
    window.addEventListener('tf-tutorial', (e) => {
      const d = e.detail || {};
      if (!d.text) return;
      this.setHint(d.text);
      this.toast('Step ' + d.step + '/' + d.total + ' - ' + d.text, 'info');
    });

    // pause window buttons
    document.querySelectorAll('#pause-overlay [data-act]').forEach(b => b.addEventListener('click', () => {
      b.blur();
      const a = b.dataset.act;
      this._tap('KeyP');
      if (a === 'restart') this._tap('KeyR');
      else if (a === 'contracts') this._tap('KeyJ');
      else if (a === 'garage') this._tap('KeyU');
    }));

    // touch controls
    const press = (node, code) => {
      node.addEventListener('pointerdown', (e) => { e.preventDefault(); try { node.setPointerCapture(e.pointerId); } catch (x) {} this._hold(code, true); });
      const up = (e) => { e.preventDefault(); this._hold(code, false); };
      node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    };
    const tapBtn = (node, code) => node.addEventListener('pointerdown', (e) => { e.preventDefault(); this._tap(code); });
    tapBtn(this.root.querySelector('#tf-f'), 'KeyF');
    tapBtn(this.root.querySelector('#tf-cam'), 'KeyC');
    press(this.root.querySelector('#tf-brk'), 'Space');

    const joy = this.root.querySelector('#tf-joy'), thumb = this.root.querySelector('#tf-thumb');
    let pid = null;
    const move = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const R = r.width * 0.3, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      thumb.style.transform = `translate(${dx}px,${dy}px)`;
      const nx = dx / R, ny = dy / R;
      this._hold('KeyW', ny < -0.35); this._hold('KeyS', ny > 0.35);
      this._hold('KeyA', nx < -0.35); this._hold('KeyD', nx > 0.35);
    };
    const end = (e) => {
      if (pid === null || (e && e.pointerId !== pid)) return;
      pid = null; thumb.style.transform = ''; this._hold('KeyW', false); this._hold('KeyS', false); this._hold('KeyA', false); this._hold('KeyD', false);
    };
    joy.addEventListener('pointerdown', (e) => { if (pid !== null) return; e.preventDefault(); pid = e.pointerId; try { joy.setPointerCapture(pid); } catch (x) {} move(e); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === pid) { e.preventDefault(); move(e); } });
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    window.addEventListener('blur', () => { this._releaseAll(); end(); });
  }

  // ---- public API (used by main.js) ----
  setJob(title, objective, stepText) {
    const el = this.el;
    el.title.textContent = title || '';
    let label = '', n = null, m = null;
    const t = String(stepText || '');
    const mt = t.match(/^(.*?)\s*(\d+)\s*\/\s*(\d+)\s*$/);
    if (mt) { label = mt[1].trim(); n = +mt[2]; m = +mt[3]; } else label = t;
    el.goal.innerHTML = (label ? '<b></b>' : '') + (label && objective ? ' · ' : '') + '<span></span>';
    if (label) el.goal.querySelector('b').textContent = label;
    el.goal.querySelector('span').textContent = objective || '';
    el.count.textContent = m ? n + '/' + m : '';
    if (m) this._segs(n, m); else { el.segs.innerHTML = ''; this._seg = -1; }
    el.ftx.textContent = /dump|truck/i.test(label) ? 'DUMP' : 'SCOOP';
  }
  _segs(n, m) {
    const el = this.el;
    if (m > 10) {
      if (this._seg !== -2) { el.segs.innerHTML = '<i><u style="width:0"></u></i>'; this._seg = -2; }
      el.segs.querySelector('u').style.width = Math.min(100, (n / m) * 100) + '%';
      return;
    }
    if (this._seg !== m) {
      el.segs.innerHTML = new Array(m).fill('<i></i>').join('');
      this._seg = m;
    }
    const items = el.segs.children;
    for (let i = 0; i < items.length; i++) items[i].classList.toggle('on', i < n);
  }
  announce(job) {
    const el = this.el;
    if (!job) return;
    el.story.innerHTML = '<b></b><span></span>';
    el.story.querySelector('b').textContent = 'JOB ' + job.id;
    el.story.querySelector('span').textContent = job.story || job.objective || '';
    el.card.classList.add('big');
    clearTimeout(this._annT);
    this._annT = setTimeout(() => el.card.classList.remove('big'), job.tutorial ? 5500 : 3800);
  }
  setTimer(sec) {
    const el = this.el;
    if (sec === null || sec === undefined) { el.timer.classList.add('off'); return; }
    sec = Math.max(0, Math.ceil(sec));
    el.timer.classList.remove('off');
    el.time.textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    el.timer.classList.toggle('warn', sec <= 30);
  }
  setCoins(n) { this.el.coins.textContent = Number(n || 0).toLocaleString('en-US'); }
  setSpeed(v) {
    v = Math.round(v) || 0;
    if (v === this._sp) return;
    this._sp = v;
    const el = this.el, f = Math.min(1, v / 45);
    el.spd.textContent = v;
    const hue = f < 0.6 ? 140 - 95 * (f / 0.6) : 45 - 45 * ((f - 0.6) / 0.4);
    el.arc.setAttribute('stroke', 'hsl(' + hue.toFixed(0) + ',85%,55%)');
    el.arc.setAttribute('stroke-dasharray', (197.9 * f).toFixed(1) + ' 263.9');
    el.arc.setAttribute('stroke-opacity', v > 0 ? '1' : '0');
  }
  setHint(text) {
    const el = this.el;
    clearTimeout(this._hintT);
    if (!text) { el.hint.classList.remove('on'); return; }
    let t = String(text);
    if (this._touch) t = t.replace(/press\s+/i, 'Tap ');
    const mk = t.match(/(?:press|tap)\s+([A-Za-z])\b/i);
    el.hk.textContent = mk ? mk[1].toUpperCase() : '!';
    el.ht.textContent = t;
    el.hint.classList.add('on');
    this._hintT = setTimeout(() => el.hint.classList.remove('on'), 9000);
  }
  setMenuDot(on) {
    this.el.mdot.classList.toggle('on', !!on);
    this.el.cdot.classList.toggle('on', !!on);
  }
  toast(msg, type) {
    const el = this.el;
    const d = document.createElement('div');
    d.className = 'tf-p tf-t ' + (type || 'info');
    d.innerHTML = '<i></i><span></span>';
    d.querySelector('span').textContent = msg;
    el.lane.appendChild(d);
    this._toasts.push(d);
    while (this._toasts.length > 3) { const o = this._toasts.shift(); o.remove(); }
    setTimeout(() => {
      d.classList.add('out');
      setTimeout(() => { d.remove(); this._toasts = this._toasts.filter(x => x !== d); }, 320);
    }, 2500);
  }
  showLocked(msg) { this.toast(msg || 'Locked', 'warn'); }
  reset() {
    const el = this.el;
    this._toasts.forEach(t => t.remove()); this._toasts = [];
    el.hint.classList.remove('on');
    el.card.classList.remove('big');
    el.drawer.classList.remove('open');
    this._releaseAll();
  }
}
