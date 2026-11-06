import fs from 'node:fs';
import {serve,newContext,openGame,closeAll,shoot,redErrors} from './browser.mjs';
const id=0,report=[];await serve();
try{const ctx=await newContext({viewport:{width:1280,height:720}}),p=await openGame(ctx,{settle:200});await p.bringToFront();
 const held=new Set();
 async function keys(list){for(const k of [...held])if(!list.includes(k)){await p.keyboard.up(k);held.delete(k);}for(const k of list)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}}
 const observe=()=>p.evaluate(()=>window.__tfObserve());
 async function stop(){await keys(['Space']);await p.waitForTimeout(500);await keys([]);}
 async function drive(x,z,r=1.5){const start=Date.now();let reverse=null;while(Date.now()-start<65000){const o=await observe();if(!o.playing)throw Error('Stopped playing '+JSON.stringify(o));const dx=x-o.position.x,dz=z-o.position.z,d=Math.hypot(dx,dz);if(d<r){await stop();return;}
   let yaw=Math.atan2(dx,dz),e=Math.atan2(Math.sin(yaw-o.yaw),Math.cos(yaw-o.yaw));if(reverse===null)reverse=Math.abs(e)>Math.PI/2;if(reverse){yaw+=Math.PI;e=Math.atan2(Math.sin(yaw-o.yaw),Math.cos(yaw-o.yaw));}
   const steer=Math.abs(e)>.065?((e>0)!==reverse?'a':'d'):null;
   if(Math.floor((Date.now()-start)/5000)!==drive.lastLog){drive.lastLog=Math.floor((Date.now()-start)/5000);console.log('[RAN] drive '+JSON.stringify({d,yaw:o.yaw,e,speed:o.speedKmh,x:o.position.x,z:o.position.z,reverse}));}
   const max=id===7&&o.hasDirt?9:d<5?11:Math.abs(e)>.5?12:26;
   await keys(o.speedKmh>max?['Space']:[reverse?'s':'w',...(steer?[steer]:[])]);await p.waitForTimeout(100);
 }await stop();throw Error(`Driving timeout target ${x},${z} actual ${JSON.stringify(await observe())}`);}
 async function hold(k){const before=(await observe()).action.last?.holdEnd||0;await keys([k]);try{await p.waitForFunction(b=>{const o=window.__tfObserve();return !o.action.holding&&(o.action.last?.holdEnd||0)>b;},before,{timeout:7000});}finally{await keys([]);}await p.waitForTimeout(100);}

async function snap(phase){await keys([]);for(const [name,width,height] of [['desktop',1280,720],['phone',390,844]]){await p.setViewportSize({width,height});await p.waitForTimeout(250);await shoot(p,'d-park-'+phase+'-'+name+'.png');}await p.setViewportSize({width:800,height:450});}
try{
await p.locator('[data-a="freeplay"]').click();await p.waitForTimeout(1300);await snap('start');
if(!(await observe()).park)throw Error('Park missing');
if(!process.env.DIG_ONLY){await keys(['w']);await p.waitForFunction(()=>window.__tfObserve().park.rings>=3,null,{timeout:35000});await stop();report.push('[RAN] Three real rings '+JSON.stringify((await observe()).park));await snap('rings');
await drive(0,4025,2);await keys(['w']);await p.waitForFunction(()=>window.__tfObserve().park.bestAir>.12,null,{timeout:25000});await stop();await snap('jump');report.push('[RAN] Real ramp jump '+JSON.stringify((await observe()).park));
await p.locator('#tf-park-respawn').click();await p.waitForTimeout(700);report.push('[RAN] Normal RESPAWN button used after jump to take the open east route, not a QA teleport.');}await drive(70,4075,3);await drive(70,3957,3);await drive(53,3955,2);await stop();await p.keyboard.press('c');await p.mouse.move(430,220);await p.mouse.down();await p.mouse.move(430,340,{steps:12});await p.mouse.up();await snap('dig-before');const before=(await observe()).park;await hold('f');await hold('g');await hold('f');await hold('g');await hold('f');await keys(['s']);await p.waitForTimeout(1600);await stop();const after=(await observe()).park;if(after.digs<=before.digs||after.minHeight>=before.minHeight)throw Error('Dig did not change real heightmap '+JSON.stringify(await observe()));report.push('[RAN] Dig before/after '+JSON.stringify({before,after}));await snap('dig-after');
await p.locator('#tf-park-respawn').click();await p.waitForTimeout(700);if(Math.hypot((await observe()).position.x,(await observe()).position.z-4085)>2)throw Error('Respawn failed');await snap('respawn');
await p.locator('[data-a="park-exit"]').click();await p.locator('#tf-start').waitFor();const errors=redErrors(p.__logs);if(errors.length)throw Error(JSON.stringify(errors));report.push('[RAN] PASS '+(process.env.DIG_ONLY?'dig visual followup':'park real-input rings/jump/dig/respawn/exit')+'; zero own-code errors. No setup shortcuts; portrait is viewport resize.');
}catch(e){report.push('[UNKNOWN] FAIL '+e.stack);await snap('failed');process.exitCode=1;}
}finally{fs.writeFileSync(process.env.DIG_ONLY?'docs/D_VISUAL.txt':'docs/D_WALK.txt',report.join('\n'));console.log(report.join('\n'));await closeAll();}
