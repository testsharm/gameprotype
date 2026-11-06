import fs from 'node:fs';
import {serve,newContext,openGame,shoot,closeAll,redErrors} from './browser.mjs';
const out=[];
await serve();
try {
 const desktop=await newContext();
 const p=await openGame(desktop,{settle:700});
 await p.click('.tf-play');await p.waitForTimeout(700);
 const z=await p.evaluate(()=>window.__tfState().zoom);
 await p.mouse.move(600,400);await p.mouse.wheel(0,-300);await p.waitForTimeout(600);
 out.push('[RAN] wheel zoom '+z+' -> '+await p.evaluate(()=>window.__tfState().zoom));
 await p.keyboard.down('w');await p.waitForTimeout(300);await shoot(p,'v4-desktop-keycaps.png');await p.keyboard.up('w');
 const mobile=await newContext({viewport:{width:440,height:956},touch:true});
 const m=await openGame(mobile,{settle:600});await m.tap('.tf-play');await m.waitForTimeout(1200);
 const cdp=await mobile.newCDPSession(m);
 const joy=await m.locator('#tf-joy').boundingBox();
 
 const action=await m.locator('.tf-action').boundingBox();
 const points=[{x:joy.x+joy.width/2,y:joy.y+12,id:1},{x:action.x+action.width/2,y:action.y+action.height/2,id:2}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
 await m.waitForTimeout(600);
 out.push('[RAN] phone two fingers '+JSON.stringify(await m.evaluate(()=>window.__tfQA.qaState())));
 await shoot(m,'v4-phone-two-finger.png');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 out.push('[RAN] phone controls released '+JSON.stringify(await m.evaluate(()=>window.__tfQA.qaState())));
 await m.goto('about:blank');
 await p.bringToFront();await p.setViewportSize({width:800,height:450});
 // No timer mutation or accelerated clock: wait for L1's real three minutes.
 await p.waitForFunction(()=>document.querySelector('#tf-winbody')?.textContent.includes('TIME IS UP'),null,{timeout:200000});
 await shoot(p,'v4-time-up.png');
 out.push('[RAN] TIME IS UP reached by waiting without shortcuts');
 out.push('[RAN] code errors '+JSON.stringify([...redErrors(p.__logs),...redErrors(m.__logs)]));
} catch(e) {out.push('[UNKNOWN] '+e.stack);process.exitCode=1;}
finally{fs.writeFileSync('docs/V4_UI.txt',out.join('\n'));console.log(out.join('\n'));await closeAll();}
