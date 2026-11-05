// TerraForm 3D - Menus v7.
// ONE window layer for start, pause, settings, help, levels, garage, result,
// fail, big map and confirm. Small, clean, little text. All art is code-made
// inline SVG / canvas. No outside images, fonts or scripts.
// Every window has a 44x44 round red X and closes on backdrop tap.

const ICON = {
  play: '<path d="M8 5l11 7-11 7z"/>',
  levels: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
  garage: '<path d="M3 20V9l9-6 9 6v11z"/><path d="M8 20v-6h8v6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a3 3 0 015.6 1.4c0 2-3 2.2-3 4.3"/><path d="M12 18h.01"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  restart: '<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 3v5h-5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8.5a5.5 5.5 0 010 7"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M18 9l5 6M23 9l-5 6"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9.5c0-1.4 1.3-2 3-2s3 .6 3 2-1.3 1.8-3 2-3 .8-3 2 1.3 2 3 2 3-.6 3-2"/>',
  star: '<path d="M12 2.6l2.9 6 6.6 1-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-1z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path d="M9 3v16M15 5v16"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  brake: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  dig: '<path d="M4 18l7-7M11 11l3-6 6 3-3 6z"/><path d="M3 20h18"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  truck: '<path d="M2 7h12v9H2z"/><path d="M14 10h4l4 3v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/>'
};
const svg = (n, cls) => `<svg class="tf-ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;
const tile = (a, n, label, extra) => `<button class="tf-tile tf-btn ${extra || ''}" data-a="${a}" aria-label="${label}">${svg(n)}<span>${label}</span></button>`;

// A code-made backhoe silhouette for the start screen. No external artwork.
const MACHINE_SVG = `<svg viewBox="0 0 460 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
<g fill="none" stroke="#0a0f18" stroke-width="4" stroke-linejoin="round">
<rect x="150" y="70" width="150" height="80" rx="14" fill="url(#mg)"/>
<rect x="172" y="82" width="52" height="46" rx="7" fill="#1e3a5f"/>
<rect x="240" y="96" width="46" height="30" rx="5" fill="#1e3a5f"/>
<rect x="130" y="140" width="190" height="26" rx="9" fill="url(#mg)"/>
<circle cx="176" cy="176" r="32" fill="#1c2530"/><circle cx="176" cy="176" r="13" fill="#8a93a1"/>
<circle cx="292" cy="176" r="32" fill="#1c2530"/><circle cx="292" cy="176" r="13" fill="#8a93a1"/>
<path d="M300 108 L390 62 L416 78 L336 126" fill="url(#mg)"/>
<path d="M390 62 L430 118 L404 140 L378 92" fill="url(#mg)"/>
<path d="M404 140 L440 150 L432 178 L392 166 Z" fill="#c98a00"/>
<path d="M60 190 L400 190" stroke="#fbbf24" stroke-width="6" stroke-dasharray="18 12"/>
</g></svg>`;

const HELP_PAGES = [
  { icon: 'wheel', line: 'Drive with W A S D.', pic: `<svg viewBox="0 0 240 110"><rect x="18" y="18" width="62" height="30" rx="8" fill="#34445f" stroke="#0a0f18" stroke-width="3"/><rect x="88" y="18" width="62" height="30" rx="8" fill="#34445f" stroke="#0a0f18" stroke-width="3"/><rect x="158" y="18" width="62" height="30" rx="8" fill="#34445f" stroke="#0a0f18" stroke-width="3"/><rect x="88" y="54" width="62" height="30" rx="8" fill="#f59e0b" stroke="#0a0f18" stroke-width="3"/><text x="49" y="40" fill="#f1f5f9" font-size="18" text-anchor="middle" font-family="sans-serif">A</text><text x="119" y="40" fill="#f1f5f9" font-size="18" text-anchor="middle" font-family="sans-serif">W</text><text x="189" y="40" fill="#f1f5f9" font-size="18" text-anchor="middle" font-family="sans-serif">D</text><text x="119" y="76" fill="#1a1204" font-size="18" text-anchor="middle" font-family="sans-serif">S</text></svg>` },
  { icon: 'dig', line: 'Press F at the dirt pile.', pic: `<svg viewBox="0 0 240 110"><ellipse cx="120" cy="88" rx="92" ry="18" fill="#7a5233"/><path d="M55 86 Q80 40 120 38 Q160 40 185 86" fill="#8b5a2b" stroke="#0a0f18" stroke-width="3"/><circle cx="120" cy="30" r="16" fill="#fbbf24"/><text x="120" y="36" fill="#1a1204" font-size="17" font-weight="bold" text-anchor="middle" font-family="sans-serif">F</text></svg>` },
  { icon: 'truck', line: 'Press F over the truck.', pic: `<svg viewBox="0 0 240 110"><rect x="24" y="42" width="110" height="46" rx="6" fill="#2f6fdb" stroke="#0a0f18" stroke-width="3"/><rect x="134" y="56" width="60" height="32" rx="5" fill="#1e3a5f" stroke="#0a0f18" stroke-width="3"/><circle cx="58" cy="92" r="13" fill="#1c2530"/><circle cx="168" cy="92" r="13" fill="#1c2530"/><circle cx="120" cy="26" r="16" fill="#fbbf24"/><text x="120" y="32" fill="#1a1204" font-size="17" font-weight="bold" text-anchor="middle" font-family="sans-serif">F</text></svg>` },
  { icon: 'star', line: 'Finish fast for 3 stars.', pic: `<svg viewBox="0 0 240 110"><g fill="#fbbf24" stroke="#0a0f18" stroke-width="3"><path d="M55 22l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"/><path d="M120 14l8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3z"/><path d="M185 22l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"/></g></svg>` }
];

const CSS = `
/* Every colour comes from the ONE token block in index.html. */
#tf-start,#tf-win{font-family:var(--font);color:var(--ink);font-weight:700;font-size:15px;line-height:1.25}
#tf-start *,#tf-win *{box-sizing:border-box}
#tf-start button,#tf-win button{font-family:var(--font);
  cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;outline:none}
#tf-start button:focus-visible,#tf-win button:focus-visible{outline:3px solid var(--goal);outline-offset:2px}
#tf-start button:active,#tf-win button:active{transform:translateY(2px);box-shadow:none}
.tf-ic{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
.tf-panel{background:var(--panel);border:2px solid var(--border);border-radius:var(--radius);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),var(--shadow),0 18px 44px rgba(0,0,0,.6)}
.tf-well{background:var(--well);border-radius:10px}
/* Secondary button - the DEFAULT for every tile that has no other look. */
.tf-btn{font:900 15px/1 var(--font);letter-spacing:.04em;text-transform:uppercase;color:var(--ink);
  background:var(--steel);border:2px solid var(--border);border-radius:12px;
  box-shadow:0 3px 0 var(--border),inset 0 1px 0 rgba(255,255,255,.2)}
.tf-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--border)}
.tf-amber{background:var(--amber);color:#1a1204;border:2px solid var(--border);box-shadow:0 4px 0 var(--amber-dark);font-weight:900;letter-spacing:.04em}
.tf-green{background:var(--green);color:#052e21;border:2px solid var(--border);box-shadow:0 4px 0 #065f46;font-weight:900}
.tf-red{background:var(--red);color:#fff;border:2px solid var(--border);box-shadow:0 4px 0 #7f1d1d;font-weight:900}
.tf-sec{background:var(--steel);border:2px solid var(--border);box-shadow:0 4px 0 var(--border);color:var(--ink);font-weight:800}
.tf-h2{font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:var(--goal);font-size:22px;margin:0 0 10px}
.tf-mut{color:var(--muted);font-size:14px}

/* ---------------------------------------------------------------- start (A2) */
/* Semi-transparent: the REAL 3D backhoe + yard render behind the card. */
#tf-start{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(8,14,24,.42),rgba(8,14,24,.72));overflow:hidden}
#tf-start.off{display:none}
.tf-start-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 78%,rgba(251,191,36,.12),transparent 55%);pointer-events:none}
.tf-machine{display:none}   /* replaced by the live 3D turntable */
.tf-start-box{position:relative;z-index:2;width:min(440px,90vw);max-width:440px;display:flex;flex-direction:column;
  align-items:center;gap:12px;padding:22px 20px 18px;border-radius:18px;text-align:center;
  background:linear-gradient(180deg,rgba(52,68,95,.95),rgba(21,29,43,.95));
  border:2px solid var(--border);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),var(--shadow),0 18px 44px rgba(0,0,0,.6);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.tf-start-box h1{font-size:clamp(26px,7vw,50px);font-weight:900;letter-spacing:.02em;line-height:1.05;
  white-space:nowrap;margin:0;color:var(--goal);text-shadow:0 3px 0 var(--border),0 6px 0 var(--amber-dark)}
.tf-start-tag{font-size:14px;font-weight:800;letter-spacing:.28em;color:var(--muted);margin-top:-6px}
.tf-play{width:100%;height:64px;font-size:24px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:10px}
.tf-start-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}
.tf-start-row button{height:88px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;font-size:14px;font-weight:900;letter-spacing:.04em;color:var(--ink)}
.tf-start-row button .tf-ic{width:28px;height:28px;color:var(--goal)}
.tf-free{width:100%;height:48px;border-radius:12px;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px}
.tf-start-foot{position:absolute;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:0;right:0;display:flex;
  justify-content:center;gap:8px;flex-wrap:wrap;font-size:14px;font-weight:800;z-index:2}
.tf-start-foot span{background:var(--well);border:2px solid var(--border);border-radius:999px;padding:6px 12px;color:var(--muted)}
.tf-start-foot b{color:var(--goal)}
.tf-start-sound{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));right:calc(14px + env(safe-area-inset-right,0px));
  width:48px;height:48px;border-radius:50%;z-index:3;display:flex;align-items:center;justify-content:center}
@media (max-width:480px){
  .tf-start-row{grid-template-columns:repeat(2,1fr)}
  .tf-start-row button{height:76px}
  .tf-start-box{gap:10px;padding:18px 16px 16px}
}
@media (max-height:470px){
  .tf-start-box{gap:6px;padding:10px 16px}.tf-start-box h1{font-size:26px}
  .tf-play{height:52px;font-size:20px}.tf-start-row button{height:56px;font-size:14px}
  .tf-free{height:42px}
}

/* ---------------------------------------------------------------- windows */
#tf-win{position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;
  padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(12px + env(safe-area-inset-bottom,0px))}
#tf-win.off{display:none}
.tf-scrim{position:absolute;inset:0;background:rgba(6,10,16,.66);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
.tf-winbox{position:relative;z-index:2;width:min(520px,94vw);
  max-height:calc(100vh - 24px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));
  display:flex;flex-direction:column;padding:18px 16px 16px;overflow:hidden}
.tf-x{position:absolute;top:8px;right:8px;width:44px;height:44px;border-radius:50%;display:flex;color:#fff;
  align-items:center;justify-content:center;z-index:3}
.tf-x .tf-ic{width:22px;height:22px}
.tf-winbody{overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.tf-winbody::-webkit-scrollbar{width:8px}.tf-winbody::-webkit-scrollbar-thumb{background:#3a4c68;border-radius:8px}
.tf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
/* A1: tiles are ALWAYS dark steel. No browser-default white button can appear. */
.tf-tile{min-height:96px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;font-size:14px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:var(--ink);
  background:var(--steel);border:2px solid var(--border);box-shadow:0 3px 0 var(--border),inset 0 1px 0 rgba(255,255,255,.2)}
.tf-tile .tf-ic{width:34px;height:34px;color:var(--goal)}
.tf-tile.tf-green{min-height:96px;font-size:16px;color:#052e21;background:var(--green);border-color:var(--border);box-shadow:0 4px 0 #065f46}
.tf-tile.tf-green .tf-ic{color:#052e21}
.tf-title{margin:0 34px 12px 0}

/* settings */
.tf-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:4px 2px;
  border-bottom:1px solid rgba(148,163,184,.18)}
.tf-row label{font-size:15px;font-weight:800;flex:none;min-width:92px}
.tf-row input[type=range]{flex:1;min-width:90px;height:32px;accent-color:var(--goal)}
.tf-row .tf-val{width:38px;text-align:right;font-variant-numeric:tabular-nums;color:var(--goal);font-weight:900;font-size:14px}
.tf-seg{display:flex;gap:4px;flex-wrap:wrap}
.tf-seg button{min-width:56px;height:44px;padding:0 10px;border-radius:9px;font-size:14px;font-weight:900;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}
.tf-seg button.on{background:var(--amber);color:#1a1204}
.tf-tog{width:64px;height:40px;border-radius:999px;position:relative;flex:none;
  background:var(--steel);border:2px solid var(--border)}
.tf-tog i{position:absolute;top:5px;left:5px;width:30px;height:30px;border-radius:50%;background:var(--muted);transition:left .16s,background .16s}
.tf-tog.on i{left:29px;background:var(--green-flat)}

/* help */
.tf-help-pic{height:150px;border-radius:10px;background:var(--well);display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.tf-help-pic svg{width:min(280px,90%);height:auto}
.tf-help-line{text-align:center;font-size:17px;font-weight:800;min-height:28px}
.tf-help-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
.tf-help-nav button{height:48px;min-width:96px;border-radius:10px;font-weight:900;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}
.tf-dots{display:flex;gap:6px}.tf-dots i{width:9px;height:9px;border-radius:50%;background:#3a4c68}.tf-dots i.on{background:var(--goal)}

/* level picker */
.tf-tabs{display:flex;gap:6px;margin-bottom:10px}
.tf-tabs button{flex:1;height:44px;border-radius:9px;font-size:14px;font-weight:900;letter-spacing:.04em;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}
.tf-tabs button.on{background:var(--amber);color:#1a1204}
.tf-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.tf-card{min-height:96px;text-align:left;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:3px;position:relative;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}
.tf-card.sel{outline:3px solid var(--goal)}
.tf-card.lock{opacity:.55}
.tf-card .n{font-size:14px;color:var(--muted);font-weight:900;letter-spacing:.08em}
.tf-card .nm{font-size:15px;font-weight:900;line-height:1.15}
.tf-card .st{font-size:14px;color:var(--goal);letter-spacing:2px}
.tf-card .tag{position:absolute;top:7px;right:8px;font-size:14px;font-weight:900;color:var(--well);background:var(--muted);border-radius:5px;padding:2px 5px}
.tf-card .lk{position:absolute;top:8px;right:8px}.tf-card .lk .tf-ic{width:18px;height:18px}
.tf-pick-foot{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.tf-pick-foot .desc{font-size:14px;color:#cbd5e1;min-height:20px}
.tf-pick-foot button{height:52px;border-radius:11px;font-size:16px}

/* garage */
.tf-up{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.tf-up-card{border-radius:10px;padding:9px;display:flex;flex-direction:column;gap:5px;min-height:118px;
  background:var(--steel);border:2px solid var(--border)}
.tf-up-card .nm{font-size:14px;font-weight:900;display:flex;align-items:center;gap:6px}
.tf-up-card .nm .tf-ic{width:20px;height:20px;color:var(--goal)}
.tf-pips{display:flex;gap:4px}.tf-pips i{width:18px;height:9px;border-radius:3px;background:var(--well);border:1px solid var(--border)}
.tf-pips i.on{background:var(--amber)}
.tf-up-card .ln{font-size:14px;color:var(--muted);min-height:16px}
.tf-up-card button{height:40px;border-radius:8px;font-size:14px;font-weight:900;
  background:var(--green);color:#052e21;border:2px solid var(--border)}
.tf-up-card button.cant{background:#3a4c68;color:var(--ink)}
.tf-up-card button:disabled{opacity:.5;cursor:default}
.tf-max{font-size:14px;font-weight:900;color:var(--success)}
.tf-sw{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;align-items:center}
.tf-sw i{width:34px;height:34px;border-radius:50%;border:3px solid var(--border);cursor:pointer}
.tf-sw i.on{outline:3px solid var(--goal)}

/* result / fail */
.tf-stars{display:flex;justify-content:center;gap:8px;margin:4px 0 10px}
.tf-stars .tf-ic{width:44px;height:44px;color:#3a4c68}
.tf-stars .tf-ic.on{color:var(--goal);fill:var(--goal)}
.tf-bigcoin{text-align:center;font-size:34px;font-weight:900;color:var(--goal);text-shadow:0 3px 0 var(--border)}
.tf-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.tf-acts button{height:54px;border-radius:11px;font-size:15px;font-weight:900;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}
.tf-acts button.tf-amber{background:var(--amber);color:#1a1204}
.tf-reward{width:100%;height:44px;border-radius:10px;margin-top:8px;font-size:14px;font-weight:900;
  background:var(--steel);border:2px solid var(--border);color:var(--ink)}

/* big map - SQUARE canvas fills the width, never half empty */
.tf-winbox.mapwin{width:min(760px,96vw,calc(100vh - 130px));height:auto;max-height:calc(100vh - 24px)}
.tf-mapwrap{position:relative;width:100%;aspect-ratio:1/1;
  border-radius:10px;overflow:hidden;background:var(--well)}
#tf-map-c{width:100%;height:100%;display:block}
.tf-mapkey{position:absolute;left:10px;bottom:10px;display:flex;gap:10px;font-size:14px;font-weight:800;
  background:rgba(11,17,26,.85);padding:6px 10px;border-radius:8px}

/* confirm */
.tf-confirm{text-align:center}
.tf-confirm .tf-h2{margin-bottom:6px}
.tf-confirm p{color:#cbd5e1;font-size:15px;margin:0 0 14px}

@media (max-width:560px){
  .tf-grid{grid-template-columns:repeat(3,1fr);gap:7px}
  .tf-tile{min-height:84px;font-size:14px}.tf-tile .tf-ic{width:28px;height:28px}
  .tf-up{grid-template-columns:1fr 1fr}
  .tf-winbox{padding:14px 12px 12px}
  .tf-h2{font-size:19px}
}
@media (max-height:470px){
  .tf-winbox{padding:10px 12px}.tf-tile{min-height:64px;font-size:14px;flex-direction:row;gap:5px}
  .tf-tile .tf-ic{width:24px;height:24px}.tf-help-pic{height:100px}.tf-h2{font-size:18px;margin-bottom:6px}
}
`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default class Menus {
  constructor(opts) {
    this.opts = opts || {};
    this.kind = null;
    this.data = null;
    this.helpPage = 0;
    this.chapter = 1;
    this.selected = 1;
    this._build();
    this._bind();
  }
  _act(name, payload) { try { if (this.opts.action) this.opts.action(name, payload); } catch (e) { console.warn('[menus]', e); } }
  _state() { try { return this.opts.state ? this.opts.state() : {}; } catch (e) { return {}; } }
  _data() { try { return this.opts.data ? this.opts.data() : this._state(); } catch (e) { return {}; } }
  _unlock() { try { if (this.opts.unlock) this.opts.unlock(); } catch (e) {} }

  _build() {
    const style = document.createElement('style');
    style.id = 'tf-menus-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    this.start = document.createElement('div');
    this.start.id = 'tf-start';
    this.start.innerHTML = `
      <div class="tf-start-glow"></div>
      <button class="tf-start-sound tf-sec" data-a="sound" aria-label="Sound on or off">${svg('sound')}</button>
      <div class="tf-start-box tf-panel">
        <h1>TERRAFORM 3D</h1>
        <div class="tf-start-tag">BACKHOE LOADER</div>
        <button class="tf-play tf-amber" data-a="play">${svg('play')} <span id="tf-play-label">PLAY</span></button>
        <div class="tf-start-row">
          ${tile('levels', 'levels', 'LEVELS')}
          ${tile('garage', 'garage', 'GARAGE')}
          ${tile('settings', 'gear', 'SETTINGS')}
          ${tile('help', 'help', 'HELP')}
        </div>
        <button class="tf-free tf-sec" data-a="freeplay">${svg('spark')} FREE PLAY</button>
      </div>
      <div class="tf-start-foot">
        <span>${svg('coin')} <b id="tf-start-coins">0</b></span>
        <span id="tf-start-level">LEVEL 1 · FIRST SCOOP</span>
        <span id="tf-start-rank">ROOKIE</span>
      </div>`;
    document.body.appendChild(this.start);

    this.win = document.createElement('div');
    this.win.id = 'tf-win';
    this.win.className = 'off';
    this.win.innerHTML = `<div class="tf-scrim" data-a="close"></div>
      <div class="tf-winbox tf-panel" role="dialog" aria-modal="true" aria-label="Game window">
        <button class="tf-x tf-red" data-a="close" aria-label="Close window">${svg('close')}</button>
        <div class="tf-winbody" id="tf-winbody"></div>
      </div>`;
    document.body.appendChild(this.win);
    this.body = this.win.querySelector('#tf-winbody');
    this.box = this.win.querySelector('.tf-winbox');
  }

  _bind() {
    const click = (e) => {
      const b = e.target && e.target.closest ? e.target.closest('[data-a]') : null;
      if (!b) return;
      this._unlock();
      const a = b.dataset.a;
      if (a === 'close' || a === 'backdrop') { this.close(); return; }
      this._local(a, b);
    };
    this.start.addEventListener('click', click);
    this.win.addEventListener('click', click);
    this.win.addEventListener('change', (e) => {
      const t = e.target;
      if (!t || !t.dataset || !t.dataset.set) return;
      const v = t.type === 'range' ? +t.value / 100 : +t.value;
      this._act('setting', { key: t.dataset.set, value: v });
      const out = t.parentElement.querySelector('.tf-val');
      if (out) out.textContent = Math.round(v * 100) + '%';
      this.refresh();
    });
    this.win.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || t.type !== 'range' || !t.dataset.set) return;
      const out = t.parentElement.querySelector('.tf-val');
      if (out) out.textContent = t.value + '%';
    });
  }

  _local(a, b) {
    if (a === 'setting') {
      const key = b.dataset.set;
      if (key) {
        const raw = b.dataset.v;
        const value = (raw !== undefined && raw !== '' && !Number.isNaN(+raw) && /^[0-9.]+$/.test(raw)) ? +raw : raw;
        this._act('setting', { key, value });
        this.refresh();
      }
      return;
    }
    if (a === 'confirm-yes') {
      const cb = this.data && this.data.onYes;
      this.close();
      if (typeof cb === 'function') cb();
      return;
    }
    if (a === 'help-next') { this.helpPage = clamp(this.helpPage + 1, 0, HELP_PAGES.length - 1); this.refresh(); return; }
    if (a === 'help-back') { this.helpPage = clamp(this.helpPage - 1, 0, HELP_PAGES.length - 1); this.refresh(); return; }
    if (a === 'chapter') { this.chapter = +b.dataset.ch; this.refresh(); return; }
    if (a === 'select') {
      this.selected = +b.dataset.id;
      const d = this._data();
      const j = (d.jobs || []).find(x => x.id === this.selected);
      this.chapter = j ? j.chapter : this.chapter;
      this.refresh(); return;
    }
    if (a === 'paint') { this._act('paint', +b.dataset.i); this.refresh(); return; }
    if (a === 'buy') { this._act('buy', b.dataset.k); this.refresh(); return; }
    this._act(a, b.dataset.id ? +b.dataset.id : undefined);
  }

  // ------------------------------------------------------------------ screens
  setScreen(name) {
    this.start.classList.toggle('off', name !== 'menu');
    if (name !== 'menu') this.close();
  }
  setStartInfo(info) {
    const d = this._data();
    const s = this._state();
    const coins = (info && info.coins !== undefined) ? info.coins : (s.coins || 0);
    const lvl = (info && info.level) || s.level || 1;
    const nm = (info && info.jobName) || s.jobName || 'First Scoop';
    const rank = (info && info.rank) || s.rank || 'ROOKIE';
    const set = (id, v) => { const e = this.start.querySelector(id); if (e) e.textContent = v; };
    set('#tf-start-coins', Number(coins).toLocaleString('en-US'));
    set('#tf-start-level', 'LEVEL ' + lvl + ' · ' + String(nm).toUpperCase());
    set('#tf-start-rank', rank);
    set('#tf-play-label', ((info && info.hasProgress) || s.hasProgress) ? 'CONTINUE' : 'PLAY');
    const sb = this.start.querySelector('.tf-start-sound');
    if (sb) sb.innerHTML = svg(s.muted ? 'mute' : 'sound');
  }

  open(kind, data) {
    this.kind = kind;
    this.data = data || {};
    this._act('window-open', kind);
    this.win.classList.remove('off');
    this.box.classList.toggle('mapwin', kind === 'map');
    this.refresh();
    this._focusFirst();
    if (kind === 'result' && this.data.coins) this._countCoins(this.data.coins);
  }
  close() {
    const was = this.kind;
    this.win.classList.add('off');
    this.kind = null;
    this.data = null;
    if (was) this._act('window-close', was);
  }
  _countCoins(target) {
    const el = this.win.querySelector('#tf-coin-count');
    if (!el) return;
    const t0 = performance.now(), dur = 700;
    const tick = () => {
      if (!el.isConnected || this.kind !== 'result') return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      el.textContent = '+' + Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  isOpen() { return !this.win.classList.contains('off'); }
  _focusFirst() {
    const b = this.win.querySelector('.tf-x');
    try { if (b) b.focus({ preventScroll: true }); } catch (e) {}
  }

  refresh() {
    if (!this.isOpen() || !this.kind) return;
    const d = this._data(), s = this._state();
    switch (this.kind) {
      case 'pause': this.body.innerHTML = this._pause(); break;
      case 'settings': this.body.innerHTML = this._settings(d, s); break;
      case 'help': this.body.innerHTML = this._help(); break;
      case 'levels': this.body.innerHTML = this._levels(d); break;
      case 'garage': this.body.innerHTML = this._garage(d); break;
      case 'result': this.body.innerHTML = this._result(this.data); break;
      case 'fail': this.body.innerHTML = this._fail(this.data); break;
      case 'confirm': this.body.innerHTML = this._confirm(this.data); break;
      case 'map': this.body.innerHTML = this._map(); this._drawMap(d); break;
      default: this.body.innerHTML = '';
    }
  }

  // ------------------------------------------------------------------ windows
  _pause() {
    return `<h2 class="tf-h2 tf-title">PAUSED</h2><div class="tf-grid">
      ${tile('resume', 'play', 'RESUME', 'tf-green')}
      ${tile('restart', 'restart', 'RESTART')}
      ${tile('levels', 'levels', 'LEVELS')}
      ${tile('garage', 'garage', 'GARAGE')}
      ${tile('settings', 'gear', 'SETTINGS')}
      ${tile('home', 'home', 'HOME')}
    </div>`;
  }
  _seg(name, list, cur) {
    return `<div class="tf-seg">${list.map(x =>
      `<button class="tf-sec ${x.v === cur ? 'on' : ''}" data-a="setting" data-set="${name}" data-v="${x.v}">${x.t}</button>`).join('')}</div>`;
  }
  _tog(name, on) {
    return `<button class="tf-tog tf-sec ${on ? 'on' : ''}" data-a="setting" data-set="${name}" data-v="${on ? 0 : 1}" aria-label="Toggle"><i></i></button>`;
  }
  _settings(d, s) {
    const v = d.volumes || { master: 1, music: 1, effects: 1 };
    const row = (key, label) => `<div class="tf-row"><label>${label}</label>
      <input type="range" min="0" max="100" value="${Math.round(v[key] * 100)}" data-set="${key}" aria-label="${label}">
      <span class="tf-val">${Math.round(v[key] * 100)}%</span></div>`;
    const q = d.quality || s.quality || 'high';
    return `<h2 class="tf-h2 tf-title">SETTINGS</h2>
      ${row('master', 'MASTER')}${row('music', 'MUSIC')}${row('effects', 'EFFECTS')}
      <div class="tf-row"><label>SOUND</label>${this._tog('mute', !!d.muted)}</div>
      <div class="tf-row"><label>GRAPHICS</label>${this._seg('quality', [
        { v: 'low', t: 'LOW' }, { v: 'medium', t: 'MED' }, { v: 'high', t: 'HIGH' }], q)}</div>
      <div class="tf-row"><label>BIG BUTTONS</label>${this._tog('big', !!d.big)}</div>
      <div class="tf-row"><label>LEFT-HANDED</label>${this._tog('lefty', !!d.lefty)}</div>
      <div class="tf-row"><label>GUIDE ARROWS</label>${this._tog('guide', d.guide !== false)}</div>`;
  }
  _help() {
    const p = HELP_PAGES[this.helpPage];
    return `<h2 class="tf-h2 tf-title">HOW TO PLAY</h2>
      <div class="tf-help-pic">${p.pic}</div>
      <div class="tf-help-line">${p.line}</div>
      <div class="tf-help-nav">
        <button class="tf-sec" data-a="help-back" aria-label="Back">${svg('back')}</button>
        <div class="tf-dots">${HELP_PAGES.map((_, i) => `<i class="${i === this.helpPage ? 'on' : ''}"></i>`).join('')}</div>
        <button class="tf-amber" data-a="help-next" aria-label="Next">${svg('next')}</button>
      </div>`;
  }
  _levels(d) {
    const jobs = d.jobs || [];
    const chapters = d.chapters || [{ id: 1, name: 'ROOKIE' }, { id: 2, name: 'CONTRACTOR' }, { id: 3, name: 'SITE BOSS' }];
    const list = jobs.filter(j => j.chapter === this.chapter);
    if (this.selected < 1) this.selected = 1;
    const sel = jobs.find(j => j.id === this.selected) || jobs[0] || { name: '', rule: '', locked: true };
    const stars = (n) => '★'.repeat(n || 0) + '☆'.repeat(3 - (n || 0));
    return `<h2 class="tf-h2 tf-title">LEVELS</h2>
      <div class="tf-tabs">${chapters.map(c =>
        `<button class="tf-sec ${c.id === this.chapter ? 'on' : ''}" data-a="chapter" data-ch="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="tf-cards">${list.map(j => `<button class="tf-card tf-sec ${j.id === this.selected ? 'sel' : ''} ${j.locked ? 'lock' : ''}"
          data-a="select" data-id="${j.id}" aria-label="Level ${j.id} ${j.name}">
          <span class="n">LEVEL ${j.id}</span><span class="nm">${j.name}</span>
          <span class="st">${stars(j.stars)}</span>
          ${j.locked ? `<span class="lk">${svg('lock')}</span>` : `<span class="tag">${j.type}</span>`}
        </button>`).join('')}</div>
      <div class="tf-pick-foot">
        <div class="desc">${sel.locked ? (sel.reason || 'Locked') : (sel.rule || sel.name)}</div>
        <button class="tf-green" data-a="start" data-id="${sel.id}" ${sel.locked ? 'disabled' : ''}>${svg('play')} START</button>
      </div>`;
  }
  _garage(d) {
    const ups = d.upgrades || [];
    const coins = d.coins || 0;
    const paints = d.paints || ['#f5b700', '#2f6fdb', '#34d399', '#ef4444', '#e5e7eb', '#7c3aed'];
    return `<h2 class="tf-h2 tf-title">GARAGE <span class="tf-mut">${svg('coin')} ${Number(coins).toLocaleString('en-US')}</span></h2>
      <div class="tf-up">${ups.map(u => {
        const pips = Array.from({ length: u.maxPips || 4 }, (_, i) => `<i class="${i < u.level ? 'on' : ''}"></i>`).join('');
        const max = u.level >= (u.maxPips || 4);
        const can = !max && u.price !== null && coins >= u.price;
        return `<div class="tf-up-card tf-well">
          <div class="nm">${svg(u.icon)} ${u.name}</div>
          <div class="tf-pips">${pips}</div>
          <div class="ln">${u.line}</div>
          ${max ? '<div class="tf-max">MAX</div>'
            : `<button class="${can ? 'tf-green' : 'tf-sec'}" data-a="buy" data-k="${u.key}" ${can ? '' : 'disabled'}>${svg('coin')} ${u.price}</button>`}
        </div>`;
      }).join('')}</div>
      <div class="tf-sw"><span class="tf-mut">PAINT</span>${paints.map((c, i) =>
        `<i class="${i === (d.paint || 0) ? 'on' : ''}" style="background:${c}" data-a="paint" data-i="${i}" aria-label="Paint ${i + 1}"></i>`).join('')}</div>`;
  }
  _result(r) {
    return `<div class="tf-confirm"><h2 class="tf-h2">JOB COMPLETE</h2>
      <div class="tf-stars">${[0, 1, 2].map(i => `<svg class="tf-ic ${i < (r.stars || 0) ? 'on' : ''}" viewBox="0 0 24 24">${ICON.star}</svg>`).join('')}</div>
      <div class="tf-bigcoin" id="tf-coin-count">+0</div>
      <div class="tf-mut">${r.bonusGot ? 'BONUS EARNED' : 'COINS'}</div>
      ${r.ads ? '<button class="tf-reward tf-sec" data-a="reward-coins">'+svg('spark')+' DOUBLE COINS (AD)</button>' : ''}
      <div class="tf-acts">
        <button class="tf-sec" data-a="retry">${svg('restart')} RETRY</button>
        <button class="tf-amber" data-a="next">${svg('next')} NEXT</button>
      </div></div>`;
  }
  _fail(r) {
    return `<div class="tf-confirm"><h2 class="tf-h2">TIME IS UP</h2>
      <p>${r.loads || 0} of ${r.total || 0} loads.</p>
      ${r.ads ? '<button class="tf-reward tf-sec" data-a="reward-time">'+svg('clock')+' +60 SECONDS (AD)</button>' : ''}
      <div class="tf-acts">
        <button class="tf-sec" data-a="levels">${svg('levels')} LEVELS</button>
        <button class="tf-amber" data-a="retry">${svg('restart')} RETRY</button>
      </div></div>`;
  }
  _confirm(c) {
    return `<div class="tf-confirm"><h2 class="tf-h2">${c.title || 'Are you sure?'}</h2>
      <p>${c.text || ''}</p>
      <div class="tf-acts">
        <button class="tf-sec" data-a="close">${svg('close')} CANCEL</button>
        <button class="tf-red" data-a="confirm-yes">${svg('play')} ${c.yes || 'YES'}</button>
      </div></div>`;
  }
  _map() {
    const d = this._data() || {}, m = d.map || {};
    return `<h2 class="tf-h2 tf-title">SITE MAP · ${String(m.name || 'SITE').toUpperCase()}</h2>
      <div class="tf-mapwrap"><canvas id="tf-map-c" width="720" height="720"></canvas>
        <div class="tf-mapkey"><span><b>●</b> YOU</span><span style="color:#34d399"><b>●</b> GOAL</span><span><b style="color:#22d3ee">●</b> LANDMARK</span></div>
      </div>`;
  }

  _drawMap(d) {
    const c = this.win.querySelector('#tf-map-c');
    if (!c) return;
    const g = c.getContext('2d');
    const W = c.width, H = c.height;
    const m = d.map || {};
    const pts = m.blocks || [];
    const goals = m.goals || [];
    const p = m.player || { x: 0, z: 0, yaw: 0 };
    let minX = -60, maxX = 60, minZ = -60, maxZ = 60;
    if (m.bounds) { minX = m.bounds.minX; maxX = m.bounds.maxX; minZ = m.bounds.minZ; maxZ = m.bounds.maxZ; }
    const all = [{ x: p.x, z: p.z }, ...goals, ...(m.landmark ? [m.landmark] : [])];
    for (const b of pts) { all.push({ x: b.x - b.w / 2, z: b.z - b.d / 2 }, { x: b.x + b.w / 2, z: b.z + b.d / 2 }); }
    for (const a of all) { if (!Number.isFinite(a.x) || !Number.isFinite(a.z)) continue; minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x); minZ = Math.min(minZ, a.z); maxZ = Math.max(maxZ, a.z); }
    const pad = 24, sx = (W - pad * 2) / Math.max(1, maxX - minX), sz = (H - pad * 2) / Math.max(1, maxZ - minZ);
    const sc = Math.min(sx, sz);
    const X = x => pad + (x - minX) * sc + (W - pad * 2 - (maxX - minX) * sc) / 2;
    const Z = z => pad + (z - minZ) * sc + (H - pad * 2 - (maxZ - minZ) * sc) / 2;
    g.fillStyle = '#0b111a'; g.fillRect(0, 0, W, H);
    // TIER 10: soft ground wash, then water / park / building blocks with round corners.
    const wash = g.createLinearGradient ? g.createLinearGradient(0, 0, W, H) : null;
    if (wash && typeof wash.addColorStop === 'function') {
      wash.addColorStop(0, '#111b26'); wash.addColorStop(1, '#0b111a');
      g.fillStyle = wash; g.fillRect(0, 0, W, H);
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    const rr = (x, y, w, h, r) => { if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    for (const b of pts) {
      const w = Math.max(3, b.w * sc), h = Math.max(3, b.d * sc);
      if (b.water) {
        g.fillStyle = '#164a70'; g.beginPath(); rr(X(b.x) - w / 2, Z(b.z) - h / 2, w, h, 14); g.fill();
        g.strokeStyle = '#22d3ee'; g.lineWidth = 2; g.stroke();
      } else if (b.park) {
        g.fillStyle = '#245b34'; g.beginPath(); rr(X(b.x) - w / 2, Z(b.z) - h / 2, w, h, 12); g.fill();
        g.strokeStyle = '#34d399'; g.lineWidth = 1.5; g.stroke();
      }
    }
    // Rounded roads: dark asphalt under a thin amber centre line.
    g.strokeStyle = '#3a3f47'; g.lineWidth = Math.max(6, 14 * sc);
    for (let i = Math.ceil(minX / 40) * 40; i <= maxX; i += 40) { g.beginPath(); g.moveTo(X(i), Z(minZ)); g.lineTo(X(i), Z(maxZ)); g.stroke(); }
    for (let i = Math.ceil(minZ / 40) * 40; i <= maxZ; i += 40) { g.beginPath(); g.moveTo(X(minX), Z(i)); g.lineTo(X(maxX), Z(i)); g.stroke(); }
    g.strokeStyle = '#fbbf24'; g.lineWidth = 2; g.setLineDash([9, 11]);
    for (let i = Math.ceil(minX / 40) * 40; i <= maxX; i += 40) { g.beginPath(); g.moveTo(X(i), Z(minZ)); g.lineTo(X(i), Z(maxZ)); g.stroke(); }
    g.setLineDash([]);
    for (const b of pts) {
      const w = Math.max(3, b.w * sc), h = Math.max(3, b.d * sc);
      if (b.water || b.park) continue;
      g.fillStyle = '#334155';
      g.beginPath(); rr(X(b.x) - w / 2, Z(b.z) - h / 2, w, h, 5);
      g.fill(); g.strokeStyle = '#0a0f18'; g.lineWidth = 1; g.stroke();
    }
    if (m.landmark) {
      g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(X(m.landmark.x), Z(m.landmark.z), 8, 0, 6.284); g.fill();
      g.fillStyle = '#0b111a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('★', X(m.landmark.x), Z(m.landmark.z) + 4);
    }
    for (const q of goals) {
      g.strokeStyle = q.color || '#34d399'; g.lineWidth = 3;
      g.beginPath(); g.arc(X(q.x), Z(q.z), 11, 0, 6.284); g.stroke();
      g.fillStyle = q.color || '#34d399'; g.beginPath(); g.arc(X(q.x), Z(q.z), 4, 0, 6.284); g.fill();
      if (q.label) { g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillText(q.label, X(q.x), Z(q.z) - 16); }
    }
    // Compass + scale bar (code-drawn, no outside image).
    g.fillStyle = '#94a3b8'; g.font = 'bold 13px sans-serif'; g.textAlign = 'left';
    g.fillText('N', 16, 26);
    g.strokeStyle = '#fbbf24'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(20, 32); g.lineTo(20, 50); g.moveTo(15, 40); g.lineTo(20, 32); g.lineTo(25, 40); g.stroke();
    g.strokeStyle = '#f1f5f9'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W - 116, H - 22); g.lineTo(W - 16, H - 22); g.stroke();
    g.fillStyle = '#94a3b8'; g.font = '11px sans-serif'; g.textAlign = 'center';
    g.fillText('100 m', W - 66, H - 28);
    // player arrow
    const px = X(p.x), py = Z(p.z), a = (p.yaw || 0);
    g.save(); g.translate(px, py); g.rotate(-a);
    g.fillStyle = '#fbbf24'; g.strokeStyle = '#0a0f18'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -14); g.lineTo(9, 10); g.lineTo(0, 5); g.lineTo(-9, 10); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}
