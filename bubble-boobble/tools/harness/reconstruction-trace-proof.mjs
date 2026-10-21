// Execute after final T0 traces exist and only with the coordinated engine slot.
import {readdirSync,copyFileSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd(),output=resolve(root,'docs/concept-reconstruction');
const original=resolve(root,'.gameengine/cartoon-overhaul-baseline/v8');
const immediate=resolve(root,'.gameengine/concept-reconstruction-baseline/v8');
const final=resolve(root,'.gameengine/concept-reconstruction-final/v8');
const subset=resolve(root,'.gameengine/concept-reconstruction-original-only/v8');
const files=directory=>readdirSync(directory).filter(file=>file.endsWith('.hashtrace')).sort();
assert.equal(files(original).length,280);
rmSync(subset,{recursive:true,force:true});mkdirSync(subset,{recursive:true});
for(const file of files(original)){assert.ok(files(final).includes(file),`Missing protected trace ${file}`);copyFileSync(resolve(final,file),resolve(subset,file));}
const diff=(a,b,name)=>{
 const run=spawnSync('gameengine',['trace','diff',a,b,'--json'],{encoding:'utf8',maxBuffer:64*1024*1024});
 assert.ok(run.status===0||run.status===1,run.stderr);
 const report=JSON.parse(run.stdout);writeFileSync(resolve(output,name),JSON.stringify(report,null,2)+'\n');return report;
};
const protectedDiff=diff(original,subset,'original-trace-diff.json');
assert.equal(protectedDiff.tests.length,280);
assert.ok(protectedDiff.tests.every(test=>test.ok&&test.allowed===0), 'Original simulation divergence');
const currentDiff=diff(immediate,final,'immediate-baseline-trace-diff.json');
const baselineFiles=new Set(files(immediate));
const report={protectedOriginalTests:{expected:280,identical:280,allowances:0,divergences:[]},
 immediatePreReconstructionBaseline:{expected:305,identical:currentDiff.tests.filter(test=>baselineFiles.has(test.file)&&test.ok).length,
 divergences:currentDiff.tests.filter(test=>baselineFiles.has(test.file)&&!test.ok)},
 newTests:files(final).filter(file=>!baselineFiles.has(file)),
 note:'Protected original files are compared in a dedicated subset with zero allowances. Immediate-baseline divergences require individual classification; this tool does not grant allowances or classify failures as intentional.'};
writeFileSync(resolve(output,'simulation-trace-proof.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({protected:280,immediateIdentical:report.immediatePreReconstructionBaseline.identical,newTests:report.newTests.length}));
