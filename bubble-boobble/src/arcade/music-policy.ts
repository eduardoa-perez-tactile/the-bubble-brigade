/** Music palette follows recorded desktop flow, never native backend availability. */
export interface MusicFlow {cartoon?:boolean}
export interface MusicGame {State:number;Hurry:boolean}
const originalTracks:Record<string,string>={theme:'music-bubble-1',menu:'music-bubble-2',opening:'music-bubble-2',hurry:'music-bubble-3',gameover:'music-bubble-4',win:'music-bubble-5'};
export function usesIllustratedMusic(flow:MusicFlow):boolean{return !!flow.cartoon;}
export function isIllustratedMusicTrack(track:string):boolean{return track.startsWith('brigade-');}
export function selectArcadeMusic(flow:MusicFlow,game:MusicGame|null):{track:string;asset:string|null}{
 if(usesIllustratedMusic(flow)){
  if(game&&(game.State===3||game.State===4))return {track:'brigade-silent',asset:null};
  return game?{track:'brigade-gameplay',asset:'audio/brigade/gameplay'}:{track:'brigade-menu',asset:'audio/brigade/menu'};
 }
 const track=!game?'menu':game.State===4?'win':game.State===3?'gameover':game.Hurry?'hurry':'theme';
 return {track,asset:`reference/audio/${originalTracks[track]}`};
}
/** Keep window/focus/readiness connected while silencing inherited YM music. */
export function nativeBridgeMusicState(flow:MusicFlow,classicTrack:string,muted:boolean):{track:string;muted:boolean}{
 return usesIllustratedMusic(flow)?{track:'',muted:true}:{track:classicTrack,muted};
}
