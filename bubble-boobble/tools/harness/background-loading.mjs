// Cold native-viewport loading regression. No offscreen render, screenshot,
// render probe, or explicit asset preload may warm the path under test.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {deflateSync} from 'node:zlib';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');process.chdir(root);
const args=process.argv.slice(2),measure=args.includes('--measure')||args.includes('--allow-pending'),direct=args.includes('--direct');
function option(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const width=Number(option('--width','1920')),height=Number(option('--height','1080')),tier=option('--tier','desktop');
const output=option('--output',`artifacts/background-loading${direct?'-direct':''}${measure?'-measure':''}`);
mkdirSync(dirname(output),{recursive:true});mkdirSync('.cache/harness',{recursive:true});
await build({entryPoints:['.gameengine/engine/packages/protocol-client/src/index.ts'],outfile:'.cache/harness/background-loading-protocol.mjs',bundle:true,platform:'node',format:'esm',target:'es2022',logLevel:'silent'});
const {GameEngineClient}=await import(resolve('.cache/harness/background-loading-protocol.mjs'));
function cli(command){const r=spawnSync('gameengine',[...command,'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw new Error(r.stdout+r.stderr);return JSON.parse(r.stdout);}
const started=performance.now(),report={ok:false,measure,direct,width,height,tier,scope:'Cold native readback viewport, installed engine CLI host; no offscreen render/probe/preload. Paused engine-step wall times and delivered viewport gaps are host diagnostics, not a phone frame-rate verdict.',frames:[]};
let notifications=[];
let client,address,viewport,lastFrame,received=0,phase='startup',lastDelivery,deliveryGaps=[],pipelineAtReveal,firstVisible;
const savedFrames=new Set(),queuedFrames=[];
function saveFrame(name,frame){if(!args.includes('--save-frames')||savedFrames.has(name)||!frame)return;savedFrames.add(name);queuedFrames.push({name,frame:{meta:{...frame.meta},payload:Buffer.from(frame.payload)}});}
function writeFrame(name,frame){
 const width=frame.meta.width,height=frame.meta.height,rgba=frame.payload;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
 const chunk=(kind,data)=>{const type=Buffer.from(kind),body=Buffer.concat([type,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)rows.set(rgba.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);
 const path=output+'-'+name+'.png';writeFileSync(path,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));(report.viewportImages??=[]).push(path);
}
const observationCode='(()=>{const u=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"desktop-ui"})));const d=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"})));const g=d?.game;const groups=JSON.parse(__gameengine_host("assets.stats","{}")).groups;return {cartoon:!!u?.cartoon,courtyardGroup:groups?.["courtyard-gameplay"],screen:u?.screen??"title",transitionAction:u?.transitionAction??"",transitionStartedStep:u?.transitionStartedStep??-1,transitionCommitted:!!u?.transitionCommitted,transitionHasTitle:!!u?.transitionHasTitle,partyRun:!!u?.partyRun,tick:g?.Tick??-1,arena:g?.Level.arena??"",state:g?.State,players:g?.Players.length??0}})()';
function brightness(frame){const w=frame.meta.width,h=frame.meta.height,p=frame.payload;let total=0,n=0;for(let y=Math.floor(h*.44);y<Math.floor(h*.56);y+=3)for(let x=Math.floor(w*.44);x<Math.floor(w*.56);x+=3){const i=(y*w+x)*4;total+=Math.max(p[i],p[i+1],p[i+2]);n++;}return n?total/n:0;}
async function sample(){
 const old=received,t0=performance.now();await client.call('engine.step',{n:1,frames:true});const stepMs=performance.now()-t0;
 // Wait only for this live viewport's readback notification, never draw one.
 for(let i=0;received===old&&i<60;i++)await delay(2);
 const [stats,assets,pipelines,observed,resources]=await Promise.all([client.call('render.stats',{}),client.call('assets.status',{}),client.call('render.pipelines',{}),client.call('script.eval',{code:observationCode}),client.call('world.resources',{})]);
 const o=observed.value??{},time=resources.resources.Time,readiness=resources.resources.RenderStatus;
 const elapsed=o.transitionStartedStep>=0?(time?.step??0)-o.transitionStartedStep:-1;
 const commitAt=o.transitionHasTitle?120:32,revealEndAt=o.transitionHasTitle?168:71;
 const gameplay=o.arena==='cartoon-courtyard'&&o.screen==='play';
 const visible=gameplay&&(!o.transitionAction||(o.transitionCommitted&&elapsed>commitAt));
 const fullyRevealed=gameplay&&(!o.transitionAction||(o.transitionCommitted&&elapsed>=revealEndAt));
 const row={phase,index:report.frames.length,stepMs,wallMs:performance.now()-started,frameIndex:lastFrame?.meta.frameIndex,delivered:received-old,...o,simStep:time?.step,elapsed,visible,fullyRevealed,assets,pendingAssets:readiness?.pendingAssets,pendingPipelines:readiness?.pendingPipelines,waitedFrames:readiness?.waitedFrames,drawCalls:stats.drawCalls,triangles:stats.triangles,pipelineCount:pipelines.pipelines.length,centerBrightness:lastFrame?brightness(lastFrame):null};
 report.frames.push(row);
 if(visible&&!firstVisible){firstVisible=row;pipelineAtReveal=new Set(pipelines.pipelines.map(p=>JSON.stringify(p)));report.firstVisible=row.index;saveFrame('first-reveal',lastFrame);}
 if(fullyRevealed)saveFrame('fully-revealed',lastFrame);
 if(fullyRevealed&&o.tick>=180)saveFrame('dragon-tick-180',lastFrame);
 if(!measure&&visible){assert.ok(stepMs<=250,`Visible gameplay frame ${row.index} stalled ${stepMs.toFixed(1)} ms`);assert.equal(o.courtyardGroup?.status,'loaded',`Courtyard group is not pinned at frame ${row.index}`);assert.equal(o.courtyardGroup?.progress,1,`Courtyard group is incomplete at frame ${row.index}`);assert.ok((o.courtyardGroup?.resident?.textures??0)>0,`Courtyard textures are not resident at frame ${row.index}`);assert.deepEqual(o.courtyardGroup?.failed,[],`Courtyard group failed assets at frame ${row.index}`);if(!fullyRevealed){assert.equal(assets.pending,0,`Opening iris frame ${row.index} has pending assets`);assert.equal(readiness?.pendingAssets??0,0,`Opening iris frame ${row.index} rendered without ready assets`);assert.equal(readiness?.pendingPipelines??0,0,`Opening iris frame ${row.index} has pending pipelines`);}const late=pipelines.pipelines.filter(p=>!pipelineAtReveal.has(JSON.stringify(p)));assert.deepEqual(late,[],`Pipelines were created after gameplay reveal at frame ${row.index}`);}
 if(!measure&&fullyRevealed)assert.ok(row.centerBrightness>10,`Courtyard center remained black after reveal at frame ${row.index}: ${row.centerBrightness}`);
 return row;
}
async function emit(action,value=''){await client.call('input.push',{events:[{type:'event',name:'DesktopIntent',data:JSON.stringify({action,value,index:0,x:0,y:0})}]});}
try{
 address=cli(['run','--headless','--paused','--ui-layout','--scene','scenes/cartoon.scene.json','--tier',tier]);report.startupMs=performance.now()-started;const {token,...host}=address;report.host=host;
 client=await GameEngineClient.connect(address,{client:'cold-background-loading'});
 client.onNotification((method,params)=>{if(/log|error|crash|warn/i.test(method))notifications.push({method,params});});
 client.onFrame(frame=>{if(frame.kind!==1||frame.meta.viewportId!==viewport?.viewportId)return;const now=performance.now();if(lastDelivery!==undefined)deliveryGaps.push({phase,ms:now-lastDelivery,frameIndex:frame.meta.frameIndex});lastDelivery=now;lastFrame=frame;received++;void client.call('viewport.frameConsumed',{viewportId:frame.meta.viewportId,slot:frame.meta.slot}).catch(()=>{});});
 viewport=await client.call('viewport.create',{width,height,mode:'readback'});assert.equal(viewport.mode,'readback');
 await client.call('input.push',{events:[{type:'view',width,height,scale:1,insets:[0,0,0,0]}]});
 await client.call('perf.start',{});
 // A player cannot activate buttons before the cartoon UI has mounted.
 // Bootstrap only that readiness; --title-frames 0 adds no menu dwell.
 phase='bootstrap';let bootReady=false;for(let i=0;i<12;i++){if((await sample()).cartoon){bootReady=true;break;}}assert.ok(bootReady,'Cartoon UI did not initialize');
 phase='title';for(let i=0;i<Number(option('--title-frames','30'));i++)await sample();
 report.titleHash=await client.call('world.hash',{});
 phase='launch';
 if(direct)await client.call('cheat.run',{id:'concept.playtest',args:{scenario:'route'}});
 else {await emit('party');await sample();await emit('ui-activate','start-party');}
 let end;for(let i=0;i<480;i++){end=await sample();if(end.fullyRevealed&&end.tick>=200)break;}
 assert.ok(firstVisible,'No courtyard gameplay reveal observed');assert.ok(lastFrame&&received>Number(option('--title-frames','30')),'No continuing native viewport frames');assert.ok(end?.tick>=200,'Dragon phase at tick 180 was not reached');
 report.finalHash=await client.call('world.hash',{});report.perf=await client.call('perf.stats',{stop:true});report.markers=await client.call('profile.markers',{});
 report.ok=true;
}catch(error){report.error=String(error);process.exitCode=1;}
finally{
 if(client){report.logs=notifications;client.close();}
 if(address?.pid)try{process.kill(address.pid);}catch{}
 report.deliveryGaps=deliveryGaps;report.receivedFrames=received;
 const visibleRows=report.frames.filter(f=>f.visible);
 report.visibleReadiness={globalPendingMax:Math.max(0,...visibleRows.map(f=>f.assets.pending)),renderPendingAssetsMax:Math.max(0,...visibleRows.map(f=>f.pendingAssets??0)),renderPendingPipelinesMax:Math.max(0,...visibleRows.map(f=>f.pendingPipelines??0)),laterPending:visibleRows.filter(f=>f.fullyRevealed&&(f.assets.pending>0||(f.pendingAssets??0)>0||(f.pendingPipelines??0)>0)).map(f=>({index:f.index,tick:f.tick,assets:f.assets,renderPendingAssets:f.pendingAssets,renderPendingPipelines:f.pendingPipelines,courtyardGroup:f.courtyardGroup})),finalCourtyardGroup:visibleRows.at(-1)?.courtyardGroup};
 for(const p of ['title','launch']){const rows=report.frames.filter(f=>f.phase===p),times=rows.map(f=>f.stepMs).sort((a,b)=>a-b);report[p+'Summary']={frames:rows.length,maxStepMs:times.at(-1),p95StepMs:times[Math.floor(times.length*.95)],maxDeliveredFrameGapMs:Math.max(0,...deliveryGaps.filter(g=>g.phase===p).map(g=>g.ms)),maxPendingAssets:Math.max(0,...rows.map(f=>f.assets.pending)),maxDrawCalls:Math.max(0,...rows.map(f=>f.drawCalls))};}
 for(const {name,frame} of queuedFrames)writeFrame(name,frame);
 writeFileSync(output+'.json',JSON.stringify(report,null,2)+'\n');writeFileSync(output+'.log',JSON.stringify(report.logs??report.consoleUnavailable,null,2)+'\n');
 console.log(JSON.stringify({ok:report.ok,error:report.error,json:output+'.json',log:output+'.log',title:report.titleSummary,launch:report.launchSummary,firstVisible:report.firstVisible,receivedFrames:received}));
}
