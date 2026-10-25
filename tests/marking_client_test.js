// Offline browser-contract regressions. All marking and execution responses are mocked.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
function client(){
  const storage=new Map(),timers=[],listeners={};
  const c={console,AbortController,window:{addEventListener(){}},location:{hash:'#/1/results'},
    document:{addEventListener(name,fn){(listeners[name]||(listeners[name]=[])).push(fn)},querySelector(){return null},querySelectorAll(){return []},createElement(){return {innerHTML:'',get textContent(){return this.innerHTML.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')}}}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval(){},
    fetch(){throw new Error('Unexpected network request')},acctText(){return 'Account'},SYNC:{epoch:0},AIMARKING_VERSION:'test-v2'};
  vm.createContext(c);
  for(const file of ['helpers.js','kit.js','widgets.js','qtypes.js','xd.js','ai.js','pages.js','pages2.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
  c.S.tok='test-session';c.S.owner='student@example.test';c.timers=timers;c.listeners=listeners;
  return c;
}
function paper(c,items,id='1'){
  const b={id,name:'Test paper',qs:[{tp:'Project',st:'<p>Canonical stimulus</p>',db:null,it:items}]};
  c.BANKS.push(b);const bs=c.BS(id);bs.done=true;bs.start=10;bs.doneAt=20;c.CUR={b,n:1,rv:true};return {b,bs};
}
function written(){return {t:'tx',q:'Explain one thing.',m:3,w:50,model:'Sample answer',crit:['3 marks for explanation.']}}
function practice(c,items){const p=paper(c,items);p.bs.done=false;p.bs.mode='practice';delete p.bs.doneAt;p.bs.pq={1:1};c.CUR.rv=false;c.location.hash='#/1/q/1';return p}
function result(mark=2){return {status:'marked',mark,summary:'Evidence supported this mark.',strengths:['One point explained.'],improve:['Explain the second point.'],advice:['Use a clearer example.'],criteria:[{id:'C1',assessment:'partial',evidence:['A point'],basis:'A link is missing.'}],audit:{requestedModel:'deepseek-flash',returnedModels:['deepseek-flash'],harnessVersion:'test-v2',questionVersion:'q1',rubricVersion:'r1',inputDigest:'digest'}}}
function provisional(mark=1){return {...result(mark),status:'provisional',summary:'The lower valid proposed mark remains unconfirmed.',strengths:[],improve:[],advice:[],losses:{allocation:'unavailable',totalLost:null,items:[]},quality:[]}}
function reply(body,status=200){return {ok:status>=200&&status<300,status,json:async()=>clone(body)}}
function defer(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
async function until(check){for(let i=0;i<100&&!check();i++)await Promise.resolve();assert(check(),'asynchronous operation did not start')}

(async()=>{
  // The client sends identity and answer only; local criteria, maximum and checks are never authoritative.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='<p>A point &amp; an example.</p>';bs.chk['1.0']={p:999,t:999};
    let request;c.fetch=async(url,r)=>{assert.equal(url,'/api/mark');request=r;return reply(result())};
    await c.runAI(b);
    assert.deepEqual(JSON.parse(request.body),{bankId:'1',questionNumber:1,partIndex:0,answer:'A point & an example.'});
    assert.equal(request.headers.authorization,'Bearer test-session');assert(request.signal);assert(c.timers.some(t=>t.ms===250000));
    assert.equal(c.score(b,1,0).g,2);assert.equal(c.score(b,1,0).src,'ai');
    const html=c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0));
    assert(html.includes('Further advice (not a mark deduction)'));assert(html.includes('Criterion evidence'));assert(html.includes('partial'));assert(html.includes('A link is missing.'));assert(html.includes('deepseek-flash'));assert(html.includes('r1'));
    function feedback(){return c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0))}
    bs.ai['1.0'].audit.durationMs=90123;assert(feedback().includes('Model assessment time: 90.1 seconds (excludes browser queue and transfer time)'));
    bs.ai['1.0'].audit.durationMs=0;assert(feedback().includes('Model assessment time: 0 seconds'));
    bs.ai['1.0'].audit.resolution='adjudicated';assert(feedback().includes('confirmed after disagreement resolution and audit'));assert(!feedback().includes('<h5>Provisional mark'));delete bs.ai['1.0'].audit.resolution;
    for(const duration of [undefined,null,'123',-1,Infinity,NaN,300001]){bs.ai['1.0'].audit.durationMs=duration;assert(!feedback().includes('Model assessment time:'))}
    c.AIMARKING_VERSION='new-harness';assert.equal(c.aiRecord(b,1,0),null);c.AIMARKING_VERSION='test-v2';assert(c.aiRecord(b,1,0));
    b.qs[0].it[0].crit=['A corrected rubric.'];assert.equal(c.aiRecord(b,1,0),null);assert.equal(c.aiTodo(b).length,1);assert.equal(c.score(b,1,0).set,false);
  }
  // Guests can sit and self-mark; no automatic or explicit AI request is made without a session.
  {
    const c=client(),{b,bs}=paper(c,[written()]);c.S.tok='';bs.ans['1.0']='An answer';
    await c.ensureMarked(b);await c.runAI(b);assert.equal(c.score(b,1,0).set,false);
    assert(c.aiStatusHTML(b).includes('Sign in'));bs.self['1.0']=2;assert.equal(c.score(b,1,0).g,2);
  }
  // Abstention is a completed result, not a zero, a retry candidate, or a mistake.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Ambiguous answer';let calls=0;
    c.fetch=async()=>{calls++;return reply({...result(),status:'needs_review',mark:null,summary:'Assessors could not agree.'})};
    await c.runAI(b);await c.runAI(b);
    assert.equal(calls,1);assert.equal(c.aiTodo(b).length,0);assert.equal(c.aiReviews(b),1);
    assert.equal(c.score(b,1,0).set,false);assert.equal(c.score(b,1,0).src,'needs_review');assert.equal(c.mistakeList().length,0);
    assert.equal(c.totals(b).P,3);assert.equal(c.totals(b).markedM,0);assert(c.resultsPage(b).includes('3 of 3 marks remain unscored'));
    assert(c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0)).includes('Needs review'));
    bs.self['1.0']=1;assert.equal(c.score(b,1,0).set,true);assert.equal(c.mistakeList().length,1);
  }
  // A provisional score is terminal but never enters assessed totals, mistake
  // deductions or verified feedback; an explicit self mark retains precedence.
  {
    const c=client(),{b,bs}=paper(c,[written(),written(),written()]);
    b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);let calls=0;
    c.fetch=async(_,request)=>{calls++;const i=JSON.parse(request.body).partIndex;return reply(i===0?provisional():i===1?result(2):{...result(),status:'needs_review',mark:null})};
    await c.runAI(b);await c.runAI(b);assert.equal(calls,3);assert.equal(c.aiTodo(b).length,0);
    assert.equal(c.score(b,1,0).g,1);assert.equal(c.score(b,1,0).set,true);assert.equal(c.score(b,1,0).src,'provisional');assert.equal(c.aiProvisionals(b),1);
    const t=c.totals(b);assert.deepEqual([t.T,t.markedM,t.P,t.provisionalG,t.provisionalM,t.provisionalParts],[2,3,3,1,3,1]);
    assert.deepEqual([t.rows[0].g,t.rows[0].markedM,t.rows[0].provisionalG,t.tp.Project.g,t.tp.Project.provisionalM],[2,3,1,2,3]);
    assert.deepEqual(clone(c.mistakeList().map(m=>m.i)),[1]);
    const html=c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0));
    assert(html.includes('Provisional mark'));assert(html.includes('1 / 3'));assert(html.includes('lower valid proposed mark'));assert(html.includes('not a confirmed assessment'));
    assert(html.includes('Provisional criterion evidence'));assert(!html.includes('What earned marks'));assert(!html.includes('How to gain more marks'));assert(!html.includes('data-act="airetry"'));
    // Even a malformed local copy must not display unaudited diagnostics as facts.
    bs.ai['1.0'].fb.strengths=['UNCONFIRMED_DIAGNOSIS'];c.feedbackDetails=()=>{throw new Error('Provisional diagnostics rendered')};
    assert(!c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0)).includes('UNCONFIRMED_DIAGNOSIS'));
    assert(c.guideHTML(b,1,0).includes('Provisional: 1 / 3'));
    const page=c.resultsPage(b);assert(page.includes('3 / 6'));assert(page.includes('Provisional total'));assert(page.includes('Assessed subtotal: 2 / 3'));assert(page.includes('3 of 9 marks remain unscored'));
    assert(c.aiStatusHTML(b).includes('1 provisional mark'));assert(c.aiStatusHTML(b).includes('1 answer need review'));
    assert(c.papersPage().includes('Provisional marks: 1 / 3'));assert(c.reviewStatus(b).includes('Provisional marks: 1 / 3'));
    const serialized=clone(bs);c.S.u[b.id]=serialized;await c.runAI(b);assert.equal(calls,3);assert.equal(c.score(b,1,0).src,'provisional','reload must preserve the provisional discriminator');
    serialized.self['1.0']=2;assert.equal(c.score(b,1,0).src,'self');assert.equal(c.aiProvisionals(b),0);assert.equal(c.totals(b).T,4);assert.equal(c.totals(b).markedM,6);assert.equal(c.mistakeList().length,2);
    delete serialized.self['1.0'];c.S.hist.push({id:b.id,name:'Provisional history',at:1,T:t.T,M:t.markedM,pending:t.P,provisionalG:t.provisionalG,provisionalM:t.provisionalM,provisionalParts:t.provisionalParts});
    assert(c.papersPage().includes('Provisional history'));assert(c.papersPage().includes('Provisional marks: 1 / 3 across 1 part'));
  }
  // Zero remains a numeric provisional mark, while malformed and out-of-range
  // fallback scores cannot enter the saved client state.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';
    for(const mark of [null,false,'1',1.5]){c.fetch=async()=>reply(provisional(mark));await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),/invalid result/)}
    for(const mark of [-1,4])assert.throws(()=>c.aiStore(bs,'1.0',b.qs[0].it[0],c.aiStamp(b,1,0),provisional(mark)),/outside/);
    c.fetch=async()=>reply(provisional(0));await c.runAI(b);assert.equal(c.score(b,1,0).g,0);assert.equal(c.totals(b).provisionalParts,1);assert.equal(c.totals(b).P,0);assert.equal(c.totals(b).markedM,0);
    assert(c.aiState(b).includes('Provisional'));assert(!c.aiStatusHTML(b).includes('AI marking is complete'));
  }
  // Existing marks remain visible and explicitly retain their earlier-harness provenance.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Old answer';bs.ai['1.0']={g:2,fb:{summary:'Old feedback'}};
    await c.runAI(b);assert.equal(c.score(b,1,0).g,2);assert.equal(c.aiTodo(b).length,0);
    assert(c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0)).includes('Earlier marking harness'));
  }
  // Delayed replies cannot overwrite a changed answer, rubric, account, epoch or attempt.
  for(const mutate of [
    (c,b,bs)=>{bs.ans['1.0']='Changed answer'},
    (c,b)=>{b.qs[0].it[0].crit.push('Changed rubric')},
    c=>{c.S.tok='other-session'},
    c=>{c.S.owner='other@example.test'},
    c=>{c.SYNC.epoch++},
    (c,b,bs)=>{bs.doneAt++},
    c=>{c.S={...c.S,u:{}}}
  ])for(const output of [result(),provisional()]){
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Original answer';const pending=defer();let started=false;
    c.fetch=()=>{started=true;return pending.promise};const run=c.runAI(b);await until(()=>started);mutate(c,b,bs);pending.resolve(reply(output));await run;
    assert.equal(bs.ai['1.0'],undefined);assert.equal(bs.aiErr['1.0'],undefined);
  }
  // A stale batch finishing must not delete the replacement batch's in-flight lock.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='First answer';const first=defer(),second=defer();let calls=0;
    c.fetch=()=>++calls===1?first.promise:second.promise;
    const one=c.runAI(b);await until(()=>calls===1);bs.ans['1.0']='Second answer';const two=c.runAI(b);await until(()=>calls===2);
    const latest=c.AIRUN['1'];first.resolve(reply(result(1)));await one;assert.equal(c.AIRUN['1'],latest);assert.equal(bs.ai['1.0'],undefined);
    second.resolve(reply(result(3)));await two;assert.equal(c.score(b,1,0).g,3);assert.equal(c.AIRUN['1'],undefined);
  }
  // A whole-paper batch fills all ten slots; the eleventh waits until one
  // finishes. Concurrent callers still share the same batch.
  {
    const c=client(),{b,bs}=paper(c,Array.from({length:12},written));Object.keys(b.qs[0].it).forEach(i=>bs.ans['1.'+i]='Answer '+i);
    const pending=[];let active=0,peak=0;c.fetch=()=>{active++;peak=Math.max(peak,active);const d=defer();pending.push(d);return d.promise.then(x=>{active--;return x})};
    const run=c.runAI(b);assert.equal(c.runAI(b),run);await until(()=>pending.length===10);assert.equal(peak,10);
    pending[0].resolve(reply(result()));await until(()=>pending.length===11);assert.equal(active,10);
    for(let i=1;i<12;i++){await until(()=>pending.length>i);pending[i].resolve(reply(result()))}
    await run;assert.equal(peak,10);assert.equal(active,0);assert.equal(c.AIWORK.active,0);assert.equal(c.aiTodo(b).length,0);
  }
  // Transport failures are retryable. A 401 stops the queue and explains sign-in; null/boolean marks fail validation.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';let calls=0;c.fetch=async()=>{calls++;return calls===1?reply({error:'Unavailable'},503):reply(result())};
    await c.runAI(b);assert.equal(c.aiTodo(b).length,1);assert(bs.aiErr['1.0']);await c.runAI(b);assert.equal(calls,1,'saved failures must wait for an explicit retry');
    bs.aiErr={};await c.runAI(b);assert.equal(c.aiTodo(b).length,0);
    c.fetch=async()=>reply({error:'Expired'},401);await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),e=>e.fatal&&/Sign in again/.test(e.message));
    for(const mark of [null,false,'2',1.5]){c.fetch=async()=>reply({...result(),mark});await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),/invalid result/)}
  }
  // A busy answer does not stop unrelated answers or retry automatically on page re-entry.
  {
    const c=client(),{b,bs}=paper(c,Array.from({length:5},written));b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);
    const requests=[];c.fetch=async(_,r)=>{const part=JSON.parse(r.body).partIndex;requests.push(part);return part===0?reply({error:'This answer is already being marked.',code:'marking_busy'},409):reply(result())};
    await c.runAI(b);assert.deepEqual(requests,[0,1,2,3,4]);assert.equal(Object.keys(bs.ai).length,4);assert.match(bs.aiErr['1.0'],/already being marked/);
    await c.ensureMarked(b);assert.equal(requests.length,5,'navigation must not retry the busy answer');assert.equal(c.aiTodo(b).length,1);
    c.fetch=async()=>reply({error:'A different conflict',code:'other_conflict'},409);await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),e=>e.fatal===true);
  }
  // Completed answers render while other requests are pending; final render clears the running status.
  {
    const c=client(),{b,bs}=paper(c,Array.from({length:4},written));b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);bs.checked=1;
    const pending=[],frames=[],app={set innerHTML(value){frames.push(value)}};c.$=s=>s==='#app'?app:null;c.window.scrollY=47;c.window.scrollTo=(x,y)=>assert.equal(y,47);c.CUR.rv=false;
    c.resultsPage=()=>JSON.stringify({marks:Object.keys(bs.ai).length,running:!!c.AIRUN[b.id]});
    c.fetch=()=>{const d=defer();pending.push(d);return d.promise};const run=c.markAndShow(b);await until(()=>pending.length===4);
    pending[0].resolve(reply(result()));await until(()=>frames.length>0);assert.deepEqual(JSON.parse(frames[0]),{marks:1,running:true});assert.equal(c.aiTodo(b).length,3);
    for(let i=1;i<4;i++){await until(()=>pending.length>i);pending[i].resolve(reply(result()))}await run;
    assert.deepEqual(JSON.parse(frames.at(-1)),{marks:4,running:false});
  }
  // Global auth/quota/conflict failures still stop dispatching queued answers; in-flight results are retained.
  for(const status of [401,429,409]){
    const c=client(),{b,bs}=paper(c,Array.from({length:12},written));b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);
    const pending=[];c.fetch=()=>{const d=defer();pending.push(d);return d.promise};const run=c.runAI(b);await until(()=>pending.length===10);
    pending[0].resolve(reply({error:'Global failure',code:'global_failure'},status));await until(()=>!!bs.aiErr['1.0']);
    const block=c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0));assert(block.includes('when the batch finishes'));assert(!block.includes('data-act="airetry"'));
    for(let i=1;i<10;i++)pending[i].resolve(reply(result()));await run;assert.equal(pending.length,10);assert.equal(Object.keys(bs.ai).length,9);
    assert(c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0)).includes('data-act="airetry"'));
  }
  // Progress can follow navigation between review questions, but never redraw an unrelated route/account/attempt.
  for(const mutate of [
    c=>{c.location.hash='#/account'},
    c=>{c.location.hash='#/2/results'},
    c=>{c.CUR={b:null,n:0}},
    c=>{c.S.tok='another-session'},
    c=>{c.S.owner='another@example.test'},
    c=>{c.SYNC.epoch++},
    (c,b,bs)=>{bs.doneAt++},
    c=>{c.S={...c.S,u:{}}}
  ]){
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';bs.checked=1;const pending=defer();let started=false,renders=0;
    c.$=s=>s==='#app'?{set innerHTML(_){renders++}}:null;c.resultsPage=()=>'';c.window.scrollTo=()=>{};c.CUR.rv=false;
    c.fetch=()=>{started=true;return pending.promise};const run=c.markAndShow(b);await until(()=>started);mutate(c,b,bs);pending.resolve(reply(result()));await run;assert.equal(renders,0);
  }
  {
    const c=client(),{b,bs}=paper(c,[written()]);b.qs.push({...b.qs[0],it:[written()]});bs.ans['1.0']='First';bs.ans['2.0']='Second';bs.checked=1;
    c.location.hash='#/1/review/1';const pending=[];let visible='',draws=0;c.$=s=>s==='#qarea'?{set innerHTML(value){visible=value}}:null;
    c.qHTML=(_,n)=>'Review '+n;c.afterQDraw=()=>{draws++};c.refreshNav=()=>{};c.xdCleanup=()=>{};c.window.scrollTo=()=>{};
    c.fetch=()=>{const d=defer();pending.push(d);return d.promise};const run=c.markAndShow(b);await until(()=>pending.length===2);
    c.location.hash='#/1/review/2';c.CUR.n=2;pending[0].resolve(reply(result()));await until(()=>draws>0);assert.equal(visible,'Review 2');
    pending[1].resolve(reply(result()));await run;assert.equal(visible,'Review 2');
  }
  // Local runtime work is deduplicated and cannot delay AI dispatch, completion, or released marks.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';const checks=defer();let checkCalls=0,requests=0;
    c.runChecks=()=>{checkCalls++;return checks.promise};c.fetch=async()=>{requests++;return reply(result())};
    const first=c.ensureMarked(b),second=c.ensureMarked(b);await until(()=>requests===1&&checkCalls===1);await Promise.all([first,second]);
    assert.equal(bs.checked,undefined);assert.equal(c.score(b,1,0).g,2);assert(c.CHECKRUN[b.id]);checks.resolve();await until(()=>bs.checked===1);await until(()=>!c.CHECKRUN[b.id]);
  }
  // Failure or a stale local-check completion cannot suppress a mark or flag a replacement attempt checked.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';c.runChecks=()=>Promise.reject(new Error('Runtime did not load'));c.fetch=async()=>reply(result());
    await c.ensureMarked(b);await until(()=>!c.CHECKRUN[b.id]);assert.equal(c.score(b,1,0).g,2);assert.equal(bs.checked,undefined);
    const checks=defer();let started=false;c.runChecks=()=>{started=true;return checks.promise};await c.ensureMarked(b);await until(()=>started);bs.doneAt++;checks.resolve();await until(()=>!c.CHECKRUN[b.id]);assert.equal(bs.checked,undefined);
  }
  // A broken progress display must not cancel queued answers or erase confirmed results.
  {
    const c=client(),{b,bs}=paper(c,Array.from({length:4},written));b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);let calls=0,warnings=0;
    c.console={...console,warn(){warnings++}};c.fetch=async()=>{calls++;return reply(result())};await c.runAI(b,()=>{throw new Error('DOM changed')});
    assert.equal(calls,4);assert.equal(Object.keys(bs.ai).length,4);assert.equal(warnings,4);assert.equal(c.AIRUN[b.id],undefined);
  }
  // Practice marks only the requested question, leaves busy responses for explicit retry,
  // and never starts a timed POST replay that could consume another paid job.
  {
    const c=client(),{b,bs}=practice(c,Array.from({length:5},written));b.qs.push({...b.qs[0],it:[written()]});
    b.qs[0].it.forEach((_,i)=>bs.ans['1.'+i]='Answer '+i);bs.ans['2.0']='Untouched second question';const requests=[];
    c.fetch=async(_,r)=>{const p=JSON.parse(r.body);requests.push([p.questionNumber,p.partIndex]);return p.partIndex===0?reply({code:'marking_busy',error:'Already being marked'},409):reply(result())};
    await c.runAIQuestion(b,1);assert.deepEqual(requests,[[1,0],[1,1],[1,2],[1,3],[1,4]]);assert.equal(Object.keys(bs.ai).length,4);assert(bs.aiErr['1.0']);assert.equal(bs.ai['2.0'],undefined);
    assert(c.timers.every(t=>t.ms===250000),'practice busy scheduled an automatic replay');await c.runAIQuestion(b,1);assert.equal(requests.length,5);
    c.fetch=async(_,r)=>{requests.push([JSON.parse(r.body).questionNumber,JSON.parse(r.body).partIndex]);return reply(result())};
    await c.pqMark();assert.equal(requests.length,6);assert.equal(c.score(b,1,0).g,2);assert.equal(bs.aiErr['1.0'],undefined);assert.equal(bs.done,false);
  }
  // Practice responses use account/epoch/attempt/answer guards, while edits to a
  // different question do not discard this question's valid result.
  for(const mutate of [
    (c,b,bs)=>{bs.ans['1.0']='Edited while marking'},
    (c,b)=>{b.qs[0].it[0].crit.push('New rubric')},
    c=>{c.S.tok='another-session'},c=>{c.S.owner='another@example.test'},c=>{c.SYNC.epoch++},
    (c,b,bs)=>{bs.start++},(c,b,bs)=>{bs.mode='exam'},c=>{c.S={...c.S,u:{}}}
  ]){
    const c=client(),{b,bs}=practice(c,[written()]);bs.ans['1.0']='Original';const d=defer();let sent=false;
    c.fetch=()=>{sent=true;return d.promise};const run=c.runAIQuestion(b,1);await until(()=>sent);mutate(c,b,bs);d.resolve(reply(result()));await run;
    assert.equal(bs.ai['1.0'],undefined);assert.equal(bs.aiErr['1.0'],undefined);
  }
  {
    const c=client(),{b,bs}=practice(c,[written()]);b.qs.push({...b.qs[0],it:[written()]});bs.ans['1.0']='First';bs.ans['2.0']='Before';const d=defer();let sent=false;
    c.fetch=()=>{sent=true;return d.promise};const run=c.runAIQuestion(b,1);await until(()=>sent);bs.ans['2.0']='Changed elsewhere';d.resolve(reply(result()));await run;assert.equal(c.score(b,1,0).g,2);
  }
  // A replacement practice run is not deleted or overwritten by its stale predecessor.
  {
    const c=client(),{b,bs}=practice(c,[written()]);bs.ans['1.0']='First';const pending=[];c.fetch=()=>{const d=defer();pending.push(d);return d.promise};
    const first=c.runAIQuestion(b,1);await until(()=>pending.length===1);bs.ans['1.0']='Second';const second=c.runAIQuestion(b,1);await until(()=>pending.length===2);const latest=c.AIQ['1/1'];
    pending[0].resolve(reply(result(1)));await first;assert.equal(c.AIQ['1/1'],latest);assert.equal(bs.ai['1.0'],undefined);
    pending[1].resolve(reply(result(3)));await second;assert.equal(c.score(b,1,0).g,3);assert.equal(c.AIQ['1/1'],undefined);
  }
  // Practice workers also fill ten slots and share that ceiling across questions.
  {
    const c=client(),{b,bs}=practice(c,Array.from({length:11},written));b.qs.push({...b.qs[0],it:[written(),written()]});
    b.qs.forEach((q,qi)=>q.it.forEach((_,i)=>bs.ans[(qi+1)+'.'+i]='Answer'));const pending=[];let active=0,peak=0;
    c.fetch=()=>{active++;peak=Math.max(peak,active);const d=defer();pending.push(d);return d.promise.then(r=>{active--;return r})};
    const first=c.runAIQuestion(b,1);await until(()=>pending.length===10);assert.equal(c.runAIQuestion(b,1),first);
    const second=c.runAIQuestion(b,2);await until(()=>c.AIWORK.queue.length===2);assert.equal(pending.length,10);assert.equal(peak,10);
    for(let i=0;i<13;i++){await until(()=>pending.length>i);pending[i].resolve(reply(result()))}await Promise.all([first,second]);assert.equal(peak,10);assert.equal(Object.keys(bs.ai).length,13);
  }
  // Mixed practice and submitted-paper work share ten active requests rather
  // than getting ten each. Queued requests start as a slot finishes, or are
  // discarded before sending if the account context has changed.
  for(const stale of [false,true]){
    const c=client(),p=practice(c,Array.from({length:6},written)),s=paper(c,Array.from({length:6},written),'2');
    for(const x of [p,s])x.b.qs[0].it.forEach((_,i)=>x.bs.ans['1.'+i]='Answer '+i);
    const pending=[];let active=0,peak=0;
    c.fetch=(_,r)=>{active++;peak=Math.max(peak,active);const d=defer();pending.push({...d,bank:JSON.parse(r.body).bankId});return d.promise.then(value=>{active--;return value})};
    const practiceRun=c.runAIQuestion(p.b,1);await until(()=>pending.length===6);
    const submittedRun=c.runAI(s.b);assert.equal(c.runAI(s.b),submittedRun);assert.equal(c.runAIQuestion(p.b,1),practiceRun);
    await until(()=>pending.length===10&&c.AIWORK.queue.length===2);assert.equal(active,10);assert.equal(peak,10);
    if(stale)c.S.owner='another@example.test';
    pending[0].resolve(reply(result()));
    if(!stale){await until(()=>pending.length===11);assert.equal(active,10);assert.equal(c.AIWORK.queue.length,1);}
    else await until(()=>c.AIWORK.queue.length===0);
    for(let i=1;i<(stale?10:12);i++){await until(()=>pending.length>i);pending[i].resolve(reply(result()))}
    await Promise.all([practiceRun,submittedRun]);assert.equal(peak,10);assert.equal(active,0);assert.equal(c.AIWORK.active,0);assert.equal(c.AIWORK.queue.length,0);
    assert.equal(pending.length,stale?10:12);assert.equal(Object.keys(p.bs.ai).length,stale?0:6);assert.equal(Object.keys(s.bs.ai).length,stale?0:6);
  }
  // A fatal response cancels that batch's already-queued dispatches in either
  // workflow while preserving results from requests which are already in flight.
  for(const failedMode of ['practice','wholepaper']){
    const c=client(),p=practice(c,Array.from({length:6},written)),s=paper(c,Array.from({length:6},written),'2');
    for(const x of [p,s])x.b.qs[0].it.forEach((_,i)=>x.bs.ans['1.'+i]='Answer '+i);
    const pending=[];c.fetch=(_,r)=>{const d=defer();pending.push({...d,bank:JSON.parse(r.body).bankId});return d.promise};
    const first=failedMode==='practice'?c.runAI(s.b):c.runAIQuestion(p.b,1);await until(()=>pending.length===6);
    const second=failedMode==='practice'?c.runAIQuestion(p.b,1):c.runAI(s.b),failed=failedMode==='practice'?p:s;
    await until(()=>pending.length===10&&c.AIWORK.queue.length===2);
    pending[6].resolve(reply({error:'Expired',code:'unauthorized'},401));await until(()=>!!failed.bs.aiErr['1.0']);
    assert.equal(pending.length,10,'a queued request started after its batch received a fatal response');
    for(let i=0;i<10;i++)if(i!==6)pending[i].resolve(reply(result()));
    await Promise.all([first,second]);assert.equal(pending.length,10);assert.equal(c.AIWORK.active,0);assert.equal(c.AIWORK.queue.length,0);
    assert.equal(Object.keys(failed.bs.ai).length,3,'in-flight successes must remain available after a fatal sibling');
  }
  // Submitting the same attempt reuses an in-flight practice result instead of
  // racing it with a duplicate POST; a later submitted batch reuses both marks.
  {
    const c=client(),{b,bs}=practice(c,[written()]);b.qs.push({...b.qs[0],it:[written()]});bs.ans['1.0']='Practice answer';bs.ans['2.0']='Other answer';const pending=[];
    c.fetch=(_,r)=>{const d=defer();pending.push({question:JSON.parse(r.body).questionNumber,...d});return d.promise};
    const one=c.runAIQuestion(b,1);await until(()=>pending.length===1);bs.done=true;bs.doneAt=30;const all=c.runAI(b);await until(()=>pending.length===2);
    assert.deepEqual(pending.map(r=>r.question),[1,2]);pending[0].resolve(reply(result(3)));pending[1].resolve(reply(result(2)));await Promise.all([one,all]);
    assert.equal(c.score(b,1,0).g,3);assert.equal(c.score(b,2,0).g,2);await c.runAI(b);assert.equal(pending.length,2);
  }
  // An active exam blocks practice requests and stale UI refreshes. Guest
  // practice still reveals the guide, and asynchronous marking never replaces a focused editor.
  {
    const c=client(),{b,bs}=practice(c,[written()]);bs.ans['1.0']='Answer';const other={...b,id:'2'};c.BANKS.push(other);Object.assign(c.BS('2'),{mode:'exam',start:Date.now(),done:false});
    await c.runAIQuestion(b,1);assert.equal(c.pqMark(),undefined);bs.done=true;await c.ensureMarked(b);
    let renders=0;c.$=()=>({set innerHTML(_){renders++}});c.refreshMarking(b,c.aiContext(b));assert.equal(renders,0);
    c.$=()=>null;c.BS('2').done=true;bs.done=false;c.S.tok='';await c.pqMark();assert.equal(bs.pq[1],1);assert.equal(bs.ai['1.0'],undefined);
  }
  {
    const c=client(),{b,bs}=paper(c,[written()]),other={...b,id:'2'};c.BANKS.push(other);Object.assign(c.BS('2'),{mode:'exam',start:Date.now(),done:false});
    const app={};c.$=selector=>selector==='#app'?app:null;c.location.hash='#/1/q/1';c.applyTheme=()=>{};c.xdCleanup=()=>{};c.tick=()=>{};c.window.scrollTo=()=>{};
    c.render();assert(app.innerHTML.includes('Exam in progress'));assert.equal(c.CUR.b,null,'submitted q route bypassed the exam lock');
    bs.done=false;bs.mode='practice';bs.pq={1:1};assert.equal(c.pqShown(b,1),false);assert.equal(c.pqPanelHTML(b,1),'');
  }
  {
    const c=client(),{b,bs}=practice(c,[written()]);bs.ans['1.0']='Answer';let replacements=0;const panel={};
    c.$=selector=>selector==='#qarea'?{set innerHTML(_){replacements++}}:selector==='#pq'?panel:null;c.document.activeElement={tagName:'DIV',isContentEditable:true};
    c.fetch=async()=>reply(result());await c.runAIQuestion(b,1);assert.equal(c.score(b,1,0).g,2);assert.equal(replacements,0);assert(panel.outerHTML.includes('Mark this question again'));
    c.qHTML=()=>'<p>Confirmed feedback</p>';c.afterQDraw=()=>{};c.refreshNav=()=>{};c.xdCleanup=()=>{};c.window.scrollTo=()=>{};
    c.document.activeElement=null;c.listeners.focusout.forEach(fn=>fn());c.timers.filter(t=>t.ms===0).at(-1).fn();assert.equal(replacements,1,'feedback did not appear after leaving the editor');
    c.document.activeElement={tagName:'TEXTAREA'};c.refreshMarking(b,c.aiContext(b,1));c.listeners.focusout.forEach(fn=>fn());c.S.owner='changed@example.test';c.document.activeElement=null;
    c.timers.filter(t=>t.ms===0).at(-1).fn();assert.equal(replacements,1,'deferred redraw survived an account change');
  }
  // Practice code checks run independently of model work and do not mark the
  // rest of the paper as checked; class panels still rebind after question redraw.
  {
    const c=client(),{b,bs}=practice(c,[written()]);bs.ans['1.0']='Answer';const check=defer();let requested=0,checked=0,classes=0;
    c.runChecks=(_,n)=>{assert.equal(n,1);checked++;return check.promise};c.fetch=async()=>{requested++;return reply(result())};await c.pqMark();
    assert.equal(requested,1);assert.equal(checked,1);assert.equal(bs.checked,undefined);assert.equal(c.score(b,1,0).g,2);check.resolve();await until(()=>!c.CHECKRUN['1/1']);
    c.classEnsure=()=>{classes++};c.aceMount=()=>{};c.afterQDraw();assert.equal(classes,1);
  }
  // Saved diagram geometry and bindings survive the request, together with its rendering.
  {
    const c=client(),it={t:'dr',q:'Draw a relationship.',m:3,model:'Two boxes',crit:['Correct endpoints']},{b,bs}=paper(c,[it]);
    bs.ans['1.0']={e:[{id:'line',type:'line',x:100,y:50,points:[[0,0],[200,0]],startBinding:{elementId:'station'},endBinding:{elementId:'bike'}},{id:'one',type:'text',x:130,y:25,text:'1'},{id:'many',type:'text',x:270,y:25,text:'0..*'}]};
    const original=clone(bs.ans['1.0'].e);let request;c.xdPNG=async elements=>{assert.deepEqual(clone(elements),original);return 'data:image/png;base64,TEST'};
    c.fetch=async(_,r)=>{request=JSON.parse(r.body);return reply(result())};await c.runAI(b);
    assert.deepEqual(request.answer,{elements:original});assert.equal(request.diagramPng,'data:image/png;base64,TEST');assert.deepEqual(bs.ans['1.0'].e,original);
    assert.deepEqual(Object.keys(request).sort(),['answer','bankId','diagramPng','partIndex','questionNumber']);
  }
  // Rendering failure is sent without PNG for server review; a session change during rendering never sends.
  {
    const c=client(),{b,bs}=paper(c,[{t:'dr',q:'Draw',m:3,model:'Box',crit:['One box']}]);bs.ans['1.0']={e:[{id:'x',type:'freedraw',points:[[0,0],[10,10]]}]};
    c.loadXD=()=>Promise.reject(new Error('offline'));assert.equal(await c.xdPNG(bs.ans['1.0'].e),null);
    let request;c.fetch=async(_,r)=>{request=JSON.parse(r.body);return reply({...result(),status:'needs_review',mark:null})};
    await c.runAI(b);assert.equal(request.diagramPng,undefined);assert.equal(bs.ai['1.0'].status,'needs_review');
    bs.ai={};const png=defer();let started=false;c.xdPNG=()=>{started=true;return png.promise};c.fetch=()=>{throw new Error('Stale rendering sent a request')};
    const run=c.runAI(b);await until(()=>started);c.S.tok='different-session';png.resolve('data:image/png;base64,TEST');await run;assert.equal(bs.ai['1.0'],undefined);
  }
  // Example results have no direct scoring power, and SQL headings are checked where the question requires them.
  {
    const c=client(),it={t:'sq',q:'Use the column headings Suburb and FinedLoans.',m:4,model:'SELECT sample',ord:true,crit:['Correct headings']},{b,bs}=paper(c,[it]);
    bs.ans['1.0']='SELECT student';bs.chk['1.0']={p:1,t:1};assert.equal(c.score(b,1,0).set,false);assert.equal(c.mistakeList().length,0);
    const expected={cols:['Suburb','FinedLoans'],rows:[['Parkdale',5]]},wrong={cols:['Suburb','WrongHeading'],rows:[['Parkdale',5]]};
    assert.equal(c.sameSQLResult(wrong,expected,it),false);assert.equal(c.sameSQLResult(expected,expected,it),true);assert.equal(c.sameSQLResult(wrong,expected,{q:'Return rows',ord:true}),true);
    b.qs[0].db={Example:{c:['x'],r:[[1]]}};c.runSQL=async(_,sql)=>sql===it.model?expected:wrong;
    await c.runChecks(b);assert.equal(bs.chk['1.0'].p,0);assert.equal(c.score(b,1,0).set,false);
    assert.equal(c.passTest('175',{o:'75'}),false);assert.equal(c.passTest('21101',{o:'1101'}),false);
  }
  // Registered closed types retain their browser marking, while typed tables send only raw cells.
  {
    const c=client(),order=c.od('Order these steps.','# BEGIN\n    Read value\n    Display value\n# END',2),match=c.dm('Match.', ['Unit','System'],[['One function',0],['Whole program',1]],2),table=c.ft('Complete the table.',3,['Input','Output'],[[null,null]],[['2','4']],['Correct cells']);
    const {b,bs}=paper(c,[order,match,table]);bs.ans['1.0']={0:order.pool.indexOf('Read value'),1:order.pool.indexOf('Display value')};bs.ans['1.1']={0:0,1:0};bs.ans['1.2']={'0,0':'2','0,1':'<typed text>'};
    assert.equal(c.score(b,1,0).g,2);assert.equal(c.score(b,1,0).auto,true);assert.equal(c.score(b,1,1).g,1);assert.equal(c.score(b,1,1).auto,true);
    assert.equal(c.aiTodo(b).length,1);assert.equal(c.itemClass(table),'written');assert.equal(c.score(b,1,2).set,false);
    c.QT.ft.payload=()=>{throw new Error('Plugin attempted to supply marking criteria')};
    const payload=c.aiPayload(b,1,2);assert.deepEqual(clone(payload),{bankId:'1',questionNumber:1,partIndex:2,answer:{'0,0':'2','0,1':'<typed text>'}});
    payload.answer['0,0']='Changed snapshot';assert.equal(bs.ans['1.2']['0,0'],'2');
    assert(c.guideHTML(b,1,0).includes('Correct order:'));assert(c.guideHTML(b,1,1).includes('Whole program'));assert(c.guideHTML(b,1,2).includes('ftab'));
    assert(c.closedCompare(match,bs.ans['1.1']).includes('System'));
    c.CUR={b,n:1,rv:false};const before=clone(bs.ans);c.dzPlace('1.0','0',99,null);c.dzRemove('1.0','0');assert.deepEqual(clone(bs.ans),before,'submitted drag answers changed');
    let request;c.fetch=async(_,r)=>{request=JSON.parse(r.body);return reply(result())};await c.runAI(b);assert.deepEqual(request.answer,{'0,0':'2','0,1':'<typed text>'});
    bs.ans['1.2']['0,1']='4';assert.equal(c.aiRecord(b,1,2),null,'typed-table edit did not invalidate mark');
  }
  // Hidden authoring demos stay available by route but never enter paper counts, history or mistakes.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Visible answer';bs.self['1.0']=1;
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/formats.js'),'utf8'),c,{filename:'formats.js'});
    const hidden=c.BANKS.find(x=>x.id==='formats');assert(hidden&&hidden.hidden);c.BS('formats').done=true;c.BS('formats').ans['3.0']={'0,0':'500'};c.BS('formats').self['3.0']=0;
    c.S.hist.push({id:'formats',name:'Hidden attempt',at:1,T:0,M:17});
    assert(!c.homePage().includes('href="#/formats"'));const html=c.papersPage();assert(html.includes('1 of 1 papers finished'));assert(!html.includes('Question formats'));assert(!html.includes('Hidden attempt'));
    assert(c.mistakeList().every(m=>m.b.id!==hidden.id));assert(c.mistakeList().some(m=>m.b.id===b.id));
  }
  console.log('marking client OK: canonical requests, auth, abstention, legacy marks, stale contexts, concurrency, diagram evidence, SQL metadata, unscored totals, plugin formats and hidden banks');
})().catch(e=>{console.error(e);process.exitCode=1});
