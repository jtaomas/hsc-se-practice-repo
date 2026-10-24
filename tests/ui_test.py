import json,re
from playwright.sync_api import sync_playwright
logs=[];store={'users':{},'prog':{}};reqs=[]
def auth(r):
    p=json.loads(r.request.post_data);reqs.append(p['action']);h=r.request.headers
    def out(c,j): r.fulfill(status=c,content_type='application/json',body=json.dumps(j))
    a=p['action']
    if a=='signup':
        if p['email'] in store['users']: return out(409,{'error':'An account with this email already exists. Sign in instead.'})
        store['users'][p['email']]=p['password'];return out(200,{'token':'T:'+p['email'],'email':p['email']})
    if a=='login':
        if store['users'].get(p['email'])!=p['password']: return out(401,{'error':'The email or password is not correct.'})
        return out(200,{'token':'T:'+p['email'],'email':p['email']})
    tok=h.get('authorization','').replace('Bearer ','')
    if not tok.startswith('T:') : return out(401,{'error':'Your sign-in has expired. Sign in again.'})
    if a=='load': return out(200,{'email':tok[2:],'data':store['prog'].get(tok)})
    if a=='save': store['prog'][tok]=p['data'];return out(200,{'ok':True})
import os
U=os.environ.get("SITE","http://localhost:8767")+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page()
    pg.on("pageerror",lambda e: logs.append(f"PAGEERROR: {e}"))
    pg.on("console",lambda m: logs.append(m.text) if m.type=='error' and 'ERR_FAILED' not in m.text else None)
    pg.route("https://fonts.g*/**",lambda r:r.abort())
    pg.route("**/api/auth",auth)
    pg.route("**/api/mark",lambda r:r.fulfill(status=200,content_type='application/json',body='{"ok":true}'))
    pg.goto(U);pg.wait_for_timeout(300)
    assert 'Settings' not in pg.inner_text('.hdr'),'settings link still there'
    assert pg.inner_text('.acct')=='Sign in'
    pg.goto(U+'#/1');pg.wait_for_timeout(200)
    t=pg.inner_text('.acts');assert 'exam mode' in t.lower() and 'practice mode' in t.lower(),t
    pg.click('[data-mode=practice]');pg.wait_for_timeout(300)
    h=pg.inner_text('.hdr');assert 'Practice mode' in h and pg.query_selector('#tmr') is None,h
    assert pg.query_selector('.hxb[href="#/1/finish"]') and pg.query_selector('.hxb[href="#/1"]')
    pg.evaluate("BS('1').ans['1.0']=0;save()")
    pg.click('.hxb[href="#/1"]');pg.wait_for_timeout(300)
    assert 'Continue practice' in pg.inner_text('.acts'),pg.inner_text('.acts')
    pg.click('text=Continue practice');pg.wait_for_timeout(300)
    assert '/q/' in pg.url
    pg.click('.hxb[href="#/1/finish"]');pg.wait_for_timeout(300)
    assert 'Unanswered' in pg.inner_text('.pg')
    pg.click('[data-act=submit]');pg.wait_for_timeout(800)
    assert 'results' in pg.url and pg.inner_text('.big').count('/')==1,pg.inner_text('.big')
    pg.goto(U+'#/2');pg.click('[data-mode=exam]');pg.wait_for_timeout(1500)
    tm=pg.inner_text('#tmr');assert re.match(r'2:19:5\d|2:20:00',tm),tm
    pg.goto(U+'#/account');pg.wait_for_timeout(300)
    assert 'education email' in pg.inner_text('.feature')
    pg.click('[data-act=acmode]');pg.fill('#acemail','stu@student.det.nsw.edu.au');pg.fill('#acpw','password123');pg.fill('#acpw2','different1');pg.click('[data-act=acgo]');pg.wait_for_timeout(300)
    assert 'do not match' in pg.inner_text('#accmsg')
    pg.fill('#acpw2','password123');pg.click('[data-act=acgo]');pg.wait_for_timeout(1500)
    assert pg.evaluate('S.tok')=='T:stu@student.det.nsw.edu.au'
    assert 'stu@student' in pg.inner_text('.acct'),pg.inner_text('.acct')
    assert 'password123' not in pg.evaluate("localStorage.getItem('sehsc-nesa-v2')")
    pg.wait_for_timeout(500)
    saved=store['prog'].get('T:stu@student.det.nsw.edu.au');assert saved,'no progress saved'
    assert saved['u']['1']['done'] is True and '2' in saved['u']
    ctx2=b.new_context(viewport={"width":1440,"height":900});p2=ctx2.new_page();p2.route("https://fonts.g*/**",lambda r:r.abort());p2.route("**/api/auth",auth)
    p2.goto(U+'#/account');p2.click('[data-act=acmode]');p2.fill('#acemail','stu@student.det.nsw.edu.au');p2.fill('#acpw','xxxxxxxx1');p2.fill('#acpw2','xxxxxxxx1');p2.click('[data-act=acgo]');p2.wait_for_timeout(500)
    assert 'already exists' in p2.inner_text('#accmsg')
    p2.click('[data-act=acmode]');p2.fill('#acemail','stu@student.det.nsw.edu.au');p2.fill('#acpw','wrongwrong');p2.press('#acpw','Enter');p2.wait_for_timeout(500)
    assert 'not correct' in p2.inner_text('#accmsg'),p2.inner_text('#accmsg')
    p2.fill('#acpw','password123');p2.press('#acpw','Enter');p2.wait_for_timeout(1500)
    assert p2.evaluate("!!(S.u['1']&&S.u['1'].done)"),'progress not merged'
    pg.goto(U+'#/account');pg.wait_for_timeout(300);pg.click('[data-act=acsignout]');pg.wait_for_timeout(800)
    assert pg.evaluate("S.tok===''&&Object.keys(S.u).length===0")
    assert pg.inner_text('.acct')=='Sign in'
    p2.evaluate("S.tok='bad';save()");p2.evaluate("syncNow()");p2.wait_for_timeout(600)
    assert p2.evaluate("S.tok")=='' and 'Sign in again' in p2.inner_text('.acct'),p2.inner_text('.acct')
    pg.goto(U+'#/settings');pg.wait_for_timeout(300);assert 'Practice exams' in pg.inner_text('#app')
    print('logs',logs);print('ALL OK',reqs[:6])
