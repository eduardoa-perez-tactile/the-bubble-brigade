import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
for name in ["column-left-upper-stone-v5","column-left-lower-stone-v5","column-right-stone-v5","shaft-left-stone-v5","shaft-right-stone-v5"] {
 let source=CGImageSourceCreateWithURL(root.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries/"+name+".png") as CFURL,nil)!
 let image=CGImageSourceCreateImageAtIndex(source,0,nil)!
 let context=CGContext(data:nil,width:image.width,height:image.height,bitsPerComponent:8,bytesPerRow:image.width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 context.setFillColor(CGColor(red:0.24,green:0.24,blue:0.24,alpha:1));context.fill(CGRect(x:0,y:0,width:image.width,height:image.height))
 context.draw(image,in:CGRect(x:0,y:0,width:image.width,height:image.height))
 let dest=CGImageDestinationCreateWithURL(root.appendingPathComponent("docs/story-room-boundaries/art-v5/"+name+"-preview.png") as CFURL,UTType.png.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(dest,context.makeImage()!,nil);CGImageDestinationFinalize(dest)
}
// Mechanical assembly QA in the original left-input source coordinate frame.
let art=root.appendingPathComponent("docs/story-room-boundaries/art-v5")
let data=try Data(contentsOf:art.appendingPathComponent("import.json"))
let manifest=try JSONSerialization.jsonObject(with:data) as! [String:Any]
let assets=manifest["assets"] as! [[String:Any]]
let context=CGContext(data:nil,width:320,height:880,bitsPerComponent:8,bytesPerRow:320*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
context.setFillColor(CGColor(red:0.24,green:0.24,blue:0.24,alpha:1));context.fill(CGRect(x:0,y:0,width:320,height:880))
let ordered=assets.filter{($0["name"] as! String).contains("repair")}+assets.filter{($0["name"] as! String).hasPrefix("column-left")}
for row in ordered {
 let name=row["name"] as! String,box=row["destinationSourceRect"] as! [Int]
 let source=CGImageSourceCreateWithURL(root.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries/"+name+".png") as CFURL,nil)!
 let image=CGImageSourceCreateImageAtIndex(source,0,nil)!
 context.draw(image,in:CGRect(x:box[0]-130,y:880-box[3],width:box[2]-box[0],height:box[3]-box[1]))
}
let assembly=CGImageDestinationCreateWithURL(art.appendingPathComponent("left-assembled-preview.png") as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(assembly,context.makeImage()!,nil);CGImageDestinationFinalize(assembly)
