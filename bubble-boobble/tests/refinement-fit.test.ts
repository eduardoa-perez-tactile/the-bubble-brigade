import {expect,renderTest} from '@gameengine/test';
import {Sprite,Text2D,VisualOffset,ViewInfo,WorldView} from '@gameengine/runtime';
import {ConceptPlaytest,ConceptHit} from '../src/cartoon/concept.cheats';
import {CartoonOverhaul} from '../src/cartoon/overhaul.cheats';
import {session} from '../src/arcade/session';
import {cartoonProjection} from '../src/cartoon/projection';
import {arenaLayout} from '../src/arcade/arena-layout';
import {actorAlphaBounds,projectBounds,type Bounds} from './helpers/refinement-fit';

declare const __gameengine_host:(op:string,arg:string)=>string;
const pad=(events:unknown[])=>__gameengine_host('test.input',JSON.stringify(events));
const devices=[
 {name:'fold_cover',width:904,height:2316,scale:2.625,insets:[0,84,0,0]},
 {name:'iphone_notch',width:1179,height:2556,scale:3,insets:[0,177,0,102]},
 {name:'tablet',width:1620,height:2160,scale:2,insets:[0,40,0,0]},
];

renderTest('refinement checkpoint actual enlarged actors numbers help and HUD fit narrow notched and tablet devices',async({input,step,cheat,render,world,ui})=>{
 input.view(768,720,1);await step(8);
 await cheat(ConceptPlaytest,{scenario:'route'});
 // Reach both physical arena limits through the recorded control path.
 pad([{type:'gamepadAxis',pad:0,axis:0,value:-1},{type:'gamepadAxis',pad:9,axis:0,value:1}]);await step(100);
 pad([{type:'gamepadAxis',pad:0,axis:0,value:0},{type:'gamepadAxis',pad:9,axis:0,value:0}]);await step(1);
 expect(session.get().game!.Players[0]!.X).toBe(48);
 expect(session.get().game!.Players[9]!.X).toBe(1636);
 const start=session.get().game!.Players[1]!.Y;
 pad([{type:'gamepadButton',pad:1,button:0,down:true}]);await step(1);
 pad([{type:'gamepadButton',pad:1,button:0,down:false}]);
 for(let tick=0;session.get().game!.Players[1]!.Y>start-126&&tick<60;tick++)await step(1);
 expect(session.get().game!.Players[1]!.Y).toBe(start-126);
 await cheat(ConceptHit,{slot:1});
 expect(session.get().game!.Players[1]!.Downed).toBe(true);

 for(const scenario of ['crown_help','boss']){
  if(scenario==='boss')await cheat(CartoonOverhaul,{scenario:'boss'});
  for(const d of devices){
   input.view(d.width,d.height,d.scale,d.insets as [number,number,number,number]);await step(1);
   // Sample the visible half of the real invincibility blink; parity is checked below.
   for(let tick=0;session.get().game!.Players[0]!.Invincible%12>=6&&tick<12;tick++)await step(1);
   const stats=render.stats({width:d.width,height:d.height});
   expect(stats.drawCalls).toBeLessThanOrEqual(14);
   const header=ui.rect('cartoon-hud.header')!,footer=ui.rect('cartoon-hud.footer')!;
   const inside=(r:Bounds,top=d.insets[1]!,bottom=d.height-d.insets[3]!)=>{
    expect(r.x>=d.insets[0]!-1&&r.x+r.width<=d.width-d.insets[2]!+1).toBe(true);
    expect(r.y>=top-1&&r.y+r.height<=bottom+1).toBe(true);
   };
   for(const id of ['header','footer','score-card','brand','roster-top','roster-bottom']){
    const rect=ui.rect(`cartoon-hud.${id}`)!;expect(!!rect&&rect.width>0&&rect.height>0).toBe(true);inside(rect);
   }
   expect(header.y>=d.insets[1]!-1).toBe(true);
   expect(footer.y+footer.height<=d.height-d.insets[3]!+1).toBe(true);
   const g=session.get().game!,layout=arenaLayout(g.Level,{width:d.width,height:d.height,safeArea:d.insets}),projection=cartoonProjection(g,layout);
   const playable=projectBounds({x:projection.projectX(48),y:projection.projectY(3*24),
    width:projection.projectX(1680)-projection.projectX(48),height:projection.projectY(22*24)-projection.projectY(3*24)},point=>input.worldToScreen(point));
   inside(playable,header.y+header.height,footer.y);
   let dragons=0,enemies=0,bosses=0,diamonds=0;
   const actorOrders:number[]=[],knockStarOrders:number[]=[];
   for(const entity of world.entities(Sprite)){
    const sprite=world.get(entity,Sprite);if(!sprite.visible)continue;
    const at=world.get(entity,VisualOffset),image=sprite.image??'';
    const rect={x:at.position[0]!-sprite.size[0]!/2,y:720-at.position[1]!-sprite.size[1]!/2,width:sprite.size[0]!,height:sprite.size[1]!};
    if(image.startsWith('cartoon/frames/')){
     const frame=image.slice('cartoon/frames/'.length),alpha=actorAlphaBounds(frame,rect,sprite.flipX);
     if(!alpha||!(/^(dragon|enemy|boss)\//.test(frame)))continue;
     const physical=projectBounds(alpha,point=>input.worldToScreen(point));
     if(physical.x<d.insets[0]!-1||physical.x+physical.width>d.width-d.insets[2]!+1||physical.y<header.y+header.height-1||physical.y+physical.height>footer.y+1)throw new Error(JSON.stringify({device:d.name,scenario,frame,physical,header,footer}));
     inside(physical,header.y+header.height,footer.y);
     if(frame.startsWith('dragon/')){dragons++;actorOrders.push(sprite.order);}if(frame.startsWith('enemy/'))enemies++;if(frame.startsWith('boss/'))bosses++;
    }
    if(image==='cartoon/white'&&Math.abs(at.rotation[2]!)>.1&&Math.abs(sprite.size[0]!-sprite.size[1]!)>=.02)knockStarOrders.push(sprite.order);
    if(image==='cartoon/white'&&Math.abs(at.rotation[2]!)>.1&&Math.abs(sprite.size[0]!-sprite.size[1]!)<.02){
     // Identity badges use squares; the tapered knock-star quads are decoration.
     // Compare each badge's actual 45-degree rotated AABB.
     const span=(rect.width+rect.height)/Math.SQRT2;
     const marker=projectBounds({x:at.position[0]!-span/2,y:720-at.position[1]!-span/2,width:span,height:span},point=>input.worldToScreen(point));
     if(marker.y<header.y+header.height-1||marker.y+marker.height>footer.y+1)throw new Error(JSON.stringify({device:d.name,scenario,marker,header,footer,root:ui.rect('cartoon-hud'),viewInfo:world.resource(ViewInfo),worldView:world.resource(WorldView),world:at.position}));
     inside(marker,header.y+header.height,footer.y);
     diamonds++;
    }
   }
   expect(dragons).toBe(10);expect(diamonds).toBe(20);
   expect(knockStarOrders.length).toBe(scenario==='crown_help'?6:0);
   for(const order of knockStarOrders)expect(order>Math.max(...actorOrders)).toBe(true);
   if(scenario==='boss')expect(bosses).toBe(1);else expect(enemies).toBeGreaterThan(0);
   let numbers=0,helps=0;
   for(const entity of world.entities(Text2D)){
    const text=world.get(entity,Text2D);if(!text.visible)continue;
    if(!/^([1-9]|10)$/.test(text.text)&&text.text!=='HELP!')continue;
    const at=world.get(entity,VisualOffset).position;
    inside(projectBounds({x:at[0]!-text.size/2,y:720-at[1]!-text.size/2,width:text.size,height:text.size},point=>input.worldToScreen(point)),header.y+header.height,footer.y);
    if(text.text==='HELP!')helps++;else{
     numbers++;
     expect(text.align).toBe('Center');
     const centered=world.entities(Sprite).some(marker=>{
      const sprite=world.get(marker,Sprite),offset=world.get(marker,VisualOffset);
      return sprite.visible&&sprite.image==='cartoon/white'&&Math.abs(offset.rotation[2]!)>.1&&Math.abs(offset.position[0]!-at[0]!)<.02&&Math.abs(offset.position[1]!-at[1]!)<.02;
     });
     expect(centered).toBe(true);
    }
   }
   expect(numbers).toBe(10);expect(helps).toBe(scenario==='crown_help'?1:0);
   render.expectScreenshot(`${scenario}_${d.name}`,{width:d.width,height:d.height});
  }
 }

 // Verify the native presentation frame obeys the same blink as its number text.
 for(const hidden of [true,false]){
  for(let tick=0;!!(session.get().game!.Players[0]!.Invincible%12>=6)!==hidden&&tick<12;tick++)await step(1);
  render.stats({width:1620,height:2160});
  const visibleDragons=world.entities(Sprite).filter(entity=>{const s=world.get(entity,Sprite);return s.visible&&(s.image??'').startsWith('cartoon/frames/dragon/');});
  const visibleNumbers=world.entities(Text2D).filter(entity=>{const t=world.get(entity,Text2D);return t.visible&&/^([1-9]|10)$/.test(t.text);});
  const visibleDiamonds=world.entities(Sprite).filter(entity=>{const s=world.get(entity,Sprite),v=world.get(entity,VisualOffset);return s.visible&&s.image==='cartoon/white'&&Math.abs(v.rotation[2]!)>.1&&Math.abs(s.size[0]!-s.size[1]!)<.02;});
  expect(visibleDragons.length).toBe(hidden?0:10);expect(visibleNumbers.length).toBe(hidden?0:10);expect(visibleDiamonds.length).toBe(hidden?0:20);
 }

},{scene:'scenes/cartoon.scene.json',memory:'phone-low'});
