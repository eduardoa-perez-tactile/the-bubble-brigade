import type {Cell, Level} from '../arcade/types';

export const cartoonColumns=36,cartoonRows=18;
const spawnCells:readonly Cell[]=[3,9,15,22,29].flatMap((col,i)=>[
  {col,row:17},{col:[4,8,15,19,28][i]!,row:12},
]);

/** New authored geometry. Original campaign and courtyard data remain untouched. */
export function createCartoonArena(source:Level):Level {
  const tiles=Array.from({length:cartoonRows},(_,row)=>Array.from({length:cartoonColumns},(_,col)=>
    col<2||col>=cartoonColumns-2||row===cartoonRows-1?1:0));
  const upper:readonly (readonly [number,number,number][])[]=[
    [[4,3,10],[4,14,21],[4,25,32],[8,6,14],[8,19,29]],
    [[4,5,13],[4,20,30],[8,3,9],[8,13,21],[8,26,32]],
    [[4,3,11],[4,16,23],[4,27,32],[8,6,15],[8,20,29]],
    [[4,7,14],[4,21,28],[8,3,11],[8,15,23],[8,27,32]],
  ];
  // Four alternating upper routes retain different campaign jump lanes. The
  // two lower spawn surfaces stay fixed for every party and campaign layout.
  const shelves:readonly (readonly [number,number,number])[]=[
    ...upper[(source.number-1)%upper.length]!,[12,3,10],[12,13,21],[12,24,32],
  ];
  for(const [row,left,right] of shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
  const anchors:Cell[]=[];
  for(const [row,left,right] of shelves)for(let col=left;col<=right-1;col+=2)anchors.push({col,row});
  for(const col of [6,9,12,15,18,21,28,31])anchors.push({col,row:17});
  return {...source,arena:'cartoon-courtyard',tiles,
    enemies:source.enemies.map((enemy,i)=>({...enemy,...anchors[(i+source.number*3)%anchors.length]!})),player:{col:3,row:17},
    power_spawn:{col:17,row:12},food_spawn:{col:17,row:17}};
}

export function cartoonSpawn(index:number):Cell {
  const cell=spawnCells[index];
  if(!cell)throw new Error('Cartoon arena supports ten player slots');
  return {...cell};
}
