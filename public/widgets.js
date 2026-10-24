/* ---------- engines (loaded on first use) ---------- */
var PYBASE=window.PYBASE||'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
var SQLSRC=window.SQLSRC||'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-asm.js';
var PYP=null,SQLP=null;
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('Could not load '+src))};document.head.appendChild(s)})}
function loadPy(){if(!PYP)PYP=loadScript(PYBASE+'pyodide.js').then(function(){return loadPyodide({indexURL:PYBASE})}).catch(function(e){PYP=null;throw e});return PYP}
function loadSQL(){if(!SQLP)SQLP=(typeof initSqlJs==='function'?Promise.resolve():loadScript(SQLSRC)).then(function(){return initSqlJs()}).catch(function(e){SQLP=null;throw e});return SQLP}
function runPy(src,inputs,interactive){
  return loadPy().then(function(py){
    var out='',q=(inputs||[]).slice();
    py.setStdout({batched:function(s){out+=s+'\n'}});py.setStderr({batched:function(s){out+=s+'\n'}});
    py.setStdin({stdin:function(){if(q.length)return q.shift();if(interactive){var v=prompt('Python input:');return v===null?null:v}return null}});
    try{py.runPython(src,{globals:py.globals.get('dict')()})}catch(e){var m=String(e.message||e).trim().split('\n');out+=m.slice(-3).join('\n')+'\n'}
    return out;
  });
}
function sqlType(v){return typeof v==='number'?(v%1?'REAL':'INTEGER'):'TEXT'}
function mkDB(SQL,db){
  var d=new SQL.Database();
  Object.keys(db).forEach(function(n){var t=db[n];
    d.run('CREATE TABLE '+n+'('+t.c.map(function(c,i){return c+' '+sqlType(t.r[0][i])}).join(',')+')');
    t.r.forEach(function(r){d.run('INSERT INTO '+n+' VALUES('+r.map(function(){return '?'}).join(',')+')',r)});
  });
  return d;
}
function translate(raw){
  var s=raw.replace(/[‘’]/g,"'").trim().replace(/;+\s*$/,'');
  s=s.replace(/\bDOES\s+NOT\s+CONTAIN\s+('(?:[^']|'')*')/gi,function(m,q){return "NOT LIKE '%"+q.slice(1,-1)+"%'"});
  s=s.replace(/\bCONTAINS?\s+('(?:[^']|'')*')/gi,function(m,q){return "LIKE '%"+q.slice(1,-1)+"%'"});
  return s.split(/('(?:[^']|'')*')/).map(function(seg,i){
    if(i%2)return seg;
    return seg.replace(/\bNOT\s+EQUAL\s+TO\b/gi,'<>').replace(/\bGREATER\s+THAN\s+OR\s+EQUAL\s+TO\b/gi,'>=').replace(/\bLESS\s+THAN\s+OR\s+EQUAL\s+TO\b/gi,'<=').replace(/\bGREATER\s+THAN\b/gi,'>').replace(/\bLESS\s+THAN\b/gi,'<').replace(/\bEQUALS\b/gi,'=');
  }).join('');
}
function runSQL(db,raw){
  return loadSQL().then(function(SQL){
    var d=mkDB(SQL,db),s=translate(raw);
    if(!raw.trim())return {error:'Type a query first.'};
    if(!/^select\b/i.test(s))return {error:'Only SELECT queries are used in this exam.'};
    try{var r=d.exec(s);d.close();if(!r.length)return {cols:[],rows:[]};return {cols:r[0].columns,rows:r[0].values}}
    catch(e){return {error:String(e&&e.message||e)}}
  });
}
function nv(v){return typeof v==='number'?Math.round(v*10000)/10000:v}
function sameRows(a,b,ord){
  if(a.length!==b.length)return false;
  var x=a.map(function(r){return JSON.stringify(r.map(nv))}),y=b.map(function(r){return JSON.stringify(r.map(nv))});
  if(!ord){x.sort();y.sort()}
  return x.join('|')===y.join('|');
}
function resHTML(r){
  if(r.error)return '<div class="er">'+esc(r.error)+'</div>';
  if(!r.cols.length)return 'The query ran and returned no columns.';
  return '<table><tr>'+r.cols.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr>'+r.rows.map(function(row){return '<tr>'+row.map(function(v){return '<td>'+(v===null?'NULL':esc(nv(v)))+'</td>'}).join('')+'</tr>'}).join('')+'</table><div>'+r.rows.length+(r.rows.length===1?' row':' rows')+'</div>';
}

/* ---------- scoring ---------- */
function units(it,a){
  var c=0,t=0;a=a||{};
  if(it.t==='dd'){it.b.forEach(function(bl,u){t++;if(a[u]===bl[1])c++})}
  else if(it.t==='gd'){it.r.forEach(function(row,r){row.forEach(function(cell,ci){if(typeof cell!=='string'){t++;if(a[r+','+ci]===cell[1])c++}})})}
  else if(it.t==='mt'){it.r.forEach(function(row,r){t++;if(a[r]===row[1])c++})}
  else if(it.t==='tk'){var sel=Array.isArray(a)?a:[];it.r.forEach(function(row,r){row[1].forEach(function(ci){t++;if(sel.indexOf(r+','+ci)>=0)c++});sel.forEach(function(s){var p=s.split(',');if(+p[0]===r&&row[1].indexOf(+p[1])<0)c--})});if(c<0)c=0}
  return [c,t];
}
var AUTO={mc:1,ms:1,dd:1,gd:1,mt:1,tk:1};
function suggestion(bs,k,it){var c=bs.chk[k];return c&&c.t&&c.p===c.t?it.m:null}
function score(b,n,i){
  var bs=BS(b.id),it=b.qs[n-1].it[i],k=n+'.'+i,a=bs.ans[k],m=it.m,g=0;
  if(it.t==='mc')g=a===it.a?1:0;
  else if(it.t==='ms'){var s=Array.isArray(a)?a:[],w=0;s.forEach(function(x){if(it.a.indexOf(x)<0)w++});it.a.forEach(function(x){if(s.indexOf(x)<0)w++});g=m===1?(w===0?1:0):Math.max(0,m-w)}
  else if(AUTO[it.t]){var u=units(it,a);g=u[0]===u[1]?m:Math.floor(m*u[0]/u[1]+1e-9)}
  else{var sv=bs.self[k],src='self';if(sv==null){var ai=bs.ai[k];if(ai&&ai.g!=null){sv=ai.g;src='ai'}}if(sv==null){sv=suggestion(bs,k,it);src='test'}return {g:sv==null?0:sv,m:m,auto:false,set:sv!=null,src:src}}
  return {g:g,m:m,auto:true,set:true};
}
function isAns(it,a){
  if(a==null)return false;
  if(it.t==='mc')return typeof a==='number';
  if(it.t==='ms'||it.t==='tk')return a.length>0;
  if(it.t==='dd'||it.t==='gd'||it.t==='mt')return Object.keys(a).length>0;
  if(it.t==='tx')return a.replace(/<[^>]*>/g,'').trim().length>0;
  if(it.t==='dr')return !!(a.e&&a.e.length);
  return String(a).trim().length>0;
}
function qAnswered(b,n){var bs=BS(b.id);return b.qs[n-1].it.some(function(it,i){return isAns(it,bs.ans[n+'.'+i])})}
function normOut(x){return String(x).trim().split('\n').map(function(y){return y.replace(/\s+$/,'')}).join('\n')}
function passTest(out,t){return normOut(out).slice(-normOut(t.o).length)===normOut(t.o)&&(t.exact?normOut(out)===normOut(t.o):true)}
function runChecks(b){
  var bs=BS(b.id),jobs=[];
  b.qs.forEach(function(q,qi){q.it.forEach(function(it,i){
    var k=(qi+1)+'.'+i,a=bs.ans[k];
    if(it.t==='py'&&a&&it.tests.length){
      var p=0;
      jobs.push(it.tests.reduce(function(pr,t){return pr.then(function(){return runPy(a+'\n'+(t.app||''),t.i||[],false).then(function(o){if(passTest(o,t))p++})})},Promise.resolve()).then(function(){bs.chk[k]={p:p,t:it.tests.length}}).catch(function(){}));
    }else if(it.t==='sq'&&a&&q.db){
      jobs.push(Promise.all([runSQL(q.db,a),runSQL(q.db,it.model)]).then(function(r){bs.chk[k]={p:(!r[0].error&&sameRows(r[0].rows,r[1].rows,it.ord))?1:0,t:1}}).catch(function(){}));
    }
  })});
  return Promise.all(jobs).then(save);
}

/* ---------- item rendering ---------- */
function selHTML(k,u,opts,cur,ro,cls){
  return '<select class="hoa-select'+(cls?' '+cls:'')+'" data-k="'+k+'" data-u="'+u+'" aria-label="Select an answer"'+(ro?' disabled':'')+'><option value=""></option>'+opts.map(function(o,j){return '<option value="'+j+'"'+(cur===j?' selected':'')+'>'+esc(o)+'</option>'}).join('')+'</select>';
}
function gutNums(s){var n=Math.max(2,String(s).split('\n').length),r=[];for(var i=1;i<=n;i++)r.push(i);return r.join('\n')}
function wcount(html){var t=html.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim();return t?t.split(/\s+/).length:0}
function codeBox(it,k,a,ro,label){
  var kind={py:'PYTHON',ps:'PSEUDOCODE',sq:'QUERY (SQL)'}[it.t],hasRun=it.t!=='ps';
  var ph=it.t==='py'?'# Input code':it.t==='sq'?'-- Input query':'// Input pseudocode';
  var val=a!=null?a:(it.start||'');
  return '<div class="cbox" data-k="'+k+'"><div class="cbar"><span class="hoa-q" style="margin:0">'+label+'</span><div class="btns">'+
    '<button class="nb" data-act="full" data-k="'+k+'">Full screen</button>'+(hasRun&&!ro?'<button class="nb" data-act="run" data-k="'+k+'">Run</button>':'')+(it.t==='sq'?'':'')+'</div></div>'+
    '<div class="split'+(hasRun?'':' one')+'"><div class="ace"><div class="gut" id="g'+k+'">'+gutNums(val)+'</div><textarea data-k="'+k+'" data-code="1" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" placeholder="'+ph+'" aria-label="'+kind+' editor"'+(ro?' readonly':'')+'>'+esc(val)+'</textarea></div>'+
    (hasRun?'<div class="out ph" id="o'+k+'"># Output</div>':'')+'</div></div>';
}
function drawBox(it,k,ro,label){
  return '<div class="cbox dbox" data-k="'+k+'"><div class="cbar"><span class="hoa-q" style="margin:0">'+label+'</span><div class="btns"><button class="nb" data-act="full" data-k="'+k+'">Full screen</button>'+(ro?'':'<button class="nb" data-act="xreset" data-k="'+k+'">Reset</button>')+'</div></div><div class="xd'+(ro?' ro':'')+'" id="x'+k+'" data-k="'+k+'"><div class="xdl">Loading the drawing tool...</div></div></div>';
}
function itemHTML(b,n,i,rv){
  var q=b.qs[n-1],it=q.it[i],bs=BS(b.id),k=n+'.'+i,a=bs.ans[k],ro=!!rv,h='<div class="part">';
  var mk=(q.it.length>1&&!/marks?\)/.test(it.q))?' <span style="font-weight:700">('+(it.m===1?'1 mark':it.m+' marks')+')</span>':'';
  var lab=(it.lb?'<span class="plab">'+it.lb+'</span>':'')+it.q+mk;
  if(it.t==='py'||it.t==='ps'||it.t==='sq'){h+=codeBox(it,k,a,ro,lab)}
  else if(it.t==='dr'){h+=drawBox(it,k,ro,lab)}
  else{
    if(lab)h+='<p class="hoa-q">'+lab+'</p>';
    if(it.t==='mc'){
      h+='<ul class="hoa-q-mc">'+it.o.map(function(o,j){var c='';if(rv){if(j===it.a)c=' class="okc"';else if(a===j)c=' class="badc"'}
        return '<li><label'+c+'><input type="radio" name="r'+k+'" data-k="'+k+'" data-v="'+j+'"'+(a===j?' checked':'')+(ro?' disabled':'')+'><span>'+o+'</span></label></li>'}).join('')+'</ul>';
    }else if(it.t==='ms'){
      var s=Array.isArray(a)?a:[];
      h+='<ul class="hoa-q-mc">'+it.o.map(function(o,j){var c='';if(rv){if(it.a.indexOf(j)>=0)c=' class="okc"';else if(s.indexOf(j)>=0)c=' class="badc"'}
        return '<li><label'+c+'><input type="checkbox" data-k="'+k+'" data-v="'+j+'"'+(s.indexOf(j)>=0?' checked':'')+(ro?' disabled':'')+'><span>'+o+'</span></label></li>'}).join('')+'</ul>';
    }else if(it.t==='dd'){
      var t=it.tpl.replace(/\{(\d+)\}/g,function(m,u){u=+u;var bl=it.b[u],cur=a?a[u]:undefined;return selHTML(k,u,bl[0],cur,ro,rv?(cur===bl[1]?'ok':'bad'):'')});
      h+='<div class="tpl">'+t+'</div>';
    }else if(it.t==='gd'){
      h+='<div class="tw"><table class="hoa"><tr>'+it.h.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr>'+it.r.map(function(row,r){return '<tr>'+row.map(function(cell,ci){
        if(typeof cell==='string')return '<td'+(ci===0?' class="rl"':'')+'>'+cell+'</td>';
        var cur=a?a[r+','+ci]:undefined;return '<td>'+selHTML(k,r+','+ci,cell[0],cur,ro,rv?(cur===cell[1]?'ok':'bad'):'')+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>';
    }else if(it.t==='mt'){
      h+='<div class="tw"><table class="hoa"><tr>'+it.h.map(function(c,ci){return '<th'+(ci?' class="c"':'')+'>'+c+'</th>'}).join('')+'</tr>'+it.r.map(function(row,r){var cur=a?a[r]:undefined;
        return '<tr><td class="rl">'+row[0]+'</td>'+it.h.slice(1).map(function(c,ci){var cl='';if(rv&&ci===row[1])cl=' okc';else if(rv&&cur===ci)cl=' badc';
          return '<td class="c'+cl+'"><input type="radio" name="m'+k+'.'+r+'" data-k="'+k+'" data-u="'+r+'" data-v="'+ci+'" aria-label="'+esc(c)+'"'+(cur===ci?' checked':'')+(ro?' disabled':'')+'></td>'}).join('')+'</tr>'}).join('')+'</table></div>';
    }else if(it.t==='tk'){
      var sel=Array.isArray(a)?a:[];
      h+='<div class="tw"><table class="hoa"><tr>'+it.h.map(function(c,ci){return '<th'+(ci?' class="c"':'')+'>'+c+'</th>'}).join('')+'</tr>'+it.r.map(function(row,r){
        return '<tr><td class="rl">'+row[0]+'</td>'+it.h.slice(1).map(function(c,ci){var on=sel.indexOf(r+','+ci)>=0,want=row[1].indexOf(ci)>=0,cl='';if(rv&&want)cl=' okc';else if(rv&&on)cl=' badc';
          return '<td class="c'+cl+'"><input type="checkbox" data-k="'+k+'" data-u="'+r+','+ci+'" aria-label="'+esc(c)+'"'+(on?' checked':'')+(ro?' disabled':'')+'></td>'}).join('')+'</tr>'}).join('')+'</table></div>';
    }else if(it.t==='tx'){
      var tb=[['bold','B'],['underline','U'],['italic','I'],['insertUnorderedList','•≡'],['insertOrderedList','1≡'],['outdent','⇤'],['indent','⇥'],['subscript','x₂'],['superscript','x²'],['removeFormat','✕'],['undo','↩'],['redo','↪'],['sym:Ω','Ω'],['sym:Σ','Σ']];
      var wc=wcount(a||'');
      h+='<div class="rte">'+(ro?'':'<div class="rtb" role="toolbar">'+tb.map(function(t){return '<button type="button" data-act="rt" data-c="'+t[0]+'" aria-label="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>')+
        '<div class="rta" data-k="'+k+'" contenteditable="'+(ro?'false':'true')+'" role="textbox" aria-multiline="true" aria-label="Your answer">'+(a||'')+'</div></div><div class="wc'+(wc>it.w?' over':'')+'" id="wc'+k+'">'+wc+' / '+it.w+' words</div>';
    }
  }
  return h+(rv?guideHTML(b,n,i):'')+'</div>';
}
function critList(c){return c&&c.length?'<ul>'+c.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul>':''}
function guideHTML(b,n,i){
  var it=b.qs[n-1].it[i],bs=BS(b.id),k=n+'.'+i,a=bs.ans[k],sc=score(b,n,i),h='<div class="guide"><h4>Marking guide <span class="sc">'+sc.g+' / '+sc.m+'</span></h4>';
  if(it.t==='mc')h+='<p><b>Correct answer:</b> '+it.o[it.a]+'</p>';
  else if(it.t==='ms')h+='<p><b>Correct answers:</b></p>'+critList(it.a.map(function(j){return it.o[j]}));
  else if(it.t==='dd'){h+='<p><b>Correct answer:</b></p><div class="tpl">'+it.tpl.replace(/\{(\d+)\}/g,function(m,u){var bl=it.b[+u];return '<b>['+bl[0][bl[1]]+']</b>'})+'</div>'}
  else if(it.t==='gd'){h+='<p><b>Correct answers:</b></p><div class="tw"><table class="hoa"><tr>'+it.h.map(function(c){return '<th>'+c+'</th>'}).join('')+'</tr>'+it.r.map(function(row){return '<tr>'+row.map(function(c){return '<td>'+(typeof c==='string'?c:'<b>'+c[0][c[1]]+'</b>')+'</td>'}).join('')+'</tr>'}).join('')+'</table></div>'}
  else if(it.t==='mt'){h+='<p><b>Correct answers:</b></p>'+critList(it.r.map(function(r){return r[0]+' → <b>'+it.h[r[1]+1]+'</b>'}))}
  else if(it.t==='tk'){h+='<p><b>Correct answers:</b></p>'+critList(it.r.map(function(r){return r[0]+' → <b>'+(r[1].map(function(c){return it.h[c+1]}).join(', ')||'none')+'</b>'}))}
  else{
    h+=aiBlock(b,n,i,it,bs,k,a,sc);
    if(it.t==='py'||it.t==='ps'||it.t==='sq')h+='<p><b>Sample answer:</b></p><pre>'+esc(it.model)+'</pre>';
    else h+='<p><b>Sample answer:</b></p><div>'+it.model+'</div>';
    if(it.t==='dr'&&a&&a.e&&a.e.length)h+='<details class="xdd"><summary>How your diagram was read for marking</summary><pre>'+esc(xdText(a.e))+'</pre></details>';
    if(it.crit.length)h+='<p><b>Marking criteria</b></p>'+critList(it.crit);
    var c=bs.chk[k];if(c)h+='<p><b>Automatic check:</b> '+(it.t==='sq'?(c.p?'your query returned the same rows as the sample query':'your query returned different rows from the sample query'):c.p+' of '+c.t+' test runs gave the expected output')+'.</p>';
    else if(it.t==='sq'||(it.t==='py'&&it.tests.length))h+='<p><b>Automatic check:</b> '+(isAns(it,a)?'running...':'no answer to check')+'</p>';
    h+='<div class="smk"><span>'+(bs.ai[k]&&bs.ai[k].g!=null?'Change the mark:':'Your mark:')+'</span>';for(var j=0;j<=it.m;j++)h+='<button data-act="sm" data-k="'+k+'" data-v="'+j+'"'+(sc.set&&sc.g===j?' class="on"':'')+'>'+j+'</button>';h+='</div>';
  }
  if(it.why)h+='<p style="margin-top:8px">'+it.why+'</p>';
  return h+'</div>';
}

