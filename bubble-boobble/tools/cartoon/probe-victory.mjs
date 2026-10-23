// Engine-only replay probes. Captures actual pipelines without controlling a desktop window.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/victory-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(root+'/.cache/victory-protocol.mjs');
const records=JSON.parse(readFileSync('pipelines.json','utf8')),rows=[];
// Retain other verified flows, dropping material variants no compiled project material has.
const known=new Set();
function materials(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())materials(p);else if(e.name.endsWith('.material.gen.json'))known.add(JSON.parse(readFileSync(p,'utf8')).hash);}}
materials('assets');let removed=0;
for(const tier of Object.keys(records))records[tier]=records[tier].filter(r=>{const p=r.r==='3d'?Object.values(r.key??{})[0]?.program:null;const keep=!p||known.has(p);if(!keep)removed++;return keep;});
const replays=['theatrical_victory_hero_board_and_full_ranking_stay_readable_and_navigable_across_screens','boss_finale_canisters_lightning_capture_celebration_and_results_fit_every_screen'];
for(const tier of ['mobile','desktop','compat'])for(const name of replays){
 const r=spawnSync('gameengine',['run','--headless','--paused','--ui-layout','--scene','scenes/cartoon.scene.json','--tier',tier,'--json'],{encoding:'utf8'});
 if(r.status)throw Error(r.stdout+r.stderr);const address=JSON.parse(r.stdout);let c;
 try{
  c=await GameEngineClient.connect(address,{client:'victory-composition-verification'});
  const probe=()=>c.call('render.probe',{width:1680,height:720,points:[[0,0]]});
  await c.call('engine.step',{n:3,frames:true});
  for(let i=0;i<30;i++){await probe();if((await c.call('assets.status',{})).pending===0)break;}
  await c.call('replay.load',{data:readFileSync(`tests/replays/${name}.greplay`).toString('base64')});
  await c.call('perf.start',{});let finished=false,peak=0,frames=0;
  for(let i=0;i<500;i++){
   await c.call('engine.step',{n:3,frames:true});await probe();frames++;
   peak=Math.max(peak,(await c.call('render.stats',{})).drawCalls);
   const status=await c.call('replay.status',{});if(status.diverged||status.divergence)throw Error(JSON.stringify(status));
   if(status.finished){finished=true;break;}
  }
  if(!finished)throw Error('Replay did not finish');
  if(peak>18)throw Error(`${tier}: ${peak} draws exceeds the 18-draw flow budget`);
  const perf=await c.call('perf.stats',{stop:true}),pipelines=await c.call('render.pipelines',{});
  if(pipelines.tier!==tier||!pipelines.pipelines?.length)throw Error('No actual pipeline records');
  const existing=new Set(records[tier].map(x=>JSON.stringify(x)));let added=0;
  for(const pipeline of pipelines.pipelines){
   const program=pipeline.r==='3d'?Object.values(pipeline.key??{})[0]?.program:null;
   // Stock variants have no project material asset; the engine derives those itself.
   if(program&&!known.has(program))continue;
   if(!existing.has(JSON.stringify(pipeline))){records[tier].push(pipeline);existing.add(JSON.stringify(pipeline));added++;}
  }
  rows.push({tier,replay:name,peakDrawCalls:peak,explicitFrames:frames,additionalPipelines:added,perf});
  console.log(tier,name,peak,'draws',added,'new pipelines');
 }finally{c?.close();try{process.kill(address.pid);}catch{}}
}
writeFileSync('pipelines.json',JSON.stringify(records,null,1)+'\n');
writeFileSync('docs/results-redesign/engine-probe.json',JSON.stringify({scope:'Headless Game Engine with explicit render probes on Apple M2 Max. Not physical phone GPU or thermal timings.',staleMaterialVariantsRemoved:removed,rows},null,2)+'\n');
