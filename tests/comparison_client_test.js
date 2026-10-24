// Offline comparison client contracts. No real accounts, student data or provider calls.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const clone=value=>JSON.parse(JSON.stringify(value));
function client(){
  const nodes={'#comparison-export-consent':{checked:true},'#comparison-run-consent':{checked:true}},timers=[],storage=new Map(),downloads=[];
  const c={console,AbortController,URL,Blob,location:{hash:'#/compare'},window:{addEventListener(){}},SYNC:{epoch:0},CUR:{},AIMARKING_VERSION:'test-current',
    document:{addEventListener(){},querySelector:s=>nodes[s]||null,querySelectorAll:()=>[],createElement(){return {innerHTML:'',get textContent(){return this.innerHTML.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&')}}}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},fetch(){throw new Error('Unmocked network request')},
    FileReader:function(){this.readAsText=file=>{this.result=file.text;Promise.resolve().then(()=>this.onload())}},render(){},frame:(title,html)=>html};
  vm.createContext(c);for(const file of ['helpers.js','kit.js','widgets.js','qtypes.js','ai.js','comparison.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
  c.S.tok='test-session';c.S.owner='student@example.test';c.comparisonGuard();c.rawComparisonDownload=c.comparisonDownload;c.comparisonDownload=(data,name)=>downloads.push({data:clone(data),name});
  return Object.assign(c,{nodes,timers,storage,downloads});
}
function fixture(c){
  const items=[c.mc('Choose.', ['A','B'],0),c.tx('Explain.',3,50,'Model',['A linked explanation']),c.tx('Explain.',2,50,'Model',[]),c.dr('Draw.',2,'Model',[])];
  const b={id:'1',name:'Practice paper',qs:[{tp:'Software Automation',st:'<p>Scenario</p>',it:items}]};c.BANKS.push(b);const bs=c.BS('1');bs.done=true;bs.start=1;bs.doneAt=2;bs.ans={'1.0':0,'1.1':'<p>Technical &amp; precise.</p>','1.2':'Pending response','1.3':{e:[]}};
  bs.ai['1.1']={status:'marked',g:2,stamp:c.aiStamp(b,1,1),audit:{inputDigest:'verified-digest'},fb:{summary:'Feedback'}};c.COMPARISON.bankId='1';return {b,bs};
}
function pack(signature='signature-1'){return {snapshot:{participantId:signature,bankId:'1',parts:[]},signature}}
function file(value){const text=typeof value==='string'?value:JSON.stringify(value);return {text,size:Buffer.byteLength(text)}}
function report(status='complete'){return {status,summary:'Useful comparison.',profiles:status==='complete'?[{participantId:'p1',findings:[{kind:'criterion_shortfall',category:'reasoning_explanation',errorType:'unsupported_claim',scope:'single_response',statement:'A link is missing.',action:'Explain why the control prevents the named threat.',evidence:[{participantId:'p1',questionId:'1.1',criterionId:'c1',source:'answer',quote:'Technical & precise.'}]}]}]:[],comparisons:[],statistics:{commonPartIds:['1.0','1.1'],commonMaxMarks:4,participants:[{participantId:'p1',earned:3,maxMarks:4,percentage:75,includedParts:2,excludedParts:2,totalParts:4}],byTopic:[{topic:'Software Automation',maxMarks:4,scores:[{participantId:'p1',earned:3}]}],limitations:['Only common verified parts.']},audit:{requestedModel:'deepseek-flash',returnedModels:['deepseek-flash'],harnessVersion:'comparison-v1',checks:{evidenceSupported:true},reasons:[]}}}
function reply(body,status=200){return {ok:status<400,status,json:async()=>clone(body)}}
function defer(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
async function until(check){for(let i=0;i<100&&!check();i++)await Promise.resolve();assert(check())}
(async()=>{
  // Canonical answers and only verified marking digests leave the client; overrides and diagrams do not.
  {
    const c=client(),{b,bs}=fixture(c);let request;c.fetch=async(url,options)=>{assert.equal(url,'/api/compare');request=options;return reply({export:pack()})};
    await c.comparisonExport();assert.equal(request.headers.authorization,'Bearer test-session');assert(request.signal);
    assert.deepEqual(JSON.parse(request.body),{action:'export',bankId:'1',parts:[{questionNumber:1,partIndex:0,answer:0},{questionNumber:1,partIndex:1,answer:'Technical & precise.',markingDigest:'verified-digest'}]});
    assert.equal(c.downloads.length,1);assert.equal(c.downloads[0].name,'software-engineering-paper-1-comparison-evidence.json');assert(c.timers.some(t=>t.ms===250000));
    bs.self['1.1']=3;assert.equal(c.comparisonExportData(b).payload.parts.length,1);delete bs.self['1.1'];bs.ans['1.0']=undefined;
    assert.equal(c.comparisonExportData(b).payload.parts[0].answer,null);
    bs.ans['1.1']='Changed';assert.equal(c.comparisonExportData(b).excluded.unverified,2);
  }
  for(const change of [r=>delete r.stamp,r=>r.status='needs_review',r=>delete r.audit.inputDigest]){
    const c=client(),{b,bs}=fixture(c);change(bs.ai['1.1']);assert.equal(c.comparisonExportData(b).payload.parts.length,1);
  }
  // Sign-in and per-action explicit consent are necessary, including after a retry.
  {
    const c=client(),{b,bs}=fixture(c);c.nodes['#comparison-export-consent'].checked=false;await c.comparisonExport();assert.match(c.COMPARISON.error,/disclosure/);
    c.S.tok='';assert.throws(()=>c.comparisonExportData(b),/Sign in/);assert(c.comparisonPage().includes('Sign in'));
    c.S.tok='test-session';bs.done=false;assert.throws(()=>c.comparisonExportData(b),/submitted/);
  }
  // Export must persist the submitted attempt first; conflicts never create a stale sharing file.
  {
    const c=client();fixture(c);let saved=false;c.queuedSync=async()=>{saved=true};c.fetch=async()=>{assert(saved);return reply({export:pack()})};await c.comparisonExport();assert.equal(c.downloads.length,1);
    c.queuedSync=async()=>{throw new Error('Choose which paper version to keep')};c.fetch=()=>{throw new Error('Export sent despite unresolved sync')};await c.comparisonExport();assert.match(c.COMPARISON.error,/paper version/);assert.equal(c.downloads.length,1);
  }
  // Late export responses never download stale work, changed account evidence or a reset session.
  for(const mutate of [(c,bs)=>{bs.ans['1.1']='New response'},(c,bs)=>{bs.doneAt++},c=>c.S.tok='other',c=>c.S.owner='other@example.test',c=>c.SYNC.epoch++,c=>c.comparisonReset()]){
    const c=client(),{bs}=fixture(c),pending=defer();let started=false;c.fetch=()=>{started=true;return pending.promise};const running=c.comparisonExport();await until(()=>started);mutate(c,bs);pending.resolve(reply({export:pack()}));await running;assert.equal(c.downloads.length,0);
  }
  // Compact evidence downloads stay importable even when optional pretty printing exceeds the file cap.
  {
    const c=client(),value=pack();value.snapshot.parts=Array.from({length:1000},()=>({answer:'x'.repeat(180)}));
    assert(Buffer.byteLength(JSON.stringify(value))<c.COMPARISON_FILE_LIMIT);assert(Buffer.byteLength(JSON.stringify(value,null,2))>c.COMPARISON_FILE_LIMIT);
    let blob;c.URL={createObjectURL:b=>{blob=b;return 'blob:mock'},revokeObjectURL(){}};c.document.body={appendChild(){},removeChild(){}};c.document.createElement=()=>({click(){}});
    c.rawComparisonDownload(value,'evidence.json',true);assert(blob.size<=c.COMPARISON_FILE_LIMIT);await c.comparisonImport([file(await blob.text())]);assert.equal(c.COMPARISON.files.length,1);
  }
  // Import is local, atomic and bounded; invalid files never clear an existing valid selection.
  {
    const c=client();await c.comparisonImport([file(pack()),file(pack('signature-2'))]);assert.equal(c.COMPARISON.files.length,2);assert.equal(c.COMPARISON.files[0].label,'Student 1');assert.equal(c.storage.size,0);
    await c.comparisonImport([file(pack())]);assert.match(c.COMPARISON.error,/twice/);assert.equal(c.COMPARISON.files.length,2);
    await c.comparisonImport([file('{broken')]);assert.match(c.COMPARISON.error,/valid JSON/);
    await c.comparisonImport([file({snapshot:{},signature:''})]);assert.match(c.COMPARISON.error,/signed/);
    await c.comparisonImport([{size:200*1024+1,text:'{}'}]);assert.match(c.COMPARISON.error,/200 KiB/);
    await c.comparisonImport(Array.from({length:7},(_,i)=>file(pack('extra-'+i))));assert.match(c.COMPARISON.error,/2 and 8/);assert.equal(c.COMPARISON.files.length,2);
  }
  // The API sees signed packages in selection order, never local display labels or filenames.
  {
    const c=client();await c.comparisonImport([file(pack()),file(pack('signature-2'))]);c.COMPARISON.files[0].label='A local private name';let payload;
    c.fetch=async(_,options)=>{payload=JSON.parse(options.body);return reply(report())};await c.comparisonCompare();assert.deepEqual(payload,{action:'compare',exports:[pack(),pack('signature-2')]});assert.equal(c.COMPARISON.report.status,'complete');assert.equal(c.storage.size,0);
    const html=c.comparisonReportHTML(c.COMPARISON.report);assert(html.includes('A local private name'));assert(html.includes('same 4 available marks'));assert(html.includes('75%'));assert(html.includes('Question 1, part 2'));assert(html.includes('Original response'));assert(html.includes('Unsupported claim'));assert(html.includes('not a general judgement of ability'));assert(html.includes('evidenceSupported: passed'));
  }
  // Unsafe strings are rendered as text at every report boundary, including quotations and local labels.
  {
    const c=client();await c.comparisonImport([file(pack()),file(pack('signature-2'))]);const r=report(),attack='<img src=x onerror=alert(1)>';c.COMPARISON.files[0].label=attack;r.summary=attack;r.profiles[0].findings[0].statement=attack;r.profiles[0].findings[0].evidence[0].quote=attack;r.audit.requestedModel=attack;
    const html=c.comparisonReportHTML(r);assert(!html.includes('<img'));assert(html.includes('&lt;img'));r.profiles[0].findings[0].kind='optional_advice';assert(c.comparisonReportHTML(r).includes('not a mark deduction'));
  }
  // An abstention is terminal and carries no unconfirmed advice; retries are explicitly chosen.
  {
    const c=client();await c.comparisonImport([file(pack()),file(pack('signature-2'))]);let calls=0;c.fetch=async()=>{calls++;return reply(report('needs_review'))};await c.comparisonCompare();assert.equal(calls,1);assert.equal(c.COMPARISON.report.status,'needs_review');assert(c.comparisonReportHTML(c.COMPARISON.report).includes('AI comparison needs review'));
    c.fetch=async()=>reply({...report('needs_review'),profiles:report().profiles});await c.comparisonCompare();assert.equal(c.COMPARISON.report,null);assert.match(c.COMPARISON.error,/unverified/);
    c.fetch=async()=>reply({error:'Expired'},401);await c.comparisonCompare();assert.match(c.COMPARISON.error,/Sign in again/);
    c.nodes['#comparison-run-consent'].checked=false;await c.comparisonCompare();assert.match(c.COMPARISON.error,/permission/);
  }
  // Cancellation, account switches and clearing prevent delayed reports from returning to the page.
  for(const mutate of [c=>c.comparisonCancel(),c=>c.comparisonReset(),c=>{c.S.tok='new-token';c.comparisonPage()},c=>{c.SYNC.epoch++;c.comparisonPage()}]){
    const c=client();await c.comparisonImport([file(pack()),file(pack('signature-2'))]);const pending=defer();let started=false;c.fetch=()=>{started=true;return pending.promise};const running=c.comparisonCompare();await until(()=>started);mutate(c);pending.resolve(reply(report()));await running;assert.equal(c.COMPARISON.report,null);
    if(!c.COMPARISON.message.includes('Cancelled'))assert.equal(c.COMPARISON.files.length,0);
  }
  console.log('COMPARISON CLIENT OK: consent, canonical verified evidence, excluded overrides/diagrams, atomic bounded imports, private labels, stale-account guards, cancellation, escaped evidence and abstention.');
})().catch(error=>{console.error(error);process.exitCode=1});
