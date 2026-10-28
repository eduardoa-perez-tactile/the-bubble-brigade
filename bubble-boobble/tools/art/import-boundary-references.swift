#!/usr/bin/env swift
// Original reference geometry; imagegen alpha/decontamination only. Run from project root.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit
let project=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let destination=project.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries")
struct Pixels {let width:Int;let height:Int;let rgba:[UInt8]}
func read(_ url:URL)->Pixels {
 let src=CGImageSourceCreateWithURL(url as CFURL,nil)!,im=CGImageSourceCreateImageAtIndex(src,0,nil)!
 var data=[UInt8](repeating:0,count:im.width*im.height*4)
 data.withUnsafeMutableBytes { raw in
  let ctx=CGContext(data:raw.baseAddress,width:im.width,height:im.height,bitsPerComponent:8,bytesPerRow:im.width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(im,in:CGRect(x:0,y:0,width:im.width,height:im.height))
 }
 return Pixels(width:im.width,height:im.height,rgba:data)
}
func write(_ rgba:[UInt8],_ width:Int,_ height:Int,_ url:URL) {
 let provider=CGDataProvider(data:Data(rgba) as CFData)!
 let im=CGImage(width:width,height:height,bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGBitmapInfo(rawValue:CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.last.rawValue),provider:provider,decode:nil,shouldInterpolate:false,intent:.defaultIntent)!
 let dest=CGImageDestinationCreateWithURL(url as CFURL,UTType.png.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(dest,im,nil);precondition(CGImageDestinationFinalize(dest))
}
func sample(_ im:Pixels,_ x:Double,_ y:Double)->[Double] {
 guard x>=0 && y>=0 && x<Double(im.width-1) && y<Double(im.height-1)else{return[0,0,0,0]}
 let ix=Int(floor(x)),iy=Int(floor(y)),fx=x-Double(ix),fy=y-Double(iy)
 return(0..<4).map{c in
  func at(_ x:Int,_ y:Int)->Double{Double(im.rgba[(y*im.width+x)*4+c])}
  return(at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy
 }
}
func straight(_ value:[Double])->[UInt8] {
 let a=value[3]
 return(0..<3).map{UInt8(max(0,min(255,a>0 ? value[$0]*255/a:0)).rounded())}+[UInt8(max(0,min(255,a)).rounded())]
}
func hash(_ data:Data)->String{SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()}
struct Slice {let name:String;let box:[Int];let role:String;let side:String;var repeatY:Int=1}
try FileManager.default.createDirectory(at:destination,withIntermediateDirectories:true)
for family in ["pump","boat"] {
 let folder=project.appendingPathComponent("docs/story-room-boundaries/art-"+family+"-reference")
 let sourceURL=folder.appendingPathComponent("approved-reference.png"),source=read(sourceURL)
 let registrations=try JSONSerialization.jsonObject(with:Data(contentsOf:folder.appendingPathComponent("registration.json")))as![[String:Any]]
 var transforms=[String:[[Double]]]()
 for r in registrations{transforms[r["side"]as!String]=r["sourceToNormalizedGenerated"]as?[[Double]]}
 let generated=["left":read(folder.appendingPathComponent("left-generated.png")),"right":read(folder.appendingPathComponent("right-generated.png"))]
 let inputX=family=="pump" ? ["left":155,"right":1195]:["left":160,"right":1192]
 func registered(_ side:String,_ x:Int,_ y:Int)->[Double] {
  let mat=transforms[side]!,image=generated[side]!,lx=Double(x-inputX[side]!),ly=Double(y)
  let nx=mat[0][0]*lx+mat[0][1]*ly+mat[0][2],ny=mat[1][0]*lx+mat[1][1]*ly+mat[1][2]
  return sample(image,(nx+0.5)*Double(image.width)/320-0.5,(ny+0.5)*Double(image.height)/900-0.5)
 }
 var cleanTransforms=[String:[[Double]]](),cleanImages=[String:Pixels]()
 if family=="pump" {
  let cleanRows=try JSONSerialization.jsonObject(with:Data(contentsOf:folder.appendingPathComponent("clean-registration.json")))as![[String:Any]]
  for row in cleanRows{let side=row["side"]as!String;cleanTransforms[side]=row["sourceToNormalizedGenerated"]as?[[Double]];cleanImages[side]=read(folder.appendingPathComponent(side+"-clean.png"))}
 }
 func cleanRegistered(_ side:String,_ x:Int,_ y:Int)->[Double] {
  let m=cleanTransforms[side]!,im=cleanImages[side]!,lx=Double(x-inputX[side]!),ly=Double(y)
  let gx=m[0][0]*lx+m[0][1]*ly+m[0][2],gy=m[1][0]*lx+m[1][1]*ly+m[1][2]
  return sample(im,(gx+0.5)*Double(im.width)/320-0.5,(gy+0.5)*Double(im.height)/900-0.5)
 }
 // These are RGB blend weights, not opacity/contour edits. Keep source RGB exact
 // outside measured foreground/HUD occlusions; feather their boundaries locally.
 var repairWeights=[String:[Double]]()
 if family=="pump" {for side in ["left","right"] {
  var seeds=[Double](repeating:0,count:320*900)
  for y in 0..<900 {for x in 0..<320 {
   let sx=x+inputX[side]!,at=(y*source.width+sx)*4
   let r=Double(source.rgba[at]),g=Double(source.rgba[at+1]),b=Double(source.rgba[at+2])
   let gen=straight(registered(side,sx,y))
   let difference=abs(r-Double(gen[0]))+abs(g-Double(gen[1]))+abs(b-Double(gen[2]))
   let post=side=="left" ? (y>=725 && sx<450):(y>=810 && sx>1210)
   let darkPost=post && max(r,g,b)<160 && difference>120
   let actor=side=="left" && sx>=390 && y>=640 && y<778 && ((g>r*1.2 && g>b*1.2) || (r>180 && g>150 && b>110) || max(r,g,b)<65)
   let hud=side=="left" && sx<330 && y>=845 && r>180 && g>150 && b>110 && difference>50
   if darkPost || actor || hud{seeds[y*320+x]=1}
  }}
  var dilated=seeds
  for y in 0..<900 {for x in 0..<320 {
   var value=0.0
   for yy in max(0,y-2)...min(899,y+2){for xx in max(0,x-2)...min(319,x+2){value=max(value,seeds[yy*320+xx])}}
   dilated[y*320+x]=value
  }}
  var blurred=dilated
  for _ in 0..<2 {
   var horizontal=blurred,vertical=blurred
   for y in 0..<900 {for x in 0..<320 {
    var sum=0.0;for xx in max(0,x-3)...min(319,x+3){sum+=blurred[y*320+xx]}
    horizontal[y*320+x]=sum/Double(min(319,x+3)-max(0,x-3)+1)
   }}
   for y in 0..<900 {for x in 0..<320 {
    var sum=0.0;for yy in max(0,y-3)...min(899,y+3){sum+=horizontal[yy*320+x]}
    vertical[y*320+x]=sum/Double(min(899,y+3)-max(0,y-3)+1)
   }}
   blurred=vertical
  }
  let weights=zip(seeds,blurred).map{max($0.0,$0.1)}
  repairWeights[side]=weights
  var proof=[UInt8](repeating:255,count:320*900*4)
  for i in 0..<320*900{proof[i*4+3]=UInt8((weights[i]*255).rounded())}
  write(proof,320,900,folder.appendingPathComponent(side+"-rgb-repair-weights.png"))
 }}
 struct Curves {let end:Int;let generatedEnd:Int;let sc:[Double];let ss:[Double];let gc:[Double];let gs:[Double]}
 var filmData=[String:Curves]()
 if family=="boat" {
  let curves=try JSONSerialization.jsonObject(with:Data(contentsOf:folder.appendingPathComponent("film-curves.json")))as![[String:Any]]
  for r in curves{
   let src=r["source"]as![String:Any],gen=r["generatedNormalized"]as![String:Any]
   filmData[r["side"]as!String]=Curves(end:src["lastContinuousRow"]as!Int,generatedEnd:gen["lastContinuousRow"]as!Int,sc:src["centers"]as![Double],ss:src["separations"]as![Double],gc:gen["centers"]as![Double],gs:gen["separations"]as![Double])
  }
 }
 func film(_ side:String,_ x:Int,_ y:Int)->[UInt8] {
  let entry=filmData[side]!,end=entry.end,gend=entry.generatedEnd
  guard y<=end else{return[0,0,0,0]}
  let sc=entry.sc,ss=entry.ss,gc=entry.gc,gs=entry.gs
  let gy=Double(y)*Double(gend)/Double(end),yi=min(gend-1,Int(gy)),fy=gy-Double(yi)
  let center=gc[yi]*(1-fy)+gc[yi+1]*fy,sep=gs[yi]*(1-fy)+gs[yi+1]*fy
  let gx=center+(Double(x-inputX[side]!)-sc[y])*sep/max(1,ss[y]),im=generated[side]!
  return straight(sample(im,(gx+0.5)*Double(im.width)/320-0.5,(gy+0.5)*Double(im.height)/900-0.5))
 }
 let slices:[Slice]
 if family=="pump" {
  slices=[
   Slice(name:"profile-left-pump-reference",box:[155,0,475,898],role:"profile",side:"left"),
   Slice(name:"profile-right-pump-reference",box:[1195,0,1515,898],role:"profile",side:"right"),
   Slice(name:"shaft-left-pump-reference",box:[155,0,475,384],role:"shaft",side:"left",repeatY:8),
   Slice(name:"shaft-right-pump-reference",box:[1195,0,1515,384],role:"shaft",side:"right",repeatY:8),
   Slice(name:"floor-pump-reference",box:[344,777,1327,895],role:"floor",side:"center"),
   Slice(name:"floor-left-pump-reference",box:[344,777,562,895],role:"floor-left",side:"center"),
   Slice(name:"floor-center-pump-reference",box:[566,777,786,895],role:"floor-center",side:"center"),
   Slice(name:"floor-right-pump-reference",box:[1111,777,1327,895],role:"floor-right",side:"center"),
  ]
 }else{
  slices=[
   Slice(name:"film-left-boat-reference",box:[160,0,480,732],role:"film",side:"left"),
   Slice(name:"film-right-boat-reference",box:[1192,0,1512,732],role:"film",side:"right"),
   Slice(name:"emitter-left-boat-reference",box:[260,720,330,833],role:"emitter",side:"left"),
   Slice(name:"emitter-right-boat-reference",box:[1344,720,1414,833],role:"emitter",side:"right"),
   Slice(name:"floor-boat-reference",box:[325,777,1345,843],role:"floor",side:"center"),
   Slice(name:"floor-left-boat-reference",box:[325,777,489,843],role:"floor-left",side:"center"),
   Slice(name:"floor-center-boat-reference",box:[580,777,836,843],role:"floor-center",side:"center"),
   Slice(name:"floor-right-boat-reference",box:[1181,777,1345,843],role:"floor-right",side:"center"),
  ]
 }
 var records=[[String:Any]](),totalOriginalSolid=0,totalSolid=0
 for item in slices{
  let b=item.box,w=b[2]-b[0],h=b[3]-b[1]
  var rgba=[UInt8](repeating:0,count:w*h*4),bounds=[w,h,0,0],solid=0,originalSolid=0,translucent=0,visible=0
  var outsideCount=0,outsideExact=0,changedCount=0
  for y in 0..<h{for x in 0..<w{
   let sx=x+b[0],sy=b[1]+(item.repeatY>1 ? y%(h/item.repeatY):y),at=(sy*source.width+sx)*4,out=(y*w+x)*4
   var pixel=Array(source.rgba[at..<at+4]),isOriginal=true,allowedRepair=false
   if item.role=="profile" || item.role=="shaft" {
    let gen=registered(item.side,sx,sy);pixel[3]=UInt8(max(0,min(255,gen[3])).rounded())
    if item.repeatY==1 {
     let weight=repairWeights[item.side]![sy*320+sx-inputX[item.side]!],foreground=straight(gen)
     if weight>0{allowedRepair=true}
     for c in 0..<3{pixel[c]=UInt8((Double(pixel[c])*(1-weight)+Double(foreground[c])*weight).rounded())}
     // The side-platform obstruction is the only alpha patch; both alpha
     // alternatives come from the two registered imagegen extractions.
     let patch=item.side=="left" ? [368,635,460,712]:[1215,635,1305,712]
     if sx>=patch[0] && sx<patch[2] && sy>=patch[1] && sy<patch[3] {
      let edge=Double(min(sx-patch[0],patch[2]-1-sx,sy-patch[1],patch[3]-1-sy))
      let blend=min(1,max(0,edge/10)),clean=straight(cleanRegistered(item.side,sx,sy))
      if blend>0{allowedRepair=true}
      for c in 0..<4{pixel[c]=UInt8((Double(pixel[c])*(1-blend)+Double(clean[c])*blend).rounded())}
     }
     isOriginal=(0..<3).allSatisfy{pixel[$0]==source.rgba[at+$0]}
    }
   }else if item.role=="film"{pixel=film(item.side,sx,sy);isOriginal=false;allowedRepair=true
   }else if item.role=="emitter"{
    let gen=registered(item.side,sx,sy);pixel[3]=UInt8(max(0,min(255,gen[3])).rounded())
    if Int(pixel[1])+Int(pixel[2])>2*Int(pixel[0])+40 {
     let foreground=straight(gen);pixel[0]=foreground[0];pixel[1]=foreground[1];pixel[2]=foreground[2];isOriginal=false
     allowedRepair=true
    }
   }
   let sourceRGBEqual=(0..<3).allSatisfy{pixel[$0]==source.rgba[at+$0]}
   if !allowedRepair{outsideCount+=1;if sourceRGBEqual{outsideExact+=1}}
   if !sourceRGBEqual{changedCount+=1}
   if item.role != "film"{isOriginal=sourceRGBEqual}
   for c in 0..<4{rgba[out+c]=pixel[c]}
   if pixel[3]>=128{
    solid+=1;if isOriginal{originalSolid+=1}
    bounds[0]=min(bounds[0],x);bounds[1]=min(bounds[1],y);bounds[2]=max(bounds[2],x+1);bounds[3]=max(bounds[3],y+1)
   }
   if pixel[3]>=8{visible+=1;if pixel[3]<240{translucent+=1}}
  }}
  let url=destination.appendingPathComponent(item.name+".png");write(rgba,w,h,url);let bytes=try Data(contentsOf:url)
  var scans=[[String:Int]]()
  for globalY in [0,48,150,200,400,550,600,650,700,731,777,825,850,894]where globalY>=b[1] && globalY<b[3]{
   let y=globalY-b[1],active=(0..<w).filter{rgba[(y*w+$0)*4+3]>=128}
   if let first=active.first,let last=active.last{scans.append(["y":globalY,"left":b[0]+first,"rightExclusive":b[0]+last+1])}
  }
  var dest=b;if item.role=="shaft"{dest=[b[0],-h,b[2],0]}
  var row:[String:Any]=["name":item.name,"crop":b,"destinationSourceRect":dest,"size":[w,h],"role":item.role,"side":item.side,"alphaBounds128":bounds,"alphaClearance128":[bounds[0],bounds[1],w-bounds[2],h-bounds[3]],"scanlineDestinationSourceBounds128":scans,"bytes":bytes.count,"sha256":hash(bytes),"solidPixelCount":solid,"originalRGBSolidPixelCount":originalSolid,"originalRGBFraction":solid>0 ? Double(originalSolid)/Double(solid):1,"translucentVisibleFraction":visible>0 ? Double(translucent)/Double(visible):0]
  row["changedRGBPixelCount"]=changedCount;row["outsideDeclaredRepairPixelCount"]=outsideCount
  row["outsideDeclaredRepairOriginalRGBExactCount"]=outsideExact
  row["outsideDeclaredRepairOriginalRGBExactFraction"]=outsideCount>0 ? Double(outsideExact)/Double(outsideCount):1
  if item.role=="profile" {
   row["rgbRepairWeightMask"]=item.side+"-rgb-repair-weights.png"
   row["rgbRepairWeightMaskSourceFrame"]=[inputX[item.side]!,0,inputX[item.side]!+320,900]
   row["sidePlatformInpaintSourceRect"]=item.side=="left" ? [368,635,460,712]:[1215,635,1305,712]
   row["rgbRepairPolicy"]="source/generated difference>120 and max(sourceRGB)<160 in foreground base; actor/HUD color seeds; radius2 dilation, two radius3 box blurs; seeded core retained; RGB only"
   row["colorInpaintRegistration"]="clean-registration.json"
  }
  if item.role=="emitter"{row["glassRepairPredicate"]="sourceG+sourceB>2*sourceR+40";row["originalBrassRGBExactFraction"]=1}
  if item.repeatY>1{row["sourceBandRect"]=[b[0],b[1],b[2],b[1]+h/item.repeatY];row["repeatY"]=item.repeatY}
  row["operation"]=item.role=="film" ? "generated decontaminated RGBA registered to exact original double-outline center and spacing per row":item.role=="profile" ? "registered generated alpha over original RGB; small classified foreground/HUD occlusions repaired with registered generated foreground RGB":item.role=="emitter" ? "registered alpha with exact original brass RGB; decontaminated generated glass RGB":"exact original RGB; registered alpha only for repeated shafts"
  records.append(row)
  if item.role=="profile"{totalSolid+=solid;totalOriginalSolid+=originalSolid}
  print(item.name,w,h,"originalSolid",solid>0 ? Double(originalSolid)/Double(solid):1)
 }
 let anchors:[String:Int]=family=="pump" ? ["designLeftInnerFace":344,"designRightInnerFace":1327,"bodyLeftInnerFace":435,"bodyRightInnerFace":1237,"floorFeet":777]:["designLeftInnerFace":325,"designRightInnerFace":1345,"floorFeet":777,"emitterLeftCenter":294,"emitterRightCenter":1378]
 let manifest:[String:Any]=["family":family,"sourceCanvas":[1672,941],"prototypeWorldInnerWidth":960,"anchors":anchors,"source":"approved-reference.png","sourceSHA256":hash(try Data(contentsOf:sourceURL)),"registration":"registration.json","alphaCoverageThreshold":128,"alphaCoverageComparison":">=","originalRGBSolidFraction":totalSolid>0 ? Double(totalOriginalSolid)/Double(totalSolid):1,"assets":records]
 try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:folder.appendingPathComponent("import.json"))
}
