/* Dedicated worker: no account state, DOM, or session tokens are passed here. */
var engine=null;
var PRELUDE=[
  'import builtins as __hsc_builtins',
  '__hsc_values = iter(__hsc_inputs)',
  '__hsc_need = None',
  'class __HSCNeedInput(BaseException):',
  '    pass',
  'if __hsc_interactive:',
  '    import random as __hsc_random',
  '    __hsc_random.seed(__hsc_seed)',
  'def input(prompt=""):',
  '    global __hsc_need',
  '    if __hsc_need is not None:',
  '        raise __HSCNeedInput(__hsc_need)',
  '    try:',
  '        value = str(next(__hsc_values))',
  '    except StopIteration:',
  '        if __hsc_interactive:',
  '            __hsc_need = str(prompt)',
  '            raise __HSCNeedInput(__hsc_need) from None',
  '        raise EOFError("The program asked for more input than this test provides.") from None',
  '    if __hsc_interactive:',
  '        print(str(prompt) + value)',
  '    return value',
''].join('\n');
self.onmessage=function(e){
  var m=e.data;
  if(m.type==='init'){
    try{importScripts(m.base+'pyodide.js')}
    catch(err){self.postMessage({type:'load-error',error:'Python could not load. Check your connection.'});return}
    loadPyodide({indexURL:m.base}).then(function(py){engine=py;self.postMessage({type:'ready'})}).catch(function(){self.postMessage({type:'load-error',error:'Python could not load. Check your connection.'})});
    return;
  }
  if(m.type!=='run'||!engine)return;
  var output='',globals=null,input=null,error=null,need=null;
  function write(s){output+=s+'\n';if(output.length>100000)throw new Error('Too much output. Check your loop.')}
  engine.setStdout({batched:write});engine.setStderr({batched:write});
  try{
    globals=engine.globals.get('dict')();input=engine.toPy(m.inputs||[]);globals.set('__hsc_inputs',input);
    globals.set('__hsc_interactive',!!m.interactive);globals.set('__hsc_seed',m.seed||0);
    // Marking runs: prompts are suppressed so checks compare only the printed answer.
    // Run button (interactive): when the answers run out, stop and ask the page for the next one,
    // like the input dialog in the HSC exam. The answer is echoed after its prompt, as the exam console does.
    engine.runPython(PRELUDE,{globals:globals});
    engine.runPython(m.source,{globals:globals});
  }catch(err){error=String(err.message||err).trim().split('\n').slice(-3).join('\n')}
  finally{
    try{if(globals&&globals.get('__hsc_need')!=null){need=String(globals.get('__hsc_need'));error=null}}catch(e){}
    if(input)input.destroy();if(globals)globals.destroy();
  }
  self.postMessage({type:'result',output:output,error:error,need:need});
};
