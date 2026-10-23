import type {SourceMap} from '../maps.types';
/** Native woodland plate; exploration follows the irregular glades between established groves. */
export const district2Map:SourceMap={
 districtId:'district-2',width:1240,height:1944,origin:{x:560,y:1120},scale:.6,viewSize:210,spawn:{x:490,y:1060},
 layers:[{image:'overworld-district-2/base',x:0,y:0,width:1240,height:1944,order:-100}],
 walkable:[
  [[210,950],[370,925],[470,880],[570,830],[680,790],[755,790],[785,900],[820,995],[860,1040],[835,1120],[750,1180],[685,1250],[620,1320],[560,1370],[520,1450],[485,1520],[390,1570],[255,1560],[170,1510],[140,1420],[185,1340],[280,1260],[365,1180],[440,1090],[350,1070],[255,1100],[200,1060]],
  [[460,780],[445,700],[450,610],[470,550],[535,540],[580,610],[590,700],[650,745],[755,790],[690,850],[570,875],[510,850]],
  [[450,1510],[560,1440],[650,1390],[720,1390],[760,1460],[715,1520],[640,1570],[590,1650],[530,1655],[500,1590]],
 ],
 solids:[
  [[210,1105],[260,1085],[360,1100],[395,1140],[345,1180],[240,1190]],
  [[600,1190],[650,1170],[690,1205],[660,1240],[615,1230]],
 ],
 pois:[
  {kind:'encounter',slot:0,x:280,y:1005,label:'Western Grove'},
  {kind:'encounter',slot:1,x:740,y:1050,label:'Hollow Tree Trail'},
  {kind:'encounter',slot:2,x:260,y:1350,label:'Mossy Rock Garden'},
  {kind:'encounter',slot:3,x:460,y:1470,label:'Old Oak Crossing'},
  {kind:'encounter',slot:4,x:515,y:615,label:'Upper Woodland Path'},
  {kind:'guide',x:475,y:1030,label:'Woodland Guide'},
  {kind:'vendor',x:690,y:1460,label:'Trail Supplies'},
  {kind:'trial',x:555,y:1590,label:'Deepwood Trial'},
  {kind:'collectible',x:185,y:1430,label:'Hidden Grove Coin',radius:26},
  {kind:'shortcut',x:710,y:1150,label:'Roots Shortcut'},
  {kind:'gate',x:550,y:835,label:'Northern Forest Trail'},
 ],
};
