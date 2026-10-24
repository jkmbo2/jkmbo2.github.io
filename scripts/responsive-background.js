// Extend the installed theme through Hexo's filter, without editing vendor files.
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
// Old tabs may retain HTML pointing at this URL. Serve a small compatible JPEG.
hexo.extend.generator.register('compatible-background',function(){
 return {path:'images/background.jpg',data:readFileSync(join(hexo.base_dir,'source/images/optimized/background-fallback.jpg'))};
});
hexo.extend.filter.register('after_render:html',function(html){
 const base='/images/optimized/';
 if(!html.includes(base+'background-1920.webp'))return html;
 const {version,placeholder}=JSON.parse(readFileSync(join(hexo.base_dir,'source/_data/optimized_background.json'),'utf8'));
 const desktop=base+'background-1920.webp?v='+version;
 const mobile=base+'background-960.webp?v='+version;
 const fallback=base+'background-fallback.jpg?v='+version;
 // Match picture's media rules in the preload so a phone downloads only its variant.
 html=html.replace(/<link\b[^>]*\brel="preload"[^>]*\bhref="\/images\/optimized\/background-1920\.webp"[^>]*>/g,
  `<link rel="preload" as="image" type="image/webp" href="${mobile}" media="(max-width: 820px)" fetchpriority="high">`+
  `<link rel="preload" as="image" type="image/webp" href="${desktop}" media="(min-width: 821px)" fetchpriority="high">`);
 html=html.replace(/<img\b[^>]*\bsrc="\/images\/optimized\/background-1920\.webp"[^>]*>/g,img=>{
  const alt=img.match(/\balt="[^"]*"/)?.[0]||'alt="背景图片"';
  // Retry an interrupted WebP transfer once using the smaller JPEG; never loop.
  const recover=`this.onerror=function(){this.style.opacity=0};this.parentElement.querySelectorAll('source').forEach(s=>s.remove());this.src='${fallback}&amp;retry=1'`;
  return `<picture><source type="image/webp" media="(max-width: 820px)" srcset="${mobile}">`+
   `<source type="image/webp" srcset="${desktop}">`+
   `<img src="${fallback}" loading="eager" decoding="async" fetchpriority="high" ${alt} onerror="${recover}"></picture>`;
 });
 // The tiny preview is present in HTML and remains visible even if a transfer fails.
 // Keep the theme's negative background layer inside this stacking context,
 // above the body paint. Always paint it rather than relying on off-screen culling.
 html=html.replace('</head>',`<style>#container{isolation:isolate}#container #imgs{content-visibility:visible;contain:none;background-image:url('${placeholder}');background-size:cover;background-position:center}#imgs picture{display:block;width:100%;height:100%}</style></head>`);
 return html.replaceAll(base+'cover.webp',base+'cover.webp?v='+version);
},5);
