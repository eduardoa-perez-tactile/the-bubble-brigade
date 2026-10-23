/** Rigid layers traced around the original courtyard painting, in source pixels.
 * The arch and plinth are deliberately outside the moving silhouette. */
export const DRAGON_STATUE_RIG={
 period:1080,
 motion:{headRise:[60,135],headReturn:[270,360],jawRise:[115,175],jawReturn:[245,310],headAngle:-.065,jawAngle:.24,lift:-2},
 mask:{origin:[720,55],size:[210,193],scale:2,feather:.55},
 headPivot:[779,228],jawPivot:[838,151],eye:[867,129],mouth:[891,165],
 head:[
  [741,234],[740,216],[743,196],[748,177],[751,162],[746,158],[745,147],[755,150],
  [761,143],[758,134],[758,124],[761,122],[766,132],[772,128],[773,116],[778,108],
  [783,124],[792,121],[795,105],[801,102],[808,120],[812,118],[807,108],[806,94],
  [801,79],[801,74],[805,73],[820,85],[831,92],[837,108],[844,103],[845,89],
  [845,70],[850,70],[857,89],[869,104],[873,117],[880,119],[884,116],[886,121],
  [885,132],[892,137],[898,139],[904,138],[908,141],[908,152],[904,165],[900,169],
  [895,165],[894,172],[887,176],[882,177],[877,177],[871,179],[865,176],[858,168],
  [848,165],[840,164],[836,174],[825,174],[811,171],[798,175],[784,187],[774,208],[769,234],
 ],
 jaw:[[836,150],[848,153],[860,157],[870,163],[875,168],[883,166],[890,164],[895,165],
  [894,172],[887,176],[882,177],[877,177],[871,179],[865,176],[858,168],[848,165],[839,161],[834,156]],
 cavity:[[834,149],[850,153],[865,158],[878,163],[896,163],[895,180],[869,184],[858,173],[844,166],[834,160]],
} as const;
export interface CartoonDragonPose{headAngle:number;jawAngle:number;lift:number;awakening:number}
const ease=(a:number,b:number,t:number)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
/** Tick-only, history-free presentation pose: lift, open, hold, then settle.
 * Twelve seconds of each eighteen-second cycle remain completely at rest. */
export function cartoonDragonPose(tick:number,reduced=false):CartoonDragonPose{
 const t=Math.max(0,tick)%DRAGON_STATUE_RIG.period;
 const m=DRAGON_STATUE_RIG.motion;
 const head=reduced?0:ease(...m.headRise,t)*(1-ease(...m.headReturn,t));
 const jaw=reduced?0:ease(...m.jawRise,t)*(1-ease(...m.jawReturn,t));
 return {headAngle:head?m.headAngle*head:0,jawAngle:m.jawAngle*jaw,lift:head?m.lift*head:0,awakening:head};
}
export function cartoonDragonPoint(point:readonly[number,number],pose:CartoonDragonPose,part:'head'|'jaw'='head'):readonly[number,number]{
 let x=point[0],y=point[1];
 if(part==='jaw'){
  const [px,py]=DRAGON_STATUE_RIG.jawPivot,c=Math.cos(pose.jawAngle),s=Math.sin(pose.jawAngle),dx=x-px,dy=y-py;
  x=px+c*dx-s*dy;y=py+s*dx+c*dy;
 }
 const [px,py]=DRAGON_STATUE_RIG.headPivot,c=Math.cos(pose.headAngle),s=Math.sin(pose.headAngle),dx=x-px,dy=y-py;
 return [px+c*dx-s*dy,py+s*dx+c*dy+pose.lift];
}
