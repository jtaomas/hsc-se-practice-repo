/* Dedicated worker: no account state, DOM, or session tokens are passed here. */
var engine=null;
self.onmessage=function(e){
  var m=e.data;
  if(m.type==='init'){
    try{importScripts(m.base+'pyodide.js')}
    catch(err){self.postMessage({type:'load-error',error:'Python could not load. Check your connection.'});return}
    loadPyodide({indexURL:m.base}).then(function(py){engine=py;self.postMessage({type:'ready'})}).catch(function(){self.postMessage({type:'load-error',error:'Python could not load. Check your connection.'})});
    return;
  }
  if(m.type!=='run'||!engine)return;
  var output='',globals=null,input=null,error=null;
  function write(s){output+=s+'\n';if(output.length>100000)throw new Error('Too much output. Check your loop.')}
  engine.setStdout({batched:write});engine.setStderr({batched:write});
  try{
    globals=engine.globals.get('dict')();input=engine.toPy(m.inputs||[]);globals.set('__hsc_inputs',input);
    // Suppress input prompts so checks compare only the student's printed answer.
    engine.runPython('import builtins as __hsc_builtins\n__hsc_values = iter(__hsc_inputs)\ndef input(prompt=""):\n    try:\n        return str(next(__hsc_values))\n    except StopIteration:\n        raise EOFError("Add more values to Program input, one per line, then run again.") from None\n', {globals:globals});
    engine.runPython(m.source,{globals:globals});
  }catch(err){error=String(err.message||err).trim().split('\n').slice(-3).join('\n')}
  finally{if(input)input.destroy();if(globals)globals.destroy()}
  self.postMessage({type:'result',output:output,error:error});
};
