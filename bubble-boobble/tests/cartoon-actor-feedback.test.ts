import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {createBoss} from '../src/arcade/boss';
import {dragonDraws} from '../src/cartoon/plan';
import {emptyFeel,type FeelState} from '../src/arcade/juice';
import {cartoonBossFeedback,cartoonDragonFeedback,cartoonDragonShadow,cartoonGroundDust} from '../src/cartoon/actor-feedback';
const near=(a:number,b:number)=>expect(Math.abs(a-b)<.00001).toBe(true);
const feel=(kind:'land'|'turn'|'jump'|'boss-hit',age=0,slot=0):FeelState=>({...emptyFeel(),clock:age,cues:[{kind,x:222,y:392,at:0,slot}]});
worldTest('cartoon actor feedback keeps feet and shot crop seams while preserving exact release registration',()=>{
 const g=createGame(campaign,42),p=g.Players[0]!;
 Object.assign(p,{X:200,Y:300,Ground:true,Shoot:0,Dead:0,Downed:false,Lives:3,Dir:1});
 const initial=JSON.stringify(g);
 for(const airborne of [false,true]){
  p.Ground=!airborne;p.VY=airborne?-6:0;
  for(const shot of [0,12,11,10,6,1]){
   p.Shoot=shot;
   const draws=dragonDraws(p,'green',0,{moving:true,phase:.5,falling:false},141.312);
   const after=cartoonDragonFeedback(draws,p,0,feel('land'));
   if(shot===12||shot===11)expect(after).toEqual(draws);
   if(after.length===2)near(after[0]!.y+after[0]!.height,after[1]!.y);
   const lower=after[after.length-1]!;
   near(lower.y+lower.height*(after.length===2?24/32:120/128),p.Y+44);
   expect(cartoonDragonFeedback(draws,p,0,feel('land'),true)).toEqual(draws);
  }
 }
 Object.assign(p,{Ground:true,VY:0,Shoot:0});expect(JSON.stringify(g)).toBe(initial);
});
worldTest('cartoon actor feedback has no walking pulse and ignores unrelated or expired cues',()=>{
 const p=createGame(campaign,42).Players[0]!;Object.assign(p,{Ground:true,Shoot:0,Dead:0,Downed:false,Lives:3});
 const draws=dragonDraws(p,'blue',0,true);
 expect(cartoonDragonFeedback(draws,p,0)).toEqual(draws);
 expect(cartoonDragonFeedback(draws,p,0,feel('land',0,1))).toEqual(draws);
 expect(cartoonDragonFeedback(draws,p,0,feel('land',10))).toEqual(draws);
 const turn=cartoonDragonFeedback(draws,p,0,feel('turn'));
 expect(turn[0]!.width<draws[0]!.width).toBe(true);
});
worldTest('cartoon projected shadow fades with height stays on exposed support and never bridges gaps',()=>{
 const g=createGame(campaign,42),p=g.Players[0]!;
 g.Level.tiles=Array.from({length:26},()=>Array(32).fill(0));
 g.Level.tiles[20]![10]=1;
 Object.assign(p,{X:240,Y:436,Ground:true,Dead:0,Downed:false,Lives:3});
 const before=JSON.stringify(g),ground=cartoonDragonShadow(g,p)!;
 expect(ground.frame).toBe('shadow');expect(ground.x>=241).toBe(true);expect(ground.x+ground.width<=263).toBe(true);near(ground.y,476);
 p.Y-=100;const high=cartoonDragonShadow(g,p)!;
 expect(high.width<ground.width).toBe(true);expect(high.color![3]!<ground.color![3]!).toBe(true);
 p.Y-=50;expect(cartoonDragonShadow(g,p)).toBe(undefined);
 p.Y=436;p.X+=24;expect(cartoonDragonShadow(g,p)).toBe(undefined);
 p.X=240;g.Level.tiles[19]![10]=1;expect(cartoonDragonShadow(g,p)).toBe(undefined);
 g.Level.tiles[19]![10]=0;expect(JSON.stringify(g)).toBe(before);
});
worldTest('cartoon dust has a visible grounded crown at phone scale and is bounded and fully reduced',()=>{
 const f=feel('land'),before=JSON.stringify(f),dust=cartoonGroundDust(f);
 expect(dust.length).toBe(5);
 for(const d of dust){
  near(d.groundY,344);expect(d.y+d.height<=d.groundY).toBe(true);
  expect(d.frame).toBe('dust-puff');expect(d.color![3]!>=.7).toBe(true);
 }
 const bounds=(draws:ReturnType<typeof cartoonGroundDust>)=>({
  width:Math.max(...draws.map(d=>d.x+d.width))-Math.min(...draws.map(d=>d.x)),
  height:344-Math.min(...draws.map(d=>d.y)),
 });
 const impact=bounds(dust);
 expect(impact.width>=70&&impact.width<=80).toBe(true);
 expect(impact.height>=18&&impact.height<=32).toBe(true);
 // At the native narrow courtyard scale (.44), this is still a 30+ pixel
 // crown with 9+ pixel high opaque main lobes, rather than 4x2 wisps.
 expect(impact.width*.44>30).toBe(true);
 expect(dust[0]!.height*.44>9).toBe(true);
 expect(JSON.stringify(f)).toBe(before);
 for(const kind of ['jump','land'] as const){
  const life=kind==='land'?22:18,count=kind==='land'?5:3;
  const birth=cartoonGroundDust(feel(kind)),middle=cartoonGroundDust(feel(kind,6));
  expect(birth.length).toBe(count);expect(middle.length).toBe(count);
  expect(bounds(middle).width>bounds(birth).width).toBe(true);
  expect(bounds(middle).width<=80).toBe(true);
  expect(middle[0]!.color![3]!<birth[0]!.color![3]!).toBe(true);
  expect(cartoonGroundDust(feel(kind,life))).toEqual([]);
  expect(cartoonGroundDust(feel(kind,-1))).toEqual([]);
  expect(cartoonGroundDust(feel(kind),true)).toEqual([]);
 }
 // A simultaneous full party gets one crown each; an older event for the
 // same player cannot add clouds below a new landing or exhaust the cap.
 f.cues=Array.from({length:30},(_,i)=>({...f.cues[0]!,slot:i%10,at:i<20?-1:0}));
 expect(cartoonGroundDust(f).length).toBe(50);
 expect(cartoonGroundDust(f,true)).toEqual([]);
});
worldTest('cartoon boss anticipation and impact preserve its feet and reduced authored pose',()=>{
 const b=createBoss(2),draw={frame:'boss/attack-0',x:100,y:200,width:193.2,height:193.2};
 b.Mode='windup';b.Timer=1;
 const before=JSON.stringify(b),windup=cartoonBossFeedback(draw,b);
 expect(windup.width>draw.width).toBe(true);expect(windup.height<draw.height).toBe(true);
 near(windup.y+windup.height*120/128,draw.y+draw.height*120/128);
 const impact=cartoonBossFeedback(draw,b,feel('boss-hit'));
 near(impact.y+impact.height*120/128,draw.y+draw.height*120/128);
 expect(cartoonBossFeedback(draw,b,feel('boss-hit'),true)).toEqual(draw);expect(JSON.stringify(b)).toBe(before);
 b.Mode='captured';b.Timer=20;const captive=cartoonBossFeedback(draw,b,feel('boss-hit'));
 expect(captive.width).toBe(draw.width);expect(Math.abs(captive.y-draw.y)<=5).toBe(true);
 expect(cartoonBossFeedback(draw,b,feel('boss-hit'),true)).toEqual(draw);
});
