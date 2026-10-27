import {sourceToWorld} from './maps';
import type {SourceMap} from './maps.types';
import type {OverworldDraw} from './presentation';

/** Fixed source-pixel canvas shared by every drawing in an assembly. Alpha supplies
 * the coastline/lantern silhouette; this is not a movable or stretched wave stamp. */
export interface AuthoredSourceRect {x:number;y:number;width:number;height:number}
export interface AuthoredSpriteFrame {image:string;steps:number}
export interface AuthoredSpriteSequence {
 frames:readonly AuthoredSpriteFrame[];
 /** A calm, deliberately selected drawing, also used by reduced motion. */
 restFrame:number;
 playback:'loop'|'once';
 phaseSteps?:number;
}
interface AuthoredAssemblyBase {
 id:string;
 source:AuthoredSourceRect;
 /** The second part is directly in front of the first. */
 order:number;
}
/** Contact and retreating ripples are different drawings of the same coast section. */
export interface AuthoredShorelineSection extends AuthoredAssemblyBase {
 kind:'shoreline';
 ripples:AuthoredSpriteSequence;
 contact:AuthoredSpriteSequence;
}
/** The foreground contains the existing glass/frame that occludes the drawn lens. */
export interface AuthoredLanternSection extends AuthoredAssemblyBase {
 kind:'lantern';
 interior:AuthoredSpriteSequence;
 foreground:AuthoredSpriteSequence;
}
export type AuthoredMapAssembly=AuthoredShorelineSection|AuthoredLanternSection;
interface CompiledSequence {
 frames:readonly AuthoredSpriteFrame[];
 ends:readonly number[];
 duration:number;
 restFrame:number;
 playback:'loop'|'once';
 phaseSteps:number;
}
export interface RegisteredAuthoredAssembly {
 readonly id:string;
 readonly kind:AuthoredMapAssembly['kind'];
 readonly source:Readonly<AuthoredSourceRect>;
 readonly layers:readonly {readonly draw:Readonly<OverworldDraw>;readonly sequence:CompiledSequence}[];
}
const natural=(value:number)=>Number.isSafeInteger(value)&&value>=0;
function requireRect(rect:AuthoredSourceRect,label:string):void {
 if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)throw new Error(`${label}: invalid source rectangle`);
}
function compileSequence(sequence:AuthoredSpriteSequence,images:ReadonlySet<string>,label:string):CompiledSequence {
 if(sequence.frames.length===0||!natural(sequence.restFrame)||sequence.restFrame>=sequence.frames.length)throw new Error(`${label}: missing resting drawing`);
 if(sequence.playback!=='loop'&&sequence.playback!=='once')throw new Error(`${label}: invalid playback`);
 const phaseSteps=sequence.phaseSteps??0;
 if(!natural(phaseSteps))throw new Error(`${label}: phase must be a nonnegative integer step`);
 let duration=0;const ends:number[]=[],frames:AuthoredSpriteFrame[]=[];
 for(const frame of sequence.frames){
  if(!frame.image||!images.has(frame.image))throw new Error(`${label}: unavailable sprite ${frame.image}`);
  if(!Number.isSafeInteger(frame.steps)||frame.steps<1)throw new Error(`${label}: each drawing needs a positive integer hold`);
  duration+=frame.steps;
  if(!Number.isSafeInteger(duration))throw new Error(`${label}: sequence duration exceeds safe steps`);
  ends.push(duration);frames.push(Object.freeze({...frame}));
 }
 return Object.freeze({frames:Object.freeze(frames),ends:Object.freeze(ends),duration,restFrame:sequence.restFrame,playback:sequence.playback,phaseSteps});
}
/** Compile only after art approval/import, against the imported sprite catalog.
 * No production definitions are registered here while artwork awaits approval.
 * Reject cropping at the map edge: a section must be authored in its real bounds. */
export function registerAuthoredAssembly(map:SourceMap,assembly:AuthoredMapAssembly,images:ReadonlySet<string>):RegisteredAuthoredAssembly {
 const {source,id}=assembly;
 if(!id.trim()||!Number.isFinite(assembly.order))throw new Error('Authored assembly needs an id and finite order');
 requireRect(source,id);
 if(source.x<0||source.y<0||source.x+source.width>map.width||source.y+source.height>map.height)throw new Error(`${id}: source rectangle leaves the existing map`);
 if(!Number.isFinite(map.scale)||map.scale<=0)throw new Error(`${id}: invalid map scale`);
 const point=sourceToWorld(map,{x:source.x+source.width/2,y:source.y+source.height/2});
 const parts=assembly.kind==='shoreline'?[assembly.ripples,assembly.contact]:[assembly.interior,assembly.foreground];
 const layers=parts.map((part,index)=>Object.freeze({
  draw:Object.freeze({x:point.x,y:point.y,width:source.width*map.scale,height:source.height*map.scale,order:assembly.order+index}),
  sequence:compileSequence(part,images,`${id} part ${index}`),
 }));
 return Object.freeze({id,kind:assembly.kind,source:Object.freeze({...source}),layers:Object.freeze(layers)});
}
function imageAt(sequence:CompiledSequence,step:number,reducedMotion:boolean):string {
 if(reducedMotion)return sequence.frames[sequence.restFrame]!.image;
 // Modular addition avoids losing integer precision even for large recorded steps.
 const elapsed=sequence.playback==='loop'?step%sequence.duration:Math.min(step,sequence.duration);
 const phase=sequence.playback==='loop'?sequence.phaseSteps%sequence.duration:Math.min(sequence.phaseSteps,sequence.duration);
 const time=sequence.playback==='loop'
  ?(elapsed>=sequence.duration-phase?elapsed-(sequence.duration-phase):elapsed+phase)
  :phase>=sequence.duration-elapsed?sequence.duration:elapsed+phase;
 if(time>=sequence.duration)return sequence.frames[sequence.frames.length-1]!.image;
 for(let index=0;index<sequence.ends.length;index++)if(time<sequence.ends[index]!)return sequence.frames[index]!.image;
 return sequence.frames[sequence.frames.length-1]!.image;
}
/** `step` is elapsed presentation steps: looping ambience may use the global step;
 * one-shot activation clips must receive steps since that activation, not global time.
 * Entire offscreen sections can be culled without restarting their animation.
 * Partial sections retain their full registered canvas; the engine clips the view. */
export function sampleAuthoredAssembly(assembly:RegisteredAuthoredAssembly,step:number,reducedMotion=false,visibleSource?:AuthoredSourceRect):OverworldDraw[] {
 if(!natural(step))throw new Error(`${assembly.id}: presentation step must be a nonnegative integer`);
 if(visibleSource){
  requireRect(visibleSource,'Visible area');const r=assembly.source,v=visibleSource;
  if(r.x+r.width<=v.x||r.y+r.height<=v.y||r.x>=v.x+v.width||r.y>=v.y+v.height)return [];
 }
 return assembly.layers.map(layer=>({...layer.draw,image:imageAt(layer.sequence,step,reducedMotion)}));
}
/** Never let optional scenery silently disappear when a fixed visual pool fills.
 * Call after offscreen culling, before committing any part of the frame. */
export function composeBoundedOverworldDraws(capacity:number,...groups:readonly (readonly OverworldDraw[])[]):OverworldDraw[] {
 if(!natural(capacity))throw new Error('Overworld capacity must be a nonnegative integer');
 let count=0;for(const group of groups)count+=group.length;
 if(count>capacity)throw new Error(`Overworld sprite capacity ${capacity} exceeded: ${count}`);
 const out:OverworldDraw[]=[];for(const group of groups)out.push(...group);return out;
}
