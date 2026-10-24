import os,json
from playwright.sync_api import sync_playwright
origin=os.environ['SITE']
with sync_playwright() as p:
    browser=p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {}))
    page=browser.new_page()
    page.add_init_script("window.PYBASE="+json.dumps(origin+'/__pyodide__/'))
    # Every request is local; production account and marking APIs are never contacted.
    page.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and '/api/' not in r.request.url else r.abort())
    page.goto(origin);page.wait_for_function('typeof runPy === "function"')
    assert page.evaluate("runPy('print(2 + 3)',[])").strip()=='5'
    assert page.evaluate("runPy('n = input(\"Number: \"); print(int(n) * 2)', ['5'])").strip()=='10'
    # A genuine infinite Python loop leaves the UI responsive and can be stopped.
    page.evaluate("window.workerResult='pending';runPy('while True: pass',[]).catch(e=>window.workerResult=e.message);void 0")
    page.wait_for_timeout(200)
    assert page.evaluate('1+1')==2
    page.evaluate('stopPython()');page.wait_for_function("workerResult !== 'pending'")
    assert 'stopped' in page.evaluate('workerResult')
    assert page.evaluate("runPy('print(7)',[])").strip()=='7'
    # Shorten only the test's budget; production uses a 10-second execution limit.
    page.evaluate("PYTIMEOUT=200;window.workerResult='pending';runPy('while True: pass',[]).catch(e=>window.workerResult=e.message);void 0")
    page.wait_for_function("workerResult !== 'pending'")
    assert 'limit' in page.evaluate('workerResult')
    page.evaluate('PYTIMEOUT=10000')
    assert page.evaluate("runPy('print(8)',[])").strip()=='8'
    # All committed Python model answers pass using the actual browser runtime.
    count=page.evaluate('''async()=>{
      var total=0;
      for(var b of BANKS)for(var q of b.qs)for(var it of q.it)if(it.t==='py')for(var test of it.tests){
        var output=await runPy(it.model+'\\n'+(test.app||''),test.i||[]);
        if(!passTest(output,test))throw Error(b.name+': '+JSON.stringify(output)+' != '+test.o);
        total++;
      }
      return total;
    }''')
    assert count==42,count
    browser.close()
    print('Python worker OK: interactive input, real infinite-loop stop/timeout, recovery and 42 model cases')
