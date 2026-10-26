/* Complete Diagram Mock (bank 22). Original mini paper the length of the HSC exam (80 marks, 25 questions).
   It tests every drawing activity in the Software Engineering syllabus and Course Specifications:
   data flow diagrams (Level 0, full, and correcting one), structure charts (from pseudocode and by refinement),
   class diagrams (removing redundant attributes, relationships and multiplicity, from code), relational database
   diagrams (from a flat file, from SQL and from ORM code), storyboards, screen design, decision trees (both forms),
   flowcharts (CASEWHERE, post-test with nested IF, mainline with a function), Gantt charts with resources,
   wiring diagrams, neural networks, MLOps, regression sketches, web request diagrams and a data dictionary.
   Every symbol is in the drawing tool's shape library (xdlib.js). Sample answers are drawn with the SVG kit
   copied from bank19 (marker ids renamed so both papers can be open together). */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];

/* ---------- SVG kit (from bank19) ---------- */
var UID=0;
function sv(w,h,label,body){
  UID++;var a='dgka'+UID,t='dgkt'+UID;
  return '<svg class="dgm" viewBox="0 0 '+w+' '+h+'" width="'+w+'" role="img" aria-label="'+esc(label)+'">'+
    '<defs><marker id="'+a+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#000" stroke-width="1.5"/></marker>'+
    '<marker id="'+t+'" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#fff" stroke="#000" stroke-width="1.4"/></marker></defs>'+
    '<g font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#000" stroke="#000" stroke-width="1.3" stroke-linejoin="round">'+
    body.replace(/#A/g,'url(#'+a+')').replace(/#T/g,'url(#'+t+')')+'</g></svg>';
}
/* text: lines is a string or an array of lines; anchor middle by default; a white halo keeps it readable over lines */
function gTxt(x,y,lines,o){
  o=o||{};lines=[].concat(lines);var lh=o.lh||14,y0=y-(lines.length-1)*lh/2+4;
  return '<text x="'+x+'" y="'+y0+'" text-anchor="'+(o.anchor||'middle')+'" stroke="'+(o.halo===false?'none':'#fff')+'" stroke-width="3" paint-order="stroke"'+
    (o.b?' font-weight="700"':'')+(o.i?' font-style="italic"':'')+(o.size?' font-size="'+o.size+'"':'')+(o.fill?' fill="'+o.fill+'"':'')+'>'+
    lines.map(function(s,i){return '<tspan x="'+x+'" dy="'+(i?lh:0)+'">'+esc(s)+'</tspan>'}).join('')+'</text>';
}
function gRect(x,y,w,h,lines,o){o=o||{};return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+(o.fill||'#fff')+'"'+(o.rx?' rx="'+o.rx+'"':'')+(o.dash?' stroke-dasharray="5 4"':'')+(o.sw?' stroke-width="'+o.sw+'"':'')+'/>'+(lines?gTxt(x+w/2,y+h/2,lines,{b:o.b,i:o.i,size:o.size,halo:false,lh:o.lh}):'')}
function gEll(cx,cy,rx,ry,lines,o){o=o||{};return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+(o.fill||'#fff')+'"/>'+(lines?gTxt(cx,cy,lines,{b:o.b,size:o.size,halo:false,lh:o.lh}):'')}
function gDia(cx,cy,w,h,lines,o){o=o||{};return '<polygon points="'+cx+','+(cy-h/2)+' '+(cx+w/2)+','+cy+' '+cx+','+(cy+h/2)+' '+(cx-w/2)+','+cy+'" fill="'+(o.fill||'#fff')+'"/>'+(lines?gTxt(cx,cy,lines,{size:o.size||11,halo:false,lh:12}):'')}
function gPar(x,y,w,h,lines){var k=Math.min(14,h/2);return '<polygon points="'+(x+k)+','+y+' '+(x+w)+','+y+' '+(x+w-k)+','+(y+h)+' '+x+','+(y+h)+'" fill="#fff"/>'+(lines?gTxt(x+w/2,y+h/2,lines,{halo:false,lh:13}):'')}
function gTerm(x,y,w,h,lines){return gRect(x,y,w,h,lines,{rx:h/2})}
function gSub(x,y,w,h,lines){return gRect(x,y,w,h,null)+'<line x1="'+(x+9)+'" y1="'+y+'" x2="'+(x+9)+'" y2="'+(y+h)+'"/><line x1="'+(x+w-9)+'" y1="'+y+'" x2="'+(x+w-9)+'" y2="'+(y+h)+'"/>'+(lines?gTxt(x+w/2,y+h/2,lines,{halo:false,lh:13}):'')}
function gLine(pts,o){o=o||{};return '<polyline points="'+pts.map(function(p){return p[0]+','+p[1]}).join(' ')+'" fill="none"'+(o.dash?' stroke-dasharray="5 4"':'')+(o.sw?' stroke-width="'+o.sw+'"':'')+(o.start?' marker-start="'+o.start+'"':'')+(o.end?' marker-end="'+o.end+'"':'')+'/>'}
function gArr(pts,o){o=o||{};o.end=o.tri?'#T':'#A';return gLine(pts,o)}
function gPath(d,o){o=o||{};return '<path d="'+d+'" fill="none"'+(o.dash?' stroke-dasharray="5 4"':'')+(o.sw?' stroke-width="'+o.sw+'"':'')+(o.noend?'':' marker-end="#A"')+'/>'}
function gDot(x,y,filled,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+(r||4.5)+'" fill="'+(filled?'#000':'#fff')+'"/>'}
/* shapes as objects so flows can find their edges */
function Cc(x,y,r){return {k:'c',x:x,y:y,r:r}}
function Rr(x,y,w,h){return {k:'r',x:x,y:y,w:w,h:h,cx:x+w/2,cy:y+h/2}}
function ctr(s){return s.k==='c'?[s.x,s.y]:[s.cx,s.cy]}
function edge(s,tx,ty){
  var c=ctr(s),dx=tx-c[0],dy=ty-c[1];
  if(s.k==='c'){var d=Math.sqrt(dx*dx+dy*dy)||1;return [c[0]+dx/d*s.r,c[1]+dy/d*s.r]}
  var sx=dx?s.w/2/Math.abs(dx):1e9,sy=dy?s.h/2/Math.abs(dy):1e9,k=Math.min(sx,sy);return [c[0]+dx*k,c[1]+dy*k];
}
/* a curved, labelled data flow from shape A to shape B. bend bends the curve to one side (negative: the other side).
   The label sits beyond the middle of the curve; lx and ly nudge it. */
function gFlow(A,B,bend,label,o){
  o=o||{};var a=ctr(A),b=ctr(B),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],d=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/d,ny=dx/d;
  var cx=mx+nx*bend*2,cy=my+ny*bend*2,p=edge(A,cx,cy),q=edge(B,cx,cy);
  if(o.p)p=o.p;if(o.q)q=o.q;
  var px=0.25*p[0]+0.5*cx+0.25*q[0],py=0.25*p[1]+0.5*cy+0.25*q[1],side=bend>=0?1:-1;
  var lx=px+(o.lx||0)+nx*side*(o.lo===undefined?8:o.lo),ly=py+(o.ly||0)+ny*side*(o.lo===undefined?8:o.lo);
  return gPath('M'+p[0].toFixed(1)+','+p[1].toFixed(1)+' Q'+cx.toFixed(1)+','+cy.toFixed(1)+' '+q[0].toFixed(1)+','+q[1].toFixed(1))+gTxt(lx,ly,label,{anchor:o.anchor,lh:13});
}
function figWrap(html){return '<div class="dgmfig">'+html+'</div>'}
function sbox(x,y,w,h,text){return gRect(x,y,w,h,text,{lh:13})}
function onLine(p,q,t){return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]}
/* a data (open) or control (filled) couple: a circle on the line, an arrow beside it, and the label */
function couple(pt,filled,dir,label,side){
  var x=pt[0],y=pt[1],l=side==='l',ax=x+(l?-13:13);
  return gDot(x,y,filled)+gArr(dir==='u'?[[ax,y+9],[ax,y-9]]:[[ax,y-9],[ax,y+9]])+gTxt(x+(l?-20:20),y,label,{anchor:l?'end':'start',lh:12,size:11});
}
/* decision diamond on a connecting line, and the curved repetition arrow */
function sdec(pt){return '<polygon points="'+pt[0]+','+(pt[1]-7)+' '+(pt[0]+7)+','+pt[1]+' '+pt[0]+','+(pt[1]+7)+' '+(pt[0]-7)+','+pt[1]+'" fill="#fff"/>'}
function srep(cx,y,label,side){return gPath('M'+(cx-17)+','+y+' Q'+cx+','+(y+17)+' '+(cx+17)+','+y)+(label?gTxt(cx+(side==='l'?-26:26),y+8,label,{anchor:side==='l'?'end':'start',lh:12,size:11}):'')}

/* elbow connectors: a stem from the parent to a bus line, then a drop to the top of each child */
function drops(px,pb,busY,xs,topY){
  var lo=Math.min.apply(null,xs.concat([px])),hi=Math.max.apply(null,xs.concat([px])),o=gLine([[px,pb],[px,busY]])+gLine([[lo,busY],[hi,busY]]);
  xs.forEach(function(x){o+=gLine([[x,busY],[x,topY]])});return o;
}
/* ---------- class diagram helper: name, attributes and methods in three compartments ---------- */
function ucls(x,y,w,name,attrs,meths){
  var hh=26,ah=Math.max(attrs.length,1)*16+10,mh=meths?Math.max(meths.length,1)*16+10:0,h=hh+ah+mh,o={x:x,y:y,w:w,h:h,cx:x+w/2,s:''};
  o.s=gRect(x,y,w,h,null)+gTxt(x+w/2,y+hh/2,name,{b:true,halo:false})+'<line x1="'+x+'" y1="'+(y+hh)+'" x2="'+(x+w)+'" y2="'+(y+hh)+'"/>'+
    attrs.map(function(a,i){return gTxt(x+8,y+hh+13+i*16,a,{anchor:'start',halo:false,size:11.5})}).join('');
  if(meths){o.s+='<line x1="'+x+'" y1="'+(y+hh+ah)+'" x2="'+(x+w)+'" y2="'+(y+hh+ah)+'"/>'+meths.map(function(m,i){return gTxt(x+8,y+hh+ah+13+i*16,m,{anchor:'start',halo:false,size:11.5})}).join('')}
  return o;
}
function mult(x,y,t,a){return gTxt(x,y,t,{anchor:a||'middle',size:11.5,lh:12})}

function screen(x,y,title,body){
  return gRect(x,y,200,190,null,{sw:1.6})+'<line x1="'+x+'" y1="'+(y+26)+'" x2="'+(x+200)+'" y2="'+(y+26)+'"/>'+gTxt(x+100,y+13,title,{b:true,halo:false})+body;
}
function btn(x,y,w,t){return gRect(x,y,w,24,t,{rx:3,size:11.5,fill:'#e8f1fb'})}
function tnode(cx,cy,w,h,lines){return gRect(cx-w/2,cy-h/2,w,h,lines,{lh:13})}
function tlink(px,py,cx,cy,h,label,side){
  var a=[px,py+h/2],b=[cx,cy-h/2],m=onLine(a,b,0.5);
  return gLine([a,b])+gTxt(m[0]+(side==='l'?-14:14),m[1],label,{lh:12,size:11.5});
}
function fT(cx,y,t){return gTerm(cx-80,y,160,30,t)}
function fTw(cx,y,t,w,h){return gTerm(cx-w/2,y,w,h||30,t)}
function fP(cx,y,t,w){w=w||170;return gRect(cx-w/2,y,w,30,t,{lh:13})}
function fIO(cx,y,t,w){w=w||190;return gPar(cx-w/2,y,w,30,t)}
function fD(cx,cy,t,w,h){return gDia(cx,cy,w||190,h||56,t)}
function fS(cx,y,t,w){w=w||190;return gSub(cx-w/2,y,w,30,t)}
function fL(x,y,t,a){return gTxt(x,y,t,{anchor:a||'start',lh:12,size:11.5})}

/* ---------- extra helpers for this paper ---------- */
/* a data store as in the specifications: a box open on the right */
function gStore(x,y,w,h,label){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#fff" stroke="none"/><polyline points="'+(x+w)+','+y+' '+x+','+y+' '+x+','+(y+h)+' '+(x+w)+','+(y+h)+'" fill="none"/>'+gTxt(x+w/2,y+h/2,label,{halo:false,lh:13})}
/* a crossed-out element in a stimulus */
function gNum(x,y,n){return '<circle cx="'+x+'" cy="'+y+'" r="9" fill="#fff"/>'+gTxt(x,y,String(n),{halo:false,size:11,b:true})}
/* a relational database table: name, then one row per field */
function dbt(x,y,w,name,fields){
  var hh=26,h=hh+fields.length*18+8,o={x:x,y:y,w:w,h:h,s:''};
  o.s=gRect(x,y,w,h,null)+gTxt(x+8,y+hh/2,name,{anchor:'start',b:true,halo:false})+'<line x1="'+x+'" y1="'+(y+hh)+'" x2="'+(x+w)+'" y2="'+(y+hh)+'"/>'+
    fields.map(function(f,i){return gTxt(x+8,y+hh+13+i*18,f,{anchor:'start',halo:false,size:11.5})}).join('');
  o.ry=function(i){return y+hh+13+i*18};
  return o;
}
/* one-to-many link: '1' beside the parent end, '∞' beside the child end */
function oneMany(pts,oneAt,manyAt){return gLine(pts)+gTxt(oneAt[0],oneAt[1],'1',{size:12,lh:12})+gTxt(manyAt[0],manyAt[1],'∞',{size:15,lh:12})}

/* ---------- Q1: Level 0 data flow diagram (sample) ---------- */
function figQ1(){
  var P=Cc(360,170,66),G=Rr(30,142,120,56),B=Rr(590,40,140,56),C=Rr(590,262,140,56);
  return sv(760,340,'Level 0 data flow diagram for the plot booking system',
    gEll(360,170,66,66,['Plot booking','system'])+gRect(30,142,120,56,'Gardener')+gRect(590,40,140,56,['Payment','provider'])+gRect(590,262,140,56,'Council')+
    gFlow(G,P,-26,['Booking request and','payment details'],{lo:20})+gFlow(P,G,-26,['Booking','confirmation'],{lo:20})+
    gFlow(P,B,-18,['Payment request'],{lo:14})+gFlow(B,P,-18,['Payment result'],{lo:14})+gFlow(P,C,18,['Monthly usage','report'],{lo:18}));
}

/* ---------- Q2: data flow diagram (sample) ---------- */
function figQ2(){
  var Cu=Rr(20,150,120,56),T=Cc(300,110,54),M=Rr(470,20,150,36),O=Rr(470,250,150,36),Pr=Cc(780,268,54),K=Rr(900,240,120,56),N=Cc(300,420,54);
  return sv(1040,500,'Data flow diagram for the food truck pre-order system',
    gRect(20,150,120,56,'Customer')+gStore(470,20,150,36,'Menu')+gStore(470,250,150,36,'Orders')+gRect(900,240,120,56,['Kitchen','staff'])+
    gEll(300,110,54,54,['1','Take order'])+gEll(780,268,54,54,['2','Prepare','order'])+gEll(300,420,54,54,['3','Notify','collection'])+
    gFlow(Cu,T,-16,['Order details'],{lo:12})+gFlow(T,Cu,-16,['Order total'],{lo:12})+
    gFlow(M,T,10,['Menu items','and prices'],{lo:16})+gFlow(T,O,-12,['Order record'],{lo:12})+
    gFlow(O,Pr,-12,['Order record'],{p:[620,258],q:[728,250],lo:10})+gFlow(Pr,O,-12,['Order status'],{p:[730,290],q:[620,280],lo:10})+
    gFlow(Pr,K,-10,['Preparation list'],{p:[826,244],q:[900,252],lo:12,ly:-8})+gFlow(K,Pr,-10,['Order ready'],{p:[900,286],q:[830,292],lo:12,ly:10})+
    gFlow(O,N,10,['Ready order'],{lo:12})+gFlow(N,Cu,10,['Collection','message'],{lo:16}));
}

/* ---------- Q3: the e-book loans DFD with errors (stimulus) and the corrected DFD (sample) ---------- */
function q3Base(){
  return {Me:Rr(20,150,120,56),Ch:Cc(330,96,54),Ms:Rr(560,40,150,36),Lo:Rr(560,260,150,36),Se:Cc(330,350,54)};
}
function q3Shapes(s){return gRect(20,150,120,56,'Member')+gEll(330,96,54,54,['1','Check out','e-book'])+gStore(560,40,150,36,'Members')+gStore(560,260,150,36,'Loans')+gEll(330,350,54,54,['2','Send','reminder'])}
function figQ3Bad(){
  var s=q3Base();
  return sv(740,430,'Data flow diagram for the e-book loan system, with errors',q3Shapes(s)+
    gFlow(s.Me,s.Ch,-16,['Loan request'],{lo:12})+gFlow(s.Ch,s.Me,-16,['E-book link'],{lo:12})+
    gFlow(s.Ms,s.Ch,12,['Member status'],{lo:12})+gFlow(s.Ms,s.Lo,-14,['Member','details'],{p:[690,76],q:[690,260],lo:-10,lx:-40})+
    gFlow(s.Me,s.Lo,14,['Loan details'],{lo:12,lx:20})+gFlow(s.Se,s.Me,10,['Reminder email'],{lo:14}));
}
function figQ3Good(){
  var s=q3Base();
  return sv(740,430,'Corrected data flow diagram for the e-book loan system',q3Shapes(s)+
    gFlow(s.Me,s.Ch,-16,['Loan request'],{lo:12})+gFlow(s.Ch,s.Me,-16,['E-book link'],{lo:12})+
    gFlow(s.Ms,s.Ch,12,['Member status'],{lo:12})+gFlow(s.Ch,s.Lo,-14,['Loan record'],{lo:12})+
    gFlow(s.Lo,s.Se,-14,['Overdue loans'],{lo:12})+gFlow(s.Se,s.Me,10,['Reminder email'],{lo:14}));
}

/* ---------- Q4: structure chart for MarkQuiz (sample) ---------- */
function figQ4(){
  var W=124,H=36,xs=[90,260,430,600,770],out='';
  out+=drops(430,56,92,xs,210);
  out+=sbox(368,20,W,H,'MarkQuiz')+sbox(28,210,W,H,'LoadQuestions')+sbox(198,210,W,H,'AskQuestion')+sbox(368,210,W,H,'CheckAnswer')+sbox(538,210,W,H,'AddPoint')+sbox(708,210,W,H,'ShowResult');
  out+=gPath('M320,100 Q430,128 540,100')+gTxt(548,104,'Until all questions asked',{anchor:'start',size:11,lh:12});
  out+=couple([90,166],false,'u','questions','r');
  out+=couple([260,150],false,'d','question','l')+couple([260,186],false,'u','response','r');
  out+=couple([430,150],false,'d',['question,','response'],'l')+couple([430,186],true,'u','correct','r');
  out+=sdec([600,132])+couple([600,158],false,'d','score','l')+couple([600,188],false,'u','score','r');
  out+=couple([770,166],false,'d','score','r');
  return sv(880,266,'Structure chart for the MarkQuiz program',out);
}

/* ---------- Q5: ticket sales structure chart (stimulus) and the refinement of Sell tickets (sample) ---------- */
function figQ5Main(){
  var W=124,H=36,out=drops(320,56,92,[120,320,520],160);
  out+=sbox(258,20,W,H,'Run box office')+sbox(58,160,W,H,'Get event')+sbox(258,160,W,H,'Sell tickets')+sbox(458,160,W,H,'Print tickets');
  out+=couple([120,124],false,'u','event ID','l');
  out+=couple([320,112],false,'d','event ID','l')+couple([320,140],false,'u','seat list','r');
  out+=couple([520,124],false,'d','seat list','r');
  return sv(660,210,'Structure chart for the box office program',out);
}
function figQ5Ref(){
  var W=124,H=36,out=gLine([[320,70],[320,10]])+drops(320,106,140,[120,320,520],216);
  out+=sbox(258,70,W,H,'Sell tickets')+sbox(58,216,W,H,'Check seats')+sbox(258,216,W,H,'Select seat')+sbox(458,216,W,H,'Take payment');
  out+=couple([320,26],false,'d','event ID','l')+couple([320,52],false,'u','seat list','r');
  out+=couple([120,170],false,'d','event ID','l')+couple([120,196],false,'u',['seats','available'],'l');
  out+=srep(320,150,'Until all tickets selected','r')+couple([320,190],false,'u','seat number','r');
  out+=couple([520,170],false,'d','total','r')+couple([520,196],true,'u','paid flag','r');
  return sv(700,270,'Structure chart that refines Sell tickets',out);
}

/* ---------- Q6: hire fleet class diagram with inheritance (sample) ---------- */
function figQ6(){
  var hi=ucls(330,14,180,'HireItem',['dailyRate']),
      mv=ucls(130,130,180,'MotorVehicle',['registration','seats','fuelType']),
      mm=ucls(530,130,180,'Micromobility',['serialNumber']),
      ca=ucls(20,290,150,'Car',['bootSize']),va=ucls(200,290,150,'Van',['loadCapacity']),
      es=ucls(470,290,150,'EScooter',['batteryRange','maxSpeed']),bk=ucls(650,290,150,'Bike',['frameSize','gears']);
  var out=hi.s+mv.s+mm.s+ca.s+va.s+es.s+bk.s;
  out+=gLine([[mv.cx,mv.y],[mv.cx,104],[mm.cx,104],[mm.cx,mm.y]])+gArr([[hi.cx,104],[hi.cx,hi.y+hi.h]],{tri:true});
  out+=gLine([[ca.cx,ca.y],[ca.cx,262],[va.cx,262],[va.cx,va.y]])+gArr([[mv.cx,262],[mv.cx,mv.y+mv.h]],{tri:true});
  out+=gLine([[es.cx,es.y],[es.cx,262],[bk.cx,262],[bk.cx,bk.y]])+gArr([[mm.cx,262],[mm.cx,mm.y+mm.h]],{tri:true});
  return sv(820,370,'Class diagram for the hire fleet',out);
}

/* ---------- Q7: music school class diagram (sample) ---------- */
function figQ7(){
  var pe=ucls(270,14,180,'Person',['name: string','phone: string'],['updatePhone()']),
      te=ucls(40,200,190,'Teacher',['teacherID: string','instrument: string'],['bookLesson()']),
      st=ucls(470,200,190,'Student',['studentID: string','grade: int'],['payFee()']),
      le=ucls(255,380,210,'Lesson',['date: date','time: string','room: string'],['reschedule()']);
  var out=pe.s+te.s+st.s+le.s;
  out+=gLine([[te.cx,te.y],[te.cx,170],[st.cx,170],[st.cx,st.y]])+gArr([[pe.cx,170],[pe.cx,pe.y+pe.h]],{tri:true});
  out+=gArr([[te.cx,te.y+te.h],[te.cx,430],[le.x,430]])+gTxt(te.cx+12,te.y+te.h+50,'teaches',{anchor:'start',lh:12})+mult(te.cx-8,te.y+te.h+16,'1..1','end')+mult(le.x-8,420,'0..*','end');
  out+=gArr([[st.cx,st.y+st.h],[st.cx,430],[le.x+le.w,430]])+gTxt(st.cx-12,st.y+st.h+50,'attends',{anchor:'end',lh:12})+mult(st.cx+8,st.y+st.h+16,'1..4','start')+mult(le.x+le.w+8,420,'0..*','start');
  return sv(700,500,'Class diagram for the music school',out);
}

/* ---------- Q8: class diagram from the banking code (sample) ---------- */
function figQ8(){
  var ac=ucls(40,20,230,'Account',['number','owner','balance'],['deposit(amount)','withdraw(amount)']),
      sa=ucls(40,250,230,'SavingsAccount',['rate'],['add_interest()']),
      cu=ucls(450,20,230,'Customer',['name','accounts'],['open_account(account)']);
  var out=ac.s+sa.s+cu.s+gArr([[sa.cx,sa.y],[ac.cx,ac.y+ac.h]],{tri:true});
  out+=gArr([[cu.x,76],[ac.x+ac.w,76]])+gTxt(360,62,'holds',{lh:12})+mult(cu.x-8,92,'1..1','end')+mult(ac.x+ac.w+8,92,'0..*','start');
  return sv(720,360,'Class diagram for Account, SavingsAccount and Customer',out);
}

/* ---------- Q9: netball carnival database (sample) ---------- */
function figQ9(){
  var sc=dbt(20,20,190,'Schools',['SchoolID (P)','SchoolName','Suburb']),
      tm=dbt(290,20,200,'Teams',['TeamID (P)','TeamName','Division','CoachName','SchoolID (F)']),
      pl=dbt(570,20,190,'Players',['PlayerID (P)','PlayerName','TeamID (F)']);
  var out=sc.s+tm.s+pl.s;
  out+=oneMany([[sc.x+sc.w,sc.ry(0)],[250,sc.ry(0)],[250,tm.ry(4)],[tm.x,tm.ry(4)]],[sc.x+sc.w+10,sc.ry(0)-9],[tm.x-12,tm.ry(4)-9]);
  out+=oneMany([[tm.x+tm.w,tm.ry(0)],[530,tm.ry(0)],[530,pl.ry(2)],[pl.x,pl.ry(2)]],[tm.x+tm.w+10,tm.ry(0)-9],[pl.x-12,pl.ry(2)-9]);
  out+=gTxt(20,186,'P = Primary key     F = Foreign key',{anchor:'start',halo:false,size:11.5});
  return sv(780,200,'Relational database tables for the netball carnival',out);
}

/* ---------- Q10: vet clinic database from the SQL (sample) ---------- */
function figQ10(){
  var pe=dbt(20,20,180,'Pets',['PetID (P)','Name','Species']),
      ap=dbt(290,20,210,'Appointments',['AppointmentID (P)','Date','Time','PetID (F)','VetID (F)']),
      ve=dbt(590,20,170,'Vets',['VetID (P)','Name']);
  var out=pe.s+ap.s+ve.s;
  out+=oneMany([[pe.x+pe.w,pe.ry(0)],[245,pe.ry(0)],[245,ap.ry(3)],[ap.x,ap.ry(3)]],[pe.x+pe.w+10,pe.ry(0)-9],[ap.x-12,ap.ry(3)-9]);
  out+=oneMany([[ve.x,ve.ry(0)],[545,ve.ry(0)],[545,ap.ry(4)],[ap.x+ap.w,ap.ry(4)]],[ve.x-10,ve.ry(0)-9],[ap.x+ap.w+12,ap.ry(4)-9]);
  out+=gTxt(20,186,'P = Primary key     F = Foreign key',{anchor:'start',halo:false,size:11.5});
  return sv(780,200,'Relational database tables for the vet clinic',out);
}

/* ---------- Q11: library database from the ORM code (sample) ---------- */
function figQ11(){
  var au=dbt(20,20,170,'Author',['author_id (P)','name']),
      bo=dbt(280,20,190,'Book',['isbn (P)','title','author_id (F)']),
      lo=dbt(560,20,200,'Loan',['loan_id (P)','isbn (F)','member_name','due_date']);
  var out=au.s+bo.s+lo.s;
  out+=oneMany([[au.x+au.w,au.ry(0)],[235,au.ry(0)],[235,bo.ry(2)],[bo.x,bo.ry(2)]],[au.x+au.w+10,au.ry(0)-9],[bo.x-12,bo.ry(2)-9]);
  out+=oneMany([[bo.x+bo.w,bo.ry(0)],[515,bo.ry(0)],[515,lo.ry(1)],[lo.x,lo.ry(1)]],[bo.x+bo.w+10,bo.ry(0)-9],[lo.x-12,lo.ry(1)-9]);
  out+=gTxt(20,170,'P = Primary key     F = Foreign key',{anchor:'start',halo:false,size:11.5});
  return sv(780,184,'Relational database tables behind the ORM classes',out);
}

/* ---------- Q12: bushwalk app storyboard (sample) ---------- */
function figQ12(){
  var hm=screen(20,20,'Home',gTxt(120,66,['Bushwalk','Tracker'],{b:true,halo:false,size:14,lh:16})+btn(50,110,140,'Start walk')+btn(50,146,140,'My walks')),
      tr=screen(330,20,'Track walk',gRect(346,56,168,90,'Live map',{fill:'#f4f4f4',size:11})+gTxt(430,160,'Time 00:42   2.3 km',{halo:false,size:11})+btn(380,176,100,'Stop')),
      su=screen(640,20,'Walk summary',gTxt(740,70,['Distance 5.1 km','Time 1 h 32 min'],{halo:false,size:11.5,lh:16})+btn(660,146,76,'Save')+btn(746,146,76,'Home')),
      mw=screen(20,290,'My walks',gRect(36,326,168,22,'Mt Keira loop',{size:11})+gRect(36,354,168,22,'Lake walk',{size:11})+gRect(36,382,168,22,'Coast track',{size:11})+btn(70,446,100,'Home')),
      wd=screen(330,290,'Walk details',gRect(346,326,90,64,'Route map',{fill:'#f4f4f4',size:11})+gTxt(480,350,['5.1 km','1 h 32 min'],{halo:false,size:11,lh:14})+btn(380,446,100,'Back'));
  var out=hm+tr+su+mw+wd;
  out+=gArr([[190,122],[330,122]])+gTxt(260,110,'Start walk',{lh:12});
  out+=gArr([[480,188],[640,188]])+gTxt(560,176,'Stop',{lh:12});
  out+=gArr([[784,170],[784,236],[240,236],[240,190],[220,190]])+gTxt(500,226,'Home',{lh:12});
  out+=gArr([[120,170],[120,290]])+gTxt(128,232,'My walks',{anchor:'start',lh:12});
  out+=gArr([[204,365],[330,365]])+gTxt(266,353,'Select walk',{lh:12});
  out+=gArr([[330,458],[170,458]])+gTxt(250,472,'Back',{lh:12});
  out+=gArr([[70,458],[8,458],[8,190],[20,190]])+gTxt(14,262,'Home',{anchor:'start',lh:12});
  out+=gArr([[698,170],[698,262],[480,262],[480,290]])+gTxt(600,274,'Save',{lh:12});
  return sv(860,500,'Storyboard of five screens for the bushwalk tracker app',out);
}

/* ---------- Q13: fun run registration screen (sample) ---------- */
function figQ13(){
  var o=gRect(20,20,420,470,null,{sw:1.6})+'<line x1="20" y1="58" x2="440" y2="58"/>'+gTxt(230,39,'Register for the Harbour Fun Run',{b:true,halo:false});
  function lab(y,t){return gTxt(44,y,t,{anchor:'start',halo:false,size:11.5})}
  o+=lab(84,'Full name *')+gRect(44,92,372,24,null);
  o+=lab(136,'Email *')+gRect(44,144,372,24,null)+gTxt(48,182,'Please enter a valid email address',{anchor:'start',halo:false,size:10.5,fill:'#b00020'});
  o+=lab(206,'Date of birth *')+gRect(44,214,160,24,'DD / MM / YYYY',{size:11})+gRect(206,214,26,24,null)+gTxt(219,226,'▦',{halo:false,size:12});
  o+=lab(262,'Distance *')+gDot(52,282,false,6)+gTxt(64,282,'5 km',{anchor:'start',halo:false,size:11.5})+gDot(132,282,true,6)+gTxt(144,282,'10 km',{anchor:'start',halo:false,size:11.5});
  o+=lab(316,'T-shirt size')+gRect(44,324,160,24,'Select a size  ▾',{size:11});
  o+=gTxt(44,372,'* required',{anchor:'start',halo:false,size:10.5});
  o+=gRect(44,420,120,34,'Cancel',{rx:4,size:12})+gRect(296,420,120,34,'Submit',{rx:4,size:12,fill:'#d6e6fa',b:true});
  o+=gArr([[520,282],[200,282]],{dash:true})+gTxt(530,272,['Radio buttons: only one','distance can be chosen'],{anchor:'start',halo:false,size:11,lh:13});
  o+=gArr([[520,226],[236,226]],{dash:true})+gTxt(530,216,['Date picker prevents','invalid dates'],{anchor:'start',halo:false,size:11,lh:13});
  o+=gArr([[520,182],[330,182]],{dash:true})+gTxt(530,176,['Error message beside','the field, in red text'],{anchor:'start',halo:false,size:11,lh:13});
  o+=gArr([[520,437],[420,437]],{dash:true})+gTxt(530,431,['Main action bottom right,','consistent on every screen'],{anchor:'start',halo:false,size:11,lh:13});
  return sv(720,510,'Screen design for the fun run registration screen',o);
}

/* ---------- Q14: irrigation decision tree (sample) ---------- */
function figQ14(){
  var h=40,out=
    tlink(300,30,130,125,h,'Yes','l')+tlink(300,30,450,125,h,'No','r')+
    tlink(450,125,330,225,h,'Yes','l')+tlink(450,125,570,225,h,'No','r')+
    tlink(570,225,450,325,h,'Yes','l')+tlink(570,225,690,325,h,'No','r')+
    tnode(300,30,190,h,['Soil moisture','40% or more?'])+tnode(130,125,130,h,'Do not water')+tnode(450,125,200,h,['Rain forecast in','the next 6 hours?'])+
    tnode(330,225,130,h,'Do not water')+tnode(570,225,200,h,['Time between','10 am and 4 pm?'])+tnode(450,325,140,h,['Water in the','evening'])+tnode(690,325,120,h,'Water now');
  return sv(780,370,'Decision tree for the irrigation controller',out);
}

/* ---------- Q15: shipping rules as a decision tree with condition and action columns (sample) ---------- */
function figQ15(){
  var o='',X={a:50,m:150,t:290,d:420,s:560,v:680},Y=[80,110,150,190,220];
  function t(x,y,s,o2){return gTxt(x,y,s,o2||{anchor:'start',halo:false,size:12})}
  function dash(x1,x2,y){return gLine([[x1,y],[x2,y]])}
  o+=t(X.m,34,'Membership',{anchor:'start',halo:false,i:true})+t(X.t,34,'Order total',{anchor:'start',halo:false,i:true})+t(X.d,34,'Destination',{anchor:'start',halo:false,i:true})+
     t(X.s,34,'Shipping',{anchor:'start',halo:false,i:true})+t(X.v,34,'Delivery',{anchor:'start',halo:false,i:true});
  o+=t(X.a-40,150,'Actions');
  o+=gLine([[66,144],[X.m-4,95]])+gLine([[66,154],[X.m-4,205]]);
  o+=t(X.m,95,'Gold')+t(X.m,205,'Standard');
  /* Gold: destination decides the delivery speed; shipping is always free */
  o+=gLine([[192,95],[X.d-6,Y[0]]])+gLine([[192,95],[X.d-6,Y[1]]]);
  o+=t(X.d,Y[0],'Metro')+t(X.d,Y[1],'Regional');
  /* Standard: order total first */
  o+=gLine([[218,205],[X.t-6,Y[2]]])+gLine([[218,205],[X.t-6,Y[3]+15]]);
  o+=t(X.t,Y[2],'$100 or more')+t(X.t,Y[3]+15,'Under $100');
  o+=gLine([[366,Y[3]+15],[X.d-6,Y[3]]])+gLine([[366,Y[3]+15],[X.d-6,Y[4]+8]]);
  o+=t(X.d,Y[3],'Metro')+t(X.d,Y[4]+8,'Regional');
  var rows=[[Y[0],'Free','Express',480],[Y[1],'Free','Standard',492],[Y[2],'Free','Standard',384],[Y[3],'$9.95','Standard',480],[Y[4]+8,'$14.95','Standard',492]];
  rows.forEach(function(r){o+=dash(r[3],X.s-8,r[0]-4)+t(X.s,r[0],r[1])+dash(X.s+52,X.v-8,r[0]-4)+t(X.v,r[0],r[2])});
  return sv(780,250,'Decision tree for the shipping rules',o);
}

/* ---------- Q16: ParkingFee flowchart with CASEWHERE (sample) ---------- */
function figQ16(){
  var xs=[90,250,410,570],labs=['"car"','"motorbike"','"bus"','OTHERWISE'],fees=['fee = 12','fee = 5','fee = 30','fee = 0'],o='';
  o+=fT(330,10,'BEGIN ParkingFee')+fIO(330,60,'Get vehicleType')+fD(330,160,'vehicleType',170,64);
  o+=gArr([[330,40],[330,60]])+gArr([[330,90],[330,128]])+gLine([[330,192],[330,210]])+gLine([[xs[0],210],[xs[3],210]]);
  xs.forEach(function(x,i){o+=gArr([[x,210],[x,240]])+fP(x,240,fees[i],130)+fL(x+6,226,labs[i])+gLine([[x,270],[x,300]])});
  o+=gLine([[xs[0],300],[xs[3],300]])+gArr([[330,300],[330,320]])+fIO(330,320,'Display fee')+gArr([[330,350],[330,372]])+fT(330,372,'END ParkingFee');
  return sv(680,420,'Flowchart for the ParkingFee algorithm',o);
}

/* ---------- Q17: CreatePassword flowchart, post-test loop with a nested IF (sample) ---------- */
function figQ17(){
  var o=fT(300,10,'BEGIN CreatePassword')+fIO(300,70,'Get password')+fD(300,160,'length of password < 8?',230,60)+fIO(580,145,'Display "Too short"',200)+
    fD(300,260,'password contains a digit?',230,60)+fIO(570,245,'Display "Add a number"',220)+fIO(300,320,'Display "Password accepted"',240)+
    fD(300,450,['length >= 8 AND','contains a digit?'],240,70)+fT(300,520,'END CreatePassword');
  o+=gArr([[300,40],[300,70]])+gArr([[300,100],[300,130]])+gArr([[300,190],[300,230]])+gArr([[300,290],[300,320]])+gLine([[300,350],[300,390]]);
  o+=gArr([[415,160],[480,160]])+gLine([[673,160],[700,160],[700,390]])+gArr([[415,260],[460,260]])+gLine([[570,275],[570,390]]);
  o+=gLine([[700,390],[300,390]])+gArr([[300,390],[300,415]])+gArr([[300,485],[300,520]]);
  o+=gLine([[180,450],[60,450],[60,55]])+gArr([[60,55],[300,55]]);
  o+=fL(426,152,'True')+fL(310,212,'False')+fL(426,252,'No')+fL(310,308,'Yes')+fL(310,500,'True')+fL(120,442,'False','middle');
  return sv(720,570,'Flowchart for the CreatePassword algorithm',o);
}

/* ---------- Q18: AverageSpeed mainline and the CalcSpeed function (sample) ---------- */
function figQ18(){
  var o=fT(200,10,'BEGIN AverageSpeed')+fP(200,60,'total = 0')+fP(200,110,'count = 0')+fIO(200,160,'Get lapTime')+fD(200,250,'lapTime <> 0?',170,56)+
    fS(200,310,'speed = CalcSpeed (lapTime)',230)+fP(200,360,'total = total + speed',190)+fP(200,410,'count = count + 1',190)+fIO(200,460,'Get lapTime')+
    fD(470,320,'count > 0?',150,56)+fIO(470,390,'Display total / count',200)+fT(470,470,'END AverageSpeed')+
    fTw(760,10,['BEGIN CalcSpeed','(time)'],170,40)+fP(760,90,'speed = 400 / time',170)+fP(760,150,'RETURN speed',170)+fTw(760,210,['END CalcSpeed','(time)'],170,40);
  o+=gArr([[200,40],[200,60]])+gArr([[200,90],[200,110]])+gArr([[200,140],[200,160]])+gArr([[200,190],[200,222]])+gArr([[200,278],[200,310]])+gArr([[200,340],[200,360]])+gArr([[200,390],[200,410]])+gArr([[200,440],[200,460]]);
  o+=gLine([[105,475],[40,475],[40,205]])+gArr([[40,205],[200,205]]);
  o+=gLine([[285,250],[470,250]])+gArr([[470,250],[470,292]])+gArr([[470,348],[470,390]])+gArr([[470,420],[470,470]]);
  o+=gLine([[545,320],[600,320],[600,485]])+gArr([[600,485],[550,485]]);
  o+=gArr([[760,50],[760,90]])+gArr([[760,120],[760,150]])+gArr([[760,180],[760,210]]);
  o+=fL(210,296,'True')+fL(296,242,'False')+fL(480,372,'True')+fL(552,312,'False');
  return sv(870,520,'Flowcharts for AverageSpeed and the CalcSpeed function',o);
}

/* ---------- Q19: canteen app Gantt chart with team members and percentage complete (sample) ---------- */
function figQ19(){
  var X0=280,CW=34,Y0=50,RH=34,BH=18,out='',days=['M','T','W','T','F'],i,w;
  var tasks=[['1','Survey students','Priya',1,3,100],['2','Design screens','Ben',4,7,50],['3','Set up database','Priya',4,5,100],['4','Code the app','Ben, Priya',8,12,0],['5','Test the app','Ben, Priya',13,14,0]];
  function bx(d){return X0+(d-1)*CW}
  function ry(r){return Y0+r*RH}
  out+=gRect(0,0,X0,Y0,null,{fill:'#1c2f5e'})+gTxt(12,Y0/2,'ID   Task name',{anchor:'start',halo:false,b:true}).replace('<text','<text fill="#fff"')+gTxt(186,Y0/2,'Assigned',{anchor:'start',halo:false,b:true}).replace('<text','<text fill="#fff"');
  for(w=0;w<3;w++){out+=gRect(X0+w*5*CW,0,5*CW,24,null,{fill:'#1c2f5e'})+gTxt(X0+w*5*CW+85,12,'Week '+(w+1),{halo:false,size:11}).replace('<text','<text fill="#fff"')}
  for(i=0;i<15;i++){out+=gRect(X0+i*CW,24,CW,26,days[i%5],{fill:'#e9eef8',size:11.5})}
  for(i=0;i<7;i++){out+=gRect(0,ry(i),X0+15*CW,RH,null,{fill:i%2?'#fff':'#f7f7f7'})}
  for(i=0;i<=15;i++){out+='<line x1="'+(X0+i*CW)+'" y1="50" x2="'+(X0+i*CW)+'" y2="'+ry(7)+'" stroke="#bbb" stroke-width="0.6"/>'}
  tasks.forEach(function(t,r){
    var x=bx(t[3]),wd=(t[4]-t[3]+1)*CW,y=ry(r)+(RH-BH)/2;
    out+=gTxt(12,ry(r)+RH/2,t[0]+'   '+t[1],{anchor:'start',halo:false})+gTxt(186,ry(r)+RH/2,t[2],{anchor:'start',halo:false,size:11.5});
    out+=gRect(x,y,wd,BH,null,{fill:'#bcd0ee'})+(t[5]?gRect(x,y,wd*t[5]/100,BH,null,{fill:'#2f5aa8'}):'')+gTxt(x+wd+6,ry(r)+RH/2,t[5]+'%',{anchor:'start',halo:false,size:11});
  });
  out+=gTxt(12,ry(5)+RH/2,'6   Design complete',{anchor:'start',halo:false})+gDia(bx(8),ry(5)+RH/2,20,20,null,{fill:'#fff'});
  out+=gTxt(12,ry(6)+RH/2,'7   App launch',{anchor:'start',halo:false})+gDia(bx(15),ry(6)+RH/2,20,20,null,{fill:'#fff'});
  function dep(a,b){var ex=bx(tasks[a-1][4]+1),sx=bx(tasks[b-1][3]),y1=ry(a-1)+(RH+BH)/2,y2=ry(b-1)+RH/2;return gArr([[ex-10,y1],[ex-10,y2],[sx,y2]])}
  out+=dep(1,2)+dep(1,3)+dep(2,4)+gArr([[bx(6)-10,ry(2)+(RH+BH)/2],[bx(6)-10,ry(3)+RH/2-6],[bx(8)-2,ry(3)+RH/2-6]])+dep(4,5);
  out+=gArr([[bx(15),ry(4)+(RH+BH)/2],[bx(15),ry(6)+RH/2-11]]);
  out+='<line x1="'+bx(6)+'" y1="44" x2="'+bx(6)+'" y2="'+ry(7)+'" stroke="#c00" stroke-width="1.5" stroke-dasharray="5 4"/>'+gTxt(bx(6)+4,ry(7)+12,'Status date: end of day 5',{anchor:'start',halo:false,size:11,fill:'#c00'});
  return sv(X0+15*CW+10,ry(7)+22,'Gantt chart for the canteen app project',out);
}

/* ---------- Q20: boom gate wiring diagram (sample) ---------- */
function figQ20(){
  var o='',L=function(p){return gLine(p)};
  /* 9 V battery and on/off switch on the top rail */
  o+=L([[40,40],[78,40]])+L([[78,22],[78,58]])+L([[88,31],[88,49]])+L([[100,22],[100,58]])+L([[110,31],[110,49]])+L([[110,40],[160,40]])+gTxt(94,74,'9 V battery',{halo:false,size:11});
  o+=gDot(166,40,false,5)+L([[170,38],[204,18]])+gDot(210,40,false,5)+L([[215,40],[425,40]])+gTxt(188,62,'On/off switch',{halo:false,size:11});
  /* the microcontroller: an 8-pin integrated circuit */
  o+=gRect(300,80,90,124,null)+gPath('M336,80 Q345,92 354,80',{noend:true})+gTxt(345,150,['Micro-','controller'],{halo:false,size:11,lh:13});
  [1,2,3,4].forEach(function(n,i){var y=100+i*28;o+=L([[280,y],[300,y]])+gTxt(310,y,String(n),{halo:false,size:10});o+=L([[390,y],[410,y]])+gTxt(380,y,String(9-n),{halo:false,size:10})});
  /* power: pin 8 to the switch, pin 4 to 0 V */
  o+=L([[410,100],[425,100],[425,40]])+L([[280,184],[260,184],[260,370]]);
  /* pin 7: 220 ohm resistor and red LED */
  o+=L([[410,128],[470,128],[476,118],[484,138],[492,118],[500,138],[508,118],[516,138],[522,128],[580,128]])+gTxt(496,108,'220 Ω',{halo:false,size:11});
  o+='<polygon points="580,114 580,142 604,128" fill="#fff"/>'+L([[604,114],[604,142]])+L([[604,128],[740,128],[740,370]])+gArr([[592,108],[602,96]])+gArr([[600,112],[610,100]])+gTxt(600,154,'Red LED',{halo:false,size:11});
  /* pin 6: motor */
  o+=L([[410,156],[450,156],[450,220],[575,220]])+gEll(600,220,25,25,'M',{size:14})+L([[625,220],[720,220],[720,370]])+gTxt(512,208,'Motor',{halo:false,size:11});
  /* pin 5: speaker */
  o+=L([[410,184],[430,184],[430,310],[590,310]])+gRect(590,298,10,24,null)+'<polygon points="600,298 616,284 616,336 600,322" fill="#fff"/>'+L([[616,310],[700,310],[700,370]])+gTxt(512,298,'Speaker',{halo:false,size:11});
  /* 0 V return rail */
  o+=L([[40,40],[40,370],[740,370]])+gTxt(60,386,'0 V',{halo:false,size:11});
  return sv(780,400,'Wiring diagram for the boom gate',o);
}

/* ---------- Q21: fruit sorting neural network (sample) ---------- */
function figQ21(){
  var L=[[[100,90,'Colour'],[100,190,'Diameter'],[100,290,'Weight']],[[280,90,'A1'],[280,190,'A2'],[280,290,'A3']],[[460,140,'B1'],[460,240,'B2']],[[640,140,'Apple'],[640,240,'Orange']]];
  var strong={'0:0-1':1,'1:1-0':1,'2:0-1':1},o='';
  for(var l=0;l<3;l++)L[l].forEach(function(a,ai){L[l+1].forEach(function(b,bi){
    var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.sqrt(dx*dx+dy*dy),k=26/d;
    o+=gArr([[a[0]+dx*k,a[1]+dy*k],[b[0]-dx*k,b[1]-dy*k]],{sw:strong[l+':'+ai+'-'+bi]?4.5:1.1});
  })});
  L[0].forEach(function(a){o+=gEll(a[0],a[1],24,24,null)+gTxt(a[0]-34,a[1],a[2],{anchor:'end',halo:false})});
  L[1].forEach(function(a){o+=gEll(a[0],a[1],24,24,a[2],{b:true})});
  L[2].forEach(function(a){o+=gEll(a[0],a[1],24,24,a[2],{b:true})});
  L[3].forEach(function(a){o+=gEll(a[0],a[1],24,24,null)+gTxt(a[0]+34,a[1],a[2],{anchor:'start',halo:false})});
  o+=gTxt(100,30,'Input layer',{b:true,halo:false})+gTxt(370,30,'Hidden layers',{b:true,halo:false})+gTxt(640,30,'Output layer',{b:true,halo:false});
  return sv(760,340,'Neural network for sorting fruit',o);
}

/* ---------- Q22: MLOps for the bus delay model (sample) ---------- */
function figQ22(){
  var o='',C=[[150,'Design'],[350,['Model','development']],[550,'Operation']],cy=150,r=95;
  C.forEach(function(c){o+=gEll(c[0],cy,r,r,c[1],{b:true})});
  o+=gPath('M180,58 Q250,10 320,58')+gPath('M380,58 Q450,10 520,58');
  o+=gPath('M520,242 Q450,290 380,242')+gPath('M320,242 Q250,290 180,242');
  o+=gPath('M600,236 Q350,360 100,236',{dash:true})+gTxt(350,316,'Monitoring results feed back into a new design cycle',{size:11,lh:12});
  var acts=[['Define the problem: predict','minutes late at each stop','Research data: GPS logs,','timetables and weather'],['Wrangle and clean the GPS','data; engineer features','Train, test and validate','the model'],['Deploy the model to the','journey planner app','Monitor accuracy and','retrain when it drifts']];
  acts.forEach(function(a,i){o+=gTxt(C[i][0],372,a,{halo:false,size:11,lh:14})});
  return sv(700,410,'The three stages of MLOps for the bus delay model',o);
}

/* ---------- Q23: linear and polynomial regression sketch (sample) ---------- */
var Q23X=[16,18,20,22,24,26,28,30],Q23Y=[20,22,26,32,41,52,66,83];
function figQ23(){
  var X0=70,Y0=330,sx=function(t){return X0+(t-14)*26},sy=function(v){return Y0-v*3.2},o='',i,n=Q23X.length;
  o+=gArr([[X0,Y0],[X0+460,Y0]])+gArr([[X0,Y0],[X0,30]]);
  for(i=14;i<=32;i+=2){o+=gLine([[sx(i),Y0],[sx(i),Y0+5]])+gTxt(sx(i),Y0+16,String(i),{halo:false,size:10.5})}
  for(i=0;i<=90;i+=10){o+=gLine([[X0-5,sy(i)],[X0,sy(i)]])+gTxt(X0-10,sy(i),String(i),{anchor:'end',halo:false,size:10.5})}
  o+=gTxt(X0+230,Y0+34,'Temperature (°C)',{halo:false,size:11.5})+'<text x="20" y="180" transform="rotate(-90 20 180)" text-anchor="middle" font-size="11.5">Iced drinks sold</text>';
  /* least squares line and quadratic, computed from the data */
  var mx=0,my=0;for(i=0;i<n;i++){mx+=Q23X[i]/n;my+=Q23Y[i]/n}
  var sxy=0,sxx=0;for(i=0;i<n;i++){sxy+=(Q23X[i]-mx)*(Q23Y[i]-my);sxx+=(Q23X[i]-mx)*(Q23X[i]-mx)}
  var b=sxy/sxx,a=my-b*mx;
  o+=gLine([[sx(15),sy(a+b*15)],[sx(31),sy(a+b*31)]],{sw:2})+gTxt(sx(31)+4,sy(a+b*31)+14,'Linear',{anchor:'start',halo:false,size:11});
  var q=quad(Q23X,Q23Y),pts=[];for(var t=15;t<=31.01;t+=0.5)pts.push([sx(t),sy(q[0]+q[1]*t+q[2]*t*t)]);
  o+=gLine(pts.map(function(p){return [Math.round(p[0]*10)/10,Math.round(p[1]*10)/10]}),{dash:true,sw:2})+gTxt(sx(29.4)-6,sy(q[0]+q[1]*30+q[2]*900)-8,['Polynomial','(better fit)'],{anchor:'end',halo:false,size:11,lh:13});
  for(i=0;i<n;i++)o+=gDot(sx(Q23X[i]),sy(Q23Y[i]),true,4);
  return sv(560,380,'Iced drink sales against temperature with linear and polynomial regression',o);
}
/* least squares quadratic y = c0 + c1 x + c2 x^2 (normal equations, Cramer's rule) */
function quad(xs,ys){
  var S=[0,0,0,0,0],T=[0,0,0];
  xs.forEach(function(x,i){var p=1;for(var k=0;k<5;k++){S[k]+=p;if(k<3)T[k]+=p*ys[i];p*=x}});
  var M=[[S[0],S[1],S[2]],[S[1],S[2],S[3]],[S[2],S[3],S[4]]];
  function det(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0])}
  var D=det(M);
  return [0,1,2].map(function(c){var m=M.map(function(r,ri){return r.map(function(v,ci){return ci===c?T[ri]:v})});return det(m)/D});
}

/* ---------- Q24: how the results page request travels (sample) ---------- */
function figQ24(){
  var o=gRect(30,150,130,60,['Browser','(student device)'])+gRect(30,20,130,56,'DNS server')+gRect(420,150,140,60,'Web server')+gRect(660,150,130,60,['Database','server']);
  o+=gArr([[70,150],[70,76]])+gArr([[120,76],[120,150]]);
  o+=gTxt(62,113,'1',{anchor:'end',size:11,b:true})+gTxt(128,113,'2',{anchor:'start',size:11,b:true});
  o+=gTxt(144,98,'1  DNS query for www.trackmeet.example',{anchor:'start',size:11})+gTxt(144,124,'2  DNS response: IP address 203.0.113.25',{anchor:'start',size:11});
  o+='<rect x="170" y="142" width="238" height="88" fill="none" stroke="#2f5aa8" stroke-dasharray="6 4"/>'+gTxt(290,242,'TLS encrypted connection (HTTPS)',{size:11,fill:'#2f5aa8'});
  o+=gArr([[160,170],[420,170]])+gTxt(290,160,'3  HTTPS GET /results',{size:11});
  o+=gArr([[420,196],[160,196]])+gTxt(290,212,'6  HTTPS response: results page',{size:11});
  o+=gArr([[560,170],[660,170]])+gTxt(610,160,'4  SQL query',{size:11});
  o+=gArr([[660,196],[560,196]])+gTxt(610,214,'5  Result rows',{size:11});
  return sv(820,310,'Diagram of a request for the results page travelling across the internet',o);
}

/* ---------- questions ---------- */
/* dr() plus the drawn sample answer shown in review, in the retry page and in the marking guide */
function drf(q,m,model,crit,tools,fig){var it=dr(q,m,model,crit,tools);it.fig=figWrap(fig);return it}
var FLOW='uses the flowchart symbols from the course specifications with arrowheads (terminators, process rectangles, decision diamonds, input/output parallelograms and the subprogram symbol)';

/* Question 1: Level 0 DFD */
qs.push(Q(SEP,'Greenline Community Gardens is developing a system for booking garden plots.'+bl([
 'A gardener sends a booking request and payment details to the system, and receives a booking confirmation.',
 'The system sends a payment request to a payment provider, which returns a payment result.',
 'At the end of each month the system sends a usage report to the local council.']),[
 drf('Draw a Level 0 data flow diagram for the plot booking system.',3,
  'One process (a circle) labelled Plot booking system. Three external entities (squares): Gardener, Payment provider and Council. Labelled, curved data flows: Gardener to the system (Booking request and payment details); the system to Gardener (Booking confirmation); the system to Payment provider (Payment request); Payment provider to the system (Payment result); the system to Council (Monthly usage report). No data stores or internal processes are shown.',
  ['1 mark: a single process for the whole system and the three external entities, using the correct symbols.',
   '1 mark: all five data flows labelled and pointing in the correct direction.',
   '1 mark: follows Level 0 conventions: no data stores and no internal processes, and every flow joins an external entity to the process.'],'dfd',figQ1())],{two:true}));

/* Question 2: full DFD */
qs.push(Q(SEP,'Rolling Spoon, a food truck, is developing an app so customers can order before they arrive.'+bl([
 'Process 1, Take order, receives order details from the customer. It reads menu items and prices from the Menu data store, writes an order record to the Orders data store and sends the order total to the customer.',
 'Process 2, Prepare order, reads each order record from the Orders data store and sends a preparation list to the kitchen staff. The kitchen staff send back an order ready message, and Prepare order writes the new order status to the Orders data store.',
 'Process 3, Notify collection, reads ready orders from the Orders data store and sends a collection message to the customer.']),[
 drf('Draw a data flow diagram for the pre-order system.',4,
  'Processes drawn as circles: 1 Take order, 2 Prepare order, 3 Notify collection. Data stores drawn as open-ended boxes: Menu, Orders. External entities drawn as squares: Customer, Kitchen staff. Labelled, curved data flows: Customer to Take order (Order details); Take order to Customer (Order total); Menu to Take order (Menu items and prices); Take order to Orders (Order record); Orders to Prepare order (Order record); Prepare order to Kitchen staff (Preparation list); Kitchen staff to Prepare order (Order ready); Prepare order to Orders (Order status); Orders to Notify collection (Ready order); Notify collection to Customer (Collection message).',
  ['1 mark: the three processes drawn as circles, numbered and named.',
   '1 mark: the two data stores and two external entities drawn with the correct symbols.',
   '1 mark: all ten data flows present, labelled and pointing in the correct direction.',
   '1 mark: every data flow starts or ends at a process (no flow between two data stores, between two external entities, or between an external entity and a data store).'],'dfd',figQ2())],{two:true}));

/* Question 3: correcting a DFD */
qs.push(Q(SEP,'A council library lends e-books. A student drew this data flow diagram for the loan system. It contains three errors.'+fig('Data flow diagram for the e-book loan system',figQ3Bad())+
 '<p>Process 1 records each loan in the Loans data store. Process 2 uses the Loans data store to find overdue loans.</p>',[
 drf('Redraw the data flow diagram so that it is correct.',3,
  'The corrected diagram keeps Member, Check out e-book, Members, Loans and Send reminder, and the flows Loan request, E-book link, Member status and Reminder email. The Member details flow from the Members data store straight to the Loans data store is removed (data cannot move between two data stores without a process). The Loan details flow from Member straight to the Loans data store is removed (an external entity cannot write to a data store); instead Check out e-book sends a Loan record to Loans. Send reminder had an output but no input, so a flow Overdue loans is added from Loans to Send reminder.',
  ['1 mark: removes the flow between the two data stores.',
   '1 mark: replaces the flow from Member to Loans with a Loan record flow from Check out e-book to Loans.',
   '1 mark: adds an input to Send reminder (Overdue loans from the Loans data store), keeping the rest of the diagram correct.'],'dfd',figQ3Good())],{two:true}));

/* Question 4: structure chart from pseudocode */
qs.push(Q(SEP,'An online quiz is marked by the following algorithm.'+code(`BEGIN MarkQuiz
    LoadQuestions (questions)
    REPEAT
        AskQuestion (question, response)
        CheckAnswer (question, response, correct)
        IF correct = True THEN
            AddPoint (score)
        ENDIF
    UNTIL all questions asked
    ShowResult (score)
END MarkQuiz`)+'<p>LoadQuestions returns the questions. AskQuestion is given a question and returns the response. CheckAnswer sets the flag correct. AddPoint adds one to score and returns it.</p>',[
 drf('Draw a structure chart for MarkQuiz. Show the data and control passed between the modules, selection and repetition.',4,
  'MarkQuiz at the top, with five modules below it, left to right in the order called: LoadQuestions, AskQuestion, CheckAnswer, AddPoint, ShowResult. Data couples (open circles with arrows): questions up from LoadQuestions; question down to and response up from AskQuestion; question and response down to CheckAnswer; score down to and up from AddPoint; score down to ShowResult. A control couple (filled circle) correct passes up from CheckAnswer. A small diamond on the line to AddPoint shows it is called only when correct is True. A curved repetition arrow across the lines to AskQuestion, CheckAnswer and AddPoint, labelled until all questions asked.',
  ['1 mark: MarkQuiz at the top with the five modules below it in calling order.',
   '1 mark: data couples drawn with open circles and arrows showing the correct direction for each parameter.',
   '1 mark: correct drawn as a control couple (filled circle) passed up from CheckAnswer.',
   '1 mark: a decision diamond on the line to AddPoint and a repetition arrow covering AskQuestion, CheckAnswer and AddPoint only.'],'structure',figQ4())],{two:true}));

/* Question 5: refinement */
qs.push(Q(SEP,'A theatre box office program is shown in this structure chart.'+fig('Box office structure chart',figQ5Main())+bl([
 'Sell tickets first calls Check seats, which is given the event ID and returns the seats available.',
 'Sell tickets then calls Select seat repeatedly until all the tickets are selected. Select seat returns a seat number each time.',
 'Finally Sell tickets calls Take payment, which is given the total and returns a paid flag.']),[
 drf('Refine the Sell tickets module by drawing a separate structure chart for it.',3,
  'A separate chart headed by a module named Sell tickets (the same name as in the main chart), showing the parameters it exchanges with its caller: event ID passed in and seat list passed out. Below it, three modules in order: Check seats (event ID down, seats available up), Select seat (seat number up) with a curved repetition arrow labelled until all tickets selected, and Take payment (total down, paid flag up as a control couple with a filled circle).',
  ['1 mark: Sell tickets as the top module, with the same name and couples (event ID in, seat list out) as the main chart.',
   '1 mark: Check seats, Select seat and Take payment below it with correct data couples.',
   '1 mark: a repetition arrow on Select seat and paid flag drawn as a control couple.'],'structure',figQ5Ref())],{two:true}));

/* Question 6: inheritance, removing redundant attributes */
qs.push(Q(SEP,'A hire company rents out cars, vans, electric scooters and bikes. The attributes stored for each are shown.'+cls([
 ['Car',['registration','dailyRate','seats','fuelType','bootSize']],
 ['Van',['registration','dailyRate','seats','fuelType','loadCapacity']],
 ['EScooter',['dailyRate','serialNumber','batteryRange','maxSpeed']],
 ['Bike',['dailyRate','serialNumber','frameSize','gears']]]),[
 drf('Construct a class diagram that shows inheritance and removes redundant attributes for each class. Additional classes may be included if required. You do NOT need to show methods.',3,
  'A superclass HireItem holds dailyRate. Two classes inherit from HireItem: MotorVehicle (registration, seats, fuelType) and Micromobility (serialNumber). Car (bootSize) and Van (loadCapacity) inherit from MotorVehicle. EScooter (batteryRange, maxSpeed) and Bike (frameSize, gears) inherit from Micromobility. Inheritance arrows point from each subclass to its superclass. No attribute appears in more than one class.',
  ['1 mark: a superclass holding dailyRate, the attribute common to all four classes.',
   '1 mark: intermediate classes holding the attributes shared by Car and Van, and by EScooter and Bike.',
   '1 mark: each of the four original classes keeps only its unique attributes, with inheritance arrows pointing to the correct superclass.'],'class',figQ6())],{two:true}));

/* Question 7: class diagram with relationships */
qs.push(Q(SEP,'A music school is modelling its system with these classes and rules.'+bl([
 'Every person has a name and phone number, and can update their phone number.',
 'A teacher is a person with a teacher ID and an instrument. A teacher can book a lesson.',
 'A student is a person with a student ID and a grade. A student can pay a fee.',
 'A lesson has a date, time and room, and can be rescheduled.',
 'Each lesson is taught by exactly one teacher. A teacher teaches zero or more lessons.',
 'Each lesson has between one and four students. A student attends zero or more lessons.']),[
 drf('Draw a class diagram for the music school, including multiplicity.',3,
  'Classes in three compartments (name, attributes, methods): Person (name, phone; updatePhone()), Teacher (teacherID, instrument; bookLesson()), Student (studentID, grade; payFee()), Lesson (date, time, room; reschedule()). Inheritance arrows from Teacher and Student to Person. A relationship arrow between Teacher and Lesson labelled teaches, with 1..1 at the Teacher end and 0..* at the Lesson end. A relationship arrow between Student and Lesson labelled attends, with 1..4 at the Student end and 0..* at the Lesson end.',
  ['1 mark: the four classes with their attributes and methods in the correct compartments, and name and phone only in Person.',
   '1 mark: Teacher and Student inherit from Person.',
   '1 mark: relationships between Teacher and Lesson and between Student and Lesson with the correct multiplicities (1..1 and 0..*, 1..4 and 0..*).'],'class',figQ7())],{two:true}));

/* Question 8: class diagram from code */
qs.push(Q(SEP,'A bank uses the following Python code.'+code(`class Account:
    def __init__(self, number, owner):
        self.number = number
        self.owner = owner          # one Customer
        self.balance = 0

    def deposit(self, amount):
        self.balance = self.balance + amount

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance = self.balance - amount

class SavingsAccount(Account):
    def __init__(self, number, owner, rate):
        super().__init__(number, owner)
        self.rate = rate

    def add_interest(self):
        self.deposit(self.balance * self.rate)

class Customer:
    def __init__(self, name):
        self.name = name
        self.accounts = []          # starts empty

    def open_account(self, account):
        self.accounts.append(account)`),[
 drf('Draw a class diagram that represents this code, including multiplicity.',3,
  'Account (number, owner, balance; deposit(amount), withdraw(amount)). SavingsAccount (rate; add_interest()) with an inheritance arrow to Account and no repeated attributes. Customer (name, accounts; open_account(account)). A relationship between Customer and Account: each account has exactly one customer (1..1 at the Customer end) and a customer holds zero or more accounts (0..* at the Account end).',
  ['1 mark: the three classes with the attributes and methods from the code in the correct compartments.',
   '1 mark: SavingsAccount inherits from Account and shows only rate and add_interest().',
   '1 mark: a relationship between Customer and Account with 1..1 at Customer and 0..* at Account.'],'class',figQ8())],{two:true}));

/* Question 9: relational database from a flat file */
qs.push(Q(PW,'Entries for a schools netball carnival are kept in one flat file. Part of it is shown.'+tbl(['PlayerID','PlayerName','TeamName','Division','CoachName','SchoolName','Suburb'],[
 ['P101','Ava Lin','Hawks A','Senior','R. Shah','Bayside High','Kurnell'],
 ['P102','Mia Tran','Hawks A','Senior','R. Shah','Bayside High','Kurnell'],
 ['P103','Zoe Kerr','Hawks B','Junior','D. Moss','Bayside High','Kurnell'],
 ['P104','Ruby Ng','Kites','Junior','J. Ali','Ridge College','Engadine']])+
 '<p>Each player is in one team. Each team belongs to one school, and a school can enter several teams.</p>',[
 drf('The data is to be stored in a relational database with three tables. Draw a diagram of the tables showing their fields, the primary and foreign keys, and the relationships between the tables.',4,
  'Schools (SchoolID primary key, SchoolName, Suburb). Teams (TeamID primary key, TeamName, Division, CoachName, SchoolID foreign key). Players (PlayerID primary key, PlayerName, TeamID foreign key). A one-to-many relationship from Schools to Teams (1 at Schools, ∞ at Teams, joining SchoolID) and from Teams to Players (1 at Teams, ∞ at Players, joining TeamID). Keys are marked, for example with (P) and (F) and a key.',
  ['1 mark: three tables that hold every field once, with no repeated school or team details in Players.',
   '1 mark: a primary key identified in each table (a new SchoolID and TeamID are acceptable).',
   '1 mark: foreign keys SchoolID in Teams and TeamID in Players identified.',
   '1 mark: one-to-many relationships drawn between the matching key fields with 1 and ∞ at the correct ends.'],'database',figQ9())],{two:true}));

/* Question 10: database diagram from SQL */
qs.push(Q(PW,'A vet clinic runs these SQL queries on its database.'+code(`SELECT Pets.Name, Appointments.Date, Appointments.Time
FROM Pets, Appointments
WHERE Pets.PetID = Appointments.PetID
AND Pets.Species = 'Rabbit'
ORDER BY Appointments.Date ASC

SELECT Vets.Name, COUNT (Appointments.AppointmentID) AS Total
FROM Vets, Appointments
WHERE Vets.VetID = Appointments.VetID
GROUP BY Vets.VetID`)+'<p>Each appointment is for one pet with one vet.</p>',[
 drf('Draw a diagram of the three tables used by these queries, showing the fields named in the queries, the primary and foreign keys and the relationships.',3,
  'Pets (PetID primary key, Name, Species). Vets (VetID primary key, Name). Appointments (AppointmentID primary key, Date, Time, PetID foreign key, VetID foreign key). One-to-many relationships: Pets to Appointments on PetID and Vets to Appointments on VetID, with 1 at Pets and Vets and ∞ at Appointments.',
  ['1 mark: the three tables with every field named in the queries in the correct table.',
   '1 mark: primary keys PetID, VetID and AppointmentID, and foreign keys PetID and VetID in Appointments.',
   '1 mark: two one-to-many relationships with the many end at Appointments.'],'database',figQ10())],{two:true}));

/* Question 11: database diagram from ORM code */
qs.push(Q(PW,'A school library app uses an object-relational mapping (ORM) framework. Its model classes are shown.'+code(`class Author(Model):
    author_id = IntegerField(primary_key=True)
    name = TextField()

class Book(Model):
    isbn = TextField(primary_key=True)
    title = TextField()
    author = ForeignKey(Author)     # stored as author_id

class Loan(Model):
    loan_id = IntegerField(primary_key=True)
    book = ForeignKey(Book)         # stored as isbn
    member_name = TextField()
    due_date = DateField()`),[
 drf('Draw a diagram of the database tables that the ORM creates from these classes. Show the fields, the keys and the relationships.',3,
  'Author (author_id primary key, name). Book (isbn primary key, title, author_id foreign key). Loan (loan_id primary key, isbn foreign key, member_name, due_date). One-to-many relationships: Author to Book (one author, many books) and Book to Loan (one book, many loans), with 1 at the parent table and ∞ at the child table.',
  ['1 mark: one table per class with a field for each attribute, the foreign keys stored as author_id and isbn.',
   '1 mark: primary and foreign keys identified in each table.',
   '1 mark: one-to-many relationships Author to Book and Book to Loan, with the many end at the table holding the foreign key.'],'database',figQ11())],{two:true}));

/* Question 12: storyboard */
qs.push(Q(PW,'A bushwalking club is building a mobile app.'+bl([
 'The Home screen has two buttons: Start walk and My walks.',
 'Start walk opens the Track walk screen, which shows a live map, the time and distance, and a Stop button.',
 'Stop opens the Walk summary screen, which shows the distance and time with Save and Home buttons. Save opens the Walk details screen for the saved walk.',
 'My walks opens a list of saved walks with a Home button. Selecting a walk opens its Walk details screen, which has a Back button that returns to My walks.']),[
 drf('Draw a storyboard for the app.',3,
  'Five screens drawn as frames with a title and their main elements: Home (title, Start walk and My walks buttons), Track walk (live map, time and distance, Stop button), Walk summary (distance, time, Save and Home buttons), My walks (list of walks, Home button) and Walk details (route map, distance and time, Back button). Arrows from the triggering button to the screen it opens: Start walk to Track walk; Stop to Walk summary; Save to Walk details; Home (from Walk summary and from My walks) to Home; My walks to My walks; a walk in the list to Walk details; Back to My walks.',
  ['1 mark: all five screens with a title and the elements described.',
   '1 mark: navigation arrows start at the button or item that triggers them and point to the correct screen.',
   '1 mark: every link described is shown, including the Home, Save and Back links.'],'storyboard',figQ12())],{two:true}));

/* Question 13: screen design */
qs.push(Q(PW,'A charity is designing the online registration screen for its Harbour Fun Run. Each runner enters a full name, an email address, a date of birth, a distance (5 km or 10 km only) and an optional t-shirt size (S, M, L or XL). The screen has Submit and Cancel buttons.',[
 drf('Design the registration screen. Annotate your design to justify THREE design choices.',3,
  'A single screen with a clear title. Labelled text boxes for full name and email, with required fields marked. A date picker (or three drop-down lists) for date of birth. Radio buttons for the distance so only one of 5 km and 10 km can be chosen. A drop-down list for t-shirt size. An area for error messages beside the field (for example an invalid email message in red). Cancel and Submit buttons, with the main action in a consistent position. Annotations justify choices such as: radio buttons allow only valid distances; a date picker prevents invalid dates; errors appear beside the field so users can fix them; consistent layout and labels improve usability and accessibility.',
  ['1 mark: an appropriate input control for each item (text boxes, date picker or lists, radio buttons for distance, drop-down for size) with clear labels.',
   '1 mark: a logical, uncluttered layout with a title, required fields shown, a place for error messages, and Submit and Cancel buttons.',
   '1 mark: three annotations that justify design choices in terms of usability, validation or accessibility.'],'screen',figQ13())],{two:true}));

/* Question 14: decision tree */
qs.push(Q(SA,'A garden irrigation controller has been trained to decide when to water. Its learned rules are:'+bl([
 'If the soil moisture is 40% or more, do not water.',
 'Otherwise, if rain is forecast in the next 6 hours, do not water.',
 'Otherwise, if the time is between 10 am and 4 pm, water in the evening.',
 'Otherwise, water now.']),[
 drf('Draw a decision tree that represents these rules.',3,
  'The root decision is Soil moisture 40% or more? Yes leads to Do not water. No leads to Rain forecast in the next 6 hours? Yes leads to Do not water. No leads to Time between 10 am and 4 pm? Yes leads to Water in the evening and No leads to Water now. Every branch is labelled Yes or No.',
  ['1 mark: the three conditions tested in the correct order, starting with soil moisture.',
   '1 mark: every branch labelled (Yes and No, or equivalent).',
   '1 mark: each path ends in the correct action.'],'tree',figQ14())],{two:true}));

/* Question 15: decision tree in the condition and action column form */
qs.push(Q(SA,'An online store uses these rules to set shipping.'+bl([
 'Gold members always get free shipping. Their delivery is express to metro addresses and standard to regional addresses.',
 'Standard members with an order total of $100 or more get free, standard delivery.',
 'Standard members with an order total under $100 get standard delivery. Shipping costs $9.95 to metro addresses and $14.95 to regional addresses.']),[
 drf('Represent these rules as a decision tree with condition columns (Membership, Order total, Destination) leading to action columns (Shipping, Delivery).',3,
  'Column headings Membership, Order total, Destination, Shipping and Delivery. From Actions, branches to Gold and Standard. Gold branches straight to Destination: Metro leads to Free and Express; Regional leads to Free and Standard. Standard branches to Order total: $100 or more leads to Free and Standard; Under $100 branches to Destination: Metro leads to $9.95 and Standard; Regional leads to $14.95 and Standard.',
  ['1 mark: condition columns and action columns in the correct order, with branches drawn from each condition value.',
   '1 mark: all five paths present, with only the conditions that matter on each path.',
   '1 mark: the correct shipping and delivery actions at the end of each path.'],'tree',figQ15())],{two:true}));

/* Question 16: flowchart with CASEWHERE */
qs.push(Q(PW,'A car park website calculates the parking fee.'+code(`BEGIN ParkingFee
    Get vehicleType
    CASEWHERE vehicleType evaluates to
        "car": fee = 12
        "motorbike": fee = 5
        "bus": fee = 30
        OTHERWISE: fee = 0
    ENDCASE
    Display fee
END ParkingFee`),[
 drf('Draw a flowchart that represents this algorithm.',3,
  'BEGIN ParkingFee terminator, then the input Get vehicleType, then a decision symbol for vehicleType with four labelled branches: "car" to fee = 12, "motorbike" to fee = 5, "bus" to fee = 30 and OTHERWISE to fee = 0. The four branches join again, then the output Display fee and the END ParkingFee terminator.',
  ['1 mark: '+FLOW+' for BEGIN, END, the input and the output.',
   '1 mark: a multi-way selection with one labelled branch for each case and for OTHERWISE, each to the correct process.',
   '1 mark: the branches rejoin before Display fee, so only one fee is set.'],'flowchart',figQ16())],{two:true}));

/* Question 17: post-test loop with nested IF */
qs.push(Q(SSA,'A website asks new users to create a password.'+code(`BEGIN CreatePassword
    REPEAT
        Get password
        IF length of password < 8 THEN
            Display "Too short"
        ELSEIF password does not contain a digit THEN
            Display "Add a number"
        ELSE
            Display "Password accepted"
        ENDIF
    UNTIL length of password >= 8 AND password contains a digit
END CreatePassword`),[
 drf('Draw a flowchart that represents this algorithm.',3,
  'BEGIN CreatePassword, then Get password (the start of the loop). Decision length of password < 8? True leads to Display "Too short". False leads to the decision password contains a digit? (or the reverse condition, with the branches swapped): No leads to Display "Add a number" and Yes leads to Display "Password accepted". All three outputs join, then the loop test length >= 8 AND contains a digit?: False returns to just before Get password, and True leads to END CreatePassword.',
  ['1 mark: a post-test loop: the body runs before the test, False returns to the start of the body and True exits to END.',
   '1 mark: a nested selection with labelled branches giving the three messages in the correct cases.',
   '1 mark: '+FLOW+'.'],'flowchart',figQ17())],{two:true}));

/* Question 18: mainline with a function */
qs.push(Q(SA,'A swimming coach uses this algorithm to find a swimmer\'s average speed over several 400 m laps.'+code(`BEGIN AverageSpeed
    total = 0
    count = 0
    Get lapTime
    WHILE lapTime <> 0
        speed = CalcSpeed (lapTime)
        total = total + speed
        count = count + 1
        Get lapTime
    ENDWHILE
    IF count > 0 THEN
        Display total / count
    ENDIF
END AverageSpeed

BEGIN CalcSpeed (time)
    speed = 400 / time
    RETURN speed
END CalcSpeed (time)`),[
 drf('Draw flowcharts for AverageSpeed and for the function CalcSpeed.',4,
  'AverageSpeed: BEGIN AverageSpeed, total = 0, count = 0, Get lapTime, then the pre-test decision lapTime <> 0?. True leads to the subprogram symbol speed = CalcSpeed (lapTime), then total = total + speed, count = count + 1 and Get lapTime, returning to just above the decision. False leads to the decision count > 0?: True leads to Display total / count then END AverageSpeed; False goes straight to END AverageSpeed. A separate flowchart: BEGIN CalcSpeed (time), speed = 400 / time, RETURN speed, END CalcSpeed (time).',
  ['1 mark: initialisation and a first Get lapTime before a pre-test loop that tests lapTime <> 0 and returns above the test.',
   '1 mark: inside the loop, CalcSpeed called with the subprogram symbol and the parameter, then the totals updated and the next lap time read.',
   '1 mark: after the loop, a selection that displays the average only when count > 0, then END.',
   '1 mark: a separate flowchart for CalcSpeed with BEGIN CalcSpeed (time), the calculation, RETURN speed and END CalcSpeed (time).'],'flowchart',figQ18())],{two:true}));

/* Question 19: Gantt chart with resources and progress */
qs.push(Q(SEP,'A team is building a canteen ordering app. Durations are in working days (Monday to Friday), starting on Monday of Week 1.'+
 tbl(['ID','Task','Duration','Starts after','Assigned to','Complete at the end of day 5'],[['1','Survey students','3 days','Project start','Priya','100%'],['2','Design screens','4 days','Task 1','Ben','50%'],['3','Set up database','2 days','Task 1','Priya','100%'],['4','Code the app','5 days','Tasks 2 and 3','Ben, Priya','0%'],['5','Test the app','2 days','Task 4','Ben, Priya','0%']])+
 '<p>The Design complete milestone is reached when Tasks 2 and 3 are finished. The App launch milestone is reached when Task 5 is finished.</p>',[
 drf('Create a Gantt chart for the project as it stands at the end of day 5. Show the time scale, dependencies, milestones, the team members allocated to each task and the progress of each task.',4,
  'A time scale of working days over three weeks. Bars: 1 Survey students days 1 to 3 (Priya, 100% complete); 2 Design screens days 4 to 7 (Ben, half shaded for 50%); 3 Set up database days 4 to 5 (Priya, 100%); 4 Code the app days 8 to 12 (Ben, Priya, 0%); 5 Test the app days 13 to 14 (Ben, Priya, 0%). Dependency arrows 1 to 2, 1 to 3, 2 to 4, 3 to 4 and 4 to 5. A diamond for Design complete at the end of day 7 and a diamond for App launch at the end of day 14. Team member names beside each task, the percentage complete shown by shading or labels, and the status date (end of day 5) marked.',
  ['1 mark: five clearly named bars of the correct length and start day, against a labelled time scale.',
   '1 mark: dependencies shown, with Task 4 starting only after both Task 2 and Task 3.',
   '1 mark: the two milestones drawn as diamonds at the end of day 7 and day 14.',
   '1 mark: team members allocated to each task and the progress of each task shown (for example shading and percentages).'],'gantt',figQ19())],{two:true}));

/* Question 20: wiring diagram */
qs.push(Q(SA,'A model boom gate is controlled by a microcontroller.'+bl([
 'A 9 V battery powers the circuit through an on/off switch connected to pin 8 of the microcontroller, an 8-pin integrated circuit. Pin 4 connects to the negative terminal of the battery (0 V).',
 'Pin 7 drives a red warning LED through a 220 Ω resistor in series.',
 'Pin 6 drives the motor that lifts the gate.',
 'Pin 5 drives a speaker that beeps while the gate moves.',
 'The LED, motor and speaker each return to 0 V.']),[
 drf('Draw a wiring diagram for the boom gate using the symbols from the course specifications. Label each component.',3,
  'A DC battery symbol labelled 9 V with its positive side through an on/off switch symbol to pin 8 of an integrated circuit drawn as a box with eight numbered pins. Pin 4 to the 0 V rail (negative battery terminal). Pin 7 to a 220 Ω resistor (zigzag) in series with an LED (diode with two arrows) to 0 V. Pin 6 to a motor (circle with M) to 0 V. Pin 5 to a speaker to 0 V. Every component is labelled.',
  ['1 mark: the correct symbols for the battery, switch, integrated circuit, resistor, LED, motor and speaker, each labelled.',
   '1 mark: the battery and switch in series supplying pin 8, with pin 4 returned to 0 V.',
   '1 mark: the resistor and LED in series from pin 7, the motor from pin 6 and the speaker from pin 5, each completing a circuit to 0 V.'],'wiring',figQ20())],{two:true}));

/* Question 21: neural network */
qs.push(Q(SA,'A packing shed uses a trained neural network to sort fruit.'+bl([
 'The input layer has three nodes: Colour, Diameter and Weight.',
 'There are two hidden layers. The first has three nodes (A1, A2, A3) and the second has two nodes (B1, B2).',
 'The output layer has two nodes: Apple and Orange.',
 'Each node is connected to every node in the next layer.',
 'The connections Colour to A2, A2 to B1 and B1 to Orange have the strongest weightings.']),[
 drf('Draw a diagram of the neural network. Show the direction of the signals and the strongest weightings.',3,
  'Four columns of nodes (circles) labelled as layers: inputs Colour, Diameter and Weight; hidden layer A1, A2, A3; hidden layer B1, B2; outputs Apple and Orange. Arrows run left to right from every node to every node in the next layer: 9 between the inputs and the first hidden layer, 6 between the hidden layers and 4 to the outputs (19 connections). Colour to A2, A2 to B1 and B1 to Orange are drawn thicker than the rest.',
  ['1 mark: the four layers with the correct number of labelled nodes.',
   '1 mark: every node joined to every node in the next layer, with arrows from input to output.',
   '1 mark: the three strongest connections drawn thicker (or clearly labelled).'],'neural',figQ21())],{two:true}));

/* Question 22: MLOps */
qs.push(Q(SA,'A transport authority is using MLOps to build and run a model that predicts how late each bus will be at each stop.',[
 drf('Draw a diagram of the three stages of MLOps for the bus delay model. Show how the stages connect, and label each stage with TWO activities specific to this model.',3,
  'Three connected stages drawn as circles or boxes in order: Design, Model development and Operation, with arrows showing work moving forward and feeding back, so the process is a continuous cycle (monitoring in Operation leads back to Design and Model development). Activities, for example: Design: define the problem as predicting minutes late at each stop; research available data such as GPS logs, timetables and weather. Model development: wrangle and clean the GPS data and engineer features; train, test and validate the model. Operation: deploy the model to the journey planner app; monitor its accuracy and retrain when performance drops.',
  ['1 mark: the three stages named and in the correct order.',
   '1 mark: arrows that show the stages as a continuous, iterative cycle, including feedback from Operation.',
   '1 mark: two relevant activities for each stage, applied to the bus delay model.'],'mlops',figQ22())],{two:true}));

/* Question 23: regression sketch */
qs.push(Q(SA,'A café records the temperature and the number of iced drinks it sells each day.'+tbl(['Temperature (°C)','16','18','20','22','24','26','28','30'],[['Iced drinks sold','20','22','26','32','41','52','66','83']]),[
 drf('Draw labelled axes and plot the data. On the same axes, sketch the line that linear regression would fit and the curve that polynomial regression would fit. Label which model fits the data better.',3,
  'Axes labelled Temperature (°C) on the horizontal axis and Iced drinks sold on the vertical axis, each with a scale, and the eight points plotted. A straight line through the middle of the points (below the outer points and above the middle ones), labelled Linear. A curve that bends upward and passes close to every point, labelled Polynomial (the better fit).',
  ['1 mark: labelled axes with scales and the eight points plotted correctly.',
   '1 mark: a straight line of best fit for linear regression, following the overall trend.',
   '1 mark: an upward-bending curve for polynomial regression that passes close to the points, labelled as the better fit.'],'graph',figQ23())],{two:true}));

/* Question 24: web request diagram */
qs.push(Q(PW,'A student opens https://www.trackmeet.example/results on a phone. The results page is built by the web server from data held on a separate database server.',[
 drf('Draw a diagram that shows the numbered sequence of requests and responses between the browser, a DNS server, the web server and the database server. Show where the data is encrypted.',3,
  'Four labelled boxes: Browser, DNS server, Web server and Database server. Numbered, labelled arrows: 1 the browser sends a DNS query for www.trackmeet.example to the DNS server; 2 the DNS server returns the IP address; 3 the browser sends an HTTPS GET request for /results to the web server; 4 the web server sends an SQL query to the database server; 5 the database server returns the result rows; 6 the web server sends the HTTPS response (the results page) to the browser. Requests 3 and 6 are shown inside a TLS encrypted connection.',
  ['1 mark: the four components with arrows in both directions between the correct pairs.',
   '1 mark: the steps numbered in the correct order, starting with the DNS lookup and ending with the response to the browser.',
   '1 mark: the HTTPS request and response shown as encrypted with TLS between the browser and the web server.'],'network',figQ24())],{two:true}));

/* Question 25: data dictionary */
qs.push(Q(SEP,'The bushwalking app stores a record for each walk.'+bl([
 'walkID: two capital letters followed by four digits, for example BW0042.',
 'startTime: the date and time the walk began.',
 'distanceKm: the distance walked in kilometres, to two decimal places, less than 100.',
 'completed: whether the walk was finished.']),[
 ft('Complete the data dictionary for the walk record.',3,['Variable','Data type','Format for display','Size in bytes','Example','Validation'],
  [['walkID',null,null,null,null,null],['startTime',null,null,null,null,null],['distanceKm',null,null,null,null,null],['completed',null,null,null,null,null]],
  [['walkID','String','XXNNNN','6','BW0042','Two capital letters then four digits'],['startTime','Date and time','DD/MM/YYYY hh:mm','4','05/11/2026 07:15','Not later than the current date and time'],['distanceKm','Floating point','NN.NN','4','12.45','0 to 99.99'],['completed','Boolean','X','1 bit','Y','Y or N']],
  ['1 mark: an appropriate data type for each variable (string, date and time, floating point, Boolean).',
   '1 mark: a format and size consistent with each data type (for example 4 bytes for date and time and floating point, 1 bit for Boolean, one byte per character).',
   '1 mark: a valid example and a sensible validation rule for each variable.'])],{two:true}));

BANKS.push({id:'22',name:'Complete Diagram Mock',sub:'25 questions · 80 marks · Every drawing activity in the syllabus and course specifications',mini:true,questions:25,marks:80,duration:150*60,qs:qs});
})();
