import type {SourceMap} from '../maps.types';
import {REFERENCE_WALKABLE_POLYGONS,REFERENCE_SOLID_POLYGONS} from '../reference-navigation';
/** Exact analyzed downtown neighborhood; continuous promenade and beach geography. */
export const district1Map:SourceMap={
 districtId:'district-1',width:2028,height:1476,origin:{x:1100,y:775},scale:.6,viewSize:240,spawn:{x:1030,y:800},
 layers:[
  {image:'overworld-reference/mainland03',x:0,y:0,width:2028,height:1476,order:-100},
  {image:'overworld-reference/bee',x:825,y:170,width:601,height:651,order:-90},
  {image:'overworld-reference/top03',x:309,y:39,width:1774,height:1391,order:4000},
 ],
 walkable:REFERENCE_WALKABLE_POLYGONS,solids:REFERENCE_SOLID_POLYGONS,
 pois:[
  {kind:'encounter',slot:0,x:1100,y:800,label:'Honeycomb Tower'},
  {kind:'encounter',slot:1,x:730,y:520,label:'Western Arch'},
  {kind:'encounter',slot:2,x:950,y:735,label:'Clockwork Townhouse'},
  {kind:'encounter',slot:3,x:1280,y:875,label:'Pink Corner House'},
  {kind:'encounter',slot:4,x:1900,y:1260,label:'Seaside Trail'},
  {kind:'guide',x:780,y:880,label:'Promenade Keeper'},
  {kind:'vendor',x:1830,y:380,label:'Town Supply Stop'},
  {kind:'trial',x:1570,y:1170,label:'Beach Mastery Trial'},
  {kind:'collectible',x:1970,y:1320,label:'Shoreline Coin',radius:26},
  {kind:'shortcut',x:1440,y:980,label:'Palm Stairway'},
  {kind:'gate',x:1980,y:180,label:'East District Road'},
 ],
};
