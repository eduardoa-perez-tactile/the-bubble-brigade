import type {FeelState} from '../arcade/juice';
import {CARTOON_PLAYER_SIZE} from './actor-layout';
import { cartoonProjection } from './projection';
import { arenaLayout } from '../arcade/arena-layout';
import type { GameState } from '../arcade/types';
import { cartoonHelpAnchors,cartoonHelpEnvelope } from './help-layout';
import { CARTOON_VISUAL_LEFT,CARTOON_VISUAL_RIGHT,cartoonBadgeAnchor,cartoonPlayerVisible } from './actor-layout';
import { partyColors,partyNames } from '../arcade/party-config';
import { cartoonHudBounds } from './hud-layout';

// Match the illustrated badge palette; outlined HELP uses the dragon color directly.
const identityColors=[[129,185,75],[70,139,200],[206,100,89],[227,185,83],[168,127,189],[220,147,81],[84,183,191],[216,142,170],[197,198,165],[113,130,151]] as const;
type NameBox={x:number;y:number;w:number;h:number};
const overlaps=(a:NameBox,b:NameBox)=>a.x<b.x+b.w+3&&a.x+a.w+3>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y;
/** Bounded projected-space placement: do not shift the dragon or its numbered badge. */
function prepareNameBox(x:number,y:number,w:number,h:number,left:number,right:number,top:number,bottom:number,occupied:NameBox[]):NameBox {
  let result={x:Math.max(left,Math.min(right-w,x-w/2)),y:Math.max(top,Math.min(bottom-h,y-h)),w,h};
  for(let row=0;row<10;row++)for(let column=0;column<21;column++){
    const offset=column===0?0:Math.ceil(column/2)*(column%2?1:-1);
    const candidate={...result,x:Math.max(left,Math.min(right-w,result.x+offset*(w+4))),y:Math.max(top,Math.min(bottom-h,result.y+row*(h+4)))};
    if(!occupied.some(other=>overlaps(candidate,other))){occupied.push(candidate);return candidate;}
  }
  occupied.push(result);return result;
}

/** Numbered identities and rescue calls share exactly the sprite anchors.
 * Preparation adds outlined names, at most ten, inside the existing36-text reserve. */
export function cartoonRescueLabels(game: GameState, view: {width:number;height:number;safeArea:ArrayLike<number>},feel?:FeelState) {

  const base=arenaLayout(game.Level,view),projection=game.Level.arena==='cartoon-courtyard'?cartoonProjection(game,base):undefined;
  const layout={...base,...(projection?{scale:projection.scale,projectX:projection.projectX,inverseX:projection.inverseX,projectY:projection.projectY,inverseY:projection.inverseY}:{})};
  const px=(x:number)=>projection?projection.projectX(x):layout.x+x*layout.scale;
  const py=(y:number)=>projection?projection.projectY(y):layout.y+y*layout.scale;
  const hud=cartoonHudBounds(view),helpLayout={...layout,footerTop:hud.bottom};
  const helps=cartoonHelpAnchors(game,helpLayout);
  const labels=[],occupied:NameBox[]=[...helps.values()].map(point=>cartoonHelpEnvelope(point,helpLayout));
  const left=px(CARTOON_VISUAL_LEFT)+2,right=px(CARTOON_VISUAL_RIGHT)-2;
  for(let index=0;index<game.Players.length;index++){
    if(!game.Party&&game.Players.length<2)break;
    const player=game.Players[index]!;
    if(!cartoonPlayerVisible(player,game.Party?.Phase,game.LevelTicks,!!game.Party))continue;
    const color=identityColors[index%partyColors.length]!;
    const help=helps.get(index);
    const badge=cartoonBadgeAnchor(player,layout,help),size=badge.size*layout.scale*.58;
    labels.push({image:'',text:String(index+1),x:px(badge.x+badge.size/2),
      y:py(badge.y)+badge.size/2*layout.scale,w:0,h:0,flip:false,footer:false,
      size,color:[255,255,255] as const,worldNumber:true});
    if(help)labels.push({image:'',text:'HELP!',x:px(help.x+30),
      y:py(help.y)+12*layout.scale,w:0,h:0,flip:false,footer:false,size:Math.max(12,22*layout.scale),
      color,worldNumber:false,playerName:true});
    if(game.Party?.Phase==='prepare'&&!help){
      const text=partyNames[index]!+(game.Companions?.[index]?' AI':'');
      const size=Math.max(10,Math.min(13,18*layout.scale));
      const box=prepareNameBox(px(badge.x+badge.size/2),py(badge.y)-3,text.length*size*.75,size,left,right,hud.top+4,hud.bottom-4,occupied);
      labels.push({image:'',text,x:box.x+box.w/2,y:box.y+box.h/2,w:box.w,h:box.h,flip:false,footer:false,size,color,worldNumber:false,playerName:true});
    }
  }
  for(const cue of feel?.cues??[]){
    const age=feel!.clock-cue.at;if(cue.kind!=='rescue'||age<0||age>=40)continue;
    const p=game.Players[cue.slot];if(!p)continue;
    const size=12,x=Math.max(left+32,Math.min(right-32,px(cue.x)));
    const y=Math.max(hud.top+size,py(p.Y+44)-CARTOON_PLAYER_SIZE*layout.scale-14);
    labels.push({image:'',text:'SAVED!',x,y,w:64,h:size,flip:false,footer:false,size,color:[210,239,174] as const,worldNumber:false,playerName:true});
  }
  const descriptions:Readonly<Record<string,string>>={
    thunder_potion:'LIGHTNING SHOTS',pink_candy:'LONGER RANGE',blue_candy:'FASTER BUBBLES',yellow_candy:'RAPID FIRE',
    shoes:'RUN FASTER',clock:'FREEZE ENEMIES',dynamite:'CLEAR ENEMIES',orange_parasol:game.Party?'TEAM SHIELD':'SKIP 3 LEVELS',
    red_parasol:game.Party?'TEAM SHIELD':'SKIP 5 LEVELS',purple_parasol:game.Party?'TEAM SHIELD':'SKIP 7 LEVELS',
    crystal_ring:'WALK FOR POINTS',amethyst_ring:'JUMP FOR POINTS',ruby_ring:'SHOOT FOR POINTS',
  };
  for(const item of game.Items){
    if(!item.Power||item.Power!=='thunder_potion'&&item.Age>600&&item.Age%12<6||labels.length>=36)continue;
    const text=descriptions[item.Power]??'POWER UP',size=12;
    const box=prepareNameBox(px(item.X+16),py(item.Y)-40*layout.scale,text.length*size*.65,size+2,left,right,hud.top+4,hud.bottom-4,occupied);
    labels.push({image:'',text,x:box.x+box.w/2,y:box.y+box.h/2,w:box.w,h:box.h,flip:false,footer:false,size,
      color:[255,233,151] as const,worldNumber:false,playerName:true});
  }
  if(labels.length>36)throw new Error('Cartoon identity and rescue text reserve exceeded');
  return labels;
}
