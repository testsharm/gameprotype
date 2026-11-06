import fs from 'node:fs';
import {serve,newContext,openGame,shoot,closeAll,redErrors} from './browser.mjs';
const out=[];let failures=0;const check=(n,ok,d)=>{out.push(`[RAN] ${ok?'PASS':'FAIL'} ${n} ${JSON.stringify(d||'')}`);if(!ok)failures++;};
await serve();
try {
 const ctx=await newContext({viewport:{width:800,height:450}});
 const p=await openGame(ctx,{query:'?qadebug',settle:500});await p.click('.tf-play');await p.waitForTimeout(500);
 const site=await p.evaluate(()=>window.__tfState().site);
 const x=(site.pile.x+site.truck.x)/2+48,z=(site.pile.z+site.truck.z)/2-24;
 await p.evaluate(({x,z})=>window.__qaLevel.teleport(x,z),{x,z});
 out.push('[READ] Wall test setup only: placed the stationary loader outside the stage shed. The real C key selects orbit; no camera pose is injected.');
 await p.keyboard.press('c');await p.waitForTimeout(1600);
 const camera=await p.evaluate(()=>window.__tfObserve().camera);
 check('shed wall pulls camera in and fades near surfaces',camera.pulledIn&&camera.faded>0&&camera.inside===0,camera);
 await shoot(p,'v4b-camera-wall.png');
 await p.goto('http://127.0.0.1:4179/');await p.waitForTimeout(2400);
 await p.locator('#tf-start [data-a="levels"]').click();
 const next=p.locator('.tf-card.newlevel');
 check('next unfinished card has NEW badge',await next.count()===1 && (await next.textContent()).includes('NEW'));
 check('locked L2 explains finish L1',(await p.locator('[data-a="select"][data-id="2"]').textContent()).includes('FINISH LEVEL 1'));
 await shoot(p,'v4b-picker-new.png');
 await p.locator('.tf-x').click();
 await p.locator('.tf-play').click();await p.waitForTimeout(1000);
 // Component close behaviour: QA only sets up a result window. Do not count
 // this as proof that gameplay completed, or as the newplayer NEXT test.
 await p.evaluate(()=>window.__tfQA.qaWindow('result'));
 await p.locator('.tf-x').click();
 check('result X opens pause, not picker',(await p.locator('#tf-winbody').textContent()).includes('PAUSED') && !(await p.locator('#tf-winbody').textContent()).includes('FINISH LEVEL'));
 await p.locator('[data-a="resume"]').click();
 check('resume closes pause',await p.evaluate(()=>window.__tfObserve().playing));
 check('no own-code errors',redErrors(p.__logs).length===0,redErrors(p.__logs));
}catch(e){failures++;out.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_FOLLOWUP.txt',out.join('\n'));console.log(out.join('\n'));await closeAll();}
process.exitCode=failures?1:0;
