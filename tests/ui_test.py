import json,re,hashlib,copy
from playwright.sync_api import sync_playwright
logs=[];store={'users':{},'prog':{}};reqs=[]
def auth(r):
    p=json.loads(r.request.post_data);reqs.append(p['action']);h=r.request.headers
    def out(c,j): r.fulfill(status=c,content_type='application/json',body=json.dumps(j))
    a=p['action']
    if a=='signup':
        if p['email'] in store['users']: return out(409,{'error':'An account with this email already exists. Sign in instead.'})
        store['users'][p['email']]=hashlib.sha256(p['password'].encode()).hexdigest();return out(200,{'token':'T:'+p['email'],'email':p['email']})
    if a=='login':
        if store['users'].get(p['email'])!=hashlib.sha256(p['password'].encode()).hexdigest(): return out(401,{'error':'The email or password is not correct.'})
        return out(200,{'token':'T:'+p['email'],'email':p['email']})
    tok=h.get('authorization','').replace('Bearer ','')
    if not tok.startswith('T:') : return out(401,{'error':'Your sign-in has expired. Sign in again.'})
    revisions=store.setdefault('revisions',{}).setdefault(tok,{})
    if a=='load': return out(200,{'email':tok[2:],'data':store['prog'].get(tok),'revisions':revisions})
    if a=='save':
        current=store['prog'].setdefault(tok,{'u':{},'hist':[]})
        clashes=[i for i in p['changes'] if p['revisions'].get(i)!=revisions.get(i)]
        if clashes: return out(409,{'code':'progress_conflict','error':'Paper changed on another device.','conflicts':clashes,'data':current,'revisions':revisions})
        for i in p['changes']:
            if i in p['data']['u']: current['u'][i]=copy.deepcopy(p['data']['u'][i])
            else: current['u'].pop(i,None)
            revisions[i]=str(int(revisions.get(i,'0'))+1)
        current['hist']=p['data'].get('hist',[])
        return out(200,{'ok':True,'data':current,'revisions':revisions})
import os
U=os.environ.get("SITE","http://localhost:8767")+"/index.html"
with sync_playwright() as p:
    b=p.chromium.launch(**({'executable_path':os.environ['CHROME']} if os.environ.get('CHROME') else {})); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page()
    pg.on("pageerror",lambda e: logs.append(f"PAGEERROR: {e}"))
    pg.on("console",lambda m: logs.append(m.text) if m.type=='error' and 'ERR_FAILED' not in m.text else None)
    pg.route("https://fonts.g*/**",lambda r:r.abort())
    if os.environ.get('ACE_DIR'): pg.add_init_script("window.ACEBASE='/__ace__/';")
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
    if os.environ.get('ACE_DIR'):
        pg.goto(U+'#/1/q/19');pg.wait_for_selector('.cedit.ace-on',timeout=15000)
        k=pg.get_attribute('textarea[data-code]','data-k')
        pg.click('.cedit-ed .ace_content');pg.keyboard.press('Control+A');pg.keyboard.type('print(7)')
        pg.wait_for_timeout(300)
        assert 'print(7)' in pg.evaluate("BS('1').ans['"+k+"']"),'Ace typing was not saved'
        assert pg.input_value('textarea[data-code]')=='print(7)'
    pg.click('.hxb[href="#/1/finish"]');pg.wait_for_timeout(300)
    assert 'Unanswered' in pg.inner_text('.pg')
    pg.click('[data-act=submit]');pg.wait_for_timeout(800)
    assert 'results' in pg.url and pg.inner_text('.big').count('/')==1,pg.inner_text('.big')
    pg.goto(U+'#/1/q/15');pg.wait_for_timeout(200)
    assert pg.get_attribute('.rta','contenteditable')=='false','submitted answer is editable through an old route'
    pg.goto(U+'#/1/q/19');pg.wait_for_timeout(200)
    before=pg.input_value('textarea[data-code]');pg.press('textarea[data-code]','Tab',force=True) if not os.environ.get('ACE_DIR') else None
    if os.environ.get('ACE_DIR'):
        pg.wait_for_selector('.cedit.ace-on',timeout=15000)
        assert pg.evaluate("Object.values(ACE_ED).every(function(e){return e.getReadOnly()})"),'submitted Python editor is not read-only'
        pg.click('.cedit-ed .ace_content');pg.keyboard.press('Tab');pg.keyboard.type('zzz')
        assert pg.evaluate("Object.values(ACE_ED).every(function(e){return e.getValue().indexOf('zzz')<0})"),'Ace edited submitted Python'
    assert pg.input_value('textarea[data-code]')==before,'Tab edited submitted Python'
    assert pg.evaluate("passTest('110',{o:'10'})") is False
    assert pg.evaluate("passTest('9990',{o:'0'})") is False
    assert pg.evaluate("passTest('10\\n',{o:'10'})") is True
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
    assert not logs,logs
    print('ALL OK: modes, submitted-paper lock, exact output checks, signup, login and sync')
