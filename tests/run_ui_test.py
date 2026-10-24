"""Start a loopback-only fixture server and run browser tests with mocked APIs."""
import os,runpy,threading
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
ROOT=Path(__file__).resolve().parent.parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT/'public'),**kwargs)
    def translate_path(self,url):
        if url.startswith('/__pyodide__/') and os.environ.get('PYODIDE_DIR'):
            return str(Path(os.environ['PYODIDE_DIR'])/Path(url.split('?',1)[0]).name)
        if url.startswith('/__ace__/') and os.environ.get('ACE_DIR'):
            return str(Path(os.environ['ACE_DIR'])/'src-min-noconflict'/Path(url.split('?',1)[0]).name)
        return super().translate_path(url)
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
os.environ['SITE']='http://127.0.0.1:'+str(server.server_port)
try:
    runpy.run_path(str(ROOT/'tests/ui_test.py'),run_name='__main__')
    runpy.run_path(str(ROOT/'tests/marking_ui_test.py'),run_name='__main__')
    runpy.run_path(str(ROOT/'tests/comparison_ui_test.py'),run_name='__main__')
    if os.environ.get('PYODIDE_DIR'): runpy.run_path(str(ROOT/'tests/python_worker_test.py'),run_name='__main__')
finally: server.shutdown();server.server_close()
