/* ---------- shared utils + state ---------- */
var KEY='sehsc-nesa-v2';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
var S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=S||{};S.u=S.u||{};S.hist=S.hist||[];S.font=S.font||0;S.fg=S.fg||0;S.bg=S.bg||0;
function save(){S.ts=Date.now();try{if(typeof CUR!=='undefined'&&CUR.b&&S.u[CUR.b.id])S.u[CUR.b.id].upd=S.ts}catch(e){}try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(typeof syncSoon==='function')syncSoon()}
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
function dbTables(db){return Object.keys(db).map(function(n){var d=db[n];return tbl(d.c,d.r.map(function(r){return r.map(esc)}),'<b>'+n+'</b>')}).join('')}
function mkTopics(){return ['Software Engineering Project','Programming for the Web','Secure Software Architecture','Software Automation']}
