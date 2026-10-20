import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {GameEngineClient} from './pipeline-client.mjs';
const r=spawnSync('gameengine',['run','--headless','--paused','--ui-layout','--scene','.cache/standard-proof.scene.json','--tier','desktop','--json'],{encoding:'utf8'});
if(r.status!==0)throw Error(r.stdout+r.stderr);
const address=JSON.parse(r.stdout);let client;
try {
 client=await GameEngineClient.connect(address);
 await client.call('engine.step',{n:2,frames:true});
 for(let n=0;n<5;n++)await client.call('render.probe',{width:768,height:720,points:[[0,0]]});
 await client.call('render.materialPreview',{material:'materials/standard-compat.material.ts',shape:'quad',size:32});
 const pipelines=await client.call('render.pipelines',{});
 const logs=await client.call('log.tail',{n:200});
 const report={pipelines,logs};writeFileSync('artifacts/standard-registration-proof.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
} finally {client?.close();process.kill(address.pid);}
