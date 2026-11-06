// Normal URL, fresh storage, keyboard input only. No QA mutation helpers.
import fs from 'node:fs';
import {serve,newContext,openGame,shoot,closeAll,redErrors} from './browser.mjs';
const report=[];
let failures=0;
const check=(name,pass)=>{report.push((pass?'[RAN] PASS ':'[RAN] FAIL ')+name);if(!pass)failures++;};
await serve();
const ctx=await newContext({viewport:{width:800,height:450}});
const page=await openGame(ctx,{settle:800});
try {
 await page.click('.tf-play');
 await page.waitForTimeout(1000);
 const state=await page.evaluate(()=>window.__tfState());
 report.push('[RAN] Fresh PLAY state: '+JSON.stringify(state));
 await shoot(page,'v4-newplayer-start.png');
 const site = state.site;
 async function drive(key, targetX, greater) {
   await page.keyboard.down(key);
   try { await page.waitForFunction(({x,greater})=>{const p=window.__tfQA.qaSite().vehicle;return greater?p.x>=x:p.x<=x;},{x:targetX,greater},{timeout:45000}); }
   finally { await page.keyboard.up(key); }
   await page.keyboard.down('Space');await page.waitForTimeout(600);await page.keyboard.up('Space');
 }
 async function hold(key) {
   await page.keyboard.down(key);
   await page.waitForTimeout(key==='f'?1750:1350);
   await page.keyboard.up(key);
   await page.waitForTimeout(200);
 }
 for(let n=1;n<=3;n++) {
   await drive(n===1?'w':'s',site.pile.x-10,n===1);
   await hold('f');
   report.push('[RAN] Scoop '+n+': '+JSON.stringify(await page.evaluate(()=>window.__tfQA.qaState())));
   check('scoop '+n+' immediate effect',await page.evaluate(()=>{const s=window.__tfQA.qaState();return s.hasDirt && s.lastAction.effect-s.lastAction.holdEnd<=100;}));
   await shoot(page,'v4-pile-'+n+'.png');
   await drive('w',site.truck.x-10,true);
   await hold('g');
   report.push('[RAN] Dump '+n+': '+JSON.stringify(await page.evaluate(()=>window.__tfQA.qaState())));
   check('dump '+n+' counted immediately',await page.evaluate(n=>{const s=window.__tfQA.qaState();return s.loads===n && s.lastAction.effect-s.lastAction.holdEnd<=100;},n));
 }
 await page.waitForTimeout(2500);
 await shoot(page,'v4-result.png');
 check('result shows +265',await page.locator('#tf-coin-count').textContent()==='+265');
 report.push('[RAN] Result text '+await page.locator('#tf-win').textContent());
 await page.locator('[data-a="next"]').click();
 await page.waitForTimeout(2400);
 report.push('[RAN] NEXT '+JSON.stringify(await page.evaluate(()=>window.__tfState())));
 check('NEXT starts L2 unpaused without a window',await page.evaluate(()=>{const s=window.__tfState();return s.job===2&&!s.uiPaused&&!s.modalOpen&&s.timerRunning&&document.querySelector('#tf-win').classList.contains('off');}));
 await shoot(page,'v4-next.png');
 await page.reload(); await page.waitForTimeout(2500);
 check('reload names L2', (await page.locator('#tf-start-level').textContent()).includes('LEVEL 2'));
 await shoot(page,'v4-continue.png');
 report.push('[RAN] Reload '+await page.locator('#tf-start-level').textContent());
 await page.click('.tf-play');await page.waitForTimeout(1500);
 check('CONTINUE starts L2',await page.evaluate(()=>window.__tfState().job===2));
 report.push('[RAN] CONTINUE '+JSON.stringify(await page.evaluate(()=>window.__tfState())));
 report.push('[RAN] Console: '+JSON.stringify(redErrors(page.__logs)));
} catch(e) { failures++;report.push('[UNKNOWN] '+e.stack); }
finally {fs.writeFileSync('docs/V4_NEWPLAYER.txt',report.join('\n'));console.log(report.join('\n')); await closeAll();}

process.exitCode=failures?1:0;
