/* ---------- Papers, My mistakes ---------- */
var MF={bank:'',topic:'',kind:'',sel:''};
function fmtD(t){if(!t)return '';var d=new Date(t);return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function aiState(b){
  var bs=BS(b.id);if(!bs.done)return '';
  var todo=aiTodo(b).length,errKeys=Object.keys(bs.aiErr||{}).filter(function(k){return bs.aiErr[k]}),errs=errKeys.length;
  return errs?'AI marking incomplete'+(errs>1?' ('+errs+' answers)':'')+'<br><span class="note">Reason: '+esc(String(bs.aiErr[errKeys[0]]).slice(0,240))+'</span>':todo?(S.tok?'Not AI marked yet':'Sign in for AI marking'):aiReviews(b)?'Some answers could not be marked':aiProvisionals(b)?'Some marks are unconfirmed':'AI marking finished';
}
/* Whole-paper marking from the Papers page: a paper submitted while signed out, or whose marking never finished, can be marked here without opening it. */
function paperRunBox(b,run){return '<div class="aib" data-airun="'+esc(b.id)+'" role="status"><b>Marking: '+(run.done||0)+' of '+(run.total||0)+' answers</b>'+aiRunBarHTML(run)+aiActHTML(b,run,b.id)+'</div>'}
function paperMarkBtns(b,run){
  if(!S.tok)return '<a class="nb sm ol" href="#/account">Sign in to AI mark</a>';
  var todo=aiTodo(b).length,dis=run?' disabled':'',h='';
  if(todo)h+='<button type="button" class="nb sm ol" data-act="paperremark" data-id="'+esc(b.id)+'" data-only="missing"'+dis+'>Mark '+todo+' unmarked answer'+(todo>1?'s':'')+'</button>';
  var unc=aiReviews(b)+aiProvisionals(b);
  if(unc&&!run)h+='<button type="button" class="nb sm ol" data-act="paperremark" data-id="'+esc(b.id)+'" data-only="unconfirmed">Mark '+unc+' unconfirmed answer'+(unc>1?'s':'')+' again</button>';
  return h+'<button type="button" class="nb sm ol" data-act="paperremark" data-id="'+esc(b.id)+'"'+dis+'>'+(run?'Marking...':'Re-mark entire paper')+'</button>';
}
/* Papers list: one card per paper with a single main button; everything else sits in a More menu. Hidden papers are a per-browser choice (S.hiddenPapers). */
var PF={f:'all',hid:false};
function paperHidden(id){return !!(S.hiddenPapers&&S.hiddenPapers[id])}
function paperKind(b){var u=S.u[b.id];return u?(u.done?'done':(u.start?'prog':'new')):'new'}
function paperCard(b,hiddenView){
  var u=S.u[b.id],k=paperKind(b),id=esc(b.id),run=null,chips={done:'Submitted',prog:'In progress','new':'Not started'};
  var h='<div class="pcard pk-'+k+'"><div class="pc-top"><div class="pc-main"><div class="pc-name">'+esc(b.name)+'</div><div class="pc-sub">'+esc(b.sub)+'</div></div><span class="pc-chip pk-'+k+'">'+chips[k]+'</span></div>';
  var primary,menu='';
  if(k==='done'){
    var t=totals(b),pct=t.markedM?Math.round(100*t.T/t.markedM):null;
    run=aiRunCurrent(b,AIRUN[b.id])?AIRUN[b.id]:null;
    h+='<div class="pc-score"><b>'+t.T+' / '+t.markedM+'</b> <span class="mut">'+(t.markedM?'('+pct+'% of assessed marks)':'No marks assessed')+(t.P?' · '+t.P+' marks unscored':'')+'</span> <span class="pc-date">Submitted '+fmtD(u.doneAt)+'</span></div>'+
      (t.markedM?'<div class="pc-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></div>':'')+
      (t.provisionalParts?'<div class="note">'+provisionalMarksText(t)+'</div>':'')+
      (run?paperRunBox(b,run):'<div class="pc-ai">'+aiState(b)+'</div>');
    primary='<a class="nb sm" href="#/'+id+'/review/1">View paper and marking</a>';
    menu='<a class="pm-item" href="#/'+id+'/results">Results</a><a class="pm-item" href="#/mistakes/'+id+'">Mistakes</a><div class="pm-sep"></div>'+paperMarkBtns(b,run);
  }else{
    primary='<a class="nb sm" href="#/'+id+'">'+(k==='prog'?'Continue':'Open')+'</a>';
  }
  if(k!=='new'){menu+='<button type="button" class="pm-item pm-danger" data-act="pdelete" data-id="'+id+'"'+(run?' disabled':'')+'>Delete attempt</button>'}
  if(hiddenView){h+='<div class="pc-acts">'+primary+'<button type="button" class="nb sm ol" data-act="phide" data-id="'+id+'" data-v="0">Show in list</button></div></div>';return h}
  menu+='<button type="button" class="pm-item" data-act="phide" data-id="'+id+'" data-v="1">Hide paper</button>';
  return h+'<div class="pc-acts">'+primary+'<details class="pmenu"><summary class="nb sm ol">More</summary><div class="pm-list">'+menu+'</div></details></div></div>';
}
function papersPage(){
  CUR={b:null,n:0};
  var visible=BANKS.filter(function(b){return !b.hidden});
  var live=visible.filter(function(b){return !paperHidden(b.id)}),nHid=visible.length-live.length;
  if(PF.hid&&!nHid)PF.hid=false;
  var shown=(PF.hid?visible.filter(function(b){return paperHidden(b.id)}):live).filter(function(b){return PF.hid||PF.f==='all'||paperKind(b)===PF.f});
  function cnt(f){return live.filter(function(b){return f==='all'||paperKind(b)===f}).length}
  var chipDefs=[['all','All'],['prog','In progress'],['done','Submitted'],['new','Not started']];
  var filters='<div class="pf-row" role="group" aria-label="Filter papers">'+chipDefs.map(function(c){
    return '<button type="button" class="pf-chip'+(!PF.hid&&PF.f===c[0]?' on':'')+'" data-act="pfilter" data-f="'+c[0]+'" aria-pressed="'+(!PF.hid&&PF.f===c[0])+'">'+c[1]+' <span>'+cnt(c[0])+'</span></button>';
  }).join('')+(nHid?'<button type="button" class="pf-chip pf-hid'+(PF.hid?' on':'')+'" data-act="pfilter" data-f="hidden" aria-pressed="'+PF.hid+'">Hidden <span>'+nHid+'</span></button>':'')+'</div>';
  var rows=shown.map(function(b){return paperCard(b,PF.hid)}).join('');
  var hist=S.hist.filter(function(h){return !BANKS.some(function(b){return b.id===h.id&&b.hidden})}).sort(function(a,b){return b.at-a.at});
  var done=visible.filter(function(b){return S.u[b.id]&&S.u[b.id].done}).length;
  var md=typeof syllabusMasteryData==='function'?syllabusMasteryData():null;
  var stripHTML=md?'<div class="sm-strip">'+md.areas.map(function(a){
    return '<a href="#/mastery" class="sm-strip-item" style="text-decoration:none;color:inherit" title="'+esc(a.name)+'"><b>'+esc(a.id)+':</b> <span style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(a.name)+'</span><span class="sm-pill '+a.band.cls+'">'+(a.pct!=null?a.pct+'%':'-')+'</span></a>';
  }).join('')+'</div>':'';
  return frame('Papers','<div class="pg"><div class="ph-row"><h1 class="pt">All papers</h1><div class="ph-links"><a class="nb sm ol" href="#/class">Class answers</a><a class="nb sm ol" href="#/mastery">Outcome Mastery &rarr;</a></div></div><div class="feature"><p class="pl-sum"><b>'+done+' of '+visible.length+' papers finished.</b> Open a finished paper to see your answers beside the AI marking, the sample answer and the criteria.</p>'+
    stripHTML+filters+
    '<div class="plist">'+(rows||'<p class="mut">'+(PF.hid?'No hidden papers.':'No papers match this filter.')+'</p>')+'</div>'+
    (PF.hid?'<p class="mut">Hidden papers stay on this browser only. Use Show in list to bring one back.</p>':'')+'</div>'+
    (hist.length?'<h2 class="pt">Earlier attempts</h2><div class="feature"><p>When you start a paper again, the old attempt is kept here as a score. Its answers are cleared.</p><table class="res"><tr><th>Paper</th><th>Finished</th><th>Assessed marks</th></tr>'+hist.map(function(h){return '<tr><td>'+esc(h.name)+'</td><td>'+fmtD(h.at)+'</td><td>'+h.T+' / '+h.M+(h.M?' ('+Math.round(100*h.T/h.M)+'%)':'')+(h.pending?' · '+h.pending+' marks unscored':'')+(h.provisionalParts?'<br><span class="note">'+provisionalMarksText(h)+'</span>':'')+'</td></tr>'}).join('')+'</table></div>':'')+'</div>');
}
/* What's wrong comes first, then your answer, then the sample answer. */
function ansPreview(m){
  var it=m.it,bs=BS(m.b.id),k=m.n+'.'+m.i,a=bs.ans[k],lost=m.s.m-m.s.g;
  var r=typeof rtRes==='function'?rtRes(m.b,m.n,m.i):null;
  var rta=typeof rtAnswer==='function'?rtAnswer(m.b,m.n,m.i):undefined;
  var isFixed=!!(r&&r.full),hasRta=isAns(it,rta);
  var h='';
  if(isFixed){
    h+='<div class="wrongbox rtok" style="background:#fff6d1;border:1px solid #e6c34d;border-left:6px solid #f2c200"><h5 style="color:#2b2100"><span>Fixed on retry</span><span class="wl" style="background:#f2c200;color:#2b2100">Full marks ('+r.m+' / '+r.m+')</span></h5><p>You corrected this mistake on retry'+(r.at&&typeof fmtD==='function'?' ('+fmtD(r.at)+')':'')+'. Your exam score remains '+m.s.g+' / '+m.s.m+'.</p></div>';
  }else if(r){
    h+='<div class="wrongbox"><h5><span>Retry in progress</span><span class="wl">'+(r.g==null?'Pending':r.g+' / '+r.m)+'</span></h5><p>Last retry earned '+(r.g==null?'no mark yet':r.g+' of '+r.m+' marks')+'. Exam mark: '+m.s.g+' / '+m.s.m+'. Keep trying to earn full marks.</p></div>';
  }else if(hasRta){
    h+='<div class="wrongbox" style="background:#f4f7fb;border:1px solid #c4d1e2;border-left:6px solid #002664"><h5 style="color:#002664"><span>Retry draft saved</span><span class="wl" style="background:#002664;color:#fff">Unchecked</span></h5><p>You have a saved retry draft. Click &ldquo;Retry&rdquo; above to test or check your answer.</p></div>';
  }else if(AUTO[it.t]){
    h+='<div class="wrongbox"><h5><span>What&rsquo;s wrong</span><span class="wl">&minus;'+lost+' mark'+(lost===1?'':'s')+'</span></h5>'+closedCompare(it,a)+'</div>';
  }else{
    var blk=aiBlock(m.b,m.n,m.i,it,bs,k,a,m.s);
    if(lost&&blk.indexOf('wrongbox')<0)blk='<div class="wrongbox"><h5><span>What&rsquo;s wrong</span><span class="wl">&minus;'+lost+' mark'+(lost===1?'':'s')+'</span></h5><p>'+(isAns(it,a)?'There is no AI feedback for this answer. Compare your answer with the sample answer and the marking criteria below to find what is missing.':'You did not answer this part.')+'</p></div>'+blk;
    h+=blk;
  }

  function renderAns(ansVal,isRetry){
    if(!isAns(it,ansVal))return '<p class="mut">You did not answer this part'+(isRetry?' on retry':' in the exam')+'.</p>';
    if(QT[it.t]&&QT[it.t].preview)return QT[it.t].preview(it,ansVal);
    if(it.t==='tx')return '<div class="yans">'+ansVal+'</div>';
    if(it.t==='dr')return '<pre class="yans">'+esc(xdText(ansVal&&ansVal.e))+'</pre>';
    if(it.t==='mc')return '<div class="yans">Selected: <b>'+esc(it.o[ansVal]||ansVal)+'</b></div>';
    return '<pre class="yans">'+esc(String(ansVal))+'</pre>';
  }

  if(hasRta){
    h+='<p class="gh"><b>'+(isFixed?'Your retried answer (fixed &middot; '+r.m+' / '+r.m+')':'Your latest retry answer')+'</b></p>'+renderAns(rta,true);
    h+='<details class="xdd"><summary>Original exam answer ('+m.s.g+' / '+m.s.m+')</summary>'+renderAns(a,false)+'</details>';
  }else{
    h+='<p class="gh"><b>Your answer</b></p>'+renderAns(a,false);
  }
  h+='<details class="xdd" open><summary>Sample answer</summary>'+(QT[it.t]&&QT[it.t].sample?QT[it.t].sample(it):it.t==='tx'||it.t==='dr'?modelHTML(it):'<pre>'+esc(it.model)+'</pre>')+'</details>';
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
  if(!all.length)return frame('My mistakes','<div class="pg"><h1 class="pt">My mistakes</h1><div class="feature"><p>No assessed mistakes to show yet. Finish a paper and submit it. Parts with confirmed or self-awarded mark shortfalls are listed here; unconfirmed marks are excluded.</p></div></div>');
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

/* ---------- Syllabus Outcome Mastery Heatmap ---------- */
function masteryBand(pct){
  if(pct==null)return {cls:'none',label:'Untested',desc:'No assessed questions yet'};
  if(pct>=85)return {cls:'b6',label:'Band 6 (Exemplary)',desc:'Comprehensive syllabus mastery'};
  if(pct>=70)return {cls:'b5',label:'Band 5 (Proficient)',desc:'Strong grasp across outcomes'};
  if(pct>=50)return {cls:'b4',label:'Band 4 (Developing)',desc:'Developing understanding'};
  return {cls:'b2',label:'Band 2-3 (Needs Practice)',desc:'Prioritise revision & retries'};
}

function subtopicForQ(tp,q){
  var text=(q.st+' '+q.it.map(function(i){return i.q+' '+(i.model||'')}).join(' ')).toLowerCase();
  if(tp==='Secure Software Architecture'){
    if(/xss|csrf|sql injection|vulnerab|attack|exploit|race condition|side.channel|malware|buffer overflow/i.test(text))return 1;
    if(/validat|saniti|defens|input|error handling|sandbox|boundary/i.test(text))return 2;
    if(/sast|dast|pen test|penetration|audit|review|resilien|disaster|backup|continuity|recovery/i.test(text))return 3;
    return 0; // Security Concepts & CIA Triad
  }
  if(tp==='Programming for the Web'){
    if(q.db||/sql|table|database|query|select|join|group by|primary key|foreign key/i.test(text))return 1;
    if(/ssl|tls|cert|encrypt|cipher|hash|digital signature|public key|private key/i.test(text))return 3;
    if(/protocol|packet|dns|http|https|ip address|tcp|port|router|bandwidth|latency/i.test(text))return 0;
    return 2; // Front-End, UI/UX & Standards
  }
  if(tp==='Software Automation'){
    if(/regress|linear|logistic|knn|nearest|scatter|slope|gradient|equation|numeric/i.test(text))return 1;
    if(/devops|rpa|bpa|ci\/cd|pipeline|automat|sensor|robot|stream/i.test(text))return 2;
    if(/bias|ethical|society|social|legal|fairness|workplace|displacement|disability/i.test(text))return 3;
    return 0; // AI vs ML Models & Neural Networks
  }
  if(tp==='Software Engineering Project'){
    if(/agile|waterfall|scrum|sprint|kanban|wagile|iterat/i.test(text))return 0;
    if(/direct|phased|parallel|pilot|cutover|deployment|installation/i.test(text))return 2;
    if(/gantt|feasib|cost|schedule|budget|time|requirement|dictionary|scope/i.test(text))return 1;
    return 3; // Quality Assurance, Testing & Ethics
  }
  return 0;
}

function syllabusMasteryData(){
  var areas=[
    {
      id:'SSA',
      name:'Secure Software Architecture',
      desc:'Security by design, CIA triad, vulnerabilities, defensive coding & resilience',
      subs:[
        {name:'Security Concepts & CIA Triad',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Vulnerabilities & Attacks',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Defensive Programming',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Resilience & Security Testing',m:0,g:0,rg:0,lost:0,count:0}
      ]
    },
    {
      id:'PW',
      name:'Programming for the Web',
      desc:'Web protocols, relational databases & SQL, client/server systems, UI/UX & standards',
      subs:[
        {name:'Web Architecture & Protocols',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Databases & SQL',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Front-End, UI/UX & Standards',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Web Security & Encryption',m:0,g:0,rg:0,lost:0,count:0}
      ]
    },
    {
      id:'SA',
      name:'Software Automation',
      desc:'AI vs ML, regression models, neural networks, DevOps, bias & ethics',
      subs:[
        {name:'AI vs ML Models & Neural Networks',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Algorithms & Regression',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Automation Systems & DevOps',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Ethics, Bias & Societal Impacts',m:0,g:0,rg:0,lost:0,count:0}
      ]
    },
    {
      id:'SEP',
      name:'Software Engineering Project',
      desc:'Agile & Waterfall, requirements analysis, cutover methods, QA & project tools',
      subs:[
        {name:'Project Methodologies',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Requirements, Planning & Scheduling',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Implementation & Cutover Methods',m:0,g:0,rg:0,lost:0,count:0},
        {name:'Quality Assurance, Testing & Ethics',m:0,g:0,rg:0,lost:0,count:0}
      ]
    }
  ];

  var grandM=0,grandG=0,grandRg=0,grandLost=0,grandCount=0;
  var visible=BANKS.filter(function(b){return !b.hidden&&!b.archived});

  visible.forEach(function(b){
    var u=S.u[b.id];
    if(!u)return;
    b.qs.forEach(function(q,qi){
      var n=qi+1;
      var aIdx=-1;
      for(var ai=0;ai<areas.length;ai++){
        if(areas[ai].name===q.tp){aIdx=ai;break}
      }
      if(aIdx<0)return;
      var sIdx=subtopicForQ(q.tp,q);
      var sub=areas[aIdx].subs[sIdx];

      q.it.forEach(function(it,i){
        var sc=score(b,n,i);
        if(!sc.set||sc.src==='provisional')return;
        var m=sc.m||0,g=Math.min(m,Math.max(0,sc.g||0));
        var r=typeof rtRes==='function'?rtRes(b,n,i):null;
        var rg=0;
        if(r){
          if(r.full)rg=Math.max(0,m-g);
          else if(r.g!=null&&r.g>g)rg=Math.min(m-g,r.g-g);
        }
        var lost=Math.max(0,m-g-rg);
        sub.m+=m;sub.g+=g;sub.rg+=rg;sub.lost+=lost;sub.count++;
        grandM+=m;grandG+=g;grandRg+=rg;grandLost+=lost;grandCount++;
      });
    });
  });

  areas.forEach(function(area){
    var tm=0,tg=0,trg=0,tlost=0,tc=0;
    area.subs.forEach(function(sub){
      tm+=sub.m;tg+=sub.g;trg+=sub.rg;tlost+=sub.lost;tc+=sub.count;
      var eff=sub.g+sub.rg;
      sub.pct=sub.m?Math.round(100*eff/sub.m):null;
      sub.band=masteryBand(sub.pct);
    });
    area.m=tm;area.g=tg;area.rg=trg;area.lost=tlost;area.count=tc;
    var aEff=tg+trg;
    area.pct=tm?Math.round(100*aEff/tm):null;
    area.examPct=tm?Math.round(100*tg/tm):null;
    area.band=masteryBand(area.pct);
  });

  var grandEff=grandG+grandRg;
  var grandPct=grandM?Math.round(100*grandEff/grandM):null;

  return {
    areas:areas,
    grandM:grandM,
    grandG:grandG,
    grandRg:grandRg,
    grandLost:grandLost,
    grandPct:grandPct,
    grandBand:masteryBand(grandPct)
  };
}

function masteryPage(){
  CUR={b:null,n:0};
  var d=syllabusMasteryData();

  var assessed=d.areas.filter(function(a){return a.m>0});
  assessed.sort(function(a,b){return (a.pct||0)-(b.pct||0)});
  var weakest=assessed.length?assessed[0]:null;

  var recHTML='';
  if(!assessed.length){
    recHTML='<div class="sm-rec"><div><div class="sm-rec-title">No completed examinations yet</div><p class="sm-rec-sub">Complete and submit practice exams to generate your live Syllabus Outcome Mastery Heatmap.</p></div><a class="nb" href="#/papers">Start a paper</a></div>';
  }else if(weakest&&weakest.pct<85){
    recHTML='<div class="sm-rec"><div><div class="sm-rec-title">Focus revision: '+esc(weakest.name)+' ('+weakest.pct+'%)</div><p class="sm-rec-sub">This focus area has the greatest potential for score improvement. Review explanations and retry shortfalls to move toward Band 6.</p></div><div style="display:flex;gap:8px"><a class="nb sm" href="#/mistakes/all">Retry mistakes</a><a class="nb sm ol" href="#/papers">Browse papers</a></div></div>';
  }else{
    recHTML='<div class="sm-rec" style="border-left-color:#008a38"><div><div class="sm-rec-title" style="color:#008a38">Outstanding performance across all syllabus focus areas</div><p class="sm-rec-sub">You are tracking in the top band across assessed outcomes. Maintain exam readiness with timed trials.</p></div><a class="nb sm" href="#/papers">Sit another paper</a></div>';
  }

  var cardsHTML=d.areas.map(function(area){
    var b=area.band;
    var dPct=area.m?Math.round(100*area.g/area.m):0;
    var rPct=area.m?Math.round(100*area.rg/area.m):0;
    var lPct=area.m?Math.max(0,100-dPct-rPct):0;

    var subsHTML=area.subs.map(function(sub){
      var sb=sub.band;
      var stat=sub.m?(sub.g+sub.rg)+' / '+sub.m+' marks':'Untested';
      return '<div class="sm-sub-row"><span class="sm-sub-name" title="'+esc(sub.name)+'">'+esc(sub.name)+'</span><span class="sm-sub-stat">'+stat+'</span><span class="sm-pill '+sb.cls+'">'+(sub.pct!=null?sub.pct+'%':'-')+'</span></div>';
    }).join('');

    return '<div class="sm-card">'+
      '<div class="sm-head"><div><h3 class="sm-title">'+esc(area.name)+'</h3><p class="sm-desc">'+esc(area.desc)+'</p></div><span class="sm-badge '+b.cls+'">'+b.label+'</span></div>'+
      '<div class="sm-bar-wrap"><div class="sm-bar">'+
        (dPct?'<div class="sm-bar-direct" style="width:'+dPct+'%" title="Exam marks: '+area.g+'"></div>':'')+
        (rPct?'<div class="sm-bar-retry" style="width:'+rPct+'%" title="Recovered retry marks: '+area.rg+'"></div>':'')+
        (lPct?'<div class="sm-bar-lost" style="width:'+lPct+'%" title="Marks lost: '+area.lost+'"></div>':'')+
      '</div></div>'+
      '<div class="sm-stats"><span>Earned: <b>'+(area.g+area.rg)+'</b> / '+area.m+' marks'+(area.rg?' <span style="color:#b45309">(+'+area.rg+' retry)</span>':'')+'</span><span><b>'+(area.pct!=null?area.pct+'%':'Untested')+'</b></span></div>'+
      '<div class="sm-subs">'+subsHTML+'</div>'+
      '<div class="sm-card-acts"><a class="nb sm ol" href="#/mistakes/all" style="width:100%;text-align:center">Review mistakes in '+esc(area.id)+'</a></div>'+
    '</div>';
  }).join('');

  var main='<div class="sm-page">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">'+
      '<div><h1 class="pt" style="margin:0 0 4px">Syllabus Outcome Mastery</h1><p class="mut" style="margin:0">Live mastery across all 4 NESA HSC Software Engineering focus areas and 16 key outcome subtopics.</p></div>'+
      (d.grandM?'<div style="font-size:1.1em;font-weight:700">Overall: <span class="sm-badge '+d.grandBand.cls+'" style="font-size:.9em">'+d.grandPct+'% &middot; '+d.grandBand.label+'</span></div>':'')+
    '</div>'+
    recHTML+
    '<div class="sm-grid">'+cardsHTML+'</div>'+
  '</div>';

  return frame('Syllabus Mastery',main,{bar:true});
}
