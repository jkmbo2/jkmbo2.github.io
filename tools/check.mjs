// Kept outside Hexo's scripts/ directory, which auto-loads theme extensions.
import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const origin='https://jkmbo2.github.io';
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(root),html=files.filter(f=>f.endsWith('.html')),errors=[];
for(const file of html){
 const content=await readFile(file,'utf8');
 const relative='/'+path.relative(root,file).replaceAll('\\','/');
 if(!content.includes('<title>'))errors.push(`${relative}: missing title`);
 for(const match of content.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
  const raw=match[1].replaceAll('&amp;','&');
  if(/^(#|data:|mailto:|javascript:)/.test(raw))continue;
  let url;try{url=new URL(raw,origin+relative);}catch{continue;}
  if(url.origin!==origin)continue;
  let target=decodeURIComponent(url.pathname).replace(/^\//,'');if(!target||target.endsWith('/'))target+='index.html';
  try{await access(path.resolve(root,target));}catch{errors.push(`${relative}: missing ${url.pathname}`);}
 }
}
for(const required of ['index.html','images/background.jpg','assets/avatar.svg','about/index.html','categories/index.html','tags/index.html','archives/index.html','rss.xml','pagefind/pagefind.js']){
 try{await access(path.join(root,required));}catch{errors.push(`Missing required output: ${required}`);}
}
if(files.some(f=>f.includes('my-first-note')))errors.push('Draft appeared in published output');
const home=await readFile(path.join(root,'index.html'),'utf8');
if(!home.includes('/images/background.jpg'))errors.push('Homepage does not use chosen background');
if(!home.includes('ShokaX'))errors.push('Missing native ShokaX attribution');
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log(`PASS: ${html.length} HTML pages, local links/assets, selected background, ShokaX theme, full-text search, RSS and draft exclusion.`);
