import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import assert from 'node:assert/strict';
const baseUrl=process.env.BASE_URL||'http://localhost:3000';

const browser=await puppeteer.launch({headless:true});
try {
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',request=>/googletagmanager|googlesyndication|google-analytics/.test(request.url())?request.abort():request.continue());
  await page.setViewport({width:1280,height:900});
  await page.goto(`${baseUrl}/services`,{waitUntil:'networkidle2',timeout:90000});
  assert.equal(await page.$$eval('#service-catalogue article',nodes=>nodes.length),4);
  assert.equal(await page.$$eval('#service-catalogue a',nodes=>nodes.length),16);
  assert.equal(await page.$$eval('#service-add-ons article',nodes=>nodes.length),4);
  const serviceHrefs=await page.$$eval('#service-catalogue a, #service-add-ons a',nodes=>nodes.map(node=>node.getAttribute('href')));
  assert.equal(new Set(serviceHrefs).size,20);
  const statuses=await page.evaluate(async hrefs=>Promise.all(hrefs.map(async href=>(await fetch(href)).status)),serviceHrefs);
  assert.ok(statuses.every(status=>status===200),`service status codes: ${statuses.join(',')}`);
  const headings=await page.$$eval('#service-catalogue article > div:first-child p',nodes=>nodes.map(node=>node.textContent?.trim()));
  assert.deepEqual(headings,['Start','Fix','Organise','Grow']);
  const marketHref=await page.$eval('#service-catalogue',catalogue=>[...catalogue.querySelectorAll('a')].find(link=>link.textContent?.includes('Market Research'))?.getAttribute('href'));
  assert.equal(marketHref,'/services/market-research');
  await page.goto(`${baseUrl}${marketHref}`,{waitUntil:'networkidle2',timeout:90000});
  assert.ok((await page.$eval('h1',node=>node.textContent||'')).includes('Understand the customers'));
  assert.equal(await page.$$eval('main a[href^="/contact"]',nodes=>nodes.length),0);
  assert.equal(await page.$eval('a[href="#service-checkout"]',node=>node.textContent?.trim()),'Start this service');
  assert.equal(await page.$$eval('#service-checkout form',nodes=>nodes.length),1);
  assert.equal(await page.$eval('#service-checkout textarea[name="brief"]',node=>node.getAttribute('required')),"");
  assert.ok((await page.$eval('#service-checkout',node=>node.textContent||'')).includes('₦560,000'));
  await page.click('#service-checkout button[aria-pressed="false"]');
  await page.waitForFunction(()=>document.querySelector('#service-checkout')?.textContent?.includes('$350'));
  await page.screenshot({path:'/tmp/prowess-market-research-checkout.png',fullPage:true});
  for(const slug of ['business-plans','operations-documentation','business-audit']){
    await page.goto(`${baseUrl}/services/${slug}`,{waitUntil:'networkidle2',timeout:90000});
    await page.screenshot({path:`/tmp/prowess-${slug}.png`,fullPage:slug==='business-plans'});
  }
  await page.goto(`${baseUrl}/services`,{waitUntil:'networkidle2',timeout:90000});
  await page.$eval('#service-add-ons a',link=>link.focus());
  const outline=await page.$eval('#service-add-ons a',link=>getComputedStyle(link).outlineStyle);
  assert.notEqual(outline,'none');
  for(const width of [375,768,1280]){
    await page.setViewport({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}px`);
  }
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  await page.screenshot({path:'/tmp/prowess-business-services.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: complete service catalogue, add-ons, inline dual-currency checkout, keyboard focus, responsive widths, dark context and reduced motion');
} finally {
  await browser.close();
}
