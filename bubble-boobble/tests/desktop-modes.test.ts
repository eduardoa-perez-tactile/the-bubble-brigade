import { expect, worldTest } from '@gameengine/test';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState, desktopGameRequest, initialDesktopState } from '../src/desktop/state';
import { getDesktopButtons, desktopModel } from '../src/desktop/model';
import { initialDesktopSave } from '../src/desktop/save';
import { desktopButtonRect, partyGridSelection } from '../src/desktop/layout';
import {PartyReset,PartyFinalPop} from '../src/arcade/party.cheats';
const scene='scenes/arcade.scene.json';
worldTest('desktop main menu has only start settings and quit in every build',async({input,step})=>{
 const menu={...initialDesktopState,screen:'menu' as const};
 expect(getDesktopButtons(menu,initialDesktopSave).map(b=>b.key)).toEqual(['adventure-menu','settings','quit']);
 expect(desktopButtonRect(menu,initialDesktopSave,2)).toEqual({x:218,y:448,width:332,height:44});
 expect(desktopButtonRect(menu,initialDesktopSave,3)).toBe(null);
 expect(desktopModel(menu,initialDesktopSave).developmentMenu).toBe(false);
 await step(5);input.emit(DesktopIntent,{action:'menu'});await step(1);
 input.emit(DesktopIntent,{action:'development-menu',index:1});await step(1);
 expect(desktopState.get().developmentMenu).toBe(true);
 expect(getDesktopButtons(desktopState.get(),initialDesktopSave).map(b=>b.key)).toEqual(['adventure-menu','settings','quit']);
 input.emit(DesktopIntent,{action:'development-menu',index:0});await step(1);
 expect(getDesktopButtons(desktopState.get(),initialDesktopSave).map(b=>b.key)).toEqual(['adventure-menu','settings','quit']);
},{scene});
worldTest('party play opens survival directly and legacy mode routes cannot launch classic',async({input,step})=>{
 await step(5);
 expect(partyGridSelection(0,0,1,2)).toBe(2);expect(partyGridSelection(8,0,1,2)).toBe(11);
 expect(partyGridSelection(10,0,-1,2)).toBe(9);
 for(const action of ['choose-mode','classic-mode','madness-mode']){
  input.emit(DesktopIntent,{action});await step(1);
  expect(desktopState.get().screen).toBe('party');
  expect(getDesktopButtons(desktopState.get(),initialDesktopSave).some(b=>b.key==='classic-mode')).toBe(false);
  input.emit(DesktopIntent,{action:'menu'});await step(1);expect(desktopState.get().screen).toBe('menu');
 }
 input.emit(DesktopIntent,{action:'navigate',value:'modes'});await step(1);expect(desktopState.get().screen).toBe('party');
 input.emit(DesktopIntent,{action:'start-party'});await step(1);
 expect(desktopGameRequest.get().action).toBe('party');expect(desktopState.get().partyRun).toBe(true);
},{scene});
worldTest('party play returns to its caller and team setup preserves the current run',async({input,step,cheat})=>{
 await step(5);input.emit(DesktopIntent,{action:'adventure-menu'});await step(1);
 input.emit(DesktopIntent,{action:'adventure-arcade'});await step(1);expect(desktopState.get().screen).toBe('party');
 input.emit(DesktopIntent,{action:'menu'});await step(1);expect(desktopState.get().screen).toBe('overworld-panel');
 input.emit(DesktopIntent,{action:'adventure-arcade'});await step(1);
 input.emit(DesktopIntent,{action:'start-party'});await step(1);
 await cheat(PartyReset,{wave:4,team:10,countdown:1,humans:1});await step(2);
 await cheat(PartyFinalPop,{slot:0});await step(2);
 expect(desktopState.get().score).toBeGreaterThan(0);
 expect(desktopState.get().round).toBe(5);
 input.emit(DesktopIntent,{action:'pause'});await step(1);
 const score=desktopState.get().score,round=desktopState.get().round;
 input.emit(DesktopIntent,{action:'party'});await step(1);expect(desktopState.get().partyEditing).toBe(true);
 input.emit(DesktopIntent,{action:'menu'});await step(1);expect(desktopState.get().screen).toBe('pause');
 input.emit(DesktopIntent,{action:'party'});await step(1);
 input.emit(DesktopIntent,{action:'start-party'});await step(1);
 expect(desktopGameRequest.get().action).toBe('party-controls');
 expect(desktopState.get().score).toBe(score);expect(desktopState.get().round).toBe(round);
 expect(getDesktopButtons({...desktopState.get(),cartoon:true,screen:'pause'},initialDesktopSave).map(b=>b.key)).toEqual(['resume','party','settings','restart','leave']);
},{scene});
