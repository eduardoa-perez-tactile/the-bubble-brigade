#!/usr/bin/env swift
// Exact approved-source slicing only: rectangular crop; no resampling or redraw.
// Run from the engine project directory: swift tools/art/import-room-boundaries-v4.swift
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import CryptoKit

let project = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let source = project.appendingPathComponent("docs/story-room-boundaries/art-v4")
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
    .init(name:"floor-stone-v4",file:"approved-lighthouse-mockup.png",box:CGRect(x:387,y:777,width:898,height:77),width:898,height:77),
]
var records: [[String:Any]] = []
for entry in imports {
    guard let original = CGImageSourceCreateWithURL(source.appendingPathComponent(entry.file) as CFURL,nil),
          let image = CGImageSourceCreateImageAtIndex(original,0,nil),
          let crop = image.cropping(to:entry.box)
    else { fatalError("Cannot import \(entry.name)") }
    let output = target.appendingPathComponent(entry.name+".png")
    guard let writer = CGImageDestinationCreateWithURL(output as CFURL,UTType.png.identifier as CFString,1,nil)
    else { fatalError("Cannot write \(entry.name)") }
    // Export the original CGImage crop directly: no resampling, redraw or alpha changes.
    CGImageDestinationAddImage(writer,crop,nil)
    guard CGImageDestinationFinalize(writer) else { fatalError("Write failed") }
    let bytes = try Data(contentsOf:output)
    records.append(["name":entry.name,"source":entry.file,"crop":[Int(entry.box.minX),Int(entry.box.minY),Int(entry.box.maxX),Int(entry.box.maxY)],"size":[entry.width,entry.height],"bytes":bytes.count,"sha256":SHA256.hash(data:bytes).map{String(format:"%02x",$0)}.joined()])
    print("\(entry.name): \(entry.width)×\(entry.height)")
}
let sources = try ["approved-lighthouse-mockup.png"].map { file -> [String:Any] in
    let data = try Data(contentsOf:source.appendingPathComponent(file))
    return ["file":file,"sha256":SHA256.hash(data:data).map{String(format:"%02x",$0)}.joined()]
}
let manifest: [String:Any] = ["generator":"Original approved mockup; deterministic slicing only","import":"Exact rectangular CGImage crop only; no resampling, painting, alpha mask, keying or redraw","sources":sources,"sourceCanvas":[1672,941],"anchors":["commonLeftInnerFace":380,"commonRightInnerFace":1295,"floorFeet":777,"designLeftInnerFace":387,"designRightInnerFace":1285],"assets":records]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:source.appendingPathComponent("import.json"))
