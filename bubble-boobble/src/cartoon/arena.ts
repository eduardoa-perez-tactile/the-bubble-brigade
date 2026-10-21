import type {Cell, Level} from '../arcade/types';

export const cartoonColumns=72,cartoonRows=23;
export const cartoonTierRows=[3,8,13,18,22] as const;
const spawnCells:readonly Cell[]=[
  {col:4,row:22},{col:12,row:3},{col:60,row:3},{col:20,row:8},{col:50,row:8},
  {col:10,row:13},{col:64,row:13},{col:22,row:18},{col:54,row:18},{col:62,row:22},
];

/** Five authored tiers, with two shared ascent lanes and alternate cross-stage
 * routes. A tier rises 120px, below the unchanged 126px jump; broad overlaps let
 * players choose the next landing without threading a one-body-wide gap. */
export function createCartoonArena(source:Level):Level {
  const tiles=Array.from({length:cartoonRows},(_,row)=>Array.from({length:cartoonColumns},(_,col)=>
    col<2||col>=cartoonColumns-2||row===cartoonRows-1?1:0));
  // Nearest tile-supported spans to the measured concept silhouettes. The
  // painted caps retain their exact fractional endpoints independently.
  const shelves:readonly (readonly [number,number,number])[]=[
    [3,1,41],[3,46,70],
    [8,1,14],[8,18,29],[8,34,59],[8,62,70],
    [13,1,11],[13,13,22],[13,26,40],[13,43,55],[13,60,70],
    [18,1,12],[18,17,32],[18,42,70],
  ];
  for(const [row,left,right] of shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
  const anchors:Cell[]=[];
  for(const [row,left,right] of shelves)for(let col=Math.max(2,left);col<=Math.min(cartoonColumns-4,right-1);col+=2)anchors.push({col,row});
  for(const col of [8,16,24,32,40,48,56,64])anchors.push({col,row:22});
  return {...source,arena:'cartoon-courtyard',tiles,
    enemies:source.enemies.map((enemy,i)=>({...enemy,...anchors[(i+source.number*3)%anchors.length]!})),player:{col:4,row:22},
    power_spawn:{col:30,row:18},food_spawn:{col:36,row:22}};
}

export function cartoonSpawn(index:number):Cell {
  const cell=spawnCells[index];
  if(!cell)throw new Error('Cartoon arena supports ten player slots');
  return {...cell};
}
