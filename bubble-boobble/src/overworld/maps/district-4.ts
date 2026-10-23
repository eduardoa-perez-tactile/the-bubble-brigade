import type {SourceMap} from '../maps.types';
/** Inkwell Isle IV: native DLC geography; every polygon is traced in the 3837×2311 source. */
export const district4Map:SourceMap={
 districtId:'district-4',width:3837,height:2311,origin:{x:1900,y:1150},scale:.6,viewSize:270,
 spawn:{x:485,y:1400},
 layers:[
  {image:'overworld-district-4/land',x:0,y:0,width:3837,height:2311,order:-100},
  {image:'overworld-district-4/bakery',x:1370,y:270,width:352,height:452,order:-90},
  {image:'overworld-district-4/cave',x:1890,y:100,width:477,height:445,order:-90},
  {image:'overworld-district-4/igloo',x:3110,y:460,width:484,height:451,order:-90},
  {image:'overworld-district-4/cactus',x:1700,y:1560,width:185,height:242,order:-90},
  {image:'overworld-district-4/cart',x:450,y:1120,width:214,height:226,order:-90},
  {image:'overworld-district-4/foreground',x:0,y:0,width:3837,height:2311,order:4000},
 ],
 walkable:[
  // Wharf, lower village street and the real stairs into the town square.
  [[220,1460],[330,1370],[540,1310],[690,1210],[800,1090],[970,1080],[1040,1180],[890,1250],[790,1340],[650,1440],[440,1510],[250,1540]],
  [[750,1120],[735,940],[790,810],[900,720],[1100,640],[1300,630],[1400,680],[1520,680],[1680,730],[1720,900],[1780,1020],[1760,1190],[1700,1320],[1420,1370],[1190,1360],[1040,1320],[970,1160]],
  // The stone bridge crosses the stream; the stream itself is never walkable.
  [[1680,750],[1810,715],[1910,740],[2080,800],[2040,905],[1870,855],[1760,850]],
  // Open highland meadow, around the mountain entrance and picnic table.
  [[1850,635],[1900,510],[2070,485],[2300,510],[2470,600],[2690,610],[2810,700],[2720,860],[2500,910],[2280,910],[2070,900],[1970,820]],
  // Original snowy approach, via the narrow eastern trail.
  [[2640,700],[2830,730],[2910,800],[2880,880],[2970,960],[3170,1080],[3430,1080],[3620,1000],[3650,860],[3530,740],[3490,680],[3240,670],[3070,740],[2990,850],[2890,910],[2780,875],[2700,800]],
  // The narrow snowbank approach overlaps both shores with enough room for the foot disk.
  [[2740,760],[2850,790],[2940,875],[3030,930],[3080,1010],[3000,1040],[2880,975],[2800,875],[2720,850]],
  // Trail under the forest canopy joins the cemetery and the airfield.
  [[2640,835],[2730,855],[2810,920],[2900,1020],[2890,1150],[2800,1260],[2610,1325],[2360,1370],[2140,1320],[2070,1210],[2150,1110],[2340,1060],[2530,1010]],
  [[2370,1280],[2620,1270],[2890,1200],[3080,1220],[3220,1360],[3320,1490],[3260,1580],[3040,1650],[2760,1720],[2510,1670],[2330,1560],[2280,1440]],
  // Curved road along the village cliff leads down to the sandy southern clearing.
  [[1650,1110],[1770,1120],[1780,1260],[1700,1360],[1750,1450],[1870,1490],[1950,1590],[1820,1700],[1650,1660],[1570,1500],[1600,1360],[1640,1240]],
  [[1110,1750],[1260,1640],[1480,1610],[1730,1560],[1930,1590],[2070,1670],[2140,1840],[2100,1960],[1880,2070],[1560,2100],[1320,2050],[1080,1980],[1040,1870]],
  // A real narrow bypass behind the upper town houses reaches the meadow.
  [[1630,730],[1620,610],[1680,535],[1790,475],[1900,470],[1980,535],[1900,635],[1800,600],[1740,665],[1740,770]],
 ],
 solids:[
  // Building ground footprints stop walking through the source doors and stall walls.
  [[1400,650],[1680,650],[1680,710],[1400,710]],
  [[3180,750],[3260,700],[3430,710],[3520,800],[3510,885],[3400,920],[3260,885],[3180,850]],
  [[1740,1730],[1850,1730],[1855,1795],[1740,1805]],
  [[490,1290],[640,1290],[645,1340],[490,1340]],
  [[1000,930],[1620,915],[1670,1070],[1600,1150],[1120,1150],[1030,1090]],
  [[1155,755],[1320,755],[1360,855],[1280,920],[1150,875]],
  [[2890,1380],[3100,1300],[3220,1360],[3235,1490],[3080,1560],[2930,1530]],
  [[2320,740],[2420,725],[2490,770],[2435,830],[2330,820]],
 ],
 pois:[
  {kind:'encounter',slot:0,x:1550,y:735,label:'Bakery door',radius:85},
  {kind:'encounter',slot:1,x:2130,y:565,label:'Mountain cavern',radius:90},
  {kind:'encounter',slot:2,x:3305,y:925,label:'Snow temple steps',radius:95},
  {kind:'encounter',slot:3,x:2460,y:1235,label:'Cemetery clearing',radius:85},
  {kind:'encounter',slot:4,x:2920,y:1575,label:'Airfield hangar',radius:90},
  {kind:'guide',x:560,y:1370,label:'Chalice cart',radius:75},
  {kind:'vendor',x:350,y:1385,label:'Village supply house',radius:75},
  {kind:'trial',x:1800,y:1840,label:'Cactus clearing',radius:80},
  {kind:'collectible',x:2795,y:1105,label:'Coin behind the pines',radius:40},
  {kind:'shortcut',x:1750,y:560,label:'Behind the mountain village',radius:55},
  {kind:'gate',x:2800,y:1635,label:'Airfield departure',radius:80},
 ],
};
