import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, globals={}) {
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,Date,JSON,...globals});
  return module.exports;
}

// Records every query-builder call and resolves with the given rows.
function fakeDb(rowsFor) {
  const calls=[];
  return {calls, from(table){
    const query=new Proxy({}, {get(_,method){
      if(method==='then')return resolve=>resolve({data:rowsFor(table),count:rowsFor(table).length,error:null});
      return (...args)=>{calls.push([table,method,...args]);return query;};
    }});
    return query;
  }};
}

const job={
  slug:'designer',title:'Product Designer',description:'<p>Design things</p>',responsibilities:'<ul><li>Ship</li></ul>',requirements:null,benefits:null,
  location_type:'on_site',country:'Nigeria',city:'Lagos',remote_regions:null,
  salary_min:100,salary_max:200,salary_currency:'ngn',salary_period:'month',
  deadline_at:'2026-12-01T00:00:00Z',expires_at:null,published_at:'2026-10-01T00:00:00Z',
  companies:{name:'Acme',website:'https://acme.test',logo_url:null},job_types:{name:'Full-time'},
};

test('job pages describe the posting in the format Google job search reads',()=>{
  const {jobPostingJsonLd}=load('src/lib/jobs/structuredData.ts');
  const data=jobPostingJsonLd(job,'https://www.example.test');
  assert.equal(data['@type'],'JobPosting');
  assert.equal(data.url,'https://www.example.test/jobs/designer');
  assert.equal(data.datePosted,job.published_at);
  assert.equal(data.validThrough,job.deadline_at);
  assert.equal(data.employmentType,'FULL_TIME');
  assert.equal(data.hiringOrganization.name,'Acme');
  assert.equal(data.jobLocation.address.addressLocality,'Lagos');
  assert.equal(data.baseSalary.currency,'NGN');
  assert.equal(data.baseSalary.value.unitText,'MONTH');
  assert.ok(data.description.includes('Responsibilities'));
});

test('remote jobs are marked as remote with their allowed regions',()=>{
  const {jobPostingJsonLd}=load('src/lib/jobs/structuredData.ts');
  const data=jobPostingJsonLd({...job,location_type:'remote',remote_regions:['Africa'],salary_currency:null},'https://www.example.test');
  assert.equal(data.jobLocationType,'TELECOMMUTE');
  assert.equal(data.applicantLocationRequirements[0].name,'Africa');
  assert.equal(data.jobLocation,undefined);
  assert.equal(data.baseSalary,undefined);
});

test('job text cannot break out of the structured data script tag',()=>{
  const {serializeJsonLd}=load('src/lib/jobs/structuredData.ts');
  const out=serializeJsonLd({description:'</script><script>alert(1)</script>'});
  assert.ok(!out.includes('</script>'));
  assert.equal(JSON.parse(out).description,'</script><script>alert(1)</script>');
});

test('job and opportunity searches only return live listings and respect filters',async()=>{
  const require=()=>({CLOSING_SOON_DAYS:7});
  const {fetchJobsPage}=load('src/lib/jobs/search.ts',{require});
  const db=fakeDb(()=>[{id:'1',slug:'a',title:'A',location_type:'remote',job_skill_map:[],companies:null}]);
  const filters={q:'design',category:'tech',type:'',locationType:'remote',country:'',remoteRegion:'',experience:'',skills:[],salaryMin:'',salaryMax:'',currency:'',datePosted:'',closingSoon:false,company:'',sort:'relevant',page:2};
  const page=await fetchJobsPage(db,filters,{categories:[{id:'c1',slug:'tech',name:'Tech'}],types:[],skills:[]});
  assert.equal(page.jobs[0].slug,'a');
  assert.ok(db.calls.some(([,m,k,v])=>m==='eq'&&k==='status'&&v==='published'));
  assert.ok(db.calls.some(([,m,f])=>m==='or'&&f.includes('expires_at')));
  assert.ok(db.calls.some(([,m,k,v])=>m==='eq'&&k==='category_id'&&v==='c1'));
  assert.ok(db.calls.some(([,m,from,to])=>m==='range'&&from===12&&to===23));

  const {fetchOpportunitiesPage}=load('src/lib/opportunities/search.ts',{require});
  const oppDb=fakeDb(()=>[]);
  const empty=await fetchOpportunitiesPage(oppDb,{q:'',type:'',locationType:'',eligibleLocation:'',skills:['unknown'],fundingType:'',applicationCost:'',deadlineWindow:'',sort:'relevant',page:1},{types:[],skills:[]});
  assert.equal(JSON.stringify(empty),JSON.stringify({opportunities:[],total:0}));
});

test('list pages load their first results on the server, not only in the browser',()=>{
  for(const file of ['src/app/jobs/page.tsx','src/app/opportunities/page.tsx']){
    const src=fs.readFileSync(file,'utf8');
    assert.match(src,/export default async function/);
    assert.match(src,/initial=\{initial\}/);
  }
});

test('every site link uses the www address the live site redirects to',()=>{
  const offenders=[];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(/\.(ts|tsx)$/.test(entry.name)&&fs.readFileSync(full,'utf8').includes('https://prowessdigitalsolutions.com'))offenders.push(full);
  }};
  walk('src');
  assert.deepEqual(offenders,[]);
});
