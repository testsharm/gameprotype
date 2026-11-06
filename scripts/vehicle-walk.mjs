import fs from 'node:fs';
import {serve,newContext,openGame,closeAll,shoot,redErrors} from './browser.mjs';
const id=1,report=[];await serve();
try{const ctx=await newContext({viewport:{width:1280,height:720}}),p=await openGame(ctx,{query:'?qadebug&unlockall',settle:200});await p.bringToFront();
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


const art=()=>p.evaluate(()=>window.__tfQA.qaArt());
async function place(x,z,yaw=0){await keys([]);await p.evaluate(v=>window.__tfQA.qaPlace(...v),[x,z,yaw]);await p.waitForTimeout(400);}
async function snap(phase){await keys([]);for(const [name,width,height] of [['desktop',1280,720],['phone',390,844]]){await p.setViewportSize({width,height});await p.waitForTimeout(200);await shoot(p,'e-'+phase+'-'+name+'.png');}await p.setViewportSize({width:800,height:450});}
try{
await p.locator('[data-a="play"]').click();await p.waitForTimeout(600);const a=await art(),types=new Set(a.traffic.map(c=>c.type)),colors=new Set(a.traffic.map(c=>c.color)),pairs=new Set(a.traffic.map(c=>c.type+'/'+c.color));if(types.size!==7||colors.size!==10||pairs.size!==70)throw Error('Fleet combinations wrong '+JSON.stringify(a));report.push('[RAN] Fleet 7 shapes, 10 colors, 70 unique pairs');
const beacon=a.beaconAngle;await p.waitForTimeout(350);if((await art()).beaconAngle===beacon)throw Error('Beacon not rotating');
for(const o of a.solid.practice){const prev=(await art()).solid.hits[o.name]||0;await place(o.x,o.z-o.depth/2-9);await keys(['w']);try{await p.waitForFunction(({name,prev})=>(window.__tfQA.qaArt().solid.hits[name]||0)>prev,{name:o.name,prev},{timeout:18000});}finally{await keys([]);}const state=await observe();if(state.position.z>o.z+o.depth/2)throw Error('Passed through '+o.name);report.push('[RAN] Real W collision '+JSON.stringify({object:o.name,position:state.position,velocity:state.velocity,hits:(await art()).solid.hits}));await stop();await snap('collision-'+o.name);}
const site=await p.evaluate(()=>window.__tfState().site);await place(site.pile.x-8,site.pile.z,Math.PI/2);await hold('f');if(!(await observe()).hasDirt)throw Error('Real scoop failed');await p.keyboard.press('c');await p.mouse.move(430,220);await p.mouse.down();await p.mouse.move(550,280,{steps:10});await p.mouse.up();await p.mouse.wheel(0,-500);await snap('backhoe');
await p.keyboard.press('c');await p.keyboard.press('c');await p.keyboard.press('c');await place(site.truck.x,site.truck.z-11);await p.keyboard.press('c');await p.mouse.move(430,220);await p.mouse.down();await p.mouse.move(430,290,{steps:10});await p.mouse.up();await p.mouse.wheel(0,-300);await snap('bed-before');await hold('g');if((await observe()).loads!==1)throw Error('Real delivery failed');await p.waitForFunction(()=>window.__tfQA.qaArt().truckAngle<-.5,null,{timeout:6000});await snap('bed-tilt');report.push('[RAN] Earned first load; animated bed angle '+(await art()).truckAngle);await p.waitForFunction(()=>Math.abs(window.__tfQA.qaArt().truckAngle)<.01,null,{timeout:15000});await snap('bed-after');
await p.evaluate(()=>window.__tfQA.qaLevel(5));const row=await p.evaluate(()=>window.__tfState().site);await place((row.pile.x+row.truck.x)/2,row.pile.z-62);await p.keyboard.press('c');await p.mouse.move(430,220);await p.mouse.down();await p.mouse.move(430,300,{steps:10});await p.mouse.up();await p.mouse.wheel(0,1500);await snap('traffic-lineup');
await p.evaluate(()=>window.__tfQA.qaMenu());await p.locator('[data-a="garage"]').click();const swatches=await p.locator('[data-a="paint"]').count();if(swatches!==10)throw Error('Expected ten paints, got '+swatches);await snap('garage-paints');
const errors=redErrors(p.__logs);if(errors.length)throw Error(JSON.stringify(errors));report.push('[RAN] PASS E; zero own-code browser errors. QA hooks only positioned the vehicle/selected scenes; W collisions and F/G delivery were real input. No injected velocity, goals, coins or timers. Portrait resized same run.');
}catch(e){report.push('[UNKNOWN] FAIL '+e.stack);await snap('failed');process.exitCode=1;}
}finally{fs.writeFileSync('docs/E_WALK.txt',report.join('\n'));console.log(report.join('\n'));await closeAll();}
