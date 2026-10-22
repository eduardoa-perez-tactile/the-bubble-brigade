import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame,stepGame} from '../src/arcade/game';
import {State} from '../src/arcade/types';
import {cartoonMotion,DRAGON_STRIDE_DISTANCE,type MotionGlobals} from '../src/cartoon/renderer';
import {dragonDraw,dragonDraws,cartoonDrawPlan} from '../src/cartoon/plan';
import {createCartoonArena} from '../src/cartoon/arena';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
import {CARTOON_PLAYER_SIZE} from '../src/cartoon/actor-layout';
import {partyColors} from '../src/arcade/party-config';
const idle={Move:0,Jump:false,Fire:false};
const empty=():MotionGlobals=>({v2:[0,0,0,0],v3:[0,0,0,0],v4:[0,0,0,0],v5:[0,0,0,0],v6:[0,0,0,0],v7:[0,0,0,0]});
const close=(a:number,b:number)=>expect(Math.abs(a-b)<.00001).toBe(true);
worldTest('dragon motion distance phase stops against walls resumes and follows shoes without simulation writes',()=>{
 const g=createGame(campaign,42),p=g.Players[0]!;
 Object.assign(p,{X:300,Y:400,Ground:true,VX:0,VY:0,Shoot:0,Dead:0,Downed:false,Lives:3});
 let m=cartoonMotion(g,empty());
 g.Tick++;p.X+=4.5;p.WalkFrame++;
 const before=JSON.stringify(g);m=cartoonMotion(g,m.globals);
 close(m.states[0]!.phase,4.5/DRAGON_STRIDE_DISTANCE);expect(m.moving[0]).toBe(true);expect(JSON.stringify(g)).toBe(before);
 const same=cartoonMotion(g,m.globals);expect(same.states).toEqual(m.states);
 g.Tick++;p.WalkFrame++;
 const wall=cartoonMotion(g,m.globals);expect(wall.moving[0]).toBe(false);close(wall.phases[0]!,m.phases[0]!);
 expect(dragonDraw(p,'green',g.Tick,wall.states[0]).frame.includes('/idle-')).toBe(true);
 g.Tick++;p.X-=6.3;p.Power.Shoes=true;
 const shoes=cartoonMotion(g,wall.globals);close(shoes.phases[0]!-wall.phases[0]!,6.3/DRAGON_STRIDE_DISTANCE);
 g.Tick++;p.Ground=false;p.X+=6.3;p.VY=-6;
 const airborne=cartoonMotion(g,shoes.globals);expect(airborne.moving[0]).toBe(false);close(airborne.phases[0]!,shoes.phases[0]!);
 g.Tick++;p.X+=600;p.Ground=true;
 const teleport=cartoonMotion(g,airborne.globals);expect(teleport.moving[0]).toBe(false);close(teleport.phases[0]!,airborne.phases[0]!);
 const reset=cartoonMotion(g,empty());close(reset.phases[0]!,0);expect(reset.moving[0]).toBe(false);
});
worldTest('dragon motion real normal and shoes jump apex never returns to rising after descent',()=>{
 for(const shoes of [false,true]){
  const g=createGame(campaign,42),p=g.Players[0]!;g.State=State.Playing;g.Freeze=10000;
  Object.assign(p,{X:320,Y:556,Ground:true,VY:0,Dead:0,Shoot:0,Invincible:10000});p.Power.Shoes=shoes;
  let m=cartoonMotion(g,empty()),fell=false,sawZero=false;
  for(let tick=0;tick<90;tick++){
   stepGame(g,{...idle,Jump:tick===0});m=cartoonMotion(g,m.globals);
   if(p.Ground&&tick>0)break;
   if(p.VY>0)fell=true;if(p.VY===0)sawZero=true;
   expect(m.states[0]!.falling).toBe(fell);
   expect(dragonDraw(p,'green',g.Tick,m.states[0]).frame).toBe(`dragon/green/jump-${fell?1:0}`);
  }
  expect(fell).toBe(true);expect(sawZero).toBe(true);
 }
});
worldTest('dragon motion remembers ballistic descent through holds and resets on bounce ground and hot reload',()=>{
 const g=createGame(campaign,42),p=g.Players[0]!;Object.assign(p,{Ground:false,VY:0,Dead:0,Shoot:0});
 let m=cartoonMotion(g,empty());expect(m.states[0]!.falling).toBe(false);
 for(const [vy,falling] of [[3,true],[0,true],[-6,false],[0,false],[3,true]] as const){
  g.Tick++;p.VY=vy;m=cartoonMotion(g,m.globals);expect(m.states[0]!.falling).toBe(falling);
 }
 g.Tick++;p.Ground=true;p.VY=0;m=cartoonMotion(g,m.globals);expect(m.states[0]!.falling).toBe(false);
 const old={v2:[200,300,0,0],v3:[0,0,0,0],v4:[0,0,g.Tick,1],v5:[999,999,0,0],v6:[0,0,0,0],v7:[0,0,0,0]};
 const reloaded=cartoonMotion(g,old);expect(reloaded.moving[0]).toBe(false);close(reloaded.phases[0]!,0);
});
worldTest('dragon motion keeps ten player slots distinct through float32 storage and phase wraps',()=>{
 const g=createGame(campaign,42),seed=g.Players[0]!;
 g.Players=Array.from({length:10},(_,i)=>({...seed,X:100+i*60,Ground:true,VY:0,Dead:0,Lives:3}));
 let m=cartoonMotion(g,empty());
 for(let tick=0;tick<100;tick++){
  g.Tick++;
  for(let i=0;i<10;i++)g.Players[i]!.X+=i%2?6.3:4.5;
  const quantized=Object.fromEntries(Object.entries(m.globals).map(([key,value])=>[key,value.map(Math.fround)])) as unknown as MotionGlobals;
  m=cartoonMotion(g,quantized);
  for(const state of m.states){expect(state.moving).toBe(true);expect(state.falling).toBe(false);expect(state.phase>=0&&state.phase<1).toBe(true);}
 }
 for(let i=0;i<10;i++){const expected=((i%2?6.3:4.5)*100/DRAGON_STRIDE_DISTANCE)%1;close(m.phases[i]!,expected);}
});

worldTest('dragon motion shooting retains locomotion phase air legs and exact release registration',()=>{
 const g=createGame(campaign,42),p=g.Players[0]!;
 Object.assign(p,{X:300,Y:400,Ground:true,Shoot:12,Dead:0,Downed:false,VX:0});
 for(const skin of partyColors)for(const dir of [-1,1]){
  p.Dir=dir;
  for(let pose=0;pose<16;pose++)for(let shot=12;shot>0;shot--){
   p.Shoot=shot;p.Ground=true;
   const state={moving:true,phase:pose/16,falling:false};
   const draws=dragonDraws(p,skin,g.Tick,state,141.312);
   expect(draws.length).toBe(2);expect(draws[0]!.frame).toBe(`dragon/${skin}/shoot-upper-${Math.floor((12-shot)/4)}`);
   expect(draws[1]!.frame).toBe(`dragon/${skin}/shoot-walk-lower-${Math.floor(pose/2)}`);
   close(draws[0]!.y+draws[0]!.height,draws[1]!.y);
   close(draws[0]!.height+draws[1]!.height,141.312);
   close(draws[0]!.y+141.312*120/128,p.Y+44);
   expect(draws[0]!.flip).toBe(dir<0);expect(draws[1]!.flip).toBe(dir<0);
   for(const falling of [false,true]){
    p.Ground=false;
    const air=dragonDraws(p,skin,g.Tick,{...state,moving:false,falling},141.312);
    expect(air[1]!.frame).toBe(`dragon/${skin}/shoot-air-lower-${falling?1:0}`);
    close(air[0]!.y,draws[0]!.y);
   }
  }
  p.Ground=true;
  for(let shot=12;shot>0;shot--){p.Shoot=shot;const still=dragonDraws(p,skin,0,{moving:false,phase:.5,falling:false});expect(still.length).toBe(1);expect(still[0]!.frame).toBe(`dragon/${skin}/shoot-${Math.floor((12-shot)/2)}`);}
 }
});
worldTest('dragon motion assembled shooting layers share a projected feet root across four aspects',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
 Object.assign(p,{X:700,Y:244,Ground:true,Shoot:12,Dead:0,Downed:false,Invincible:0,Lives:3});
 const motion={moving:true,phase:.3125,falling:false};
 const before=JSON.stringify(g);
 for(const [width,height] of [[768,720],[1536,864],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},projection=cartoonProjection(g,arenaLayout(g.Level,view));
  for(const shot of [12,8,4])for(const ground of [true,false]){
   p.Shoot=shot;p.Ground=ground;
   const layers=cartoonDrawPlan(g,g.Tick,view,undefined,[motion]).filter(d=>d.frame.includes('/shoot-upper-')||d.frame.includes('/shoot-walk-lower-')||d.frame.includes('/shoot-air-lower-'));
   expect(layers.length).toBe(2);
   close(layers[0]!.x,layers[1]!.x);close(layers[0]!.width,CARTOON_PLAYER_SIZE*projection.scale);
   close(layers[0]!.y+layers[0]!.height,layers[1]!.y);
   close(layers[0]!.height+layers[1]!.height,CARTOON_PLAYER_SIZE*projection.scale);
   close(layers[0]!.y+CARTOON_PLAYER_SIZE*projection.scale*120/128,projection.projectY(p.Y+44));
  }
 }
 Object.assign(p,{Shoot:12,Ground:true});expect(JSON.stringify(g)).toBe(before);
});
