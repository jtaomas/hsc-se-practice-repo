/* ---------- shared utils + state ---------- */
var KEY='sehsc-nesa-v2';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
var S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=S||{};S.u=S.u||{};S.hist=S.hist||[];S.font=S.font||0;S.fg=S.fg||0;S.bg=S.bg||0;S.classCode=S.classCode||'';
S.owner=S.owner||S.ae||'';S.revisions=S.revisions||{};
// Legacy drafts have no cloud revision: preserve them until the user resolves any conflict.
if(!S.pending){S.pending={};Object.keys(S.u).forEach(function(id){S.pending[id]=1})}
(function(){
  try{
    var fixed=false;
    Object.keys(S.u||{}).forEach(function(bid){
      var p=S.u[bid];
      if(p&&p.ans){
        Object.keys(p.ans).forEach(function(k){
          var val=p.ans[k];
          if(typeof val==='string'&&val.indexOf(']=-[POOL9K')>=0){
            p.ans[k]=val.replace(/\s*\]=\-\[POOL9K[^\n.]*/g,' collection of travel and route data may expose individual movement patterns and sensitive personal information without explicit consent, while using historical maintenance data risks perpetuating systemic bias against less-funded rural areas.');
            fixed=true;
          }
        });
      }
    });
    if(fixed){persist();if(typeof syncSoon==='function')syncSoon()}
  }catch(e){}
})();
/* If the browser refuses to store answers (storage full or blocked), say so once instead of failing silently:
   a reload would otherwise lose everything typed since the last successful write. */
var PERSISTFAIL=null;
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(S));if(PERSISTFAIL){if(PERSISTFAIL.remove)PERSISTFAIL.remove();PERSISTFAIL=null}}
  catch(e){if(!PERSISTFAIL)PERSISTFAIL=persistWarn()}
}
function persistWarn(){
  if(typeof document==='undefined'||!document.body||!document.createElement)return true;
  var w=document.createElement('div');w.className='aib bad';w.setAttribute('role','alert');
  w.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;margin:0';
  w.innerHTML='<b>This browser could not save your latest answers.</b> Its storage may be full or blocked. '+(S&&S.tok?'Your account still receives your answers when it saves. ':'Sign in so your answers are saved to an account. ')+'Do not reload or close this page until your answers are saved. <button type="button" class="nb sm ol">Dismiss</button>';
  w.querySelector('button').addEventListener('click',function(){w.remove()});
  document.body.appendChild(w);return w;
}
function save(id){S.ts=Date.now();id=id||(typeof CUR!=='undefined'&&CUR.b?CUR.b.id:null);if(id){if(S.u[id])S.u[id].upd=S.ts;S.pending[id]=(S.pending[id]||0)+1}persist();if(typeof syncSoon==='function')syncSoon()}
function BS(id){var u=S.u[id];if(!u)u=S.u[id]={ans:{},flags:{},self:{},chk:{},ai:{},start:0,done:false};if(!u.ai)u.ai={};if(!u.aiErr)u.aiErr={};return u}
/* The answers being edited. On a retry page (retry.js) these are the retry answers in paper.rt.a,
   so the submitted answers, marks and totals are never touched. Everywhere else they are paper.ans. */
function ANS(b){var bs=BS(b.id);if(typeof CUR!=='undefined'&&CUR.rt&&CUR.b===b){if(!bs.rt)bs.rt={};if(!bs.rt.a)bs.rt.a={};return bs.rt.a}return bs.ans}
function canEdit(){if(typeof CUR==='undefined'||!CUR.b)return false;if(CUR.rt)return typeof rtAllowed==='function'&&rtAllowed(CUR.b);return !CUR.rv&&!BS(CUR.b.id).done}

/* ---------- question constructors (used by the bank files) ---------- */
var BANKS=[];
function mc(q,o,a,why){return {t:'mc',q:q,o:o,a:a,m:1,why:why||''}}
function ms(q,o,a,m,why){return {t:'ms',q:q,o:o,a:a,m:m||1,why:why||''}}
function dd(q,tpl,b,m,why){return {t:'dd',q:q,tpl:tpl,b:b,m:m||1,why:why||''}}
function mt(q,h,r,m,why){return {t:'mt',q:q,h:h,r:r,m:m||1,why:why||''}}
function gd(q,h,r,m,why){return {t:'gd',q:q,h:h,r:r,m:m||1,why:why||''}}
function tk(q,h,r,m,why){return {t:'tk',q:q,h:h,r:r,m:m||1,why:why||''}}
function tx(q,m,w,model,crit){return {t:'tx',q:q,m:m,w:w,model:model,crit:crit||[]}}
function py(q,m,start,model,tests,crit){return {t:'py',q:q,m:m,start:start||'',model:model,tests:tests||[],crit:crit||[]}}
function ps(q,m,model,crit){return {t:'ps',q:q,m:m,model:model,crit:crit||[]}}
function sq(q,m,model,ord,crit){return {t:'sq',q:q,m:m,model:model,ord:!!ord,crit:crit||[]}}
function dr(q,m,model,crit,tools){return {t:'dr',q:q,m:m,model:model,crit:crit||[],tools:tools||'class'}}
function P(lb,it){it.lb=lb;return it}
/* the sample answer of a written or drawing part: a drawn sample (it.fig) first, then the description */
function modelHTML(it){return (it.fig||'')+'<div>'+it.model+'</div>'}
/* Q(topic, stimulus, items, opts): opts.two for two columns, opts.db for SQL tables */
function Q(tp,st,items,o){o=o||{};var m=0;items.forEach(function(i){m+=i.m});return {tp:tp,st:st||'',it:items,two:!!o.two,db:o.db||null,m:m,name:o.name||''}}
function tbl(h,rows,cap){return (cap?'<p class="ttl">'+cap+'</p>':'')+'<div class="tw"><table class="hoa"><tr>'+h.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>'}
function cls(list){return '<div class="clsg">'+list.map(function(c){return '<table class="hoa cls"><tr><th>'+c[0]+'</th></tr>'+c[1].map(function(a){return '<tr><td>'+a+'</td></tr>'}).join('')+'</table>'}).join('')+'</div>'}
function code(s){return '<pre class="pre">'+esc(s)+'</pre>'}
function dbTables(db){var ns=Object.keys(db);return ns.map(function(n){var d=db[n];return tbl(d.c,d.r.map(function(r){return r.map(esc)}),esc(n)).replace('<p class="ttl">','<p class="ttl dbn">').replace('<table class="hoa">','<table class="hoa db">')}).join('')}
/* bulleted list for stimulus and prompt text: bl(['one','two']) */
function bl(list){return '<ul class="bl">'+list.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>'}
/* inline SVG icons used by the toolbar, question bar and buttons (they take the text colour) */
function svg(vb,inner,cls){return '<svg class="ic'+(cls?' '+cls:'')+'" viewBox="'+vb+'" aria-hidden="true" focusable="false">'+inner+'</svg>'}
var IC={
  up:svg('0 0 12 8','<path d="M1.5 6.5 6 2l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>','chev'),
  down:svg('0 0 12 8','<path d="M1.5 1.5 6 6l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>','chev'),
  left:svg('0 0 8 12','<path d="M6.5 1.5 2 6l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>','chev'),
  right:svg('0 0 8 12','<path d="M1.5 1.5 6 6l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/>','chev'),
  flag:svg('0 0 16 16','<path fill="currentColor" d="M2 1h1.7v14H2z"/><path fill="currentColor" d="M3.7 1.6h9.6l-2.5 3.6 2.5 3.6H3.7z"/>'),
  pen:svg('0 0 16 16','<path fill="currentColor" d="m10.6 1.2 4.2 4.2-6.6 6.9-3.4.5-1.9-1.9.5-3.4z"/><path fill="currentColor" d="M1 15h7v-1.6H1z"/>'),
  font:svg('0 0 16 16','<text x="8" y="14" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="700" font-size="17" fill="currentColor">A</text>'),
  contrast:svg('0 0 16 16','<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="currentColor" d="M8 1.8a6.2 6.2 0 0 0 0 12.4z"/>'),
  key:svg('0 0 16 16','<path fill="currentColor" fill-rule="evenodd" d="M5.4.8a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zM4.2 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/><path fill="none" stroke="currentColor" stroke-width="2.1" d="M8.6 8.6 14.6 14.6M11.4 11.4l1.9-1.9M13.2 13.2l1.7-1.7"/>'),
  chk:svg('0 0 14 12','<path d="m1.5 6.3 3.6 3.6L12.5 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/>','chk'),
  reset:svg('0 0 16 16','<path d="M13.2 8A5.2 5.2 0 1 1 11.6 4.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M8.6 1.6h5.4v5.4z"/>'),
  tick:svg('0 0 16 16','<circle cx="8" cy="8" r="8" fill="#2ecc71"/><path d="m4.3 8.4 2.5 2.6 5-5.2" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="square"/>','tick')
};
function mkTopics(){return ['Software Engineering Project','Programming for the Web','Secure Software Architecture','Software Automation']}
function strHash(s){
  var h=0;s=String(s||'');
  for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}
  return Math.abs(h);
}
function isEduEmail(e){
  return /^[^\s@]+@(?:[^\s@]+\.)*(?:edu(?:\.[a-z]{2})?|education\.nsw\.gov\.au|det\.nsw\.edu\.au|test)$/i.test(String(e||'').trim());
}
function notionAvatarSVG(seed, sz, label){
  sz = sz || 28;
  var h = strHash(seed || 'guest');
  var bgs = ['#dbeafe','#dcfce7','#fef3c7','#ede9fe','#fee2e2','#ffedd5','#e0e7ff'];
  var skins = ['#fbd7c2','#f6c8a8','#e8b788','#c88f5a','#f3bf98'];
  var blushes = ['#f4a896','#ee9b85','#d89668','#b87948','#e49b78'];
  var hairs = ['#2b1d0c','#5e3219','#8a3b14','#deb056','#1e1b18','#3f2b1d'];
  var shirts = ['#002664','#059669','#b91c1c','#2563eb','#d97706','#7c3aed','#0891b2'];
  var bg = bgs[h % bgs.length];
  var skin = skins[h % skins.length];
  var blush = blushes[h % blushes.length];
  var hair = hairs[(h >> 2) % hairs.length];
  var shirt = shirts[(h >> 4) % shirts.length];
  var st = h % 5;
  var hairSvg = '';
  if (st === 0) {
    hairSvg = '<path d="M9 16 C7 10 11 6 18 6 C25 6 29 10 27 16 C29 18 30 21 28 23 C29 26 25 27 24 26 C22 28 14 28 12 26 C11 27 7 26 8 23 C6 21 7 18 9 16 Z" fill="' + hair + '"/>';
  } else if (st === 1) {
    hairSvg = '<path d="M10 22 C9 14 12 7 18 7 C24 7 27 14 26 22 C26 26 24 29 24 29 C24 29 22 22 22 16 C22 12 14 12 14 16 C14 22 12 29 12 29 C12 29 10 26 10 22 Z" fill="' + hair + '"/>';
  } else if (st === 2) {
    hairSvg = '<path d="M11 18 C11 11 13 7 18 7 C25 7 27 11 27 17 C25 14 20 12 15 13 C12 14 11 16 11 18 Z" fill="' + hair + '"/>';
  } else if (st === 3) {
    hairSvg = '<circle cx="18" cy="5" r="4.5" fill="' + hair + '"/><path d="M11 17 C11 10 13 8 18 8 C23 8 25 10 25 17 C23 14 19 13 18 13 C17 13 13 14 11 17 Z" fill="' + hair + '"/>';
  } else {
    hairSvg = '<path d="M9 19 C9 11 12 7 18 7 C24 7 27 11 27 19 C28 22 27 26 26 26 C25 22 24 16 23 15 C21 13 15 13 13 15 C12 16 11 22 10 26 C9 26 8 22 9 19 Z" fill="' + hair + '"/>';
  }
  var shoulders = '<path d="M9 34 C9 27 13 25 18 25 C23 25 27 27 27 34 Z" fill="' + shirt + '"/><path d="M16 25 L18 28 L20 25 Z" fill="' + skin + '"/>';
  var neck = '<rect x="16" y="22" width="4" height="4" fill="' + skin + '"/>';
  var face = '<path d="M13 15 C13 22 15 24.5 18 24.5 C21 24.5 23 22 23 15 C23 11 21 9 18 9 C15 9 13 11 13 15 Z" fill="' + skin + '"/>';
  var blushCheeks = '<circle cx="14" cy="20" r="1.5" fill="' + blush + '" opacity="0.6"/><circle cx="22" cy="20" r="1.5" fill="' + blush + '" opacity="0.6"/>';
  var eyes = '';
  if (st % 2 === 0) {
    eyes = '<circle cx="15.5" cy="17" r="1.2" fill="#1e293b"/><circle cx="15.9" cy="16.6" r="0.4" fill="#fff"/><circle cx="20.5" cy="17" r="1.2" fill="#1e293b"/><circle cx="20.9" cy="16.6" r="0.4" fill="#fff"/><circle cx="15.5" cy="17" r="2.8" fill="none" stroke="#334155" stroke-width="0.9"/><circle cx="20.5" cy="17" r="2.8" fill="none" stroke="#334155" stroke-width="0.9"/><line x1="18.3" y1="17" x2="17.7" y2="17" stroke="#334155" stroke-width="0.9"/>';
  } else {
    eyes = '<circle cx="15.5" cy="17.2" r="1.2" fill="#1e293b"/><circle cx="15.9" cy="16.8" r="0.4" fill="#fff"/><circle cx="20.5" cy="17.2" r="1.2" fill="#1e293b"/><circle cx="20.9" cy="16.8" r="0.4" fill="#fff"/>';
  }
  var nose = '<path d="M18 17.5 L17.5 19 L18.5 19" fill="none" stroke="' + blush + '" stroke-width="0.7" stroke-linecap="round"/>';
  var smile = '<path d="M16.5 21 Q18 22.8 19.5 21" fill="none" stroke="#b91c1c" stroke-width="1.1" stroke-linecap="round"/>';
  return '<svg class="notion-av" viewBox="0 0 36 36" width="' + sz + '" height="' + sz + '" role="img" aria-label="' + esc(label || 'Profile') + '"><circle cx="18" cy="18" r="18" fill="' + bg + '"/>' + hairSvg + shoulders + neck + face + blushCheeks + eyes + nose + smile + '</svg>';
}

function isMyCurrentPaper(bid){
  if(typeof S === 'undefined' || !S || !S.u) return false;
  bid = String(bid);
  var u = S.u[bid];
  if(!u || u.done || (!u.start && !u.upd)) return false;

  var openIds = [];
  var maxTouch = -1;
  var latestId = null;
  Object.keys(S.u).forEach(function(pid){
    var x = S.u[pid];
    if(x && !x.done && (x.start || x.upd)){
      var spid = String(pid);
      openIds.push(spid);
      var touch = Math.max(x.upd || 0, x.start || 0);
      if(touch > maxTouch || latestId === null){
        maxTouch = touch;
        latestId = spid;
      }
    }
  });

  if(typeof CUR !== 'undefined' && CUR && CUR.b && CUR.b.id != null){
    var curId = String(CUR.b.id);
    if(openIds.indexOf(curId) >= 0){
      return curId === bid;
    }
  }
  return latestId != null && latestId === bid;
}

/* Live presence. PR is filled by the heartbeat in classview.js from the server's own clock, never from cached data.
   prSeen(id) is null whenever presence cannot be trusted (not loaded, switched off, or no reply for 90s), so the page then
   makes no claim at all instead of showing people as offline. */
var PR={list:{},recv:0,disabled:false};
function prKnown(){return !!PR.recv&&!PR.disabled&&Date.now()-PR.recv<90000}
function prSeen(id){
  if(!prKnown())return null;
  var e=PR.list[id];
  if(!e)return {online:false,bank:''};
  var on=e.age+(Date.now()-PR.recv)<75000;
  return {online:on,bank:on?e.bank:''};
}
function prHereBank(){
  if(typeof location==='undefined'||!location)return '';
  var h=String(location.hash||'').replace(/^#\/?/,'').split('/')[0];
  return /^(?:[1-9]|1[0-9])$/.test(h)?h:'';
}
function getPaperStudents(b){
  if(!b || b.id == null) return [];
  if(typeof CV === 'undefined' || !CV.over || !CV.over.papers) return [];
  var list = [];
  var bid = String(b.id);
  var u = (typeof S !== 'undefined' && S && S.u) ? S.u[bid] : null;

  if(u && (u.start || u.done || u.upd)){
    var myStatus = null;
    var myState = null;

    if(u.done){
      myStatus = 'Submitted';
      myState = 'done';
    } else if(isMyCurrentPaper(bid)){
      myStatus = 'In progress';
      myState = 'live';
    } else {
      var hasAns = !!(u.ans && Object.keys(u.ans).length > 0);
      if(hasAns){
        myStatus = 'In progress';
        myState = 'working';
      }
    }

    if(myStatus && myState){
      var email = S.ae || (S.owner && S.owner.indexOf('@') >= 0 ? S.owner : '');
      var rawName = S.ae ? S.ae.split('@')[0].replace(/[._]/g, ' ') : (S.owner || 'You');
      var name = rawName.split(' ').map(function(w){return w ? w.charAt(0).toUpperCase() + w.slice(1) : ''}).join(' ').trim() || 'You';
      if(typeof CV !== 'undefined' && CV.st && CV.st.name) name = CV.st.name;
      list.push({
        name: name,
        email: email,
        status: myStatus,
        state: myState,
        seed: email,
        photo: S.photo || '',
        isMe: true,
        online: prKnown() ? true : null,
        here: prKnown() && prHereBank() === bid
      });
    }
  }

  var overPapers = (typeof CV !== 'undefined' && CV.over && CV.over.papers) ? (CV.over.papers[b.id] || CV.over.papers[bid]) : null;
  if(overPapers && Array.isArray(overPapers)){
    overPapers.forEach(function(m){
      var isMe = !!m.mine;
      if(!isMe || !list.some(function(item){return item.isMe})){
        var isSub = m.status === 'Submitted';
        var status = isSub ? 'Submitted' : (m.status === 'Sitting exam' ? 'Sitting exam' : 'In progress');
        var state = 'live';
        if(isSub){
          state = 'done';
        } else if(isMe){
          state = isMyCurrentPaper(bid) ? 'live' : 'working';
        } else {
          state = (m.current === false ? 'working' : 'live');
        }
        var seen = isMe ? (prKnown() ? {online: true, bank: prHereBank()} : null) : prSeen(m.id);
        list.push({
          id: m.id,
          name: m.name,
          email: isMe ? (S.ae || '') : '',
          status: status,
          state: state,
          seed: m.id || m.name,
          photo: isMe ? (S.photo || '') : (m.photo || ''),
          isMe: isMe,
          online: seen ? seen.online : null,
          here: !!(seen && seen.online && seen.bank === bid)
        });
      }
    });
  }

  /* Anyone online and looking at this paper is shown even before they start it, as in a shared document. */
  if(prKnown() && typeof CV !== 'undefined' && CV.roster && Array.isArray(CV.roster.members)){
    CV.roster.members.forEach(function(rm){
      var seen = prSeen(rm.id);
      if(!seen || !seen.online || seen.bank !== bid) return;
      if(rm.mine ? list.some(function(x){return x.isMe}) : list.some(function(x){return x.id === rm.id})) return;
      list.push({
        id: rm.id,
        name: rm.name,
        email: rm.mine ? (S.ae || '') : '',
        status: 'Viewing',
        state: 'live',
        seed: rm.id,
        photo: rm.mine ? (S.photo || '') : (rm.photo || ''),
        isMe: !!rm.mine,
        online: true,
        here: true
      });
    });
  }

  var rank = function(st){
    if(st === 'live') return 0;
    if(st === 'working') return 1;
    return 2;
  };
  /* With live presence: viewing this paper, then online elsewhere, then offline (unfinished before submitted). */
  var live = prKnown();
  var prank = function(x){
    if(x.online && x.here) return 0;
    if(x.online) return 1;
    return x.status === 'Submitted' ? 3 : 2;
  };
  list.forEach(function(x, i){x.ix = i});
  list.sort(function(a, b){
    var d = live ? prank(a) - prank(b) : rank(a.state) - rank(b.state);
    return d || a.ix - b.ix;
  });

  return list;
}

function presenceClass(s){
  if(s.online === true) return ' av-live pr-on';
  if(s.online === false) return ' pr-off';
  return s.state === 'done' ? ' av-done' : (s.state === 'live' ? ' av-live' : ' av-working');
}
function presenceLabel(s){
  if(s.online === true) return s.here ? 'Viewing now' : 'Online';
  return s.status;
}
function trialAvatarsHTML(b, isInline){
  var students = getPaperStudents(b);
  if(!students.length) return '';
  var known = prKnown();
  var nOn = students.filter(function(s){return s.online === true}).length;
  var display = students.slice(0, 3);
  var more = students.length > 3 ? '<span class="notion-avatar-more">+' + (students.length - 3) + '</span>' : '';
  var stack = display.map(function(s){
    return '<span class="notion-avatar' + presenceClass(s) + '" title="' + esc(s.name) + ' (' + esc(presenceLabel(s)) + ')">' + profileAvatarHTML(s.photo, s.seed, 26, s.name) + (s.online === true ? '<i class="pr-dot" aria-hidden="true"></i>' : '') + '</span>';
  }).join('') + more;

  var popList = students.map(function(s){
    var cls = presenceClass(s);
    var badge = s.online === true ? 'live' : (s.online === false ? 'off' : (s.status === 'Submitted' ? 'ok' : (s.state === 'live' ? 'live' : 'working')));
    var sub = s.email ? s.email : (s.online === true && s.status !== 'Viewing' ? s.status : '');
    return '<div class="notion-pop-row' + cls + '">' +
      '<span class="notion-pop-av' + cls + '">' + profileAvatarHTML(s.photo, s.seed, 28, s.name) + (s.online === true ? '<i class="pr-dot" aria-hidden="true"></i>' : '') + '</span>' +
      '<div class="notion-pop-meta">' +
        '<div class="notion-pop-name">' + esc(s.name) + (s.isMe ? ' <span class="notion-pill-me">You</span>' : '') + '</div>' +
        (sub ? '<div class="notion-pop-email">' + esc(sub) + '</div>' : '') +
      '</div>' +
      '<span class="notion-pop-badge ' + badge + '">' + esc(presenceLabel(s)) + '</span>' +
    '</div>';
  }).join('');

  var title = 'On this paper (' + students.length + ')' + (known ? ' <span class="notion-pop-on">' + nOn + ' online</span>' : '');
  return '<div class="notion-avatars' + (isInline ? ' inline' : '') + '" data-act="presence-toggle" tabindex="0" role="button" aria-label="Students on this paper">' +
    '<div class="notion-avatar-stack">' + stack + '</div>' +
    '<div class="notion-presence-pop">' +
      '<div class="notion-pop-hd">' +
        '<span class="notion-pop-hd-title">' + title + '</span>' +
      '</div>' +
      '<div class="notion-pop-list">' + popList + '</div>' +
    '</div>' +
  '</div>';
}

function profileAvatarHTML(photo, seed, size, label){
  if(typeof photo==='string' && photo.length<=44000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))return '<img class="profile-photo" src="'+esc(photo)+'" width="'+size+'" height="'+size+'" alt="'+esc(label||'Profile picture')+'" style="border-radius:50%;object-fit:cover;vertical-align:middle">';
  return notionAvatarSVG(seed,size,label);
}
