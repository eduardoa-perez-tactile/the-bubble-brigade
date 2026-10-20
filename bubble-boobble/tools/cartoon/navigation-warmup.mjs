// Engine-only controlled measurement of the normal countdown and first combat step.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const label=process.argv[2];if(!['before','after'].includes(label))throw Error('Usage: node tools/cartoon/navigation-warmup.mjs before|after');
mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/cartoon-navigation-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/cartoon-navigation-protocol.mjs',import.meta.url)));
const r=spawnSync('gameengine',['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json','--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);
const address=JSON.parse(r.stdout);let client;
try{
 client=await GameEngineClient.connect(address,{client:'cartoon-navigation-warmup'});
 const call=(m,p={})=>client.call(m,p),step=n=>call('engine.step',{n,frames:true});
 const state=async()=>(await call('script.eval',{code:'(()=>{const g=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game;return {tick:g.Tick,phase:g.Party.Phase,timer:g.Party.Timer,bots:g.Companions.filter(Boolean).map(ai=>({nodes:ai.Graph?.Nodes.length??0,buildIndex:ai.Graph?.BuildIndex??null,ready:!!ai.Graph&&ai.Graph.BuildIndex===undefined}))};})()'})).value;
 await call('input.push',{events:[{type:'view',width:768,height:720,scale:1,insets:[0,0,0,0]}]});await step(5);
 await call('cheat.run',{id:'cartoon.party-reset',args:{team:10,humans:1,wave:1,countdown:180}});await step(1);
 for(let i=0;i<30;i++){await call('render.probe',{width:768,height:720,points:[[0,0]]});if((await call('assets.status')).pending===0)break;}
 const initial=await state();await call('perf.start');await step(179);const countdown=await call('perf.stats',{stop:true}),prepared=await state();
 await call('perf.start');await step(2);const firstCombat=await call('perf.stats',{stop:true}),combat=await state();
 const report={label,scenario:{tier:'mobile',team:10,humans:1,normalCountdown:180,seed:42,wave:1},initial,prepared,combat,countdown,firstCombat,limits:'Controlled engine headless CPU measurement on the host computer. Normal countdown, not a direct-to-boss shortcut. No physical phone timing claim.'};
 writeFileSync(`docs/cartoon-overhaul/navigation-warmup-${label}.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({label,prepared,combat,countdownMax:countdown.stepTimeMs?.max,firstCombatMax:firstCombat.stepTimeMs?.max}));
}finally{client?.close();try{process.kill(address.pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
