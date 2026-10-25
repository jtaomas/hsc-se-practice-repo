'use strict';
const assert=require('node:assert/strict');
const {createHandler}=require('../api/compare');
const input=require('../server/comparison-input'),marking=require('../server/marking-input');
const marker=require('../server/marking-engine');
const realEngine=require('../server/comparison-engine'),policy=require('../server/comparison-policy');
const {canonicalDigest}=require('../server/feedback-integrity');
const bank=input.bankFor('1');
const part={id:'1.0',questionNumber:1,partIndex:0,topic:'Programming',type:'closed response',question:'Choose.',stimulus:'',criteria:[{id:'c1',text:'Correct choice.'}],sample:'A',maxMarks:1,answer:'A',mark:1,status:'marked',source:'automatic',feedback:{summary:'Correct.',strengths:[],improve:[],advice:[],criteria:[{id:'c1',assessment:'met',evidence:['A'],basis:'Correct.'}]}};
function snapshot(id){return {version:1,bankId:'1',questionSetVersion:marking.digest(bank),markingHarness:marker.HARNESS_VERSION,participantId:id.repeat(64),createdAt:1,expiresAt:9999999999999,parts:[part],coverage:{includedParts:1,excludedParts:40,totalParts:41}}}
function profile(person){return {participantId:person.id,findings:[{id:'f1',kind:'strength',category:'technical_accuracy',errorType:null,scope:'single_response',statement:'The recorded selection is correct.',action:'',evidence:[{participantId:person.id,questionId:'1.0',criterionId:'c1',source:'answer',quote:'A'}]}]}}
function audit(people){const stages=people.map(p=>'profile:'+p.id).concat(['synthesis','auditor']);return {harnessVersion:realEngine.HARNESS_VERSION,requestedModel:realEngine.MODEL,reasons:[],checks:Object.fromEntries(['completed','modelMatch','outputSchema','evidenceSupported','blindProfiles','auditorApproved'].map(id=>[id,true])),calls:stages.map(stage=>({stage,status:'completed',finishReason:'stop',requestedModel:realEngine.MODEL,returnedModel:realEngine.MODEL})),returnedModels:stages.map(()=>realEngine.MODEL),auditor:{checks:Object.fromEntries(policy.AUDIT_FLAGS.map(id=>[id,'pass'])),issueCount:0}}}
function reseal(report){report.audit.resultDigest=canonicalDigest({status:report.status,summary:report.summary,profiles:report.profiles,comparisons:report.comparisons,statistics:report.statistics})}
function context(){
 const records=new Map(),calls=[];let failure='',mutateResult=()=>{};
 const markingStore={async authorize(h){calls.push('auth');if(h.authorization!=='Bearer mock')throw input.error(401,'auth_required','Sign in.');return {id:'a'.repeat(64)}},async getCached(){calls.push('mark-cache');return null}};
 const sharing={async loadPaper(){calls.push('paper');return {done:true,ans:{'1.0':bank.qs[0].it[0].a}}},async sign(v){calls.push('sign');return {snapshot:v,signature:'mock'}},async verify(v){calls.push('verify');if(failure==='signature')throw input.error(403,'invalid_export_signature','Changed evidence.');return v.snapshot}};
 const store={async getCached(owner,d){calls.push('cache');return failure==='reservation_cache'?null:records.get(owner+d)||null},async getOrReserve(owner,d){calls.push('reserve');if(failure==='quota')throw input.error(429,'quota_exceeded','Limit reached.');return failure==='busy'?{state:'busy'}:records.has(owner+d)?{state:'cached',result:records.get(owner+d)}:{state:'reserved',leaseId:'lease'}},async finish(owner,d,l,v){calls.push('finish');if(failure==='persist')throw new Error('PRIVATE STORAGE BODY');records.set(owner+d,v)},async fail(){calls.push('fail')}};
 const engine={...realEngine,canonicalData(v){calls.push('validate');if(failure==='size')throw input.error(413,'comparison_input_limit','Too large.');return realEngine.canonicalData(v)},async compare(v){calls.push('model');if(failure==='provider')throw input.error(502,'provider_error','Provider unavailable.');const result={status:failure==='veto'?'needs_review':'complete',profiles:failure==='veto'?[]:v.participants.map(profile),comparisons:[],summary:'Synthetic comparison.',audit:audit(v.participants)};if(failure==='veto'){result.audit.reasons=['auditor_veto'];result.audit.checks.auditorApproved=false;result.audit.auditor.checks.evidenceSupported='fail';result.audit.auditor.issueCount=1}mutateResult(result);return result}};
 const env={DEEPSEEK_API_KEY:'synthetic-only'};
 return {calls,records,markingStore,sharing,store,engine,env,setFailure:v=>{failure=v},mutateResult:fn=>{mutateResult=fn}};
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
 assert.equal(c.calls.at(-1),'finish');assert.equal(r.value.audit.requestedModel,realEngine.MODEL);
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
 const mutations=[
  ['approval',r=>{r.audit.checks.auditorApproved=false}],['positive audit',r=>{r.audit.auditor.checks.evidenceSupported='fail';r.audit.auditor.issueCount=1}],
  ['legacy booleans',r=>{r.audit.auditor.checks.evidenceSupported=true}],['missing check',r=>{delete r.audit.auditor.checks.evidenceSupported}],
  ['stage',r=>{r.audit.calls[0].stage='profile:p8'}],['completion',r=>{r.audit.calls[0].finishReason='length'}],
  ['missing call',r=>{r.audit.calls.pop()}],['returned model',r=>{r.audit.returnedModels[0]='wrong'}],['stage model',r=>{r.audit.calls[0].returnedModel='wrong'}],
  ['input',r=>{r.audit.inputDigest='f'.repeat(64)}],['bank version',r=>{r.audit.questionSetVersion='f'.repeat(64)}],
  ['harness',r=>{r.audit.harnessVersion='old'}],['model',r=>{r.audit.requestedModel='wrong'}],['analysis date',r=>{r.audit.analysisCompletedAt=null}],
  ['changed prose',r=>{r.summary+=' Unapproved narrative.'}],['changed score',r=>{r.statistics.participants[0].earned=99},true],
  ['fabricated citation',r=>{r.profiles[0].findings[0].evidence[0].quote='Not in the response.'},true],
  ['wrong criterion',r=>{r.profiles[0].findings[0].evidence[0].criterionId='unknown'},true],
  ['wrong participant',r=>{r.profiles[0].findings[0].evidence[0].participantId='p2'},true],
  ['missing profile',r=>{r.profiles.pop()},true],['duplicate profile',r=>{r.profiles[1]=JSON.parse(JSON.stringify(r.profiles[0]))},true],
  ['extra field',r=>{r.mark=99},true],['invented shortfall',r=>{r.profiles[0].findings[0].kind='criterion_shortfall';r.profiles[0].findings[0].errorType='conceptual_confusion';r.profiles[0].findings[0].action='Change a correct response.'},true]
 ];
 for(const path of ['direct','reservation'])for(const [name,mutate,seal] of mutations){
  const c=context(),h=createHandler(c);assert.equal((await invoke(h,request)).code,200);
  const saved=[...c.records.values()][0];mutate(saved);if(seal)reseal(saved);const before=JSON.stringify(saved);
  c.calls.length=0;if(path==='direct')c.env.DEEPSEEK_API_KEY='';else c.setFailure('reservation_cache');
  const rejected=await invoke(h,request);assert.equal(rejected.code,503,name+':'+path);assert.equal(rejected.value.code,'invalid_comparison_cache');
  assert.equal(rejected.value.statistics,undefined);assert(!c.calls.includes('model'));assert(!c.calls.includes('finish'));assert(!c.calls.includes('fail'));
  assert.equal(c.calls.includes('reserve'),path==='reservation');assert.equal(JSON.stringify(saved),before);
 }
 for(const path of ['direct','reservation']){
  const c=context();c.setFailure('veto');const h=createHandler(c);assert.equal((await invoke(h,request)).value.status,'needs_review');
  c.calls.length=0;if(path==='direct')c.env.DEEPSEEK_API_KEY='';else c.setFailure('reservation_cache');
  const accepted=await invoke(h,request);assert.equal(accepted.code,200);assert.equal(accepted.value.status,'needs_review');assert(!c.calls.includes('model'));
  const saved=[...c.records.values()][0];saved.profiles=[profile({id:'p1'})];reseal(saved);
  assert.equal((await invoke(h,request)).value.code,'invalid_comparison_cache','review cannot release unapproved findings');
 }
 for(const mutate of [r=>{r.audit.checks.auditorApproved=false},r=>{r.profiles[0].findings[0].evidence[0].quote='Invented.'},r=>{r.audit.calls=[]}]){
  const c=context();c.mutateResult(mutate);const rejected=await invoke(createHandler(c),request);
  assert.equal(rejected.code,502);assert.equal(rejected.value.code,'invalid_result');assert(!c.calls.includes('finish'));assert(c.calls.includes('fail'));assert.equal(c.records.size,0);
 }
 // Actual comparison orchestration behind the API, with only fake Responses.
 const integrated=context();let providerCalls=0;
 integrated.engine={...realEngine,compare:(data,options)=>realEngine.compare(data,{...options,fetch:async(_url,request)=>{
  providerCalls++;const payload=JSON.parse(JSON.parse(request.body).messages[1].content);let output;
  if(payload.participant)output={status:'complete',...profile(payload.participant),uncertainties:[]};
  else if(payload.proposedSynthesis)output={checks:Object.fromEntries(policy.AUDIT_FLAGS.map(id=>[id,'pass'])),issues:[]};
  else output={status:'complete',summary:'Both recorded selections are correct.',comparisons:[],uncertainties:[]};
  return new Response(JSON.stringify({model:realEngine.MODEL,choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]}));
 }})};
 const ih=createHandler(integrated),completed=await invoke(ih,request);
 assert.equal(completed.code,200);assert.equal(completed.value.status,'complete');assert.equal(providerCalls,4);
 assert.match(completed.value.audit.resultDigest,/^[a-f0-9]{64}$/);
 integrated.env.DEEPSEEK_API_KEY='';const reloaded=await invoke(ih,request);assert.equal(reloaded.code,200);assert.equal(providerCalls,4);
 assert.deepEqual(reloaded.value.statistics,completed.value.statistics);
 console.log('comparison API tests passed: authorization, signed snapshots, verified cached/fresh reports, canonical totals, completed positive audits, no reroll, limits and complete mocked workflow');
})().catch(e=>{console.error(e);process.exitCode=1});
