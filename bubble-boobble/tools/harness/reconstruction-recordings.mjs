// Run only with the coordinated engine slot. Previous recordings are never replaced.
// The supplied bundle must be the final test bundle from an explicit desktop T1 run.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const bundle=resolve(root,process.argv[2]??'.gameengine/test-bundle.js');
const host=resolve(root,'.gameengine/engine/target/release/gameengine-host');
const temporary=resolve(root,'.gameengine/reconstruction-recordings');
const output=resolve(root,'docs/concept-reconstruction');
mkdirSync(temporary,{recursive:true});mkdirSync(output,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(args)=>{
 const result=spawnSync(host,['--mode','headless','--project',root,'--bundle',bundle,'--js','v8',...args],
  {cwd:root,env:{...process.env,TZ:'UTC'},encoding:'utf8',maxBuffer:64*1024*1024,timeout:180000});
 let report;try{report=JSON.parse(result.stdout);}catch{throw new Error(result.error?.message??result.stderr??'No host JSON');}
 return {status:result.status,report};
};
const recording=run(['--test','--test-tiers','t1','--tier','desktop','--memory-class','phone-low',
 '--filter','*checkpoint*','--record-tests',temporary,'--record-checkpoint-every','1']);
writeFileSync(resolve(output,'recording-test-run.json'),JSON.stringify(recording.report,null,2)+'\n');
assert.equal(recording.status,0,'Checkpoint test recording failed');
const sources=readdirSync(temporary).filter(name=>name.endsWith('.greplay'));
assert.equal(sources.length,5,'Expected exactly five current checkpoint streams');
const results=[];
for(const file of sources){
 assert.match(file,/^(concept|refinement|reconstruction)_checkpoint_/);
 const destination=file.replace(/^(concept|refinement|reconstruction)_checkpoint_/,'reconstruction_checkpoint_');
 const path='tests/replays/'+destination;
 assert.ok(path.startsWith('tests/replays/reconstruction_checkpoint_'));
 copyFileSync(resolve(temporary,file),resolve(root,path));
 const bytes=readFileSync(resolve(root,path));assert.equal(bytes.subarray(0,8).toString(),'GAMERPL1');
 const header=JSON.parse(bytes.subarray(12,12+bytes.readUInt32LE(8)).toString());
 const verification=run(['--scene','scenes/cartoon.scene.json','--tier','desktop','--verify',resolve(root,path)]);
 results.push({path,sha256:sha(bytes),header,scene:'scenes/cartoon.scene.json',gpuTier:'desktop',checkpointEvery:1,verification:verification.report});
}
const ok=results.every(result=>result.verification.ok===true);
const report={ok,total:results.length,steps:results.reduce((sum,r)=>sum+r.header.steps,0),bundleSha256:sha(readFileSync(bundle)),
 note:'Five newly named reconstruction streams recorded on explicit desktop with phone-low residency. Original refinement, concept, overhaul and slice streams are retained unchanged. Verification selects the cartoon scene explicitly.',results};
writeFileSync(resolve(output,'new-replays.json'),JSON.stringify(report,null,2)+'\n');
assert.equal(ok,true,'New reconstruction replay verification failed; active budgets retained');
const budgets=[['cartoon-overhaul-menus.json','all_menu_routes'],['cartoon.json','real_player_climbs'],
 ['cartoon-rescue.json','responsive_actual_rescue'],['refinement-device-fit.json','actual_enlarged_actors'],['reconstruction-reference-fit.json','controlled_reference_poses']];
for(const [file,match]of budgets){
 const replay=results.find(result=>result.path.includes(match))?.path;assert.ok(replay);
 writeFileSync(resolve(root,'tests/budgets',file),JSON.stringify({replay,structural:{drawCallsMax:14}},null,2)+'\n');
}
console.log(JSON.stringify({ok,total:report.total,steps:report.steps}));
