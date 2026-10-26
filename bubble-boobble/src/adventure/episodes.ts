import type {Cell,Level} from '../arcade/types';

export interface AdventureEpisode {
 id:string; title:string; subtitle:string; description:string; theme:string; duration:string;
 pressure?:readonly number[]; waves?:Level['enemies'][];
}
type Shelf=readonly[row:number,left:number,right:number];
interface Script {title:string;description:string;shelves:readonly Shelf[];enemies:readonly string[];pressure?:readonly number[]}
/** Authored arrangements. Shared mechanics and platform modules, distinct routes and encounter pacing. */
const scripts:readonly Script[]=[
 {title:'Lantern Landing',description:'Climb the lighthouse landings. Catch the troublemakers and bring the light back.',shelves:[[18,3,23],[18,32,55],[14,14,38],[10,29,53],[6,16,37]],enemies:['zenchan','zenchan','monsta']},
 {title:'Parcel Panic',description:'Work both sorting lanes. Flying parcels have brought some unexpected visitors.',shelves:[[18,4,28],[18,40,67],[14,19,52]],enemies:['zenchan','mighta','monsta','zenchan']},
 {title:'Sailcloth Shuffle',description:'Thread the sailmakers’ loft. Wide turns and clean capture angles win the day.',shelves:[[18,6,20],[18,29,48],[14,16,35],[14,48,66],[10,5,22],[10,32,56],[6,19,42]],enemies:['pulpul','monsta','banebou','zenchan','monsta']},
 {title:'Pressure Trouble',description:'Watch the valves: amber warns, then steam bursts. Cross between pressure cycles.',shelves:[[18,3,26],[18,44,68],[14,15,55]],enemies:['mighta','zenchan','pulpul','monsta','zenchan'],pressure:[33,39]},
 {title:'Tugboat Tussle',description:'Clear the deck, then face the boarding party. Give the harbor a proper send-off!',shelves:[[18,4,24],[18,46,67],[14,18,53]],enemies:['zenchan','mighta','monsta']},
 {title:'Dewdrop Steps',description:'Hop the mossy terraces and clear the garden’s lower paths.',shelves:[[18,5,29],[14,18,42],[10,32,59],[6,22,46],[18,48,67]],enemies:['zenchan','pulpul','monsta','zenchan']},
 {title:'Acorn Antics',description:'Sweep the woodland balconies. Leave no captured creature behind.',shelves:[[18,4,23],[18,38,64],[14,14,47]],enemies:['banebou','zenchan','monsta','pulpul']},
 {title:'Willow Waltz',description:'Follow the climbing branches and catch the fluttering garden pests.',shelves:[[18,9,34],[14,25,52],[10,41,67],[10,7,24],[6,26,49]],enemies:['monsta','pulpul','banebou','monsta','zenchan']},
 {title:'Bramble Bounce',description:'Two narrow routes meet above the garden. Keep the center lane clear.',shelves:[[18,3,21],[18,42,65],[14,13,34],[14,48,67]],enemies:['mighta','banebou','zenchan','monsta','pulpul']},
 {title:'Woodland Welcome',description:'Bring the garden gathering to a close. A second flock is on its way.',shelves:[[18,8,31],[18,44,67],[14,21,52]],enemies:['pulpul','zenchan','mighta']},
 {title:'Kettle Capers',description:'Catch the carnival’s runaway helpers around the copper kettle.',shelves:[[18,3,26],[14,18,46],[10,35,63],[6,22,45],[18,45,65]],enemies:['zenchan','mighta','pulpul','monsta']},
 {title:'Depot Dash',description:'Work the left and right loading shelves before the next departure.',shelves:[[18,7,30],[18,47,68],[14,20,52]],enemies:['zenchan','banebou','monsta','mighta','zenchan']},
 {title:'Pinwheel Pranks',description:'Weave through the fair’s high landings and catch the aerial pranksters.',shelves:[[18,12,36],[14,3,24],[14,34,59],[10,20,45],[6,38,64]],enemies:['pulpul','monsta','pulpul','banebou','zenchan']},
 {title:'Thunder Workshop',description:'Stay clear of the vent lanes when the workshop winds up.',shelves:[[18,3,25],[18,45,67],[14,17,54]],enemies:['mighta','invader','zenchan','monsta','pulpul'],pressure:[32,40]},
 {title:'Last Call at the Fair',description:'One last carnival performance: clear both acts to close the show.',shelves:[[18,5,28],[18,43,66],[14,20,50]],enemies:['banebou','mighta','pulpul']},
 {title:'Lantern Hops',description:'Cross the lantern terraces and gather the cloudtop troublemakers.',shelves:[[18,6,27],[14,20,44],[10,36,62],[6,22,43],[18,47,68]],enemies:['monsta','zenchan','pulpul','banebou']},
 {title:'Firefly Ferry',description:'Sweep the ferry’s twin balconies and its high lookout.',shelves:[[18,4,22],[18,39,65],[14,14,48]],enemies:['pulpul','monsta','invader','zenchan']},
 {title:'Moonpool Mischief',description:'Take the winding route around the spring and keep room to pop bubbles.',shelves:[[18,10,33],[14,25,55],[10,6,27],[10,40,65],[6,24,46]],enemies:['banebou','pulpul','monsta','mighta','zenchan']},
 {title:'Reedpipe Ruckus',description:'The spring vents have a rhythm. Watch, wait, then cross.',shelves:[[18,4,27],[18,46,68],[14,17,56]],enemies:['invader','pulpul','monsta','zenchan','mighta'],pressure:[34,41]},
 {title:'Marshlight Matinee',description:'Restore the quiet springs by clearing both acts of the cloudtop finale.',shelves:[[18,7,29],[18,43,65],[14,19,51]],enemies:['monsta','invader','banebou']},
 {title:'Crystal Commotion',description:'Start at the low furnaces and work up the glassworks’ ledges.',shelves:[[18,4,25],[14,17,43],[10,33,60],[6,21,44],[18,46,67]],enemies:['mighta','zenchan','invader','monsta']},
 {title:'Foundry Frolic',description:'Clear the furnace balconies. Take the broad middle route when crowded.',shelves:[[18,6,28],[18,44,66],[14,18,53]],enemies:['mighta','invader','banebou','zenchan','pulpul']},
 {title:'Tempest Tangle',description:'The highest glassworks route rewards careful jumps and quick captures.',shelves:[[18,11,35],[14,26,57],[10,6,25],[10,39,66],[6,23,48]],enemies:['invader','monsta','pulpul','mighta','banebou']},
 {title:'Boiler Brigade',description:'Read the boiler warning, then move. Steam lanes alternate across the room.',shelves:[[18,3,24],[18,44,68],[14,16,55]],enemies:['mighta','invader','pulpul','banebou','zenchan','monsta'],pressure:[31,39]},
 {title:'Skybell Send-off',description:'The Brigade’s final performance. Clear both acts and ring the harbor home.',shelves:[[18,5,27],[18,45,67],[14,19,52]],enemies:['invader','mighta','pulpul','banebou']},
];
const harborThemes=['lighthouse','post-office','sailcloth','pump-station','tugboat'];
const districtThemes=['','garden','fair','springs','foundry'];
export function episodeForLevel(number:number):AdventureEpisode {
 const index=number-1,script=scripts[index];if(!script)throw new Error(`Unknown Adventure episode ${number}`);
 const district=Math.floor(index/5),slot=index%5;
 return {id:`encounter-${number}`,title:script.title,subtitle:slot===4?'DISTRICT FINALE':'A BRIGADE SHORT',description:script.description,
  theme:district===0?harborThemes[slot]!:`${districtThemes[district]}-${slot+1}`,duration:slot===0?'45–60 SEC':slot===4?'90–120 SEC':'60–90 SEC',
  ...(script.pressure?{pressure:script.pressure}:{}),
  ...(slot===4?{waves:[[{kind:'mighta',col:23,row:14},{kind:'monsta',col:48,row:14},{kind:district>1?'invader':'banebou',col:35,row:22}]]}:{}),
 };
}
export function createAdventureLevel(number:number):Level {
 const script=scripts[number-1];if(!script)throw new Error(`Unknown Adventure episode ${number}`);
 const tiles=Array.from({length:23},(_,row)=>Array.from({length:72},(_,col)=>col<2||col>=70||row===22?1:0));
 for(const[row,left,right]of script.shelves)for(let col=left;col<=right;col++)tiles[row]![col]=1;
 const cells:Cell[]=script.shelves.map(([row,left,right])=>({row,col:Math.min(right-2,left+4)}));
 return {arena:'cartoon-courtyard',number,tiles,episode:episodeForLevel(number),
  enemies:script.enemies.map((kind,i)=>({kind,...cells[i%cells.length]!})),
  player:{col:5,row:22},power_spawn:{col:34,row:22},food_spawn:{col:58,row:22},special:'',special_count:0};
}
