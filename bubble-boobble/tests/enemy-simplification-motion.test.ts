import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createGame} from '../src/arcade/game';
import {EnemyState,type Enemy} from '../src/arcade/types';
import {simplifiedEnemyDraws,simplifiedEnemyState} from '../src/cartoon/enemy-motion';
import {emptyFeel} from '../src/arcade/juice';

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
    expect(simplifiedEnemyDraws(e,8,80)[0]!.color).toBe(undefined);
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

worldTest('enemy juice landing holds a planted squash rebounds and settles without replaying old contacts',()=>{
  for(const kind of kinds){
    const e=enemy(kind),feel=emptyFeel();
    feel.cues=[{kind:'enemy-land',slot:e.ID,x:e.X+24,y:e.Y+92,at:100},
      {kind:'enemy-land',slot:e.ID+1,x:0,y:0,at:110}];
    const baseline=simplifiedEnemyDraws(e,0,80)[0]!;
    const sample=(age:number)=>{
      feel.clock=100+age;
      const before=JSON.stringify({e,feel}),draw=simplifiedEnemyDraws(e,0,80,false,feel)[0]!;
      near(draw.y+draw.height*120/128,e.Y+44);
      expect(simplifiedEnemyDraws(e,300,80,false,feel)).toEqual([draw]);
      expect(JSON.stringify({e,feel})).toBe(before);
      return draw;
    };
    const impact=sample(0),held=sample(3),rebound=sample(8);
    expect(impact.width>=100).toBe(true);expect(impact.height<=64).toBe(true);
    near(held.width,impact.width);near(held.height,impact.height);
    expect(rebound.width<baseline.width).toBe(true);expect(rebound.height>baseline.height).toBe(true);
    expect(sample(20)).toEqual(baseline);expect(sample(60)).toEqual(baseline);
    feel.clock=100;
    expect(simplifiedEnemyDraws(e,0,80,true,feel)[0]!.height).toBe(80);
    e.Ground=false;e.VY=-7;
    const takeoff=sample(0);
    expect(takeoff.height>96).toBe(true);
    e.VY=0;expect(sample(0).height).toBe(80);
    e.VY=5;expect(sample(0).height>80).toBe(true);
  }
});
