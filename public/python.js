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
      if(m.error)j.reject(new Error(m.error));else j.resolve(m.output);
      pythonNext();
    };
    PY.worker.postMessage({type:'init',base:PYBASE});return;
  }
  if(!PY.ready)return;
  PY.job=PY.queue.shift();
  PY.timer=setTimeout(function(){pythonFailure('Python exceeded the 10-second limit. Check for an infinite loop and run it again.')},PYTIMEOUT);
  PY.worker.postMessage({type:'run',source:PY.job.source,inputs:PY.job.inputs});
}
function runPy(src,inputs){return new Promise(function(resolve,reject){PY.queue.push({source:src,inputs:(inputs||[]).slice(),resolve:resolve,reject:reject});pythonNext()})}
