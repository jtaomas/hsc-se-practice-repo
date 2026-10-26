/* ---------- Ace code editor for the Python, pseudocode and SQL answer boxes ---------- */
/* Each box keeps a plain textarea in the page. Ace replaces it on screen and copies every
   edit back into the textarea, so saving, running and marking keep reading the textarea.
   If Ace cannot load (offline), the textarea stays usable. */
var ACEBASE=window.ACEBASE||'https://cdn.jsdelivr.net/npm/ace-builds@1.32.9/src-min-noconflict/',ACEP=null,ACE_ED={};
var ACE_MODE={py:'ace/mode/python',sq:'ace/mode/sql',ps:'ace/mode/text'};
function aceModeOf(it,ta){var f=ta.dataset.f;if(f)return /\.css$/i.test(f)?'ace/mode/css':'ace/mode/html';return ACE_MODE[it.t]||'ace/mode/text'}
function loadAce(){
  if(!ACEP)ACEP=loadScript(ACEBASE+'ace.js').then(function(){var u=new URL(ACEBASE,location.href).href;ace.config.set('basePath',u);ace.config.set('modePath',u);ace.config.set('themePath',u)}).catch(function(e){ACEP=null;throw e});
  return ACEP;
}
function aceMount(){
  if(!CUR.b)return;
  var locked=typeof canEdit==='function'?!canEdit():(CUR.rv||BS(CUR.b.id).done);
  $$('.cedit textarea[data-code]').forEach(function(ta){
    var host=ta.parentNode,k=ta.dataset.k,ek=k+(ta.dataset.f?':'+ta.dataset.f:''),ro=locked||ta.readOnly;
    if(host.dataset.ace)return;
    host.dataset.ace='loading';
    loadAce().then(function(){
      if(!document.body.contains(ta)||host.dataset.ace!=='loading')return;
      var it=itemOf(k);
      if(!it)return;
      var box=document.createElement('div');
      box.className='cedit-ed';host.appendChild(box);
      var ed=ace.edit(box,{theme:'ace/theme/textmate',mode:aceModeOf(it,ta),value:ta.value,fontSize:15,showPrintMargin:false,tabSize:4,useSoftTabs:true,useWorker:false,readOnly:ro,highlightActiveLine:!ro,wrap:false});
      ed.clearSelection();
      ed.textInput.getElement().setAttribute('aria-label',ta.getAttribute('aria-label')||'Code editor');
      var ph=ta.getAttribute('placeholder')||'';
      function holder(){
        var empty=!ed.session.getValue().length,r=ed.renderer;
        if(empty&&!r.emptyMessageNode&&ph){var n=r.emptyMessageNode=document.createElement('div');n.className='ace-empty';n.textContent=ph;r.scroller.appendChild(n)}
        else if(!empty&&r.emptyMessageNode){r.scroller.removeChild(r.emptyMessageNode);r.emptyMessageNode=null}
      }
      ed.session.on('change',function(){
        holder();
        if(ro)return;
        ta.value=ed.getValue();
        ta.dispatchEvent(new Event('input',{bubbles:true}));
      });
      holder();
      if(window.ResizeObserver){
        var ro=new ResizeObserver(function(){
          if(ed._hscDestroyed||ACE_ED[ek]!==ed||!ed.session||!document.body.contains(host)||!document.body.contains(box))return;
          ed.resize();
        });
        ed._hscResizeObserver=ro;ro.observe(host);
      }
      host.dataset.ace='1';host.classList.add('ace-on');
      ACE_ED[ek]=ed;
    }).catch(function(){host.dataset.ace=''});
  });
}
function aceCleanup(){
  Object.keys(ACE_ED).forEach(function(k){
    var ed=ACE_ED[k];
    ed._hscDestroyed=true;
    if(ed._hscResizeObserver){
      try{ed._hscResizeObserver.disconnect()}catch(e){}
      ed._hscResizeObserver=null;
    }
    try{
      var box=ed.container,host=box.parentNode;
      if(ed.renderer&&ed.renderer.scrollBarV&&ed.renderer.scrollBarV.element){try{ed.renderer.scrollBarV.element.onscroll=null}catch(e){}}
      if(ed.renderer&&ed.renderer.scrollBarH&&ed.renderer.scrollBarH.element){try{ed.renderer.scrollBarH.element.onscroll=null}catch(e){}}
      ed.destroy();box.remove();
      if(host){host.classList.remove('ace-on');delete host.dataset.ace}
    }catch(e){}
  });
  ACE_ED={};
}
function aceResize(){setTimeout(function(){Object.keys(ACE_ED).forEach(function(k){try{ACE_ED[k].resize(true)}catch(e){}})},0)}
