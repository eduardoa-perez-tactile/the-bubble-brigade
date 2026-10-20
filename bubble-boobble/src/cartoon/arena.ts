import type {Cell, Level} from '../arcade/types';

export const cartoonColumns=72,cartoonRows=24;
export const cartoonTierRows=[3,8,13,18,23] as const;
const spawnCells:readonly Cell[]=[
  {col:4,row:23},{col:12,row:3},{col:60,row:3},{col:20,row:8},{col:50,row:8},
  {col:10,row:13},{col:64,row:13},{col:22,row:18},{col:54,row:18},{col:62,row:23},
];

/** Five authored tiers, with two shared ascent lanes and alternate cross-stage
 * routes. A tier rises 120px, below the unchanged 126px jump; broad overlaps let
 * players choose the next landing without threading a one-body-wide gap. */
export function createCartoonArena(source:Level):Level {
  const tiles=Array.from({length:cartoonRows},(_,row)=>Array.from({length:cartoonColumns},(_,col)=>
    col<2||col>=cartoonColumns-2||row===cartoonRows-1?1:0));
  const upper:readonly (readonly [number,number,number][])[]=[
    [[3,2,38],[3,43,69],[8,2,14],[8,18,30],[8,35,55],[8,60,69],[13,2,12],[13,16,26],[13,31,45],[13,50,59],[13,63,69]],
    [[3,2,34],[3,39,69],[8,2,15],[8,19,29],[8,34,53],[8,58,69],[13,2,12],[13,17,27],[13,32,45],[13,49,59],[13,63,69]],
    [[3,2,37],[3,42,69],[8,2,13],[8,18,29],[8,34,54],[8,59,69],[13,2,12],[13,16,27],[13,32,45],[13,49,59],[13,63,69]],
    [[3,2,35],[3,40,69],[8,2,14],[8,18,31],[8,36,54],[8,59,69],[13,2,12],[13,17,27],[13,32,46],[13,50,59],[13,63,69]],
  ];
  // Two crown sections, four then five sections on the middle tiers, three below.
  // Columns10/50 provide full ascent lanes; the wide lower gap has an upper detour.
  const shelves:readonly (readonly [number,number,number])[]=[
    ...upper[(source.number-1)%upper.length]!,[18,2,12],[18,18,34],[18,44,69],
  ];
  for(const [row,left,right] of shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
  const anchors:Cell[]=[];
  for(const [row,left,right] of shelves)for(let col=left;col<=right-1;col+=2)anchors.push({col,row});
  for(const col of [8,16,24,32,40,48,56,64])anchors.push({col,row:23});
  return {...source,arena:'cartoon-courtyard',tiles,
    enemies:source.enemies.map((enemy,i)=>({...enemy,...anchors[(i+source.number*3)%anchors.length]!})),player:{col:4,row:23},
    power_spawn:{col:30,row:18},food_spawn:{col:36,row:23}};
}

export function cartoonSpawn(index:number):Cell {
  const cell=spawnCells[index];
  if(!cell)throw new Error('Cartoon arena supports ten player slots');
  return {...cell};
}
