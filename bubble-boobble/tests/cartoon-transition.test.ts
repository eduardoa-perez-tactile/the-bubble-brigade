import { expect, renderTest } from '@gameengine/test';
import { views } from '@gameengine/ui';
import { CartoonTransitionView } from '../src/cartoon/transition.view';

// Native rendering changed a near-black literal during the initial probe, so compare
// against the uncovered frame and use low luma for black. No sprite/image is used by the circular aperture.
renderTest('native cartoon iris covers corners and clears the complete viewport', async ({ input, step, render }) => {
  input.view(960, 540, 1);
  await step(3);
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
  for (const [width,height] of [[360,880],[768,1024],[1680,720]] as const) {
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
}, {scene:'scenes/cartoon.scene.json',memory:'phone-low'});
