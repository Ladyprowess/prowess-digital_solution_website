import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import assert from 'node:assert/strict';

const browser=await puppeteer.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:900});
  for(const slug of ['business-structure-diagnostic','financial-review','sops','pricing-offer-review']){
    await page.goto(`http://localhost:3000/services/${slug}`,{waitUntil:'networkidle2',timeout:90000});
    assert.equal(await page.$$eval('#service-checkout form',nodes=>nodes.length),1,`${slug}: payment form`);
    assert.equal(await page.$$eval('#service-checkout input[name="fullName"]',nodes=>nodes.length),1,`${slug}: name field`);
    assert.equal(await page.$$eval('#service-checkout textarea[name="brief"]',nodes=>nodes.length),1,`${slug}: brief field`);
    assert.equal(await page.$$eval('#service-checkout button',nodes=>nodes.filter(node=>node.textContent?.includes('Pay ')).length),1,`${slug}: pay button`);
    assert.ok(await page.$eval('#service-checkout form',node=>node.getBoundingClientRect().width>=node.parentElement.getBoundingClientRect().width*.58),`${slug}: form has the larger checkout column`);
    assert.ok((await page.$eval('body',node=>node.textContent||'')).includes('From '),`${slug}: reviews`);
    const paymentBounds=await page.$eval('#service-checkout',node=>{const target=node.parentElement;const box=target.getBoundingClientRect();const outer=target.parentElement.getBoundingClientRect();return {left:Math.round(box.left),right:Math.round(box.right),outerLeft:Math.round(outer.left),outerRight:Math.round(outer.right),viewport:window.innerWidth};});
    assert.ok(paymentBounds.left<=1&&paymentBounds.right>=paymentBounds.viewport-1,`${slug}: checkout section spans the viewport (${JSON.stringify(paymentBounds)})`);
  }
  console.log('PASS: restored service pages show reviews and complete payment forms');
}finally{await browser.close();}
