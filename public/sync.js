/* ---------- Accounts: email and password, progress saved to the account ---------- */
var SYNC={tmr:null,state:'off',msg:''};
var ACC={mode:'in',msg:'',busy:false};
function acctText(){
  if(!S.tok||!S.ae)return SYNC.state==='paused'?'Sign in again':'Sign in';
  var st=SYNC.state==='saving'?'Saving...':SYNC.state==='ok'?'Saved':SYNC.state==='error'?'Sync error':SYNC.state==='paused'?'Sign in again':'Signed in';
  return esc(S.ae)+' &middot; '+st;
}
function refreshAcct(){$$('.acct').forEach(function(e){e.innerHTML=acctText()});var s=$('#syncst');if(s)s.innerHTML=syncStatusHTML()}
function syncStatusHTML(){
  if(!S.tok)return SYNC.state==='paused'?'Your sign-in expired. Sign in again to keep saving.':'Not signed in. Your progress is saved in this browser only.';
  if(SYNC.state==='saving')return 'Saving your progress...';
  if(SYNC.state==='ok')return 'Progress saved to your account'+(SYNC.msg?' at '+esc(SYNC.msg):'')+'.';
  if(SYNC.state==='error')return 'The last save failed: '+esc(SYNC.msg)+'. Your progress is still safe in this browser.';
  return 'Signed in. Progress saves to your account as you work.';
}
function syncPayload(){return {v:1,ts:S.ts||0,u:S.u,hist:S.hist,font:S.font,fg:S.fg,bg:S.bg}}
function mergeRemote(r){
  if(!r||!r.u)return;
  Object.keys(r.u).forEach(function(id){var a=S.u[id],b=r.u[id];if(!b)return;if(!a||(b.upd||0)>(a.upd||0))S.u[id]=b});
  (r.hist||[]).forEach(function(h){if(!S.hist.some(function(x){return x.id===h.id&&x.at===h.at}))S.hist.push(h)});
  if((r.ts||0)>(S.ts||0)){S.font=r.font||0;S.fg=r.fg||0;S.bg=r.bg||0}
  try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
}
function api(action,body){
  var h={'content-type':'application/json'};if(S.tok)h.authorization='Bearer '+S.tok;
  return fetch('/api/auth',{method:'POST',headers:h,body:JSON.stringify(Object.assign({action:action},body||{}))}).then(function(r){
    return r.json().catch(function(){return {error:'The account service sent an unreadable reply.'}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||'Request failed ('+r.status+')');e.status=r.status;throw e}
      return j;
    });
  });
}
function syncFail(e){
  if(e.status===401&&S.tok){S.tok='';SYNC.state='paused';SYNC.msg='';try{localStorage.setItem(KEY,JSON.stringify(S))}catch(x){}}
  else{SYNC.state='error';SYNC.msg=e.message}
  refreshAcct();
}
function pushRemote(){return api('save',{data:syncPayload()})}
function syncNow(){
  if(!S.tok)return Promise.resolve();
  SYNC.state='saving';refreshAcct();
  return api('load').then(function(r){mergeRemote(r.data);return pushRemote()}).then(function(){
    SYNC.state='ok';SYNC.msg=new Date().toLocaleTimeString();refreshAcct();
    if(CUR.b===null&&/^#?\/?(papers|mistakes)?$/.test(location.hash))render();
  }).catch(syncFail);
}
function syncSoon(){
  if(!S.tok)return;
  clearTimeout(SYNC.tmr);
  SYNC.tmr=setTimeout(function(){
    SYNC.state='saving';refreshAcct();
    pushRemote().then(function(){SYNC.state='ok';SYNC.msg=new Date().toLocaleTimeString();refreshAcct()}).catch(syncFail);
  },3000);
}
function accountPage(){
  CUR={b:null,n:0};
  var body;
  if(S.tok&&S.ae){
    body='<h2 class="pt">Your account</h2><p>Signed in as <b>'+esc(S.ae)+'</b>.</p><p id="syncst">'+syncStatusHTML()+'</p>'+
      '<div class="acts"><button class="nb" data-act="acsync">Save now</button><button class="nb ol" data-act="acsignout">Sign out</button></div>'+
      '<p class="note">Signing out saves your progress to your account, then clears it from this browser so the next person on a shared computer cannot see it.</p>';
  }else{
    var up=ACC.mode==='up';
    body='<h2 class="pt">'+(up?'Create an account':'Sign in')+'</h2>'+
      '<p>Use your education email address, for example <b>name@student.det.nsw.edu.au</b>. An account saves your answers and marks so you can carry on from any device.</p>'+
      '<form class="acform" onsubmit="return false"><label for="acemail">Email</label><input id="acemail" type="email" autocomplete="username" placeholder="name@student.det.nsw.edu.au">'+
      '<label for="acpw">Password</label><input id="acpw" type="password" autocomplete="'+(up?'new-password':'current-password')+'" placeholder="At least 8 characters">'+
      (up?'<label for="acpw2">Confirm password</label><input id="acpw2" type="password" autocomplete="new-password">':'')+
      '<div class="acmsg" id="accmsg" role="alert">'+esc(ACC.msg)+'</div>'+
      '<div class="acts"><button class="nb" data-act="acgo" type="button">'+(up?'Create account':'Sign in')+'</button>'+
      '<button class="nb ol" data-act="acmode" data-v="'+(up?'in':'up')+'" type="button">'+(up?'I already have an account':'Create an account')+'</button></div></form>'+
      '<p class="note">Your password is never stored. Only a salted, one-way hash of it is kept, so nobody, including the site owner, can read it. There is no password reset, so choose one you will remember. Without an account your progress is saved in this browser only.</p>';
  }
  return frame('Account','<div class="pg"><h1 class="pt">Account</h1><div class="feature">'+body+'</div></div>');
}
function acSet(m){ACC.msg=m;var e=$('#accmsg');if(e)e.textContent=m}
function acGo(){
  if(ACC.busy)return;
  var em=($('#acemail')||{}).value||'',pw=($('#acpw')||{}).value||'',up=ACC.mode==='up';
  em=em.trim();
  if(!em||!pw)return acSet('Enter your email and password.');
  if(up&&pw!==(($('#acpw2')||{}).value||''))return acSet('The two passwords do not match.');
  ACC.busy=true;acSet(up?'Creating your account...':'Signing in...');
  api(up?'signup':'login',{email:em,password:pw}).then(function(r){
    S.tok=r.token;S.ae=r.email;ACC.busy=false;ACC.msg='';
    try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
    return syncNow().then(function(){location.hash='#/'});
  }).catch(function(e){ACC.busy=false;acSet(e.message)});
}
function acSignOut(){
  var go=function(){
    S.tok='';S.ae='';S.u={};S.hist=[];S.ts=0;SYNC.state='off';
    try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
    location.hash='#/';render();
  };
  clearTimeout(SYNC.tmr);
  pushRemote().then(go).catch(function(e){
    if(confirm('Your latest progress could not be saved ('+e.message+'). Sign out anyway and lose it from this browser?'))go();
  });
}
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&/^ac(email|pw|pw2)$/.test(e.target.id))acGo()});
if(S.tok)setTimeout(syncNow,300);
