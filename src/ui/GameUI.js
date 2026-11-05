// TerraForm 3D - HUD v8 QUALITY PASS. Portrait phone is FIRST-CLASS.
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
  dump: '<path d="M4 8h16l-2 7H6z"/><path d="M9 15l-2 4M15 15l2 4"/><path d="M12 4v4"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16"/>'
};
const svg = (n, cls) => `<svg class="tf-ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;

const CSS = `
/* All look tokens come from the ONE :root block in index.html.
   Default: joystick LEFT, actions RIGHT. .tf-lefty swaps them.
   --u is a unitless multiplier; Big buttons sets it to 1.2. */
#tf-hud{position:fixed;inset:0;z-index:100;pointer-events:none;--u:1;
  font:800 16px/1.2 var(--font);color:var(--ink);
  -webkit-user-select:none;user-select:none;touch-action:none}
#tf-hud *{box-sizing:border-box}
#tf-hud button{font-family:var(--font);font-weight:900;color:var(--ink);
  pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;outline:none;cursor:pointer}
#tf-hud button:focus-visible{outline:3px solid var(--goal);outline-offset:2px}
#tf-hud button:active{transform:translateY(2px)}
#tf-hud.off,#tf-hud.hide{display:none}
body.tf-menu #tf-hud{display:none !important}
#tf-hud .tf-ic{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex:none}
#tf-hud .tf-p{position:absolute;background:var(--panel);border:2px solid var(--border);
  border-radius:var(--radius);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),var(--shadow);
  pointer-events:auto;display:flex;align-items:center}
/* Every base is SOLID dark steel - no transparent blends with the world. */
.tf-b{position:relative;display:flex;align-items:center;justify-content:center;
  background:var(--steel-flat);border:2px solid var(--border);border-radius:12px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 3px 0 var(--border);color:var(--ink)}
#tf-hud .tf-b.on{background:var(--green);color:#052e21}
#tf-hud .tf-b .kb{position:absolute;bottom:2px;right:4px;font-size:14px;font-weight:900;color:var(--muted);letter-spacing:.04em}
#tf-hud .tf-dot{position:absolute;top:5px;right:5px;width:9px;height:9px;border-radius:50%;background:var(--danger);display:none}
#tf-hud .tf-dot.on{display:block}

/* ---- top row ------------------------------------------------------------ */
.tf-timer{left:50%;transform:translateX(-50%);top:calc(12px + ${SAFE_T});height:48px;min-width:152px;
  justify-content:center;gap:8px;padding:0 14px;font-size:22px;font-variant-numeric:tabular-nums}
.tf-timer .tf-ic{color:var(--goal);width:22px;height:22px}
.tf-timer.warn{color:#fff;background:var(--red)}
.tf-coins{right:calc(76px + ${SAFE_R});top:calc(12px + ${SAFE_T});height:48px;min-width:120px;
  gap:6px;padding:0 12px;justify-content:center;font-size:18px;font-variant-numeric:tabular-nums}
.tf-coins .tf-ic{color:var(--goal);width:22px;height:22px}
.tf-pause{position:absolute;right:calc(12px + ${SAFE_R});top:calc(12px + ${SAFE_T});
  width:56px;height:56px;border-radius:50%;background:var(--steel-flat);border:2px solid var(--border);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 3px 0 var(--border);display:flex;align-items:center;justify-content:center}
.tf-pause .tf-ic{width:26px;height:26px;color:var(--goal)}
.tf-mission{left:calc(12px + ${SAFE_L});top:calc(12px + ${SAFE_T});width:330px;height:64px;
  gap:10px;padding:0 12px 0 20px;overflow:hidden}
.tf-mission::before{content:'';position:absolute;left:0;top:0;bottom:0;width:8px;
  background:var(--hazard);border-radius:12px 0 0 12px}
.tf-mission .txt{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.tf-mission .nm{font-size:15px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-mission .st{font-size:14px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-pips{display:flex;gap:5px;flex:none}
.tf-pips i{width:11px;height:11px;border-radius:50%;background:var(--well);border:2px solid var(--border)}
.tf-pips i.on{background:var(--goal)}
.tf-mini{position:absolute;left:calc(12px + ${SAFE_L});top:calc(88px + ${SAFE_T});
  width:140px;height:140px;padding:6px;border-radius:14px;overflow:hidden}
.tf-mini canvas{display:block;width:100%;height:100%}
.tf-tools{position:absolute;right:calc(12px + ${SAFE_R});top:calc(76px + ${SAFE_T});
  display:flex;flex-direction:column;gap:8px;pointer-events:none}
.tf-tools .tf-b{width:56px;height:56px;border-radius:12px}
.tf-tools .tf-b .tf-ic{color:var(--goal)}

/* ---- keyboard hint pad (desktop only) --------------------------------- */
.tf-pad{position:absolute;left:calc(12px + ${SAFE_L});top:calc(240px + ${SAFE_T});width:200px;
  flex-direction:column;gap:6px;display:none;pointer-events:none}
#tf-hud .tf-pad{display:none !important}
.tf-pad .r{display:flex;gap:6px;justify-content:center}
.tf-pad .tf-b{width:56px;height:56px;font-size:15px;flex-direction:column;gap:1px}
.tf-pad .tf-b.wide{width:116px}
.tf-pad small{font-size:8px;letter-spacing:.06em;color:var(--muted)}

/* ---- speedometer ------------------------------------------------------- */
.tf-speed{left:50%;transform:translateX(-50%);bottom:calc(18px + ${SAFE_B});
  width:120px;height:120px;border-radius:50%;flex-direction:column;justify-content:center;gap:0;
  background:radial-gradient(circle at 50% 40%,var(--panel-solid),var(--well));
  border:3px solid var(--border);box-shadow:inset 0 2px 0 rgba(255,255,255,.16),var(--shadow)}
#tf-hud .tf-speed{border-radius:50%}
.tf-speed .v{font-size:44px;line-height:1;font-weight:900;color:var(--ink);font-variant-numeric:tabular-nums}
.tf-speed .u{font-size:14px;letter-spacing:.14em;color:var(--goal);margin-top:2px}

/* ---- touch controls: SOLID steel bases -------------------------------- */
.tf-touch{position:absolute;inset:0;pointer-events:none;display:block}
.tf-drive,.tf-action,.tf-dump,.tf-brake{position:absolute;display:flex;align-items:center;justify-content:center;
  background:var(--steel-flat);border:3px solid var(--border);border-radius:50%;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.14),var(--shadow),0 10px 26px rgba(0,0,0,.45);
  pointer-events:auto;flex-direction:column;gap:2px;overflow:hidden}
.tf-drive{left:calc(20px + ${SAFE_L});bottom:calc(20px + ${SAFE_B});
  width:${U('132px')};height:${U('132px')}}
.tf-drive::after{content:'';position:absolute;inset:12%;border-radius:50%;border:2px dashed #44577a;opacity:.7;pointer-events:none}
.tf-drive .knob{width:56%;height:56%;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:var(--steel);border:2px solid var(--border);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 3px 6px rgba(0,0,0,.5)}
.tf-drive .knob .tf-ic{width:36px;height:36px;color:var(--goal)}
.tf-action{right:calc(20px + ${SAFE_R});bottom:calc(20px + ${SAFE_B});
  width:${U('96px')};height:${U('96px')};border-color:var(--amber-dark)}
.tf-action .tf-ic{width:36px;height:36px;color:var(--goal)}
.tf-action span,.tf-dump span,.tf-brake span{font-size:14px;letter-spacing:.08em;color:var(--ink)}
.tf-dump{right:calc(124px + ${SAFE_R});bottom:calc(28px + ${SAFE_B});
  width:${U('72px')};height:${U('72px')}}
.tf-dump .tf-ic{width:28px;height:28px;color:var(--cyan)}
.tf-dump span{font-size:14px}
.tf-brake{right:calc(32px + ${SAFE_R});bottom:calc(128px + ${SAFE_B});
  width:${U('56px')};height:${U('56px')};border-color:#7f1d1d;background:#2a171c}
.tf-brake .tf-ic{width:24px;height:24px;color:#fca5a5}
.tf-brake span{font-size:14px}
/* radial hold ring on the action button */
.tf-ring{position:absolute;inset:0;border-radius:50%;pointer-events:none;
  background:conic-gradient(var(--goal) calc(var(--p,0) * 1turn),transparent 0);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 8px),#000 calc(100% - 7px));
  mask:radial-gradient(farthest-side,transparent calc(100% - 8px),#000 calc(100% - 7px));
  opacity:0}
.tf-ring.on{opacity:1}
.tf-action.holding,.tf-dump.holding{border-color:var(--goal);box-shadow:0 0 0 4px rgba(251,191,36,.35),inset 0 2px 0 rgba(255,255,255,.14),var(--shadow)}

/* ---- toasts / hint / announce ------------------------------------------ */
.tf-toasts{position:absolute;top:auto;bottom:calc(160px + ${SAFE_B});left:50%;transform:translateX(-50%);
  width:min(360px,86vw);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;z-index:12}
.tf-toast{background:var(--well);color:var(--ink);border:2px solid var(--border);border-left:6px solid var(--goal);
  border-radius:10px;padding:10px 14px;font-size:15px;font-weight:900;text-align:center;
  box-shadow:var(--shadow);animation:tfpop .2s ease-out;max-width:100%}
.tf-toast.ok{border-left-color:var(--success)}
.tf-toast.warn{border-left-color:var(--danger)}
@keyframes tfpop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.tf-hint{position:absolute;left:50%;transform:translateX(-50%);top:calc(90px + ${SAFE_T});
  padding:8px 14px;font-size:14px;font-weight:800;color:var(--ink);white-space:nowrap;display:none}
.tf-hint.on{display:flex}
.tf-announce{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);text-align:center;
  pointer-events:none;z-index:14;opacity:0;transition:opacity .3s;max-width:90vw}
.tf-announce.on{opacity:1}
.tf-announce .t1{font-size:34px;font-weight:900;letter-spacing:.1em;color:var(--goal);text-shadow:0 3px 0 var(--border)}
.tf-announce .t2{font-size:16px;color:var(--ink);margin-top:6px}
#tf-loads{position:absolute;left:50%;transform:translateX(-50%);top:calc(150px + ${SAFE_T});
  background:var(--well);border:2px solid var(--amber-dark);border-radius:999px;padding:8px 18px;
  font-size:16px;font-weight:900;color:var(--goal);display:none;pointer-events:none;z-index:11}
#tf-loads.on{display:block}

/* Swap sides: joystick RIGHT, actions LEFT. */
#tf-hud.tf-lefty .tf-drive{left:auto;right:calc(20px + ${SAFE_R})}
#tf-hud.tf-lefty .tf-action{right:auto;left:calc(20px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-dump{right:auto;left:calc(124px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-brake{right:auto;left:calc(32px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-mini{left:auto;right:calc(12px + ${SAFE_R})}
#tf-hud.tf-lefty .tf-tools{right:auto;left:calc(12px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-mission{left:auto;right:calc(12px + ${SAFE_R})}
#tf-hud.tf-lefty .tf-coins{right:auto;left:calc(76px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-pause{right:auto;left:calc(12px + ${SAFE_L})}
#tf-hud.tf-lefty .tf-pad{left:auto;right:calc(12px + ${SAFE_R})}

/* ------------------------------------------------------------ big desktop */
@media (min-width:1600px){
  .tf-mission{width:440px;height:72px}
  .tf-mission .nm{font-size:17px}.tf-mission .st{font-size:14px}
  .tf-mini{top:calc(96px + ${SAFE_T});width:160px;height:160px}
  .tf-pad{top:calc(268px + ${SAFE_T})}
}

/* -------------------------------------------------------- phone landscape */
@media (max-height:560px) and (orientation:landscape){
  #tf-hud{font-size:14px}
  .tf-timer{top:calc(8px + ${SAFE_T});height:36px;min-width:96px;font-size:16px;gap:5px;padding:0 8px}
  .tf-timer .tf-ic{width:18px;height:18px}
  .tf-mission{left:calc(10px + ${SAFE_L});top:calc(8px + ${SAFE_T});width:300px;height:44px;padding-left:16px}
  .tf-mission .nm{font-size:15px}.tf-mission .st{font-size:14px}
  .tf-coins{left:calc(10px + ${SAFE_L});right:auto;top:calc(58px + ${SAFE_T});height:36px;min-width:96px;font-size:14px;padding:0 8px}
  .tf-coins .tf-ic{width:18px;height:18px}
  .tf-pause{top:calc(8px + ${SAFE_T});right:calc(10px + ${SAFE_R});width:48px;height:48px}
  .tf-pause .tf-ic{width:22px;height:22px}
  .tf-tools{top:calc(8px + ${SAFE_T});right:calc(66px + ${SAFE_R});flex-direction:row;gap:6px}
  .tf-tools .tf-b{width:48px;height:48px}
  .tf-tools .tf-b .tf-ic{width:22px;height:22px}
  .tf-mini{left:auto;right:calc(10px + ${SAFE_R});top:calc(64px + ${SAFE_T});width:104px;height:104px}
  .tf-drive{left:calc(10px + ${SAFE_L});bottom:calc(12px + ${SAFE_B});width:${U('104px')};height:${U('104px')}}
  .tf-action{right:calc(16px + ${SAFE_R});bottom:calc(14px + ${SAFE_B});width:${U('84px')};height:${U('84px')}}
  .tf-action .tf-ic{width:30px;height:30px}
  .tf-dump{right:calc(108px + ${SAFE_R});bottom:calc(20px + ${SAFE_B});width:${U('64px')};height:${U('64px')}}
  .tf-dump .tf-ic{width:24px;height:24px}
  .tf-brake{right:calc(26px + ${SAFE_R});bottom:calc(108px + ${SAFE_B});width:${U('56px')};height:${U('56px')}}
  .tf-speed{bottom:calc(8px + ${SAFE_B});width:88px;height:88px}
  .tf-speed .v{font-size:32px}
  .tf-toasts{bottom:calc(160px + ${SAFE_B});width:min(320px,60vw)}
  .tf-toast{font-size:14px;padding:7px 10px}
  .tf-hint{top:calc(52px + ${SAFE_T})}
  #tf-loads{top:calc(52px + ${SAFE_T})}
  .tf-pad{display:none}
  #tf-hud.tf-lefty .tf-drive{left:auto;right:calc(10px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-action{right:auto;left:calc(16px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-dump{right:auto;left:calc(108px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-brake{right:auto;left:calc(26px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-mini{right:auto;left:calc(10px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-tools{right:auto;left:calc(66px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-mission{left:auto;right:calc(10px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-coins{left:auto;right:calc(10px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-pause{right:auto;left:calc(10px + ${SAFE_L})}
}

/* --------------------------------------------------------- phone portrait */
@media (max-width:560px) and (orientation:portrait){
  #tf-hud{font-size:14px}
  .tf-timer{top:calc(12px + ${SAFE_T});height:44px;min-width:120px;font-size:18px;gap:6px;padding:0 10px}
  .tf-timer .tf-ic{width:20px;height:20px}
  .tf-coins{left:calc(12px + ${SAFE_L});right:auto;top:calc(12px + ${SAFE_T});height:44px;min-width:108px;font-size:15px;padding:0 10px}
  .tf-coins .tf-ic{width:20px;height:20px}
  .tf-pause{top:calc(12px + ${SAFE_T});right:calc(12px + ${SAFE_R});width:56px;height:56px}
  .tf-mission{top:calc(66px + ${SAFE_T});left:calc(12px + ${SAFE_L});right:calc(76px + ${SAFE_R});
    width:auto;height:56px;padding-left:18px}
  .tf-mission .nm{font-size:15px}.tf-mission .st{font-size:14px}
  .tf-mini{top:calc(132px + ${SAFE_T});left:calc(12px + ${SAFE_L});width:88px;height:88px}
  .tf-tools{top:calc(76px + ${SAFE_T});right:calc(12px + ${SAFE_R});flex-direction:column;gap:6px}
  .tf-tools .tf-b{width:52px;height:52px}
  .tf-tools .tf-b .tf-ic{width:23px;height:23px}
  .tf-drive{left:calc(12px + ${SAFE_L});bottom:calc(20px + ${SAFE_B});width:${U('132px')};height:${U('132px')}}
  .tf-action{right:calc(12px + ${SAFE_R});bottom:calc(20px + ${SAFE_B});width:${U('96px')};height:${U('96px')}}
  .tf-dump{right:calc(116px + ${SAFE_R});bottom:calc(30px + ${SAFE_B});width:${U('72px')};height:${U('72px')}}
  .tf-brake{right:calc(32px + ${SAFE_R});bottom:calc(128px + ${SAFE_B});width:${U('56px')};height:${U('56px')}}
  .tf-speed{left:calc(50% + 10px);bottom:calc(156px + ${SAFE_B});width:104px;height:104px}
  .tf-speed .v{font-size:36px}
  .tf-toasts{bottom:calc(276px + ${SAFE_B});width:min(320px,84vw)}
  .tf-toast{font-size:14px;padding:9px 12px}
  .tf-hint{top:calc(230px + ${SAFE_T})}
  #tf-loads{top:calc(230px + ${SAFE_T})}
  .tf-pad{display:none}
  #tf-hud.tf-lefty .tf-drive{left:auto;right:calc(12px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-action{right:auto;left:calc(12px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-dump{right:auto;left:calc(116px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-brake{right:auto;left:calc(32px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-mini{left:auto;right:calc(12px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-tools{right:auto;left:calc(12px + ${SAFE_L})}
  #tf-hud.tf-lefty .tf-mission{left:auto;right:calc(76px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-coins{left:auto;right:calc(12px + ${SAFE_R})}
  #tf-hud.tf-lefty .tf-pause{right:auto;left:calc(12px + ${SAFE_L})}
}
@media (max-width:400px) and (orientation:portrait){
  .tf-mission{right:calc(72px + ${SAFE_R})}
  .tf-drive{width:${U('124px')};height:${U('124px')}}
  .tf-action{width:${U('92px')};height:${U('92px')}}
  .tf-dump{right:calc(110px + ${SAFE_R});width:${U('68px')};height:${U('68px')}}
}

`;

const HOLD_CODES = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, Space: 1, KeyF: 1, KeyG: 1 };
const CODE_TO_KEY = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyC: 'C', KeyM: 'M', KeyP: 'P', Space: 'SPC' };

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
        <button class="tf-b" id="tf-map" data-a="map" aria-label="Open big site map" title="Site map">${svg('map')}<span class="kb">M</span></button>
      </div>

      <div class="tf-pad tf-p" id="tf-pad">
        <div class="r"><button class="tf-b" data-code="KeyW" aria-label="Drive forward">W<small>DRIVE</small></button></div>
        <div class="r">
          <button class="tf-b" data-code="KeyA" aria-label="Steer left">A</button>
          <button class="tf-b" data-code="KeyS" aria-label="Reverse">S</button>
          <button class="tf-b" data-code="KeyD" aria-label="Steer right">D</button>
        </div>
        <div class="r">
          <button class="tf-b" data-code="KeyF" aria-label="Scoop">F<small>SCOOP</small></button>
          <button class="tf-b" data-code="KeyG" aria-label="Dump">G<small>DUMP</small></button>
          <button class="tf-b" data-code="KeyC" aria-label="Camera">C<small>CAM</small></button>
          <button class="tf-b wide" data-code="Space" aria-label="Brake">SPACE<small>BRAKE</small></button>
        </div>
      </div>

      <div class="tf-speed tf-p" id="tf-speed"><span class="v" id="tf-speed-v">0</span><span class="u">km/h</span></div>

      <div class="tf-touch" id="tf-touch">
        <div class="tf-drive" id="tf-joy" aria-label="Steering pad"><div class="knob" id="tf-knob">${svg('wheel')}</div></div>
        <button class="tf-action" id="tf-f" data-code="KeyF" aria-label="Scoop">${svg('dig')}<span>SCOOP</span><i class="tf-ring" id="tf-f-ring"></i></button>
        <button class="tf-dump" id="tf-g" data-code="KeyG" aria-label="Dump">${svg('dump')}<span>DUMP</span><i class="tf-ring" id="tf-g-ring"></i></button>
        <button class="tf-brake" id="tf-brk" data-code="Space" aria-label="Brake">${svg('brake')}<span>BRK</span></button>
      </div>

      <div id="tf-loads">LOADS LEFT 3</div>
      <div class="tf-announce" id="tf-announce"><div class="t1" id="tf-ann-t1"></div><div class="t2" id="tf-ann-t2"></div></div>
      <div class="tf-toasts" id="tf-toasts"></div>
      <div class="tf-hint tf-p" id="tf-hint"></div>`;
    document.body.appendChild(root);
    this.root = root;
    const $ = id => root.querySelector('#' + id);
    this.el = {
      timer: $('tf-timer'), time: $('tf-time'), coins: $('tf-coins-v'), cdot: $('tf-dot-coins'),
      mdot: $('tf-dot-menu'), pause: $('tf-pause'), mission: $('tf-mission'), job: $('tf-job'),
      step: $('tf-step'), pips: $('tf-pips'), mini: $('tf-mini'), tools: $('tf-tools'),
      cam: $('tf-cam'), snd: $('tf-snd'), zin: $('tf-zin'), zout: $('tf-zout'), map: $('tf-map'),
      pad: $('tf-pad'), speed: $('tf-speed-v'), joy: $('tf-joy'), knob: $('tf-knob'),
      fBtn: $('tf-f'), gBtn: $('tf-g'), fRing: $('tf-f-ring'), gRing: $('tf-g-ring'),
      fLabel: $('tf-f-label'), brk: $('tf-brk'),
      toasts: $('tf-toasts'), hint: $('tf-hint'), loads: $('tf-loads'),
      announce: $('tf-announce'), annT1: $('tf-ann-t1'), annT2: $('tf-ann-t2')
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
    // SCOOP 1.6s and DUMP 1.2s are real HOLDs. No one-tap cheat.
    this._bindHold(this.el.fBtn, 'KeyF');
    this._bindHold(this.el.gBtn, 'KeyG');
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
    this.root.style.setProperty('--u', String(d.big ? 1.2 : 1));
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
  setActionProgress(p, code) {
    const v = Math.max(0, Math.min(1, p || 0));
    const pick = code === 'KeyG' ? this.el.gRing : this.el.fRing;
    for (const r of [this.el.fRing, this.el.gRing]) {
      if (!r) continue;
      r.style.setProperty('--p', r === pick ? String(v) : '0');
      r.classList.toggle('on', r === pick && v > 0);
    }
    if (this.el.fBtn) this.el.fBtn.classList.toggle('holding', code !== 'KeyG' && v > 0);
    if (this.el.gBtn) this.el.gBtn.classList.toggle('holding', code === 'KeyG' && v > 0);
    const h = document.getElementById('tf-hold');
    if (h) { const i = h.querySelector('i'); if (i) i.style.width = Math.round(v * 100) + '%'; }
  }
  setLoads(n) {
    if (!this.el.loads) return;
    this.el.loads.textContent = 'LOADS LEFT ' + Math.max(0, n | 0);
    this.el.loads.classList.toggle('on', n > 0);
  }
  announce2(t1, t2) {
    if (!this.el.announce) return;
    this.el.annT1.textContent = t1 || '';
    this.el.annT2.textContent = t2 || '';
    this.el.announce.classList.add('on');
    clearTimeout(this._annT);
    this._annT = setTimeout(() => this.el.announce.classList.remove('on'), 1600);
  }
  setKey(code, on) {
    // TIER 4: a real keyboard press lights the matching on-screen key.
    const nodes = this.root.querySelectorAll('[data-code="' + code + '"]');
    nodes.forEach(n => n.classList.toggle('held', !!on));
    if (code === 'KeyC') this.el.cam.classList.toggle('held', !!on);
    if (code === 'KeyM') this.el.snd.classList.toggle('held', !!on);
  }
  setBig(v) { this.root.style.setProperty('--u', String(v ? 1.2 : 1)); }
  setLefty(v) { this.root.classList.toggle('tf-lefty', !!v); }
}
