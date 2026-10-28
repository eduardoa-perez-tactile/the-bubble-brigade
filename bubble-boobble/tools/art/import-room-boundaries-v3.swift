#!/usr/bin/env swift
// Mechanical import only: rectangular crop and downsample of generated RGBA art.
// Run from the engine project directory: swift tools/art/import-room-boundaries-v3.swift
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let project = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = project.appendingPathComponent("docs/story-room-boundaries/art-v3")
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
    // Both crops use exactly the same horizontal coordinate frame and scale.
    // Output integer rounding differs from uniform scale by less than 0.1%.
    .init(name:"column-stone-v3",file:"column-extraction.png",box:CGRect(x:196,y:16,width:380,height:1950),width:187,height:960),
    .init(name:"shaft-stone-v3",file:"column-extraction.png",box:CGRect(x:196,y:500,width:380,height:520),width:187,height:256),
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
let sources = try ["column-extraction.png"].map { file -> [String:Any] in
    let data = try Data(contentsOf:source.appendingPathComponent(file))
    return ["file":file,"sha256":SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()]
}
let manifest: [String:Any] = ["generator":"built-in image_gen","import":"CoreGraphics rectangular crop and high-quality downsample only; preserve alpha, no redraw or keying","sources":sources,"assets":records]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:source.appendingPathComponent("import.json"))
