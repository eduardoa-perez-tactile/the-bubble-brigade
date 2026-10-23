import { DRAGON_STATUE_RIG } from '../../src/cartoon/dragon-statue.ts';
import { material, texture2d, unlit, uv, instanceParams, fn, wgsl } from '@gameengine/materials';

// Original painted pixels form two rigid articulated layers. Only the vacated
// silhouette samples the registered clean plate; all surrounding stone is steady.
// Pose constants are shared with the CPU eye/breath anchors and mask baker.
const rig=DRAGON_STATUE_RIG,motion=rig.motion;
const f=(value:number)=>Number.isInteger(value)?`${value}.0`:String(value);
const v=(point:readonly[number,number])=>`vec2f(${f(point[0])},${f(point[1])})`;
const courtyard = fn('courtyard_sample', 'vec4f', wgsl`
fn courtyard_dragon_mask(p:vec2f)->vec3f {
 let at=(p-${v(rig.mask.origin)})/${v(rig.mask.size)};
 // The authored contours have an empty border; clamp sampling stays zero.
 return textureSampleLevel(tex_dragonMask,material_sampler,clamp(at,vec2f(0.0),vec2f(1.0)),0.0).rgb;
}
fn courtyard_ease(a:f32,b:f32,t:f32)->f32 {let u=clamp((t-a)/(b-a),0.0,1.0);return u*u*(3.0-2.0*u);}
fn courtyard_unrotate(p:vec2f,pivot:vec2f,angle:f32)->vec2f {
 let c=cos(angle);let s=sin(angle);let d=p-pivot;
 return pivot+vec2f(c*d.x+s*d.y,-s*d.x+c*d.y);
}
fn courtyard_open_mouth(p:vec2f,angle:f32)->f32 {
 let a=${v(rig.jawPivot)};let b=vec2f(895.0,165.0);
 let c=courtyard_unrotate(b,a,-angle);
 let ab=b-a;let bc=c-b;let ca=a-c;
 let d0=(ab.x*(p.y-a.y)-ab.y*(p.x-a.x))/length(ab);
 let d1=(bc.x*(p.y-b.y)-bc.y*(p.x-b.x))/max(length(bc),0.001);
 let d2=(ca.x*(p.y-c.y)-ca.y*(p.x-c.x))/max(length(ca),0.001);
 return smoothstep(-0.4,0.4,min(d0,min(d1,d2)))*smoothstep(0.0,0.025,angle);
}
fn courtyard_mask(p: vec2f, lo: vec2f, hi: vec2f, feather: f32) -> f32 {
 let enter = smoothstep(lo, lo + vec2f(feather), p);
 let leave = vec2f(1.0) - smoothstep(hi - vec2f(feather), hi, p);
 return enter.x * enter.y * leave.x * leave.y;
}
fn courtyard_cloth(p: vec2f, lo: vec2f, hi: vec2f, t: f32, phase: f32) -> vec2f {
 let mask = courtyard_mask(p, lo, hi, 8.0);
 let hang = clamp((p.y - lo.y) / (hi.y - lo.y), 0.0, 1.0);
 // The pole stays pinned; the hem has a broad sway plus a travelling ripple.
 let breeze = sin(t * 0.022 + phase) * 4.5;
 let ripple = sin(t * 0.041 - hang * 7.0 + phase) * 2.2;
 return vec2f((breeze + ripple) * hang * hang, sin(t * 0.031 + phase) * hang * 0.8) * mask;
}
fn courtyard_chain(p: vec2f, x: f32, bottom: f32, t: f32, phase: f32) -> vec2f {
 let mask = courtyard_mask(p, vec2f(x - 13.0, -12.0), vec2f(x + 13.0, bottom), 5.0);
 let hang = clamp(p.y / bottom, 0.0, 1.0);
 return vec2f(sin(t * 0.013 + phase) * 3.1 * hang, 0.0) * mask;
}
fn courtyard_plant(p: vec2f, lo: vec2f, hi: vec2f, rootAtTop: f32, t: f32, phase: f32) -> vec2f {
 let mask = courtyard_mask(p, lo, hi, 14.0);
 let height = clamp((p.y - lo.y) / (hi.y - lo.y), 0.0, 1.0);
 let tip = mix(1.0 - height, height, rootAtTop);
 let wind = sin(t * 0.025 + phase) * 2.7 + sin(t * 0.047 + p.y * 0.035 + phase) * 0.9;
 return vec2f(wind * tip, sin(t * 0.03 + phase) * tip * 0.55) * mask;
}
fn courtyard_sample(at: vec2f, control: vec4f) -> vec4f {
 let p = at * vec2f(1672.0, 941.0);
 let t = control.x;
 var offset = vec2f(0.0);
 // Region branches keep the local wave arithmetic off the rest of the plate.
 if (control.y > 0.5) {
  if (p.y < 245.0) {
   if (p.x > 490.0 && p.x < 606.0) {
    offset += courtyard_cloth(p, vec2f(490.0,-8.0),vec2f(606.0,215.0),t,0.0);
   } else if (p.x > 1077.0 && p.x < 1202.0) {
    offset += courtyard_cloth(p,vec2f(1077.0,-8.0),vec2f(1202.0,247.0),t,1.8);
   }
   if (p.x > 455.0 && p.x < 483.0) { offset += courtyard_chain(p,469.0,82.0,t,0.2); }
   if (p.x > 627.0 && p.x < 655.0) { offset += courtyard_chain(p,641.0,211.0,t,1.2); }
   if (p.x > 1054.0 && p.x < 1082.0) { offset += courtyard_chain(p,1068.0,214.0,t,2.0); }
   if (p.x > 1208.0 && p.x < 1236.0) { offset += courtyard_chain(p,1222.0,183.0,t,2.7); }
  }
  // Leaf clusters are small, feathered patches pinned at their stone roots.
  // Central arch masonry and every gameplay platform remain steady.
  if (p.x < 300.0 && p.y > 710.0) { offset += courtyard_plant(p,vec2f(54.0,710.0),vec2f(300.0,907.0),0.0,t,0.4); }
  if (p.x > 1370.0 && p.y > 718.0) { offset += courtyard_plant(p,vec2f(1370.0,718.0),vec2f(1617.0,909.0),0.0,t,1.6); }
  if (p.x > 405.0 && p.x < 573.0 && p.y > 330.0 && p.y < 445.0) { offset += courtyard_plant(p,vec2f(405.0,330.0),vec2f(573.0,445.0),0.0,t,1.1); }
  if (p.x > 539.0 && p.x < 687.0 && p.y > 421.0 && p.y < 511.0) { offset += courtyard_plant(p,vec2f(539.0,421.0),vec2f(687.0,511.0),0.0,t,2.5); }
  if (p.x > 1093.0 && p.x < 1244.0 && p.y > 214.0 && p.y < 342.0) { offset += courtyard_plant(p,vec2f(1093.0,214.0),vec2f(1244.0,342.0),1.0,t,3.2); }
  if (p.x > 1473.0 && p.x < 1618.0 && p.y > 398.0 && p.y < 582.0) { offset += courtyard_plant(p,vec2f(1473.0,398.0),vec2f(1618.0,582.0),1.0,t,4.0); }
 }
 var c = textureSample(tex_plate, material_sampler, (p - offset) / vec2f(1672.0,941.0));
 if(control.y>0.5 && p.x>${f(rig.mask.origin[0])} && p.x<${f(rig.mask.origin[0]+rig.mask.size[0])} && p.y>${f(rig.mask.origin[1])} && p.y<${f(rig.mask.origin[1]+rig.mask.size[1])}){
  let cycle=t-floor(t/${f(rig.period)})*${f(rig.period)};
  let head=courtyard_ease(${f(motion.headRise[0])},${f(motion.headRise[1])},cycle)*(1.0-courtyard_ease(${f(motion.headReturn[0])},${f(motion.headReturn[1])},cycle));
  let jaw=courtyard_ease(${f(motion.jawRise[0])},${f(motion.jawRise[1])},cycle)*(1.0-courtyard_ease(${f(motion.jawReturn[0])},${f(motion.jawReturn[1])},cycle));
  // This bypass keeps original pixels exactly intact throughout the long rest.
  if(head>0.000001){
   let headSource=courtyard_unrotate(p-vec2f(0.0,${f(motion.lift)}*head),${v(rig.headPivot)},${f(motion.headAngle)}*head);
   let sourceMask=courtyard_dragon_mask(p);
   let headMask=courtyard_dragon_mask(headSource);
   let clean=textureSampleLevel(tex_cleanPlate,material_sampler,at,0.0);
   c=mix(c,clean,sourceMask.r);
   let headColor=textureSampleLevel(tex_plate,material_sampler,headSource/vec2f(1672.0,941.0),0.0);
   // A closed jaw is one intact layer: no cut/cavity or doubled feather edge.
   if(jaw<=0.000001){
    c=mix(c,headColor,headMask.r);
   }else{
    let jawSource=courtyard_unrotate(headSource,${v(rig.jawPivot)},${f(motion.jawAngle)}*jaw);
    let jawMask=courtyard_dragon_mask(jawSource);
    let cavity=max(headMask.b*headMask.r,courtyard_open_mouth(headSource,${f(motion.jawAngle)}*jaw));
    c=mix(c,vec4f(0.025,0.065,0.075,1.0),cavity);
    c=mix(c,headColor,headMask.r*(1.0-headMask.g));
    let jawColor=textureSampleLevel(tex_plate,material_sampler,jawSource/vec2f(1672.0,941.0),0.0);
    c=mix(c,jawColor,jawMask.g);
   }
  }
 }
 return vec4f(c.rgb * control.z, c.a);
}
`);

export default material('CourtyardMotion', {
 blend: 'opaque', cull: 'none', fog: false,
 params: { plate: texture2d({default:'white',srgb:true}), cleanPlate:texture2d({default:'white',srgb:true}), dragonMask:texture2d({default:'black',srgb:false}) },
 surface: () => {
  const c=courtyard(uv(),instanceParams());
  return unlit({color:c.rgb,alpha:c.a});
 },
});
