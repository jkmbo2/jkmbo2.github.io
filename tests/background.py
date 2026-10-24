"""Cold-cache slow network, responsive selection and interrupted-image recovery."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

BASE=os.environ.get('BLOG_URL','http://localhost:5173')
OUT=Path(__file__).resolve().parents[1]/'artifacts'
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for width,expected,limit in [(1440,'background-1920.webp',350000),(390,'background-960.webp',100000)]:
  context=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=3 if width==390 else 1)
  page=context.new_page()
  cdp=context.new_cdp_session(page)
  cdp.send('Network.enable')
  cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
  cdp.send('Network.emulateNetworkConditions',{'offline':False,'latency':150,'downloadThroughput':125000,'uploadThroughput':62500})
  page.goto(BASE,wait_until='domcontentloaded',timeout=60000)
  page.wait_for_function("document.querySelector('#imgs img')?.complete && document.querySelector('#imgs img').naturalWidth>0",timeout=20000)
  image=page.locator('#imgs img')
  assert expected in image.evaluate('(img)=>img.currentSrc')
  resources=page.evaluate("performance.getEntriesByType('resource').filter(r=>r.name.includes('/images/optimized/background-')).map(r=>({url:r.name,bytes:r.encodedBodySize,ms:Math.round(r.duration)}))")
  assert len(resources)==1,resources
  assert resources[0]['bytes']<=limit and resources[0]['bytes']>0,resources
  assert not page.evaluate("performance.getEntriesByType('resource').some(r=>r.name.includes('/images/background.jpg'))")
  page.screenshot(path=str(OUT/f'background-{width}.png'))
  print('PASS slow cold-cache:',width,resources,flush=True)
  context.close()
 context=browser.new_context(viewport={'width':1440,'height':844})
 page=context.new_page()
 page.route('**/images/optimized/background-*.webp*',lambda route:route.abort())
 page.goto(BASE,wait_until='networkidle')
 page.wait_for_function("document.querySelector('#imgs img')?.naturalWidth===960")
 assert 'background-fallback.jpg' in page.locator('#imgs img').evaluate('(img)=>img.currentSrc')
 print('PASS interrupted WebP: small JPEG recovers',flush=True)
 context.close()
 context=browser.new_context()
 page=context.new_page()
 attempts=[]
 def block(route):
  attempts.append(route.request.url)
  route.abort()
 page.route('**/images/optimized/background-*',block)
 page.goto(BASE,wait_until='networkidle')
 expect(page.locator('#brand')).to_be_visible()
 expect(page.locator('.segments.posts article.item')).to_have_count(4)
 assert page.locator('#imgs').evaluate('(el)=>getComputedStyle(el).backgroundImage.includes("data:image/jpeg;base64,")')
 assert page.locator('#imgs img').evaluate('(img)=>getComputedStyle(img).opacity==="0"')
 assert len(attempts)<=4,attempts
 print('PASS all image transfers blocked: embedded preview and content remain; no retry loop',flush=True)
 browser.close()
