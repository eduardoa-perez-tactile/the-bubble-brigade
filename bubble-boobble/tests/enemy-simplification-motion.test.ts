import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {EnemyState,type Enemy} from '../src/arcade/types';
import {simplifiedEnemyDraws,simplifiedEnemyState} from '../src/cartoon/enemy-motion';

const kinds=['zenchan','mighta','banebou','invader'];
const enemy=(Kind:string):Enemy=>({...createGame(campaign,42).Enemies[0]!,Kind,
  X:143.25,Y:277.5,Ground:true,VY:0,Shoot:0,Angry:false,Dir:1,State:EnemyState.Active});
const near=(a:number,b:number)=>expect(Math.abs(a-b)<.00001).toBe(true);

worldTest('simplified enemies prioritize capture defeat and release poses over active motion',()=>{
  for(const kind of kinds){
    const e=enemy(kind);
    Object.assign(e,{Shoot:12,Angry:true,Ground:false,VY:-7});
    for(const [State,pose] of [[EnemyState.Trapped,'captured'],[EnemyState.Defeated,'dead'],[EnemyState.Carried,'dead']] as const){
      e.State=State;
      expect(simplifiedEnemyState(e,9)).toBe(pose);
      expect(simplifiedEnemyDraws(e,9,80)[0]!.frame).toBe(`enemy/${kind}/simple-${pose}`);
    }
    e.State=EnemyState.Active;
    expect(simplifiedEnemyState(e,9)).toBe(kind==='mighta'||kind==='invader'?'shoot':'air');
  }
});

worldTest('simplified hopper compression follows support and airborne stretch follows actual velocity',()=>{
  const e=enemy('banebou');
  for(const tick of [0,8,16,24,100])expect(simplifiedEnemyState(e,tick)).toBe('compress');
  const compressed=simplifiedEnemyDraws(e,0,80)[0]!;
  expect(compressed.height<80).toBe(true);
  e.Ground=false;e.VY=-7;
  const rising=simplifiedEnemyDraws(e,0,80)[0]!;
  e.VY=0;const apex=simplifiedEnemyDraws(e,0,80)[0]!;
  e.VY=5;const falling=simplifiedEnemyDraws(e,0,80)[0]!;
  expect(rising.frame).toBe('enemy/banebou/simple-air');
  expect(rising.height>falling.height&&falling.height>apex.height).toBe(true);
  e.Ground=true;
  expect(simplifiedEnemyDraws(e,100,80)[0]!.frame).toBe('enemy/banebou/simple-compress');
});

worldTest('enemy juice simplified rollers follow distance and retain a travelling angry pose',()=>{
  for(const kind of ['zenchan','mighta','invader']){
    const e=enemy(kind);e.X=0;const a=simplifiedEnemyDraws(e,0,80)[0]!;
    expect(simplifiedEnemyDraws(e,200,80)[0]).toEqual(a);
    e.X=kind==='invader'?10:16;const b=simplifiedEnemyDraws(e,8,80)[0]!;
    expect(a.frame).toBe(`enemy/${kind}/simple-travel-0`);
    expect(b.frame).toBe(`enemy/${kind}/simple-travel-1`);
    near(a.y+a.height*120/128,e.Y+44);near(b.y+b.height*120/128,e.Y+44);
    e.Ground=false;e.VY=3;
    expect(simplifiedEnemyState(e,8)).toBe('air');
    e.Ground=true;e.Angry=true;
    expect(simplifiedEnemyState(e,8)).toBe('travel-1');
    expect(simplifiedEnemyDraws(e,8,80)[0]!.color![1]<.5).toBe(true);
  }
});

worldTest('simplified enemy draws preserve feet facing and read-only frozen output in every state',()=>{
  for(const kind of kinds)for(const Dir of [-1,1]){
    const e=enemy(kind);e.Dir=Dir;
    for(const patch of [{},{Ground:false,VY:-5},{Ground:false,VY:4},{Angry:true},
      {Shoot:12},{State:EnemyState.Trapped},{State:EnemyState.Carried},{State:EnemyState.Defeated}]){
      const posed={...e,...patch},before=JSON.stringify(posed);
      const draws=simplifiedEnemyDraws(posed,8,97.25);
      expect(draws.length).toBe(1);
      const d=draws[0]!;
      expect(Math.abs(d.x+d.width/2-posed.X-22)<=7).toBe(true);near(d.y+d.height*120/128,posed.Y+44);
      expect(d.flip).toBe(Dir<0);
      expect(simplifiedEnemyDraws(posed,8,97.25)).toEqual(draws);
      expect(JSON.stringify(posed)).toBe(before);
      const reduced=simplifiedEnemyDraws(posed,8,97.25,true)[0]!;
      expect(reduced.width).toBe(97.25);expect(reduced.height).toBe(97.25);
      expect(simplifiedEnemyDraws(posed,300,97.25,true)).toEqual([reduced]);
    }
  }
});
