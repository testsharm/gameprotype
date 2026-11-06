// TIER D / FINAL PACK EVIDENCE - real Chromium screenshots, one per named file.
import { serve, newContext, openGame, shoot, closeAll, redErrors, url } from './browser.mjs';

await serve();
const ctx = await newContext({ viewport: { width: 1280, height: 720 } });
const page = await openGame(ctx, { settle: 1500, query: '?unlockall&qadebug' });
const shot = n => shoot(page, n);
const win = async k => { await page.evaluate(x => window.__tfQA.qaWindow(x), k); await page.waitForTimeout(400); };
const close = async () => { await page.evaluate(() => window.__tfQA.qaClose()); await page.waitForTimeout(250); };

// 01 start screen, 3D backhoe yard behind the steel menu
await shot('01-start.png');

await page.click('.tf-play'); await page.waitForTimeout(1800);
await shot('02-play-desktop.png');

// 05-09 windows (real clicks open them; QA window hook for the rest)
await win('levels'); await shot('05-levels.png'); await close();
await win('garage'); await shot('06-garage.png'); await close();
await win('settings'); await shot('07-settings.png'); await close();
await win('help'); await shot('08-help.png'); await close();
await page.click('#tf-map'); await page.waitForTimeout(500); await shot('09-map.png'); await close();
await win('result'); await shot('13-result.png'); await close();
await win('fail'); await shot('14-fail.png'); await close();
await win('pause'); await shot('15-pause.png'); await close();

// 10 Free Play (stunt park)
await page.evaluate(() => window.__tfQA.qaFree()); await page.waitForTimeout(2600);
await shot('10-freeplay.png');

// 11 close-ups: cycle camera + zoom in with REAL HUD button clicks
await page.evaluate(() => window.__tfQA.qaLevel(1)); await page.waitForTimeout(1300);
for (let i = 0; i < 3; i++) { await page.click('#tf-zin'); await page.waitForTimeout(160); }
await shot('11-backhoe-closeup.png');
// 11b truck close-up: teleport to the truck with the qadebug browser hook
const site = await page.evaluate(() => window.__qaLevel.site());
await page.evaluate(p => window.__qaLevel.teleport(p.x, p.z + 9),
  { x: site.truck.x, z: site.truck.z });
await page.waitForTimeout(700);
await shot('11b-truck-closeup.png');

// 12 traffic lineup: L5 Rush Hour Lite has crossing traffic
await page.evaluate(() => window.__tfQA.qaLevel(5)); await page.waitForTimeout(1400);
await shot('12-traffic-lineup.png');

// 03 / 04 phone gameplay, real viewport changes
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
await shot('03-play-portrait.png');
await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(600);
await shot('04-play-landscape.png');

// 16 big buttons + 17 swapped sides on a phone (real settings clicks)
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400);
await win('settings');
for (const label of ['BIG BUTTONS', 'LEFT-HANDED']) {
  const row = page.locator('#tf-win .tf-row').filter({ hasText: label }).first();
  if (await row.count()) { await row.locator('.tf-tog').click({ force: true }); await page.waitForTimeout(180); }
}
await close(); await page.waitForTimeout(350);
await shot('17-phone-swap-sides.png');
await win('settings');
// Put sides back to normal so this shot isolates the BIG BUTTONS setting.
const leftRow2 = page.locator('#tf-win .tf-row').filter({ hasText: 'LEFT-HANDED' }).first();
if (await leftRow2.count()) await leftRow2.locator('.tf-tog').click({ force: true });
await close(); await page.waitForTimeout(350);
await shot('16-phone-big-buttons.png');

console.log('RED ERRORS', JSON.stringify(redErrors(page.__logs).slice(0, 8)));
await closeAll();
