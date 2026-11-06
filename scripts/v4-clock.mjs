// Browser render scheduling at real 200 ms intervals. Never inject a game dt.
import fs from 'node:fs';
import {serve,newContext,openGame,closeAll,shoot,redErrors} from './browser.mjs';
const out=[];let failures=0;
const check=(name,ok,data)=>{out.push(`[RAN] ${ok?'PASS':'FAIL'} ${name} ${JSON.stringify(data||'')}`);if(!ok)failures++;};
await serve();
try {
 const ctx=await newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{window.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),200);window.cancelAnimationFrame=clearTimeout;});
 const p=await openGame(ctx,{settle:500});await p.click('.tf-play');await p.waitForTimeout(900);
 const start=await p.evaluate(()=>({wall:performance.now(),...window.__tfObserve()}));
 await p.keyboard.down('w');await p.waitForTimeout(2000);await p.keyboard.up('w');await p.waitForTimeout(6000);
 const end=await p.evaluate(()=>({wall:performance.now(),...window.__tfObserve()}));
 const wall=(end.wall-start.wall)/1000,game=end.elapsed-start.elapsed;
 check('clock follows wall time at a five-frame render schedule',Math.abs(wall-game)<0.35,{wall,game,drift:wall-game,frame:end.frame});
 check('physics never takes more than five steps per frame',end.frame.steps<=5,end.frame);
 await shoot(p,'v4b-five-fps-clock.png');
 check('no own-code errors',redErrors(p.__logs).length===0,redErrors(p.__logs));
}catch(e){failures++;out.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_CLOCK.txt',out.join('\n'));console.log(out.join('\n'));await closeAll();}
process.exitCode=failures?1:0;
