/* ---------- theme + toolbar ---------- */
var FG=[['Default','#000000'],['White','#ffffff'],['Navy','#002664'],['Yellow','#ffe600'],['Green','#7CFC00']];
var BGS=[['Default','#ffffff','#f2f2f2'],['Light yellow','#fffbd6','#f4efbb'],['Light blue','#e3f2fa','#cfe6f2'],['Light pink','#fdeaf0','#f4d3de'],['Black','#000000','#1b1b1b'],['Dark grey','#222222','#333333']];
var FSN=['Regular','Large','Extra Large','XX Large'];
var MENU={},CPK='',CUR={b:null,n:0,rv:false},INFO=false;
function applyTheme(){
  document.body.className='fs'+S.font;
  var r=document.documentElement.style;
  r.setProperty('--pfg',FG[S.fg][1]);r.setProperty('--pbg',BGS[S.bg][1]);r.setProperty('--ibg',BGS[S.bg][2]);
}
function toolsHTML(full){
  var bs=CUR.b?BS(CUR.b.id):null,fl=bs&&bs.flags[CUR.n];
  function tb(id,ic,lab,menu,cls){var open=!!MENU[id];return '<div class="tb"><button class="tbb'+(cls||'')+(open?' on':'')+'" data-act="'+(menu?'menu':id)+'" data-m="'+id+'"'+(menu?' aria-expanded="'+open+'"':'')+'>'+ic+'<span>'+lab+'</span>'+(menu?'<span class="drop'+(open?' open':'')+'">'+(open?IC.up:IC.down)+'</span>':'')+'</button>'+(open?menuHTML(id):'')+'</div>'}
  return (full?tb('flag','<span class="tic flagc">'+IC.flag+'</span>',fl?'REMOVE FLAG':'FLAG',false,fl?' flagged':'')+tb('hl','<span class="tic">'+IC.pen+'</span>','HIGHLIGHT',true):'')+tb('fs','<span class="tic">'+IC.font+'</span>','FONT SIZE',true)+tb('col','<span class="tic">'+IC.contrast+'</span>','COLOUR',true)+(full?tb('info','<span class="tic">'+IC.key+'</span>','INFO',false,' info'):'');
}
function cpick(w,list,cur){
  return '<div class="cpk"><button type="button" class="cpb" data-act="cpk" data-w="'+w+'" aria-label="'+(w==='fg'?'Font':'Background')+' colour, '+list[cur][0]+'"><i class="sw" style="background:'+list[cur][1]+'"></i><span class="tri">&#9660;</span></button>'+
    (CPK===w?'<div class="pal">'+list.map(function(c,i){return '<button type="button" class="pw'+(i===cur?' sel':'')+'" data-act="'+w+'" data-v="'+i+'" title="'+c[0]+'" aria-label="'+c[0]+'" style="background:'+c[1]+'"></button>'}).join('')+'</div>':'')+'</div>';
}
function menuHTML(id){
  if(id==='hl')return '<div class="ddm hl"><div class="ddl">Choose colour:</div><div class="sws"><button type="button" class="swb y" data-act="hl" data-c="yellow" aria-label="Yellow"></button><button type="button" class="swb b" data-act="hl" data-c="blue" aria-label="Blue"></button><button type="button" class="swb r" data-act="hl" data-c="red" aria-label="Pink"></button></div><button type="button" class="nocol" data-act="hl" data-c="none">No colour</button></div>';
  if(id==='fs')return '<div class="ddm fs">'+FSN.map(function(n,i){var on=S.font===i;return '<button type="button" data-act="fs" data-v="'+i+'" role="menuitemradio" aria-checked="'+on+'"><span class="ck">'+(on?IC.chk:'')+'</span>'+n+'</button>'}).join('')+'</div>';
  if(id==='col')return '<div class="ddm col"><div class="crow"><span>Font colour:</span>'+cpick('fg',FG,S.fg)+'</div><div class="crow"><span>Background colour:</span>'+cpick('bg',BGS,S.bg)+'</div><button type="button" class="rst" data-act="creset">'+IC.reset+'<span>reset to default settings</span></button></div>';
  return '';
}
function redrawTools(){var t=$('#tools');if(t)t.innerHTML=toolsHTML(!!CUR.b&&CUR.n>0)}
function fmtT(s){if(s<=0)return 'Time up';var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=Math.floor(s%60);return h+':'+(m<10?'0':'')+m+':'+(x<10?'0':'')+x}
function paperDuration(b){return b&&b.duration?b.duration:140*60}
function paperTime(b){var minutes=paperDuration(b)/60,h=Math.floor(minutes/60),m=minutes%60;return (h?h+' hour'+(h===1?'':'s')+(m?' ':''):'')+(m?m+' minute'+(m===1?'':'s'):'')}
function tick(){var t=$('#tmr');if(!t||!CUR.b)return;var bs=BS(CUR.b.id);t.textContent=fmtT(paperDuration(CUR.b)-(bs.start?Math.floor((Date.now()-bs.start)/1000):0))}
setInterval(tick,1000);

/* ---------- page frames ---------- */
function frame(title,main,opt){
  opt=opt||{};
  var right;
  if(opt.timer){right='<span class="hr">'+(opt.mode==='practice'?'<span class="tm">Practice mode</span>':'<span class="tm">Working time <b id="tmr">'+fmtT(paperDuration(CUR.b))+'</b></span>')+'<span class="hx"><a class="hxb" href="#/'+opt.bid+'/finish">Submit exam</a><a class="hxb" href="#/'+opt.bid+'">Exit</a></span></span>'}
  else right='<nav class="hn"><a href="#/review">Review</a><a href="#/papers">Papers</a><a href="#/mistakes">My mistakes</a><a href="#/class">Class</a><a href="#/account" class="acct">'+acctText()+'</a></nav>';
  return '<div class="hdr"><span><a class="mk" href="#/" aria-label="Home">SE</a>'+esc(title)+'</span>'+right+'</div>'+
    (opt.nav||'<div class="band"><div class="tools" id="tools">'+toolsHTML(false)+'</div></div>')+main+
    (opt.bar?'<div class="bar"></div>':'<div class="foot">HSC practice examinations<small>Unofficial practice material. Not affiliated with or endorsed by NESA or the NSW Government.</small></div>');
}
function infoHTML(){
  function nb(t,x,c){return '<span class="nav-elem'+(c?' '+c:'')+'">'+t+(x||'')+'</span>'}
  function mt(ic,lab,menu,cls){return '<span class="tbb'+(cls||'')+'"><span class="tic'+(cls==='flagged'||lab==='FLAG'||lab==='REMOVE FLAG'?' flagc':'')+'">'+ic+'</span><span>'+lab+'</span>'+(menu?'<span class="drop">'+IC.down+'</span>':'')+'</span>'}
  var tick='<span class="an">'+IC.tick+'</span>',flag='<span class="fl">'+IC.flag+'</span>';
  var left=
    '<h1 class="imh">Exam information</h1>'+
    '<h3>Reading time</h3><p>This practice site gives no reading time. In the real examination you have 10 minutes of reading time first. You can move between the questions, flag them and highlight text, but you cannot answer questions or leave the exam during that time.</p>'+
    '<h3>Working time</h3><p>Working time for this paper is '+paperTime(CUR.b)+'. In exam mode the timer counts down from the moment you start. In practice mode there is no time limit.</p>'+
    '<h3>Permitted equipment</h3><p>In the real examination:</p><ul class="bl"><li>Pen and paper are permitted for planning. The supervisor provides the paper.</li><li>Notes, calculators and other aids are not permitted.</li></ul>'+
    '<h3>Word count</h3><div class="wcrow"><p><b>Each short-answer response shows a word count. It is a guide to how long your answer should be.</b></p><span class="wcpill">0 / 500 words</span></div>'+
    '<h2 class="imh2">Navigation and toolbar</h2>'+
    '<p><b>The navigation bar</b> holds the question numbers and gives you access to this information page. Use the arrow boxes at either end to move along the numbers when they do not all fit.</p>'+
    '<div class="mnav"><span class="nav-arr">'+IC.left+'</span>'+nb('3',tick)+nb('4')+nb('5','','cur')+nb('6',flag)+nb('7')+'<span class="nav-arr">'+IC.right+'</span></div>'+
    '<div class="leg"><div class="lg">'+nb('6',flag)+'<span>A question you have flagged to come back to later</span></div>'+
    '<div class="lg">'+nb('2',tick)+'<span>A question for which you have attempted all parts</span></div>'+
    '<div class="lg">'+nb('5','','cur')+'<span>The question you are on now</span></div>'+
    '<div class="lg">'+nb('8')+'<span>A question you have not answered yet</span></div></div>'+
    '<p><b>The toolbar</b> sits on the right of the navigation bar.</p>'+
    '<div class="leg tl">'+
    '<div class="lg">'+mt(IC.flag,'FLAG')+'<span>Flags the question you are on. The button then reads REMOVE FLAG and a flag appears above the question number.</span></div>'+
    '<div class="lg">'+mt(IC.pen,'HIGHLIGHT',true)+'<span>Select text in the question, then choose yellow, blue or pink. Choose No colour to clear every highlight on the page.</span></div>'+
    '<div class="lg">'+mt(IC.font,'FONT SIZE',true)+'<span>Choose Regular, Large, Extra Large or XX Large text.</span></div>'+
    '<div class="lg">'+mt(IC.contrast,'COLOUR',true)+'<span>Change the font colour and background colour. Use reset to default settings to go back to black on white.</span></div>'+
    '<div class="lg">'+mt(IC.key,'INFO',false,' info')+'<span>Opens this page.</span></div></div>';
  var right=
    '<h3>Textbox tools</h3><p>The response textboxes have standard text styling buttons: bold, underline, italic, lists, indent, subscript, superscript, undo and redo. Two more buttons insert symbols:</p>'+
    '<div class="tbt"><div><span class="tbi">&#937;</span><span>Special characters</span></div><div><span class="tbi">&#8721;</span><span>Formula symbols</span></div></div>'+
    '<h3>Copy and paste</h3><p>Copy text with Ctrl+C (Windows) or Command+C (Mac). Paste it with Ctrl+V or Command+V. Your device may also have its own symbols palette, which you can use in the response textbox.</p>'+
    '<h3>Sort &ndash; Drag and Drop</h3><p>Some questions ask you to place items in order or into boxes. Select an item by clicking it, then drag it to a target area, or click the target area. Drag a placed item to another box to swap them, or back to the list to remove it.</p>'+
    '<p>With the keyboard, Tab to an item, press Enter, then Tab to a box and press Enter.</p>'+
    '<h3>Drawing tool</h3><p>A brief demonstration of the Drawing tool is shown. Choose a shape, then click the page to place it, and type to label it. Use the connector tools to join two shapes. Reset clears the page.</p>'+
    '<div class="dmo"><div class="dmh"><span><b>7 (b)</b> &nbsp;Sample question text appears here.</span><span class="dmb"><i class="n">Full screen</i><i class="n">Reset</i><i class="o">hide'+IC.up+'</i></span></div><div class="dmc"><div class="dmt"><i></i><i></i><i class="on"></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="dml">Library</div></div></div>'+
    '<h3>Code editors</h3><p><b>Python:</b> write code in the left pane and press Run to see the result in the output pane. The first run downloads Python, so you need an internet connection. When your program calls input(), a box asks for each value, as in the HSC exam. Cancel enters an empty value. The box cannot be closed, so a loop that keeps calling input() will not let you leave: avoid while True with input(). If it happens, reload the page (your answers are saved). Use Stop to cancel a run. Programs stop after 10 seconds of running.</p>'+
    '<p><b>Pseudocode:</b> there is no Run button. Indent with the Tab key and follow the syllabus style.</p>'+
    '<p><b>SQL:</b> Run shows the rows your query returns. Reset DB clears the results. Only SELECT queries are accepted, and you may use the syllabus words such as GREATER THAN, EQUALS and CONTAINS.</p>'+
    '<h3>Zoom and slides</h3><p>The round + button on a panel opens a larger view. Close it with Close or Escape. Arrows and dots under a panel move between slides.</p>'+
    '<h3>Marking</h3><p>Nothing is marked while you sit the paper. After you submit, closed questions are marked automatically. Sign in to request AI marking for written, code and drawing answers. Some answers may need review and remain unscored. You can always use the sample answers and criteria to set your own marks.</p>';
  return '<div class="modal im" data-act="closeinfo"><div class="box im" role="dialog" aria-label="Exam information"><button class="nb red sm x" data-act="closeinfo">Close this screen X</button><div class="imscroll"><div class="imc"><div class="imcol">'+left+'</div><div class="imcol">'+right+'</div></div></div></div></div>';
}

/* ---------- pages ---------- */
function homePage(){
  CUR={b:null,n:0};
  var visible=BANKS.filter(function(b){return !b.hidden}),full=visible.filter(function(b){return !b.mini}).length,mini=visible.length-full;
  var books=visible.map(function(b){var u=S.u[b.id],st=u?(u.done?'Submitted':(u.start?'In progress':'Not started')):'Not started';
    return '<a class="nb" href="#/'+b.id+'">'+esc(b.name)+'<small>'+esc(b.sub)+' &middot; '+st+'</small></a>'}).join('');
  return frame('Software Engineering Practice Examinations','<div class="pg"><h1 class="pt">HSC Software Engineering practice examinations</h1><div class="feature" style="margin-bottom:20px"><h2 class="pt">Review and analyse</h2><p>Open any paper straight in review: your answers, the marking guide, sample answers, AI feedback and what your class wrote.</p><div class="acts"><a class="nb" href="#/review">Review a paper</a><a class="nb ol" href="#/class">Class answers</a></div></div><div class="hgrid"><div class="feature"><h2 class="pt">Practice exams</h2><p>'+full+' full-length 80-mark papers'+(mini?' and '+mini+' mini paper'+(mini===1?'':'s'):'')+'. The full-length original papers have 27 questions in the same order of question types as the 2025 HSC online examination. Papers marked as trial papers are school trial examinations converted question for question into the online format, and keep their own question counts.</p><div class="bks">'+books+'</div></div>'+
    '<div class="feature"><h2 class="pt">How it works</h2><p>Each paper can be sat in exam mode with the working time shown on its opening page, or in practice mode with no timer. Full-length papers allow 2 hours 20 minutes; mini papers have a shorter timer. You answer in the same kinds of boxes the HSC uses: multiple choice, dropdowns, match tables, written responses with word counts, a Python editor, a pseudocode editor, an SQL editor and a drawing tool.</p><p>When you submit, closed questions are marked for you. Sign in for AI marking of written, code and diagram answers against the criteria; answers that need review remain unscored. You can use the marking guides to set or change any mark. The Papers page keeps every paper, and My mistakes collects every assessed answer that lost marks.</p><p>The original questions are written for practice. They are not past HSC questions and they do not predict the real paper. The trial papers are credited on their own paper pages.</p></div></div></div>');
}
function landingPage(b){
  CUR={b:b,n:0};var u=BS(b.id),done=u.done,started=u.start;
  var acts=done?'<a class="nb" href="#/'+b.id+'/results">View results</a><a class="nb ol" href="#/'+b.id+'/review/1">Review answers</a><button class="nb ol" data-act="restart">Start again</button>'
    :started?'<a class="nb" href="#/'+b.id+'/q/'+(u.cur||1)+'">Continue '+(u.mode==='practice'?'practice':'exam')+'</a><button class="nb ol" data-act="restart">Start again</button>':'<button class="nb" data-act="start" data-mode="exam">Start exam mode (timed)</button><button class="nb ol" data-act="start" data-mode="practice">Start practice mode (no timer)</button>';
  return frame(b.name+' Software Engineering','<div class="pg"><h1 class="pt">'+esc(b.name)+': '+esc(b.sub)+'</h1><div class="feature"><div class="kv"><b>Exam mode</b><span>'+paperTime(b)+' on a countdown timer. The timer keeps running if you leave and come back.</span><b>Practice mode</b><span>No timer. Take as long as you like.</span><b>Total marks</b><span>'+b.qs.reduce(function(s,q){return s+q.m},0)+'</span><b>Questions</b><span>'+b.qs.length+'</span><b>Equipment</b><span>No notes or calculator. Your answers save as you go. You can leave at any point with Exit, and submit at any point with Submit exam.</span></div>'+
    ''+(b.credit?'<p class="mut">'+esc(b.credit)+'</p>':'')+'<p>Read each question carefully. Use the numbered boxes to move around and the flag to mark questions to come back to. Press INFO inside the exam for help with the tools.</p><div class="acts" style="margin-top:20px">'+acts+'</div></div></div>');
}
function navHTML(b,rv){
  var bs=BS(b.id),h='<div class="nav-bar"><button type="button" class="nav-arr l" data-act="navl" aria-label="Show earlier question numbers" hidden>'+IC.left+'</button><div class="nav-nums" id="nums">';
  for(var n=1;n<=b.qs.length;n++){
    var c='nav-elem'+(n===CUR.n?' cur':'');
    if(rv){var g=0,m=0,pending=false;b.qs[n-1].it.forEach(function(it,i){var s=score(b,n,i);g+=s.g;m+=s.m;if(!s.set)pending=true});c+=pending?'':g===m?' ok':g===0?' bad':' part'}
    h+='<button class="'+c+'" data-act="go" data-n="'+n+'" aria-label="Question '+n+'">'+n+(!rv&&qAnswered(b,n)?'<span class="an">'+IC.tick+'</span>':'')+(!rv&&bs.flags[n]?'<span class="fl">'+IC.flag+'</span>':'')+'</button>';
  }
  return h+'</div><button type="button" class="nav-arr r" data-act="navr" aria-label="Show later question numbers" hidden>'+IC.right+'</button><div class="tools" id="tools">'+toolsHTML(true)+'</div></div>';
}
function navArrows(scrollToCur){
  var nv=$('#nums'),l=$('.nav-arr.l'),r=$('.nav-arr.r');if(!nv||!l||!r)return;
  if(scrollToCur){var c=$('.nav-elem.cur',nv);if(c&&(c.offsetLeft<nv.scrollLeft||c.offsetLeft+c.offsetWidth>nv.scrollLeft+nv.clientWidth))nv.scrollLeft=Math.max(0,c.offsetLeft-nv.clientWidth/2)}
  l.hidden=nv.scrollLeft<=1;r.hidden=nv.scrollLeft+nv.clientWidth>=nv.scrollWidth-1;
}
document.addEventListener('scroll',function(e){if(e.target&&e.target.id==='nums')navArrows(false)},true);
window.addEventListener('resize',function(){navArrows(false)});
function qHTML(b,n,rv){
  var q=b.qs[n-1];
  var title='<h2 class="qt" id="hq">Question '+n+' ('+(q.m===1?'1 mark':q.m+' marks')+')</h2>';
  var st=(q.st||'')+(q.db?dbTables(q.db):'');
  var items=q.it.map(function(it,i){return itemHTML(b,n,i,rv)}).join('')+(rv?'':pqPanelHTML(b,n));
  var last=n===b.qs.length;
  var acts='<div class="acts">'+(rv?'<button class="nb ol" data-act="prev"'+(n===1?' disabled':'')+'>'+IC.left+'<span>Previous question</span></button><button class="nb" data-act="next">'+(last?'Back to results':'Next question')+(last?'':IC.right)+'</button>':
    '<button class="nb ol" data-act="prev"'+(n===1?' disabled':'')+'>'+IC.left+'<span>Previous question</span></button><button class="nb" data-act="next">'+(last?'Finish exam':'Next question')+(last?'':IC.right)+'</button>')+'</div>';
  if(q.two)return '<div class="qwrap two"><div class="qleft">'+title+st+'</div><div><div class="item">'+items+'</div>'+acts+'</div></div>';
  return '<div class="qwrap">'+title+'<div class="item">'+(st?'<div class="hoa-q st">'+st+'</div>':'')+items+'</div>'+acts+'</div>';
}
function examPage(b,n,rv){
  rv=rv||BS(b.id).done;
  CUR={b:b,n:n,rv:rv};var bs=BS(b.id);
  if(!rv&&!bs.start){bs.start=Date.now()}
  if(!rv){bs.cur=n;save()}
  return frame((rv?'Review: ':'')+b.name+' Software Engineering','<main class="ex" id="qarea">'+qHTML(b,n,rv)+'</main>'+(INFO?infoHTML():''),{nav:navHTML(b,rv),timer:!rv,mode:bs.mode,bid:b.id,bar:true});
}
function finishPage(b){
  CUR={b:b,n:0};var bs=BS(b.id),un=[],fl=[];
  b.qs.forEach(function(q,i){if(!qAnswered(b,i+1))un.push(i+1);if(bs.flags[i+1])fl.push(i+1)});
  return frame(b.name+' Software Engineering','<div class="pg"><h1 class="pt">Finish exam</h1><div class="feature"><p><b>Unanswered:</b> '+(un.length?un.join(', '):'none')+'</p><p><b>Flagged:</b> '+(fl.length?fl.join(', '):'none')+'</p><p>You can submit now even if some questions are unanswered. Unanswered parts score zero. Your answers are saved either way, so you can also leave with Exit and come back later.</p><p>When signed in, submitting starts AI marking and sends each question, its marking guide and your answer, including any drawing, to DeepSeek. Guests can review and set their own marks.</p><div class="acts"><button class="nb ol" data-act="back">Back to the exam</button><button class="nb" data-act="submit">Submit and mark</button></div></div></div>');
}
function totals(b){
  var rows=[],T=0,M=0,P=0,tp={};
  b.qs.forEach(function(q,qi){var g=0,m=0,p=0;q.it.forEach(function(it,i){var s=score(b,qi+1,i);g+=s.g;m+=s.m;if(!s.set)p+=s.m});
    rows.push({n:qi+1,tp:q.tp,g:g,m:m,markedM:m-p,pend:p>0});T+=g;M+=m;P+=p;var t=tp[q.tp]||(tp[q.tp]={g:0,m:0,pending:0});t.g+=g;t.m+=m;t.pending+=p});
  return {rows:rows,T:T,M:M,P:P,markedM:M-P,tp:tp};
}
function resultsPage(b){
  CUR={b:b,n:0};var r=totals(b),pend=r.rows.filter(function(x){return x.pend}).length;
  var h='<div class="pg"><h1 class="pt">'+esc(b.name)+' results</h1><div class="feature"><div class="big">'+r.T+' / '+r.markedM+'</div><p>'+(r.markedM?Math.round(100*r.T/r.markedM)+'% of assessed marks':'No marks assessed yet')+(pend?'. <b>'+r.P+' of '+r.M+' marks remain unscored</b> across '+pend+' question'+(pend>1?'s':'')+'. This total is provisional.':'')+'</p></div>'+aiStatusHTML(b)+'<p class="note">AI marking sends the question, marking guide and your answer, including any drawing, to DeepSeek.</p>'+
    '<h2 class="pt">By syllabus topic</h2><table class="res"><tr><th>Topic</th><th>Assessed marks</th><th></th></tr>'+Object.keys(r.tp).map(function(k){var t=r.tp[k],m=t.m-t.pending;return '<tr><td>'+esc(k)+'</td><td>'+t.g+' / '+m+(t.pending?' ('+t.pending+' unscored)':'')+'</td><td><div class="tbar"><i style="width:'+(m?Math.round(100*t.g/m):0)+'%"></i></div></td></tr>'}).join('')+'</table>'+
    '<h2 class="pt">By question</h2><table class="res"><tr><th>Q</th><th>Topic</th><th>Assessed marks</th><th></th></tr>'+r.rows.map(function(x){var c=x.pend?'part':x.g===x.m?'ok':x.g===0?'bad':'part';return '<tr><td>'+x.n+'</td><td>'+esc(x.tp)+'</td><td>'+(x.markedM?x.g+' / '+x.markedM:'Unscored')+(x.pend?' <span class="pill part">Needs a mark</span>':'')+'</td><td><a href="#/'+b.id+'/review/'+x.n+'"><span class="pill '+c+'">Review</span></a></td></tr>'}).join('')+'</table>'+
    (typeof improvementPanel==='function'?improvementPanel(b):'')+
    '<div class="acts"><a class="nb" href="#/'+b.id+'/review/1" style="text-decoration:none">Review all questions</a><a class="nb ol" href="#/mistakes/'+b.id+'" style="text-decoration:none">Review my mistakes</a><a class="nb ol" href="#/papers" style="text-decoration:none">All papers</a></div></div>';
  return frame(b.name+' Software Engineering',h);
}

/* ---------- routing ---------- */
function render(){
  var h=location.hash.replace(/^#\/?/,'').split('/'),b=BANKS.filter(function(x){return x.id===h[0]})[0],html;
  /* Archived papers (see archive/README.md) are not reachable from the app; ?archive=1 is for tests and maintainers. */
  if(b&&b.archived&&!/[?&]archive=1\b/.test(location.search))b=undefined;
  MENU={};CPK='';xdCleanup();
  var lock=examLock();
  if(lock&&(h[0]==='class'||h[0]==='review'&&!h[1]||h[0]==='compare'||h[0]==='mistakes'||(b&&(h[1]==='review'||h[1]==='results'))))html=lockedPage(lock);
  else if(h[0]==='papers')html=papersPage();
  else if(h[0]==='review'&&!h[1])html=reviewHubPage();
  else if(h[0]==='mistakes'){MF.bank=h[1]||'';html=mistakesPage()}
  else if(h[0]==='account')html=accountPage();
  else if(h[0]==='class')html=classPage(h[1]||'');
  else if(h[0]==='compare')html=comparisonPage();
  else if(!b)html=homePage();
  else if(!h[1])html=landingPage(b);
  else if(h[1]==='q')html=examPage(b,Math.min(b.qs.length,Math.max(1,+h[2]||1)),false);
  else if(h[1]==='review')html=examPage(b,Math.min(b.qs.length,Math.max(1,+h[2]||1)),true);
  else if(h[1]==='finish')html=finishPage(b);
  else if(h[1]==='results')html=resultsPage(b);
  else html=landingPage(b);
  $('#app').innerHTML=html;applyTheme();window.scrollTo(0,0);
  document.title=b?(b.name+' | HSC Software Engineering practice'):'HSC Software Engineering practice';
  if(!lock&&h[0]==='class')classBind();
  if(h[0]==='compare')comparisonBind();
  if(b&&(h[1]==='q'||h[1]==='review')&&!(lock&&h[1]==='review')){afterQ();navArrows(true)}
  if(b&&h[1]==='results'&&BS(b.id).done)markAndShow(b);
  tick();
}
/* ---------- exam lock, review hub, practice marking ---------- */
/* The paper being sat in exam mode right now (started, not submitted, inside its working time), or null. */
function examLock(){
  var out=null;
  BANKS.forEach(function(b){var u=S.u[b.id];
    if(!out&&!b.hidden&&u&&u.mode==='exam'&&u.start&&!u.done&&Date.now()-u.start<paperDuration(b)*1000)out=b});
  return out;
}
function lockedPage(b){
  CUR={b:null,n:0};
  return frame('Exam in progress','<div class="pg"><h1 class="pt">Exam in progress</h1><div class="feature"><p>Review, marking guides, sample answers and class answers are locked while you sit <b>'+esc(b.name)+'</b> in exam mode.</p><p>They unlock when you submit the paper or when its working time ends.</p><div class="acts"><a class="nb" href="#/'+b.id+'/q/'+(BS(b.id).cur||1)+'">Return to the exam</a></div></div></div>');
}
function reviewStatus(b){
  var u=S.u[b.id];
  if(!u)return 'Not attempted';
  if(u.done){var t=totals(b);return 'Submitted &middot; '+t.T+' / '+t.markedM+' marks'}
  var answered=0;b.qs.forEach(function(q,qi){if(qAnswered(b,qi+1))answered++});
  if(u.start||answered)return (u.mode==='practice'?'Practice':'Exam')+' in progress &middot; '+answered+' of '+b.qs.length+' questions answered';
  return 'Not attempted';
}
function reviewHubPage(){
  CUR={b:null,n:0};
  var books=BANKS.filter(function(b){return !b.hidden}).map(function(b){
    return '<a class="nb" href="#/'+b.id+'/review/1">'+esc(b.name)+'<small>'+esc(b.sub)+' &middot; '+reviewStatus(b)+'</small></a>'}).join('');
  return frame('Review','<div class="pg"><h1 class="pt">Review and analyse</h1><div class="feature"><p>Choose a paper to open it in review. Each question shows your answer, the marking guide, the sample answer and any AI feedback. Under each written part you can read what your classmates wrote and run the class analysis.</p><div class="bks">'+books+'</div></div></div>');
}
function pqShown(b,n){var bs=BS(b.id);return !bs.done&&bs.mode==='practice'&&!!(bs.pq&&bs.pq[n])}
function pqPanelHTML(b,n){
  var bs=BS(b.id);if(bs.done||bs.mode!=='practice')return '';
  var shown=pqShown(b,n),run=AIQ[aiqKey(b,n)],open=b.qs[n-1].it.some(function(it){return !AUTO[it.t]});
  var msg=run?'<b>Marking this question: '+run.done+' of '+run.total+' answers done.</b> Feedback appears under each part as it finishes.'+(run.waiting?' <i>'+run.waiting+' waiting for a free marker.</i>':'')
    :shown?'<b>Feedback is shown under each part.</b> If you change an answer, mark the question again.'
    :'<b>Practice mode.</b> Mark this question when you are ready and see the marking guide, sample answer and feedback straight away.';
  if(open&&!S.tok)msg+=' <a href="#/account">Sign in</a> for AI marking of written, code and diagram answers; without it you can mark yourself with the guide.';
  return '<div class="aib" id="pq">'+msg+'<div class="acts" style="margin-top:8px"><button class="nb sm" data-act="pqmark"'+(run?' disabled':'')+'>'+(shown?'Mark this question again':'Mark this question')+'</button></div></div>';
}
function pqMark(){
  var b=CUR.b,n=CUR.n,bs=BS(b.id);if(!b||bs.done||bs.mode!=='practice')return;
  if(!bs.pq)bs.pq={};bs.pq[n]=1;Object.keys(bs.aiErr).forEach(function(k){if(k.indexOf(n+'.')===0)delete bs.aiErr[k]});save(b.id);
  function redraw(){if(CUR.b!==b||CUR.n!==n||CUR.rv||!$('#qarea'))return;var y=window.scrollY;xdCleanup();$('#qarea').innerHTML=qHTML(b,n,false);afterQDraw();window.scrollTo(0,y);refreshNav()}
  redraw();
  runChecks(b,n).then(redraw);
  runAIQuestion(b,n);
}
function afterQ(){
  var b=CUR.b,n=CUR.n,q=b.qs[n-1],rv=CUR.rv;
  q.it.forEach(function(it,i){if(it.t==='dr')xdMount(b,n+'.'+i,rv)});
  aceMount();classEnsure(b);
  var state=S,bs=BS(b.id);
  if(rv&&bs.done&&(!bs.checked||(S.tok&&aiTodo(b).length)))ensureMarked(b).then(function(){if(S!==state||S.u[b.id]!==bs||CUR.b!==b||location.hash.indexOf('review/'+n)<0||CUR.n!==n||!$('#qarea'))return;var y=window.scrollY;xdCleanup();$('#qarea').innerHTML=qHTML(b,n,true);afterQDraw();window.scrollTo(0,y);refreshNav()});
}
function afterQDraw(){var b=CUR.b,n=CUR.n;b.qs[n-1].it.forEach(function(it,i){if(it.t==='dr')xdMount(b,n+'.'+i,CUR.rv)});aceMount();classEnsure(b)}
function ensureMarked(b){
  var bs=BS(b.id),state=S;
  var p=bs.checked?Promise.resolve():runChecks(b).then(function(){if(S===state&&S.u[b.id]===bs){bs.checked=1;save(b.id)}});
  return p.then(function(){if(S===state&&S.u[b.id]===bs&&S.tok){var task=runAI(b),panel=CUR.b===b?$('#aib'):null;if(panel)panel.outerHTML=aiStatusHTML(b);return task}});
}
function aiStatusHTML(b){
  var bs=BS(b.id),errs=Object.keys(bs.aiErr).filter(function(k){return bs.aiErr[k]}),reviews=aiReviews(b),todo=aiTodo(b).length;
  if(!S.tok&&todo)return '<div class="aib" id="aib"><b>Sign in for AI marking.</b> <a href="#/account">Open Account</a>, or review the sample answers and set your own marks.</div>';
  if(aiRunCurrent(b,AIRUN[b.id])){var rn=AIRUN[b.id];return '<div class="aib" id="aib" role="status" aria-live="polite"><b>AI marking is running: '+(rn.done||0)+' of '+(rn.total||0)+' answers marked.</b><div class="aibar"><span style="width:'+Math.round(100*(rn.done||0)/Math.max(1,rn.total||1))+'%"></span></div> Each answer is assessed against the criteria and appears here as soon as it is done. Some answers may need review; marking can take several minutes.'+(rn.waiting?'<br><i>'+rn.waiting+' answer'+(rn.waiting>1?'s are':' is')+' still being marked from an earlier attempt. This page checks again every few seconds, so you do not need to press anything.</i>':'')+'</div>'}
  if(errs.length)return '<div class="aib bad" id="aib"><b>AI marking did not finish for '+errs.length+' answer'+(errs.length>1?'s':'')+'.</b> '+esc(bs.aiErr[errs[0]])+'<br><button class="nb sm" data-act="airetry" style="margin-top:8px">Try again</button></div>';
  if(todo)return '<div class="aib" id="aib"><b>'+todo+' answer'+(todo>1?'s':'')+' awaiting AI marking.</b> <button class="nb sm" data-act="airetry">Mark with AI</button></div>';
  if(reviews)return '<div class="aib bad" id="aib"><b>'+reviews+' answer'+(reviews>1?'s':'')+' need review.</b> No AI mark was awarded for these answers. Open the questions to review the criteria and set a mark yourself or with a teacher.</div>';
  return '<div class="aib" id="aib"><b>AI marking is complete.</b> Open any question in review to read the feedback. You can change a mark there.</div>';
}
function markAndShow(b){
  var state=S,bs=BS(b.id);
  ensureMarked(b).then(function(){
    if(S!==state||S.u[b.id]!==bs||CUR.b!==b)return;
    var y=window.scrollY;
    if(CUR.rv&&$('#qarea')){xdCleanup();$('#qarea').innerHTML=qHTML(b,CUR.n,true);afterQDraw();refreshNav()}
    else if(location.hash.indexOf('/results')>=0)$('#app').innerHTML=resultsPage(b);
    window.scrollTo(0,y);
  });
}
function go(n){location.hash='#/'+CUR.b.id+'/'+(CUR.rv?'review':'q')+'/'+n}
function refreshNav(){var nv=$('#nums');if(!nv)return;var sc=nv.scrollLeft;var t=document.createElement('div');t.innerHTML=navHTML(CUR.b,CUR.rv);nv.innerHTML=$('#nums',t).innerHTML;nv.scrollLeft=sc;navArrows(false)}
function applyHL(c){
  var sel=getSelection();
  if(c==='none'){$$('#qarea .hl').forEach(function(s){var p=s.parentNode;while(s.firstChild)p.insertBefore(s.firstChild,s);p.removeChild(s)});return}
  if(!sel.rangeCount||sel.isCollapsed)return;
  var r=sel.getRangeAt(0),area=$('#qarea');if(!area||!area.contains(r.commonAncestorContainer))return;
  var frag=r.cloneContents();if(frag.querySelector&&frag.querySelector('input,select,textarea,[contenteditable],button'))return;
  var n=r.commonAncestorContainer;n=n.nodeType===3?n.parentNode:n;if(n.closest('[contenteditable],textarea,select'))return;
  var sp=document.createElement('span');sp.className='hl hl-'+c;
  try{sp.appendChild(r.extractContents());r.insertNode(sp)}catch(e){}
  sel.removeAllRanges();
}

/* ---------- events ---------- */
function itemOf(k){var p=k.split('.');return CUR.b.qs[+p[0]-1].it[+p[1]]}
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');
  if(Object.keys(MENU).length&&!e.target.closest('.tb')){MENU={};CPK='';redrawTools()}
  if(!el)return;
  var a=el.dataset.act,d=el.dataset;
  if(a==='closeinfo'){if(e.target!==el&&el.classList.contains('modal'))return;INFO=false;var m=$('.modal');if(m)m.remove();return}
  if(a==='go'){go(+d.n)}
  else if(a==='prev'){go(CUR.n-1)}
  else if(a==='next'){if(CUR.n>=CUR.b.qs.length)location.hash=CUR.rv?'#/'+CUR.b.id+'/results':'#/'+CUR.b.id+'/finish';else go(CUR.n+1)}
  else if(a==='flag'){var bs=BS(CUR.b.id);bs.flags[CUR.n]=!bs.flags[CUR.n];if(!bs.flags[CUR.n])delete bs.flags[CUR.n];save();redrawTools();refreshNav()}
  else if(a==='menu'){if(MENU[d.m])delete MENU[d.m];else MENU[d.m]=true;if(d.m!=='col')CPK='';redrawTools()}
  else if(a==='cpk'){CPK=CPK===d.w?'':d.w;redrawTools()}
  else if(a==='navl'||a==='navr'){var nn=$('#nums');if(nn)nn.scrollBy({left:(a==='navl'?-1:1)*Math.max(120,nn.clientWidth*.8),behavior:'smooth'})}
  else if(a==='hl'){applyHL(d.c);delete MENU.hl;redrawTools()}
  else if(a==='fs'){S.font=+d.v;save();applyTheme();delete MENU.fs;redrawTools()}
  else if(a==='fg'){S.fg=+d.v;CPK='';save();applyTheme();redrawTools()}
  else if(a==='bg'){S.bg=+d.v;CPK='';save();applyTheme();redrawTools()}
  else if(a==='creset'){S.fg=0;S.bg=0;CPK='';save();applyTheme();redrawTools()}
  else if(a==='info'){INFO=true;var w=document.createElement('div');w.innerHTML=infoHTML();document.body.appendChild(w.firstChild)}
  else if(a==='start'){var sb=BS(CUR.b.id);sb.start=Date.now();sb.mode=d.mode==='practice'?'practice':'exam';save();location.hash='#/'+CUR.b.id+'/q/1'}
  else if(a==='restart'){if(confirm('Clear all answers and marks for this paper and start again?')){var ob=S.u[CUR.b.id];if(ob&&ob.done){var ot=totals(CUR.b);S.hist.push({id:CUR.b.id,name:CUR.b.name,at:ob.doneAt||Date.now(),T:ot.T,M:ot.markedM,pending:ot.P})}S.u[CUR.b.id]=null;delete S.u[CUR.b.id];save();location.hash='#/'+CUR.b.id;render()}}
  else if(a==='back'){location.hash='#/'+CUR.b.id+'/q/'+(BS(CUR.b.id).cur||1)}
  else if(a==='submit'){BS(CUR.b.id).done=true;BS(CUR.b.id).doneAt=Date.now();BS(CUR.b.id).checked=0;save();location.hash='#/'+CUR.b.id+'/results'}
  else if(a==='full'){var it=el.closest('.item');it.classList.toggle('full');el.textContent=it.classList.contains('full')?'Exit full screen':'Full screen';aceResize()}
  else if(a==='rdb'){var ro2=document.getElementById('o'+d.k);if(ro2){ro2.className='out ph sqres';ro2.textContent='Run the query to see the results.'}}
  else if(a==='run'){if(CUR.b&&!BS(CUR.b.id).done)doRun(d.k)}
  else if(a==='stop')stopPython();
  else if(a==='rt'){var ed=el.closest('.rte').querySelector('.rta');ed.focus();if(d.c.indexOf('sym:')===0)document.execCommand('insertText',false,d.c.slice(4));else document.execCommand(d.c,false,null);saveRte(ed)}
  else if(a==='xreset'){var xs=XD[d.k];if(xs&&xs.api){xs.api.resetScene();BS(CUR.b.id).ans[d.k]={e:[]};save();refreshNav()}}
  else if(a==='airetry'&&CUR.b&&!BS(CUR.b.id).done&&!CUR.rv)pqMark();
  else if(a==='airetry'){var rb=CUR.b;if(rb){delete BS(rb.id).aiErr;BS(rb.id).aiErr={};save();markAndShow(rb)}}
  else if(a==='airemark'){var mb=CUR.b,old=mb&&BS(mb.id).ai[d.k];if(mb&&S.tok&&old&&!old.stamp&&!old.status){delete BS(mb.id).ai[d.k];delete BS(mb.id).aiErr[d.k];save(mb.id);markAndShow(mb)}}
  else if(a==='acmode'){ACC.mode=d.v;ACC.msg='';render()}
  else if(a==='acgo')acGo();
  else if(a==='acsignout')acSignOut();
  else if(a==='acsync')syncNow();
  else if(a==='acclasscode')acSetClassCode(false);
  else if(a==='acclasscodeclear')acSetClassCode(true);
  else if(a==='bkdownload')bkDownload();
  else if(a==='bkupload'){var bf=$('#bkfile');if(bf){bf.value='';bf.onchange=function(){bkReadFile(bf.files[0])};bf.click()}}
  else if(a==='bklist')bkLoadList();
  else if(a==='bkrestore')bkRestore(d.name);
  else if(a==='acresolve')resolveSync(d.id,d.v);
  else if(a==='sm'){var bs2=BS(CUR.b.id);bs2.self[d.k]=+d.v;save();var y=window.scrollY;xdCleanup();$('#qarea').innerHTML=qHTML(CUR.b,CUR.n,CUR.rv);afterQDraw();window.scrollTo(0,y);refreshNav()}
  else if(a==='pqmark')pqMark();
});
document.addEventListener('mousedown',function(e){if(e.target.closest('[data-act="rt"]'))e.preventDefault()});
function saveRte(ed){
  if(!CUR.b||CUR.rv||BS(CUR.b.id).done)return;
  var k=ed.dataset.k,it=itemOf(k),bs=BS(CUR.b.id);bs.ans[k]=ed.innerHTML;save();
  var w=wcount(ed.innerHTML),c=document.getElementById('wc'+k);if(c){c.textContent=w+' / '+it.w+' words';c.classList.toggle('over',w>it.w)}
  refreshNav();
}
document.addEventListener('input',function(e){
  var t=e.target;if(!CUR.b||CUR.rv||BS(CUR.b.id).done)return;
  if(t.classList&&t.classList.contains('rta'))saveRte(t);
  else if(t.dataset&&t.dataset.code){
    BS(CUR.b.id).ans[t.dataset.k]=t.value;save();var g=document.getElementById('g'+t.dataset.k);if(g){g.textContent=gutNums(t.value);g.scrollTop=t.scrollTop}refreshNav();
  }
});
document.addEventListener('scroll',function(e){var t=e.target;if(t&&t.dataset&&t.dataset.code){var g=document.getElementById('g'+t.dataset.k);if(g)g.scrollTop=t.scrollTop}},true);
document.addEventListener('keydown',function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.code&&!t.readOnly&&e.key==='Tab'){e.preventDefault();var s=t.selectionStart;t.value=t.value.slice(0,s)+'    '+t.value.slice(t.selectionEnd);t.selectionStart=t.selectionEnd=s+4;t.dispatchEvent(new Event('input',{bubbles:true}))}
  if(e.key==='Escape'&&INFO){INFO=false;var m=$('.modal');if(m)m.remove()}
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.mf){if(t.dataset.mf==='bank'){location.hash='#/mistakes'+(t.value?'/'+t.value:'')}else{MF[t.dataset.mf]=t.value;render()}return}
  var k=t.dataset&&t.dataset.k;if(!k||!CUR.b||CUR.rv||BS(CUR.b.id).done)return;
  var bs=BS(CUR.b.id),it=itemOf(k),a=bs.ans[k];
  if(it.t==='mc')bs.ans[k]=+t.dataset.v;
  else if(it.t==='ms'){a=Array.isArray(a)?a:[];var v=+t.dataset.v,ix=a.indexOf(v);if(t.checked&&ix<0)a.push(v);if(!t.checked&&ix>=0)a.splice(ix,1);bs.ans[k]=a}
  else if(it.t==='dd'||it.t==='gd'){a=a||{};if(t.value==='')delete a[t.dataset.u];else a[t.dataset.u]=+t.value;bs.ans[k]=a}
  else if(it.t==='mt'){a=a||{};a[t.dataset.u]=+t.dataset.v;bs.ans[k]=a}
  else if(it.t==='tk'){a=Array.isArray(a)?a:[];var u=t.dataset.u,j=a.indexOf(u);if(t.checked&&j<0)a.push(u);if(!t.checked&&j>=0)a.splice(j,1);bs.ans[k]=a}
  else return;
  save();refreshNav();
});
function doRun(k){
  var it=itemOf(k),ta=$('textarea[data-k="'+k+'"]'),out=document.getElementById('o'+k),b=CUR.b,n=+k.split('.')[0];
  out.className='out'+(it.t==='sq'?' sqres':'');
  if(it.t==='py'){
    out.textContent='Loading Python (the first run takes a few seconds)...';
    runPyInteractive(ta.value,function(o,fin){var el=document.getElementById('o'+k)||out;el.className='out';el.textContent=o||(fin?'(the program printed nothing)':'');el.scrollTop=el.scrollHeight}).catch(function(e){var el=document.getElementById('o'+k)||out;el.textContent=e.message});
  }else if(it.t==='sq'){
    out.textContent='Loading the SQL engine...';
    runSQL(b.qs[n-1].db,ta.value).then(function(r){out.innerHTML=resHTML(r)}).catch(function(){out.innerHTML='<span class="er">The SQL engine could not load. Check your connection and reload.</span>'});
  }
}
window.addEventListener('hashchange',render);
