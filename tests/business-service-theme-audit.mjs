import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import assert from 'node:assert/strict';

const routes=[
  'business-plans','feasibility-studies','market-research','business-model',
  'business-structure-diagnostic','financial-review','sops','pricing-offer-review'
];

const browser=await puppeteer.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:1000});
  for(const theme of ['light','dark']){
    for(const slug of routes){
      await page.evaluateOnNewDocument((value)=>localStorage.setItem('theme',value),theme);
      await page.goto(`http://localhost:3000/services/${slug}`,{waitUntil:'networkidle2',timeout:90000});
      await page.evaluate((value)=>document.documentElement.classList.toggle('dark',value==='dark'),theme);
      assert.ok(await page.$eval('html',node=>node.scrollWidth<=node.clientWidth+2),`${slug}/${theme}: no horizontal overflow`);
      assert.equal(await page.$$eval('#service-checkout form',nodes=>nodes.length),1,`${slug}/${theme}: one checkout form`);
      assert.ok(await page.$eval('#service-checkout form',node=>node.getBoundingClientRect().width>=Math.min(560,window.innerWidth*.42)),`${slug}/${theme}: form has usable width`);
      assert.ok(await page.$eval('[class*="testimonials"] article blockquote',node=>Boolean(node.textContent?.trim())&&getComputedStyle(node).color!==getComputedStyle(node.closest('article')).backgroundColor),`${slug}/${theme}: testimonial is visible`);
      assert.ok(await page.$eval('#service-checkout form label',node=>getComputedStyle(node).color!==getComputedStyle(node.closest('form')).backgroundColor),`${slug}/${theme}: form labels are visible`);
      assert.equal(await page.$$eval('#service-checkout button[type="submit"]',nodes=>nodes.length),1,`${slug}/${theme}: payment button`);
    }
  }
  console.log('PASS: eight completed service pages audited in light and dark mode');
}finally{await browser.close();}
