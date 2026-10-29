import {adventureArrivalY} from '../adventure/spawning';
import {simplifiedEnemyDraws,cartoonEnemyTint} from './enemy-motion';
import {cartoonEnemyProjectileDraws,cartoonEnemyAttackDraws,cartoonEnemyImpactDraws} from './enemy-projectiles';
import {cartoonCaptiveEnemyDraw,cartoonDefeatedEnemyDraws} from './enemy-defeat';
import {CARTOON_PICKUP_SIZE,cartoonPopSize} from './reward-feedback';
import {cartoonBackgroundDraws} from './background';
import {storyRoomBoundaryDraws,storyRoomHasReferenceFloor} from './room-boundaries';
import {storyRoomBackgroundGround} from './room-boundary-config';
import {cartoonHudBounds} from './hud-layout';
import {cartoonBubbleState} from './bubble-state';
import {cartoonBubbleShape,cartoonFeedback} from './feedback';
import {cartoonDragonFeedback,cartoonDragonShadow,cartoonGroundDust,cartoonBossFeedback} from './actor-feedback';
import { cartoonProjection } from './projection';
import { cartoonTierRows } from './arena';
import { arenaLayout } from '../arcade/arena-layout';
import { CARTOON_PLAYER_SIZE,CARTOON_ENEMY_SIZE,CARTOON_BUBBLE_SIZE,CARTOON_CAPTURED_ENEMY_SIZE,CARTOON_BOSS_SIZE,CARTOON_PLATFORM_HEIGHT,CARTOON_PLATFORM_SPAN,cartoonBadgeAnchor,cartoonPlayerVisible } from './actor-layout';
import { cartoonHelpAnchors } from './help-layout';
import { State, EnemyState, levelColumns, levelRows, type GameState, type Player, type Level } from '../arcade/types';
import { partyColors } from '../arcade/party-config';
import type { FeelState } from '../arcade/juice';
import { desktopSaveState } from '../desktop/save';
import animation from '../../assets/cartoon/animation.json';
import type { CartoonDraw, DragonMotion } from './renderer';
import { partyCardRect } from '../desktop/layout';

type Clip = keyof typeof animation.clips;
const clips: Readonly<Record<Clip,{frames:readonly string[];durations:readonly number[];loop:boolean}>> = animation.clips;

/** Clip clocks never control input, collision, firing, or authoritative state. */
export function clipFrame(clip:Clip, tick:number):string {
  const c=clips[clip], total=c.durations.reduce((sum,n)=>sum+n,0);
  let time=c.loop ? Math.max(0,tick)%total : Math.min(total-1,Math.max(0,tick));
  for(let i=0;i<c.frames.length;i++){if(time<c.durations[i]!)return c.frames[i]!;time-=c.durations[i]!;}
  return c.frames[c.frames.length-1]!;
}
export function playerClip(p:Player,moving?:boolean):Clip {
  if(p.Downed)return 'down';
  if(p.Dead>0)return p.Dead>72?'hurt':'down';
  if(p.Shoot>0)return 'shoot';
  if(!p.Ground)return 'jump';
  return (moving??Math.abs(p.VX)>.01)?'run':'idle';
}
/** Feet stay fixed even when a drawing changes size, flips, or squashes. */
export function dragonDraw(p:Player,skin:string,tick:number,moving?:boolean|DragonMotion,size=64,reduced=false):CartoonDraw {
  const motion=typeof moving==='object'?moving:undefined;
  const clip=playerClip(p,motion?motion.moving:moving as boolean|undefined);
  // Walking has drawn weight transfer; an extra scale pulse fights those poses.
  const squash=clip==='idle'&&!reduced?Math.sin(tick*Math.PI/90)*.012:0;
  const w=size*(1+squash),h=size*(1-squash);
  const clock=clip==='run'?(motion?motion.phase*clips.run.durations.reduce((sum,n)=>sum+n,0):p.WalkFrame):clip==='shoot'?12-p.Shoot:clip==='hurt'?90-p.Dead:
    clip==='jump'?((motion?.falling??p.VY>0)?clips.jump.durations[0]!:0):tick;
  return {frame:`dragon/${skin}/${clipFrame(clip,clock)}`,
    x:p.X+22-w*.5,y:p.Y+44-h*120/128,width:w,height:h,flip:p.Dir<0};
}
/** Bespoke crouched legs attach to registered release/recovery torsos. The source
 * coordinates are retained exactly, including the first-tick shot muzzle.
 * Stationary shooting still plays all six original whole-body pictures. */
export function dragonDraws(p:Player,skin:string,tick:number,motion?:boolean|DragonMotion,size=64,reduced=false):CartoonDraw[]{
  const full=dragonDraw(p,skin,tick,motion,size,reduced);
  const moving=typeof motion==='object'?motion.moving:motion??Math.abs(p.VX)>.01;
  if(p.Downed||p.Dead>0||p.Shoot<=0||p.Ground&&!moving)return [full];
  const state=typeof motion==='object'?motion:undefined;
  const total=clips.run.durations.reduce((sum,n)=>sum+n,0);
  // The crouched shooting gait is a separate eight-drawing clip. Keep its
  // distance phase when the upright gait gains additional in-between art.
  const phase=state?state.phase:(Math.max(0,p.WalkFrame)%total)/total;
  const run=Math.min(7,Math.floor(phase*8));
  const air=(state?.falling??p.VY>0)?1:0;
  // A fixed seam at source row 96 never changes size or jumps with a pose.
  return [
    {...full,frame:`dragon/${skin}/shoot-upper-${Math.min(2,Math.floor((12-p.Shoot)/4))}`,height:size*96/128},
    {...full,frame:`dragon/${skin}/${p.Ground?`shoot-walk-lower-${run}`:`shoot-air-lower-${air}`}`,
      y:full.y+size*96/128,height:size*32/128},
  ];
}
/** Every supported family has original cartoon masters; no pixel aliases escape here. */
const simplifiedKinds=['zenchan','mighta','banebou','invader'];
export function cartoonEnemyFrame(kind:string,state:string,tick:number):string {
  if(simplifiedKinds.includes(kind)){
    const pose=state==='bubble'?'captured':state==='warning'||state==='escape'?'captured':
      state==='walk'?`travel-${Math.floor(Math.max(0,tick)/8)%2}`:state==='shoot-angry'?'shoot':state;
    return `enemy/${kind}/simple-${pose}`;
  }
  const clip=(animation.enemies as Record<string,{frames:number;ticksPerFrame:number}>)[kind];
  const pose=(state==='walk'||state==='angry')&&clip
    ?`walk-${Math.floor(Math.max(0,tick)/clip.ticksPerFrame)%clip.frames}`
    :state==='bubble'?'captured-0':state==='shoot-angry'?'shoot-0':`${state}-0`;
  return `enemy/${kind}/${pose}`;
}
const effectFrame=(element:string,tick:number)=>`effect/${element}-${element==='fire'?Math.floor(Math.max(0,tick)/6)%2:0}`;
const itemFrame=(power:string|undefined,food:number)=>power?`item/${power}`:`item/food-${food}`;
const rgba=(hex:string,alpha=1):readonly[number,number,number,number]=>[
  parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255,alpha];
const colors=['#81b94b','#468bc8','#ce6459','#e3b953','#a87fbd','#dc9351','#54b7bf','#d88eaa','#c5c6a5','#718297'];
const referenceSpans:readonly (readonly (readonly [number,number])[])[]=[[[24,982],[1066,1643]],[[24,347],[417,699],[801,1382],[1450,1643]],[[24,272],[302,545],[608,945],[1009,1303],[1397,1643]],[[26,304],[402,754],[980,1643]],[[24,1644]]];


export function cartoonMenuDrawPlan(screen:string,tick:number,selected:number):CartoonDraw[]{
  const out:CartoonDraw[]=[{frame:'courtyard',x:0,y:0,width:768,height:720},
    {frame:'solid/#172b34',x:0,y:0,width:768,height:720,color:[1,1,1,.68]}];
  if(screen==='party'){
    for(let i=0;i<10;i++){
      const r=partyCardRect(i);
      out.push({frame:`dragon/${partyColors[i]}/${clipFrame(i===selected&&tick%180<35?'run':'idle',tick)}`,x:r.x+(r.width-88)/2,y:r.y+46,width:88,height:88});
    }
  }else{
    for(let i=0;i<10;i++)out.push({frame:`dragon/${partyColors[i]}/idle-0`,x:31+i*70,y:572,width:76,height:76});
    for(let i=0;i<7;i++)out.push({frame:'bubble',x:17+i*119,y:320+(i%3)*38,width:18+(i%3)*4,height:18+(i%3)*4,color:[1,1,1,.3]});
  }
  return out;
}

/** The editor keeps its authored cell hit targets while previewing the new art. */
export function cartoonEditorDrawPlan(level:Level,tick:number,avatar:string):CartoonDraw[]{
  const out:CartoonDraw[]=[{frame:'solid/#273c45',x:0,y:0,width:768,height:720},
    {frame:'courtyard',x:24,y:146,width:512,height:416}];
  for(let row=0;row<levelRows(level);row++)for(let col=0;col<levelColumns(level);col++){
    if(level.tiles[row]?.[col])out.push({frame:row>0&&!level.tiles[row-1]?.[col]?'platform-middle':'wall',x:24+col*16,y:146+row*16,width:16,height:16});
    else out.push({frame:'solid/#34515a',x:24+col*16,y:146+row*16,width:16,height:1,color:[1,1,1,.3]});
  }
  const actor=(cell:{col:number;row:number},frame:string,size=40)=>out.push({frame,x:24+cell.col*16+44/3-size/2,y:146+cell.row*16-size*120/128,width:size,height:size});
  actor(level.player,`dragon/${avatar}/${clipFrame('idle',tick)}`,64*2/3);
  for(const enemy of level.enemies)actor(enemy,cartoonEnemyFrame(enemy.kind,'walk',tick),56*2/3);
  actor(level.food_spawn,'item/food-1',24);actor(level.power_spawn,'item/pink_candy',24);
  return out;
}

/** Read-only lowering from the same authoritative state as the preserved pixel path. */
export function cartoonDrawPlan(g:GameState,tick:number,view?:{width:number;height:number;safeArea:ArrayLike<number>},feel?:FeelState,motion?:readonly (boolean|DragonMotion)[],reduced=false):CartoonDraw[]{
  const baseLayout=arenaLayout(g.Level,view),composed=g.Level.arena==='cartoon-courtyard';
  const projection=composed?cartoonProjection(g,baseLayout):undefined;
  const layout={...baseLayout,...(projection?{scale:projection.scale,projectX:projection.projectX,inverseX:projection.inverseX,projectY:projection.projectY,inverseY:projection.inverseY}: {})};
  const out:CartoonDraw[]=[],markers:CartoonDraw[]=[];
  const helps=cartoonHelpAnchors(g,{...layout,footerTop:view?cartoonHudBounds(view).bottom:672});
  const px=(x:number)=>projection?projection.projectX(x):layout.x+x*layout.scale;
  const py=(y:number)=>projection?projection.projectY(y):layout.y+y*layout.scale;
  const add=(frame:string,x:number,y:number,width:number,height=width,flip=false,color?:CartoonDraw['color'])=>{
    if(!frame)return;
    out.push({frame,x:px(x),y:py(y),width:width*layout.scale,height:height*layout.scale,flip,color});
  };
  const marker=(frame:string,x:number,y:number,width:number,height=width,diamond=false)=>markers.push({frame,x:px(x),y:py(y),width:width*layout.scale,height:height*layout.scale,diamond});
  const centered=(frame:string,x:number,y:number,size:number,flip=false,color?:CartoonDraw['color'],offsetY=0)=>out.push({frame,x:px(x)-size*layout.scale/2,y:py(y)+(offsetY-size/2)*layout.scale,width:size*layout.scale,height:size*layout.scale,flip,color});
  const actor=(frame:string,x:number,feet:number,size:number,flip=false)=>{
    out.push({frame,x:px(x),y:py(feet)-size*layout.scale*120/128,width:size*layout.scale,height:size*layout.scale,flip});
  };
  const viewportWidth=layout.viewportRight-layout.viewportLeft,viewportHeight=layout.viewportBottom-layout.viewportTop;
  let plateWidth=g.Level.episode?Math.max(viewportWidth,viewportHeight*16/9):viewportWidth;
  let plateHeight=g.Level.episode?Math.max(viewportHeight,viewportWidth*9/16):viewportHeight;
  let plateY=layout.viewportTop+(viewportHeight-plateHeight)/2;
  const groundRegistration=composed?storyRoomBackgroundGround(g.Level):undefined;
  if(groundRegistration){
    // Each painting registers its own foreground ground/deck edge. Cover both
    // sides of that anchor without moving the collision floor or actors.
    const floorFeet=(levelRows(g.Level)-1)*24;
    const ground=py(floorFeet)+groundRegistration.offsetWorld*layout.scale;
    const ratio=groundRegistration.sourceRatio;
    plateHeight=Math.max(viewportHeight,viewportWidth*9/16,
      (ground-layout.viewportTop)/ratio,(layout.viewportBottom-ground)/(1-ratio));
    plateWidth=plateHeight*16/9;
    plateY=ground-ratio*plateHeight;
  }
  out.push({frame:g.Level.episode?`episode/${g.Level.episode.theme}`:composed?'environment/courtyard-plate':'courtyard',x:layout.viewportLeft+(viewportWidth-plateWidth)/2,y:plateY,width:plateWidth,height:plateHeight,
    ...(composed&&!g.Level.episode?{backgroundTick:reduced?0:Math.max(0,tick),backgroundMotion:!reduced}:{})});
  if(composed&&!g.Level.episode)out.push(...cartoonBackgroundDraws(tick,{x:layout.viewportLeft,y:layout.viewportTop,
    width:layout.viewportRight-layout.viewportLeft,height:layout.viewportBottom-layout.viewportTop},reduced));
  if(composed&&g.Level.episode)out.push(...storyRoomBoundaryDraws(g.Level,{
    scale:layout.scale,projectX:px,projectY:py,viewportTop:layout.viewportTop,
  }));
  const columns=levelColumns(g.Level);
  const capHeight=composed?CARTOON_PLATFORM_HEIGHT:24,capSpan=composed?CARTOON_PLATFORM_SPAN:48;

  if(!composed)for(let row=0;row<levelRows(g.Level);row++)for(let col=0;col<columns;){
    if(!g.Level.tiles[row]?.[col]){col++;continue;}
    if(row===0||g.Level.tiles[row-1]?.[col]){add('wall',col*24,row*24,24);col++;continue;}
    let end=col+1;
    while(end<levelColumns(g.Level)&&g.Level.tiles[row]?.[end]&&!g.Level.tiles[row-1]?.[end])end++;
    const width=(end-col)*24;
    if(width===24)add('platform-middle',col*24,row*24,24,capHeight);
    else{
      add('platform-left',col*24,row*24,24,capHeight);
      for(let x=col*24+24;x<end*24-24;x+=capSpan)add('platform-middle',x,row*24,Math.min(capSpan,end*24-24-x),capHeight);
      add('platform-right',end*24-24,row*24,24,capHeight);
    }
    col=end;
  }
  if(composed&&!g.Level.episode){
    // Exact painted endpoints are a small overhang over the retained tile
    // collision spans; the reference comparison reports both independently.
    const factor=1728/1672;
    for(let tier=0;tier<cartoonTierRows.length;tier++)for(const [left,right] of referenceSpans[tier]!){
      const x=left*factor,end=right*factor,y=cartoonTierRows[tier]!*24;
      const h=20/(1280/1728);
      const module=256/93*h,edge=96/93*h;
      if(tier!==4){
        add('environment/platform-underside',x,y,end-x,14/(1280/1728));
        const under=out[out.length-1]!;under.y=py(y)+h*layout.scale;
        if(end-x>120){
          for(const cx of [x+edge,end-edge-28]){
            add(cx===x+edge?'environment/platform-corbel-left':'environment/platform-corbel-right',cx,y,28,32);
            out[out.length-1]!.y=py(y)+(h+8)*layout.scale;
          }
        }
      }
      add('environment/platform-cap-end-left',x,y,edge,h);
      for(let at=x+edge;at<end-edge;at+=module)add('environment/platform-cap-repeat',at,y,Math.min(module,end-edge-at),h);
      add('environment/platform-cap-end-right',end-edge,y,edge,h);
    }
  }
  if(g.Level.episode){
    // Platform faces derive from the very same authored tiles used for collision.
    const referenceFloor=storyRoomHasReferenceFloor(g.Level);
    for(let row=1;row<g.Level.tiles.length;row++){
      if(referenceFloor&&row===g.Level.tiles.length-1)continue;
      for(let col=2;col<columns-2;){
        if(!g.Level.tiles[row]![col]||g.Level.tiles[row-1]![col]){col++;continue;}
        let end=col+1;while(end<columns-2&&g.Level.tiles[row]![end]&&!g.Level.tiles[row-1]![end])end++;
        const x=col*24,y=row*24,width=(end-col)*24,h=20/(1280/1728),edge=Math.min(32,width/3);
        add('environment/platform-underside',x,y,width,14);const under=out[out.length-1]!;under.y=py(y)+h*layout.scale;
        add('environment/platform-cap-end-left',x,y,edge,h);
        for(let at=x+edge;at<x+width-edge;at+=92)add('environment/platform-cap-repeat',at,y,Math.min(92,x+width-edge-at),h);
        add('environment/platform-cap-end-right',x+width-edge,y,edge,h);col=end;
      }
    }
  }
  const save=desktopSaveState.get(),avatar=save.profiles[save.active]?.avatar??'green';
  const skin=(index:number)=>g.Party?partyColors[index%partyColors.length]!:index===1?'blue':avatar;
  for(const p of g.Players){
    const shadow=cartoonDragonShadow(g,p);
    if(shadow)add(shadow.frame,shadow.x,shadow.y,shadow.width,shadow.height,false,shadow.color);
  }
  for(const item of g.Items){
    if(item.Power!=='thunder_potion'&&item.Age>600&&item.Age%12<6)continue;
    const size=composed?CARTOON_PICKUP_SIZE:48;
    if(item.Power){
      const cx=px(item.X+16),cy=py(item.Y+16),u=layout.scale;
      const pulse=reduced?1:1+.08*Math.sin(tick*.12);
      // A ground glimmer and rising sparks read as magic without a bubble shell.
      out.push({frame:'shadow',x:cx-38*u*pulse,y:py(item.Y+32)-5*u,width:76*u*pulse,height:12*u,color:[1,.78,.3,.85]});
      if(!reduced)for(let i=0;i<3;i++){
        const age=(tick+i*20)%60,x=cx+(i-1)*28*u,y=cy+(12-age*.8)*u;
        markers.push({frame:'solid/#ffe08a',x:x-3*u,y:y-3*u,width:6*u,height:6*u,diamond:true,color:[1,1,1,1-age/60]});
      }
      markers.push({frame:'solid/#231e27',x:cx-18*u,y:cy-70*u,width:36*u,height:28*u,diamond:true},
        {frame:'solid/#ffe08a',x:cx-14*u,y:cy-66*u,width:28*u,height:20*u,diamond:true});
      centered(item.Power==='thunder_potion'?'effect/thunder-0':'effect/spark-0',item.X+16,item.Y-39,28);
    }
    // Uniform art scaling retains source proportions and the original pickup's
    // center/floor registration. Its 32-unit collection footprint never moves.
    out.push({frame:itemFrame(item.Power,item.Food),x:px(item.X+16)-size*layout.scale/2,
      y:py(item.Y+32)-size*layout.scale,width:size*layout.scale,height:size*layout.scale});
  }
  const entrance=(y:number,index:number)=>{
    if(g.Party?.Phase!=='prepare')return y;
    const t=Math.max(0,Math.min(1,(180-g.Party.Timer-index%6*5)/60));
    return -48+(y+48)*(1-(1-t)*(1-t));
  };
  const boss=g.Party?.Boss;
  if(boss&&boss.Mode!=='defeated'){
    const angry=boss.HP*3<=boss.MaxHP;
    const released=g.Projectiles.some(p=>p.Bottle&&!p.Removed&&p.Age<10);
    const frame=boss.Mode==='captured'?'captured':boss.Mode==='windup'?(angry?'angry-windup':'windup'):
      released?'release':boss.Invulnerable?'hit':angry?'angry':`move-${reduced||g.Freeze>0?0:Math.floor(boss.Tick/8)%2}`;
    if(boss.Mode==='captured'||!boss.Invulnerable||boss.Tick%4<2){
      const size=composed?CARTOON_BOSS_SIZE:144;
      actor(`boss/simple-${frame}`,
        boss.X+48-size/2,entrance(boss.Y,0)+96,size,boss.Dir<0);
      const draw=cartoonBossFeedback(out.pop()!,boss,feel,reduced);
      // A large airborne silhouette needs room above its root at arena edges.
      // Fit the art inside the playfield without changing the board framing.
      const bands=cartoonHudBounds(view??{width:768,height:720,safeArea:[0,0,0,0]});
      draw.x=Math.max(layout.viewportLeft+8,Math.min(layout.viewportRight-8-draw.width,draw.x));
      draw.y=Math.max(bands.top+8,Math.min(bands.bottom-draw.height,draw.y));
      if(boss.Mode==='captured')out.push({frame:'bubble',x:draw.x-8*layout.scale,y:draw.y-8*layout.scale,
        width:draw.width+16*layout.scale,height:draw.height+16*layout.scale,color:[.65,.9,1,1]});
      out.push(draw);
      if(boss.Mode==='windup'){
        // Solid amber/ink warning remains legible with reduced effects enabled.
        const size=38*layout.scale,cx=draw.x+draw.width*.5;
        const cy=Math.max(bands.top+size*.6,draw.y-size*.6);
        markers.push({frame:'solid/#3c2929',x:cx-size*.6,y:cy-size*.6,width:size*1.2,height:size*1.2,diamond:true},
          {frame:'solid/#f6b64e',x:cx-size*.5,y:cy-size*.5,width:size,height:size,diamond:true},
          {frame:'solid/#3c2929',x:cx-size*.07,y:cy-size*.28,width:size*.14,height:size*.36},
          {frame:'solid/#3c2929',x:cx-size*.07,y:cy+size*.16,width:size*.14,height:size*.14});
      }
    }
  }
  const spawnWarning=(spawn:{X:number;Y:number;Ticks:number})=>{
    const pulse=reduced?1:1+.12*Math.sin(spawn.Ticks*.2),u=layout.scale;
    const cx=px(spawn.X+22),feet=py(spawn.Y+44);
    out.push({frame:'shadow',x:cx-48*u*pulse,y:feet-5*u,width:96*u*pulse,height:10*u,color:[1,.85,.4,.8]});
    const y=feet-64*u;
    markers.push({frame:'solid/#231e27',x:cx-16*u,y:y-22*u,width:32*u,height:32*u,diamond:true},
      {frame:'solid/#ffe08a',x:cx-12*u,y:y-18*u,width:24*u,height:24*u,diamond:true},
      {frame:'solid/#231e27',x:cx-2*u,y:y-14*u,width:4*u,height:10*u},
      {frame:'solid/#231e27',x:cx-2*u,y:y,width:4*u,height:4*u});
  };
  for(const spawn of g.Party?.Telegraphs??[]){
    if(!spawn.Kind||spawn.Ticks<=60)spawnWarning(spawn);
  }
  for(let index=0;index<g.Enemies.length;index++){
    const e=g.Enemies[index]!;
    if(e.State===EnemyState.Trapped||e.State===EnemyState.Defeated&&e.DeadTicks===0)continue;
    const y=e.State===EnemyState.Spawning?adventureArrivalY(e):entrance(e.Y,index);
    let pose=e.Angry?'angry':'walk';
    if(e.Kind==='mighta'&&e.Shoot>0)pose='shoot';
    if(e.State===EnemyState.Defeated||e.State===EnemyState.Carried)pose='dead';
    const size=composed?CARTOON_ENEMY_SIZE:56;
    const flyer=e.Kind==='monsta'||e.Kind==='pulpul';
    const clock=g.Party?.Phase==='prepare'&&flyer?tick+index*3:e.Age;
    if(composed&&e.State===EnemyState.Defeated){
      const rootX=e.X+22,rootY=y+22;
      for(const draw of cartoonDefeatedEnemyDraws(e,cartoonEnemyFrame(e.Kind,'bubble',clock),cartoonEnemyFrame(e.Kind,'dead',clock),CARTOON_CAPTURED_ENEMY_SIZE,reduced)){
        out.push({...draw,x:px(rootX)+(draw.x-(e.X+22))*layout.scale,
          y:py(rootY)+(draw.y-(e.Y+22))*layout.scale,
          width:draw.width*layout.scale,height:draw.height*layout.scale});
      }
    }else if(simplifiedKinds.includes(e.Kind)){
      for(const draw of simplifiedEnemyDraws(e,clock,size,reduced,feel)){
        out.push({...draw,x:px(draw.x),y:py(y+44)+(draw.y-(e.Y+44))*layout.scale,
          width:draw.width*layout.scale,height:draw.height*layout.scale});
      }
    }else{
      actor(cartoonEnemyFrame(e.Kind,pose,clock),e.X+22-size/2,y+44,size,e.Dir<0);
      const draw=out[out.length-1]!;
      draw.color=cartoonEnemyTint(e,reduced);
      if(flyer&&!reduced&&e.State===EnemyState.Active){draw.rotation=e.Dir*e.Vertical*.08;draw.pivot=[.5,.5];}
    }
  }
  for(const effect of g.Effects){
    if(effect.Element==='enemy-impact')continue;
    if(effect.Element==='thunder'){
      // Use the same authored lightning drawing as the charged bubble. Keep
      // its square canvas and center it on the swept collision body.
      centered('effect/thunder-0',effect.X+20,effect.Y+16,80,effect.Dir<0);
    }else add(effectFrame(effect.Element==='fire'&&effect.Ground?'flame':effect.Element,effect.Age),effect.X,effect.Y,40,32,effect.Dir<0);
  }
  const bubblePaints=g.Bubbles.map(b=>{
    const color=colors[partyColors.findIndex(c=>c===skin(b.Shooter??0))]??colors[0]!;
    const t=b.EnemyID||b.Shooter===undefined?1:Math.max(0,Math.min(1,b.Age/16));
    const growth=.18+.82*t*t*(3-2*t),diameter=(composed?CARTOON_BUBBLE_SIZE:44)*growth;
    let bounceAge=Infinity;
    for(const cue of feel?.cues??[])if(cue.kind==='bubble-bounce'&&cue.slot===b.ID)bounceAge=feel!.clock-cue.at;
    return {b,color,growth,diameter,state:cartoonBubbleState(b,!!g.Party,color,reduced),shape:cartoonBubbleShape(b,diameter,reduced,bounceAge),
      foreground:b.Shooter!==undefined&&!b.EnemyID&&!b.Floating&&b.Age<=6};
  });
  const drawBubbles=(foreground:boolean)=>{
    // Paint every surface first, then contents, then ink. A neighboring surface
    // must not wash color over another captive when bubbles overlap.
    for(const part of ['body','captive','rim','shine'] as const)for(const paint of bubblePaints){
      if(paint.foreground!==foreground)continue;
      const {b,color,growth,diameter,shape,state}=paint;
      if(part==='body'){
        out.push({frame:'bubble-body',x:px(shape.x)-shape.width*layout.scale/2,y:py(shape.y)+(shape.offsetY-shape.height/2)*layout.scale,width:shape.width*layout.scale,height:shape.height*layout.scale,color:rgba(color,state.bodyAlpha)});
      }else if(part==='captive'&&b.EnemyID){
        const e=g.Enemies.find(e=>e.ID===b.EnemyID);
        if(e){
          // The warning/escape assets are angry running poses, not captive poses.
          // Keep the folded silhouette; danger belongs to the surrounding ink.
          if(composed){
            const rootX=shape.x+state.captiveOffset,rootY=shape.y;
            const draw=cartoonCaptiveEnemyDraw(cartoonEnemyFrame(e.Kind,'bubble',b.Age),rootX,rootY,CARTOON_CAPTURED_ENEMY_SIZE);
            // The painted center stays on the bubble's logical root while its
            // shell squashes around the fixed top. Source padding cannot push
            // captives through the shell or make them jump on release.
            out.push({...draw,x:px(rootX)+(draw.x-rootX)*layout.scale,
              y:py(rootY)+(draw.y-rootY)*layout.scale,
              width:draw.width*layout.scale,height:draw.height*layout.scale});
          }else add(cartoonEnemyFrame(e.Kind,'bubble',b.Age),b.X+4+state.captiveOffset,b.Y+3,36,36);
        }
      }else if(part==='shine'){
        // Neutral white reflections sit above the colored meniscus. Keeping
        // them untinted preserves contrast for every owner and danger stage.
        out.push({frame:'bubble-shine',x:px(shape.x)-shape.width*layout.scale/2,y:py(shape.y)+(shape.offsetY-shape.height/2)*layout.scale,width:shape.width*layout.scale,height:shape.height*layout.scale,color:[1,1,1,1]});
      }else if(part==='rim'){
        out.push({frame:'bubble',x:px(shape.x)-shape.width*layout.scale/2,y:py(shape.y)+(shape.offsetY-shape.height/2)*layout.scale,width:shape.width*layout.scale,height:shape.height*layout.scale,color:rgba(state.rim,state.rimAlpha)});
        if(b.Shooter!==undefined)centered('badge/'+skin(b.Shooter),shape.x+diameter*9/44,shape.y+diameter*9/44,10*growth,false,undefined,shape.offsetY);
        if(b.Element){
          const lightning=b.Element==='thunder';
          centered(effectFrame(b.Element,b.Age),shape.x,shape.y,(lightning?54:18)*growth,false,undefined,shape.offsetY);
          if(lightning)out[out.length-1]!.color=[1,.87,.25,1];
        }
      }
    }
  };
  // Mature and trapped bubbles belong behind the character silhouette. Only
  // the small fresh release crosses the muzzle in front of the dragon.
  drawBubbles(false);
  for(let index=0;index<g.Players.length;index++){
    const p=g.Players[index]!;
    if(!cartoonPlayerVisible(p,g.Party?.Phase,g.LevelTicks,!!g.Party))continue;
    const help=helps.get(index);
    // Respawn bodies have not resolved Ground during the ready countdown.
    // Show an idle pose until the first physics step, without changing that body
    // or confusing a real jump's zero-velocity apex holds with a grounded state.
    const spawning=!g.Party&&(g.State===State.Ready||g.State===State.Playing&&g.LevelTicks===0)
      &&!p.Ground&&p.VY===0&&p.JumpStep===undefined&&!p.Shoot&&!p.Dead&&!p.Downed;
    const celebrating=boss?.Mode==='defeated';
    const hop=celebrating&&!reduced?Math.max(0,Math.sin((boss.Timer-index*6)*Math.PI/36))*24:0;
    const pose=celebrating?{...p,Downed:false,Dead:0,Shoot:0,Ground:hop===0,VX:0,VY:-1,Y:p.Y-hop}:spawning?{...p,Ground:true,VX:0}:p;
    for(const draw of cartoonDragonFeedback(dragonDraws(pose,skin(index),tick,spawning?false:motion?.[index],composed?CARTOON_PLAYER_SIZE:64,reduced),pose,index,feel,reduced)){
      // Cropped layers retain their source offset from one common feet root.
      // Reanchoring each crop by its own height would separate torso and legs.
      if(projection)out.push({...draw,x:px(draw.x),y:py(p.Y+44)+(draw.y-(p.Y+44))*layout.scale,width:draw.width*layout.scale,height:draw.height*layout.scale});
      else add(draw.frame,draw.x,draw.y,draw.width,draw.height,draw.flip);
    }
    if(g.Party||g.Players.length>1){
      const badge=cartoonBadgeAnchor(p,layout,help);
      const color=colors[partyColors.findIndex(c=>c===skin(index))]??colors[index%10]!;
      marker('solid/#172124',badge.x,badge.y,badge.size,badge.size,true);
      marker('solid/'+color,badge.x+1.5/layout.scale,badge.y+1.5/layout.scale,badge.size-3/layout.scale,badge.size-3/layout.scale,true);
    }
    if(p.Downed){
      // Three small stars orbit over the knocked-out dragon until rescued.
      const feet=py(p.Y+44),head=help?py(help.y)-20*layout.scale:feet-70*layout.scale;
      for(let star=0;star<3;star++){
        const phase=(reduced?0:tick*Math.PI/30)+star*Math.PI*2/3;
        const size=(20+(reduced?0:3*Math.sin(phase)))*layout.scale;
        const x=(help?px(help.x+30):px(p.X+22))+Math.cos(phase)*32*layout.scale,y=head+Math.sin(phase)*6*layout.scale;
        // Two tapered diamonds form a readable four-point sparkle without another texture.
        markers.push({frame:'solid/#ffe08a',x:x-size/2,y:y-size/6,width:size,height:size/3,diamond:true},
          {frame:'solid/#ffe08a',x:x-size/6,y:y-size/2,width:size/3,height:size,diamond:true});
      }
    }
  }
  // Dust crowns cross the shoes briefly; drawing them behind the whole dragon
  // hides most of the takeoff/landing contact burst.
  for(const dust of cartoonGroundDust(feel,reduced)){
    add(dust.frame,dust.x,dust.y,dust.width,dust.height,!!dust.flip,dust.color);
    out[out.length-1]!.y=py(dust.groundY)+(dust.y-dust.groundY)*layout.scale;
  }
  drawBubbles(true);
  // Essential threats sit above actors and shells. Project each center first,
  // then preserve the art's uniform envelope across platform projection knots.
  const threat=(d:CartoonDraw)=>out.push({...d,
    x:px(d.x+d.width/2)-d.width*layout.scale/2,
    y:py(d.y+d.height/2)-d.height*layout.scale/2,
    width:d.width*layout.scale,height:d.height*layout.scale});
  for(const e of g.Enemies)for(const d of cartoonEnemyAttackDraws(e,reduced))threat(d);
  for(const p of g.Projectiles)for(const d of cartoonEnemyProjectileDraws(p,reduced))threat(d);
  for(const e of g.Effects)for(const d of cartoonEnemyImpactDraws(e,reduced))threat(d);
  const feedback=cartoonFeedback(g,feel,reduced);
  for(const d of feedback.sprites){
    add(d.frame,d.x,d.y,d.width,d.height,!!d.flip,d.color);
    // Effect envelopes are uniform about the projected center, including when
    // a large pop crosses one of the authored platform projection knots.
    out[out.length-1]!.y=py(d.y+d.height/2)-d.height*layout.scale/2;
  }
  // Dragon fireballs cross the actors and bubbles so a crowded party cannot hide
  // the fan. Center art on the existing 16px projectile body, with a short
  // cream/coral wake; reduced mode retains the large, steady fireball alone.
  for(const p of g.Projectiles)if(p.Bottle&&!p.Removed){
    const cx=px(p.X+8),cy=py(p.Y+8),unit=layout.scale;
    if(!reduced)for(const [lag,size,color]of [[3,13,'#ed6555'],[5,8,'#fff0c9']] as const){
      const x=px(p.X+8-p.VX*lag),y=py(p.Y+8-p.VY*lag);
      markers.push({frame:'solid/'+color,x:x-size*unit/2,y:y-size*unit/2,width:size*unit,height:size*unit,diamond:true});
    }
    out.push({frame:`boss/fireball-${reduced?0:Math.floor(p.Age/4)%4}`,x:cx-(p.VX<0?20:108)*unit,y:cy-32*unit,width:128*unit,height:64*unit,flip:p.VX<0});

  }
  if(boss?.Mode==='defeated'&&!reduced){
    for(let i=0;i<32;i++){
      const age=(boss.Timer+i*7)%90,angle=i*2.39996;
      const radius=age*2.6,cx=px(boss.X+48),cy=py(boss.Y+48);
      markers.push({frame:'solid/'+['#ffe08a','#75dcca','#ed6555'][i%3],x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius+age*age*.02,width:7*layout.scale,height:12*layout.scale,diamond:true});
    }
  }
  // Keep all existing-white marker/plaque quads adjacent after actor images.
  out.push(...markers);
  for(const d of feedback.accents){add(d.frame,d.x,d.y,d.width,d.height,!!d.flip,d.color);if(d.diamond)out[out.length-1]!.diamond=true;}
  for(const p of g.Particles.filter(p=>!p.Text).slice(-18)){
    const size=cartoonPopSize(p.Life);
    centered('pop',p.X+22,p.Y+22,size,false,[1,1,1,Math.min(1,p.Life/6)]);
  }
  return out;
}
