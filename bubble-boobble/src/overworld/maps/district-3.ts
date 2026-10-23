import type {SourceMap} from '../maps.types';
/** Native carnival forecourt: welcoming arch, central tent, wagon and wheel promenade. */
export const district3Map:SourceMap={
 districtId:'district-3',width:1435,height:1369,origin:{x:850,y:600},scale:.6,viewSize:220,spawn:{x:650,y:730},
 layers:[{image:'overworld-district-3/base',x:0,y:0,width:1435,height:1369,order:-100}],
 walkable:[
  [[330,190],[440,150],[570,190],[650,195],[720,245],[830,300],[1000,260],[1120,175],[1280,110],[1410,150],[1410,690],[1300,700],[1190,630],[1100,585],[990,600],[920,650],[845,725],[810,815],[720,865],[570,865],[455,830],[405,755],[420,660],[470,590],[430,500],[350,445],[300,350]],
  [[830,700],[905,650],[965,670],[980,785],[970,870],[1020,940],[1130,965],[1235,920],[1290,830],[1310,730],[1400,715],[1410,1040],[1340,1110],[1220,1140],[1080,1130],[975,1080],[920,1005],[905,910],[855,855]],
  [[270,980],[360,890],[420,830],[480,750],[500,655],[545,665],[545,785],[470,870],[390,940],[320,1010]],
 ],
 solids:[
  [[945,655],[1070,600],[1160,635],[1235,740],[1245,860],[1190,955],[1090,1005],[990,940],[940,835]],
  [[855,410],[905,390],[945,425],[940,485],[910,510],[870,475]],
  [[525,485],[555,460],[600,470],[620,505],[595,535],[550,520]],
  [[650,500],[685,475],[715,490],[725,525],[695,550],[660,535]],
 ],
 pois:[
  {kind:'encounter',slot:0,x:650,y:230,label:'Grand Carnival Tent'},
  {kind:'encounter',slot:1,x:370,y:370,label:'Balloon Parade'},
  {kind:'encounter',slot:2,x:510,y:765,label:'Welcome Arch'},
  {kind:'encounter',slot:3,x:1130,y:1050,label:'Ferris Wheel Forecourt'},
  {kind:'encounter',slot:4,x:1260,y:500,label:'Animal Wagon'},
  {kind:'guide',x:680,y:760,label:'Carnival Guide'},
  {kind:'vendor',x:1090,y:530,label:'Umbrella Refreshments'},
  {kind:'trial',x:1320,y:960,label:'Wheelwalk Trial'},
  {kind:'collectible',x:335,y:950,label:'Welcome Bridge Coin',radius:26},
  {kind:'shortcut',x:820,y:720,label:'Tent Side Passage'},
  {kind:'gate',x:1330,y:230,label:'Upper Carnival Road'},
 ],
};
