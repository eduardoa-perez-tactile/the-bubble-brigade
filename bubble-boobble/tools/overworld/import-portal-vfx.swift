// Crop/resample generated VFX only. Never changes map paintings.
import AppKit
import ImageIO
import CryptoKit
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let input=root.appendingPathComponent("tools/overworld/portal-vfx-sources/wisps-sheet.png")
let sheet=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(input as CFURL,nil)!,0,nil)!
let output=root.appendingPathComponent("assets/overworld-living/common/portal-vfx")
try FileManager.default.createDirectory(at:output,withIntermediateDirectories:true)
var frames:[CGImage]=[]
for index in 0..<6 {
    let tile=sheet.cropping(to:CGRect(x:index%3*512,y:index/3*512,width:512,height:512))!
    let c=CGContext(data:nil,width:128,height:128,bitsPerComponent:8,bytesPerRow:512,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
    c.interpolationQuality = .high;c.draw(tile,in:CGRect(x:0,y:0,width:128,height:128))
    let image=c.makeImage()!;frames.append(image)
    let url=output.appendingPathComponent("wisp-\(index).png")
    let png=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!
    CGImageDestinationAddImage(png,image,nil);CGImageDestinationFinalize(png)
    let hash=SHA256.hash(data:Data(("brigade-portal-vfx-\(index)").utf8)).map{String(format:"%02x",$0)}.joined()
    let guid="\(hash.prefix(8))-\(hash.dropFirst(8).prefix(4))-5\(hash.dropFirst(13).prefix(3))-a\(hash.dropFirst(17).prefix(3))-\(hash.dropFirst(20).prefix(12))"
    try "guid = \"\(guid)\"\nimporter = \"texture\"\n[settings]\nkind = \"sprite\"\natlas = \"overworld-living-residents\"\nfilter = \"linear\"\ncompression = \"astc6x6\"\ntrim = false\nmax_size = 128\n".write(to:URL(fileURLWithPath:url.path+".gmeta"),atomically:true,encoding:.utf8)
}
let gif=CGImageDestinationCreateWithURL(root.appendingPathComponent("tools/overworld/portal-vfx-sources/preview.gif") as CFURL,"com.compuserve.gif" as CFString,6,nil)!
CGImageDestinationSetProperties(gif,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFLoopCount:0]] as CFDictionary)
for image in frames {CGImageDestinationAddImage(gif,image,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFDelayTime:1.0/6]] as CFDictionary)}
CGImageDestinationFinalize(gif)
print("Imported six 128px VFX frames; original portal artwork untouched.")
