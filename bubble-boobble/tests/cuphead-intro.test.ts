import { expect, worldTest, renderTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createPartyGame } from '../src/arcade/party';
import { createGame, stepGame } from '../src/arcade/game';
import { EnemyState } from '../src/arcade/types';
import { introCue } from '../src/cartoon/intro-cue';
import { cartoonHudModel } from '../src/cartoon/hud-model';
import { cartoonPlayerVisible } from '../src/cartoon/actor-layout';
import { initialDesktopSave } from '../src/desktop/save';
import { PartyArrivalShowcase } from '../src/cartoon/party-arrivals.cheats';
import { session } from '../src/arcade/session';
import { desktopState } from '../src/desktop/state';
import { advanceFeel, deriveFeelAudio, emptyFeel } from '../src/arcade/juice';

const scene = 'scenes/cartoon.scene.json';
const game = () => createPartyGame(campaign, 42, Array.from({length:10},()=> 'human' as const), 10, 'cartoon');
const idle={Move:0,Jump:false,Fire:false};

worldTest('party arrivals presentation keeps the full entrance clear and announces GO only at activation', () => {
  const g=game(),total=g.Party!.Timer;
  const before=JSON.stringify(g),arrival=cartoonHudModel(g,initialDesktopSave);
  expect(arrival.banner).toBe('WAVE 01 - ARRIVING');
  expect(arrival.showBanner).toBe(true);expect(arrival.showStartCue).toBe(false);
  expect(arrival.startCue).toBe('');expect(JSON.stringify(g)).toBe(before);
  for(let tick=0;tick<total;tick++){
    expect(introCue(g).showStartCue).toBe(false);
    expect(cartoonHudModel(g,initialDesktopSave).startCue).toBe('');
    stepGame(g,idle);
  }
  expect(g.Party!.Phase).toBe('combat');
  const go=cartoonHudModel(g,initialDesktopSave);
  expect(go.startCue).toBe('GO!');expect(go.banner).toBe('WAVE 01 - GO!');
  expect(go.showBanner).toBe(true);expect(go.showStartCue).toBe(false);
  for(let tick=0;tick<60;tick++)stepGame(g,idle);
  expect(cartoonHudModel(g,initialDesktopSave).showBanner).toBe(false);
},{scene});

worldTest('party arrivals presentation never gates movement or practice shooting and respects visibility',()=>{
  const g=game(),x=g.Players[0]!.X,total=g.Party!.Timer;
  for(let tick=0;tick<Math.min(24,total);tick++){
    expect(introCue(g,true).showStartCue).toBe(false);
    stepGame(g,{Move:1,Jump:tick===0,Fire:true});
  }
  expect(g.Players[0]!.X).toBeGreaterThan(x);expect(g.Counters.Blown).toBeGreaterThan(0);
  expect(g.Party!.Phase).toBe('prepare');
  expect(cartoonHudModel(g,initialDesktopSave,'pause').showBanner).toBe(false);
  expect(cartoonHudModel(g,initialDesktopSave,'result').showBanner).toBe(false);
  expect(introCue(g,false,false).showStartCue).toBe(false);
  g.Paused=true;expect(introCue(g).showStartCue).toBe(false);
},{scene});

worldTest('party arrivals presentation keeps protected dragons visible while later rescue protection can blink',()=>{
  const g=game(),player=g.Players[0]!;
  for(const invincible of [6,7,11,18,23]){
    player.Invincible=invincible;
    expect(cartoonPlayerVisible(player,'prepare',0,true)).toBe(true);
    expect(cartoonPlayerVisible(player,'combat',0,true)).toBe(true);
    expect(cartoonPlayerVisible(player,'combat',120,true)).toBe(false);
  }
  player.Downed=true;player.Lives=0;
  expect(cartoonPlayerVisible(player,'prepare',0,true)).toBe(true);
  expect(cartoonPlayerVisible(player,'combat',120,true)).toBe(true);
  player.Downed=false;player.Dead=0;
  expect(cartoonPlayerVisible(player,'prepare',0,true)).toBe(false);
},{scene});

worldTest('party arrivals presentation retains one clear edge and finisher while the next wave arrives',()=>{
  const g=game();for(let tick=0,n=g.Party!.Timer;tick<n;tick++)stepGame(g,idle);
  let feel=advanceFeel(emptyFeel(),g,g.Tick);
  g.Party!.LastKill={Slot:0,Wave:1,Tick:g.Tick};
  for(const e of g.Enemies){e.State=EnemyState.Defeated;e.DeadTicks=0;}
  stepGame(g,idle);
  expect(g.Party!.Wave).toBe(2);expect(g.Party!.Phase).toBe('prepare');
  feel=advanceFeel(feel,g,g.Tick);
  expect(feel.cues.filter(c=>c.kind==='clear').length).toBe(1);
  const model=cartoonHudModel(g,initialDesktopSave);
  expect(model.banner).toBe('WAVE 02 - ARRIVING');expect(model.hint).toBe('BUB - LAST KILL!');
  stepGame(g,idle);
  expect(deriveFeelAudio(feel,g)).toEqual([]);
  feel=advanceFeel(feel,g,g.Tick);
  expect(feel.cues.filter(c=>c.kind==='clear').length).toBe(1);
},{scene});

worldTest('cuphead intro classic uses a separate readable Ready lead and a six hundred millisecond action hold', () => {
  const g=createGame(campaign,42),initial=JSON.stringify(g);
  let readyHold=0,classicActionHold=0;
  for(let tick=0;tick<90;tick++){
    const cue=introCue(g,false,true,{readyTick:tick});
    expect(cue.showActionArt).toBe(false);
    if(cue.cueStage==='ready-hold')readyHold++;
    if(tick>=84)expect(cue.showStartCue).toBe(false);
  }
  expect(readyHold).toBe(63);expect(JSON.stringify(g)).toBe(initial);expect(g.Countdown).toBe(60);
  for(let tick=0;tick<60;tick++){
    g.Countdown=60-tick;const cue=introCue(g);
    expect(cue.showReadyArt).toBe(false);
    if(cue.cueStage==='action-hold')classicActionHold++;
  }
  expect(classicActionHold).toBe(36);
  expect(introCue(g,false,true,{covered:true,readyTick:30}).showStartCue).toBe(false);
},{scene});

renderTest('party arrivals compact banner and whole late wave fit tall wide and ultrawide without blocking controls',async({input,step,cheat,render,ui})=>{
  await step(5);let peak=0;
  for(const [width,height] of [[640,960],[1680,720],[2520,1080]]){
    input.view(width!,height!,1);
    for(const stage of ['arriving','settled','go'] as const){
      // A prior held action must reach a released engine frame before the
      // showcase starts another run, then the new run observes that release.
      input.action('partyMove1',0);input.action('partyFire1',0);input.action('partyJump1',0);await step(1);
      await cheat(PartyArrivalShowcase,{wave:9,team:10,stage});await step(1);
      expect(desktopState.get().gameplayInputArmed!==false).toBe(true);
      const g=session.get().game!,model=cartoonHudModel(g,initialDesktopSave);
      expect(model.showStartCue).toBe(false);expect(model.showBanner).toBe(true);
      expect(model.banner).toBe(`WAVE 09 - ${stage==='arriving'?'ARRIVING':stage==='settled'?'GET READY':'GO!'}`);
      peak=Math.max(peak,render.stats({width:width!,height:height!}).drawCalls);
      const banner=ui.rect('cartoon-hud.banner')!;
      expect(banner.x>=0&&banner.y>=0&&banner.x+banner.width<=width!+1&&banner.y+banner.height<=height!+1).toBe(true);
      expect(banner.height<height!*.12).toBe(true);
      expect(ui.interactables().some(n=>n.id?.includes('ch_cue'))).toBe(false);
      render.expectScreenshot(`${stage}_${width}x${height}`,{width:width!,height:height!});
      const x=g.Players[0]!.X,shots=g.Counters.Blown;
      const fireSteps=Math.max(4,g.Players[0]!.Cooldown+1);
      const beforeFire={tick:g.Tick,cooldown:g.Players[0]!.Cooldown,armed:desktopState.get().gameplayInputArmed,shots};
      // Test actions are frame overrides, so feed held controls on every
      // recorded step while the real cooldown expires.
      for(let tick=0;tick<fireSteps;tick++){
        input.action('partyMove1',1);input.action('partyFire1',1);await step(1);
        if(tick===3)expect(session.get().game!.Players[0]!.X).toBeGreaterThan(x);
      }
      const fired=session.get().game!;
      if(fired.Counters.Blown<=shots)console.log(JSON.stringify({stage,width,fireSteps,beforeFire,afterFire:{tick:fired.Tick,cooldown:fired.Players[0]!.Cooldown,armed:desktopState.get().gameplayInputArmed,shots:fired.Counters.Blown,paused:fired.Paused,phase:fired.Party!.Phase}}));
      expect(fired.Counters.Blown).toBeGreaterThan(shots);
      input.action('partyMove1',0);input.action('partyFire1',0);
    }
  }
  expect(peak).toBeLessThanOrEqual(17);console.log(JSON.stringify({peakDrawCalls:peak}));
},{scene,memory:'phone-low'});
