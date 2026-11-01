export default class GameUI {
  constructor() {
    this._injectCSS();
    this._jobCard = null;
    this._timer = null;
    this._timerValue = null;
    this._coinsEl = null;
    this._coinsValue = 0;
    this._coinsTarget = 0;
    this._coinsAnim = 0;
    this._toastWrap = null;
    this._toastQueue = [];
    this._activeToasts = 0;
    this._speedEl = null;
    this._speedNeedle = null;
    this._speedArc = null;
    this._speedText = null;
    this._speedValue = 0;
    this._speedTarget = 0;
    this._lockedEl = null;
    this._hintEl = null;
  }

  _injectCSS() {
    if (document.getElementById('gameui-css')) return;
    const s = document.createElement('style');
    s.id = 'gameui-css';
    s.textContent = `
      .gui-panel {
        background: rgba(15,23,42,0.75);
        border: 1px solid rgba(148,163,184,0.22);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        color: #fff;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .gui-jobcard {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        min-width: 260px;
        max-width: 380px;
        padding: 12px 18px 14px;
        z-index: 9990;
        text-align: left;
      }
      .gui-jobcard .gui-job-title {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: #fbbf24;
        margin-bottom: 4px;
      }
      .gui-jobcard .gui-job-objective {
        font-size: 13px;
        font-weight: 500;
        color: #e2e8f0;
        margin-bottom: 8px;
      }
      .gui-jobcard .gui-job-step {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        font-weight: 600;
        color: #cbd5e1;
        margin-bottom: 6px;
      }
      .gui-progress {
        width: 100%;
        height: 5px;
        background: rgba(148,163,184,0.18);
        border-radius: 4px;
        overflow: hidden;
      }
      .gui-progress-bar {
        height: 100%;
        width: 0%;
        background: #fbbf24;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .gui-timer {
        position: fixed;
        top: 118px;
        left: 50%;
        transform: translateX(-50%);
        padding: 5px 16px;
        font-size: 13px;
        font-weight: 700;
        border-radius: 999px;
        z-index: 9990;
        display: none;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        background: rgba(15,23,42,0.75);
        border: 1px solid rgba(148,163,184,0.22);
      }
      .gui-timer.amber { color: #fbbf24; border-color: rgba(251,191,36,0.5); }
      .gui-timer.red { color: #ef4444; border-color: rgba(239,68,68,0.5); animation: gui-pulse 0.9s ease-in-out infinite; }
      @keyframes gui-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.55; }
      }
      .gui-coins {
        position: fixed;
        top: 16px;
        left: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        font-size: 16px;
        font-weight: 800;
        color: #fbbf24;
        z-index: 9990;
      }
      .gui-coins svg { width: 18px; height: 18px; display: block; }
      .gui-toasts {
        position: fixed;
        bottom: 150px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
        z-index: 9995;
        pointer-events: none;
      }
      .gui-toast {
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        background: rgba(15,23,42,0.85);
        border: 1px solid rgba(148,163,184,0.25);
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.25s ease, transform 0.25s ease;
        white-space: nowrap;
      }
      .gui-toast.show { opacity: 1; transform: translateY(0); }
      .gui-toast.info { border-left: 3px solid #60a5fa; }
      .gui-toast.success { border-left: 3px solid #22c55e; }
      .gui-toast.warn { border-left: 3px solid #fbbf24; }
      .gui-speed {
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: 180px;
        height: 110px;
        z-index: 9990;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        pointer-events: none;
      }
      .gui-speed svg { display: block; overflow: visible; }
      .gui-speed-num {
        position: absolute;
        bottom: 20px;
        font-size: 22px;
        font-weight: 800;
        color: #fff;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .gui-speed-unit {
        position: absolute;
        bottom: 8px;
        font-size: 10px;
        font-weight: 600;
        color: #94a3b8;
        letter-spacing: 1px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .gui-hint {
        position: fixed;
        bottom: 128px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        font-weight: 600;
        color: #cbd5e1;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        background: rgba(15,23,42,0.7);
        padding: 4px 12px;
        border-radius: 8px;
        border: 1px solid rgba(148,163,184,0.18);
        z-index: 9990;
        display: none;
        white-space: nowrap;
      }
      .gui-locked {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 24px 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #fbbf24;
        z-index: 9999;
      }
      .gui-locked svg { width: 36px; height: 36px; }
      .gui-locked .gui-locked-text {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.3px;
        color: #cbd5e1;
        text-transform: none;
      }
    `;
    document.head.appendChild(s);
  }

  _ensureJobCard() {
    if (this._jobCard) return this._jobCard;
    const el = document.createElement('div');
    el.className = 'gui-panel gui-jobcard';
    el.innerHTML = `
      <div class="gui-job-title"></div>
      <div class="gui-job-objective"></div>
      <div class="gui-job-step"><span class="gui-step-text"></span><span class="gui-step-num"></span></div>
      <div class="gui-progress"><div class="gui-progress-bar"></div></div>
    `;
    document.body.appendChild(el);
    this._jobCard = el;
    return el;
  }

  setJob(title, objective, stepText) {
    const el = this._ensureJobCard();
    el.querySelector('.gui-job-title').textContent = title || '';
    el.querySelector('.gui-job-objective').textContent = objective || '';
    const txt = el.querySelector('.gui-step-text');
    const num = el.querySelector('.gui-step-num');
    const bar = el.querySelector('.gui-progress-bar');
    if (stepText) {
      const m = String(stepText).match(/^(.*?)(\d+)\s*\/\s*(\d+)\s*$/);
      if (m) {
        const cur = parseInt(m[2], 10);
        const max = parseInt(m[3], 10);
        txt.textContent = m[1].trim();
        num.textContent = cur + '/' + max;
        bar.style.width = max > 0 ? Math.min(100, (cur / max) * 100) + '%' : '0%';
      } else {
        txt.textContent = String(stepText);
        num.textContent = '';
        bar.style.width = '0%';
      }
    }
  }

  _ensureTimer() {
    if (this._timer) return this._timer;
    const el = document.createElement('div');
    el.className = 'gui-timer';
    document.body.appendChild(el);
    this._timer = el;
    return el;
  }

  setTimer(secondsLeft) {
    const el = this._ensureTimer();
    if (secondsLeft === null || secondsLeft === undefined) {
      el.style.display = 'none';
      this._timerValue = null;
      return;
    }
    const s = Math.max(0, Math.ceil(secondsLeft));
    this._timerValue = s;
    el.style.display = 'block';
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    el.textContent = (mm > 0 ? mm + ':' + String(ss).padStart(2, '0') : String(ss) + 's');
    el.classList.remove('amber', 'red');
    if (s <= 10) el.classList.add('red');
    else if (s <= 30) el.classList.add('amber');
  }

  _coinSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="#b45309" stroke-width="1.2" opacity="0.6"/><path d="M12 8v8M9.5 10h5M9.5 14h5" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }

  _ensureCoins() {
    if (this._coinsEl) return this._coinsEl;
    const el = document.createElement('div');
    el.className = 'gui-panel gui-coins';
    el.innerHTML = this._coinSVG() + '<span class="gui-coin-num">0</span>';
    document.body.appendChild(el);
    this._coinsEl = el;
    return el;
  }

  setCoins(n) {
    const el = this._ensureCoins();
    this._coinsTarget = Math.max(0, Math.floor(n || 0));
    const span = el.querySelector('.gui-coin-num');
    if (!this._coinsAnim) {
      this._coinsAnim = 1;
      this._coinsValue = this._coinsTarget;
      span.textContent = String(this._coinsValue);
      requestAnimationFrame(() => this._tickCoins());
    }
  }

  _tickCoins() {
    if (!this._coinsAnim) return;
    const el = this._coinsEl;
    if (!el) { this._coinsAnim = 0; return; }
    const span = el.querySelector('.gui-coin-num');
    const diff = this._coinsTarget - this._coinsValue;
    if (Math.abs(diff) < 0.5) {
      this._coinsValue = this._coinsTarget;
      span.textContent = String(Math.round(this._coinsValue));
      this._coinsAnim = 0;
      return;
    }
    this._coinsValue += diff * 0.18;
    span.textContent = String(Math.round(this._coinsValue));
    requestAnimationFrame(() => this._tickCoins());
  }

  _ensureToastWrap() {
    if (this._toastWrap) return this._toastWrap;
    const el = document.createElement('div');
    el.className = 'gui-toasts';
    document.body.appendChild(el);
    this._toastWrap = el;
    return el;
  }

  toast(message, type) {
    const t = type === 'success' || type === 'warn' ? type : 'info';
    this._toastQueue.push({ message: String(message), type: t });
    this._flushToasts();
  }

  _flushToasts() {
    if (this._activeToasts >= 3) return;
    const next = this._toastQueue.shift();
    if (!next) return;
    const wrap = this._ensureToastWrap();
    const el = document.createElement('div');
    el.className = 'gui-toast ' + next.type;
    el.textContent = next.message;
    wrap.appendChild(el);
    this._activeToasts++;
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        this._activeToasts--;
        this._flushToasts();
      }, 260);
    }, 2500);
  }

  _ensureSpeed() {
    if (this._speedEl) return this._speedEl;
    const el = document.createElement('div');
    el.className = 'gui-speed';
    const cx = 90, cy = 100, r = 70;
    let ticks = '';
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      const x1 = cx + Math.cos(a) * (r - 8);
      const y1 = cy + Math.sin(a) * (r - 8);
      const x2 = cx + Math.cos(a) * r;
      const y2 = cy + Math.sin(a) * r;
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(148,163,184,0.5)" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    el.innerHTML = `
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path class="gui-speed-arc-bg" d="M 20 100 A 70 70 0 0 1 160 100" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="6" stroke-linecap="round"/>
        <path class="gui-speed-arc" d="M 20 100 A 70 70 0 0 1 160 100" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0"/>
        ${ticks}
        <line class="gui-speed-needle" x1="90" y1="100" x2="90" y2="36" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="90" cy="100" r="4" fill="#ffffff"/>
      </svg>
      <div class="gui-speed-num">0</div>
      <div class="gui-speed-unit">KM/H</div>
    `;
    document.body.appendChild(el);
    this._speedEl = el;
    this._speedNeedle = el.querySelector('.gui-speed-needle');
    this._speedArc = el.querySelector('.gui-speed-arc');
    this._speedText = el.querySelector('.gui-speed-num');
    return el;
  }

  setSpeed(kmh) {
    this._ensureSpeed();
    this._speedTarget = Math.max(0, Math.min(200, kmh || 0));
    if (!this._speedRaf) {
      this._speedRaf = 1;
      this._tickSpeed();
    }
  }

  _tickSpeed() {
    if (!this._speedRaf) return;
    const diff = this._speedTarget - this._speedValue;
    if (Math.abs(diff) < 0.1) this._speedValue = this._speedTarget;
    else this._speedValue += diff * 0.18;

    const max = 200;
    const p = Math.min(1, this._speedValue / max);
    const angle = -90 + p * 180;
    if (this._speedNeedle) {
      this._speedNeedle.setAttribute('transform', `rotate(${angle.toFixed(1)} 90 100)`);
    }
    if (this._speedText) this._speedText.textContent = String(Math.round(this._speedValue));
    if (this._speedArc) {
      this._speedArc.style.opacity = p > 0.7 ? '0.9' : '0';
    }
    if (Math.abs(this._speedValue - this._speedTarget) < 0.1) {
      this._speedRaf = 0;
      return;
    }
    requestAnimationFrame(() => this._tickSpeed());
  }

  showLocked(text) {
    if (this._lockedEl && this._lockedEl.parentNode) {
      this._lockedEl.parentNode.removeChild(this._lockedEl);
    }
    const el = document.createElement('div');
    el.className = 'gui-panel gui-locked';
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="16" height="11" rx="2" stroke="#fbbf24" stroke-width="1.8"/>
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="12" cy="15.5" r="1.5" fill="#fbbf24"/>
      </svg>
      <div>LOCKED</div>
      ${text ? `<div class="gui-locked-text">${this._escape(text)}</div>` : ''}
    `;
    document.body.appendChild(el);
    this._lockedEl = el;
  }

  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  _ensureHint() {
    if (this._hintEl) return this._hintEl;
    const el = document.createElement('div');
    el.className = 'gui-hint';
    document.body.appendChild(el);
    this._hintEl = el;
    return el;
  }

  setHint(text) {
    const el = this._ensureHint();
    if (!text) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.textContent = String(text);
    el.style.display = 'block';
  }

  reset() {
    if (this._jobCard) {
      if (this._jobCard.parentNode) this._jobCard.parentNode.removeChild(this._jobCard);
      this._jobCard = null;
    }
    if (this._timer) {
      if (this._timer.parentNode) this._timer.parentNode.removeChild(this._timer);
      this._timer = null;
    }
    this._timerValue = null;
    if (this._coinsEl) {
      if (this._coinsEl.parentNode) this._coinsEl.parentNode.removeChild(this._coinsEl);
      this._coinsEl = null;
    }
    this._coinsValue = 0;
    this._coinsTarget = 0;
    this._coinsAnim = 0;
    if (this._toastWrap) {
      if (this._toastWrap.parentNode) this._toastWrap.parentNode.removeChild(this._toastWrap);
      this._toastWrap = null;
    }
    this._toastQueue.length = 0;
    this._activeToasts = 0;
    if (this._speedEl) {
      if (this._speedEl.parentNode) this._speedEl.parentNode.removeChild(this._speedEl);
      this._speedEl = null;
    }
    this._speedNeedle = null;
    this._speedArc = null;
    this._speedText = null;
    this._speedValue = 0;
    this._speedTarget = 0;
    this._speedRaf = 0;
    if (this._lockedEl) {
      if (this._lockedEl.parentNode) this._lockedEl.parentNode.removeChild(this._lockedEl);
      this._lockedEl = null;
    }
    if (this._hintEl) {
      if (this._hintEl.parentNode) this._hintEl.parentNode.removeChild(this._hintEl);
      this._hintEl = null;
    }
  }
}
