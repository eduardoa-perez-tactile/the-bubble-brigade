import {expect,renderTest,worldTest} from '@gameengine/test';
import {Text2D,VisualOffset} from '@gameengine/runtime';
import {cartoonRewardColor} from '../src/cartoon/reward-feedback';
import {DesktopIntent} from '../src/schema.gen';
import {CartoonRewardContrast} from '../src/cartoon/reward-contrast.cheats';
worldTest('cartoon reward fading preserves bright ink and fades fill and outline coverage',()=>{
 for(const fade of [0,195/255,220/255]){
  const alpha=fade===0?'ff':fade===195/255?'3c':'23';
  expect(cartoonRewardColor([216,245,255],fade)).toBe('#d8f5ff'+alpha);
  expect(cartoonRewardColor([255,242,176],fade)).toBe('#fff2b0'+alpha);
  expect(cartoonRewardColor([23,33,36],fade)).toBe('#172124'+alpha);
 }
});
renderTest('cartoon score fill stays bright through legacy banners and pause result fading',async({step,input,cheat,world,render})=>{
 input.view(1536,864,1);await step(5);input.emit(DesktopIntent,{action:'start'});await step(1);let peak=0;
 for(const screen of ['play','pause','result']){
  await cheat(CartoonRewardContrast,{screen});peak=Math.max(peak,render.stats({width:1536,height:864}).drawCalls);
  for(const text of ['10','8000']){
   const e=world.entities(Text2D).find(e=>{const t=world.get(e,Text2D);return t.visible&&t.text===text;})!;
   expect(!!e).toBe(true);const t=world.get(e,Text2D),v=world.get(e,VisualOffset),y=720-v.position[1]!;
   expect(v.position[0]!>=108&&v.position[0]!<660&&y>=240&&y<322).toBe(true);
   const color=t.color as readonly number[];
   expect(Math.min(...color.slice(0,3))>.4).toBe(true);
   expect(Math.abs(color[3]!-(screen==='play'?1:screen==='pause'?60/255:35/255))<.0001).toBe(true);
   expect(t.outlineWidth>.07).toBe(true);expect(t.outlineColor[3]).toBe(color[3]);
  }
  render.expectScreenshot('contrast_'+screen,{width:1536,height:864});
 }
 expect(peak).toBeLessThanOrEqual(14);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
