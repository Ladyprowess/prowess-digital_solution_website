import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sanitizeHtml from 'sanitize-html';
function load(path,modules={}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,require:n=>{if(n in modules)return modules[n];throw Error(n);}});
 return module.exports;
}
const escape=load('src/lib/payments/emailEscape.ts');
const layout=load('src/lib/emails/layout.ts',{'sanitize-html':{default:sanitizeHtml},'../payments/emailEscape':escape});
const cv=load('src/lib/emails/cvChecker.ts',{'./layout':layout,'../payments/emailEscape':escape});
test('plain emails receive branding and a readable text alternative',()=>{
 const email=layout.prepareEmail('<p>Your membership is active.</p>','Membership confirmed');
 assert.match(email.html,/PROWESS DIGITAL SOLUTIONS/);assert.match(email.html,/max-width:600px/);
 assert.match(email.text,/Your membership is active/);assert.doesNotMatch(email.text,/<style|@media|<table/);
});
test('designed emails do not get nested branded layouts',()=>{
 const email=layout.prepareEmail(layout.emailFrame('Ready','<p>Done</p>'),'Ready');
 assert.equal((email.html.match(/PROWESS DIGITAL SOLUTIONS/g)||[]).length,1);
 assert.equal((email.html.match(/<html/g)||[]).length,1);
});
test('CV templates escape user content and keep admin document access separate',()=>{
 const data={fullName:'<script>bad</script>',email:'client@example.com',phone:'',targetRole:'Design & operations',careerLevel:'Senior',reviewFocus:'First line\nSecond line',fileName:'CV.pdf',fileSize:2048};
 const admin=cv.cvAdminEmail(data,'https://example.com/document?token=a&b=2');const customer=cv.cvCustomerEmail(data);
 assert.doesNotMatch(admin.html,/<script>/);assert.match(admin.html,/First line<br>Second line/);
 assert.match(admin.html,/token=a&amp;b=2/);assert.doesNotMatch(customer.html,/token=/);
 assert.match(customer.html,/manual review/);assert.match(customer.html,/PROWESS DIGITAL SOLUTIONS/);
});
test('email buttons reject non-web URLs',()=>assert.equal(layout.emailButton('Open','javascript:alert(1)'),''));
// Write local previews only; no provider or recipient is contacted.
if(process.env.EMAIL_PREVIEW_DIR){
 fs.mkdirSync(process.env.EMAIL_PREVIEW_DIR,{recursive:true});
 const data={fullName:'Ada Okafor',email:'ada@example.com',phone:'',targetRole:'Operations Manager',careerLevel:'Mid career',reviewFocus:'I would like feedback on how clearly I describe my achievements.',fileName:'Ada-CV.pdf',fileSize:123456};
 fs.writeFileSync(`${process.env.EMAIL_PREVIEW_DIR}/cv-admin.html`,layout.prepareEmail(cv.cvAdminEmail(data,'https://example.com/document').html,'CV review').html);
 fs.writeFileSync(`${process.env.EMAIL_PREVIEW_DIR}/cv-customer.html`,layout.prepareEmail(cv.cvCustomerEmail(data).html,'CV review').html);
}

test('plain-text alternatives retain action URLs',()=>{const email=layout.prepareEmail(layout.emailButton('Open your learning','https://prowessdigitalsolutions.com/learn'),'Learning');assert.match(email.text,/https:\/\/prowessdigitalsolutions.com\/learn/);});
