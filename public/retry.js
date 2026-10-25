/* ---------- Retry a part you got wrong (My mistakes and review) ----------
   A retry opens the part on its own page in the exam's own layout, with the marking guide hidden,
   so the student answers it again and then checks it.
   Retry answers and results live in paper.rt: rt.a[key] is the retry answer (edited through ANS() in
   helpers.js), rt.r[key] the last checked result {g, m, stamp, at, full, ai, self}.
   Retrying never changes the submitted answers, marks or totals.
   Colours everywhere: red means marks were lost; yellow means the part was retried and earned full
   marks (rt.r[key].full stays set once reached). Retries are only for submitted papers and are
   switched off completely while any paper is being sat in exam mode. */
var RTRUN={},RTERR={},RTSELF={},RTORIG={};
function rtAllowed(b){var u=b&&S.u[b.id];return !!(u&&u.done&&!b.hidden&&(typeof examSitting!=='function'||!examSitting()))}
function rtData(b){var bs=BS(b.id);if(!bs.rt)bs.rt={};if(!bs.rt.a)bs.rt.a={};if(!bs.rt.r)bs.rt.r={};return bs.rt}
function rtRes(b,n,i){var u=S.u[b.id];return u&&u.rt&&u.rt.r?u.rt.r[n+'.'+i]||null:null}
function rtAnswer(b,n,i){var u=S.u[b.id];return u&&u.rt&&u.rt.a?u.rt.a[n+'.'+i]:undefined}
function rtWrong(b,n,i){var s=score(b,n,i);return s.set&&s.src!=='provisional'&&s.g<s.m}
function rtFixed(b,n,i){var r=rtRes(b,n,i);return !!(r&&r.full)}
function rtKey(b,n,i){return b.id+'/'+n+'.'+i}
/* A result belongs to the exact answer it was checked on; editing the retry answer makes it stale. */
function rtStampOf(b,n,i){var it=b.qs[n-1].it[i],a=rtAnswer(b,n,i);return AUTO[it.t]?JSON.stringify(a==null?null:a):aiStamp(b,n,i,a)}
function rtCurrent(b,n,i){var r=rtRes(b,n,i);return r&&r.stamp===rtStampOf(b,n,i)?r:null}
function rtHref(b,n,i,from){return '#/'+b.id+'/retry/'+n+'.'+i+(from?'/'+from:'')}
function rtButtonHTML(b,n,i,from){
  if(!rtAllowed(b)||!rtWrong(b,n,i))return '';
  var again=!!rtRes(b,n,i);
  return '<a class="nb sm rtbtn'+(again?' ol':'')+'" href="'+rtHref(b,n,i,from)+'">'+(again?'Retry again':'Retry')+'</a>';
}
function rtStatusHTML(b,n,i){
  var r=rtRes(b,n,i);
  if(!r){
    var a=rtAnswer(b,n,i);
    if(a!=null&&isAns(b.qs[n-1].it[i],a)&&rtWrong(b,n,i)){
      return '<p class="rtst" style="background:#f0f4f8;border:1px solid #c9c9c9;border-left:4px solid #002664;color:#002664;padding:6px 10px;margin:8px 0;border-radius:3px"><b>Retry draft saved.</b> Your retry answer is saved in this browser. Click &ldquo;Retry&rdquo; above and then &ldquo;Check my answer&rdquo; to assess it.</p>';
    }
    return '';
  }
  if(!rtWrong(b,n,i))return '';
  if(r.full)return '<p class="rtst rtok"><b>Retried: full marks.</b> You got '+r.m+' / '+r.m+' on a retry'+(r.at&&typeof fmtD==='function'?' ('+fmtD(r.at)+')':'')+'. Your exam mark stays the same.</p>';
  return '<p class="rtst bad"><b>Last retry: '+(r.g==null?'not marked':r.g+' / '+r.m)+'.</b> Not full marks yet.</p>';
}

/* ---------- the retry page ---------- */
function rtBack(b,n,i,from){return from==='rv'?'#/'+b.id+'/review/'+n:'#/mistakes/'+(typeof MF!=='undefined'&&MF.bank?MF.bank:'all')+'/'+b.id+'.'+n+'.'+i}
function retryPage(b,n,i,from){
  var q=b.qs[n-1],it=q&&q.it[i],back=rtBack(b,n,i,from);
  CUR={b:null,n:0};
  if(!it||!rtAllowed(b)||!rtWrong(b,n,i)){
    var u=S.u[b.id],why=typeof examSitting==='function'&&examSitting()?'Retries are not available while you are sitting an exam. Finish or submit the exam first.':!u||!u.done?'You can retry a part after you submit the paper.':'There are no lost marks on this part to retry.';
    return frame('Retry','<div class="pg"><h1 class="pt">Retry</h1><div class="feature"><p>'+why+'</p><div class="acts"><a class="nb" href="'+(it?back:'#/mistakes')+'">Back</a></div></div></div>');
  }
  CUR={b:b,n:n,rv:false,rt:{i:i,from:from||'mk'}};rtData(b);
  var title='<h2 class="qt" id="hq">Question '+n+' ('+(q.m===1?'1 mark':q.m+' marks')+') <span class="rt-tag">Retry</span></h2>';
  var st=(q.st||'')+(q.db?dbTables(q.db):'');
  var inBox=it.t==='tx'||it.t==='py'||it.t==='ps'||it.t==='sq'||it.t==='dr';
  var items=itemHTML(b,n,i,false)+(inBox||AUTO[it.t]?'':'<div class="rto-row">'+rtOrigBtn(n+'.'+i)+'</div>')+(AUTO[it.t]?'':'<div id="rto">'+rtOrigHTML(b,n,i)+'</div>')+'<div id="rtp">'+rtPanelHTML(b,n,i)+'</div>';
  var acts='<div class="acts"><a class="nb ol" href="'+back+'">'+IC.left+'<span>'+(from==='rv'?'Back to the paper':'Back to my mistakes')+'</span></a></div>';
  var main=q.two?'<div class="qwrap two"><div class="qleft">'+title+st+'</div><div><div class="item">'+items+'</div>'+acts+'</div></div>'
    :'<div class="qwrap">'+title+'<div class="item">'+(st?'<div class="hoa-q st">'+st+'</div>':'')+items+'</div>'+acts+'</div>';
  return frame('Retry: '+b.name+' Software Engineering','<main class="ex" id="qarea">'+main+'</main>',{bar:true,bid:b.id});
}
function rtAfter(){
  if(!CUR.b||!CUR.rt)return;
  var b=CUR.b,n=CUR.n,i=CUR.rt.i,it=b.qs[n-1].it[i];
  if(it.t==='dr')xdMount(b,n+'.'+i,false);
  if(typeof aceMount==='function')aceMount();
}
/* The submitted answer, one click away inside the answer box. "Original answer" opens it below the box; "Restore to the box" puts it back in as the retry answer. */
function rtOrigBtn(k,kind){
  if(typeof CUR==='undefined'||!CUR.rt||!CUR.b)return '';
  var p=k.split('.'),open=!!RTORIG[rtKey(CUR.b,+p[0],+p[1])];
  return '<button type="button" class="'+(kind==='tb'?'rto-btn':'nb ol rto-btn')+'" data-act="rtorig" aria-expanded="'+open+'">Original answer</button>';
}
function rtOrigHTML(b,n,i){
  if(!RTORIG[rtKey(b,n,i)])return '';
  var it=b.qs[n-1].it[i],a=BS(b.id).ans[n+'.'+i],has=isAns(it,a),body;
  if(!has)body='<p class="mut">You did not answer this part.</p>';
  else if(QT[it.t]&&QT[it.t].preview)body=QT[it.t].preview(it,a);
  else if(it.t==='tx')body='<div class="yans">'+a+'</div>';
  else if(it.t==='dr')body='<pre class="yans">'+esc(xdText(a.e))+'</pre>';
  else body='<pre class="yans">'+esc(String(a))+'</pre>';
  return '<div class="rto"><div class="rto-h"><b>Your original answer</b>'+(has?'<button type="button" class="rto-l" data-act="rtrestore">Restore to the box</button>':'')+'<button type="button" class="rto-l" data-act="rtorig">Close</button></div>'+body+'</div>';
}
function rtOrigToggle(){
  if(!CUR.b||!CUR.rt)return;
  var b=CUR.b,n=CUR.n,i=CUR.rt.i,key=rtKey(b,n,i),on=RTORIG[key]=!RTORIG[key],p=$('#rto');
  if(p)p.innerHTML=rtOrigHTML(b,n,i);
  Array.prototype.forEach.call(document.querySelectorAll('[data-act="rtorig"].rto-btn'),function(el){el.setAttribute('aria-expanded',on?'true':'false')});
}
/* Put the submitted answer back into the retry box. The page is drawn again so the editor, word count and any drawing pick it up. */
function rtRestore(){
  if(!CUR.b||!CUR.rt||!canEdit())return;
  var b=CUR.b,n=CUR.n,i=CUR.rt.i,from=CUR.rt.from,k=n+'.'+i,key=rtKey(b,n,i),orig=BS(b.id).ans[k];
  if(!isAns(b.qs[n-1].it[i],orig))return;
  if(typeof xdFlush==='function'&&b.qs[n-1].it[i].t==='dr')xdFlush(k);
  rtData(b).a[k]=JSON.parse(JSON.stringify(orig));
  delete RTERR[key];RTORIG[key]=false;save(b.id);
  var y=window.scrollY;xdCleanup();$('#app').innerHTML=retryPage(b,n,i,from);
  if(typeof applyTheme==='function')applyTheme();
  rtAfter();window.scrollTo(0,y);
}
function rtRefresh(){var p=$('#rtp');if(p&&CUR.b&&CUR.rt)p.innerHTML=rtPanelHTML(CUR.b,CUR.n,CUR.rt.i)}
function rtSample(it){return QT[it.t]&&QT[it.t].sample?QT[it.t].sample(it):it.t==='py'||it.t==='ps'||it.t==='sq'?'<pre>'+esc(it.model)+'</pre>':modelHTML(it)}
function rtPanelHTML(b,n,i){
  var it=b.qs[n-1].it[i],k=n+'.'+i,key=rtKey(b,n,i),s=score(b,n,i),r=rtCurrent(b,n,i),last=rtRes(b,n,i),run=RTRUN[key];
  var h='<div class="aib rtp"><p><b>Retry this part.</b> Answer it again without the marking guide, then check your answer. Your exam mark ('+s.g+' / '+s.m+') does not change.</p>'+
    '<div class="acts"><button type="button" class="nb sm" data-act="rtcheck"'+(run?' disabled':'')+'>'+(r||last?'Check again':'Check my answer')+'</button></div></div>';
  if(run)return h+'<div class="aib"><h5>Marking your retry</h5><p>Marking your answer now. The feedback appears here when it is done.</p></div>';
  if(RTERR[key])return h+'<div class="aib bad"><h5>Marking did not finish</h5><p>'+esc(RTERR[key])+'</p><p>Your retry answer is saved. Press Check again to try once more.</p></div>';
  if(RTSELF[key]&&!r)return h+rtSelfHTML(b,n,i,null);
  if(!r)return h+(last?'<p class="note rtnote">You changed your answer after the last check. Check it again to see the new mark.</p>':'');
  return h+rtResultHTML(b,n,i,r);
}
function rtVerdict(r){
  if(r.g==null)return '<div class="rtv pend"><b>No mark yet.</b> The marking could not settle on a mark. Compare with the sample answer and set your own mark below.</div>';
  return r.g>=r.m?'<div class="rtv rtok"><b>Full marks: '+r.g+' / '+r.m+'.</b> This mistake now shows yellow.</div>'
    :'<div class="rtv bad"><b>'+r.g+' / '+r.m+'.</b> Not full marks yet. Fix what&rsquo;s wrong and check again.</div>';
}
function rtResultHTML(b,n,i,r){
  var it=b.qs[n-1].it[i],k=n+'.'+i,a=rtAnswer(b,n,i),h=rtVerdict(r);
  if(AUTO[it.t])return h+(r.g<r.m?'<div class="guide rtg"><div class="wrongbox"><h5><span>What&rsquo;s wrong</span><span class="wl">&minus;'+(r.m-r.g)+' mark'+(r.m-r.g===1?'':'s')+'</span></h5>'+closedCompare(it,a,true)+'</div></div>':'');
  if(r.self||r.g==null)return h+rtSelfHTML(b,n,i,r);
  var g='<div class="guide rtg">'+(r.ai?aiResultHTML(b,n,i,it,k,r.ai,{remark:false,title:'AI marking of your retry',answer:a}):'')+
    '<details class="xdd"'+(r.g>=r.m?' open':'')+'><summary>Sample answer</summary>'+rtSample(it)+'</details>'+
    (it.crit&&it.crit.length?'<details class="xdd"><summary>Marking criteria</summary>'+critList(it.crit)+'</details>':'')+'</div>';
  return h+g;
}
/* Without an account (or when AI marking cannot settle a mark) the student marks the retry against the guide. */
function rtSelfHTML(b,n,i,r){
  var it=b.qs[n-1].it[i],h='<div class="guide rtg">'+(!S.tok&&!r?'<p class="note"><a href="#/account">Sign in</a> for AI marking. Without it, compare your retry with the sample answer and criteria, then set your mark.</p>':'')+
    '<p class="gh"><b>Sample answer:</b></p>'+rtSample(it)+(it.crit&&it.crit.length?'<p class="gh"><b>Marking criteria</b></p>'+critList(it.crit):'')+
    '<div class="smk"><span>Your mark for this retry:</span>';
  for(var j=0;j<=it.m;j++)h+='<button type="button" data-act="rtsm" data-v="'+j+'"'+(r&&r.self&&r.g===j?' class="on"':'')+'>'+j+'</button>';
  return h+'</div></div>';
}

/* ---------- checking a retry ---------- */
function rtStore(b,n,i,x){
  var d=rtData(b),k=n+'.'+i,it=b.qs[n-1].it[i],prev=d.r[k];
  var r={g:x.g,m:it.m,stamp:x.stamp||rtStampOf(b,n,i),at:Date.now(),full:!!(prev&&prev.full)||(typeof x.g==='number'&&x.g>=it.m)};
  if(x.ai)r.ai=x.ai;if(x.self)r.self=1;
  d.r[k]=r;delete RTSELF[rtKey(b,n,i)];save(b.id);
}
function rtCheck(){
  var b=CUR.b;if(!b||!CUR.rt||!canEdit())return;
  var n=CUR.n,i=CUR.rt.i,k=n+'.'+i,it=b.qs[n-1].it[i],key=rtKey(b,n,i);
  if(RTRUN[key])return;
  if(it.t==='dr'&&typeof xdFlush==='function')xdFlush(k);
  var a=rtAnswer(b,n,i);delete RTERR[key];
  if(AUTO[it.t])rtStore(b,n,i,{g:score(b,n,i,a).g});
  else if(!isAns(it,a))rtStore(b,n,i,{g:0});
  else if(!S.tok){
    if(it.t==='sq'&&b.qs[n-1].db&&typeof runSQL==='function'&&typeof sameSQLResult==='function'){
      RTRUN[key]=1;rtRefresh();
      Promise.all([runSQL(b.qs[n-1].db,a,null,true),runSQL(b.qs[n-1].db,it.model,null,true)]).then(function(res){
        delete RTRUN[key];
        if(sameSQLResult(res[0],res[1],it)){
          rtStore(b,n,i,{g:it.m,stamp:rtStampOf(b,n,i),self:1});
        }else{
          RTSELF[key]=1;
        }
        rtRefresh();
      }).catch(function(){
        delete RTRUN[key];RTSELF[key]=1;rtRefresh();
      });
      return;
    }
    RTSELF[key]=1;
  }
  else{rtMarkAI(b,n,i);return}
  rtRefresh();
}
function rtMarkAI(b,n,i){
  var it=b.qs[n-1].it[i],key=rtKey(b,n,i),a=rtAnswer(b,n,i),stamp=rtStampOf(b,n,i),state=S,token=S.tok,tries=0;
  var payload=aiPayload(b,n,i,a);
  RTRUN[key]=1;rtRefresh();
  function current(){return S===state&&S.tok===token&&rtStampOf(b,n,i)===stamp}
  function ask(p){
    return aiCall(p,token).catch(function(e){
      // Another request for this exact answer is still running on the server: wait and ask again (about six minutes at most).
      if(e.code==='marking_busy'&&++tries<24&&current())return new Promise(function(res){setTimeout(res,15000)}).then(function(){return ask(p)});
      throw e;
    });
  }
  var prepared=it.t==='dr'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):Promise.resolve(payload);
  return prepared.then(ask).then(function(res){
    if(!current())return;
    if((res.status==='marked'||res.status==='provisional')&&(res.mark<0||res.mark>it.m))throw new Error('The marking service returned a mark outside the available range.');
    function strings(x){return Array.isArray(x)?x.filter(function(y){return typeof y==='string'}):[]}
    var ai={status:res.status,g:res.mark,stamp:stamp,fb:{summary:typeof res.summary==='string'?res.summary:'',strengths:strings(res.strengths),improve:strings(res.improve),advice:strings(res.advice),criteria:Array.isArray(res.criteria)?res.criteria:[],losses:res.losses||null,quality:Array.isArray(res.quality)?res.quality:[]},audit:res.audit||{},ts:Date.now()};
    rtStore(b,n,i,{g:res.status==='needs_review'?null:res.mark,ai:ai,stamp:stamp});
  }).catch(function(e){if(S===state)RTERR[key]=e&&e.message||'AI marking is temporarily unavailable.'}).then(function(){
    delete RTRUN[key];
    if(CUR.b===b&&CUR.rt&&CUR.n===n&&CUR.rt.i===i)rtRefresh();
  });
}
document.addEventListener('click',function(e){
  var el=e.target.closest&&e.target.closest('[data-act="rtcheck"],[data-act="rtsm"],[data-act="rtorig"],[data-act="rtrestore"]');if(!el||!CUR.b||!CUR.rt)return;
  if(el.dataset.act==='rtcheck')rtCheck();
  else if(el.dataset.act==='rtorig')rtOrigToggle();
  else if(el.dataset.act==='rtrestore')rtRestore();
  else if(canEdit()){var b=CUR.b,n=CUR.n,i=CUR.rt.i,prev=rtCurrent(b,n,i);rtStore(b,n,i,{g:+el.dataset.v,self:1,ai:prev&&prev.ai});rtRefresh()}
});
