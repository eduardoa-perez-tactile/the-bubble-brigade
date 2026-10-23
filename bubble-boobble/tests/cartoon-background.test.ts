import {expect,renderTest,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {arenaLayout} from '../src/arcade/arena-layout';
import {session} from '../src/arcade/session';
import {cartoonBackgroundDraws} from '../src/cartoon/background';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonSprites} from '../src/cartoon/renderer';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {DesktopIntent} from '../src/schema.gen';
import {desktopSaveState} from '../src/desktop/save';

const scene='scenes/cartoon.scene.json';
const bounds={x:0,y:0,width:1672,height:941};
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');

worldTest('courtyard ambience animates deterministically with bounded work and reduced effects omit motion',()=>{
  const before=JSON.stringify(bounds),first=cartoonBackgroundDraws(0,bounds);
  expect(first.length).toBeGreaterThan(0);
  expect(first.length).toBeLessThanOrEqual(128);
  expect(cartoonBackgroundDraws(0,bounds)).toEqual(first);
  expect(cartoonBackgroundDraws(47,bounds)).not.toEqual(first);
  expect(cartoonBackgroundDraws(-10,bounds)).toEqual(first);
  for(const tick of [0,1,47,600,36000]){
    const draws=cartoonBackgroundDraws(tick,bounds);
    expect(draws.length).toBe(first.length);
    for(const draw of draws){
      expect(Number.isFinite(draw.x+draw.y+draw.width+draw.height)).toBe(true);
      expect(draw.width>0&&draw.height>0).toBe(true);
      expect(draw.color![3]!>=0&&draw.color![3]!<=1).toBe(true);
    }
    expect(cartoonBackgroundDraws(tick,bounds,true)).toEqual([]);
  }
  expect(cartoonBackgroundDraws(0,{...bounds,width:0})).toEqual([]);
  expect(cartoonBackgroundDraws(0,{...bounds,height:0})).toEqual([]);
  expect(JSON.stringify(bounds)).toBe(before);
},{scene});

worldTest('courtyard ambience remains registered to both sides of the stretched painting at every aspect',()=>{
  const source=cartoonBackgroundDraws(47,bounds);
  const g=game(),before=JSON.stringify(g);
  for(const [width,height]of [[768,720],[1536,864],[640,960],[2520,1080]] as const){
    const view={width,height,safeArea:[0,0,0,0]},layout=arenaLayout(g.Level,view);
    const target={x:layout.viewportLeft,y:layout.viewportTop,width:layout.viewportRight-layout.viewportLeft,height:layout.viewportBottom-layout.viewportTop};
    const ambient=cartoonBackgroundDraws(47,target),plan=cartoonDrawPlan(g,47,view);
    const plate=plan[0]!;
    expect(plate.frame).toBe('environment/courtyard-plate');
    expect([plate.x,plate.y,plate.width,plate.height]).toEqual([target.x,target.y,target.width,target.height]);
    expect(plan.slice(1,1+ambient.length)).toEqual(ambient);
    expect(plan[1+ambient.length]!.frame.startsWith('environment/platform-')).toBe(true);
    for(let i=0;i<source.length;i++){
      const a=source[i]!,b=ambient[i]!;
      expect(b.x).toBeCloseTo(target.x+a.x*target.width/1672,7);
      expect(b.y).toBeCloseTo(target.y+a.y*target.height/941,7);
      expect(b.width).toBeCloseTo(a.width*target.width/1672,7);
      expect(b.height).toBeCloseTo(a.height*target.height/941,7);
      expect(b.x>=target.x&&b.x+b.width<=target.x+target.width).toBe(true);
      expect(b.y>=target.y&&b.y+b.height<=target.y+target.height).toBe(true);
    }
    expect(ambient.some(d=>d.x<target.x+target.width*.15)).toBe(true);
    expect(ambient.some(d=>d.x>target.x+target.width*.8)).toBe(true);
    const sprites=cartoonSprites(ambient,{left:target.x,top:target.y,right:target.x+target.width,bottom:target.y+target.height});
    expect(sprites.length).toBe(ambient.length);
    expect(sprites.every(s=>s.image==='cartoon/reconstruction/environment/ambient-soft')).toBe(true);
    expect(cartoonDrawPlan(g,47,view,undefined,undefined,true).some(d=>d.frame==='environment/ambient-soft')).toBe(false);
  }
  expect(JSON.stringify(g)).toBe(before);
},{scene});

worldTest('courtyard ambience follows the paused gameplay clock and the real reduced effects setting',async({step,input,cheat})=>{
  await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
  input.emit(DesktopIntent,{action:'pause'});await step(2);
  expect(session.get().game!.Paused).toBe(true);
  const tick=session.get().game!.Tick,held=cartoonBackgroundDraws(tick,bounds);
  await step(60);
  expect(session.get().game!.Tick).toBe(tick);
  expect(cartoonBackgroundDraws(session.get().game!.Tick,bounds)).toEqual(held);
  expect(!!desktopSaveState.get().settings.reducedEffects).toBe(false);
  input.emit(DesktopIntent,{action:'effects'});await step(1);
  expect(desktopSaveState.get().settings.reducedEffects).toBe(true);
  expect(cartoonBackgroundDraws(tick,bounds,!!desktopSaveState.get().settings.reducedEffects)).toEqual([]);
},{scene});

renderTest('courtyard ambience native water and candle motion stays visible and bounded across aspects',async({step,input,cheat,render})=>{
  await step(5);
  let peak=0;
  for(const [width,height]of [[1536,864],[640,960],[2520,1080]] as const){
    input.view(width,height,1);await step(1);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
    const layout=arenaLayout(session.get().game!.Level,{width,height,safeArea:[0,0,0,0]});
    // Both waterfalls and the two interior candles, away from the corner HUD.
    const points:[number,number][]=[[178,430],[1414,450],[362,383],[1289,408]].map(([x,y])=>{
      const logicalX=layout.viewportLeft+x!*(layout.viewportRight-layout.viewportLeft)/1672;
      const logicalY=layout.viewportTop+y!*(layout.viewportBottom-layout.viewportTop)/941;
      const pixel=input.worldToScreen([logicalX,720-logicalY]);
      return [Math.round(pixel[0]),Math.round(pixel[1])];
    });
    // Summarise a band of each waterfall so moving narrow highlights remain
    // detectable even when downscaled between physical pixels on a tall view.
    const regions:[number,number,number,number][]=[[173,480,10,45],[1410,480,10,45]].map(([x,y,w,h])=>{
      const logicalX=layout.viewportLeft+x!*(layout.viewportRight-layout.viewportLeft)/1672;
      const logicalY=layout.viewportTop+y!*(layout.viewportBottom-layout.viewportTop)/941;
      const start=input.worldToScreen([logicalX,720-logicalY]);
      const end=input.worldToScreen([logicalX+w!*(layout.viewportRight-layout.viewportLeft)/1672,720-logicalY-h!*(layout.viewportBottom-layout.viewportTop)/941]);
      return [Math.round(start[0]),Math.round(start[1]),Math.max(1,Math.round(end[0]-start[0])),Math.max(1,Math.round(end[1]-start[1]))];
    });
    const initial=render.probe({width,height,points,regions});
    const waterChanged=[false,false];let candleChanged=false,animated=initial;
    // Sample three phases: a narrow highlight can fall between physical pixels
    // for one phase on the tall view, and region means are rounded by the probe.
    for(const elapsed of [17,14,16]){
      await step(elapsed);animated=render.probe({width,height,points,regions});
      for(let side=0;side<2;side++)waterChanged[side] ||= animated.regions[side]!.mean.slice(0,3).some((v,c)=>v!==initial.regions[side]!.mean[c]);
      candleChanged ||= animated.points.slice(2).some((p,i)=>p.rgba.slice(0,3).some((v,c)=>v!==initial.points[i+2]!.rgba[c]));
      peak=Math.max(peak,render.stats({width,height}).drawCalls);
    }
    console.log(JSON.stringify({courtyardMotion:{width,height,waterChanged,candleChanged}}));
    expect(waterChanged).toEqual([true,true]);expect(candleChanged).toBe(true);
    for(const point of animated.points){
      expect(Math.max(...point.rgba.slice(0,3))).toBeGreaterThan(10);
      expect(point.rgba[3]).toBe(255);
    }
    peak=Math.max(peak,render.stats({width,height}).drawCalls);
  }
  expect(peak).toBeLessThanOrEqual(14);
  console.log(JSON.stringify({courtyardPeakDrawCalls:peak}));
},{scene,memory:'phone-low'});
