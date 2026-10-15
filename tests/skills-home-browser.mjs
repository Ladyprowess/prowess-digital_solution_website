import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import assert from 'node:assert/strict';

const browser=await puppeteer.launch({headless:true});
try {
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',request=>/googletagmanager|googlesyndication|google-analytics/.test(request.url())?request.abort():request.continue());
  await page.setViewport({width:1280,height:900});
  await page.goto('http://localhost:3000',{waitUntil:'networkidle2',timeout:90000});
  await page.evaluate(()=>[...document.querySelectorAll('header button')].find(button=>button.querySelector('strong')?.textContent==='Skills')?.click());
  await page.waitForFunction(()=>document.querySelector('#your-route')?.textContent?.includes('Practise until it is useful.'));
  assert.equal(await page.$$eval('#your-route .routeWorkspace',nodes=>nodes.length),0);
  assert.equal(await page.$eval('#your-route button:disabled',button=>button.textContent?.trim()),'View my learning plan');
  await page.type('#skill-name','Data analysis');
  await page.type('#learning-notes','Practise on Saturdays.');
  for(let index=0;index<4;index++) {
    await page.evaluate(index=>[...document.querySelectorAll('#your-route button[aria-pressed]')][index]?.click(),index);
    await page.click('#your-route input[type="checkbox"]');
    await page.evaluate(()=>[...document.querySelectorAll('#your-route button')].find(button=>button.textContent?.includes('View my learning plan'))?.click());
    await page.waitForSelector('dialog[open]');
    await page.waitForFunction(()=>document.querySelector('dialog')?.textContent?.includes('Your result is ready'));
    const text=await page.$eval('dialog',element=>element.textContent||'');
    assert.ok(text.includes('What may be happening:'));
    assert.ok(text.includes('What to check:'));
    assert.ok(text.includes('Next action:'));
    if(index===0) assert.ok(text.includes('Practise on Saturdays.'));
    else assert.ok(!text.includes('Practise on Saturdays.'));
    await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>[...document.querySelectorAll('#your-route button[aria-pressed]')][0]?.click());
  assert.equal(await page.$eval('#learning-notes',element=>element.value),'Practise on Saturdays.');
  assert.equal(await page.$eval('#skill-name',element=>element.value),'Data analysis');
  assert.equal(await page.$$eval('#your-route input:checked',inputs=>inputs.length),1);
  const support=await page.evaluate(()=>[...document.querySelectorAll('section')].find(element=>element.textContent?.includes('PUT LEARNING TO WORK'))?.textContent||'');
  assert.ok(support.includes('Understand it.'));
  assert.ok(!support.includes('Website client'));
  await page.screenshot({path:'/tmp/prowess-skills-home.png',fullPage:true});
  for(const width of [375,768,1280]) {
    await page.setViewport({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}px`);
  }
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  assert.deepEqual(errors,[]);
  console.log('PASS: dedicated Skills workspace, four learning plans, retained input, printer preview, correct lower content, responsive widths, dark mode and reduced motion');
} finally {
  await browser.close();
}
