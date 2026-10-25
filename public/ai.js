/* ---------- AI marking (DeepSeek through /api/mark) ---------- */
function plain(html){
  var d=document.createElement('div');
  d.innerHTML=String(html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li|tr|div|h\d|pre)>/gi,'\n').replace(/<\/t[dh]>/gi,' | ');
  return (d.textContent||'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function dbPlain(db){return Object.keys(db).map(function(n){var t=db[n];return 'Table '+n+'\n'+t.c.join(' | ')+'\n'+t.r.map(function(r){return r.join(' | ')}).join('\n')}).join('\n\n')}
var KIND={tx:'written response',py:'Python program',ps:'pseudocode algorithm',sq:'SQL query',dr:'diagram'};
function aiPayload(b,n,i,ans){
  var it=b.qs[n-1].it[i],a=arguments.length>3?ans:BS(b.id).ans[n+'.'+i];
  return {bankId:b.id,questionNumber:n,partIndex:i,answer:it.t==='tx'?plain(a):it.t==='dr'?xdScene(a&&a.e):it.t==='ft'?JSON.parse(JSON.stringify(a||{})):String(a||'')};
}
function aiStamp(b,n,i,ans){
  var q=b.qs[n-1],payload=arguments.length>3?aiPayload(b,n,i,ans):aiPayload(b,n,i);
  // Keep exact snapshots: a changed answer, question, rubric or local harness invalidates the result.
  return JSON.stringify({version:typeof AIMARKING_VERSION==='undefined'?'unavailable':AIMARKING_VERSION,stimulus:q.st,db:q.db,item:q.it[i],answer:payload.answer});
}
function aiRecord(b,n,i){
  var ai=BS(b.id).ai[n+'.'+i];
  if(!ai)return null;
  if(ai.stamp)return ai.stamp===aiStamp(b,n,i)?ai:null;
  return !ai.status&&typeof ai.g==='number'&&isFinite(ai.g)?ai:null;
}
function aiCall(payload,token){
  if(!token){var missing=new Error('Sign in to use AI marking. You can still mark this answer yourself.');missing.fatal=true;return Promise.reject(missing)}
  var control=new AbortController(),timer=setTimeout(function(){control.abort()},250000);
  return fetch('/api/mark',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(payload),signal:control.signal}).then(function(r){
    return r.json().catch(function(){return {error:'The marking service sent an unreadable reply.'}}).then(function(j){
      j=j||{};
      if(!r.ok){var e=new Error(r.status===401?'Sign in again to use AI marking. Your answers are still saved.':j.error||('Marking failed ('+r.status+')'));e.status=r.status;e.code=j.code;e.fatal=r.status===401||(r.status===409&&j.code!=='marking_busy')||r.status===429||j.code==='no_key'||j.code==='bad_key'||r.status===404||r.status===402;throw e}
      if((j.status!=='marked'&&j.status!=='provisional'&&j.status!=='needs_review')||((j.status==='marked'||j.status==='provisional')&&(typeof j.mark!=='number'||!isFinite(j.mark)||Math.floor(j.mark)!==j.mark))||(j.status==='needs_review'&&j.mark!==null))throw new Error('The marking service returned an invalid result. Please try again.');
      return j;
    });
  }).then(function(r){clearTimeout(timer);return r},function(e){clearTimeout(timer);if(e.name==='AbortError')throw new Error('AI marking timed out. Try again when the service is available.');throw e});
}
function aiTodo(b){
  var bs=BS(b.id),t=[];
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var k=(qi+1)+'.'+i;if(AUTO[it.t]||!isAns(it,bs.ans[k]))return;if(!aiRecord(b,qi+1,i))t.push([qi+1,i,k,it])})});
  return t;
}
function aiReviews(b){var count=0;b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var a=aiRecord(b,qi+1,i);if(a&&a.status==='needs_review')count++})});return count}
function aiProvisionals(b){var count=0;b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){if(score(b,qi+1,i).src==='provisional')count++})});return count}
function aiPaperStamp(b){return JSON.stringify(b.qs.map(function(q,qi){return q.it.map(function(it,i){return AUTO[it.t]?null:aiStamp(b,qi+1,i)})}))}
/* Stores one finished AI result in the paper, in the shape the review pages read. */
function aiStore(bs,k,it,stamp,r){
  if((r.status==='marked'||r.status==='provisional')&&(r.mark<0||r.mark>it.m))throw new Error('The marking service returned a mark outside the available range.');
  function strings(a){return Array.isArray(a)?a.filter(function(x){return typeof x==='string'}):[]}
  bs.ai[k]={status:r.status,g:r.mark,stamp:stamp,fb:{summary:typeof r.summary==='string'?r.summary:'',strengths:strings(r.strengths),improve:strings(r.improve),advice:strings(r.advice),criteria:Array.isArray(r.criteria)?r.criteria:[],losses:r.losses||null,quality:Array.isArray(r.quality)?r.quality:[]},audit:r.audit||{},ts:Date.now()};
  delete bs.aiErr[k];
}
var AI_CONCURRENCY=10,AIRUN={},AIQ={},AIWORK={active:0,queue:[]};
function aiqKey(b,n){return b.id+'/'+n}
function aiQuestionStamp(b,n){return JSON.stringify(b.qs[n-1].it.map(function(it,i){return AUTO[it.t]?null:aiStamp(b,n,i)}))}
function aiContext(b,n){var bs=BS(b.id);return {state:S,paper:bs,token:S.tok||'',owner:S.owner||'',epoch:typeof SYNC==='undefined'?0:SYNC.epoch,mode:bs.mode||'',start:String(bs.start),attempt:String(bs.start)+'/'+String(bs.doneAt),question:n||0,stamp:n?aiQuestionStamp(b,n):aiPaperStamp(b)}}
function aiRunCurrent(b,run){return !!run&&S===run.state&&S.u[b.id]===run.paper&&(S.tok||'')===run.token&&(S.owner||'')===run.owner&&(typeof SYNC==='undefined'?0:SYNC.epoch)===run.epoch&&(run.paper.mode||'')===run.mode&&(run.question?String(run.paper.start)===run.start:String(run.paper.start)+'/'+String(run.paper.doneAt)===run.attempt)&&(run.question?aiQuestionStamp(b,run.question):aiPaperStamp(b))===run.stamp}
function aiQuestionRun(b,n){var run=AIQ[aiqKey(b,n)];return aiRunCurrent(b,run)?run:null}
function aiUnlocked(){return true}
/* Practice and whole-paper work share the same ten-request ceiling. Queued
   requests recheck their context before they can send any student work. */
function aiDispatch(payload,token,current,prog){
  return new Promise(function(resolve,reject){
    AIWORK.queue.push({payload:payload,token:token,current:current,prog:prog,resolve:resolve,reject:reject});aiDrain();
  });
}
function aiDrain(){
  while(AIWORK.active<AI_CONCURRENCY&&AIWORK.queue.length){
    (function(job){
      if(!job.current()||!aiUnlocked()){job.resolve(null);return}
      if(job.prog&&!job.prog.sent)job.prog.sent=Date.now();
      AIWORK.active++;
      Promise.resolve().then(function(){return job.current()&&aiUnlocked()?aiCall(job.payload,job.token):null}).then(job.resolve,job.reject).then(function(){AIWORK.active--;aiDrain()});
    })(AIWORK.queue.shift());
  }
}
function aiWorkers(next,count){
  var workers=[];for(var i=0;i<Math.min(AI_CONCURRENCY,count);i++)workers.push(next());
  return Promise.all(workers);
}
/* Live progress for answers being marked. /api/mark answers in one reply, so the
   steps shown are the marking pipeline's usual order, timed from typical runs
   (two blind markers, then an audit). A one-second ticker updates the
   progress boxes in place, so a student typing in an editor is not disturbed. */
var AIPROG={};
var AI_STEPS=[[0,'Sending your answer, the question and the marking criteria'],[4,'Two markers are assessing your answer independently, criterion by criterion'],[50,'Comparing the two assessments'],[60,'An auditor is checking the evidence behind the mark'],[110,'Checking the feedback and saving the result']];
function aiProgKey(id,k){return id+'|'+k}
function aiProgStart(b,k,run){var p={queued:Date.now(),sent:0,run:run};AIPROG[aiProgKey(b.id,k)]=p;return p}
function aiProgEnd(b,k,p){var key=aiProgKey(b.id,k);if(p&&AIPROG[key]===p)delete AIPROG[key]}
function aiClock(ms){var s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function aiProgFrac(p,now){if(!p||!p.sent)return 0;return 0.95*(1-Math.exp(-(now-p.sent)/55000))}
function aiRunFrac(run,now){
  var f=run.done||0;
  Object.keys(AIPROG).forEach(function(k){var p=AIPROG[k];if(p.run===run)f+=aiProgFrac(p,now)});
  return Math.min(1,f/Math.max(1,run.total||1));
}
function aiProgInner(p,now){
  if(!p.sent)return '<p class="aipr-hd"><b>Queued.</b> Waiting for a free marking slot <span class="aipr-t">'+aiClock(now-p.queued)+'</span></p><div class="aibar"><span style="width:0%"></span></div>';
  var s=(now-p.sent)/1000,cur=0;
  AI_STEPS.forEach(function(st,i){if(s>=st[0])cur=i});
  return '<p class="aipr-hd"><b>Marking this answer now</b> <span class="aipr-t">'+aiClock(now-p.sent)+'</span></p>'+
    '<div class="aibar"><span style="width:'+Math.round(100*aiProgFrac(p,now))+'%"></span></div>'+
    '<ol class="aipr-steps">'+AI_STEPS.map(function(st,i){return '<li class="'+(i<cur?'past':i===cur?'cur':'next')+'">'+st[1]+'</li>'}).join('')+'</ol>'+
    '<p class="note">Steps and progress are estimated from typical marking times. The feedback replaces this box as soon as it is ready; it can take up to about four minutes.</p>';
}
function aiProgHTML(b,k){
  var key=aiProgKey(b.id,k),p=AIPROG[key];
  if(!p)return '<p class="aipr-hd"><b>Waiting to be marked.</b> Other answers are ahead of this one. It starts automatically.</p>';
  return '<div class="aipr" data-aiprog="'+esc(key)+'">'+aiProgInner(p,Date.now())+'</div>';
}
/* Run-level boxes (the practice panel and the review banner) carry data-airun="bank" or "bank/question". */
function aiRunBarHTML(run){return ' <span class="aipr-t">'+aiClock(Date.now()-(run.t0||Date.now()))+'</span><div class="aibar"><span style="width:'+Math.round(100*aiRunFrac(run,Date.now()))+'%"></span></div>'}
function aiProgTick(){
  var now=Date.now();
  Array.prototype.forEach.call(document.querySelectorAll('[data-aiprog]'),function(el){var p=AIPROG[el.getAttribute('data-aiprog')];if(p)el.innerHTML=aiProgInner(p,now)});
  Array.prototype.forEach.call(document.querySelectorAll('[data-airun]'),function(el){
    var k=el.getAttribute('data-airun'),run=k.indexOf('/')>=0?AIQ[k]:AIRUN[k];if(!run)return;
    var bar=el.querySelector('.aibar span'),t=el.querySelector('.aipr-t');
    if(bar)bar.style.width=Math.round(100*aiRunFrac(run,now))+'%';
    if(t&&run.t0)t.textContent=aiClock(now-run.t0);
  });
}
if(typeof setInterval==='function'&&typeof document!=='undefined')setInterval(aiProgTick,1000);
function runAI(b,onProg){
  var bs=BS(b.id),calls=aiTodo(b).filter(function(t){return !bs.aiErr[t[2]]});
  if(!S.tok||!bs.done||!aiUnlocked())return Promise.resolve();
  if(aiRunCurrent(b,AIRUN[b.id]))return AIRUN[b.id].promise;
  if(!calls.length)return Promise.resolve();
  var idx=0,done=0,fatal=null,total=calls.length,run=aiContext(b);
  run.total=total;run.done=0;run.t0=Date.now();AIRUN[b.id]=run;
  function current(){return aiRunCurrent(b,run)&&AIRUN[b.id]===run}
  function progress(){if(onProg)try{onProg(done,total,fatal)}catch(e){console.warn('Marking progress display could not refresh.')}}
  function next(){
    if(idx>=calls.length||fatal||!current()||!aiUnlocked())return Promise.resolve();
    var t=calls[idx++],stamp=aiStamp(b,t[0],t[1]),payload=aiPayload(b,t[0],t[1]),practice=aiQuestionRun(b,t[0]),prog=null;
    // Submission can reuse an unchanged practice request already in flight.
    var prepared=practice?practice.promise:Promise.resolve();
    return prepared.then(function(){
      if(!current()||aiRecord(b,t[0],t[1])||bs.aiErr[t[2]])return null;
      return t[3].t==='dr'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):payload;
    }).then(function(p){
      // Set fatal before dispatch frees its slot, so this batch's queued work
      // cannot start; current() still permits already-sent successes to save.
      if(!p||fatal||!current())return null;
      prog=aiProgStart(b,t[2],run);
      return aiDispatch(p,run.token,function(){return !fatal&&current()},prog).catch(function(e){if(e.fatal)fatal=e;throw e});
    }).then(function(r){
      if(!r||!current()||stamp!==aiStamp(b,t[0],t[1]))return;
      aiStore(bs,t[2],t[3],stamp,r);
    }).catch(function(e){if(current())bs.aiErr[t[2]]=e.message;if(e.fatal)fatal=e}).then(function(){aiProgEnd(b,t[2],prog);done++;if(current()){run.done=done;save(b.id);progress()}return next()});
  }
  run.promise=aiWorkers(next,calls.length).then(function(){if(AIRUN[b.id]===run)delete AIRUN[b.id];return fatal});
  return run.promise;
}
/* Practice marks stay bound to this question, account and attempt. Completing
   the same attempt does not discard a request; changing its answers does. */
function aiqLive(b,n,context){if(typeof refreshMarking==='function')refreshMarking(b,context)}
function runAIQuestion(b,n){
  var bs=BS(b.id),key=aiqKey(b,n),old=aiQuestionRun(b,n);
  if(!S.tok||bs.done||bs.mode!=='practice'||!aiUnlocked())return Promise.resolve();
  if(old)return old.promise;
  var calls=aiTodo(b).filter(function(t){return t[0]===n&&!bs.aiErr[t[2]]});
  if(!calls.length)return Promise.resolve();
  var run=aiContext(b,n),idx=0,fatal=null;run.total=calls.length;run.done=0;run.t0=Date.now();AIQ[key]=run;
  function current(){return AIQ[key]===run&&aiRunCurrent(b,run)}
  function progress(){if(current())try{aiqLive(b,n,run)}catch(e){console.warn('Marking progress display could not refresh.')}}
  function next(){
    if(idx>=calls.length||fatal||!current()||!aiUnlocked())return Promise.resolve();
    var t=calls[idx++],stamp=aiStamp(b,t[0],t[1]),payload=aiPayload(b,t[0],t[1]),prog=aiProgStart(b,t[2],run);
    var prepared=t[3].t==='dr'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):Promise.resolve(payload);
    return prepared.then(function(p){
      return !fatal&&current()?aiDispatch(p,run.token,function(){return !fatal&&current()},prog).catch(function(e){if(e.fatal)fatal=e;throw e}):null;
    }).then(function(r){
      if(r&&current()&&stamp===aiStamp(b,t[0],t[1]))aiStore(bs,t[2],t[3],stamp,r);
    }).catch(function(e){if(current())bs.aiErr[t[2]]=e.message;if(e.fatal)fatal=e}).then(function(){aiProgEnd(b,t[2],prog);run.done++;if(current()){save(b.id);progress()}return next()});
  }
  run.promise=aiWorkers(next,calls.length).then(function(){if(AIQ[key]===run){delete AIQ[key];if(aiRunCurrent(b,run))aiqLive(b,n,run)}return fatal});
  return run.promise;
}
function aiFirst(t){t=String(t||'').trim();var m=t.match(/^.*?[.!?](\s|$)/);t=m?m[0].trim():t;return t.length>170?t.slice(0,167).replace(/\s+\S*$/,'')+'...':t}
/* "What's wrong" comes first and is the most prominent part of any marking feedback: each lost mark,
   why it was lost and how to fix it. What earned marks follows it. */
function aiWrongHTML(f,max,g){
  var L=f.losses,items=L&&Array.isArray(L.items)?L.items.filter(function(l){return l&&(l.explanation||l.action)}):[],lost=typeof g==='number'&&typeof max==='number'?max-g:(L&&typeof L.totalLost==='number'?L.totalLost:0),rows='';
  function lab(c){return typeof feedbackLabel==='function'?feedbackLabel(c):String(c||'').replace(/_/g,' ')}
  if(items.length)rows=items.map(function(l){return '<li>'+(l.category?'<b>'+esc(lab(l.category))+(typeof l.marksLost==='number'&&l.marksLost?' (&minus;'+l.marksLost+')':'')+':</b> ':'')+esc(l.explanation||'')+(l.action?'<span class="wfix"><b>How to fix it:</b> '+esc(l.action)+'</span>':'')+'</li>'}).join('');
  else if(f.improve&&f.improve.length)rows=f.improve.map(function(x){return '<li>'+esc(x)+'</li>'}).join('');
  if(!rows)return '';
  return '<div class="wrongbox"><h5><span>What&rsquo;s wrong</span>'+(lost>0?'<span class="wl">&minus;'+lost+' mark'+(lost===1?'':'s')+'</span>':'')+'</h5><ul>'+rows+'</ul></div>';
}
function aiEarnedHTML(f){return f.strengths&&f.strengths.length?'<div class="earnbox"><h5>What earned marks</h5><ul>'+f.strengths.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></div>':''}
/* One AI marking result in the review style. opt.remark=false hides the re-mark button (retries). */
function aiResultHTML(b,n,i,it,k,ai,opt){
  opt=opt||{};
  var f=ai.fb||{},review=ai.status==='needs_review',provisional=ai.status==='provisional',legacy=!ai.stamp,audit=ai.audit||{};
  var scene=it.t==='dr'&&!legacy&&typeof feedbackDiagramContext==='function'?feedbackDiagramContext(opt.answer!==undefined?aiPayload(b,n,i,opt.answer).answer:aiPayload(b,n,i).answer):null;
  var provenance=['Requested model: '+(audit.requestedModel||'not recorded'),'Returned model(s): '+(Array.isArray(audit.returnedModels)?audit.returnedModels.join(', '):'not recorded'),'Harness: '+(audit.harnessVersion||'not recorded'),'Question version: '+(audit.questionVersion||'not recorded'),'Rubric version: '+(audit.rubricVersion||'not recorded')];
  if(provisional)provenance.push('Decision: provisional lower-mark fallback');
  else if(audit.resolution==='adjudicated')provenance.push('Decision: confirmed after disagreement resolution and audit');
  if(typeof audit.durationMs==='number'&&isFinite(audit.durationMs)&&audit.durationMs>=0&&audit.durationMs<=300000)provenance.push('Model assessment time: '+(Math.round(audit.durationMs/100)/10)+' seconds (excludes browser queue and transfer time)');
  if(audit.inputDigest)provenance.push('Answer reference: '+audit.inputDigest);
  var running=aiRunCurrent(b,AIRUN[b.id])||aiQuestionRun(b,n);
  return '<div class="aib'+(review||provisional?' bad':'')+'"><h5>'+(review?'Needs review — no AI mark awarded':provisional?'Provisional mark':(opt.title||'AI marking'))+'</h5>'+(legacy?'<p class="note">Earlier marking harness. This result has not been assessed by the current marking process.</p>':'')+
    (!review&&!provisional?aiWrongHTML(f,it.m,ai.g):'')+
    (f.summary?'<p class="aisum">'+esc(aiFirst(f.summary))+'</p>':'')+
    (review?'<p>The marking process could not establish a reliable mark. Review the criteria and set a mark yourself, or ask a teacher to review this answer.</p>':'')+
    (provisional?'<p>The assessments remain unresolved. This is the lower valid proposed mark, not a confirmed assessment. Its criterion evidence is provisional; audited feedback and quality ratings are unavailable. It is excluded from verified improvement plans and comparisons. Review the guide and set a mark yourself or with a teacher.</p>':'')+
    (!provisional?aiEarnedHTML(f):'')+
    '<details class="xdd"><summary>Details</summary>'+
    (!provisional&&f.advice&&f.advice.length?'<p class="gh"><b>Further advice (not a mark deduction)</b></p><ul>'+f.advice.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
    (f.criteria&&f.criteria.length?'<details class="xdd"><summary>'+(provisional?'Provisional criterion evidence':'Criterion evidence')+'</summary><ul>'+f.criteria.map(function(c){return '<li><b>'+esc(c.id||'Criterion')+'</b>'+': '+esc(c.assessment||'')+(c.evidence?scene?feedbackEvidence(Array.isArray(c.evidence)?c.evidence:[c.evidence],scene):'<br>'+esc(Array.isArray(c.evidence)?c.evidence.join('; '):c.evidence):'')+(c.basis?'<br>'+esc(c.basis):'')+'</li>'}).join('')+'</ul></details>':'')+
    (typeof feedbackDetails==='function'&&!review&&!provisional?feedbackDetails(f,scene):'')+
    (!legacy?'<details class="xdd"><summary>Marking provenance</summary><p>'+provenance.map(esc).join('<br>')+'</p></details>':'')+
    (opt.remark!==false&&!review&&!provisional?(S.tok?'<p style="margin-top:10px"><button type="button" class="nb sm" data-act="airemark" data-k="'+esc(k)+'"'+(running?' disabled':'')+'>'+(legacy?'Re-mark with current process':'Re-mark this answer')+'</button></p>':'<p style="margin-top:10px"><a href="#/account">Sign in to re-mark</a></p>'):'')+
    '</details>'+(opt.after||'')+'</div>';
}
function aiBlock(b,n,i,it,bs,k,a,sc){
  var ai=aiRecord(b,n,i),live=bs.done||(typeof pqShown==='function'&&pqShown(b,n));
  if(ai)return aiResultHTML(b,n,i,it,k,ai,{after:bs.self[k]!=null?'<p class="note">You changed this mark yourself, so your mark is used.</p>':''});
  if(live&&isAns(it,a)&&!S.tok)return '<div class="aib"><h5>AI marking</h5><p><a href="#/account">Sign in</a> to use AI marking, or use the marking guide to set your own mark.</p></div>';
  if(bs.aiErr[k])return '<div class="aib bad"><h5>AI marking did not finish</h5><p>'+esc(bs.aiErr[k])+'</p>'+(aiRunCurrent(b,AIRUN[b.id])||aiQuestionRun(b,n)?'<p>Other answers are still being marked. You can retry this answer when the batch finishes.</p>':'<button class="nb sm" data-act="airetry">Try again</button>')+'</div>';
  if(live&&isAns(it,a)&&(aiQuestionRun(b,n)||aiRunCurrent(b,AIRUN[b.id])))return '<div class="aib"><h5>AI marking</h5>'+aiProgHTML(b,k)+'</div>';
  if(live&&isAns(it,a))return '<div class="aib"><h5>AI marking</h5><p>This answer has not been marked yet. AI marking sends the question, marking guide and your answer, including any drawing, to DeepSeek.</p><button class="nb sm" data-act="airetry">Mark with AI</button></div>';
  return '';
}
/* ---------- helpers for the mistakes page ---------- */
/* Rows the student got wrong. hideCorrect leaves out the correct answers (retry feedback, so the next try is still a real attempt). */
function closedCompare(it,a,hideCorrect){
  var rows=[];
  function add(l,y,c,ok){rows.push({l:l,y:y,c:c,ok:ok})}
  if(QT[it.t]&&QT[it.t].compare)QT[it.t].compare(it,a).forEach(function(r){add(r[0],r[1],r[2],r[3])});
  else if(it.t==='mc')add('',a==null?'No answer':it.o[a],it.o[it.a],a===it.a);
  else if(it.t==='ms'){var s=Array.isArray(a)?a:[];add('',s.map(function(j){return it.o[j]}).join('; ')||'No answer',it.a.map(function(j){return it.o[j]}).join('; '),s.length===it.a.length&&it.a.every(function(j){return s.indexOf(j)>=0}))}
  else if(it.t==='dd'){it.b.forEach(function(bl,u){var v=a?a[u]:undefined;add('Dropdown '+(u+1),v==null?'No answer':bl[0][v],bl[0][bl[1]],v===bl[1])})}
  else if(it.t==='gd'){it.r.forEach(function(row,r){row.forEach(function(c,ci){if(typeof c==='string')return;var v=a?a[r+','+ci]:undefined;add(plain(row[0])+' ('+plain(it.h[ci])+')',v==null?'No answer':c[0][v],c[0][c[1]],v===c[1])})})}
  else if(it.t==='mt'){it.r.forEach(function(row,r){var v=a?a[r]:undefined;add(plain(row[0]),v==null?'No answer':it.h[v+1],it.h[row[1]+1],v===row[1])})}
  else if(it.t==='tk'){var sel=Array.isArray(a)?a:[];it.r.forEach(function(row,r){var y=it.h.slice(1).filter(function(c,ci){return sel.indexOf(r+','+ci)>=0}),c=row[1].map(function(ci){return it.h[ci+1]});add(plain(row[0]),y.join(', ')||'None ticked',c.join(', ')||'None',y.join()===c.join())})}
  var wrong=rows.filter(function(x){return !x.ok});
  if(hideCorrect)return '<table class="cmp"><tr><th></th><th>Still wrong</th></tr>'+wrong.map(function(x){return '<tr><td>'+esc(x.l||'Your answer')+'</td><td class="no">'+esc(x.y)+'</td></tr>'}).join('')+'</table>';
  return '<table class="cmp"><tr><th></th><th>Your answer</th><th>Correct answer</th></tr>'+wrong.map(function(x){return '<tr><td>'+esc(x.l)+'</td><td class="no">'+esc(x.y)+'</td><td class="yes">'+esc(x.c)+'</td></tr>'}).join('')+'</table>';
}
function mistakeList(){
  var out=[];
  BANKS.forEach(function(b){var u=S.u[b.id];if(!u||!u.done||b.hidden)return;b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var s=score(b,qi+1,i);if(s.set&&s.src!=='provisional'&&s.g<s.m)out.push({b:b,n:qi+1,i:i,q:q,it:it,s:s})})})});
  return out;
}
function itemClass(it){return AUTO[it.t]?'closed':QT[it.t]&&QT[it.t].cls?QT[it.t].cls:it.t==='tx'?'written':it.t==='dr'?'diagram':'code'}
