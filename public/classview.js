function extractKeyPoints(text){
  if(!text)return [];
  var clean=String(text).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  var sents=clean.split(/(?<=[.!?])\s+/).filter(function(st){
    st=st.trim();
    return st.length>=16&&!/^(e\.g\.|i\.e\.|etc\.)/i.test(st);
  });
  if(!sents.length){
    if(clean.length>12)return [{point:clean}];
    return [];
  }
  return sents.slice(0,4).map(function(st){
    return {point:st.replace(/^[-*•\d.)\s]+/,'').trim()};
  });
}
function cvAnswerPoints(res,studentName,text){
  var points=[];
  if(res&&res.result&&Array.isArray(res.result.mainPoints)){
    var letter=null;
    if(res.names){
      Object.keys(res.names).forEach(function(l){
        if(res.names[l]===studentName||(studentName==='You'&&res.names[l]==='You'))letter=l;
      });
    }
    res.result.mainPoints.forEach(function(p){
      if(letter&&p.madeBy&&p.madeBy.indexOf(letter)>=0){
        points.push({point:p.point,status:p.answersQuestion,why:p.why});
      }
    });
  }
  if(!points.length&&text){
    points=extractKeyPoints(text);
  }
  return points;
}
/* Class answers: the Class page and the class panel under each written part in review and practice. Server side: api/class.js. */
var CV={n:1,st:null,msg:'',bank:'',over:null,overAt:0,ans:null,ansBank:'',ansAt:0,loadSt:false,loadAns:false,aok:true,roster:null,users:null,draft:{},aedit:'',adel:'',amsg:'',editing:'',photoMsg:'',photoFor:'',prog:{},progRun:{},pview:'',apview:'',run:{},res:{},auto:{},open:{},joining:false,rm:{},dopen:{}};
function cvApi(body){
  return fetch('/api/class',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+S.tok},body:JSON.stringify(body)}).then(function(r){
    return r.json().catch(function(){return {error:'The class service sent an unreadable reply.'}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||'Request failed ('+r.status+')');e.status=r.status;e.code=j.code;throw e}
      return j;
    });
  });
}
function cvBanks(){return BANKS.filter(function(b){return !b.hidden&&!b.archived})}
function cvOpenItem(it){return it.t==='tx'||it.t==='py'||it.t==='ps'||it.t==='sq'}
function cvChoiceItem(it){return !!it&&(it.t==='mc'||it.t==='ms')}
function cvPlain(h){var d=document.createElement('div');d.innerHTML=String(h||'');return (d.textContent||'').replace(/\s+/g,' ').trim()}
var CV_CACHE_KEY = 'sehsc-cv-cache';
function loadCVCache(){
  try {
    var raw = localStorage.getItem(CV_CACHE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.roster) CV.roster = parsed.roster;
        if (parsed.st) CV.st = parsed.st;
      }
    }
  } catch(e){}
}
function saveCVCache(){
  try {
    localStorage.setItem(CV_CACHE_KEY, JSON.stringify({
      roster: CV.roster,
      st: CV.st
    }));
  } catch(e){}
}
loadCVCache();

function cvClearCache(){
  try{localStorage.removeItem(CV_CACHE_KEY)}catch(e){}
}

function cvOverview(){
  if(!S.tok)return Promise.resolve();
  return cvApi({action:'overview'}).then(function(o){
    var prev=JSON.stringify(CV.over);
    CV.over=o;
    CV.overAt=Date.now();
    saveCVCache();
    if(prev!==JSON.stringify(o))cvDraw();
    return o;
  }).catch(function(){});
}

function cvStatus(force){
  if(force){CV.st=null;CV.loadSt=false}
  if(CV.loadSt||!S.tok)return Promise.resolve();
  CV.loadSt=true;
  var statusReq=cvApi({action:'status'});
  var needOver=CV.st?!!CV.st.member:(CV.over!==null||!!S.classCode);
  var overReq=needOver?cvOverview():Promise.resolve();

  return statusReq.then(function(r){
    CV.st=r;
    saveCVCache();
    if(r.admin)cvApi({action:'admin_users'}).then(function(o){CV.users=o.users;cvDraw()}).catch(function(e){CV.amsg=e.message});
    if(r.member){
      var tasks=[cvApi({action:'roster'}).then(function(o){CV.roster=o;saveCVCache();cvDraw()}).catch(function(){})];
      if(!needOver)tasks.push(cvOverview());
      return Promise.all(tasks);
    }
    return null;
  }).catch(function(e){
    if(CV.st===null)CV.st={configured:true,member:false};
    CV.msg=e.message;
  }).then(function(){
    return overReq;
  }).then(function(){
    CV.loadSt=false;
    saveCVCache();
    cvDraw();
    PRX.blocked=false;prStart();
  });
}
function cvAutoStatus(){
  if(!S.tok||/[?&]archive=1\b/.test(location.search))return;
  if(!PRX.started&&CV.st&&CV.st.member)prStart();
  if(CV.st===null&&!CV.loadSt){
    cvStatus();
  }else if(!CV.loadSt&&(!CV.overAt||Date.now()-CV.overAt>20000)){
    if(!CV.st||CV.st.member||CV.over!==null||S.classCode){
      cvOverview();
    }
  }
}
function cvLoadAnswers(id,quiet){
  if(CV.loadAns)return Promise.resolve();
  CV.loadAns=true;if(!quiet){CV.ans=null;CV.ansBank=''}
  return cvApi({action:'answers',bankId:id}).then(function(r){CV.ans=r;CV.ansBank=id;CV.ansAt=Date.now();CV.msg=''}).catch(function(e){CV.msg=e.message}).then(function(){CV.loadAns=false;cvDraw();var bk=BANKS.filter(function(x){return x.id===id})[0];if(bk)cvAutoBuild(bk)});
}
/* Builds (or fetches the cached) class model answer for one part. */
function cvAnalyse(bankId,key,qn,pi){
  if(CV.run[key]&&!CV.run[key].err)return;
  CV.run[key]={};cvDraw();
  cvApi({action:'analyse',bankId:bankId,questionNumber:qn,partIndex:pi}).then(function(r){delete CV.run[key];CV.res[key]=r;cvDraw()}).catch(function(e){CV.run[key]={err:e.message};cvDraw()});
}
/* Parts shown in a mistakes/review slot with 2+ shared answers build their model answer on their own, once per visit. */
function cvFormatSQL(sql){
  var s=String(sql||'').trim();
  if(!s)return '';
  if(s.indexOf('\n')>=0)return s;
  return s.replace(/\s+\b(FROM|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY)\b/gi,'\n$1');
}
function cvAutoBuild(b){
  if(!CV.ans||CV.ansBank!==b.id)return;
  Array.prototype.forEach.call(document.querySelectorAll('.cvslot'),function(el){
    if(el.getAttribute('data-b')!==b.id)return;
    var n=+el.getAttribute('data-n'),i=+el.getAttribute('data-i'),it=b.qs[n-1]&&b.qs[n-1].it[i];
    if(it&&(it.t==='sq'||cvChoiceItem(it)))return;
    var key=n+'.'+i,k=b.id+'|'+key,list=CV.ans.parts[key]||[];
    if(list.length<2||CV.res[k]||CV.run[k]||CV.auto[k])return;
    CV.auto[k]=1;cvAnalyse(b.id,k,n,i);
  });
}
/* Called after a question is drawn: loads the class state once and keeps the panels fresh. */
function classEnsure(b){
  if(!S.tok||!b||!document.querySelector('.cvslot')||/[?&]archive=1\b/.test(location.search))return;
  if(CV.st===null){if(!CV.loadSt)cvStatus().then(function(){classEnsure(b)});return}
  if(CV.st.member&&(CV.ansBank!==b.id||Date.now()-CV.ansAt>60000)&&!CV.loadAns)cvLoadAnswers(b.id,CV.ansBank===b.id);
  cvAutoBuild(b);
}
function cvDraw(){
  var r=document.getElementById('cvroot');if(r&&/^#\/class/.test(location.hash))r.innerHTML=cvHTML();
  if(r&&typeof navArrows==='function')navArrows(true);
  Array.prototype.forEach.call(document.querySelectorAll('.cvslot'),function(el){
    var b=BANKS.filter(function(x){return x.id===el.getAttribute('data-b')})[0];
    if(b)el.innerHTML=cvSlotInner(b,+el.getAttribute('data-n'),+el.getAttribute('data-i'));
  });
  Array.prototype.forEach.call(document.querySelectorAll('.notion-presence-slot'),function(el){
    var b=BANKS.filter(function(x){return x.id===el.getAttribute('data-b')})[0];
    if(b&&typeof trialAvatarsHTML==='function')el.innerHTML=trialAvatarsHTML(b,el.getAttribute('data-inline')==='1');
  });
}
function classSlot(b,n,i){
  var it=b.qs[n-1].it[i];
  if(!S.tok||!(cvOpenItem(it)||cvChoiceItem(it))||b.archived)return '';
  return '<div class="cvslot" data-b="'+esc(b.id)+'" data-n="'+n+'" data-i="'+i+'">'+cvSlotInner(b,n,i)+'</div>';
}
function cvSlotInner(b,n,i){
  if(CV.st===null)return '<div class="cv-skel-slot cv-shimmer"><div class="cv-skel-line w40" style="height:14px"></div><div class="cv-skel-line w80" style="height:12px;margin-top:8px"></div></div>';
  if(!CV.st.configured)return '';
  if(!CV.st.member)return '<div class="aib"><b>Class answers.</b> <a href="#/class">Join your class</a> with the class code to see what classmates wrote for this part.</div>';
  if(CV.msg&&CV.ansBank!==b.id)return '<div class="aib bad"><b>Class answers.</b> '+esc(CV.msg)+'</div>';
  if(CV.ansBank!==b.id||!CV.ans)return '<div class="cv-skel-slot cv-shimmer"><div class="cv-skel-line w40" style="height:14px"></div><div class="cv-skel-line w80" style="height:12px;margin-top:8px"></div></div>';
  var key=n+'.'+i,it0=b.qs[n-1].it[i];
  if(cvChoiceItem(it0))return '<div class="aib cvbox">'+cvChoiceBody(it0,CV.ans.parts[key]||[])+'</div>';
  return '<div class="aib cvbox">'+cvPartBody(b.id,key,n,i,CV.ans.parts[key]||[])+'</div>';
}
/* Single and multiple choice parts: how many classmates picked each option, and who. */
function cvChoiceBody(it,list){
  var h='<div class="cvhd"><b>Class answers</b> <span class="mut">('+list.length+' shared)</span></div>';
  if(!list.length)return h+'<p class="mut">No one has shared an answer to this question yet.</p>';
  return h+'<ul class="cvch">'+it.o.map(function(o,j){
    var who=list.filter(function(a){return a.choice.indexOf(j)>=0}),pct=Math.round(100*who.length/list.length);
    return '<li class="cvch-row"><div class="cvch-top"><span class="cvch-l">'+String.fromCharCode(65+j)+'</span><span class="cvch-o">'+o+'</span><span class="cvch-n">'+who.length+'</span></div>'+
      '<div class="cvch-bar"><i style="width:'+pct+'%"></i></div>'+
      (who.length?'<div class="cvch-who">'+who.map(function(a){return esc(a.mine?'You':a.name)}).join(', ')+'</div>':'')+'</li>';
  }).join('')+'</ul>';
}
/* Shared by the class page and the review panel. */
/* A classmate's mark for the part, coloured like marks everywhere else: green full marks, red anything less. */
function cvMarkHTML(a){
  if(typeof a.mark!=='number'||typeof a.max!=='number')return '<span class="cv-mark none" title="Not marked yet">Unmarked</span>';
  return '<span class="cv-mark '+(a.mark>=a.max?'ok':'bad')+'" title="Mark for this part">'+a.mark+' / '+a.max+'</span>';
}
function cvSqlFeedbackHTML(a,res){
  var fb=a.fb||null,summary='',problems=[];
  if(!fb&&a.mine&&CV.ansBank){
    var u=S.u[CV.ansBank],ai=u&&u.ai&&u.ai[a.partKey||''];
    if(ai&&ai.fb){
      summary=typeof aiFirst==='function'?aiFirst(ai.fb.summary):String(ai.fb.summary||'').trim();
      var L=ai.fb.losses&&Array.isArray(ai.fb.losses.items)?ai.fb.losses.items:[];
      L.forEach(function(l){if(l&&l.explanation)problems.push(typeof aiFirst==='function'?aiFirst(l.explanation):l.explanation)});
      if(!problems.length&&Array.isArray(ai.fb.improve))ai.fb.improve.forEach(function(x){if(x)problems.push(typeof aiFirst==='function'?aiFirst(x):x)});
    }
  }else if(fb){
    summary=fb.summary||'';
    problems=Array.isArray(fb.problems)?fb.problems:[];
  }
  if(!summary&&!problems.length&&res&&res.result&&Array.isArray(res.result.mainPoints)){
    var author=a.mine?'You':a.name,letter=null;
    if(res.names)Object.keys(res.names).forEach(function(l){if(res.names[l]===author||(author==='You'&&res.names[l]==='You'))letter=l});
    if(letter){
      var okPts=[],badPts=[];
      res.result.mainPoints.forEach(function(p){
        if(p.madeBy&&p.madeBy.indexOf(letter)>=0){
          if(p.answersQuestion==='yes')okPts.push(p.point);
          else badPts.push(p.why||p.point);
        }
      });
      if(okPts.length)summary=typeof aiFirst==='function'?aiFirst(okPts[0]):okPts[0];
      if(badPts.length)problems=badPts.slice(0,2);
    }
  }
  var hasLoss=typeof a.mark==='number'&&typeof a.max==='number'&&a.mark<a.max;
  if(!summary&&!problems.length)return '';
  var h='<div class="cv-sql-fb">';
  if(summary)h+='<p class="cv-sql-sum">'+esc(summary)+'</p>';
  if(problems.length){
    h+='<div class="cv-sql-prob"><span class="pill bad">Problem</span> <span>'+esc(problems.join(' '))+'</span></div>';
  }else if(hasLoss&&summary){
    h='<div class="cv-sql-fb"><div class="cv-sql-prob"><span class="pill bad">Problem</span> <span>'+esc(summary)+'</span></div>';
  }
  return h+'</div>';
}
function cvPartBody(bankId,key,qn,pi,list){
  var k=bankId+'|'+key,r=CV.res[k],run=CV.run[k],isOpen=CV.open[k]!==false,busy=run&&!run.err;
  var bk=BANKS.filter(function(x){return x.id===bankId})[0],it=bk&&bk.qs[qn-1]&&bk.qs[qn-1].it[pi],code=!!it&&it.t!=='tx',isSql=!!it&&it.t==='sq';
  /* The aggregator: for SQL, show the clean formatted query directly without class synthesis or rebuild buttons. */
  var g;
  if(isSql){
    g='<div class="cvagg"><div class="cvhd"><b>Model answer</b></div><pre class="cvcode">'+esc(cvFormatSQL(it.model))+'</pre></div>';
  }else{
    g='<div class="cvagg"><div class="cvhd"><b>Class model answer</b></div>';
    if(r)g+=cvResultHTML(r);
    else if(busy)g+='<p class="mut">Building the class model answer...</p>';
    else g+='<p class="mut">The best points from everyone\'s answers, combined and checked against the syllabus.'+(list.length>=2?'':' It needs at least 2 shared answers ('+list.length+' so far).')+'</p>';
    if(run&&run.err)g+='<p class="acmsg" role="alert">'+esc(run.err)+'</p>';
    g+='<div class="acts">'+(list.length>=2?'<button class="nb sm" data-cv="analyse" data-b="'+esc(bankId)+'" data-k="'+esc(k)+'" data-q="'+qn+'" data-p="'+pi+'" type="button"'+(busy?' disabled':'')+'>'+(busy?'Building...':(r?'Rebuild model answer':'Build class model answer'))+'</button>':'')+'</div></div>';
  }
  var h=g+'<div class="cvhd"><b>Class answers</b> <span class="mut">('+list.length+' shared)</span>'+
    (list.length?'<button class="nb sm ol" data-cv="toggle" data-k="'+esc(k)+'" type="button">'+(isOpen?'Hide':'Show')+' answers</button>':'')+'</div>';
  if(!list.length)h+='<p class="mut">No one has shared an answer to this part yet.</p>';
  else if(isOpen)h+=list.map(function(a){
    var wc=cvPlain(a.text).split(' ').filter(Boolean).length;
    var author=a.mine?'You':a.name;
    var pts=isSql?[]:cvAnswerPoints(r,author,a.text);
    var ptsHTML='';
    if(isSql){
      ptsHTML=cvSqlFeedbackHTML(Object.assign({partKey:key},a),r);
    }else if(pts&&pts.length){
      ptsHTML='<div class="cv-main-pts"><div class="cv-pts-head"><span class="cv-pts-title"><b>Main points in this response:</b></span>'+
        (r?'<span class="cv-badge">Syllabus assessed</span>':'<span class="cv-badge mut">Key points</span>')+'</div>'+
        '<ul class="cv-pts-list">'+pts.map(function(p){
          return '<li><b>'+esc(p.point)+'</b>'+
            (p.status?' <span class="pill '+(p.status==='yes'?'ok':p.status==='partly'?'part':'bad')+'">'+(p.status==='yes'?'Answers the question':p.status==='partly'?'Partly answers':'Off the question')+'</span>':'')+
            (p.why?'<br><span class="mut">'+esc(p.why)+'</span>':'')+'</li>';
        }).join('')+'</ul></div>';
    }
    return '<div class="cvans"><div class="cvwho"><span class="cv-name">'+profileAvatarHTML(a.mine?S.photo:a.photo,a.id||a.name,24,author)+' '+esc(author)+'</span><span class="cv-meta">'+cvMarkHTML(a)+'<span class="cv-wc">'+wc+' word'+(wc===1?'':'s')+'</span></span></div>'+
      (code?'<pre class="cvcode">'+esc(a.text)+'</pre>':'<div class="cvtxt">'+esc(a.text).replace(/\n/g,'<br>')+'</div>')+
      ptsHTML+'</div>';
  }).join('');
  return h;
}
function classPage(bankId,n){
  CV.bank=cvBanks().some(function(b){return b.id===bankId})?bankId:'';
  var b=cvBanks().filter(function(x){return x.id===CV.bank})[0];
  CV.n=b?Math.min(b.qs.length,Math.max(1,+n||1)):0;
  CUR={b:null,n:0};
  return frame(b?'Class: '+b.name:'Class','<div id="cvroot">'+cvHTML()+'</div>',b?{nav:cvNavHTML(b),bar:true}:{});
}
function classBind(){
  if(!S.tok)return;
  cvStatus().then(function(){if(CV.st&&CV.st.member&&CV.bank&&(CV.ansBank!==CV.bank||Date.now()-CV.ansAt>60000))cvLoadAnswers(CV.bank,CV.ansBank===CV.bank)});
  if(typeof navArrows==='function')navArrows(true);
}
/* The paper as students saw it in the exam, one question at a time, with the class answers under each written part. */
function cvPartLabel(q,it){
  var mk=(q.it.length>1&&!/marks?\)/i.test(it.q))?' <span style="font-weight:700">('+(it.m===1?'1 mark':it.m+' marks')+')</span>':'';
  return (it.lb?'<span class="plab">'+it.lb+'</span>':'')+it.q+mk;
}
function cvPartView(b,n,i){
  var q=b.qs[n-1],it=q.it[i];
  if(cvOpenItem(it))return '<div class="part"><p class="hoa-q">'+cvPartLabel(q,it)+'</p>'+classSlot(b,n,i)+'</div>';
  if(it.t==='dr')return '<div class="part"><p class="hoa-q">'+cvPartLabel(q,it)+'</p><div class="aib">Diagrams are not shared with the class.</div></div>';
  var bs=BS(b.id),sv=bs.ans,h;
  bs.ans={};
  try{h=itemHTML(b,n,i,false)}finally{bs.ans=sv}
  return '<div class="cvro">'+h+'</div>'+(cvChoiceItem(it)?classSlot(b,n,i):'');
}
function cvQuestionHTML(b,n){
  var q=b.qs[n-1],title='<h2 class="qt" id="hq">Question '+n+' ('+(q.m===1?'1 mark':q.m+' marks')+')</h2>';
  var st=(q.st||'')+(q.db&&typeof dbTables==='function'?dbTables(q.db):'');
  var items=q.it.map(function(it,i){return cvPartView(b,n,i)}).join('');
  var acts='<div class="acts"><button class="nb ol" data-cv="goq" data-n="'+(n-1)+'" type="button"'+(n===1?' disabled':'')+'>'+IC.left+'<span>Previous question</span></button>'+
    '<button class="nb" data-cv="goq" data-n="'+(n+1)+'" type="button"'+(n===b.qs.length?' disabled':'')+'><span>Next question</span>'+IC.right+'</button></div>';
  if(q.two)return '<div class="qwrap two"><div class="qleft">'+title+st+'</div><div><div class="item">'+items+'</div>'+acts+'</div></div>';
  return '<div class="qwrap cvwrap">'+title+'<div class="item">'+(st?'<div class="hoa-q st">'+st+'</div>':'')+items+'</div>'+acts+'</div>';
}
function cvNavHTML(b){
  var h='<div class="nav-bar"><button type="button" class="nav-arr l" data-act="navl" aria-label="Show earlier question numbers" hidden>'+IC.left+'</button><div class="nav-nums" id="nums">';
  for(var n=1;n<=b.qs.length;n++){
    var any=false;
    if(CV.ansBank===b.id&&CV.ans)b.qs[n-1].it.forEach(function(it,i){var l=CV.ans.parts[n+'.'+i];if(l&&l.length)any=true});
    h+='<button type="button" class="nav-elem'+(n===CV.n?' cur':'')+'" data-cv="goq" data-n="'+n+'" aria-label="Question '+n+(any?', has class answers':'')+'">'+n+(any?'<span class="an">'+IC.tick+'</span>':'')+'</button>';
  }
  return h+'</div><button type="button" class="nav-arr r" data-act="navr" aria-label="Show later question numbers" hidden>'+IC.right+'</button><div class="tools" id="tools">'+toolsHTML(false)+'</div></div>';
}
/* Everyone in the class, one row each, like a Google Classroom people list. Admins edit any name or photo, and view progress reports. */
function cvWithU(uMap,fn){
  var sv=S.u,tmp={};
  Object.keys(uMap||{}).forEach(function(k){
    var p=uMap[k];
    if(p&&typeof p==='object'){
      tmp[k]={ans:p.ans||{},flags:p.flags||{},self:p.self||{},chk:p.chk||{},ai:p.ai||{},aiErr:p.aiErr||{},start:p.start||0,done:!!p.done,doneAt:p.doneAt||0,upd:p.upd||0,mode:p.mode||'exam',cur:p.cur||1};
    }
  });
  S.u=tmp;
  try{return fn(tmp)}finally{S.u=sv}
}
function cvFormatAns(it,a){
  if(!isAns(it,a))return '<span class="mut">No response</span>';
  if(it.t==='mc')return '<b>'+String.fromCharCode(65+(+a))+'.</b> '+esc(cvPlain(it.o&&it.o[a]||''));
  if(it.t==='ms'){
    var arr=Array.isArray(a)?a:[];
    return arr.map(function(x){return '<b>'+String.fromCharCode(65+(+x))+'.</b> '+esc(cvPlain(it.o&&it.o[x]||''))}).join('<br>');
  }
  if(it.t==='tx'){
    var txt=cvPlain(a),wc=txt?txt.split(/\s+/).length:0;
    return '<div class="yans">'+esc(txt)+'</div><span class="mut">'+wc+' word'+(wc===1?'':'s')+'</span>';
  }
  if(it.t==='py'||it.t==='ps'||it.t==='sq')return '<pre class="yans">'+esc(String(a))+'</pre>';
  if(it.t==='dr'){
    var dt=typeof xdText==='function'&&a&&a.e?xdText(a.e):'';
    return dt?'<pre class="yans">'+esc(dt)+'</pre>':'<span class="mut">Diagram ('+(a&&a.e?a.e.length:0)+' elements)</span>';
  }
  if(it.t==='ft'){
    var cells=Object.keys(a||{}).filter(function(k){return String(a[k]).trim()}).map(function(k){return '['+k+'] '+a[k]}).join(' | ');
    return '<div class="yans">'+esc(cells)+'</div>';
  }
  if(typeof units==='function'){
    var u=units(it,a);
    return esc(u[0]+' of '+u[1]+' correct');
  }
  return '<span class="mut">Answered</span>';
}
function cvLoadProg(id,isSystem){
  CV.progRun[id]={loading:true};cvDraw();
  cvApi({action:isSystem?'admin_progress':'progress',memberId:id}).then(function(r){
    delete CV.progRun[id];CV.prog[id]=r;cvDraw();
  }).catch(function(e){
    CV.progRun[id]={err:e.message};cvDraw();
  });
}
/* ---------- Admin remark ----------
   Marking runs in the browser of whoever asks for it, so a paper that was submitted while signed out, or closed before marking
   finished, can stay unmarked. An admin can mark it from the student's saved answers: this browser builds exactly the request the
   student's own browser would send (aiPayload and aiStamp in ai.js), marks it with the admin's own sign-in, then asks the server to
   save the results into the student's paper (remark_save, or admin_remark_save for any account). It uses the admin's own daily
   marking allowance. Must run inside cvWithU, which puts the student's papers in S.u. */
function cvRmKey(id,bid){return id+'|'+bid}
/* Answered AI-marked parts of one submitted paper. 'missing': no usable mark yet (none, stale, provisional or needs review) and no
   mark set by the student. 'all': every one. 'one': just the part named in "only". */
function cvRmList(b,mode,only){
  var bs=BS(b.id),out=[];
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){
    var k=(qi+1)+'.'+i,a=bs.ans[k];
    if(AUTO[it.t]||!isAns(it,a)||(only&&k!==only))return;
    var rec=aiRecord(b,qi+1,i);
    if(mode==='missing'&&(bs.self[k]!=null||(rec&&rec.status!=='needs_review'&&rec.status!=='provisional')))return;
    // A part that already has a result is marked afresh (remark:true): without it the server returns its saved
    // result, so re-marking a provisional or needs-review answer finished instantly with the same outcome.
    out.push({n:qi+1,i:i,k:k,it:it,ans:a,fresh:!!rec||mode!=='missing'});
  })});
  return out;
}
function cvRmBtn(id,isSystem,bid,mode,k,label,primary,off){
  return '<button class="nb sm'+(primary?'':' ol')+'" data-cv="remark" data-mode="'+mode+'" data-id="'+esc(id)+'" data-sys="'+(isSystem?'1':'0')+'" data-b="'+esc(bid)+'"'+(k?' data-k="'+esc(k)+'"':'')+' type="button"'+(off?' disabled':'')+'>'+label+'</button>';
}
function cvRmSummary(run,name){
  var t=[];
  if(run.saved)t.push(run.saved+' answer'+(run.saved===1?'':'s')+' marked and saved to '+name+'’s paper.');
  if(run.failed)t.push(run.failed+' did not finish'+(run.err?': '+run.err:'.'));
  return t.join(' ')||'Nothing needed marking.';
}
function cvRemark(id,isSystem,bid,mode,only){
  var d=CV.prog[id],b=BANKS.filter(function(x){return x.id===bid})[0],key=cvRmKey(id,bid),old=CV.rm[key];
  if(!d||!b||!d.u||!d.u[bid]||!d.u[bid].done||!S.tok||(old&&old.running)||typeof aiDispatch!=='function')return;
  if(mode==='all'&&!confirm('Mark every written, code and diagram answer in this paper again with AI? This uses your daily AI marking allowance and replaces the AI marks saved for this student.'))return;
  var doneAt=d.u[bid].doneAt||0,name=d.name||'the student',tasks=cvWithU(d.u,function(){return cvRmList(b,mode,only)});
  var run={running:true,total:tasks.length,done:0,saved:0,failed:0,err:'',msg:'',ok:false,saving:Promise.resolve()};
  CV.rm[key]=run;
  if(!tasks.length){run.running=false;run.msg=cvRmSummary(run,name);run.ok=true;cvDraw();return}
  var pending={},idx=0,fatal=null;
  function flush(){
    var keys=Object.keys(pending);if(!keys.length)return run.saving;
    var batch={};keys.forEach(function(k){batch[k]=pending[k];delete pending[k]});
    run.saving=run.saving.then(function(){
      return cvApi({action:isSystem?'admin_remark_save':'remark_save',memberId:id,bankId:bid,doneAt:doneAt,marks:batch}).then(function(){
        var paper=CV.prog[id]&&CV.prog[id].u&&CV.prog[id].u[bid];
        if(paper){paper.ai=paper.ai||{};paper.aiErr=paper.aiErr||{};keys.forEach(function(k){paper.ai[k]=batch[k];delete paper.aiErr[k]})}
        run.saved+=keys.length;
      }).catch(function(e){run.failed+=keys.length;run.err=e.message});
    });
    return run.saving;
  }
  function next(){
    if(idx>=tasks.length||fatal)return Promise.resolve();
    var t=tasks[idx++],stamp=aiStamp(b,t.n,t.i,t.ans),payload=aiPayload(b,t.n,t.i,t.ans);
    if(t.fresh)payload.remark=true;
    var prepared=t.it.t==='dr'&&typeof xdPNG==='function'?xdPNG(payload.answer.elements).then(function(png){if(png)payload.diagramPng=png;return payload}):Promise.resolve(payload);
    return prepared.then(function(p){
      return fatal?null:aiDispatch(p,S.tok,function(){return !fatal&&CV.rm[key]===run},null).catch(function(e){if(e.fatal)fatal=e;throw e});
    }).then(function(r){
      if(!r)return;
      var tmp={ai:{},aiErr:{}};aiStore(tmp,t.k,t.it,stamp,r);pending[t.k]=tmp.ai[t.k];
      if(Object.keys(pending).length>=4)return flush();
    }).catch(function(e){run.failed++;run.err=e.message}).then(function(){run.done++;cvDraw();return next()});
  }
  var workers=[];for(var w=0;w<Math.min(4,tasks.length);w++)workers.push(next());
  Promise.all(workers).then(flush).then(function(){return run.saving}).then(function(){
    if(fatal)run.failed+=tasks.length-idx;
    run.running=false;run.ok=!run.failed;run.msg=cvRmSummary(run,name);cvDraw();
  });
  cvDraw();
}
document.addEventListener('toggle',function(ev){var el=ev.target,k=el&&el.getAttribute&&el.getAttribute('data-cvd');if(k)CV.dopen[k]=!!el.open},true);
function cvProgHTML(id,isSystem){
  var run=CV.progRun[id],d=CV.prog[id];
  if(run&&run.loading&&!d)return '<p class="mut">Loading progress report...</p>';
  if(run&&run.err&&!d)return '<p class="acmsg" role="alert">'+esc(run.err)+'</p>';
  if(!d)return '<p class="mut">Loading progress report...</p>';
  return cvWithU(d.u,function(uMap){
    var banks=cvBanks(),paperRows=[],respBlocks=[],doneCount=0,progCount=0,totQ=0,totParts=0,totWords=0,lastTs=d.ts||0,unmarked=0;
    banks.forEach(function(b){
      var p=uMap[b.id];if(!p)return;
      var ansQ=0,ansParts=0,allParts=0,pWords=0,partRows=[];
      var t=totals(b),rmNow=CV.rm[cvRmKey(id,b.id)];
      b.qs.forEach(function(q,qi){
        var qn=qi+1;
        if(qAnswered(b,qn))ansQ++;
        q.it.forEach(function(it,pi){
          allParts++;
          var k=qn+'.'+pi,a=p.ans[k],ans=isAns(it,a),s=score(b,qn,pi);
          if(ans){
            ansParts++;
            if(it.t==='tx'||it.t==='py'||it.t==='ps'||it.t==='sq'){
              var w=cvPlain(a);if(w)pWords+=w.split(/\s+/).length;
            }
          }
          if(ans||p.done){
            var qLabel='Q'+qn+(q.it.length>1?String.fromCharCode(97+pi):'');
            var tName=typeof mkTypeName==='function'?mkTypeName(it):it.t.toUpperCase();
            var pillCls=!s.set||s.src==='provisional'?'pend':s.g===s.m?'ok':'bad';
            var pillTxt=s.set?(s.src==='provisional'?'Unconfirmed '+s.g+'/'+s.m:(s.g+' / '+s.m)):'Unscored ('+s.m+'m)';
            var aiSum=p.ai&&p.ai[k]&&p.ai[k].fb&&p.ai[k].fb.summary?'<div class="mut">'+esc(p.ai[k].fb.summary)+'</div>':'';
            var rmOne=p.done&&ans&&!AUTO[it.t]&&S.tok?'<div class="cv-rm">'+cvRmBtn(id,isSystem,b.id,'one',k,'Remark',false,rmNow&&rmNow.running)+'</div>':'';
            partRows.push('<tr><td><b><a href="#/class/'+esc(b.id)+'/'+qn+'">'+qLabel+'</a></b><div class="mut">'+esc(q.tp)+' &middot; '+esc(tName)+'</div></td>'+
              '<td>'+cvFormatAns(it,a)+aiSum+'</td>'+
              '<td><span class="pill '+pillCls+'">'+pillTxt+'</span>'+rmOne+'</td>'+
              '<td class="ra"><a class="nb sm ol" href="#/class/'+esc(b.id)+'/'+qn+'">Class Q'+qn+'</a> <a class="nb sm ol" href="#/'+esc(b.id)+'/review/'+qn+'">Review Q'+qn+'</a></td></tr>');
          }
        });
      });
      if(!p.start&&!p.done&&!ansParts)return;
      if(p.done)doneCount++;else progCount++;
      totQ+=ansQ;totParts+=ansParts;totWords+=pWords;
      if(p.upd&&p.upd>lastTs)lastTs=p.upd;
      if(p.doneAt&&p.doneAt>lastTs)lastTs=p.doneAt;
      if(p.start&&p.start>lastTs)lastTs=p.start;
      var sitting=!p.done&&p.mode==='exam'&&p.start&&(Date.now()-p.start<paperDuration(b)*1000);
      var stBadge=p.done?'<span class="pill ok">Submitted</span>':sitting?'<span class="pill part">Sitting exam</span>':'<span class="pill part">'+(p.mode==='practice'?'Practice':'Exam')+' in progress</span>';
      var meta=[];
      if(!p.done&&p.cur)meta.push('On Q'+p.cur);
      if(p.start)meta.push('Started '+fmtD(p.start));
      if(p.done&&p.doneAt)meta.push('Submitted '+fmtD(p.doneAt));
      else if(p.upd)meta.push('Saved '+fmtD(p.upd));
      var markStr=p.done||t.markedM>0?('<b>'+t.T+' / '+t.markedM+'</b>'+(t.markedM?' <span class="mut">('+Math.round(100*t.T/t.markedM)+'%)</span>':'')+(t.P?'<div class="mut">'+t.P+' unscored</div>':'')):'<span class="mut">Not marked yet</span>';
      var targetQ=p.cur||1,rmCell='';
      if(p.done&&S.tok){
        var miss=cvRmList(b,'missing').length,anyAI=cvRmList(b,'all').length;
        unmarked+=miss;
        if(rmNow&&rmNow.running)rmCell='<div class="mut">Marking '+rmNow.done+' of '+rmNow.total+'...</div>';
        else if(miss||anyAI)rmCell='<div class="cv-rm">'+(miss?cvRmBtn(id,isSystem,b.id,'missing','','Mark '+miss+' unmarked',true):'')+(anyAI?cvRmBtn(id,isSystem,b.id,'all','','Re-mark paper',false):'')+'</div>';
        if(rmNow&&rmNow.msg)rmCell+='<div class="acmsg'+(rmNow.ok?' ok':'')+'" role="status">'+esc(rmNow.msg)+'</div>';
      }
      paperRows.push('<tr><td><b>'+esc(b.name)+'</b><div class="mut">'+esc(b.sub||'')+' &middot; '+(p.mode==='practice'?'Practice mode':'Exam mode')+'</div></td>'+
        '<td>'+stBadge+(meta.length?'<div class="mut">'+esc(meta.join(' · '))+'</div>':'')+'</td>'+
        '<td><b>'+ansQ+' / '+b.qs.length+'</b> questions<div class="mut">'+ansParts+' / '+allParts+' parts'+(pWords?' &middot; '+pWords+' words':'')+'</div></td>'+
        '<td>'+markStr+rmCell+'</td>'+
        '<td class="ra"><a class="nb sm ol" href="#/class/'+esc(b.id)+'/'+targetQ+'">Class paper</a> <a class="nb sm ol" href="#/'+esc(b.id)+'/review/'+targetQ+'">Review paper</a></td></tr>');
      if(partRows.length){
        var dk=cvRmKey(id,b.id);
        respBlocks.push('<details class="xdd" data-cvd="'+esc(dk)+'"'+(CV.dopen[dk]?' open':'')+'><summary>'+esc(b.name)+' &mdash; responses and marks ('+ansParts+' answered)</summary>'+
          '<div class="tw"><table class="res plist"><tr><th>Part</th><th>Response</th><th>Mark</th><th></th></tr>'+partRows.join('')+'</table></div></details>');
      }
    });
    var hist=(d.hist||[]).slice().sort(function(a,b){return (b.at||0)-(a.at||0)});
    hist.forEach(function(h){if(h.at&&h.at>lastTs)lastTs=h.at});
    var sumParts=[];
    sumParts.push(doneCount+' submitted');
    sumParts.push(progCount+' in progress');
    sumParts.push(totQ+' question'+(totQ===1?'':'s')+' answered ('+totParts+' part'+(totParts===1?'':'s')+(totWords?', '+totWords+' words':'')+')');
    if(unmarked)sumParts.push(unmarked+' unmarked answer'+(unmarked===1?'':'s'));
    if(hist.length)sumParts.push(hist.length+' earlier attempt'+(hist.length===1?'':'s'));
    if(lastTs)sumParts.push('Last active '+fmtD(lastTs));
    var out='<div class="cv-prog-sum"><span><b>Progress report:</b> '+esc(sumParts.join(' · '))+'</span>'+
      '<button class="nb sm ol" data-cv="progrefresh" data-id="'+esc(id)+'" data-sys="'+(isSystem?'1':'0')+'" type="button"'+(run&&run.loading?' disabled':'')+'>'+(run&&run.loading?'Refreshing...':'Refresh')+'</button></div>';
    if(!paperRows.length&&!hist.length){
      out+='<p class="mut">No papers started or answers saved yet.</p>';
      return out;
    }
    if(paperRows.length){
      out+='<label>Current and submitted papers ('+paperRows.length+')</label>'+
        '<div class="tw"><table class="res plist"><tr><th>Paper</th><th>Status</th><th>Work done</th><th>Mark</th><th></th></tr>'+paperRows.join('')+'</table></div>'+
        respBlocks.join('');
    }
    if(hist.length){
      out+='<label>Earlier attempts ('+hist.length+')</label>'+
        '<div class="tw"><table class="res plist"><tr><th>Paper</th><th>Finished</th><th>Assessed marks</th><th></th></tr>'+
        hist.map(function(h){
          return '<tr><td><b>'+esc(h.name||('Paper '+h.id))+'</b></td><td>'+fmtD(h.at)+'</td><td><b>'+h.T+' / '+h.M+'</b>'+(h.M?' <span class="mut">('+Math.round(100*h.T/h.M)+'%)</span>':'')+(h.pending?' <span class="mut">&middot; '+h.pending+' unscored</span>':'')+'</td>'+
            '<td class="ra"><a class="nb sm ol" href="#/class/'+esc(h.id)+'/1">Class paper</a> <a class="nb sm ol" href="#/'+esc(h.id)+'/review/1">Review paper</a></td></tr>';
        }).join('')+'</table></div>';
    }
    return out;
  });
}
function cvMemberSub(id){
  if(!CV.over||!CV.over.papers)return '';
  var tags=[];
  cvBanks().forEach(function(b){
    var list=CV.over.papers[b.id]||[];
    list.forEach(function(x){if(x.id===id)tags.push(b.name+': '+x.status)});
  });
  return tags.length?'<br><small class="mut">'+esc(tags.join(' · '))+'</small>':'';
}
function cvRosterHTML(){
  var r=CV.roster;if(!r)return '';
  var canProg=!!(r.admin||(CV.st&&(CV.st.admin||CV.st.classAdmin)));
  return '<h2 class="pt" style="margin-top:18px">People ('+r.members.length+')</h2>'+
    '<ul class="cv-people">'+r.members.map(function(m){
      var open=canProg&&CV.pview===m.id;
      return '<li class="cv-person"><div class="cv-prow"><span class="cv-pav">'+profileAvatarHTML(m.mine?S.photo||m.photo:m.photo,m.id,40,m.name)+'</span><span class="cv-pname2">'+esc(m.name)+(m.mine?' <span class="mut">(you)</span>':'')+(canProg?cvMemberSub(m.id):'')+'</span>'+
        (canProg?'<button class="nb sm ol" data-cv="prog" data-id="'+esc(m.id)+'" type="button" aria-expanded="'+open+'">'+(open?'Close':'Progress')+'</button>':'')+'</div>'+
        (open?'<div class="cv-edit cv-prog">'+cvProgHTML(m.id,false)+'</div>':'')+'</li>';
    }).join('')+'</ul>';
}
function cvSetName(id,name){
  CV.photoMsg='Saving name...';cvDraw();
  cvApi({action:'setname',memberId:id,name:name}).then(function(x){
    (CV.roster.members||[]).forEach(function(m){if(m.id===id)m.name=x.name});CV.photoMsg='Name saved.';cvDraw();
  }).catch(function(e){CV.photoMsg=e.message;cvDraw()});
}
/* Platform admin: every account on the site. View progress report, edit name, photo and class membership, or delete the account. */
function cvAdminHTML(){
  if(!CV.st||!CV.st.admin)return '';
  var u=CV.users;
  var h='<h2 class="pt" style="margin-top:22px">All accounts'+(u?' ('+u.length+')':'')+'</h2><p class="mut">You are an admin. These are every account on the site.</p>';
  if(!u)return h+'<p class="mut">Loading accounts...</p>'+(CV.amsg?'<p class="acmsg" role="alert">'+esc(CV.amsg)+'</p>':'');
  h+='<ul class="cv-people cv-accts">'+u.map(function(a){
    var open=CV.aedit===a.id,popen=CV.apview===a.id,del=CV.adel===a.id;
    var row='<li class="cv-person"><div class="cv-prow"><span class="cv-pav">'+profileAvatarHTML(a.photo,a.id,40,a.name||a.email)+'</span><span class="cv-pname2">'+esc(a.name||'(no name)')+'<br><small class="mut">'+esc(a.email)+(a.inClass?' &middot; in class':' &middot; not in class')+'</small></span>'+
      '<button class="nb sm ol" data-cv="aprog" data-id="'+esc(a.id)+'" type="button" aria-expanded="'+popen+'">'+(popen?'Close':'Progress')+'</button>'+
      '<button class="nb sm ol" data-cv="aedit" data-id="'+esc(a.id)+'" type="button" aria-expanded="'+open+'">'+(open?'Close':'Edit')+'</button></div>';
    if(popen)row+='<div class="cv-edit cv-prog">'+cvProgHTML(a.id,true)+'</div>';
    if(open)row+='<div class="cv-edit"><label for="cvanm">Name</label><div class="cv-erow"><input id="cvanm" data-id="'+esc(a.id)+'" maxlength="40" value="'+esc(CV.draft[a.id]!=null?CV.draft[a.id]:a.name)+'" autocomplete="off"><button class="nb sm" data-cv="aname" data-id="'+esc(a.id)+'" type="button">Save name</button></div>'+
      '<label>Photo</label><div class="cv-erow"><span class="cv-pav">'+profileAvatarHTML(a.photo,a.id,56,a.name||a.email)+'</span><button class="nb sm ol" data-cv="aphoto" data-id="'+esc(a.id)+'" type="button">Upload new photo</button>'+(a.photo?'<button class="nb sm ol" data-cv="aphotoclear" data-id="'+esc(a.id)+'" type="button">Remove photo</button>':'')+'</div>'+
      '<label>Class</label><div class="cv-erow"><button class="nb sm ol" data-cv="aclass" data-id="'+esc(a.id)+'" data-on="'+(a.inClass?'0':'1')+'" type="button">'+(a.inClass?'Remove from class':'Add to class')+'</button></div>'+
      '<label>Account</label>'+(del?'<div class="cv-erow"><input id="cvadc" placeholder="Type '+esc(a.email)+' to confirm" autocomplete="off"><button class="nb sm bad" data-cv="adelgo" data-id="'+esc(a.id)+'" data-email="'+esc(a.email)+'" type="button">Delete forever</button><button class="nb sm ol" data-cv="adel" data-id="" type="button">Cancel</button></div><p class="mut">This removes the account, its saved papers, backups, photo and class membership. It cannot be undone.</p>':'<div class="cv-erow"><button class="nb sm ol" data-cv="adel" data-id="'+esc(a.id)+'" type="button">Delete account...</button></div>')+
      '</div>';
    return row+'</li>';
  }).join('')+'</ul>'+(CV.amsg?'<p class="acmsg'+(CV.aok?' ok':'')+'" role="status">'+esc(CV.amsg)+'</p>':'')+'<input id="cvaphoto" type="file" accept="image/jpeg,image/png,image/webp" hidden>';
  return h;
}
function cvAdm(body,after){
  CV.amsg='Saving...';CV.aok=true;cvDraw();
  cvApi(body).then(function(r){if(body.action==='admin_name')delete CV.draft[body.memberId];CV.amsg=body.action==='admin_name'?'Name saved as '+r.name+'.':'Saved.';CV.aok=true;after&&after(r);cvDraw();cvAdminRefresh()}).catch(function(e){CV.amsg=e.message;CV.aok=false;cvDraw()});
}
function cvAdminRefresh(){cvApi({action:'admin_users'}).then(function(o){CV.users=o.users;cvDraw()}).catch(function(){});cvApi({action:'roster'}).then(function(o){CV.roster=o;cvDraw()}).catch(function(){})}
document.addEventListener('input',function(ev){var el=ev.target;if(el&&el.id==='cvanm')CV.draft[el.getAttribute('data-id')]=el.value});
document.addEventListener('change',function(ev){
  var el=ev.target;if(!el||el.id!=='cvaphoto')return;
  var f=el.files&&el.files[0];el.value='';
  cvCrop(f,function(photo){cvAdm({action:'admin_photo',memberId:CV.aedit,photo:photo})},function(m){CV.amsg=m;cvDraw()});
});
function cvSetPhoto(id,photo){
  CV.photoMsg='Saving photo...';cvDraw();
  cvApi({action:'setphoto',memberId:id,photo:photo}).then(function(){
    (CV.roster.members||[]).forEach(function(m){if(m.id===id)m.photo=photo});CV.photoMsg=photo?'Photo saved.':'Photo removed.';cvDraw();
  }).catch(function(e){CV.photoMsg=e.message;cvDraw()});
}
function cvCrop(file,ok,bad){
  if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024)return bad('Choose a JPEG, PNG or WebP image smaller than 10 MB.');
  var url=URL.createObjectURL(file),img=new Image();
  img.onerror=function(){URL.revokeObjectURL(url);bad('This image could not be opened.')};
  img.onload=function(){
    URL.revokeObjectURL(url);
    try{
      var c=document.createElement('canvas');c.width=128;c.height=128;
      var x=c.getContext('2d'),side=Math.min(img.naturalWidth,img.naturalHeight);
      x.fillStyle='#fff';x.fillRect(0,0,128,128);
      x.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,128,128);
      ok(c.toDataURL('image/jpeg',0.8));
    }catch(e){bad('This image could not be prepared.')}
  };
  img.src=url;
}
function cvCropFile(file,id){cvCrop(file,function(p){cvSetPhoto(id,p)},function(m){CV.photoMsg=m;cvDraw()})}
document.addEventListener('change',function(ev){
  var el=ev.target;if(!el||el.id!=='cvphoto')return;
  var f=el.files&&el.files[0];el.value='';cvCropFile(f,CV.photoFor);
});
function cvPg(inner){return '<div class="pg"><h1 class="pt">Class</h1>'+inner+'</div>'}
function cvClassSkeletonHTML(){
  var rows='';
  for(var i=0;i<4;i++){
    rows+='<li class="cv-person"><div class="cv-prow">'+
      '<span class="cv-skel-avatar cv-shimmer"></span>'+
      '<div class="cv-skel-col"><div class="cv-skel-line cv-shimmer '+(i%2===0?'w40':'w60')+'" style="height:14px"></div><div class="cv-skel-line cv-shimmer w20" style="height:10px"></div></div>'+
      '<span class="cv-skel-btn cv-shimmer" style="width:72px;height:28px;margin-left:auto"></span>'+
      '</div></li>';
  }
  var papers=cvBanks().map(function(b){
    return '<div class="cv-skel-paper cv-shimmer"><div class="cv-skel-line w80" style="height:14px"></div><div class="cv-skel-line w40" style="height:11px"></div></div>';
  }).join('');
  return '<div class="cv-skel-wrap" aria-busy="true" aria-label="Loading your class">'+
    '<div class="cv-loading-bar"><span class="cv-spinner"></span><span>Loading your class...</span></div>'+
    '<div class="feature cv-skel-feature">'+
      '<div class="cv-skel-head-row"><span class="cv-skel-pill cv-shimmer"></span><span class="cv-skel-line cv-shimmer w30" style="margin:0;height:16px"></span></div>'+
      '<div class="cv-skel-line cv-shimmer w95"></div>'+
      '<div class="cv-skel-line cv-shimmer w80"></div>'+
      '<div class="cv-skel-line cv-shimmer w60"></div>'+
      '<div class="acts" style="margin-top:14px"><span class="cv-skel-btn cv-shimmer"></span></div>'+
    '</div>'+
    '<h2 class="pt" style="margin-top:18px"><span class="cv-skel-line cv-shimmer w20" style="display:inline-block;height:22px;margin:0"></span></h2>'+
    '<ul class="cv-people cv-skel-people">'+rows+'</ul>'+
    '<h2 class="pt" style="margin-top:22px"><span class="cv-skel-line cv-shimmer w20" style="display:inline-block;height:22px;margin:0"></span></h2>'+
    '<div class="cv-skel-line cv-shimmer w60" style="margin-bottom:14px"></div>'+
    '<div class="cv-skel-acts">'+papers+'</div>'+
  '</div>';
}
function cvHTML(){
  if(!S.tok)return cvPg('<div class="feature"><p><b>Sign in to see your class.</b> <a href="#/account">Open Account</a>. When you create an account, enter your name and the class code.</p></div>');
  if(CV.st===null){
    loadCVCache();
    if(CV.st===null)return cvPg(cvClassSkeletonHTML()+(CV.msg?'<p class="acmsg" role="alert">'+esc(CV.msg)+'</p>':''));
  }
  if(!CV.st.configured)return cvPg('<div class="feature"><p>The class has not been set up on this site yet. The site owner needs to set the class code.</p></div>');
  if(!CV.st.member)return cvPg(cvJoinHTML()+cvAdminHTML());
  var b=cvBanks().filter(function(x){return x.id===CV.bank})[0];
  if(!b){
    var h='<div class="feature"><p>You are in the class as <b>'+esc(CV.st.name)+'</b> with '+CV.st.count+' member'+(CV.st.count===1?'':'s')+'. Everyone in the class can see each other\'s written answers by name, from practice mode as you save them and from exam mode once submitted. Multiple choice and diagrams are not shared.</p>'+
      '<div class="acts"><button class="nb sm ol" data-cv="rename" type="button">Change my name</button></div></div>';
    h+=cvRosterHTML()+cvAdminHTML();
    h+='<h2 class="pt" style="margin-top:18px">Papers</h2><p class="mut">Open a paper to read every question as it appears in the exam, with what your class wrote under each written part.</p><div class="acts">'+cvBanks().map(function(x){
      var n=CV.over&&CV.over.counts&&CV.over.counts[x.id]||0;
      return '<a class="nb ol" href="#/class/'+esc(x.id)+'/1">'+esc(x.name)+'<small>'+n+' shared</small></a>';
    }).join('')+'</div>';
    if(CV.msg)h+='<p class="acmsg" role="alert">'+esc(CV.msg)+'</p>';
    return cvPg(h);
  }
  var head='<div class="cvbar"><div class="cv-crumb"><a href="#/class" class="cv-back">&larr; All papers</a> <span class="cv-sep">/</span> <b class="cv-pname">'+esc(b.name)+'</b></div>'+
    (CV.ans&&CV.ansBank===b.id?'<div class="cv-stats"><span class="cv-pill">'+CV.ans.submitted.length+' of '+CV.ans.members+' shared</span>'+
      (CV.ans.submitted.length?' <span class="cv-members">('+CV.ans.submitted.map(function(s){return esc(s.mine?'You':s.name)}).join(', ')+')</span>':'')+'</div>':'')+'</div>'+
    (CV.msg?'<p class="acmsg" role="alert">'+esc(CV.msg)+'</p>':'');
  var body=(CV.ansBank!==b.id||!CV.ans)&&!CV.msg?'<p>Loading class answers...</p>':'';
  return '<main class="ex cv-main" id="qarea">'+head+cvQuestionHTML(b,CV.n)+body+'</main>';
}
function cvJoinHTML(){
  return '<div class="feature"><h2 class="pt">Join your class</h2><p>Enter your name and the class code from your teacher. Classmates see your name next to your submitted written answers.</p>'+
    '<form class="acform" onsubmit="return false"><label for="cvname">Your name</label><input id="cvname" maxlength="40" autocomplete="name">'+
    '<label for="cvcode">Class code</label><input id="cvcode" autocomplete="off" maxlength="60">'+
    '<div class="acmsg" role="alert">'+esc(CV.msg)+'</div><div class="acts"><button class="nb" data-cv="join" type="button"'+(CV.joining?' disabled':'')+'>'+(CV.joining?'Joining...':'Join class')+'</button></div></form></div>';
}
function cvList(items,fn){return items&&items.length?items.map(fn).join(''):''}
function cvWho(r,letters){return (letters||[]).map(function(l){return esc(r.names&&r.names[l]||l)}).join(', ')}
function cvResultHTML(res){
  var r=res.result||{},h='<div class="cvres">';
  if(r.combined)h+='<div class="cvbest">'+esc(r.combined).replace(/\n/g,'<br>')+'</div><p class="mut">About '+cvPlain(r.combined).split(' ').length+' words (target '+res.targetWords+').</p>';
  if(res.keyword)h+='<p class="mut">NESA key word: <b>'+esc(res.keyword.word)+'</b> &mdash; '+esc(res.keyword.meaning)+'</p>';
  if(r.directive)h+='<p><b>What the question asks:</b> '+esc(r.directive)+'</p>';
  h+='<details class="xdd"><summary>Main points and gaps</summary><ul class="cvpts">'+cvList(r.mainPoints,function(p){
    var tag=p.answersQuestion==='yes'?'Answers the question':p.answersQuestion==='partly'?'Partly answers':'Off the question';
    return '<li><b>'+esc(p.point)+'</b> <span class="pill '+(p.answersQuestion==='yes'?'ok':p.answersQuestion==='partly'?'part':'bad')+'">'+tag+'</span>'+
      (p.syllabus?'<br><span class="mut">Syllabus: '+esc(p.syllabus)+'</span>':'')+
      '<br><span class="mut">Made by '+cvWho(res,p.madeBy)+'</span>'+(p.why?'<br>'+esc(p.why):'')+
      cvList(p.quotes,function(q){return '<blockquote class="cvquote">&ldquo;'+esc(q.text)+'&rdquo; <span class="mut">'+esc(res.names&&res.names[q.who]||q.who)+'</span></blockquote>'})+'</li>';
  })+'</ul>';
  if(r.missed&&r.missed.length)h+='<p class="gh"><b>Missed by the class</b></p><ul>'+r.missed.map(function(m){return '<li>'+esc(m)+'</li>'}).join('')+'</ul>';
  h+='</details>';
  return h+'</div>';
}
document.addEventListener('click',function(ev){
  var el=ev.target.closest&&ev.target.closest('[data-cv]');if(!el)return;
  var a=el.getAttribute('data-cv');
  if(a==='prog'){var pid=el.getAttribute('data-id');CV.pview=CV.pview===pid?'':pid;if(CV.pview&&!CV.prog[pid])cvLoadProg(pid,false);else cvDraw();return}
  if(a==='aprog'){var apid=el.getAttribute('data-id');CV.apview=CV.apview===apid?'':apid;CV.aedit='';CV.adel='';CV.amsg='';if(CV.apview&&!CV.prog[apid])cvLoadProg(apid,true);else cvDraw();return}
  if(a==='remark'){cvRemark(el.getAttribute('data-id'),el.getAttribute('data-sys')==='1',el.getAttribute('data-b'),el.getAttribute('data-mode')||'one',el.getAttribute('data-k')||'');return}
  if(a==='progrefresh'){cvLoadProg(el.getAttribute('data-id'),el.getAttribute('data-sys')==='1');return}
  if(a==='aedit'){var ai=el.getAttribute('data-id');CV.aedit=CV.aedit===ai?'':ai;CV.apview='';CV.adel='';CV.amsg='';cvDraw();return}
  if(a==='aname'){cvAdm({action:'admin_name',memberId:el.getAttribute('data-id'),name:(document.getElementById('cvanm')||{}).value||''});return}
  if(a==='aphoto'){var fa=document.getElementById('cvaphoto');if(fa)fa.click();return}
  if(a==='aphotoclear'){cvAdm({action:'admin_photo',memberId:el.getAttribute('data-id'),photo:''});return}
  if(a==='aclass'){cvAdm({action:'admin_class',memberId:el.getAttribute('data-id'),inClass:el.getAttribute('data-on')==='1'});return}
  if(a==='adel'){CV.adel=el.getAttribute('data-id');cvDraw();return}
  if(a==='adelgo'){cvAdm({action:'admin_delete',memberId:el.getAttribute('data-id'),confirmEmail:(document.getElementById('cvadc')||{}).value||''},function(){CV.adel='';CV.aedit=''});return}
  if(a==='edit'){var eid=el.getAttribute('data-id');CV.editing=CV.editing===eid?'':eid;CV.photoMsg='';cvDraw();return}
  if(a==='savename'){cvSetName(el.getAttribute('data-id'),(document.getElementById('cvnm')||{}).value||'');return}
  if(a==='photo'){CV.photoFor=el.getAttribute('data-id');var fi=document.getElementById('cvphoto');if(fi)fi.click();return}
  if(a==='photoclear'){cvSetPhoto(el.getAttribute('data-id'),'');return}
  if(a==='goq'){location.hash='#/class/'+CV.bank+'/'+(+el.getAttribute('data-n')||1);return}
  if(a==='toggle'){var k=el.getAttribute('data-k');CV.open[k]=CV.open[k]===false;cvDraw();return}
  if(a==='join'){
    var nm=(document.getElementById('cvname')||{}).value||'',cd=(document.getElementById('cvcode')||{}).value||'';
    CV.joining=true;CV.msg='';cvDraw();
    cvApi({action:'join',name:nm,code:cd}).then(function(r){
      if(!CV.st)CV.st={configured:true};
      CV.st.member=true;CV.st.name=r&&r.name||nm;CV.joining=false;
      saveCVCache();cvDraw();
      cvStatus(true).then(classBind);
    }).catch(function(e){CV.joining=false;CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='rename'){
    var n=window.prompt?window.prompt('Your name as classmates see it',CV.st&&CV.st.name):null;
    if(n)cvApi({action:'rename',name:n}).then(function(r){CV.st.name=r.name;saveCVCache();CV.ans=null;CV.ansBank='';cvDraw();classBind()}).catch(function(e){CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='analyse')cvAnalyse(el.getAttribute('data-b')||CV.bank,el.getAttribute('data-k'),+el.getAttribute('data-q'),+el.getAttribute('data-p'));
});

/* Live presence heartbeat. Tells the server this tab is open and reads back who else is (server clock only, see prSeen in helpers.js).
   Only a signed-in class member sends it, only while the tab is visible, and every failure is silent: the page then simply
   makes no presence claim. Switched off site-wide with DISABLE_PRESENCE. */
var PRX={timer:0,busy:false,last:0,fails:0,sig:'',started:false,blocked:false};
function prSig(){
  var out=[];
  Object.keys(PR.list).forEach(function(id){var s=prSeen(id);if(s&&s.online)out.push(id+':'+s.bank)});
  return (prKnown()?'k':'u')+out.sort().join(',');
}
function prRedraw(){
  if(typeof trialAvatarsHTML!=='function')return;
  Array.prototype.forEach.call(document.querySelectorAll('.notion-presence-slot'),function(el){
    var b=BANKS.filter(function(x){return x.id===el.getAttribute('data-b')})[0];
    if(!b)return;
    var open=!!el.querySelector('.notion-avatars.pop-open');
    el.innerHTML=trialAvatarsHTML(b,el.getAttribute('data-inline')==='1');
    if(open){var av=el.querySelector('.notion-avatars');if(av)av.classList.add('pop-open')}
  });
}
function prCanBeat(){return !!S.tok&&!!CV.st&&!!CV.st.member&&!PRX.blocked&&!/[?&]archive=1\b/.test(location.search)}
function prNext(ms){clearTimeout(PRX.timer);PRX.timer=setTimeout(prBeat,ms)}
function prBeat(){
  if(!prCanBeat()){prNext(30000);return}
  if(document.visibilityState==='hidden'){prNext(30000);return}
  if(PRX.busy)return;
  PRX.busy=true;PRX.last=Date.now();
  cvApi({action:'presence',bank:prHereBank()}).then(function(r){
    var m={};(r.online||[]).forEach(function(o){if(o&&typeof o.id==='string'&&typeof o.ageMs==='number')m[o.id]={age:o.ageMs,bank:typeof o.bank==='string'?o.bank:''}});
    PR.list=m;PR.recv=Date.now();PR.disabled=!!r.disabled;PRX.fails=0;
  }).catch(function(e){
    PRX.fails++;
    if(e&&(e.status===401||e.status===403))PRX.blocked=true;
  }).then(function(){
    PRX.busy=false;
    var sig=prSig();
    if(sig!==PRX.sig){PRX.sig=sig;prRedraw()}
    prNext(Math.min(25000*Math.pow(2,PRX.fails),120000));
  });
}
function prStart(){
  if(PRX.started||!prCanBeat())return;
  PRX.started=true;
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&Date.now()-PRX.last>5000)prNext(0)});
  window.addEventListener('hashchange',function(){if(Date.now()-PRX.last>4000)prNext(300)});
  window.addEventListener('pageshow',function(e){if(e.persisted)prNext(0)});
  window.addEventListener('pagehide',function(){
    if(!prCanBeat()||PR.disabled)return;
    try{fetch('/api/class',{method:'POST',keepalive:true,headers:{'content-type':'application/json',authorization:'Bearer '+S.tok},body:JSON.stringify({action:'presence',off:true})}).catch(function(){})}catch(e){}
  });
  prNext(0);
}
