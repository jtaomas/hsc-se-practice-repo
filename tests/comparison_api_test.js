'use strict';
const assert=require('node:assert/strict');
const {createHandler}=require('../api/compare');
const input=require('../server/comparison-input'),marking=require('../server/marking-input');
const marker=require('../server/marking-engine');
const bank=input.bankFor('1');
const part={id:'1.0',questionNumber:1,partIndex:0,topic:'Programming',type:'closed response',question:'Choose.',stimulus:'',criteria:[{id:'c1',text:'Correct choice.'}],sample:'A',maxMarks:1,answer:'A',mark:1,status:'marked',source:'automatic',feedback:{summary:'Correct.',strengths:[],improve:[],advice:[],criteria:[{id:'c1',assessment:'met',evidence:['A'],basis:'Correct.'}]}};
function snapshot(id){return {version:1,bankId:'1',questionSetVersion:marking.digest(bank),markingHarness:marker.HARNESS_VERSION,participantId:id.repeat(64),createdAt:1,expiresAt:9999999999999,parts:[part],coverage:{includedParts:1,excludedParts:40,totalParts:41}}}
function context(){
 const records=new Map(),calls=[];let failure='';
 const markingStore={async authorize(h){calls.push('auth');if(h.authorization!=='Bearer mock')throw input.error(401,'auth_required','Sign in.');return {id:'a'.repeat(64)}},async getCached(){calls.push('mark-cache');return null}};
 const sharing={async loadPaper(){calls.push('paper');return {done:true,ans:{'1.0':bank.qs[0].it[0].a}}},async sign(v){calls.push('sign');return {snapshot:v,signature:'mock'}},async verify(v){calls.push('verify');if(failure==='signature')throw input.error(403,'invalid_export_signature','Changed evidence.');return v.snapshot}};
 const store={async getCached(owner,d){calls.push('cache');return records.get(owner+d)||null},async getOrReserve(){calls.push('reserve');if(failure==='quota')throw input.error(429,'quota_exceeded','Limit reached.');return failure==='busy'?{state:'busy'}:{state:'reserved',leaseId:'lease'}},async finish(owner,d,l,v){calls.push('finish');if(failure==='persist')throw new Error('PRIVATE STORAGE BODY');records.set(owner+d,v)},async fail(){calls.push('fail')}};
 const engine={MODEL:'deepseek-flash',HARNESS_VERSION:'test-1',canonicalData(v){calls.push('validate');if(failure==='size')throw input.error(413,'comparison_input_limit','Too large.');return v},async compare(v){calls.push('model');if(failure==='provider')throw input.error(502,'provider_error','Provider unavailable.');return {status:failure==='veto'?'needs_review':'complete',profiles:[],comparisons:[],summary:'Synthetic comparison.',audit:{}}}};
 const env={DEEPSEEK_API_KEY:'synthetic-only'};
 return {calls,records,markingStore,sharing,store,engine,env,setFailure:v=>{failure=v}};
}
async function invoke(handler,body,auth='Bearer mock',method='POST'){
 const r={headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(v){this.value=v;return this}};
 await handler({method,headers:{authorization:auth},body},r);return r;
}
(async()=>{
 const request={action:'compare',exports:[{snapshot:snapshot('a')},{snapshot:snapshot('b')}]};
 const c=context(),handler=createHandler(c);
 assert.equal((await invoke(handler,request,'')).code,401);assert(!c.calls.includes('verify'));
 const exported=await invoke(handler,{action:'export',bankId:'1',parts:[{questionNumber:1,partIndex:0,answer:bank.qs[0].it[0].a}]});
 assert.equal(exported.code,200);assert(exported.value.export);assert(!c.calls.includes('model'));
 let r=await invoke(handler,request);assert.equal(r.code,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(r.value.statistics.commonMaxMarks,1);assert(c.calls.indexOf('verify')<c.calls.indexOf('cache'));
 assert.equal(c.calls.at(-1),'finish');assert.equal(r.value.audit.requestedModel,'deepseek-flash');
  await invoke(handler,request);assert.equal(c.calls.filter(v=>v==='model').length,1,'cached result avoids provider');
  const refreshed=JSON.parse(JSON.stringify(request));refreshed.exports.forEach(v=>{v.snapshot.createdAt=200;v.snapshot.expiresAt=10000000000000});
  const cachedAgain=await invoke(handler,refreshed);assert.equal(cachedAgain.value.audit.evidenceCreatedAt[0],200);assert.equal(cachedAgain.value.audit.analysisCompletedAt,r.value.audit.analysisCompletedAt);assert.equal(c.calls.filter(v=>v==='model').length,1,'fresh export of same work reuses analysis and refreshes sharing dates');
 c.setFailure('signature');assert.equal((await invoke(handler,request)).code,403,'signature checked on cache hits');
 const d=context(),h=createHandler(d);d.env.DEEPSEEK_API_KEY='';assert.equal((await invoke(h,request)).value.code,'no_key');assert(!d.calls.includes('reserve'));
 d.env.DEEPSEEK_API_KEY='synthetic';
 for(const [failure,status] of [['busy',409],['quota',429],['size',413],['provider',502],['persist',503]]){
   d.setFailure(failure);const res=await invoke(h,request);assert.equal(res.code,status,failure);assert(!JSON.stringify(res.value).includes('PRIVATE'));if(['provider','persist'].includes(failure))assert.equal(d.calls.at(-1),'fail');
 }
 d.setFailure('veto');r=await invoke(h,request);assert.equal(r.value.status,'needs_review');assert.equal(r.value.statistics.participants[0].earned,1,'audit veto does not change original marks');
 assert.equal((await invoke(h,{...request,marks:[100]})).code,400);
 assert.equal((await invoke(h,{action:'compare',exports:[request.exports[0],request.exports[0]]})).code,400);
 assert.equal((await invoke(h,request,'Bearer mock','DELETE')).code,405);
 console.log('comparison API tests passed: authorization, signed snapshots, immutable totals, cache, limits and safe failures');
})().catch(e=>{console.error(e);process.exitCode=1});
