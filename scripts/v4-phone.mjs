import fs from 'node:fs';
import {serve,newContext,openGame,shoot,closeAll,redErrors} from './browser.mjs';
const out=[];let failures=0;const check=(n,c,d)=>{out.push(`[RAN] ${c?'PASS':'FAIL'} ${n} ${JSON.stringify(d||'')}`);if(!c)failures++;};
await serve();
try{
 const ctx=await newContext({viewport:{width:440,height:956},touch:true});
 const p=await openGame(ctx,{settle:500});await p.tap('.tf-play');await p.waitForTimeout(900);
 const joy=await p.locator('#tf-joy').boundingBox(),action=await p.locator('.tf-action').boundingBox();
 const cdp=await ctx.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:joy.x+joy.width/2,y:joy.y+12,id:1},{x:action.x+action.width/2,y:action.y+action.height/2,id:2}]});
 await p.waitForTimeout(500);
 const s=await p.evaluate(()=>window.__tfQA.qaState());check('two simultaneous fingers drive and hold',s.fwd&&s.actHolding,s);
 await shoot(p,'v4b-phone-two-finger.png');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);
 const released=await p.evaluate(()=>window.__tfQA.qaState());check('both touches release',!released.fwd&&!released.actHolding);
 await p.tap('#tf-pause');await p.locator('#tf-win [data-a="levels"]').tap();
 await shoot(p,'v4b-phone-picker.png');
 const start=await p.locator('[data-a="start"]').boundingBox();check('phone picker START in viewport',start&&start.y>=0&&start.y+start.height<=956,start);
 check('no own-code errors',redErrors(p.__logs).length===0,redErrors(p.__logs));
}catch(e){failures++;out.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_PHONE.txt',out.join('\n'));console.log(out.join('\n'));await closeAll();}
process.exitCode=failures?1:0;
