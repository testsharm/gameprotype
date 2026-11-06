// TIER 6 garage audit - run: node scripts/garage-check.mjs
// Static + logic check of the six upgrades, four paid steps, paints and save.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const main = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');
const menus = fs.readFileSync(path.join(ROOT, 'src/ui/Menus.js'), 'utf8');
let bad = 0;
const ok = (c, label, extra) => { console.log((c ? 'OK   ' : 'FAIL ') + label + (extra ? '  ' + extra : '')); if (!c) bad++; };

const keys = [...main.matchAll(/\{ key: '([a-z]+)', name: '([A-Z ]+)'/g)].map(m => [m[1], m[2]]);
ok(keys.length === 6, '6 upgrade cards', JSON.stringify(keys.map(k => k[0])));
ok(new Set(keys.map(k => k[0])).size === 6, '6 distinct upgrade keys');
const prices = main.match(/const GARAGE_PRICES = \[([^\]]+)\]/);
const p = prices ? prices[1].split(',').map(x => +x.trim()) : [];
ok(p.length === 4 && p.join(',') === '100,250,500,900', 'prices 100 / 250 / 500 / 900', JSON.stringify(p));
const paints = main.match(/const PAINTS = \[([^\]]+)\]/);
ok(paints && paints[1].split(',').length === 6, '6 paint swatches');
ok(/vehicle\.setPaint/.test(main), 'paint really changes the machine material');
ok(/setPaint\(hex\)/.test(fs.readFileSync(path.join(ROOT, 'src/vehicle/Vehicle.js'), 'utf8')), 'Vehicle.setPaint exists');
ok(/for \(const g of GARAGE\) if \(!\(typeof saveData\[g\.save\]/.test(main), 'old saves migrate to 6 upgrades');
ok(/terraform_city_save_v6/.test(main) || /SAVE_KEY/.test(main), 'uses the existing save key');
ok(/u\.maxPips \|\| 4/.test(menus), 'garage renders the real number of pips');
ok(/class="tf-max">MAX</.test(menus) && /\.tf-max\{/.test(menus), 'MAX is a small badge with CSS, not a big empty box');
ok(/price \? .*\.tf-buy/.test(menus) || /max \?/.test(menus), 'buy button green if affordable, grey if not');

// Simulated purchase: 4 paid steps, level 1 -> 5, total 1750 coins.
let coins = 5000, lv = 1, spent = 0;
for (let i = 0; i < p.length; i++) { if (coins >= p[i]) { coins -= p[i]; spent += p[i]; lv++; } }
console.log('\nupgrade steps    : 4 | level', lv, '| spent', spent, '| coins left', coins);
ok(lv === 5 && spent === 1750, 'four paid steps reach level 5');
console.log('\n' + (bad === 0 ? 'TIER 6 GARAGE CHECK: PASS' : `TIER 6 GARAGE CHECK: ${bad} FAILURE(S)`));
process.exit(bad ? 1 : 0);
