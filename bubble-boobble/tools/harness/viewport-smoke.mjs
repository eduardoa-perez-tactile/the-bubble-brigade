// Cold live-viewport regression. Offscreen screenshots can initialize the 3D
// renderer and hide a missing world mesh, so this tool never requests one.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {deflateSync} from 'node:zlib';
import {build} from '../../.gameengine/engine/node_modules/esbuild/lib/main.js';
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
const concept=process.argv.includes('--concept');
const cartoon=concept||process.argv.includes('--cartoon');
const scene=cartoon?'scenes/cartoon.scene.json':'scenes/arcade.scene.json';
const output=concept?'artifacts/viewport-smoke-concept':cartoon?'artifacts/viewport-smoke-cartoon':'artifacts/viewport-smoke';
mkdirSync('.cache/harness',{recursive:true});mkdirSync('artifacts',{recursive:true});
await build({entryPoints:['.gameengine/engine/packages/protocol-client/src/index.ts'],outfile:'.cache/harness/viewport-protocol.cjs',bundle:true,platform:'node',format:'cjs',target:'es2022'});
const {GameEngineClient}=createRequire(import.meta.url)(resolve('.cache/harness/viewport-protocol.cjs'));
const bundle=JSON.parse(execFileSync('gameengine',['bundle','--json'],{encoding:'utf8'})).path;
const host=spawn(resolve('.gameengine/engine/target/release/gameengine-host'),['--mode','headless','--project',process.cwd(),'--bundle',bundle,'--scene',scene,'--serve','127.0.0.1:0','--paused','--ui-layout'],{stdio:['ignore','pipe','pipe']});
let log='',address,client,last,viewport,frames=0;
const report={ok:false,scene,cartoon,concept,scope:'cold live readback viewport; no offscreen render or preload'};
const watchdog=setTimeout(()=>{report.error='Cold viewport exceeded 30 seconds';host.kill('SIGTERM');},30000);
host.stdout.on('data',d=>{log+=d;for(const line of log.split('\n'))try{const p=JSON.parse(line);if(p.ws&&p.token)address=p;}catch{}});
host.stderr.on('data',d=>log+=d);
function png(frame){
 const width=frame.meta.width,height=frame.meta.height,rgba=frame.payload;
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
 const chunk=(kind,data)=>{const type=Buffer.from(kind),body=Buffer.concat([type,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)rows.set(rgba.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
function count(frame,rect,predicate){
 const width=frame.meta.width,height=frame.meta.height,scale=Math.min(width/768,height/720),ox=(width-768*scale)/2,oy=(height-720*scale)/2;
 let found=0,total=0;
 for(let y=Math.ceil(oy+rect[1]*scale);y<Math.floor(oy+rect[3]*scale);y++)for(let x=Math.ceil(ox+rect[0]*scale);x<Math.floor(ox+rect[2]*scale);x++){
  const i=(y*width+x)*4;total++;if(predicate(frame.payload[i],frame.payload[i+1],frame.payload[i+2]))found++;
 }
 return {found,total};
}
try{
 for(let i=0;i<200&&!address;i++){if(host.exitCode!==null)throw new Error('Cold viewport host exited before ready');await delay(25);}
 assert.ok(address,'Cold viewport host did not start');
 client=await GameEngineClient.connect(address,{client:'cold-viewport-smoke'});
 report.assetsBefore=await client.api.script.eval({code:'JSON.parse(__gameengine_host("assets.stats","{}"))'});
 client.onFrame(frame=>{if(frame.kind===1&&frame.meta.viewportId===viewport?.viewportId){last=frame;frames++;void client.api.viewport.frameConsumed({viewportId:frame.meta.viewportId,slot:frame.meta.slot}).catch(()=>{});}});
 viewport=await client.api.viewport.create({width:1920,height:1080,mode:'readback'});
 assert.equal(viewport.mode,'readback');
 if(concept)await client.api.input.push({events:[{type:'view',width:1920,height:1080,scale:1,insets:[0,0,0,0]}]});
 await client.api.engine.step({n:2,frames:true});
 await client.api.cheat.run(concept?{id:'concept.playtest',args:{scenario:'route'}}:{id:'arcade.reset',args:{round:1,seed:42,ready:false}});
 // Several actual viewport frames allow ordinary asynchronous asset loading,
 // without calling render.screenshot, render.stats(render:true), or a preview.
 for(let i=0;i<20;i++){await client.api.engine.step({n:1,frames:true});await delay(40);}
 assert.ok(last,'No live viewport pixels arrived');assert.equal(last.meta.format,'rgba8');
 assert.equal(last.payload.length,last.meta.width*last.meta.height*4);
 writeFileSync(output+'.png',png(last));
 const tile=concept
  ?count(last,[-256,100,1024,650],(r,g,b)=>r>35&&r<195&&g>35&&g<195&&b>35&&b<195&&Math.max(r,g,b)-Math.min(r,g,b)<70)
  :cartoon
  ?count(last,[2,50,766,70],(r,g,b)=>r>35&&r<195&&g>35&&g<195&&b>35&&b<195&&Math.max(r,g,b)-Math.min(r,g,b)<70)
  :count(last,[2,50,766,70],(r,g,b)=>r>160&&b>160);
 const player=concept
  ?count(last,[-256,100,1024,650],(r,g,b)=>g>110&&g>r*1.08&&g>b*1.2&&r>70&&r<190)
  :cartoon
  ?count(last,[64,560,160,672],(r,g,b)=>g>110&&g>r*1.08&&g>b*1.2&&r>70&&r<190)
  :count(last,[64,560,160,672],(r,g,b)=>g>150&&g>r*1.4&&g>b*1.4);
 const stats=await client.api.render.stats({});
 report.assetsAfter=await client.api.script.eval({code:'JSON.parse(__gameengine_host("assets.stats","{}"))'});
 if(cartoon)report.tileAppearance='painted neutral stone';
 Object.assign(report,{width:last.meta.width,height:last.meta.height,frames,frameIndex:last.meta.frameIndex,tile,player,drawCalls:stats.drawCalls,triangles:stats.triangles});
 assert.ok(tile.found>tile.total*(concept ? .05 : .8),`World tile band missing: ${tile.found}/${tile.total} pixels`);
 assert.ok(player.found>20,`Player sprite missing: ${player.found} green pixels`);
 if(concept){
  report.geometry=(await client.api.script.eval({code:'(()=>{const g=JSON.parse(__gameengine_host("doc.get",JSON.stringify({name:"arcade.session"}))).game;return {arena:g.Level.arena,columns:g.Level.tiles[0].length,rows:g.Level.tiles.length,players:g.Players.length};})()'})).value;
  assert.equal(report.geometry.arena,'cartoon-courtyard');assert.equal(report.geometry.columns,60);assert.equal(report.geometry.rows,24);assert.equal(report.geometry.players,10);
 }
 if(cartoon){
  const queried=await client.api.world.query({components:['Sprite','MeshRenderer'],limit:8192});
  const sprites=queried.entities.filter(e=>e.components.Sprite?.visible&&e.components.Sprite?.blend==='Alpha'&&e.components.Sprite?.maskInteraction==='VisibleInside'&&!e.components.MeshRenderer?.mesh);
  report.nativeAlphaSprites=sprites.length;
  assert.ok(sprites.length>10,`Filtered cartoon sprite path missing: ${sprites.length} native alpha sprites`);
 }else assert.ok(stats.triangles>500,`World mesh did not contribute triangles: ${stats.triangles}`);
 report.ok=true;
}catch(error){report.error=String(error);process.exitCode=1;}
finally{
 clearTimeout(watchdog);client?.close();if(host.exitCode===null){host.kill('SIGTERM');await once(host,'exit');}
 writeFileSync(output+'.json',JSON.stringify(report,null,2)+'\n');writeFileSync(output+'.log',log);console.log(JSON.stringify(report));
}
