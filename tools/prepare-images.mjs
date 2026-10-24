// Encode delivery assets during build; keep background.jpg as the editable source.
import sharp from 'sharp';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../source/images/background.jpg',import.meta.url));
const output=fileURLToPath(new URL('../source/images/optimized/',import.meta.url));
const manifest=fileURLToPath(new URL('../source/_data/optimized_background.json',import.meta.url));
const input=await readFile(source);
const version=createHash('sha256').update(input).update('web-background-v1').digest('hex').slice(0,12);
await mkdir(output,{recursive:true});
const assets=[
 ['background-1920.webp',1920,'webp',78],
 ['background-960.webp',960,'webp',76],
 ['cover.webp',640,'webp',72],
 ['background-fallback.jpg',960,'jpeg',76]
];
const sizes={};
for(const [name,width,format,quality] of assets){
 const image=await sharp(input).rotate().resize({width,withoutEnlargement:true})
  .toFormat(format,{quality,...(format==='jpeg'?{progressive:true,mozjpeg:true}:{effort:5})}).toBuffer();
 await writeFile(output+name,image);
 sizes[name]=image.length;
}
const placeholder=await sharp(input).rotate().resize({width:48}).jpeg({quality:35}).toBuffer();
await writeFile(manifest,JSON.stringify({version,sizes,originalBytes:input.length,
 placeholder:'data:image/jpeg;base64,'+placeholder.toString('base64')},null,2));
console.log('Background delivery assets (bytes):',JSON.stringify(sizes));
