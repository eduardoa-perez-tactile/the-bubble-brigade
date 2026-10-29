import { renderTest, worldTest, expect } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState } from '../src/desktop/state';
import { sceneDraws } from '../src/arcade/presentation';
import { menuDragon } from '../src/desktop/animation';
import { partyColors } from '../src/arcade/party-config';
import { session } from '../src/arcade/session';
const scene='scenes/arcade.scene.json';
renderTest('party play release menu opens survival setup directly across screen shapes',async({input,step,render,ui})=>{
 input.view(768,720,1);await step(4);render.stats({width:768,height:720});await step(2);
 input.emit(DesktopIntent,{action:'development-menu',index:0});input.emit(DesktopIntent,{action:'menu'});await step(2);
 render.stats({width:768,height:720});expect(ui.interactables().map(b=>b.label).sort()).toEqual(['QUIT','SETTINGS','START GAME']);
 await ui.press(ui.interactables().find(b=>b.label==='START GAME')!.id!);await step(2);
 render.stats({width:768,height:720});await ui.press(ui.interactables().find(b=>b.label==='PARTY PLAY')!.id!);await step(2);
 expect(desktopState.get().screen).toBe('party');
 for(const [width,height] of [[768,720],[1680,720],[640,960]]){
  input.view(width!,height!,1);await step(1);render.stats({width:width!,height:height!});
  for(const b of ui.interactables())expect(b.rect.x>=0&&b.rect.y>=0&&b.rect.x+b.rect.width<=width!&&b.rect.y+b.rect.height<=height!).toBe(true);
 }
 await ui.press('party-lobby.start-party');await step(2);
 expect(desktopState.get().partyRun).toBe(true);expect(!!session.get().game!.Party).toBe(true);
},{scene});
renderTest('madness menu stays simple with development enabled',async({input,step,render,ui})=>{
 input.view(768,720,1);await step(4);render.stats({width:768,height:720});await step(2);
 input.emit(DesktopIntent,{action:'development-menu',index:1});input.emit(DesktopIntent,{action:'menu'});await step(2);render.stats({width:768,height:720});
 expect(ui.interactables().map(b=>b.label).sort()).toEqual(['START GAME','SETTINGS','QUIT'].sort());
 for(const [width,height] of [[768,720],[1680,720],[640,960],[2160,720]]){
  input.view(width!,height!,1);await step(1);render.stats({width:width!,height:height!});
  const buttons=ui.interactables();expect(buttons.length).toBe(3);
  for(const b of buttons)expect(b.rect.x>=0&&b.rect.y>=0&&b.rect.x+b.rect.width<=width!&&b.rect.y+b.rect.height<=height!).toBe(true);
  const portraits=sceneDraws(0).images.filter(d=>partyColors.some(c=>d.image.startsWith(`reference/${c}/walk/`)));
  expect(portraits.length).toBe(10);expect(portraits.every(d=>d.x>=0&&d.x+d.w<=768&&d.y+d.h<678)).toBe(true);
  render.expectDrawCalls('<=',14,{width:width!,height:height!});
  render.expectScreenshot(`simple_menu_${width}x${height}`,{width:width!,height:height!});
 }
 input.view(768,720,1);await step(1);render.stats({width:768,height:720});
 render.expectScreenshot('development_menu',{width:768,height:720});
 const buttonsBefore=ui.interactables().map(b=>({label:b.label,rect:b.rect}));
 const before=sceneDraws(14).images;
 await step(24);
 expect(JSON.stringify(sceneDraws(38).images)===JSON.stringify(before)).toBe(false);
 render.expectScreenshot('dragon_hop',{width:768,height:720});
 render.stats({width:768,height:720});
 expect(ui.interactables().map(b=>({label:b.label,rect:b.rect}))).toEqual(buttonsBefore);
 for(let frame=0;frame<360;frame++)for(let index=0;index<10;index++){
  const d=menuDragon(index,frame);
  expect(d.x>=36+index*70&&d.x<=44+index*70&&d.y>=570&&d.y<=596).toBe(true);
 }
 input.emit(DesktopIntent,{action:'effects'});await step(1);
 const reduced=sceneDraws(0).images;await step(60);
 expect(sceneDraws(60).images).toEqual(reduced);
 render.expectScreenshot('reduced_motion',{width:768,height:720});
 const settings=ui.interactables().find(b=>b.label==='SETTINGS')!;await ui.press(settings.id!);await step(2);expect(desktopState.get().screen).toBe('settings');
},{scene});
