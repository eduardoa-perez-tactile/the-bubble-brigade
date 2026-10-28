/** Deterministic native asset preparation. Pillow only measures alpha; Swift/CoreGraphics
 * crops/resamples onto transparent canvases. No redraw, recolor or source/static writes.
 * Default: JSON registration analysis. --write: import twelve 160px motion frames. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');process.chdir(root);
const directory='tools/overworld/crest-animation-sources',manifestPath=`${directory}/import-manifest.json`;
const config=JSON.parse(readFileSync(manifestPath,'utf8')),kinds=['available','locked','cleared','shop'];
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function run(command,args){const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
const reader=String.raw`
import sys,json,statistics
from PIL import Image
from collections import deque
out=[]
for filename in sys.argv[1:]:
 im=Image.open(filename)
 if 'A' not in im.getbands(): raise ValueError(filename+': alpha required')
 alpha=im.getchannel('A'); sheet=im.width>160
 if sheet and (im.width!=im.height or im.width%2): raise ValueError('Expected even square 2x2 source')
 cell=im.width//2 if sheet else im.width
 frames=[]
 for frame in range(4 if sheet else 1):
  x=(frame%2)*cell if sheet else 0;y=(frame//2)*cell if sheet else 0
  right=min(im.width,x+cell+24) if sheet else im.width
  a=alpha.crop((x,y,right,y+cell)); mask=a.point(lambda v:255 if v>16 else 0);b=mask.getbbox()
  if b is None: raise ValueError('Empty drawing '+filename)
  p=mask.load()
  # Overscan may recover the same wing, never import a neighboring icon fragment.
  if b[2]>cell:
   start=next(((xx,yy) for yy in range(cell) for xx in range(cell-1,-1,-1) if p[xx,yy]),None)
   seen={start};todo=deque([start])
   while todo:
    xx,yy=todo.popleft()
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
     q=(xx+dx,yy+dy)
     if 0<=q[0]<a.width and 0<=q[1]<a.height and q not in seen and p[q[0],q[1]]:seen.add(q);todo.append(q)
   if any(p[xx,yy] and (xx,yy) not in seen for xx in range(cell,a.width) for yy in range(cell)):raise ValueError(filename+': separate component in overscan')
  if sheet and (b[0]<=0 or b[1]<=0 or b[2]>=a.width or b[3]>=a.height):raise ValueError(filename+': drawing touches sampling boundary')
  xs=[xx for yy in range(max(b[1],b[3]-5),b[3]) for xx in range(b[0],b[2]) if p[xx,yy]]
  frames.append({'bounds':b,'tip':[statistics.median(xs),b[3]],'origin':[x,y],'overscanRight':max(0,b[2]-cell)})
 out.append({'path':filename,'size':[im.width,im.height],'frames':frames})
print(json.dumps(out))
`;
const paths=kinds.flatMap(k=>[`${directory}/${k}.png`,`assets/overworld-living/common/markers/${k}.png`]);
for(const path of paths)if(!existsSync(path))throw new Error(`Missing ${path}`);
const measured=JSON.parse(run('python3',['-c',reader,...paths]));
const plans=kinds.map((kind,i)=>{
 const source=measured[2*i],staticImage=measured[2*i+1],rest=source.frames[0],target=staticImage.frames[0],staticHash=hash(staticImage.path);
 if(config.staticFrameZeroSha256[kind]!==staticHash)throw new Error(`${kind}: approved static changed`);
 const sx=(target.bounds[2]-target.bounds[0])/(rest.bounds[2]-rest.bounds[0]);
 const sy=(target.bounds[3]-target.bounds[1])/(rest.bounds[3]-rest.bounds[1]);
 const frames=source.frames.map((f,frame)=>{
  const x=16+target.tip[0]+(f.bounds[0]-f.tip[0])*sx,y=16+target.tip[1]+(f.bounds[1]-f.tip[1])*sy;
  const width=(f.bounds[2]-f.bounds[0])*sx,height=(f.bounds[3]-f.bounds[1])*sy;
  if(x<1||y<1||x+width>159||y+height>159)throw new Error(`${kind} frame${frame}: motion exceeds160pxcanvas ${JSON.stringify({x,y,width,height})}`);
  return {...f,frame,sourceRect:[f.origin[0]+f.bounds[0]-1,f.origin[1]+f.bounds[1]-1,f.bounds[2]-f.bounds[0]+2,f.bounds[3]-f.bounds[1]+2],destinationRect:[x-sx,y-sy,width+2*sx,height+2*sy],registeredBounds:[x,y,x+width,y+height],registeredTip:[16+target.tip[0],16+target.tip[1]]};
 });
 return {kind,source:source.path,sourceSha256:hash(source.path),sourceSize:source.size,staticFrameZero:{path:staticImage.path,sha256:staticHash,...target},scale:[sx,sy],outputSize:[160,160],transparentPadding:16,quadScale:160/128,generatedZeroBoundsDelta:frames[0].registeredBounds.map((v,j)=>v-16-target.bounds[j]),frames};
});
if(!process.argv.includes('--write')){console.log(JSON.stringify({status:'analysis-only',plans},null,2));process.exit(0);}
const swift=String.raw`
import AppKit
import CoreGraphics
import ImageIO
let jobs = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String:Any]]
for job in jobs {
 let input = job["input"] as! String, output = job["output"] as! String
 let source = CGImageSourceCreateWithURL(URL(fileURLWithPath:input) as CFURL,nil)!
 let image = CGImageSourceCreateImageAtIndex(source,0,nil)!
 let c=job["sourceRect"] as! [Double],d=job["destinationRect"] as! [Double]
 guard let cropped=image.cropping(to:CGRect(x:c[0],y:c[1],width:c[2],height:c[3])) else {fatalError("Invalid crop")}
 let context=CGContext(data:nil,width:160,height:160,bitsPerComponent:8,bytesPerRow:160*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 context.clear(CGRect(x:0,y:0,width:160,height:160));context.interpolationQuality = .high
 context.draw(cropped,in:CGRect(x:d[0],y:160-d[1]-d[3],width:d[2],height:d[3]))
 let result=context.makeImage()!,rep=NSBitmapImageRep(cgImage:result)
 try rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output))
}
`;
const scratch=mkdtempSync(resolve(tmpdir(),'brigade-crest-animation-')),jobs=[],assets=[];
try{
 for(const plan of plans)for(const frame of plan.frames.slice(1)){
  const temporary=resolve(scratch,`${plan.kind}-${frame.frame}.png`),path=`assets/overworld-living/common/markers/animated/${plan.kind}-${frame.frame}.png`;
  jobs.push({input:resolve(plan.source),output:temporary,sourceRect:frame.sourceRect,destinationRect:frame.destinationRect});assets.push({path,temporary});
 }
 writeFileSync(resolve(scratch,'normalize.swift'),swift);writeFileSync(resolve(scratch,'jobs.json'),JSON.stringify(jobs));
 run('swift',[resolve(scratch,'normalize.swift'),resolve(scratch,'jobs.json')]);
 const outputs=JSON.parse(run('python3',['-c',reader,...assets.map(a=>a.temporary)]));
 for(const o of outputs)if(o.size[0]!==160||o.size[1]!==160)throw new Error('Wrong output dimensions');
 for(const a of assets){
  mkdirSync(dirname(a.path),{recursive:true});writeFileSync(a.path,readFileSync(a.temporary));
  const digest=createHash('sha256').update(`brigade-crest-animation:${a.path}`).digest('hex');
  const guid=`${digest.slice(0,8)}-${digest.slice(8,12)}-5${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
  const existing=existsSync(a.path+'.gmeta')?readFileSync(a.path+'.gmeta','utf8'):undefined;
  writeFileSync(a.path+'.gmeta',existing?existing.replace(/max_size = \d+/,'max_size = 160'):`guid = "${guid}"\nimporter = "texture"\n[settings]\nkind = "sprite"\natlas = "overworld-living-residents"\nfilter = "linear"\ncompression = "astc6x6"\ntrim = false\nmax_size = 160\n`);
 }
 for(const p of plans)if(hash(p.staticFrameZero.path)!==p.staticFrameZero.sha256)throw new Error('Static frame unexpectedly changed');
 writeFileSync(manifestPath,JSON.stringify({...config,status:'imported',preparation:'Read-only alpha analysis; native Swift CoreGraphics crop/scale/translation onto transparent160canvas. Per-frame lowest-shield-tip registration; one XYscale per kind. Approved128staticrest untouched.',plans,assets:assets.map(({path},i)=>({path,sha256:hash(path),size:[160,160],measured:outputs[i].frames[0]}))},null,2)+'\n');
 console.log(`Imported ${assets.length}160px motion drawings; approved128staticrest frames unchanged.`);
}finally{rmSync(scratch,{recursive:true,force:true});}
