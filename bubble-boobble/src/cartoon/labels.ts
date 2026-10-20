import { arenaLayout } from '../arcade/arena-layout';
import type { GameState } from '../arcade/types';
import { cartoonHelpAnchor } from './help-layout';
import { cartoonBadgeAnchor,cartoonPlayerVisible } from './actor-layout';

/** Numbered identities and rescue calls share exactly the sprite anchors.
 * The existing party text reserve36 covers ten numbers plus ten HELP labels. */
export function cartoonRescueLabels(game: GameState, view: {width:number;height:number;safeArea:ArrayLike<number>}) {
  if (!game.Party && game.Players.length<2) return [];
  const layout = arenaLayout(game.Level, view);
  const labels=[];
  for(let index=0;index<game.Players.length;index++){
    const player=game.Players[index]!;
    if(!cartoonPlayerVisible(player,game.Party?.Phase,game.LevelTicks,!!game.Party))continue;
    const help=player.Downed?cartoonHelpAnchor(player,layout):undefined;
    const badge=cartoonBadgeAnchor(player,layout,help),size=badge.size*layout.scale*.58;
    labels.push({image:'',text:String(index+1),x:layout.x+(badge.x+badge.size/2)*layout.scale,
      y:layout.y+(badge.y+badge.size/2)*layout.scale,w:0,h:0,flip:false,footer:false,
      size,color:[255,255,255] as const,worldNumber:true});
    if(help)labels.push({image:'',text:'HELP!',x:layout.x+(help.x+13)*layout.scale,
      y:layout.y+(help.y+12)*layout.scale,w:0,h:0,flip:false,footer:false,size:14*layout.scale,
      color:[43,36,28] as const,worldNumber:false});
  }
  if(labels.length>36)throw new Error('Cartoon identity and rescue text reserve exceeded');
  return labels;
}
