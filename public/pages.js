/* ---------- theme + toolbar ---------- */
var FG=[['Default','#000000'],['White','#ffffff'],['Navy','#002664'],['Yellow','#ffe600'],['Green','#7CFC00']];
var BGS=[['Default','#ffffff','#f2f2f2'],['Light yellow','#fffbd6','#f4efbb'],['Light blue','#e3f2fa','#cfe6f2'],['Light pink','#fdeaf0','#f4d3de'],['Black','#000000','#1b1b1b'],['Dark grey','#222222','#333333']];
var FSN=['Regular','Large','Extra Large','XX Large'];
var MENU={},CPK='',CUR={b:null,n:0,rv:false},INFO=false;
var CPK_VAL={h:0,s:0,v:0,hex:'#000000'},CPK_DRAG=null;
function hsvToHex(h,s,v){
  var c=v*s,x=c*(1-Math.abs(((h/60)%2)-1)),m=v-c,r=0,g=0,b=0;
  if(h>=0&&h<60){r=c;g=x;b=0}
  else if(h>=60&&h<120){r=x;g=c;b=0}
  else if(h>=120&&h<180){r=0;g=c;b=x}
  else if(h>=180&&h<240){r=0;g=x;b=c}
  else if(h>=240&&h<300){r=x;g=0;b=c}
  else if(h>=300&&h<360){r=c;g=0;b=x}
  r=Math.max(0,Math.min(255,Math.round((r+m)*255)));
  g=Math.max(0,Math.min(255,Math.round((g+m)*255)));
  b=Math.max(0,Math.min(255,Math.round((b+m)*255)));
  return '#'+(r<16?'0':'')+r.toString(16)+(g<16?'0':'')+g.toString(16)+(b<16?'0':'')+b.toString(16);
}
function hexToHsv(hex){
  if(!hex||typeof hex!=='string'||hex.charAt(0)!=='#')hex='#000000';
  if(hex.length===4)hex='#'+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2)+hex.charAt(3)+hex.charAt(3);
  var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  if(isNaN(r))r=0;if(isNaN(g))g=0;if(isNaN(b))b=0;
  var max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0,s=max===0?0:d/max,v=max;
  if(max!==min){
    if(max===r)h=(g-b)/d+(g<b?6:0);
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=h*60;
  }
  return {h:h,s:s,v:v};
}
function getFgHex(){
  if(typeof S.fg==='string')return S.fg;
  if(typeof S.fg==='number'&&FG[S.fg])return FG[S.fg][1];
  return '#000000';
}
function getBgHex(){
  if(typeof S.bg==='string')return S.bg;
  if(typeof S.bg==='number'&&BGS[S.bg])return BGS[S.bg][1];
  return '#ffffff';
}
function getIbgHex(bgHex){
  if(typeof S.bg==='number'&&BGS[S.bg])return BGS[S.bg][2];
  var hsv=hexToHsv(bgHex);
  if(hsv.v>0.5)return hsvToHex(hsv.h,Math.min(1,hsv.s*1.1+0.04),Math.max(0,hsv.v-0.06));
  return hsvToHex(hsv.h,Math.max(0,hsv.s*0.9),Math.min(1,hsv.v+0.12));
}
function applyTheme(){
  document.body.className='fs'+(typeof S.font==='number'?S.font:0);
  var r=document.documentElement.style,fg=getFgHex(),bg=getBgHex();
  r.setProperty('--pfg',fg);r.setProperty('--pbg',bg);r.setProperty('--ibg',getIbgHex(bg));
}
function toolsHTML(full){
  var bs=CUR.b?BS(CUR.b.id):null,fl=bs&&bs.flags[CUR.n];
  function tb(id,ic,lab,menu,cls){
    var open=(id==='col'&&CPK)?true:false;
    return '<div class="tb'+(open?' open':'')+'" data-tb="'+id+'"><button class="tbb'+(cls||'')+(open?' on':'')+'" data-act="'+(menu?'menu':id)+'" data-m="'+id+'">'+
      ic+'<span>'+lab+'</span>'+
      (menu?'<span class="drop'+(open?' open':'')+'"><span class="c-down">'+IC.down+'</span><span class="c-up">'+IC.up+'</span></span>':'')+
    '</button>'+(menu?menuHTML(id):'')+'</div>';
  }
  return (full?tb('flag','<span class="tic flagc">'+IC.flag+'</span>',fl?'REMOVE FLAG':'FLAG',false,fl?' flagged':'')+tb('hl','<span class="tic">'+IC.pen+'</span>','HIGHLIGHT',true):'')+tb('fs','<span class="tic">'+IC.font+'</span>','FONT SIZE',true)+tb('col','<span class="tic">'+IC.contrast+'</span>','COLOUR',true)+(full?tb('info','<span class="tic">'+IC.key+'</span>','INFO',false,' info'):'');
}
function cpkPopHTML(w){
  var h=CPK_VAL.h,s=CPK_VAL.s,v=CPK_VAL.v,pureHex=hsvToHex(h,1,1);
  return '<div class="cpk-pop" data-w="'+w+'">'+
    '<div class="cpk-top">'+
      '<div class="cpk-sat" style="background-color:'+pureHex+';">'+
        '<div class="cpk-sat-white"></div>'+
        '<div class="cpk-sat-black"></div>'+
        '<div class="cpk-sat-cur" style="left:'+(s*100)+'%;top:'+((1-v)*100)+'%;"></div>'+
      '</div>'+
      '<div class="cpk-hue">'+
        '<div class="cpk-hue-bar"></div>'+
        '<div class="cpk-hue-cur" style="top:'+((h/360)*100)+'%;"></div>'+
      '</div>'+
    '</div>'+
    '<div class="cpk-acts">'+
      '<button type="button" class="cpk-cancel" data-act="cpk-cancel">cancel</button>'+
      '<button type="button" class="cpk-choose" data-act="cpk-choose">choose</button>'+
    '</div>'+
  '</div>';
}
function cpick(w,curHex){
  var isPop=CPK===w;
  return '<div class="cpk">'+
    '<button type="button" class="cpb'+(isPop?' on':'')+'" data-act="cpk" data-w="'+w+'" aria-label="'+(w==='fg'?'Font':'Background')+' colour">'+
      '<i class="sw" style="background:'+curHex+'"></i><span class="tri">&#9660;</span>'+
    '</button>'+
    (isPop?cpkPopHTML(w):'')+
  '</div>';
}
function menuHTML(id){
  if(id==='hl')return '<div class="ddm hl"><div class="ddl">Choose colour:</div><div class="sws"><button type="button" class="swb y" data-act="hl" data-c="yellow" aria-label="Yellow"></button><button type="button" class="swb b" data-act="hl" data-c="blue" aria-label="Blue"></button><button type="button" class="swb r" data-act="hl" data-c="red" aria-label="Pink"></button></div><button type="button" class="nocol" data-act="hl" data-c="none">No colour</button></div>';
  if(id==='fs')return '<div class="ddm fs">'+FSN.map(function(n,i){var on=S.font===i;return '<button type="button" data-act="fs" data-v="'+i+'" role="menuitemradio" aria-checked="'+on+'"><span class="ck">'+(on?IC.chk:'')+'</span>'+n+'</button>'}).join('')+'</div>';
  if(id==='col')return '<div class="ddm col"><div class="crow"><span>Font colour:</span>'+cpick('fg',getFgHex())+'</div><div class="crow"><span>Background colour:</span>'+cpick('bg',getBgHex())+'</div><button type="button" class="rst" data-act="creset">'+IC.reset+'<span>reset to default settings</span></button></div>';
  return '';
}
function redrawTools(){var t=$('#tools');if(t)t.innerHTML=toolsHTML(!!CUR.b&&CUR.n>0)}
function fmtT(s){if(s<=0)return 'Time up';var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=Math.floor(s%60);return h+':'+(m<10?'0':'')+m+':'+(x<10?'0':'')+x}
function paperDuration(b){return b&&b.duration?b.duration:140*60}
function paperTime(b){var minutes=paperDuration(b)/60,h=Math.floor(minutes/60),m=minutes%60;return (h?h+' hour'+(h===1?'':'s')+(m?' ':''):'')+(m?m+' minute'+(m===1?'':'s'):'')}
function tick(){
  var ended=expireExams();
  if(ended.length){
    // Working time is over: leave the exam (or the locked page) for the submitted paper.
    var id=location.hash.replace(/^#\/?/,'').split('/')[0];
    if(LOCKVIEW||ended.some(function(b){return b.id===id}))render();
    return;
  }
  var xt=$('#exbt'),xs=examSitting();if(xt&&xs)xt.textContent=examLeft(xs);
  var t=$('#tmr');if(!t||!CUR.b)return;var bs=BS(CUR.b.id);t.textContent=fmtT(paperDuration(CUR.b)-(bs.start?Math.floor((Date.now()-bs.start)/1000):0));
}
setInterval(tick,1000);
/* Exam mode ends when its working time runs out, as in the HSC online exam: the paper is submitted
   automatically. Without this the answers stayed editable after the review lock lifted at time up,
   so marking guides and sample answers could be read and then copied into the open paper. */
var TIMEUP={},LOCKVIEW=false;
function expireExams(){
  var ended=[];
  BANKS.forEach(function(b){var u=S.u[b.id];
    if(!u||u.mode!=='exam'||!u.start||u.done||Date.now()-u.start<paperDuration(b)*1000)return;
    // Keep the last drawing change, which waits 400 ms before saving.
    if(CUR.b===b&&!CUR.rv)xdCleanup();
    u.done=true;u.doneAt=u.start+paperDuration(b)*1000;u.checked=0;TIMEUP[b.id]=1;save(b.id);ended.push(b);
  });
  return ended;
}

/* ---------- page frames ---------- */
function frame(title,main,opt){
  opt=opt||{};
  var b=CUR.b||(opt.bid?bank(opt.bid):null);
  var presenceHtml=(b&&typeof trialAvatarsHTML==='function')?trialAvatarsHTML(b,true):'';
  var right;
  if(opt.timer){
    right='<span class="hr">'+presenceHtml+(opt.mode==='practice'?'<span class="tm">Practice mode</span>':'<span class="tm">Working time <b id="tmr">'+fmtT(paperDuration(CUR.b))+'</b></span>')+'<span class="hx"><a class="hxb" href="#/'+opt.bid+'/finish">Submit exam</a><a class="hxb" href="#/'+opt.bid+'">Exit</a></span></span>';
  }
  else if(opt.landing){
    right='<div class="hr" style="display:flex;align-items:center;gap:12px">'+presenceHtml+'<nav class="hn"><a href="#/review">Review</a><a href="#/papers">Papers</a><a href="#/account" class="acct">'+(typeof acctPillHTML==='function'?acctPillHTML():acctText())+'</a></nav></div>';
  }
  else {
    right='<nav class="hn">'+presenceHtml+'<a href="#/review">Review</a><a href="#/papers">Papers</a><a href="#/mistakes">My mistakes</a><a href="#/class">Class</a><a href="#/account" class="acct">'+(typeof acctPillHTML==='function'?acctPillHTML():acctText())+'</a></nav>';
  }
  return '<div class="hdr"><span><a class="mk" href="#/" aria-label="Home">SE</a>'+esc(title)+'</span>'+right+'</div>'+(opt.timer?'':examBanner())+
    (opt.nav||'<div class="band"><div class="tools" id="tools">'+toolsHTML(false)+'</div></div>')+
    main+
    (opt.footer||(opt.bar?'<div class="bar"></div>':'<div class="foot">HSC practice examinations<small>Unofficial practice material. Not affiliated with or endorsed by NESA or the NSW Government.</small></div>'));
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
    return '<a class="nb bk-card" href="#/'+b.id+'"><div class="bk-row"><div class="bk-col"><span class="bk-name">'+esc(b.name)+'</span><small>'+esc(b.sub)+' &middot; '+st+'</small></div>'+trialAvatarsHTML(b)+'</div></a>'}).join('');
  return frame('Software Engineering Practice Examinations','<div class="pg"><h1 class="pt">HSC Software Engineering practice examinations</h1><div class="hgrid">'+
    '<div class="feature"><h2 class="pt">Practice exams</h2><p>'+full+' full-length 80-mark papers'+(mini?' and '+mini+' mini paper'+(mini===1?'':'s'):'')+'. Full-length original papers feature 27 questions arranged in the 2025 HSC online examination sequence. Converted trial papers preserve school trial questions and mark allocations.</p><div class="bks">'+books+'</div><p class="mut" style="margin-top:auto;padding-top:14px;font-size:.85em;color:#555">Your work saves locally as you write. Sign in with your NSW education email to sync across devices and access AI marking.</p></div>'+
    '<div class="feature"><h2 class="pt">Review and analyse</h2>'+
    '<div class="acts" style="margin:4px 0 16px 0"><a class="nb" href="#/review" style="width:100%;justify-content:center;text-align:center;box-sizing:border-box;padding:13px 20px">Review paper and see class</a></div>'+
    '<p><b>Direct paper review:</b> Open any paper directly in review mode at any time. Compare your answers side by side with official marking criteria, syllabus rubrics, and high-scoring sample answers to verify marks or score your own work.</p>'+
    '<p><b>Classroom collaboration and synthesis:</b> Read what your classmates wrote under each written part. Run AI class synthesis to extract key syllabus points, compare response strategies, and produce a combined exemplar answer.</p>'+
    '<p><b>AI feedback and coaching:</b> Receive rubric-referenced evidence evaluations that separate syllabus shortfalls from writing quality ratings. Generate post-exam improvement plans that identify error patterns and provide targeted practice.</p>'+
    '</div>'+
    '</div></div>');
}
function landingPage(b){
  CUR={b:b,n:0};var u=BS(b.id),done=u.done,started=u.start;
  var totalMarks=b.qs.reduce(function(s,q){return s+q.m},0);
  var objMarks=0,saMarks=0,hasParts=false;
  b.qs.forEach(function(q){
    if(q.it.length>1)hasParts=true;
    q.it.forEach(function(it){
      if(['mc','ms','dd','mt','gd','tk','od','dm'].indexOf(it.t)>=0)objMarks+=it.m;
      else saMarks+=it.m;
    });
  });
  var paperTitle=b.name.indexOf('Software Engineering')>=0?b.name:b.name+' Software Engineering';
  var timeStr=paperTime(b);

  var acts;
  if(done){
    acts='<a class="nb gi-start-btn" href="#/'+b.id+'/results">View results</a>'+
      '<div class="gi-mode-subbar">'+
        '<a class="nb ol sm" href="#/'+b.id+'/review/1">Review answers</a>'+
        '<button class="nb ol sm" data-act="restart">Start again</button>'+
      '</div>';
  }else if(started){
    acts='<a class="nb gi-start-btn" href="#/'+b.id+'/q/'+(u.cur||1)+'">Continue '+(u.mode==='practice'?'practice':'exam')+' &gt;</a>'+
      '<div class="gi-mode-subbar">'+
        '<button class="nb ol sm" data-act="restart">Start again</button>'+
      '</div>';
  }else{
    acts='<button class="nb gi-start-btn" data-act="start" data-mode="exam">START &gt;</button>'+
      '<div class="gi-mode-subbar">'+
        '<button class="nb ol sm gi-practice-btn" data-act="start" data-mode="practice">Start practice mode (no timer)</button>'+
        '<div class="gi-mode-note">Exam mode: timed ('+timeStr+')</div>'+
      '</div>';
  }

  var leftHtml=
    '<div class="gi-header-row"><h1 class="gi-title">General Instructions</h1>'+(typeof trialAvatarsHTML==='function'?trialAvatarsHTML(b,true):'')+'</div>'+
    '<h2 class="gi-section">Reading time</h2>'+
    '<p class="gi-p">There is no reading time given for viewing this past exam. You will be given 10 minutes reading time in the sample and real exams. During reading time in the sample and real exams you will not be able to answer questions, and exiting the exam at this stage is not possible. You can move freely between the questions, and you can flag questions. Highlighting of text is also permitted.</p>'+
    '<h2 class="gi-section">Working time</h2>'+
    '<p class="gi-p">There is no time limit to viewing this past exam. You will be given '+timeStr+' to attempt the questions in the sample and real exams.</p>'+
    '<h2 class="gi-section">Permitted equipment</h2>'+
    '<p class="gi-p">During the real exams:</p>'+
    '<ul class="gi-list">'+
      '<li>You <strong>must</strong> use headphones while viewing video content or listening to audio.</li>'+
      '<li>Pen and paper are permitted for planning. The supervisor will provide you with paper.</li>'+
    '</ul>'+
    '<p class="gi-p"><strong>The number of words that is provided for each short-answer item gives an indication of the length of response.</strong></p>'+
    '<h2 class="gi-section">Exam navigation and tool bar functionality</h2>'+
    '<p class="gi-p">During reading and working time, you can access information about the exam, navigation and tools by clicking on the \'Info\' button at the top right-hand-side of the screen.</p>'+
    (b.credit?'<p class="gi-credit mut">'+esc(b.credit)+'</p>':'');

  var rightHtml=
    '<div class="gi-top-box">'+
      '<h2 class="gi-box-title">Total marks: '+totalMarks+'</h2>'+
      '<ul class="gi-box-list">'+
        '<li>There '+(b.qs.length===1?'is 1 question':'are '+b.qs.length+' questions')+'.</li>'+
        (hasParts?'<li>Some questions have multiple parts.</li>':'')+
        (objMarks>0?'<li>Objective-response items total '+objMarks+' mark'+(objMarks===1?'':'s')+'.</li>':'')+
        (saMarks>0?'<li>Short-answer items total '+saMarks+' mark'+(saMarks===1?'':'s')+'.</li>':'')+
      '</ul>'+
    '</div>'+
    '<div class="gi-bottom-box">'+
      '<div class="acts gi-acts">'+acts+'</div>'+
    '</div>'+
    '<div class="kv" style="display:none"><b>Exam mode</b><span>'+timeStr+' on a countdown timer. The timer keeps running if you leave and come back.</span><b>Practice mode</b><span>No timer. Take as long as you like.</span><b>Total marks</b><span>'+totalMarks+'</span><b>Questions</b><span>'+b.qs.length+'</span><b>Equipment</b><span>No notes or calculator. Your answers save as you go. You can leave at any point with Exit, and submit at any point with Submit exam.</span></div>';

  var main=
    '<main class="gi-page">'+
      '<div class="gi-container">'+
        '<div class="gi-col-left">'+leftHtml+'</div>'+
        '<div class="gi-col-right">'+rightHtml+'</div>'+
      '</div>'+
    '</main>';

  return frame(paperTitle,main,{
    landing:true,
    footer:'<div class="foot gi-foot"><div class="gi-foot-title">HSC Online Examinations</div><small>&copy; Copyright NESA 2026</small></div>'
  });
}
function navHTML(b,rv){
  var bs=BS(b.id),h='<div class="nav-bar"><button type="button" class="nav-arr l" data-act="navl" aria-label="Show earlier question numbers" hidden>'+IC.left+'</button><div class="nav-nums" id="nums">';
  for(var n=1;n<=b.qs.length;n++){
    var c='nav-elem'+(n===CUR.n?' cur':'');
    if(rv){var g=0,m=0,pending=false;b.qs[n-1].it.forEach(function(it,i){var s=score(b,n,i);g+=s.g;m+=s.m;if(!s.set||s.src==='provisional')pending=true});c+=pending?'':g===m?' ok':g===0?' bad':' part'}
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
function rqPanelHTML(b,n){
  var q=b.qs[n-1],open=q.it.some(function(it){return !AUTO[it.t]});
  if(!open)return '';
  var running=aiRunCurrent(b,AIRUN[b.id])||aiQuestionRun(b,n);
  return '<div class="aib" id="rq" style="margin-top:12px">'+
    '<p style="margin:0 0 8px"><b>Re-mark this question or the whole exam:</b> re-runs AI assessment against syllabus criteria.</p>'+
    '<div class="acts" style="display:flex;gap:10px;flex-wrap:wrap">'+
      (S.tok?
        '<button type="button" class="nb sm ol" data-act="qremark" data-n="'+n+'"'+(running?' disabled':'')+'>Re-mark this question</button>'+
        '<button type="button" class="nb sm ol" data-act="paperremark"'+(running?' disabled':'')+'>Re-mark entire paper</button>' :
        '<a href="#/account" class="nb sm ol">Sign in to re-mark</a>')+
    '</div></div>';
}
function qHTML(b,n,rv){
  var q=b.qs[n-1];
  var title='<h2 class="qt" id="hq">Question '+n+' ('+(q.m===1?'1 mark':q.m+' marks')+')</h2>';
  var st=(q.st||'')+(q.db?dbTables(q.db):'');
  var items=q.it.map(function(it,i){return itemHTML(b,n,i,rv)}).join('')+(rv?rqPanelHTML(b,n):pqPanelHTML(b,n));
  var last=n===b.qs.length;
  var acts='<div class="acts">'+(rv?'<button class="nb ol" data-act="prev"'+(n===1?' disabled':'')+'>'+IC.left+'<span>Previous question</span></button><button class="nb" data-act="next">'+(last?'Back to results':'Next question')+(last?'':IC.right)+'</button>':
    '<button class="nb ol" data-act="prev"'+(n===1?' disabled':'')+'>'+IC.left+'<span>Previous question</span></button><button class="nb" data-act="next">'+(last?'Finish exam':'Next question')+(last?'':IC.right)+'</button>')+'</div>';
  if(q.two)return '<div class="qwrap two"><div class="qleft">'+title+st+'</div><div><div class="item">'+items+'</div>'+acts+'</div></div>';
  return '<div class="qwrap">'+title+'<div class="item">'+(st?'<div class="hoa-q st">'+st+'</div>':'')+items+'</div>'+acts+'</div>';
}
function examPage(b,n,rv){
  rv=rv||BS(b.id).done;
  CUR={b:b,n:n,rv:rv};var bs=BS(b.id);
  // Opened by address without pressing Start: the working-time timer shows, so treat it as exam mode.
  if(!rv&&!bs.start){bs.start=Date.now();if(!bs.mode)bs.mode='exam'}
  if(!rv){bs.cur=n;save()}
  return frame((rv?'Review: ':'')+b.name+' Software Engineering','<main class="ex" id="qarea">'+qHTML(b,n,rv)+'</main>'+(INFO?infoHTML():''),{nav:navHTML(b,rv),timer:!rv,mode:bs.mode,bid:b.id,bar:true});
}
function finishPage(b){
  CUR={b:b,n:0};var bs=BS(b.id),un=[],fl=[];
  b.qs.forEach(function(q,i){if(!qAnswered(b,i+1))un.push(i+1);if(bs.flags[i+1])fl.push(i+1)});
  return frame(b.name+' Software Engineering','<div class="pg"><h1 class="pt">Finish exam</h1><div class="feature"><p><b>Unanswered:</b> '+(un.length?un.join(', '):'none')+'</p><p><b>Flagged:</b> '+(fl.length?fl.join(', '):'none')+'</p><p>You can submit now even if some questions are unanswered. Unanswered parts score zero. Your answers are saved either way, so you can also leave with Exit and come back later.</p><p>When signed in, submitting starts AI marking and sends each question, its marking guide and your answer, including any drawing, to DeepSeek. Guests can review and set their own marks.</p><div class="acts"><button class="nb ol" data-act="back">Back to the exam</button><button class="nb" data-act="submit">Submit and mark</button></div></div></div>');
}
function totals(b){
  var rows=[],T=0,M=0,P=0,provisionalG=0,provisionalM=0,provisionalParts=0,tp={};
  b.qs.forEach(function(q,qi){var g=0,m=0,p=0,pg=0,pm=0,pc=0;q.it.forEach(function(it,i){var s=score(b,qi+1,i);m+=s.m;if(s.src==='provisional'){pg+=s.g;pm+=s.m;pc++}else g+=s.g;if(!s.set)p+=s.m});
    rows.push({n:qi+1,tp:q.tp,g:g,m:m,markedM:m-p-pm,pend:p>0,provisionalG:pg,provisionalM:pm,provisionalParts:pc});T+=g;M+=m;P+=p;provisionalG+=pg;provisionalM+=pm;provisionalParts+=pc;
    var t=tp[q.tp]||(tp[q.tp]={g:0,m:0,pending:0,provisionalG:0,provisionalM:0,provisionalParts:0});t.g+=g;t.m+=m;t.pending+=p;t.provisionalG+=pg;t.provisionalM+=pm;t.provisionalParts+=pc});
  return {rows:rows,T:T,M:M,P:P,markedM:M-P-provisionalM,provisionalG:provisionalG,provisionalM:provisionalM,provisionalParts:provisionalParts,tp:tp};
}
function provisionalMarksText(t){return t.provisionalParts?'Provisional marks: '+esc(t.provisionalG)+' / '+esc(t.provisionalM)+' across '+esc(t.provisionalParts)+' part'+(t.provisionalParts===1?'':'s'):''}
function resultsPage(b){
  CUR={b:b,n:0};var r=totals(b),pend=r.rows.filter(function(x){return x.pend}).length;
  var h='<div class="pg"><h1 class="pt">'+esc(b.name)+' results</h1><div class="feature">'+(TIMEUP[b.id]?'<p><b>Working time ended, so your exam was submitted automatically.</b></p>':'')+'<div class="big">'+(r.T+r.provisionalG)+' / '+(r.markedM+r.provisionalM)+'</div><p>'+(r.provisionalParts?'Provisional total. Assessed subtotal: '+r.T+' / '+r.markedM+'. '+provisionalMarksText(r)+'. Provisional marks are excluded from the assessed subtotal.':r.markedM?Math.round(100*r.T/r.markedM)+'% of assessed marks':'No marks assessed yet')+(pend?'. <b>'+r.P+' of '+r.M+' marks remain unscored</b> across '+pend+' question'+(pend>1?'s':'')+'. This total is provisional.':'')+'</p></div>'+aiStatusHTML(b)+'<p class="note">AI marking sends the question, marking guide and your answer, including any drawing, to DeepSeek.</p>'+
    '<h2 class="pt">By syllabus topic</h2><table class="res"><tr><th>Topic</th><th>Assessed marks</th><th></th></tr>'+Object.keys(r.tp).map(function(k){var t=r.tp[k],m=t.m-t.pending-t.provisionalM;return '<tr><td>'+esc(k)+'</td><td>'+t.g+' / '+m+(t.pending?' ('+t.pending+' unscored)':'')+(t.provisionalParts?'<br><span class="note">'+provisionalMarksText(t)+'</span>':'')+'</td><td><div class="tbar"><i style="width:'+(m?Math.round(100*t.g/m):0)+'%"></i></div></td></tr>'}).join('')+'</table>'+
    '<h2 class="pt">By question</h2><table class="res"><tr><th>Q</th><th>Topic</th><th>Assessed marks</th><th></th></tr>'+r.rows.map(function(x){var c=x.pend||x.provisionalParts?'part':x.g===x.m?'ok':x.g===0?'bad':'part';return '<tr><td>'+x.n+'</td><td>'+esc(x.tp)+'</td><td>'+(x.markedM?x.g+' / '+x.markedM:x.provisionalParts?'No confirmed mark':'Unscored')+(x.pend?' <span class="pill part">Needs a mark</span>':'')+(x.provisionalParts?'<br><span class="note">'+provisionalMarksText(x)+'</span>':'')+'</td><td><a href="#/'+b.id+'/review/'+x.n+'"><span class="pill '+c+'">Review</span></a></td></tr>'}).join('')+'</table>'+
    (typeof improvementPanel==='function'?improvementPanel(b):'')+
    '<div class="acts"><a class="nb" href="#/'+b.id+'/review/1" style="text-decoration:none">Review all questions</a><button type="button" class="nb ol" data-act="paperremark" style="cursor:pointer"'+(aiRunCurrent(b,AIRUN[b.id])?' disabled':'')+'>Re-mark entire paper</button><a class="nb ol" href="#/mistakes/'+b.id+'" style="text-decoration:none">Review my mistakes</a><a class="nb ol" href="#/papers" style="text-decoration:none">All papers</a></div></div>';
  return frame(b.name+' Software Engineering',h);
}

/* ---------- routing ---------- */
function render(){
  var h=location.hash.replace(/^#\/?/,'').split('/'),b=BANKS.filter(function(x){return x.id===h[0]})[0],html;
  /* Archived papers (see archive/README.md) are not reachable from the app; ?archive=1 is for tests and maintainers. */
  if(b&&b.archived&&!/[?&]archive=1\b/.test(location.search))b=undefined;
  MENU={};CPK='';
  expireExams();
  // A paper whose working time ended goes to its results, not back into the exam.
  if(b&&TIMEUP[b.id]&&BS(b.id).done&&(h[1]==='q'||h[1]==='finish')){stopPython();location.replace('#/'+b.id+'/results');return}
  xdCleanup();
  if(b&&h[1]==='q'&&examSitting()===b)EXAMOK='';
  var lock=examLock();LOCKVIEW=false;
  if(lock&&(h[0]==='class'||h[0]==='review'&&!h[1]||h[0]==='compare'||h[0]==='mistakes'||(b&&(h[1]==='review'||h[1]==='results'||h[1]==='q'&&BS(b.id).done)))){html=lockedPage(lock);LOCKVIEW=true}
  else if(h[0]==='papers')html=papersPage();
  else if(h[0]==='review'&&!h[1])html=reviewHubPage();
  else if(h[0]==='mistakes'){MF.bank=h[1]==='all'?'':(h[1]||'');MF.sel=h[2]||'';html=mistakesPage()}
  else if(h[0]==='account')html=accountPage();
  else if(h[0]==='class')html=classPage(h[1]||'',h[2]);
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
  if(!lock&&h[0]==='mistakes')mistakesBind();
  if(h[0]==='compare')comparisonBind();
  if(b&&(h[1]==='q'||h[1]==='review')&&CUR.b===b){afterQ();navArrows(true)}
  if(b&&h[1]==='results'&&BS(b.id).done)markAndShow(b);
  tick();
}
/* ---------- exam lock, review hub, practice marking ---------- */
/* The paper being sat in exam mode right now (started, not submitted, inside its working time), or null.
   Archived papers cannot be sat, so an old test attempt on one never counts. A student who chose "Continue anyway" is not held. */
var EXAMOK='';
function examSitting(){
  var out=null;
  BANKS.forEach(function(b){var u=S.u[b.id];
    if(!out&&!b.hidden&&!b.archived&&u&&u.mode==='exam'&&u.start&&!u.done&&Date.now()-u.start<paperDuration(b)*1000)out=b});
  return out;
}
function examLock(){var b=examSitting();return b&&EXAMOK!==b.id?b:null}
function examLeft(b){var s=Math.max(0,paperDuration(b)-Math.floor((Date.now()-BS(b.id).start)/1000));return fmtT(s)}
function lockedPage(b){
  CUR={b:null,n:0};
  var go='#/'+b.id+'/q/'+(BS(b.id).cur||1);
  return frame('Exam in progress','<div class="pg"><h1 class="pt">You are in an exam</h1><div class="feature lockbox"><div class="kv"><b>Paper</b><span>'+esc(b.name)+'</span><b>Mode</b><span>Exam mode</span><b>Time left</b><span>'+examLeft(b)+'</span></div>'+
    '<p>This page shows marking guides, sample answers or classmates\' answers. Your exam timer keeps running while you look, and the paper is submitted automatically when the time ends.</p>'+
    '<div class="acts"><a class="nb" href="'+go+'">Return to the exam</a><button class="nb ol" data-act="examgo" type="button">Continue anyway</button></div></div></div>');
}
/* Shown on every page while the student is looking around during their own exam. */
function examBanner(){
  var b=examSitting();
  if(!b||EXAMOK!==b.id)return '';
  return '<div class="exb" role="status"><span><b>Exam in progress:</b> '+esc(b.name)+', <span id="exbt">'+examLeft(b)+'</span> left.</span><a class="nb sm" href="#/'+b.id+'/q/'+(BS(b.id).cur||1)+'">Return to the exam</a></div>';
}
function reviewStatus(b){
  var u=S.u[b.id];
  if(!u)return 'Not attempted';
  if(u.done){var t=totals(b);return 'Submitted &middot; '+t.T+' / '+t.markedM+' assessed marks'+(t.provisionalParts?' &middot; '+provisionalMarksText(t):'')}
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
function pqShown(b,n){var bs=BS(b.id);return aiUnlocked()&&!bs.done&&bs.mode==='practice'&&!!(bs.pq&&bs.pq[n])}
function pqPanelHTML(b,n){
  var bs=BS(b.id);if(bs.done||bs.mode!=='practice'||!aiUnlocked())return '';
  var shown=pqShown(b,n),run=aiQuestionRun(b,n),open=b.qs[n-1].it.some(function(it){return !AUTO[it.t]});
  var msg=run?'<b>Marking this question: '+run.done+' of '+run.total+' answers processed.</b> Feedback appears under each part as it finishes.'
    :shown?'<b>Feedback is shown under each part.</b> If you change an answer, mark the question again.'
    :'<b>Practice mode.</b> Mark this question when you are ready and see the marking guide, sample answer and feedback straight away.';
  if(open&&!S.tok)msg+=' <a href="#/account">Sign in</a> for AI marking of written, code and diagram answers; without it you can mark yourself with the guide.';
  return '<div class="aib" id="pq">'+msg+'<div class="acts" style="margin-top:8px"><button class="nb sm" data-act="pqmark"'+(run?' disabled':'')+'>'+(shown?'Mark this question again':'Mark this question')+'</button>'+(shown?' <button type="button" class="nb sm ol" data-act="qremark" data-n="'+n+'"'+(run?' disabled':'')+'>Re-mark this question</button>':'')+'</div></div>';
}
function pqMark(){
  var b=CUR.b,n=CUR.n;if(!b||CUR.rv||!aiUnlocked())return;
  var bs=BS(b.id);if(bs.done||bs.mode!=='practice'||aiQuestionRun(b,n))return;
  if(!bs.pq)bs.pq={};bs.pq[n]=1;Object.keys(bs.aiErr).forEach(function(k){if(k.indexOf(n+'.')===0)delete bs.aiErr[k]});save(b.id);
  var context=aiContext(b,n),task=runAIQuestion(b,n);
  ensureLocalChecks(b,context);refreshMarking(b,context);
  return task;
}
function afterQ(){
  var b=CUR.b,n=CUR.n,q=b.qs[n-1],rv=CUR.rv;
  q.it.forEach(function(it,i){if(it.t==='dr')xdMount(b,n+'.'+i,rv)});
  if(typeof aceMount==='function')aceMount();if(typeof classEnsure==='function')classEnsure(b);
  var bs=BS(b.id);
  if(rv&&bs.done&&(!bs.checked||(S.tok&&aiTodo(b).length)))ensureMarked(b);
}
function afterQDraw(){var b=CUR.b,n=CUR.n;b.qs[n-1].it.forEach(function(it,i){if(it.t==='dr')xdMount(b,n+'.'+i,CUR.rv)});if(typeof aceMount==='function')aceMount();if(typeof classEnsure==='function')classEnsure(b)}
var MARKINGDEFER=null;
function refreshMarking(b,context){
  if(!aiRunCurrent(b,context)||CUR.b!==b||!aiUnlocked())return;
  var h=location.hash.replace(/^#\//,'').split('/'),y=window.scrollY;
  if(h[0]!==String(b.id))return;
  var review=(h[1]==='review'||h[1]==='q')&&CUR.rv&&+h[2]===CUR.n;
  var practice=h[1]==='q'&&!CUR.rv&&context.question===CUR.n&&+h[2]===CUR.n&&pqShown(b,CUR.n);
  if((review||practice)&&$('#qarea')){
    var ae=document.activeElement;
    // Leave the live editor in place while a student is typing in practice mode.
    if(ae&&(/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)||ae.isContentEditable)){MARKINGDEFER={b:b,context:context,n:CUR.n,route:location.hash};var panel=$('#pq');if(panel)panel.outerHTML=pqPanelHTML(b,CUR.n);return}
    MARKINGDEFER=null;
    xdCleanup();$('#qarea').innerHTML=qHTML(b,CUR.n,!!CUR.rv);afterQDraw();refreshNav();
  }else if(h[1]==='results'&&$('#app'))$('#app').innerHTML=resultsPage(b);
  else return;
  window.scrollTo(0,y);
}
document.addEventListener('focusout',function(){
  var deferred=MARKINGDEFER;if(!deferred)return;
  setTimeout(function(){
    if(MARKINGDEFER!==deferred)return;
    MARKINGDEFER=null;
    if(CUR.b===deferred.b&&CUR.n===deferred.n&&location.hash===deferred.route)refreshMarking(deferred.b,deferred.context);
  },0);
});
var CHECKRUN={};
function ensureLocalChecks(b,context){
  var bs=context.paper,n=context.question,key=n?aiqKey(b,n):b.id,old=CHECKRUN[key];
  if(!n&&bs.checked)return Promise.resolve();
  if(aiRunCurrent(b,old))return old.promise;
  var run=context;CHECKRUN[key]=run;
  run.promise=Promise.resolve().then(function(){if(aiRunCurrent(b,run))return runChecks(b,n)}).then(function(){
    if(aiRunCurrent(b,run)){if(!n)bs.checked=1;save(b.id);refreshMarking(b,run)}
  }).then(function(){if(CHECKRUN[key]===run)delete CHECKRUN[key]},function(){
    // Local execution checks are advisory and must not block AI marking.
    if(CHECKRUN[key]===run)delete CHECKRUN[key];
  });
  return run.promise;
}
function ensureMarked(b){
  if(!aiUnlocked())return Promise.resolve();
  var context=aiContext(b);
  // Start marking before loading Python/SQL runtimes; neither task depends on the other.
  var task=S.tok?runAI(b,function(){refreshMarking(b,context)}):null;
  var checks=ensureLocalChecks(b,context),panel=CUR.b===b?$('#aib'):null;
  if(panel&&aiRunCurrent(b,context))panel.outerHTML=aiStatusHTML(b);
  return (task||checks).then(function(){refreshMarking(b,context)});
}
function aiStatusHTML(b){
  var bs=BS(b.id),errs=Object.keys(bs.aiErr).filter(function(k){return bs.aiErr[k]}),reviews=aiReviews(b),provisionals=aiProvisionals(b),todo=aiTodo(b).length;
  if(!S.tok&&todo)return '<div class="aib" id="aib"><b>Sign in for AI marking.</b> <a href="#/account">Open Account</a>, or review the sample answers and set your own marks.</div>';
  if(aiRunCurrent(b,AIRUN[b.id])){var rn=AIRUN[b.id];return '<div class="aib" id="aib" role="status" aria-live="polite"><b>AI marking is running: '+(rn.done||0)+' of '+(rn.total||0)+' answers processed.</b><div class="aibar"><span style="width:'+Math.round(100*(rn.done||0)/Math.max(1,rn.total||1))+'%"></span></div> Each answer is assessed against the criteria and appears here as soon as it is done. Some answers may need review; marking can take several minutes.</div>'}
  if(errs.length)return '<div class="aib bad" id="aib"><b>AI marking did not finish for '+errs.length+' answer'+(errs.length>1?'s':'')+'.</b> '+esc(bs.aiErr[errs[0]])+'<br><button class="nb sm" data-act="airetry" style="margin-top:8px">Try again</button></div>';
  if(todo)return '<div class="aib" id="aib"><b>'+todo+' answer'+(todo>1?'s':'')+' awaiting AI marking.</b> <button class="nb sm" data-act="airetry">Mark with AI</button></div>';
  if(reviews||provisionals)return '<div class="aib bad" id="aib">'+(reviews?'<b>'+reviews+' answer'+(reviews>1?'s':'')+' need review.</b> No AI mark was awarded for these answers. ':'')+(provisionals?'<b>'+provisionals+' provisional mark'+(provisionals===1?'':'s')+'.</b> These lower-mark fallbacks remain unresolved and are excluded from verified improvement plans and comparisons. ':'')+'Open the questions to review the criteria and set a mark yourself or with a teacher.</div>';
  return '<div class="aib" id="aib"><b>AI marking is complete.</b> Open any question in review to read the feedback. You can change a mark there.</div>';
}
function markAndShow(b){
  return ensureMarked(b);
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
  var inPop = e.target && e.target.closest && e.target.closest('.notion-presence-pop');
  if(inPop){
    e.stopPropagation();
    return;
  }
  var pr = e.target && e.target.closest && e.target.closest('[data-act="presence-toggle"]');
  if(pr){
    e.preventDefault();
    e.stopPropagation();
    var wasOpen = pr.classList.contains('pop-open');
    document.querySelectorAll('.notion-avatars.pop-open').forEach(function(el){
      el.classList.remove('pop-open');
      var c=el.closest('.bk-card');if(c)c.classList.remove('has-pop-open');
    });
    if(!wasOpen){
      pr.classList.add('pop-open');
      var card=pr.closest('.bk-card');if(card)card.classList.add('has-pop-open');
    }
    return;
  }
  document.querySelectorAll('.notion-avatars.pop-open').forEach(function(el){
    el.classList.remove('pop-open');
    var c=el.closest('.bk-card');if(c)c.classList.remove('has-pop-open');
  });
  var el=e.target.closest('[data-act]');
  if((Object.keys(MENU).length||CPK)&&!e.target.closest('.tb')){MENU={};CPK='';redrawTools()}
  if(!el)return;
  var a=el.dataset.act,d=el.dataset;
  if(a==='closeinfo'){if(e.target!==el&&el.classList.contains('modal'))return;INFO=false;var m=$('.modal');if(m)m.remove();return}
  if(a==='go'){go(+d.n)}
  else if(a==='prev'){go(CUR.n-1)}
  else if(a==='next'){if(CUR.n>=CUR.b.qs.length)location.hash=CUR.rv?'#/'+CUR.b.id+'/results':'#/'+CUR.b.id+'/finish';else go(CUR.n+1)}
  else if(a==='flag'){var bs=BS(CUR.b.id);bs.flags[CUR.n]=!bs.flags[CUR.n];if(!bs.flags[CUR.n])delete bs.flags[CUR.n];save();redrawTools();refreshNav()}
  else if(a==='menu'){/* Hover opens; clicking top button does nothing */}
  else if(a==='cpk'){
    var cur=d.w==='fg'?getFgHex():getBgHex(),hsv=hexToHsv(cur);
    CPK_VAL={h:hsv.h,s:hsv.s,v:hsv.v,hex:cur};
    CPK=CPK===d.w?'':d.w;
    redrawTools();
  }
  else if(a==='cpk-cancel'){CPK='';redrawTools()}
  else if(a==='cpk-choose'){
    if(CPK==='fg')S.fg=CPK_VAL.hex;
    else if(CPK==='bg')S.bg=CPK_VAL.hex;
    CPK='';save();applyTheme();redrawTools();
  }
  else if(a==='navl'||a==='navr'){var nn=$('#nums');if(nn)nn.scrollBy({left:(a==='navl'?-1:1)*Math.max(120,nn.clientWidth*.8),behavior:'smooth'})}
  else if(a==='hl'){applyHL(d.c);redrawTools()}
  else if(a==='fs'){S.font=+d.v;save();applyTheme();redrawTools()}
  else if(a==='creset'){S.fg=0;S.bg=0;CPK='';save();applyTheme();redrawTools()}
  else if(a==='info'){INFO=true;var w=document.createElement('div');w.innerHTML=infoHTML();document.body.appendChild(w.firstChild)}
  else if(a==='examgo'){var xb=examSitting();if(xb){EXAMOK=xb.id;render()}}
  else if(a==='start'){EXAMOK='';delete TIMEUP[CUR.b.id];var sb=BS(CUR.b.id);sb.start=Date.now();sb.mode=d.mode==='practice'?'practice':'exam';save();location.hash='#/'+CUR.b.id+'/q/1'}
  else if(a==='restart'){if(confirm('Clear all answers and marks for this paper and start again?')){delete TIMEUP[CUR.b.id];var ob=S.u[CUR.b.id];if(ob&&ob.done){var ot=totals(CUR.b);S.hist.push({id:CUR.b.id,name:CUR.b.name,at:ob.doneAt||Date.now(),T:ot.T,M:ot.markedM,pending:ot.P,provisionalG:ot.provisionalG,provisionalM:ot.provisionalM,provisionalParts:ot.provisionalParts})}S.u[CUR.b.id]=null;delete S.u[CUR.b.id];save();location.hash='#/'+CUR.b.id;render()}}
  else if(a==='back'){location.hash='#/'+CUR.b.id+'/q/'+(BS(CUR.b.id).cur||1)}
  else if(a==='submit'){BS(CUR.b.id).done=true;BS(CUR.b.id).doneAt=Date.now();BS(CUR.b.id).checked=0;save();location.hash='#/'+CUR.b.id+'/results'}
  else if(a==='full'){var it=el.closest('.item');it.classList.toggle('full');el.textContent=it.classList.contains('full')?'Exit full screen':'Full screen';aceResize()}
  else if(a==='rdb'){var ro2=document.getElementById('o'+d.k);if(ro2){ro2.className='out ph sqres';ro2.textContent='Run the query to see the results.'};if(typeof resetSQLSession==='function')resetSQLSession(d.k)}
  else if(a==='run'){if(CUR.b&&!BS(CUR.b.id).done)doRun(d.k)}
  else if(a==='stop')stopPython();
  else if(a==='rt'){var ed=el.closest('.rte').querySelector('.rta');ed.focus();if(d.c.indexOf('sym:')===0)document.execCommand('insertText',false,d.c.slice(4));else document.execCommand(d.c,false,null);saveRte(ed)}
  else if(a==='xreset'){var xs=XD[d.k];if(xs&&xs.api){xs.api.resetScene();BS(CUR.b.id).ans[d.k]={e:[]};save();refreshNav()}}
  else if(a==='airetry'&&CUR.b&&!BS(CUR.b.id).done&&!CUR.rv)pqMark();
  else if(a==='airetry'){var rb=CUR.b;if(rb&&aiUnlocked()&&!aiRunCurrent(rb,AIRUN[rb.id])){delete BS(rb.id).aiErr;BS(rb.id).aiErr={};save();markAndShow(rb)}}
  else if(a==='airemark'){
    var mb=CUR.b;if(mb&&S.tok){
      var bs=BS(mb.id),qn=+d.k.split('.')[0],running=aiRunCurrent(mb,AIRUN[mb.id])||aiQuestionRun(mb,qn);
      if(running)return;
      delete bs.ai[d.k];delete bs.aiErr[d.k];delete AIRUN[mb.id];delete AIQ[aiqKey(mb,qn)];save(mb.id);
      if(bs.done){markAndShow(mb)}
      else if(bs.mode==='practice'){
        if(!bs.pq)bs.pq={};
        bs.pq[qn]=1;
        var context=aiContext(mb,qn),task=runAIQuestion(mb,qn);
        ensureLocalChecks(mb,context);refreshMarking(mb,context);
      }
    }
  }
  else if(a==='qremark'){
    var qb=CUR.b,qn=+d.n;if(qb&&qn&&S.tok){
      var bs=BS(qb.id),running=aiRunCurrent(qb,AIRUN[qb.id])||aiQuestionRun(qb,qn);
      if(running)return;
      qb.qs[qn-1].it.forEach(function(it,i){var k=qn+'.'+i;delete bs.ai[k];delete bs.aiErr[k]});
      delete AIRUN[qb.id];delete AIQ[aiqKey(qb,qn)];save(qb.id);
      if(bs.done){markAndShow(qb)}
      else if(bs.mode==='practice'){
        if(!bs.pq)bs.pq={};
        bs.pq[qn]=1;
        var context=aiContext(qb,qn),task=runAIQuestion(qb,qn);
        ensureLocalChecks(qb,context);refreshMarking(qb,context);
      }
    }
  }
  else if(a==='paperremark'){
    var pb=CUR.b;if(pb&&S.tok&&!aiRunCurrent(pb,AIRUN[pb.id])){
      var bs=BS(pb.id);
      pb.qs.forEach(function(q,qi){q.it.forEach(function(it,i){var k=(qi+1)+'.'+i;delete bs.ai[k];delete bs.aiErr[k]})});
      delete AIRUN[pb.id];Object.keys(AIQ).forEach(function(k){if(k.indexOf(pb.id+'/')===0)delete AIQ[k]});
      save(pb.id);markAndShow(pb);
    }
  }
  else if(a==='acmode'){ACC.mode=d.v;ACC.msg='';render()}
  else if(a==='acgo')acGo();
  else if(a==='acsignout')acSignOut();
  else if(a==='photo-upload'){if(!PHOTO.busy){var pf=$('#profile-file');pf.value='';pf.onchange=function(){photoRead(pf.files[0])};pf.click()}}
  else if(a==='photo-remove'){if(!PHOTO.busy)photoSave('',SYNC.epoch)}
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
function handleCpkSat(e,satEl){
  var rect=satEl.getBoundingClientRect();
  var s=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
  var v=Math.max(0,Math.min(1,1-(e.clientY-rect.top)/rect.height));
  CPK_VAL.s=s;CPK_VAL.v=v;
  CPK_VAL.hex=hsvToHex(CPK_VAL.h,s,v);
  var cur=satEl.querySelector('.cpk-sat-cur');
  if(cur){cur.style.left=(s*100)+'%';cur.style.top=((1-v)*100)+'%'}
  var sw=satEl.closest('.cpk')?satEl.closest('.cpk').querySelector('.cpb .sw'):null;
  if(sw)sw.style.backgroundColor=CPK_VAL.hex;
}
function handleCpkHue(e,hueEl){
  var rect=hueEl.getBoundingClientRect();
  var h=Math.max(0,Math.min(359.9,((e.clientY-rect.top)/rect.height)*360));
  CPK_VAL.h=h;
  CPK_VAL.hex=hsvToHex(h,CPK_VAL.s,CPK_VAL.v);
  var cur=hueEl.querySelector('.cpk-hue-cur');
  if(cur)cur.style.top=((h/360)*100)+'%';
  var sat=hueEl.closest('.cpk-top')?hueEl.closest('.cpk-top').querySelector('.cpk-sat'):null;
  if(sat)sat.style.backgroundColor=hsvToHex(h,1,1);
  var sw=hueEl.closest('.cpk')?hueEl.closest('.cpk').querySelector('.cpb .sw'):null;
  if(sw)sw.style.backgroundColor=CPK_VAL.hex;
}
document.addEventListener('mousedown',function(e){
  if(e.target.closest('[data-act="rt"]'))e.preventDefault();
  var sat=e.target.closest&&e.target.closest('.cpk-sat');
  if(sat){e.preventDefault();CPK_DRAG={type:'sat',el:sat};var tb=sat.closest('.tb');if(tb)tb.classList.add('open');handleCpkSat(e,sat);return}
  var hue=e.target.closest&&e.target.closest('.cpk-hue');
  if(hue){e.preventDefault();CPK_DRAG={type:'hue',el:hue};var tb2=hue.closest('.tb');if(tb2)tb2.classList.add('open');handleCpkHue(e,hue);return}
});
document.addEventListener('mousemove',function(e){
  if(!CPK_DRAG)return;
  e.preventDefault();
  if(CPK_DRAG.type==='sat')handleCpkSat(e,CPK_DRAG.el);
  else if(CPK_DRAG.type==='hue')handleCpkHue(e,CPK_DRAG.el);
});
document.addEventListener('mouseup',function(){
  if(CPK_DRAG){
    CPK_DRAG=null;
    if(!CPK){
      var tb=document.querySelector('.tb.open');
      if(tb)tb.classList.remove('open');
    }
  }
});
document.addEventListener('mouseleave',function(e){
  if(CPK_DRAG)return;
  var tb=e.target;
  if(!tb||!tb.classList||!tb.classList.contains('tb'))return;
  if(e.relatedTarget&&tb.contains(e.relatedTarget))return;
  if(tb.dataset.tb==='col'&&CPK){
    CPK='';
    redrawTools();
  }
},true);
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
  if(e.key==='Escape'){
    if(INFO){INFO=false;var m=$('.modal');if(m)m.remove()}
    document.querySelectorAll('.notion-avatars.pop-open').forEach(function(el){
      el.classList.remove('pop-open');
      var c=el.closest('.bk-card');if(c)c.classList.remove('has-pop-open');
    });
  }
  if((e.key==='Enter'||e.key===' ')&&t&&t.matches&&t.matches('[data-act="presence-toggle"]')){
    e.preventDefault();
    t.click();
  }
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.mf){if(t.dataset.mf==='bank'){location.hash='#/mistakes/'+(t.value||'all')}else{MF[t.dataset.mf]=t.value;render()}return}
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
    runSQL(b.qs[n-1].db,ta.value,k).then(function(r){out.innerHTML=resHTML(r)}).catch(function(){out.innerHTML='<span class="er">The SQL engine could not load. Check your connection and reload.</span>'});
  }
}
window.addEventListener('hashchange',render);
