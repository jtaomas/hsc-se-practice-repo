/* ---------- Cohort comparison: sensitive evidence stays in memory ---------- */
var COMPARISON={subject:'',serial:0,files:[],report:null,busy:'',error:'',message:'',control:null,bankId:'',classmates:[],classLoading:false};
var COMPARISON_FILE_LIMIT=200*1024,COMPARISON_BODY_LIMIT=2*1024*1024;
function comparisonSubject(){return JSON.stringify([S.tok||'',S.owner||'',typeof SYNC==='undefined'?0:SYNC.epoch])}
function comparisonReset(){
  if(COMPARISON.control)COMPARISON.control.abort();
  COMPARISON={subject:comparisonSubject(),serial:COMPARISON.serial+1,files:[],report:null,busy:'',error:'',message:'',control:null,bankId:'',classmates:[],classLoading:false};
}
function comparisonGuard(){if(COMPARISON.subject!==comparisonSubject())comparisonReset()}
function comparisonRefresh(){if(location.hash==='#/compare'&&typeof render==='function')render()}
function comparisonBank(){return BANKS.filter(function(b){return !b.hidden&&String(b.id)===COMPARISON.bankId&&S.u[b.id]&&S.u[b.id].done})[0]}
function comparisonExportData(b){
  if(!S.tok||!b||!S.u[b.id]||!S.u[b.id].done)throw new Error('Sign in and select a submitted paper.');
  var bs=BS(b.id),parts=[],excluded={diagram:0,self:0,unverified:0};
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){
    var key=(qi+1)+'.'+i,part={questionNumber:qi+1,partIndex:i};
    if(it.t==='dr'){excluded.diagram++;return}
    if(bs.self&&bs.self[key]!=null){excluded.self++;return}
    if(AUTO[it.t]){part.answer=bs.ans[key]==null?null:JSON.parse(JSON.stringify(bs.ans[key]));parts.push(part);return}
    var record=aiRecord(b,qi+1,i);
    if(!record||!record.stamp||record.status!=='marked'||!record.audit||typeof record.audit.inputDigest!=='string'||!record.audit.inputDigest){excluded.unverified++;return}
    part.answer=aiPayload(b,qi+1,i).answer;part.markingDigest=record.audit.inputDigest;parts.push(part);
  })});
  return {payload:{action:'export',bankId:b.id,parts:parts},excluded:excluded};
}
function comparisonRun(){
  var run={state:S,subject:comparisonSubject(),serial:++COMPARISON.serial};
  COMPARISON.control=new AbortController();run.control=COMPARISON.control;return run;
}
function comparisonCurrent(run){return COMPARISON.serial===run.serial&&S===run.state&&comparisonSubject()===run.subject}
function comparisonRequest(payload,run){
  var timer=setTimeout(function(){run.timedOut=true;run.control.abort()},250000);
  return fetch('/api/compare',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+S.tok},body:JSON.stringify(payload),signal:run.control.signal}).then(function(r){
    return r.json().catch(function(){throw new Error('The comparison service sent an unreadable reply. Please try again.')}).then(function(j){
      if(!r.ok){var e=new Error(r.status===401?'Sign in again to use comparison.':j&&j.error||('Comparison failed ('+r.status+'). Please try again.'));e.status=r.status;throw e}return j;
    });
  }).then(function(j){clearTimeout(timer);return j},function(e){clearTimeout(timer);if(e.name==='AbortError')throw new Error(run.timedOut?'Comparison timed out. Please try again.':'Comparison cancelled.');throw e});
}
function comparisonPackage(value){
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&value.snapshot&&typeof value.snapshot==='object'&&!Array.isArray(value.snapshot)&&typeof value.signature==='string'&&value.signature.length>0;
}
function comparisonDownload(value,name,compact){
  var url=URL.createObjectURL(new Blob([JSON.stringify(value,null,compact?0:2)],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
function comparisonExport(){
  comparisonGuard();if(COMPARISON.busy)return Promise.resolve();
  var b=comparisonBank(),data;
  try{data=comparisonExportData(b)}catch(e){COMPARISON.error=e.message;comparisonRefresh();return Promise.resolve()}
  if(!data.payload.parts.length){COMPARISON.error='This paper has no eligible evidence. Complete current AI marking first.';comparisonRefresh();return Promise.resolve()}
  var run=comparisonRun(),paper=S.u[b.id],stamp=JSON.stringify(data.payload),attempt=String(paper.start)+'/'+String(paper.doneAt);
  COMPARISON.busy='export';COMPARISON.error='';COMPARISON.message='Saving your submitted paper and verifying its marking feedback…';comparisonRefresh();
  return Promise.resolve().then(function(){return typeof queuedSync==='function'?queuedSync(false):null}).then(function(){if(!comparisonCurrent(run))return null;return comparisonRequest(data.payload,run)}).then(function(result){
    if(!comparisonCurrent(run))return;
    if(S.u[b.id]!==paper||!paper.done||String(paper.start)+'/'+String(paper.doneAt)!==attempt||JSON.stringify(comparisonExportData(b).payload)!==stamp)throw new Error('Your paper or marking changed. Export the current version again.');
    if(!result||!comparisonPackage(result.export))throw new Error('The service returned an invalid evidence file. Please try again.');
    comparisonDownload(result.export,'software-engineering-paper-'+b.id+'-comparison-evidence.json',true);
    COMPARISON.message='Evidence downloaded. Share this file only with the person organising your comparison. It contains original answers and marking feedback and expires after 7 days.';
  }).catch(function(e){if(comparisonCurrent(run)){COMPARISON.error=e.message;COMPARISON.message=''}}).then(function(){if(comparisonCurrent(run)){COMPARISON.busy='';COMPARISON.control=null;comparisonRefresh()}});
}
function comparisonClassPublish(){
  comparisonGuard();if(COMPARISON.busy)return Promise.resolve();
  var b=comparisonBank();if(!b)return Promise.resolve();
  var code=(S.classCode||'').toUpperCase().trim();
  if(!code){COMPARISON.error='Set a class code first before sharing with your class.';comparisonRefresh();return Promise.resolve()}
  var data;
  try{data=comparisonExportData(b)}catch(e){COMPARISON.error=e.message;comparisonRefresh();return Promise.resolve()}
  if(!data.payload.parts.length){COMPARISON.error='This paper has no eligible evidence. Complete current AI marking first.';comparisonRefresh();return Promise.resolve()}
  var run=comparisonRun();
  COMPARISON.busy='publish';COMPARISON.error='';COMPARISON.message='Sharing verified responses with class '+code+'…';comparisonRefresh();
  return Promise.resolve().then(function(){return typeof queuedSync==='function'?queuedSync(false):null}).then(function(){
    if(!comparisonCurrent(run))return null;
    return comparisonRequest({action:'class_publish',classCode:code,bankId:b.id,parts:data.payload.parts},run);
  }).then(function(){
    if(!comparisonCurrent(run))return;
    COMPARISON.message='Paper shared with class code '+code+'! Your classmates can now compare with your responses.';
    comparisonClassList();
  }).catch(function(e){if(comparisonCurrent(run)){COMPARISON.error=e.message;COMPARISON.message=''}}).then(function(){if(comparisonCurrent(run)){COMPARISON.busy='';COMPARISON.control=null;comparisonRefresh()}});
}
function comparisonClassList(){
  comparisonGuard();var b=comparisonBank(),code=(S.classCode||'').toUpperCase().trim();
  if(!b||!code||!S.tok)return Promise.resolve();
  COMPARISON.classLoading=true;var run=comparisonRun();
  return comparisonRequest({action:'class_list',bankId:b.id,classCode:code},run).then(function(result){
    if(!comparisonCurrent(run))return;
    COMPARISON.classmates=(result&&result.classmates)||[];
    COMPARISON.classLoading=false;
    comparisonRefresh();
  }).catch(function(){if(comparisonCurrent(run)){COMPARISON.classLoading=false;comparisonRefresh()}});
}
function comparisonClassLoad(){
  comparisonGuard();
  var cbs=$$('[data-classmate-cb]:checked');
  if(cbs.length<2||cbs.length>8){COMPARISON.error='Select between 2 and 8 classmates to compare.';comparisonRefresh();return}
  var list=[];
  cbs.forEach(function(cb,i){
    var idx=Number(cb.getAttribute('data-classmate-cb')),item=COMPARISON.classmates[idx];
    if(item&&item.export)list.push({package:item.export,label:'Classmate '+(i+1),bytes:JSON.stringify(item.export).length});
  });
  COMPARISON.files=list;COMPARISON.report=null;COMPARISON.error='';
  COMPARISON.message='Loaded '+list.length+' classmate submissions. Click "Compare verified responses" below.';
  comparisonRefresh();
}
function comparisonReadFile(file){
  if(file.size>COMPARISON_FILE_LIMIT)return Promise.reject(new Error('Each evidence file must be no larger than 200 KiB.'));
  return new Promise(function(resolve,reject){var reader=new FileReader();reader.onerror=function(){reject(new Error('An evidence file could not be read. Select it again.'))};reader.onload=function(){
    try{var text=String(reader.result||'');if(text.length>COMPARISON_FILE_LIMIT)throw new Error('An evidence file is too large.');var parsed=JSON.parse(text);if(!comparisonPackage(parsed))throw new Error('Select a signed comparison evidence JSON file downloaded from this site.');resolve({package:{snapshot:parsed.snapshot,signature:parsed.signature},label:'',bytes:file.size})}catch(e){reject(new Error(e instanceof SyntaxError?'An evidence file is not valid JSON.':e.message))}
  };reader.readAsText(file)});
}
function comparisonImport(files){
  comparisonGuard();if(COMPARISON.busy)return Promise.resolve();
  var selected=Array.prototype.slice.call(files||[]);if(!selected.length)return Promise.resolve();
  if(!S.tok){COMPARISON.error='Sign in to compare shared evidence.';comparisonRefresh();return Promise.resolve()}
  if(COMPARISON.files.length+selected.length>8){COMPARISON.error='Select between 2 and 8 evidence files in total.';comparisonRefresh();return Promise.resolve()}
  var run=comparisonRun();COMPARISON.busy='import';COMPARISON.error='';COMPARISON.message='Reading selected files locally…';comparisonRefresh();
  return Promise.all(selected.map(comparisonReadFile)).then(function(read){
    if(!comparisonCurrent(run))return;
    var all=COMPARISON.files.concat(read),seen={};
    all.forEach(function(entry){var signature=entry.package.signature;if(seen[signature])throw new Error('The same evidence file was selected twice. Use one submitted paper from each person.');seen[signature]=true});
    if(JSON.stringify({action:'compare',exports:all.map(function(x){return x.package})}).length>COMPARISON_BODY_LIMIT)throw new Error('The selected evidence files exceed the 2 MiB request limit.');
    read.forEach(function(entry){entry.label='Student '+(COMPARISON.files.length+1);COMPARISON.files.push(entry)});
    COMPARISON.report=null;COMPARISON.message='Files loaded locally. The server will verify their signatures, owners, expiry and shared question coverage before comparison.';
  }).catch(function(e){if(comparisonCurrent(run)){COMPARISON.error=e.message;COMPARISON.message=''}}).then(function(){if(comparisonCurrent(run)){COMPARISON.busy='';COMPARISON.control=null;comparisonRefresh()}});
}
function comparisonCompare(){
  comparisonGuard();if(COMPARISON.busy)return Promise.resolve();
  if(!S.tok||COMPARISON.files.length<2||COMPARISON.files.length>8){COMPARISON.error='Sign in and import evidence from 2 to 8 different people.';comparisonRefresh();return Promise.resolve()}
  var run=comparisonRun(),payload={action:'compare',exports:COMPARISON.files.map(function(entry){return entry.package})};
  COMPARISON.busy='compare';COMPARISON.error='';COMPARISON.message='Comparing verified evidence and independently checking the advice. This may take several minutes…';COMPARISON.report=null;comparisonRefresh();
  return comparisonRequest(payload,run).then(function(report){
    if(!comparisonCurrent(run))return;
    if(!report||(report.status!=='complete'&&report.status!=='needs_review')||typeof report.summary!=='string'||!Array.isArray(report.profiles)||!Array.isArray(report.comparisons)||!report.statistics)throw new Error('The service returned an invalid comparison. Please try again.');
    if(report.status==='needs_review'&&(report.profiles.length||report.comparisons.length))throw new Error('The service returned an unverified comparison. Please try again.');
    COMPARISON.report=report;COMPARISON.message=report.status==='complete'?'Comparison ready. Read the coverage and quoted evidence alongside the advice.':'The AI comparison needs review. Verified mark statistics remain available; no unconfirmed advice is shown.';
  }).catch(function(e){if(comparisonCurrent(run)){COMPARISON.error=e.message;COMPARISON.message=''}}).then(function(){if(comparisonCurrent(run)){COMPARISON.busy='';COMPARISON.control=null;comparisonRefresh()}});
}
function comparisonCancel(){var action=COMPARISON.busy;if(COMPARISON.control)COMPARISON.control.abort();COMPARISON.serial++;COMPARISON.control=null;COMPARISON.busy='';COMPARISON.error='';COMPARISON.message=action==='import'?'Cancelled. No selected files were sent to the server.':'Cancelled. The server may already have started processing; cancellation does not undo a submitted request.';comparisonRefresh()}
function comparisonLabel(id){var match=/^p([1-8])$/.exec(id||''),entry=match&&COMPARISON.files[Number(match[1])-1];return entry&&entry.label||String(id||'Participant')}
function comparisonNumber(value){return typeof value==='number'&&isFinite(value)?String(Math.round(value*10)/10):'—'}
function comparisonList(list){return Array.isArray(list)&&list.length?'<ul>'+list.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':''}
function comparisonCategory(value){return {technical_accuracy:'Technical accuracy',question_alignment:'Answering the question',reasoning_explanation:'Reasoning and explanation',context_application:'Application to the scenario',algorithm_logic:'Algorithm logic',code_correctness:'Code correctness',sql_correctness:'SQL correctness',testing_debugging:'Testing and debugging',technical_communication:'Technical communication',response_concision:'Concision and relevance'}[value]||String(value||'Evidence')}
function comparisonEvidence(refs){
  return Array.isArray(refs)&&refs.length?'<details class="comparison-evidence"><summary>Inspect supporting evidence ('+refs.length+')</summary>'+refs.map(function(ref){
    var bits=String(ref.questionId||'').split('.'),question='Question '+bits[0]+(bits.length>1?', part '+(Number(bits[1])+1):'');
    return '<div class="comparison-quote"><b>'+esc(comparisonLabel(ref.participantId))+' · '+esc(question)+'</b><div class="mut">'+esc(ref.source==='answer'?'Original response':'Marking feedback')+(ref.criterionId?' · '+esc(ref.criterionId):'')+'</div><blockquote>'+esc(ref.quote)+'</blockquote></div>';
  }).join('')+'</details>':'';
}
function comparisonErrorType(value){return {requirement_omission:'Missing requirement',command_verb_mismatch:'Command verb not addressed',conceptual_confusion:'Conceptual confusion',technical_imprecision:'Imprecise technical detail',unsupported_claim:'Unsupported claim',stimulus_not_applied:'Scenario not applied',comparison_without_common_basis:'Unequal basis for comparison',unbalanced_evaluation:'Unbalanced evaluation',logic_control_flow:'Logic or control-flow error',boundary_indexing:'Boundary or indexing error',syntax_runtime:'Syntax or runtime error',data_query_error:'Data or query error',representation_notation:'Representation or notation error',testing_validation_gap:'Testing or validation gap',irrelevant_repetition:'Irrelevant detail or repetition',contradiction:'Contradiction'}[value]||String(value||'')}
function comparisonFinding(finding){
  var kind=finding.kind==='strength'?'Demonstrated strength':finding.kind==='criterion_shortfall'?'Criterion shortfall':'Optional writing or study advice';
  return '<article class="comparison-finding"><div class="comparison-kicker">'+esc(kind)+' · '+esc(comparisonCategory(finding.category))+'</div>'+(finding.errorType?'<p><b>Observed error type:</b> '+esc(comparisonErrorType(finding.errorType))+'</p>':'')+'<p>'+esc(finding.statement)+'</p>'+(typeof finding.action==='string'&&finding.action.trim()?'<p><b>Next step:</b> '+esc(finding.action)+'</p>':'')+'<p class="mut">'+(finding.scope==='repeated'?'Observed across multiple responses.':'Observed in one response; this is not a general judgement of ability.')+(finding.kind==='optional_advice'?' This advice is not a mark deduction.':'')+'</p>'+comparisonEvidence(finding.evidence)+'</article>';
}
function comparisonReportHTML(report){
  var stats=report.statistics||{},participants=Array.isArray(stats.participants)?stats.participants:[],audit=report.audit||{},checks=audit.checks||{};
  var html='<section class="feature comparison-report" id="comparison-report"><h2>Comparison report</h2><p>'+esc(report.summary)+'</p><h3>Shared evidence coverage</h3><p>All percentages below use the same '+comparisonNumber(stats.commonMaxMarks)+' available marks across '+(Array.isArray(stats.commonPartIds)?stats.commonPartIds.length:0)+' verified question parts. They are not whole-paper results, HSC bands or class rankings.</p>';
  html+='<p class="comparison-scroll-note">Scroll the table sideways to view all evidence coverage.</p><div class="tw"><table class="res"><caption>Marks on common verified question parts</caption><thead><tr><th>Participant</th><th>Earned / available</th><th>Percentage</th><th>Export coverage</th></tr></thead><tbody>'+participants.map(function(p){return '<tr><th scope="row">'+esc(comparisonLabel(p.participantId))+'</th><td>'+comparisonNumber(p.earned)+' / '+comparisonNumber(p.maxMarks)+'</td><td>'+comparisonNumber(p.percentage)+'%</td><td>'+comparisonNumber(p.includedParts)+' verified in file; '+comparisonNumber(p.excludedParts)+' excluded of '+comparisonNumber(p.totalParts)+' total parts</td></tr>'}).join('')+'</tbody></table></div>';
  if(Array.isArray(stats.byTopic)&&stats.byTopic.length)html+='<details><summary>Compare marks by topic</summary><div class="tw"><table class="res"><thead><tr><th>Topic</th><th>Available marks</th>'+participants.map(function(p){return '<th>'+esc(comparisonLabel(p.participantId))+'</th>'}).join('')+'</tr></thead><tbody>'+stats.byTopic.map(function(topic){return '<tr><th scope="row">'+esc(topic.topic)+'</th><td>'+comparisonNumber(topic.maxMarks)+'</td>'+participants.map(function(p){var score=(topic.scores||[]).filter(function(x){return x.participantId===p.participantId})[0];return '<td>'+comparisonNumber(score&&score.earned)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></details>';
  html+=comparisonList(stats.limitations);
  if(report.status==='needs_review')html+='<div class="aib bad"><h3>AI comparison needs review</h3><p>The verification process did not confirm the generated advice. Use the verified statistics and ask a teacher to review the original responses.</p></div>';
  else{
    html+='<h3>Individual strengths and next steps</h3>'+report.profiles.map(function(profile){return '<section class="comparison-profile"><h4>'+esc(comparisonLabel(profile.participantId))+'</h4>'+(profile.findings||[]).map(comparisonFinding).join('')+'</section>'}).join('');
    html+='<h3>What differs across these responses</h3>'+(report.comparisons.length?report.comparisons.map(function(item){return '<article class="comparison-finding"><div class="comparison-kicker">'+esc(comparisonCategory(item.category))+'</div><p>'+esc(item.statement)+'</p>'+(typeof item.action==='string'&&item.action.trim()?'<p><b>Practice together:</b> '+esc(item.action)+'</p>':'')+comparisonEvidence(item.evidence)+'</article>'}).join(''):'<p>No reliable comparative pattern was established from the shared evidence.</p>');
  }
  html+='<details class="comparison-provenance"><summary>Comparison provenance and checks</summary><p>Requested model: '+esc(audit.requestedModel||'Not recorded')+'<br>Returned model(s): '+esc(Array.isArray(audit.returnedModels)?audit.returnedModels.join(', '):'Not recorded')+'<br>Harness: '+esc(audit.harnessVersion||'Not recorded')+'</p>'+comparisonList(Object.keys(checks).map(function(key){return key+': '+(checks[key]===true?'passed':checks[key]===false?'not passed':String(checks[key]))}))+comparisonList(audit.reasons)+'</details><p class="note">The downloaded report includes quotations from responses and marking feedback. Treat it as private student work.</p><button class="nb ol" id="comparison-download" type="button">Download report JSON</button></section>';
  return html;
}
function comparisonPage(){
  comparisonGuard();CUR={b:null,n:0};
  var banks=BANKS.filter(function(b){return !b.hidden&&S.u[b.id]&&S.u[b.id].done}),busy=!!COMPARISON.busy,signed=!!S.tok;
  if(!comparisonBank())COMPARISON.bankId=banks.length?String(banks[0].id):'';
  var b=comparisonBank(),eligible=signed&&b?comparisonExportData(b):null,excluded=eligible?eligible.excluded:{};
  var html='<div class="pg comparison-page"><h1 class="pt">Compare responses</h1><p>Compare evidence from 2–8 people who completed the same paper. Each person chooses to export their own submitted work, then shares that file with the organiser. The report connects technical strengths, error types and next steps to original answers and verified marking feedback.</p>';
  if(!signed)html+='<div class="feature"><p><a href="#/account">Sign in</a> to export your work or compare shared evidence.</p></div>';
  else{
    html+='<div class="comparison-steps"><section class="feature"><h2>1. Export your own evidence</h2><p>Select a submitted paper with current AI marking. The server verifies marks before creating a signed file valid for 7 days.</p>';
    if(banks.length)html+='<label for="comparison-bank">Submitted paper</label><select id="comparison-bank"'+(busy?' disabled':'')+'>'+banks.map(function(bank){return '<option value="'+esc(bank.id)+'"'+(String(bank.id)===COMPARISON.bankId?' selected':'')+'>'+esc(bank.name)+'</option>'}).join('')+'</select><p>'+eligible.payload.parts.length+' parts eligible for verification. Excluded: '+excluded.diagram+' diagram parts, '+excluded.self+' self-marked parts and '+excluded.unverified+' parts without current verified AI marking. Only shared verified parts enter the comparison.</p><p class="mut">The file holds your original answers and marking feedback. Anyone you give it to can read it, so share it only with your class.</p><div class="acts"><button class="nb" id="comparison-export"'+(busy?' disabled':'')+' type="button">Export signed evidence</button>'+(S.classCode?'<button class="nb ol" id="comparison-class-publish"'+(busy?' disabled':'')+' type="button">Share with my class ('+esc(S.classCode)+')</button>':'')+'</div><div style="margin-top:14px;padding:10px 14px;background:#fff;border:1px solid #d0d0d0;border-radius:4px"><label for="comparison-class-code"><b>Class code</b> (optional, lets your class compare without sending files)</label><div style="display:flex;gap:8px;align-items:center;margin-top:6px"><input id="comparison-class-code" value="'+esc(S.classCode||'')+'" placeholder="e.g. 12SE2026" maxlength="20" style="max-width:180px;text-transform:uppercase;padding:6px 10px"'+(busy?' disabled':'')+'><button class="nb sm" id="comparison-class-save"'+(busy?' disabled':'')+' type="button">Set code</button></div></div>';
    else html+='<p>No submitted papers are available. <a href="#/papers">Finish and submit a paper</a>, then complete its AI marking.</p>';
    html+='</section><section class="feature"><h2>2. Compare shared evidence</h2><p>Import one signed file from each person, or select from your class roster below.</p>'+
      (S.classCode?'<div style="margin-bottom:16px;padding:12px;background:#fff;border:1px solid #c8d7ee;border-radius:4px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>Classmates in code '+esc(S.classCode)+':</b><button class="nb sm ol" id="comparison-class-refresh"'+(busy||COMPARISON.classLoading?' disabled':'')+' type="button">'+(COMPARISON.classLoading?'Loading...':'Find classmates')+'</button></div>'+
      (COMPARISON.classmates.length?
        '<p style="margin:8px 0 6px">Select 2 to 8 submissions to compare:</p><ul style="list-style:none;padding:0;margin:0 0 10px">'+
        COMPARISON.classmates.map(function(cm,idx){return '<li style="margin:6px 0"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-classmate-cb="'+idx+'" '+(busy?'disabled':'')+'><span>Classmate '+(idx+1)+' ('+cm.partsCount+' verified parts &middot; expires in '+Math.max(1,Math.round((cm.expiresAt-Date.now())/86400000))+'d)</span></label></li>'}).join('')+
        '</ul><button class="nb sm" id="comparison-class-load"'+(busy?' disabled':'')+' type="button">Use selected classmates</button>':
        '<p style="margin:6px 0 0;font-size:.9em;color:#444">No classmate submissions loaded yet. Click "Find classmates" to look for peers in your class code.</p>'
      )+'</div>':'')+
      '<label for="comparison-files">Or upload signed evidence files (JSON, up to 200 KiB each)</label><input id="comparison-files" type="file" accept=".json,application/json" multiple'+(busy?' disabled':'')+'>';
    if(COMPARISON.files.length)html+='<ul class="comparison-file-list">'+COMPARISON.files.map(function(entry,index){return '<li><label for="comparison-label-'+index+'">Participant '+(index+1)+' label</label><input id="comparison-label-'+index+'" data-comparison-label="'+index+'" value="'+esc(entry.label)+'" maxlength="40"'+(busy?' disabled':'')+'><button class="nb sm ol" data-comparison-remove="'+index+'" type="button"'+(busy?' disabled':'')+'>Remove</button></li>'}).join('')+'</ul>';
    html+='<p>'+COMPARISON.files.length+' of 8 files loaded. This browser keeps files and reports only in memory; sign-out, account changes, refresh or Clear erase that browser copy. The service privately caches completed reports for your account.</p><p class="mut">Comparing sends the selected answers and marking feedback to DeepSeek and shows you the report. This is a class activity, so no separate permission step is needed.</p><div class="acts"><button class="nb" id="comparison-run"'+(busy||COMPARISON.files.length<2?' disabled':'')+' type="button">Compare verified responses</button><button class="nb ol" id="comparison-clear" type="button"'+(busy?' disabled':'')+'>Clear files and report</button></div></section></div>';
  }
  html+='<div id="comparison-status" role="status" aria-live="polite">'+esc(COMPARISON.message)+'</div><div id="comparison-error" role="alert">'+esc(COMPARISON.error)+'</div>'+(busy?'<p><button class="nb ol" id="comparison-cancel" type="button">Cancel '+esc(COMPARISON.busy)+'</button></p>':'');
  if(COMPARISON.report)html+=comparisonReportHTML(COMPARISON.report);
  html+='<p class="note">This is formative feedback from an unofficial practice site. It does not change individual marks. A concise response earns credit through relevant technical detail and the marking criteria; length or polish alone does not determine marks. Diagram evidence and self-assigned marks are currently excluded.</p></div>';
  return frame('Compare responses',html);
}
function comparisonBind(){
  comparisonGuard();
  function on(id,event,fn){var node=$('#'+id);if(node)node.addEventListener(event,fn)}
  function buttons(){var exportButton=$('#comparison-export'),runButton=$('#comparison-run');if(exportButton)exportButton.disabled=!!COMPARISON.busy;if(runButton)runButton.disabled=!!COMPARISON.busy||COMPARISON.files.length<2}
  on('comparison-bank','change',function(e){COMPARISON.bankId=e.target.value;COMPARISON.error='';COMPARISON.message='';comparisonRefresh()});
  on('comparison-export','click',comparisonExport);on('comparison-run','click',comparisonCompare);
  on('comparison-class-publish','click',comparisonClassPublish);
  on('comparison-class-refresh','click',comparisonClassList);
  on('comparison-class-load','click',comparisonClassLoad);
  on('comparison-class-save','click',function(){
    var inp=$('#comparison-class-code');
    if(!inp)return;
    S.classCode=inp.value.toUpperCase().trim().slice(0,20);
    persist();
    if(typeof syncSoon==='function')syncSoon();
    comparisonClassList();
    comparisonRefresh();
  });
  on('comparison-files','change',function(e){comparisonImport(e.target.files)});
  on('comparison-clear','click',function(){comparisonReset();COMPARISON.message='Shared evidence and report cleared from this page.';comparisonRefresh()});
  on('comparison-cancel','click',comparisonCancel);
  on('comparison-download','click',function(){comparisonGuard();if(COMPARISON.report)comparisonDownload({report:COMPARISON.report,localLabels:COMPARISON.files.map(function(entry,index){return {participantId:'p'+(index+1),label:entry.label}})},'software-engineering-comparison-report.json')});
  $$('[data-comparison-label]').forEach(function(node){node.addEventListener('input',function(){var index=Number(node.getAttribute('data-comparison-label'));if(COMPARISON.files[index])COMPARISON.files[index].label=node.value.trim().slice(0,40)||'Student '+(index+1)})});
  $$('[data-comparison-remove]').forEach(function(node){node.addEventListener('click',function(){COMPARISON.files.splice(Number(node.getAttribute('data-comparison-remove')),1);COMPARISON.report=null;COMPARISON.error='';COMPARISON.message='';comparisonRefresh()})});
  buttons();
}
