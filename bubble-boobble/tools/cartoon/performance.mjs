// Controlled engine-only comparison. Never starts a standalone player or takes focus.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
process.chdir(root);
const args=process.argv.slice(2),record=args.includes('--record-pipelines');
if(args.some(arg=>arg!=='--record-pipelines'))throw Error('Usage: node tools/cartoon/performance.mjs [--record-pipelines]');
const tiers=record?['mobile','desktop','compat']:['mobile'];
const out='docs/cartoon-slice';
mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/cartoon-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/cartoon-protocol.mjs',import.meta.url)));
const cli=argv=>{
  const result=spawnSync('gameengine',[...argv,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error(result.stdout+result.stderr);
  return JSON.parse(result.stdout);
};
const perfSummary=p=>({steps:p.steps,frames:p.frames,stepTimeMs:p.stepTimeMs,presentationTimeMs:p.presentationTimeMs,
  scriptTimeMs:p.scriptTimeMs,memoryMB:p.memoryMB,jsHeapMB:p.jsHeapMB,gcMaxMs:p.gcMaxMs,
  gcPausesOver4ms:p.gcPausesOver4ms,gcIdleMs:p.gcIdleMs,pipelinesCreatedDuringCapture:p.pipelinesCreatedDuringCapture});
const observeCode='(()=>{const d=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"})));const g=d.game;return {game:g,players:g.Players.length,alive:g.Players.filter(p=>p.Lives>0&&!p.Downed).length,bots:g.Companions.filter(Boolean).length,bubbles:g.Bubbles.length,enemies:g.Enemies.length,tick:g.Tick,phase:g.Party.Phase,bossHP:g.Party.Boss?.HP}})()';
const rows=[],records={};

for(const tier of tiers)for(const theme of ['pixel','cartoon']){
  const address=cli(['run','--headless','--paused','--ui-layout','--tier',tier,'--scene',`scenes/${theme==='pixel'?'arcade':'cartoon'}.scene.json`]);
  let client;
  try{
    client=await GameEngineClient.connect(address,{client:'cartoon-performance'});
    const call=(method,params={})=>client.call(method,params);
    const step=n=>call('engine.step',{n,frames:true});
    const cheat=(id,args={})=>call('cheat.run',{id,args});
    const probe=()=>call('render.probe',{width:768,height:720,points:[[0,0]]});
    let warmupProbes=0;
    const warm=async()=>{
      for(let i=0;i<40;i++){
        await probe();warmupProbes++;
        if((await call('assets.status')).pending===0){await probe();warmupProbes++;return;}
      }
      throw Error(`${theme}/${tier}: assets remained pending after 40 explicit render requests`);
    };
    const intent=async action=>{
      await call('input.push',{events:[{type:'event',name:'DesktopIntent',data:JSON.stringify({action,index:0,value:'',x:0,y:0})}]});
      await step(1);await warm();
    };

    await step(3);await warm();
    await call('perf.start');
    await cheat('party.reset',{team:10,wave:10,humans:1,countdown:1});
    await step(2);await warm();
    const startup=perfSummary(await call('perf.stats',{stop:true}));
    const startupAssets=await call('assets.status');
    await cheat('party.protect-team');
    await step(60);
    await call('input.push',{events:[{type:'gamepadButton',pad:0,button:2,down:true}]});
    await warm();
    await call('perf.start');
    let peakDraws=0;
    const drawCalls=[];
    for(let i=0;i<10;i++){
      await step(60);await probe();
      const stats=await call('render.stats');
      if(!stats.drawCalls)throw Error(`${theme}/${tier}: explicit render was empty`);
      peakDraws=Math.max(peakDraws,stats.drawCalls);drawCalls.push(stats.drawCalls);
    }
    const steady=perfSummary(await call('perf.stats',{stop:true}));
    const [render,memory,assets,markers,observation]=await Promise.all([
      call('render.stats'),call('profile.memory'),call('assets.status'),call('profile.markers'),call('script.eval',{code:observeCode}),
    ]);
    const {game,...observed}=observation.value;
    if(observed.players!==10||observed.alive!==10||observed.bots!==9||observed.phase!=='boss')throw Error(`${theme}/${tier}: boss stress scenario did not remain active: ${JSON.stringify(observed)}`);
    if(steady.steps!==600)throw Error(`${theme}/${tier}: expected 600 measured steps, got ${steady.steps}`);
    if(peakDraws>14)throw Error(`${theme}/${tier}: ${peakDraws} draws exceeds the existing 14-draw budget`);
    const stateSha256=createHash('sha256').update(JSON.stringify(game)).digest('hex');
    rows.push({theme,tier,hostProfile:address.host?.profile??'unknown',observed,stateSha256,startup,steady,
      peakDraws,drawCalls,warmupProbes,startupAssets,assets,memory,render,markers});
    console.log(JSON.stringify({theme,tier,startupStepMax:startup.stepTimeMs?.max,stepP95:steady.stepTimeMs?.p95,
      presentationP95:steady.presentationTimeMs?.p95,memoryMB:steady.memoryMB,gcMaxMs:steady.gcMaxMs,peakDraws,stateSha256}));

    // Pipeline coverage is explicit and separate from the controlled CPU capture.
    if(record){
      await call('input.push',{events:[{type:'gamepadButton',pad:0,button:2,down:false}]});
      await intent('menu');await intent('party');
      await cheat('party.reset',{team:10,wave:1,humans:1,countdown:1});await step(2);await warm();
      await cheat('cartoon.capture-states');await step(1);await warm();
      await cheat('party.rescue-setup');await step(1);await warm();
      await call('input.push',{events:[{type:'gamepadAxis',pad:0,axis:0,value:1}]});await step(30);await warm();
      await call('input.push',{events:[{type:'gamepadAxis',pad:0,axis:0,value:0}]});
      await cheat('party.reset',{team:10,wave:10,humans:1,countdown:1});await step(2);await warm();
      await cheat('party.boss-duel',{captured:true});await step(1);await warm();
      await cheat('party.finish-boss');await step(40);await warm();
      const pipeline=await call('render.pipelines');
      if(pipeline.tier!==tier||!pipeline.pipelines?.length)throw Error(`${theme}/${tier}: missing actual pipeline records`);
      records[tier]??=[];records[tier].push(...pipeline.pipelines);
      rows.at(-1).pipelines=pipeline.pipelines.length;
    }
  }finally{
    client?.close();
    // This process owns exactly this host. Never stop somebody else's session.
    try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}
  }
}

for(const tier of tiers){
  const pair=rows.filter(row=>row.tier===tier);
  if(pair[0].stateSha256!==pair[1].stateSha256)throw Error(`${tier}: authoritative game state differs between pixel and cartoon inputs`);
}
const report={scenario:{team:10,humans:1,bots:9,seed:42,wave:10,warmupSteps:60,measuredSteps:600,renderProbes:10,size:[768,720],uiLayout:true},
  simulationStateIdentical:true,rows,
  limits:'Release-host V8 engine sessions; explicit GPU render probes and sampled presentation, with simulation paused between protocol requests. CPU and structural comparison only. GPU timing, phone frame rate, physical controllers, thermals and human group readability remain unverified.'};
writeFileSync(`${out}/performance.json`,JSON.stringify(report,null,2)+'\n');
if(record){
  const existing=JSON.parse(readFileSync('pipelines.json','utf8'));
  const additions={};
  for(const [tier,observed] of Object.entries(records)){
    const seen=new Set((existing[tier]??[]).map(key=>JSON.stringify(key)));
    existing[tier]??=[];additions[tier]=0;
    for(const key of observed){const encoded=JSON.stringify(key);if(!seen.has(encoded)){seen.add(encoded);existing[tier].push(key);additions[tier]++;}}
    writeFileSync(`${out}/pipelines-${tier}.json`,JSON.stringify(observed.filter((key,index,array)=>array.findIndex(other=>JSON.stringify(key)===JSON.stringify(other))===index),null,2)+'\n');
  }
  writeFileSync('pipelines.json',JSON.stringify(existing,null,1)+'\n');
  console.log(JSON.stringify({pipelineAdditions:additions,preservedHistoricalRecords:true}));
}
console.log(`Saved ${out}/performance.json; pixel/cartoon authoritative game state is identical.`);
