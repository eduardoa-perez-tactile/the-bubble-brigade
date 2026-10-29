import { View, Sprite, Particles, animate, createEffect, createSignal, onCleanup, elementRect, type ElementRect, type UINode, type UIAnimation } from '@gameengine/ui';
import { host } from '@gameengine/runtime/internal';
import type { DesktopModel } from '../desktop/model';

/** A single bubble travels between rows; native transitions retarget from the drawn position. */
export function MenuSelection(model: () => DesktopModel) {
  let bubble: UINode | undefined;
  let travel: UINode | undefined;
  let shimmer: UINode | undefined;
  let squash: UIAnimation | undefined;
  let shine: UIAnimation | undefined;
  let flight: UIAnimation | undefined;
  const [landings, setLandings] = createSignal(0);
  let previous = model().selected;
  const initialY = model().selected * (model().menuNarrow ? 96 : 48);
  let previousNarrow = model().menuNarrow, previousReduced = model().reducedEffects;
  createEffect(() => {
    const selected = model().selected, reduced = model().reducedEffects, narrow = model().menuNarrow;
    if (selected === previous && narrow === previousNarrow && reduced === previousReduced) return;
    const changed = selected !== previous, resized = narrow !== previousNarrow;
    previous = selected; previousNarrow = narrow; previousReduced = reduced;
    // Read the last paint without drawnRect's test-only auto-layout: this effect runs in the UI system,
    // where the test host does not expose test.uiLayout. The test body flushes using drawnRect as usual.
    const drawn = travel && host<ElementRect | null>('ui.drawnRect', travel.id), base = elementRect('menu-selection');
    const from = drawn && base ? drawn.y - base.y : selected * (narrow ? 96 : 48);
    const to = selected * (narrow ? 96 : 48);
    flight?.cancel();
    flight = animate(travel, [{ transform:`translateY(${from}px)` },{ transform:`translateY(${to}px)` }],
      { duration:reduced || resized ? 0 : 220, easing:'ease-out', fill:'forwards' });
    squash?.cancel(); shine?.cancel();
    if (reduced || !changed) return;
    setLandings(value => value + 1);
    squash = animate(bubble, [
      { transform: 'scale(1, 1)' },
      { offset: .35, transform: 'scale(.83, 1.18)' },
      { offset: .78, transform: 'scale(1.13, .88)' },
      { transform: 'scale(1, 1)' },
    ], { duration: 280, easing: 'ease-out' });
    shine = animate(shimmer, [
      { opacity: 0, transform: 'scale(.85)' },
      { offset: .65, opacity: .38, transform: 'scale(1.04)' },
      { opacity: 0, transform: 'scale(1.1)' },
    ], { duration: 280, easing: 'ease-out' });
  });
  onCleanup(() => { flight?.cancel(); squash?.cancel(); shine?.cancel(); });
  return <View id="menu-selection" class={() => model().menuNarrow ? 'menu-selection menu-selection-narrow' : 'menu-selection'}
    ref={node => { travel = node; }} style={() => ({ transform: `translateY(${model().reducedEffects ? model().selected * (model().menuNarrow ? 96 : 48) : initialY}px)` })}>
    <View class="menu-selection-art">
      <Sprite id="menu-selection-bubble" class="menu-selection-bubble" src="cartoon/menu/focus-bubble" ref={node => { bubble = node; }} />
      <Sprite class="menu-selection-shimmer" src="cartoon/menu/focus-bubble" ref={node => { shimmer = node; }} />
      <Particles class="menu-selection-glints" effect="cartoon/menu/selection-sparkles.vfx.json" unit={100} seed={41}
        restart={landings} emitting={() => landings() > 0 && !model().reducedEffects} />
    </View>
  </View>;
}
