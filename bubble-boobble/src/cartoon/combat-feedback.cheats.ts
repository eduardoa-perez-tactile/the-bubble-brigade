import {defineCheat} from '@gameengine/runtime/cheats';
import {write} from '@gameengine/runtime';
import {ArcadeControl} from '../schema.gen';
import {session} from '../arcade/session';
import {copyGame} from '../arcade/game';
import {body,Tile} from '../arcade/types';
import {item} from '../arcade/items';
/** Reproducible render state for the player's combat feedback report. */
export const CombatFeedbackShowcase=defineCheat({
 id:'cartoon.combat-feedback',group:'Concept verification',title:'Combat pickup lightning fireball rescue feedback',
 params:{age:{type:'int',default:12}},resources:[write(ArcadeControl)],run(ctx,{age}){
  const s=session.get();if(!s.game?.Party?.Boss)return;const g=copyGame(s.game);
  g.LevelTicks=300;g.Freeze=10000;
  g.Items=['thunder_potion','shoes','yellow_candy','clock'].map((Power,i)=>({...item(340+i*330,18*Tile-32),Power,Stationary:true}));
  g.Projectiles=[-1,0,1].map((dy,i)=>({...body(1100,160+i*85),VX:3.8,VY:dy*3.2,Bottle:true,Laser:false,Age:age,Removed:false}));
  g.Effects=[{...body(600,250),ID:9001,Life:120,Spread:false,Element:'thunder',Age:age,Dir:1,Removed:false} as typeof g.Effects[number]];
  Object.assign(g.Players[1]!,{Downed:true,Lives:0});
  session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});
export const CombatEnemyShowcase=defineCheat({
 id:'cartoon.enemy-contact-feedback',group:'Concept verification',title:'Ground enemy actual jump and landing dust',
 params:{},resources:[write(ArcadeControl)],run(ctx){
  const s=session.get();if(!s.game?.Enemies.length)return;const g=copyGame(s.game);
  g.Party!.Phase='combat';g.Party!.Timer=0;g.Party!.ToSpawn=0;g.Party!.Telegraphs=[];g.Countdown=0;g.Freeze=0;g.LevelTicks=300;
  g.Enemies=[{...g.Enemies[0]!,Kind:'banebou',X:800,Y:18*Tile-44,VX:0,VY:0,Ground:true,Cooldown:90}];
  g.Items=[];g.Bubbles=[];g.Projectiles=[];g.Effects=[];
  for(const p of g.Players)p.Invincible=10000;
  session.set({...s,game:g});ctx.setField(ArcadeControl,'skip',true);
 },
});
