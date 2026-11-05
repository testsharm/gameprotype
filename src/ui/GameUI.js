// TerraForm 3D - HUD v7. Portrait phone is a FIRST-CLASS layout.
// Exact positions live in src/docs/UI_SPEC.md. All art is code-made SVG.
// Real pointer input: one API (opts.hold / opts.tap) shared by mouse, touch
// and keyboard. No fake KeyboardEvent dispatch. Multi-touch by pointerId.
import Menus from './Menus.js';

const U = n => `calc(var(--u) * ${n})`;
const SAFE_L = 'env(safe-area-inset-left,0px)', SAFE_R = 'env(safe-area-inset-right,0px)';
const SAFE_T = 'env(safe-area-inset-top,0px)', SAFE_B = 'env(safe-area-inset-bottom,0px)';

const ICON = {
  camera: '<path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.6"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8.5a5.5 5.5 0 010 7"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M18 9l5 6M23 9l-5 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9.5c0-1.4 1.3-2 3-2s3 .6 3 2-1.3 1.8-3 2-3 .8-3 2 1.3 2 3 2 3-.6 3-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  brake: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  dig: '<path d="M4 18l7-7M11 11l3-6 6 3-3 6z"/><path d="M3 20h18"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16"/>'
};
const svg = (n, cls) => `<svg class="tf-ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;

const CSS = `
#tf-hud{--u:1px;position:fixed;inset:0;z-index:100;pointer-events:none;color:#f1f5f9;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:700;font-size:14px;line-height:1.2;
  user-select:none;-webkit-user-select:none}
#tf-hud *{box-sizing:border-box}
#tf-hud button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto;touch-action:none;
  -webkit-tap-highlight-color:transparent;outline:none;margin:0;border:0;background:none}
#tf-hud button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
#tf-hud button:active{transform:translateY(2px)}
/* TIER 1: 3-second hold ring around the Action button + PC F keycap. */
.tf-action::after,.tf-pad [data-code="KeyF"]::after{content:'';position:absolute;inset:-7px;border-radius:50%;pointer-events:none;
  background:conic-gradient(from -90deg,#34d399 0deg,#34d399 var(--act,0deg),rgba(255,255,255,.10) var(--act,0deg));
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
  mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
  opacity:0;transition:opacity .12s}
.tf-action.acting::after,.tf-pad [data-code="KeyF"].acting::after{opacity:1}
.tf-pad [data-code="KeyF"]{position:relative}
/* press feedback: every button moves 2px and scales slightly */
#tf-hud .tf-ic{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
.tf-p{background:linear-gradient(180deg,#34445f,#151d2b);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 4px 0 #0a0f18,0 8px 16px rgba(0,0,0,.45)}
.tf-b{background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 0 #0a0f18}
.tf-b.on{background:linear-gradient(#fde68a,#f59e0b);color:#1a1204;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 4px 0 #b45309}
.tf-b:disabled{opacity:.42;cursor:default;filter:grayscale(.5)}
.tf-b.held{background:linear-gradient(#34d399,#059669);color:#052e21;transform:translateY(2px) scale(.94)}

/* ---------- top row ---------- */
.tf-timer,.tf-coins,.tf-pause{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:12px}
.tf-timer{left:calc(16px + ${SAFE_L});top:calc(16px + ${SAFE_T});width:150px;height:52px;gap:8px;color:#fbbf24;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}
.tf-timer .tf-ic{width:22px;height:22px}
.tf-timer.warn{color:#f87171}
.tf-timer.off{display:none}
.tf-coins{right:calc(80px + ${SAFE_R});top:calc(16px + ${SAFE_T});height:52px;min-width:132px;gap:7px;padding:0 14px;border-radius:999px;color:#fbbf24;font-size:19px;font-weight:900}
.tf-coins .tf-ic{width:22px;height:22px}
.tf-pause{right:calc(16px + ${SAFE_R});top:calc(16px + ${SAFE_T});width:56px;height:56px;border-radius:12px}
.tf-pause .tf-ic{width:26px;height:26px}
.tf-dot{position:absolute;right:5px;top:5px;width:11px;height:11px;border-radius:50%;background:#34d399;border:2px solid #0a0f18;display:none}
.tf-dot.on{display:block}

/* ---------- mission card: small, one line only ---------- */
.tf-mission{position:absolute;left:50%;top:calc(16px + ${SAFE_T});transform:translateX(-50%);
  width:560px;height:72px;border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 12px;overflow:hidden}
.tf-mission i.bar{position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(#fde68a,#f59e0b)}
.tf-mission .txt{flex:1;min-width:0;padding-left:6px}
.tf-mission .nm{font-size:16px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#fbbf24;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-mission .st{font-size:14px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.tf-pips{display:flex;gap:5px;flex:none}
.tf-pips i{width:12px;height:12px;border-radius:50%;background:#0b111a;border:2px solid #0a0f18}
.tf-pips i.on{background:#fbbf24}

/* ---------- minimap + left icon stack ---------- */
.tf-mini{position:absolute;left:calc(16px + ${SAFE_L});top:calc(80px + ${SAFE_T});width:140px;height:140px;border-radius:50%;
  overflow:hidden;pointer-events:auto;cursor:pointer;padding:0}
.tf-mini canvas{width:100%;height:100%;display:block;border-radius:50%}
.tf-tools{position:absolute;left:calc(16px + ${SAFE_L});top:calc(236px + ${SAFE_T});display:flex;flex-direction:column;gap:8px}
.tf-tools button{width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;position:relative}
.tf-tools button .kb{position:absolute;bottom:2px;right:4px;font-size:9px;font-weight:900;color:#94a3b8}
.tf-tools button.on .kb{color:#1a1204}

/* ---------- desktop key pad ---------- */
.tf-pad{position:absolute;left:calc(16px + ${SAFE_L});bottom:calc(16px + ${SAFE_B});display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px}
.tf-pad .r{display:flex;gap:6px;justify-content:center}
.tf-pad button{width:56px;height:56px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:15px;font-weight:900}
.tf-pad button small{font-size:9px;font-weight:800;color:#94a3b8;letter-spacing:.02em;text-transform:uppercase}
.tf-pad button.wide{width:118px}

/* ---------- speedometer ---------- */
.tf-speed{position:absolute;right:calc(16px + ${SAFE_R});bottom:calc(16px + ${SAFE_B});width:150px;height:150px;border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.tf-speed .v{font-size:46px;font-weight:900;font-variant-numeric:tabular-nums;color:#f1f5f9;line-height:1}
.tf-speed .u{font-size:13px;color:#94a3b8;font-weight:900}

/* ---------- touch controls ---------- */
.tf-touch{display:none;pointer-events:none}
.tf-drive{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;
  background:radial-gradient(circle,rgba(58,76,104,.75),rgba(11,17,26,.85));border:2px solid #0a0f18;box-shadow:0 4px 0 #0a0f18}
.tf-drive .knob{width:44%;height:44%;border-radius:50%;background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#94a3b8}
.tf-drive .knob .tf-ic{width:26px;height:26px}
.tf-action,.tf-brake{position:absolute;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:13px;font-weight:900}
.tf-action{background:linear-gradient(#fde68a,#f59e0b);color:#1a1204;border:2px solid #0a0f18;box-shadow:0 4px 0 #b45309}
.tf-action .tf-ic{width:30px;height:30px}
.tf-brake{background:linear-gradient(#f87171,#b91c1c);color:#fff;border:2px solid #0a0f18;box-shadow:0 4px 0 #7f1d1d}
.tf-brake .tf-ic{width:24px;height:24px}

/* ---------- toast / hint lanes ---------- */
.tf-toasts{position:absolute;top:calc(100px + ${SAFE_T});left:170px;right:120px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.tf-toast{padding:8px 14px;border-radius:10px;font-size:14px;font-weight:900;max-width:100%;text-align:center;
  animation:tf-in .2s ease-out;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-toast.success{color:#052e21;background:linear-gradient(#34d399,#059669)}
.tf-toast.warn{color:#fff;background:linear-gradient(#f87171,#b91c1c)}
.tf-toast.info{color:#f1f5f9;background:linear-gradient(180deg,#34445f,#151d2b)}
@keyframes tf-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.tf-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(180px + ${SAFE_B});max-width:min(420px,80vw);
  padding:8px 14px;border-radius:10px;font-size:14px;text-align:center;pointer-events:none;display:none}
.tf-hint.on{display:block}

/* ---------- hide HUD on the start screen ---------- */
body.tf-menu #tf-hud{visibility:hidden}
html.tf-playing,html.tf-holding{overflow:hidden}
html.tf-playing body,html.tf-holding body{overflow:hidden;user-select:none;-webkit-user-select:none}
/* Only the canvas and HUD lock touch gestures; windows must still scroll. */
html.tf-playing #game-container,html.tf-holding #game-container{touch-action:none}

/* ---------- landscape phone 844x390 (short, wide) ---------- */
@media (max-height:480px){
  .tf-timer{left:calc(10px + ${SAFE_L});top:calc(8px + ${SAFE_T});width:96px;height:36px;font-size:16px;gap:5px;border-radius:9px}
  .tf-timer .tf-ic{width:17px;height:17px}
  .tf-coins{right:calc(62px + ${SAFE_R});top:calc(8px + ${SAFE_T});height:36px;min-width:96px;font-size:14px;padding:0 9px}
  .tf-coins .tf-ic{width:17px;height:17px}
  .tf-pause{right:calc(10px + ${SAFE_R});top:calc(8px + ${SAFE_T});width:48px;height:48px;border-radius:10px}
  .tf-mission{left:50%;top:calc(8px + ${SAFE_T});width:300px;height:44px;gap:6px;padding:0 9px}
  .tf-mission .nm{font-size:14px}.tf-mission .st{font-size:12px;margin-top:1px}
  .tf-mini{left:calc(10px + ${SAFE_L});top:calc(96px + ${SAFE_T});width:76px;height:76px}
  .tf-tools{left:calc(10px + ${SAFE_L});top:calc(50px + ${SAFE_T});flex-direction:row;gap:6px}
  .tf-tools button{width:48px;height:48px;border-radius:10px}
  .tf-pad{display:none}
  .tf-speed{right:auto;left:50%;transform:translateX(-50%);bottom:calc(6px + ${SAFE_B});width:64px;height:64px}
  .tf-speed .v{font-size:20px}.tf-speed .u{font-size:9px}
  .tf-touch{display:block}
  .tf-drive{width:130px;height:130px;right:calc(16px + ${SAFE_R});bottom:calc(12px + ${SAFE_B})}
  .tf-action{width:84px;height:84px;left:calc(16px + ${SAFE_L});bottom:calc(18px + ${SAFE_B});font-size:11px}
  .tf-brake{width:56px;height:56px;right:calc(24px + ${SAFE_R});bottom:calc(152px + ${SAFE_B});font-size:10px}
  .tf-toasts{top:calc(56px + ${SAFE_T});left:100px;right:120px}
  .tf-hint{bottom:calc(100px + ${SAFE_B});font-size:13px;max-width:44vw}
}

/* ---------- portrait phone 440x956 / 390x844 / 360x800 ---------- */
@media (max-width:600px) and (min-height:481px){
  .tf-timer{left:calc(12px + ${SAFE_L});top:calc(12px + ${SAFE_T});width:104px;height:40px;font-size:17px;border-radius:10px}
  .tf-timer .tf-ic{width:18px;height:18px}
  .tf-coins{right:calc(68px + ${SAFE_R});top:calc(12px + ${SAFE_T});width:112px;height:40px;min-width:0;font-size:15px;padding:0 8px}
  .tf-coins .tf-ic{width:18px;height:18px}
  .tf-pause{right:calc(12px + ${SAFE_R});top:calc(12px + ${SAFE_T});width:48px;height:48px;border-radius:10px}
  .tf-mission{left:calc(12px + ${SAFE_L});right:calc(12px + ${SAFE_R});top:calc(60px + ${SAFE_T});
    width:auto;height:52px;transform:none;gap:6px;padding:0 10px}
  .tf-mission .nm{font-size:15px}.tf-mission .st{font-size:14px}
  .tf-mini{left:calc(12px + ${SAFE_L});top:calc(124px + ${SAFE_T});width:88px;height:88px}
  .tf-tools{left:calc(12px + ${SAFE_L});top:calc(224px + ${SAFE_T});flex-direction:column;gap:8px}
  .tf-tools button{width:48px;height:48px;border-radius:10px}
  .tf-pad{display:none}
  .tf-speed{right:auto;left:50%;transform:translateX(-50%);bottom:calc(24px + ${SAFE_B});width:64px;height:64px}
  .tf-speed .v{font-size:18px}.tf-speed .u{font-size:9px}
  .tf-touch{display:block}
  .tf-drive{width:150px;height:150px;right:calc(20px + ${SAFE_R});bottom:calc(28px + ${SAFE_B})}
  .tf-action{width:92px;height:92px;left:calc(20px + ${SAFE_L});bottom:calc(40px + ${SAFE_B})}
  .tf-brake{width:56px;height:56px;right:calc(34px + ${SAFE_R});bottom:calc(190px + ${SAFE_B})}
  .tf-toasts{top:calc(120px + ${SAFE_T});left:112px;right:12px}
  .tf-hint{bottom:calc(196px + ${SAFE_B});font-size:14px;max-width:76vw}
}

/* Left-handed: swap Drive (right) and Action (left). */
#tf-hud.tf-lefty .tf-drive{right:auto;left:calc(20px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-action{left:auto;right:calc(20px + ${SAFE_R})}
#tf-hud.tf-lefty .tf-brake{right:auto;left:calc(34px + ${SAFE_L})}
@media (max-height:480px){
  #tf-hud.tf-lefty .tf-drive{right:auto;left:calc(16px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-action{left:auto;right:calc(16px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-brake{right:auto;left:calc(24px + ${SAFE_L})}
}
`;

const HOLD_CODES = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, Space: 1, KeyF: 1 };
const CODE_TO_KEY = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyC: 'C', KeyM: 'M', KeyP: 'P', Space: 'SPC' };

export default class GameUI {
  constructor(opts) {
    this.opts = opts || {};
    this._screen = 'menu';
    this._down = new Map();        // pointerId -> code
    this._heldByCode = new Map();  // code -> Set(pointerId)
    this._joyPid = null;
    this._toastTimer = null;
    this._build();
    this.menus = new Menus({
      action: (n, p) => this._menuAction(n, p),
      state: () => this._state(),
      data: () => this._data(),
      unlock: () => this._unlock()
    });
    this._bind();
    this.setScreen('menu');
    this.refresh();
  }
  _api() { return this.opts; }
  _state() { try { return this._api().state ? this._api().state() : {}; } catch (e) { return {}; } }
  _data() { try { return this._api().data ? this._api().data() : this._state(); } catch (e) { return {}; } }
  _unlock() { try { if (this._api().unlock) this._api().unlock(); } catch (e) {} }
  _act(n, p) { try { if (this._api().action) this._api().action(n, p); } catch (e) {} }
  _hold(code, on) { try { if (this._api().hold) this._api().hold(code, on); } catch (e) {} }
  _tap(code) { this._unlock(); try { if (this._api().tap) this._api().tap(code); } catch (e) {} }

  _build() {
    const style = document.createElement('style');
    style.id = 'tf-hud-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'tf-hud';
    root.innerHTML = `
      <div class="tf-timer tf-p" id="tf-timer">${svg('clock')}<span id="tf-time">0:00</span></div>
      <div class="tf-coins tf-p" id="tf-coins">${svg('coin')}<span id="tf-coins-v">0</span><i class="tf-dot" id="tf-dot-coins"></i></div>
      <button class="tf-pause tf-b" id="tf-pause" aria-label="Pause menu" title="Pause (P)">${svg('pause')}<i class="tf-dot" id="tf-dot-menu"></i></button>

      <div class="tf-mission tf-p" id="tf-mission"><i class="bar"></i>
        <div class="txt"><div class="nm" id="tf-job">FIRST SCOOP</div><div class="st" id="tf-step">Scoop dirt from the pile</div></div>
        <div class="tf-pips" id="tf-pips"><i></i><i></i><i></i></div>
      </div>

      <button class="tf-mini tf-p" id="tf-mini" aria-label="Open site map" title="Site map">
        <canvas id="tf-mini-holder"></canvas>
      </button>

      <div class="tf-tools" id="tf-tools">
        <button class="tf-b" id="tf-cam" data-a="camera" aria-label="Change camera" title="Camera (C)">${svg('camera')}<span class="kb">C</span></button>
        <button class="tf-b" id="tf-snd" data-a="sound" aria-label="Sound on or off" title="Sound (M)">${svg('sound')}<span class="kb">M</span></button>
        <button class="tf-b" id="tf-zin" data-a="zoomIn" aria-label="Zoom in" title="Zoom in (+)">${svg('plus')}<span class="kb">+</span></button>
        <button class="tf-b" id="tf-zout" data-a="zoomOut" aria-label="Zoom out" title="Zoom out (-)">${svg('minus')}<span class="kb">−</span></button>
      </div>

      <div class="tf-pad tf-p" id="tf-pad">
        <div class="r"><button class="tf-b" data-code="KeyW" aria-label="Drive forward">W<small>DRIVE</small></button></div>
        <div class="r">
          <button class="tf-b" data-code="KeyA" aria-label="Steer left">A</button>
          <button class="tf-b" data-code="KeyS" aria-label="Reverse">S</button>
          <button class="tf-b" data-code="KeyD" aria-label="Steer right">D</button>
        </div>
        <div class="r">
          <button class="tf-b" data-code="KeyF" aria-label="Scoop or dump">F<small>ACTION</small></button>
          <button class="tf-b" data-code="KeyC" aria-label="Camera">C<small>CAM</small></button>
          <button class="tf-b wide" data-code="Space" aria-label="Brake">SPACE<small>BRAKE</small></button>
        </div>
      </div>

      <div class="tf-speed tf-p" id="tf-speed"><span class="v" id="tf-speed-v">0</span><span class="u">km/h</span></div>

      <div class="tf-touch" id="tf-touch">
        <div class="tf-drive" id="tf-joy" aria-label="Steering pad"><div class="knob" id="tf-knob">${svg('wheel')}</div></div>
        <button class="tf-action" id="tf-f" data-code="KeyF" aria-label="Scoop or dump">${svg('dig')}<span id="tf-f-label">SCOOP</span></button>
        <button class="tf-brake" id="tf-brk" data-code="Space" aria-label="Brake">${svg('brake')}<span>BRK</span></button>
      </div>

      <div class="tf-toasts" id="tf-toasts"></div>
      <div class="tf-hint tf-p" id="tf-hint"></div>`;
    document.body.appendChild(root);
    this.root = root;
    const $ = id => root.querySelector('#' + id);
    this.el = {
      timer: $('tf-timer'), time: $('tf-time'), coins: $('tf-coins-v'), cdot: $('tf-dot-coins'),
      mdot: $('tf-dot-menu'), pause: $('tf-pause'), mission: $('tf-mission'), job: $('tf-job'),
      step: $('tf-step'), pips: $('tf-pips'), mini: $('tf-mini'), tools: $('tf-tools'),
      cam: $('tf-cam'), snd: $('tf-snd'), zin: $('tf-zin'), zout: $('tf-zout'),
      pad: $('tf-pad'), speed: $('tf-speed-v'), joy: $('tf-joy'), knob: $('tf-knob'),
      fBtn: $('tf-f'), fLabel: $('tf-f-label'), brk: $('tf-brk'),
      toasts: $('tf-toasts'), hint: $('tf-hint')
    };
    // The real minimap canvas comes from index.html (#tf-hold).
    const mm = document.getElementById('minimap-canvas');
    if (mm) {
      const holder = $('tf-mini-holder');
      if (holder) holder.remove();
      mm.style.width = '100%'; mm.style.height = '100%'; mm.style.display = 'block';
      this.el.mini.appendChild(mm);
    }
    // Touch detection: portrait phones, coarse pointer, ?touch, or first real finger.
    this._touch = this._detectTouch();
    this.setTouch(this._touch);
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && !this._touch) this.setTouch(true);
    }, { capture: true, passive: true });
  }

  _detectTouch() {
    try {
      if (/[?&]touch/.test(location.search)) return true;
      if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) return true;
      if (navigator.maxTouchPoints > 0 && window.innerWidth <= 900) return true;
    } catch (e) {}
    return false;
  }
  setTouch(on) {
    this._touch = !!on;
    this.root.classList.toggle('tf-touch-on', this._touch);
    // Both pads exist; CSS decides which is visible. Desktop can still click its keys.
  }

  // ------------------------------------------------------------------ input
  _setHold(code, on, pid) {
    let set = this._heldByCode.get(code);
    if (!set) { set = new Set(); this._heldByCode.set(code, set); }
    if (on) set.add(pid);
    else set.delete(pid);
    const live = set.size > 0;
    if (live !== this._lastLive?.get(code)) {
      if (!this._lastLive) this._lastLive = new Map();
      this._lastLive.set(code, live);
      this._hold(code, live);
    }
    const nodes = this.root.querySelectorAll('[data-code="' + code + '"]');
    nodes.forEach(n => n.classList.toggle('held', live));
    document.documentElement.classList.toggle('tf-holding',
      this._down.size > 0 || this._joyPid !== null);
  }
  _bindHold(node, code) {
    if (!node) return;
    const down = (e) => {
      e.preventDefault(); this._unlock();
      this._down.set(e.pointerId, code);
      try { node.setPointerCapture(e.pointerId); } catch (err) {}
      this._setHold(code, true, e.pointerId);
      node.classList.add('held');
    };
    const up = (e) => {
      if (this._down.get(e.pointerId) !== code) return;
      e.preventDefault();
      this._down.delete(e.pointerId);
      try { if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId); } catch (err) {}
      this._setHold(code, false, e.pointerId);
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('lostpointercapture', up);
  }
  _bindTap(node, code) {
    if (!node) return;
    node.addEventListener('pointerdown', (e) => { e.preventDefault(); this._unlock(); });
    node.addEventListener('click', (e) => { e.preventDefault(); this._tap(code); });
    node.addEventListener('pointerup', (e) => { e.preventDefault(); });
  }
  releaseAll() {
    for (const [code, set] of Array.from(this._heldByCode.entries())) {
      for (const pid of Array.from(set)) this._setHold(code, false, pid);
    }
    this._down.clear();
    this._joyPid = null;
    this.root.querySelectorAll('.held').forEach(n => n.classList.remove('held'));
    document.documentElement.classList.remove('tf-holding');
  }

  _joyDir(w, s, a, d, pidOverride) {
    const pid = (pidOverride !== undefined) ? pidOverride : this._joyPid;
    this._setHold('KeyW', w, pid);
    this._setHold('KeyS', s, pid);
    this._setHold('KeyA', a, pid);
    this._setHold('KeyD', d, pid);
  }

  _bind() {
    // HUD icon / button actions
    this.root.addEventListener('click', (e) => {
      const b = e.target && e.target.closest ? e.target.closest('[data-a]') : null;
      if (!b) return;
      this._unlock();
      this._act(b.dataset.a);
    });
    this.el.pause.addEventListener('click', () => { this._unlock(); this._act('pause'); });
    this.el.mini.addEventListener('click', () => { this._unlock(); this._act('map'); });

    // PC key pad: W A S D / Space are holds, F / C are taps.
    this.root.querySelectorAll('.tf-pad [data-code]').forEach(b => {
      const code = b.dataset.code;
      if (HOLD_CODES[code]) this._bindHold(b, code);
      else this._bindTap(b, code);
    });
    // TIER 1/TIER 4: Action is a 3-second HOLD, not a one-tap cheat.
    this._bindHold(this.el.fBtn, 'KeyF');
    this._bindHold(this.el.brk, 'Space');

    // Joystick: 8 directions, one pointerId, release on all paths.
    const joy = this.el.joy, thumb = this.el.knob;
    const move = (e) => {
      if (e.pointerId !== this._joyPid) return;
      const r = joy.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const k = Math.min(1, Math.max(0, Math.hypot(dx, dy)));
      const nx = k ? dx / Math.max(1, Math.hypot(dx, dy)) : 0;
      const ny = k ? dy / Math.max(1, Math.hypot(dx, dy)) : 0;
      thumb.style.transform = `translate(${nx * 26}px,${ny * 26}px)`;
      this._joyDir(ny < -0.32, ny > 0.32, nx < -0.32, nx > 0.32);
      e.preventDefault();
    };
    const joyStart = (e) => {
      if (this._joyPid !== null) return;
      e.preventDefault(); this._unlock();
      this._joyPid = e.pointerId;
      document.documentElement.classList.add('tf-holding');
      try { joy.setPointerCapture(e.pointerId); } catch (err) {}
      move(e);
    };
    const joyEnd = (e) => {
      if (e.pointerId !== this._joyPid) return;
      const pid = this._joyPid;
      this._joyPid = null;
      thumb.style.transform = '';
      this._joyDir(false, false, false, false, pid);
      try { if (joy.hasPointerCapture(e.pointerId)) joy.releasePointerCapture(e.pointerId); } catch (err) {}
      if (this._down.size === 0) document.documentElement.classList.remove('tf-holding');
    };
    joy.addEventListener('pointerdown', joyStart);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', joyEnd);
    joy.addEventListener('pointercancel', joyEnd);
    joy.addEventListener('lostpointercapture', joyEnd);

    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
    window.addEventListener('pointerup', () => {
      if (this._down.size === 0 && this._joyPid === null) document.documentElement.classList.remove('tf-holding');
    });
    window.addEventListener('pointercancel', () => this.releaseAll());
  }

  _menuAction(name, payload) {
    // Menus talks to the game through this single funnel.
    if (name === 'map-close') { this._act('window-close', 'map'); return; }
    this._act(name, payload);
  }

  // ------------------------------------------------------------------ screens
  setScreen(name) {
    this._screen = name;
    document.body.classList.toggle('tf-menu', name === 'menu');
    document.documentElement.classList.toggle('tf-playing', name === 'play');
    this.menus.setScreen(name);
    if (name === 'menu') this.releaseAll();
    this.refresh();
  }
  isMenuScreen() { return this._screen === 'menu'; }
  setStartInfo(info) { this.menus.setStartInfo(info || this._state()); }

  toggleMenu() { this.menus.isOpen() ? this.menus.close() : this.openMenu(); }
  openMenu() { this.menus.open('pause'); }
  closeMenu() { if (this.menus.kind === 'pause') this.menus.close(); }
  isMenuOpen() { return this.menus.isOpen(); }

  showModal(kind, data) { this.menus.open(kind === 'controls' ? 'help' : kind, data); }
  hideModal() { this.menus.close(); }
  confirm(cfg) { this.menus.open('confirm', cfg); }
  showResult(r) { this.menus.open('result', r); }
  showFail(r) { this.menus.open('fail', r); }
  showPicker(d) { this.menus.open('levels', d); }
  showGarage(d) { this.menus.open('garage', d); }
  showMap() { this.menus.open('map'); }

  reset() {
    this.releaseAll();
    this.closeMenu();
    this.menus.close();
    this.el.toasts.innerHTML = '';
    this.setHint('');
  }

  // ------------------------------------------------------------------ HUD data
  refresh() {
    const s = this._state();
    const d = this._data();
    const mode = s.cameraLabel || 'Chase';
    this.el.cam.title = 'Camera: ' + mode + ' (C)';
    this.el.cam.setAttribute('aria-label', 'Camera: ' + mode + '. Press to change.');
    this.el.snd.innerHTML = svg(s.muted ? 'mute' : 'sound') + '<span class="kb">M</span>';
    this.el.snd.title = s.muted ? 'Sound off (M)' : 'Sound on (M)';
    this.el.snd.setAttribute('aria-label', s.muted ? 'Sound off. Press to turn on.' : 'Sound on. Press to mute.');
    this.el.snd.classList.toggle('on', !!s.muted);
    const zoomable = s.zoomable !== false;
    this.el.zin.disabled = !zoomable;
    this.el.zout.disabled = !zoomable;
    this.el.zin.title = zoomable ? 'Zoom in (+)' : 'Zoom is off in Cab view';
    this.el.zout.title = zoomable ? 'Zoom out (-)' : 'Zoom is off in Cab view';
    this.el.zin.setAttribute('aria-label', zoomable ? 'Zoom in' : 'Zoom in unavailable in Cab view');
    this.el.zout.setAttribute('aria-label', zoomable ? 'Zoom out' : 'Zoom out unavailable in Cab view');
    this.el.coins.textContent = Number(s.coins || 0).toLocaleString('en-US');
    this.root.style.setProperty('--u', (d.big ? 1.2 : 1) + 'px');
    this.root.classList.toggle('tf-lefty', !!d.lefty);
    if (this.menus.isOpen()) this.menus.refresh();
  }
  setMuted(m) { this.refresh(); }
  setJob(title, objective, stepText) {
    this.el.job.textContent = String(title || '').toUpperCase();
    // TIER 5: name + ONE short goal line + three step dots. No paragraphs.
    this.el.step.textContent = String(objective || stepText || '').slice(0, 48);
    const n = Math.max(0, Math.min(3, parseInt(String(stepText || '').match(/(\d+)\s*\/\s*(\d+)/)?.[1] || '0', 10)));
    Array.from(this.el.pips.children).forEach((p, i) => p.classList.toggle('on', i < n));
  }
  setTimer(sec) {
    if (sec === null || sec === undefined) { this.el.timer.classList.add('off'); return; }
    this.el.timer.classList.remove('off');
    const s = Math.max(0, Math.ceil(sec));
    this.el.time.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    this.el.timer.classList.toggle('warn', s <= 30);
  }
  setCoins(n) { this.el.coins.textContent = Number(n || 0).toLocaleString('en-US'); }
  setSpeed(v) { this.el.speed.textContent = Math.round(Math.abs(+v || 0)); }
  setHint(text) {
    const t = String(text || '').slice(0, 90);
    this.el.hint.textContent = t;
    this.el.hint.classList.toggle('on', !!t);
  }
  setMenuDot(on) { this.el.mdot.classList.toggle('on', !!on); this.el.cdot.classList.toggle('on', !!on); }
  toast(msg, type) {
    const d = document.createElement('div');
    d.className = 'tf-toast tf-p ' + (type || 'info');
    d.textContent = String(msg).slice(0, 80);
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 2) this.el.toasts.removeChild(this.el.toasts.firstChild);
    setTimeout(() => { if (d.isConnected) d.remove(); }, 2600);
  }
  announce(job) {
    // Small toast, NOT a giant story card. The mission card stays 52 px tall.
    if (!job) return;
    this.toast('LEVEL ' + job.id + ' · ' + String(job.name || '').toUpperCase(), 'info');
  }
  showLocked(msg) { this.toast(msg || 'Locked', 'warn'); }
  // Visible 3-second hold ring on every F control (PC keycap + phone pad).
  setActionProgress(p) {
    const v = Math.max(0, Math.min(1, +p || 0));
    const deg = (v * 360).toFixed(1) + 'deg';
    const nodes = this.root.querySelectorAll('[data-code="KeyF"]');
    nodes.forEach(n => {
      n.style.setProperty('--act', deg);
      n.classList.toggle('acting', v > 0 && v < 1);
    });
  }
  setKey(code, on) {
    // TIER 4: a real keyboard press lights the matching on-screen key.
    const nodes = this.root.querySelectorAll('[data-code="' + code + '"]');
    nodes.forEach(n => n.classList.toggle('held', !!on));
    if (code === 'KeyC') this.el.cam.classList.toggle('held', !!on);
    if (code === 'KeyM') this.el.snd.classList.toggle('held', !!on);
  }
  setBig(v) { this.root.style.setProperty('--u', (v ? 1.2 : 1) + 'px'); }
  setLefty(v) { this.root.classList.toggle('tf-lefty', !!v); }
}
