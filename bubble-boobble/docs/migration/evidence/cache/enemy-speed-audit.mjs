import {isDeepStrictEqual} from 'node:util';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from '../.gameengine/engine/node_modules/esbuild/lib/main.js';
await build({stdin:{contents:"export * from './src/arcade/game.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:'.cache/enemy-speed-port.mjs'});
const {createGame,stepGame,canonicalState}=await import('./enemy-speed-port.mjs');
const levels=JSON.parse(readFileSync('data/levels.json','utf8'));
const idle={Move:0,Jump:false,Fire:false};
const summary=[];
for(let round=1;round<=5;round++){
 const scenario={name:'enemy-speed-audit',round,seed:42,players:1,spans:[{ticks:360,players:[idle],paused:false}]};
 const result=spawnSync(resolve('.cache/port-oracle'),[],{cwd:'.cache/reference',input:JSON.stringify(scenario),encoding:'utf8',maxBuffer:64*1024*1024});
 if(result.status!==0)throw new Error(result.stderr);
 const frames=JSON.parse(result.stdout),g=createGame(levels.slice(round-1),42,1);
 const sample=[];
 for(let i=0;i<frames.length;i++){
  if(i)stepGame(g,[idle]);
  const expected=frames[i].state,actual=canonicalState(g);
  if(!isDeepStrictEqual(JSON.parse(JSON.stringify(actual)),expected))throw new Error(`round${round} frame${i} differs`);
  if([0,60,61,120,360].includes(i))sample.push({frame:i,State:g.State,LevelTicks:g.LevelTicks,enemies:g.Enemies.map(e=>({Kind:e.Kind,X:e.X,Y:e.Y,Dir:e.Dir,Age:e.Age,Angry:e.Angry}))});
 }
 summary.push({round,frames:frames.length,samples:sample});
}
writeFileSync('artifacts/enemy-speed-audit.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary.map(r=>({round:r.round,frames:r.frames,firstStep:r.samples[2].enemies})),null,2));
