import fs from 'node:fs';
import {serve,newContext,openGame,shoot,closeAll,redErrors,url} from './browser.mjs';
const out=[],shots=[],frames=[];let start=0;
await serve();
try {
 const ctx=await newContext({viewport:{width:1280,height:720}});
 const p=await openGame(ctx,{settle:600});
 const cdp=await ctx.newCDPSession(p);
 async function shot(name,caption,film=false){const path=await shoot(p,'page-'+name+'.png');shots.push({name,caption});if(film)frames.push({path,time:((Date.now()-start)/1000).toFixed(1)+' s — '+caption.split('.')[0]});}
 async function phone(on){await p.setViewportSize(on?{width:390,height:844}:{width:1280,height:720});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:on,maxTouchPoints:5});await p.waitForTimeout(350);}
 await shot('desktop-start','Start screen. No shortcut.');await phone(true);await shot('phone-start','Phone start screen. No shortcut.');await phone(false);
 await p.click('.tf-play');start=Date.now();await shot('desktop-l1-start','Level 1 first playing view. No shortcut.',true);
 await p.waitForTimeout(Math.max(0,5000-(Date.now()-start)));await shot('l1-5s','Level 1 capture requested at five seconds. No shortcut.',true);
 await p.waitForTimeout(Math.max(0,15000-(Date.now()-start)));await shot('l1-15s','Level 1 capture requested at fifteen seconds. No shortcut.',true);
 await phone(true);
 const joy=await p.locator('#tf-joy').boundingBox(),act=await p.locator('.tf-action').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:joy.x+joy.width/2,y:joy.y+10,id:1},{x:act.x+act.width/2,y:act.y+act.height/2,id:2}]});await p.waitForTimeout(350);
 await shot('phone-l1-play','Phone two-finger driving and action hold. No shortcut.');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone(false);
 const site=await p.evaluate(()=>window.__tfState().site);
 async function drive(key,x,greater){await p.keyboard.down(key);try{await p.waitForFunction(({x,greater})=>greater?window.__tfObserve().position.x>=x:window.__tfObserve().position.x<=x,{x,greater},{timeout:45000});}finally{await p.keyboard.up(key);}await p.keyboard.down('Space');await p.waitForTimeout(500);await p.keyboard.up('Space');}
 async function action(key,n){const before=await p.evaluate(()=>window.__tfObserve().action.last?.holdEnd||0);await p.keyboard.down(key);try{if(n===1){await p.waitForTimeout(key==='f'?650:450);await shot(key==='f'?'desktop-l1-scoop':'desktop-l1-dump',key==='f'?'Real SCOOP hold with arm and pile. No shortcut.':'Real DUMP hold beside the truck. No shortcut.',true);}await p.waitForFunction(({before})=>!window.__tfObserve().action.holding&&(window.__tfObserve().action.last?.holdEnd||0)>before,{before},{timeout:10000});}finally{await p.keyboard.up(key);}await p.waitForTimeout(200);}
 for(let n=1;n<=3;n++){await drive(n===1?'w':'s',site.pile.x-10,n===1);await action('f',n);if(n===2)await shot('l1-second-load','Second scoop leaves a small pile. No shortcut.',true);await drive('w',site.truck.x-10,true);await action('g',n);out.push('[RAN] cycle '+n+' '+JSON.stringify(await p.evaluate(()=>window.__tfObserve())));}
 await p.locator('#tf-coin-count').waitFor({timeout:7000});await p.waitForTimeout(800);await shot('desktop-l1-result','Level 1 result earned with real holds. No shortcut.',true);
 await phone(true);await shot('phone-result','Phone result from the same real Level 1 finish; viewport changed, no save shortcut.');await phone(false);
 await p.locator('[data-a="next"]').click();await p.waitForTimeout(250);await shot('desktop-get-ready','GET READY after real NEXT into Level 2. No shortcut.',true);
 await p.waitForTimeout(2200);await p.keyboard.down('w');await p.waitForTimeout(2000);await p.keyboard.up('w');await shot('desktop-l2-play','Level 2 after real driving. No shortcut.');
 await p.keyboard.press('p');await shot('desktop-pause','Pause opened with the P key. No shortcut.');
 await p.locator('#tf-win [data-a="levels"]').click();await shot('desktop-picker','Picker after Level 1 unlocks Level 2. No shortcut.');await phone(true);await shot('phone-picker','Phone picker after the real Level 1 finish. No shortcut.');await phone(false);
 await p.locator('.tf-x').click();await p.keyboard.press('p');await p.locator('#tf-win [data-a="garage"]').click();await shot('desktop-garage','Garage after real Level 1 earnings. No shortcut.');await phone(true);await shot('phone-garage','Phone Garage after real earnings. No shortcut.');await phone(false);
 await p.locator('.tf-x').click();await p.keyboard.press('p');await p.locator('#tf-win [data-a="settings"]').click();await shot('desktop-settings','Settings opened from Pause. No shortcut.');await p.locator('.tf-x').click();
 await p.goto(url('?unlockall'));await p.waitForTimeout(2200);await p.locator('#tf-start [data-a="levels"]').click();await p.locator('[data-a="select"][data-id="3"]').click();await p.locator('[data-a="start"]').click();await p.waitForTimeout(350);await shot('desktop-l3-start','Level 3 start; unlockall used ONLY to select its starting level.');
 await p.goto(url());await p.waitForTimeout(2200);await p.locator('#tf-start [data-a="freeplay"]').click();await p.waitForTimeout(600);await shot('desktop-freeplay','Current Free Play spawn. No shortcut.');await phone(true);await shot('phone-freeplay','Current Free Play on phone. No shortcut.');
 out.push('[RAN] code errors '+JSON.stringify(redErrors(p.__logs)));
 // Requested filmstrip: eight real screenshot frames; labels show wall time.
 const data=frames.slice(0,8).map(f=>({src:'data:image/png;base64,'+fs.readFileSync(f.path).toString('base64'),label:f.time}));
 await p.goto('about:blank');await p.setViewportSize({width:1280,height:480});
 await p.evaluate(async data=>{document.body.style.margin='0';const c=document.createElement('canvas');c.id='film';c.width=1280;c.height=480;document.body.append(c);const g=c.getContext('2d');g.fillStyle='#151d2b';g.fillRect(0,0,1280,480);for(let i=0;i<data.length;i++){const im=new Image();im.src=data[i].src;await im.decode();const x=(i%4)*320,y=Math.floor(i/4)*240;g.drawImage(im,x,y+60,320,180);g.fillStyle='#fde68a';g.font='bold 18px sans-serif';g.fillText(data[i].label.split(' — ')[0],x+6,y+23);g.fillText(['Level 1: first view','Level 1: five seconds','Level 1: fifteen seconds','Real SCOOP hold','Real DUMP hold','Second scoop: smaller pile','Result earned by real inputs','NEXT: Level 2 ready'][i],x+6,y+48);}},data);
 await p.locator('#film').screenshot({path:'docs/screenshots/filmstrip-L1.png'});
 fs.writeFileSync('docs/SCREENSHOT_MANIFEST.json',JSON.stringify(shots,null,2));
}catch(e){out.push('[UNKNOWN] '+e.stack);process.exitCode=1;}
finally{fs.writeFileSync('docs/SCREENSHOT_RUN.txt',out.join('\n'));console.log(out.join('\n'));await closeAll();}
