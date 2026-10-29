// Targeted Game Engine-only presentation review. Captures stay in ignored cache.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
process.chdir(root);
const output=resolve('.cache/enemy-juice');mkdirSync(output,{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:`${output}/client.mjs`,logLevel:'silent'});
const {GameEngineClient}=await import(pathToFileURL(`${output}/client.mjs`).href);
const cli=args=>{
 const result=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(result.stdout+result.stderr);
 return JSON.parse(result.stdout);
};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);
let client;
try{
 client=await GameEngineClient.connect(address,{client:'enemy-juice-review'});
 const call=(method,params={})=>client.call(method,params);
 const step=n=>call('engine.step',{n,frames:true});
 await call('script.eval',{code:'__gameengine_host("assets.setDeviceClass",JSON.stringify({class:"phone-low"}))'});
 const captures=[];
 async function capture(name,width,height){
  const game=(await call('script.eval',{code:'JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game'})).value;
  if(!game?.Enemies?.length)throw Error(`Missing fixture for ${name}`);
  for(let attempt=0;attempt<90;attempt++){
   await call('render.probe',{width,height,points:[[0,0]]});
   if((await call('assets.status')).pending===0)break;
   if(attempt===89)throw Error('Assets did not finish loading');
  }
  const path=`${output}/${width}x${height}-${name}.png`;
  await call('render.screenshot',{width,height,path});
  const stats=await call('render.stats');
  if(stats.validationErrors?.length)throw Error(JSON.stringify(stats.validationErrors));
  captures.push({name,width,height,path,drawCalls:stats.drawCalls,instances:stats.instances,
   projectiles:game.Projectiles.map(p=>({x:p.X,y:p.Y,vx:p.VX,vy:p.VY,age:p.Age,laser:p.Laser})),
   enemies:game.Enemies.map(e=>({kind:e.Kind,state:e.State,shoot:e.Shoot,angry:e.Angry,age:e.Age,deadTicks:e.DeadTicks}))});
 }
 async function setup(scenario,frozen=true,defeatAge=0){
  await call('cheat.run',{id:'cartoon.enemy-showcase',args:{scenario,frozen,defeatAge}});await step(1);
 }
 for(const [width,height]of [[360,880],[1680,720]]){
  await call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});await step(3);
  await setup('roster');await capture('roster',width,height);
  await setup('shooters',false);await capture('charge-start',width,height);
  await step(12);await capture('charge-middle',width,height);
  await step(14);await capture('release',width,height);
  await step(12);await capture('flight',width,height);
  for(const age of [0,4,16,49]){
   await setup('size-transitions',true,age);await capture(`defeat-${age}`,width,height);
  }
  await setup('rage',false);await capture('rage-start',width,height);
  await step(20);await capture('rage-moving',width,height);
  await setup('final-pop',false);await capture('final-pop-start',width,height);
  await step(18);await capture('final-pop-spin',width,height);
 }
 await call('input.push',{events:[{type:'view',width:768,height:720,scale:1,insets:[0,0,0,0]}]});await step(1);
 await setup('roster');await capture('roster-baseline-size',768,720);
 writeFileSync(`${output}/captures.json`,JSON.stringify(captures,null,2)+'\n');
 console.log(JSON.stringify({captures:captures.length,peakDrawCalls:Math.max(...captures.map(c=>c.drawCalls)),output}));
}finally{
 client?.close();cli(['session','stop','--session',String(address.pid)]);
}
