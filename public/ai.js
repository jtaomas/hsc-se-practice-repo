/* ---------- AI marking (DeepSeek through /api/mark) ---------- */
function plain(html){
  var d=document.createElement('div');
  d.innerHTML=String(html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li|tr|div|h\d|pre)>/gi,'\n').replace(/<\/t[dh]>/gi,' | ');
  return (d.textContent||'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function dbPlain(db){return Object.keys(db).map(function(n){var t=db[n];return 'Table '+n+'\n'+t.c.join(' | ')+'\n'+t.r.map(function(r){return r.join(' | ')}).join('\n')}).join('\n\n')}
var KIND={tx:'written response',py:'Python program',ps:'pseudocode algorithm',sq:'SQL query',dr:'diagram'};
function aiPayload(b,n,i){
  var it=b.qs[n-1].it[i],a=BS(b.id).ans[n+'.'+i];
  return {bankId:b.id,questionNumber:n,partIndex:i,answer:it.t==='tx'?plain(a):it.t==='dr'?xdScene(a&&a.e):it.t==='ft'?JSON.parse(JSON.stringify(a||{})):String(a||'')};
}
function aiStamp(b,n,i){
  var q=b.qs[n-1];
  // Keep exact snapshots: a changed answer, question, rubric or local harness invalidates the result.
  return JSON.stringify({version:typeof AIMARKING_VERSION==='undefined'?'unavailable':AIMARKING_VERSION,stimulus:q.st,db:q.db,item:q.it[i],answer:aiPayload(b,n,i).answer});
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
      if(!r.ok){var e=new Error(r.status===401?'Sign in again to use AI marking. Your answers are still saved.':j.error||('Marking failed ('+r.status+')'));e.status=r.status;e.busy=j.code==='marking_busy';e.retryMs=Math.max(1,Math.min(30,+(r.headers&&r.headers.get&&r.headers.get('retry-after'))||15))*1000;e.fatal=r.status===401||(r.status===409&&!e.busy)||r.status===429||j.code==='no_key'||j.code==='bad_key'||r.status===404||r.status===402;throw e}
      if((j.status!=='marked'&&j.status!=='needs_review')||(j.status==='marked'&&(typeof j.mark!=='number'||!isFinite(j.mark)||Math.floor(j.mark)!==j.mark))||(j.status==='needs_review'&&j.mark!==null))throw new Error('The marking service returned an invalid result. Please try again.');
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
function aiPaperStamp(b){return JSON.stringify(b.qs.map(function(q,qi){return q.it.map(function(it,i){return AUTO[it.t]?null:aiStamp(b,qi+1,i)})}))}
/* Stores one finished AI result in the paper, in the shape the review pages read. */
function aiStore(bs,k,it,stamp,r){
  if(r.status==='marked'&&(r.mark<0||r.mark>it.m))throw new Error('The marking service returned a mark outside the available range.');
  function strings(a){return Array.isArray(a)?a.filter(function(x){return typeof x==='string'}):[]}
  bs.ai[k]={status:r.status,g:r.mark,stamp:stamp,fb:{summary:typeof r.summary==='string'?r.summary:'',strengths:strings(r.strengths),improve:strings(r.improve),advice:strings(r.advice),criteria:Array.isArray(r.criteria)?r.criteria:[],losses:r.losses||null,quality:Array.isArray(r.quality)?r.quality:[]},audit:r.audit||{},ts:Date.now()};
  delete bs.aiErr[k];
}
var AIRUN={};
/* Rolling update: as each answer finishes, refresh the status panel, scores and nav without a full redraw. */
function aiLive(b,qn){
  if(typeof CUR==='undefined'||CUR.b!==b||!$('#app'))return;
  var panel=$('#aib');if(panel)panel.outerHTML=aiStatusHTML(b);
  if(!CUR.rv&&location.hash.indexOf('/results')>=0){
    var t=document.createElement('div');t.innerHTML=resultsPage(b);
    var feat=$('.feature',$('#app')),nf=$('.feature',t);if(feat&&nf)feat.innerHTML=nf.innerHTML;
    var cur=$$('table.res',$('#app')),nxt=$$('table.res',t);
    cur.forEach(function(el,i){if(nxt[i])el.innerHTML=nxt[i].innerHTML});
    var np=$('#aib',t),op=$('#aib');if(np&&op)op.outerHTML=np.outerHTML;
  }else if(CUR.rv&&$('#qarea')){
    refreshNav();
    var ae=document.activeElement;
    if(qn===CUR.n&&!(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae&&ae.isContentEditable)){var y=window.scrollY;xdCleanup();$('#qarea').innerHTML=qHTML(b,CUR.n,true);afterQDraw();window.scrollTo(0,y)}
  }
}
function aiRunCurrent(b,run){return !!run&&S===run.state&&S.u[b.id]===run.paper&&(S.tok||'')===run.token&&(S.owner||'')===run.owner&&(typeof SYNC==='undefined'?0:SYNC.epoch)===run.epoch&&String(run.paper.start)+'/'+String(run.paper.doneAt)===run.attempt&&aiPaperStamp(b)===run.stamp}
function runAI(b,onProg){
  var bs=BS(b.id),calls=aiTodo(b);
  if(!S.tok||!bs.done)return Promise.resolve();
  if(aiRunCurrent(b,AIRUN[b.id]))return AIRUN[b.id].promise;
  if(!calls.length){onProg&&onProg(0,0,null);return Promise.resolve()}
  var idx=0,done=0,fatal=null,total=calls.length;
  var run={state:S,paper:bs,token:S.tok,owner:S.owner||'',epoch:typeof SYNC==='undefined'?0:SYNC.epoch,attempt:String(bs.start)+'/'+String(bs.doneAt),stamp:aiPaperStamp(b)};
  AIRUN[b.id]=run;
  run.total=total;run.done=0;run.waiting=0;
  /* An answer that is "already being marked" (an earlier request is still running) is not a failure: wait and ask again. */
  function attempt(p,tries){
    return aiCall(p,run.token).catch(function(e){
      if(!e.busy||tries>=24||!aiRunCurrent(b,run)||AIRUN[b.id]!==run)throw e;
      run.waiting++;aiLive(b);
      return new Promise(function(ok){setTimeout(ok,e.retryMs||15000)}).then(function(){run.waiting--;return attempt(p,tries+1)});
    });
  }
  function next(){
    if(idx>=calls.length||fatal||!aiRunCurrent(b,run)||AIRUN[b.id]!==run)return Promise.resolve();
    var t=calls[idx++],stamp=aiStamp(b,t[0],t[1]),payload=aiPayload(b,t[0],t[1]);
    var prepared=t[3].t==='dr'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):Promise.resolve(payload);
    return prepared.then(function(p){if(!aiRunCurrent(b,run)||AIRUN[b.id]!==run)return null;return attempt(p,0)}).then(function(r){
      if(!r)return;
      if(!aiRunCurrent(b,run)||AIRUN[b.id]!==run||stamp!==aiStamp(b,t[0],t[1]))return;
      aiStore(bs,t[2],t[3],stamp,r);
    }).catch(function(e){if(aiRunCurrent(b,run)&&AIRUN[b.id]===run)bs.aiErr[t[2]]=e.message;if(e.fatal)fatal=e}).then(function(){done++;if(aiRunCurrent(b,run)&&AIRUN[b.id]===run){run.done=done;save(b.id);aiLive(b,t[0]);onProg&&onProg(done,total,fatal)}return next()});
  }
  run.promise=Promise.all([next(),next()]).then(function(){if(AIRUN[b.id]===run)delete AIRUN[b.id];return fatal});
  return run.promise;
}
/* Practice mode: mark one question on its own. Runs beside, never instead of, the whole-paper run. */
var AIQ={};
function aiqKey(b,n){return b.id+'/'+n}
function aiqLive(b,n){
  if(typeof CUR==='undefined'||CUR.b!==b||CUR.n!==n||CUR.rv||!$('#qarea'))return;
  var ae=document.activeElement;
  if(ae&&(/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae.isContentEditable)){var pn=$('#pq');if(pn)pn.outerHTML=pqPanelHTML(b,n);return}
  var y=window.scrollY;xdCleanup();$('#qarea').innerHTML=qHTML(b,n,false);afterQDraw();window.scrollTo(0,y);refreshNav();
}
function runAIQuestion(b,n){
  var bs=BS(b.id),key=aiqKey(b,n);
  if(!S.tok)return Promise.resolve();
  if(AIQ[key])return AIQ[key].promise;
  var calls=aiTodo(b).filter(function(t){return t[0]===n});
  if(!calls.length)return Promise.resolve();
  var run={state:S,paper:bs,token:S.tok,total:calls.length,done:0,waiting:0};
  AIQ[key]=run;
  function current(){return AIQ[key]===run&&S===run.state&&S.u[b.id]===run.paper&&(S.tok||'')===run.token}
  function attempt(p,tries){
    return aiCall(p,run.token).catch(function(e){
      if(!e.busy||tries>=24||!current())throw e;
      run.waiting++;aiqLive(b,n);
      return new Promise(function(ok){setTimeout(ok,e.retryMs||15000)}).then(function(){run.waiting--;return attempt(p,tries+1)});
    });
  }
  run.promise=Promise.all(calls.map(function(t){
    var stamp=aiStamp(b,t[0],t[1]),payload=aiPayload(b,t[0],t[1]);
    var prepared=t[3].t==='dr'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):Promise.resolve(payload);
    return prepared.then(function(p){return current()?attempt(p,0):null}).then(function(r){
      if(!r||!current()||stamp!==aiStamp(b,t[0],t[1]))return;
      aiStore(bs,t[2],t[3],stamp,r);
    }).catch(function(e){if(current())bs.aiErr[t[2]]=e.message}).then(function(){run.done++;if(current()){save(b.id);aiqLive(b,n)}});
  })).then(function(){if(AIQ[key]===run)delete AIQ[key];aiqLive(b,n)});
  return run.promise;
}
function aiBlock(b,n,i,it,bs,k,a,sc){
  var ai=aiRecord(b,n,i),live=bs.done||(typeof pqShown==='function'&&pqShown(b,n));
  if(ai){
    var f=ai.fb||{},review=ai.status==='needs_review',legacy=!ai.stamp,audit=ai.audit||{};
    var scene=it.t==='dr'&&!legacy&&typeof feedbackDiagramContext==='function'?feedbackDiagramContext(aiPayload(b,n,i).answer):null;
    var provenance=['Requested model: '+(audit.requestedModel||'not recorded'),'Returned model(s): '+(Array.isArray(audit.returnedModels)?audit.returnedModels.join(', '):'not recorded'),'Harness: '+(audit.harnessVersion||'not recorded'),'Question version: '+(audit.questionVersion||'not recorded'),'Rubric version: '+(audit.rubricVersion||'not recorded')];
    if(audit.inputDigest)provenance.push('Answer reference: '+audit.inputDigest);
    return '<div class="aib'+(review?' bad':'')+'"><h5>'+(review?'Needs review — no AI mark awarded':'AI marking')+(!review?' <span class="sc">'+ai.g+' / '+it.m+'</span>':'')+'</h5>'+(legacy?'<p class="note">Earlier marking harness. This result has not been assessed by the current marking process.</p>':'')+(f.summary?'<p>'+esc(f.summary)+'</p>':'')+
      (review?'<p>The marking process could not establish a reliable mark. Review the criteria and set a mark yourself, or ask a teacher to review this answer.</p>':'')+
      (f.strengths&&f.strengths.length?'<p class="gh"><b>What earned marks</b></p><ul>'+f.strengths.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
      (f.improve&&f.improve.length?'<p class="gh"><b>How to gain more marks</b></p><ul>'+f.improve.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
      (f.advice&&f.advice.length?'<p class="gh"><b>Further advice (not a mark deduction)</b></p><ul>'+f.advice.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
      (f.criteria&&f.criteria.length?'<details class="xdd"><summary>Criterion evidence</summary><ul>'+f.criteria.map(function(c){return '<li><b>'+esc(c.id||'Criterion')+'</b>'+': '+esc(c.assessment||'')+(c.evidence?scene?feedbackEvidence(Array.isArray(c.evidence)?c.evidence:[c.evidence],scene):'<br>'+esc(Array.isArray(c.evidence)?c.evidence.join('; '):c.evidence):'')+(c.basis?'<br>'+esc(c.basis):'')+'</li>'}).join('')+'</ul></details>':'')+
      (typeof feedbackDetails==='function'&&!review?feedbackDetails(f,scene):'')+
      (!legacy?'<details class="xdd"><summary>Marking provenance</summary><p>'+provenance.map(esc).join('<br>')+'</p></details>':'<p>Re-marking sends the question, marking guide and your answer, including any drawing, to DeepSeek.</p>'+(S.tok?'<button class="nb sm" data-act="airemark" data-k="'+esc(k)+'">Re-mark with current process</button>':'<a href="#/account">Sign in to re-mark</a>'))+
      (bs.self[k]!=null?'<p class="note">You changed this mark yourself, so your mark is used.</p>':'')+'</div>';
  }
  if(live&&isAns(it,a)&&!S.tok)return '<div class="aib"><h5>AI marking</h5><p><a href="#/account">Sign in</a> to use AI marking, or use the marking guide to set your own mark.</p></div>';
  if(bs.aiErr[k])return '<div class="aib bad"><h5>AI marking did not finish</h5><p>'+esc(bs.aiErr[k])+'</p><button class="nb sm" data-act="airetry">Try again</button></div>';
  if(live&&isAns(it,a)&&AIQ[aiqKey(b,n)])return '<div class="aib"><h5>AI marking</h5><p>Marking this answer now. The feedback appears here when it is done.</p></div>';
  if(live&&isAns(it,a))return '<div class="aib"><h5>AI marking</h5><p>This answer has not been marked yet. AI marking sends the question, marking guide and your answer, including any drawing, to DeepSeek.</p><button class="nb sm" data-act="airetry">Mark with AI</button></div>';
  return '';
}
/* ---------- helpers for the mistakes page ---------- */
function closedCompare(it,a){
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
  return '<table class="cmp"><tr><th></th><th>Your answer</th><th>Correct answer</th></tr>'+wrong.map(function(x){return '<tr><td>'+esc(x.l)+'</td><td class="no">'+esc(x.y)+'</td><td class="yes">'+esc(x.c)+'</td></tr>'}).join('')+'</table>';
}
function mistakeList(){
  var out=[];
  BANKS.forEach(function(b){var u=S.u[b.id];if(!u||!u.done||b.hidden)return;b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var s=score(b,qi+1,i);if(s.set&&s.g<s.m)out.push({b:b,n:qi+1,i:i,q:q,it:it,s:s})})})});
  return out;
}
function itemClass(it){return AUTO[it.t]?'closed':QT[it.t]&&QT[it.t].cls?QT[it.t].cls:it.t==='tx'?'written':it.t==='dr'?'diagram':'code'}
