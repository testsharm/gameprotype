// AudioHub: one place that pauses, resumes and unlocks every Web Audio context in the game.
// It wraps the browser AudioContext so every sound system (engine, music, dig, effects)
// is tracked without editing those files.

const contexts = new Set();
const holds = new Set();

function suspendAll() {
  contexts.forEach((ctx) => {
    if (ctx.state === 'running') {
      try { ctx.suspend().catch(() => {}); } catch (e) {}
    }
  });
}

function resumeAll() {
  if (holds.size > 0) return;
  contexts.forEach((ctx) => {
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      try { ctx.resume().catch(() => {}); } catch (e) {}
    }
  });
}

const audioHub = {
  hold(reason) { holds.add(reason || 'hold'); suspendAll(); },
  release(reason) { holds.delete(reason || 'hold'); resumeAll(); },
  resume() { resumeAll(); },
  states() { return Array.from(contexts).map((c) => c.state); },
  holding() { return Array.from(holds); }
};

try {
  if (typeof window !== 'undefined' && !window.__audioHubInstalled) {
    const Native = window.AudioContext || window.webkitAudioContext;
    if (Native) {
      window.__audioHubInstalled = true;
      class HubContext extends Native {
        constructor(...args) {
          super(...args);
          contexts.add(this);
          try {
            this.addEventListener('statechange', () => {
              if (holds.size > 0 && this.state === 'running') {
                try { this.suspend().catch(() => {}); } catch (e) {}
              }
            });
          } catch (e) {}
          if (holds.size > 0) {
            try { this.suspend().catch(() => {}); } catch (e) {}
          }
        }
      }
      window.AudioContext = HubContext;
      window.webkitAudioContext = HubContext;
    }
  }
} catch (e) {}

try {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const unlock = () => { resumeAll(); };
    ['pointerdown', 'touchend', 'keydown', 'click'].forEach((type) => {
      window.addEventListener(type, unlock, { capture: true, passive: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') audioHub.hold('hidden');
      else audioHub.release('hidden');
    });
  }
} catch (e) {}

if (typeof window !== 'undefined') window.__audioHub = audioHub;

export default audioHub;
