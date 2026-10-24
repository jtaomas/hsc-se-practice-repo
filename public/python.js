/* Python runs only in a worker. Termination also stops an infinite loop. */
var PYBASE=window.PYBASE||'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
var PYTIMEOUT=10000,PYLOADTIMEOUT=60000,PY={worker:null,ready:false,job:null,queue:[],timer:null};
function pythonFailure(message){
  clearTimeout(PY.timer);if(PY.worker)PY.worker.terminate();PY.worker=null;PY.ready=false;
  var jobs=PY.queue.splice(0);if(PY.job)jobs.unshift(PY.job);PY.job=null;
  jobs.forEach(function(j){j.reject(new Error(message))});
}
function stopPython(){pythonFailure('Python stopped. You can edit your program and run it again.')}
function pythonNext(){
  if(PY.job||!PY.queue.length)return;
  if(!PY.worker){
    try{PY.worker=new Worker(new URL('python-worker.js',document.baseURI).href)}catch(e){pythonFailure('Python could not start.');return}
    PY.timer=setTimeout(function(){pythonFailure('Python could not load in time. Check your connection and try again.')},PYLOADTIMEOUT);
    PY.worker.onerror=function(){pythonFailure('Python could not start. Check your connection and try again.')};
    PY.worker.onmessage=function(e){
      var m=e.data;
      if(m.type==='ready'){clearTimeout(PY.timer);PY.ready=true;pythonNext();return}
      if(m.type==='load-error'){pythonFailure(m.error);return}
      if(m.type!=='result'||!PY.job)return;
      clearTimeout(PY.timer);var j=PY.job;PY.job=null;
      if(j.raw)j.resolve(m);else if(m.error)j.reject(new Error(m.error));else j.resolve(m.output);
      pythonNext();
    };
    PY.worker.postMessage({type:'init',base:PYBASE});return;
  }
  if(!PY.ready)return;
  PY.job=PY.queue.shift();
  PY.timer=setTimeout(function(){pythonFailure('Python exceeded the 10-second limit. Check for an infinite loop and run it again.')},PYTIMEOUT);
  PY.worker.postMessage({type:'run',source:PY.job.source,inputs:PY.job.inputs,interactive:!!PY.job.interactive,seed:PY.job.seed||0});
}
function runPy(src,inputs){return new Promise(function(resolve,reject){PY.queue.push({source:src,inputs:(inputs||[]).slice(),resolve:resolve,reject:reject});pythonNext()})}

/* ---------- Run button: input() opens a dialog, as in the HSC online exam ----------
   The worker cannot pause for an answer, so each answer is added to a list and the
   program runs again from the start until it needs the next one. Time spent at the
   dialog does not count towards the 10-second limit, and the dialog has no way out:
   Cancel gives an empty answer, exactly like the exam. So `while True: input()` traps
   you until the page is reloaded (answers are saved as you type). */
function runPyStep(src,inputs,seed){return new Promise(function(resolve,reject){PY.queue.push({source:src,inputs:inputs.slice(),interactive:true,seed:seed,raw:true,resolve:resolve,reject:reject});pythonNext()})}
function runPyInteractive(src,show){
  var answers=[],seed=1+Math.floor(Math.random()*1e9);
  function step(){
    return runPyStep(src,answers,seed).then(function(m){
      var out=m.output||'';
      if(m.need!=null){show(out,false);return pyAsk(m.need).then(function(v){answers.push(v);return step()})}
      show(out+(m.error?(out&&!/\n$/.test(out)?'\n':'')+m.error:''),true);
    });
  }
  return step();
}
function pyAsk(prompt){
  return new Promise(function(resolve){
    var old=document.querySelector('.pyask');if(old)old.remove();
    var w=document.createElement('div');w.className='pyask';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-labelledby','pyaskl');
    w.innerHTML='<div class="pyaskb"><label id="pyaskl" for="pyaski"></label><input id="pyaski" type="text" autocomplete="off" spellcheck="false"><div class="pyacts"><button type="button" class="pyno">Cancel</button><button type="button" class="pyok">Ok</button></div></div>';
    w.querySelector('label').textContent=prompt;
    var inp=w.querySelector('input'),focused=document.activeElement;
    function done(v){document.removeEventListener('focusin',trap,true);document.removeEventListener('keydown',keys,true);w.remove();document.body.classList.remove('pyasking');if(focused&&focused.focus&&document.body.contains(focused))try{focused.focus()}catch(e){};resolve(v)}
    function trap(e){if(!w.contains(e.target))inp.focus()}
    function keys(e){
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();inp.focus();return}
      if(e.key==='Enter'&&e.target===inp){e.preventDefault();done(inp.value);return}
      if(e.key==='Tab'){var f=[inp,w.querySelector('.pyno'),w.querySelector('.pyok')],i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?f.length-1:1))%f.length].focus()}
    }
    w.querySelector('.pyok').onclick=function(){done(inp.value)};
    w.querySelector('.pyno').onclick=function(){done('')};
    w.addEventListener('mousedown',function(e){if(e.target===w){e.preventDefault();inp.focus()}});
    document.addEventListener('focusin',trap,true);document.addEventListener('keydown',keys,true);
    document.body.appendChild(w);document.body.classList.add('pyasking');inp.focus();
  });
}
