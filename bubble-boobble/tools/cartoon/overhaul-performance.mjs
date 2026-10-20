// Engine-only probes for the new geometry. No standalone player, OS input or browser.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const argv=process.argv.slice(2),tiers=argv.includes('--all-tiers')?['mobile','desktop','compat']:['mobile'];
if(argv.some(arg=>arg!=='--all-tiers'))throw Error('Usage: node tools/cartoon/overhaul-performance.mjs [--all-tiers]');
const out='docs/cartoon-overhaul';mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/cartoon-overhaul-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/cartoon-overhaul-protocol.mjs',import.meta.url)));
const cli=args=>{const r=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw Error(r.stdout+r.stderr);return JSON.parse(r.stdout);};
const summary=p=>({steps:p.steps,frames:p.frames,stepTimeMs:p.stepTimeMs,presentationTimeMs:p.presentationTimeMs,scriptTimeMs:p.scriptTimeMs,memoryMB:p.memoryMB,jsHeapMB:p.jsHeapMB,gcMaxMs:p.gcMaxMs,gcPausesOver4ms:p.gcPausesOver4ms,pipelinesCreatedDuringCapture:p.pipelinesCreatedDuringCapture});
const rows=[];
for(const tier of tiers)for(const [team,humans] of [[6,1],[10,1],[10,10]]){
  const address=cli(['run','--headless','--paused','--ui-layout','--tier',tier,'--scene','scenes/cartoon.scene.json']);let client;
  try{
    client=await GameEngineClient.connect(address,{client:'cartoon-overhaul-performance'});
    const call=(name,params={})=>client.call(name,params),step=n=>call('engine.step',{n,frames:true});
    const probe=(width=768,height=720)=>call('render.probe',{width,height,points:[[0,0]]});
    const warm=async()=>{for(let n=0;n<40;n++){await probe();if((await call('assets.status')).pending===0){await probe();return;}}throw Error('New cartoon assets remained pending after 40 actual renders');};
    await call('input.push',{events:[{type:'view',width:768,height:720,scale:1,insets:[0,0,0,0]}]});
    await step(5);await warm();await call('perf.start');
    await call('cheat.run',{id:'cartoon.overhaul',args:{scenario:'boss',team,humans}});
    await step(2);await warm();const startup=summary(await call('perf.stats',{stop:true}));
    await call('input.push',{events:Array.from({length:humans},(_,pad)=>({type:'gamepadButton',pad,button:2,down:true}))});
    await step(60);await warm();await call('perf.start');
    let peakDraws=0;const draws=[];
    for(let sample=0;sample<10;sample++){await step(60);await probe();const r=await call('render.stats');if(!r.drawCalls)throw Error('Empty new arena render');draws.push(r.drawCalls);peakDraws=Math.max(peakDraws,r.drawCalls);}
    const steady=summary(await call('perf.stats',{stop:true}));
    const observed=(await call('script.eval',{code:'(()=>{const g=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game;return {arena:g.Level.arena,players:g.Players.length,alive:g.Players.filter(p=>p.Lives>0&&!p.Downed).length,bots:g.Companions.filter(Boolean).length,tick:g.Tick,phase:g.Party.Phase,bubbles:g.Bubbles.length,bossHP:g.Party.Boss?.HP};})()'})).value;
    if(observed.arena!=='cartoon-courtyard'||observed.players!==team||observed.alive!==team||observed.bots!==team-humans||observed.phase!=='boss'||steady.steps!==600)throw Error(`Stress scenario escaped its expected state: ${JSON.stringify(observed)}`);
    if(peakDraws>14)throw Error(`New arena peak ${peakDraws} exceeds existing 14-draw budget`);
    const assets=await call('assets.status'),memory=await call('profile.memory'),markers=await call('profile.markers');
    const assetResidency=(await call('script.eval',{code:'JSON.parse(__gameengine_host("assets.stats","{}"))'})).value;
    await call('input.push',{events:Array.from({length:humans},(_,pad)=>({type:'gamepadButton',pad,button:2,down:false}))});
    const content=[];
    for(const scenario of ['enemies','capture','items','elements','rescue','boss-captured','victory']){
      await call('cheat.run',{id:'cartoon.overhaul',args:{scenario,team,humans}});await step(1);await warm();
      if(scenario==='victory'){await step(2);await warm();}
      let peak=0;
      for(const [width,height] of [[768,720],[1680,720],[640,960],[2520,1080]]){
        await call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});await step(1);
        await probe(width,height);const render=await call('render.stats');peak=Math.max(peak,render.drawCalls);
      }
      if(peak>14)throw Error(`${scenario}: ${peak} draws exceeds existing 14-draw budget`);
      content.push({scenario,peakDraws:peak,assets:await call('assets.status')});
    }
    const pipelines=await call('render.pipelines');
    rows.push({tier,team,humans,bots:team-humans,hostProfile:address.host?.profile??'unknown',startup,steady,peakDraws,draws,observed,assets,assetResidency,memory,markers,content});
    writeFileSync(`${out}/observed-pipelines-${tier}-${team}-${humans}.json`,JSON.stringify(pipelines,null,2)+'\n');
    console.log(JSON.stringify({tier,team,humans,peakDraws,stepP95:steady.stepTimeMs?.p95,presentationP95:steady.presentationTimeMs?.p95,memoryMB:steady.memoryMB}));
  }finally{client?.close();try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}}
}
const report={scenario:{geometry:'cartoon-courtyard',seed:42,bossWave:10,warmupSteps:60,measuredSteps:600,stressSamples:10,probeSizes:[[768,720],[1680,720],[640,960],[2520,1080]]},rows,limits:'Release-host V8 headless engine sessions on this computer with explicit GPU render requests. New geometry differs intentionally from original pixel geometry, so no cross-layout state-equivalence claim is made. phone-low residency is separately enforced by T1 tests; these sampled CPU/structure numbers do not establish phone GPU timing, physical controllers, sustained frame rate, thermals or human group readability.'};
writeFileSync(`${out}/performance.json`,JSON.stringify(report,null,2)+'\n');console.log(`Saved ${out}/performance.json`);
