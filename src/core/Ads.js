// TerraForm 3D - ONE safe CrazyGames v3 ad wrapper. No SDK = silent no-op.
// Official API: window.CrazyGames.SDK.ad.requestAd("midgame"|"rewarded",
//   { adStarted, adFinished, adError })  - docs.crazygames.com/sdk/video-ads/
// A3: the SDK is initialised EXACTLY ONCE. Every caller queues behind the same
// promise. If the script is missing or init() throws, ads are DISABLED FOREVER
// and nothing ever reads window.CrazyGames again -> zero red console errors.

const SESSION_MIN_BEFORE_MIDGAME = 120000; // 2 min
const MIDGAME_COOLDOWN = 180000;          // 3 min (SDK adCooldown is also 3 min)

let _gate = null;          // the single init() promise
let _disabled = false;     // sticky: once off, never retry
let _sdkRef = null;        // only set AFTER init() resolves

const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function crazySDKReady() {
  if (_disabled) return Promise.resolve(null);
  if (_gate) return _gate;
  _gate = (async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      _disabled = true; return null;
    }
    // The <script> tag is already in index.html. Outside the CrazyGames portal
    // it fails to load, so we wait a short, bounded time and then give up.
    const script = document.querySelector('script[data-crazygames-sdk]');
    if (!script) { _disabled = true; return null; }
    const start = Date.now();
    while (!(window.CrazyGames && window.CrazyGames.SDK) && Date.now() - start < 2500) {
      await _sleep(50);
    }
    const S = window.CrazyGames && window.CrazyGames.SDK;
    if (!S || typeof S.init !== 'function') { _disabled = true; return null; }
    try { await S.init(); } catch (e) { _disabled = true; return null; }
    _sdkRef = S;
    return S;
  })();
  return _gate;
}
export function crazySDKDisabled() { return _disabled; }
export function crazySDK() { return _disabled ? null : _sdkRef; }

export default class Ads {
  constructor(opts) {
    this.opts = opts || {};
    this.SDK = null;
    this.sessionStart = Date.now();
    this.lastMidgame = 0;
    this.busy = false;
    this.fake = false;
    try { this.fake = /[?&]fakeads/.test(location.search); } catch (e) {}
  }
  _pause(on) { try { if (this.opts.onPause) this.opts.onPause(on); } catch (e) {} }
  _mute(on) { try { if (this.opts.onMute) this.opts.onMute(on); } catch (e) {} }
  _sdk() {
    // NEVER touch window.CrazyGames before crazySDKReady() has resolved.
    const S = crazySDK();
    if (S && S.ad && typeof S.ad.requestAd === 'function') { this.SDK = S.ad; return this.SDK; }
    return null;
  }
  available() { return !!this._sdk() || this.fake; }
  rewardedAvailable() { return this.available(); }
  canMidgame() {
    if (!this.available() || this.busy) return false;
    const now = Date.now();
    return (now - this.sessionStart >= SESSION_MIN_BEFORE_MIDGAME) &&
           (now - this.lastMidgame >= MIDGAME_COOLDOWN);
  }

  // type: 'midgame' | 'rewarded'. Resolves true only when the ad finished.
  async request(type, onGranted) {
    const kind = type === 'rewarded' ? 'rewarded' : 'midgame';
    if (kind === 'midgame') this.lastMidgame = Date.now();
    if (this.fake) return this._fake(kind, onGranted);
    await crazySDKReady();          // A3: queue behind the ONE init()
    if (crazySDKDisabled()) return false;
    const ad = this._sdk();
    if (!ad) return false;
    this.busy = true;
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        this.busy = false;
        this._mute(false);
        this._pause(false);
        resolve(ok);
      };
      try {
        ad.requestAd(kind, {
          adStarted: () => { this._mute(true); this._pause(true); },
          adFinished: () => { if (kind === 'rewarded' && onGranted) onGranted(); finish(true); },
          adError: (err) => { console.info('[ads]', kind, err && err.code ? err.code : 'unavailable'); finish(false); }
        });
      } catch (e) { finish(false); }
      // Never hang the game if the portal never answers.
      setTimeout(() => finish(false), 30000);
    });
  }

  _fake(kind, onGranted) {
    this.busy = true;
    this._mute(true); this._pause(true);
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;z-index:5000;background:#0b111a;color:#f1f5f9;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;' +
        'font:700 18px system-ui,sans-serif;text-align:center';
      el.innerHTML = '<div style="font-size:34px;font-weight:900;color:#fbbf24">TEST AD</div>' +
        '<div>' + kind.toUpperCase() + ' · closes in 3 seconds</div>' +
        '<button style="height:48px;min-width:160px;border-radius:10px;border:2px solid #0a0f18;' +
        'background:linear-gradient(#fde68a,#f59e0b);color:#1a1204;font-weight:900">CLOSE</button>';
      document.body.appendChild(el);
      let closed = false;
      const end = (ok) => {
        if (closed) return;
        closed = true;
        clearTimeout(timer);
        if (el.parentNode) el.parentNode.removeChild(el);
        this.busy = false;
        this._mute(false); this._pause(false);
        if (ok && kind === 'rewarded' && onGranted) onGranted();
        resolve(ok);
      };
      el.querySelector('button').addEventListener('click', () => end(true));
      const timer = setTimeout(() => end(true), 3000);
    });
  }
}
