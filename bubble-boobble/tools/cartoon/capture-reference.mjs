// Native controlled fixture. Run only with the coordinated engine slot.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const out='docs/concept-reconstruction';mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/reference-client.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/reference-client.mjs',import.meta.url)));
const cli=args=>{const run=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(run.status!==0)throw Error(run.stdout+run.stderr);return JSON.parse(run.stdout);};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','desktop','--scene','scenes/cartoon.scene.json']);let client;
try{
 client=await GameEngineClient.connect(address,{client:'measured-reference-fixture'});
 const call=(method,params={})=>client.call(method,params);
 await call('input.push',{events:[{type:'view',width:1536,height:864,scale:1,insets:[0,0,0,0]}]});
 await call('engine.step',{n:8,frames:true});
 await call('cheat.run',{id:'reconstruction.reference'});await call('engine.step',{n:1,frames:true});
 const game=(await call('script.eval',{code:'JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game'})).value;
 if(!game||game.Party?.Wave!==5||game.Score!==12340||game.Players.length!==10)throw Error('Reference setup failed; refusing unrelated capture');
 for(let tick=0;tick<40;tick++){
  await call('render.probe',{width:1536,height:864,points:[[0,0]]});
  if((await call('assets.status')).pending===0)break;
  if(tick===39)throw Error('Reference assets did not load');
 }
 await call('render.screenshot',{width:1536,height:864,path:`${out}/canonical-reference.png`});
 const stats=await call('render.stats');
 const residency=(await call('script.eval',{code:'JSON.parse(__gameengine_host("assets.stats","{}"))'})).value;
 const memory=await call('profile.memory');
 const assets=await call('assets.status');
 const queried=await call('world.query',{components:['Sprite','VisualOffset'],limit:16384});
 const sprites=queried.entities.filter(entity=>entity.components.Sprite?.visible);
 const texts=await call('world.query',{components:['Text2D','VisualOffset'],limit:16384});
 const layout=await call('ui.layout',{width:1536,height:864});
 writeFileSync(`${out}/canonical-native-query.json`,JSON.stringify({size:[1536,864],stats,residency,memory,assets,camera:await call('camera.list'),sprites,texts:texts.entities.filter(entity=>entity.components.Text2D?.visible),ui:layout,game},null,2)+'\n');
 console.log(JSON.stringify({ok:true,path:`${out}/canonical-reference.png`,drawCalls:stats.drawCalls,visibleSprites:sprites.length}));
}finally{client?.close();try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}}
