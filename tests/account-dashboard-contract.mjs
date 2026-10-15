import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("My Account collects every customer payment source", async () => {
  const route = await read("src/app/api/account/purchases/route.ts");
  for (const table of ["purchases", "business_service_orders", "premium_membership_subscriptions", "membership_subscriptions", "skill_to_business_purchases", "consultation_bookings", "event_registrations"]) {
    assert.match(route, new RegExp(`from\\(\\"${table}\\"\\)`), table);
  }
  assert.match(route, /from\(\"subscription_charge_events\"\)/);
  assert.match(route, /user_id\.eq/);
  assert.match(route, /email\.eq/);
});

test("guest payments are claimed and applications cover jobs and opportunities", async () => {
  const [claim, applications, nav, job, opportunity] = await Promise.all([
    read("src/app/api/account/claim-purchases/route.ts"),
    read("src/app/api/account/applications/route.ts"),
    read("src/components/account/AccountShellClient.tsx"),
    read("src/components/jobs/ApplyModal.tsx"),
    read("src/components/opportunities/ApplyModal.tsx"),
  ]);
  for (const table of ["purchases", "business_service_orders", "membership_subscriptions", "skill_to_business_purchases", "consultation_bookings", "event_registrations"]) assert.ok(claim.includes(`"${table}"`));
  assert.match(applications, /opportunity_id/);
  assert.match(applications, /job_id/);
  assert.match(nav, /\/account\/applications/);
  assert.match(job, /itemType: "job"/);
  assert.match(opportunity, /itemType: "opportunity"/);
});
