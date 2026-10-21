import {expect, worldTest} from '@gameengine/test';
import atlas from '../assets/cartoon/atlas-layout.json';
import {cartoonSprites, type CartoonDraw} from '../src/cartoon/renderer';
import {isCartoonClearColor} from '../src/cartoon/theme';

const scene = 'scenes/arcade.scene.json';
const clip = {left:0,top:0,right:768,bottom:720};

worldTest('cartoon sprites retain complete geometry for shared stencil clipping', () => {
  const draw: CartoonDraw = {frame:'courtyard',x:-50,y:-25,width:200,height:100};
  const before = JSON.stringify(draw);
  const sprites = cartoonSprites([draw], {left:0,top:0,right:100,bottom:50});
  expect(sprites.length).toBe(1);
  expect(sprites[0]!.image).toBe('cartoon/courtyard');
  // Shrinking the full image would squash it into the clip. The stencil crops
  // while preserving the source geometry and the original texture sampling.
  expect([sprites[0]!.x,sprites[0]!.y,sprites[0]!.width,sprites[0]!.height]).toEqual([-50,-25,200,100]);
  expect(JSON.stringify(draw)).toBe(before);
}, {scene});

worldTest('cartoon sprites preserve mirrored frame bounds at the stencil edge', () => {
  const frame = (atlas.frames as Record<string,{x:number;y:number;w:number;h:number}>)['dragon/green/idle-0'];
  expect(frame).toBeDefined();
  expect(frame!.w).toBe(128);
  expect(frame!.h).toBe(128);
  const sprites = cartoonSprites([
    {frame:'dragon/green/idle-0',x:-32,y:20,width:128,height:128,flip:true},
  ],clip);
  expect(sprites.length).toBe(1);
  expect(sprites[0]!.image).toBe('cartoon/frames/dragon/green/idle-0');
  expect(sprites[0]!.flip).toBe(true);
  expect(sprites[0]!.x).toBe(-32);
  expect(sprites[0]!.width).toBe(128);
}, {scene});

worldTest('cartoon sprites retain fractional alpha and omit invisible draws', () => {
  const sprites = cartoonSprites([
    {frame:'solid/#ffffff',x:0,y:0,width:10,height:10,color:[.4,.5,.6,.25]},
    {frame:'courtyard',x:800,y:0,width:10,height:10},
    {frame:'courtyard',x:0,y:0,width:0,height:10},
    {frame:'not-a-frame',x:0,y:0,width:10,height:10},
  ],clip);
  expect(sprites.length).toBe(1);
  expect(sprites[0]!.image).toBe('cartoon/white');
  expect(sprites[0]!.color).toEqual([.4,.5,.6,.25]);
  expect(cartoonSprites([],clip).length).toBe(0);
}, {scene});

worldTest('cartoon sprites bound their draw list without silently dropping art', () => {
  const draws: CartoonDraw[] = Array.from({length:8193},()=>({frame:'solid/#ffffff',x:0,y:0,width:1,height:1}));
  expect(()=>cartoonSprites(draws,clip)).toThrow('cartoon presentation capacity exceeded');
  expect(cartoonSprites(draws.slice(0,8192),clip).length).toBe(8192);
}, {scene});

worldTest('cartoon scene marker accepts only the dedicated camera clear color', () => {
  const marker = [21/255,42/255,70/255,1];
  expect(isCartoonClearColor(marker)).toBe(true);
  const decoded = marker.map((v,i)=>i===3?v:v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
  expect(isCartoonClearColor(decoded)).toBe(true);
  expect(isCartoonClearColor([0,0,0,1,...marker],4)).toBe(true);
  expect(isCartoonClearColor([0,0,0,1])).toBe(false);
  expect(isCartoonClearColor([.1,.2,.3,1])).toBe(false);
  expect(isCartoonClearColor([21/255,42/255,71/255,1])).toBe(false);
  expect(isCartoonClearColor([21/255,42/255,70/255,0])).toBe(false);
}, {scene});
