#!/usr/bin/env swift
// Original RGB plus imagegen-derived, feature-registered alpha only.
// Run from the engine project directory: swift tools/art/import-room-boundaries-v5.swift
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let project=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let art=project.appendingPathComponent("docs/story-room-boundaries/art-v5")
let reference=project.appendingPathComponent("docs/story-room-boundaries/art-v4/approved-lighthouse-mockup.png")
let output=project.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries")
struct Pixels { let width:Int;let height:Int;let rgba:[UInt8] }
func read(_ url:URL)->Pixels {
    let source=CGImageSourceCreateWithURL(url as CFURL,nil)!
    let image=CGImageSourceCreateImageAtIndex(source,0,nil)!
    var bytes=[UInt8](repeating:0,count:image.width*image.height*4)
    bytes.withUnsafeMutableBytes { raw in
        let info=CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.premultipliedLast.rawValue
        let context=CGContext(data:raw.baseAddress,width:image.width,height:image.height,bitsPerComponent:8,bytesPerRow:image.width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:info)!
        context.draw(image,in:CGRect(x:0,y:0,width:image.width,height:image.height))
    }
    return Pixels(width:image.width,height:image.height,rgba:bytes)
}
func write(_ bytes:[UInt8],_ width:Int,_ height:Int,_ url:URL) {
    let data=Data(bytes) as CFData
    let provider=CGDataProvider(data:data)!
    // Straight alpha: store the original source RGB without premultiplication or recoloring.
    let info=CGBitmapInfo(rawValue:CGBitmapInfo.byteOrder32Big.rawValue|CGImageAlphaInfo.last.rawValue)
    let image=CGImage(width:width,height:height,bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:info,provider:provider,decode:nil,shouldInterpolate:false,intent:.defaultIntent)!
    let writer=CGImageDestinationCreateWithURL(url as CFURL,UTType.png.identifier as CFString,1,nil)!
    CGImageDestinationAddImage(writer,image,nil)
    precondition(CGImageDestinationFinalize(writer))
}
func alpha(_ pixels:Pixels,_ x:Double,_ y:Double)->Double {
    guard x>=0 && y>=0 && x<Double(pixels.width-1) && y<Double(pixels.height-1) else { return 0 }
    let ix=Int(floor(x)),iy=Int(floor(y)),fx=x-Double(ix),fy=y-Double(iy)
    func at(_ x:Int,_ y:Int)->Double { Double(pixels.rgba[(y*pixels.width+x)*4+3]) }
    return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy
}
let source=read(reference)
let rawRegistration=try JSONSerialization.jsonObject(with:Data(contentsOf:art.appendingPathComponent("registration.json"))) as! [[String:Any]]
var transforms=[String:[[Double]]]()
for row in rawRegistration { transforms[row["side"] as! String]=row["sourceToNormalizedGenerated"] as? [[Double]] }
let generated=["left":read(art.appendingPathComponent("left-generated-mask.png")),"right":read(art.appendingPathComponent("right-generated-mask.png"))]
struct Slice {
    let name:String;let crop:[Int];let destination:[Int];let side:String?
}
let slices=[
    Slice(name:"column-left-upper-stone-v5",crop:[130,0,450,678],destination:[130,0,450,678],side:"left"),
    Slice(name:"column-left-lower-stone-v5",crop:[210,678,450,855],destination:[210,678,450,855],side:"left"),
    Slice(name:"column-right-stone-v5",crop:[1240,0,1560,855],destination:[1240,0,1560,855],side:"right"),
    Slice(name:"moulding-repair-left-stone-v5",crop:[210,678,286,736],destination:[144,678,220,736],side:"left"),
    Slice(name:"foot-repair-left-stone-v5",crop:[210,736,286,855],destination:[144,736,220,855],side:"left"),
]
try FileManager.default.createDirectory(at:output,withIntermediateDirectories:true)
var records=[[String:Any]]()
var outputCoverage=[(slice:Slice,bytes:[UInt8],width:Int,height:Int)]()
let scanRows=[0,42,70,104,150,200,400,600,677,678,684,692,700,727,735,736,800,850,854]
for slice in slices {
    let box=slice.crop,width=box[2]-box[0],height=box[3]-box[1]
    var result=[UInt8](repeating:0,count:width*height*4)
    for y in 0..<height { for x in 0..<width {
        let sx=x+box[0],sy=y+box[1],si=(sy*source.width+sx)*4,di=(y*width+x)*4
        result[di]=source.rgba[si];result[di+1]=source.rgba[si+1];result[di+2]=source.rgba[si+2]
        if let side=slice.side {
            // Alpha follows destination geometry; RGB follows the visible original source crop.
            let maskSourceX=x+slice.destination[0],maskSourceY=y+slice.destination[1]
            let localX=Double(maskSourceX-(side=="left" ? 130:1240)),localY=Double(maskSourceY)
            let matrix=transforms[side]!,mask=generated[side]!
            let nx=matrix[0][0]*localX+matrix[0][1]*localY+matrix[0][2]
            let ny=matrix[1][0]*localX+matrix[1][1]*localY+matrix[1][2]
            let gx=(nx+0.5)*Double(mask.width)/320-0.5
            let gy=(ny+0.5)*Double(mask.height)/880-0.5
            result[di+3]=UInt8(max(0,min(255,alpha(mask,gx,gy))).rounded())
        } else { result[di+3]=source.rgba[si+3] }
    }}
    let url=output.appendingPathComponent(slice.name+".png")
    write(result,width,height,url)
    let bytes=try Data(contentsOf:url)
    var bounds=[width,height,0,0]
    for y in 0..<height { for x in 0..<width where result[(y*width+x)*4+3]>=128 {
        bounds[0]=min(bounds[0],x);bounds[1]=min(bounds[1],y);bounds[2]=max(bounds[2],x+1);bounds[3]=max(bounds[3],y+1)
    }}
    var scans=[[String:Int]]()
    for sourceY in scanRows where sourceY>=slice.destination[1] && sourceY<slice.destination[3] {
        let y=sourceY-slice.destination[1]
        let active=(0..<width).filter{result[(y*width+$0)*4+3]>=128}
        if let first=active.first,let last=active.last {
            scans.append(["y":sourceY,"left":slice.destination[0]+first,"rightExclusive":slice.destination[0]+last+1])
        }
    }
    records.append(["name":slice.name,"crop":slice.crop,"destinationSourceRect":slice.destination,"size":[width,height],"operation":slice.name.contains("repair") ? "original visible source RGB translated uniformly; registered imagegen alpha sampled at destination source coordinates":"exact original RGB; imagegen alpha only, feature registered","maskSide":slice.side ?? "none","alphaBounds128":bounds,"alphaClearance128":[bounds[0],bounds[1],width-bounds[2],height-bounds[3]],"scanlineDestinationSourceBounds128":scans,"bytes":bytes.count,"sha256":SHA256.hash(data:bytes).map{String(format:"%02x",$0)}.joined()])
    outputCoverage.append((slice,result,width,height))
    print("\(slice.name): \(width)×\(height)")
}
func compositedAlpha(_ x:Int,_ y:Int)->Int {
    var combined=0.0
    for item in outputCoverage {
        let d=item.slice.destination
        if x>=d[0] && x<d[2] && y>=d[1] && y<d[3] {
            let a=Double(item.bytes[((y-d[1])*item.width+x-d[0])*4+3])
            combined=255-(255-combined)*(255-a)/255
        }
    }
    return Int(combined.rounded())
}
let samplePoints:[(String,Int,Int)]=[
    ("left-body-plane",380,400),("right-body-plane",1295,400),
    ("left-upper-inner-return",398,150),("right-upper-inner-return",1278,150),
    ("left-outer-shoulder",148,692),("left-lower-shoulder-tip",146,727),
    ("left-base-outside",147,800),("left-base-visible-front",160,800),("right-outer-shoulder",1515,692),
]
let samples=samplePoints.map { name,x,y -> [String:Any] in
    return ["name":name,"x":x,"y":y,"compositedAlpha":compositedAlpha(x,y)]
}
let bodyCues=[("left",375),("right",1297)].map { side,x -> [String:Any] in
    let values=(0...777).map{compositedAlpha(x,$0)}
    let minimum=values.min()!
    return ["side":side,"x":x,"yStart":0,"yEndExclusive":778,"minimumAlpha":minimum,"lowestAtY":values.firstIndex(of:minimum)!,"allAtLeast128":minimum>=128]
}
let manifest:[String:Any]=["sourceCanvas":[1672,941],"anchors":["designLeftInnerFace":387,"designRightInnerFace":1285,"floorFeet":777],"source":"../art-v4/approved-lighthouse-mockup.png","sourceSHA256":SHA256.hash(data:try Data(contentsOf:reference)).map{String(format:"%02x",$0)}.joined(),"alphaGeneration":"built-in image_gen background extraction; generated RGB discarded","alphaCoverageThreshold":128,"alphaCoverageComparison":">=","registration":"registration.json","destinationSourceAlphaSamples":samples,"continuousBodyCueAlpha":bodyCues,"assets":records]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:art.appendingPathComponent("import.json"))
