import fs from 'node:fs';
import { serve, newContext, openGame, closeAll, shoot, redErrors } from './browser.mjs';
const report=[];let failures=0;
const check=(n,c,data)=>{report.push(`[RAN] ${c?'PASS':'FAIL'} ${n} ${JSON.stringify(data||'')}`);if(!c)failures++;};
await serve();
try {
 const ctx=await newContext({viewport:{width:800,height:450}});
 const p=await openGame(ctx,{settle:500,query:'?qadebug'});
 await p.locator('[data-a="settings"]').click();
 await p.locator('[data-set="quality"][data-v="low"]').click();
 await p.locator('.tf-x').click();
 await p.locator('[data-a="freeplay"]').click();await p.waitForTimeout(1200);
 await p.evaluate(()=>window.__qaLevel.teleport(850,800));await p.waitForTimeout(500);
 report.push('[READ] Setup only: QA teleport to open ground (850,800). All speed is earned with real W; no velocity injection.');
 // Free Play is selected via its real button solely as an open handling area.
 async function run(target,brake) {
   await p.keyboard.down('w');
   await p.waitForFunction(k=>window.__tfObserve().speedKmh>=k,target,{timeout:45000}).catch(async e=>{report.push('[RAN] acceleration stalled '+JSON.stringify(await p.evaluate(()=>window.__tfObserve())));await p.keyboard.up('w');throw e;});
   await p.evaluate(brake=>{
     window.stopSamples=[];
     const event=brake?'keydown':'keyup';
     const listener=e=>{
       if(e.code!==(brake?'Space':'KeyW')) return;
       window.removeEventListener(event,listener);
       const start=performance.now();
       const tick=()=>{const o=window.__tfObserve();window.stopSamples.push({ms:performance.now()-start,speed:o.speedKmh,p:o.position});if(performance.now()-start<2200)requestAnimationFrame(tick);};
       tick();
     };window.addEventListener(event,listener);
   },brake);
   if(brake)await p.keyboard.down('Space');
   await p.keyboard.up('w');await p.waitForTimeout(2400);
   if(brake)await p.keyboard.up('Space');
   return p.evaluate(()=>window.stopSamples);
 }
 const coast=await run(20,false);
 const a=coast.find(s=>s.speed<0.1);const first=coast[0];
 check('20 km/h release stops within 1.2 s',!!a&&a.ms<=1200,{start:first,stop:a,metres:a?Math.hypot(a.p.x-first.p.x,a.p.z-first.p.z):null});
 await shoot(p,'v4b-coast-stop.png');
 await p.evaluate(()=>window.__qaLevel.teleport(850,800));await p.waitForTimeout(500);
 const brake=await run(31.5,true);
 const b=brake.find(s=>s.speed<0.1);
 check('32 km/h brake stops within 1.5 s',!!b&&b.ms<=1500,{start:brake[0],stop:b});
 await shoot(p,'v4b-handling-stop.png');
 check('zero creep after stop',await p.evaluate(()=>window.__tfObserve().speedKmh<0.1),await p.evaluate(()=>window.__tfObserve()));
 // Reverse is measured on the physical chassis, not the clamped speed dial.
 await p.keyboard.down('s');await p.waitForTimeout(8000);await p.keyboard.up('s');
 const reverse=await p.evaluate(()=>window.__tfObserve());
 check('reverse <=14 km/h',reverse.speedKmh<=14.1,reverse.speedKmh);
 check('no own-code errors',redErrors(p.__logs).length===0,redErrors(p.__logs));
 fs.writeFileSync('docs/V4_HANDLING_SAMPLES.json',JSON.stringify({coast,brake},null,2));
} catch(e){failures++;report.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_HANDLING.txt',report.join('\n'));console.log(report.join('\n'));await closeAll();}
process.exitCode=failures?1:0;
