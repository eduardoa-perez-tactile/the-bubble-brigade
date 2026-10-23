/** Native circular aperture: a rounded border, never a stretched cutout texture. */
import { createSignal, defineView, elementRect, onCleanup, onUiFrame, Screen, View, Widget } from '@gameengine/ui';

export interface CartoonTransitionModel {
  /** 0 is completely covered; 1 clears even the farthest viewport corner. */
  aperture: number;
  reducedEffects: boolean;
  /** Reduced-effects cover alpha. Full-motion presentation ignores this field. */
  opacity: number;
}

export const CartoonTransitionView = defineView<CartoonTransitionModel>({
  name: 'CartoonTransition',
  layer: 'overlay',
  blockInput: true,
  samples: {
    closed: { aperture: 0, reducedEffects: false, opacity: 1 },
    partial: { aperture: 0.45, reducedEffects: false, opacity: 1 },
    open: { aperture: 1, reducedEffects: false, opacity: 0 },
    reduced: { aperture: 0.45, reducedEffects: true, opacity: 0.5 },
  },
  render: (model) => {
    const [extent, setExtent] = createSignal({ width: 1920, height: 1080 });
    onCleanup(onUiFrame(() => {
      const rect = elementRect('cartoon-transition-screen');
      if (rect && rect.width > 0 && rect.height > 0 && (rect.width !== extent().width || rect.height !== extent().height)) setExtent({width: rect.width, height: rect.height});
    }));
    return <Screen id="cartoon-transition-screen" class="cartoon-transition-screen">
      <Widget doc="cartoon-transition" class="cartoon-transition-document" codeAreas={{ aperture: () => View({
        id: 'cartoon-transition-aperture',
        class: 'cartoon-transition-aperture',
        style: (): Record<string, string | number> => {
          const diagonal = Math.hypot(extent().width, extent().height);
          // The outside is a circle with radius 2 diagonals, hence every viewport pixel is inside it.
          const outer = diagonal * 2;
          const radius = Math.max(0, Math.min(1, model().aperture)) * (diagonal / 2 + 2);
          return model().reducedEffects || model().aperture <= 0
            ? { width: '100%', height: '100%', left: 0, top: 0, transform: 'none', 'border-width': 0, 'border-radius': 0, 'background-color': '#000000', opacity: model().reducedEffects ? model().opacity : 1 }
            : { width: `${outer * 2}px`, height: `${outer * 2}px`, 'border-width': `${outer - radius}px`, 'border-radius': `${outer}px`, opacity: 1 };
        },
      }) }} />
    </Screen>;
  },
});
