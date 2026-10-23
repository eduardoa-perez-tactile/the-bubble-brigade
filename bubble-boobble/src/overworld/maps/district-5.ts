import type {SourceMap} from '../maps.types';
/** Inkwell Hell: the original west/east exports meet at source x=1091. */
export const district5Map:SourceMap={
 districtId:'district-5',width:2182,height:1570,origin:{x:1091,y:800},scale:.8,viewSize:240,
 spawn:{x:630,y:1260},
 layers:[
  {image:'overworld-district-5/west',x:0,y:0,width:1091,height:1570,order:-100},
  {image:'overworld-district-5/east',x:1091,y:0,width:1091,height:1570,order:-100},
  {image:'overworld-district-5/mausoleum',x:480,y:910,width:200,height:262,order:-90},
  {image:'overworld-district-5/shop',x:780,y:1050,width:200,height:262,order:-90},
 ],
 walkable:[
  // Dark volcanic footpath, not the surrounding mountain faces.
  [[400,1250],[430,1110],[530,930],[640,810],[690,735],[805,780],[900,815],[1060,930],[1180,1015],[1320,1070],[1460,1080],[1530,1000],[1550,900],[1580,850],[1550,785],[1460,730],[1450,660],[1560,670],[1700,770],[1750,850],[1670,1035],[1500,1130],[1220,1190],[960,1290],[650,1410],[550,1450]],
  // The red staircase is the physical approach to the casino doors.
  [[1170,610],[1240,630],[1160,760],[1040,875],[950,895],[990,800],[1100,700]],
  // Lower crowned tower and archway forecourt.
  [[1280,770],[1410,750],[1500,820],[1510,955],[1450,1035],[1320,1060],[1220,1000],[1250,900]],
  // The archway's lower approach joins the volcanic road below its two pillars.
  [[1220,1000],[1390,995],[1500,1020],[1480,1120],[1330,1140],[1200,1090]],
  // Left terrace and the real side route behind the dice retaining wall.
  [[670,780],[620,695],[625,605],[665,515],[700,450],[760,450],[755,555],[800,625],[865,660],[820,735],[770,820]],
  // Fountain terrace: grass and fountain base are blocked below, paving is free.
  [[700,455],[735,380],[820,350],[960,355],[1060,420],[1040,535],[960,610],[850,650],[750,610],[700,540]],
 ],
 solids:[
  [[510,1100],[660,1100],[660,1170],[510,1170]],
  [[800,1260],[960,1260],[960,1310],[800,1310]],
  [[850,435],[915,435],[935,500],[900,525],[850,510]],
  [[735,465],[770,465],[790,520],[745,535]],
  [[790,620],[1000,535],[1080,600],[950,725],[800,825],[750,770]],
  [[1240,690],[1290,730],[1160,900],[1100,930],[1070,895],[1160,785]],
  [[1310,775],[1390,750],[1440,800],[1390,835],[1320,820]],
 ],
 pois:[
  {kind:'encounter',slot:0,x:1190,y:655,label:'Casino grand entrance',radius:65},
  {kind:'encounter',slot:1,x:1435,y:850,label:'Crowned tower door',radius:65},
  {kind:'encounter',slot:2,x:1400,y:1025,label:'Red archway',radius:65},
  {kind:'encounter',slot:3,x:910,y:560,label:'Fountain terrace',radius:65},
  {kind:'encounter',slot:4,x:590,y:1190,label:'Volcanic mausoleum',radius:65},
  {kind:'guide',x:1010,y:1080,label:'Casino approach',radius:60},
  {kind:'vendor',x:880,y:1330,label:'Porkrind supply stall',radius:65},
  {kind:'trial',x:1010,y:860,label:'Red carpet challenge',radius:60},
  {kind:'collectible',x:765,y:425,label:'Coin behind the terrace palms',radius:32},
  {kind:'shortcut',x:655,y:640,label:'Rear casino terrace trail',radius:50},
  {kind:'gate',x:500,y:1300,label:'Volcano trail exit',radius:65},
 ],
};
