import { cartoonProjection } from './projection';
import { cartoonTierRows } from './arena';
import { arenaLayout } from '../arcade/arena-layout';
import { CARTOON_PLAYER_SIZE,CARTOON_ENEMY_SIZE,CARTOON_BUBBLE_SIZE,CARTOON_CAPTURED_ENEMY_SIZE,CARTOON_BOSS_SIZE,CARTOON_PLATFORM_HEIGHT,CARTOON_PLATFORM_SPAN,cartoonBadgeAnchor,cartoonPlayerVisible } from './actor-layout';
import { cartoonHelpAnchor } from './help-layout';
import { EnemyState, levelColumns, levelRows, type GameState, type Player, type Level } from '../arcade/types';
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
export function dragonDraw(p:Player,skin:string,tick:number,moving?:boolean|DragonMotion,size=64):CartoonDraw {
  const motion=typeof moving==='object'?moving:undefined;
  const clip=playerClip(p,motion?motion.moving:moving as boolean|undefined);
  // Walking has drawn weight transfer; an extra scale pulse fights those poses.
  const squash=clip==='idle'?Math.sin(tick*Math.PI/90)*.012:0;
  const w=size*(1+squash),h=size*(1-squash);
  const clock=clip==='run'?(motion?motion.phase*clips.run.durations.reduce((sum,n)=>sum+n,0):p.WalkFrame):clip==='shoot'?12-p.Shoot:clip==='hurt'?90-p.Dead:
    clip==='jump'?((motion?.falling??p.VY>0)?clips.jump.durations[0]!:0):tick;
  return {frame:`dragon/${skin}/${clipFrame(clip,clock)}`,
    x:p.X+22-w*.5,y:p.Y+44-h*120/128,width:w,height:h,flip:p.Dir<0};
}
/** Bespoke crouched legs attach to registered release/recovery torsos. The source
 * coordinates are retained exactly, including the first-tick shot muzzle.
 * Stationary shooting still plays all six original whole-body pictures. */
export function dragonDraws(p:Player,skin:string,tick:number,motion?:boolean|DragonMotion,size=64):CartoonDraw[]{
  const full=dragonDraw(p,skin,tick,motion,size);
  const moving=typeof motion==='object'?motion.moving:motion??Math.abs(p.VX)>.01;
  if(p.Downed||p.Dead>0||p.Shoot<=0||p.Ground&&!moving)return [full];
  const state=typeof motion==='object'?motion:undefined;
  const total=clips.run.durations.reduce((sum,n)=>sum+n,0);
  const run=clipFrame('run',state?state.phase*total:p.WalkFrame).replace('run-','');
  const air=(state?.falling??p.VY>0)?1:0;
  // A fixed seam at source row 96 never changes size or jumps with a pose.
  return [
    {...full,frame:`dragon/${skin}/shoot-upper-${Math.min(2,Math.floor((12-p.Shoot)/4))}`,height:size*96/128},
    {...full,frame:`dragon/${skin}/${p.Ground?`shoot-walk-lower-${run}`:`shoot-air-lower-${air}`}`,
      y:full.y+size*96/128,height:size*32/128},
  ];
}
/** Every supported family has original cartoon masters; no pixel aliases escape here. */
export function cartoonEnemyFrame(kind:string,state:string,tick:number):string {
  const clip=(animation.enemies as Record<string,{frames:number;ticksPerFrame:number}>)[kind];
  const pose=(state==='walk'||state==='angry')&&clip
    ?`walk-${Math.floor(Math.max(0,tick)/clip.ticksPerFrame)%clip.frames}`
    :state==='bubble'?'captured-0':state==='shoot-angry'?'shoot-0':`${state}-0`;
  return `enemy/${kind}/${pose}`;
}
/** Native spring articulation: rigid body and planted feet, only coils stretch. */
export function hopperDraws(x:number,feet:number,size:number,tick:number,flip=false,angry=false):CartoonDraw[]{
  const unit=size/128,phase=Math.max(0,tick)%32,pose=Math.floor(phase/16);
  const spring=(16+4*Math.sin(phase*Math.PI/16))*unit,footTop=feet-16*unit;
  const common={x:x-size/2,width:size,flip,color:angry?[1,.76,.68,1] as const:undefined};
  return [
    {...common,frame:`enemy/banebou/body-${pose}`,y:footTop-spring-88*unit,height:88*unit},
    {...common,frame:`enemy/banebou/spring-${pose}`,y:footTop-spring,height:spring},
    {...common,frame:`enemy/banebou/feet-${pose}`,y:footTop,height:24*unit},
  ];
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
export function cartoonDrawPlan(g:GameState,tick:number,view?:{width:number;height:number;safeArea:ArrayLike<number>},feel?:FeelState,motion?:readonly (boolean|DragonMotion)[]):CartoonDraw[]{
  const baseLayout=arenaLayout(g.Level,view),composed=g.Level.arena==='cartoon-courtyard';
  const projection=composed?cartoonProjection(g,baseLayout):undefined;
  const layout={...baseLayout,...(projection?{scale:projection.scale,projectY:projection.projectY,inverseY:projection.inverseY}: {})};
  const out:CartoonDraw[]=[],markers:CartoonDraw[]=[];
  const px=(x:number)=>projection?projection.projectX(x):layout.x+x*layout.scale;
  const py=(y:number)=>projection?projection.projectY(y):layout.y+y*layout.scale;
  const add=(frame:string,x:number,y:number,width:number,height=width,flip=false,color?:CartoonDraw['color'])=>{
    if(!frame)return;
    out.push({frame,x:px(x),y:py(y),width:width*layout.scale,height:height*layout.scale,flip,color});
  };
  const marker=(frame:string,x:number,y:number,width:number,height=width,diamond=false)=>markers.push({frame,x:px(x),y:py(y),width:width*layout.scale,height:height*layout.scale,diamond});
  const centered=(frame:string,x:number,y:number,size:number,flip=false,color?:CartoonDraw['color'])=>out.push({frame,x:px(x)-size*layout.scale/2,y:py(y)-size*layout.scale/2,width:size*layout.scale,height:size*layout.scale,flip,color});
  const actor=(frame:string,x:number,feet:number,size:number,flip=false)=>{
    out.push({frame,x:px(x),y:py(feet)-size*layout.scale*120/128,width:size*layout.scale,height:size*layout.scale,flip});
  };
  out.push({frame:composed?'environment/courtyard-plate':'courtyard',x:layout.viewportLeft,y:layout.viewportTop,width:layout.viewportRight-layout.viewportLeft,height:layout.viewportBottom-layout.viewportTop});
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
  if(composed){
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
  const save=desktopSaveState.get(),avatar=save.profiles[save.active]?.avatar??'green';
  const skin=(index:number)=>g.Party?partyColors[index%partyColors.length]!:index===1?'blue':avatar;
  for(const p of g.Players)if(p.Lives>0&&!p.Downed){
    for(let row=Math.max(0,Math.ceil((p.Y+44)/24));row<levelRows(g.Level);row++){
      if(row*24-p.Y>180)break;
      if(g.Level.tiles[row]?.[Math.floor((p.X+22)/24)]){add('shadow',p.X+5,row*24-5,34,10);break;}
    }
  }
  for(const item of g.Items){
    if(item.Power!=='thunder_potion'&&item.Age>600&&item.Age%12<6)continue;
    if(composed)out.push({frame:itemFrame(item.Power,item.Food),x:px(item.X),y:py(item.Y+32)-32*layout.scale,width:32*layout.scale,height:32*layout.scale});
    else add(itemFrame(item.Power,item.Food),item.X,item.Y,32);
  }
  const entrance=(y:number,index:number)=>{
    if(g.Party?.Phase!=='prepare')return y;
    const t=Math.max(0,Math.min(1,(180-g.Party.Timer-index%6*5)/60));
    return -48+(y+48)*(1-(1-t)*(1-t));
  };
  const boss=g.Party?.Boss;
  if(boss){
    const pose=boss.Mode==='captured'?'captured':boss.Mode==='windup'?'attack':'move';
    if(boss.Mode==='captured'||!boss.Invulnerable||boss.Tick%4<2)actor(`boss/${pose==='move'?`move-${Math.floor(boss.Tick/8)%2}`:pose+'-0'}`,boss.X+48-(composed?CARTOON_BOSS_SIZE:112)/2,composed?entrance(boss.Y,0)+96:entrance(boss.Y,0)-16+112*120/128,composed?CARTOON_BOSS_SIZE:112,boss.Dir<0);
  }
  for(const spawn of g.Party?.Telegraphs??[])add('bubble',spawn.X,spawn.Y,44,44,false,rgba('#f3ba78'));
  for(let index=0;index<g.Enemies.length;index++){
    const e=g.Enemies[index]!;
    if(e.State===EnemyState.Trapped||e.State===EnemyState.Defeated&&e.DeadTicks===0)continue;
    const y=entrance(e.Y,index);
    let pose=e.Angry?'angry':'walk';
    if(e.Kind==='mighta'&&e.Shoot>0)pose='shoot';
    if(e.State===EnemyState.Defeated||e.State===EnemyState.Carried)pose='dead';
    const size=composed?CARTOON_ENEMY_SIZE:56;
    const flyer=e.Kind==='monsta'||e.Kind==='pulpul'||e.Kind==='invader';
    const clock=g.Party?.Phase==='prepare'&&flyer?tick+index*3:e.Age;
    if(e.Kind==='banebou'&&(pose==='walk'||pose==='angry')){
      out.push(...hopperDraws(px(e.X+22),py(y+44),size*layout.scale,clock,e.Dir<0,e.Angry));
    }else{
      actor(cartoonEnemyFrame(e.Kind,pose,clock),e.X+22-size/2,y+44,size,e.Dir<0);
      if(pose==='angry')out[out.length-1]!.color=[1,.76,.68,1];
    }
  }
  for(const b of g.Bubbles){
    if(b.Age>450&&!b.EnemyID&&!b.Element&&b.Age%12<3)continue;
    const color=colors[partyColors.findIndex(c=>c===skin(b.Shooter??0))]??colors[0]!;
    if(b.EnemyID){
      const e=g.Enemies.find(e=>e.ID===b.EnemyID);
      if(e){
        const state=b.CapturedAge>1200?'escape':b.CapturedAge>1000?'warning':'bubble';
        const rock=state==='escape'?Math.sin(b.Age*.8)*2:0;
        if(composed)centered(cartoonEnemyFrame(e.Kind,state,b.Age),b.X+22+rock,b.Y+22,CARTOON_CAPTURED_ENEMY_SIZE,state==='escape'&&b.Age%12<6);
        else add(cartoonEnemyFrame(e.Kind,state,b.Age),b.X+4+rock,b.Y+3,36,36,state==='escape'&&b.Age%12<6);
      }
    }
    if(composed)centered('bubble',b.X+22,b.Y+22,CARTOON_BUBBLE_SIZE,false,rgba(color));
    else add('bubble',b.X,b.Y,44,44,false,rgba(color));
    if(b.Shooter!==undefined)add('badge/'+skin(b.Shooter),b.X+31,b.Y+31,10);
    if(b.Element)add(effectFrame(b.Element,b.Age),b.X+13,b.Y+13,18);
  }
  for(const p of g.Projectiles)add(p.Bottle?'boss/bottle-0':effectFrame(p.Laser?'laser':'boulder',p.Age),p.X,p.Y,p.Laser?16:24,p.Laser?28:24);
  for(const effect of g.Effects)add(effectFrame(effect.Element==='fire'&&effect.Ground?'flame':effect.Element,effect.Age),effect.X,effect.Y,40,32,effect.Dir<0);
  for(let index=0;index<g.Players.length;index++){
    const p=g.Players[index]!;
    if(!cartoonPlayerVisible(p,g.Party?.Phase,g.LevelTicks,!!g.Party))continue;
    const help=p.Downed?cartoonHelpAnchor(p,layout):undefined;
    if(help){
      marker('solid/#3c3630',help.x-1,help.y-1,62,26);
      marker('solid/#fff0c9',help.x,help.y,60,24);
      marker('solid/#fff0c9',help.x+25,help.y+24,10,5);
    }
    for(const draw of dragonDraws(p,skin(index),tick,motion?.[index],composed?CARTOON_PLAYER_SIZE:64)){
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
        const phase=tick*Math.PI/30+star*Math.PI*2/3;
        const size=(20+3*Math.sin(phase))*layout.scale;
        const x=px(p.X+22)+Math.cos(phase)*32*layout.scale,y=head+Math.sin(phase)*6*layout.scale;
        // Two tapered diamonds form a readable four-point sparkle without another texture.
        out.push({frame:'solid/#ffe08a',x:x-size/2,y:y-size/6,width:size,height:size/3,diamond:true},
          {frame:'solid/#ffe08a',x:x-size/6,y:y-size/2,width:size/3,height:size,diamond:true});
      }
    }
  }
  // Keep all existing-white marker/plaque quads adjacent after actor images.
  out.push(...markers);
  for(const p of g.Particles)if(!p.Text){const size=20+Math.max(0,12-p.Life)*1.8;add('pop',p.X+22-size/2,p.Y+22-size/2,size,size,false,[1,1,1,Math.min(1,p.Life/8)]);}
  for(const cue of feel?.cues??[]){
    const age=feel!.clock-cue.at;
    if(cue.kind==='rescue'&&age<24)add('pop',cue.x-26-age*.3,cue.y-48-26-age*.3,52+age*.6,52+age*.6,false,[.6,1,.8,1-age/24]);
  }
  return out;
}
