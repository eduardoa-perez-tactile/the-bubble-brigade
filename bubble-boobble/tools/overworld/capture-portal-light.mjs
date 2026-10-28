/** Actual-engine review capture, never a standalone/browser/OS playtest.
 * Operates ONLY the explicit existing headless session; owns no session lifecycle.
 * Example: node tools/overworld/capture-portal-light.mjs --session 12345
 * Optional: --district 1 --sizes landscape,slim,wide --loop-frames 24
 * QA progress lives in a new dedicated profile. Use an isolated headless session.
 */
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const arguments_=process.argv.slice(2),option=(name,fallback)=>{
 const index=arguments_.indexOf(name);return index<0?fallback:arguments_[index+1];
};
const session=option('--session','');
if(!/^\d+$/.test(session))throw new Error('Pass --session PID for an isolated existing headless session. This tool never chooses the newest session.');
const directory=resolve(root,option('--out','.gameengine/portal-light-review'));
const districtOption=option('--district','all'),districtNumbers=districtOption==='all'?[1,2,3,4,5]:[Number(districtOption)];
if(districtNumbers.some(n=>!Number.isInteger(n)||n<1||n>5))throw new Error('--district must be 1..5 or all');
const presets={landscape:[1280,720,[0,0,0,0]],slim:[360,880,[0,34,0,24]],wide:[1680,720,[0,0,0,0]]};
const sizes=option('--sizes','landscape,slim,wide').split(',');
if(sizes.some(s=>!presets[s]))throw new Error('--sizes must name landscape,slim,wide');
const loopFrames=Number(option('--loop-frames','0'));
if(!Number.isInteger(loopFrames)||loopFrames<0||loopFrames>120)throw new Error('--loop-frames must be 0..120');
mkdirSync(directory,{recursive:true});
const report={session:Number(session),protocol:'Game Engine headless',qaProfile:'separate new PORTAL QA profile; existing profiles preserved',captures:[]};
function command(...args){
 const r=spawnSync('gameengine',[...args.map(String),'--session',session,'--json'],{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:16*1024*1024});
 if(r.error||r.status!==0)throw new Error(`${args.join(' ')}: ${r.error?.message||r.stderr||r.stdout||`exit ${r.status}`}`);
 try{return JSON.parse(r.stdout);}catch{throw new Error(`Expected JSON from ${args.join(' ')}: ${r.stdout}`);}
}
const call=(method,params={})=>command('call',method,'--params',JSON.stringify(params));
const step=count=>command('step',count);
function fixture(ready,phase,reduced=false){
 command('cheat','run','overworld.portal-light-fixture',`ready=${ready}`,`phase=${phase}`,`reduced=${reduced}`);step(1);
 const cheat=command('cheat','list').cheats.find(c=>c.id==='overworld.portal-light-fixture');
 const current=Object.fromEntries(cheat.params.map(p=>[p.name,p.current]));
 if(current.phase!==phase||current.ready!==ready||current.reduced!==reduced)throw new Error(`Refuse mislabeled capture: wanted ${JSON.stringify({ready,phase,reduced})}, actual ${JSON.stringify(current)}`);
 return current;
}
async function settle(width,height){
 for(let attempt=0;attempt<80;attempt++){
  step(60);
  const render=call('render.stats',{render:true,width,height}),assets=call('assets.status'),stack=call('ui.stack');
  if(assets.pending===0&&!render.worldOccluded&&!stack.views?.some(v=>v.layer==='loading'))return {render,assets};
  await new Promise(done=>setTimeout(done,150));
 }
 throw new Error('Map did not finish loading; no screenshot will be called passing');
}
function capture(district,size,label,width,height,ready,phase,reduced=false){
 const actual=fixture(ready,phase,reduced),path=resolve(directory,`district-${district}-${size}-${label}.png`);
 const shot=command('screenshot',path,'--width',width,'--height',height),render=call('render.stats');
 if(render.worldOccluded||render.validationErrors?.length)throw new Error('Invalid or covered review frame: '+JSON.stringify(render));
 report.captures.push({district,size,label,viewport:{width,height},fixture:actual,shot,render});
 writeFileSync(resolve(directory,'captures.json'),JSON.stringify(report,null,2)+'\n');
}
try{
 const active=command('session','list').sessions.find(s=>String(s.pid)===session);
 if(!active||active.mode!=='headless')throw new Error('Capture requires an existing headless session of this project');
 // A fresh session has no perf capture yet, so perf.stats alone cannot report
 // paused state. Own this short instrumentation probe and close it immediately.
 call('perf.start');
 const paused=call('perf.stats',{stop:true}).paused;
 if(paused!==true)throw new Error('Capture requires a paused headless session for exact phase labels');
 for(const district of districtNumbers){
  const module=await import(pathToFileURL(resolve(root,`src/overworld/maps/district-${district}.ts`)).href);
  const map=module[`district${district}Map`],gate=map.pois.find(p=>p.kind==='gate');
  const approach={x:(gate.x-map.origin.x)*map.scale,y:(map.origin.y-gate.y)*map.scale-(district===3?0:40)};
  command('cheat','run','overworld.map-preview',`district=${district}`,'facing=1');step(1);
  for(const size of sizes){
   const [width,height,insets]=presets[size];
   call('input.push',{events:[{type:'view',width,height,scale:1,insets}]});step(30);
   await settle(width,height);
   command('cheat','run','overworld.warp',`x=${approach.x}`,`y=${approach.y}`);step(90);
   await settle(width,height);
   capture(district,size,'off',width,height,false,0);
   capture(district,size,'rest',width,height,true,0);
   capture(district,size,'peak',width,height,true,60);
   capture(district,size,'wrap',width,height,true,239);
   capture(district,size,'reduced',width,height,true,60,true);
   if(size==='landscape')for(let index=0;index<loopFrames;index++){
    const phase=Math.floor(index*240/loopFrames);
    capture(district,size,`loop-${String(index).padStart(3,'0')}`,width,height,true,phase);
   }
  }
  console.log(`Captured district ${district}: ${report.captures.filter(c=>c.district===district).length} actual-engine frames`);
 }
 console.log(JSON.stringify({ok:true,session:Number(session),directory,captures:report.captures.length}));
}catch(error){
 writeFileSync(resolve(directory,'failure.json'),JSON.stringify({error:String(error),captures:report.captures.length},null,2)+'\n');
 throw error;
}
