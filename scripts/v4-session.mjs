import fs from 'node:fs';
import {serve,newContext,openGame,closeAll,shoot,redErrors} from './browser.mjs';
const report=[];let fail=false;
await serve();
try {
 const ctx=await newContext({viewport:{width:800,height:450}});
 const p=await openGame(ctx,{settle:600});await p.bringToFront();await p.click('.tf-play');await p.waitForTimeout(600);
 await shoot(p,'v4b-session-start.png');
 const start=Date.now();let loops=0,keyHolds=0,retries=0,lastPrint=-1,activeMs=0,playedMs=0,unplannedPauses=0,unfocused=0;let prevElapsed=0;
 while(Date.now()-start<600000) {
   await p.bringToFront();
   const observed=await p.evaluate(()=>({...window.__tfObserve(),focused:document.hasFocus(),visible:document.visibilityState}));
   if(!observed.focused||observed.visible!=='visible')unfocused++;
   if(observed.elapsed>=prevElapsed)playedMs+=(observed.elapsed-prevElapsed)*1000;
   prevElapsed=observed.elapsed;
   const resume=p.locator('#tf-win [data-a="resume"]');
   if(await resume.isVisible()){unplannedPauses++;await resume.click();}
   const retry=p.locator('#tf-win [data-a="retry"]');
   if(await retry.isVisible()) {await retry.click();retries++;}
   if(await p.evaluate(()=>window.__tfObserve().playing)) {
     const activeStart=Date.now();
     const steer=loops%4<2?'a':'d';
     await p.keyboard.down('w');await p.keyboard.down(steer);keyHolds+=2;
     if(loops%3===0){await p.keyboard.down('f');keyHolds++;}
     await p.waitForTimeout(900);
     await p.keyboard.up('w');await p.keyboard.up(steer);await p.keyboard.up('f');
     await p.keyboard.down('Space');keyHolds++;await p.waitForTimeout(350);await p.keyboard.up('Space');
     if(loops%5===0){await p.keyboard.press('c');keyHolds++;}
     activeMs+=Date.now()-activeStart;
   }
   loops++;await p.waitForTimeout(300);
   const minute=Math.floor((Date.now()-start)/60000);
   if(minute!==lastPrint){lastPrint=minute;console.log('[RAN] session minute '+minute+' loops '+loops+' holds '+keyHolds);}
 }
 const seconds=(Date.now()-start)/1000;
 await shoot(p,'v4b-session-end.png');
 const errors=redErrors(p.__logs);
 report.push('[RAN] session '+JSON.stringify({seconds,loops,keyHolds,retries,activeSeconds:activeMs/1000,gameSeconds:playedMs/1000,unplannedPauses,unfocused,errors}));
 report.push('[RAN] '+(seconds>=600&&playedMs>570000&&unplannedPauses===0&&unfocused===0&&errors.length===0?'PASS':'FAIL')+' ten-minute real-input session, zero own-code red errors');
 fail=seconds<600||playedMs<=570000||unplannedPauses>0||unfocused>0||errors.length>0;
} catch(e){fail=true;report.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_SESSION.txt',report.join('\n'));console.log(report.join('\n'));await closeAll();}
process.exitCode=fail?1:0;
