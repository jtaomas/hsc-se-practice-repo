/* ---------- Papers, My mistakes ---------- */
var MF={bank:'',topic:'',kind:''};
function fmtD(t){if(!t)return '';var d=new Date(t);return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function aiState(b){
  var bs=BS(b.id);if(!bs.done)return '';
  var todo=aiTodo(b).length,errs=Object.keys(bs.aiErr||{}).filter(function(k){return bs.aiErr[k]}).length;
  return errs?'AI marking incomplete':todo?(S.tok?'Not AI marked yet':'Sign in for AI marking'):aiReviews(b)?'Needs review':'AI marking finished';
}
function papersPage(){
  CUR={b:null,n:0};
  var visible=BANKS.filter(function(b){return !b.hidden});
  var rows=visible.map(function(b){
    var u=S.u[b.id],st=u?(u.done?'Submitted':(u.start?'In progress':'Not started')):'Not started',sc='',acts='<a class="nb sm" href="#/'+b.id+'">'+(u&&u.start&&!u.done?'Continue':'Open')+'</a>';
    if(u&&u.done){var t=totals(b);sc='<b>'+t.T+' / '+t.markedM+'</b> <span class="mut">'+(t.markedM?'('+Math.round(100*t.T/t.markedM)+'% of assessed marks)':'No marks assessed')+(t.P?' · '+t.P+' marks unscored':'')+'</span>';
      acts='<a class="nb sm" href="#/'+b.id+'/review/1">View paper and marking</a><a class="nb sm ol" href="#/'+b.id+'/results">Results</a><a class="nb sm ol" href="#/mistakes/'+b.id+'">Mistakes</a>'}
    return '<tr><td><b>'+esc(b.name)+'</b><div class="mut">'+esc(b.sub)+'</div></td><td>'+st+(u&&u.done?'<div class="mut">'+fmtD(u.doneAt)+'</div>':'')+'</td><td>'+sc+(u&&u.done?'<div class="mut">'+aiState(b)+'</div>':'')+'</td><td class="ra">'+acts+'</td></tr>';
  }).join('');
  var hist=S.hist.filter(function(h){return !BANKS.some(function(b){return b.id===h.id&&b.hidden})}).sort(function(a,b){return b.at-a.at});
  var done=visible.filter(function(b){return S.u[b.id]&&S.u[b.id].done}).length;
  return frame('Papers','<div class="pg"><h1 class="pt">All papers</h1><div class="feature"><p>Open a finished paper to see your answers beside the AI marking, the sample answer and the criteria. '+done+' of '+visible.length+' papers finished.</p><p><a class="nb ol" href="#/class">Class answers</a></p>'+
    '<div class="tw"><table class="res plist"><tr><th>Paper</th><th>Status</th><th>Mark</th><th></th></tr>'+rows+'</table></div></div>'+
    (hist.length?'<h2 class="pt">Earlier attempts</h2><div class="feature"><p>When you start a paper again, the old attempt is kept here as a score. Its answers are cleared.</p><table class="res"><tr><th>Paper</th><th>Finished</th><th>Assessed marks</th></tr>'+hist.map(function(h){return '<tr><td>'+esc(h.name)+'</td><td>'+fmtD(h.at)+'</td><td>'+h.T+' / '+h.M+(h.M?' ('+Math.round(100*h.T/h.M)+'%)':'')+(h.pending?' · '+h.pending+' marks unscored':'')+'</td></tr>'}).join('')+'</table></div>':'')+'</div>');
}
function ansPreview(m){
  var it=m.it,bs=BS(m.b.id),k=m.n+'.'+m.i,a=bs.ans[k];
  if(AUTO[it.t])return closedCompare(it,a);
  var h='';
  if(!isAns(it,a))h+='<p class="mut">You did not answer this part.</p>';
  else if(QT[it.t]&&QT[it.t].preview)h+=QT[it.t].preview(it,a);
  else if(it.t==='tx')h+='<div class="yans">'+a+'</div>';
  else if(it.t==='dr')h+='<pre class="yans">'+esc(xdText(a.e))+'</pre>';
  else h+='<pre class="yans">'+esc(String(a))+'</pre>';
  h+=aiBlock(m.b,m.n,m.i,it,bs,k,a,m.s);
  h+='<details class="xdd"><summary>Sample answer</summary>'+(QT[it.t]&&QT[it.t].sample?QT[it.t].sample(it):it.t==='tx'||it.t==='dr'?'<div>'+it.model+'</div>':'<pre>'+esc(it.model)+'</pre>')+'</details>';
  return h;
}
function mistakesPage(){
  CUR={b:null,n:0};
  var all=mistakeList(),list=all.filter(function(m){
    return (!MF.bank||m.b.id===MF.bank)&&(!MF.topic||m.q.tp===MF.topic)&&(!MF.kind||itemClass(m.it)===MF.kind)});
  var lost=list.reduce(function(s,m){return s+(m.s.m-m.s.g)},0);
  function sel(name,val,opts){return '<select data-mf="'+name+'" aria-label="'+name+'">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===val?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select>'}
  var f='<div class="mfilter">'+sel('bank',MF.bank,[['','All papers']].concat(BANKS.filter(function(b){return !b.hidden}).map(function(b){return [b.id,b.name]})))+
    sel('topic',MF.topic,[['','All topics']].concat(mkTopics().map(function(t){return [t,t]})))+
    sel('kind',MF.kind,[['','All question types'],['closed','Multiple choice, dropdown and match'],['written','Written'],['code','Python, pseudocode and SQL'],['diagram','Diagram']])+'</div>';
  var cards=list.map(function(m){
    return '<article class="mcard"><header><b>'+esc(m.b.name)+' &middot; Question '+m.n+(m.it.lb?' '+plain(m.it.lb):'')+'</b><span class="pill '+(m.s.g===0?'bad':'part')+'">'+m.s.g+' / '+m.s.m+'</span></header>'+
      '<div class="mut">'+esc(m.q.tp)+'</div><div class="mq">'+m.it.q+'</div>'+ansPreview(m)+
      '<div class="acts"><a class="nb sm" href="#/'+m.b.id+'/review/'+m.n+'">Open this question in the paper</a></div></article>';
  }).join('');
  var body=!all.length?'<div class="feature"><p>No mistakes to show yet. Finish a paper and submit it. Every part that lost marks will be listed here.</p></div>':
    f+'<p class="mut">'+list.length+' part'+(list.length===1?'':'s')+' shown. '+lost+' mark'+(lost===1?'':'s')+' lost in this view.</p>'+(cards||'<div class="feature"><p>Nothing matches these filters.</p></div>');
  return frame('My mistakes','<div class="pg"><h1 class="pt">My mistakes</h1>'+body+'</div>');
}
