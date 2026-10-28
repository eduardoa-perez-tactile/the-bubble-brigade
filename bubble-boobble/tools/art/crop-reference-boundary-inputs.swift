import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
for(family,leftX,rightX)in[("pump",155,1195),("boat",160,1192)] {
 let folder=root.appendingPathComponent("docs/story-room-boundaries/art-"+family+"-reference")
 let source=CGImageSourceCreateWithURL(folder.appendingPathComponent("approved-reference.png") as CFURL,nil)!
 let image=CGImageSourceCreateImageAtIndex(source,0,nil)!
 for(side,x)in[("left",leftX),("right",rightX)] {
  let crop=image.cropping(to:CGRect(x:x,y:0,width:320,height:900))!
  let writer=CGImageDestinationCreateWithURL(folder.appendingPathComponent(side+"-input.png") as CFURL,UTType.png.identifier as CFString,1,nil)!
  CGImageDestinationAddImage(writer,crop,nil);CGImageDestinationFinalize(writer)
 }
}
