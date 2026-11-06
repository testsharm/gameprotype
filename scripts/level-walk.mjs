// Real-input completion proof. unlockall ONLY selects a starting level.
// No teleport, direct goal completion, injected speed, timer or staged save.
import fs from 'node:fs';
import {serve,newContext,openGame,closeAll,shoot,redErrors} from './browser.mjs';
const from=+(process.env.FROM||1),to=+(process.env.TO||5),report=[],manifest=[];let failures=0;
await serve();
try{
for(let id=from;id<=to;id++){
 const c=await newContext({viewport:{width:1280,height:720}}),p=await openGame(c,{query:'?unlockall',settle:200});await p.bringToFront();
 const held=new Set();
 async function keys(list){for(const k of [...held])if(!list.includes(k)){await p.keyboard.up(k);held.delete(k);}for(const k of list)if(!held.has(k)){await p.keyboard.down(k);held.add(k);}}
 const observe=()=>p.evaluate(()=>window.__tfObserve());
 async function stop(){await keys(['Space']);await p.waitForTimeout(500);await keys([]);}
 async function snap(phase){await keys([]);for(const [name,w,h] of [['desktop',1280,720],['phone',390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(150);const file=`c1-l${id}-${phase}-${name}.png`;await shoot(p,file);manifest.push({id,phase,name,file,shortcut:'unlockall only for initial level selection; real driving and holds, viewport changed for phone'});}await p.setViewportSize({width:800,height:450});}
 async function drive(x,z,r=1.5){const start=Date.now();let reverse=null;while(Date.now()-start<65000){const o=await observe();if(!o.playing)throw Error('Stopped playing '+JSON.stringify(o));const dx=x-o.position.x,dz=z-o.position.z,d=Math.hypot(dx,dz);if(d<r){await stop();return;}
   let yaw=Math.atan2(dx,dz),e=Math.atan2(Math.sin(yaw-o.yaw),Math.cos(yaw-o.yaw));if(reverse===null)reverse=Math.abs(e)>Math.PI/2;if(reverse){yaw+=Math.PI;e=Math.atan2(Math.sin(yaw-o.yaw),Math.cos(yaw-o.yaw));}
   const steer=Math.abs(e)>.065?((e>0)!==reverse?'a':'d'):null;
   if(Math.floor((Date.now()-start)/5000)!==drive.lastLog){drive.lastLog=Math.floor((Date.now()-start)/5000);console.log('[RAN] drive '+JSON.stringify({d,yaw:o.yaw,e,speed:o.speedKmh,x:o.position.x,z:o.position.z,reverse}));}
   const max=d<5?11:Math.abs(e)>.5?12:26;
   await keys(o.speedKmh>max?['Space']:[reverse?'s':'w',...(steer?[steer]:[])]);await p.waitForTimeout(100);
 }await stop();throw Error(`Driving timeout target ${x},${z} actual ${JSON.stringify(await observe())}`);}
 async function hold(k){const before=(await observe()).action.last?.holdEnd||0;await keys([k]);try{await p.waitForFunction(b=>{const o=window.__tfObserve();return !o.action.holding&&(o.action.last?.holdEnd||0)>b;},before,{timeout:7000});}finally{await keys([]);}await p.waitForTimeout(100);}
 try{
 await p.locator('#tf-start [data-a="levels"]').click();await p.locator(`[data-a="select"][data-id="${id}"]`).click();await p.locator('[data-a="start"]').click();await p.waitForTimeout(300);await snap('start');
 const base=await p.evaluate(()=>window.__tfState().site);let mid=false,negative=false;
 while((await observe()).loads<(await observe()).level.total){
  const o=await observe(),g=o.level.goals.find(g=>!g.done);if(!g)break;
  console.log(`[RAN] L${id} goal ${o.loads+1} ${g.kind}`);
  if(g.kind==='gate'){
    if(id===2&&process.env.CONE_NEGATIVE&&!negative){
      await drive(g.x+1,g.z+4.6,1);await stop();await p.waitForTimeout(2000);
      const n=await observe();report.push('[RAN] L2 cone tumble '+JSON.stringify(n.level));
      if(!n.level.coneHits||!n.level.coneAngles.some(a=>a.some(x=>Math.abs(x)>1.3)))throw Error('Cone tumble not proven');
      await keys(['s']);await p.waitForTimeout(2000);await stop();await p.keyboard.press('c');await p.mouse.move(430,220);await p.mouse.down();await p.mouse.move(700,280,{steps:12});await p.mouse.up();await p.waitForTimeout(600);await snap('cone-tumble');await p.keyboard.press('c');await p.keyboard.press('c');await p.keyboard.press('c');negative=true;if(process.env.CONE_VISUAL_ONLY)break;
    }
    await drive(g.x,g.z,1.8);
  }
  else if(g.kind==='park'){await drive(g.x,g.z,2);await stop();await p.waitForTimeout(1300);}
  else{
   const scoop=g.scoop||base.pile;if(id===4)await drive(scoop.x-24,scoop.z,2);await drive(scoop.x-7,scoop.z,1.4);await hold('f');
   if(!(await observe()).hasDirt)throw Error('Scoop rejected '+JSON.stringify(await observe()));
   if(id===4&&!negative){const wrong=o.level.goals.find(q=>q.material!==g.material);await drive(wrong.x-7,wrong.z,1.4);await hold('g');const n=await observe();const msg=await p.locator('body').textContent();report.push('[RAN] L4 wrong-truck '+JSON.stringify({loads:n.loads,hasDirt:n.hasDirt,toast:/WRONG TRUCK/.test(msg)}));if(n.loads!==0||!n.hasDirt||!/WRONG TRUCK/.test(msg))throw Error('Wrong-truck negative not met');await snap('wrong-truck');negative=true;}
   if(id>=4)await drive(g.x-24,g.z,2);await drive(g.x-7,g.z,1.4);await hold('g');
   if((await observe()).loads<=o.loads)throw Error('Dump rejected '+JSON.stringify(await observe()));
  }
  if(!mid&&(await observe()).loads>0){await snap('mid');mid=true;}
 }
 if(process.env.CONE_VISUAL_ONLY){report.push('[RAN] Cone visual-only followup; result not retested in this run');fs.writeFileSync('docs/C1_CONE_VISUAL.txt',report.join('\n'));await p.goto('about:blank');continue;}
 await p.locator('#tf-coin-count').waitFor({timeout:7000});await p.waitForTimeout(600);await snap('result');
 const errors=redErrors(p.__logs);if(errors.length)throw Error(JSON.stringify(errors));report.push(`[RAN] PASS L${id} real-input result `+await p.locator('#tf-win').textContent());console.log(`[RAN] PASS L${id}`);
 }catch(e){failures++;report.push(`[UNKNOWN] FAIL L${id} ${e.stack}`);await stop();await snap('failed');console.log(`[UNKNOWN] FAIL L${id} ${e.message}`);}
 await p.goto('about:blank');
 fs.writeFileSync('docs/'+(process.env.LOG||'C1_WALK')+'.txt',report.join('\n'));fs.writeFileSync('docs/'+(process.env.LOG||'C1_WALK')+'_SHOTS.json',JSON.stringify(manifest,null,2));
}
}finally{await closeAll();}
console.log(report.join('\n'));process.exitCode=failures?1:0;
