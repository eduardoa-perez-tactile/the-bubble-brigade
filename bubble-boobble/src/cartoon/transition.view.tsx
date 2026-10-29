/** Original ink contours scale uniformly; native panels extend their opaque perimeter. */
import { createMemo, createSignal, defineView, elementRect, onCleanup, onUiFrame, Screen, Sprite, View, Widget } from '@gameengine/ui';

export interface CartoonTransitionModel {
  /** 0 is completely covered; 1 clears even the farthest viewport corner. */
  aperture: number;
  reducedEffects: boolean;
  /** Reduced-effects cover alpha. Full-motion presentation ignores this field. */
  opacity: number;
  /** Drawing held at 24 fps by the controller; aperture motion retains its 60 Hz timeline. */
  drawingFrame?: number;
}

export const CartoonTransitionView = defineView<CartoonTransitionModel>({
  name: 'CartoonTransition',
  layer: 'overlay',
  blockInput: true,
  samples: {
    closed: { aperture: 0, reducedEffects: false, opacity: 1 },
    partial: { aperture: 0.45, reducedEffects: false, opacity: 1 },
    small: { aperture: 0.08, reducedEffects: false, opacity: 1 },
    alternate: { aperture: 0.45, reducedEffects: false, opacity: 1, drawingFrame: 2 },
    open: { aperture: 1, reducedEffects: false, opacity: 0 },
    reduced: { aperture: 0.45, reducedEffects: true, opacity: 0.5 },
  },
  render: (model) => {
    const [extent, setExtent] = createSignal({ width: 1920, height: 1080 });
    onCleanup(onUiFrame(() => {
      const rect = elementRect('cartoon-transition-screen');
      if (rect && rect.width > 0 && rect.height > 0 && (rect.width !== extent().width || rect.height !== extent().height)) setExtent({width: rect.width, height: rect.height});
    }));
    const geometry = createMemo(() => {
      const { width, height } = extent();
      const aperture = Math.max(0, Math.min(1, model().aperture));
      // Every authored radius exceeds .98 of nominal. Allow for that inward
      // deviation plus filtering, so the last frame clears the farthest corner.
      const radius = aperture * (Math.hypot(width, height) / 2 / .98 + 2);
      const side = radius / .42;
      return { width, height, side, left: (width-side)/2, top: (height-side)/2 };
    });
    const shaped = () => !model().reducedEffects && model().aperture > 0 && model().aperture < 1;
    const panel = (edge: 'top'|'bottom'|'left'|'right'): Record<string,string|number> => {
      const g = geometry(), right = g.left+g.side, bottom = g.top+g.side;
      // One reference-pixel overlap sits within the sprite's opaque perimeter.
      // Panels precede the sprite so all four black rectangles batch together.
      if(edge==='top')return {left:0,top:0,width:g.width,height:Math.max(0,g.top+1)};
      if(edge==='bottom')return {left:0,top:Math.max(0,bottom-1),width:g.width,height:Math.max(0,g.height-bottom+1)};
      if(edge==='left')return {left:0,top:g.top-1,width:Math.max(0,g.left+1),height:g.side+2};
      return {left:Math.max(0,right-1),top:g.top-1,width:Math.max(0,g.width-right+1),height:g.side+2};
    };
    return <Screen id="cartoon-transition-screen" class="cartoon-transition-screen">
      <Widget doc="cartoon-transition" class="cartoon-transition-document" codeAreas={{ aperture: () => View({id:'cartoon-transition-aperture',style:{width:'100%',height:'100%'},children: <>
        <View class="cartoon-transition-cover" style={() => ({
          display: model().reducedEffects || model().aperture <= 0 ? 'flex' : 'none',
          opacity: model().reducedEffects ? model().opacity : 1,
        })} />
        <View style={() => ({display:shaped()?'flex':'none',width:'100%',height:'100%'})}>
          {(['top','bottom','left','right'] as const).map(edge => <View class="cartoon-transition-panel" style={() => panel(edge)} />)}
          <Sprite src={() => `cartoon/iris/contour-${Math.abs(Math.floor(model().drawingFrame??0))%4}`}
            class="cartoon-transition-contour" style={() => {
              const g=geometry();
              return {left:g.left,top:g.top,width:g.side,height:g.side};
            }} />
        </View>
      </>}) }} />
    </Screen>;
  },
});
