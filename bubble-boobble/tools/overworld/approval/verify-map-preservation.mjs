#!/usr/bin/env node
/** Verify the accepted paintings and map registration without freezing collision corrections. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const manifestPath=path.join(project,'docs/overworld/living-map-harbor/map-preservation.json');
const digest=data=>createHash('sha256').update(data).digest('hex');
export function parseMap(text){
 const start=text.indexOf('={');
 if(start<0)throw new Error('Expected a literal SourceMap assignment');
 return JSON.parse(text.slice(start+1).trim().replace(/^\s*\/\/.*$/gm,'').replace(/;\s*$/,''));
}
export function registration(map){
 return {
  districtId:map.districtId,width:map.width,height:map.height,origin:map.origin,
  scale:map.scale,viewSize:map.viewSize,spawn:map.spawn,
  layers:map.layers.map(({image,x,y,width,height,order})=>({image,x,y,width,height,order})),
  pois:map.pois.map(({kind,slot,x,y,label})=>({kind,...(slot===undefined?{}:{slot}),x,y,...(label===undefined?{}:{label})})),
 };
}
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
const failures=[],acceptedInteractionChanges=[],acceptedResidentAnchorChanges=[];
for(const district of manifest.districts){
 const png=await readFile(path.join(project,district.painting.path));
 if(digest(png)!==district.painting.sha256)failures.push(`${district.id}: accepted painting bytes changed`);
 const dimensions=[png.readUInt32BE(16),png.readUInt32BE(20)];
 if(JSON.stringify(dimensions)!==JSON.stringify(district.painting.nativeSize))failures.push(`${district.id}: native painting dimensions changed`);
 const map=parseMap(await readFile(path.join(project,district.source),'utf8'));
 for(const poi of map.pois){
  const before=manifest.baselineInteractionRadii.find(p=>p.districtId===district.id&&p.kind===poi.kind&&p.slot===(poi.slot??null));
  if(!before)continue;
  const radius=poi.radius??null;
  if(radius!==before.radius){
   const allowed=manifest.allowedInteractionRadiusChanges.find(p=>p.districtId===district.id&&p.kind===poi.kind&&p.slot===(poi.slot??null)&&p.from===before.radius&&p.to===radius);
   if(allowed)acceptedInteractionChanges.push(allowed);else failures.push(`${district.id} ${poi.kind}: unrecorded interaction-radius change`);
  }
 }
 const current=registration(map);
 // Only explicitly recorded guide relocations can differ from the frozen
 // baseline. Encounter, shop and other destination coordinates remain exact.
 for(const change of manifest.allowedResidentAnchorChanges??[]){
  if(change.districtId!==district.id||change.kind!=='guide')continue;
  const before=district.registration.pois.find(p=>p.kind==='guide');
  const after=current.pois.find(p=>p.kind==='guide');
  if(before&&after&&before.x===change.from.x&&before.y===change.from.y&&after.x===change.to.x&&after.y===change.to.y){
   acceptedResidentAnchorChanges.push(change);
   after.x=before.x;after.y=before.y;
  }
 }
 if(JSON.stringify(current)!==JSON.stringify(district.registration))failures.push(`${district.id}: map transform, spawn, layer placement or existing destination registration changed`);
}
const result={ok:failures.length===0,paintingsChecked:manifest.districts.length,registrationChecked:manifest.districts.length,collisionPolygonsFrozen:false,acceptedInteractionChanges,acceptedResidentAnchorChanges,failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
