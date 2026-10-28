#!/usr/bin/env swift
// Mechanical import only: rectangular crop and downsample of generated RGBA art.
// Run from the engine project directory: swift tools/art/import-room-boundaries-v2.swift
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let project = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = project.appendingPathComponent("docs/story-room-boundaries/art-v2")
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
    .init(name:"base-stone-v2",file:"architecture-sheet.png",box:CGRect(x:35,y:369,width:310,height:334),width:192,height:224),
    .init(name:"base-timber-v2",file:"architecture-sheet.png",box:CGRect(x:430,y:444,width:288,height:259),width:192,height:224),
    .init(name:"base-pipe-v2",file:"architecture-sheet.png",box:CGRect(x:796,y:280,width:309,height:423),width:192,height:224),
    .init(name:"base-vegetation-v2",file:"architecture-sheet.png",box:CGRect(x:1171,y:369,width:309,height:334),width:192,height:224),
    .init(name:"collar-stone-v2",file:"architecture-sheet.png",box:CGRect(x:35,y:790,width:310,height:113),width:192,height:64),
    .init(name:"collar-timber-v2",file:"architecture-sheet.png",box:CGRect(x:430,y:790,width:288,height:113),width:192,height:64),
    .init(name:"collar-pipe-v2",file:"architecture-sheet.png",box:CGRect(x:796,y:794,width:309,height:109),width:192,height:64),
    .init(name:"collar-vegetation-v2",file:"architecture-sheet.png",box:CGRect(x:1171,y:790,width:309,height:113),width:192,height:64),
    .init(name:"bubble-sheen-v2",file:"bubble-source.png",box:CGRect(x:130,y:0,width:316,height:2172),width:96,height:512),
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
let sources = try ["architecture-sheet.png","bubble-source.png"].map { file -> [String:Any] in
    let data = try Data(contentsOf:source.appendingPathComponent(file))
    return ["file":file,"sha256":SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()]
}
let manifest: [String:Any] = ["generator":"built-in image_gen","import":"CoreGraphics rectangular crop and high-quality downsample only; preserve alpha, no redraw or keying","sources":sources,"assets":records]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:source.appendingPathComponent("import.json"))
