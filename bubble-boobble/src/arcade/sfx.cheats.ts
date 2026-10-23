import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {copyGame} from './game';
import {session} from './session';
import {bubble,popBubble} from './bubbles';
import {item} from './items';
import {captureBoss} from './boss';
import {updatePlayer} from './player';
import {ActorSize,State,body} from './types';

/** Recorded audio QA setups reuse the production pickup/pop/rescue paths. */
export const BrigadeSfxProbe=defineCheat({
 id:'arcade.brigade-sfx',group:'Audio',title:'Inspect Brigade sound feedback',
 params:{scenario:{type:'string',default:'food'}},resources:[write(ArcadeControl)],
 run(ctx,{scenario}){
  const current=session.get();if(!current.game)throw new Error('Start a run before probing sound feedback');
  const g=copyGame(current.game),p=g.Players[0]!;
  g.Sounds=[];g.Paused=false;g.State=State.Playing;
  let skip=true;
  if(['food','power-up','explosion','death','jump'].includes(scenario)){
   g.Freeze=10000;g.Items=[];g.Projectiles=[];g.Bubbles=[];g.Effects=[];
   p.Invincible=scenario==='death'?0:10000;p.Dead=0;p.Downed=false;p.Lives=Math.max(1,p.Lives);
   if(scenario==='death')g.Projectiles=[{...body(p.X,p.Y),Age:0,Bottle:false,Laser:false,Removed:false}];
   else if(scenario==='jump'){p.Ground=true;p.JumpBuffer=8;p.Coyote=6;p.LastJump=false;}
   else g.Items=[{...item(p.X,p.Y),Stationary:true,Food:scenario==='food'?13:0,Power:scenario==='power-up'?'pink_candy':scenario==='explosion'?'dynamite':''}];
   skip=false;
  }else if(['fire','water','thunder','pop'].includes(scenario)){
   g.Bubbles=[{...bubble(p.X+80,p.Y),Age:30,ID:++g.NextID,Element:scenario==='pop'?'':scenario}];
   popBubble(g,0,0);g.Tick++;
  }else if(scenario==='boss-capture'){
   if(!g.Party?.Boss)throw new Error('Use a boss scenario first');
   captureBoss(g);g.Tick++;
  }else if(scenario==='boss-windup'){
   if(!g.Party?.Boss)throw new Error('Use a boss scenario first');
   g.Party.Boss.Mode='windup';g.Party.Boss.Timer=50;g.Tick++;
  }else if(scenario==='rescue'||scenario==='rescue-pickup'){
   if(!g.Party||!g.Players[1]?.Downed)throw new Error('Use a downed teammate scenario first');
   p.X=g.Players[1]!.X;p.Y=g.Players[1]!.Y;
   g.Items=scenario==='rescue-pickup'?[{...item(p.X,p.Y),Stationary:true,Power:'pink_candy'}]:[];skip=false;
  }else if(scenario==='wave-clear'){
   if(!g.Party)throw new Error('Use a party scenario first');
   g.Party.Phase='rest';g.Party.Timer=180;g.State=State.Clearing;g.Tick++;
  }else if(scenario==='defeat'){g.State=State.GameOver;g.Tick++;
  }else if(scenario==='countdown'){
   if(!g.Party)throw new Error('Use a party scenario first');
   g.Party.Phase='prepare';g.Party.Timer=181;g.Countdown=181;g.Tick++;
  }else if(scenario==='airborne'){
   p.Ground=false;p.VY=6;p.JumpStep=30;p.Y-=20;g.Tick++;
  }else if(scenario==='landing'){
   p.Ground=true;p.VY=0;delete p.JumpStep;g.Tick++;
  }else if(scenario==='bubble-bounce'||scenario==='mixed-jump-bounce'){
   if(scenario==='mixed-jump-bounce'){
    const other=g.Players[1];if(!other)throw new Error('Use a two-player run for mixed jump and bounce');
    other.Ground=true;other.Coyote=6;other.JumpBuffer=0;other.LastJump=false;
    updatePlayer(g,1,{Move:0,Jump:true,Fire:false});
   }
   p.Ground=false;p.VY=-6;p.JumpStep=0;
   g.Bubbles=[{...bubble(p.X,p.Y+ActorSize),ID:++g.NextID,Age:30}];
   g.Sounds.push('jump');g.Tick++;
  }else throw new Error(`Unknown sound probe: ${scenario}`);
  session.set({...current,game:g});ctx.setField(ArcadeControl,'skip',skip);
 },
});
