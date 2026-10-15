import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("every business service has a positive NGN and USD checkout price",()=>{
  const source=read("src/content/servicePages.ts");
  const priceBlock=source.split("export const defaultServicePrices")[1];
  assert.ok(priceBlock,"default service prices are missing");
  const entries=[...priceBlock.matchAll(/'([^']+)':\{usd:(\d+),ngn:(\d+)\}/g)];
  assert.equal(entries.length,20);
  for(const [,slug,usd,ngn] of entries){assert.ok(slug);assert.ok(Number(usd)>0);assert.ok(Number(ngn)>0);}
});

test("service pages keep the brief and payment inside the service journey",()=>{
  const page=read("src/components/services/ServiceOfferPage.tsx");
  const checkout=read("src/components/services/ServiceCheckout.tsx");
  assert.match(page,/href="#service-checkout"/);
  assert.match(page,/<ServiceCheckout/);
  assert.doesNotMatch(page,/contact\?service|href="\/contact/);
  assert.match(checkout,/\/api\/business-services\/checkout/);
  assert.match(checkout,/What do you need this service to help you achieve\?/);
});

test("checkout uses server prices and verification before sending confirmation",()=>{
  const checkout=read("src/app/api/business-services/checkout/route.ts");
  const verification=read("src/lib/payments/businessService.ts");
  assert.match(checkout,/business_service_offerings/);
  assert.doesNotMatch(checkout,/body\.amount/);
  assert.match(verification,/verifyTransaction/);
  assert.match(verification,/matchesPayment/);
  assert.match(verification,/confirmation_sent_at/);
});

test("business commerce tables are private and testimonials start unpublished",()=>{
  const sql=read("supabase/business_services_commerce.sql");
  assert.match(sql,/published boolean not null default false/);
  assert.match(sql,/business_service_offerings enable row level security/);
  assert.match(sql,/business_service_testimonials enable row level security/);
  assert.match(sql,/business_service_orders enable row level security/);
  assert.doesNotMatch(sql,/create policy/i);
});
