import {expect,worldTest,renderTest} from '@gameengine/test';
import {Sprite} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble} from '../src/arcade/bubbles';
import {EnemyState} from '../src/arcade/types';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput,ArcadeFeel,DesktopIntent} from '../src/schema.gen';
import {emptyFeel} from '../src/arcade/juice';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
import {unpackFeel} from '../src/arcade/juice';
worldTest('bubble juice growth stays visibly incomplete mid shot and colored wash sits behind a fixed captive',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');g.Party!.Telegraphs=[];
 const b={...bubble(800,300),ID:999,Age:0,Shooter:0};g.Bubbles=[b];
 const size=(age:number)=>{b.Age=age;return cartoonDrawPlan(g,age).find(d=>d.frame==='bubble')!.width;};
 const full=size(24),early=size(1),mid=size(8),late=size(12);
 expect(early<full*.25).toBe(true);expect(mid>full*.5&&mid<full*.7).toBe(true);expect(late<full*.95).toBe(true);expect(size(16)).toBe(full);
 const e=g.Enemies[0]!;g.Enemies=[e];e.State=EnemyState.Trapped;b.EnemyID=e.ID;b.Age=1;
 const plan=cartoonDrawPlan(g,0),body=plan.find(d=>d.frame==='bubble-body')!,c=plan.find(d=>d.frame.startsWith(`enemy/${e.Kind}/`))!,rim=plan.find(d=>d.frame==='bubble')!;
 expect(plan.indexOf(body)<plan.indexOf(c)&&plan.indexOf(c)<plan.indexOf(rim)).toBe(true);
 expect(body.color).toEqual(rim.color);expect(c.width/rim.width>.75&&c.width/rim.width<.8).toBe(true);
 const capturedSize=c.width;b.Age=24;expect(cartoonDrawPlan(g,24).find(d=>d.frame.startsWith(`enemy/${e.Kind}/`))!.width).toBe(capturedSize);
});
renderTest('bubble juice actual takeoff and landing puffs stay readable on native platforms',async({step,input,cheat,world,render})=>{
 input.view(768,720,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
 let peak=0,takeoff=false,landing=false;
 const puffs=()=>world.entities(Sprite).map(e=>world.get(e,Sprite)).filter(s=>s.visible&&s.image==='cartoon/frames/dust-puff');
 for(let tick=0;tick<86;tick++){
  for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:tick===0,fire:false,paused:false});
  await step(1);peak=Math.max(peak,render.stats({width:768,height:720}).drawCalls);
  const f=unpackFeel(world.resource(ArcadeFeel)),fresh=f.cues.filter(c=>f.clock-c.at<1);
  if(!takeoff&&fresh.some(c=>c.kind==='jump')){
   takeoff=true;expect(puffs().length>=3).toBe(true);expect(puffs().some(p=>p.size[0]>=10&&p.size[1]>=6)).toBe(true);
   render.expectScreenshot('takeoff_final',{width:768,height:720});
  }
  if(!landing&&fresh.some(c=>c.kind==='land')){
   landing=true;expect(puffs().length>=5).toBe(true);render.expectScreenshot('landing_birth_final',{width:768,height:720});
   await step(4);render.expectScreenshot('landing_bloom_final',{width:768,height:720});
  }
 }
 expect(takeoff).toBe(true);expect(landing).toBe(true);expect(puffs().length).toBe(0);
 input.emit(DesktopIntent,{action:'effects'});await step(1);
 for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:true,fire:false,paused:false});await step(1);expect(puffs().length).toBe(0);
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});

worldTest('bubble juice landing clouds stay anchored to the projected floor across screen shapes',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 const f=emptyFeel();f.cues=[{kind:'land',x:822,y:576,at:0,slot:0,strength:1}];
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},projection=cartoonProjection(g,arenaLayout(g.Level,view));
  const plan=cartoonDrawPlan(g,0,view,f),dust=plan.filter(d=>d.frame==='dust-puff');
  expect(dust.length).toBe(5);
  const floor=projection.projectY(528);
  expect(dust.every(d=>d.y+d.height<=floor+.00001)).toBe(true);
  expect(dust.some(d=>Math.abs(d.y+d.height-floor)<.00001)).toBe(true);
  expect(cartoonDrawPlan(g,0,view,f,undefined,true).some(d=>d.frame==='dust-puff')).toBe(false);
 }
});
