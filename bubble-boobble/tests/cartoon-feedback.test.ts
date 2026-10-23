import {expect,worldTest,renderTest} from '@gameengine/test';
import {Text2D,PlaySound} from '@gameengine/runtime';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {bubble} from '../src/arcade/bubbles';
import {emptyFeel,unpackFeel} from '../src/arcade/juice';
import {cartoonDrawPlan} from '../src/cartoon/plan';
import {cartoonBubbleShape,cartoonFeedback} from '../src/cartoon/feedback';
import {CartoonFeedbackFixture} from '../src/cartoon/feedback.cheats';
import {ConceptPlaytest} from '../src/cartoon/concept.cheats';
import {ArcadeInput,ArcadeFeel,DesktopIntent} from '../src/schema.gen';
const game=()=>createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
worldTest('cartoon feedback bubbles retain center captive scale and reduced cues without simulation writes',()=>{
 const b={...bubble(100,200),ID:8,Age:1,Shooter:2};const s=cartoonBubbleShape(b,40);
 expect(s.width>s.height).toBe(true);expect(s.x).toBe(122);expect(s.y).toBe(222);
 b.EnemyID=4;const captive=cartoonBubbleShape(b,96);expect(captive.width).toBe(96);expect(captive.height).toBe(96);
 expect(cartoonBubbleShape({...b,EnemyID:0},40,true).width).toBe(40);
 const g=game();g.Bubbles=[b];const before=JSON.stringify(g),f=emptyFeel();
 f.cues=[{kind:'rescue',x:122,y:292,at:0,slot:0}];
 const full=cartoonFeedback(g,f),reduced=cartoonFeedback(g,f,true);
 expect(full.accents.length>reduced.accents.length).toBe(true);expect(reduced.accents.length).toBe(0);expect(reduced.sprites.length>0).toBe(true);
 expect(full.sprites.some(d=>Math.abs(d.y+d.height/2-244)<.001)).toBe(true);expect(JSON.stringify(g)).toBe(before);
});
worldTest('cartoon feedback reduced mode stops decorative idle breathing and static knock stars retain help',()=>{
 const g=game();g.Party!.Phase='combat';g.Players[0]!.Downed=true;
 for(const p of g.Players)p.Invincible=0;
 const a=cartoonDrawPlan(g,0,undefined,undefined,undefined,true),b=cartoonDrawPlan(g,30,undefined,undefined,undefined,true);
 expect(a).toEqual(b);expect(a.some(d=>d.frame==='solid/#ffe08a')).toBe(true);
});
renderTest('cartoon feedback native bubbles landing capture rescue and reduced effects stay readable and bounded',async({step,input,cheat,world,render,audio})=>{
 input.view(768,720,1);await step(5);await cheat(ConceptPlaytest,{scenario:'route'});await step(2);
 let peak=0;const shot=(name:string,width=768,height=720)=>{
  peak=Math.max(peak,render.stats({width,height}).drawCalls);render.expectScreenshot(name,{width,height});
 };
 for(let t=0;t<40;t++){
  for(let player=0;player<10;player++)input.emit(ArcadeInput,{player,move:0,jump:t===0,fire:t===0,paused:false});
  await step(1);if([0,4,10,32,39].includes(t))shot('jump_shot_'+t);
 }
 await cheat(ConceptPlaytest,{scenario:'capture'});await step(1);input.emit(ArcadeInput,{player:0,move:0,jump:false,fire:true,paused:false});await step(8);shot('capture');
 await cheat(CartoonFeedbackFixture,{scenario:'pops'});await step(1);shot('chain');
 await cheat(CartoonFeedbackFixture,{scenario:'rescue'});
 for(let t=0;t<60;t++){
  input.emit(ArcadeInput,{player:0,move:1,jump:false,fire:false,paused:false});await step(1);
  if(unpackFeel(world.resource(ArcadeFeel)).cues.some(c=>c.kind==='rescue'))break;
 }
 expect(unpackFeel(world.resource(ArcadeFeel)).cues.some(c=>c.kind==='rescue')).toBe(true);
 expect(world.events(PlaySound).some(s=>s.sound==='audio/brigade/sfx/rescue')).toBe(true);
 render.stats({width:768,height:720});
 expect(world.entities(Text2D).some(e=>{const t=world.get(e,Text2D);return t.visible&&t.text==='SAVED!'&&t.size>=12;})).toBe(true);
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){input.view(width!,height!,1);await step(2);render.stats({width:width!,height:height!});expect(world.entities(Text2D).some(e=>{const t=world.get(e,Text2D);return t.visible&&t.text==='SAVED!'&&t.size>=12;})).toBe(true);shot(`rescue_${width}`,width,height);}
 await cheat(CartoonFeedbackFixture,{scenario:'boss'});await step(1);shot('boss_windup');
 await cheat(CartoonFeedbackFixture,{scenario:'prepare'});await step(1);shot('preparation_names');
 await cheat(ConceptPlaytest,{scenario:'route'});await step(1);await cheat(CartoonFeedbackFixture,{scenario:'cluster'});
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){input.view(width!,height!,1);await step(2);shot(`help_cluster_${width}`,width,height);}
 input.emit(DesktopIntent,{action:'effects'});await step(1);shot('reduced');
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
