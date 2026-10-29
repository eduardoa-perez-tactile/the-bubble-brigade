import {expect,worldTest} from '@gameengine/test';
import campaign from '../data/levels.json';
import {createPartyGame} from '../src/arcade/party';
import {EnemyState} from '../src/arcade/types';
import {cartoonDefeatedEnemyDraws} from '../src/cartoon/enemy-defeat';
import {cartoonDrawTransform,cartoonSprites} from '../src/cartoon/renderer';

const scene='scenes/cartoon.scene.json';

worldTest('enemy juice defeat spin stays centered on painted art and follows launch direction',()=>{
 const g=createPartyGame(campaign,42,Array.from({length:6},()=> 'human' as const),10,'cartoon'),e=g.Enemies[0]!;
 Object.assign(e,{Kind:'mighta',X:100,Y:200,State:EnemyState.Defeated,DeadTicks:25,VX:6,Dir:1});
 const before=JSON.stringify(g);
 const draw=cartoonDefeatedEnemyDraws(e,'enemy/mighta/simple-captured','enemy/mighta/simple-dead',84)[0]!;
 expect(draw.rotation).toBe(Math.PI);
 const transform=cartoonDrawTransform(draw),pivot=draw.pivot!;
 // After a half turn, the padded canvas center lies across the painted pivot.
 const rootX=e.X+22,rootY=e.Y+22;
 expect(Math.abs(transform.centerX-rootX-(pivot[0]-.5)*draw.width)).toBeLessThanOrEqual(.001);
 expect(Math.abs(transform.centerY-rootY-(pivot[1]-.5)*draw.height)).toBeLessThanOrEqual(.001);
 e.VX=-6;
 expect(cartoonDefeatedEnemyDraws(e,'enemy/mighta/simple-captured','enemy/mighta/simple-dead',84)[0]!.rotation).toBe(-Math.PI);
 e.VX=6;
 const reduced=cartoonDefeatedEnemyDraws(e,'enemy/mighta/simple-captured','enemy/mighta/simple-dead',84,true)[0]!;
 expect(reduced.rotation).toBe(0);expect(reduced.width).toBe(draw.width);
 expect(JSON.stringify(g)).toBe(before);
},{scene});

worldTest('enemy juice spinning sprite culling retains a rotated corner intersecting the playfield',()=>{
 const draw={frame:'enemy/mighta/simple-dead',x:-25,y:10,width:20,height:80,rotation:Math.PI/4};
 // The original canvas is outside the left edge; the rotated right corner is visible.
 expect(draw.x+draw.width<0).toBe(true);
 const sprites=cartoonSprites([draw],{left:0,top:0,right:100,bottom:100});
 expect(sprites.length).toBe(1);expect(sprites[0]!.rotation).toBe(Math.PI/4);
 expect(cartoonSprites([{...draw,x:-100}],{left:0,top:0,right:100,bottom:100}).length).toBe(0);
},{scene});
