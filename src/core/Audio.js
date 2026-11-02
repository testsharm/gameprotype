// AudioHub - the ONE AudioContext for the whole game (milestone M2).
// - All sounds are synthesized. No audio files.
// - Nothing is created before the first user input (key, click or touch).
// - Everything is suspended while the tab is hidden.
// - Music ducks to 50% during the dump animation.
// - M key = mute (remembered).

const LEVELS = { master: 0.9, music: 0.3, ambience: 0.22, engine: 0.55, sfx: 0.75 };
const MUTE_KEY = 'terraform_muted_v1';
const BPM = 100;
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const ROOTS = [45, 41, 36, 43];
const LEAD = [0, 2, 1, 2, 3, 2, 1, 0];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Debug only: count how many AudioContexts the page creates (must be 1)
let contextsCreated = 0;
(function countContexts() {
  try {
    const AC = window.AudioContext;
    const debug = !!import.meta.env.DEV || /[?&]debug/.test(location.search);
    if (!AC || !debug || AC.__tfCounted) return;
    const Counted = class extends AC {
      constructor(...a) { super(...a); contextsCreated++; }
    };
    Counted.__tfCounted = true;
    window.AudioContext = Counted;
  } catch (e) { /* ignore */ }
})();

export class AudioHub {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* ignore */ }
    this._hidden = !!document.hidden;
    this._wantMusic = false;
    this._wantAmbience = false;
    this._musicOn = false;
    this._ambOn = false;
    this._engSpeed = 0;
    this._engThr = 0;
    this._engStamp = 0;
    this._intensity = 0;
    this._step = 0;
    this._chord = 0;
    this._nextNote = 0;
    this._nextHorn = 0;
    this._timer = null;

    const gesture = () => this.unlock();
    ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click'].forEach((n) => {
      window.addEventListener(n, gesture, { capture: true, passive: true });
    });
    document.addEventListener('visibilitychange', () => this._onVisibility());
    window.addEventListener('pagehide', () => { if (this.ctx) this.ctx.suspend().catch(() => {}); });
  }

  // ---------- compatibility with the old AudioManager (Vehicle.updateVisuals still receives it) ----------
  init() { /* intentionally empty: audio starts only from a real user gesture */ }
  playEngine() { /* engine is driven by setEngine() now */ }
  playScoop() { /* replaced by dig() timeline */ }
  playDumpThud() { /* replaced by dig() timeline */ }
  playDirtCrunch() { /* replaced by dig() timeline */ }
  playSuccess() { this.complete(); }

  // ---------- life cycle ----------
  unlock() {
    if (this._hidden) return;
    if (!this.ctx) this._build();
    const c = this.ctx;
    if (c && c.state !== 'running') c.resume().catch(() => {});
  }

  _onVisibility() {
    this._hidden = !!document.hidden;
    const c = this.ctx;
    if (!c) return;
    if (this._hidden) c.suspend().catch(() => {});
    else c.resume().catch(() => {});
  }

  _g(v, dest) {
    const g = this.ctx.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }

  _build() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try { this.ctx = new Ctor({ latencyHint: 'interactive' }); } catch (e) {
      try { this.ctx = new Ctor(); } catch (e2) { this.ctx = null; return; }
    }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 20;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    comp.connect(c.destination);

    this.master = this._g(this.muted ? 0 : LEVELS.master, comp);
    this.duckGain = this._g(1, this.master);
    this.musicBus = this._g(LEVELS.music, this.duckGain);
    this.ambBus = this._g(LEVELS.ambience, this.master);
    this.engBus = this._g(LEVELS.engine, this.master);
    this.sfxBus = this._g(LEVELS.sfx, this.master);

    const sr = c.sampleRate;
    this._white = c.createBuffer(1, Math.floor(sr * 2), sr);
    const d = this._white.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this._buildEngine();
    this._timer = setInterval(() => this._tick(), 50);
    if (this._wantMusic) this._beginMusic();
    if (this._wantAmbience) this._beginAmbience();
  }

  // ---------- public controls ----------
  start() { this._wantMusic = true; if (this.ctx) this._beginMusic(); }
  startAmbience() { this._wantAmbience = true; if (this.ctx) this._beginAmbience(); }
  setIntensity(v) { this._intensity = Math.max(0, Math.min(1, v || 0)); }

  setEngine(speedKmh, throttle) {
    this._engSpeed = Math.abs(Number(speedKmh) || 0);
    this._engThr = throttle ? 1 : 0;
    this._engStamp = performance.now();
  }

  setMuted(m) {
    this.muted = !!m;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch (e) { /* ignore */ }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(this.muted ? 0 : LEVELS.master, t + 0.12);
  }

  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  duck(sec) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.duckGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.5, t + 0.08);
    g.setValueAtTime(0.5, t + Math.max(0.1, sec - 0.3));
    g.linearRampToValueAtTime(1, t + sec);
  }

  debugText() {
    const c = this.ctx;
    if (!c) return 'audio off (waiting for first input)';
    return 'audio ' + c.state + ' | contexts ' + contextsCreated + ' | duck ' + this.duckGain.gain.value.toFixed(2) + (this.muted ? ' | MUTED' : '');
  }

  _ok() {
    return !!this.ctx && this.ctx.state === 'running' && !this._hidden && !this.muted;
  }

  // ---------- engine ----------
  _buildEngine() {
    const c = this.ctx;
    this._eo1 = c.createOscillator();
    this._eo1.type = 'sawtooth';
    this._eo1.frequency.value = 55;
    this._eo2 = c.createOscillator();
    this._eo2.type = 'sawtooth';
    this._eo2.frequency.value = 55;
    this._eo2.detune.value = 9;
    this._elp = c.createBiquadFilter();
    this._elp.type = 'lowpass';
    this._elp.frequency.value = 300;
    this._elp.Q.value = 0.8;
    const mix = this._g(0.4, this._elp);
    this._eo1.connect(mix);
    this._eo2.connect(mix);
    this._chug = this._g(0.8);
    this._elfo = c.createOscillator();
    this._elfo.frequency.value = 7;
    const lfoAmt = this._g(0.2, this._chug.gain);
    this._elfo.connect(lfoAmt);
    this._egain = this._g(0, this.engBus);
    this._elp.connect(this._chug);
    this._chug.connect(this._egain);
    this._eo1.start();
    this._eo2.start();
    this._elfo.start();
  }

  _tick() {
    const c = this.ctx;
    if (!c) return;
    if (document.hidden) {
      if (c.state === 'running') c.suspend().catch(() => {});
      return;
    }
    if (c.state !== 'running') return;
    const t = c.currentTime;

    // engine: goes silent by itself if the game stops calling setEngine (shop open, paused)
    const stale = performance.now() - this._engStamp > 400;
    const sp = stale ? 0 : this._engSpeed;
    const thr = stale ? 0 : this._engThr;
    const k = Math.min(1, sp / 40);
    const f = 55 + sp * 2.4 + thr * 12;
    const vol = stale ? 0 : 0.12 + 0.14 * k + 0.05 * thr;
    const cut = 300 + sp * 12 + thr * 150;
    this._egain.gain.setTargetAtTime(vol, t, 0.15);
    this._eo1.frequency.setTargetAtTime(f, t, 0.12);
    this._eo2.frequency.setTargetAtTime(f, t, 0.12);
    this._elp.frequency.setTargetAtTime(cut, t, 0.15);
    this._elfo.frequency.setTargetAtTime(6 + k * 10, t, 0.2);

    if (this._musicOn) this._scheduleMusic(t);
    if (this._ambOn && t >= this._nextHorn) {
      this._farHorn(t);
      this._nextHorn = t + 6 + Math.random() * 12;
    }
  }

  // ---------- small building blocks ----------
  _hold(g, t, dur, vol, att, rel) {
    const a = Math.min(att, dur * 0.4);
    const r = Math.min(rel, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + dur - r);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
  }

  // filtered noise. hold=true keeps the level steady, hold=false decays fast (percussive)
  _n(t, dur, type, f0, f1, q, vol, att, hold, dest) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this._white;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    if (hold) {
      this._hold(g, t, dur, vol, att, 0.12);
    } else {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    s.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxBus);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.05);
  }

  _tone(t, f0, f1, dur, type, vol, dest) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _grains(t, dur, n, vol, fmin, fmax) {
    for (let i = 0; i < n; i++) {
      const tt = t + Math.random() * dur;
      const f = fmin + Math.random() * (fmax - fmin);
      this._n(tt, 0.04, 'bandpass', f, f * 0.6, 1.2, vol * (0.5 + Math.random() * 0.5), 0.002, false);
    }
  }

  // hydraulic whine (boom and bucket moving)
  _hyd(t, dur, f0, f1, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f1, t + dur);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2.5;
    lp.frequency.setValueAtTime(f0 * 2.5, t);
    lp.frequency.linearRampToValueAtTime(f1 * 2.2, t + dur);
    const g = c.createGain();
    this._hold(g, t, dur, vol, 0.12, 0.12);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);

    const h = c.createOscillator();
    h.type = 'sine';
    h.frequency.setValueAtTime(f0 * 0.5, t);
    h.frequency.linearRampToValueAtTime(f1 * 0.5, t + dur);
    const hg = c.createGain();
    this._hold(hg, t, dur, vol * 0.5, 0.15, 0.15);
    h.connect(hg);
    hg.connect(this.sfxBus);
    h.start(t);
    h.stop(t + dur + 0.05);

    this._n(t, dur, 'bandpass', 2500, 2500, 1, vol * 0.25, 0.1, true);
  }

  _rumble(t, dur, f, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const la = c.createGain();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    lfo.frequency.value = 5;
    la.gain.value = f * 0.08;
    lfo.connect(la);
    la.connect(o.frequency);
    this._hold(g, t, dur, vol, 0.08, 0.1);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }

  _thump(t, vol) {
    this._tone(t, 100, 38, 0.32, 'sine', vol);
    this._n(t, 0.14, 'lowpass', 800, 300, 0.7, vol * 0.5, 0.01, false);
  }

  _clank(t, vol) {
    this._tone(t, 230, 120, 0.22, 'triangle', vol);
    this._n(t, 0.1, 'bandpass', 2600, 2600, 3, vol * 0.6, 0.004, false);
  }

  _scrape(t, dur, vol) {
    this._n(t, dur, 'bandpass', 400, 1800, 1.6, vol, 0.1, true);
    this._grains(t, dur, 10 + Math.floor(Math.random() * 5), 0.06, 1400, 3600);
  }

  _pour(t, dur, vol) {
    this._n(t, dur, 'bandpass', 2800, 3600, 0.9, vol, 0.3, true);
    this._grains(t, dur, 22, 0.05, 2200, 5200);
  }

  _creak(t, dur) {
    this._n(t, dur, 'bandpass', 500, 1200, 6, 0.09, 0.15, true);
  }

  _hiss(t, dur, vol) {
    this._n(t, dur, 'highpass', 3000, 3000, 0.7, vol, 0.01, false);
  }

  // ---------- digging and dumping, driven by the DigAnimator timeline ----------
  // type: 'scoop' or 'dump'. name: start, dig, fill, lift, end (scoop) / start, tip, drop, thud, end (dump)
  dig(type, name) {
    if (!this._ok()) return;
    try {
      const t = this.ctx.currentTime + 0.01;
      if (type === 'scoop') {
        if (name === 'start') {
          this._hyd(t, 1.3, 180, 380, 0.08);
        } else if (name === 'dig') {
          this._thump(t, 0.2);
          this._scrape(t, 0.6, 0.22);
        } else if (name === 'fill') {
          this._thump(t, 0.45);
          this._hyd(t, 1.0, 320, 200, 0.07);
          this._grains(t + 0.1, 0.9, 8, 0.05, 1800, 4400);
        } else if (name === 'end') {
          this._hiss(t, 0.25, 0.05);
        }
      } else if (type === 'dump') {
        if (name === 'start') {
          this._hyd(t, 0.8, 200, 460, 0.08);
          this.duck(3.0);
        } else if (name === 'tip') {
          this._creak(t, 0.7);
          this._rumble(t, 0.7, 60, 0.12);
        } else if (name === 'drop') {
          this._pour(t, 1.0, 0.16);
          this._rumble(t, 1.0, 45, 0.1);
        } else if (name === 'thud') {
          this._thump(t, 0.5);
          this._clank(t, 0.2);
          this._hyd(t + 0.3, 0.8, 340, 180, 0.07);
        } else if (name === 'end') {
          this._hiss(t, 0.25, 0.05);
        }
      }
    } catch (e) { console.warn('[audio]', e); }
  }

  coin() {
    if (!this._ok()) return;
    const t = this.ctx.currentTime + 0.2;
    this._tone(t, 988, 988, 0.22, 'sine', 0.22);
    this._tone(t + 0.09, 1319, 1319, 0.45, 'sine', 0.22);
  }

  complete() {
    if (!this._ok()) return;
    const t = this.ctx.currentTime + 0.3;
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      this._tone(t + i * 0.11, notes[i], notes[i], i === 3 ? 0.7 : 0.25, 'triangle', 0.28);
    }
  }

  click() {
    if (!this._ok()) return;
    this._tone(this.ctx.currentTime, 700, 500, 0.05, 'sine', 0.15);
  }

  // ---------- music ----------
  _beginMusic() {
    if (this._musicOn || !this.ctx) return;
    this._musicOn = true;
    this._step = 0;
    this._chord = 0;
    this._nextNote = this.ctx.currentTime + 0.2;
  }

  _scheduleMusic(now) {
    const stepDur = 60 / BPM / 2;
    if (this._nextNote < now - 0.5) this._nextNote = now + 0.05;
    while (this._nextNote < now + 0.25) {
      this._musicStep(this._step, this._nextNote);
      this._nextNote += stepDur;
      this._step = (this._step + 1) % 16;
    }
  }

  _musicStep(step, t) {
    const inten = this._intensity;
    if (step % 4 === 0) this._tone(t, 140, 45, 0.28, 'sine', 0.5, this.musicBus);
    if (step % 2 === 1) this._n(t, 0.06, 'highpass', 7000, 7000, 0.7, 0.07 + inten * 0.05, 0.002, false, this.musicBus);
    if (step === 0 || step === 8) {
      this._bass(t, mtof(ROOTS[this._chord]), 0.32);
      this._pad(t, CHORDS[this._chord], 2.6);
    }
    if (step % 2 === 0) {
      const ch = CHORDS[this._chord];
      const note = ch[LEAD[(step / 2) % 8] % ch.length] + 12;
      this._tone(t, mtof(note), mtof(note), 0.2, 'triangle', 0.05 + inten * 0.06, this.musicBus);
    }
    if (step === 15) this._chord = (this._chord + 1) % 4;
  }

  _bass(t, f, dur) {
    const c = this.ctx;
    const o = c.createOscillator();
    const lp = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(320, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _pad(t, midis, dur) {
    const c = this.ctx;
    for (let i = 0; i < midis.length; i++) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(midis[i]);
      o.detune.value = (Math.random() - 0.5) * 8;
      const g = c.createGain();
      this._hold(g, t, dur, 0.06, 0.3, 0.4);
      o.connect(g);
      g.connect(this.musicBus);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  // ---------- ambience ----------
  _loopNoise(coef, sec) {
    const c = this.ctx;
    const sr = c.sampleRate;
    const n = Math.floor(sr * sec);
    const buf = c.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    let last = 0;
    let peak = 0.0001;
    for (let i = 0; i < n; i++) {
      last = last * coef + (Math.random() * 2 - 1) * (1 - coef);
      d[i] = last;
      if (Math.abs(last) > peak) peak = Math.abs(last);
    }
    const k = 0.6 / peak;
    for (let i = 0; i < n; i++) d[i] *= k;
    const s = c.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    return s;
  }

  _beginAmbience() {
    if (this._ambOn || !this.ctx) return;
    this._ambOn = true;
    const c = this.ctx;

    const hum = this._loopNoise(0.97, 5);
    const hlp = c.createBiquadFilter();
    hlp.type = 'lowpass';
    hlp.frequency.value = 400;
    const hg = this._g(0.35, this.ambBus);
    hum.connect(hlp);
    hlp.connect(hg);
    hum.start();

    const wind = this._loopNoise(0.995, 6);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 0.4;
    const wg = this._g(0.25, this.ambBus);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.08;
    const la = this._g(0.12, wg.gain);
    lfo.connect(la);
    lfo.start();
    wind.connect(bp);
    bp.connect(wg);
    wind.start();

    this._nextHorn = c.currentTime + 5 + Math.random() * 8;
  }

  _farHorn(t) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 220 + Math.random() * 80;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
    g.gain.setValueAtTime(0.05, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.ambBus);
    o.start(t);
    o.stop(t + 1);
  }
}
