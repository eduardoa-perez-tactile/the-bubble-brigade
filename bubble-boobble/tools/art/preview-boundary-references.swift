import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
for family in ["pump","boat"] {
 let folder=root.appendingPathComponent("docs/story-room-boundaries/art-"+family+"-reference")
 let manifest=try JSONSerialization.jsonObject(with:Data(contentsOf:folder.appendingPathComponent("import.json")))as![String:Any]
 let rows=manifest["assets"]as![[String:Any]]
 let canvas=CGContext(data:nil,width:1672,height:941,bitsPerComponent:8,bytesPerRow:1672*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 canvas.setFillColor(CGColor(red:0.24,green:0.24,blue:0.24,alpha:1));canvas.fill(CGRect(x:0,y:0,width:1672,height:941))
 for role in ["profile","film","floor","emitter"] {
  for row in rows where row["role"]as!String==role {
   let name=row["name"]as!String,b=row["destinationSourceRect"]as![Int]
   let imageSource=CGImageSourceCreateWithURL(root.appendingPathComponent("assets/cartoon/reconstruction/environment/boundaries/"+name+".png")as CFURL,nil)!
   let image=CGImageSourceCreateImageAtIndex(imageSource,0,nil)!
   canvas.draw(image,in:CGRect(x:b[0],y:941-b[3],width:b[2]-b[0],height:b[3]-b[1]))
   let isolated=CGContext(data:nil,width:image.width,height:image.height,bitsPerComponent:8,bytesPerRow:image.width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
   isolated.setFillColor(CGColor(red:0.24,green:0.24,blue:0.24,alpha:1));isolated.fill(CGRect(x:0,y:0,width:image.width,height:image.height))
   isolated.draw(image,in:CGRect(x:0,y:0,width:image.width,height:image.height))
   let writer=CGImageDestinationCreateWithURL(folder.appendingPathComponent(name+"-preview.png")as CFURL,UTType.png.identifier as CFString,1,nil)!
   CGImageDestinationAddImage(writer,isolated.makeImage()!,nil);CGImageDestinationFinalize(writer)
  }
 }
 let writer=CGImageDestinationCreateWithURL(folder.appendingPathComponent("assembled-preview.png")as CFURL,UTType.png.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(writer,canvas.makeImage()!,nil);CGImageDestinationFinalize(writer)
}
