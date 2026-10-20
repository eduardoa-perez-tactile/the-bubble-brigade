import { arenaLayout } from '../arcade/arena-layout';
import { EnemyState, levelColumns, levelRows, type GameState, type Player } from '../arcade/types';
import { partyColors } from '../arcade/party-config';
import type { FeelState } from '../arcade/juice';
import { desktopSaveState } from '../desktop/save';
import sourceFrames from '../../data/sprites.json';
import animation from '../../assets/cartoon/animation.json';
import type { CartoonDraw } from './renderer';
import { partyCardRect } from '../desktop/layout';

type Clip = keyof typeof animation.clips;
const clips: Readonly<Record<Clip,{frames:readonly string[];durations:readonly number[];loop:boolean}>> = animation.clips;
const legacyFrames:Readonly<Record<string,readonly string[]>>=sourceFrames;

/** Clip clocks never control input, collision, firing, or authoritative state. */
export function clipFrame(clip:Clip, tick:number):string {
  const c=clips[clip], total=c.durations.reduce((sum,n)=>sum+n,0);
  let time=c.loop ? Math.max(0,tick)%total : Math.min(total-1,Math.max(0,tick));
  for(let i=0;i<c.frames.length;i++){if(time<c.durations[i]!)return c.frames[i]!;time-=c.durations[i]!;}
  return c.frames[c.frames.length-1]!;
}
export function playerClip(p:Player):Clip {
  if(p.Downed)return 'down';
  if(p.Dead>0)return p.Dead>72?'hurt':'down';
  if(p.Shoot>0)return 'shoot';
  if(!p.Ground)return 'jump';
  return Math.abs(p.VX)>.01?'run':'idle';
}
/** Feet stay fixed even when a drawing changes size, flips, or squashes. */
export function dragonDraw(p:Player,skin:string,tick:number):CartoonDraw {
  const clip=playerClip(p), squash=clip==='idle'?Math.sin(tick*Math.PI/90)*.012:0;
  const w=48*(1+squash),h=48*(1-squash);
  return {frame:`dragon/${skin}/${clipFrame(clip,clip==='run'?p.WalkFrame:tick)}`,
    x:p.X+22-w*.5,y:p.Y+44-h*120/128,width:w,height:h,flip:p.Dir<0};
}
function reference(name:string,tick:number):string {
  if(name.startsWith('boss/')){
    const pose=name.slice(5),n=pose==='move'||pose==='captured'?4:2;
    return `legacy/derived/boss/${pose}-${Math.floor(tick/10)%n}`;
  }
  const frames=legacyFrames[name];
  const path=frames?.[Math.floor(Math.max(0,tick)/10)%frames.length];
  return path?'legacy/reference/'+path.replace(/^sprites\//,'').replace(/\.png$/,''):'';
}
const rgba=(hex:string,alpha=1):readonly[number,number,number,number]=>[
  parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255,alpha];
const colors=['#81b94b','#468bc8','#ce6459','#e3b953','#a87fbd','#dc9351','#54b7bf','#d88eaa','#c5c6a5','#718297'];

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

/** Read-only lowering from the same authoritative state as the preserved pixel path. */
export function cartoonDrawPlan(g:GameState,tick:number,view?:{width:number;height:number;safeArea:ArrayLike<number>},feel?:FeelState):CartoonDraw[]{
  const layout=arenaLayout(g.Level,view),out:CartoonDraw[]=[];
  const add=(frame:string,x:number,y:number,width:number,height=width,flip=false,color?:CartoonDraw['color'])=>{
    if(!frame)return;
    out.push({frame,x:layout.x+x*layout.scale,y:layout.y+y*layout.scale,width:width*layout.scale,height:height*layout.scale,flip,color});
  };
  out.push({frame:'courtyard',x:layout.viewportLeft,y:layout.viewportTop,width:layout.viewportRight-layout.viewportLeft,height:layout.viewportBottom-layout.viewportTop});
  for(let row=0;row<levelRows(g.Level);row++)for(let col=0;col<levelColumns(g.Level);col++){
    if(!g.Level.tiles[row]?.[col])continue;
    add(row>0&&!g.Level.tiles[row-1]?.[col]?'platform':'wall',col*24,row*24,24);
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
    add(reference(item.Power==='thunder_potion'?'thunder-bubble':item.Power||`food/${item.Food}`,0),item.X,item.Y,32);
  }
  const entrance=(y:number,index:number)=>{
    if(g.Party?.Phase!=='prepare')return y;
    const t=Math.max(0,Math.min(1,(180-g.Party.Timer-index%6*5)/60));
    return -48+(y+48)*(1-(1-t)*(1-t));
  };
  const boss=g.Party?.Boss;
  if(boss){
    const pose=boss.Mode==='captured'?'captured':boss.Mode==='windup'?'attack':'move';
    if(boss.Mode==='captured'||!boss.Invulnerable||boss.Tick%4<2)add(reference('boss/'+pose,boss.Tick),boss.X,entrance(boss.Y,0),96,96,boss.Dir>0);
  }
  for(const spawn of g.Party?.Telegraphs??[])add('bubble',spawn.X,spawn.Y,44,44,false,rgba('#f3ba78'));
  for(let index=0;index<g.Enemies.length;index++){
    const e=g.Enemies[index]!;
    if(e.State===EnemyState.Trapped||e.State===EnemyState.Defeated&&e.DeadTicks===0)continue;
    const y=entrance(e.Y,index);
    if(e.Kind==='zenchan')add('imp/'+(e.State===EnemyState.Defeated?'captured-0':e.Angry?'warning-0':`walk-${Math.floor(e.Age/6)%2}`),e.X,y,48,48,e.Dir>0);
    else{
      let pose=e.Angry?'angry':'walk';
      if(e.Kind==='mighta'&&e.Shoot>0)pose=e.Angry?'shoot-angry':'shoot';
      if(e.State===EnemyState.Defeated||e.State===EnemyState.Carried)pose='dead';
      add(reference(e.Kind+'/'+pose,e.Age),e.X,y,48,48,e.Dir>0);
    }
  }
  for(const b of g.Bubbles){
    if(b.Age>450&&!b.EnemyID&&!b.Element&&b.Age%12<3)continue;
    const color=b.CapturedAge>1000?'#f6b36a':b.Element==='fire'?'#f5ad79':b.Element==='thunder'?'#ffdf80':b.Element==='water'?'#80d6ef':'#ffffff';
    if(b.EnemyID){
      const e=g.Enemies.find(e=>e.ID===b.EnemyID);
      if(e?.Kind==='zenchan'){
        const escaping=b.CapturedAge>1200;
        const rock=escaping?Math.sin(b.Age*.8)*2:0;
        add('imp/'+(escaping?'escape-0':b.CapturedAge>1000?'warning-0':'captured-0'),b.X+6+rock,b.Y+5,32,32,escaping&&b.Age%12<6);
      }
      else if(e)add(reference(e.Kind+'/'+(b.CapturedAge>1200?'escape':b.CapturedAge>1000?'warning':'bubble'),b.Age),b.X+4,b.Y+4,36);
    }
    add('bubble',b.X,b.Y,44,44,false,rgba(color));
    if(b.Shooter!==undefined)add('badge/'+skin(b.Shooter),b.X+31,b.Y+31,10);
    if(b.Element)add(reference(b.Element+'-bubble',b.Age),b.X+13,b.Y+13,18);
  }
  for(const p of g.Projectiles)add(reference(p.Bottle?'boss/bottle':p.Laser?'laser':'boulder',p.Age),p.X,p.Y,p.Laser?16:24,p.Laser?28:24);
  for(const effect of g.Effects)add(reference(effect.Element==='fire'&&effect.Ground?'flame':effect.Element,effect.Age),effect.X,effect.Y,40,32,effect.Dir>0);
  for(let index=0;index<g.Players.length;index++){
    const p=g.Players[index]!;
    if(p.Lives===0&&p.Dead===0)continue;
    const grace=!!g.Party&&['combat','boss'].includes(g.Party.Phase)&&g.LevelTicks<120;
    if(!p.Downed&&!grace&&p.Invincible&&p.Invincible%12>=6)continue;
    const draw=dragonDraw(p,skin(index),tick);
    add(draw.frame,draw.x,draw.y,draw.width,draw.height,draw.flip);
    if(g.Party||g.Players.length>1){
      const badgeSize=Math.min(13/layout.scale,19);
      add('badge/'+skin(index),p.X+22-badgeSize/2,p.Y-14,badgeSize);
    }
    if(p.Downed)add('bubble',p.X-5,p.Y-7,54,54,false,rgba(colors[index%10]!, .8));
  }
  for(const p of g.Particles)if(!p.Text){const size=20+Math.max(0,12-p.Life)*1.8;add('pop',p.X+22-size/2,p.Y+22-size/2,size,size,false,[1,1,1,Math.min(1,p.Life/8)]);}
  for(const cue of feel?.cues??[]){
    const age=feel!.clock-cue.at;
    if(cue.kind==='rescue'&&age<24)add('pop',cue.x-26-age*.3,cue.y-48-26-age*.3,52+age*.6,52+age*.6,false,[.6,1,.8,1-age/24]);
  }
  out.push({frame:'solid/#263b42',x:0,y:0,width:768,height:48});
  out.push({frame:'solid/#263b42',x:0,y:672,width:768,height:48});
  for(let i=0;i<g.Players.length;i++){
    const x=g.Party?12+i%5*152:i===0?20:126,y=g.Party?675+Math.floor(i/5)*22:680;
    if(g.Players[i]!.Lives>0)out.push({frame:`dragon/${skin(i)}/idle-0`,x,y,width:g.Party?20:28,height:g.Party?20:28});
  }
  return out;
}
