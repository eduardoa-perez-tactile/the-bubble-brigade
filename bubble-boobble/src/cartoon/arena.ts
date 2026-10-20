import type {Cell, Level} from '../arcade/types';

export const cartoonColumns=60,cartoonRows=24;
export const cartoonTierRows=[3,8,13,18,23] as const;
const spawnCells:readonly Cell[]=[
  {col:4,row:23},{col:12,row:3},{col:46,row:3},{col:12,row:8},{col:46,row:8},
  {col:12,row:13},{col:30,row:13},{col:18,row:18},{col:52,row:18},{col:52,row:23},
];

/** Five authored tiers, with two shared ascent lanes and alternate cross-stage
 * routes. A tier rises 120px, below the unchanged 126px jump; broad overlaps let
 * players choose the next landing without threading a one-body-wide gap. */
export function createCartoonArena(source:Level):Level {
  const tiles=Array.from({length:cartoonRows},(_,row)=>Array.from({length:cartoonColumns},(_,col)=>
    col<2||col>=cartoonColumns-2||row===cartoonRows-1?1:0));
  const upper:readonly (readonly [number,number,number][])[]=[
    [[3,3,24],[3,30,56],[8,8,35],[8,42,56],[13,3,19],[13,25,49]],
    [[3,8,35],[3,44,56],[8,3,21],[8,27,50],[13,8,39],[13,46,56]],
    [[3,3,18],[3,26,47],[8,8,36],[8,44,56],[13,3,22],[13,28,56]],
    [[3,6,22],[3,28,56],[8,3,35],[8,43,56],[13,8,20],[13,27,51]],
  ];
  // Fixed lower shelves protect their authored spawn positions in every
  // layout. Columns 12 and 30 are supported on every tier in all four patterns.
  const shelves:readonly (readonly [number,number,number])[]=[
    ...upper[(source.number-1)%upper.length]!,[18,3,21],[18,25,44],[18,48,56],
  ];
  for(const [row,left,right] of shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
  const anchors:Cell[]=[];
  for(const [row,left,right] of shelves)for(let col=left;col<=right-1;col+=2)anchors.push({col,row});
  for(const col of [8,14,20,26,32,38,44,52])anchors.push({col,row:23});
  return {...source,arena:'cartoon-courtyard',tiles,
    enemies:source.enemies.map((enemy,i)=>({...enemy,...anchors[(i+source.number*3)%anchors.length]!})),player:{col:4,row:23},
    power_spawn:{col:30,row:18},food_spawn:{col:30,row:23}};
}

export function cartoonSpawn(index:number):Cell {
  const cell=spawnCells[index];
  if(!cell)throw new Error('Cartoon arena supports ten player slots');
  return {...cell};
}
