import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let sourceURL=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("docs/story-room-boundaries/art-v4/approved-lighthouse-mockup.png")
let target=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("docs/story-room-boundaries/art-v5")
let source=CGImageSourceCreateWithURL(sourceURL as CFURL,nil)!
let image=CGImageSourceCreateImageAtIndex(source,0,nil)!
for(name,box)in[("left-input",CGRect(x:130,y:0,width:320,height:880)),("right-input",CGRect(x:1240,y:0,width:320,height:880))]{
 let crop=image.cropping(to:box)!
 let destination=CGImageDestinationCreateWithURL(target.appendingPathComponent(name+".png") as CFURL,UTType.png.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(destination,crop,nil);CGImageDestinationFinalize(destination)
}
