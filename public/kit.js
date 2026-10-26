/* ---------- authoring kit: extra question constructors and stimulus panels ----------
   Loaded after helpers.js and before the banks. The behaviour of each type
   (drawing, marking, review) lives in qtypes.js. See AUTHORING.md for examples. */

/* small seeded shuffle so the drag pool is mixed up but the same on every load */
function seedOf(s){var h=2166136261;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function shuffled(list,seed){
  var a=list.slice(),x=seedOf(seed)||1;
  for(var i=a.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;var j=x%(i+1),t=a[i];a[i]=a[j];a[j]=t}
  if(a.length>1&&a.join('\n')===list.join('\n'))a.push(a.shift());
  return a;
}

/* Drag lines into indented slots to complete an algorithm (HSC sample Q9).
   src is pseudocode, one line per row, indented with spaces or tabs as it should look.
   A marker after the indentation sets what the line becomes:
     # BEGIN Name        shown as plain text, not a slot
         = Set guess = -1  a slot that is already filled in
         Get guess         no marker: an empty slot; its text goes into the drag pool
   opt.extra adds distractor lines that belong nowhere. opt.why explains the answer. */
function od(q,src,m,opt){
  opt=opt||{};
  var raw=String(src).replace(/\t/g,'    ').split('\n').filter(function(l){return l.trim()});
  var ind=raw.map(function(l){return l.match(/^ */)[0].length}),unit=0;
  ind.forEach(function(n){if(n&&(!unit||n<unit))unit=n});unit=unit||4;
  var base=Math.min.apply(null,ind);
  var lines=raw.map(function(l,i){
    var t=l.trim(),kind='slot';
    if(t.charAt(0)==='#'){kind='text';t=t.slice(1).trim()}
    else if(t.charAt(0)==='='){kind='fixed';t=t.slice(1).trim()}
    return {k:kind,t:t,lv:Math.round((ind[i]-base)/unit)};
  });
  var ans=lines.filter(function(l){return l.k==='slot'}).map(function(l){return l.t});
  return {t:'od',q:q,lines:lines,pool:shuffled(ans.concat(opt.extra||[]),q+src),m:m||1,why:opt.why||''};
}

/* Drag labels into the box beside each statement (HSC sample Q5).
   tokens: the labels. rows: [statement, index of correct token].
   opt.reuse lets one label be used in more than one box. */
function dm(q,tokens,rows,m,opt){
  opt=opt||{};
  return {t:'dm',q:q,tok:tokens,r:rows,m:m||1,reuse:!!opt.reuse,why:opt.why||''};
}

/* A table the student types into, marked by AI (HSC sample Q11).
   cols: header cells. rows: a number of blank rows, or an array of rows where a
   string is fixed text and null is a box to type in. model: sample rows (same shape)
   shown after marking and sent to the marker. */
function ft(q,m,cols,rows,model,crit,opt){
  opt=opt||{};
  if(typeof rows==='number'){var n=rows;rows=[];for(var i=0;i<n;i++)rows.push(cols.map(function(){return null}))}
  return {t:'ft',q:q,m:m,h:cols,r:rows,model:model||[],crit:crit||[],wd:opt.widths||null};
}

/* ---------- stimulus panels (use inside the stimulus string of Q()) ---------- */
/* A bordered panel with a caption and a zoom button. */
function fig(label,html,opt){
  opt=opt||{};
  return '<figure class="fig'+(opt.wide?' wide':'')+'">'+(label?'<figcaption>'+label+'</figcaption>':'')+
    '<button type="button" class="zoom" data-qa="zoom" aria-label="Zoom in">+</button><div class="figb">'+html+'</div></figure>';
}
/* Side-by-side cells inside one panel, eg Image 1 and Image 2: [[label, html], ...] */
function sbs(list){return '<div class="sbs">'+list.map(function(c){return '<div class="sbsc">'+(c[0]?'<div class="sbsl">'+c[0]+'</div>':'')+'<div class="sbsb">'+c[1]+'</div></div>'}).join('')+'</div>'}
/* Code files in one zoomable panel: [[filename, code], ...] */
function files(list,label){return fig(label||'',list.map(function(f){return '<div class="file"><div class="fname">'+esc(f[0])+'</div>'+code(f[1])+'</div>'}).join(''))}
/* A table whose cells are coloured by value. colours: {'English':'#f7c6c7', ...}.
   A cell can also be [text, colour]. First column is shown as row labels. */
function ctbl(h,rows,colours,cap){
  colours=colours||{};
  function cell(c,ci){var t=c,bg=null;if(Array.isArray(c)){t=c[0];bg=c[1]}else bg=colours[c];return '<td'+(ci===0?' class="rl"':'')+(bg?' style="background:'+bg+';color:#000"':'')+'>'+t+'</td>'}
  return (cap?'<p class="ttl">'+cap+'</p>':'')+'<div class="tw"><table class="hoa ctbl"><tr>'+h.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr>'+rows.map(function(r){return '<tr>'+r.map(cell).join('')+'</tr>'}).join('')+'</table></div>';
}
/* A slide carousel with arrows and dots (HSC sample Q25). Each slide is HTML; slide() builds a titled one. */
function slides(list,label){
  return '<div class="car" data-i="0">'+(label?'<p class="ttl">'+label+'</p>':'')+'<div class="carw"><button type="button" class="carb" data-qa="cprev" aria-label="Previous slide">‹</button><div class="cars">'+
    list.map(function(s,i){return '<div class="slide'+(i?'':' on')+'" role="group" aria-label="Slide '+(i+1)+' of '+list.length+'">'+s+'</div>'}).join('')+
    '</div><button type="button" class="carb" data-qa="cnext" aria-label="Next slide">›</button></div><div class="dots">'+
    list.map(function(s,i){return '<button type="button" class="dot'+(i?'':' on')+'" data-qa="cdot" data-i="'+i+'" aria-label="Go to slide '+(i+1)+'"></button>'}).join('')+'</div></div>';
}
function slide(title,html,art){return '<div class="sl"><div class="slt"><h4>'+title+'</h4>'+html+'</div>'+(art?'<div class="sla">'+art+'</div>':'')+'</div>'}

/* ---------- HTML and CSS (web page) questions ----------
   wb(q, m, files, model, crit, opt) builds a part where the student writes HTML and/or CSS
   and sees the page rendered beside the editor.
     files: [[name, starter, editable], ...] with exactly one .html file and at most one .css file.
            editable defaults to true; a file with editable false is given in the question.
     model: {name: sample file contents} for each editable file.
     opt.height: preview height in pixels (default 260).
   The saved answer is {name: text} for the editable files the student changed.
   webview(label, html, css, opt) shows a rendered page in a stimulus, eg "Image 1".
   Pages are rendered in a sandboxed frame with no scripts and no network access. */
function wb(q,m,fl,model,crit,opt){
  opt=opt||{};
  return {t:'wb',q:q,m:m,f:fl.map(function(f){return {n:f[0],s:f[1]||'',e:f[2]!==false}}),model:model||{},crit:crit||[],ht:opt.height||260};
}
/* Each file's current text: the student's version of editable files, the starter otherwise. */
function wbFiles(it,a){
  var out={};a=a&&typeof a==='object'?a:{};
  it.f.forEach(function(f){out[f.n]=f.e&&typeof a[f.n]==='string'?a[f.n]:f.s});
  return out;
}
var WEB_HEAD='<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:">';
/* The document the browser renders. Like a real browser, the style sheet only applies when the
   HTML links to it with <link rel="stylesheet" href="name.css">. */
function webDoc(html,css,cssName){
  html=String(html||'');
  if(cssName){
    var name=String(cssName).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    html=html.replace(/<link\b[^>]*>/gi,function(tag){
      if(!/\brel\s*=\s*["']?stylesheet\b/i.test(tag)||!new RegExp('\\bhref\\s*=\\s*["\']?(?:\\./)?'+name+'["\'\\s>]','i').test(tag))return tag;
      return '<style>'+String(css||'').replace(/<\/style/gi,'<\\/style')+'</style>';
    });
  }
  // The security header goes first in <head>; keep any DOCTYPE first so the page stays in standards mode.
  if(/<head\b[^>]*>/i.test(html))return html.replace(/<head\b[^>]*>/i,function(m){return m+WEB_HEAD});
  if(/<html\b[^>]*>/i.test(html))return html.replace(/<html\b[^>]*>/i,function(m){return m+'<head>'+WEB_HEAD+'</head>'});
  if(/^\s*<!doctype[^>]*>/i.test(html))return html.replace(/^\s*<!doctype[^>]*>/i,function(m){return m+WEB_HEAD});
  return WEB_HEAD+html;
}
function wbDoc(it,files){
  var h=null,c=null;
  it.f.forEach(function(f){if(/\.html?$/i.test(f.n)&&h==null)h=f.n;if(/\.css$/i.test(f.n)&&c==null)c=f.n});
  return webDoc(h?files[h]:'',c?files[c]:'',c);
}
function webFrame(doc,title,height,id){
  return '<iframe class="webv"'+(id?' id="'+id+'"':'')+' sandbox="" referrerpolicy="no-referrer" title="'+esc(title)+'" style="height:'+(height||260)+'px" srcdoc="'+esc(doc)+'"></iframe>';
}
/* webview always applies the css it is given (no link needed), so a stimulus can show any page. */
function webview(label,html,css,opt){
  opt=opt||{};html=String(html||'');
  if(css!=null){var st='<style>'+String(css).replace(/<\/style/gi,'<\\/style')+'</style>';html=/<\/head>/i.test(html)?html.replace(/<\/head>/i,st+'</head>'):st+html}
  return fig(label,webFrame(webDoc(html),opt.title||label||'Rendered web page',opt.height||220),{wide:opt.wide});
}
