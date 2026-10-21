// Repeatable actual-engine composition captures, driven by recorded input only.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const out='docs/cartoon-overhaul';mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/cartoon-capture-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/cartoon-capture-protocol.mjs',import.meta.url)));
const cli=args=>{const p=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;if(p.status!==0)throw Error(p.stdout+p.stderr);return JSON.parse(p.stdout);};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);let client;
try{
  client=await GameEngineClient.connect(address,{client:'cartoon-overhaul-composition'});
  const call=(method,params={})=>client.call(method,params),step=n=>call('engine.step',{n,frames:true});
  const view=async(width,height)=>{await call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});await step(1);};
  const warm=async(width,height)=>{for(let i=0;i<40;i++){
    await call('render.probe',{width,height,points:[[0,0]]});
    if((await call('assets.status')).pending===0){await call('render.probe',{width,height,points:[[0,0]]});return;}
  }throw Error('Cartoon composition assets failed to finish loading');};
  await view(1536,864);await step(4);await warm(1536,864);
  await call('cheat.run',{id:'cartoon.overhaul',args:{scenario:'combat',team:10,humans:10,wave:5}});await step(1);
  const events=Array.from({length:10},(_,pad)=>[
    {type:'gamepadButton',pad,button:2,down:true,delaySteps:pad*2},
    {type:'gamepadButton',pad,button:2,down:false,delaySteps:pad*2+1},
  ]).flat();
  events.push({type:'gamepadAxis',pad:0,axis:0,value:1},
    {type:'gamepadButton',pad:1,button:0,down:true},
    {type:'gamepadButton',pad:1,button:0,down:false,delaySteps:6});
  await call('input.push',{events});await step(22);
  const captures=[];
  for(const [name,width,height] of [['wide-combat',1536,864],['native-combat',768,720],['tall-combat',640,960],['ultrawide-combat',2520,1080]]){
    await view(width,height);await warm(width,height);
    await call('render.screenshot',{width,height,path:`${out}/${name}.png`});
    const stats=await call('render.stats');
    if(!stats.drawCalls||stats.drawCalls>14)throw Error(`${name}: draw calls ${stats.drawCalls} violate 1..14`);
    captures.push({name,width,height,drawCalls:stats.drawCalls,atlasPages:stats.atlasPages,camera:await call('camera.list')});
  }
  writeFileSync(`${out}/composition-captures.json`,JSON.stringify({captures,setup:'Ten human slots in the actual new arena; one recorded jump, one moving player and staggered one-shot fire inputs. Controlled engine QA composition, not a human-group readability certification.'},null,2)+'\n');
  console.log(JSON.stringify(captures.map(({name,width,height,drawCalls})=>({name,width,height,drawCalls}))));
}finally{client?.close();try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}}
