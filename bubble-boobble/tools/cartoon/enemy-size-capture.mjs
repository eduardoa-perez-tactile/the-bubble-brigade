// Controlled Game Engine comparison: normal, captive, then actual popped pose.
// The cheat rebases traveled death positions so only pose size/registration varies.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const out='.cache/enemy-size-transitions';mkdirSync(out,{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:`${out}/client.mjs`,logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL(`../../${out}/client.mjs`,import.meta.url)));
const cli=args=>{const run=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(run.error)throw run.error;if(run.status!==0)throw Error(run.stdout+run.stderr);return JSON.parse(run.stdout);};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);let client;
try{
 client=await GameEngineClient.connect(address,{client:'enemy-size-transitions'});
 const call=(method,params={})=>client.call(method,params),step=n=>call('engine.step',{n,frames:true});
 await call('script.eval',{code:'__gameengine_host("assets.setDeviceClass",JSON.stringify({class:"phone-low"}))'});
 const captures=[];
 for(const [width,height] of [[360,880],[1680,720]]){
  await call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});await step(8);
  for(const defeatAge of [0,2,6,49]){
   await call('cheat.run',{id:'cartoon.enemy-showcase',args:{scenario:'size-transitions',frozen:true,defeatAge}});await step(1);
   const game=(await call('script.eval',{code:'JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game'})).value;
   if(game?.Enemies?.length!==18||game.Enemies.filter(e=>e.State===2).length!==6)throw Error('Enemy fixture failed; refusing unrelated screenshot');
   for(let warm=0;warm<60;warm++){
    await call('render.probe',{width,height,points:[[0,0]]});
    if((await call('assets.status')).pending===0){await call('render.probe',{width,height,points:[[0,0]]});break;}
    if(warm===59)throw Error('Enemy comparison assets did not finish loading');
   }
   const path=`${out}/${width}x${height}-death-${defeatAge}.png`;
   await call('render.screenshot',{width,height,path});
   const stats=await call('render.stats');
   if(stats.drawCalls>15)throw Error(`Enemy comparison exceeds existing15draw budget: ${stats.drawCalls}`);
   captures.push({width,height,defeatAge,path,drawCalls:stats.drawCalls,validationErrors:stats.validationErrors});
  }
 }
 writeFileSync(`${out}/captures.json`,JSON.stringify({setup:'Columns: roller, blaster, bat, bee, spring, skimmer. Rows: normal, captive, defeated. Actual pop/updateDefeated with death position rebased for pose comparison.',captures},null,2)+'\n');
 console.log(JSON.stringify(captures));
}finally{client?.close();cli(['session','stop','--session',String(address.pid)]);}
