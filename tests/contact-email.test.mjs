import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, ...globals });
  return module.exports;
}
const templates = load('src/lib/emails/contact.ts');
const enquiry = { full_name: 'Example Client', email: 'client@example.com', phone: '', business_stage: 'Growing', inquiry_type: 'Business Structure Diagnostic', message: 'Please review my business.\nMy goal is clearer operations.' };

test('both HTML emails escape submitted content and retain line breaks', () => {
  for (const render of Object.values(templates)) {
    const result = render({ ...enquiry, full_name: '<img src=x>', message: '<script>alert(1)</script>\nSecond line' });
    assert.ok(!result.html.includes('<script>'));
    assert.ok(!result.html.includes('<img src=x>'));
    assert.ok(result.html.includes('&lt;script&gt;alert(1)&lt;/script&gt;<br>Second line'));
    assert.ok(result.text.includes('Second line'));
  }
});

function route(errors = []) {
  const sent = [];
  const { POST } = load('src/app/api/contact/route.ts', {
    process: { env: { RESEND_TO: 'team@example.com', RESEND_FROM_EMAIL: 'Prowess <hello@example.com>' } },
    console: { error() {} },
    require(name) {
      if (name === '@/lib/emails/contact') return templates;
      if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === 'resend') return { Resend: class { emails = { send: async (payload) => { sent.push(payload); return { error: errors[sent.length - 1] || null }; } }; } };
      if (name === '@supabase/supabase-js') return { createClient: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }) };
      throw new Error(name);
    },
  });
  return { sent, submit: () => POST(new Request('https://example.com/api/contact', { method: 'POST', body: JSON.stringify(enquiry) })) };
}

test('admin notification and customer acknowledgement have separate recipients and reply addresses', async () => {
  const { sent, submit } = route();
  assert.equal((await submit()).status, 200);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, 'team@example.com');
  assert.equal(sent[0].replyTo, enquiry.email);
  assert.equal(sent[1].to, enquiry.email);
  assert.equal(sent[1].replyTo, 'team@example.com');
  assert.ok(sent[1].text.includes('confirm whether the diagnostic is appropriate'));
  assert.ok(!sent[1].text.includes('respond directly to the enquirer'));
});

test('receipt failure does not reject an already delivered enquiry', async () => {
  const { submit } = route([null, { message: 'Receipt unavailable' }]);
  assert.equal((await submit()).status, 200);
});

test('admin delivery failure does not send a misleading customer acknowledgement', async () => {
  const { sent, submit } = route([{ message: 'Delivery unavailable' }]);
  assert.equal((await submit()).status, 500);
  assert.equal(sent.length, 1);
});
