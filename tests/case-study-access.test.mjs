import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real TypeScript handlers against isolated auth/database doubles.
function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, Response, URL, process: { env: { CRON_IMPORT_SECRET: 'cron', NEXT_PUBLIC_SUPABASE_URL: 'https://example.test', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } },
    require: (name) => {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    },
  }, { filename: file });
  return module.exports;
}

function database() {
  const calls = [];
  const query = {};
  for (const method of ['from', 'select', 'order', 'range', 'eq', 'insert']) {
    query[method] = (...args) => { calls.push([method, ...args]); return query; };
  }
  query.then = (resolve) => resolve({ data: [], error: null, count: 0 });
  query.single = async () => ({ data: { id: 'new' }, error: null });
  return { query, calls };
}
function handler(file, allowed) {
  const db = database();
  const exports = load(file, {
    '@/lib/auth/verifyAdmin': { verifyAdmin: async () => allowed },
    '@supabase/supabase-js': { createClient: () => db.query },
    'next/server': { NextResponse: Response },
  });
  return { ...exports, calls: db.calls };
}
const routes = [
  'src/app/api/case-studies/route.ts',
  'src/app/api/case-studies/insert/route.ts',
  'src/app/api/admin/case-studies/route.ts',
  'src/app/admin/case-studies/route.ts',
];
for (const file of routes) {
  test(`${file}: denied callers cannot write or parse a body`, async () => {
    const { POST, calls } = handler(file, false);
    const response = await POST(new Request('https://example.test', { method: 'POST', body: 'invalid json' }));
    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  });
  test(`${file}: authorized admin can create a case study`, async () => {
    const { POST, calls } = handler(file, true);
    const response = await POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify({
      title: 'Fixture', slug: 'fixture', category: 'Retail', business_size: 'Small', challenge: 'Fixture only', is_published: false,
    }) }));
    assert.equal(response.status, 200);
    assert.ok(calls.some(([method]) => method === 'insert'));
  });
}
test('public read filters publication, selects explicit fields and caps pagination', async () => {
  const { GET, calls } = handler(routes[0], false);
  assert.equal((await GET(new Request('https://example.test/?pageSize=999&page=Infinity'))).status, 200);
  assert.ok(calls.some(([m,k,v]) => m === 'eq' && k === 'is_published' && v === true));
  assert.ok(calls.some(([m,start,end]) => m === 'range' && start === 0 && end === 23));
  assert.ok(calls.filter(([m]) => m === 'select').every(([,fields]) => !fields.includes('*')));
});
for (const file of [routes[0], routes[3]]) {
  test(`${file}: denied draft read never reaches database`, async () => {
    const { GET, calls } = handler(file, false);
    assert.equal((await GET(new Request('https://example.test/?published=false'))).status, 403);
    assert.equal(calls.length, 0);
  });
  test(`${file}: admin can read drafts`, async () => {
    const { GET, calls } = handler(file, true);
    assert.equal((await GET(new Request('https://example.test/?published=false'))).status, 200);
    assert.ok(!calls.some(([m,k]) => m === 'eq' && k === 'is_published'));
  });
}
for (const [name, token, role, valid, expected] of [
  ['anonymous', '', 'admin', true, false],
  ['ordinary member', 'member', 'member', true, false],
  ['expired token', 'expired', 'admin', false, false],
  ['cron secret', 'cron', 'member', false, false],
  ['admin session', 'admin', 'admin', true, true],
]) {
  test(`admin guard: ${name}`, async () => {
    const query = { select: () => query, eq: () => query, single: async () => ({ data: { role } }) };
    const { verifyAdmin } = load('src/lib/auth/verifyAdmin.ts', {
      '@supabase/supabase-js': { createClient: () => ({ auth: { getUser: async () => ({ data: { user: valid ? { id: 'id' } : null }, error: valid ? null : new Error('Invalid') }) } }) },
      '@/lib/supabase/admin': { supabaseAdmin: () => ({ from: () => query }) },
    });
    const req = new Request('https://example.test', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    assert.equal(await verifyAdmin(req), expected);
  });
}
