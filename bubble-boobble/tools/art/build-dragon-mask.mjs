// Bake static source-pixel contours once. No original artwork is read or edited.
// Run from the Game Engine project directory with Node 22.18+ (native TS imports).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DRAGON_STATUE_RIG as rig } from '../../src/cartoon/dragon-statue.ts';
const {origin,size,scale,feather}=rig.mask;
const width=size[0]*scale,height=size[1]*scale;
function coverage(x,y,points){
 let inside=false,distance=Infinity;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1];
  const u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  const nx=x-a[0]-u*dx,ny=y-a[1]-u*dy;distance=Math.min(distance,nx*nx+ny*ny);
  if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 const signed=(inside?1:-1)*Math.sqrt(distance),u=Math.max(0,Math.min(1,(signed+feather)/(2*feather)));
 return Math.round(255*u*u*(3-2*u));
}
const raw=Buffer.alloc(height*(width*4+1));
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const at=y*(width*4+1)+1+x*4,px=origin[0]+(x+.5)/scale,py=origin[1]+(y+.5)/scale;
 raw[at]=coverage(px,py,rig.head);raw[at+1]=coverage(px,py,rig.jaw);raw[at+2]=coverage(px,py,rig.cavity);raw[at+3]=255;
}
function crc32(data){let crc=0xffffffff;for(const value of data){crc^=value;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(name,data){const type=Buffer.from(name),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length);type.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([type,data])),8+data.length);return out;}
const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const path=fileURLToPath(new URL('../../assets/cartoon/reconstruction/environment/courtyard-dragon-mask.png',import.meta.url));
writeFileSync(path,png);console.log(`Baked ${width}x${height} RGB head/jaw/cavity mask (${png.length} bytes)`);
