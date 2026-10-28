// Reproducible VFX-native light masks. No repainting or generated scenery:
// shaped illumination is clipped to separately reviewed source-space masks.
import Foundation
import CoreGraphics
import ImageIO
import CryptoKit

let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let configURL=root.appendingPathComponent("tools/overworld/portal-light/masks.json")
let config=try JSONSerialization.jsonObject(with:Data(contentsOf:configURL)) as! [String:Any]
let districts=config["districts"] as! [[String:Any]]
func clamp(_ v:Double)->Double {max(0,min(1,v))}
func smooth(_ v:Double)->Double {let t=clamp(v);return t*t*(3-2*t)}
func distanceToEdge(_ x:Double,_ y:Double,_ points:[[Double]])->Double {
    var distance=Double.infinity,inside=false
    for i in points.indices {
        let a=points[i],b=points[(i+1)%points.count]
        if (a[1]>y) != (b[1]>y),x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0] {inside.toggle()}
        let dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/max(0.0001,dx*dx+dy*dy))
        distance=min(distance,hypot(x-a[0]-t*dx,y-a[1]-t*dy))
    }
    return inside ? distance : -distance
}
func hash(_ url:URL)throws->String {SHA256.hash(data:try Data(contentsOf:url)).map{String(format:"%02x",$0)}.joined()}
var outputs:[[String:Any]]=[]
for district in districts {
    let id=district["id"] as! String
    for kind in ["interior","spill"] {
        let spec=district[kind] as! [String:Any],rect=spec["rect"] as! [Double]
        let width=Int(rect[2])*2,height=Int(rect[3])*2
        let opacity=spec["opacity"] as! Double,feather=spec["feather"] as! Double
        var bytes=[UInt8](repeating:0,count:width*height*4)
        for row in 0..<height {for col in 0..<width {
            let x=rect[0]+(Double(col)+0.5)/2,y=rect[1]+(Double(row)+0.5)/2
            var edge:Double
            if let ellipse=spec["ellipse"] as? [Double] {
                let d=hypot((x-ellipse[0])/ellipse[2],(y-ellipse[1])/ellipse[3])
                edge=(1-d)*min(ellipse[2],ellipse[3])
            } else {edge=distanceToEdge(x,y,spec["polygon"] as! [[Double]])}
            var alpha=smooth(edge/feather),r=1.0,g=0.92,b=0.69
            let v=clamp((y-rect[1])/rect[3])
            if kind=="interior" {
                let u=(x-rect[0])/rect[2]
                let core=exp(-pow((u-0.52)/0.38,2)-pow((v-0.48)/0.65,2))
                // A two-pixel warm edge catches the existing inner stone/brass
                // rim; the four-pixel canvas gutter remains fully transparent.
                alpha = smooth((edge+2)/(feather+2))*opacity*(0.20+0.80*core)
                g=0.54+0.24*core;b=0.08+0.17*core
            } else {
                let axis=spec["axis"] as! [[Double]],a=axis[0],bPoint=axis[1]
                let dx=bPoint[0]-a[0],dy=bPoint[1]-a[1]
                let along=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy))
                let across=abs((x-a[0])*dy-(y-a[1])*dx)/hypot(dx,dy)
                let lateral=exp(-pow(across/(rect[2]*0.43),2))
                alpha *= opacity*(0.18+0.82*pow(1-along,0.9))*lateral
                r=1;g=0.80-0.07*along;b=0.38-0.16*along
            }
            // Tiny broad tonal variation keeps the light from reading as a
            // perfectly flat polygon; it does not animate or alter registration.
            alpha *= 0.97+0.03*cos(x*0.19+y*0.11)
            let index=(row*width+col)*4
            bytes[index]=UInt8((r*255).rounded());bytes[index+1]=UInt8((g*255).rounded())
            bytes[index+2]=UInt8((b*255).rounded());bytes[index+3]=UInt8((clamp(alpha)*255).rounded())
        }}
        let data=Data(bytes),provider=CGDataProvider(data:data as CFData)!
        let image=CGImage(width:width,height:height,bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGBitmapInfo(rawValue:CGImageAlphaInfo.last.rawValue),provider:provider,decode:nil,shouldInterpolate:true,intent:.defaultIntent)!
        let relative="assets/overworld-living/\(id)/portal-light-\(kind).png"
        let url=root.appendingPathComponent(relative)
        let png=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!
        CGImageDestinationAddImage(png,image,nil);CGImageDestinationFinalize(png)
        let digest=SHA256.hash(data:Data(("brigade-portal-light:"+relative).utf8)).map{String(format:"%02x",$0)}.joined()
        let guid="\(digest.prefix(8))-\(digest.dropFirst(8).prefix(4))-5\(digest.dropFirst(13).prefix(3))-a\(digest.dropFirst(17).prefix(3))-\(digest.dropFirst(20).prefix(12))"
        try "guid = \"\(guid)\"\nimporter = \"texture\"\n[settings]\nkind = \"sprite\"\natlas = \"overworld-living-residents\"\nfilter = \"linear\"\ncompression = \"astc6x6\"\ntrim = false\nmax_size = 128\n".write(to:URL(fileURLWithPath:url.path+".gmeta"),atomically:true,encoding:.utf8)
        outputs.append(["path":relative,"sha256":try hash(url),"size":[width,height],"sourceRect":rect])
    }
}
var paintings:[String:String]=[:]
for district in districts {
    let id=district["id"] as! String,path="assets/overworld-original/\(id)/base.png"
    paintings[path]=try hash(root.appendingPathComponent(path))
}
let manifest:[String:Any]=["method":"Source-registered procedural VFX illumination masks, no source image editing", "coordinateSpace":"1254px original paintings", "generator":"swift tools/overworld/build-portal-light.swift", "masksSha256":try hash(configURL),"paintingsSha256":paintings,"outputs":outputs]
try JSONSerialization.data(withJSONObject:manifest,options:[.prettyPrinted,.sortedKeys]).write(to:root.appendingPathComponent("tools/overworld/portal-light/manifest.json"))
print("Built \(outputs.count) source-registered light masks; original paintings remain read-only.")
