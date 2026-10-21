// Native engine probes; class is selected before the first stepped/rendered frame.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const out='docs/concept-reconstruction';mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/reconstruction-memory-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/reconstruction-memory-protocol.mjs',import.meta.url)));
const cli=args=>{const result=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(result.error)throw result.error;if(result.status!==0)throw Error(result.stdout+result.stderr);return JSON.parse(result.stdout);};
const rows=[];
for(const memoryClass of ['phone']){
  const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);let client;
  try{
    client=await GameEngineClient.connect(address,{client:'reconstruction-memory'});
    const call=(method,params={})=>client.call(method,params),step=n=>call('engine.step',{n,frames:true});
    await call('script.eval',{code:`__gameengine_host("assets.setDeviceClass",JSON.stringify({class:${JSON.stringify(memoryClass)}}))`});
    await call('input.push',{events:[{type:'view',width:1536,height:864,scale:1,insets:[0,0,0,0]}]});
    await step(3);await call('cheat.run',{id:'reconstruction.reference',args:{}});await step(1);await call('cheat.run',{id:'reconstruction.reward',args:{}});await step(1);
    let ready=false;
    for(let index=0;index<40;index++){
      await call('render.probe',{width:1536,height:864,points:[[0,0]]});
      if((await call('assets.status')).pending===0){await call('render.probe',{width:1536,height:864,points:[[0,0]]});ready=true;break;}
    }
    if(!ready)throw Error('Memory fixture assets did not become ready');
    const device=(await call('script.eval',{code:'JSON.parse(__gameengine_host("quality.device","{}"))'})).value;
    const residency=(await call('script.eval',{code:'JSON.parse(__gameengine_host("assets.stats","{}"))'})).value;
    const active=(await call('script.eval',{code:'JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"})))?.game?.Level?.arena'})).value;
    if(device.memoryClass!==memoryClass||residency.class!==memoryClass||active!=='cartoon-courtyard')throw Error(`Wrong probe context: ${JSON.stringify({device,residency,active})}`);
    const memory=await call('profile.memory'),render=await call('render.stats');
    rows.push({memoryClass,device,residency,memory,render,assets:await call('assets.status'),reward:await call('world.query',{components:['Text2D','VisualOffset'],filter:{'Text2D.text':'800','Text2D.visible':true}})});
    console.log(JSON.stringify({memoryClass,gpuTextures:memory.categories.gpuTextures,jsHeapUsed:memory.categories.jsHeapUsed,drawCalls:render.drawCalls}));
  }finally{client?.close();try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}}
}
writeFileSync(`${out}/reward-native-${process.argv[2]??'before'}.json`,JSON.stringify({rows,context:'Fresh mobile-tier V8 headless hosts, runtime assets.setDeviceClass before first stepped/rendered frame; same canonical content at768x720. GPU texture allocation is distinct from cooked/CPU residency bytes. Host measurements do not certify physical phone RAM, frame rate or thermals.'},null,2)+'\n');
