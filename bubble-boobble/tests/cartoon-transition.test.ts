import { expect, renderTest } from '@gameengine/test';
import { views } from '@gameengine/ui';
import { CartoonTransitionView } from '../src/cartoon/transition.view';
import { DesktopIntent } from '../src/schema.gen';

// These isolated views bypass transitionAction, which normally hides the film
// overlay. Disable film explicitly so it cannot reattach above the injected cover.
renderTest('native cartoon iris covers corners and clears the complete viewport', async ({ input, step, render }) => {
  input.view(960, 540, 1);
  await step(3);
  input.emit(DesktopIntent,{action:'effects'});
  await step(1);
  const cover = views.push(CartoonTransitionView, { aperture: 0, reducedEffects: false, opacity: 1 });
  await step(2);
  const closed = render.probe({ width: 960, height: 540, points: [[1,1],[959,539],[480,270]] });
  for (const point of closed.points) expect(Math.max(...point.rgba.slice(0,3))).toBeLessThan(25);
  await render.expectScreenshot('native-iris-closed', { width:960, height:540 });
  cover.update({ aperture:0.45, reducedEffects:false, opacity:1 });
  await step(2);
  const partial = render.probe({ width:960, height:540, points:[[1,1],[959,539],[480,270],[700,270],[480,490],[700,490]] });
  await render.expectScreenshot('native-iris-partial', { width:960, height:540 });
  for (const i of [0,1,5]) expect(Math.max(...partial.points[i]!.rgba.slice(0,3))).toBeLessThan(25);
  for (const i of [2,3,4]) expect(Math.max(...partial.points[i]!.rgba.slice(0,3))).toBeGreaterThan(40);
  cover.close({ immediate:true });
}, { scene:'scenes/cartoon.scene.json', memory:'phone-low' });

renderTest('native cartoon iris opens every corner across aspect ratios and reduced effects', async ({ input, step, render }) => {
  await step(3);
  input.emit(DesktopIntent,{action:'effects'});
  await step(1);
  let incrementalDraws=0;
  for (const [width,height] of [[344,882],[768,1024],[1680,720]] as const) {
    input.view(width,height,1);
    await step(2);
    const points: [number,number][] = [[1,1],[width-2,1],[1,height-2],[width-2,height-2],[width/2,height/2]];
    const uncovered = render.probe({width,height,points});
    const baseline = render.stats({width,height});
    const cover = views.push(CartoonTransitionView,{aperture:0,reducedEffects:false,opacity:1});
    await step(2);
    for (const p of render.probe({width,height,points}).points) expect(Math.max(...p.rgba.slice(0,3))).toBeLessThan(25);
    const covered = render.stats({width,height});
    expect(covered.drawCalls - baseline.drawCalls).toBeLessThanOrEqual(2);
    for(let drawingFrame=0;drawingFrame<4;drawingFrame++){
      cover.update({aperture:0.45,reducedEffects:false,opacity:1,drawingFrame});
      await step(1);
      const partial=render.probe({width,height,points});
      for(let i=0;i<4;i++)expect(Math.max(...partial.points[i]!.rgba.slice(0,3))).toBeLessThan(25);
      expect(partial.points[4]!.rgba).toEqual(uncovered.points[4]!.rgba);
      const draws=render.stats({width,height}).drawCalls-baseline.drawCalls;
      incrementalDraws=Math.max(incrementalDraws,draws);
      expect(draws).toBeLessThanOrEqual(2);
      if(drawingFrame===0||drawingFrame===2)await render.expectScreenshot(`ink-${width}-drawing-${drawingFrame}`,{width,height});
    }
    cover.update({aperture:0.08,reducedEffects:false,opacity:1});
    await step(1);
    const small=render.probe({width,height,points});
    expect(small.points[4]!.rgba).toEqual(uncovered.points[4]!.rgba);
    for(let i=0;i<4;i++)expect(Math.max(...small.points[i]!.rgba.slice(0,3))).toBeLessThan(25);
    await render.expectScreenshot(`ink-${width}-small`,{width,height});
    // Check the final visible drawing too, before the exact fully-open fast path.
    cover.update({aperture:0.999,reducedEffects:false,opacity:1,drawingFrame:3});
    await step(1);
    const almostOpen=render.probe({width,height,points});
    for(let i=0;i<points.length;i++)expect(almostOpen.points[i]!.rgba).toEqual(uncovered.points[i]!.rgba);
    cover.update({aperture:1,reducedEffects:false,opacity:0});
    await step(2);
    const open = render.probe({width,height,points});
    for (let i=0;i<points.length;i++) expect(open.points[i]!.rgba).toEqual(uncovered.points[i]!.rgba);
    cover.update({aperture:0.45,reducedEffects:true,opacity:1});
    await step(2);
    for (const p of render.probe({width,height,points}).points) expect(Math.max(...p.rgba.slice(0,3))).toBeLessThan(25);
    cover.update({aperture:0.45,reducedEffects:true,opacity:0});
    await step(2);
    const reducedOpen=render.probe({width,height,points});
    for (let i=0;i<points.length;i++) expect(reducedOpen.points[i]!.rgba).toEqual(uncovered.points[i]!.rgba);

    cover.close({immediate:true});
    await step(1);
  }
  console.log(JSON.stringify({incrementalIrisDrawCalls:incrementalDraws,contourTextureMiB:4*640*640*4/1024/1024}));
}, {scene:'scenes/cartoon.scene.json',memory:'phone-low'});
