/* ---------- drawing tool library: the shapes the HSC exam drawing tool offers, plus the other symbols in the course specifications ----------
   XDLIB is passed to Excalidraw as initialData.libraryItems by xdMount (xd.js). Every shape is built only from
   rectangles, ellipses, diamonds, lines and arrows, the primitives the AI marker reads (docs/AI_MARKING.md), and has no text:
   students label shapes themselves, as in the exam. Each element carries customData.hsc (the symbol name), which
   xdText uses to describe the student's drawing. Excalidraw keeps customData when a shape is dragged onto the canvas.

   Order matters: the first 16 items are the 2025 HSC exam library, in the order the exam shows them (four per row).
   Sources: the exam drawing tool, and the symbol tables in the Software Engineering Course Specifications
   (data flow diagrams, structure charts, flowcharts, class diagrams, relational databases, Gantt charts,
   storyboards, neural networks, MLOps and wiring diagrams for mechatronic systems). */
var XDLIB=(function(){
  var items=[],n=0;
  function base(type,name,x,y,w,h,o){
    o=o||{};
    var e={type:type,x:x,y:y,width:w,height:h,angle:0,strokeColor:'#1e1e1e',backgroundColor:o.fill||'transparent',fillStyle:'solid',
      strokeWidth:o.sw||2,strokeStyle:o.dash?'dashed':'solid',roughness:0,opacity:100,roundness:o.round||null,seed:1000+n,version:1,versionNonce:2000+n,
      isDeleted:false,boundElements:null,link:null,locked:false,customData:{hsc:name}};
    return e;
  }
  /* a polyline (or a closed polygon when the last point repeats the first) from absolute points */
  function poly(name,pts,o){
    o=o||{};var x0=pts[0][0],y0=pts[0][1],xs=pts.map(function(p){return p[0]}),ys=pts.map(function(p){return p[1]});
    var e=base(o.arrow?'arrow':'line',name,x0,y0,Math.max.apply(null,xs)-Math.min.apply(null,xs),Math.max.apply(null,ys)-Math.min.apply(null,ys),o);
    e.points=pts.map(function(p){return [p[0]-x0,p[1]-y0]});
    e.lastCommittedPoint=null;e.startBinding=null;e.endBinding=null;
    e.startArrowhead=o.start||null;e.endArrowhead=o.arrow?(o.end===undefined?'arrow':o.end):null;
    if(o.curve)e.roundness={type:2};
    return e;
  }
  function rect(name,x,y,w,h,o){return base('rectangle',name,x,y,w,h,o)}
  function ell(name,x,y,w,h,o){return base('ellipse',name,x,y,w,h,o)}
  function dia(name,x,y,w,h,o){return base('diamond',name,x,y,w,h,o)}
  /* add one library item; several elements are grouped so they move as one shape */
  function add(name,els){
    n++;var g='hsclib-g'+n;
    els.forEach(function(e,i){e.id='hsclib-'+n+'-'+i;e.groupIds=els.length>1?[g]:[];e.customData={hsc:name}});
    items.push({id:'hsclib-'+n,status:'published',name:name,created:1761400000000-n,elements:els});
  }
  var N='Data couple',C='Control couple';

  /* ===== 1 to 16: the HSC exam library, row by row ===== */
  /* data flow diagram */
  add('DFD process (circle)',[ell('',0,0,100,100)]);
  add('DFD data store (open-ended box)',[poly('',[[120,0],[0,0],[0,50],[120,50]])]);
  add('DFD external entity (square)',[rect('',0,0,100,100)]);
  add('DFD data flow (curved labelled arrow)',[poly('',[[0,10],[55,36],[112,4]],{arrow:true,curve:true})]);
  /* structure chart couples and flowchart subprogram and input/output */
  add(N,[ell('',0,26,16,16),poly('',[[18,22],[36,2]],{arrow:true})]);
  add(C,[ell('',0,26,16,16,{fill:'#1e1e1e'}),poly('',[[18,22],[36,2]],{arrow:true})]);
  add('Flowchart subprogram',[rect('',0,0,140,60),poly('',[[12,0],[12,60]]),poly('',[[128,0],[128,60]])]);
  add('Flowchart input or output (parallelogram)',[poly('',[[24,0],[150,0],[126,60],[0,60],[24,0]])]);
  /* flowchart decision, terminator, process; structure chart decision */
  add('Flowchart decision (diamond)',[dia('',0,0,130,80)]);
  add('Flowchart terminator (rounded rectangle)',[rect('',0,0,140,50,{round:{type:3}})]);
  add('Flowchart process or structure chart module (rectangle)',[rect('',0,0,140,60)]);
  add('Structure chart decision (diamond where the lines meet)',[dia('',52,0,16,16),poly('',[[53,9],[0,44]]),poly('',[[67,9],[120,44]])]);
  /* structure chart repetition, relational database many, table and class */
  add('Structure chart repetition (curved arrow)',[poly('',[[0,8],[22,40],[48,10]],{arrow:true,curve:true})]);
  add('Relational database many (infinity) end',[ell('',0,0,16,11),ell('',16,0,16,11)]);
  add('Relational database table (name and fields)',[rect('',0,0,170,120),poly('',[[0,30],[170,30]])]);
  add('Class (name, attributes, methods)',[rect('',0,0,170,130),poly('',[[0,30],[170,30]]),poly('',[[0,85],[170,85]])]);

  /* ===== extras from the course specifications ===== */
  /* class diagram connectors */
  add('Class inheritance arrow (solid arrowhead)',[poly('',[[0,0],[140,0]],{arrow:true,end:'triangle'})]);
  add('Class relationship arrow (open arrowhead)',[poly('',[[0,0],[140,0]],{arrow:true})]);
  /* relational database one-to-many connector: 1 at the table end, infinity at the other */
  add('Relational database one-to-many link',[poly('',[[0,0],[40,0],[40,60],[120,60]]),poly('',[[8,-14],[8,-4]]),ell('',94,44,12,9),ell('',106,44,12,9)]);
  /* project management */
  add('Gantt chart task bar',[rect('',0,0,140,22,{fill:'#a5d8ff'})]);
  add('Gantt chart milestone (diamond)',[dia('',0,0,22,22)]);
  add('Gantt chart dependency arrow',[poly('',[[0,0],[16,0],[16,30],[34,30]],{arrow:true})]);
  /* storyboard */
  add('Storyboard screen',[rect('',0,0,220,170,{sw:2}),poly('',[[0,28],[220,28]])]);
  add('Storyboard button',[rect('',0,0,80,26,{round:{type:3}})]);
  add('Storyboard navigation link (curved arrow)',[poly('',[[0,30],[70,0],[140,30]],{arrow:true,curve:true})]);
  /* decision tree */
  add('Decision tree node (box with two branches)',[rect('',30,0,120,34),poly('',[[90,34],[30,80]]),poly('',[[90,34],[150,80]])]);
  /* machine learning */
  add('Neural network node',[ell('',0,0,40,40)]);
  add('Neural network layer (rounded box)',[rect('',0,0,90,280,{round:{type:3}})]);
  add('Neural network strong weighting (thick arrow)',[poly('',[[0,0],[120,30]],{arrow:true,sw:4})]);
  add('MLOps three stages (design, model development, operation)',[ell('',0,0,110,110),ell('',110,0,110,110),ell('',220,0,110,110),
    poly('',[[30,-8],[55,-16],[80,-8]],{arrow:true,curve:true}),poly('',[[140,-8],[165,-16],[190,-8]],{arrow:true,curve:true}),poly('',[[250,-8],[275,-16],[300,-8]],{arrow:true,curve:true})]);
  /* wiring diagrams for mechatronic systems (Year 11, assumed knowledge) */
  add('Wiring: capacitor',[poly('',[[0,20],[44,20]]),poly('',[[44,4],[44,36]]),poly('',[[56,4],[56,36]]),poly('',[[56,20],[100,20]])]);
  add('Wiring: diode',[poly('',[[0,20],[36,20]]),poly('',[[36,4],[36,36],[62,20],[36,4]]),poly('',[[62,4],[62,36]]),poly('',[[62,20],[100,20]])]);
  add('Wiring: resistor',[poly('',[[0,14],[20,14],[25,4],[33,24],[41,4],[49,24],[57,4],[65,24],[70,14],[90,14]])]);
  add('Wiring: 2-way switch',[poly('',[[0,40],[26,40]]),ell('',26,35,10,10),poly('',[[35,37],[70,14]]),ell('',72,8,10,10),ell('',72,38,10,10),poly('',[[82,13],[110,13]]),poly('',[[82,43],[110,43]])]);
  add('Wiring: on/off switch',[poly('',[[0,30],[26,30]]),ell('',26,25,10,10),poly('',[[35,27],[70,6]]),ell('',72,25,10,10),poly('',[[82,30],[110,30]])]);
  add('Wiring: speaker',[poly('',[[0,22],[18,22]]),poly('',[[0,38],[18,38]]),rect('',18,16,10,28),poly('',[[28,16],[48,0],[48,60],[28,44]])]);
  add('Wiring: motor',[poly('',[[0,30],[20,30]]),ell('',20,0,60,60),poly('',[[37,42],[37,18],[50,32],[63,18],[63,42]]),poly('',[[80,30],[100,30]])]);
  add('Wiring: LED',[poly('',[[0,30],[36,30]]),poly('',[[36,14],[36,46],[62,30],[36,14]]),poly('',[[62,14],[62,46]]),poly('',[[62,30],[100,30]]),
    poly('',[[50,10],[62,-4]],{arrow:true}),poly('',[[60,14],[72,0]],{arrow:true})]);
  add('Wiring: lightbulb',[ell('',0,0,50,50),poly('',[[7,7],[43,43]]),poly('',[[43,7],[7,43]])]);
  add('Wiring: integrated circuit',[rect('',20,0,70,90),poly('',[[46,0],[55,9],[64,0]],{curve:true}),
    poly('',[[0,15],[20,15]]),poly('',[[0,35],[20,35]]),poly('',[[0,55],[20,55]]),poly('',[[0,75],[20,75]]),
    poly('',[[90,15],[110,15]]),poly('',[[90,35],[110,35]]),poly('',[[90,55],[110,55]]),poly('',[[90,75],[110,75]])]);
  add('Wiring: voltage source',[poly('',[[35,0],[35,15]]),ell('',5,15,60,60),poly('',[[28,32],[42,32]]),poly('',[[35,25],[35,39]]),poly('',[[28,58],[42,58]]),poly('',[[35,75],[35,90]])]);
  add('Wiring: DC voltage source (cell)',[poly('',[[0,20],[42,20]]),poly('',[[42,2],[42,38]]),poly('',[[54,12],[54,28]]),poly('',[[54,20],[96,20]])]);
  add('Wiring: DC voltage source (battery)',[poly('',[[0,20],[30,20]]),poly('',[[30,2],[30,38]]),poly('',[[40,12],[40,28]]),poly('',[[52,2],[52,38]]),poly('',[[62,12],[62,28]]),poly('',[[62,20],[96,20]])]);
  add('Wiring: amplifier',[poly('',[[0,40],[20,40]]),poly('',[[20,0],[20,80],[90,40],[20,0]]),poly('',[[90,40],[110,40]])]);
  return items;
})();
/* the number of items at the start of XDLIB that make up the exam library */
var XDLIB_EXAM=16;
