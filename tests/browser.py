"""Run against a static preview of public/ on localhost:5173."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path(__file__).resolve().parents[1]/'artifacts'
OUT.mkdir(exist_ok=True)
BASE='http://localhost:5173'
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':1000})
 page=context.new_page()
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='networkidle')
 for y in range(0,3000,500):
  page.evaluate('(y)=>window.scrollTo(0,y)',y)
  page.wait_for_timeout(150)
 page.evaluate('window.scrollTo(0,0)')
 page.wait_for_timeout(1000)
 expect(page.locator('#imgs img')).to_have_attribute('src','/images/background.jpg')
 assert page.locator('#imgs img').evaluate('(img)=>img.complete && img.naturalWidth===4500')
 expect(page.locator('.segments.posts article.item')).to_have_count(4)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert page.locator('#brand .artboard').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)')<=32
 page.screenshot(path=str(OUT/'shokax-desktop.png'),full_page=True)
 page.locator('.segments.posts .info h3 a').filter(has_text='Python').click()
 expect(page.locator('article.post')).to_contain_text('浅拷贝')
 assert page.locator('article.post pre').count()>=3
 assert page.locator('article.post [id]').count()>0
 page.wait_for_timeout(1500)
 page.screenshot(path=str(OUT/'shokax-article.png'),full_page=True)
 page.goto(BASE+'/categories/',wait_until='networkidle')
 expect(page.locator('#main')).to_contain_text('技术实践')
 page.goto(BASE+'/archives/',wait_until='networkidle')
 expect(page.locator('#main')).to_contain_text('4')
 page.goto(BASE+'/archives/2026/10/',wait_until='networkidle')
 expect(page.locator('#main')).to_contain_text('Python')
 page.goto(BASE+'/about/',wait_until='networkidle')
 expect(page.locator('#main')).to_contain_text('你好，我是云飞')
 page.goto(BASE,wait_until='networkidle')
 page.locator('#rightNav .search').click()
 search=page.locator('.pagefind-ui__search-input')
 expect(search).to_be_visible()
 search.fill('浅拷贝')
 expect(page.locator('.pagefind-ui__result-link').filter(has_text='Python')).to_be_visible(timeout=15000)
 assert context.request.get(BASE+'/rss.xml').ok
 assert context.request.get(BASE+'/pagefind/pagefind.js').ok
 assert context.request.get(BASE+'/posts/my-first-note/').status==404
 phone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 mobile=phone.new_page()
 mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.goto(BASE,wait_until='networkidle')
 mobile.wait_for_timeout(1500)
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
 expect(mobile.locator('#imgs img')).to_be_visible()
 mobile.screenshot(path=str(OUT/'shokax-mobile.png'),full_page=True)
 assert not errors,errors
 browser.close()
 print('PASS: chosen background, native ShokaX, migrated posts, article/code, categories/archive/about, full-text search, RSS, draft exclusion, desktop/mobile layout; no JavaScript errors.')
