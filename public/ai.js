/* ---------- AI marking (DeepSeek through /api/mark) ---------- */
function plain(html){
  var d=document.createElement('div');
  d.innerHTML=String(html||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|li|tr|div|h\d|pre)>/gi,'\n').replace(/<\/t[dh]>/gi,' | ');
  return (d.textContent||'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function dbPlain(db){return Object.keys(db).map(function(n){var t=db[n];return 'Table '+n+'\n'+t.c.join(' | ')+'\n'+t.r.map(function(r){return r.join(' | ')}).join('\n')}).join('\n\n')}
var KIND={tx:'written response',py:'Python program',ps:'pseudocode algorithm',sq:'SQL query',dr:'diagram'};
function aiPayload(b,n,i){
  var q=b.qs[n-1],it=q.it[i],bs=BS(b.id),k=n+'.'+i,a=bs.ans[k],c=bs.chk[k];
  var p={type:KIND[it.t],stimulus:plain(q.st)+(q.db?'\n\n'+dbPlain(q.db):''),question:(it.lb?it.lb+' ':'')+plain(it.q),max:it.m,criteria:it.crit||[],
    sample:it.t==='tx'?plain(it.model):it.model,answer:it.t==='tx'?plain(a):it.t==='dr'?xdText(a&&a.e):String(a||''),wordLimit:it.w||null};
  if(c)p.tests=it.t==='sq'?(c.p?'The query returned the same rows as the sample query.':'The query returned different rows from the sample query.'):c.p+' of '+c.t+' automatic test runs gave the expected output.';
  return p;
}
function aiCall(payload){
  return fetch('/api/mark',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).then(function(r){
    return r.json().catch(function(){return {error:'The marking service sent an unreadable reply.'}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||('Marking failed ('+r.status+')'));e.fatal=j.code==='no_key'||j.code==='bad_key'||r.status===404||r.status===402;throw e}
      return j;
    });
  });
}
function aiTodo(b){
  var bs=BS(b.id),t=[];
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var k=(qi+1)+'.'+i;if(AUTO[it.t])return;if(!bs.ai[k]||bs.ai[k].g==null)t.push([qi+1,i,k,it])})});
  return t;
}
var AIRUN={};
function runAI(b,onProg){
  var bs=BS(b.id),todo=aiTodo(b),calls=[];
  todo.forEach(function(t){if(!isAns(t[3],bs.ans[t[2]])){bs.ai[t[2]]={g:0,none:1,fb:{summary:'No answer was given for this part.',strengths:[],improve:[]},ts:Date.now()};delete bs.aiErr[t[2]]}else calls.push(t)});
  save(b.id);
  if(!calls.length){onProg&&onProg(0,0,null);return Promise.resolve()}
  if(AIRUN[b.id])return AIRUN[b.id];
  var idx=0,done=0,fatal=null,total=calls.length;
  function next(){
    if(idx>=calls.length||fatal||S.u[b.id]!==bs)return Promise.resolve();
    var t=calls[idx++];
    return aiCall(aiPayload(b,t[0],t[1])).then(function(r){
      if(S.u[b.id]!==bs)return;
      bs.ai[t[2]]={g:Math.max(0,Math.min(t[3].m,Math.round(+r.mark))),fb:{summary:r.summary||'',strengths:r.strengths||[],improve:r.improve||[]},ts:Date.now()};delete bs.aiErr[t[2]];
    }).catch(function(e){if(S.u[b.id]===bs)bs.aiErr[t[2]]=e.message;if(e.fatal)fatal=e}).then(function(){done++;if(S.u[b.id]===bs)save(b.id);onProg&&onProg(done,total,fatal);return next()});
  }
  var run=Promise.all([next(),next(),next()]).then(function(){if(AIRUN[b.id]===run)delete AIRUN[b.id];return fatal});
  AIRUN[b.id]=run;
  return AIRUN[b.id];
}
function aiBlock(b,n,i,it,bs,k,a,sc){
  var ai=bs.ai[k];
  if(ai&&ai.g!=null){
    var f=ai.fb||{};
    return '<div class="aib"><h5>AI marking <span class="sc">'+ai.g+' / '+it.m+'</span></h5>'+(f.summary?'<p>'+esc(f.summary)+'</p>':'')+
      (f.strengths&&f.strengths.length?'<p><b>What earned marks</b></p><ul>'+f.strengths.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
      (f.improve&&f.improve.length?'<p><b>How to gain more marks</b></p><ul>'+f.improve.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'')+
      (bs.self[k]!=null?'<p class="note">You changed this mark yourself, so your mark is used.</p>':'')+'</div>';
  }
  if(bs.aiErr[k])return '<div class="aib bad"><h5>AI marking did not finish</h5><p>'+esc(bs.aiErr[k])+'</p><button class="nb sm" data-act="airetry">Try again</button></div>';
  if(bs.done&&isAns(it,a))return '<div class="aib"><h5>AI marking</h5><p>This answer has not been marked yet.</p><button class="nb sm" data-act="airetry">Mark with AI</button></div>';
  return '';
}
/* ---------- helpers for the mistakes page ---------- */
function closedCompare(it,a){
  var rows=[];
  function add(l,y,c,ok){rows.push({l:l,y:y,c:c,ok:ok})}
  if(it.t==='mc')add('',a==null?'No answer':it.o[a],it.o[it.a],a===it.a);
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
  BANKS.forEach(function(b){var u=S.u[b.id];if(!u||!u.done)return;b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var s=score(b,qi+1,i);if(s.g<s.m)out.push({b:b,n:qi+1,i:i,q:q,it:it,s:s})})})});
  return out;
}
function itemClass(it){return AUTO[it.t]?'closed':it.t==='tx'?'written':it.t==='dr'?'diagram':'code'}
