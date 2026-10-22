import type {Bubble} from '../arcade/types';

export type CartoonBubbleStage='normal'|'warning'|'escape'|'expiry';
/** Presentation only. Thresholds mirror the existing rules; they never advance timers.
 * Owner identity stays on the translucent body and badge while the ink shows danger.
 * All trapped stages retain the folded captive drawing and its registered size. */
export function cartoonBubbleState(b:Bubble,party:boolean,owner:string,reduced=false){
  const stage:CartoonBubbleStage=b.EnemyID
    ?b.CapturedAge>1200?'escape':b.CapturedAge>1000?'warning':'normal'
    :!party&&!b.Element&&b.Age>450?'expiry':'normal';
  const warning=stage!=='normal';
  return {stage,rim:stage==='escape'?'#ed6555':warning?'#f6b64e':owner,
    rimAlpha:reduced||!warning?1:(Math.floor(b.Age/(stage==='escape'?6:12))%2?.75:1),
    bodyAlpha:stage==='expiry'&&!reduced?(Math.floor(b.Age/12)%2?.65:1):1,
    captiveOffset:stage==='escape'&&!reduced?Math.sin(b.Age*.8)*2:0};
}
