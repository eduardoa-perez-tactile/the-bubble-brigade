import { defineCheat } from '@gameengine/runtime/cheats';
import { write } from '@gameengine/runtime';
import { ArcadeControl } from '../schema.gen';
import { session } from '../arcade/session';
import { copyGame } from '../arcade/game';
import { bubble } from '../arcade/bubbles';
import { EnemyState } from '../arcade/types';

/** Recorded QA setup only. Release bundling strips this file. */
export const CartoonCapture = defineCheat({
  id:'cartoon.capture-states', group:'Cartoon slice', title:'Inspect capture, warning and escape drawings',
  resources:[write(ArcadeControl)],
  run(ctx){
    const current=session.get();
    if(!current.game)return;
    const g=copyGame(current.game), source=g.Enemies.find(e=>e.Kind==='zenchan');
    if(!source)return;
    g.Enemies=[0,1,2].map((_,i)=>({...source,ID:++g.NextID,X:280+i*170,Y:430,State:EnemyState.Trapped}));
    g.Bubbles=g.Enemies.map((enemy,i)=>({...bubble(enemy.X,enemy.Y),ID:++g.NextID,EnemyID:enemy.ID,Age:30,CapturedAge:[30,1100,1250][i]!,Floating:true,Shooter:i}));
    g.Effects=[];g.Projectiles=[];
    session.set({...current,game:g});
    ctx.setField(ArcadeControl,'skip',true);
  },
});
