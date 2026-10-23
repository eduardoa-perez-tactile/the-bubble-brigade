import {district4Map} from './maps/district-4';
import {district5Map} from './maps/district-5';
import {district1Map} from './maps/district-1';
import {district2Map} from './maps/district-2';
import {district3Map} from './maps/district-3';
import type {SourceMap,SourcePoint} from './maps.types';
export const overworldMaps:readonly SourceMap[]=[district1Map,district2Map,district3Map,district4Map,district5Map];
export const getOverworldMap=(id:string):SourceMap=>overworldMaps.find(map=>map.districtId===id)??overworldMaps[0]!;
export const sourceToWorld=(map:SourceMap,p:SourcePoint):SourcePoint=>({x:(p.x-map.origin.x)*map.scale,y:(map.origin.y-p.y)*map.scale});
export const worldToSource=(map:SourceMap,p:SourcePoint):SourcePoint=>({x:p.x/map.scale+map.origin.x,y:map.origin.y-p.y/map.scale});
export const mapBounds=(map:SourceMap)=>({minX:-map.origin.x*map.scale,minY:(map.origin.y-map.height)*map.scale,maxX:(map.width-map.origin.x)*map.scale,maxY:map.origin.y*map.scale});
export function mapEncounterPoint(districtId:string,slot:number):SourcePoint {const map=getOverworldMap(districtId);return sourceToWorld(map,map.pois.find(p=>p.kind==='encounter'&&p.slot===slot)??map.spawn);}
export function mapPoiPoint(districtId:string,kind:string):SourcePoint {const map=getOverworldMap(districtId);return sourceToWorld(map,map.pois.find(p=>p.kind===kind)??map.spawn);}
