/** Map artwork, traversal and interaction share native source-image coordinates. */
export interface SourcePoint { x:number; y:number }
export type SourcePolygon=readonly (readonly [number,number])[];
export type SourcePoiKind='encounter'|'guide'|'vendor'|'trial'|'collectible'|'shortcut'|'gate';
export interface SourcePoi extends SourcePoint {kind:SourcePoiKind;slot?:number;label?:string;radius?:number}
export interface SourceLayer {image:string;x:number;y:number;width:number;height:number;order:number}
export interface SourceMap {
 districtId:string;width:number;height:number;origin:SourcePoint;scale:number;viewSize:number;
 spawn:SourcePoint;layers:readonly SourceLayer[];walkable:readonly SourcePolygon[];solids:readonly SourcePolygon[];pois:readonly SourcePoi[];
}
