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

  /* ===== the HSC exam library, row by row (drawn to match the exam tool's icons) ===== */
  function arc(name,cx,cy,r,a0,a1,steps,o){var p=[];for(var i=0;i<=steps;i++){var t=(a0+(a1-a0)*i/steps)*Math.PI/180;p.push([cx+r*Math.cos(t),cy+r*Math.sin(t)])}return poly(name,p,o)}
  var inf=[];for(var i=0;i<=24;i++){var t=i*Math.PI/12,d=1+Math.sin(t)*Math.sin(t);inf.push([30+30*Math.cos(t)/d,12+30*Math.sin(t)*Math.cos(t)/d])}
  add('DFD process (circle)',[ell('',0,0,100,100,{sw:1})]);
  add('DFD data store (open-ended box)',[poly('',[[130,0],[0,0],[0,50],[130,50]],{sw:1})]);
  add('DFD external entity (square)',[rect('',0,0,100,100,{sw:3})]);
  add('DFD data flow (curved labelled arrow)',[poly('',[[0,0],[30,32],[70,36],[112,0]],{arrow:true,curve:true,sw:1})]);
  add(N,[ell('',0,26,18,18,{sw:1}),poly('',[[16,28],[44,4]],{arrow:true,end:'triangle',sw:2})]);
  add(C,[ell('',0,26,18,18,{fill:'#1e1e1e',sw:1}),poly('',[[16,28],[44,4]],{arrow:true,end:'triangle',sw:2})]);
  add('Flowchart subprogram',[rect('',0,0,140,60,{sw:1}),poly('',[[18,0],[18,60]],{sw:1}),poly('',[[122,0],[122,60]],{sw:1})]);
  add('Flowchart input or output (parallelogram)',[poly('',[[30,0],[150,0],[120,60],[0,60],[30,0]],{sw:1})]);
  add('Flowchart decision (diamond)',[dia('',0,0,140,56,{sw:1})]);
  add('Flowchart terminator (rounded rectangle)',[rect('',0,0,140,50,{round:{type:3,value:25},sw:1})]);
  add('Flowchart process or structure chart module (rectangle)',[rect('',0,0,140,50,{sw:1})]);
  add('Structure chart decision (diamond where the lines meet)',[poly('',[[0,50],[60,0],[120,50]],{sw:1}),dia('',52,-6,16,16,{sw:1,fill:'#ffffff'})]);
  add('Structure chart repetition (curved arrow)',[arc('',30,30,26,-30,230,14,{arrow:true,curve:true,sw:1})]);
  add('Relational database many (infinity) end',[poly('',inf,{curve:true,sw:1})]);
  add('Relational database table (name and fields)',[rect('',0,0,170,110,{sw:1}),poly('',[[0,30],[170,30]],{sw:1})]);
  add('Class (name, attributes, methods)',[rect('',0,0,170,130,{sw:1}),poly('',[[0,30],[170,30]],{sw:1}),poly('',[[0,80],[170,80]],{sw:1})]);
  return items;
})();
/* the number of items at the start of XDLIB that make up the exam library */
var XDLIB_EXAM=16;
