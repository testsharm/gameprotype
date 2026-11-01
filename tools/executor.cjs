// TerraForm Executor v2 - paste DeepSeek blocks into a web page. Backups, syntax check, auto-rollback.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),cp=require('child_process');
const ROOT=process.cwd(),STATE=path.join(ROOT,'.executor'),BK=path.join(STATE,'backups'),PORT=process.env.EXEC_PORT||3002;
fs.mkdirSync(BK,{recursive:true});
try{const g=path.join(ROOT,'.gitignore'),t=fs.existsSync(g)?fs.readFileSync(g,'utf8'):'';if(!/^\.executor\/?$/m.test(t))fs.appendFileSync(g,(t&&!t.endsWith('\n')?'\n':'')+'.executor/\n.executor.log\n');}catch(e){}

function rel(p){return path.relative(ROOT,p).split(path.sep).join('/');}
function safe(p){
  const r=path.resolve(ROOT,p),q=rel(r);
  if(!q||q.startsWith('..')||path.isAbsolute(q)||/^(\.git|\.executor|node_modules)(\/|$)/.test(q))throw new Error('Blocked path: '+p);
  return r;
}
function run(cmd,args,t){return new Promise(res=>{cp.execFile(cmd,args,{cwd:ROOT,timeout:t||120000,maxBuffer:16e6},(err,so,se)=>res({ok:!err,out:(so||'')+(se||'')}));});}
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
function plan(ops,force){
  const cur=new Map(),log=[],get=f=>cur.has(f)?cur.get(f):(fs.existsSync(f)?fs.readFileSync(f,'utf8'):null);
  for(const o of ops){
    const full=safe(o.path),old=get(full);
    if(o.kind==='FILE'){
      const nw=o.body+'\n';
      if(old!==null&&!force&&old.length>2000&&nw.length<old.length*0.5)throw new Error(o.path+' would shrink from '+old.length+' to '+nw.length+' characters. Looks cut off. Tick "allow big shrink" only if that is intended.');
      log.push((old===null?'CREATE ':'OVERWRITE ')+o.path+' ('+nw.split('\n').length+' lines)');cur.set(full,nw);
    }else{
      if(old===null)throw new Error('Cannot edit, file not found: '+o.path);
      let c=old;
      o.pairs.forEach((p,i)=>{
        const n=c.split(p.find).length-1;
        if(n!==1)throw new Error('EDIT '+(i+1)+' in '+o.path+': the FIND text was found '+n+' times (must be exactly 1). First line: '+p.find.split('\n')[0].slice(0,80));
        c=c.replace(p.find,()=>p.replace);
      });
      log.push('EDIT '+o.path+' ('+o.pairs.length+' change'+(o.pairs.length>1?'s':'')+')');cur.set(full,c);
    }
  }
  return {cur,log};
}
async function syntax(full,content){
  const ext=path.extname(full);
  if(ext==='.json'){try{JSON.parse(content);return null;}catch(e){return e.message;}}
  if(!['.js','.mjs','.cjs'].includes(ext))return null;
  const tmp=path.join(os.tmpdir(),'chk_'+Date.now()+Math.random().toString(36).slice(2)+(ext==='.cjs'?'.cjs':'.mjs'));
  fs.writeFileSync(tmp,content);const r=await run('node',['--check',tmp],20000);fs.unlinkSync(tmp);
  return r.ok?null:rel(full)+':\n'+r.out.split(tmp).join(path.basename(full)).split('\n').slice(0,8).join('\n');
}

// ---------- apply / undo ----------
function restore(dir,man){
  const log=[];
  for(const f of man.files){
    const full=safe(f.path);
    if(f.existed){fs.mkdirSync(path.dirname(full),{recursive:true});fs.copyFileSync(path.join(BK,dir,'files',f.path),full);log.push('RESTORED '+f.path);}
    else if(fs.existsSync(full)){fs.unlinkSync(full);log.push('REMOVED '+f.path);}
  }
  return log;
}
async function apply(text,dry,force){
  const ops=parse(text);
  if(!ops.length)throw new Error('No blocks found. Expected: @@@ FILE path @@@ ... @@@ END @@@');
  const {cur,log}=plan(ops,force);
  if(dry)return{ok:true,log:['PREVIEW (nothing written):'].concat(log)};
  const errs=[];
  for(const [f,c] of cur){const e=await syntax(f,c);if(e)errs.push(e);}
  if(errs.length)return{ok:false,log:['REFUSED: the new code has syntax errors. Nothing was changed.'].concat(errs)};
  const id=new Date().toISOString().replace(/[:.]/g,'-'),dir=path.join(BK,id),man={id,files:[],undone:false};
  fs.mkdirSync(dir,{recursive:true});
  for(const f of cur.keys()){
    const ex=fs.existsSync(f);man.files.push({path:rel(f),existed:ex});
    if(ex){const d=path.join(dir,'files',rel(f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(f,d);}
  }
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(man));
  for(const [f,c] of cur){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,'utf8');}
  return{ok:true,log:['APPLIED. Backup id: '+id].concat(log,['Syntax check passed. Reload the game tab.'])};
}
function undo(){
  for(const d of fs.readdirSync(BK).sort().reverse()){
    const mp=path.join(BK,d,'manifest.json');if(!fs.existsSync(mp))continue;
    const man=JSON.parse(fs.readFileSync(mp,'utf8'));if(man.undone)continue;
    const log=restore(d,man);man.undone=true;fs.writeFileSync(mp,JSON.stringify(man));
    return{ok:true,log:['UNDID backup '+d].concat(log)};
  }
  return{ok:false,log:['Nothing to undo.']};
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
  let git={};
  const b=await run('git',['rev-parse','--abbrev-ref','HEAD'],8000);git.branch=b.ok?b.out.trim():'(no git)';
  const s=await run('git',['status','--porcelain'],8000);git.uncommitted=s.ok?s.out.split('\n').filter(Boolean).length:null;
  const u=await run('git',['rev-list','--count','@{u}..HEAD'],8000);git.unpushed=u.ok?parseInt(u.out):null;
  const h=[];for(const d of fs.readdirSync(BK).sort().reverse().slice(0,5)){const mp=path.join(BK,d,'manifest.json');if(fs.existsSync(mp)){const m=JSON.parse(fs.readFileSync(mp,'utf8'));h.push({id:d,files:m.files.length,undone:m.undone});}}
  return{groups,done,total,git,history:h};
}
function dirSize(d){let s=0,n=0;for(const x of fs.readdirSync(d)){const f=path.join(d,x),st=fs.statSync(f);if(st.isDirectory()){const r=dirSize(f);s+=r.s;n+=r.n;}else{s+=st.size;n++;}}return{s,n};}
async function build(){
  const r=await run('npm',['run','build'],240000);let extra='';
  const dist=path.join(ROOT,'dist');
  if(r.ok&&fs.existsSync(dist)){const z=dirSize(dist);extra='\n\nBUILD SIZE: '+(z.s/1048576).toFixed(2)+' MB in '+z.n+' files.  CrazyGames limits: 50 MB initial ('+(z.s/1048576<=50?'OK':'TOO BIG')+'), 20 MB for the mobile homepage ('+(z.s/1048576<=20?'OK':'TOO BIG')+'), max 1500 files ('+(z.n<=1500?'OK':'TOO MANY')+').';}
  return{ok:r.ok,log:[(r.ok?'BUILD OK':'BUILD FAILED')+'\n'+r.out.split('\n').slice(-40).join('\n')+extra]};
}
async function save(msg){
  const log=[];
  let r=await run('git',['add','-A'],30000);log.push('git add: '+(r.ok?'ok':r.out));
  r=await run('git',['commit','-m',msg||'executor snapshot'],30000);log.push('git commit: '+r.out.trim().split('\n')[0]);
  r=await run('git',['push'],60000);log.push('git push: '+(r.ok?'ok - saved to GitHub':'FAILED\n'+r.out.trim()));
  return{ok:r.ok,log};
}

// ---------- web page ----------
const PAGE=String.raw`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Executor</title>
<style>
body{margin:0;font:14px system-ui;background:#0f172a;color:#e5e7eb}#app{max-width:980px;margin:auto;padding:16px}
h1{font-size:18px;margin:0 0 10px}nav{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
button{background:#1e293b;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:9px 14px;cursor:pointer;font:inherit}
button:hover{background:#334155}button.on,button.pri{background:#d97706;border-color:#d97706;color:#fff}
textarea{width:100%;height:280px;box-sizing:border-box;background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:10px;font:12px ui-monospace,monospace}
pre{background:#020617;border:1px solid #334155;border-radius:8px;padding:10px;white-space:pre-wrap;max-height:380px;overflow:auto;font:12px ui-monospace,monospace}
section{display:none}section.on{display:block}.row{display:flex;gap:6px;margin:8px 0;flex-wrap:wrap;align-items:center}
.it{display:flex;justify-content:space-between;gap:8px;padding:6px 10px;border-bottom:1px solid #1e293b}.ok{color:#4ade80}.warn{color:#fbbf24}.bad{color:#f87171}
.bar{height:10px;background:#1e293b;border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;background:#d97706}input[type=text]{background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:9px;flex:1;min-width:180px}
</style><div id=app><h1>TerraForm Executor</h1>
<nav><button data-t=apply class=on>1. Apply</button><button data-t=status>2. Status</button><button data-t=files>3. Files</button><button data-t=ship>4. Build and Save</button></nav>
<section id=apply class=on><p>Paste the answer from DeepSeek here, then Preview, then Apply.</p><textarea id=inp placeholder="@@@ FILE src/example.js @@@"></textarea>
<div class=row><label><input type=checkbox id=force> allow a file to shrink a lot</label></div>
<div class=row><button id=prev>Preview</button><button id=go class=pri>Apply</button><button id=undo>Undo last apply</button><button id=rules>Copy rules for DeepSeek</button><button id=clr>Clear</button></div><pre id=out>Ready.</pre></section>
<section id=status><div class=row><button id=rs>Refresh</button></div><div id=st>Loading...</div></section>
<section id=files><p>Click Copy to put a file on your clipboard in the format DeepSeek understands. Paste it into DeepSeek together with your request.</p><div id=fl></div></section>
<section id=ship><div class=row><button id=bd class=pri>Run build and size check</button></div><pre id=bo>Not run yet.</pre>
<div class=row><input type=text id=msg placeholder="Snapshot message (what changed)"><button id=sv class=pri>Save to GitHub (commit and push)</button></div><pre id=so>Not run yet.</pre></section></div>
<script>
const $=s=>document.querySelector(s);
const RULES=["Reply ONLY with blocks in this exact format. No explanations.","","To CREATE or fully REPLACE a file (give the COMPLETE file, never abbreviate):","@@@ FILE path/to/file.js @@@","(complete file)","@@@ END @@@","","To make a SMALL change (FIND text must be copied exactly from my file and appear exactly once):","@@@ EDIT path/to/file.js @@@","--- FIND ---","(exact old text)","--- REPLACE ---","(new text)","@@@ END @@@","","Rules: never write '...' or 'rest of code'. Several blocks are allowed. If you run out of space, stop after a finished block and write CONTINUE."].join("\n");
async function api(p,b){const r=await fetch(p,b===undefined?{}:{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});return r.json();}
function show(el,j){el.textContent=(j.log||[j.error||"error"]).join("\n");el.style.borderColor=j.ok===false||j.error?"#f87171":"#4ade80";}
async function copy(t){try{await navigator.clipboard.writeText(t);return true;}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove();return true;}}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.querySelectorAll("section").forEach(s=>s.classList.remove("on"));$("#"+b.dataset.t).classList.add("on");if(b.dataset.t=="status")loadStatus();if(b.dataset.t=="files")loadFiles();});
const run=async dry=>{$("#out").textContent="Working...";show($("#out"),await api("/api/apply",{text:$("#inp").value,dry,force:$("#force").checked}));};
$("#prev").onclick=()=>run(true);$("#go").onclick=()=>run(false);$("#clr").onclick=()=>{$("#inp").value="";};
$("#undo").onclick=async()=>show($("#out"),await api("/api/undo",{}));
$("#rules").onclick=async()=>{await copy(RULES);$("#out").textContent="Rules copied. Paste them at the start of your DeepSeek message.";};
async function loadStatus(){
  const s=await api("/api/status",{});const pct=Math.round(100*s.done/s.total);let h='<p><b>'+s.done+' of '+s.total+' features built and connected ('+pct+'%)</b></p><div class=bar><i style="width:'+pct+'%"></i></div>';
  s.groups.forEach(g=>{h+='<h3>'+g.group+'</h3>';g.items.forEach(i=>{const c=!i.exists?'bad':i.connected?'ok':'warn';const t=!i.exists?'NOT BUILT':i.connected?'CONNECTED':'BUILT, NOT CONNECTED';h+='<div class=it><span>'+i.label+' <small>'+i.file+'</small></span><b class='+c+'>'+t+'</b></div>';});});
  const g=s.git;h+='<h3>GitHub safety</h3><div class=it><span>Branch</span><b>'+g.branch+'</b></div><div class=it><span>Changes not committed</span><b class='+(g.uncommitted?'warn':'ok')+'>'+g.uncommitted+'</b></div><div class=it><span>Commits not pushed</span><b class='+(g.unpushed?'warn':'ok')+'>'+(g.unpushed===null?'unknown':g.unpushed)+'</b></div>';
  h+='<h3>Recent applies</h3>'+(s.history.map(x=>'<div class=it><span>'+x.id+'</span><span>'+x.files+' file(s)'+(x.undone?' - undone':'')+'</span></div>').join('')||'<div class=it>None yet</div>');$("#st").innerHTML=h;}
$("#rs").onclick=loadStatus;
async function loadFiles(){const f=await api("/api/files",{});$("#fl").innerHTML="";f.files.forEach(x=>{const d=document.createElement("div");d.className="it";d.innerHTML="<span>"+x.path+" <small>"+(x.size/1024).toFixed(1)+" KB</small></span>";const b=document.createElement("button");b.textContent="Copy";b.onclick=async()=>{const r=await api("/api/file",{path:x.path});await copy("@@@ FILE "+x.path+" @@@\n"+r.content.replace(/\n$/,"")+"\n@@@ END @@@");b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1500);};d.appendChild(b);$("#fl").appendChild(d);});}
$("#bd").onclick=async()=>{$("#bo").textContent="Building (can take a minute)...";show($("#bo"),await api("/api/build",{}));};
$("#sv").onclick=async()=>{$("#so").textContent="Saving...";show($("#so"),await api("/api/save",{msg:$("#msg").value}));};
</script>`;

function body(req){return new Promise(r=>{let b='';req.on('data',c=>{b+=c;if(b.length>3e7)req.destroy();});req.on('end',()=>{try{r(JSON.parse(b||'{}'));}catch(e){r({});}});});}
http.createServer(async(req,res)=>{
  const send=(o,c)=>{res.writeHead(c||200,{'Content-Type':'application/json'});res.end(JSON.stringify(o));};
  try{
    if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(PAGE);}
    if(req.method==='GET'&&req.url==='/health')return send({status:'ok'});
    if(req.method!=='POST')return send({error:'not found'},404);
    const b=await body(req);
    if(req.url==='/api/apply')return send(await apply(b.text||'',!!b.dry,!!b.force));
    if(req.url==='/api/undo')return send(undo());
    if(req.url==='/api/status')return send(await status());
    if(req.url==='/api/files')return send({files:listFiles()});
    if(req.url==='/api/file'){const f=safe(b.path);return send({content:fs.readFileSync(f,'utf8')});}
    if(req.url==='/api/build')return send(await build());
    if(req.url==='/api/save')return send(await save(b.msg));
    send({error:'not found'},404);
  }catch(e){send({ok:false,error:e.message,log:['ERROR: '+e.message]},200);}
}).listen(PORT,'0.0.0.0',()=>console.log('Executor running on http://localhost:'+PORT+'  (project: '+ROOT+')'));
