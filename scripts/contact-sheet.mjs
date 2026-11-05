// TIER C EVIDENCE - real Chromium frames for ALL 15 stages:
// first frame + a frame after AFTER seconds (default 30) of real play.
// Writes docs/screenshots/level-01..15.png and levels-contact-sheet.png.
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { serve, newContext, openGame, closeAll, SHOTS, redErrors } from './browser.mjs';

const AFTER = Math.max(2, +process.env.AFTER || 30);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean).map(Number);
const ids = ONLY.length ? ONLY : Array.from({ length: 15 }, (_, i) => i + 1);
const W = 440, H = 248, LABEL = 28, COLS = 3;
fs.mkdirSync(SHOTS, { recursive: true });

await serve();
const ctx = await newContext({ viewport: { width: 800, height: 450 } });
const page = await openGame(ctx, { settle: 1400, query: '?unlockall' });
await page.click('.tf-play');
await page.waitForTimeout(1200);

async function grab(file) {
  const buf = await page.screenshot({ path: file, timeout: 90000, animations: 'disabled' });
  return PNG.sync.read(buf);
}
function scale(src, w, h) {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(src.width - 1, Math.floor(x * src.width / w));
    const sy = Math.min(src.height - 1, Math.floor(y * src.height / h));
    const a = (sy * src.width + sx) * 4, b = (y * w + x) * 4;
    out.data[b] = src.data[a]; out.data[b + 1] = src.data[a + 1];
    out.data[b + 2] = src.data[a + 2]; out.data[b + 3] = 255;
  }
  return out;
}

console.log('CAPTURING ' + ids.length + ' stages, second frame after ' + AFTER + 's of real play');
for (const id of ids) {
  await page.evaluate(n => window.__tfQA.qaLevel(n), id);
  await page.waitForTimeout(4200);   // let the level-announcement toast clear
  const st = await page.evaluate(() => window.__tfQA.qaStage());
  const firstPath = path.join(SHOTS, 'level-' + String(id).padStart(2, '0') + '.png');
  const laterPath = path.join(SHOTS, 'level-' + String(id).padStart(2, '0') + '-30s.png');
  await grab(firstPath);
  // real keyboard driving makes the 30 s frame a real gameplay frame
  await page.keyboard.down('s');
  await page.waitForTimeout(1200);
  await page.keyboard.up('s');
  await page.waitForTimeout(Math.max(200, AFTER * 1000 - 1200 - 4200));
  await grab(laterPath);
  console.log('L' + id + ' ' + st.name + ' | ' + st.verbs.join('/') + ' | ' + st.skyline + ' | ' + st.landmark + ' | ground #' + st.ground.toString(16));
}

// ---------------------------------------------------------------- contact sheet
const all = Array.from({ length: 15 }, (_, i) => i + 1);
const rows = Math.ceil(all.length / COLS);
const sheet = new PNG({ width: COLS * W, height: rows * (H * 2 + LABEL) });
sheet.data.fill(0);
const put = (src, ox, oy, w, h) => {
  const s = scale(src, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = (y * w + x) * 4, b = ((oy + y) * sheet.width + (ox + x)) * 4;
    sheet.data[b] = s.data[a]; sheet.data[b + 1] = s.data[a + 1];
    sheet.data[b + 2] = s.data[a + 2]; sheet.data[b + 3] = 255;
  }
};
// 5x7 pixel font for the labels (no external font files)
const F = { A:'0111010001101111000110001',B:'1111010001111101000111110',C:'0111110000100001000011110',D:'1111010001100011000111110',E:'1111110000111101000011111',F:'1111110000111101000010000',G:'0111110000101111000101110',H:'1000110001111111000110001',I:'1111100100001000010011111',J:'0011100001000011000101110',K:'1000110010111001010010001',L:'1000010000100001000011111',M:'1000111011101011000110001',N:'1000111001101011001110001',O:'0111010001100011000101110',P:'1111010001111101000010000',Q:'0111010001100011010101111',R:'1111010001111101010010001',S:'0111110000011100000111110',T:'1111100100001000010000100',U:'1000110001100011000101110',V:'1000110001100010101000100',W:'1000110001101011101110001',X:'1000110001010001000110001',Y:'1000110001010100010000100',Z:'1111100010001000100011111','0':'0111010011101011100101110','1':'0010001100001000010011110','2':'0111010001000100010011111','3':'1111000001011100000111110','4':'1001010010111110001000010','5':'1111110000111100000111110','6':'0111010000111101000101110','7':'1111100001000100010000100','8':'0111010001011101000101110','9':'0111010001011110000101110',' ':'0000000000000000000000000','.':'0000000000000000000010000',':':'0000000100000000010000000','|':'0010000100001000010000100','-':'0000000000111110000000000','#':'0101011111010101111101010','+':'0000000100111110010000000' };
function label(text, ox, oy) {
  const t = String(text).toUpperCase().slice(0, 58);
  for (let ci = 0; ci < t.length; ci++) {
    const g = F[t[ci]] || F[' '];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      if (g[y * 5 + x] !== '1') continue;
      const px = ox + 6 + ci * 6 + x, py = oy + 4 + y;
      const b = (py * sheet.width + px) * 4;
      sheet.data[b] = 251; sheet.data[b + 1] = 191; sheet.data[b + 2] = 36; sheet.data[b + 3] = 255;
    }
  }
}
for (let i = 0; i < all.length; i++) {
  const id = all[i], cx = (i % COLS) * W, cy = Math.floor(i / COLS) * (H * 2 + LABEL);
  const a = path.join(SHOTS, 'level-' + String(id).padStart(2, '0') + '.png');
  const b = path.join(SHOTS, 'level-' + String(id).padStart(2, '0') + '-30s.png');
  if (fs.existsSync(a)) put(PNG.sync.read(fs.readFileSync(a)), cx, cy + LABEL, W, H);
  if (fs.existsSync(b)) put(PNG.sync.read(fs.readFileSync(b)), cx, cy + LABEL + H, W, H);
  label('L' + id + '  FIRST / ' + AFTER + 'S', cx, cy);
}
fs.writeFileSync(path.join(SHOTS, 'levels-contact-sheet.png'), PNG.sync.write(sheet));
console.log('WROTE docs/screenshots/levels-contact-sheet.png (' + sheet.width + 'x' + sheet.height + ')');
console.log('RED ERRORS', JSON.stringify(redErrors(page.__logs).slice(0, 8)));
await closeAll();
