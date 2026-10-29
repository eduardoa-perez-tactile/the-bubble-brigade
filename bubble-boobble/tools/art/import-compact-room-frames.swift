#!/usr/bin/env swift
// Deterministic source-coordinate slicing only. Run from bubble-boobble/.
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let output=root.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries")
func sha(_ d:Data)->String{SHA256.hash(data:d).map{String(format:"%02x",$0)}.joined()}
func load(_ u:URL)->CGImage{CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(u as CFURL,nil)!,0,nil)!}
func save(_ im:CGImage,_ u:URL){let d=CGImageDestinationCreateWithURL(u as CFURL,UTType.png.identifier as CFString,1,nil)!;CGImageDestinationAddImage(d,im,nil);precondition(CGImageDestinationFinalize(d))}
func pixels(_ im:CGImage)->[UInt8]{var p=[UInt8](repeating:0,count:im.width*im.height*4);p.withUnsafeMutableBytes{b in let c=CGContext(data:b.baseAddress,width:im.width,height:im.height,bitsPerComponent:8,bytesPerRow:im.width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.premultipliedLast.rawValue)!;c.draw(im,in:CGRect(x:0,y:0,width:im.width,height:im.height))};return p}
func fromPixels(_ p:[UInt8],_ w:Int,_ h:Int)->CGImage{CGImage(width:w,height:h,bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:w*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGBitmapInfo(rawValue:CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.premultipliedLast.rawValue),provider:CGDataProvider(data:Data(p) as CFData)!,decode:nil,shouldInterpolate:false,intent:.defaultIntent)!}
struct Piece{let stem:String;let box:[Int];let role:String;let side:String;var repeatY:Int=1}
for family in ["parcel","garden"] {
 let dir=root.appendingPathComponent("docs/compact-room-prototypes/art-\(family)-reference"),sourceURL=dir.appendingPathComponent("source-master.png"),im=load(sourceURL)
 precondition(im.width==1672 && im.height==941)
 let left=family=="parcel" ? 318:310,right=family=="parcel" ? 1355:1363,feet=family=="parcel" ? 761:777,bottom=family=="parcel" ? 895:891,band=32
 let pieces=[Piece(stem:"profile-left",box:[0,0,350,bottom],role:"profile",side:"left"),Piece(stem:"profile-right",box:[1320,0,1672,bottom],role:"profile",side:"right"),Piece(stem:"shaft-left",box:[0,0,350,band*8],role:"shaft",side:"left",repeatY:8),Piece(stem:"shaft-right",box:[1320,0,1672,band*8],role:"shaft",side:"right",repeatY:8),Piece(stem:"floor",box:[left,feet,right,bottom],role:"floor",side:"center")]
 var rows=[[String:Any]](),totalPNG=0,totalRGBA=0
 for item in pieces {
  let b=item.box,w=b[2]-b[0],h=b[3]-b[1],name="\(item.stem)-\(family)-reference",url=output.appendingPathComponent(name+".png")
  let cropH=item.repeatY>1 ? band:h
  let crop=im.cropping(to:CGRect(x:b[0],y:b[1],width:w,height:cropH))!
  var result=crop
  if item.repeatY>1 {let p=pixels(crop);var tiled=[UInt8]();for _ in 0..<item.repeatY{tiled.append(contentsOf:p)};result=fromPixels(tiled,w,h)}
  save(result,url);let data=try Data(contentsOf:url),p=pixels(result)
  var bounds=[w,h,0,0],solid=0
  for y in 0..<h{for x in 0..<w where p[(y*w+x)*4+3]>=128{solid+=1;bounds[0]=min(bounds[0],x);bounds[1]=min(bounds[1],y);bounds[2]=max(bounds[2],x+1);bounds[3]=max(bounds[3],y+1)}}
  var scans=[[String:Int]]();for y in [0,24,150,200,400,600,700,feet,bottom-1] where y<h{let xs=(0..<w).filter{p[(y*w+$0)*4+3]>=128};if let f=xs.first,let l=xs.last{scans.append(["y":y+b[1],"left":f+b[0],"rightExclusive":l+b[0]+1])}}
  var row:[String:Any]=["name":name,"crop":b,"destinationSourceRect":item.role=="shaft" ? [b[0],-h,b[2],0]:b,"size":[w,h],"role":item.role,"side":item.side,"alphaBounds128":bounds,"alphaClearance128":[bounds[0],bounds[1],w-bounds[2],h-bounds[3]],"scanlineDestinationSourceBounds128":scans,"solidPixelCount":solid,"bytes":data.count,"rgbaBytes":w*h*4,"sha256":sha(data),"operation":"exact generated master crop; preserved generated alpha; no painted masks or nonuniform scaling"]
  if item.role=="profile" {
   func regionBounds(_ limit:Int)->[Int]{var q=[w,limit,0,0];for y in 0..<limit{for x in 0..<w where p[(y*w+x)*4+3]>=128{q[0]=min(q[0],x);q[1]=min(q[1],y);q[2]=max(q[2],x+1);q[3]=max(q[3],y+1)}};return q}
   let edge=item.side=="left" ? w-1:0,edgeRows=(0..<h).filter{p[($0*w+edge)*4+3]>=128},aboveLimit=min(h,feet-b[1]),above=regionBounds(aboveLimit)
   row["alphaBoundsAboveFloor128"]=above;row["alphaClearanceAboveFloor128"]=[above[0],above[1],w-above[2],aboveLimit-above[3]]
   if let first=edgeRows.first,let last=edgeRows.last {
    row["firstInnerEdgeSolidSourceY"]=first+b[1];row["lastInnerEdgeSolidSourceY"]=last+b[1]
    let clean=regionBounds(first);row["floorJoinTopSourceY"]=first+b[1];row["alphaBoundsAboveFloorJoin128"]=clean;row["alphaClearanceAboveFloorJoin128"]=[clean[0],clean[1],w-clean[2],first-clean[3]]
   }
  }
  if item.repeatY>1{row["repeatY"]=item.repeatY;row["sourceBandRect"]=[b[0],0,b[2],band];row["operation"]="eight identical stored RGBA bands from plain top32 source rows; alpha source-exact; premultiplied PNG roundtrip quantizes source RGB by up to2 levels; no geometric resampling"}
  rows.append(row);totalPNG+=data.count;totalRGBA+=w*h*4
  let meta=url.appendingPathExtension("gmeta")
  if !FileManager.default.fileExists(atPath:meta.path){try "guid = \"\(UUID().uuidString.lowercased())\"\nimporter = \"texture\"\n\n[settings]\nkind = \"sprite\"\natlas = \"compact-room-\(family)\"\nfilter = \"linear\"\ncompression = \"none\"\ntrim = false\n".write(to:meta,atomically:true,encoding:.utf8)}
 }
 var gray=[UInt8](repeating:160,count:im.width*im.height*4);let original=pixels(im)
 for i in 0..<im.width*im.height{let a=Int(original[i*4+3]);for c in 0..<3{gray[i*4+c]=UInt8(min(255,Int(original[i*4+c])+160*(255-a)/255))};gray[i*4+3]=255}
 save(fromPixels(gray,im.width,im.height),dir.appendingPathComponent("source-gray-preview.png"))
 let manifest:[String:Any]=["family":family,"sourceCanvas":[im.width,im.height],"prototypeWorldInnerWidth":960,"anchors":["designLeftInnerFace":left,"designRightInnerFace":right,"floorFeet":feet],"source":"source-master.png","sourceSHA256":sha(try Data(contentsOf:sourceURL)),"alphaCoverageThreshold":128,"alphaCoverageComparison":">=","designStatus":"new unapproved compact-room proposal; actual engine capture required","atlas":"compact-room-\(family)","runtimePNGBytes":totalPNG,"runtimeRGBABytes":totalRGBA,"assets":rows]
 try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:dir.appendingPathComponent("import.json"),options:.atomic)
 print(family,"PNG",totalPNG,"RGBA",totalRGBA,"anchors",left,right,feet)
}
