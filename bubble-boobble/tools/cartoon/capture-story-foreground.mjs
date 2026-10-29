// Story foreground previews, through recorded Game Engine map/card inputs only.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
// Preserve the original room2 comparison and three-pilot capture modes.
const baseline=process.argv.includes('--baseline-room2');
const allLevels=process.argv.includes('--all-levels');
const nativeOnly=allLevels||process.argv.includes('--native-only');
const label=baseline?'baseline-room2':allLevels?'all-levels':nativeOnly?'final-native':'final';
const levels=baseline?[2]:allLevels?Array.from({length:25},(_,index)=>index+1):[3,7,24];
const out=`.gameengine/captures/story-foreground-${label}`;mkdirSync(out,{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";export {overworldEntrancePoint} from "./src/overworld/navigation.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:`${out}/client.mjs`,logLevel:'silent'});
const {GameEngineClient,overworldEntrancePoint}=await import(fileURLToPath(new URL(`../../${out}/client.mjs`,import.meta.url)));
const cli=args=>{const p=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;if(p.status!==0)throw Error(p.stdout+p.stderr);return JSON.parse(p.stdout);};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);let client;
try{
 client=await GameEngineClient.connect(address,{client:'story-foreground-previews'});
 const call=(method,params={})=>client.call(method,params),step=n=>call('engine.step',{n,frames:true});
 const doc=async name=>(await call('script.eval',{code:`JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:${JSON.stringify(name)}})))`})).value;
 const warm=async(width=1280,height=720)=>{for(let i=0;i<100;i++){
  await call('render.probe',{width,height,points:[[0,0]]});
  if((await call('assets.status')).pending===0){await call('render.probe',{width,height,points:[[0,0]]});return;}
 }throw Error('Foreground assets remain pending');};
 const intent=async(action,value='')=>{await call('input.push',{events:[{type:'event',name:'DesktopIntent',data:JSON.stringify({action,value,index:0,x:0,y:0})}]});await step(1);await warm();};
 const cheat=async(id,args={})=>{await call('cheat.run',{id,args});await step(1);await warm();};
 await call('script.eval',{code:'__gameengine_host("assets.setDeviceClass",JSON.stringify({class:"phone-low"}))'});
 await step(8);await warm();await cheat('overworld.journal-fixture');
 const captures=[];
 for(const number of levels){
  const district=Math.floor((number-1)/5)+1,id=`encounter-${number}`;
  await cheat('overworld.map-preview',{district,facing:1});
  await cheat('overworld.warp',overworldEntrancePoint(`district-${district}`,id));await step(5);
  await intent('overworld-interact',id);await step(3);await warm();await intent('adventure-play');
  for(let i=0;i<500;i++){const s=await doc('desktop-ui'),g=(await doc('arcade.session'))?.game;if(s?.screen==='play'&&!s.transitionAction&&g?.State===1)break;await step(1);await warm();if(i===499)throw Error(`Stage${number} did not become playable: ${JSON.stringify({s,g})}`);}
  const active=(await doc('arcade.session')).game;
  if(active.Level.number!==number)throw Error(`Expected stage${number}, got${active.Level.number}`);
  const views=baseline||nativeOnly?[['native',1280,720,[0,0,0,0]]]:[['native',1280,720,[0,0,0,0]],['narrow',344,882,[0,32,0,0]],['ultrawide',2520,1080,[0,0,0,0]]];
  for(const [name,width,height,insets]of views){
   await call('input.push',{events:[{type:'view',width,height,scale:1,insets}]});await step(1);await warm(width,height);
   const path=`${out}/stage-${number}-${name}.png`;
   await call('render.screenshot',{width,height,path});
   const stats=await call('render.stats'),residency=(await call('script.eval',{code:'JSON.parse(__gameengine_host("assets.stats","{}"))'})).value;
   if(stats.drawCalls>50||stats.validationErrors.length)throw Error(`Stage${number}/${name}: invalid frame ${JSON.stringify(stats)}`);
   const group=residency.groups?.[`adventure-${active.Level.episode.theme}`];
   if(!group||group.status!=='loaded'||group.failed.length||group.resident.textures>6*1024*1024)throw Error(`Stage${number}/${name}: active episode group failed or exceeds 6MiB ${JSON.stringify(group)}`);
   captures.push({number,title:active.Level.episode.title,theme:active.Level.episode.theme,name,width,height,path,drawCalls:stats.drawCalls,validationErrors:stats.validationErrors,residency});
  }
  console.error(JSON.stringify({captured:number,total:levels.length,title:active.Level.episode.title}));
  await intent('leave');await step(15);await warm();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({label,tier:'mobile',memoryClass:'phone-low',setup:'Actual map/card flow, populated journal fixture unlocks all story episodes. Frozen screenshot between recorded steps; native engine only.',captures},null,2)+'\n');
 console.log(JSON.stringify(captures.map(({number,name,drawCalls,path})=>({number,name,drawCalls,path}))));
}finally{client?.close();cli(['session','stop','--session',String(address.pid)]);}
