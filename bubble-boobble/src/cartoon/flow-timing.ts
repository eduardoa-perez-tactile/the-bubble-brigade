/** Art-direction starting estimates, in deterministic 60 Hz simulation steps.
 * Keep orchestration and presentation on this one timeline; no animation callback owns play.
 */
export const CARTOON_LAUNCH_TIMING = { close: 36, covered: 84, reveal: 48 } as const;
export const CARTOON_RETRY_TIMING = { close: 27, covered: 5, reveal: 39 } as const;
/** Classic keeps its existing 60-tick preparation; Ready gets a separate frozen lead-in. */
export const CARTOON_CLASSIC_READY_STEPS = 90;
export interface CartoonFlowTiming {
  closeAt: number;
  commitAt: number;
  revealEndAt: number;
  readyLeadSteps: number;
  finishAt: number;
  revealSteps: number;
}
export function cartoonFlowStartsRun(action: string): boolean {
  return action === 'adventure-play' || action === 'start' || action === 'start-party' || action === 'restart' || action === 'test-level';
}
export function cartoonFlowTiming(hasTitle: boolean, action: string, partyRun = false): CartoonFlowTiming {
  const timing = hasTitle ? CARTOON_LAUNCH_TIMING : CARTOON_RETRY_TIMING;
  const targetIsParty = action === 'start-party' || action === 'restart' && partyRun;
  const readyLeadSteps = cartoonFlowStartsRun(action) && !targetIsParty ? CARTOON_CLASSIC_READY_STEPS : 0;
  const commitAt = timing.close + timing.covered;
  const revealEndAt = commitAt + timing.reveal;
  return { closeAt: timing.close, commitAt, revealEndAt, readyLeadSteps, finishAt: revealEndAt + readyLeadSteps, revealSteps: timing.reveal };
}
