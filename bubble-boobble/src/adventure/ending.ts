import type {DesktopState} from '../desktop/documents';
import type {GameState} from '../arcade/types';
import {State} from '../arcade/types';
import {ADVENTURE_CLEAR_STEPS} from './timing';

/** Victory shares the five-second bonus phase; defeat precedes result input. */
export const STORY_OUTCOME_STEPS=72;
export const STORY_BONUS_STEPS=ADVENTURE_CLEAR_STEPS;
export function storyOutcome(state:DesktopState,game:GameState|null,step:number):'victory'|'defeat'|null{
 if(!state.cartoon||!state.adventure||state.transitionAction||!game||game.Paused)return null;
 if(state.screen==='play'&&game.State===State.Clearing&&STORY_BONUS_STEPS-game.Countdown<STORY_OUTCOME_STEPS)return 'victory';
 if(state.screen==='result'&&!state.won&&((state.resultStartedStep??-1)<0||step-state.resultStartedStep!<STORY_OUTCOME_STEPS))return 'defeat';
 return null;
}
