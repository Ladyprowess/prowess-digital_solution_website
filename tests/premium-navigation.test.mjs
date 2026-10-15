import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { module, exports: module.exports, require: name => {
    if (name in imports) return imports[name];
    throw Error(name);
  }, ...globals });
  return module.exports;
}
const redirects = load('src/lib/auth/memberRedirect.ts');
test('membership and editor destinations survive login, including query parameters', () => {
  for (const path of ['/account/membership', '/account/membership?tx_ref=PREM-123', '/tools/cv-builder/editor?id=cv1&template=plain']) {
    const login = new URL(redirects.memberLoginUrl(path), 'https://example.com');
    assert.equal(redirects.memberRedirect(login.searchParams.get('redirect')), path);
  }
});
test('login destinations reject external URLs and executable schemes', () => {
  for (const path of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '/\nevil.test']) {
    assert.equal(redirects.memberRedirect(path), '/account');
  }
});
test('signed-out member guard preserves checkout destination instead of dropping it', async () => {
  let destination;
  const { useMemberSession } = load('src/lib/useMemberSession.ts', {
    react: { useCallback: fn => fn, useEffect() {}, useState: initial => [initial, () => {}] },
    'next/navigation': { useRouter: () => ({ replace: url => { destination = url; } }) },
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } },
    '@/lib/auth/memberRedirect': redirects,
  }, { window: { location: { pathname: '/account/membership', search: '?tx_ref=PREM-123' } } });
  await useMemberSession().reload();
  assert.equal(destination, '/account/login?redirect=%2Faccount%2Fmembership%3Ftx_ref%3DPREM-123');
});
test('every career upgrade surface links to membership, including locked CV templates', () => {
  const gallery = fs.readFileSync('src/app/tools/cv-builder/CvBuilderPageClient.tsx', 'utf8');
  const lockedBranch = gallery.split('{locked ? (')[1].split(') : (')[0];
  assert.match(lockedBranch, /href="\/account\/membership"/);
  for (const file of ['src/app/tools/page.tsx', 'src/app/tools/cv-checker/CvCheckerPageClient.tsx', 'src/app/tools/interview-prep/InterviewPrepPageClient.tsx', 'src/app/tools/portfolio-builder/PortfolioBuilderPageClient.tsx', 'src/app/tools/cv-builder/editor/page.tsx']) {
    assert.match(fs.readFileSync(file, 'utf8'), /href="\/account\/membership"/, file);
  }
});
