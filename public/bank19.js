/* Diagram Practice Paper (bank 19). Original mini paper: every question is a drawing question,
   one for each kind of diagram in the HSC Course Specifications. Symbols follow the specifications and
   every diagram can be drawn with the exam's drawing tool (rectangle, diamond, circle, arrow, line, pencil, text).
   Each drawing part carries a drawn sample answer (the fifth argument of drFig) shown after marking. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];

/* ---------- small SVG kit for the stimulus and the drawn sample answers ---------- */
var UID=0;
function sv(w,h,label,body){
  UID++;var a='dga'+UID,t='dgt'+UID;
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

/* ---------- Q1: Level 0 data flow diagram ---------- */
function figL0(){
  var P=Cc(320,150,64),H=Rr(24,104,112,56),V=Rr(504,28,112,56),M=Rr(504,222,112,56);
  return sv(640,300,'Level 0 data flow diagram for the parcel request system',
    gEll(320,150,64,64,['Parcel request','system'])+gRect(24,104,112,56,'Household')+gRect(504,28,112,56,'Volunteer')+gRect(504,222,112,56,'Manager')+
    gFlow(H,P,-26,['Request form'],{lo:14})+gFlow(P,H,-26,['Collection','text message'],{lo:20})+
    gFlow(P,V,-20,['Packing list'],{lo:16})+gFlow(P,M,20,['Stock report'],{lo:16}));
}

/* ---------- Q2: data flow diagram with processes, stores and entities ---------- */
function figDFD(){
  var Ca=Rr(20,200,100,56),L=Cc(260,112,48),Ru=Rr(380,238,140,36),D=Cc(690,255,48),Cs=Rr(570,60,120,34),Ce=Rr(640,400,100,56),X=Cc(260,400,48);
  return sv(800,480,'Data flow diagram for the wildlife rescue system',
    gRect(20,200,100,56,'Caller')+gRect(380,238,140,36,'Rescues')+gRect(570,60,120,34,'Carers')+gRect(640,400,100,56,'Carer')+
    gEll(260,112,48,48,['1','Log call'])+gEll(690,255,48,48,['2','Dispatch','carer'])+gEll(260,400,48,48,['3','Close','rescue'])+
    gFlow(Ca,L,-14,['Animal and','location details'],{lo:12,lx:-18})+gFlow(L,Ru,-14,['Rescue record'],{lo:12,lx:10})+
    gFlow(Ru,D,-12,['Rescue record'],{p:[520,248],q:[644,238],lo:10})+gFlow(D,Ru,-12,['Carer assigned'],{p:[646,274],q:[520,264],lo:10})+
    gFlow(Cs,D,0,['Available carers'],{lo:-8,lx:46,ly:6})+
    gFlow(D,Ce,-6,['Job request'],{p:[672,300],q:[672,400],lo:-6,lx:-38})+gFlow(Ce,D,-6,['Acceptance'],{p:[708,400],q:[708,300],lo:-6,lx:36})+
    gFlow(Ce,X,10,['Outcome report'],{lo:10})+gFlow(X,Ru,10,['Updated','rescue record'],{lo:12,lx:20})+gFlow(X,Ca,10,['Outcome message'],{lo:12,lx:-30,ly:8}));
}

/* ---------- structure chart helpers ---------- */
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

/* ---------- Q3: structure chart for the car park exit program ---------- */
function figCarPark(){
  var W=120,H=36,out='';
  out+=drops(390,56,88,[100,280,500,690],170)+gLine([[280,206],[280,300]])+gLine([[500,206],[500,300]]);
  out+=sbox(330,20,W,H,'Process exit')+sbox(40,170,W,H,'Read ticket')+sbox(220,170,W,H,'Calculate fee')+sbox(440,170,W,H,'Take payment')+sbox(630,170,W,H,'Open gate')+
       sbox(220,300,W,H,'Find entry time')+sbox(440,300,W,H,'Read card');
  out+=couple([100,130],false,'u','ticket ID','r');
  out+=couple([280,110],false,'d','ticket ID','l')+couple([280,146],false,'u','fee','r');
  out+=couple([500,110],false,'d','fee','l')+couple([500,146],true,'u','paid flag','r');
  out+=sdec([690,128]);
  out+=couple([280,232],false,'d','ticket ID','r')+couple([280,274],false,'u','entry time','l');
  out+=srep(500,226,'Until card accepted','l')+couple([500,276],true,'u','accepted flag','r');
  return sv(780,350,'Structure chart for the car park exit program',out);
}

/* ---------- Q4: main structure chart (stimulus) and the refinement of Read sensors (sample answer) ---------- */
function figWeatherMain(){
  var W=120,H=36,out=drops(290,56,88,[110,290,470],150);
  out+=sbox(230,20,W,H,'Run station')+sbox(50,150,W,H,'Read sensors')+sbox(230,150,W,H,'Log readings')+sbox(410,150,W,H,'Send alert');
  out+=couple([110,108],false,'u','temperature','l')+couple([110,132],false,'u','wind speed','l');
  out+=couple([290,108],false,'d','temperature','l')+couple([290,132],false,'d','wind speed','r');
  out+=sdec([470,108])+couple([470,132],false,'d','wind speed','r');
  return sv(580,196,'Structure chart for the school weather station program',out);
}
function figWeatherRef(){
  var W=130,H=36,out=gLine([[310,70],[310,10]])+drops(310,106,140,[150,470],200);
  out+=gLine([[470,236],[470,320]]);
  out+=sbox(245,70,W,H,'Read sensors')+sbox(85,200,W,H,'Read thermometer')+sbox(405,200,W,H,'Read anemometer')+sbox(405,320,W,H,'Take sample');
  out+=couple([310,26],false,'u','temperature','l')+couple([310,54],false,'u','wind speed','r');
  out+=couple([150,160],false,'u','temperature','l')+couple([150,186],true,'u','fault flag','l');
  out+=couple([470,172],false,'u','wind speed','r');
  out+=srep(470,262,'Until 5 samples taken','l')+couple([470,300],false,'u','sample speed','r');
  return sv(640,376,'Structure chart that refines Read sensors',out);
}

/* ---------- class diagram helper: name, attributes and methods in three compartments ---------- */
function cls(x,y,w,name,attrs,meths){
  var hh=26,ah=Math.max(attrs.length,1)*16+10,mh=meths?Math.max(meths.length,1)*16+10:0,h=hh+ah+mh,o={x:x,y:y,w:w,h:h,cx:x+w/2,s:''};
  o.s=gRect(x,y,w,h,null)+gTxt(x+w/2,y+hh/2,name,{b:true,halo:false})+'<line x1="'+x+'" y1="'+(y+hh)+'" x2="'+(x+w)+'" y2="'+(y+hh)+'"/>'+
    attrs.map(function(a,i){return gTxt(x+8,y+hh+13+i*16,a,{anchor:'start',halo:false,size:11.5})}).join('');
  if(meths){o.s+='<line x1="'+x+'" y1="'+(y+hh+ah)+'" x2="'+(x+w)+'" y2="'+(y+hh+ah)+'"/>'+meths.map(function(m,i){return gTxt(x+8,y+hh+ah+13+i*16,m,{anchor:'start',halo:false,size:11.5})}).join('')}
  return o;
}
function mult(x,y,t,a){return gTxt(x,y,t,{anchor:a||'middle',size:11.5,lh:12})}

/* ---------- Q5: class diagram for the zoo ---------- */
function figZoo(){
  var an=cls(260,20,180,'Animal',['animalID: string','species: string','yearBorn: int']),
      ke=cls(10,20,150,'Keeper',['staffNumber: string','name: string','phone: string'],['recordFeeding()']),
      en=cls(540,20,150,'Enclosure',['code: string','capacity: int']),
      ma=cls(130,200,170,'Mammal',['coatColour: string']),
      bi=cls(400,200,170,'Bird',['wingspanCm: int']);
  var out=an.s+ke.s+en.s+ma.s+bi.s;
  out+=gArr([[ma.cx,ma.y],[ma.cx,170],[an.cx-30,170],[an.cx-30,an.y+an.h]],{tri:true})+gArr([[bi.cx,bi.y],[bi.cx,170],[an.cx+30,170],[an.cx+30,an.y+an.h]],{tri:true});
  out+=gArr([[ke.x+ke.w,60],[an.x,60]])+mult(166,52,'1..1','start')+mult(254,52,'1..*','end')+gTxt(210,78,'cares for',{lh:12});
  out+=gArr([[an.x+an.w,60],[en.x,60]])+mult(446,52,'0..*','start')+mult(534,52,'1..1','end')+gTxt(490,78,'housed in',{lh:12});
  return sv(700,300,'Class diagram for the zoo',out);
}

/* ---------- Q6: class diagram for the Vehicle, Truck and Driver code ---------- */
function figVehicle(){
  var ve=cls(40,20,220,'Vehicle',['rego','make'],['describe()']),
      tr=cls(40,190,220,'Truck',['load_limit'],['check_load(kg)']),
      dr=cls(400,20,220,'Driver',['name','licence'],['assign(vehicle)']);
  var out=ve.s+tr.s+dr.s+gArr([[tr.cx,tr.y],[ve.cx,ve.y+ve.h]],{tri:true});
  out+=gArr([[dr.x,66],[ve.x+ve.w,66]])+gTxt(330,52,'drives',{lh:12})+mult(278,82,'0..1','middle')+mult(384,82,'0..1','end');
  return sv(660,290,'Class diagram for Vehicle, Truck and Driver',out);
}

/* ---------- Q7: storyboard for the museum's mobile website ---------- */
function screen(x,y,title,body){
  return gRect(x,y,200,190,null,{sw:1.6})+'<line x1="'+x+'" y1="'+(y+26)+'" x2="'+(x+200)+'" y2="'+(y+26)+'"/>'+gTxt(x+100,y+13,title,{b:true,halo:false})+body;
}
function btn(x,y,w,t){return gRect(x,y,w,24,t,{rx:3,size:11.5,fill:'#e8f1fb'})}
function figMuseum(){
  var hm=screen(30,20,'Home',gTxt(130,70,['Dinosaur','Exhibition'],{b:true,halo:false,size:14,lh:16})+btn(60,110,140,'Fossil map')+btn(60,146,140,'Tickets')),
      mp=screen(370,20,'Fossil map',gRect(386,56,168,86,null,{fill:'#f4f4f4'})+gDot(420,90,true,6)+gDot(480,112,true,6)+gDot(520,78,true,6)+btn(440,152,100,'Home')),
      tk=screen(30,270,'Tickets',gTxt(130,306,'Date',{anchor:'middle',halo:false,size:11.5})+gRect(54,314,152,22,'Select a date',{size:11,fill:'#fff'})+gTxt(130,352,'Number of tickets',{halo:false,size:11.5})+gRect(54,360,152,22,'1',{size:11})+btn(80,402,100,'Home')),
      fd=screen(370,270,'Fossil details',gRect(386,304,70,60,'Photo',{size:11,fill:'#f4f4f4'})+gTxt(505,318,['Description','of the fossil'],{halo:false,size:11,lh:13})+btn(440,402,100,'Back to map'));
  var out=hm+mp+tk+fd;
  out+=gArr([[230,70],[370,70]])+gTxt(300,58,'Fossil map',{lh:12})+gArr([[370,150],[230,150]])+gTxt(300,138,'Home',{lh:12});
  out+=gArr([[70,210],[70,270]])+gTxt(70+8,240,'Tickets',{anchor:'start',lh:12})+gArr([[190,270],[190,210]])+gTxt(190+8,240,'Home',{anchor:'start',lh:12});
  out+=gArr([[430,210],[430,270]])+gTxt(430-8,240,'Marker',{anchor:'end',lh:12})+gArr([[540,270],[540,210]])+gTxt(540+8,240,'Back to map',{anchor:'start',lh:12});
  return sv(620,480,'Storyboard of four screens for the dinosaur exhibition website',out);
}

/* ---------- decision tree helpers ---------- */
function tnode(cx,cy,w,h,lines){return gRect(cx-w/2,cy-h/2,w,h,lines,{lh:13})}
function tlink(px,py,cx,cy,h,label,side){
  var a=[px,py+h/2],b=[cx,cy-h/2],m=onLine(a,b,0.5);
  return gLine([a,b])+gTxt(m[0]+(side==='l'?-14:14),m[1],label,{lh:12,size:11.5});
}
/* ---------- Q8: decision tree for the storm repair model ---------- */
function figStorm(){
  var h=38,out=
    tlink(300,30,120,125,h,'Yes','l')+tlink(300,30,430,125,h,'No','r')+
    tlink(430,125,300,225,h,'Yes','l')+tlink(430,125,560,225,h,'No','r')+
    tlink(560,225,450,325,h,'Yes','l')+tlink(560,225,680,325,h,'No','r')+
    tnode(300,30,170,h,'Power line down?')+tnode(120,125,130,h,'Send crew')+tnode(430,125,200,h,['500 or more homes','without power?'])+
    tnode(300,225,130,h,'Send crew')+tnode(560,225,170,h,'Storm still active?')+tnode(450,325,130,h,'Wait')+tnode(680,325,130,h,'Schedule visit');
  return sv(760,370,'Decision tree for the storm repair model',out);
}
/* ---------- Q9: the bike repair tree (stimulus) and its simplified form (sample answer) ---------- */
function figBikeTree(){
  var h=42,w=136,out=
    tlink(310,32,150,125,h,'Yes','l')+tlink(310,32,470,125,h,'No','r')+
    tlink(150,125,70,225,h,'Yes','l')+tlink(150,125,235,225,h,'No','r')+tlink(470,125,390,225,h,'Yes','l')+tlink(470,125,555,225,h,'No','r')+
    tlink(235,225,165,325,h,'Yes','l')+tlink(235,225,305,325,h,'No','r')+tlink(555,225,485,325,h,'Yes','l')+tlink(555,225,625,325,h,'No','r')+
    tnode(310,32,w,h,['Bike under','2 years old?'])+tnode(150,125,w,h,['Fault covered','by warranty?'])+tnode(470,125,w,h,['Fault covered','by warranty?'])+
    tnode(70,225,100,h,['Free','repair'])+tnode(235,225,110,h,'Member?')+tnode(390,225,100,h,['Free','repair'])+tnode(555,225,110,h,'Member?')+
    tnode(165,325,100,h,['Half-price','repair'])+tnode(305,325,100,h,['Full-price','repair'])+tnode(485,325,100,h,['Half-price','repair'])+tnode(625,325,100,h,['Full-price','repair']);
  return sv(690,370,'Decision tree for bike repair requests',out);
}
function figBikeSimple(){
  var h=42,w=150,out=
    tlink(200,32,100,125,h,'Yes','l')+tlink(200,32,300,125,h,'No','r')+tlink(300,125,220,225,h,'Yes','l')+tlink(300,125,380,225,h,'No','r')+
    tnode(200,32,w,h,['Fault covered','by warranty?'])+tnode(100,125,100,h,['Free','repair'])+tnode(300,125,110,h,'Member?')+tnode(220,225,100,h,['Half-price','repair'])+tnode(380,225,100,h,['Full-price','repair']);
  return sv(480,270,'Simplified decision tree for bike repair requests',out);
}

/* ---------- flowchart helpers (standard symbols from the course specifications) ---------- */
function fT(cx,y,t){return gTerm(cx-80,y,160,30,t)}
function fTw(cx,y,t,w,h){return gTerm(cx-w/2,y,w,h||30,t)}
function fP(cx,y,t,w){w=w||170;return gRect(cx-w/2,y,w,30,t,{lh:13})}
function fIO(cx,y,t,w){w=w||190;return gPar(cx-w/2,y,w,30,t)}
function fD(cx,cy,t,w,h){return gDia(cx,cy,w||190,h||56,t)}
function fS(cx,y,t,w){w=w||190;return gSub(cx-w/2,y,w,30,t)}
function fL(x,y,t,a){return gTxt(x,y,t,{anchor:a||'start',lh:12,size:11.5})}

/* ---------- Q10: shipping cost flowchart ---------- */
function figShip(){
  var o=fT(200,10,'BEGIN ShippingCost')+fIO(200,64,'Get orderTotal, weight')+fD(200,150,'orderTotal >= 100?')+fD(200,250,'weight <= 1?',160)+fD(200,350,'weight <= 5?',160)+
    fP(460,135,'shipping = 0',150)+fP(460,235,'shipping = 8',150)+fP(460,335,'shipping = 12',150)+fP(200,425,'shipping = 20',150)+fIO(200,500,'Display shipping')+fT(200,560,'END ShippingCost');
  o+=gArr([[200,40],[200,64]])+gArr([[200,94],[200,122]])+gArr([[200,178],[200,222]])+gArr([[200,278],[200,322]])+gArr([[200,378],[200,425]])+gArr([[200,455],[200,500]])+gArr([[200,530],[200,560]]);
  o+=gArr([[295,150],[385,150]])+gArr([[280,250],[385,250]])+gArr([[280,350],[385,350]]);
  o+=gLine([[535,150],[620,150],[620,515]])+gLine([[535,250],[620,250]])+gLine([[535,350],[620,350]])+gArr([[620,515],[295,515]]);
  o+=fL(210,196,'No')+fL(210,296,'No')+fL(210,396,'No')+fL(318,143,'Yes','middle')+fL(318,243,'Yes','middle')+fL(318,343,'Yes','middle');
  return sv(660,610,'Flowchart for the shipping cost algorithm',o);
}

/* ---------- Q11: flowchart for FindTitles (pre-test loop with a selection inside) ---------- */
function figTitles(){
  var o=fT(250,10,'BEGIN FindTitles')+fIO(250,60,'Get keyword')+fP(250,110,'count = 0')+fP(250,160,'index = 1')+fD(250,250,['index <= 50','AND count < 5?'],220,64)+
    fD(250,350,'title[index] CONTAINS keyword?',220,64)+fIO(250,420,'Display title[index]',210)+fP(250,468,'count = count + 1')+fP(250,540,'index = index + 1')+
    fD(590,320,'count = 0?',140,56)+fIO(590,400,'Display "No results"',190)+fT(590,470,'END FindTitles');
  o+=gArr([[250,40],[250,60]])+gArr([[250,90],[250,110]])+gArr([[250,140],[250,160]])+gArr([[250,190],[250,218]])+gArr([[250,282],[250,318]])+gArr([[250,382],[250,420]])+gArr([[250,450],[250,468]])+gArr([[250,498],[250,540]]);
  /* inner No: right of the selection, down to index + 1 */
  o+=gLine([[360,350],[430,350],[430,555]])+gArr([[430,555],[335,555]]);
  /* back to the loop test */
  o+=gLine([[165,555],[60,555],[60,250]])+gArr([[60,250],[140,250]]);
  /* loop exit */
  o+=gLine([[360,250],[590,250]])+gArr([[590,250],[590,292]]);
  o+=gArr([[590,348],[590,400]])+gArr([[590,430],[590,470]]);
  o+=gLine([[660,320],[720,320],[720,485]])+gArr([[720,485],[670,485]]);
  o+=fL(262,308,'True')+fL(262,392,'Yes')+fL(374,342,'No')+fL(368,243,'False')+fL(600,372,'Yes')+fL(668,312,'No');
  return sv(760,590,'Flowchart for the FindTitles algorithm',o);
}

/* ---------- Q12: flowchart for SetPin (post-test loop) ---------- */
function figPin(){
  var o=fT(230,10,'BEGIN SetPin')+fIO(230,64,'Get newPin')+fIO(230,114,'Get confirmPin')+fD(230,200,'newPin <> confirmPin?',220,60)+fIO(520,185,'Display "PINs do not match"',230)+
    fD(230,330,'newPin = confirmPin?',220,60)+fIO(230,410,'Display "PIN saved"')+fT(230,470,'END SetPin');
  o+=gArr([[230,40],[230,64]])+gArr([[230,94],[230,114]])+gArr([[230,144],[230,170]])+gLine([[230,230],[230,265]]);
  o+=gArr([[340,200],[405,200]])+gLine([[520,215],[520,265]])+gLine([[520,265],[230,265]]);
  o+=gArr([[230,265],[230,299]]);
  o+=gArr([[230,360],[230,410]])+gArr([[230,440],[230,470]]);
  o+=gLine([[120,330],[40,330],[40,79]])+gArr([[40,79],[135,79]]);
  o+=fL(240,252,'No')+fL(366,193,'Yes','middle')+fL(240,390,'True')+fL(92,322,'False','middle');
  return sv(660,520,'Flowchart for the SetPin algorithm',o);
}

/* ---------- Q13: flowcharts for WeeklyEnergy (FOR / NEXT with a subroutine) and AddEnergy ---------- */
function figEnergy(){
  var o=fT(190,10,'BEGIN WeeklyEnergy')+fP(190,60,'total = 0')+fP(190,110,'day = 1')+fD(190,200,'day > 7?',170,56)+fIO(190,260,'Get kWh')+fS(190,310,'AddEnergy (total, kWh)',210)+fP(190,360,'day = day + 1')+
    fIO(420,300,'Display total',170)+fT(420,360,'END WeeklyEnergy')+
    fTw(650,10,['BEGIN AddEnergy','(sum, amount)'],170,40)+fP(650,90,'sum = sum + amount',170)+fTw(650,150,['END AddEnergy','(sum, amount)'],170,40);
  o+=gArr([[190,40],[190,60]])+gArr([[190,90],[190,110]])+gArr([[190,140],[190,172]])+gArr([[190,228],[190,260]])+gArr([[190,290],[190,310]])+gArr([[190,340],[190,360]]);
  o+=gLine([[105,375],[40,375],[40,200]])+gArr([[40,200],[105,200]]);
  o+=gLine([[275,200],[420,200]])+gArr([[420,200],[420,300]])+gArr([[420,330],[420,360]]);
  o+=gArr([[650,50],[650,90]])+gArr([[650,120],[650,150]]);
  o+=fL(200,246,'No')+fL(300,193,'Yes','middle');
  return sv(760,420,'Flowcharts for the WeeklyEnergy algorithm and the AddEnergy subroutine',o);
}

/* ---------- Q14: Gantt chart ---------- */
function figGantt(){
  var X0=250,CW=40,Y0=50,RH=34,BH=18,out='',days=['M','T','W','T','F'],wk=['Week 1: from Mon 2 Mar','Week 2: from Mon 9 Mar','Week 3: from Mon 16 Mar'],i,w;
  var tasks=[['1','Gather requirements',1,3],['2','Design screens',4,7],['3','Build database',4,6],['4','Code the website',8,12],['5','Test the website',13,14],['6','Train club members',13,14]];
  function bx(d){return X0+(d-1)*CW}
  function ry(r){return Y0+r*RH}
  out+=gRect(0,0,X0,Y0,null,{fill:'#1c2f5e'})+gTxt(14,Y0/2,'ID   Task name',{anchor:'start',halo:false,b:true}).replace('<text','<text fill="#fff"');
  for(w=0;w<3;w++){out+=gRect(X0+w*5*CW,0,5*CW,24,null,{fill:'#1c2f5e'})+gTxt(X0+w*5*CW+100,12,wk[w],{halo:false,size:11}).replace('<text','<text fill="#fff"')}
  for(i=0;i<15;i++){out+=gRect(X0+i*CW,24,CW,26,days[i%5],{fill:'#e9eef8',size:11.5})}
  for(i=0;i<7;i++){out+=gRect(0,ry(i),X0+15*CW,RH,null,{fill:i%2?'#fff':'#f7f7f7'})}
  for(i=0;i<=15;i++){out+='<line x1="'+(X0+i*CW)+'" y1="50" x2="'+(X0+i*CW)+'" y2="'+ry(7)+'" stroke="#bbb" stroke-width="0.6"/>'}
  tasks.forEach(function(t,r){
    out+=gTxt(14,ry(r)+RH/2,t[0]+'   '+t[1],{anchor:'start',halo:false})+gRect(bx(t[2]),ry(r)+(RH-BH)/2,(t[3]-t[2]+1)*CW,BH,null,{fill:'#4a6fb5'});
  });
  out+=gTxt(14,ry(6)+RH/2,'7   Launch milestone (Thu 19 Mar)',{anchor:'start',halo:false})+gDia(bx(15)+14,ry(6)+RH/2,22,22,null,{fill:'#fff'});
  /* a dependency leaves below the end of the earlier bar and enters the left edge of the later bar */
  function dep(a,b){var ex=bx(tasks[a-1][3]+1),sx=bx(tasks[b-1][2]),y1=ry(a-1)+(RH+BH)/2,y2=ry(b-1)+RH/2;return gArr([[ex-12,y1],[ex-12,y2],[sx,y2]])}
  out+=dep(1,2)+dep(1,3)+dep(2,4)+dep(3,4)+dep(4,5)+dep(4,6);
  out+=gLine([[bx(15),ry(4)+RH/2],[bx(15)+14,ry(4)+RH/2]])+gLine([[bx(15),ry(5)+RH/2],[bx(15)+14,ry(5)+RH/2]])+gArr([[bx(15)+14,ry(4)+RH/2],[bx(15)+14,ry(6)+RH/2-11]]);
  return sv(860,ry(7)+2,'Gantt chart for the raffle ticket website project',out);
}

/* ---------- Q15: neural network diagram ---------- */
function figNet(){
  var inp=[[110,130,'Temperature'],[110,250,'Humidity']],hid=[[330,70],[330,190],[330,310]],out2=[560,190],o='',i,j;
  var strong={'0-0':1};
  inp.forEach(function(a,ai){hid.forEach(function(h,hi){var s=strong[ai+'-'+hi];o+=gLine([[a[0]+28,a[1]+(h[1]-a[1])*0.09],[h[0]-30,h[1]-(h[1]-a[1])*0.09]],{sw:s?5:1.2})})});
  hid.forEach(function(h,hi){var s=hi===1;o+=gLine([[h[0]+28,h[1]+(out2[1]-h[1])*0.09],[out2[0]-30,out2[1]-(out2[1]-h[1])*0.09]],{sw:s?5:1.2})});
  inp.forEach(function(a){o+=gEll(a[0],a[1],28,28,null)+gTxt(a[0]-40,a[1],a[2],{anchor:'end',halo:false})});
  hid.forEach(function(h,hi){o+=gEll(h[0],h[1],28,28,'H'+(hi+1),{b:true})});
  o+=gEll(out2[0],out2[1],28,28,null)+gTxt(out2[0]+40,out2[1],'Open vents',{anchor:'start',halo:false});
  o+=gTxt(110,24,'Input layer',{b:true,halo:false})+gTxt(330,24,'Hidden layer',{b:true,halo:false})+gTxt(560,24,'Output layer',{b:true,halo:false});
  return sv(700,370,'Neural network for opening the greenhouse vents',o);
}

/* ---------- questions ---------- */
/* dr() plus the drawn sample answer shown in review, in the retry page and in the marking guide */
function drf(q,m,model,crit,tools,fig){var it=dr(q,m,model,crit,tools);it.fig=figWrap(fig);return it}
var SYM='uses the standard symbols with arrowheads (terminators, process rectangles, decision diamonds and input/output parallelograms; a parallelogram may be drawn with the line tool, and a rectangle labelled Get or Display is accepted)';

/* Question 1: Level 0 data flow diagram */
qs.push(Q(SEP,'A regional food bank is developing a system to manage household food parcel requests.'+bl([
 'Households submit a request form online with their name, address and number of people.',
 'The household receives a text message when its parcel is ready for collection.',
 'Volunteers receive a printed packing list each morning.',
 'The manager receives a stock report each Friday.']),[
 drf('Create a Level 0 Data Flow Diagram for the parcel request process.',2,
  'One process (a circle) in the centre labelled Parcel request system. Three external entities (rectangles): Household, Volunteer and Manager. No data stores and no internal processes. Four labelled, curved arrows: Household to the process (request form with name, address and number of people); the process to Household (collection text message); the process to Volunteer (packing list); the process to Manager (stock report).',
  ['1 mark: a single central process drawn as a circle with the three external entities drawn as rectangles, and no data stores or internal processes.',
   '1 mark: four labelled arrows in the correct directions: the request form into the process, and the text message, packing list and stock report out of it.'],'dfd',figL0())],{two:true}));

/* Question 2: data flow diagram */
qs.push(Q(SEP,'A wildlife carer network is developing a system to manage rescue calls.'+bl([
 'A <b>Caller</b> reports an injured animal. The <b>Log call</b> process stores a rescue record in the <b>Rescues</b> data store.',
 'The <b>Dispatch carer</b> process reads the rescue record from Rescues and the available carers from the <b>Carers</b> data store. It sends a job request to a <b>Carer</b>. The Carer sends back an acceptance, and Dispatch carer stores the carer assigned in Rescues.',
 'After treating the animal, the Carer sends an outcome report to the <b>Close rescue</b> process. Close rescue updates the rescue record in Rescues and sends an outcome message to the Caller.']),[
 drf('Create a data flow diagram for the wildlife rescue system. Show the processes, external entities, data stores and data flows.',4,
  'Three processes drawn as circles: 1 Log call, 2 Dispatch carer, 3 Close rescue. Two external entities (rectangles): Caller and Carer. Two data stores (rectangles): Rescues and Carers. Ten labelled, curved arrows: Caller to Log call (animal and location details); Log call to Rescues (rescue record); Rescues to Dispatch carer (rescue record); Carers to Dispatch carer (available carers); Dispatch carer to Carer (job request); Carer to Dispatch carer (acceptance); Dispatch carer to Rescues (carer assigned); Carer to Close rescue (outcome report); Close rescue to Rescues (updated rescue record); Close rescue to Caller (outcome message).',
  ['1 mark: the three processes drawn as circles with the correct names.',
   '1 mark: the two external entities and the two data stores drawn as distinct rectangles with the correct names.',
   '1 mark: data flows join the correct components in the correct directions, and no flow runs directly between two data stores or between an external entity and a data store.',
   '1 mark: every data flow is a labelled arrow showing the data it carries, covering the ten flows described.'],'dfd',figDFD())],{two:true}));

/* Question 3: structure chart */
qs.push(Q(SEP,'A car park uses an automatic exit program.'+bl([
 'The main module <b>Process exit</b> calls <b>Read ticket</b>, <b>Calculate fee</b>, <b>Take payment</b> and <b>Open gate</b> in that order.',
 '<b>Read ticket</b> returns the ticket ID.',
 '<b>Calculate fee</b> receives the ticket ID and returns the fee. It calls <b>Find entry time</b>, which receives the ticket ID and returns the entry time.',
 '<b>Take payment</b> receives the fee. It repeatedly calls <b>Read card</b> until the card is accepted. Read card returns an accepted flag. Take payment returns a paid flag.',
 '<b>Open gate</b> is called only when the paid flag is true.']),[
 drf('Create a structure chart for the car park exit program. Show the data and control parameters passed between the modules.',4,
  'Process exit at the top with Read ticket, Calculate fee, Take payment and Open gate beneath it from left to right. Find entry time sits under Calculate fee and Read card sits under Take payment. A curved repetition arrow joins Take payment to Read card (until the card is accepted). A small decision diamond is on the line to Open gate. Data couples (open circles with an arrow showing direction): ticket ID up from Read ticket and down into Calculate fee; fee up from Calculate fee and down into Take payment; ticket ID down into Find entry time; entry time up from Find entry time. Control couples (filled circles): accepted flag up from Read card; paid flag up from Take payment.',
  ['1 mark: the seven modules in a correct hierarchy, with the four main modules in order from left to right.',
   '1 mark: a curved repetition arrow for Read card and a decision diamond for Open gate.',
   '1 mark: data parameters (ticket ID, fee, entry time) shown with open circles and arrows in the correct directions.',
   '1 mark: control parameters (accepted flag, paid flag) shown with filled circles and arrows in the correct directions.'],'structure',figCarPark())],{two:true}));

/* Question 4: refinement of a structure chart */
qs.push(Q(SEP,'A school weather station program is represented by this structure chart.'+fig('Weather station structure chart',figWeatherMain())+
 '<p>The module <b>Read sensors</b> is refined as follows.</p>'+bl([
 '<b>Read sensors</b> calls <b>Read thermometer</b> and <b>Read anemometer</b>, and returns the temperature and the wind speed.',
 '<b>Read thermometer</b> returns the temperature and a fault flag.',
 '<b>Read anemometer</b> repeatedly calls <b>Take sample</b> until 5 samples have been taken, then returns the wind speed.',
 '<b>Take sample</b> returns the sample speed.']),[
 drf('Create a structure chart that shows the refinement of the Read sensors module.',3,
  'Read sensors at the top, using the same name as in the main chart, returning the temperature and the wind speed (data couples). Read thermometer and Read anemometer beneath it. Take sample beneath Read anemometer, joined by a curved repetition arrow (until 5 samples taken). Parameters: temperature (data, up) and fault flag (control, filled circle, up) from Read thermometer; sample speed (data, up) from Take sample; wind speed (data, up) from Read anemometer.',
  ['1 mark: Read sensors at the top with Read thermometer and Read anemometer beneath it, and Take sample beneath Read anemometer.',
   '1 mark: a curved repetition arrow for Take sample.',
   '1 mark: parameters shown with open circles for data (temperature, sample speed, wind speed) and a filled circle for the fault flag, with arrows in the correct directions.'],'structure',figWeatherRef())],{two:true}));

/* Question 5: class diagram */
qs.push(Q(SEP,'A zoo wants a class diagram that models the relationship between its animals and keepers.'+bl([
 'Each animal has an animal ID (eg ZB204), a species and a year of birth.',
 'Animals are either mammals or birds. A mammal has a coat colour. A bird has a wingspan in centimetres.',
 'Each animal is cared for by one keeper. A keeper cares for at least one animal.',
 'A keeper has a staff number, a name and a phone number, and can record a feeding.',
 'Each animal is housed in one enclosure. An enclosure holds any number of animals and has a code and a capacity.']),[
 drf('Create a class diagram for the zoo.',4,
  'Five classes. Animal (animalID, species, yearBorn). Mammal (coatColour) and Bird (wingspanCm), each shown inheriting from Animal and not repeating animalID, species or yearBorn. Keeper (staffNumber, name, phone; recordFeeding()). Enclosure (code, capacity). Association from Keeper to Animal: 1..1 at the Keeper end and 1..* at the Animal end. Association from Animal to Enclosure: 0..* at the Animal end and 1..1 at the Enclosure end.',
  ['1 mark: classes for Animal, Mammal, Bird, Keeper and Enclosure with appropriate attributes in the correct classes, and the recordFeeding method in Keeper.',
   '1 mark: Mammal and Bird shown inheriting from Animal, without repeating Animal\'s attributes.',
   '1 mark: associations between Keeper and Animal and between Animal and Enclosure.',
   '1 mark: correct multiplicities: one keeper to one or more animals, and one enclosure to zero or more animals.'],'class',figZoo())],{two:true}));

/* Question 6: class diagram from code */
qs.push(Q(SEP,'A logistics company uses the following Python code in its fleet program.'+code(`class Vehicle:
    def __init__(self, rego, make):
        self.rego = rego
        self.make = make

    def describe(self):
        return self.make + " " + self.rego

class Truck(Vehicle):
    def __init__(self, rego, make, load_limit):
        super().__init__(rego, make)
        self.load_limit = load_limit

    def check_load(self, kg):
        return kg <= self.load_limit

class Driver:
    def __init__(self, name, licence):
        self.name = name
        self.licence = licence
        self.vehicle = None

    def assign(self, vehicle):
        self.vehicle = vehicle`)+'<p>A driver is assigned to at most one vehicle at a time, and a vehicle has at most one driver.</p>',[
 drf('Create a class diagram for the code. Show the attributes, methods, inheritance and the relationship between the classes with its multiplicity.',3,
  'Three classes. Vehicle (rego, make; describe()). Truck (load_limit; check_load(kg)), shown inheriting from Vehicle and not repeating rego or make. Driver (name, licence; assign(vehicle)). One association between Driver and Vehicle with 0..1 at each end.',
  ['1 mark: Vehicle, Truck and Driver classes with the correct attributes, and Truck does not repeat rego or make.',
   '1 mark: the methods placed in the correct classes (describe, check_load and assign).',
   '1 mark: Truck shown inheriting from Vehicle, and one association between Driver and Vehicle with 0..1 at each end.'],'class',figVehicle())],{two:true}));

/* Question 7: storyboard */
qs.push(Q(PW,'A museum is creating a mobile website to promote its new dinosaur exhibition. The website has four screens.'+bl([
 '<b>Home</b>: the exhibition name, a "Fossil map" button and a "Tickets" button.',
 '<b>Fossil map</b>: a map of the exhibition hall with three fossil markers, and a "Home" button.',
 '<b>Fossil details</b>: opened by selecting a marker on the map. It shows a photo, a description and a "Back to map" button.',
 '<b>Tickets</b>: a date selector, a box for the number of tickets and a "Home" button.']),[
 drf('Create a storyboard for the website that shows the four screens and the links between them.',3,
  'Four labelled screen frames: Home, Fossil map, Fossil details and Tickets. Each frame sketches its main elements: the exhibition name and two buttons on Home; the hall map with three markers and a Home button on Fossil map; a photo, a description and a Back to map button on Fossil details; a date selector, a ticket number box and a Home button on Tickets. Labelled arrows show the links: Home to Fossil map (Fossil map button); Home to Tickets (Tickets button); Fossil map to Home (Home button); Fossil map to Fossil details (selecting a marker); Fossil details to Fossil map (Back to map button); Tickets to Home (Home button).',
  ['1 mark: four labelled screens, each showing its main interface elements (buttons, map markers, photo and description, date selector and ticket box).',
   '1 mark: arrows in the correct directions for all six links, including the return links to Home and to Fossil map.',
   '1 mark: each link labelled with the button or action that causes it.'],'storyboard',figMuseum())],{two:true}));

/* Question 8: decision tree from rules */
qs.push(Q(SA,'A power company has trained a machine learning model to decide what to do after a storm.'+bl([
 'If a power line is down, a repair crew is sent.',
 'If no power line is down, a crew is sent when 500 or more homes are without power.',
 'Otherwise, the company waits if the storm is still active and schedules a visit if it is not.']),[
 drf('Draw a decision tree for the model.',3,
  'Root decision "Power line down?" with Yes leading to the outcome Send crew. No leads to the decision "500 or more homes without power?", with Yes leading to Send crew. No leads to the decision "Storm still active?", with Yes leading to Wait and No leading to Schedule visit. Every branch is labelled. (An equivalent tree, such as the left-to-right format in the course specifications, is acceptable.)',
  ['1 mark: the root test "Power line down?" with Yes leading to Send crew.',
   '1 mark: a test for 500 or more homes without power on the No branch, with Yes leading to Send crew.',
   '1 mark: a test for whether the storm is still active, with Yes leading to Wait and No leading to Schedule visit, and every branch labelled.'],'tree',figStorm())],{two:true}));

/* Question 9: read and simplify a decision tree */
qs.push(Q(SEP,'A bike shop uses this decision tree to decide how each repair request is handled.'+fig('Repair request decision tree',figBikeTree()),[
 P('(a)',mt('Using the decision tree, determine the outcome of each of the following situations. (1 mark)',['Situation','Free repair','Half-price repair','Full-price repair'],[
  ['Bike 3 years old. Fault covered by warranty.',0],
  ['Bike 1 year old. Fault not covered by warranty. Customer is a member.',1],
  ['Bike 4 years old. Fault not covered by warranty. Customer is not a member.',2]],1,'Follow each branch from the top. A fault covered by warranty is a free repair, a member pays half price and anyone else pays full price.')),
 P('(b)',drf('The decision tree can be simplified without compromising its logic.<br>Redraw the decision tree to reduce the number of branches. (3 marks)',3,
  'The age of the bike makes no difference because both branches lead to identical sub-trees, so the first decision is removed. The simplified tree has the root "Fault covered by warranty?" with Yes leading to Free repair and No leading to the decision "Member?". Member? has Yes leading to Half-price repair and No leading to Full-price repair. All branches are labelled Yes or No.',
  ['1 mark: recognises that the test on the age of the bike makes no difference to any outcome and removes it, leaving a single copy of the sub-tree.',
   '1 mark: root "Fault covered by warranty?" with Yes leading to Free repair and No leading to a Member? test.',
   '1 mark: "Member?" with Yes leading to Half-price repair and No leading to Full-price repair, with every branch labelled.'],'tree',figBikeSimple()))],{two:true}));

/* Question 10: flowchart, nested selection */
qs.push(Q(PW,'An online shop calculates the shipping cost for each order.'+bl([
 'The program reads the order total and the weight of the parcel in kilograms.',
 'An order total of $100 or more has free shipping.',
 'Otherwise, a parcel weighing up to 1 kg costs $8, a parcel weighing more than 1 kg and up to 5 kg costs $12, and a heavier parcel costs $20.',
 'The program displays the shipping cost.']),[
 drf('Draw a flowchart for the shipping algorithm. Use the standard flowchart symbols.',3,
  'A BEGIN terminator, then an input of orderTotal and weight. Decision "orderTotal >= 100?": Yes leads to the process shipping = 0. No leads to the decision "weight <= 1?": Yes leads to shipping = 8. No leads to the decision "weight <= 5?": Yes leads to shipping = 12, No leads to shipping = 20. All four processes join before an output that displays the shipping cost, then an END terminator. Every arrow from a decision is labelled Yes or No.',
  ['1 mark: BEGIN and END terminators, an input of the order total and weight, and a display of the shipping cost, in a flowchart that '+SYM+'.',
   '1 mark: a decision on orderTotal >= 100 (or equivalent) with labelled branches, giving shipping of 0 on the correct path.',
   '1 mark: nested decisions on the weight giving $8, $12 and $20 on the correct paths, with every path joining before the display.'],'flowchart',figShip())],{two:true}));

/* Question 11: flowchart, pre-test loop from pseudocode */
qs.push(Q(PW,'A library website suggests up to five book titles that contain a keyword. The algorithm is shown in pseudocode.'+code(`BEGIN FindTitles
    Get keyword
    count = 0
    index = 1
    WHILE index <= 50 AND count < 5
        IF title[index] CONTAINS keyword THEN
            Display title[index]
            count = count + 1
        ENDIF
        index = index + 1
    ENDWHILE
    IF count = 0 THEN
        Display "No results"
    ENDIF
END FindTitles`),[
 drf('Draw a flowchart for the FindTitles algorithm.',4,
  'BEGIN FindTitles terminator, input Get keyword, processes count = 0 and index = 1. A pre-test loop decision "index <= 50 AND count < 5?". True leads to the decision "title[index] CONTAINS keyword?". Yes leads to the output Display title[index] and the process count = count + 1, then to the process index = index + 1. No goes straight to index = index + 1. Index = index + 1 returns to the loop decision. False from the loop decision leads to the decision "count = 0?": Yes leads to the output Display "No results" then END FindTitles, and No leads straight to END FindTitles.',
  ['1 mark: BEGIN and END terminators, the input of the keyword, and count = 0 then index = 1 before the loop, in a flowchart that '+SYM+'.',
   '1 mark: a pre-test loop whose decision tests index <= 50 AND count < 5, with the body returning to the decision and False leaving the loop.',
   '1 mark: a selection inside the loop that displays the title and adds 1 to count only when the title contains the keyword, with index increased on every pass.',
   '1 mark: a final selection on count = 0 that displays "No results", with both paths reaching END.'],'flowchart',figTitles())],{two:true}));

/* Question 12: flowchart, post-test loop from pseudocode */
qs.push(Q(SSA,'A banking app asks a customer to enter a new four-digit PIN twice. The algorithm is shown in pseudocode.'+code(`BEGIN SetPin
    REPEAT
        Get newPin
        Get confirmPin
        IF newPin <> confirmPin THEN
            Display "PINs do not match"
        ENDIF
    UNTIL newPin = confirmPin
    Display "PIN saved"
END SetPin`),[
 drf('Draw a flowchart for the SetPin algorithm.',3,
  'BEGIN SetPin terminator, then the input Get newPin and the input Get confirmPin inside the loop body. A decision "newPin <> confirmPin?": Yes leads to the output Display "PINs do not match", and both paths then join. A post-test decision "newPin = confirmPin?" comes after the body: False returns to Get newPin, and True leads to the output Display "PIN saved" and the END SetPin terminator.',
  ['1 mark: BEGIN and END terminators and the two inputs placed inside the loop body, in a flowchart that '+SYM+'.',
   '1 mark: a selection that displays "PINs do not match" only when newPin and confirmPin differ, with both paths joining.',
   '1 mark: a post-test loop: the test newPin = confirmPin comes after the body, False returns to Get newPin and True leads to Display "PIN saved" then END.'],'flowchart',figPin())],{two:true}));

/* Question 13: flowcharts, FOR / NEXT with a subroutine */
qs.push(Q(SA,'A smart power board records the energy used by a connected device on each day of the week. The algorithm and its subroutine are shown in pseudocode.'+code(`BEGIN WeeklyEnergy
    total = 0
    FOR day = 1 TO 7
        Get kWh
        AddEnergy (total, kWh)
    NEXT day
    Display total
END WeeklyEnergy

BEGIN AddEnergy (sum, amount)
    sum = sum + amount
END AddEnergy (sum, amount)`),[
 drf('Draw a flowchart for the algorithm WeeklyEnergy and a flowchart for the subroutine AddEnergy.',4,
  'Flowchart 1: BEGIN WeeklyEnergy, total = 0, day = 1, then a counted-loop decision "day > 7?". No leads to the input Get kWh, a subprogram symbol (rectangle with two vertical bars) AddEnergy (total, kWh), and the process day = day + 1, which returns to the decision. Yes leaves the loop to the output Display total and END WeeklyEnergy. Flowchart 2: BEGIN AddEnergy (sum, amount), the process sum = sum + amount, END AddEnergy (sum, amount).',
  ['1 mark: WeeklyEnergy begins with total = 0 and day = 1 between BEGIN and the loop.',
   '1 mark: a counted loop with a test on day (for example day > 7), an increase of day on each pass, and a return to the test.',
   '1 mark: inside the loop, an input of kWh and a call to AddEnergy drawn with the subprogram symbol (a rectangle with two vertical lines) with its parameters, then Display total after the loop and END.',
   '1 mark: a separate flowchart for AddEnergy with BEGIN AddEnergy (sum, amount), the process sum = sum + amount and END AddEnergy (sum, amount).'],'flowchart',figEnergy())],{two:true}));

/* Question 14: Gantt chart */
qs.push(Q(SEP,'A sports club is developing a website to sell raffle tickets. The project starts on Monday 2 March. Durations are in working days (Monday to Friday).'+
 tbl(['ID','Task','Duration','Starts after'],[['1','Gather requirements','3 days','Project start'],['2','Design screens','4 days','Task 1'],['3','Build database','3 days','Task 1'],['4','Code the website','5 days','Tasks 2 and 3'],['5','Test the website','2 days','Task 4'],['6','Train club members','2 days','Task 4']])+
 '<p>The project is complete, and the website launches, when Tasks 5 and 6 are finished.</p>',[
 drf('Create a Gantt chart for the raffle ticket website project. Show the time scale, the dependencies and the launch milestone.',4,
  'A chart with a time scale in working days or dates (three weeks from Monday 2 March, Monday to Friday). One row for each task with a clearly named bar: 1 Gather requirements on days 1 to 3; 2 Design screens on days 4 to 7; 3 Build database on days 4 to 6; 4 Code the website on days 8 to 12; 5 Test the website on days 13 to 14; 6 Train club members on days 13 to 14. Arrows show the dependencies: 1 to 2, 1 to 3, 2 to 4, 3 to 4, 4 to 5 and 4 to 6. A diamond marks the Launch milestone at the end of day 14 (Thursday 19 March).',
  ['1 mark: six rows with self-explanatory task names and bars of the correct length for each duration.',
   '1 mark: bars start on the correct days: Tasks 2 and 3 start after Task 1, Task 4 starts only after both Task 2 and Task 3 finish, and Tasks 5 and 6 start after Task 4.',
   '1 mark: dependencies clearly shown (for example with arrows), with Tasks 5 and 6 running at the same time.',
   '1 mark: a clear time scale marked with days or dates, and the Launch milestone shown as a diamond at the end of the last tasks.'],'gantt',figGantt())],{two:true}));

/* Question 15: neural network diagram */
qs.push(Q(SA,'A greenhouse uses a trained neural network to decide whether to open the roof vents.'+bl([
 'The network has two input nodes: Temperature and Humidity.',
 'There is one hidden layer of three nodes, H1, H2 and H3. Every input node is connected to every hidden node.',
 'There is one output node, Open vents. Every hidden node is connected to the output node.',
 'After training, the connection from Temperature to H1 and the connection from H2 to Open vents have the strongest weightings.']),[
 drf('Draw a diagram of the neural network. Show the strongest weightings.',3,
  'Three columns of nodes (circles): input layer with Temperature and Humidity; hidden layer with H1, H2 and H3; output layer with Open vents. Lines or arrows run left to right from each input node to each hidden node (six connections) and from each hidden node to the output node (three connections). The Temperature to H1 connection and the H2 to Open vents connection are drawn thicker than the other seven connections (or labelled with the largest weightings).',
  ['1 mark: the three layers of nodes correctly labelled: two input nodes (Temperature, Humidity), three hidden nodes, and one output node (Open vents).',
   '1 mark: all nine connections drawn, each input node joined to each hidden node and each hidden node joined to the output node, running from input to output.',
   '1 mark: the Temperature to H1 and H2 to Open vents connections drawn thicker than the others (or clearly labelled as the strongest weightings).'],'neural',figNet())],{two:true}));

BANKS.push({id:'19',name:'Diagram Practice Paper',sub:'15 questions · 51 marks · Drawing every diagram in the course specifications',mini:true,questions:15,marks:51,duration:90*60,qs:qs});
})();
