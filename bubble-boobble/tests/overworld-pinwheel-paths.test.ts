import {expect,worldTest} from '@gameengine/test';
import {getOverworldMap,sourceToWorld} from '../src/overworld/maps';
import {isOverworldWalkable,moveOverworld,OVERWORLD_SPEED} from '../src/overworld/navigation';
import {OverworldMapPreview} from '../src/overworld/presentation.cheats';
import {WarpOverworld} from '../src/overworld/overworld.cheats';
import {overworldState} from '../src/overworld/state';
import {adventureStep} from './support/adventure-time';

const district='district-3',scene='scenes/arcade.scene.json';
// Coordinates on the unchanged 1254px painting, rather than the collision outlines.
const point=(x:number,y:number)=>sourceToWorld(getOverworldMap(district),{x:x*1536/1254,y:y*1536/1254});
const paths:readonly {name:string;points:readonly (readonly [number,number])[]}[]=[
 {name:'southwest promenade',points:[[410,950],[365,915],[330,875],[320,835],[330,805],[360,785]]},
 {name:'upper terrace stairs',points:[[635,353],[665,350],[685,333],[705,320],[735,323]]},
 {name:'carousel west side',points:[[430,950],[445,900],[440,850],[450,800],[480,760],[510,735],[555,710],[575,680],[590,650]]},
 {name:'organ west promenade',points:[[935,535],[925,580],[915,620],[890,660],[875,700],[895,745],[930,775],[975,810],[1010,850],[1040,885],[1115,925]]},
 {name:'observatory stairs and lift',points:[[920,340],[960,350],[960,385],[985,410],[1040,440],[1090,460],[1145,450]]},
 {name:'kite hangar upper stairs',points:[[330,570],[420,550],[455,510],[490,500],[525,470],[545,445],[570,435],[625,425]]},
 {name:'pond west loop',points:[[210,570],[200,610],[185,650],[205,680],[245,710],[280,750],[300,790],[335,810]]},
 {name:'pond east loop',points:[[435,590],[485,605],[530,625],[560,650],[560,700]]},
 {name:'theatre downhill road',points:[[530,310],[550,350],[590,380],[650,410],[705,435],[750,450]]},
 {name:'carousel west open paving',points:[[350,810],[375,825],[375,845],[395,865],[430,880],[465,900]]},
] as const;

worldTest('Pinwheel Fair painted main routes allow walking in both directions',()=>{
 const blocked:string[]=[];
 for(const path of paths)for(const reverse of [false,true]){
  const route=reverse?[...path.points].reverse():path.points;
  let position=point(...route[0]!);
  for(let i=1;i<route.length;i++){
   const target=point(...route[i]!),dx=target.x-position.x,dy=target.y-position.y,length=Math.sqrt(dx*dx+dy*dy);
   position=moveOverworld(position,dx/length,dy/length,length/OVERWORLD_SPEED,district);
   if(Math.abs(position.x-target.x)>.01||Math.abs(position.y-target.y)>.01){
    blocked.push(`${path.name} ${reverse?'reverse':'forward'} waypoint ${i}`);break;
   }
   expect(isOverworldWalkable(position.x,position.y,district)).toBe(true);
  }
 }
 expect(blocked).toEqual([]);
},{scene});

worldTest('Pinwheel Fair carousel west paving is an open area rather than narrow connected strips',()=>{
 const blocked:string[]=[];
 // Interior of the broad empty paving identified in the player screenshot.
 for(let y=815;y<=865;y+=5)for(let x=355;x<=385;x+=5){
  const a=point(x,y);
  if(!isOverworldWalkable(a.x,a.y,district)){blocked.push(`${x},${y}`);continue;}
  for(const [dx,dy]of [[5,0],[0,5],[-5,0],[0,-5]]){
   const b=point(x+dx!,y+dy!),length=Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);
   const end=moveOverworld(a,dx!/5,-dy!/5,length/OVERWORLD_SPEED,district);
   if(Math.abs(end.x-b.x)>.01||Math.abs(end.y-b.y)>.01)blocked.push(`${x},${y} towards ${dx},${dy}`);
  }
 }
 expect(blocked).toEqual([]);
},{scene});

worldTest('Pinwheel Fair recorded map input traverses every repaired main route without sticking',async ctx=>{
 await adventureStep(ctx,8);await ctx.loaded();
 await ctx.cheat(OverworldMapPreview,{district:3,facing:1});
 await ctx.loaded();await adventureStep(ctx,4);
 for(const path of paths)for(const reverse of [false,true]){
  const route=reverse?[...path.points].reverse():path.points,start=point(...route[0]!);
  ctx.input.action('mapX',0);ctx.input.action('mapY',0);
  await ctx.cheat(WarpOverworld,start);await adventureStep(ctx,2);
  expect(Math.abs(overworldState.get().x-start.x)).toBeLessThan(.01);
  expect(Math.abs(overworldState.get().y-start.y)).toBeLessThan(.01);
  for(let i=1;i<route.length;i++){
   const target=point(...route[i]!);let arrived=false;
   for(let frame=0;frame<180;frame++){
    const at=overworldState.get(),dx=target.x-at.x,dy=target.y-at.y,length=Math.sqrt(dx*dx+dy*dy);
    if(length<2){arrived=true;break;}
    ctx.input.action('mapX',dx/length);ctx.input.action('mapY',dy/length);
    await adventureStep(ctx,1);
   }
   if(!arrived)throw new Error(`${path.name} ${reverse?'reverse':'forward'} stuck before waypoint ${i}: ${JSON.stringify(overworldState.get())}`);
  }
 }
 ctx.input.action('mapX',0);ctx.input.action('mapY',0);await adventureStep(ctx,1);
},{scene});

worldTest('Pinwheel Fair main paths leave room to steer beside their centre line',()=>{
 const blocked:string[]=[];
 for(const path of paths)for(let i=1;i<path.points.length;i++){
  const a=point(...path.points[i-1]!),b=point(...path.points[i]!),dx=b.x-a.x,dy=b.y-a.y,length=Math.sqrt(dx*dx+dy*dy);
  for(const lane of [-8,8]){
   const offset=lane*1536/1254*getOverworldMap(district).scale;
   const start={x:a.x-dy/length*offset,y:a.y+dx/length*offset},target={x:b.x-dy/length*offset,y:b.y+dx/length*offset};
   const end=moveOverworld(start,dx/length,dy/length,length/OVERWORLD_SPEED,district);
   if(!isOverworldWalkable(start.x,start.y,district)||Math.abs(end.x-target.x)>.01||Math.abs(end.y-target.y)>.01)blocked.push(`${path.name} segment ${i} lane ${lane}`);
  }
 }
 expect(blocked).toEqual([]);
},{scene});

worldTest('Pinwheel Fair path repairs keep the pond buildings and cliffs blocked',()=>{
 const leaks:string[]=[];
 for(const [x,y] of [[400,675],[600,820],[500,230],[850,270],[270,1000],[670,290]]){
  const p=point(x!,y!);
  if(isOverworldWalkable(p.x,p.y,district))leaks.push(`${x},${y}`);
 }
 expect(leaks).toEqual([]);
},{scene});
