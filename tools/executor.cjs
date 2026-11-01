// TerraForm Executor v3
// Paste DeepSeek answers into a web page. Backups, syntax check, import check, live jobs, restore points.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),cp=require('child_process');
const ROOT=process.cwd(),STATE=path.join(ROOT,'.executor'),BK=path.join(STATE,'backups'),PORT=process.env.EXEC_PORT||3002,BOOT=Date.now();
fs.mkdirSync(BK,{recursive:true});
const LOG=[];function log(s){const l=new Date().toISOString().slice(11,19)+' '+s;LOG.push(l);if(LOG.length>300)LOG.shift();console.log(l);}
process.on('uncaughtException',e=>log('UNCAUGHT '+(e&&e.stack||e)));process.on('unhandledRejection',e=>log('UNHANDLED '+(e&&e.stack||e)));
try{const g=path.join(ROOT,'.gitignore'),t=fs.existsSync(g)?fs.readFileSync(g,'utf8'):'';if(!/^\.executor\/?$/m.test(t))fs.appendFileSync(g,(t&&!t.endsWith('\n')?'\n':'')+'.executor/\n.executor.log\n.vite.log\n.preview.log\n');}catch(e){}

function rel(p){return path.relative(ROOT,p).split(path.sep).join('/');}
function safe(p){
  const r=path.resolve(ROOT,p),q=rel(r);
  if(!q||q.startsWith('..')||path.isAbsolute(q)||/^(\.git|\.executor|node_modules)(\/|$)/.test(q))throw new Error('Blocked path: '+p);
  return r;
}
const GENV=Object.assign({},process.env,{GIT_TERMINAL_PROMPT:'0'});
function run(cmd,args,t){return new Promise(res=>{cp.execFile(cmd,args,{cwd:ROOT,timeout:t||120000,maxBuffer:16e6,env:GENV},(err,so,se)=>res({ok:!err,out:(so||'')+(se||'')}));});}
function walk(dir,out){
  for(const n of fs.readdirSync(dir)){
    if(['node_modules','.git','.executor','dist'].includes(n))continue;
    const f=path.join(dir,n),s=fs.statSync(f);
    if(s.isDirectory())walk(f,out);else out.push({path:rel(f),size:s.size,mtime:s.mtimeMs});
  }
  return out;
}
function listFiles(){
  const out=[];
  for(const f of ['index.html','package.json','vite.config.js']){const p=path.join(ROOT,f);if(fs.existsSync(p)){const s=fs.statSync(p);out.push({path:f,size:s.size,mtime:s.mtimeMs});}}
  const src=path.join(ROOT,'src');if(fs.existsSync(src))walk(src,out);
  return out.sort((a,b)=>a.path.localeCompare(b.path));
}
function dirSize(d){let s=0,n=0;for(const x of fs.readdirSync(d)){const f=path.join(d,x),st=fs.statSync(f);if(st.isDirectory()){const r=dirSize(f);s+=r.s;n+=r.n;}else{s+=st.size;n++;}}return{s,n};}

// ---------- live jobs (build, save, check) ----------
const jobs=new Map();let jobSeq=0;
function newJob(){const j={id:'j'+(++jobSeq),log:[],done:false,ok:null,started:Date.now(),ended:0,kids:[],cancelled:false,
  say(s){String(s).split(/\r|\n/).map(x=>x.trimEnd()).filter(Boolean).forEach(l=>{const p=(l.match(/^([A-Za-z ]+):\s+\d+%/)||[])[1],q=j.log.length-1;if(p&&q>=0&&j.log[q].startsWith(p+':'))j.log[q]=l;else if(j.log[q]!==l)j.log.push(l);if(j.log.length>400)j.log.shift();});}};jobs.set(j.id,j);return j;}
function live(j,cmd,args,ms){return new Promise(res=>{
  const k=cp.spawn(cmd,args,{cwd:ROOT,env:GENV,detached:true});let out='',dead=false,buf='';
  const kill=()=>{try{process.kill(-k.pid,'SIGKILL');}catch(e){try{k.kill('SIGKILL');}catch(e2){}}};j.kids.push({kill});
  const t=setTimeout(()=>{dead=true;kill();j.say('TIMEOUT: stopped after '+Math.round(ms/1000)+' seconds.');},ms);
  const hb=setInterval(()=>j.say('...still working ('+Math.round((Date.now()-j.started)/1000)+' s)'),8000);
  const on=d=>{const s=d.toString();out+=s;buf+=s;const parts=buf.split(/\r|\n/);buf=parts.pop();j.say(parts.join('\n'));};k.stdout.on('data',on);k.stderr.on('data',on);
  const end=ok=>{clearTimeout(t);clearInterval(hb);if(buf){j.say(buf);buf='';}res({ok:ok&&!dead&&!j.cancelled,out});};
  k.on('error',e=>{j.say('Could not start '+cmd+': '+e.message);end(false);});k.on('close',c=>end(c===0));});}
function jobView(j){return{id:j.id,log:j.log,done:j.done,ok:j.ok,elapsed:Math.round(((j.done?j.ended:Date.now())-j.started)/1000)};}

async function jobBuild(j){
  j.say('Building the game. Usually 10 to 60 seconds.');
  const r=await live(j,'npm',['run','build'],240000);
  if(!r.ok){if(!j.cancelled)j.say('BUILD FAILED. Send the red text above to Claude.');j.ok=false;return;}
  const dist=path.join(ROOT,'dist');
  if(fs.existsSync(dist)){const z=dirSize(dist),mb=z.s/1048576;j.say('BUILD OK. Size: '+mb.toFixed(2)+' MB in '+z.n+' files.');j.say('CrazyGames: 50 MB limit '+(mb<=50?'OK':'TOO BIG')+', 20 MB for mobile homepage '+(mb<=20?'OK':'TOO BIG')+', 1500 files '+(z.n<=1500?'OK':'TOO MANY')+'.');}
  j.ok=true;
}
async function jobSave(j,msg){
  j.say('STEP 1 of 3: collecting your changes...');
  let r=await live(j,'git',['add','-A'],90000);if(!r.ok){j.ok=false;return;}
  const c=await run('git',['diff','--cached','--name-only'],20000),n=c.out.split('\n').filter(Boolean);
  j.say(n.length+' changed file(s) to save.');
  if(n.length>800){j.say('STOP: '+n.length+' files is too many. Something huge (like node_modules) is included. Nothing was saved.');await run('git',['reset','-q'],20000);j.ok=false;return;}
  j.say('STEP 2 of 3: making the snapshot (commit)...');
  r=await live(j,'git',['commit','-m',msg||('Backup '+new Date().toISOString().slice(0,16).replace('T',' '))],60000);
  if(!r.ok&&!/nothing to commit/i.test(r.out)){j.ok=false;return;}
  j.say('STEP 3 of 3: uploading to GitHub. Usually 5 to 60 seconds.');
  r=await live(j,'git',['push','--progress'],240000);
  if(!r.ok&&/no upstream|set-upstream/i.test(r.out)){j.say('Setting up the GitHub link, trying again...');r=await live(j,'git',['push','-u','origin','HEAD','--progress'],240000);}
  if(!r.ok){j.say('PUSH FAILED. Send the text above to Claude. Your work is still safe on this computer.');j.ok=false;return;}
  j.say('DONE: saved to GitHub in '+Math.round((Date.now()-j.started)/1000)+' seconds.');j.ok=true;
}
// exports of a JS source text
function exportsOf(t){
  const names=new Set();let def=/export\s+default\b/.test(t);
  let m,re=/export\s+(?:async\s+)?(?:class|function\*?|const|let|var)\s+([A-Za-z_$][\w$]*)/g;while((m=re.exec(t)))names.add(m[1]);
  re=/export\s*\{([^}]*)\}/g;while((m=re.exec(t)))m[1].split(',').forEach(p=>{const x=p.trim().split(/\s+as\s+/).pop().trim();if(x==='default')def=true;else if(x)names.add(x);});
  return{names,def};
}
async function jobCheck(j){
  const files=listFiles().filter(f=>/^src\/.*\.js$/.test(f.path)||f.path==='vite.config.js');
  j.say('Checking '+files.length+' files for syntax errors and broken imports...');
  let problems=0;
  for(const f of files){
    const full=path.join(ROOT,f.path),text=fs.readFileSync(full,'utf8');
    const e=await syntax(full,text);if(e){problems++;j.say('SYNTAX ERROR in '+e);continue;}
    const re=/import\s+([^'";]*?)\s+from\s+['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g;let m;
    while((m=re.exec(text))){
      const spec=m[2]||m[3]||m[4],clause=(m[1]||'').trim(),base=path.resolve(path.dirname(full),spec);
      const target=[base,base+'.js',path.join(base,'index.js')].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());
      if(!target){problems++;j.say('BROKEN IMPORT: '+f.path+' imports "'+spec+'" but that file does not exist.');continue;}
      if(!/\.js$/.test(target)||!clause)continue;
      const ex=exportsOf(fs.readFileSync(target,'utf8')),tn=rel(target);
      const dm=clause.match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/),nm=clause.match(/\{([^}]*)\}/);
      if(dm&&!ex.def){problems++;j.say('WRONG IMPORT: '+f.path+' uses "import '+dm[1]+' from" but '+tn+' has no "export default". It exports: '+([...ex.names].join(', ')||'nothing')+'. Fix: use import { '+dm[1]+' } from ...');}
      if(nm)nm[1].split(',').map(p=>p.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean).forEach(n=>{if(!ex.names.has(n)){problems++;j.say('WRONG IMPORT: '+f.path+' imports { '+n+' } from '+tn+' but that file does not export it. '+(ex.def?'It has "export default" so use: import '+n+' from ...':'It exports: '+([...ex.names].join(', ')||'nothing')));}});
    }
  }
  if(problems){j.say('RESULT: '+problems+' problem(s) found. Send this text to Claude.');j.ok=false;}else{j.say('RESULT: all '+files.length+' files OK. No syntax errors, no broken imports.');j.ok=true;}
}

// ---------- parsing ----------
function parse(text){
  text=text.replace(/\r\n/g,'\n');
  const heads=(text.match(/^@@@ (FILE|EDIT) .+ @@@$/gm)||[]).length;
  const ops=[],re=/^@@@ (FILE|EDIT) (.+?) @@@\n([\s\S]*?)\n@@@ END @@@/gm;let m;
  while((m=re.exec(text))){
    const o={kind:m[1],path:m[2].trim(),body:m[3]};
    if(o.kind==='EDIT'){
      o.pairs=[];const pr=/--- FIND ---\n([\s\S]*?)\n--- REPLACE ---(?:\n([\s\S]*?))?(?=\n--- FIND ---\n|$)/g;let k;
      while((k=pr.exec(o.body)))o.pairs.push({find:k[1],replace:k[2]||''});
      if(!o.pairs.length)throw new Error('EDIT block for '+o.path+' has no FIND/REPLACE pairs');
    }
    ops.push(o);
  }
  if(ops.length!==heads)throw new Error('Incomplete answer: found '+heads+' block start(s) but only '+ops.length+' with an END line. DeepSeek probably stopped early. Ask it to "continue", or resend that block.');
  return ops;
}
const lines=s=>s===null?0:s.split('\n').length;
function plan(ops,force){
  const cur=new Map(),log=[],get=f=>cur.has(f)?cur.get(f):(fs.existsSync(f)?fs.readFileSync(f,'utf8'):null);
  for(const o of ops){
    const full=safe(o.path),old=get(full);
    if(o.kind==='FILE'){
      const nw=o.body+'\n';
      if(old!==null&&!force&&old.length>2000&&nw.length<old.length*0.5)throw new Error(o.path+' would shrink from '+old.length+' to '+nw.length+' characters. Looks cut off. Tick "allow big shrink" only if that is intended.');
      log.push((old===null?'CREATE    ':'OVERWRITE ')+o.path+'  ('+(old===null?'':lines(old)+' -> ')+lines(nw)+' lines)');cur.set(full,nw);
    }else{
      if(old===null)throw new Error('Cannot edit, file not found: '+o.path);
      let c=old;
      o.pairs.forEach((p,i)=>{
        const n=c.split(p.find).length-1;
        if(n!==1)throw new Error('EDIT '+(i+1)+' in '+o.path+': the FIND text was found '+n+' times (must be exactly 1). First line: '+p.find.split('\n')[0].slice(0,80));
        c=c.replace(p.find,()=>p.replace);
      });
      log.push('EDIT      '+o.path+'  ('+o.pairs.length+' change'+(o.pairs.length>1?'s':'')+', '+lines(old)+' -> '+lines(c)+' lines)');cur.set(full,c);
    }
  }
  return {cur,log};
}
async function syntax(full,content){
  const ext=path.extname(full);
  if(ext==='.json'){try{JSON.parse(content);return null;}catch(e){return rel(full)+': '+e.message;}}
  if(!['.js','.mjs','.cjs'].includes(ext))return null;
  const tmp=path.join(os.tmpdir(),'chk_'+Date.now()+Math.random().toString(36).slice(2)+(ext==='.cjs'?'.cjs':'.mjs'));
  fs.writeFileSync(tmp,content);const r=await run('node',['--check',tmp],20000);fs.unlinkSync(tmp);
  return r.ok?null:rel(full)+':\n'+r.out.split(tmp).join(path.basename(full)).split('\n').slice(0,8).join('\n');
}

// ---------- snapshots: apply / undo / restore ----------
function snapshot(absFiles,label){
  const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+Math.random().toString(36).slice(2,5),dir=path.join(BK,id),man={id,time:Date.now(),label:label||'',files:[],undone:false};
  fs.mkdirSync(dir,{recursive:true});
  for(const f of absFiles){const ex=fs.existsSync(f);man.files.push({path:rel(f),existed:ex});if(ex){const d=path.join(dir,'files',rel(f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(f,d);}}
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(man));return id;
}
function restore(dir,man){
  const out=[];
  for(const f of man.files){
    const full=safe(f.path);
    if(f.existed){fs.mkdirSync(path.dirname(full),{recursive:true});fs.copyFileSync(path.join(BK,dir,'files',f.path),full);out.push('RESTORED '+f.path);}
    else if(fs.existsSync(full)){fs.unlinkSync(full);out.push('REMOVED  '+f.path);}
  }
  return out;
}
function manifests(){
  const out=[];for(const d of fs.readdirSync(BK).sort().reverse()){const mp=path.join(BK,d,'manifest.json');if(fs.existsSync(mp)){try{out.push(JSON.parse(fs.readFileSync(mp,'utf8')));}catch(e){}}}return out;
}
async function apply(text,dry,force){
  const ops=parse(text);
  if(!ops.length)throw new Error('No blocks found. Expected: @@@ FILE path @@@ ... @@@ END @@@');
  const {cur,log}=plan(ops,force);
  if(dry)return{ok:true,log:['PREVIEW (nothing written yet). Click Apply to write these changes:'].concat(log)};
  const errs=[];
  for(const [f,c] of cur){const e=await syntax(f,c);if(e)errs.push(e);}
  if(errs.length)return{ok:false,log:['REFUSED: the new code has syntax errors. Nothing was changed.'].concat(errs)};
  const id=snapshot([...cur.keys()],'apply');
  for(const [f,c] of cur){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,'utf8');}
  log0('APPLIED '+id+' ('+cur.size+' files)');
  return{ok:true,log:['APPLIED. Backup id: '+id].concat(log,['Syntax check passed.','NEXT: reload the game tab and test it. If it works, open tab 4 and click "Game works". If not, click "Undo last apply".'])};
}
function log0(s){log(s);}
function undo(){
  for(const man of manifests()){
    if(man.undone)continue;
    const out=restore(man.id,man);man.undone=true;fs.writeFileSync(path.join(BK,man.id,'manifest.json'),JSON.stringify(man));
    log('UNDO '+man.id);return{ok:true,log:['UNDID backup '+man.id].concat(out)};
  }
  return{ok:false,log:['Nothing to undo.']};
}
function restoreTo(id){
  const mp=path.join(BK,String(id).replace(/[^\w.-]/g,''),'manifest.json');
  if(!fs.existsSync(mp))return{ok:false,log:['Restore point not found: '+id]};
  const man=JSON.parse(fs.readFileSync(mp,'utf8'));
  const safety=snapshot(man.files.map(f=>safe(f.path)),'before-restore');
  const out=restore(man.id,man);log('RESTORE '+id);
  return{ok:true,log:['Went back to the state from BEFORE apply '+id,'A safety copy of what you had was saved as '+safety+' (restore that to come back).'].concat(out)};
}

// ---------- status ----------
const GROUPS=[
 ['Core game',[['Game loop','src/main.js'],['City and world','src/core/World.js'],['JCB and physics','src/vehicle/Vehicle.js'],['Cameras','src/core/CameraManager.js'],['Old audio','src/audio/AudioManager.js'],['QA tool','src/core/QAManager.js']]],
 ['Built earlier',[['Scoop/dump effects','src/gameplay/JobEffects.js'],['Guide arrow and tutorial','src/gameplay/Guidance.js'],['Job timer logic','src/gameplay/JobManager.js'],['3-second dig animation','src/vehicle/DigAnimator.js'],['Solid traffic','src/core/TrafficPhysics.js'],['New HUD','src/ui/GameUI.js'],['Music and ambience','src/audio/Music.js'],['Sounds (SoundFX)','src/audio/SoundFX.js'],['Sounds (Sfx2)','src/audio/Sfx2.js'],['Dig sounds','src/audio/DigSound.js']]],
 ['Planned (5 prompts)',[['CrazyGames SDK, ads, save, loading','src/core/Portal.js'],['Mobile controls','src/ui/MobileControls.js'],['5 levels and menu','src/gameplay/LevelSystem.js'],['Obstacle course','src/gameplay/SkillCourse.js'],['Signs, props, speed feel','src/core/WorldPolish.js']]]
];
async function status(){
  const files=listFiles(),texts={};
  for(const f of files)if(/\.(js|html)$/.test(f.path))texts[f.path]=fs.readFileSync(path.join(ROOT,f.path),'utf8');
  let done=0,total=0;
  const groups=GROUPS.map(([g,items])=>({group:g,items:items.map(([label,file])=>{
    let p=file;if(!files.find(x=>x.path===p)){const alt=files.find(x=>path.basename(x.path)===path.basename(file));p=alt?alt.path:null;}
    const base=path.basename(file,'.js');let conn=false;
    if(p){conn=p==='src/main.js'||Object.keys(texts).some(k=>k!==p&&new RegExp("[/']"+base+"(\\.js)?['\"]").test(texts[k]));}
    total++;if(p&&conn)done++;
    return{label,file:p||file,exists:!!p,connected:conn};
  })}));
  const git={};
  const b=await run('git',['rev-parse','--abbrev-ref','HEAD'],8000);git.branch=b.ok?b.out.trim():'(no git)';
  const s=await run('git',['status','--porcelain'],8000);git.uncommitted=s.ok?s.out.split('\n').filter(Boolean).length:null;
  const u=await run('git',['rev-list','--count','@{u}..HEAD'],8000);git.unpushed=u.ok?parseInt(u.out):null;
  const lg=await run('git',['log','-1','--format=%cr: %s'],8000);git.last=lg.ok?lg.out.trim():'';
  const history=manifests().slice(0,15).map(m=>({id:m.id,label:m.label||'',time:m.time,files:m.files.map(f=>f.path),undone:m.undone}));
  return{groups,done,total,git,history};
}

// ---------- web page ----------
const PAGE=String.raw`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Executor</title>
<style>
body{margin:0;font:14px system-ui;background:#0f172a;color:#e5e7eb}#app{max-width:1000px;margin:auto;padding:16px}
h1{font-size:18px;margin:0 0 10px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}h3{margin:16px 0 6px;font-size:15px}
nav{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
button{background:#1e293b;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:9px 14px;cursor:pointer;font:inherit}
button:hover{background:#334155}button.on,button.pri{background:#d97706;border-color:#d97706;color:#fff}button:disabled{opacity:.5}
textarea{width:100%;height:280px;box-sizing:border-box;background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:10px;font:12px ui-monospace,monospace}
pre{background:#020617;border:1px solid #334155;border-radius:8px;padding:10px;white-space:pre-wrap;max-height:380px;overflow:auto;font:12px ui-monospace,monospace}
section{display:none}section.on{display:block}.row{display:flex;gap:6px;margin:8px 0;flex-wrap:wrap;align-items:center}
.it{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #1e293b}.ok{color:#4ade80}.warn{color:#fbbf24}.bad{color:#f87171}
.bar{height:10px;background:#1e293b;border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;background:#d97706}
.chip{background:#0f2a1d;border-color:#166534}.badge{padding:4px 10px;border-radius:20px;background:#1e293b;font-weight:700}.sp{animation:bl 1s infinite}@keyframes bl{50%{opacity:.35}}
.dot{display:inline-block;width:11px;height:11px;border-radius:50%;background:#64748b;margin-right:6px}.dot.good{background:#4ade80}.dot.bad{background:#f87171}small{color:#94a3b8}
input[type=text]{background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:9px;flex:1;min-width:160px}
</style><div id=app><h1>TerraForm Executor <span id=conn><i id=dot class=dot></i><small id=dt>checking...</small></span></h1>
<nav><button data-t=apply class=on>1. Apply</button><button data-t=status>2. Status</button><button data-t=files>3. Files</button><button data-t=ship>4. Check, Build, Save</button></nav>
<section id=apply class=on><p>Paste the answer from DeepSeek here. Then click Preview. If it looks right, click Apply.</p><textarea id=inp placeholder="@@@ FILE src/example.js @@@"></textarea>
<div class=row><label><input type=checkbox id=force> allow a file to shrink a lot</label></div>
<div class=row><button id=pst>Paste from clipboard</button><button id=prev>Preview</button><button id=go class=pri>Apply</button><button id=undo>Undo last apply</button><button id=rules>Copy rules for DeepSeek</button><button id=clr>Clear</button></div><pre id=out>Ready.</pre></section>
<section id=status><div class=row><button id=rs>Refresh</button></div><div id=st>Loading...</div></section>
<section id=files><div class=row><input type=text id=ff placeholder="Filter files (type part of a name)"><button id=cs class=pri>Copy selected</button></div><p><small>Tick the files DeepSeek needs to see, then click Copy selected. Or use the Copy button on one file.</small></p><div id=fl></div></section>
<section id=ship>
<h3>A. Check all files (syntax and broken imports)</h3><div class=row><button id=ck class=pri>Check project</button></div>
<h3>B. Check that the game builds, and its size</h3><div class=row><button id=bd class=pri>Run build check</button></div>
<h3>C. Save a backup to GitHub (one click, no typing)</h3>
<div class=row><button class=chip data-m="Backup before changes">Before changes</button><button class=chip data-m="Backup: game works">Game works</button><button class=chip data-m="Backup after fix">After a fix</button><button class=chip data-m="">Just save</button></div>
<div class=row><span id=jb class=badge>Idle</span><b id=jt></b><button id=jc style="display:none">Cancel</button></div><pre id=jo>Nothing running yet. Click a button above. You will see live steps and a seconds counter here.</pre>
<h3>D. Problems with the Executor itself</h3><div class=row><button id=tc>Test connection</button><button id=sl>Show server log</button></div><pre id=dg>Not run yet.</pre></section></div>
<script>
const $=s=>document.querySelector(s);
const RULES=["Reply ONLY with blocks in this exact format. No explanations.","","To CREATE or fully REPLACE a file (give the COMPLETE file, never abbreviate):","@@@ FILE path/to/file.js @@@","(complete file)","@@@ END @@@","","To make a SMALL change (FIND text must be copied exactly from my file and appear exactly once):","@@@ EDIT path/to/file.js @@@","--- FIND ---","(exact old text)","--- REPLACE ---","(new text)","@@@ END @@@","","Rules: never write '...' or 'rest of code'. Several blocks are allowed. If you run out of space, stop after a finished block and write CONTINUE."].join("\n");
async function api(p,b,ms){const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms||25000);try{const r=await fetch(p,b===undefined?{signal:c.signal}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b),signal:c.signal});return await r.json();}catch(e){const m=e.name==="AbortError"?"No answer from the Executor after "+Math.round((ms||25000)/1000)+" seconds. Look at the dot at the top. If it is red, restart the Executor.":"Cannot reach the Executor: "+e.message;return{ok:false,error:m,log:["ERROR: "+m]};}finally{clearTimeout(tm);}}
function show(el,j,t0){let t=(j.log||[j.error||"error"]).join("\n");if(t0)t+="\n("+((Date.now()-t0)/1000).toFixed(1)+" s)";el.textContent=t;el.style.borderColor=j.ok===false||j.error?"#f87171":"#4ade80";}
async function copy(t){try{await navigator.clipboard.writeText(t);}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();}return true;}
function up(s){return s<90?Math.round(s)+" s":Math.round(s/60)+" min";}
async function beat(){const t=Date.now(),c=new AbortController();setTimeout(()=>c.abort(),2500);try{const r=await fetch("/health",{signal:c.signal}),j=await r.json();$("#dot").className="dot good";$("#dt").textContent="Connected, "+(Date.now()-t)+" ms, running "+up(j.uptime);}catch(e){$("#dot").className="dot bad";$("#dt").textContent="NOT RESPONDING. Restart the Executor with the big command.";}}
setInterval(beat,3000);beat();
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.querySelectorAll("section").forEach(s=>s.classList.remove("on"));$("#"+b.dataset.t).classList.add("on");if(b.dataset.t=="status")loadStatus();if(b.dataset.t=="files")loadFiles();});
const run=async dry=>{const t0=Date.now();$("#out").textContent=dry?"Checking your paste...":"Applying...";$("#out").style.borderColor="#fbbf24";show($("#out"),await api("/api/apply",{text:$("#inp").value,dry,force:$("#force").checked}),t0);};
$("#pst").onclick=async()=>{try{$("#inp").value=await navigator.clipboard.readText();$("#out").textContent="Pasted "+$("#inp").value.length+" characters. Now click Preview.";}catch(e){$("#out").textContent="The browser blocked it. Click inside the big box and press Ctrl+V instead.";}};
$("#prev").onclick=()=>run(true);$("#go").onclick=()=>run(false);$("#clr").onclick=()=>{$("#inp").value="";};
$("#undo").onclick=async()=>show($("#out"),await api("/api/undo",{}));
$("#rules").onclick=async()=>{await copy(RULES);$("#out").textContent="Rules copied. Paste them at the start of your DeepSeek message.";};
async function restoreSnap(id){if(!confirm("Go back to the state from before this apply?"))return;const j=await api("/api/restore",{id});alert(j.log.join("\n"));loadStatus();}
async function loadStatus(){
  $("#st").textContent="Loading...";const s=await api("/api/status",{});if(!s.groups){$("#st").textContent=(s.log||["error"]).join("\n");return;}
  const pct=Math.round(100*s.done/s.total);let h='<p><b>'+s.done+' of '+s.total+' features built and connected ('+pct+'%)</b></p><div class=bar><i style="width:'+pct+'%"></i></div>';
  s.groups.forEach(g=>{h+='<h3>'+g.group+'</h3>';g.items.forEach(i=>{const c=!i.exists?'bad':i.connected?'ok':'warn';const t=!i.exists?'NOT BUILT':i.connected?'CONNECTED':'BUILT, NOT CONNECTED';h+='<div class=it><span>'+i.label+' <small>'+i.file+'</small></span><b class='+c+'>'+t+'</b></div>';});});
  const g=s.git;h+='<h3>GitHub safety</h3><div class=it><span>Branch</span><b>'+g.branch+'</b></div><div class=it><span>Last save</span><b>'+(g.last||"none")+'</b></div><div class=it><span>Changes not saved yet</span><b class='+(g.uncommitted?'warn':'ok')+'>'+g.uncommitted+'</b></div><div class=it><span>Saved here but not uploaded</span><b class='+(g.unpushed?'warn':'ok')+'>'+(g.unpushed===null?'unknown':g.unpushed)+'</b></div>';
  h+='<h3>Restore points (every Apply makes one)</h3>';
  h+=s.history.map(x=>'<div class=it><span>'+new Date(x.time).toLocaleString()+' <small>'+x.files.slice(0,3).join(", ")+(x.files.length>3?" +"+(x.files.length-3)+" more":"")+(x.undone?" - undone":"")+'</small></span><button onclick="restoreSnap(\''+x.id+'\')">Go back to before this</button></div>').join('')||'<div class=it>None yet</div>';
  $("#st").innerHTML=h;}
$("#rs").onclick=loadStatus;
let FILES=[];
function drawFiles(){const q=$("#ff").value.toLowerCase();$("#fl").innerHTML="";FILES.filter(x=>x.path.toLowerCase().includes(q)).forEach(x=>{const d=document.createElement("div");d.className="it";const l=document.createElement("label");const cb=document.createElement("input");cb.type="checkbox";cb.dataset.p=x.path;l.appendChild(cb);l.appendChild(document.createTextNode(" "+x.path+" "));const sm=document.createElement("small");sm.textContent=(x.size/1024).toFixed(1)+" KB";l.appendChild(sm);d.appendChild(l);const b=document.createElement("button");b.textContent="Copy";b.onclick=async()=>{await copy(await pack([x.path]));b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1500);};d.appendChild(b);$("#fl").appendChild(d);});}
async function pack(paths){let o="";for(const p of paths){const r=await api("/api/file",{path:p});o+="@@@ FILE "+p+" @@@\n"+(r.content||"").replace(/\n$/,"")+"\n@@@ END @@@\n\n";}return o.trim();}
async function loadFiles(){const f=await api("/api/files",{});FILES=f.files||[];drawFiles();}
$("#ff").oninput=drawFiles;
$("#cs").onclick=async()=>{const p=[...document.querySelectorAll("#fl input:checked")].map(x=>x.dataset.p);if(!p.length){alert("Tick at least one file first.");return;}await copy(await pack(p));$("#cs").textContent="Copied "+p.length+" file(s)";setTimeout(()=>$("#cs").textContent="Copy selected",2000);};
let curJob=null;
async function watch(id){
  curJob=id;let miss=0;
  for(;;){
    const j=await api("/api/job",{id},6000);
    if(j.error){if(++miss>5){$("#jb").textContent="LOST CONNECTION";$("#jb").className="badge bad";$("#jo").textContent+="\nThe Executor stopped or restarted. Start it again with the big command.";return;}await new Promise(r=>setTimeout(r,1000));continue;}
    miss=0;if(j.none)return;
    $("#jt").textContent=j.elapsed+" s";$("#jb").textContent=j.done?(j.ok?"DONE":"FAILED"):"WORKING...";$("#jb").className="badge "+(j.done?(j.ok?"ok":"bad"):"warn sp");
    $("#jo").textContent=j.log.join("\n");$("#jo").style.borderColor=j.done?(j.ok?"#4ade80":"#f87171"):"#fbbf24";$("#jo").scrollTop=1e9;$("#jc").style.display=j.done?"none":"";
    if(j.done)return;await new Promise(r=>setTimeout(r,600));
  }
}
async function startJob(kind,msg){$("#jo").textContent="Starting...";const r=await api("/api/start",{kind,msg},8000);if(r.error){$("#jo").textContent=r.error;return;}watch(r.id);}
$("#ck").onclick=()=>startJob("check");$("#bd").onclick=()=>startJob("build");
document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>startJob("save",c.dataset.m));
$("#jc").onclick=()=>api("/api/cancel",{id:curJob});
$("#tc").onclick=async()=>{$("#dg").textContent="Sending a 200 KB test message...";const t0=Date.now(),r=await api("/api/ping",{data:"x".repeat(200000)},10000);$("#dg").textContent=r.ok?"OK. The Executor received "+r.bytes+" bytes in "+(Date.now()-t0)+" ms. Connection is fine.":(r.log||[r.error]).join("\n");};
$("#sl").onclick=async()=>{const r=await api("/api/log",{});$("#dg").textContent=(r.lines||r.log||[]).join("\n")||"(empty)";$("#dg").scrollTop=1e9;};
api("/api/job",{id:"last"},4000).then(j=>{if(j&&!j.none&&!j.error&&!j.done)watch(j.id);});
</script>`;

function body(req){return new Promise(r=>{let b='',n=0;req.on('data',c=>{n+=c.length;b+=c;if(n>3e7)req.destroy();});req.on('end',()=>{try{r({o:JSON.parse(b||'{}'),n});}catch(e){r({o:{},n});}});});}
const server=http.createServer(async(req,res)=>{
  const send=(o,c)=>{res.writeHead(c||200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o));};
  try{
    if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(PAGE);}
    if(req.method==='GET'&&req.url==='/health')return send({status:'ok',uptime:(Date.now()-BOOT)/1000,root:ROOT});
    if(req.method!=='POST')return send({error:'not found'},404);
    const {o:b,n}=await body(req);const t0=Date.now();
    let out;
    if(req.url==='/api/apply')out=await apply(b.text||'',!!b.dry,!!b.force);
    else if(req.url==='/api/undo')out=undo();
    else if(req.url==='/api/restore')out=restoreTo(b.id);
    else if(req.url==='/api/status')out=await status();
    else if(req.url==='/api/files')out={files:listFiles()};
    else if(req.url==='/api/file')out={content:fs.readFileSync(safe(b.path),'utf8')};
    else if(req.url==='/api/ping')out={ok:true,bytes:n};
    else if(req.url==='/api/log')out={lines:LOG.slice(-80)};
    else if(req.url==='/api/start'){
      const busy=[...jobs.values()].find(o=>!o.done);
      if(busy)out={id:busy.id};
      else{const j=newJob(),fn=b.kind==='build'?jobBuild(j):b.kind==='check'?jobCheck(j):jobSave(j,b.msg);
        fn.catch(e=>{j.say('ERROR: '+e.message);j.ok=false;}).finally(()=>{if(!j.done){j.done=true;j.ended=Date.now();}if(j.ok===null)j.ok=false;log('JOB '+b.kind+' '+(j.ok?'ok':'failed'));});out={id:j.id};}
    }
    else if(req.url==='/api/job'){const j=b.id==='last'?[...jobs.values()].pop():jobs.get(b.id);out=j?jobView(j):{none:true};}
    else if(req.url==='/api/cancel'){const j=jobs.get(b.id);if(j&&!j.done){j.cancelled=true;j.say('CANCELLED by you.');j.kids.forEach(k=>k.kill());j.ok=false;j.done=true;j.ended=Date.now();}out={ok:true};}
    else return send({error:'not found'},404);
    if(req.url!=='/api/job'&&req.url!=='/api/log')log(req.url+' '+(Date.now()-t0)+'ms');
    send(out);
  }catch(e){log('ERROR '+req.url+' '+e.message);send({ok:false,error:e.message,log:['ERROR: '+e.message]},200);}
});
server.on('error',e=>{if(e.code==='EADDRINUSE'){console.log('Port '+PORT+' is already in use. The Executor is probably already running. Open the page, or stop the old one first.');process.exit(3);}throw e;});

// command line fallback: node tools/executor.cjs apply answer.txt [--dry]
if(process.argv[2]==='apply'&&process.argv[3]){
  apply(fs.readFileSync(process.argv[3],'utf8'),process.argv.includes('--dry'),process.argv.includes('--force')).then(r=>{console.log(r.log.join('\n'));process.exit(r.ok?0:1);}).catch(e=>{console.log('ERROR: '+e.message);process.exit(1);});
}else server.listen(PORT,'0.0.0.0',()=>log('Executor v3 running on http://localhost:'+PORT+'  (project: '+ROOT+')'));
