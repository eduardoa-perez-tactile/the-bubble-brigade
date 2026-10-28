#!/usr/bin/env swift
// Mechanical import only: rectangular crop and downsample of generated RGBA art.
// Run from the engine project directory: swift tools/art/import-room-boundaries.swift
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let project = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = project.appendingPathComponent("docs/story-room-boundaries/art")
let target = project.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries")
try FileManager.default.createDirectory(at: target, withIntermediateDirectories: true)
struct Import {
    let name: String
    let file: String
    let box: CGRect
    let width: Int
    let height: Int
}
let imports: [Import] = [
    .init(name:"wall-stone", file:"wall-sheet.png", box:CGRect(x:85,y:0,width:152,height:1536),width:96,height:512),
    .init(name:"wall-timber", file:"wall-sheet.png", box:CGRect(x:330,y:0,width:150,height:1536),width:96,height:512),
    .init(name:"wall-pipe", file:"wall-sheet.png", box:CGRect(x:575,y:0,width:140,height:1536),width:96,height:512),
    .init(name:"wall-vegetation", file:"wall-sheet.png", box:CGRect(x:815,y:0,width:137,height:1536),width:96,height:512),
    .init(name:"foundation-stone", file:"foundation-sheet.png", box:CGRect(x:500,y:180,width:500,height:89),width:256,height:48),
    .init(name:"foundation-timber", file:"foundation-sheet.png", box:CGRect(x:400,y:355,width:640,height:134),width:256,height:48),
    .init(name:"foundation-pipe", file:"foundation-sheet.png", box:CGRect(x:320,y:573,width:800,height:165),width:256,height:48),
    .init(name:"foundation-vegetation", file:"foundation-sheet.png", box:CGRect(x:400,y:822,width:640,height:145),width:256,height:48),
    .init(name:"emitter-bubble", file:"emitter-source.png", box:CGRect(x:245,y:382,width:530,height:795),width:64,height:96),
]
var records: [[String:Any]] = []
for entry in imports {
    guard let original = CGImageSourceCreateWithURL(source.appendingPathComponent(entry.file) as CFURL,nil),
          let image = CGImageSourceCreateImageAtIndex(original,0,nil),
          let crop = image.cropping(to:entry.box),
          let context = CGContext(data:nil,width:entry.width,height:entry.height,bitsPerComponent:8,bytesPerRow:entry.width*4,
                                  space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)
    else { fatalError("Cannot import \(entry.name)") }
    context.interpolationQuality = .high
    context.draw(crop,in:CGRect(x:0,y:0,width:entry.width,height:entry.height))
    let output = target.appendingPathComponent(entry.name+".png")
    guard let result = context.makeImage(),let writer = CGImageDestinationCreateWithURL(output as CFURL,UTType.png.identifier as CFString,1,nil)
    else { fatalError("Cannot write \(entry.name)") }
    CGImageDestinationAddImage(writer,result,nil)
    guard CGImageDestinationFinalize(writer) else { fatalError("Write failed") }
    let bytes = try Data(contentsOf:output)
    records.append(["name":entry.name,"source":entry.file,"crop":[Int(entry.box.minX),Int(entry.box.minY),Int(entry.box.maxX),Int(entry.box.maxY)],"size":[entry.width,entry.height],"bytes":bytes.count,"sha256":SHA256.hash(data:bytes).map{String(format:"%02x",$0)}.joined()])
    print("\(entry.name): \(entry.width)×\(entry.height)")
}
let sources = try ["wall-sheet.png","foundation-sheet.png","emitter-source.png"].map { file -> [String:Any] in
    let data = try Data(contentsOf:source.appendingPathComponent(file))
    return ["file":file,"sha256":SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()]
}
let manifest: [String:Any] = ["generator":"built-in image_gen","import":"CoreGraphics rectangular crop and high-quality downsample only; preserve alpha, no redraw or keying","sources":sources,"assets":records]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:source.appendingPathComponent("import.json"))
