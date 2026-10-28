/** Restore curtain alpha without modifying the accepted embedded artwork's RGB.
 * Run with Sharp available on NODE_PATH: node tools/menu-branding/restore-curtain-alpha.cjs
 */
const sharp = require('sharp');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

async function applyAlpha(targetName, maskPath, normalize) {
  const target = path.join(root, 'assets/cartoon/menu', targetName);
  const {data, info} = await sharp(target).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const mask = await sharp(maskPath).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width, mask.info.width);
  assert.equal(info.height, mask.info.height);
  const before = Buffer.from(data);
  let transparent = 0;
  for(let pixel = 0; pixel < info.width * info.height; pixel++) {
    const i = pixel * 4;
    let alpha = mask.data[i+3];
    if(normalize) alpha = alpha <= 8 ? 0 : alpha >= 238 ? 255 : Math.round((alpha-8)*255/230);
    data[i+3] = alpha;
    if(alpha === 0) transparent++;
  }
  assert(transparent > 0, 'Cutout must contain fully transparent pixels');
  for(let pixel=0;pixel<info.width*Math.floor(info.height*.9);pixel++) assert.equal(data[pixel*4+3],255,'Cloth must remain opaque');
  for(let x=0;x<info.width;x++) assert.equal(data[((info.height-1)*info.width+x)*4+3],0,'Bottom row must be transparent');
  await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(target+'.tmp');
  const saved = await sharp(target+'.tmp').ensureAlpha().raw().toBuffer();
  for(let i=0;i<saved.length;i++) assert.equal(saved[i],i%4===3?data[i]:before[i], 'RGB or alpha did not round-trip');
  await fs.rename(target+'.tmp',target);
  console.log(JSON.stringify({asset:targetName,rgbPreserved:true,transparentPixels:transparent,bottomRowTransparent:true,alphaMatchesOriginal:!normalize}));
}
(async()=>{
  await applyAlpha('curtain-tactile.png',path.join(root,'assets/cartoon/menu/curtain.png'),false);
  const portraitMask=path.join(__dirname,'curtain-portrait-alpha-cutout.png');
  await applyAlpha('curtain-tactile-portrait.png',portraitMask,true);
})().catch(error=>{console.error(error);process.exitCode=1;});
