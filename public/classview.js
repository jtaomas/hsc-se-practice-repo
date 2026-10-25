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
var CV={n:1,st:null,msg:'',bank:'',over:null,ans:null,ansBank:'',ansAt:0,loadSt:false,loadAns:false,roster:null,photoMsg:'',photoFor:'',run:{},res:{},auto:{},open:{},joining:false};
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
function cvPlain(h){var d=document.createElement('div');d.innerHTML=String(h||'');return (d.textContent||'').replace(/\s+/g,' ').trim()}
function cvStatus(){
  if(CV.st!==null||CV.loadSt||!S.tok)return Promise.resolve();
  CV.loadSt=true;
  return cvApi({action:'status'}).then(function(r){CV.st=r;return r.member?Promise.all([cvApi({action:'overview'}).then(function(o){CV.over=o}).catch(function(){}),cvApi({action:'roster'}).then(function(o){CV.roster=o}).catch(function(){})]):null}).catch(function(e){CV.st={configured:true,member:false};CV.msg=e.message}).then(function(){CV.loadSt=false;cvDraw()});
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
function cvAutoBuild(b){
  if(!CV.ans||CV.ansBank!==b.id)return;
  Array.prototype.forEach.call(document.querySelectorAll('.cvslot'),function(el){
    if(el.getAttribute('data-b')!==b.id)return;
    var n=+el.getAttribute('data-n'),i=+el.getAttribute('data-i'),key=n+'.'+i,k=b.id+'|'+key,list=CV.ans.parts[key]||[];
    if(list.length<2||CV.res[k]||CV.run[k]||CV.auto[k])return;
    CV.auto[k]=1;cvAnalyse(b.id,k,n,i);
  });
}
/* Called after a question is drawn: loads the class state once and keeps the panels fresh. */
function classEnsure(b){
  if(!S.tok||!b||!document.querySelector('.cvslot'))return;
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
}
function classSlot(b,n,i){
  var it=b.qs[n-1].it[i];
  if(!S.tok||!cvOpenItem(it)||b.archived)return '';
  return '<div class="cvslot" data-b="'+esc(b.id)+'" data-n="'+n+'" data-i="'+i+'">'+cvSlotInner(b,n,i)+'</div>';
}
function cvSlotInner(b,n,i){
  if(CV.st===null)return '<div class="aib"><b>Class answers.</b> Loading...</div>';
  if(!CV.st.configured)return '';
  if(!CV.st.member)return '<div class="aib"><b>Class answers.</b> <a href="#/class">Join your class</a> with the class code to see what classmates wrote for this part.</div>';
  if(CV.msg&&CV.ansBank!==b.id)return '<div class="aib bad"><b>Class answers.</b> '+esc(CV.msg)+'</div>';
  if(CV.ansBank!==b.id||!CV.ans)return '<div class="aib"><b>Class answers.</b> Loading...</div>';
  var key=n+'.'+i;
  return '<div class="aib cvbox">'+cvPartBody(b.id,key,n,i,CV.ans.parts[key]||[])+'</div>';
}
/* Shared by the class page and the review panel. */
function cvPartBody(bankId,key,qn,pi,list){
  var k=bankId+'|'+key,r=CV.res[k],run=CV.run[k],isOpen=CV.open[k]!==false,busy=run&&!run.err;
  var bk=BANKS.filter(function(x){return x.id===bankId})[0],it=bk&&bk.qs[qn-1]&&bk.qs[qn-1].it[pi],code=!!it&&it.t!=='tx';
  /* The aggregator: always shown, so it is clear where the model answer will appear. */
  var g='<div class="cvagg"><div class="cvhd"><b>Class model answer</b></div>';
  if(r)g+=cvResultHTML(r);
  else if(busy)g+='<p class="mut">Building the class model answer...</p>';
  else g+='<p class="mut">The best points from everyone\'s answers, combined and checked against the syllabus.'+(list.length>=2?'':' It needs at least 2 shared answers ('+list.length+' so far).')+'</p>';
  if(run&&run.err)g+='<p class="acmsg" role="alert">'+esc(run.err)+'</p>';
  g+='<div class="acts">'+(list.length>=2?'<button class="nb sm" data-cv="analyse" data-b="'+esc(bankId)+'" data-k="'+esc(k)+'" data-q="'+qn+'" data-p="'+pi+'" type="button"'+(busy?' disabled':'')+'>'+(busy?'Building...':(r?'Rebuild model answer':'Build class model answer'))+'</button>':'')+'</div></div>';
  var h=g+'<div class="cvhd"><b>Class answers</b> <span class="mut">('+list.length+' shared)</span>'+
    (list.length?'<button class="nb sm ol" data-cv="toggle" data-k="'+esc(k)+'" type="button">'+(isOpen?'Hide':'Show')+' answers</button>':'')+'</div>';
  if(!list.length)h+='<p class="mut">No one has shared an answer to this part yet.</p>';
  else if(isOpen)h+=list.map(function(a){
    var wc=cvPlain(a.text).split(' ').filter(Boolean).length;
    var author=a.mine?'You':a.name;
    var pts=cvAnswerPoints(r,author,a.text);
    var ptsHTML='';
    if(pts&&pts.length){
      ptsHTML='<div class="cv-main-pts"><div class="cv-pts-head"><span class="cv-pts-title"><b>Main points in this response:</b></span>'+
        (r?'<span class="cv-badge">Syllabus assessed</span>':'<span class="cv-badge mut">Key points</span>')+'</div>'+
        '<ul class="cv-pts-list">'+pts.map(function(p){
          return '<li><b>'+esc(p.point)+'</b>'+
            (p.status?' <span class="pill '+(p.status==='yes'?'ok':p.status==='partly'?'part':'bad')+'">'+(p.status==='yes'?'Answers the question':p.status==='partly'?'Partly answers':'Off the question')+'</span>':'')+
            (p.why?'<br><span class="mut">'+esc(p.why)+'</span>':'')+'</li>';
        }).join('')+'</ul></div>';
    }
    return '<div class="cvans"><div class="cvwho"><span class="cv-name">'+profileAvatarHTML(a.mine?S.photo:a.photo,a.id||a.name,24,author)+' '+esc(author)+'</span><span class="cv-wc">'+wc+' word'+(wc===1?'':'s')+'</span></div>'+
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
  return '<div class="cvro">'+h+'</div>';
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
/* Everyone in the class, like a Google Classroom people list. Admins can change anyone's photo. */
function cvRosterHTML(){
  var r=CV.roster;if(!r)return '';
  var h='<h2 class="pt" style="margin-top:18px">People ('+r.members.length+')</h2>'+(r.admin?'<p class="mut">You are a class admin. You can change anyone\'s photo.</p>':'')+
    '<ul class="cv-people">'+r.members.map(function(m){
      return '<li class="cv-person"><span class="cv-pav">'+profileAvatarHTML(m.mine?S.photo||m.photo:m.photo,m.id,40,m.name)+'</span><span class="cv-pname2">'+esc(m.name)+(m.mine?' <span class="mut">(you)</span>':'')+'</span>'+
        (r.admin?'<span class="cv-padm"><button class="nb sm ol" data-cv="photo" data-id="'+esc(m.id)+'" type="button">Change photo</button>'+(m.photo?'<button class="nb sm ol" data-cv="photoclear" data-id="'+esc(m.id)+'" type="button">Remove</button>':'')+'</span>':'')+'</li>';
    }).join('')+'</ul>'+(r.admin?'<input id="cvphoto" type="file" accept="image/jpeg,image/png,image/webp" hidden>':'')+
    (CV.photoMsg?'<p class="acmsg" role="status">'+esc(CV.photoMsg)+'</p>':'');
  return h;
}
function cvSetPhoto(id,photo){
  CV.photoMsg='Saving photo...';cvDraw();
  cvApi({action:'setphoto',memberId:id,photo:photo}).then(function(){
    (CV.roster.members||[]).forEach(function(m){if(m.id===id)m.photo=photo});CV.photoMsg=photo?'Photo saved.':'Photo removed.';cvDraw();
  }).catch(function(e){CV.photoMsg=e.message;cvDraw()});
}
function cvCropFile(file,id){
  if(!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024){CV.photoMsg='Choose a JPEG, PNG or WebP image smaller than 10 MB.';cvDraw();return}
  var url=URL.createObjectURL(file),img=new Image();
  img.onerror=function(){URL.revokeObjectURL(url);CV.photoMsg='This image could not be opened.';cvDraw()};
  img.onload=function(){
    URL.revokeObjectURL(url);
    try{
      var c=document.createElement('canvas');c.width=128;c.height=128;
      var x=c.getContext('2d'),side=Math.min(img.naturalWidth,img.naturalHeight);
      x.fillStyle='#fff';x.fillRect(0,0,128,128);
      x.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,128,128);
      cvSetPhoto(id,c.toDataURL('image/jpeg',0.8));
    }catch(e){CV.photoMsg='This image could not be prepared.';cvDraw()}
  };
  img.src=url;
}
document.addEventListener('change',function(ev){
  var el=ev.target;if(!el||el.id!=='cvphoto')return;
  var f=el.files&&el.files[0];el.value='';cvCropFile(f,CV.photoFor);
});
function cvPg(inner){return '<div class="pg"><h1 class="pt">Class</h1>'+inner+'</div>'}
function cvHTML(){
  if(!S.tok)return cvPg('<div class="feature"><p><b>Sign in to see your class.</b> <a href="#/account">Open Account</a>. When you create an account, enter your name and the class code.</p></div>');
  if(CV.st===null)return cvPg('<div class="feature"><p>Loading your class...</p></div>'+(CV.msg?'<p class="mut">'+esc(CV.msg)+'</p>':''));
  if(!CV.st.configured)return cvPg('<div class="feature"><p>The class has not been set up on this site yet. The site owner needs to set the class code.</p></div>');
  if(!CV.st.member)return cvPg(cvJoinHTML());
  var b=cvBanks().filter(function(x){return x.id===CV.bank})[0];
  if(!b){
    var h='<div class="feature"><p>You are in the class as <b>'+esc(CV.st.name)+'</b> with '+CV.st.count+' member'+(CV.st.count===1?'':'s')+'. Everyone in the class can see each other\'s written answers by name, from practice mode as you save them and from exam mode once submitted. Multiple choice and diagrams are not shared.</p>'+
      '<div class="acts"><button class="nb sm ol" data-cv="rename" type="button">Change my name</button></div></div>';
    h+=cvRosterHTML();
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
  if(a==='photo'){CV.photoFor=el.getAttribute('data-id');var fi=document.getElementById('cvphoto');if(fi)fi.click();return}
  if(a==='photoclear'){cvSetPhoto(el.getAttribute('data-id'),'');return}
  if(a==='goq'){location.hash='#/class/'+CV.bank+'/'+(+el.getAttribute('data-n')||1);return}
  if(a==='toggle'){var k=el.getAttribute('data-k');CV.open[k]=CV.open[k]===false;cvDraw();return}
  if(a==='join'){
    var nm=(document.getElementById('cvname')||{}).value||'',cd=(document.getElementById('cvcode')||{}).value||'';
    CV.joining=true;CV.msg='';cvDraw();
    cvApi({action:'join',name:nm,code:cd}).then(function(){CV.st=null;CV.joining=false;cvDraw();classBind()}).catch(function(e){CV.joining=false;CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='rename'){
    var n=window.prompt?window.prompt('Your name as classmates see it',CV.st&&CV.st.name):null;
    if(n)cvApi({action:'rename',name:n}).then(function(r){CV.st.name=r.name;CV.ans=null;CV.ansBank='';cvDraw();classBind()}).catch(function(e){CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='analyse')cvAnalyse(el.getAttribute('data-b')||CV.bank,el.getAttribute('data-k'),+el.getAttribute('data-q'),+el.getAttribute('data-p'));
});
