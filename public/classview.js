/* Class page: classmates' submitted answers and the AI "best of the class" analysis. Server side: api/class.js. */
var CV={st:null,msg:'',bank:'',over:null,ans:null,loading:false,run:{},res:{},open:{},early:false,joining:false};
try{CV.early=localStorage.getItem('hscse:cv:early')==='1'}catch(e){}
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
function classPage(bankId){
  CV.bank=cvBanks().some(function(b){return b.id===bankId})?bankId:CV.bank;
  CUR={b:null,n:0};
  return frame('Class','<div class="pg"><h1 class="pt">Class</h1><div id="cvroot">'+cvHTML()+'</div></div>');
}
function classBind(){
  if(!S.tok)return;
  if(CV.st===null&&!CV.loading){
    CV.loading=true;
    cvApi({action:'status'}).then(function(r){CV.st=r;CV.loading=false;return r.member?cvLoadOverview():null}).catch(function(e){CV.loading=false;CV.st={configured:true,member:false};CV.msg=e.message}).then(cvDraw);
  }else if(CV.st&&CV.st.member){
    if(CV.bank&&!CV.ans&&!CV.loading)cvLoadAnswers(CV.bank);
  }
}
function cvLoadOverview(){return cvApi({action:'overview'}).then(function(r){CV.over=r})}
function cvLoadAnswers(id){
  CV.loading=true;CV.ans=null;cvDraw();
  return cvApi({action:'answers',bankId:id}).then(function(r){CV.ans=r;CV.loading=false;CV.msg=''}).catch(function(e){CV.loading=false;CV.msg=e.message}).then(cvDraw);
}
function cvDraw(){var r=document.getElementById('cvroot');if(r&&/^#\/class/.test(location.hash))r.innerHTML=cvHTML()}
function cvHTML(){
  if(!S.tok)return '<div class="feature"><p><b>Sign in to see your class.</b> <a href="#/account">Open Account</a>. When you create an account, enter your name and the class code.</p></div>';
  if(CV.st===null)return '<div class="feature"><p>Loading your class...</p></div>'+(CV.msg?'<p class="mut">'+esc(CV.msg)+'</p>':'');
  if(!CV.st.configured)return '<div class="feature"><p>The class has not been set up on this site yet. The site owner needs to set the class code.</p></div>';
  if(!CV.st.member)return cvJoinHTML();
  var h='<div class="feature"><p>You are in the class as <b>'+esc(CV.st.name)+'</b> with '+CV.st.count+' member'+(CV.st.count===1?'':'s')+'. Everyone in the class can see each other\'s submitted written answers, shown with names. Multiple choice and diagrams are not shared.</p>'+
    '<div class="acts"><button class="nb sm ol" data-cv="rename" type="button">Change my name</button></div></div>';
  h+='<div class="feature" style="margin-top:14px"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" id="cvearly"'+(CV.early?' checked':'')+' data-cv="early"> <span><b>Show classmates\' answers before I submit a paper.</b><br><span class="mut">Off by default so you attempt each paper first. Once you submit a paper its class answers always show.</span></span></label></div>';
  h+='<h2 class="pt" style="margin-top:18px">Papers</h2><div class="acts">'+cvBanks().map(function(b){
    var n=CV.over&&CV.over.counts&&CV.over.counts[b.id]||0;
    return '<button class="nb'+(CV.bank===b.id?'':' ol')+'" data-cv="bank" data-id="'+esc(b.id)+'" type="button">'+esc(b.name)+'<small>'+n+' submitted</small></button>';
  }).join('')+'</div>';
  if(CV.msg)h+='<p class="acmsg" role="alert">'+esc(CV.msg)+'</p>';
  if(!CV.bank)return h+'<p class="mut">Choose a paper to see what the class wrote.</p>';
  var b=cvBanks().filter(function(x){return x.id===CV.bank})[0];if(!b)return h;
  var mine=S.u[b.id]&&S.u[b.id].done;
  if(!mine&&!CV.early)return h+'<div class="feature" style="margin-top:14px"><p>Submit <b>'+esc(b.name)+'</b> first and the class answers will appear here. Or turn on the switch above to look before you submit.</p></div>';
  if(!CV.ans)return h+'<p>'+(CV.loading?'Loading class answers...':'')+'</p>';
  h+='<p class="mut">'+CV.ans.submitted.length+' of '+CV.ans.members+' members have submitted this paper'+(CV.ans.submitted.length?': '+CV.ans.submitted.map(function(s){return esc(s.mine?'You':s.name)}).join(', '):'')+'.</p>';
  b.qs.forEach(function(q,qi){
    q.it.forEach(function(it,pi){
      var key=(qi+1)+'.'+pi,list=CV.ans.parts[key];if(!list||!cvOpenItem(it))return;
      var k=b.id+'|'+key,r=CV.res[k],run=CV.run[k],isOpen=CV.open[k];
      h+='<div class="feature cvpart" style="margin-top:14px"><div class="cvhd"><b>Question '+(qi+1)+(q.it.length>1?' part '+(pi+1):'')+'</b> <span class="mut">('+list.length+' answer'+(list.length===1?'':'s')+')</span></div>';
      h+='<div class="cvq">'+cvPlain(it.q||it.p||'').slice(0,600).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</div>';
      h+='<div class="acts"><button class="nb sm ol" data-cv="toggle" data-k="'+esc(k)+'" type="button">'+(isOpen?'Hide':'Show')+' answers</button>'+
        (list.length>=2?'<button class="nb sm" data-cv="analyse" data-k="'+esc(k)+'" data-q="'+(qi+1)+'" data-p="'+pi+'" type="button"'+(run&&!run.err?' disabled':'')+'>'+(run&&!run.err?'Analysing...':(r?'Re-run analysis':'Analyse class answers'))+'</button>':'<span class="mut">Needs at least 2 answers to analyse.</span>')+'</div>';
      if(run&&run.err)h+='<p class="acmsg" role="alert">'+esc(run.err)+'</p>';
      if(r)h+=cvResultHTML(r);
      if(isOpen)h+=list.map(function(a){return '<div class="cvans"><div class="cvwho">'+esc(a.mine?'You':a.name)+'</div><div class="cvtxt">'+esc(a.text).replace(/\n/g,'<br>')+'</div></div>'}).join('');
      h+='</div>';
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
  if(a==='early'){CV.early=!!el.checked;try{localStorage.setItem('hscse:cv:early',CV.early?'1':'0')}catch(e){}cvDraw();return}
  if(a==='bank'){CV.bank=el.getAttribute('data-id');CV.ans=null;CV.msg='';cvDraw();classBind();return}
  if(a==='toggle'){var k=el.getAttribute('data-k');CV.open[k]=!CV.open[k];cvDraw();return}
  if(a==='join'){
    var nm=(document.getElementById('cvname')||{}).value||'',cd=(document.getElementById('cvcode')||{}).value||'';
    CV.joining=true;CV.msg='';cvDraw();
    cvApi({action:'join',name:nm,code:cd}).then(function(){CV.st=null;CV.joining=false;classBind()}).catch(function(e){CV.joining=false;CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='rename'){
    var n=window.prompt?window.prompt('Your name as classmates see it',CV.st&&CV.st.name):null;
    if(n)cvApi({action:'rename',name:n}).then(function(r){CV.st.name=r.name;CV.ans=null;classBind();cvDraw()}).catch(function(e){CV.msg=e.message;cvDraw()});
    return;
  }
  if(a==='analyse'){
    var key=el.getAttribute('data-k');if(CV.run[key]&&!CV.run[key].err)return;
    CV.run[key]={};cvDraw();
    cvApi({action:'analyse',bankId:CV.bank,questionNumber:+el.getAttribute('data-q'),partIndex:+el.getAttribute('data-p')}).then(function(r){delete CV.run[key];CV.res[key]=r;cvDraw()}).catch(function(e){CV.run[key]={err:e.message};cvDraw()});
  }
});
