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
    h+='<div class="pc-score"><b>'+t.T+' / '+t.markedM+'</b> <span class="mut">'+(t.markedM?'('+pct+'% of assessed marks)':'No marks assessed')+(t.P?' Â· '+t.P+' marks unscored':'')+'</span> <span class="pc-date">Submitted '+fmtD(u.doneAt)+'</span></div>'+
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
    (hist.length?'<h2 class="pt">Earlier attempts</h2><div class="feature"><p>When you start a paper again, the old attempt is kept here as a score. Its answers are cleared.</p><table class="res"><tr><th>Paper</th><th>Finished</th><th>Assessed marks</th></tr>'+hist.map(function(h){return '<tr><td>'+esc(h.name)+'</td><td>'+fmtD(h.at)+'</td><td>'+h.T+' / '+h.M+(h.M?' ('+Math.round(100*h.T/h.M)+'%)':'')+(h.pending?' Â· '+h.pending+' marks unscored':'')+(h.provisionalParts?'<br><span class="note">'+provisionalMarksText(h)+'</span>':'')+'</td></tr>'}).join('')+'</table></div>':'')+'</div>');
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
    if(it.t==='dd'||it.t==='gd'||it.t==='mt'||it.t==='tk'||it.t==='od'||it.t==='dm')return '<div class="yans">'+closedAnsHTML(it,ansVal)+'</div>';
    if(it.t==='ms')return '<div class="yans">Selected: <b>'+(Array.isArray(ansVal)?ansVal.map(function(j){return esc(it.o[j])}).join('</b>, <b>'):'')+'</b></div>';
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
  h+='<details class="xdd" open><summary>Sample answer</summary>'+(QT[it.t]&&QT[it.t].sample?QT[it.t].sample(it):it.t==='dd'||it.t==='gd'||it.t==='mt'||it.t==='tk'||it.t==='od'||it.t==='dm'?closedSampleHTML(it):it.t==='mc'?'<p>'+it.o[it.a]+'</p>':it.t==='ms'?'<ul>'+it.a.map(function(j){return '<li>'+it.o[j]+'</li>'}).join('')+'</ul>':it.t==='tx'||it.t==='dr'?modelHTML(it):'<pre>'+esc(it.model)+'</pre>')+'</details>';
  return h;
}
/* My mistakes: a vertical list of every part that lost marks (left) and the selected one in the exam's own style (right). */
function mkKey(m){return m.b.id+'.'+m.n+'.'+m.i}
function mkFiltered(){
  var raw=mistakeList().filter(function(m){
    return (!MF.bank||m.b.id===MF.bank)&&(!MF.topic||m.q.tp===MF.topic)&&(!MF.kind||itemClass(m.it)===MF.kind)});
  var byBank={},bankOrder=[];
  raw.forEach(function(m){
    if(!byBank[m.b.id]){byBank[m.b.id]={closed:[],open:[]};bankOrder.push(m.b.id)}
    if(itemClass(m.it)==='closed')byBank[m.b.id].closed.push(m);
    else byBank[m.b.id].open.push(m);
  });
  var out=[];
  bankOrder.forEach(function(bid){
    var grp=byBank[bid];
    grp.closed.sort(function(a,b){return (a.n-b.n)||(a.i-b.i)});
    grp.open.sort(function(a,b){return (a.n-b.n)||(a.i-b.i)});
    out=out.concat(grp.closed,grp.open);
  });
  return out;
}
function mkSelected(list){
  var hit=list.filter(function(m){return mkKey(m)===MF.sel})[0];
  return hit||list[0]||null;
}
function mkHref(m){return '#/mistakes/'+(MF.bank||'all')+'/'+mkKey(m)}
function mkTypeName(it){var c=itemClass(it);return c==='closed'?'Multiple choice':c==='written'?'Written':c==='code'?(it.t==='sq'?'SQL':it.t==='py'?'Python':it.t==='wb'?'HTML and CSS':'Pseudocode'):c==='diagram'?'Diagram':'Question'}
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
  // Group by paper, then by section: Multiple choice at the top, Written & code underneath.
  // Topics are neatly integrated inside each question box to keep the layout clean and compact.
  var byBank={},bankOrder=[];
  list.forEach(function(m){
    if(!byBank[m.b.id]){byBank[m.b.id]={b:m.b,closed:[],open:[]};bankOrder.push(m.b.id)}
    if(itemClass(m.it)==='closed')byBank[m.b.id].closed.push(m);
    else byBank[m.b.id].open.push(m);
  });
  var groups='';
  function renderItem(m){
    var c=partCls(m.b,m.n,m.i)||'bad',fixedNow=c==='rtok',ask=mkAsk(m.it);
    var qLab='Q'+m.n+(m.q.it.length>1?String.fromCharCode(97+m.i):'');
    var tp=m.q.tp||'';
    return '<a class="mk-item'+(cur&&mkKey(m)===mkKey(cur)?' cur':'')+' '+c+'" href="'+mkHref(m)+'"'+(cur&&mkKey(m)===mkKey(cur)?' aria-current="true"':'')+'>'+
      '<span class="mk-q">'+qLab+'</span>'+
      '<div class="mk-body">'+
        '<span class="mk-meta" title="'+esc(ask)+'">'+esc(ask)+'</span>'+
        '<span class="mk-tp" title="'+esc(tp)+'">'+esc(tp)+'</span>'+
      '</div>'+
      '<span class="mk-sc"'+(fixedNow?' title="Exam mark '+m.s.g+' / '+m.s.m+', fixed by a retry"':'')+'>'+(fixedNow?m.s.m:m.s.g)+' / '+m.s.m+'</span>'+
    '</a>';
  }
  bankOrder.forEach(function(bid){
    var grp=byBank[bid];
    var total=grp.closed.length+grp.open.length;
    groups+='<div class="mk-grp"><span>'+esc(grp.b.name)+'</span><span class="mk-n">'+total+'</span></div>';
    if(grp.closed.length){
      groups+='<div class="mk-sub mk-sec"><b>Multiple choice</b><span class="mk-sec-n">'+grp.closed.length+'</span></div>';
      groups+=grp.closed.map(renderItem).join('');
    }
    if(grp.open.length){
      groups+='<div class="mk-sub mk-sec"><b>Written &amp; code</b><span class="mk-sec-n">'+grp.open.length+'</span></div>';
      groups+=grp.open.map(renderItem).join('');
    }
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

/* Sub-topics are the organisers used in the NESA Software Engineering 11-12 (2022) syllabus, Year 12 content
   (see context/NESA - software_engineering_11_12_2022 (S6).pdf, pages 19 to 29). The content-point lists are the
   syllabus's own wording and appear as hover text. Questions carry no syllabus tag of their own, so a question is
   placed by matching its wording to the syllabus content points; the DoE 2026 Trial uses its official mapping grid. */
var SYLLABUS_AREAS=[
  {id:'SSA',name:'Secure Software Architecture',subs:[
    {name:'Designing software',pts:['benefits of developing secure software','fundamental software development steps to develop secure code','how the capabilities and experience of end users influence secure design']},
    {name:'Developing secure code',pts:['confidentiality, integrity, availability, authentication, authorisation, accountability','security features: data protection, security, privacy and regulatory compliance','cryptography and sandboxing (security by design)','privacy by design','vulnerabilities, hardening, breaches, business continuity, disaster recovery','code review, SAST, DAST, vulnerability assessment, penetration testing','input validation, sanitisation and error handling; safe APIs','memory, session and exception management','user action controls: broken authentication, XSS, CSRF, invalid redirects, race conditions','file attacks and side channel attacks']},
    {name:'Impact of safe and secure software development',pts:['benefits of collaboration','benefits to an enterprise of safe and secure development practices','social, ethical and legal issues: employment, data security, privacy, copyright, intellectual property, digital disruption']}]},
  {id:'PW',name:'Programming for the Web',subs:[
    {name:'Data transmission using the web',pts:['applications of web programming: interactive websites, e-commerce, PWAs','data packets, IP addresses, DNS','web protocols and ports: HTTP, HTTPS, TCP/IP, FTP, SFTP, SSL, TLS, SMTP, POP3, IMAP','securing the web: SSL certificates, encryption, keys, plain and cipher text, hash values, digital signatures','effect of big data on web architecture']},
    {name:'Designing web applications',pts:['role of the W3C: WAI, internationalisation, web security, privacy, machine-readable data','client-side and server-side programming; SQL and non-SQL databases','web browsers and developer tools; CSS','version control; code libraries; open-source software; load times; content management systems','back-end process for a web request; SQL queries; ORM compared to SQL','front-end and back-end collaboration; progressive web apps: font, colour, audio, video, navigation, accessibility and inclusivity']}]},
  {id:'SA',name:'Software Automation',subs:[
    {name:'Algorithms in machine learning',pts:['ML, DevOps, RPA and BPA','artificial intelligence and ML','supervised, unsupervised, semi-supervised and reinforcement learning','applications: data analysis and forecasting, virtual personal assistants, image recognition','decision trees and neural networks','linear regression, logistic regression, K-nearest neighbour']},
    {name:'Programming for automation',pts:['regression models using OOP: linear, polynomial, logistic','neural network models using OOP']},
    {name:'Significance and impact of ML and AI',pts:['impact of automation on the individual, society and the environment','patterns in human behaviour that influence ML and AI','human and dataset source bias']}]},
  {id:'SEP',name:'Software Engineering Project',subs:[
    {name:'Identifying and defining',pts:['requirements of a problem','tools to develop ideas and generate solutions','implementation methods: direct, phased, parallel, pilot']},
    {name:'Research and planning',pts:['Waterfall, Agile and WAgile approaches','project management: Gantt charts and collaboration tools','social, ethical and communication issues','quality assurance','modelling tools','back-end engineering']},
    {name:'Producing and implementing',pts:['design, construct and implement a solution','develop, construct and document algorithms','allocate resources','programmed data backup and version control','strategies to respond to difficulties','prototype and user interface design']},
    {name:'Testing and evaluating',pts:['methodologies to test and evaluate code','code optimisation','analyse and respond to feedback','test plan, path and boundary testing, comparing actual and expected output']}]}
];
var SYLLABUS_RULES={
  'Secure Software Architecture':[[2,/ramification|social|ethic|legal|law\b|employment|copyright|intellectual property|digital disruption|collaborat|enterprise|productivity|points? of view|delegat/i],[0,/benefits? of (developing )?secure|development steps|life ?cycle|requirements definition|specifications|end users?|experience of|capabilit|waterfall|installation|maintenance/i]],
  'Programming for the Web':[[0,/packet|ip address|ipv4|dns|domain name|protocol|tcp|ftp|smtp|pop3|imap|https|ssl|tls|certificate|cipher|plain text|hash|digital signature|encryption|big data|data mining|metadata|streaming|e-commerce/i]],
  'Software Automation':[[2,/impact|society|environment|ethic|social|bias|disabilit|employment|worker|economy|wealth|human behaviour|cultural|belief|stress|waste/i],[1,/\boop\b|object.oriented|polynomial|neural network model/i]],
  'Software Engineering Project':[[3,/test plan|test data|testing|desk check|debug|boundary|optimi[sz]|expected output|evaluate the effectiveness/i],[1,/waterfall|agile|wagile|gantt|project management|collaboration tool|communicat|negotiat|stakeholder|quality assur|complian|modelling tool|data flow|context diagram|structure chart|back-end engineering/i],[0,/requirement|feasib|data dictionar|data type|brainstorm|storyboard|implementation method|direct|phased|parallel|pilot|cutover/i]]
};
var SYLLABUS_DEFAULT={'Secure Software Architecture':1,'Programming for the Web':1,'Software Automation':0,'Software Engineering Project':2};
function subtopicForQ(tp,q,b,n){
  var area=SYLLABUS_AREAS.filter(function(a){return a.name===tp})[0];
  if(!area)return 0;
  var g=b&&typeof MARKING==='object'&&MARKING.doe2026&&b.id==='9'&&MARKING.doe2026.grid?(MARKING.doe2026.grid[String(n)]||MARKING.doe2026.grid[n+'a+'+n+'b']):null;
  if(g)for(var k=0;k<area.subs.length;k++)if(area.subs[k].name.toLowerCase()===String(g[1]).toLowerCase())return k;
  var text=(q.st+' '+q.it.map(function(i){return i.q+' '+(i.model||'')}).join(' ')).toLowerCase(),rules=SYLLABUS_RULES[tp]||[];
  for(var r=0;r<rules.length;r++)if(rules[r][1].test(text))return rules[r][0];
  return SYLLABUS_DEFAULT[tp]||0;
}

function syllabusMasteryData(){
  var areas=SYLLABUS_AREAS.map(function(a){
    return {id:a.id,name:a.name,desc:a.subs.map(function(s){return s.name}).join(' · '),
      subs:a.subs.map(function(s){return {name:s.name,pts:s.pts,m:0,g:0,rg:0,lost:0,count:0}})};
  });
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
      var sIdx=subtopicForQ(q.tp,q,b,n);
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
      return '<div class="sm-sub-row"><span class="sm-sub-name" title="'+esc(sub.name+(sub.pts?': '+sub.pts.join('; '):''))+'">'+esc(sub.name)+'</span><span class="sm-sub-stat">'+stat+'</span><span class="sm-pill '+sb.cls+'">'+(sub.pct!=null?sub.pct+'%':'-')+'</span></div>';
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
      '<div><h1 class="pt" style="margin:0 0 4px">Syllabus Outcome Mastery</h1><p class="mut" style="margin:0">Live mastery across all 4 NESA HSC Software Engineering focus areas, broken down by the organisers used in the NESA syllabus (Year 12 content).</p></div>'+
      (d.grandM?'<div style="font-size:1.1em;font-weight:700">Overall: <span class="sm-badge '+d.grandBand.cls+'" style="font-size:.9em">'+d.grandPct+'% &middot; '+d.grandBand.label+'</span></div>':'')+
    '</div>'+
    recHTML+
    '<div class="sm-grid">'+cardsHTML+'</div>'+
  '</div>';

  return frame('Syllabus Mastery',main,{bar:true});
}
