/* ---------- Ace code editor for the Python, pseudocode and SQL answer boxes ---------- */
/* Each box keeps a plain textarea in the page. Ace replaces it on screen and copies every
   edit back into the textarea, so saving, running and marking keep reading the textarea.
   If Ace cannot load (offline), the textarea stays usable. */
var ACEBASE=window.ACEBASE||'https://cdn.jsdelivr.net/npm/ace-builds@1.32.9/src-min-noconflict/',ACEP=null,ACE_ED={};
var ACE_MODE={py:'ace/mode/python',sq:'ace/mode/sql',ps:'ace/mode/text'};
function loadAce(){
  if(!ACEP)ACEP=loadScript(ACEBASE+'ace.js').then(function(){var u=new URL(ACEBASE,location.href).href;ace.config.set('basePath',u);ace.config.set('modePath',u);ace.config.set('themePath',u)}).catch(function(e){ACEP=null;throw e});
  return ACEP;
}
function aceMount(){
  if(!CUR.b)return;
  var locked=CUR.rv||BS(CUR.b.id).done;
  $$('.cedit textarea[data-code]').forEach(function(ta){
    var host=ta.parentNode,k=ta.dataset.k;
    if(host.dataset.ace)return;
    host.dataset.ace='loading';
    loadAce().then(function(){
      if(!document.body.contains(ta)||host.dataset.ace!=='loading')return;
      var it=itemOf(k),box=document.createElement('div');
      box.className='cedit-ed';host.appendChild(box);
      var ed=ace.edit(box,{theme:'ace/theme/textmate',mode:ACE_MODE[it.t]||'ace/mode/text',value:ta.value,fontSize:15,showPrintMargin:false,tabSize:4,useSoftTabs:true,useWorker:false,readOnly:locked,highlightActiveLine:!locked,wrap:false});
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
        if(locked)return;
        ta.value=ed.getValue();
        ta.dispatchEvent(new Event('input',{bubbles:true}));
      });
      holder();
      if(window.ResizeObserver){var ro=new ResizeObserver(function(){ed.resize()});ro.observe(host)}
      host.dataset.ace='1';host.classList.add('ace-on');
      ACE_ED[k]=ed;
    }).catch(function(){host.dataset.ace=''});
  });
}
function aceCleanup(){
  Object.keys(ACE_ED).forEach(function(k){
    var ed=ACE_ED[k];
    try{
      var box=ed.container,host=box.parentNode;
      ed.destroy();box.remove();
      if(host){host.classList.remove('ace-on');delete host.dataset.ace}
    }catch(e){}
  });
  ACE_ED={};
}
function aceResize(){setTimeout(function(){Object.keys(ACE_ED).forEach(function(k){try{ACE_ED[k].resize(true)}catch(e){}})},0)}
