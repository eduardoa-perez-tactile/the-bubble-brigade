import {expect,renderTest,worldTest} from '@gameengine/test';
import {arenaLayout} from '../src/arcade/arena-layout';
import {session} from '../src/arcade/session';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {desktopSaveState} from '../src/desktop/save';
import {cartoonDragonPoint,cartoonDragonPose,DRAGON_STATUE_RIG} from '../src/cartoon/dragon-statue';

const scene='scenes/cartoon.scene.json';

worldTest('courtyard dragon statue gesture lifts before opening and rigid layers return to their painted anchors',()=>{
  const rest=cartoonDragonPose(0),headOnly=cartoonDragonPose(100),awake=cartoonDragonPose(180);
  expect(rest).toEqual({headAngle:0,jawAngle:0,lift:0,awakening:0});
  expect(headOnly.headAngle).toBeLessThan(0);expect(headOnly.jawAngle).toBe(0);
  expect(awake.headAngle).toBeLessThan(0);expect(awake.jawAngle).toBeGreaterThan(0);
  expect(awake.lift).toBeLessThan(0);
  const eye=DRAGON_STATUE_RIG.eye,mouth=DRAGON_STATUE_RIG.mouth,jawTip=[887,176] as const;
  expect(cartoonDragonPoint(eye,awake)).not.toEqual(eye);
  expect(cartoonDragonPoint(jawTip,awake,'jaw')).not.toEqual(cartoonDragonPoint(jawTip,awake));
  const distance=(a:readonly[number,number],b:readonly[number,number])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  // Distances within a rigid layer never stretch. Jaw motion is hinged onto
  // the moving head, so their shared hinge cannot detach during a gesture.
  for(let tick=0;tick<=DRAGON_STATUE_RIG.period;tick+=15){
    const pose=cartoonDragonPose(tick);
    expect(distance(cartoonDragonPoint(eye,pose),cartoonDragonPoint(mouth,pose))).toBeCloseTo(distance(eye,mouth),8);
    expect(distance(cartoonDragonPoint(jawTip,pose,'jaw'),cartoonDragonPoint(DRAGON_STATUE_RIG.jawPivot,pose,'jaw'))).toBeCloseTo(distance(jawTip,DRAGON_STATUE_RIG.jawPivot),8);
    expect(cartoonDragonPoint(DRAGON_STATUE_RIG.jawPivot,pose,'jaw')).toEqual(cartoonDragonPoint(DRAGON_STATUE_RIG.jawPivot,pose));
    expect(cartoonDragonPose(tick,true)).toEqual(rest);
    expect(cartoonDragonPose(tick+DRAGON_STATUE_RIG.period)).toEqual(pose);
  }
  for(const tick of [-1,0,40,360,400,1079,1080]){
    const pose=cartoonDragonPose(tick);
    expect(pose).toEqual(rest);
    expect(cartoonDragonPoint(eye,pose)).toEqual(eye);
    expect(cartoonDragonPoint(jawTip,pose,'jaw')).toEqual(jawTip);
  }
},{scene});

renderTest('courtyard dragon statue native head and jaw articulate then return without moving the arch',async({step,input,cheat,render})=>{
  await step(5);
  let peak=0;
  for(const [width,height]of [[1536,864],[640,960],[2520,1080]] as const){
    input.view(width,height,1);await step(1);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
    const layout=arenaLayout(session.get().game!.Level,{width,height,safeArea:[0,0,0,0]});
    // The horn/head silhouette and lower jaw are separate painted details.
    // Neither grid overlaps the old eye glint or the exhale particles, so a
    // glowing eye alone cannot pass as articulation of the statue itself.
    const head=[798,812,826,840].flatMap(x=>[78,93,108].map(y=>[x,y] as const));
    const jaw=[844,854,864,874].flatMap(x=>[170,177,184].map(y=>[x,y] as const));
    // Masonry beside the statue, above it and below its plinth must stay put.
    const stone=[[704,110],[710,150],[720,195],[940,98],[960,140],[975,190],[795,56],[850,48],[900,55],[750,273],[810,277],[895,277]] as const;
    const points:[number,number][]=[...head,...jaw,...stone].map(([x,y])=>{
      const logicalX=layout.viewportLeft+x*(layout.viewportRight-layout.viewportLeft)/1672;
      const logicalY=layout.viewportTop+y*(layout.viewportBottom-layout.viewportTop)/941;
      const pixel=input.worldToScreen([logicalX,720-logicalY]);
      return [Math.round(pixel[0]),Math.round(pixel[1])];
    });
    const advanceTo=async(tick:number)=>{
      const remaining=tick-session.get().game!.Tick;
      expect(remaining).toBeGreaterThanOrEqual(0);
      if(remaining)await step(remaining);
      expect(session.get().game!.Tick).toBe(tick);
    };
    await advanceTo(40);
    const rest=render.probe({width,height,points});
    await advanceTo(180);
    const active=render.probe({width,height,points});
    const changed=(start:number,count:number)=>active.points.slice(start,start+count).some((p,i)=>
      p.rgba.slice(0,3).some((value,c)=>value!==rest.points[start+i]!.rgba[c]));
    const headChanged=changed(0,head.length),jawChanged=changed(head.length,jaw.length);
    console.log(JSON.stringify({dragonArticulation:{width,height,headChanged,jawChanged}}));
    expect(headChanged).toBe(true);expect(jawChanged).toBe(true);
    expect(active.points.slice(head.length+jaw.length)).toEqual(rest.points.slice(head.length+jaw.length));
    peak=Math.max(peak,render.stats({width,height}).drawCalls);

    // Pause during the actual gesture, not just while the statue is at rest.
    input.emit(DesktopIntent,{action:'pause'});await step(20);
    expect(session.get().game!.Paused).toBe(true);
    const heldTick=session.get().game!.Tick,held=render.probe({width,height,points});
    await step(60);
    expect(session.get().game!.Tick).toBe(heldTick);
    expect(render.probe({width,height,points}).points).toEqual(held.points);
    input.emit(DesktopIntent,{action:'resume'});await step(20);
    expect(session.get().game!.Paused).toBe(false);
    await advanceTo(400);
    expect(render.probe({width,height,points}).points).toEqual(rest.points);
    await advanceTo(1120);
    expect(render.probe({width,height,points}).points).toEqual(rest.points);

    // Reduced Effects holds the original painting while gameplay still ticks.
    input.emit(DesktopIntent,{action:'effects'});await step(1);
    expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
    const reduced=render.probe({width,height,points}),reducedTick=session.get().game!.Tick;
    await step(160);
    expect(session.get().game!.Tick).toBeGreaterThan(reducedTick);
    expect(render.probe({width,height,points}).points).toEqual(reduced.points);
    expect(reduced.points).toEqual(rest.points);
    peak=Math.max(peak,render.stats({width,height}).drawCalls);
    input.emit(DesktopIntent,{action:'effects'});await step(1);
  }
  expect(peak).toBeLessThanOrEqual(14);
  console.log(JSON.stringify({dragonArticulationPeakDrawCalls:peak}));
},{scene,memory:'phone-low'});
