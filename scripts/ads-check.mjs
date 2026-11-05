// TIER 9 ads harness - run: node scripts/ads-check.mjs
// Node-only. Verifies SDK-absent safety, the documented callbacks, ?fakeads
// pause/mute/restore, the 120 s + 180 s midgame gate and the reward callback.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const el = () => ({ style: { cssText: '' }, innerHTML: '', parentNode: null,
  querySelector: () => ({ addEventListener(t, fn) { this._click = fn; } }),
  addEventListener() {} });
const body = { children: [], appendChild(e) { e.parentNode = this; this.children.push(e); },
  removeChild(e) { const i = this.children.indexOf(e); if (i >= 0) this.children.splice(i, 1); } };
globalThis.document = { body, createElement: el };
globalThis.window = {};
globalThis.location = { search: '' };
const src = fs.readFileSync(path.join(ROOT, 'src/core/Ads.js'), 'utf8');
const url = 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { default: Ads } = await import(url);
let bad = 0;
const ok = (c, l, x) => { console.log((c ? 'OK   ' : 'FAIL ') + l + (x ? '  ' + x : '')); if (!c) bad++; };

// 1. SDK missing: never blocks PLAY, never pauses, never mutes.
{
  const log = [];
  const a = new Ads({ onPause: v => log.push('p' + v), onMute: v => log.push('m' + v) });
  ok(!a.available(), 'SDK missing: rewarded button stays hidden');
  const r = await a.request('rewarded', () => log.push('reward'));
  ok(r === false && log.length === 0, 'SDK missing: no ad, no pause, no mute, no reward', JSON.stringify(log));
  ok(!a.canMidgame(), 'SDK missing: midgame never fires');
}
// 2. Real SDK: documented requestAd + all three callbacks, pause/mute restore.
{
  const calls = [];
  globalThis.window.CrazyGames = { SDK: { ad: {
    requestAd(type, cb) { calls.push(type); cb.adStarted(); cb.adFinished(); },
    hasAdblock: () => false
  } } };
  const a = new Ads({});
  const log = [];
  const r = await a.request('midgame');
  ok(calls[0] === 'midgame' && r === true, 'SDK: requestAd("midgame", callbacks) resolves true');
  const a2 = new Ads({ onPause: v => log.push('p' + v), onMute: v => log.push('m' + v) });
  await a2.request('rewarded', () => log.push('reward'));
  ok(['ptrue','mtrue','reward','pfalse','mfalse'].every(x => log.includes(x)),
     'adStarted pause+mute, adFinished reward+restore', log.join(','));
  // error path must restore too
  globalThis.window.CrazyGames.SDK.ad.requestAd = (t, cb) => { cb.adStarted(); cb.adError({ code: 'unfilled' }); };
  const a3 = new Ads({ onPause: v => log.push('p' + v), onMute: v => log.push('m' + v) });
  const r3 = await a3.request('rewarded', () => log.push('BAD'));
  ok(r3 === false && !log.includes('BAD'), 'adError restores and gives no reward');
  ok(a3.rewardedAvailable(), 'SDK present: rewarded button can show');
}
// 3. Midgame gate: no ad in the first 120 s, none within 180 s, never twice.
{
  const a = new Ads({});
  a.fake = true;
  a.sessionStart = Date.now();
  a.lastMidgame = 0;
  ok(!a.canMidgame(), 'midgame blocked in the first 120 s');
  a.sessionStart = Date.now() - 121000;
  ok(a.canMidgame(), 'midgame allowed after 120 s');
  a.lastMidgame = Date.now() - 1000;
  ok(!a.canMidgame(), 'midgame blocked inside the 180 s cooldown');
}
// 4. ?fakeads overlay: 3 s, real pause/mute/restore, reward granted.
{
  globalThis.location.search = '?fakeads';
  const log = [];
  const a = new Ads({ onPause: v => log.push('p' + v), onMute: v => log.push('m' + v) });
  ok(a.available() && a.fake, '?fakeads makes ads available without the portal');
  const r = await a.request('rewarded', () => log.push('reward'));
  ok(r === true && log.includes('reward'), 'fake rewarded ad grants the chosen reward');
  ok(['ptrue','mtrue','pfalse','mfalse','reward'].every(x => log.includes(x)),
     'fake ad pauses/mutes, restores, then grants', log.join(','));
  ok(body.children.length === 0, 'fake ad overlay is removed');
  globalThis.location.search = '';
}
console.log('\n' + (bad === 0 ? 'TIER 9 ADS CHECK: PASS' : `TIER 9 ADS CHECK: ${bad} FAILURE(S)`));
process.exit(bad ? 1 : 0);
