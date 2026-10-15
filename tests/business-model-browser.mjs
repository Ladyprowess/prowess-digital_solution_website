import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import assert from 'node:assert/strict';

const browser=await puppeteer.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:1000});
  await page.goto('http://localhost:3000/services/business-model',{waitUntil:'networkidle2',timeout:90000});
  assert.equal(await page.$$eval('#model-workbench aside button',nodes=>nodes.length),4,'four model decisions');
  for(let index=0;index<4;index++){
    await page.click(`#model-workbench aside button:nth-child(${index+1})`);
    await page.click('#model-workbench textarea');
    await page.type('#model-workbench textarea',`Business model answer ${index+1}`);
  }
  await page.click('#model-workbench aside button:first-child');
  assert.equal(await page.$eval('#model-workbench textarea',node=>node.value),'Business model answer 1','answers persist between decisions');
  assert.equal(await page.$eval('#model-workbench [data-model-preview]',node=>node.disabled),false,'preview enables after completing the canvas');
  assert.ok(await page.$eval('[class*="boardGrid"] > div:nth-child(2)',node=>getComputedStyle(node).backgroundColor!==getComputedStyle(node).color),'highlighted model decision has clear contrast');
  assert.ok(await page.$eval('[class*="reviews"] blockquote',node=>parseFloat(getComputedStyle(node).fontSize)<=34),'testimonial type remains restrained');
  assert.equal(await page.$$eval('#business-model-checkout form',nodes=>nodes.length),1,'checkout form');
  assert.equal(await page.$$eval('#business-model-checkout button[type="submit"]',nodes=>nodes.length),1,'payment button');
  assert.ok((await page.$eval('body',node=>node.textContent||'')).includes('From business model clients'),'page-specific reviews');
  console.log('PASS: business model canvas, retained answers, reviews and checkout');
}finally{await browser.close();}
