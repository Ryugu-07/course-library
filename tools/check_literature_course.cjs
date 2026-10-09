'use strict';
// Exercise reading behavior and the exact cited excerpts, including no-JS access.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'literature-course');
const base = process.env.LITERATURE_URL || 'http://127.0.0.1:8765/literature-course/site/';
const output = process.env.LITERATURE_QA_DIR;
const slugs = ['01-kafka','02-marti','03-ibsen','04-akutagawa','05-tagore','06-plaatje'];
const lessons = slugs.map(slug => JSON.parse(fs.readFileSync(path.join(site,'content',slug+'.json'),'utf8')));
const pages = ['index.html', ...slugs.map(slug=>slug+'.html')];
(async()=>{
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const results=[];
  if(output) fs.mkdirSync(output,{recursive:true});
  try {
    for(const width of [1440,768,390,320]) {
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      for(const name of pages) {
        const response=await page.goto(base+name,{waitUntil:'load'});
        assert.ok(response.ok(), name);
        assert.equal(await page.locator('h1').count(),1,name);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name} overflow ${width}`);
        const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
        for(const link of links) {
          if(/^https?:/.test(link)) continue;
          const url=new URL(link,base+name);
          const target=path.join(root,decodeURIComponent(url.pathname));
          assert.ok(fs.existsSync(target),`${name}: missing local target ${link}`);
          if(url.hash && url.pathname===new URL(base+name).pathname) {
            assert.ok(await page.evaluate(id=>!!document.getElementById(id),decodeURIComponent(url.hash.slice(1))),`${name}: missing anchor ${link}`);
          }
        }
        if(name==='index.html') continue;
        const data=lessons.find(l=>name===l.slug+'.html');
        assert.equal(await page.locator('.original').textContent(),data.original.text,`${name}: altered original text`);
        if(data.parallel) assert.equal(await page.locator('.parallel-original').textContent(),data.parallel.text,`${name}: altered author's parallel text`);
        if(data.lineation==='verse') assert.equal(await page.locator('.original .line-end').count(),data.original.text.split('\n').length-1,`${name}: lost source line breaks`);
        assert.ok((await page.locator('.prose').innerText()).length>2000,`${name}: full lesson`);
        assert.equal(await page.locator('.variant').count(),data.variants.length);
        for(const button of await page.locator('button.phrase').all()) {
          const id=await button.getAttribute('aria-controls');
          await button.focus(); await page.keyboard.press('Enter');
          assert.equal(await button.getAttribute('aria-expanded'),'true');
          assert.equal(await page.locator('#'+id).getAttribute('open'),'');
          await page.locator('#'+id+' summary').click();
          await page.waitForFunction(node=>node.getAttribute('aria-expanded')==='false',await button.elementHandle());
        }
        const answers=page.locator('.prose details:not(.word-note):not(.translation-gloss)');
        assert.ok(await answers.count()>=3,`${name}: exercises`);
        for(const answer of await answers.all()) {
          await answer.locator('summary').focus();await page.keyboard.press('Enter');
          assert.equal(await answer.getAttribute('open'),'');
          assert.ok((await answer.innerText()).length>45,`${name}: explanation`);
        }
        await page.locator('.translation-gloss summary').click();
        while(await page.locator('#font-larger').isEnabled()) await page.locator('#font-larger').click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: expanded + enlarged overflow ${width}`);
        assert.equal(await page.locator('.prose').evaluate(el=>getComputedStyle(el).fontSize),'23px');
        if(output && [1440,390].includes(width) && ['01-kafka.html','05-tagore.html'].includes(name)) {
          await page.locator('.workbench').screenshot({path:path.join(output,`${data.slug}-workbench-${width}.png`)});
        }
      }
      assert.deepEqual(errors,[],`errors ${width}`);
      if(output && [1440,390].includes(width)) {
        await page.goto(base+'index.html');await page.screenshot({path:path.join(output,`home-${width}.png`),fullPage:true});
      }
      results.push({width,pages:pages.length,originalText:'exact',annotationKeyboard:'PASS',expandedLayout:'PASS'});
      await context.close();
    }
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:950}}), np=await nojs.newPage();
    for(const name of pages) {
      await np.goto(base+name);
      assert.equal(await np.locator('button:visible').count(),0,`${name}: dead controls without JS`);
      if(name!=='index.html') {
        await np.locator('.word-note summary').first().click();
        assert.equal(await np.locator('.word-note').first().getAttribute('open'),'');
        await np.locator('.translation-gloss summary').click();
        assert.ok((await np.locator('.translation-gloss').innerText()).length>30);
      }
      assert.equal(await np.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: noJS overflow`);
    }
    await nojs.close();
    for(const mode of ['blocked','full']) {
      const context=await browser.newContext();
      await context.addInitScript(mode=>{
        if(mode==='blocked')Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});
        else Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError');};
      },mode);
      const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'01-kafka.html');await page.locator('#font-larger').click();await page.locator('#font-larger').click();
      assert.equal(await page.locator('.prose').evaluate(el=>getComputedStyle(el).fontSize),'21px');
      assert.ok((await page.locator('#reading-feedback').innerText()).includes('无法保存'));
      assert.deepEqual(errors,[]);await context.close();
    }
    const context=await browser.newContext(), first=await context.newPage(), second=await context.newPage();
    await first.goto(base+'01-kafka.html');await second.goto(base+'02-marti.html');
    await first.locator('#font-larger').click();
    await second.waitForFunction(()=>getComputedStyle(document.querySelector('.prose')).fontSize==='20px');
    await first.reload();assert.equal(await first.locator('.prose').evaluate(el=>getComputedStyle(el).fontSize),'20px');
    await context.close();
    results.push({noJS:7,blockedStorage:'PASS',fullStorage:'PASS',fontPersistenceAndSync:'PASS'});
    if(output)fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({status:'PASS',results},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
