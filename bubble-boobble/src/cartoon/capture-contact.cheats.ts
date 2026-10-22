import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {bubble} from '../arcade/bubbles';
import {EnemyState,State} from '../arcade/types';
import profiles from '../../data/cartoon-capture-profiles.json';
import {CARTOON_BUBBLE_SIZE,CARTOON_ENEMY_SIZE} from './actor-layout';
import {cartoonProjectY,cartoonInverseY} from './coordinates';
/** Six visible edge contacts which missed the old small capture rectangles. */
export const CartoonCaptureContacts=defineCheat({id:'cartoon.capture-contacts',group:'Concept verification',title:'Verify visible enemy capture contacts',params:{},resources:[write(ArcadeControl)],run(ctx){
 const s=session.get();if(!s.game)return;const g=copyGame(s.game),master=g.Enemies[0]!;
 g.State=State.Playing;g.Tick=0;g.LevelTicks=150;g.Freeze=10000;g.Countdown=0;g.Bubbles=[];g.Items=[];g.Particles=[];g.Effects=[];g.Projectiles=[];
 Object.assign(g.Players[0]!,{X:120,Y:484,Ground:true,VX:0,VY:0,Dead:0,Downed:false,Invincible:0,Shoot:0});
 const kinds=['zenchan','mighta','monsta','pulpul','invader','banebou'] as const,unit=CARTOON_ENEMY_SIZE/128;
 g.Enemies=kinds.map((Kind,i)=>({...master,ID:900+i,Kind,X:250+i*220,Y:268,Age:0,State:EnemyState.Active,Dir:1,Shoot:0}));
 for(const e of g.Enemies){
  const data=profiles.enemies[e.Kind as typeof kinds[number]].walk[0]!,edge=data.points.reduce((a,b)=>a[0]!>b[0]!?a:b);
  const x=e.X+22+(edge[0]!-64)*unit+CARTOON_BUBBLE_SIZE*60/128-2;
  const y=cartoonInverseY((cartoonProjectY(e.Y+44)*1728/1280+(edge[1]!-120)*unit)*1280/1728);
  g.Bubbles.push({...bubble(x-22,y-22),ID:950+g.Bubbles.length,Age:30,Shooter:0,Dir:-1,Speed:1,MaxDistance:160});
 }
 session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
}});
