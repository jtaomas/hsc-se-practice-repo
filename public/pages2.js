/* ---------- Papers, My mistakes ---------- */
var MF={bank:'',topic:'',kind:'',sel:''};
function fmtD(t){if(!t)return '';var d=new Date(t);return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function aiState(b){
  var bs=BS(b.id);if(!bs.done)return '';
  var todo=aiTodo(b).length,errKeys=Object.keys(bs.aiErr||{}).filter(function(k){return bs.aiErr[k]}),errs=errKeys.length;
  return errs?'AI marking incomplete'+(errs>1?' ('+errs+' answers)':'')+'<br><span class="note">Reason: '+esc(String(bs.aiErr[errKeys[0]]).slice(0,240))+'</span>':todo?(S.tok?'Not AI marked yet':'Sign in for AI marking'):aiReviews(b)?'Needs review':aiProvisionals(b)?'Provisional marks need review':'AI marking finished';
}
/* Whole-paper marking from the Papers page: a paper submitted while signed out, or whose marking never finished, can be marked here without opening it. */
function paperRunBox(b,run){return '<div class="aib" data-airun="'+esc(b.id)+'" role="status"><b>Marking: '+(run.done||0)+' of '+(run.total||0)+' answers</b>'+aiRunBarHTML(run)+'</div>'}
function paperMarkBtns(b,run){
  if(!S.tok)return '<a class="nb sm ol" href="#/account">Sign in to AI mark</a>';
  var todo=aiTodo(b).length,dis=run?' disabled':'',h='';
  if(todo)h+='<button type="button" class="nb sm ol" data-act="paperremark" data-id="'+esc(b.id)+'" data-only="missing"'+dis+'>Mark '+todo+' unmarked answer'+(todo>1?'s':'')+'</button>';
  return h+'<button type="button" class="nb sm ol" data-act="paperremark" data-id="'+esc(b.id)+'"'+dis+'>'+(run?'Marking...':'Re-mark entire paper')+'</button>';
}
function papersPage(){
  CUR={b:null,n:0};
  var visible=BANKS.filter(function(b){return !b.hidden});
  var rows=visible.map(function(b){
    var run=null,u=S.u[b.id],st=u?(u.done?'Submitted':(u.start?'In progress':'Not started')):'Not started',sc='',acts='<a class="nb sm" href="#/'+b.id+'">'+(u&&u.start&&!u.done?'Continue':'Open')+'</a>';
    if(u&&u.done){var t=totals(b);sc='<b>'+t.T+' / '+t.markedM+'</b> <span class="mut">'+(t.markedM?'('+Math.round(100*t.T/t.markedM)+'% of assessed marks)':'No marks assessed')+(t.P?' · '+t.P+' marks unscored':'')+'</span>'+(t.provisionalParts?'<br><span class="note">'+provisionalMarksText(t)+'</span>':'');
      run=aiRunCurrent(b,AIRUN[b.id])?AIRUN[b.id]:null;
      acts='<a class="nb sm" href="#/'+b.id+'/review/1">View paper and marking</a><a class="nb sm ol" href="#/'+b.id+'/results">Results</a><a class="nb sm ol" href="#/mistakes/'+b.id+'">Mistakes</a>'+paperMarkBtns(b,run)}
    return '<tr><td><b>'+esc(b.name)+'</b><div class="mut">'+esc(b.sub)+'</div></td><td>'+st+(u&&u.done?'<div class="mut">'+fmtD(u.doneAt)+'</div>':'')+'</td><td>'+sc+(u&&u.done?(run?paperRunBox(b,run):'<div class="mut">'+aiState(b)+'</div>'):'')+'</td><td class="ra">'+acts+'</td></tr>';
  }).join('');
  var hist=S.hist.filter(function(h){return !BANKS.some(function(b){return b.id===h.id&&b.hidden})}).sort(function(a,b){return b.at-a.at});
  var done=visible.filter(function(b){return S.u[b.id]&&S.u[b.id].done}).length;
  return frame('Papers','<div class="pg"><h1 class="pt">All papers</h1><div class="feature"><p>Open a finished paper to see your answers beside the AI marking, the sample answer and the criteria. '+done+' of '+visible.length+' papers finished.</p><p><a class="nb ol" href="#/class">Class answers</a></p>'+
    '<div class="tw"><table class="res plist"><tr><th>Paper</th><th>Status</th><th>Mark</th><th></th></tr>'+rows+'</table></div></div>'+
    (hist.length?'<h2 class="pt">Earlier attempts</h2><div class="feature"><p>When you start a paper again, the old attempt is kept here as a score. Its answers are cleared.</p><table class="res"><tr><th>Paper</th><th>Finished</th><th>Assessed marks</th></tr>'+hist.map(function(h){return '<tr><td>'+esc(h.name)+'</td><td>'+fmtD(h.at)+'</td><td>'+h.T+' / '+h.M+(h.M?' ('+Math.round(100*h.T/h.M)+'%)':'')+(h.pending?' · '+h.pending+' marks unscored':'')+(h.provisionalParts?'<br><span class="note">'+provisionalMarksText(h)+'</span>':'')+'</td></tr>'}).join('')+'</table></div>':'')+'</div>');
}
/* What's wrong comes first, then your answer, then the sample answer. */
function ansPreview(m){
  var it=m.it,bs=BS(m.b.id),k=m.n+'.'+m.i,a=bs.ans[k],lost=m.s.m-m.s.g;
  if(AUTO[it.t])return '<div class="wrongbox"><h5><span>What&rsquo;s wrong</span><span class="wl">&minus;'+lost+' mark'+(lost===1?'':'s')+'</span></h5>'+closedCompare(it,a)+'</div>';
  var h=aiBlock(m.b,m.n,m.i,it,bs,k,a,m.s);
  if(lost&&h.indexOf('wrongbox')<0)h='<div class="wrongbox"><h5><span>What&rsquo;s wrong</span><span class="wl">&minus;'+lost+' mark'+(lost===1?'':'s')+'</span></h5><p>'+(isAns(it,a)?'There is no AI feedback for this answer. Compare your answer with the sample answer and the marking criteria below to find what is missing.':'You did not answer this part.')+'</p></div>'+h;
  h+='<p class="gh"><b>Your answer</b></p>';
  if(!isAns(it,a))h+='<p class="mut">You did not answer this part.</p>';
  else if(QT[it.t]&&QT[it.t].preview)h+=QT[it.t].preview(it,a);
  else if(it.t==='tx')h+='<div class="yans">'+a+'</div>';
  else if(it.t==='dr')h+='<pre class="yans">'+esc(xdText(a.e))+'</pre>';
  else h+='<pre class="yans">'+esc(String(a))+'</pre>';
  h+='<details class="xdd" open><summary>Sample answer</summary>'+(QT[it.t]&&QT[it.t].sample?QT[it.t].sample(it):it.t==='tx'||it.t==='dr'?'<div>'+it.model+'</div>':'<pre>'+esc(it.model)+'</pre>')+'</details>';
  return h;
}
/* My mistakes: a vertical list of every part that lost marks (left) and the selected one in the exam's own style (right). */
function mkKey(m){return m.b.id+'.'+m.n+'.'+m.i}
function mkFiltered(){
  return mistakeList().filter(function(m){
    return (!MF.bank||m.b.id===MF.bank)&&(!MF.topic||m.q.tp===MF.topic)&&(!MF.kind||itemClass(m.it)===MF.kind)});
}
function mkSelected(list){
  var hit=list.filter(function(m){return mkKey(m)===MF.sel})[0];
  return hit||list[0]||null;
}
function mkHref(m){return '#/mistakes/'+(MF.bank||'all')+'/'+mkKey(m)}
function mkTypeName(it){var c=itemClass(it);return c==='closed'?'Multiple choice':c==='written'?'Written':c==='code'?(it.t==='sq'?'SQL':it.t==='py'?'Python':'Pseudocode'):c==='diagram'?'Diagram':'Question'}
/* What a part asks, in one plain line for the list. */
function mkAsk(it){var t=String(plain(it.q)).replace(/\s+/g,' ').trim();return t.length>140?t.slice(0,137).replace(/\s+\S*$/,'')+'...':t}
function mistakesPage(){
  CUR={b:null,n:0};
  var all=mistakeList(),list=mkFiltered(),cur=mkSelected(list);
  var fixed=list.filter(function(m){return partCls(m.b,m.n,m.i)==='rtok'}).length;
  // Marks still lost: a part fixed by a retry no longer counts against the student.
  var lost=list.reduce(function(s,m){return s+(partCls(m.b,m.n,m.i)==='rtok'?0:m.s.m-m.s.g)},0);
  function sel(name,val,opts){return '<select data-mf="'+name+'" aria-label="'+name+'">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===val?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select>'}
  if(!all.length)return frame('My mistakes','<div class="pg"><h1 class="pt">My mistakes</h1><div class="feature"><p>No assessed mistakes to show yet. Finish a paper and submit it. Parts with confirmed or self-awarded mark shortfalls are listed here; provisional marks need review and are excluded.</p></div></div>');
  var filters='<div class="mk-filter">'+sel('bank',MF.bank,[['','All papers']].concat(BANKS.filter(function(b){return !b.hidden&&!b.archived}).map(function(b){return [b.id,b.name]})))+
    sel('topic',MF.topic,[['','All topics']].concat(mkTopics().map(function(t){return [t,t]})))+
    sel('kind',MF.kind,[['','All question types'],['closed','Multiple choice, dropdown and match'],['written','Written'],['code','Python, pseudocode and SQL'],['diagram','Diagram']])+'</div>';
  // One heading per paper, one sub-heading per run of the same question type and topic, and one line per part
  // that shows what the part asks, so the type and topic are not repeated on every row.
  var groups='',last='',lastSub='';
  list.forEach(function(m){
    if(m.b.id!==last){last=m.b.id;lastSub='';groups+='<div class="mk-grp"><span>'+esc(m.b.name)+'</span><span class="mk-n">'+list.filter(function(x){return x.b.id===m.b.id}).length+'</span></div>'}
    var sub=mkTypeName(m.it)+'|'+m.q.tp;
    if(sub!==lastSub){lastSub=sub;groups+='<div class="mk-sub"><b>'+esc(mkTypeName(m.it))+'</b><span>'+esc(m.q.tp)+'</span></div>'}
    var c=partCls(m.b,m.n,m.i)||'bad',fixedNow=c==='rtok',ask=mkAsk(m.it);
    groups+='<a class="mk-item'+(cur&&mkKey(m)===mkKey(cur)?' cur':'')+' '+c+'" href="'+mkHref(m)+'"'+(cur&&mkKey(m)===mkKey(cur)?' aria-current="true"':'')+'><span class="mk-q">Q'+m.n+(m.q.it.length>1?String.fromCharCode(97+m.i):'')+'</span><span class="mk-meta" title="'+esc(ask)+'">'+esc(ask)+'</span><span class="mk-sc"'+(fixedNow?' title="Exam mark '+m.s.g+' / '+m.s.m+', fixed by a retry"':'')+'>'+(fixedNow?m.s.m:m.s.g)+' / '+m.s.m+'</span></a>';
  });
  var side='<aside class="mk-side" aria-label="Your mistakes">'+filters+'<p class="mk-sum">'+list.length+' part'+(list.length===1?'':'s')+' &middot; '+lost+' mark'+(lost===1?'':'s')+' lost'+(fixed?' &middot; <span class="rtk">'+fixed+' fixed by retry</span>':'')+'</p><nav class="mk-list">'+(groups||'<p class="mut">Nothing matches these filters.</p>')+'</nav></aside>';
  return frame('My mistakes','<div class="mkpage">'+side+'<main class="ex mk-main" id="mkmain">'+(cur?mkDetail(list,cur):'<div class="feature"><p>Nothing matches these filters.</p></div>')+'</main></div>',{bar:true});
}
function mkDetail(list,m){
  var b=m.b,q=m.q,it=m.it,idx=list.indexOf(m);
  var st=(q.st||'')+(q.db&&typeof dbTables==='function'?dbTables(q.db):'');
  var mkLabel=(q.it.length>1&&!/marks?\)/.test(it.q))?' <span style="font-weight:700">('+(it.m===1?'1 mark':it.m+' marks')+')</span>':'';
  var crit=!AUTO[it.t]&&it.crit&&it.crit.length?'<details class="xdd"><summary>Marking criteria</summary>'+critList(it.crit)+'</details>':'';
  var prev=list[idx-1],next=list[idx+1],pc=partCls(b,m.n,m.i)||'bad';
  return '<div class="qwrap"><h2 class="qt">Question '+m.n+' ('+(q.m===1?'1 mark':q.m+' marks')+') <span class="mk-badge '+pc+'"'+(pc==='rtok'?' title="Exam mark '+m.s.g+' / '+m.s.m+', fixed by a retry"':'')+'>'+(pc==='rtok'?m.s.m:m.s.g)+' / '+m.s.m+'</span>'+(typeof rtButtonHTML==='function'?rtButtonHTML(b,m.n,m.i,'mk'):'')+'</h2>'+
    (typeof rtStatusHTML==='function'?rtStatusHTML(b,m.n,m.i):'')+
    '<p class="mut mk-where">'+esc(b.name)+' &middot; '+esc(q.tp)+'</p>'+
    '<div class="item">'+(st?'<div class="hoa-q st">'+st+'</div>':'')+
    '<div class="part"><p class="hoa-q">'+(it.lb?'<span class="plab">'+it.lb+'</span>':'')+it.q+mkLabel+'</p>'+
    '<div class="guide mk-guide">'+ansPreview(m)+crit+'</div>'+
    classSlot(b,m.n,m.i)+'</div></div>'+
    '<div class="acts"><a class="nb ol'+(prev?'':' dis')+'" '+(prev?'href="'+mkHref(prev)+'"':'aria-disabled="true"')+'>'+IC.left+'<span>Previous mistake</span></a>'+
    '<a class="nb'+(next?'':' dis')+'" '+(next?'href="'+mkHref(next)+'"':'aria-disabled="true"')+'><span>Next mistake</span>'+IC.right+'</a>'+
    '<a class="nb ol" href="#/'+b.id+'/review/'+m.n+'">Open in the full paper</a></div></div>';
}
function mistakesBind(){var m=mkSelected(mkFiltered());if(m)classEnsure(m.b)}
