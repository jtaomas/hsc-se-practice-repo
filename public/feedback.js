/* Evidence-led feedback and the separate post-exam improvement coach. */
var FEEDBACK_LABELS={clarity:'Clarity',concision:'Concision',technical_accuracy:'Technical accuracy',relevance:'Relevance',structure:'Organisation',reasoning:'Reasoning',evidence_examples:'Evidence and examples',terminology:'Technical terminology',consistency:'Consistency',code_quality:'Code quality',diagram_quality:'Diagram quality',knowledge_gap:'Knowledge to review',technical_error:'Technical error',missing_requirement:'Missing requirement',insufficient_explanation:'Incomplete explanation',application_gap:'Application to the scenario',unsupported_judgement:'Unsupported judgement',misread_command:'Question interpretation',communication:'Communication affecting the criterion',no_response:'No response'};
function feedbackLabel(id){return FEEDBACK_LABELS[id]||String(id||'').replace(/_/g,' ')}
function feedbackArray(value){return Array.isArray(value)?value:[]}
function feedbackRating(value){return typeof value==='number'&&isFinite(value)&&value>=0&&value<=10?value+' / 10':'Not assessed'}
function feedbackDiagramContext(scene){
  // Display-only projection of the saved scene. Never guess labels from proximity
  // or alter the evidence IDs, persisted feedback, or audit checksum.
  var elements=Object.create(null);
  feedbackArray(scene&&scene.elements).forEach(function(e){
    if(!e||e.isDeleted||typeof e.id!=='string')return;
    if(Object.prototype.hasOwnProperty.call(elements,e.id)){elements[e.id]=null;return}
    elements[e.id]={id:e.id,type:e.type,text:typeof e.text==='string'?e.text:'',containerId:typeof e.containerId==='string'?e.containerId:null,
      boundTextIds:feedbackArray(e.boundElements).filter(function(x){return x&&x.type==='text'&&typeof x.id==='string'}).map(function(x){return x.id}),
      start:e.startBinding&&typeof e.startBinding.elementId==='string'?e.startBinding.elementId:null,
      end:e.endBinding&&typeof e.endBinding.elementId==='string'?e.endBinding.elementId:null};
  });
  return {elements:elements};
}
function feedbackDiagramReference(id,scene){
  var elements=scene.elements,element=elements[id],reference='Diagram reference: '+id;
  if(!element)return reference;
  function label(e,short){
    if(!e)return '';
    var texts=e.type==='text'?[e.text]:Object.keys(elements).map(function(key){return elements[key]}).filter(function(t){return t&&t.type==='text'&&(t.containerId===e.id||e.boundTextIds.indexOf(t.id)>=0&&!t.containerId)}).map(function(t){return t.text});
    return texts.map(function(text){return short?text.split(/\r?\n/).filter(function(line){return line.trim()})[0]||'':text}).filter(function(text){return text.trim()}).join(' / ');
  }
  var own=label(element,false),description=own?'“'+own+'”':'';
  if(element.type==='arrow'||element.type==='line'){
    var ends=[element.start,element.end].filter(function(endpoint){return endpoint!==null}).map(function(endpoint){var text=label(elements[endpoint],true);return text?'“'+text+'”':'diagram reference: '+endpoint});
    description=(description?description+' — ':'')+'Connector'+(ends.length===2?' between '+ends[0]+' and '+ends[1]:ends.length?' with endpoint '+ends[0]:'');
  }
  return description?description+' (diagram reference: '+id+')':reference;
}
function feedbackEvidence(evidence,scene){return feedbackArray(evidence).length?'<blockquote class="feedback-evidence">'+feedbackArray(evidence).map(function(value){return esc(scene&&typeof value==='string'?feedbackDiagramReference(value,scene):value)}).join('<br>')+'</blockquote>':''}
function feedbackQuality(quality,b,scene){
  if(!feedbackArray(quality).length)return '';
  var scope=b?'These are averages across the assessed responses shown for each factor. They do not change exam marks.':'These ratings describe this response and do not change its exam mark.';
  return '<p class="note">'+scope+' Not assessed means the factor does not apply or there is too little evidence to rate it.</p><div class="quality-grid">'+quality.map(function(q){return '<details class="quality-card"><summary><span>'+esc(feedbackLabel(q.id))+'</span><b>'+esc(feedbackRating(q.rating))+'</b></summary><p>'+esc(q.feedback||'')+'</p>'+feedbackEvidence(q.evidence,scene)+(q.action?'<p><b>Next step:</b> '+esc(q.action)+'</p>':'')+(b&&q.evidencePartIds?'<p>'+improvementLinks(b,q.evidencePartIds)+'</p>':'')+(typeof q.assessedParts==='number'?'<p class="note">Based on '+q.assessedParts+' assessed response'+(q.assessedParts===1?'':'s')+'.</p>':'')+'</details>'}).join('')+'</div>';
}
function feedbackDetails(f,scene){
  var losses=f.losses,h='';
  if(losses&&typeof losses.totalLost==='number'){
    // The explanation and fix for each lost mark lead the feedback ("What's wrong"); this drawer keeps the evidence.
    h+='<h5>Where marks were lost</h5><p>'+losses.totalLost+' mark'+(losses.totalLost===1?'':'s')+' below the maximum. The parts of your answer each loss is based on:</p>';
    if(losses.allocation==='holistic'&&losses.totalLost)h+='<p class="note">The rubric uses an overall judgement. Categories explain the shortfall; they are not separate numerical deductions.</p>';
    h+=feedbackArray(losses.items).map(function(l){return '<div class="feedback-loss"><b>'+esc(feedbackLabel(l.category))+(typeof l.marksLost==='number'?' · '+l.marksLost+' mark'+(l.marksLost===1?'':'s'):'')+'</b>'+(feedbackArray(l.evidence).length?feedbackEvidence(l.evidence,scene):'<p class="note">Nothing in your answer addresses this.</p>')+'<p class="note">Criteria: '+feedbackArray(l.criterionIds).map(esc).join(', ')+'</p></div>'}).join('');
  }
  if(feedbackArray(f.quality).length)h+='<h5>Response quality</h5>'+feedbackQuality(f.quality,null,scene);
  return h;
}
var IMPROVEMENT_VERSION=typeof AIIMPROVEMENT_VERSION==='undefined'?'post-exam-coach-v10':AIIMPROVEMENT_VERSION,IMPROVEMENT_RUNS={};
function improvementPayload(b){
  var bs=BS(b.id),answers=[];
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){
    var k=(qi+1)+'.'+i,ai=aiRecord(b,qi+1,i),entry={questionNumber:qi+1,partIndex:i,answer:AUTO[it.t]?(bs.ans[k]==null?null:JSON.parse(JSON.stringify(bs.ans[k]))):aiPayload(b,qi+1,i).answer};
    if(ai&&ai.stamp&&ai.audit&&ai.audit.inputDigest)entry.markingReference=ai.audit.inputDigest;
    answers.push(entry);
  })});
  return {bankId:b.id,answers:answers};
}
function improvementStamp(b){return JSON.stringify({version:IMPROVEMENT_VERSION,markingVersion:typeof AIMARKING_VERSION==='undefined'?'':AIMARKING_VERSION,attempt:[BS(b.id).start,BS(b.id).doneAt],questions:b.qs,payload:improvementPayload(b)})}
function improvementCurrent(b,run){return !!run&&S===run.state&&S.u[b.id]===run.paper&&S.tok===run.token&&(S.owner||'')===run.owner&&(typeof SYNC==='undefined'?0:SYNC.epoch)===run.epoch&&run.paper.done&&improvementStamp(b)===run.stamp}
function improvementRecord(b){var r=BS(b.id).improvement;return r&&r.stamp===improvementStamp(b)?r:null}
function improvementRefresh(b){var panel=CUR.b===b&&$('#improvement');if(panel)panel.outerHTML=improvementPanel(b)}
function runImprovement(b){
  var bs=BS(b.id),existing=IMPROVEMENT_RUNS[b.id];
  if(!S.tok||!bs.done)return Promise.resolve();
  if(improvementCurrent(b,existing))return existing.promise;
  if(improvementRecord(b))return Promise.resolve();
  var run={state:S,paper:bs,token:S.tok,owner:S.owner||'',epoch:typeof SYNC==='undefined'?0:SYNC.epoch,stamp:improvementStamp(b)};
  var control=new AbortController(),timer=setTimeout(function(){control.abort()},295000);
  IMPROVEMENT_RUNS[b.id]=run;delete bs.improvementError;improvementRefresh(b);
  run.promise=fetch('/api/improve',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+run.token},body:JSON.stringify(improvementPayload(b)),signal:control.signal}).then(function(r){return r.json().catch(function(){throw new Error('The improvement service returned an unreadable reply.')}).then(function(j){
    if(!r.ok)throw new Error(r.status===401?'Sign in again to create your improvement plan.':j.error||'The improvement plan could not be created.');
    if(!j||['ready','needs_review'].indexOf(j.status)<0||typeof j.summary!=='string'||!j.coverage||!j.lossSummary||!Array.isArray(j.quality)||!Array.isArray(j.plan))throw new Error('The improvement service returned an invalid plan.');
    if(improvementCurrent(b,run)&&IMPROVEMENT_RUNS[b.id]===run){bs.improvement={stamp:run.stamp,result:j,ts:Date.now()};save(b.id)}
  })}).catch(function(e){if(improvementCurrent(b,run)&&IMPROVEMENT_RUNS[b.id]===run){bs.improvementError=e.name==='AbortError'?'The improvement plan timed out. Your answers and marks are saved.':e.message}}).then(function(){clearTimeout(timer);if(IMPROVEMENT_RUNS[b.id]===run)delete IMPROVEMENT_RUNS[b.id];if(improvementCurrent(b,run))improvementRefresh(b)});
  return run.promise;
}
function improvementLinks(b,ids){return feedbackArray(ids).filter(function(id){return /^\d+\.\d+$/.test(id)}).map(function(id){var p=id.split('.');return '<a href="#/'+encodeURIComponent(b.id)+'/review/'+Number(p[0])+'">Q'+Number(p[0])+' part '+(Number(p[1])+1)+'</a>'}).join(', ')}
function improvementEvidence(b,evidence){return feedbackArray(evidence).map(function(e){return '<blockquote class="feedback-evidence">'+esc(e.quote||'')+'<br>'+improvementLinks(b,[e.partId])+'</blockquote>'}).join('')}
function improvementFindings(b,title,items){return feedbackArray(items).length?'<h3>'+esc(title)+'</h3>'+items.map(function(x){return '<div class="feedback-loss"><h4>'+esc(x.title||'')+'</h4><p>'+esc(x.detail||'')+'</p>'+(x.occurrence?'<p class="note">'+(x.occurrence==='recurring'?'Observed across multiple responses':'An isolated observation')+'</p>':'')+improvementEvidence(b,x.evidence)+(x.action?'<p><b>Action:</b> '+esc(x.action)+'</p>':'')+'</div>'}).join(''):''}
function improvementReport(b,r){
  var c=r.coverage||{},l=r.lossSummary||{},h='<p>'+esc(r.summary)+'</p><p class="note">Verified marking: '+Number(c.knownMark||0)+' / '+Number(c.assessedMaxMarks||0)+' assessed marks across '+Number(c.confirmedParts||0)+' parts, including '+Number(c.blankParts||0)+' unanswered parts. '+Number(c.pendingMaxMarks||0)+' marks remain unassessed. Uses verified AI and automatic marking; provisional AI marks and any marks you set yourself are excluded from this analysis.</p>';
  h+='<h3>Lost-mark categories</h3><p>'+Number(l.totalKnownLost||0)+' known marks lost; '+Number(l.unallocatedLost||0)+' cannot be assigned to an exact category. '+Number(l.unknownMaxMarks||0)+' marks are awaiting assessment.</p>';
  h+='<div class="feedback-table"><table class="res"><tr><th>Category</th><th>Exact marks lost</th><th>Overall-rubric observations</th><th>Evidence</th></tr>'+feedbackArray(l.categories).map(function(x){return '<tr><td>'+esc(feedbackLabel(x.category))+'</td><td>'+Number(x.exactMarksLost||0)+'</td><td>'+Number(x.holisticOccurrences||0)+'</td><td>'+improvementLinks(b,x.partIds)+'</td></tr>'}).join('')+'</table></div><p class="note">Observations from overall rubrics can overlap. Do not add them to the marks lost.</p>';
  h+='<h3>Response-quality profile</h3>'+feedbackQuality(r.quality,b);
  if(r.status==='ready'){
    h+=improvementFindings(b,'Strengths to keep',r.strengths)+improvementFindings(b,'Knowledge to review',r.knowledgeGaps)+improvementFindings(b,'Patterns in your writing',r.writingPatterns);
    h+='<h3>Your improvement plan</h3>'+feedbackArray(r.plan).map(function(p){return '<article class="improvement-step"><h4>'+Number(p.priority)+'. '+esc(p.title||'')+'</h4><p>'+esc(p.why||'')+'</p><p>'+improvementLinks(b,p.evidencePartIds)+'</p><ol>'+feedbackArray(p.steps).map(function(s){return '<li>'+esc(s)+'</li>'}).join('')+'</ol><p><b>Practice:</b> '+esc(p.exercise||'')+'</p><p><b>Success check:</b> '+esc(p.successCheck||'')+'</p><p><b>When:</b> '+esc(p.schedule||'')+'</p></article>'}).join('');
  }else h+='<p>The coach could not confirm a grounded improvement plan. Review the question feedback with a teacher.</p>';
  if(feedbackArray(r.limitations).length)h+='<details class="xdd"><summary>Limits of this analysis</summary><ul>'+r.limitations.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></details>';
  return h;
}
function improvementPanel(b){
  var bs=BS(b.id),r=improvementRecord(b),running=improvementCurrent(b,IMPROVEMENT_RUNS[b.id]);
  var h='<section class="improvement-panel" id="improvement"><h2 class="pt">Your improvement plan</h2>';
  if(!bs.done)return h+'<p>Submit the paper to review patterns across your answers.</p></section>';
  if(r)return h+improvementReport(b,r.result)+'</section>';
  if(running)return h+'<p role="status">Reviewing your feedback and building an evidence-based practice plan. This can take several minutes.</p></section>';
  h+='<p>Review knowledge gaps, recurring writing patterns and practical steps for your next paper. The coach uses your answers and verified marking feedback, with a separate audit of its recommendations.</p>';
  if(aiProvisionals(b))h+='<p class="note">Provisional AI marks and their criterion feedback are excluded from the verified evidence used by this plan.</p>';
  if(!S.tok)return h+'<p><a href="#/account">Sign in</a> to create your plan.</p></section>';
  if(aiRunCurrent(b,AIRUN[b.id]))return h+'<p>Wait for AI marking to finish before creating your plan.</p></section>';
  if(aiTodo(b).length)h+='<p class="note">Some answers are still awaiting AI marking. A plan created now will cover only the available verified feedback.</p>';
  if(bs.improvementError)h+='<p class="err" role="alert">'+esc(bs.improvementError)+'</p>';
  h+='<p class="note">Creating a plan sends the paper answers and verified feedback to DeepSeek and uses one AI allowance slot.</p><button class="nb" data-act="improve">Create my improvement plan</button></section>';
  return h;
}
document.addEventListener('click',function(e){var button=e.target.closest&&e.target.closest('[data-act="improve"]');if(button&&CUR.b){e.preventDefault();runImprovement(CUR.b)}});
