import type {Cell,Level} from '../arcade/types';

export interface AdventureEpisode {
 id:string; title:string; subtitle:string; description:string; theme:string; duration:string;
 waves?:Level['enemies'][];
}
type Shelf=readonly[row:number,left:number,right:number];
interface Script {
 title:string;description:string;shelves:readonly Shelf[];enemies:readonly string[];
 columns:number;enemyCells:readonly Cell[];power:Cell;food:Cell;waves?:Level['enemies'][];
}
/** Authored arrangements. Shared mechanics and platform modules, distinct routes and encounter pacing. */
const scripts:readonly Script[]=[
 // Compact prototype: each landing advances the fight; the open sides return to the floor.
 {title:'Lantern Landing',description:'Climb the lighthouse landings and catch the troublemakers on each tier.',columns:40,
  shelves:[[18,3,17],[14,12,28],[10,21,35]],enemies:['zenchan','zenchan','monsta'],
  enemyCells:[{col:12,row:18},{col:22,row:14},{col:28,row:10}],power:{col:20,row:22},food:{col:32,row:22}},
 {title:'Parcel Panic',description:'Work both sorting lanes. Flying parcels have brought some unexpected visitors.',columns:44,
  shelves:[[18,4,17],[18,27,39],[14,12,30]],enemies:['zenchan','mighta','monsta','zenchan'],
  enemyCells:[{col:11,row:18},{col:23,row:14},{col:32,row:10},{col:34,row:18}],power:{col:20,row:22},food:{col:36,row:22}},
 {title:'Sailcloth Shuffle',description:'Thread the sailmakers’ loft. Wide turns and clean capture angles win the day.',columns:44,
  shelves:[[18,4,19],[14,13,30],[10,25,39],[10,4,17]],enemies:['pulpul','monsta','banebou','zenchan','monsta'],
  enemyCells:[{col:9,row:8},{col:33,row:8},{col:26,row:14},{col:11,row:18},{col:21,row:6}],power:{col:21,row:22},food:{col:36,row:22}},
 {title:'Pressure Trouble',description:'Cross the pump-station balconies. Dodge the central blaster and catch the flying troublemakers.',columns:44,
  shelves:[[18,3,15],[18,28,40],[14,12,31]],enemies:['mighta','zenchan','pulpul','monsta','zenchan'],
  enemyCells:[{col:22,row:14},{col:12,row:18},{col:10,row:12},{col:34,row:12},{col:34,row:18}],power:{col:21,row:22},food:{col:36,row:22}},
 {title:'Tugboat Tussle',description:'Clear both decks, then watch the opposite flank when the boarding party arrives!',columns:44,
  shelves:[[18,4,18],[18,25,39]],enemies:['zenchan','mighta','monsta'],
  enemyCells:[{col:12,row:18},{col:31,row:18},{col:22,row:12}],power:{col:21,row:22},food:{col:36,row:22},
  waves:[[{kind:'mighta',col:13,row:18},{kind:'monsta',col:29,row:12},{kind:'banebou',col:30,row:22}]]},
 {title:'Dewdrop Steps',description:'Hop the mossy terraces and clear the garden’s lower paths.',columns:44,
  shelves:[[18,4,18],[14,13,29],[10,25,39],[10,4,17]],enemies:['zenchan','pulpul','monsta','zenchan'],
  enemyCells:[{col:11,row:18},{col:9,row:8},{col:33,row:8},{col:22,row:14}],power:{col:20,row:22},food:{col:36,row:22}},
 {title:'Acorn Antics',description:'Sweep the woodland balconies. Leave no captured creature behind.',columns:44,
  shelves:[[18,4,18],[18,26,39],[14,12,31]],enemies:['banebou','zenchan','monsta','pulpul'],
  enemyCells:[{col:15,row:14},{col:10,row:18},{col:32,row:10},{col:21,row:10}],power:{col:21,row:22},food:{col:35,row:22}},
 {title:'Willow Waltz',description:'Follow the climbing branches and catch the fluttering garden pests.',columns:44,
  shelves:[[18,5,21],[14,14,31],[10,25,39],[10,4,18]],enemies:['monsta','pulpul','banebou','monsta','zenchan'],
  enemyCells:[{col:32,row:8},{col:10,row:8},{col:27,row:14},{col:21,row:5},{col:12,row:18}],power:{col:23,row:22},food:{col:36,row:22}},
 {title:'Bramble Bounce',description:'Two narrow routes meet above the garden. Keep the center lane clear.',columns:44,
  shelves:[[18,4,17],[18,27,39],[14,11,29],[10,22,38]],enemies:['mighta','banebou','zenchan','monsta','pulpul'],
  enemyCells:[{col:20,row:14},{col:34,row:18},{col:11,row:18},{col:31,row:8},{col:10,row:10}],power:{col:21,row:22},food:{col:36,row:22}},
 {title:'Woodland Welcome',description:'Bring the garden gathering to a close. A second flock is on its way.',columns:44,
  shelves:[[18,4,20],[18,27,39],[14,13,32],[10,4,18]],enemies:['pulpul','zenchan','mighta'],
  enemyCells:[{col:10,row:8},{col:34,row:18},{col:25,row:14}],power:{col:22,row:22},food:{col:36,row:22},
  waves:[[{kind:'mighta',col:25,row:14},{kind:'monsta',col:10,row:8},{kind:'banebou',col:34,row:18}]]},
 {title:'Kettle Capers',description:'Catch the carnival’s runaway helpers around the copper kettle.',columns:44,
  shelves:[[18,4,19],[14,13,30],[10,24,39],[10,4,17]],enemies:['zenchan','mighta','pulpul','monsta'],
  enemyCells:[{col:11,row:18},{col:24,row:14},{col:9,row:8},{col:32,row:8}],power:{col:21,row:22},food:{col:35,row:22}},
 {title:'Depot Dash',description:'Work the left and right loading shelves before the next departure.',columns:44,
  shelves:[[18,4,18],[18,26,39],[14,13,31],[10,24,38]],enemies:['zenchan','banebou','monsta','mighta','zenchan'],
  enemyCells:[{col:11,row:18},{col:21,row:14},{col:32,row:8},{col:33,row:18},{col:30,row:10}],power:{col:21,row:22},food:{col:35,row:22}},
 {title:'Pinwheel Pranks',description:'Weave through the fair’s high landings and catch the aerial pranksters.',columns:44,
  shelves:[[18,12,31],[14,4,18],[14,25,39],[10,13,30]],enemies:['pulpul','monsta','pulpul','banebou','zenchan'],
  enemyCells:[{col:10,row:10},{col:33,row:10},{col:21,row:6},{col:18,row:18},{col:23,row:10}],power:{col:10,row:22},food:{col:35,row:22}},
 {title:'Thunder Workshop',description:'Clear the workshop balconies. Dodge enemy shots and catch the aerial troublemakers.',columns:44,
  shelves:[[18,4,20],[18,27,39],[14,13,31],[10,4,18]],enemies:['mighta','invader','zenchan','monsta','pulpul'],
  enemyCells:[{col:23,row:14},{col:33,row:18},{col:11,row:18},{col:10,row:8},{col:31,row:10}],power:{col:22,row:22},food:{col:36,row:22}},
 {title:'Last Call at the Fair',description:'One last carnival performance: clear both acts to close the show.',columns:44,
  shelves:[[18,4,18],[18,26,39],[14,12,30],[10,24,39]],enemies:['banebou','mighta','pulpul'],
  enemyCells:[{col:10,row:18},{col:22,row:14},{col:32,row:8}],power:{col:21,row:22},food:{col:35,row:22},
  waves:[[{kind:'mighta',col:21,row:14},{kind:'monsta',col:32,row:8},{kind:'invader',col:10,row:18}]]},
 {title:'Lantern Hops',description:'Cross the lantern terraces and gather the cloudtop troublemakers.',columns:44,
  shelves:[[18,4,20],[14,13,31],[10,25,39],[10,4,18]],enemies:['monsta','zenchan','pulpul','banebou'],
  enemyCells:[{col:32,row:8},{col:11,row:18},{col:10,row:8},{col:24,row:14}],power:{col:22,row:22},food:{col:36,row:22}},
 {title:'Firefly Ferry',description:'Sweep the ferry’s twin balconies and its high lookout.',columns:44,
  shelves:[[18,4,17],[18,26,39],[14,12,30],[10,23,38]],enemies:['pulpul','monsta','invader','zenchan'],
  enemyCells:[{col:10,row:10},{col:32,row:8},{col:21,row:14},{col:33,row:18}],power:{col:20,row:22},food:{col:35,row:22}},
 {title:'Moonpool Mischief',description:'Take the winding route around the spring and keep room to pop bubbles.',columns:44,
  shelves:[[18,12,31],[14,4,18],[14,25,39],[10,12,30]],enemies:['banebou','pulpul','monsta','mighta','zenchan'],
  enemyCells:[{col:18,row:18},{col:10,row:10},{col:33,row:10},{col:21,row:10},{col:32,row:14}],power:{col:10,row:22},food:{col:35,row:22}},
 {title:'Reedpipe Ruckus',description:'Work both spring-side balconies. Dodge the skimmers and catch the flying pests.',columns:44,
  shelves:[[18,4,19],[18,27,39],[14,12,30],[10,24,39]],enemies:['invader','pulpul','monsta','zenchan','mighta'],
  enemyCells:[{col:22,row:14},{col:10,row:10},{col:32,row:8},{col:11,row:18},{col:34,row:18}],power:{col:21,row:22},food:{col:36,row:22}},
 {title:'Marshlight Matinee',description:'Restore the quiet springs by clearing both acts of the cloudtop finale.',columns:44,
  shelves:[[18,4,20],[18,28,39],[14,13,32],[10,4,18]],enemies:['monsta','invader','banebou'],
  enemyCells:[{col:10,row:8},{col:25,row:14},{col:34,row:18}],power:{col:23,row:22},food:{col:36,row:22},
  waves:[[{kind:'mighta',col:25,row:14},{kind:'monsta',col:10,row:8},{kind:'invader',col:34,row:18}]]},
 {title:'Crystal Commotion',description:'Start at the low furnaces and work up the glassworks’ ledges.',columns:44,
  shelves:[[18,4,19],[14,13,30],[10,24,39],[10,4,18]],enemies:['mighta','zenchan','invader','monsta'],
  enemyCells:[{col:24,row:14},{col:11,row:18},{col:31,row:10},{col:10,row:8}],power:{col:21,row:22},food:{col:35,row:22}},
 {title:'Foundry Frolic',description:'Clear the furnace balconies. Take the broad middle route when crowded.',columns:44,
  shelves:[[18,4,18],[18,26,39],[14,12,31],[10,24,39]],enemies:['mighta','invader','banebou','zenchan','pulpul'],
  enemyCells:[{col:21,row:14},{col:33,row:18},{col:29,row:10},{col:11,row:18},{col:10,row:10}],power:{col:21,row:22},food:{col:35,row:22}},
 {title:'Tempest Tangle',description:'The highest glassworks route rewards careful jumps and quick captures.',columns:44,
  shelves:[[18,12,31],[14,4,19],[14,25,39],[10,4,18],[10,25,39]],enemies:['invader','monsta','pulpul','mighta','banebou'],
  enemyCells:[{col:21,row:18},{col:21,row:6},{col:33,row:8},{col:11,row:10},{col:32,row:14}],power:{col:10,row:22},food:{col:35,row:22}},
 {title:'Boiler Brigade',description:'Clear the boiler-room platforms. Keep moving through the mixed enemy brigade.',columns:44,
  shelves:[[18,4,18],[18,27,39],[14,12,30],[10,4,18],[10,25,39]],enemies:['mighta','invader','pulpul','banebou','zenchan','monsta'],
  enemyCells:[{col:21,row:14},{col:34,row:18},{col:10,row:8},{col:30,row:10},{col:11,row:18},{col:33,row:6}],power:{col:21,row:22},food:{col:36,row:22}},
 {title:'Skybell Send-off',description:'The Brigade’s final performance. Clear both acts and ring the harbor home.',columns:44,
  shelves:[[18,4,19],[18,27,39],[14,12,31],[10,24,39]],enemies:['invader','mighta','pulpul','banebou'],
  enemyCells:[{col:33,row:18},{col:22,row:14},{col:10,row:10},{col:30,row:10}],power:{col:21,row:22},food:{col:36,row:22},
  waves:[[{kind:'mighta',col:22,row:14},{kind:'monsta',col:32,row:8},{kind:'invader',col:11,row:18}]]},
];
const harborThemes=['lighthouse','post-office','sailcloth','pump-station','tugboat'];
const districtThemes=['','garden','fair','springs','foundry'];
export function episodeForLevel(number:number):AdventureEpisode {
 const index=number-1,script=scripts[index];if(!script)throw new Error(`Unknown Adventure episode ${number}`);
 const district=Math.floor(index/5),slot=index%5;
 return {id:`encounter-${number}`,title:script.title,subtitle:slot===4?'DISTRICT FINALE':'A BRIGADE SHORT',description:script.description,
  theme:district===0?harborThemes[slot]!:`${districtThemes[district]}-${slot+1}`,duration:slot===0?'45–60 SEC':slot===4?'90–120 SEC':'60–90 SEC',
  ...(script.waves?{waves:script.waves.map(wave=>wave.map(enemy=>({...enemy})))}:{}),
 };
}
export function createAdventureLevel(number:number):Level {
 const script=scripts[number-1];if(!script)throw new Error(`Unknown Adventure episode ${number}`);
 const columns=script.columns;
 const tiles=Array.from({length:23},(_,row)=>Array.from({length:columns},(_,col)=>col<2||col>=columns-2||row===22?1:0));
 for(const[row,left,right]of script.shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
 const cells=script.enemyCells;
 return {arena:'cartoon-courtyard',number,tiles,episode:episodeForLevel(number),
  enemies:script.enemies.map((kind,i)=>({kind,...cells[i]!})),
  player:{col:5,row:22},power_spawn:{...script.power},food_spawn:{...script.food},special:'',special_count:0};
}
