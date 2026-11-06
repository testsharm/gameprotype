import fs from 'node:fs';
import { serve,newContext,openGame,closeAll,shoot,redErrors } from './browser.mjs';
const report=[];let failures=0;
const check=(n,c,d)=>{report.push(`[RAN] ${c?'PASS':'FAIL'} ${n} ${JSON.stringify(d||'')}`);if(!c)failures++;};
await serve();
try {
 const ctx=await newContext({viewport:{width:800,height:450}});
 const p=await openGame(ctx,{settle:500});await p.click('.tf-play');await p.waitForTimeout(900);
 const state=await p.evaluate(()=>window.__tfState());
 await p.keyboard.down('w');
 await p.waitForFunction(x=>window.__tfObserve().position.x>x,state.site.pile.x-10,{timeout:30000});
 await p.keyboard.up('w');await p.keyboard.down('Space');await p.waitForTimeout(500);await p.keyboard.up('Space');
 await p.keyboard.down('f');await p.waitForTimeout(700);await p.keyboard.up('f');
 await p.waitForTimeout(450);
 const cancelled=await p.evaluate(()=>window.__tfObserve());
 check('early release cancels dirt and returns arm in 0.3 s',!cancelled.hasDirt&&Math.abs(cancelled.arm[0]+.2)<.001&&Math.abs(cancelled.arm[1]-.2)<.001,cancelled);
 await shoot(p,'v4b-camera-pile-approach.png');
 // Enable TAP TO ACT through the actual Settings menu, not localStorage.
 await p.keyboard.press('p');await p.locator('#tf-win [data-a="settings"]').click();
 await p.locator('[data-set="tapAct"]').click();await p.locator('.tf-x').click();
 await p.locator('.tf-action').click();
 await p.waitForFunction(()=>window.__tfObserve().hasDirt,null,{timeout:5000});
 check('one tap completes a timed action',await p.evaluate(()=>window.__tfObserve().hasDirt),await p.evaluate(()=>window.__tfObserve().action));
 await p.keyboard.down('w');
 await p.waitForFunction(x=>window.__tfObserve().position.x>x,state.site.truck.x-10,{timeout:30000});
 await p.keyboard.up('w');await p.keyboard.down('Space');await p.waitForTimeout(500);await p.keyboard.up('Space');
 await shoot(p,'v4b-camera-past-pile.png');
 check('camera outside opaque geometry at truck approach',await p.evaluate(()=>window.__tfObserve().camera.inside===0),await p.evaluate(()=>window.__tfObserve().camera));
 // Orbit with a real pointer drag around the pile and truck.
 await p.keyboard.press('c');
 await p.mouse.move(500,220);await p.mouse.down();await p.mouse.move(50,220,{steps:24});await p.mouse.up();await p.waitForTimeout(600);
 await shoot(p,'v4b-camera-orbit.png');
 check('orbit clearance',await p.evaluate(()=>window.__tfObserve().camera.inside===0),await p.evaluate(()=>window.__tfObserve().camera));
 // Use ?unlockall ONLY to select another starting level via the picker.
 await p.goto('http://127.0.0.1:4179/?unlockall');await p.waitForTimeout(2200);
 for(const id of [3,6,11,13,15]) {
   if(id===3) await p.locator('#tf-start [data-a="levels"]').click();
   else {await p.keyboard.press('p');await p.locator('#tf-win [data-a="levels"]').click();}
   const chapter=Math.ceil(id/5);
   await p.locator(`[data-a="chapter"][data-ch="${chapter}"]`).click();
   await p.locator(`[data-a="select"][data-id="${id}"]`).click();
   await p.locator('[data-a="start"]').click();await p.waitForTimeout(900);
   await shoot(p,`v4b-clearance-level-${id}.png`);
   const o=await p.evaluate(()=>window.__tfObserve());
   check('L'+id+' upright clear start',o.camera.inside===0&&o.camera.up[1]===1&&o.upDot>0.98,{camera:o.camera,position:o.position,upDot:o.upDot});
 }
 check('no own-code errors',redErrors(p.__logs).length===0,redErrors(p.__logs));
} catch(e){failures++;report.push('[UNKNOWN] '+e.stack);}
finally{fs.writeFileSync('docs/V4_CAMERA_ACTIONS.txt',report.join('\n'));console.log(report.join('\n'));await closeAll();}
process.exitCode=failures?1:0;
