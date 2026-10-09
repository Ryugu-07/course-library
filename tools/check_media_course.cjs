'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.MEDIA_URL || 'http://127.0.0.1:8765/media-course/site/';
const out = process.env.MEDIA_QA_DIR;
const lanes = ['communication', 'journalism', 'platforms', 'methods'];
const articles = lanes.flatMap(lane => JSON.parse(fs.readFileSync(path.join(root, 'media-course/content', lane, 'catalog.json'), 'utf8')).lessons.filter(l => l.status === 'ready').map(l => `${lane}/${l.slug}.html`));
const pages = ['index.html', ...lanes.map(l => l + '/index.html'), ...articles];
const methods = 'methods/02-sampling-surveys.html';
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: process.env.BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const results = [];
  try {
    if(out) fs.mkdirSync(out, {recursive: true});
    for(const width of [1440, 768, 390, 320]) {
      const context = await browser.newContext({viewport: {width, height: 960}, reducedMotion: 'reduce'});
      const page = await context.newPage(), errors = [], failed = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if(r.url().startsWith(base) && r.status() >= 400) failed.push(r.url()); });
      for(const name of pages) {
        assert.ok((await page.goto(base + name)).ok(), name);
        assert.equal(await page.locator('h1').count(), 1, name);
        if(articles.includes(name)) {
          const summary = page.locator('.prose details summary').first();
          await summary.focus(); await page.keyboard.press('Enter');
          assert.equal(await page.locator('.prose details').first().getAttribute('open'), '');
          await page.locator('.prose details').evaluateAll(nodes => nodes.forEach(n => { n.open = true; }));
          for(let i=0; i<4; i++) if(await page.locator('#font-larger').isEnabled()) await page.locator('#font-larger').click();
          assert.equal(await page.locator('.prose').evaluate(n => getComputedStyle(n).fontSize), '22px');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: overflow at ${width}`);
      }
      assert.deepEqual(errors, []); assert.deepEqual(failed, []);
      if(out && [1440,390].includes(width)) {
        for(const name of ['index.html', 'journalism/03-writing-accountability.html', methods]) {
          await page.goto(base + name);
          if(name === methods) await page.locator('#sampling-lab').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(out,`${name.replaceAll('/','-')}-${width}.png`)});
        }
      }
      results.push({width, pages:pages.length, enlargedText:'PASS', openAnswers:'PASS', console:'PASS'});
      await context.close();
    }
    const context = await browser.newContext(), page = await context.newPage();
    await page.goto(base + 'index.html');
    await page.locator('#reading-search').fill('抽样');
    assert.ok(await page.locator('.catalog-item:visible').count() > 0);
    await page.locator('#reading-search').fill('不存在的课程标题');
    assert.equal(await page.locator('.catalog-item:visible').count(),0);
    await page.locator('#reading-search').fill('');
    assert.equal(await page.locator('.catalog-item:visible').count(),articles.length);
    await page.goto(base + articles[0]);
    await page.locator('#mark-read').click(); await page.reload();
    assert.equal(await page.locator('#mark-read').getAttribute('aria-pressed'),'true');
    const home = await context.newPage(); await home.goto(base + 'index.html');
    assert.equal(await home.locator('.catalog-item .read-badge').count(),1);
    await page.locator('#mark-read').click();
    await home.waitForFunction(() => document.querySelectorAll('.catalog-item .read-badge').length === 0);
    await page.goto(base + methods);
    assert.equal(await page.locator('#sample-estimate').innerText(), '53.3%');
    async function rates(a, b) {
      await page.locator('#night-response').fill(String(a));
      await page.locator('#other-response').fill(String(b));
    }
    await rates(40,5); assert.equal(await page.locator('#sample-estimate').innerText(), '53.3%');
    assert.ok((await page.locator('#sample-detail').innerText()).includes('120 人'));
    await rates(20,80); assert.equal(await page.locator('#sample-estimate').innerText(), '22.9%');
    await page.locator('#equal-response').click();
    assert.equal(await page.locator('#sample-estimate').innerText(), '30.0%');
    assert.ok((await page.locator('#sample-detail').innerText()).includes('500 人'));
    await page.locator('#night-response').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#night-response').inputValue(),'55');
    await context.close();
    const staticContext = await browser.newContext({javaScriptEnabled:false, viewport:{width:320,height:900}});
    const sp = await staticContext.newPage();
    for(const name of pages) {
      await sp.goto(base + name);
      assert.equal(await sp.locator('button:visible,input:visible').count(),0,name);
      assert.equal(await sp.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,name);
      if(articles.includes(name)) {
        await sp.locator('.prose details summary').first().click();
        assert.equal(await sp.locator('.prose details').first().getAttribute('open'),'');
      }
    }
    await staticContext.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));
    const bp = await blocked.newPage(), errors=[]; bp.on('pageerror',e=>errors.push(e.message));
    await bp.goto(base + methods); await bp.locator('#mark-read').click();
    assert.ok((await bp.locator('#reading-feedback').innerText()).includes('存储不可用'));
    await bp.locator('#equal-response').click();
    assert.equal(await bp.locator('#sample-estimate').innerText(),'30.0%'); assert.deepEqual(errors,[]);
    await blocked.close();
    results.push({search:'PASS',readingState:'PASS',samplingExamples:'PASS',keyboardSlider:'PASS',noJS:pages.length,blockedStorage:'PASS'});
    if(out) fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({result:'PASS',results},null,2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
