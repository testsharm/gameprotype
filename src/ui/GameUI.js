// TerraForm 3D HUD v6 + start screen + in-game menu.
// Everything here is made in code: semantic <button>s, steel panels, amber accents.
// Pointer controls call the REAL input API supplied by main.js (no fake keyboard events).
// Start screen / menus use <button> + click. Driving controls use pointerdown/up +
// setPointerCapture, so one press is one held action and multi-touch works.

const U = n => `calc(var(--u)*${n})`;
const SAFE_L = 'env(safe-area-inset-left,0px)', SAFE_R = 'env(safe-area-inset-right,0px)';
const SAFE_B = 'env(safe-area-inset-bottom,0px)', SAFE_T = 'env(safe-area-inset-top,0px)';
const MONO = 'ui-monospace,Menlo,Consolas,"Courier New",monospace';

const CSS = `
/* Page scroll / zoom / selection are locked only while playing or while a
   control is held. Start screen and every menu stay scrollable and usable. */
html.tf-playing,html.tf-playing body{overflow:hidden}
html.tf-holding,html.tf-holding body{overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
#tf-hud{position:fixed;inset:0;z-index:100;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e2e8f0;font-weight:600;font-size:${U(14)};line-height:1.25;user-select:none;-webkit-user-select:none}
#tf-hud *{box-sizing:border-box}
#tf-hud button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;margin:0}
#tf-hud button:focus-visible,#tf-shell button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
#tf-hud button[disabled]{cursor:not-allowed}
.tf-p{background:linear-gradient(180deg,#34445f,#151d2b);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.35),0 ${U(4)} 0 #0a0f18,0 ${U(8)} ${U(16)} rgba(0,0,0,.45)}
.tf-b{background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 ${U(5)} 0 #0a0f18,0 ${U(9)} ${U(14)} rgba(0,0,0,.4);border-radius:10px}
.tf-b:active{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 ${U(2)} 0 #0a0f18}
.tf-b.on{background:linear-gradient(180deg,#7c5a12,#4a3408);color:#fde68a;border-color:#fbbf24}
.tf-ic{width:${U(24)};height:${U(24)};fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
body.tf-menu #tf-hud{visibility:hidden}

/* top-left: timer and minimap */
.tf-tl{position:absolute;left:calc(${U(14)} + ${SAFE_L});top:calc(${U(12)} + ${SAFE_T});display:flex;flex-direction:column;align-items:flex-start;gap:${U(10)}}
.tf-timer{display:flex;align-items:center;gap:${U(8)};padding:${U(6)} ${U(12)};border-radius:${U(10)};color:#fbbf24}
.tf-timer.off{display:none}
.tf-timer span{font:900 ${U(20)}/1.1 ${MONO};letter-spacing:.06em;text-shadow:0 2px 0 #0a0f18}
.tf-timer.warn{color:#f87171;animation:tfpulse .8s ease-in-out infinite alternate}
@keyframes tfpulse{from{filter:none}to{filter:drop-shadow(0 0 ${U(8)} rgba(239,68,68,.8))}}
.tf-map{position:relative;width:${U(96)};height:${U(96)};border-radius:50%;padding:${U(5)}}
.tf-map canvas{display:block;width:100%;height:100%;border-radius:50%;background:#0b111a;box-shadow:inset 0 3px 8px rgba(0,0,0,.65)}
.tf-n{position:absolute;top:${U(-6)};left:50%;transform:translateX(-50%);width:${U(22)};height:${U(22)};border-radius:50%;background:#fbbf24;color:#1a1204;border:2px solid #0a0f18;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:${U(14)}}

/* top-centre: mission card */
.tf-card{position:absolute;top:calc(${U(12)} + ${SAFE_T});left:50%;transform:translateX(-50%);display:flex;border-radius:${U(10)};overflow:hidden;width:min(${U(340)},calc(100vw - ${U(380)}))}
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

/* top-right: coins + menu */
.tf-tr{position:absolute;right:calc(${U(14)} + ${SAFE_R});top:calc(${U(12)} + ${SAFE_T});display:flex;align-items:flex-start;gap:${U(10)}}
.tf-coin{height:${U(48)};display:flex;align-items:center;gap:${U(8)};padding:0 ${U(16)} 0 ${U(9)};border-radius:${U(24)}}
.tf-c{width:${U(30)};height:${U(30)};border-radius:50%;background:radial-gradient(circle at 35% 30%,#fde68a,#d98f06);color:#1a1204;display:grid;place-items:center;font-style:normal;font-weight:900;box-shadow:0 0 0 2px #0a0f18,0 2px 0 2px #0a0f18}
#tf-coins{font:900 ${U(18)}/1 ${MONO};color:#fbbf24;text-shadow:0 2px 0 #0a0f18}
.tf-menu{width:${U(48)};height:${U(48)};padding:0;border-radius:${U(12)};display:grid;place-items:center;color:#fbbf24}
.tf-dot{position:absolute;top:${U(-5)};right:${U(-5)};width:${U(16)};height:${U(16)};border-radius:50%;background:#34d399;border:2px solid #0a0f18;box-shadow:0 0 ${U(8)} #34d399;display:none}
.tf-dot.on{display:block}

/* persistent tools: camera, sound, zoom (never inside the hamburger) */
.tf-tools{position:absolute;right:calc(14px + ${SAFE_R});top:calc(74px + ${SAFE_T});display:flex;gap:8px;pointer-events:auto;z-index:2}
.tf-tool{width:60px;min-width:48px;height:52px;min-height:48px;padding:2px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:14px;font-weight:900;line-height:1.05;color:#e2e8f0;text-align:center}
.tf-tool small{display:block;font-size:12px;font-weight:800;color:#fbbf24;letter-spacing:.02em;white-space:nowrap}
.tf-tool.big{font-size:22px;line-height:1}
.tf-tool[disabled]{opacity:.5;filter:grayscale(1)}
.tf-tool.warn small{color:#fca5a5}

/* toasts */
.tf-lane{position:absolute;right:calc(14px + ${SAFE_R});top:calc(132px + ${SAFE_T});width:${U(290)};display:flex;flex-direction:column;align-items:flex-end;gap:${U(8)};transition:opacity .2s}
.tf-t{max-width:100%;display:flex;align-items:center;gap:${U(8)};padding:${U(8)} ${U(14)};border-radius:${U(20)};color:#fff;font-weight:700;font-size:14px;animation:tfin .25s ease-out}
.tf-t i{width:${U(10)};height:${U(10)};border-radius:50%;flex:none;background:#60a5fa;box-shadow:0 0 ${U(8)} #60a5fa}
.tf-t.success i{background:#34d399;box-shadow:0 0 ${U(8)} #34d399}
.tf-t.warn i{background:#fbbf24;box-shadow:0 0 ${U(8)} #fbbf24}
.tf-t.out{opacity:0;transform:translateX(${U(20)});transition:opacity .3s,transform .3s}
@keyframes tfin{from{opacity:0;transform:translateX(${U(24)})}to{opacity:1;transform:none}}

/* in-game menu (7 real labelled buttons) */
.tf-drawer{position:absolute;right:calc(14px + ${SAFE_R});top:calc(132px + ${SAFE_T});z-index:3;display:none;grid-template-columns:repeat(3,88px);gap:8px;padding:10px;pointer-events:auto}
.tf-drawer.open{display:grid;animation:tfin .18s ease-out}
.tf-tile{position:relative;min-height:52px;padding:6px 5px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;font-weight:800;color:#e2e8f0;line-height:1.1;text-align:center}
.tf-tile .tf-ic{color:#fbbf24}
.tf-tile.danger{color:#fca5a5}
.tf-tile .tf-dot{top:4px;right:6px}
#tf-hud.tf-menu-open .tf-lane,#tf-hud.tf-menu-open .tf-hint{opacity:0;pointer-events:none}

/* bottom-left: PC clickable pad or touch F */
.tf-bl{position:absolute;left:calc(${U(14)} + ${SAFE_L});bottom:calc(${U(14)} + ${SAFE_B});display:flex;align-items:flex-end;gap:${U(12)}}
.tf-fbtn{width:${U(92)};height:${U(92)};min-width:48px;min-height:48px;padding:0;border-radius:50%;border-width:${U(4)};display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#3f5272,#223044 55%,#141d2a)}
.tf-fbtn b{font-size:${U(34)};line-height:1;font-weight:900;color:#fbbf24;text-shadow:0 2px 0 #0a0f18}
.tf-fbtn span{font-size:${U(14)};font-weight:900;letter-spacing:.1em;color:#a9b8cc}
.tf-pad{width:190px;display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:12px;pointer-events:auto}
.tf-help{font-size:14px;line-height:1.2;font-weight:800;color:#cbd5e1;text-align:center}
.tf-dpad{display:grid;grid-template-columns:repeat(3,48px);gap:4px;justify-content:center}
.tf-key{width:48px;min-width:48px;height:48px;min-height:48px;padding:0;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:17px;font-weight:900;color:#fbbf24}
.tf-key small{font-size:12px;font-weight:800;color:#a9b8cc;line-height:1}
.tf-key.held{background:linear-gradient(180deg,#7c5a12,#4a3408);color:#fde68a}
.tf-key.sp{grid-column-start:2}
.tf-t-only{display:none}
#tf-hud.tf-touch .tf-t-only{display:flex}
#tf-hud.tf-touch .tf-d-only{display:none}

/* bottom-centre: hint */
.tf-hint{position:absolute;left:50%;bottom:calc(${U(14)} + ${SAFE_B});transform:translate(-50%,${U(10)});opacity:0;transition:opacity .35s,transform .35s;display:flex;align-items:center;gap:${U(10)};padding:${U(8)} ${U(18)} ${U(8)} ${U(10)};border-radius:${U(26)};max-width:calc(100vw - ${U(440)});white-space:nowrap;font-size:14px}
.tf-hint.on{opacity:1;transform:translate(-50%,0)}
.tf-hint em{flex:none;width:${U(30)};height:${U(30)};border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:900;color:#fbbf24;background:#0b111a;box-shadow:inset 0 2px 4px rgba(0,0,0,.7);border:2px solid #0a0f18}
.tf-hint span{overflow:hidden;text-overflow:ellipsis}

/* bottom-right: speedometer + touch steering/brake */
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
.tf-brk{width:64px;min-width:48px;height:48px;min-height:48px;padding:0;border-radius:12px;font-size:14px;font-weight:900;letter-spacing:.06em;color:#fff;background:linear-gradient(#f87171,#b91c1c);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 5px 0 #450a0a}
.tf-brk.held{background:linear-gradient(#fca5a5,#ef4444)}
.tf-joy{position:relative;width:${U(124)};height:${U(124)};min-width:48px;min-height:48px;border-radius:50%;border:${U(3)} dashed rgba(203,213,225,.5);background:rgba(8,12,20,.38);display:grid;place-items:center;pointer-events:auto;touch-action:none}
.tf-thumb{width:${U(54)};height:${U(54)};border-radius:50%;pointer-events:none}
.tf-joy span{position:absolute;bottom:${U(6)};left:0;right:0;text-align:center;font-weight:900;letter-spacing:.14em;color:#a9b8cc;font-size:14px;pointer-events:none}

/* ---------------------------------------------------------------- start screen + windows */
#tf-shell{position:fixed;inset:0;z-index:400;pointer-events:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#eef3fb}
#tf-shell *{box-sizing:border-box}
#tf-shell button{font:inherit;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#tf-start{position:absolute;inset:0;display:none;pointer-events:auto;overflow:auto;background:linear-gradient(100deg,rgba(6,10,18,.96) 0%,rgba(6,10,18,.88) 36%,rgba(6,10,18,.30) 72%,rgba(6,10,18,.06) 100%)}
#tf-start.on{display:flex;align-items:center;padding:calc(24px + ${SAFE_T}) calc(24px + ${SAFE_R}) calc(24px + ${SAFE_B}) calc(24px + ${SAFE_L})}
.tf-scr{width:min(420px,92vw);padding:22px;border-radius:18px;background:linear-gradient(180deg,#2b384e,#18212f);border:2px solid #0a0f18;box-shadow:0 6px 0 #0a0f18,0 24px 48px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.12)}
.tf-scr h1{margin:0;font-size:clamp(30px,4.2vw,50px);line-height:1;font-weight:900;letter-spacing:.04em;color:#fde68a;text-shadow:0 3px 0 #0a0f18}
.tf-scr .tf-tag{display:inline-block;margin:8px 0 12px;padding:4px 10px;border-radius:6px;background:#fbbf24;color:#1a1204;font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.tf-scr p{margin:0 0 16px;font-size:16px;line-height:1.45;color:#cbd5e1}
.tf-scr-list{display:flex;flex-direction:column;gap:10px}
.tf-scr-list button{min-height:56px;width:100%;padding:8px 16px;border-radius:12px;font-size:18px;font-weight:900;letter-spacing:.02em;text-align:left;color:#eef3fb;background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 5px 0 #0a0f18}
.tf-scr-list button:active{transform:translateY(3px);box-shadow:0 2px 0 #0a0f18}
.tf-scr-list button.primary{color:#1a1204;background:linear-gradient(180deg,#fde68a,#f59e0b);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 5px 0 #b45309}
.tf-scr-note{margin-top:14px;font-size:14px;line-height:1.4;color:#8fa1ba}
.tf-scr-badge{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}
.tf-scr-badge span{padding:5px 10px;border-radius:8px;background:#0b111a;border:1px solid #34445f;font-size:14px;font-weight:800;color:#cbd5e1}

.tf-modal{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(4,8,15,.76);pointer-events:auto;overflow:auto}
.tf-modal.on{display:flex}
.tf-mcard{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:20px;border-radius:16px;background:linear-gradient(180deg,#2b384e,#18212f);border:2px solid #0a0f18;box-shadow:0 6px 0 #0a0f18,0 24px 48px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.12)}
.tf-mcard h2{margin:0 0 6px;font-size:26px;font-weight:900;color:#fde68a;text-shadow:0 2px 0 #0a0f18}
.tf-mcard p{margin:0 0 14px;font-size:16px;line-height:1.45;color:#cbd5e1}
.tf-mrow{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.tf-mrow button{flex:1 1 120px;min-width:96px;min-height:48px;padding:8px 12px;border-radius:10px;font-size:16px;font-weight:800;color:#eef3fb;background:linear-gradient(180deg,#3a4c68,#1d2839);border:2px solid #0a0f18;box-shadow:0 4px 0 #0a0f18}
.tf-mrow button.on{color:#1a1204;background:linear-gradient(180deg,#fde68a,#f59e0b)}
.tf-mrow button.danger{color:#fff;background:linear-gradient(#f87171,#b91c1c)}
.tf-mrow button.primary{color:#1a1204;background:linear-gradient(180deg,#fde68a,#f59e0b)}
.tf-krow{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(148,163,184,.22);font-size:16px;line-height:1.35}
.tf-krow b{color:#fbbf24;white-space:nowrap}
.tf-krow span{text-align:right;color:#cbd5e1}
.tf-mcard .tf-scr-note{margin-top:12px}

/* ---- short landscape (844x390 and similar): primary phone layout ---- */
@media (max-height:480px) and (orientation:landscape){
  .tf-tl{top:calc(8px + ${SAFE_T});left:calc(10px + ${SAFE_L});gap:6px}
  .tf-map{width:68px;height:68px;padding:4px}
  .tf-timer{padding:4px 8px}
  .tf-card{top:calc(8px + ${SAFE_T});width:min(280px,calc(100vw - 320px))}
  .tf-card.big .tf-story{max-height:36px}
  .tf-tr{top:calc(8px + ${SAFE_T});right:calc(10px + ${SAFE_R})}
  .tf-coin{height:44px}
  .tf-tools{left:50%;right:auto;top:auto;bottom:calc(10px + ${SAFE_B});transform:translateX(-50%)}
  .tf-tool{width:60px;height:52px}
  .tf-lane{top:calc(116px + ${SAFE_T});right:calc(10px + ${SAFE_R});width:220px}
  .tf-drawer{top:calc(132px + ${SAFE_T});right:calc(10px + ${SAFE_R});grid-template-columns:repeat(4,78px)}
  .tf-tile{min-height:48px;font-size:14px}
  .tf-bl{bottom:calc(10px + ${SAFE_B});left:calc(10px + ${SAFE_L});gap:10px}
  .tf-fbtn{width:76px;height:76px}
  .tf-fbtn b{font-size:28px}
  .tf-pad{width:190px;padding:6px 8px;gap:4px}
  .tf-help{font-size:14px}
  .tf-br{bottom:calc(10px + ${SAFE_B});right:calc(10px + ${SAFE_R});gap:10px}
  .tf-dial{width:76px;height:76px}
  .tf-well{inset:16px}
  #tf-spd{font-size:20px}
  .tf-tr2{gap:6px}
  .tf-joy{width:96px;height:96px}
  .tf-thumb{width:44px;height:44px}
  .tf-hint{bottom:calc(172px + ${SAFE_B});max-width:calc(100vw - 480px);padding:6px 14px}
  #tf-start.on{align-items:flex-start;padding:calc(10px + ${SAFE_T}) calc(10px + ${SAFE_R}) 10px calc(10px + ${SAFE_L})}
  .tf-scr{width:min(360px,70vw);padding:12px}
  .tf-scr h1{font-size:30px}
  .tf-scr .tf-tag{margin:5px 0 6px;font-size:12px}
  .tf-scr p{font-size:14px;margin-bottom:8px}
  .tf-scr-badge{margin-bottom:8px}
  .tf-scr-badge span{font-size:13px;padding:3px 8px}
  .tf-scr-list{gap:6px}
  .tf-scr-list button{min-height:48px;font-size:16px;padding:5px 12px}
  .tf-scr-note{margin-top:8px;font-size:13px}
  .tf-mcard{padding:12px 16px}
  .tf-mcard h2{font-size:20px}
  .tf-mcard p{font-size:14px;margin-bottom:8px}
  .tf-krow{font-size:14px;padding:5px 0}
  .tf-mrow button{min-height:48px;font-size:14px}
}

/* ---- tall portrait phone (440x956, 360x800): usable, never a rotate overlay ---- */
@media (max-width:620px) and (orientation:portrait){
  .tf-tl{top:calc(10px + ${SAFE_T});left:calc(12px + ${SAFE_L});gap:8px}
  .tf-map{width:80px;height:80px;padding:4px}
  .tf-timer{padding:5px 10px}
  .tf-tr{top:calc(10px + ${SAFE_T});right:calc(12px + ${SAFE_R});gap:8px}
  .tf-coin{height:48px;padding:0 12px 0 7px}
  .tf-menu{width:48px;height:48px}
  .tf-tools{right:calc(12px + ${SAFE_R});top:calc(74px + ${SAFE_T});left:auto;bottom:auto;transform:none}
  .tf-tool{width:60px;height:52px}
  .tf-lane{top:calc(136px + ${SAFE_T});left:calc(110px + ${SAFE_L});right:calc(12px + ${SAFE_R});width:auto;align-items:flex-end}
  .tf-card{top:calc(220px + ${SAFE_T});left:calc(12px + ${SAFE_L});right:calc(12px + ${SAFE_R});transform:none;width:auto;max-width:none}
  .tf-card.big .tf-story{max-height:60px}
  .tf-drawer{top:calc(360px + ${SAFE_T});right:calc(12px + ${SAFE_R});left:calc(12px + ${SAFE_L});width:auto;grid-template-columns:repeat(3,minmax(0,1fr))}
  .tf-tile{min-height:52px}
  .tf-bl{bottom:calc(16px + ${SAFE_B});left:calc(12px + ${SAFE_L});gap:12px}
  .tf-fbtn{width:96px;height:96px}
  .tf-fbtn b{font-size:34px}
  .tf-pad{width:190px}
  .tf-br{bottom:calc(16px + ${SAFE_B});right:calc(12px + ${SAFE_R});gap:10px}
  .tf-dial{width:88px;height:88px}
  .tf-tr2{gap:10px}
  .tf-brk{width:72px;height:52px}
  .tf-joy{width:112px;height:112px}
  .tf-hint{bottom:calc(276px + ${SAFE_B});left:50%;max-width:calc(100vw - 24px);white-space:normal;text-align:center;padding:8px 14px;font-size:15px}
  #tf-start.on{align-items:flex-start;background:linear-gradient(180deg,rgba(6,10,18,.96) 0%,rgba(6,10,18,.90) 58%,rgba(6,10,18,.22) 100%)}
  .tf-scr{width:100%;padding:18px}
  .tf-scr h1{font-size:36px}
  .tf-scr-list button{min-height:52px;font-size:17px}
  .tf-modal{align-items:flex-start;padding-top:calc(24px + ${SAFE_T})}
}
`;

const ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  list: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v2h6V4M9 11h6M9 15h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  redo: '<path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/>',
  home: '<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
  book: '<path d="M4 5h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5h-3a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h3z"/>',
  play: '<path d="M7 4l12 8-12 8z"/>',
  spkOn: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  spkOff: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/>'
};
const ic = n => `<svg class="tf-ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

const HOLD_CODES = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];
const TAP_CODES = ['KeyF', 'KeyC', 'KeyE'];

export default class GameUI {
  constructor(opts) {
    this.opts = opts || {};
    this._down = new Map();          // pointerId -> code
    this._heldByCode = new Map();    // code -> Set(pointerId)
    this._toasts = [];
    this._seg = -1; this._sp = -1;
    this._touch = false;
    this._forcedTouch = /[?&]touch(?:[=&]|$)/.test(location.search);
    this._confirmCb = null;
    this._screen = 'menu';
    this._joyPid = null;
    this._detectTouch();

    const old = document.getElementById('tf-hud');
    if (old) old.remove();
    const oldShell = document.getElementById('tf-shell');
    if (oldShell) oldShell.remove();
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
        <button class="tf-b tf-menu" id="tf-menu" aria-label="Open game menu" title="Game menu">${ic('menu')}<i class="tf-dot" id="tf-mdot"></i></button>
      </div>
      <div class="tf-tools" id="tf-tools">
        <button class="tf-b tf-tool" id="tf-cam2" aria-label="Camera mode" title="Camera mode (C)">CAM<small id="tf-cam-mode">CHASE</small></button>
        <button class="tf-b tf-tool" id="tf-sound" aria-label="Sound on or off" title="Sound on / off (M)">SOUND<small id="tf-sound-state">ON</small></button>
        <button class="tf-b tf-tool big" id="tf-zout" aria-label="Zoom out" title="Zoom out (move camera further back)">−<small>OUT</small></button>
        <button class="tf-b tf-tool big" id="tf-zin" aria-label="Zoom in" title="Zoom in (move camera closer)">+<small>IN</small></button>
      </div>
      <div class="tf-lane" id="tf-lane"></div>
      <div class="tf-p tf-drawer" id="tf-drawer">
        <button class="tf-b tf-tile" data-act="resume" aria-label="Resume job">${ic('play')}Resume<i class="tf-dot" id="tf-cdot"></i></button>
        <button class="tf-b tf-tile" data-act="contracts" aria-label="Contracts board">${ic('list')}Contracts</button>
        <button class="tf-b tf-tile" data-act="garage" aria-label="Garage and upgrades">${ic('gear')}Garage</button>
        <button class="tf-b tf-tile" data-act="settings" aria-label="Settings">${ic('gear')}Settings</button>
        <button class="tf-b tf-tile" data-act="controls" aria-label="Controls and how to play">${ic('book')}Controls</button>
        <button class="tf-b tf-tile danger" data-act="restart" aria-label="Restart job">${ic('redo')}Restart</button>
        <button class="tf-b tf-tile danger" data-act="mainmenu" aria-label="Return to main menu">${ic('home')}Main Menu</button>
      </div>
      <div class="tf-bl">
        <button class="tf-b tf-fbtn tf-t-only" id="tf-f" aria-label="Scoop or dump (F)" title="Scoop / dump (F)"><b>F</b><span id="tf-f-tx">SCOOP</span></button>
        <div class="tf-p tf-pad tf-d-only" id="tf-pad">
          <div class="tf-help">Click or hold — or use your keyboard.</div>
          <div class="tf-dpad">
            <span></span><button class="tf-b tf-key" data-code="KeyW" aria-label="Drive forward (W)" title="Drive forward (W)">W<small>DRIVE</small></button><span></span>
            <button class="tf-b tf-key" data-code="KeyA" aria-label="Steer left (A)" title="Steer left (A)">A</button>
            <button class="tf-b tf-key" data-code="KeyS" aria-label="Reverse (S)" title="Reverse (S)">S</button>
            <button class="tf-b tf-key" data-code="KeyD" aria-label="Steer right (D)" title="Steer right (D)">D</button>
          </div>
          <div class="tf-dpad" style="grid-template-columns:repeat(3,1fr)">
            <button class="tf-b tf-key" data-code="KeyF" aria-label="Scoop or dump (F)" title="Scoop / dump (F)">F<small>ACTION</small></button>
            <button class="tf-b tf-key" data-code="KeyC" aria-label="Camera mode (C)" title="Camera mode (C)">C<small>CAMERA</small></button>
            <button class="tf-b tf-key" data-code="Space" aria-label="Brake (Space)" title="Brake (Space)">␣<small>BRAKE</small></button>
          </div>
        </div>
      </div>
      <div class="tf-p tf-hint" id="tf-hint"><em id="tf-hk">F</em><span id="tf-ht"></span></div>
      <div class="tf-br">
        <div class="tf-p tf-dial">
          <svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(135 50 50)">
            <circle class="trk" cx="50" cy="50" r="42" stroke-dasharray="197.9 263.9"/>
            <circle id="tf-arc" cx="50" cy="50" r="42" stroke="#34d399" stroke-dasharray="0 263.9" stroke-opacity="0"/>
          </g></svg>
          <div class="tf-well"><div id="tf-spd">0</div><span>km/h</span></div>
        </div>
        <div class="tf-tr2">
          <button class="tf-brk" id="tf-brk" aria-label="Brake (Space)" title="Brake (Space)">BRK</button>
          <div class="tf-joy" id="tf-joy" aria-label="Steering pad"><div class="tf-p tf-thumb" id="tf-thumb"></div><span>DRIVE</span></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    const $ = id => root.querySelector('#' + id);
    this.el = {
      timer: $('tf-timer'), time: $('tf-time'), card: $('tf-card'), title: $('tf-title'),
      count: $('tf-count'), goal: $('tf-goal'), segs: $('tf-segs'), story: $('tf-story'),
      coins: $('tf-coins'), lane: $('tf-lane'), drawer: $('tf-drawer'), menu: $('tf-menu'),
      mdot: $('tf-mdot'), cdot: $('tf-cdot'), hint: $('tf-hint'), hk: $('tf-hk'), ht: $('tf-ht'),
      spd: $('tf-spd'), arc: $('tf-arc'), ftx: $('tf-f-tx'), map: $('tf-map'),
      camMode: $('tf-cam-mode'), soundState: $('tf-sound-state'),
      zin: $('tf-zin'), zout: $('tf-zout'), tools: $('tf-tools'),
      soundBtn: $('tf-sound'), camBtn: $('tf-cam2'), fBtn: $('tf-f'),
      brk: $('tf-brk'), joy: $('tf-joy'), thumb: $('tf-thumb')
    };

    const mc = document.getElementById('minimap-canvas');
    if (mc) this.el.map.appendChild(mc);

    // ---------------------------------------------------------------- start screen + windows
    const shell = document.createElement('div');
    shell.id = 'tf-shell';
    shell.innerHTML = `
      <div id="tf-start" role="dialog" aria-label="TerraForm 3D main menu">
        <div class="tf-scr">
          <h1>TERRAFORM 3D</h1>
          <span class="tf-tag">BACKHOE WORK YARD</span>
          <div class="tf-scr-badge" id="tf-start-badge"></div>
          <p id="tf-start-sub">Operate the backhoe, move the earth, beat the clock.</p>
          <div class="tf-scr-list">
            <button id="tf-play" class="primary" aria-label="Play or continue">Play</button>
            <button id="tf-contracts" aria-label="Open contracts board">Contracts</button>
            <button id="tf-garage" aria-label="Open garage and upgrades">Garage / Upgrades</button>
            <button id="tf-settings" aria-label="Open settings">Settings</button>
            <button id="tf-controls" aria-label="Controls and how to play">Controls / How to Play</button>
          </div>
          <div class="tf-scr-note">No job timer runs until you choose a job. Keyboard and touch both work.</div>
        </div>
      </div>
      <div class="tf-modal" id="tf-modal" role="dialog" aria-modal="true"><div class="tf-mcard" id="tf-mcard"></div></div>`;
    document.body.appendChild(shell);
    this.shell = shell;
    this.start = shell.querySelector('#tf-start');
    this.modal = shell.querySelector('#tf-modal');
    this.mcard = shell.querySelector('#tf-mcard');

    this._scale();
    window.addEventListener('resize', () => { this._scale(); this._detectTouch(); });
    this.modal.addEventListener('click', (e) => this._onModalClick(e));
    this._bind();
    this.setScreen('menu');
  }

  _scale() {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.max(1, Math.min(1.4, Math.min(w / 844, h / 390)));
    this.root.style.setProperty('--u', s + 'px');
  }

  _detectTouch() {
    let coarse = false, anyCoarse = false;
    try { coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (e) {}
    try { anyCoarse = !!(window.matchMedia && matchMedia('(any-pointer: coarse)').matches); } catch (e) {}
    const points = (navigator.maxTouchPoints || 0) > 0;
    if (this._forcedTouch || coarse || (anyCoarse && points)) this._enableTouch();
    else if (!this._touch && this.root) this.root.classList.remove('tf-touch');
  }
  _enableTouch() {
    this._touch = true;
    if (this.root) this.root.classList.add('tf-touch');
  }

  // ---- one real input API for every button --------------------------------
  _api() { return this.opts; }
  _unlock() { try { if (this._api().unlock) this._api().unlock(); } catch (e) {} }
  _act(name, payload) { try { if (this._api().action) this._api().action(name, payload); } catch (e) {} }
  _tap(code) {
    this._unlock();
    try { if (this._api().tap) this._api().tap(code); } catch (e) {}
  }
  _setHold(code, on, pid) {
    let set = this._heldByCode.get(code);
    if (!set) { set = new Set(); this._heldByCode.set(code, set); }
    if (on) {
      const was = set.size > 0;
      set.add(pid);
      if (!was) { try { if (this._api().hold) this._api().hold(code, true); } catch (e) {} }
    } else {
      set.delete(pid);
      if (set.size === 0) { try { if (this._api().hold) this._api().hold(code, false); } catch (e) {} }
    }
    const node = this.root.querySelector('[data-code="' + code + '"]');
    if (node) node.classList.toggle('held', set.size > 0);
    if (code === 'Space' && this.el.brk) this.el.brk.classList.toggle('held', set.size > 0);
  }
  releaseAll() {
    for (const [code, set] of this._heldByCode) {
      for (const pid of Array.from(set)) this._setHold(code, false, pid);
    }
    this._down.clear();
    this.root.querySelectorAll('.held').forEach(n => n.classList.remove('held'));
    if (this.el.thumb) this.el.thumb.style.transform = '';
    this._joyPid = null;
    document.documentElement.classList.remove('tf-holding');
  }

  // Generic pointer binding. Every hold is tied to its own pointerId, so two
  // fingers (W + D, or W + F + Brake) work at the same time.
  _bindHold(node, code) {
    const down = (e) => {
      e.preventDefault();
      this._unlock();
      if (e.pointerType === 'touch') this._enableTouch();
      if (this._down.has(e.pointerId)) return;
      this._down.set(e.pointerId, code);
      try { node.setPointerCapture(e.pointerId); } catch (x) {}
      this._setHold(code, true, e.pointerId);
      document.documentElement.classList.add('tf-holding');
    };
    const up = (e) => {
      if (this._down.get(e.pointerId) !== code) return;
      e.preventDefault();
      this._down.delete(e.pointerId);
      try { if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId); } catch (x) {}
      this._setHold(code, false, e.pointerId);
      if (this._down.size === 0) document.documentElement.classList.remove('tf-holding');
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('lostpointercapture', up);
  }
  _bindTap(node, code) {
    node.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (e.pointerType === 'touch') this._enableTouch();
      this._tap(code);
      node.classList.add('held');
      setTimeout(() => node.classList.remove('held'), 130);
    });
  }

  _bind() {
    const el = this.el;
    // Main menu buttons (real clicks, keyboard focusable)
    const menuClick = (id, name) => {
      const b = this.start.querySelector('#' + id);
      if (b) b.addEventListener('click', () => { this._unlock(); b.blur(); this._act(name); });
    };
    menuClick('tf-play', 'play');
    menuClick('tf-contracts', 'contracts');
    menuClick('tf-garage', 'garage');
    menuClick('tf-settings', 'settings');
    menuClick('tf-controls', 'controls');

    // Hamburger menu
    el.menu.addEventListener('click', () => { this._unlock(); el.menu.blur(); this.toggleMenu(); });
    el.drawer.querySelectorAll('.tf-tile').forEach(b => b.addEventListener('click', () => {
      this._unlock(); b.blur(); this.closeMenu(); this._act(b.dataset.act);
    }));
    document.addEventListener('pointerdown', (e) => {
      if (e && e.pointerType === 'touch') this._enableTouch();
      if (!el.drawer.classList.contains('open')) return;
      if (el.drawer.contains(e.target) || el.menu.contains(e.target)) return;
      this.closeMenu();
    }, true);

    // Persistent tools
    el.camBtn.addEventListener('click', () => { this._unlock(); el.camBtn.blur(); this._act('camera'); });
    el.soundBtn.addEventListener('click', () => { this._unlock(); el.soundBtn.blur(); this._act('sound'); });
    el.zin.addEventListener('click', () => { this._unlock(); el.zin.blur(); this._act('zoomIn'); });
    el.zout.addEventListener('click', () => { this._unlock(); el.zout.blur(); this._act('zoomOut'); });

    // PC clickable / holdable controls
    this.root.querySelectorAll('.tf-pad [data-code]').forEach(b => {
      const code = b.dataset.code;
      if (HOLD_CODES.indexOf(code) >= 0) this._bindHold(b, code);
      else this._bindTap(b, code);
    });

    // Touch controls
    this._bindTap(el.fBtn, 'KeyF');
    this._bindHold(el.brk, 'Space');
    const joy = el.joy, thumb = el.thumb;
    const move = (e) => {
      const r = joy.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const R = r.width * 0.3, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      thumb.style.transform = `translate(${dx}px,${dy}px)`;
      const nx = dx / R, ny = dy / R;
      this._joyDir(ny < -0.35, ny > 0.35, nx < -0.35, nx > 0.35);
    };
    joy.addEventListener('pointerdown', (e) => {
      if (this._joyPid !== null) return;
      e.preventDefault(); this._unlock();
      if (e.pointerType === 'touch') this._enableTouch();
      this._joyPid = e.pointerId;
      try { joy.setPointerCapture(e.pointerId); } catch (x) {}
      document.documentElement.classList.add('tf-holding');
      move(e);
    });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === this._joyPid) { e.preventDefault(); move(e); } });
    const joyEnd = (e) => {
      if (e.pointerId !== this._joyPid) return;
      const pid = this._joyPid;          // keep the SAME id used while dragging
      this._joyPid = null;
      thumb.style.transform = '';
      this._joyDir(false, false, false, false, pid);
      if (this._down.size === 0) document.documentElement.classList.remove('tf-holding');
    };
    joy.addEventListener('pointerup', joyEnd);
    joy.addEventListener('pointercancel', joyEnd);
    joy.addEventListener('lostpointercapture', joyEnd);

    // Release everything when the tab/window goes away (no stuck driving).
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseAll(); });
    document.documentElement.addEventListener('pointerup', () => {
      if (this._down.size === 0 && this._joyPid === null) document.documentElement.classList.remove('tf-holding');
    });

    // Old pause-overlay buttons are real actions too (no fake key events).
    document.querySelectorAll('#pause-overlay [data-act]').forEach(b => b.addEventListener('click', () => {
      this._unlock(); b.blur();
      const a = b.dataset.act;
      if (a === 'restart') this._act('restart');
      else if (a === 'contracts') this._act('contracts');
      else if (a === 'garage') this._act('garage');
      else this._act('resume');
    }));

    window.addEventListener('bh-mute', (e) => this.setMuted(!!e.detail));
    window.addEventListener('tf-tutorial', (e) => {
      const d = e.detail || {};
      if (!d.text) return;
      this.setHint(d.text);
      this.toast('Step ' + d.step + '/' + d.total + ' - ' + d.text, 'info');
    });
  }

  _joyDir(w, s, a, d, pidOverride) {
    const pid = (pidOverride !== undefined) ? pidOverride
      : (this._joyPid === null ? 'joy' : this._joyPid);
    const toggle = (code, on) => {
      let set = this._heldByCode.get(code);
      if (!set) { set = new Set(); this._heldByCode.set(code, set); }
      const was = set.size > 0;
      if (on) set.add(pid); else set.delete(pid);
      if (was !== (set.size > 0)) { try { if (this._api().hold) this._api().hold(code, set.size > 0); } catch (e) {} }
    };
    toggle('KeyW', w); toggle('KeyS', s); toggle('KeyA', a); toggle('KeyD', d);
  }

  // ---- screens and windows ------------------------------------------------
  setScreen(name) {
    this._screen = name;
    const menu = name === 'menu';
    this.start.classList.toggle('on', menu);
    document.body.classList.toggle('tf-menu', menu);
    document.documentElement.classList.toggle('tf-playing', !menu);
    if (menu) {
      this.closeMenu();
      this.hideModal();
      const b = this.start.querySelector('#tf-play');
      if (b) { try { b.focus({ preventScroll: true }); } catch (e) {} }
    } else {
      this.releaseAll();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
    this.refresh();
  }
  isMenuScreen() { return this._screen === 'menu'; }

  setStartInfo(info) {
    const d = info || {};
    const badge = this.start.querySelector('#tf-start-badge');
    if (badge) {
      badge.innerHTML = '';
      const bits = [
        'LEVEL ' + (d.level || 1) + ' / 15',
        (d.chapter || 'ROOKIE YARD'),
        (d.coins || 0) + ' COINS',
        (d.rank || 'ROOKIE')
      ];
      for (const t of bits) { const s = document.createElement('span'); s.textContent = t; badge.appendChild(s); }
    }
    const play = this.start.querySelector('#tf-play');
    if (play) play.textContent = d.hasProgress ? ('Continue · Level ' + (d.level || 1)) : 'Start First Job';
    const sub = this.start.querySelector('#tf-start-sub');
    if (sub) sub.textContent = d.hasProgress
      ? ('Welcome back. Next job: ' + (d.jobName || 'First Scoop') + '. Pick a job or continue.')
      : 'Operate the backhoe, move the earth, beat the clock.';
  }

  toggleMenu() { this.el.drawer.classList.contains('open') ? this.closeMenu() : this.openMenu(); }
  openMenu() {
    this.el.drawer.classList.add('open');
    this.root.classList.add('tf-menu-open');
    this.releaseAll();
    this._act('menu-open');
  }
  closeMenu() {
    if (!this.el.drawer.classList.contains('open')) return;
    this.el.drawer.classList.remove('open');
    this.root.classList.remove('tf-menu-open');
    this._act('menu-close');
  }
  isMenuOpen() { return this.el.drawer.classList.contains('open'); }

  showModal(kind, data) {
    const d = data || {};
    const state = (() => { try { return this._api().state ? this._api().state() : {}; } catch (e) { return {}; } })();
    if (kind === 'controls') {
      const rows = [
        ['W / A / S / D', 'Drive and steer (or hold the on-screen buttons)'],
        ['F', 'Scoop dirt or dump in the truck'],
        ['E', 'Raise / lower the arm'],
        ['C', 'Change camera: Chase → Orbit → Cab → Bucket'],
        ['Space', 'Brake while held'],
        ['M', 'Sound on / off'],
        ['J / U', 'Contracts / Garage'],
        ['P', 'Pause menu'],
        ['Zoom + / −', 'Move the camera closer or further back'],
        ['Touch', 'Steering pad, F, BRK, Camera, Sound, Zoom; use two fingers at once']
      ];
      this.mcard.innerHTML = '<h2>Controls / How to Play</h2><p>Click or hold the on-screen buttons, or use your keyboard. On a phone, use the steering pad and the action buttons. The timer only runs while you are playing.</p>' +
        rows.map(r => '<div class="tf-krow"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>').join('') +
        '<div class="tf-mrow"><button class="primary" data-m="close">Close</button></div>';
    } else if (kind === 'settings') {
      const q = state.quality || 'high';
      const qbtn = k => `<button data-q="${k}" class="${k === q ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`;
      this.mcard.innerHTML = '<h2>Settings</h2><p>These settings are saved on this device. The same sound and camera state is used in the game and in the menus.</p>' +
        '<div class="tf-krow"><b>Sound</b><span>' + (state.muted ? 'Muted' : 'On') + '</span></div>' +
        '<div class="tf-mrow"><button data-m="sound">' + (state.muted ? 'Turn sound on' : 'Mute sound') + '</button></div>' +
        '<div class="tf-krow"><b>Camera</b><span>' + (state.cameraLabel || 'Chase') + '</span></div>' +
        '<div class="tf-mrow"><button data-m="camera">Change camera mode</button></div>' +
        '<div class="tf-krow"><b>Quality</b><span>Lower quality helps slow phones</span></div>' +
        '<div class="tf-mrow">' + qbtn('low') + qbtn('medium') + qbtn('high') + '</div>' +
        '<div class="tf-scr-note">Zoom is not available in Cab view; the two Zoom buttons then show a disabled state.</div>' +
        '<div class="tf-mrow"><button class="primary" data-m="close">Close</button></div>';
    } else if (kind === 'confirm') {
      const yes = d.yes || 'Yes, continue';
      this.mcard.innerHTML = '<h2></h2><p></p><div class="tf-mrow"><button class="danger" data-m="yes"></button><button class="primary" data-m="no">Cancel</button></div>';
      this.mcard.querySelector('h2').textContent = d.title || 'Are you sure?';
      this.mcard.querySelector('p').textContent = d.text || '';
      this.mcard.querySelector('[data-m="yes"]').textContent = yes;
      this._confirmCb = d.onYes || null;
    }
    this.modal.classList.add('on');
    this.releaseAll();
  }
  hideModal() {
    this.modal.classList.remove('on');
    this._confirmCb = null;
  }
  confirm(cfg) { this.showModal('confirm', cfg); }

  // Delegated clicks inside the modal (content is rebuilt each time).
  _onModalClick(e) {
    const b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    this._unlock(); b.blur();
    if (b.dataset.q) { this._act('quality', b.dataset.q); this.showModal('settings'); return; }
    const a = b.dataset.m;
    if (a === 'sound') { this._act('sound'); this.showModal('settings'); return; }
    if (a === 'camera') { this._act('camera'); this.showModal('settings'); return; }
    if (a === 'yes') {
      const cb = this._confirmCb;
      this.hideModal();
      if (cb) cb();
      return;
    }
    this.hideModal();
    if (this.isMenuScreen()) this._act('modal-closed-menu');
    else this._act('modal-closed-play');
  }

  refresh() {
    let st = {};
    try { st = this._api().state ? this._api().state() : {}; } catch (e) {}
    if (this.el.camMode) this.el.camMode.textContent = String(st.cameraLabel || 'Chase').toUpperCase();
    this.setMuted(!!st.muted);
    const can = st.zoomable !== false;
    if (this.el.zin) {
      this.el.zin.disabled = !can; this.el.zout.disabled = !can;
      this.el.zin.title = can ? 'Zoom in (move camera closer)' : 'Zoom is not available in Cab view';
      this.el.zout.title = can ? 'Zoom out (move camera further back)' : 'Zoom is not available in Cab view';
    }
    this.setCoins(st.coins === undefined ? 0 : st.coins);
    this.setStartInfo(st);
  }
  setMuted(m) {
    if (!this.el.soundState) return;
    this.el.soundState.textContent = m ? 'MUTED' : 'ON';
    this.el.soundBtn.classList.toggle('warn', !!m);
    this.el.soundBtn.title = m ? 'Sound is muted — click to turn on (M)' : 'Sound on — click to mute (M)';
    this.el.soundBtn.setAttribute('aria-label', m ? 'Sound muted, click to turn on' : 'Sound on, click to mute');
  }

  // ---- public HUD API ------------------------------------------------------
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
    if (this._seg !== m) { el.segs.innerHTML = new Array(m).fill('<i></i>').join(''); this._seg = m; }
    const items = el.segs.children;
    for (let i = 0; i < items.length; i++) items[i].classList.toggle('on', i < n);
  }
  announce(job) {
    const el = this.el;
    if (!job) return;
    el.story.innerHTML = '<b></b><span></span>';
    el.story.querySelector('b').textContent = 'LEVEL ' + job.id + (job.chapter ? ' / ' + ['', 'ROOKIE YARD', 'CONTRACTOR', 'SITE BOSS'][job.chapter] : '');
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
  setMenuDot(on) { this.el.mdot.classList.toggle('on', !!on); this.el.cdot.classList.toggle('on', !!on); }
  toast(msg, type) {
    const el = this.el;
    const d = document.createElement('div');
    d.className = 'tf-p tf-t ' + (type || 'info');
    d.innerHTML = '<i></i><span></span>';
    d.querySelector('span').textContent = msg;
    el.lane.appendChild(d);
    this._toasts.push(d);
    while (this._toasts.length > 2) { const o = this._toasts.shift(); o.remove(); }
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
    this.closeMenu();
    this.releaseAll();
  }
}
