import {Time,PlaySound} from '@gameengine/runtime';
import {cartoonFlowTiming} from '../src/cartoon/flow-timing';
import {expect,worldTest,renderTest} from '@gameengine/test';
import {DesktopIntent,ArcadeInput} from '../src/schema.gen';
import {desktopState,desktopGameRequest} from '../src/desktop/state';
import {session} from '../src/arcade/session';
import {PartyHit} from '../src/arcade/party.cheats';
const scene='scenes/cartoon.scene.json';

worldTest('cuphead frozen introduction does not replay the last gameplay sound',async({input,step,world})=>{
 await step(8);input.emit(DesktopIntent,{action:'start'});await step(65);
 input.action('fire',1);await step(1);input.action('fire',0);
 const shots=()=>world.events(PlaySound).filter(s=>['audio/brigade/sfx/bubble-shot'].includes(s.sound??'')).length;
 expect(session.get().game!.Sounds.includes('shoot')).toBe(true);
 expect(shots()).toBeGreaterThan(0);
 input.emit(DesktopIntent,{action:'ui-activate',value:'restart'});
 for(let tick=0;tick<15;tick++){await step(1);expect(shots()).toBe(0);}
 expect(desktopState.get().transitionAction).toBe('restart');
},{scene});

worldTest('cuphead launch commits only under cover and retry skips billing without losing neutral gate',async({input,step,cheat,world})=>{
 await step(8);
 input.emit(DesktopIntent,{action:'party'});await step(1);
 input.emit(DesktopIntent,{action:'ui-activate',value:'start-party'});await step(2);
 expect(desktopState.get().transitionAction).toBe('start-party');
 expect(desktopState.get().transitionHasTitle).toBe(true);
 const before=desktopGameRequest.get().sequence,launch=cartoonFlowTiming(true,'start-party',true),origin=desktopState.get().transitionStartedStep!;
 const at=async(age:number)=>{const frames=origin+age-world.resource(Time).step;if(frames>0)await step(frames);};
 await at(launch.commitAt-1);expect(desktopGameRequest.get().sequence).toBe(before);
 await at(launch.commitAt);expect(desktopGameRequest.get().sequence).toBe(before+1);
 expect(session.get().game!.Party!.Phase).toBe('prepare');
 expect(desktopState.get().transitionCommitted).toBe(true);
 input.emit(DesktopIntent,{action:'ui-activate',value:'start-party'});await step(1);
 expect(desktopGameRequest.get().sequence).toBe(before+1);
 await at(launch.finishAt-1);expect(desktopState.get().transitionAction).toBe('start-party');
 expect(session.get().game!.Party!.Timer).toBe(180);
 await at(launch.finishAt);expect(desktopState.get().transitionAction).toBe('');
 for(let slot=0;slot<10;slot++)await cheat(PartyHit,{slot});
 await step(1);expect(desktopState.get().screen).toBe('result');
 input.emit(DesktopIntent,{action:'ui-activate',value:'restart'});await step(1);
 expect(desktopState.get().transitionAction).toBe('');
 await step(46);expect(desktopState.get().resultReady).toBe(true);
 input.emit(DesktopIntent,{action:'ui-activate',value:'restart'});await step(2);
 expect(desktopState.get().transitionHasTitle).toBe(false);
 const retry=cartoonFlowTiming(false,'restart',true),retryOrigin=desktopState.get().transitionStartedStep!;
 await step(retryOrigin+retry.commitAt-1-world.resource(Time).step);expect(desktopGameRequest.get().sequence).toBe(before+1);
 await step(1);expect(desktopGameRequest.get().sequence).toBe(before+2);
 expect(session.get().game!.Party!.Wave).toBe(1);
},{scene});

worldTest('cuphead pause options returns to frozen pause and resume waits for the sheet exit',async({input,step})=>{
 await step(8);input.emit(DesktopIntent,{action:'start'});await step(65);
 input.emit(DesktopIntent,{action:'pause'});await step(2);
 const tick=session.get().game!.Tick;
 input.emit(DesktopIntent,{action:'ui-activate',value:'settings'});await step(1);
 expect(desktopState.get().screen).toBe('settings');
 await step(5);expect(session.get().game!.Tick).toBe(tick);
 input.emit(DesktopIntent,{action:'ui-activate',value:'menu'});await step(1);
 expect(desktopState.get().screen).toBe('pause');
 input.emit(DesktopIntent,{action:'ui-activate',value:'restart'});await step(1);
 expect(desktopState.get().pauseConfirm).toBe('restart');
 input.emit(DesktopIntent,{action:'ui-activate',value:'cancel-run-action'});await step(1);
 expect(desktopState.get().pauseConfirm).toBe('');
 input.action('fire',1);input.action('jump',1);
 input.emit(DesktopIntent,{action:'resume'});await step(2);
 expect(desktopState.get().pauseClosing).toBe(true);
 input.emit(ArcadeInput,{player:0,move:1,jump:true,fire:true,paused:false});await step(1);
 expect(session.get().game!.Paused).toBe(true);
 expect(session.get().game!.Tick).toBe(tick);
 await step(10);expect(desktopState.get().screen).toBe('play');
 expect(session.get().game!.Paused).toBe(false);
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===0)).toBe(false);
 input.action('fire',0);input.action('jump',0);await step(2);
 input.action('fire',1);await step(1);
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===0)).toBe(true);
},{scene});

renderTest('cuphead actual start button reaches billing then phase derived ready and clean combat',async({input,step,render,ui,cheat,world})=>{
 input.view(1680,720,1);await step(8);
 input.emit(DesktopIntent,{action:'party'});await step(2);render.stats({width:1680,height:720});
 const start=ui.interactables().find(b=>b.label==='START SURVIVAL')!;
 expect(!!start).toBe(true);await ui.press(start.id!);await step(2);
 const launch=cartoonFlowTiming(true,'start-party',true),origin=desktopState.get().transitionStartedStep!;
 const at=async(age:number)=>{const frames=origin+age-world.resource(Time).step;if(frames>0)await step(frames);};
 await at(launch.closeAt+2);
 expect(desktopState.get().transitionCommitted).toBe(false);
 render.expectScreenshot('billing',{width:1680,height:720});
 await at(launch.finishAt+12);expect(desktopState.get().screen).toBe('play');
 render.expectScreenshot('ready',{width:1680,height:720});
 await at(launch.finishAt+182);render.expectScreenshot('combat',{width:1680,height:720});
 expect(session.get().game!.Party!.Phase).toBe('combat');
 expect(desktopState.get().transitionAction).toBe('');
 for(let slot=0;slot<10;slot++)await cheat(PartyHit,{slot});await step(50);
 expect(desktopState.get().screen).toBe('result');
 render.stats({width:1680,height:720});render.expectScreenshot('defeat',{width:1680,height:720});
 console.log('journey defeat actions',JSON.stringify(ui.interactables()));
 const retry=ui.interactables().find(b=>(b.label??'').includes('RETRY RUN'))!;await ui.press(retry.id!);await step(Math.floor(cartoonFlowTiming(false,'restart',true).closeAt/2));
 expect(desktopState.get().transitionAction).toBe('restart');
 expect(desktopState.get().transitionHasTitle).toBe(false);
 render.expectScreenshot('retry_iris',{width:1680,height:720});
 await step(cartoonFlowTiming(false,'restart',true).finishAt+182);expect(session.get().game!.Party!.Wave).toBe(1);
 input.emit(DesktopIntent,{action:'pause'});await step(2);render.stats({width:1680,height:720});
 render.expectScreenshot('pause',{width:1680,height:720});
 const options=ui.interactables().find(b=>(b.label??'').includes('OPTIONS'))!;await ui.press(options.id!);await step(2);render.stats({width:1680,height:720});
 render.expectScreenshot('options',{width:1680,height:720});
 const back=ui.interactables().find(b=>(b.label??'').startsWith('BACK'))!;await ui.press(back.id!);await step(2);render.stats({width:1680,height:720});
 expect(desktopState.get().screen).toBe('pause');
 const resume=ui.interactables().find(b=>(b.label??'').includes('RESUME'))!;await ui.press(resume.id!);await step(15);
 expect(session.get().game!.Paused).toBe(false);
},{scene,memory:'phone-low'});

worldTest('cuphead fresh fire latch includes recorded inputs and keyboard pause cannot interrupt the iris',async({input,step,world})=>{
 await step(8);input.emit(DesktopIntent,{action:'party'});await step(1);
 input.action('partyFire1',1);input.emit(DesktopIntent,{action:'ui-activate',value:'start-party'});await step(2);
 const launch=cartoonFlowTiming(true,'start-party',true),origin=desktopState.get().transitionStartedStep!;
 await step(origin+launch.commitAt+3-world.resource(Time).step);
 expect(session.get().game!.Party!.Phase).toBe('prepare');
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===0)).toBe(false);
 input.action('pause',1);await step(1);input.action('pause',0);await step(1);
 expect(session.get().game!.Paused).toBe(false);
 input.emit(ArcadeInput,{player:0,move:0,jump:false,fire:false,paused:true});await step(1);
 expect(session.get().game!.Paused).toBe(false);
 input.action('partyFire1',0);await step(2);
 input.action('partyFire1',1);await step(1);
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===0)).toBe(false);
 input.action('partyFire1',0);await step(origin+launch.finishAt+2-world.resource(Time).step);
 input.action('partyFire1',1);await step(1);
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===0)).toBe(true);
 input.action('partyFire1',0);await step(2);
 expect(desktopState.get().transitionAction).toBe('');
 input.action('pause',1);await step(1);input.action('pause',0);await step(1);
 expect(session.get().game!.Paused).toBe(true);
},{scene});

renderTest('cuphead full bleed menu hover uses recorded viewport geometry instead of legacy button positions',async({input,step,render,ui})=>{
 await step(8);
 for(const [width,height,insets] of [[1680,720,[0,0,0,0]],[360,880,[0,0,0,0]],[2316,904,[84,0,0,0]]] as const){
  input.view(width,height,1,[...insets]);
  input.emit(DesktopIntent,{action:'menu'});await step(2);
  while(desktopState.get().titleRevealActive)await step(1);await step(1);
  expect(desktopState.get().menuInputArmed).toBe(true);render.stats({width,height});
  const settings=ui.rect('cartoon-main.settings')!;console.log(JSON.stringify({width,height,settings}));
  input.pointer('move',settings.x+settings.width/2,settings.y+settings.height/2);await step(1);
  expect(desktopState.get().selected).toBe(2);
 }
},{scene,memory:'phone-low'});

renderTest('cuphead tall phone pause keeps all actions finger sized inside the safe area',async({input,step,render,ui})=>{
 input.view(360,880,1);await step(8);
 input.emit(DesktopIntent,{action:'party'});await step(1);
 input.emit(DesktopIntent,{action:'start-party'});await step(200);
 input.emit(DesktopIntent,{action:'pause'});await step(2);render.stats({width:360,height:880});
 const actions=ui.interactables().filter(b=>['RESUME','RESTART RUN','OPTIONS','END RUN','TEAM SETUP'].some(label=>(b.label??'').includes(label)));
 expect(actions.length).toBe(5);
 for(const action of actions){const r=ui.rect(action.id!)!;expect(r.height>=43).toBe(true);expect(r.x>=0&&r.y>=0&&r.x+r.width<=361&&r.y+r.height<=881).toBe(true);}
},{scene,memory:'phone-low'});

worldTest('cuphead result back closes details first then exits through cover',async({input,step,cheat})=>{
 await step(8);input.emit(DesktopIntent,{action:'party'});await step(1);
 input.emit(DesktopIntent,{action:'start-party'});await step(200);
 for(let slot=0;slot<10;slot++)await cheat(PartyHit,{slot});await step(50);
 input.emit(DesktopIntent,{action:'result-details'});await step(1);
 expect(desktopState.get().resultDetails).toBe(true);
 input.action('back',1);await step(1);input.action('back',0);await step(1);
 expect(desktopState.get().resultDetails).toBe(false);
 expect(desktopState.get().screen).toBe('result');
 input.action('back',1);await step(1);input.action('back',0);await step(1);
 expect(desktopState.get().transitionAction).toBe('leave');
 expect(desktopState.get().screen).toBe('result');
 await step(cartoonFlowTiming(false,'leave',true).finishAt+1);expect(desktopState.get().screen).toBe('menu');
},{scene});

worldTest('cuphead removed classic action opens the survival lobby without launching a run',async({input,step})=>{
 await step(8);input.emit(DesktopIntent,{action:'ui-activate',value:'classic-mode'});await step(2);
 expect(desktopState.get().screen).toBe('party');
 expect(desktopState.get().transitionAction??'').toBe('');
 expect(session.get().active).toBe(false);
},{scene});
