/** Presentation envelopes only; collision and firing keep the original body. */
export const CARTOON_PLAYER_SIZE=141.312;
export const CARTOON_ENEMY_SIZE=123.648;
export const CARTOON_BOSS_SIZE=193.2;
export const CARTOON_VISUAL_LEFT=18;
export const CARTOON_VISUAL_RIGHT=1710;
export const CARTOON_HEADROOM=152;
export const CARTOON_PLATFORM_HEIGHT=32;
export const CARTOON_PLATFORM_SPAN=48;
export function cartoonBadgeSize(layout:{scale:number}){return Math.min(28/layout.scale,64);}
export function cartoonBadgeAnchor(player:{X:number;Y:number},layout:{y:number;scale:number;headerBottom?:number;projectY?:(y:number)=>number;inverseY?:(y:number)=>number},help?:{x:number;y:number}) {
  const size=cartoonBadgeSize(layout);
  if(help)return {x:help.x-size-4,y:help.y+(24-size)/2,size};
  let x=player.X+22-size/2,y=player.Y+44-CARTOON_PLAYER_SIZE*108/128-size-6;
  if(layout.projectY&&layout.inverseY)y=layout.inverseY(layout.projectY(player.Y+44)-(CARTOON_PLAYER_SIZE*108/128+size+6)*layout.scale);
  const safeTop=(layout.headerBottom??48)+4;
  const top=layout.inverseY?layout.inverseY(safeTop):(safeTop-layout.y)/layout.scale;
  if(y<top){
    y=top;x=player.X+22+CARTOON_PLAYER_SIZE/2+4;
    if(x+size>CARTOON_VISUAL_RIGHT)x=player.X+22-CARTOON_PLAYER_SIZE/2-size-4;
  }
  return {x,y,size};
}
/** Shared visibility keeps text identities on exactly the same blink as art. */
export function cartoonPlayerVisible(player:{Downed?:boolean;Lives:number;Dead:number;Invincible:number},phase:string|undefined,levelTicks:number,party:boolean){
  if(!player.Downed&&player.Lives===0&&player.Dead===0)return false;
  const grace=party&&(phase==='combat'||phase==='boss')&&levelTicks<120;
  return !!player.Downed||grace||!player.Invincible||player.Invincible%12<6;
}
