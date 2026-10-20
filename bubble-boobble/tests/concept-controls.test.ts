import { expect, worldTest } from '@gameengine/test';
import campaign from '../data/levels.json';
import { createCartoonArena } from '../src/cartoon/arena';
import { createGame, stepGame } from '../src/arcade/game';
import { createPartyGame, preparePartyWave, partyWaveBudget } from '../src/arcade/party';
import { buildCompanionGraph } from '../src/arcade/companion';
import { blocked } from '../src/arcade/physics';
import { cartoonHelpAnchor } from '../src/cartoon/help-layout';
import { cartoonDrawPlan } from '../src/cartoon/plan';
import { cartoonRescueLabels } from '../src/cartoon/labels';
import { arenaLayout } from '../src/arcade/arena-layout';
import { hurtPlayer } from '../src/arcade/player';
import { productionPlayerBalance } from '../src/arcade/balance';
import { ActorSize, State, Tile, body } from '../src/arcade/types';
import { DesktopIntent } from '../src/schema.gen';
import { desktopState } from '../src/desktop/state';
import { session } from '../src/arcade/session';

const idle={Move:0,Jump:false,Fire:false};
const scene='scenes/cartoon.scene.json';

worldTest('concept controls recorded solo default nine bots ten humans pause and restart preserve mode and geometry',async({input,step})=>{
 await step(8);
 expect(desktopState.get().cartoon).toBe(true);
 input.emit(DesktopIntent,{action:'classic-mode'});await step(1);
 expect(session.get().game!.Players.length).toBe(1);
 expect(session.get().game!.Party).toBe(undefined);
 expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
 input.emit(DesktopIntent,{action:'leave'});await step(1);
 input.emit(DesktopIntent,{action:'party'});await step(1);
 input.emit(DesktopIntent,{action:'start-party'});await step(1);
 expect(session.get().game!.Party!.Slots).toEqual(['human','ai','ai','ai','ai','ai','ai','ai','ai','ai']);
 await step(180);
 expect(session.get().game!.Party!.Phase).toBe('combat');
 expect(session.get().game!.Companions!.filter(Boolean).length).toBe(9);
 input.emit(DesktopIntent,{action:'pause'});await step(1);
 const paused=session.get().game!.Tick;await step(6);
 expect(session.get().game!.Tick).toBe(paused);
 input.emit(DesktopIntent,{action:'restart'});await step(1);
 expect(session.get().game!.Party!.Wave).toBe(1);
 expect(session.get().game!.Party!.Phase).toBe('prepare');
 expect(session.get().game!.Paused).toBe(false);
 expect(session.get().game!.Level.arena).toBe('cartoon-courtyard');
 input.emit(DesktopIntent,{action:'leave'});await step(1);
 input.emit(DesktopIntent,{action:'party'});await step(1);
 for(let index=0;index<10;index++)input.emit(DesktopIntent,{action:'party-join',index});
 await step(1);input.emit(DesktopIntent,{action:'start-party'});await step(1);
 expect(session.get().game!.Party!.Slots).toEqual(Array.from({length:10},()=> 'human'));
 expect(session.get().game!.Companions!.filter(Boolean).length).toBe(0);
 await step(180);
 const before=session.get().game!.Players[9]!.X;
 input.action('partyMove10',1);input.action('partyFire10',1);await step(1);
 expect(session.get().game!.Players[9]!.X).toBeGreaterThan(before);
 expect(session.get().game!.Bubbles.some(b=>b.Shooter===9)).toBe(true);
 input.action('partyMove10',0);input.action('partyFire10',0);
},{scene});

worldTest('concept controls all authored variants have safe connected navigation from every ten player spawn',()=>{
 for(const source of campaign.slice(0,4)){
  const g=createPartyGame([source],42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
  const graph=buildCompanionGraph(g,g.PlayerBalance!.MoveSpeed,0);
  const tiers=[...new Set(graph.Nodes.map(n=>(n.Y+ActorSize)/Tile))].sort((a,b)=>a-b);
  expect(tiers.length).toBe(5);
  for(const node of graph.Nodes){
   expect(blocked(g,node.X,node.Y,ActorSize)).toBe(false);
   expect(blocked(g,node.X,node.Y+1,ActorSize)).toBe(true);
   for(const link of node.Links){expect(link.To>=0&&link.To<graph.Nodes.length).toBe(true);expect(link.Ticks>0&&link.Ticks<=240).toBe(true);}
  }
  expect(g.Players.map(p=>(p.Y+ActorSize)/Tile).sort((a,b)=>a-b)).toEqual([3,3,8,8,13,13,18,18,23,23]);
  for(const player of g.Players){
   const supportRow=(player.Y+ActorSize)/Tile;
   for(let col=Math.floor(player.X/Tile);col<=Math.floor((player.X+ActorSize-.01)/Tile);col++)expect(g.Level.tiles[supportRow]![col]!).toBeGreaterThan(0);
   expect(blocked(g,player.X,player.Y,ActorSize)).toBe(false);
   expect(blocked(g,player.X,player.Y+1,ActorSize)).toBe(true);
   const first=graph.Nodes.findIndex(n=>n.Y===player.Y&&Math.abs(n.X-player.X)<=Tile);
   expect(first>=0).toBe(true);
   const seen=new Set([first]),queue=[first];
   for(let at=0;at<queue.length;at++)for(const edge of graph.Nodes[queue[at]!]!.Links)
    if(!seen.has(edge.To)){seen.add(edge.To);queue.push(edge.To);}
   expect(seen.size).toBe(graph.Nodes.length);
  }
 }
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls jump trajectory and unupgraded movement retain production physics',()=>{
 const reference=createGame(campaign,42),concept=createGame(campaign.map(createCartoonArena),42);
 expect(concept.PlayerBalance).toEqual(productionPlayerBalance);
 const traces:number[][]=[];
 for(const g of [reference,concept]){
  g.State=State.Playing;g.Freeze=10000;
  const p=g.Players[0]!;
  // Empty air above the floor isolates the existing jump table from authored shelves.
  const floor=g.Level.tiles.length-1;
  g.Level={...g.Level,tiles:g.Level.tiles.map((row,y)=>row.map((cell,x)=>x<2||x>=row.length-2||y===floor?1:0))};
  Object.assign(p,{X:240,Y:floor*Tile-ActorSize,Ground:true,VY:0,Invincible:10000});
  const initialY=p.Y,trace:number[]=[];
  for(let tick=0;tick<70;tick++){stepGame(g,{...idle,Jump:tick===0});trace.push(p.Y-initialY);}
  expect(Math.min(...trace)).toBe(-126);
  expect(p.Ground).toBe(true);
  expect(p.Power.Shoes).toBe(false);
  traces.push(trace);
 }
 expect(traces[1]).toEqual(traces[0]);
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls real unupgraded player ascends every authored tier through both continuous lanes',()=>{
 for(const source of campaign.slice(0,4))for(const col of [12,30]){
  const g=createGame([createCartoonArena(source)],42),p=g.Players[0]!;
  g.State=State.Playing;g.Freeze=10000;p.Invincible=10000;
  for(let tick=0;tick<30;tick++)stepGame(g,idle);
  expect((p.Y+ActorSize)/Tile).toBe(23);
  const target=col*Tile;
  for(let tick=0;Math.abs(p.X-target)>1e-7&&tick<300;tick++)
   stepGame(g,{...idle,Move:Math.max(-1,Math.min(1,(target-p.X)/g.PlayerBalance!.MoveSpeed))});
  expect(Math.abs(p.X-target)<1e-7).toBe(true);
  const landed=[23];
  for(const row of [18,13,8,3]){
   const before=p.Y;let apex=p.Y;
   stepGame(g,{...idle,Jump:true});apex=Math.min(apex,p.Y);
   for(let tick=0;!p.Ground&&tick<90;tick++){stepGame(g,idle);apex=Math.min(apex,p.Y);}
   expect(p.Ground).toBe(true);
   expect((p.Y+ActorSize)/Tile).toBe(row);
   expect(Math.abs(p.X-target)<1e-7).toBe(true);
   expect(before-apex).toBe(126);
   expect(p.Power.Shoes).toBe(false);
   landed.push((p.Y+ActorSize)/Tile);
   stepGame(g,idle);
  }
  expect(landed).toEqual([23,18,13,8,3]);
  expect(g.Counters.Jumps).toBe(4);
  stepGame(g,{...idle,Fire:true});
  expect(g.Bubbles.some(b=>b.Shooter===0&&b.Age===1)).toBe(true);
  console.log(`concept ascent round${source.number} lane${col}: ${landed.join(' -> ')}`);
 }
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls actual downed help follows actor at every aspect and disappears after contact rescue',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Countdown=0;g.Freeze=10000;
 const rescuer=g.Players[0]!,teammate=g.Players[1]!;
 Object.assign(teammate,{X:rescuer.X+70,Y:rescuer.Y,Ground:true,Invincible:0});
 hurtPlayer(g,1);
 expect(teammate.Downed).toBe(true);expect(teammate.Lives).toBe(0);
 const before=JSON.stringify(g);
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]};
  const layout=arenaLayout(g.Level,view),labels=cartoonRescueLabels(g,view);
  expect(labels.length).toBe(1);expect(labels[0]!.text).toBe('HELP!');
  const anchor=cartoonHelpAnchor(teammate,layout);
  expect(labels[0]!.x).toBe(layout.x+(anchor.x+13)*layout.scale);
  expect(labels[0]!.y).toBe(layout.y+(anchor.y+12)*layout.scale);
  expect(labels[0]!.size).toBe(14*layout.scale);
  expect(labels[0]!.y).toBeLessThan(layout.y+teammate.Y*layout.scale);
  const plaque={x:layout.x+(anchor.x-1)*layout.scale,y:layout.y+(anchor.y-1)*layout.scale,w:62*layout.scale,h:26*layout.scale};
  for(const badge of cartoonDrawPlan(g,0,view).filter(draw=>draw.frame.startsWith('badge/')))
   expect(badge.x<plaque.x+plaque.w&&badge.x+badge.width>plaque.x&&badge.y<plaque.y+plaque.h&&badge.y+badge.height>plaque.y).toBe(false);
 }
 expect(JSON.stringify(g)).toBe(before);
 for(let tick=0;g.Players[1]!.Downed&&tick<30;tick++)stepGame(g,[{...idle,Move:1},...Array.from({length:9},()=>idle)]);
 expect(g.Players[1]!.Downed).toBe(false);expect(g.Players[1]!.Lives).toBe(1);
 expect(cartoonRescueLabels(g,{width:1680,height:720,safeArea:[0,0,0,0]}).length).toBe(0);
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls every wave formation stays safe at six and ten dragon capacity across four layouts',()=>{
 for(const source of campaign.slice(0,4))for(const team of [6,10]){
  const g=createPartyGame([source],42,Array.from({length:team},()=> 'human' as const),10,'cartoon');
  for(let wave=1;wave<=9;wave++){
   g.Party!.Wave=wave;preparePartyWave(g);
   expect(g.Enemies.length).toBe(partyWaveBudget(wave,team));
   expect(g.Enemies.length).toBeLessThanOrEqual(32);
   expect(new Set(g.Enemies.map(e=>`${e.X},${e.Y}`)).size).toBe(g.Enemies.length);
   expect(g.Enemies.some(enemy=>enemy.Ground&&(enemy.Y+ActorSize)/Tile===3)).toBe(true);
   for(const enemy of g.Enemies){
    expect(blocked(g,enemy.X,enemy.Y,ActorSize)).toBe(false);
    expect(g.Players.some(p=>Math.abs(p.X-enemy.X)<ActorSize&&Math.abs(p.Y-enemy.Y)<ActorSize)).toBe(false);
    if(enemy.Kind!=='monsta'&&enemy.Kind!=='pulpul')
     expect(blocked(g,enemy.X,enemy.Y+1,ActorSize)).toBe(true);
   }
  }
 }
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls diagonal tier transfer and cross stage gap land through real unupgraded inputs',()=>{
 for(const source of campaign.slice(0,4)){
  const g=createGame([createCartoonArena(source)],42),p=g.Players[0]!;
  g.State=State.Playing;g.Freeze=10000;
  const graph=buildCompanionGraph(g,g.PlayerBalance!.MoveSpeed,0);
  for(const kind of ['diagonal','gap']){
   let chosen:{from:number;link:typeof graph.Nodes[number]['Links'][number]}|undefined;
   for(let from=0;from<graph.Nodes.length&&!chosen;from++){
    const n=graph.Nodes[from]!;
    for(const link of n.Links){
     const to=graph.Nodes[link.To]!;
     if(!link.Jump||link.Move===0||link.Ticks>=100||Math.abs(to.X-n.X)<48)continue;
     const row=(n.Y+ActorSize)/Tile;
     const gap=Array.from({length:Math.max(0,Math.floor(Math.abs(to.X-n.X)/Tile)-1)},(_,i)=>
      g.Level.tiles[row]![Math.floor(Math.min(n.X,to.X)/Tile)+i+1]===0).some(Boolean);
     if(kind==='diagonal'?n.Y-to.Y===120:to.Y===n.Y&&gap){chosen={from,link};break;}
    }
   }
   expect(!!chosen).toBe(true);
   const {from,link}=chosen!,start=graph.Nodes[from]!,target=graph.Nodes[link.To]!;
   Object.assign(p,body(start.X,start.Y),{Ground:true,LastJump:false,JumpBuffer:0,Coyote:0,MotionTick:0,Invincible:10000,Power:{...p.Power,Shoes:false}});
   const jumps=g.Counters.Jumps;
   for(let tick=1;tick<=link.Ticks;tick++)stepGame(g,{Move:link.Turn>=0&&tick>link.Turn?link.After:link.Move,Jump:tick===1,Fire:false});
   expect(p.Ground).toBe(true);
   expect(p.Y).toBe(target.Y);
   expect(Math.abs(p.X-target.X)<=Tile).toBe(true);
   expect(Math.abs(p.X-start.X)).toBeGreaterThan(24);
   expect(g.Counters.Jumps).toBe(jumps+1);
   console.log(`concept ${kind} round${source.number}: (${start.X},${start.Y}) -> (${p.X},${p.Y}) ${link.Ticks} ticks`);
  }
 }
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls missed jump falls safely to floor and player recovers to the next tier',()=>{
 const g=createGame([createCartoonArena(campaign[0]!)],42),p=g.Players[0]!;
 g.State=State.Playing;g.Freeze=10000;
 Object.assign(p,body(20*Tile,18*Tile-ActorSize),{Ground:true,Invincible:10000});
 // Leave the right edge of the broad lower shelf into its three-cell gap.
 for(let tick=0;Math.abs(p.X-23*Tile)>.001&&tick<100;tick++)
  stepGame(g,{...idle,Move:Math.max(-1,Math.min(1,(23*Tile-p.X)/g.PlayerBalance!.MoveSpeed))});
 expect(p.Ground).toBe(false);
 for(let tick=0;tick<8;tick++)stepGame(g,idle);
 expect(p.Coyote).toBe(0);
 const jumps=g.Counters.Jumps;
 stepGame(g,{...idle,Jump:true});
 expect(g.Counters.Jumps).toBe(jumps);
 for(let tick=0;!p.Ground&&tick<100;tick++)stepGame(g,idle);
 expect(p.Ground).toBe(true);expect((p.Y+ActorSize)/Tile).toBe(23);
 expect(p.Lives).toBe(3);
 for(let tick=0;Math.abs(p.X-12*Tile)>.001&&tick<200;tick++)
  stepGame(g,{...idle,Move:Math.max(-1,Math.min(1,(12*Tile-p.X)/g.PlayerBalance!.MoveSpeed))});
 stepGame(g,idle);stepGame(g,{...idle,Jump:true});
 for(let tick=0;!p.Ground&&tick<100;tick++)stepGame(g,idle);
 expect((p.Y+ActorSize)/Tile).toBe(18);expect(p.Ground).toBe(true);
 expect(g.Counters.Jumps).toBe(jumps+1);
},{scene:'scenes/arcade.scene.json'});

worldTest('concept controls crown apex injury keeps help plaque text and downed badge below header',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:10},()=> 'human' as const),10,'cartoon');
 g.Party!.Phase='combat';g.Party!.Timer=0;g.Countdown=0;g.Freeze=10000;
 const p=g.Players[1]!;
 for(let tick=0;tick<30;tick++)stepGame(g,Array.from({length:10},()=>idle));
 expect((p.Y+ActorSize)/Tile).toBe(3);
 const start=p.Y,inputs=Array.from({length:10},()=>idle);
 inputs[1]={...idle,Jump:true};stepGame(g,inputs);
 for(let tick=0;p.Y>start-126&&tick<60;tick++)stepGame(g,Array.from({length:10},()=>idle));
 expect(p.Y).toBe(start-126);
 p.Invincible=0;hurtPlayer(g,1);
 expect(p.Downed).toBe(true);expect(p.Lives).toBe(0);
 const before=JSON.stringify(g);
 for(const [width,height]of [[768,720],[1680,720],[640,960],[2520,1080]]){
  const view={width:width!,height:height!,safeArea:[0,0,0,0]},layout=arenaLayout(g.Level,view);
  const plan=cartoonDrawPlan(g,g.Tick,view),labels=cartoonRescueLabels(g,view);
  expect(labels.length).toBe(1);
  expect(labels[0]!.y-labels[0]!.size/2>=48-.01).toBe(true);
  const badge=plan.find(draw=>draw.frame==='badge/blue')!;
  expect(!!badge).toBe(true);expect(badge.y>=48-.01).toBe(true);
  const plaque=plan.find(draw=>draw.frame==='solid/#fff0c9'&&Math.abs(draw.width-60*layout.scale)<.01&&Math.abs(draw.height-24*layout.scale)<.01)!;
  expect(!!plaque).toBe(true);expect(plaque.y>=48-.01).toBe(true);
  expect(badge.x<plaque.x+plaque.width&&badge.x+badge.width>plaque.x&&badge.y<plaque.y+plaque.height&&badge.y+badge.height>plaque.y).toBe(false);
 }
 expect(JSON.stringify(g)).toBe(before);
},{scene:'scenes/arcade.scene.json'});
