'use strict';
const assert = require('node:assert/strict');
const input = require('../server/comparison-input');
const marking = require('../server/marking-input');
const marker = require('../server/marking-engine');
const { QUALITY_FACTORS } = require('../server/feedback-policy');
const { markerAudit } = require('./improvement_fixtures');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');

function markedFixture(answer = 'Hashing is one way.') {
  const payload = { bankId:'1', questionNumber:18, partIndex:0, answer };
  const p = marking.prepare(payload), inputDigest = marking.digest({ input:p.input, questionVersion:p.questionVersion, rubricVersion:p.rubricVersion, model:marker.MODEL, harness:marker.HARNESS_VERSION });
  // Synthetic, mock-only one-mark record with the complete current contract.
  const result = { status:'marked',mark:1,summary:'One requirement demonstrated.',strengths:['Identifies hashing.'],improve:['Explain salting.'],advice:[],
    criteria:p.input.criteria.map(c => ({id:c.id,assessment:c.id==='c3'?'met':'context',evidence:c.id==='c3'?['Hashing']:[],basis:c.id==='c3'?'Identifies hashing.':'Unselected higher comparison band.'})),
    losses:{allocation:'holistic',totalLost:2,items:[{category:'missing_requirement',marksLost:null,criterionIds:['c1','c2'],evidence:['Hashing'],explanation:'The salting mechanism is not explained.',action:'Explain what a unique salt changes and how that protects passwords.'}]},
    quality:QUALITY_FACTORS.map(id=>({id,rating:id==='clarity'?8:null,evidence:id==='clarity'?['Hashing']:[],feedback:id==='clarity'?'The named concept is understandable.':'This synthetic fixture does not assess this factor.',action:id==='clarity'?'Keep naming the concept clearly.':'Review applicable response evidence before assessing this factor.'})),
    audit:{inputDigest,questionVersion:p.questionVersion,rubricVersion:p.rubricVersion,harnessVersion:marker.HARNESS_VERSION} };
  Object.assign(result.audit,markerAudit(result));
  return { payload, inputDigest, result };
}
async function fixtureSnapshot(owner='a') {
  const f=markedFixture();
  const snapshot=await input.prepareExport({action:'export',bankId:'1',parts:[{questionNumber:18,partIndex:0,answer:f.payload.answer,markingDigest:f.inputDigest}]},{done:true,ans:{'18.0':f.payload.answer}},async () => f.result);
  return Object.assign(snapshot,{participantId:owner.repeat(64),createdAt:1,expiresAt:1000});
}
(async () => {
  assert.throws(() => input.body('{"action":"compare","action":"export"}'), /valid comparison/);
  assert.throws(() => input.body('x'.repeat(input.MAX_BODY_BYTES+1)), /2 MiB/);
  const f=markedFixture(), row={questionNumber:18,partIndex:0,answer:f.payload.answer,markingDigest:f.inputDigest};
  const req={action:'export',bankId:'1',parts:[row]}, paper={done:true,ans:{'18.0':f.payload.answer}};
  await assert.rejects(input.prepareExport(req,{...paper,done:false},async()=>f.result), /Submit and sync/);
  await assert.rejects(input.prepareExport(req,{...paper,ans:{'18.0':'changed'}},async()=>f.result), /saved answer changed/);
  await assert.rejects(input.prepareExport({...req,mark:3},paper,async()=>f.result), /identifiers/);
  await assert.rejects(input.prepareExport({...req,parts:[row,row]},paper,async()=>f.result), /unique/);
  await assert.rejects(input.prepareExport(req,{...paper,self:{'18.0':3}},async()=>f.result), /no verified/i);
  await assert.rejects(input.prepareExport({...req,parts:[{...row,markingDigest:'0'.repeat(64)}]},paper,async()=>f.result), /no verified/i);
  await assert.rejects(input.prepareExport(req,paper,async()=>({...f.result,status:'needs_review',mark:null})), /no verified/i);
  await assert.rejects(input.prepareExport(req,paper,async()=>({...f.result,audit:{...f.result.audit,rubricVersion:'old'}})), /no verified/i);
  // A status/hash match alone cannot sign unapproved, changed or unsupported feedback.
  for(const mutate of [
    r=>{r.audit.requestedModel='other-model'},
    r=>{r.audit.checks.auditorApproved=false},
    r=>{r.audit.checks.blindAgreement=false},
    r=>{r.audit.auditor.checks[Object.keys(marker.AUDIT_CHECKS)[0]]='fail'},
    r=>{r.audit.auditor.issueCount=1},
    r=>{r.audit.returnedModels[0]='other-model'},
    r=>{r.audit.selectedFeedback=1},
    r=>{r.audit.feedbackDigest='0'.repeat(64)},
    r=>{r.summary='Changed but superficially valid feedback.'},
    r=>{delete r.audit.feedbackDigest}
  ]){
    const changed=JSON.parse(JSON.stringify(f.result));mutate(changed);
    await assert.rejects(input.prepareExport(req,paper,async()=>changed),/no verified/i);
  }
  // A checksum is not authentication: source/diagnostic validation still rejects
  // altered evidence even when the mock checksum is deliberately recomputed.
  for(const mutate of [
    r=>{r.criteria.find(c=>c.id==='c3').evidence=['Invented student quotation']},
    r=>{r.quality[0].evidence=['Invented quality quotation']},
    r=>{r.losses.items[0].evidence=['Invented loss quotation']},
    r=>{r.losses.totalLost=0}
  ]){
    const changed=JSON.parse(JSON.stringify(f.result));mutate(changed);changed.audit.feedbackDigest=marker.selectedFeedbackDigest(changed);
    assert.equal(marker.confirmedProvenanceProblem(changed),null,'the independent canonical-evidence layer is required');
    await assert.rejects(input.prepareExport(req,paper,async()=>changed),/no verified/i);
  }
  const snapshot=await fixtureSnapshot(), other=await fixtureSnapshot('b');
  assert.deepEqual(snapshot.parts[0].feedback.losses,f.result.losses,'verified holistic shortfall targets survive export without relabelling bands');
  assert.equal(snapshot.parts[0].feedback.criteria.find(c=>c.id==='c1').assessment,'context');
  const direct=await input.prepareExport(req,paper,async()=>f.result);
  direct.parts[0].feedback.losses.items[0].criterionIds.push('modified-copy');
  assert.deepEqual(f.result.losses.items[0].criterionIds,['c1','c2'],'export copies must not mutate approved cached losses');
  const html=markedFixture('Hashing <script> and A & B.');
  const htmlExport=await input.prepareExport({action:'export',bankId:'1',parts:[{questionNumber:18,partIndex:0,answer:html.payload.answer,markingDigest:html.inputDigest}]},{done:true,ans:{'18.0':'<p>Hashing &lt;script&gt; and A &amp; B.</p>'}},async()=>html.result);
  assert.equal(htmlExport.parts[0].answer,html.payload.answer,'literal tag examples survive rich-text export');
  const spaces=markedFixture('Hashing\u00a0protects passwords.');
  const spaceExport=await input.prepareExport({action:'export',bankId:'1',parts:[{questionNumber:18,partIndex:0,answer:spaces.payload.answer,markingDigest:spaces.inputDigest}]},{done:true,ans:{'18.0':'<p>Hashing&nbsp;protects passwords.</p>'}},async()=>spaces.result);
  assert.equal(spaceExport.parts[0].answer,spaces.payload.answer,'browser non-breaking spaces preserve marking identity');
  assert(input.bankFor('7').qs.length===27,'newly published paper available to comparison');
  const visualQuestion=input.bankFor('1').qs[0], oldStimulus=visualQuestion.st;
  try {
    visualQuestion.st='<svg><line x1="1" y1="2" x2="3" y2="4"/></svg>';
    const selected={action:'export',bankId:'1',parts:[{questionNumber:1,partIndex:0,answer:null}]};
    const visual=await input.prepareExport(selected,{done:true,ans:{'1.0':null}},()=>null);
    assert.match(visual.parts[0].stimulus,/<line x1="1" y1="2" x2="3" y2="4"/);
    visualQuestion.st='<img src="https://example.invalid/missing.png">';
    await assert.rejects(input.prepareExport(selected,{done:true,ans:{'1.0':null}},()=>null),/no verified/);
  } finally { visualQuestion.st=oldStimulus; }
  const dd=input.closedEvidence(input.bankFor('1').qs[1].it[0],{'0':1,'1':2});assert.match(dd.template,/without looking at the code/);assert.match(dd.template,/\{0\}/);
  const od=input.closedEvidence({t:'od',m:1,lines:[{k:'text',t:'BEGIN',lv:0},{k:'fixed',t:'count = 0',lv:1},{k:'slot',t:'count += 1',lv:2},{k:'text',t:'END',lv:0}],pool:['count += 1']},{'0':0});assert.match(od.template,/BEGIN\n  count = 0\n    \[Slot 1\]\nEND/);
  assert.equal(snapshot.parts[0].mark,1);assert.equal(snapshot.parts[0].source,'agentic');assert(snapshot.coverage.excludedParts>0);
  const prepared=input.cohort([snapshot,other]);
  assert.equal(prepared.statistics.commonMaxMarks,3);assert.equal(prepared.statistics.participants[0].percentage,33.3);
  assert.deepEqual(prepared.participants.map(p=>p.id),['p1','p2']);assert(!JSON.stringify(prepared).includes('a'.repeat(64)));
  assert.throws(()=>input.cohort([snapshot,snapshot]),/one export per/);
  assert.throws(()=>input.cohort([snapshot,{...other,questionSetVersion:'old'}]),/current paper/);
  assert.throws(()=>input.cohort([snapshot,{...other,bankId:'2'}]),/same current paper/);
  assert.throws(()=>input.cohort([snapshot,{...other,parts:[{...other.parts[0],id:'99.0'}]}]),/no commonly verified/);
  assert.throws(()=>input.cohort([snapshot]),/2 to 8/);
  // All bank closed scores match the browser's actual scoring functions, including new types.
  const context=vm.createContext({localStorage:{getItem:()=>null},window:{},document:{addEventListener:()=>{}},setTimeout,clearTimeout});
  for(const file of ['helpers.js','kit.js','widgets.js','qtypes.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),context);
  let count=0;
  for(const bank of marking.loadBanks())for(const q of bank.qs)for(const it of q.it){
    if(!context.AUTO[it.t])continue;
    const possible=[null];
    if(it.t==='mc')possible.push(it.a, (it.a+1)%it.o.length);
    if(it.t==='ms')possible.push(it.a,[],it.o.map((_,i)=>i));
    if(it.t==='dd')possible.push(Object.fromEntries(it.b.map((b,i)=>[i,b[1]])));
    if(it.t==='mt'||it.t==='dm')possible.push(Object.fromEntries(it.r.map((r,i)=>[i,r[1]])));
    if(it.t==='od')possible.push(Object.fromEntries(it.lines.filter(l=>l.k==='slot').map((l,i)=>[i,it.pool.indexOf(l.t)])));
    if(it.t==='gd'){const a={};it.r.forEach((r,ri)=>r.forEach((c,ci)=>{if(typeof c!=='string')a[ri+','+ci]=c[1]}));possible.push(a)}
    if(it.t==='tk')possible.push(it.r.flatMap((r,ri)=>r[1].map(ci=>ri+','+ci)));
    for(const answer of possible){context.S.u.test={ans:{'1.0':answer}};const expected=context.score({id:'test',qs:[{it:[it]}]},1,0).g;assert.equal(input.closedEvidence(it,answer).mark,expected,bank.id+' '+it.t);count++}
  }
  assert.throws(()=>input.closedEvidence({t:'ms',m:2,o:['a','b'],a:[0,1]},[0,0,1]),/invalid/);
  const richer=JSON.parse(JSON.stringify(other));richer.parts.push({...richer.parts[0],id:'20.0',maxMarks:10,mark:10});
  assert.equal(input.cohort([snapshot,richer]).statistics.participants[1].earned,1,'unmatched easy marks excluded from denominator and earned marks');
  console.log('comparison input tests passed; '+count+' closed scoring parity cases');
})().catch(e=>{console.error(e);process.exitCode=1});
module.exports={markedFixture,fixtureSnapshot};
