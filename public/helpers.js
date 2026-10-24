/* ---------- shared utils + state ---------- */
var KEY='sehsc-nesa-v2';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
var S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=S||{};S.u=S.u||{};S.hist=S.hist||[];S.font=S.font||0;S.fg=S.fg||0;S.bg=S.bg||0;
S.owner=S.owner||S.ae||'';S.revisions=S.revisions||{};
// Legacy drafts have no cloud revision: preserve them until the user resolves any conflict.
if(!S.pending){S.pending={};Object.keys(S.u).forEach(function(id){S.pending[id]=1})}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function save(id){S.ts=Date.now();id=id||(typeof CUR!=='undefined'&&CUR.b?CUR.b.id:null);if(id){if(S.u[id])S.u[id].upd=S.ts;S.pending[id]=(S.pending[id]||0)+1}persist();if(typeof syncSoon==='function')syncSoon()}
function BS(id){var u=S.u[id];if(!u)u=S.u[id]={ans:{},flags:{},self:{},chk:{},ai:{},start:0,done:false};if(!u.ai)u.ai={};if(!u.aiErr)u.aiErr={};return u}

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
/* Q(topic, stimulus, items, opts): opts.two for two columns, opts.db for SQL tables */
function Q(tp,st,items,o){o=o||{};var m=0;items.forEach(function(i){m+=i.m});return {tp:tp,st:st||'',it:items,two:!!o.two,db:o.db||null,m:m,name:o.name||''}}
function tbl(h,rows,cap){return (cap?'<p class="ttl">'+cap+'</p>':'')+'<div class="tw"><table class="hoa"><tr>'+h.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>'}
function cls(list){return '<div class="clsg">'+list.map(function(c){return '<table class="hoa cls"><tr><th>'+c[0]+'</th></tr>'+c[1].map(function(a){return '<tr><td>'+a+'</td></tr>'}).join('')+'</table>'}).join('')+'</div>'}
function code(s){return '<pre class="pre">'+esc(s)+'</pre>'}
function dbTables(db){var ns=Object.keys(db);return ns.map(function(n){var d=db[n];return tbl(d.c,d.r.map(function(r){return r.map(esc)}),ns.length>1?'<b>'+n+'</b>':'').replace('<table class="hoa">','<table class="hoa db">')}).join('')}
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
