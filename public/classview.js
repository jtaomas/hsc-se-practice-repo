/* Class answers: the Class page and the class panel under each written part in review and practice. Server side: api/class.js. */
var CV={st:null,msg:'',bank:'',over:null,ans:null,ansBank:'',ansAt:0,loadSt:false,loadAns:false,run:{},res:{},open:{},joining:false};
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
  return cvApi({action:'status'}).then(function(r){CV.st=r;return r.member?cvApi({action:'overview'}).then(function(o){CV.over=o}).catch(function(){}):null}).catch(function(e){CV.st={configured:true,member:false};CV.msg=e.message}).then(function(){CV.loadSt=false;cvDraw()});
}
function cvLoadAnswers(id,quiet){
  if(CV.loadAns)return Promise.resolve();
  CV.loadAns=true;if(!quiet){CV.ans=null;CV.ansBank=''}
  return cvApi({action:'answers',bankId:id}).then(function(r){CV.ans=r;CV.ansBank=id;CV.ansAt=Date.now();CV.msg=''}).catch(function(e){CV.msg=e.message}).then(function(){CV.loadAns=false;cvDraw()});
}
/* Called after a question is drawn: loads the class state once and keeps the panels fresh. */
function classEnsure(b){
  if(!S.tok||!b||!document.querySelector('.cvslot'))return;
  if(CV.st===null){if(!CV.loadSt)cvStatus().then(function(){classEnsure(b)});return}
  if(CV.st.member&&(CV.ansBank!==b.id||Date.now()-CV.ansAt>60000)&&!CV.loadAns)cvLoadAnswers(b.id,CV.ansBank===b.id);
}
function cvDraw(){
  var r=document.getElementById('cvroot');if(r&&/^#\/class/.test(location.hash))r.innerHTML=cvHTML();
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
  var k=bankId+'|'+key,r=CV.res[k],run=CV.run[k],isOpen=CV.open[k],busy=run&&!run.err;
  var h='<div class="cvhd"><b>Class answers</b> <span class="mut">('+list.length+' shared)</span></div><div class="acts">'+
    (list.length?'<button class="nb sm ol" data-cv="toggle" data-k="'+esc(k)+'" type="button">'+(isOpen?'Hide':'Show')+' answers</button>':'')+
    (list.length>=2?'<button class="nb sm" data-cv="analyse" data-b="'+esc(bankId)+'" data-k="'+esc(k)+'" data-q="'+qn+'" data-p="'+pi+'" type="button"'+(busy?' disabled':'')+'>'+(busy?'Analysing...':(r?'Run analysis again':'Analyse class answers'))+'</button>':'<span class="mut">'+(list.length?'Needs at least 2 shared answers to analyse.':'No one has shared an answer to this part yet.')+'</span>')+'</div>';
  if(run&&run.err)h+='<p class="acmsg" role="alert">'+esc(run.err)+'</p>';
  if(r)h+=cvResultHTML(r);
  if(isOpen)h+=list.map(function(a){return '<div class="cvans"><div class="cvwho">'+esc(a.mine?'You':a.name)+'</div><div class="cvtxt">'+esc(a.text).replace(/\n/g,'<br>')+'</div></div>'}).join('');
  return h;
}
function classPage(bankId){
  CV.bank=cvBanks().some(function(b){return b.id===bankId})?bankId:CV.bank;
  CUR={b:null,n:0};
  return frame('Class','<div class="pg"><h1 class="pt">Class</h1><div id="cvroot">'+cvHTML()+'</div></div>');
}
function classBind(){
  if(!S.tok)return;
  cvStatus().then(function(){if(CV.st&&CV.st.member&&CV.bank&&(CV.ansBank!==CV.bank||Date.now()-CV.ansAt>60000))cvLoadAnswers(CV.bank,CV.ansBank===CV.bank)});
}
function cvHTML(){
  if(!S.tok)return '<div class="feature"><p><b>Sign in to see your class.</b> <a href="#/account">Open Account</a>. When you create an account, enter your name and the class code.</p></div>';
  var lock=typeof examLock==='function'?examLock():null;
  if(lock)return '<div class="feature"><p><b>Class answers are locked while you sit an exam.</b></p><p>Submit '+esc(lock.name)+' or wait for its working time to end.</p><div class="acts"><a class="nb" href="#/'+esc(lock.id)+'/q/'+(BS(lock.id).cur||1)+'">Return to the exam</a></div></div>';
  if(CV.st===null)return '<div class="feature"><p>Loading your class...</p></div>'+(CV.msg?'<p class="mut">'+esc(CV.msg)+'</p>':'');
  if(!CV.st.configured)return '<div class="feature"><p>The class has not been set up on this site yet. The site owner needs to set the class code.</p></div>';
  if(!CV.st.member)return cvJoinHTML();
  var h='<div class="feature"><p>You are in the class as <b>'+esc(CV.st.name)+'</b> with '+CV.st.count+' member'+(CV.st.count===1?'':'s')+'. Everyone in the class can see each other\'s written answers by name, from practice mode as you save them and from exam mode once submitted. Multiple choice and diagrams are not shared.</p>'+
    '<div class="acts"><button class="nb sm ol" data-cv="rename" type="button">Change my name</button></div></div>';
  h+='<h2 class="pt" style="margin-top:18px">Papers</h2><div class="acts">'+cvBanks().map(function(b){
    var n=CV.over&&CV.over.counts&&CV.over.counts[b.id]||0;
    return '<button class="nb'+(CV.bank===b.id?'':' ol')+'" data-cv="bank" data-id="'+esc(b.id)+'" type="button">'+esc(b.name)+'<small>'+n+' shared</small></button>';
  }).join('')+'</div>';
  if(CV.msg)h+='<p class="acmsg" role="alert">'+esc(CV.msg)+'</p>';
  if(!CV.bank)return h+'<p class="mut">Choose a paper to see what the class wrote. To read the sample answer and your own marking beside it, use <a href="#/review">Review</a>.</p>';
  var b=cvBanks().filter(function(x){return x.id===CV.bank})[0];if(!b)return h;
  if(CV.ansBank!==b.id||!CV.ans)return h+'<p>Loading class answers...</p>';
  h+='<p class="mut">'+CV.ans.submitted.length+' of '+CV.ans.members+' members have shared answers for this paper'+(CV.ans.submitted.length?': '+CV.ans.submitted.map(function(s){return esc(s.mine?'You':s.name)}).join(', '):'')+'.</p>';
  b.qs.forEach(function(q,qi){
    q.it.forEach(function(it,pi){
      var key=(qi+1)+'.'+pi,list=CV.ans.parts[key];if(!list||!cvOpenItem(it))return;
      h+='<div class="feature cvpart" style="margin-top:14px"><div class="cvhd"><b>Question '+(qi+1)+(q.it.length>1?' part '+(pi+1):'')+'</b></div>'+
        '<div class="cvq">'+esc(cvPlain(it.q||'').slice(0,600))+'</div><div class="cvbox">'+cvPartBody(b.id,key,qi+1,pi,list)+'</div></div>';
    });
  });
  return h;
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
  if(res.keyword)h+='<p class="mut">NESA key word: <b>'+esc(res.keyword.word)+'</b> &mdash; '+esc(res.keyword.meaning)+'</p>';
  if(r.directive)h+='<p><b>What the question asks:</b> '+esc(r.directive)+'</p>';
  h+='<h3>Main points the class made</h3><ul class="cvpts">'+cvList(r.mainPoints,function(p){
    var tag=p.answersQuestion==='yes'?'Answers the question':p.answersQuestion==='partly'?'Partly answers':'Off the question';
    return '<li><b>'+esc(p.point)+'</b> <span class="pill '+(p.answersQuestion==='yes'?'ok':p.answersQuestion==='partly'?'part':'bad')+'">'+tag+'</span>'+
      (p.syllabus?'<br><span class="mut">Syllabus: '+esc(p.syllabus)+'</span>':'')+
      '<br><span class="mut">Made by '+cvWho(res,p.madeBy)+'</span>'+(p.why?'<br>'+esc(p.why):'')+
      cvList(p.quotes,function(q){return '<blockquote class="cvquote">&ldquo;'+esc(q.text)+'&rdquo; <span class="mut">'+esc(res.names&&res.names[q.who]||q.who)+'</span></blockquote>'})+'</li>';
  })+'</ul>';
  if(r.missed&&r.missed.length)h+='<h3>Missed by the class</h3><ul>'+r.missed.map(function(m){return '<li>'+esc(m)+'</li>'}).join('')+'</ul>';
  if(r.combined)h+='<h3>Best combined answer</h3><div class="cvbest">'+esc(r.combined).replace(/\n/g,'<br>')+'</div><p class="mut">About '+cvPlain(r.combined).split(' ').length+' words (target about '+res.targetWords+'). Built only from points the class made, checked against the syllabus.</p>';
  return h+'</div>';
}
document.addEventListener('click',function(ev){
  var el=ev.target.closest&&ev.target.closest('[data-cv]');if(!el)return;
  var a=el.getAttribute('data-cv');
  if(a==='bank'){CV.bank=el.getAttribute('data-id');CV.msg='';cvDraw();classBind();return}
  if(a==='toggle'){var k=el.getAttribute('data-k');CV.open[k]=!CV.open[k];cvDraw();return}
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
  if(a==='analyse'){
    var key=el.getAttribute('data-k');if(CV.run[key]&&!CV.run[key].err)return;
    CV.run[key]={};cvDraw();
    cvApi({action:'analyse',bankId:el.getAttribute('data-b')||CV.bank,questionNumber:+el.getAttribute('data-q'),partIndex:+el.getAttribute('data-p')}).then(function(r){delete CV.run[key];CV.res[key]=r;cvDraw()}).catch(function(e){CV.run[key]={err:e.message};cvDraw()});
  }
});
