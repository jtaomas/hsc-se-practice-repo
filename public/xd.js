/* ---------- drawing tool: Excalidraw, set up as in the HSC online exam ---------- */
var XDBASE=window.XDBASE||'https://cdn.jsdelivr.net/npm/',XDP=null,XD={};
function loadXD(){
  if(!XDP){
    window.EXCALIDRAW_ASSET_PATH=XDBASE+'@excalidraw/excalidraw@0.17.6/dist/';
    XDP=loadScript(XDBASE+'react@18.3.1/umd/react.production.min.js')
      .then(function(){return loadScript(XDBASE+'react-dom@18.3.1/umd/react-dom.production.min.js')})
      .then(function(){return loadScript(XDBASE+'@excalidraw/excalidraw@0.17.6/dist/excalidraw.production.min.js')})
      .catch(function(e){XDP=null;throw e});
  }
  return XDP;
}
function xdFlush(k){
  var st=XD[k];if(!st||st.ro||!st.api||!canEdit())return;
  var live=st.api.getSceneElements().filter(function(e){return !e.isDeleted}),A=ANS(CUR.b),cur=A[k],prev=cur&&cur.e?JSON.stringify(cur.e):'[]',nxt=JSON.stringify(live);
  if(prev!==nxt){A[k]={e:JSON.parse(nxt)};save()}
}
function xdCleanup(){
  if(typeof aceCleanup==='function')aceCleanup();
  Object.keys(XD).forEach(function(k){try{clearTimeout(XD[k].tmr);xdFlush(k);XD[k].root.unmount()}catch(e){}});
  XD={};
}
function xdMount(b,k,ro){
  var host=document.getElementById('x'+k);if(!host)return;
  if(host.dataset.xd)return;
  host.dataset.xd='1';
  loadXD().then(function(){
    if(!document.body.contains(host))return;
    var saved=ANS(b)[k],els=(saved&&saved.e)||[];
    host.innerHTML='';
    var st=XD[k]={root:ReactDOM.createRoot(host),api:null,tmr:null,ro:ro};
    var wide=!ro&&host.clientWidth>=760,app={viewBackgroundColor:'#ffffff',currentItemRoughness:0,currentItemStrokeWidth:2,currentItemRoundness:'sharp',currentItemFontFamily:2};
    // the shape library opens docked on the right, as in the exam; on narrow screens it waits for the Library button
    if(wide){app.openSidebar={name:'default',tab:'library'};app.defaultSidebarDockedPreference=true}
<<<<<<< Updated upstream
    var props={
      initialData:{elements:els,appState:app,scrollToContent:els.length>0,libraryItems:ro?[]:xdLibItems()},
=======
    // Excalidraw keeps one library for every canvas on the page, so a read-only canvas passes no library rather than
    // an empty one (an empty list would wipe the shapes from an editable canvas open beside it)
    var init={elements:els,appState:app,scrollToContent:els.length>0};
    if(!ro)init.libraryItems=xdLibItems();
    var props={
      initialData:init,
>>>>>>> Stashed changes
      excalidrawAPI:function(a){st.api=a},
      viewModeEnabled:!!ro,handleKeyboardGlobally:false,
      UIOptions:{canvasActions:{loadScene:false,export:false,saveToActiveFile:false,saveAsImage:false,clearCanvas:false,changeViewBackgroundColor:false,toggleTheme:false},tools:{image:false},dockedSidebarBreakpoint:0},
      onChange:ro?undefined:function(){clearTimeout(st.tmr);st.tmr=setTimeout(function(){xdFlush(k);refreshNav()},400)}
    };
    st.root.render(React.createElement(ExcalidrawLib.Excalidraw,props));
    if(!ro)xdLibLabels(host);
  }).catch(function(){host.innerHTML='<div class="xdl er">The drawing tool could not load. It needs an internet connection. Reload the page and try again.</div>'});
}
/* the shape library (xdlib.js): the exam's 16 shapes first, under their own heading, then the other course specification symbols */
function xdLibItems(){
  if(typeof XDLIB==='undefined')return [];
  return JSON.parse(JSON.stringify(XDLIB)).map(function(it,i){it.status=i<XDLIB_EXAM?'unpublished':'published';return it});
}
function xdLibLabels(host){
  // Excalidraw heads the two groups "Personal library" and "Excalidraw library"; rename them for students
  function fix(){
    var hs=host.querySelectorAll('.library-menu-items-container__header');
    for(var i=0;i<hs.length;i++){var t=i===0?'HSC exam library':'More symbols from the course specifications';if(hs[i].textContent!==t)hs[i].textContent=t}
  }
  try{new MutationObserver(fix).observe(host,{childList:true,subtree:true})}catch(e){}
}
function xdScene(all){
  // Preserve positions, paths, rotations, labels and endpoint bindings for the server.
  return {elements:JSON.parse(JSON.stringify((all||[]).filter(function(e){return !e.isDeleted}))).map(function(e){delete e._t;return e})};
}
function xdPNG(elements){
  var snapshot=xdScene(elements).elements;
  return loadXD().then(function(){return ExcalidrawLib.exportToBlob({elements:snapshot,files:{},appState:{exportBackground:true,viewBackgroundColor:'#ffffff'},mimeType:'image/png',maxWidthOrHeight:1600})}).then(function(blob){
    if(!blob||blob.size>1024*1024)return null;
    return new Promise(function(resolve){var reader=new FileReader();reader.onload=function(){resolve(reader.result)};reader.onerror=function(){resolve(null)};reader.readAsDataURL(blob)});
  }).catch(function(){return null});
}
/* Shapes dragged from the library carry customData.hsc. Each library shape (its group, or one element) becomes one
   named shape in the summary; library connectors (arrows, links) stay ordinary connectors. */
function xdBox(e){
  if(e.points&&e.points.length){var xs=e.points.map(function(p){return e.x+p[0]}),ys=e.points.map(function(p){return e.y+p[1]});return [Math.min.apply(null,xs),Math.min.apply(null,ys),Math.max.apply(null,xs),Math.max.apply(null,ys)]}
  return [e.x,e.y,e.x+e.width,e.y+e.height];
}
function xdLib(els){
  var groups={},order=[],member={},virt=[];
  els.forEach(function(e){
    var nm=e.customData&&typeof e.customData.hsc==='string'&&e.customData.hsc;
    if(!nm||e.type==='text'||/arrow|data flow|link|weighting/i.test(nm))return;
    var k=e.groupIds&&e.groupIds.length?'g:'+e.groupIds[0]:'e:'+e.id;
    if(!groups[k]){groups[k]={name:nm,els:[]};order.push(k)}
    groups[k].els.push(e);
  });
  order.forEach(function(k){
    var g=groups[k],b=[1e9,1e9,-1e9,-1e9];
    g.els.forEach(function(e){var c=xdBox(e);b=[Math.min(b[0],c[0]),Math.min(b[1],c[1]),Math.max(b[2],c[2]),Math.max(b[3],c[3])]});
    var v={id:'lib:'+k,type:g.name,x:b[0],y:b[1],width:b[2]-b[0],height:b[3]-b[1]};
    g.els.forEach(function(e){member[e.id]=v});virt.push(v);
  });
  return {virt:virt,member:member};
}
function xdText(all){
  var els=(all||[]).filter(function(e){return !e.isDeleted});
  if(!els.length)return 'The canvas is empty.';
  var L=xdLib(els),mem=L.member;
  var shapes=els.filter(function(e){return !mem[e.id]&&(e.type==='rectangle'||e.type==='ellipse'||e.type==='diamond')}).concat(L.virt).sort(function(a,b){return a.y-b.y||a.x-b.x});
  var texts=els.filter(function(e){return e.type==='text'}),conns=els.filter(function(e){return !mem[e.id]&&(e.type==='arrow'||e.type==='line')});
  var lab={},loose=[];
  texts.forEach(function(t){
    var c=t.containerId&&(mem[t.containerId]||els.filter(function(x){return x.id===t.containerId})[0]);
    if(c){(lab[c.id]=lab[c.id]||[]).push({y:t.y,t:t.text});return}
    var cx=t.x+t.width/2,cy=t.y+t.height/2,best=null;
    shapes.forEach(function(s){if(cx>=s.x&&cx<=s.x+s.width&&cy>=s.y&&cy<=s.y+s.height&&(!best||s.width*s.height<best.width*best.height))best=s});
    if(best)(lab[best.id]=lab[best.id]||[]).push({y:t.y,t:t.text});else loose.push(t);
  });
  var name={},labels={},out=[];
  shapes.forEach(function(s,i){
    var L=(lab[s.id]||[]).sort(function(a,b){return a.y-b.y}).map(function(x){return x.t.replace(/\n+/g,' / ')});
    name[s.id]='S'+(i+1);labels[s.id]=L;
    out.push('S'+(i+1)+' ['+s.type+', top-left ('+Math.round(s.x)+','+Math.round(s.y)+'), '+Math.round(s.width)+'x'+Math.round(s.height)+'] text: '+(L.length?L.join(' | '):'(empty)'));
  });
  function nm(s){return s?name[s.id]+(labels[s.id].length?' "'+labels[s.id][0].slice(0,30)+'"':''):'nothing'}
  function near(pt,bid){
    if(bid){var b=mem[bid]||shapes.filter(function(s){return s.id===bid})[0];if(b)return b}
    var best=null,bd=1e9;
    shapes.forEach(function(s){var dx=Math.max(s.x-pt[0],0,pt[0]-(s.x+s.width)),dy=Math.max(s.y-pt[1],0,pt[1]-(s.y+s.height)),d=Math.hypot(dx,dy);if(d<bd){bd=d;best=s}});
    return bd<=40?best:null;
  }
  var cl=conns.map(function(c){var p=c.points||[[0,0]],a=[c.x+p[0][0],c.y+p[0][1]],z=[c.x+p[p.length-1][0],c.y+p[p.length-1][1]];return {c:c,a:a,z:z,mid:[(a[0]+z[0])/2,(a[1]+z[1])/2],lab:[]}});
  texts.forEach(function(t){if(t.containerId){var c=cl.filter(function(x){return x.c.id===t.containerId})[0];if(c)c.lab.push(t.text)}});
  loose.slice().forEach(function(t){
    var cx=t.x+t.width/2,cy=t.y+t.height/2,best=null,bd=1e9;
    cl.forEach(function(x){var d=Math.hypot(x.mid[0]-cx,x.mid[1]-cy);if(d<bd){bd=d;best=x}});
    if(best&&bd<90){best.lab.push(t.text);loose.splice(loose.indexOf(t),1)}
  });
  cl.forEach(function(x,i){
    var c=x.c,A=near(x.a,c.startBinding&&c.startBinding.elementId),B=near(x.z,c.endBinding&&c.endBinding.elementId);
    out.push('Connector '+(i+1)+' ['+c.type+'] from '+nm(A)+' to '+nm(B)+'; arrowhead at the start: '+(c.startArrowhead||'none')+'; arrowhead at the end: '+(c.endArrowhead||'none')+(x.lab.length?'; label: '+x.lab.join(' / ').replace(/\n+/g,' '):'')+(c.strokeStyle&&c.strokeStyle!=='solid'?'; line style: '+c.strokeStyle:''));
  });
  loose.forEach(function(t){out.push('Free text at ('+Math.round(t.x)+','+Math.round(t.y)+'): '+t.text.replace(/\n+/g,' / '))});
  els.filter(function(e){return e.type==='freedraw'}).length&&out.push('The student also made '+els.filter(function(e){return e.type==='freedraw'}).length+' freehand pencil stroke(s), which cannot be read as text.');
  return out.join('\n');
}
