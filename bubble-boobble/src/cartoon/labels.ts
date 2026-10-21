import { cartoonProjection } from './projection';
import { arenaLayout } from '../arcade/arena-layout';
import type { GameState } from '../arcade/types';
import { cartoonHelpAnchor } from './help-layout';
import { cartoonBadgeAnchor,cartoonPlayerVisible } from './actor-layout';

/** Numbered identities and rescue calls share exactly the sprite anchors.
 * The existing party text reserve36 covers ten numbers plus ten HELP labels. */
export function cartoonRescueLabels(game: GameState, view: {width:number;height:number;safeArea:ArrayLike<number>}) {
  if (!game.Party && game.Players.length<2) return [];
  const base=arenaLayout(game.Level,view),projection=game.Level.arena==='cartoon-courtyard'?cartoonProjection(game,base):undefined;
  const layout={...base,...(projection?{scale:projection.scale,projectY:projection.projectY,inverseY:projection.inverseY}:{})};
  const px=(x:number)=>projection?projection.projectX(x):layout.x+x*layout.scale;
  const py=(y:number)=>projection?projection.projectY(y):layout.y+y*layout.scale;
  const labels=[];
  for(let index=0;index<game.Players.length;index++){
    const player=game.Players[index]!;
    if(!cartoonPlayerVisible(player,game.Party?.Phase,game.LevelTicks,!!game.Party))continue;
    const help=player.Downed?cartoonHelpAnchor(player,layout):undefined;
    const badge=cartoonBadgeAnchor(player,layout,help),size=badge.size*layout.scale*.58;
    labels.push({image:'',text:String(index+1),x:px(badge.x+badge.size/2),
      y:py(badge.y)+badge.size/2*layout.scale,w:0,h:0,flip:false,footer:false,
      size,color:[255,255,255] as const,worldNumber:true});
    if(help)labels.push({image:'',text:'HELP!',x:px(help.x+13),
      y:py(help.y)+12*layout.scale,w:0,h:0,flip:false,footer:false,size:14*layout.scale,
      color:[43,36,28] as const,worldNumber:false});
  }
  if(labels.length>36)throw new Error('Cartoon identity and rescue text reserve exceeded');
  return labels;
}
