"""Verify the painted homepage hero in installed Edge, including cached URLs."""
import os
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright,expect

BASE=os.environ.get('BLOG_URL','http://localhost:5174')
OUT=Path(__file__).resolve().parents[1]/'artifacts'
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 context=browser.new_context(viewport={'width':1440,'height':900})
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def check_hero(label):
  page.wait_for_function("document.querySelector('#imgs img')?.naturalWidth>0")
  assert page.locator('#container').evaluate('(e)=>getComputedStyle(e).isolation')=='isolate'
  assert page.locator('#imgs').evaluate('(e)=>getComputedStyle(e).contentVisibility')=='visible'
  expect(page.locator('#imgs')).to_be_visible()
  # Check composited viewport pixels, not just the image's downloaded state.
  screenshot=page.screenshot()
  texture=Image.open(BytesIO(screenshot)).convert('RGB').crop((30,100,300,330))
  assert sum(ImageStat.Stat(texture).stddev)>35,'Homepage hero is not visibly painted'
  (OUT/f'edge-home-{label}.png').write_bytes(screenshot)
  print('PASS Edge painted homepage hero:',label,flush=True)
 page.goto(BASE,wait_until='networkidle')
 check_hero('first-visit')
 page.reload(wait_until='networkidle')
 check_hero('cached-refresh')
 page.locator('.segments.posts .info h3 a').first.click()
 expect(page.locator('article.post')).to_be_visible()
 page.locator('#nav .item.title a').click()
 expect(page.locator('.segments.posts article.item')).to_have_count(4)
 check_hero('return-from-post')
 legacy=context.request.get(BASE+'/images/background.jpg')
 assert legacy.ok and legacy.headers['content-type'].startswith('image/jpeg')
 assert len(legacy.body())<150000
 # Reproduce the actual old HTML URL in an isolated image load.
 old=context.new_page()
 old.goto(BASE+'/images/background.jpg',wait_until='load')
 assert old.locator('img').evaluate('(img)=>img.complete && img.naturalWidth>0')
 print('PASS cached old homepage background URL: HTTP 200 and decodable small JPEG',flush=True)
 assert not errors,errors
 browser.close()
