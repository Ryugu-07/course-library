'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.HUMANITIES_URL || 'http://127.0.0.1:8765/humanities/';
const out = process.env.HUMANITIES_QA_DIR;
const sections = ['history', 'society', 'frontier'];
const articles = sections.flatMap(s => JSON.parse(fs.readFileSync(path.join(root, 'humanities/content', s, 'catalog.json'), 'utf8')).modules.flatMap(m => m.lessons.filter(l => l.status === 'ready').map(l => `${s}/${l.slug}.html`)));
const pages = ['index.html', ...sections.map(s => `${s}/index.html`), ...articles];
(async () => {
  const browser = await chromium.launch({headless:true, executablePath: process.env.BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const results = [];
  try {
    if (out) fs.mkdirSync(out,{recursive:true});
    for (const width of [1440, 768, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:950}, reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const name of pages) {
        const response = await page.goto(base + name, {waitUntil:'load'});
        assert.ok(response.ok(), name);
        assert.equal(await page.locator('h1').count(),1,name);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: overflow ${width}`);
        if (articles.includes(name)) {
          const details=page.locator('.prose details').first();
          await details.locator('summary').focus(); await page.keyboard.press('Enter');
          assert.equal(await details.getAttribute('open'),'');
          await page.keyboard.press('Enter');
          for(let i=0;i<4;i++) if(await page.locator('#font-larger').isEnabled()) await page.locator('#font-larger').click();
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: enlarged overflow`);
          assert.ok((await page.locator('.prose').innerText()).length>2000,`${name}: article body`);
        }
      }
      assert.deepEqual(errors,[],`browser errors at ${width}`);
      results.push({width,pages:pages.length,layout:'PASS',keyboardAnswers:'PASS'});
      if(out && [1440,390].includes(width)) {
        for(const name of ['index.html','history/index.html',...sections.map(s=>articles.find(a=>a.startsWith(s+'/')))]) {
          await page.goto(base+name); await page.screenshot({path:path.join(out,`${name.replaceAll('/','-')}-${width}.png`),fullPage:false});
        }
      }
      await context.close();
    }
    const context=await browser.newContext({viewport:{width:390,height:900}}), page=await context.newPage();
    await page.goto(base+'index.html');
    await page.locator('#reading-search').fill('不存在的文章标题');
    assert.equal(await page.locator('.catalog-item:visible').count(),0);
    assert.equal(await page.locator('#reading .reading-grid').isVisible(),false);
    await page.locator('#reading-search').fill('教育');
    assert.ok(await page.locator('.catalog-item:visible').count()>0);
    await page.locator('#reading-search').fill('');
    assert.equal(await page.locator('.catalog-item:visible').count(),articles.length);
    assert.equal(await page.locator('#reading .reading-grid').isVisible(),true);
    await page.goto(base+articles[0]);
    await page.locator('#mark-read').click();await page.reload();
    assert.equal(await page.locator('#mark-read').getAttribute('aria-pressed'),'true');
    await page.goto(base+'index.html');assert.equal(await page.locator('.catalog-item .read-badge').count(),1);
    await page.goto(base+articles[0]);await page.locator('#mark-read').click();await page.reload();
    assert.equal(await page.locator('#mark-read').getAttribute('aria-pressed'),'false');
    const second=await context.newPage(), mirror=await context.newPage(), home=await context.newPage();
    await second.goto(base+articles[1]);await mirror.goto(base+articles[0]);await home.goto(base+'index.html');
    await page.locator('#mark-read').click();
    await second.locator('#mark-read').click();
    await home.waitForFunction(()=>document.querySelectorAll('.catalog-item .read-badge').length===2);
    await mirror.waitForFunction(()=>document.getElementById('mark-read').getAttribute('aria-pressed')==='true');
    await second.locator('#font-larger').click();
    await page.waitForFunction(()=>document.querySelector('.prose').style.getPropertyValue('--reading-size')==='19px');
    await mirror.locator('#mark-read').click();
    await page.waitForFunction(()=>document.getElementById('mark-read').getAttribute('aria-pressed')==='false');
    await home.waitForFunction(()=>document.querySelectorAll('.catalog-item .read-badge').length===1);
    await second.reload();assert.equal(await second.locator('#mark-read').getAttribute('aria-pressed'),'true');
    await context.close();
    const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}}), staticPage=await staticContext.newPage();
    for (const name of pages) {
      await staticPage.goto(base+name);
      assert.equal(await staticPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: noJS overflow`);
      assert.equal(await staticPage.locator('button:visible,input:visible').count(),0);
      if(articles.includes(name)) {await staticPage.locator('.prose summary').first().click();assert.equal(await staticPage.locator('.prose details').first().getAttribute('open'),'');}
    }
    await staticContext.close();
    const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage blocked');}}));
    const bp=await blocked.newPage(),be=[];bp.on('pageerror',e=>be.push(e.message));await bp.goto(base+articles[0]);await bp.locator('#mark-read').click();assert.deepEqual(be,[]);assert.ok((await bp.locator('#reading-feedback').innerText()).includes('存储不可用'));await blocked.close();
    const full=await browser.newContext();await full.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});
    const fp=await full.newPage();await fp.goto(base+articles[0]);
    await fp.locator('#font-larger').click();await fp.locator('#font-larger').click();
    assert.equal(await fp.locator('.prose').evaluate(node=>node.style.getPropertyValue('--reading-size')),'20px');
    await fp.locator('#mark-read').click();await fp.locator('#mark-read').click();
    assert.equal(await fp.locator('#mark-read').getAttribute('aria-pressed'),'false');
    assert.ok((await fp.locator('#reading-feedback').innerText()).includes('存储不可用'));await full.close();
    results.push({search:'PASS',readPersistenceAndUndo:'PASS',multiTabState:'PASS',noJS:pages.length,blockedStorage:'PASS',fullStorage:'PASS'});
    if(out)fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({result:'PASS',results},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
