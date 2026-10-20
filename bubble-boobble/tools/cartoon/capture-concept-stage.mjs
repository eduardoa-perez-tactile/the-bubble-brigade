// Repeatable actual-engine composition captures, driven by recorded input only.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));process.chdir(root);
const comparison=process.argv.includes('--comparison');
const columns=comparison?44:60,rows=comparison?16:24,boardWidth=columns*24,boardHeight=rows*24,paddedHeight=boardHeight+148;
const out='docs/concept-playable';mkdirSync(out,{recursive:true});mkdirSync('.cache',{recursive:true});
await build({stdin:{contents:'export {GameEngineClient} from "./.gameengine/engine/packages/protocol-client/src/index.ts";',resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/concept-stage-capture-protocol.mjs',logLevel:'silent'});
const {GameEngineClient}=await import(fileURLToPath(new URL('../../.cache/concept-stage-capture-protocol.mjs',import.meta.url)));
const cli=args=>{const p=spawnSync('gameengine',[...args,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;if(p.status!==0)throw Error(p.stdout+p.stderr);return JSON.parse(p.stdout);};
const address=cli(['run','--headless','--paused','--ui-layout','--tier','mobile','--scene','scenes/cartoon.scene.json']);let client;
try{
  client=await GameEngineClient.connect(address,{client:'concept-stage-composition'});
  const call=(method,params={})=>client.call(method,params),step=n=>call('engine.step',{n,frames:true});
  const view=async(width,height)=>{await call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});await step(1);};
  const warm=async(width,height)=>{for(let i=0;i<40;i++){
    await call('render.probe',{width,height,points:[[0,0]]});
    if((await call('assets.status')).pending===0){await call('render.probe',{width,height,points:[[0,0]]});return;}
  }throw Error('Cartoon composition assets failed to finish loading');};
  await view(1536,864);await step(4);await warm(1536,864);
  if(!comparison){
  const idleBefore=await call('render.stats');await call('perf.start');await step(120);
  const idlePerf=await call('perf.stats',{stop:true}),idleAfter=await call('render.stats');
  await call('render.screenshot',{width:1536,height:864,path:`${out}/wide-title.png`});
  const titleStats=await call('render.stats');if(!titleStats.drawCalls||titleStats.drawCalls>14)throw Error(`Title drawcalls ${titleStats.drawCalls} exceed14`);
  writeFileSync(`${out}/idle-title.json`,JSON.stringify({steps:120,before:idleBefore,after:idleAfter,perf:idlePerf,titleStats,limits:'Host engine title window; forced screenshot follows the idle observation and is recorded separately. Not a physical phone power measurement.'},null,2)+'\n');
  }
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
  for(const [name,width,height] of (comparison?[['wide-combat-44x16',1536,864]]:[['wide-combat',1536,864],['native-combat',768,720],['tall-combat',640,960],['ultrawide-combat',2520,1080]])){
    await view(width,height);await warm(width,height);
    await call('render.screenshot',{width,height,path:`${out}/${name}.png`});
    const stats=await call('render.stats');
    if(!stats.drawCalls||stats.drawCalls>14)throw Error(`${name}: draw calls ${stats.drawCalls} violate 1..14`);
    const logicalWidth=Math.max(768,720*width/height),logicalHeight=Math.max(720,768*height/width);
    const footer=comparison?48:64,bottom=720-footer,scale=Math.min((logicalWidth-16)/boardWidth,(bottom-48)/paddedHeight);
    const stageTop=(48+bottom-paddedHeight*scale)/2,boardY=stageTop+140*scale;
    const framing={columns,rows,tiers:comparison?[3,6,9,12,15]:[3,8,13,18,23],logicalViewport:{width:logicalWidth,height:logicalHeight},scale,firstLedgeScreenY:(boardY+72*scale-(360-logicalHeight/2))*height/logicalHeight,floorLedgeScreenY:(boardY+(rows-1)*24*scale-(360-logicalHeight/2))*height/logicalHeight,stageWidthOccupancy:boardWidth*scale/logicalWidth,headerClearanceAtHighestJumpBadge:boardY-130*scale-48,floorArtFooterClearance:bottom-(boardY+(boardHeight+8)*scale),footer,source:'Expected bounds from the shared authored layout contract; actual image/camera captured beside them.'};
    captures.push({name,width,height,drawCalls:stats.drawCalls,atlasPages:stats.atlasPages,framing,camera:await call('camera.list')});
  }
  if(!comparison){
    for(const [name,id,args] of [
      ['wide-help','cartoon.overhaul',{scenario:'rescue',team:10,humans:10}],
      ['wide-start','cartoon.party-reset',{team:10,humans:10,wave:1,countdown:180}],
      ['wide-boss','cartoon.overhaul',{scenario:'boss',team:10,humans:10}],
    ]){
      await view(1536,864);await call('cheat.run',{id,args});await step(1);await warm(1536,864);
      await call('render.screenshot',{width:1536,height:864,path:`${out}/${name}.png`});
      const stats=await call('render.stats');if(!stats.drawCalls||stats.drawCalls>14)throw Error(`${name} drawcalls ${stats.drawCalls} exceed14`);
      captures.push({name,width:1536,height:864,drawCalls:stats.drawCalls,atlasPages:stats.atlasPages,camera:await call('camera.list')});
    }
  }
  if(!comparison){
    await call('cheat.run',{id:'concept.playtest',args:{scenario:'route'}});await step(1);
    await call('input.push',{events:[{type:'gamepadButton',pad:1,button:0,down:true}]});await step(22);
    await call('input.push',{events:[{type:'gamepadButton',pad:1,button:0,down:false}]});
    await call('cheat.run',{id:'concept.hit',args:{slot:1}});await step(1);await warm(1536,864);
    const state=(await call('script.eval',{code:'(()=>{const g=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game;const p=g.Players[1];return {X:p.X,Y:p.Y,Downed:p.Downed,Ground:p.Ground};})()'})).value;
    if(!state.Downed||state.Y>=0)throw Error(`Expected actual crown jump then injury, got ${JSON.stringify(state)}`);
    await call('render.screenshot',{width:1536,height:864,path:`${out}/wide-help-crown.png`});
    const stats=await call('render.stats');if(!stats.drawCalls||stats.drawCalls>14)throw Error('Crown HELP exceeded draw budget');
    captures.push({name:'wide-help-crown',width:1536,height:864,drawCalls:stats.drawCalls,state,camera:await call('camera.list')});
  }
  writeFileSync(`${out}/${comparison?'comparison-44x16':'composition-captures'}.json`,JSON.stringify({captures,setup:'Five-tier concept stage, ten human slots in the actual new arena; one recorded jump, one moving player and staggered one-shot fire inputs. Controlled engine QA composition, not a human-group readability certification.'},null,2)+'\n');
  console.log(JSON.stringify(captures.map(({name,width,height,drawCalls})=>({name,width,height,drawCalls}))));
}finally{client?.close();try{process.kill(address.pid);}catch(error){if(error.code!=='ESRCH')throw error;}}
