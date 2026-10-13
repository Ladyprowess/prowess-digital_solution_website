import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function render(file, kind, request) {
  const state = [], effects = [], timers = [];
  const react = {
    useState(value) { const index = state.length; state.push(value); return [value, next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
    useEffect(fn) { effects.push(fn); }, useMemo(fn) { return fn(); },
  };
  const mock = {
    ...react, PUBLIC_RESOURCE_TYPES: [], USE_CASES: [],
    useRouter: () => ({}), usePathname: () => '/resources', useSearchParams: () => new URLSearchParams(),
    filtersFromSearchParams: () => ({audience:'',type:'',useCase:'',q:'',page:1}), hasActiveFilters: () => false,
    jsx: (type, props) => ({type,props}), jsxs: (type, props) => ({type,props}),
    supabase: { from() {
      const query = new Proxy({}, { get(_, key) {
        return key === 'then' ? (resolve, reject) => request().then(resolve, reject) : () => query;
      } });
      return query;
    } },
  };
  const source = fs.readFileSync(file,'utf8') + (kind === 'resources' ? '\nexport { ResourcesPageContent };' : '');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module = {exports:{}};
  vm.runInNewContext(code, {
    module, exports:module.exports, require:() => mock, URLSearchParams,
    fetch:request, console:{error(){}}, setTimeout:fn => {timers.push(fn);return 1;},clearTimeout(){},
  });
  (kind === 'resources' ? module.exports.ResourcesPageContent : module.exports.default)();
  return {state, async run() { effects[0](); for(const fn of timers.splice(0)) await fn(); await new Promise(resolve=>setImmediate(resolve)); }};
}
const files = {
  resources:'src/app/resources/page.tsx',
  careers:'src/app/career-paths/CareerPathsPageClient.tsx',
  cases:'src/app/case-studies/CaseStudiesPageClient.tsx',
};
for(const [kind,file] of Object.entries(files)) {
  for(const failure of ['network','response']) {
    test(`${kind}: ${failure} failure stops loading, shows error, then retry recovers`,async()=>{
      let fail=true;
      const request=async()=>{
        if(fail && failure==='network') throw new Error('Offline');
        if(kind==='careers') return {data:fail?null:[],error:fail?{message:'Database failure'}:null};
        return Response.json(fail?{ok:false,error:'Unavailable'}:{ok:true,items:[],total:0,pagination:{page:1,pageSize:6,total:0,totalPages:1}},{status:fail?500:200});
      };
      const component=render(file,kind,request);
      const loading=kind==='resources'?2:1, error=loading+1;
      await component.run();
      assert.equal(component.state[loading],false);
      assert.equal(component.state[error],true);
      await (async()=>{fail=false;await component.run();})();
      assert.equal(component.state[loading],false);
      assert.equal(component.state[error],false);
    });
  }
}
