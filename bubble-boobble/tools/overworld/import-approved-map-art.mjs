/** Native asset preparation only: crop/resize approved transparent drawings.
 * No repainting, generated expectations or map-painting writes. macOS sips required. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
process.chdir(root);
const sources='tools/overworld/mission-crest-sources';
const scratch=mkdtempSync(resolve(tmpdir(),'brigade-map-import-'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const assets=[];
function sips(args){const r=spawnSync('sips',args,{encoding:'utf8'});if(r.error)throw r.error;if(r.status)throw new Error(r.stderr||r.stdout);}
function finish(relative,input,width,height){
 const path=`assets/overworld-living/common/${relative}.png`;
 mkdirSync(dirname(path),{recursive:true});sips(['-z',String(height),String(width),input,'--out',path]);
 if(!existsSync(path+'.gmeta')){
  const digest=createHash('sha256').update('brigade-approved-map-art:'+relative).digest('hex');
  const guid=`${digest.slice(0,8)}-${digest.slice(8,12)}-5${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
  writeFileSync(path+'.gmeta',`guid = "${guid}"\nimporter = "texture"\n[settings]\nkind = "sprite"\natlas = "overworld-living-residents"\nfilter = "linear"\ncompression = "astc6x6"\ntrim = false\nmax_size = 128\n`);
 }
 assets.push({path,width,height,sha256:hash(path)});
}
try{
 // A 2px transparent inset avoids sips' zero-offset centering special case.
 for(const [column,state]of ['available','locked','cleared'].entries()){
  const cell=resolve(scratch,`${state}.png`);
  sips(['-c','720','720','--cropOffset','2',String(column*724+2),`${sources}/mission-crest-vintage.png`,'--out',cell]);
  finish(`markers/${state}`,cell,128,128);
 }
 finish('markers/shop',`${sources}/shop-crest.png`,128,128);
 // Shared448×320 canvas and shared scale; contact dot sits432,290 in every frame.
 // Only registration changes per frame, preserving the generated growth/dispersal.
 const right=[474,431,478,456],bottom=[536,545,542,550];
 for(let frame=0;frame<4;frame++){
  const cell=resolve(scratch,`puff-${frame}.png`);
  sips(['-c','320','448','--cropOffset',String(bottom[frame]-290),String(frame*543+right[frame]-432),`${sources}/puff-strip.png`,'--out',cell]);
  finish(`footsteps/puff-${frame}`,cell,112,80);
 }
 const manifest={approval:'User approved vintage mission crest family on 28 October 2026',preparation:'Native sips crop/registration and one shared resample scale; transparent alpha retained; no creative edits',sources:['mission-crest-vintage.png','shop-crest.png','puff-strip.png'].map(name=>({path:`${sources}/${name}`,sha256:hash(`${sources}/${name}`)})),puffContactPixels:[108,72.5],assets,mapPaintingsModified:false};
 writeFileSync(`${sources}/import-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
 console.log(`Imported ${assets.length} approved/generated sprite drawings; all map paintings preserved.`);
}finally{rmSync(scratch,{recursive:true,force:true});}
