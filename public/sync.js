/* ---------- Accounts: email and password, progress saved to the account ---------- */
var SYNC={tmr:null,state:'off',msg:'',epoch:0,queue:Promise.resolve(),conflicts:{}};
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
function syncPayload(){return {v:2,ts:S.ts||0,u:S.u,hist:S.hist,font:S.font,fg:S.fg,bg:S.bg,classCode:S.classCode||''}}
function mergeRemote(r,revisions){
  r=r||{};var remote=r.u||{};revisions=revisions||{};
  Object.keys(Object.assign({},S.u,remote,revisions)).forEach(function(id){
    if(S.pending[id])return;
    if(remote[id]){if(JSON.stringify(S.u[id])!==JSON.stringify(remote[id]))S.u[id]=remote[id]}else delete S.u[id];
    S.revisions[id]=revisions[id]||null;
  });
  (r.hist||[]).forEach(function(h){if(!S.hist.some(function(x){return x.id===h.id&&x.at===h.at}))S.hist.push(h)});
  if((r.ts||0)>(S.ts||0)){S.font=r.font||0;S.fg=r.fg||0;S.bg=r.bg||0}
  if(r.classCode!==undefined)S.classCode=r.classCode||'';
  persist();
}
function api(action,body,token){
  var h={'content-type':'application/json'};token=token===undefined?S.tok:token;if(token)h.authorization='Bearer '+token;
  return fetch('/api/auth',{method:'POST',headers:h,body:JSON.stringify(Object.assign({action:action},body||{}))}).then(function(r){
    return r.json().catch(function(){return {error:'The account service sent an unreadable reply.'}}).then(function(j){
      if(!r.ok){var e=new Error(j.error||'Request failed ('+r.status+')');e.status=r.status;e.details=j;throw e}
      return j;
    });
  });
}
function syncFail(e){
  if(e.stale)return;
  if(e.status===401&&S.tok){stashDraft();replaceState({});SYNC.state='paused';SYNC.msg='';render()}
  else{SYNC.state='error';SYNC.msg=e.message}
  refreshAcct();
}
function draftKey(owner){return KEY+':draft:'+encodeURIComponent(owner)}
function stashDraft(){if(typeof xdCleanup==='function')xdCleanup();if(S.owner){try{localStorage.setItem(draftKey(S.owner),JSON.stringify(Object.assign(syncPayload(),{owner:S.owner,pending:S.pending,revisions:S.revisions})))}catch(e){}}}
function replaceState(next){
  if(typeof comparisonReset==='function')comparisonReset();
  if(typeof xdCleanup==='function')xdCleanup();
  if(typeof stopPython==='function')stopPython();
  clearTimeout(SYNC.tmr);SYNC.epoch++;SYNC.queue=Promise.resolve();SYNC.conflicts={};
  if(typeof AIRUN!=='undefined')AIRUN={};
  S=Object.assign({u:{},hist:[],pending:{},revisions:{},tok:'',ae:'',owner:'',ts:0,font:0,fg:0,bg:0},next);
  if(typeof CUR!=='undefined')CUR={b:null,n:0};persist();
}
function acceptAccount(r,signup){
  var owner=r.email.toLowerCase(),next={};
  if(S.owner===owner||(signup&&!S.owner))next=S;
  else{stashDraft();try{next=JSON.parse(localStorage.getItem(draftKey(owner)))||{}}catch(e){}}
  replaceState(Object.assign({},next,{tok:r.token,ae:r.email,owner:owner}));
}
function checkSession(epoch){if(epoch!==SYNC.epoch){var e=new Error('Account changed.');e.stale=true;throw e}}
function queuedSync(load){
  if(!S.tok)return Promise.resolve();
  var epoch=SYNC.epoch,token=S.tok;
  var task=SYNC.queue.catch(function(){}).then(function(){
    checkSession(epoch);SYNC.state='saving';refreshAcct();
    return load?api('load',{},token).then(function(r){checkSession(epoch);mergeRemote(r.data,r.revisions)}):null;
  }).then(function(){
    checkSession(epoch);
    if(Object.keys(SYNC.conflicts).length)throw new Error('Choose which paper version to keep on the Account page.');
    var sent=Object.assign({},S.pending),changes=Object.keys(sent);
    return api('save',{data:syncPayload(),changes:changes,revisions:S.revisions},token).then(function(r){
      checkSession(epoch);
      changes.forEach(function(id){S.revisions[id]=(r.revisions||{})[id]||null;if(S.pending[id]===sent[id])delete S.pending[id]});
      mergeRemote(r.data,r.revisions);SYNC.state='ok';SYNC.msg=new Date().toLocaleTimeString();refreshAcct();
    }).catch(function(e){
      checkSession(epoch);
      var d=e.details;
      if(d&&d.code==='progress_conflict'){
        (d.conflicts||[]).forEach(function(id){SYNC.conflicts[id]={data:(d.data.u||{})[id]||null,revision:d.revisions[id]||null}});
        mergeRemote(d.data,d.revisions);
        if(location.hash==='#/account')render();
      }
      throw e;
    });
  });
  task=task.catch(function(e){checkSession(epoch);throw e});
  SYNC.queue=task.catch(function(){});return task;
}
function pushRemote(){return queuedSync(false)}
function syncNow(){return queuedSync(true).then(function(){if(CUR.b===null&&/^#?\/?(papers|mistakes)?$/.test(location.hash))render()}).catch(syncFail)}
function syncSoon(){
  if(!S.tok)return;
  clearTimeout(SYNC.tmr);
  SYNC.tmr=setTimeout(function(){
    pushRemote().catch(syncFail);
  },20000);
}
/* Saves are batched (20 s) to keep storage writes low; leaving or hiding the page sends anything still waiting. */
function flushPending(){
  if(!S.tok||!Object.keys(S.pending||{}).length)return;
  clearTimeout(SYNC.tmr);pushRemote().catch(syncFail);
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushPending()});
window.addEventListener('pagehide',flushPending);
function conflictHTML(){
  return Object.keys(SYNC.conflicts).map(function(id){var b=BANKS.filter(function(x){return x.id===id})[0];return '<div class="aib bad"><b>'+esc(b?b.name:'Paper '+id)+' changed on another device.</b><p>Your answers on this device are still saved here. Choose which complete paper to keep in your account.</p><button class="nb" data-act="acresolve" data-id="'+id+'" data-v="local">Keep this device’s paper</button> <button class="nb ol" data-act="acresolve" data-id="'+id+'" data-v="remote">Use the saved paper</button></div>'}).join('');
}
function resolveSync(id,choice){
  var c=SYNC.conflicts[id];if(!c)return;
  if(choice==='remote'){if(c.data)S.u[id]=c.data;else delete S.u[id];delete S.pending[id]}
  else S.pending[id]=(S.pending[id]||0)+1;
  S.revisions[id]=c.revision;delete SYNC.conflicts[id];persist();render();
  if(!Object.keys(SYNC.conflicts).length)syncNow();
}
/* ---------- Backups: a file you keep, and daily copies on the server ---------- */
var BK={list:null,msg:'',busy:false};
function bkSet(m){BK.msg=m;var e=$('#bkmsg');if(e)e.textContent=m}
function bkLabel(n){return /^before-restore-/.test(n)?'Saved just before a restore ('+new Date(+n.slice(15)).toLocaleString()+')':'Start of '+n}
function backupHTML(){
  var h='<h3 class="pt" style="margin-top:22px">Backups</h3><p>A backup file is a copy of all your papers and marks that you keep yourself. The site also keeps a copy of your progress from the start of each of the last 7 days that you saved.</p>'+
    '<div class="acts"><button class="nb ol" data-act="bkdownload">Download a backup file</button><button class="nb ol" data-act="bkupload">Restore from a backup file</button>'+
    (S.tok?'<button class="nb ol" data-act="bklist">Show daily backups</button>':'')+'</div>'+
    '<input type="file" id="bkfile" accept=".json,application/json" hidden>'+'<div class="acmsg" id="bkmsg" role="status">'+esc(BK.msg)+'</div>';
  if(S.tok&&BK.list)h+=BK.list.length?'<div class="bklist">'+BK.list.map(function(n){return '<div class="aib"><b>'+esc(bkLabel(n))+'</b> <button class="nb ol" data-act="bkrestore" data-name="'+esc(n)+'">Restore this backup</button></div>'}).join('')+'</div>':'<p>No daily backups yet. The first one is made the next day you save.</p>';
  return h;
}
function bkDownload(){
  var file={kind:'sehsc-backup',v:1,email:S.ae||'',at:new Date().toISOString(),data:syncPayload()};
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(file)],{type:'application/json'}));
  a.download='hsc-se-backup-'+file.at.slice(0,10)+'.json';document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);bkSet('Backup file downloaded.');
}
function bkReadFile(f){
  if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){
    var file;try{file=JSON.parse(rd.result)}catch(e){return bkSet('That file is not a backup file.')}
    if(!file||file.kind!=='sehsc-backup'||!file.data||typeof file.data.u!=='object'||file.data.u===null)return bkSet('That file is not a backup file.');
    var ids=Object.keys(file.data.u).filter(function(id){return /^(?:[1-9]|10)$/.test(id)});
    if(!ids.length)return bkSet('That backup has no papers in it.');
    if(!confirm('Restore '+ids.length+' paper'+(ids.length===1?'':'s')+' from this backup? Papers in the file replace the same papers here. Other papers are not touched.'))return;
    ids.forEach(function(id){S.u[id]=file.data.u[id];S.pending[id]=(S.pending[id]||0)+1;delete SYNC.conflicts[id]});
    (file.data.hist||[]).forEach(function(h){if(!S.hist.some(function(x){return x.id===h.id&&x.at===h.at}))S.hist.push(h)});
    persist();bkSet('Restored '+ids.length+' paper'+(ids.length===1?'':'s')+' from the backup file.');
    if(S.tok)syncSoon();
  };
  rd.readAsText(f);
}
function bkLoadList(){
  if(BK.busy)return;BK.busy=true;bkSet('Loading...');
  api('backups').then(function(r){BK.list=r.backups||[];BK.busy=false;BK.msg='';render()}).catch(function(e){BK.busy=false;bkSet(e.message)});
}
function bkRestore(name){
  if(BK.busy)return;
  if(!confirm('Restore your account to this backup? Your current progress is kept as a "before restore" backup first.'))return;
  var epoch=SYNC.epoch;BK.busy=true;bkSet('Restoring...');
  SYNC.queue.catch(function(){}).then(function(){return api('restore',{name:name})}).then(function(r){
    checkSession(epoch);
    S.pending={};S.u=(r.data&&r.data.u)||{};S.revisions=r.revisions||{};SYNC.conflicts={};
    (r.data&&r.data.hist||[]).forEach(function(h){if(!S.hist.some(function(x){return x.id===h.id&&x.at===h.at}))S.hist.push(h)});
    persist();BK.busy=false;BK.list=null;BK.msg='Restored. Your papers now match that backup.';render();
  }).catch(function(e){BK.busy=false;if(!e.stale)bkSet(e.message)});
}
function accountPage(){
  CUR={b:null,n:0};
  var body;
  if(S.tok&&S.ae){
    body='<h2 class="pt">Your account</h2><p>Signed in as <b>'+esc(S.ae)+'</b>.</p><p id="syncst">'+syncStatusHTML()+'</p>'+
      '<div class="acts"><button class="nb" data-act="acsync">Save now</button><button class="nb ol" data-act="acsignout">Sign out</button></div>'+
      '<div class="feature" style="margin-top:20px;background:#fff;border:1px solid #d0d0d0;border-radius:4px;padding:14px">'+
      '<h3 style="margin:0 0 6px">Class code (optional)</h3>'+
      '<p>Enter a shared class code (e.g. <b>12SE2026</b>) to compare verified submitted responses automatically with your classmates.</p>'+
      '<div style="display:flex;gap:8px;align-items:center;margin-top:8px">'+
      '<input id="ac-classcode" value="'+esc(S.classCode||'')+'" placeholder="e.g. 12SE2026" maxlength="20" style="max-width:200px;text-transform:uppercase;padding:6px 10px">'+
      '<button class="nb sm" data-act="acclasscode" type="button">Set class code</button>'+
      (S.classCode?'<button class="nb sm ol" data-act="acclasscodeclear" type="button">Clear</button>':'')+
      '</div></div>'+
      conflictHTML()+backupHTML()+'<p class="note">Signing out saves your progress to your account, then clears it from this browser so the next person on a shared computer cannot see it.</p>';
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
  var epoch=SYNC.epoch;ACC.busy=true;acSet(up?'Creating your account...':'Signing in...');
  api(up?'signup':'login',{email:em,password:pw}).then(function(r){
    checkSession(epoch);acceptAccount(r,up);ACC.busy=false;ACC.msg='';
    return syncNow().then(function(){location.hash='#/'});
  }).catch(function(e){ACC.busy=false;acSet(e.message)});
}
function acSignOut(){
  var epoch=SYNC.epoch;if(typeof xdCleanup==='function')xdCleanup();
  var go=function(){
    if(epoch!==SYNC.epoch)return;
    try{if(S.owner)localStorage.removeItem(draftKey(S.owner))}catch(e){}
    replaceState({});SYNC.state='off';
    location.hash='#/';render();
  };
  clearTimeout(SYNC.tmr);
  pushRemote().then(go).catch(function(e){
    if(confirm('Your latest progress could not be saved ('+e.message+'). Sign out anyway and lose it from this browser?'))go();
  });
}
function acSetClassCode(clear){
  if(clear){ S.classCode=''; }
  else{
    var inp=$('#ac-classcode');
    if(!inp)return;
    S.classCode=inp.value.toUpperCase().trim().slice(0,20);
  }
  persist();
  if(typeof syncSoon==='function')syncSoon();
  render();
}
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&/^ac(email|pw|pw2)$/.test(e.target.id))acGo()});
if(S.tok)setTimeout(syncNow,300);
window.addEventListener('storage',function(e){
  if(e.key!==KEY||!e.newValue)return;
  var next;try{next=JSON.parse(e.newValue)}catch(x){return}
  if((next.owner||'')!==S.owner||(next.tok||'')!==(S.tok||'')){stashDraft();replaceState(next);render()}
});
