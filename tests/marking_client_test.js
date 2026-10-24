// Offline browser-contract regressions. All marking and execution responses are mocked.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
function client(){
  const storage=new Map(),timers=[];
  const c={console,AbortController,window:{addEventListener(){}},location:{hash:'#/1/results'},
    document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []},createElement(){return {innerHTML:'',get textContent(){return this.innerHTML.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')}}}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},setInterval(){},
    fetch(){throw new Error('Unexpected network request')},acctText(){return 'Account'},SYNC:{epoch:0},AIMARKING_VERSION:'test-v2'};
  vm.createContext(c);
  for(const file of ['helpers.js','kit.js','widgets.js','qtypes.js','xd.js','ai.js','pages.js','pages2.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
  c.S.tok='test-session';c.S.owner='student@example.test';c.timers=timers;
  return c;
}
function paper(c,items){
  const b={id:'1',name:'Test paper',qs:[{tp:'Project',st:'<p>Canonical stimulus</p>',db:null,it:items}]};
  c.BANKS.push(b);const bs=c.BS('1');bs.done=true;bs.start=10;bs.doneAt=20;c.CUR={b,n:1,rv:true};return {b,bs};
}
function written(){return {t:'tx',q:'Explain one thing.',m:3,w:50,model:'Sample answer',crit:['3 marks for explanation.']}}
function result(mark=2){return {status:'marked',mark,summary:'Evidence supported this mark.',strengths:['One point explained.'],improve:['Explain the second point.'],advice:['Use a clearer example.'],criteria:[{id:'C1',assessment:'partial',evidence:['A point'],basis:'A link is missing.'}],audit:{requestedModel:'deepseek-flash',returnedModels:['deepseek-flash'],harnessVersion:'test-v2',questionVersion:'q1',rubricVersion:'r1',inputDigest:'digest'}}}
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
  ]){
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Original answer';const pending=defer();let started=false;
    c.fetch=()=>{started=true;return pending.promise};const run=c.runAI(b);await until(()=>started);mutate(c,b,bs);pending.resolve(reply(result()));await run;
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
  // At most two answer requests are active. Concurrent callers share a batch.
  {
    const c=client(),{b,bs}=paper(c,[written(),written(),written(),written(),written()]);Object.keys(b.qs[0].it).forEach(i=>bs.ans['1.'+i]='Answer '+i);
    const pending=[];let active=0,peak=0;c.fetch=()=>{active++;peak=Math.max(peak,active);const d=defer();pending.push(d);return d.promise.then(x=>{active--;return x})};
    const run=c.runAI(b);assert.equal(c.runAI(b),run);await until(()=>pending.length===2);assert.equal(peak,2);
    for(let i=0;i<5;i++){await until(()=>pending.length>i);pending[i].resolve(reply(result()))}
    await run;assert.equal(peak,2);assert.equal(c.aiTodo(b).length,0);
  }
  // Transport failures are retryable. A 401 stops the queue and explains sign-in; null/boolean marks fail validation.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';let calls=0;c.fetch=async()=>{calls++;return calls===1?reply({error:'Unavailable'},503):reply(result())};
    await c.runAI(b);assert.equal(c.aiTodo(b).length,1);assert(bs.aiErr['1.0']);await c.runAI(b);assert.equal(c.aiTodo(b).length,0);
    c.fetch=async()=>reply({error:'Expired'},401);await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),e=>e.fatal&&/Sign in again/.test(e.message));
    for(const mark of [null,false,'2',1.5]){c.fetch=async()=>reply({...result(),mark});await assert.rejects(c.aiCall(c.aiPayload(b,1,0),c.S.tok),/invalid result/)}
  }
  // "Already being marked" is not a failure: the client waits, asks again, and ends with the mark and no error.
  {
    const c=client(),{b,bs}=paper(c,[written()]);bs.ans['1.0']='Answer';let calls=0;
    c.fetch=async()=>{calls++;return calls<3?{...reply({code:'marking_busy',error:'This answer is already being marked.'},409),headers:{get:()=>'2'}}:reply(result())};
    const run=c.runAI(b);
    for(let i=0;i<2;i++){await until(()=>c.timers.some(t=>t.ms===2000&&!t.used));const t=c.timers.find(t=>t.ms===2000&&!t.used);t.used=true;t.fn()}
    await run;assert.equal(calls,3);assert.equal(c.aiTodo(b).length,0);assert(!bs.aiErr['1.0']);
    // A genuine conflict (not busy) still stops the run.
    const d=client(),{b:b2,bs:bs2}=paper(d,[written()]);bs2.ans['1.0']='Answer';
    d.fetch=async()=>reply({code:'other',error:'Conflict'},409);await d.runAI(b2);assert.equal(d.aiTodo(b2).length,1);assert(bs2.aiErr['1.0']);
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
