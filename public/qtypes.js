/* ---------- behaviour of the extra question types (constructors are in kit.js) ----------
   Each type calls regType(name, {...}) with any of these hooks:
     render(it,k,a,ro,rv)  HTML for the answer area. k is the answer key, a the saved answer.
     auto                  true if marked in the browser; then units() and guide() are needed.
     units(it,a)           [correct, total] marking units.
     guide(it,a)           correct-answer HTML for the marking guide.
     compare(it,a)         rows [label, yours, correct, ok] for My mistakes.
     isAns(it,a)           true if the student has answered.
     sample(it), preview(it,a), cls   sample answer, answer preview and filter class. */

/* ---------- shared drag-and-drop engine for od and dm ----------
   Answer shape: {slotIndex: chipIndex}. Chips can be dragged with a mouse or finger,
   or clicked (or Enter) to pick up and then clicked on a slot to drop. */
var DZ={sel:null,drag:null};
function chipHTML(k,ci,txt,ro,cls){
  return '<button type="button" class="chip'+(cls?' '+cls:'')+'" data-ck="'+k+'" data-ci="'+ci+'"'+(ro?' disabled':'')+'><span class="grip">::</span> '+esc(txt)+'</button>';
}
function slotHTML(k,s,inner,ro,cls,style){
  return '<div class="dslot'+(inner?' full':'')+(cls?' '+cls:'')+'" data-sk="'+k+'" data-s="'+s+'"'+(ro?'':' role="button" tabindex="0" aria-label="Drop zone '+(+s+1)+'"')+(style?' style="'+style+'"':'')+'>'+(inner||'')+'</div>';
}
function dzUsed(a){var u={};Object.keys(a||{}).forEach(function(s){u[a[s]]=s});return u}
function dzRedraw(k){
  var el=$('.dz[data-k="'+k+'"]');if(!el||!CUR.b)return;
  var it=itemOf(k),t=document.createElement('div');t.innerHTML=QT[it.t].render(it,k,ANS(CUR.b)[k],!canEdit(),CUR.rv);
  el.parentNode.replaceChild(t.firstChild,el);
}
function dzPlace(k,s,ci,from){
  if(!canEdit())return;
  var it=itemOf(k),A=ANS(CUR.b),a={},old=A[k]||{};
  Object.keys(old).forEach(function(x){a[x]=old[x]});
  var prev=a[s];
  if(from!=null)delete a[from];
  else if(!it.reuse)Object.keys(a).forEach(function(x){if(a[x]===ci)delete a[x]});
  a[s]=ci;
  if(prev!=null&&prev!==ci&&from!=null)a[from]=prev;
  A[k]=a;save();dzRedraw(k);refreshNav();
}
function dzRemove(k,s){if(!canEdit())return;var a=ANS(CUR.b)[k];if(!a||a[s]==null)return;delete a[s];save();dzRedraw(k);refreshNav()}
function dzClear(){DZ.sel=null;$$('.chip.picked').forEach(function(c){c.classList.remove('picked')});$$('.dz.picking').forEach(function(c){c.classList.remove('picking')})}
function dzSelect(k,ci,from){
  DZ.sel=(DZ.sel&&DZ.sel.k===k&&DZ.sel.ci===ci&&DZ.sel.from===from)?null:{k:k,ci:ci,from:from};
  $$('.chip.picked').forEach(function(c){c.classList.remove('picked')});
  $$('.dz.picking').forEach(function(c){c.classList.remove('picking')});
  if(DZ.sel){var sel='.chip[data-ck="'+k+'"][data-ci="'+ci+'"]';var c=from!=null?$('.dslot[data-sk="'+k+'"][data-s="'+from+'"] '+sel):$('.pool[data-pk="'+k+'"] '+sel);if(c)c.classList.add('picked');var z=$('.dz[data-k="'+k+'"]');if(z)z.classList.add('picking')}
}
function slotOfChip(ch){var s=ch.closest('.dslot');return s?s.dataset.s:null}
document.addEventListener('pointerdown',function(e){
  var ch=e.target.closest('.chip');if(!ch||ch.disabled||e.button>0)return;
  DZ.drag={ch:ch,k:ch.dataset.ck,ci:+ch.dataset.ci,from:slotOfChip(ch),x:e.clientX,y:e.clientY,on:false,id:e.pointerId};
});
document.addEventListener('pointermove',function(e){
  var d=DZ.drag;if(!d||e.pointerId!==d.id)return;
  if(!d.on){if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)<6)return;
    d.on=true;var r=d.ch.getBoundingClientRect();d.dx=e.clientX-r.left;d.dy=e.clientY-r.top;
    d.g=d.ch.cloneNode(true);d.g.className+=' ghost';d.g.style.width=r.width+'px';document.body.appendChild(d.g);d.ch.classList.add('lifted');dzClear()}
  e.preventDefault();d.g.style.left=(e.clientX-d.dx)+'px';d.g.style.top=(e.clientY-d.dy)+'px';
  $$('.dslot.over').forEach(function(s){s.classList.remove('over')});
  var t=document.elementFromPoint(e.clientX,e.clientY),s=t&&t.closest('.dslot[data-sk="'+d.k+'"]');if(s&&!s.classList.contains('fixed'))s.classList.add('over');
});
document.addEventListener('pointerup',function(e){
  var d=DZ.drag;if(!d||e.pointerId!==d.id)return;DZ.drag=null;if(!d.on)return;
  DZ.justDragged=true;setTimeout(function(){DZ.justDragged=false},50);
  if(d.g)d.g.remove();d.ch.classList.remove('lifted');$$('.dslot.over').forEach(function(s){s.classList.remove('over')});
  var t=document.elementFromPoint(e.clientX,e.clientY),s=t&&t.closest('.dslot[data-sk="'+d.k+'"]'),p=t&&t.closest('.pool[data-pk="'+d.k+'"]');
  if(s&&!s.classList.contains('fixed')){if(s.dataset.s!==d.from)dzPlace(d.k,s.dataset.s,d.ci,d.from)}
  else if(p&&d.from!=null)dzRemove(d.k,d.from);
});
document.addEventListener('pointercancel',function(){var d=DZ.drag;DZ.drag=null;if(d&&d.g){d.g.remove();d.ch.classList.remove('lifted')}});

/* ---------- clicks: chips, slots, zoom, carousel, hide toggle ---------- */
document.addEventListener('click',function(e){
  if(DZ.justDragged){e.preventDefault();return}
  var ch=e.target.closest('.chip');
  if(ch&&!ch.disabled){var from=slotOfChip(ch);
    if(from!=null&&DZ.sel&&DZ.sel.k===ch.dataset.ck&&DZ.sel.from!==from){dzPlace(DZ.sel.k,from,DZ.sel.ci,DZ.sel.from);DZ.sel=null;return}
    dzSelect(ch.dataset.ck,+ch.dataset.ci,from);return}
  var sl=e.target.closest('.dslot[role="button"]');
  if(sl){var k=sl.dataset.sk;
    if(DZ.sel&&DZ.sel.k===k){var sv=DZ.sel;DZ.sel=null;dzPlace(k,sl.dataset.s,sv.ci,sv.from)}
    return}
  var pl=e.target.closest('.pool[data-pk]');
  if(pl&&DZ.sel&&DZ.sel.k===pl.dataset.pk&&DZ.sel.from!=null){var s2=DZ.sel;DZ.sel=null;dzRemove(s2.k,s2.from);return}
  var q=e.target.closest('[data-qa]');if(!q)return;var a=q.dataset.qa;
  if(a==='tog'){var p=q.closest('.part'),h=p.classList.toggle('hid');q.innerHTML=h?'<span>show</span>'+IC.down:'<span>hide</span>'+IC.up;q.setAttribute('aria-expanded',h?'false':'true')}
  else if(a==='zoom'){var f=q.closest('.fig'),w=document.createElement('div');
    w.innerHTML='<div class="modal zm" data-qa="zclose"><div class="box" role="dialog" aria-label="Zoomed view"><button class="nb red sm x" data-qa="zclose">Close ✕</button>'+(f.querySelector('figcaption')?'<h2>'+f.querySelector('figcaption').innerHTML+'</h2>':'')+'<div class="zmb">'+f.querySelector('.figb').innerHTML+'</div></div></div>';
    document.body.appendChild(w.firstChild)}
  else if(a==='zclose'){if(e.target!==q&&q.classList.contains('modal'))return;var m=$('.modal.zm');if(m)m.remove()}
  else if(a==='cprev'||a==='cnext'||a==='cdot'){var c=q.closest('.car'),ss=$$('.slide',c),i=+c.dataset.i;
    i=a==='cdot'?+q.dataset.i:(i+(a==='cnext'?1:-1)+ss.length)%ss.length;c.dataset.i=i;
    ss.forEach(function(s,j){s.classList.toggle('on',j===i)});$$('.dot',c).forEach(function(s,j){s.classList.toggle('on',j===i)})}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){var m=$('.modal.zm');if(m)m.remove();if(DZ.sel)dzClear()}
  var sl=e.target.closest&&e.target.closest('.dslot[role="button"]');
  if(sl&&(e.key==='Enter'||e.key===' ')){e.preventDefault();sl.click()}
});

/* ---------- od: drag lines into indented slots ---------- */
function odSlots(it){var r=[];it.lines.forEach(function(l){if(l.k==='slot')r.push(l.t)});return r}
regType('od',{
  auto:true,
  render:function(it,k,a,ro,rv){
    a=a||{};var used=dzUsed(a),want=odSlots(it),si=0;
    var pool=it.pool.map(function(t,ci){return used[ci]!=null?'':chipHTML(k,ci,t,ro)}).join('');
    var col=it.lines.map(function(l){
      var st='margin-left:'+(l.lv*2.2)+'em';
      if(l.k==='text')return '<div class="odt" style="'+st+'">'+esc(l.t)+'</div>';
      if(l.k==='fixed')return slotHTML(k,'f',esc(l.t),true,'fixed',st);
      var s=si++,ci=a[s],inner=ci!=null?chipHTML(k,ci,it.pool[ci],ro):'';
      return slotHTML(k,s,inner,ro,rv?(ci!=null&&it.pool[ci]===want[s]?'ok':'bad'):'',st);
    }).join('');
    return '<div class="dz od" data-k="'+k+'"><div class="pool" data-pk="'+k+'" aria-label="Steps to place">'+(pool||'<span class="mut">All steps placed.</span>')+'</div><div class="odc">'+col+'</div></div>';
  },
  units:function(it,a){var w=odSlots(it),c=0;w.forEach(function(t,s){if(a[s]!=null&&it.pool[a[s]]===t)c++});return [c,w.length]},
  isAns:function(it,a){return Object.keys(a).length>0},
  guide:function(it){return '<p><b>Correct order:</b></p><pre class="odg">'+esc(it.lines.map(function(l){return new Array(l.lv+1).join('    ')+l.t}).join('\n'))+'</pre>'},
  compare:function(it,a){a=a||{};var w=odSlots(it);return w.map(function(t,s){var y=a[s]!=null?it.pool[a[s]]:'No answer';return ['Slot '+(s+1),y,t,y===t]})}
});

/* ---------- dm: drag labels into boxes beside statements ---------- */
regType('dm',{
  auto:true,
  render:function(it,k,a,ro,rv){
    a=a||{};var used=dzUsed(a);
    var pool=it.tok.map(function(t,ci){return !it.reuse&&used[ci]!=null?'':chipHTML(k,ci,t,ro)}).join('');
    var rows=it.r.map(function(r,s){var ci=a[s];
      return '<div class="dmq-row">'+slotHTML(k,s,ci!=null?chipHTML(k,ci,it.tok[ci],ro):'',ro,rv?(ci===r[1]?'ok':'bad'):'')+'<div class="dmq-text">'+r[0]+'</div></div>'}).join('');
    return '<div class="dz dm" data-k="'+k+'"><div class="pool row" data-pk="'+k+'" aria-label="Labels to place">'+(pool||'<span class="mut">All labels placed.</span>')+'</div><div class="dmq-rows">'+rows+'</div></div>';
  },
  units:function(it,a){var c=0;it.r.forEach(function(r,s){if(a[s]===r[1])c++});return [c,it.r.length]},
  isAns:function(it,a){return Object.keys(a).length>0},
  guide:function(it){return '<p><b>Correct answers:</b></p>'+critList(it.r.map(function(r){return r[0]+' → <b>'+esc(it.tok[r[1]])+'</b>'}))},
  compare:function(it,a){a=a||{};return it.r.map(function(r,s){return [plain(r[0]),a[s]!=null?it.tok[a[s]]:'No answer',it.tok[r[1]],a[s]===r[1]]})}
});

/* ---------- ft: table the student types into, marked by AI ---------- */
function ftTable(it,cell){
  return '<div class="tw"><table class="hoa ftab"><tr>'+it.h.map(function(c,ci){return '<th'+(it.wd?' style="width:'+it.wd[ci]+'"':'')+'>'+c+'</th>'}).join('')+'</tr>'+
    it.r.map(function(row,r){return '<tr>'+row.map(function(c,ci){return '<td>'+cell(c,r,ci)+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>';
}
function ftText(it,get){return it.r.map(function(row,r){return 'Row '+(r+1)+': '+row.map(function(c,ci){return plain(it.h[ci])+' = '+(c!=null?plain(c):(get(r,ci)||'(blank)'))}).join(' | ')}).join('\n')}
function ftModel(it,r,ci){var m=it.model[r];return m&&m[ci]!=null?m[ci]:''}
regType('ft',{
  cls:'written',
  render:function(it,k,a,ro){
    a=a||{};
    return '<div class="dz ft" data-k="'+k+'">'+ftTable(it,function(c,r,ci){
      if(c!=null)return c;
      return '<input class="fti" data-fk="'+k+'" data-c="'+r+','+ci+'" value="'+esc(a[r+','+ci]||'')+'" aria-label="'+esc(plain(it.h[ci]))+', row '+(r+1)+'" autocomplete="off"'+(ro?' readonly':'')+'>'})+'</div>';
  },
  isAns:function(it,a){return Object.keys(a).some(function(x){return String(a[x]).trim()})},
  sample:function(it){return ftTable(it,function(c,r,ci){return c!=null?c:esc(ftModel(it,r,ci))})},
  preview:function(it,a){a=a||{};return '<div class="yans">'+ftTable(it,function(c,r,ci){return c!=null?c:esc(a[r+','+ci]||'')})+'</div>'}
});
document.addEventListener('input',function(e){
  var t=e.target;if(!t.dataset||!t.dataset.fk||t.readOnly||!canEdit())return;
  var A=ANS(CUR.b),k=t.dataset.fk,a=A[k]||{};
  if(t.value.trim())a[t.dataset.c]=t.value;else delete a[t.dataset.c];
  A[k]=a;save();refreshNav();
});
