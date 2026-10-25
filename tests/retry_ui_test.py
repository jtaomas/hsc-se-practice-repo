"""Browser test for retrying mistakes: What's wrong first, red/yellow colours, retry marking, and no retries during an exam.
Every API response is local and mocked; no external request is allowed."""
import copy
import json
import os
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
URL = SITE + '/index.html?archive=1'
TOKEN = 'mock-retry-session'
EMAIL = 'retry@student.det.nsw.edu.au'
storage = {'data': {'u': {}, 'hist': []}, 'revisions': {}}
mark_requests = []
errors = []


def respond(route, body, status=200):
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body))


def route_request(route):
    request = route.request
    url = urlsplit(request.url)
    if url.netloc != urlsplit(SITE).netloc:
        route.abort()
        return
    if url.path == '/api/auth':
        payload = request.post_data_json
        if payload['action'] == 'load':
            return respond(route, dict(copy.deepcopy(storage), email=EMAIL))
        if payload['action'] == 'save':
            for bank in payload['changes']:
                if bank in payload['data']['u']:
                    storage['data']['u'][bank] = copy.deepcopy(payload['data']['u'][bank])
                else:
                    storage['data']['u'].pop(bank, None)
                storage['revisions'][bank] = str(int(storage['revisions'].get(bank, '0')) + 1)
            return respond(route, dict(copy.deepcopy(storage), ok=True))
        return respond(route, {'ok': True})
    if url.path == '/api/class':
        return respond(route, {'configured': False, 'member': False, 'name': '', 'count': 0})
    if url.path == '/api/mark':
        payload = request.post_data_json
        assert request.headers.get('authorization') == 'Bearer ' + TOKEN
        assert payload['bankId'] == '1' and payload['questionNumber'] == 18 and payload['partIndex'] == 0
        mark_requests.append(payload)
        audit = {'requestedModel': 'deepseek-flash', 'returnedModels': ['deepseek-flash'], 'harnessVersion': 'mock', 'questionVersion': 'q', 'rubricVersion': 'r', 'inputDigest': 'ref-' + str(len(mark_requests))}
        if 'salt' in payload['answer']:
            return respond(route, {'status': 'marked', 'mark': 3, 'summary': 'Complete answer.', 'strengths': ['Links unique salts to defeating precomputed tables.'],
                                   'improve': [], 'advice': [], 'criteria': [], 'losses': {'allocation': 'exact', 'totalLost': 0, 'items': []}, 'quality': [], 'audit': audit})
        return respond(route, {'status': 'marked', 'mark': 1, 'summary': 'Hashing is named but not explained.', 'strengths': ['Names hashing.'],
                               'improve': ['Explain why unique salts stop precomputed lookup.'], 'advice': [], 'criteria': [],
                               'losses': {'allocation': 'exact', 'totalLost': 2, 'items': [{'category': 'knowledge_gap', 'marksLost': 2, 'criterionIds': ['C1'], 'evidence': ['it is hashed'],
                                          'explanation': 'The answer never says what a salt does.', 'action': 'Say that a unique salt makes each stored hash different, so precomputed tables fail.'}]},
                               'quality': [], 'audit': audit})
    if url.path.startswith('/api/'):
        errors.append('Unexpected request: ' + request.url)
        return route.abort()
    route.continue_()


def order(page, first, second):
    return page.evaluate("([a,b])=>{var x=document.querySelector(a),y=document.querySelector(b);return !!(x&&y&&(x.compareDocumentPosition(y)&Node.DOCUMENT_POSITION_FOLLOWING))}", [first, second])


with sync_playwright() as p:
    browser = p.chromium.launch(**({'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}))
    page = browser.new_page(viewport={'width': 1300, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/*', route_request)
    page.goto(URL)
    # A submitted Bank 1: Q1 (multiple choice) wrong, Q18 (written) self-marked 1 / 3.
    page.evaluate("""(function(){var bs=BS('1');bs.start=Date.now()-1000;bs.mode='exam';bs.ans['1.0']=0;bs.ans['18.0']='<p>it is hashed</p>';bs.self['18.0']=1;bs.done=true;bs.doneAt=Date.now();bs.checked=1;save('1')})()""")

    # My mistakes: What's wrong leads, the list is red, and a Retry button is offered.
    page.evaluate("location.hash='#/mistakes/1/1.1.0'")
    expect(page.locator('.mk-item.cur')).to_have_class(__import__('re').compile(r'\bbad\b'))
    expect(page.locator('.mk-main .wrongbox')).to_contain_text('What')
    page.evaluate("location.hash='#/mistakes/1/1.18.0'")
    expect(page.locator('.mk-main .wrongbox')).to_be_visible()
    assert order(page, '.mk-main .wrongbox', '.mk-main .yans'), "What's wrong must come before the student's answer"
    page.evaluate("location.hash='#/mistakes/1/1.1.0'")
    page.locator('.mk-main .rtbtn').click()
    expect(page).to_have_url(__import__('re').compile(r'#/1/retry/1\.0/mk$'))

    # Retry page: the exam's own question layout, editable, with no marking guide shown yet.
    expect(page.locator('.rt-tag')).to_have_text('Retry')
    assert page.locator('.guide').count() == 0, 'marking guide shown before checking'
    assert not page.locator('input[data-k="1.0"]').first.is_disabled()
    page.locator('input[data-k="1.0"][data-v="2"]').check()
    page.click('[data-act=rtcheck]')
    expect(page.locator('.rtv.bad')).to_be_visible()
    assert 'Correct answer' not in page.inner_text('#rtp'), 'retry feedback gave away the answer'
    page.locator('input[data-k="1.0"][data-v="1"]').check()
    page.click('[data-act=rtcheck]')
    expect(page.locator('.rtv.rtok')).to_contain_text('Full marks')
    state = page.evaluate("({rt:BS('1').rt.r['1.0'],orig:BS('1').ans['1.0'],g:score(BANKS.filter(function(b){return b.id==='1'})[0],1,0).g})")
    assert state['rt']['full'] and state['orig'] == 0 and state['g'] == 0, state

    # Yellow everywhere once fixed by a retry; the exam mark is unchanged.
    page.click('text=Back to my mistakes')
    expect(page.locator('.mk-item.cur')).to_have_class(__import__('re').compile(r'\brtok\b'))
    expect(page.locator('.rtst.rtok')).to_be_visible()
    expect(page.locator('.mk-badge')).to_have_class(__import__('re').compile(r'\brtok\b'))
    page.evaluate("location.hash='#/1/review/1'")
    expect(page.locator('.nav-elem[data-n="1"]')).to_have_class(__import__('re').compile(r'\brtok\b'))
    expect(page.locator('.guide > h4 .sc')).to_have_class(__import__('re').compile(r'\brtok\b'))
    expect(page.locator('.guide .wrongbox')).to_contain_text('Phased')
    expect(page.locator('.nav-elem[data-n="18"]')).to_have_class(__import__('re').compile(r'\bbad\b'))

    # Written retry with AI marking: the retry answer is sent, What's wrong leads the feedback, then full marks turns it yellow.
    page.evaluate("S.tok='" + TOKEN + "';S.ae='" + EMAIL + "';S.owner='" + EMAIL + "';persist()")
    page.evaluate("location.hash='#/1/review/18'")
    page.locator('.guide .rtbtn').first.click()
    expect(page).to_have_url(__import__('re').compile(r'#/1/retry/18\.0/rv$'))
    # The submitted answer is one small button inside the answer box. It opens below the box, and Restore puts it back as the retry answer.
    expect(page.locator('.rta[data-k="18.0"]')).to_have_text('')
    assert order(page, '.rtb .rto-btn', '.rta[data-k="18.0"]'), 'Original answer button is not in the answer box toolbar'
    assert page.locator('#rto .rto').count() == 0
    page.locator('.rtb .rto-btn').click()
    expect(page.locator('#rto .rto')).to_contain_text('it is hashed')
    expect(page.locator('.rtb .rto-btn')).to_have_attribute('aria-expanded', 'true')
    page.locator('.rta[data-k="18.0"]').click()
    page.keyboard.type('A half-written retry.')
    page.click('[data-act=rtrestore]')
    expect(page.locator('#rto .rto')).to_have_count(0)
    expect(page.locator('.rta[data-k="18.0"]')).to_have_text('it is hashed')
    state = page.evaluate("({a:BS('1').rt.a['18.0'],orig:BS('1').ans['18.0']})")
    assert state == {'a': '<p>it is hashed</p>', 'orig': '<p>it is hashed</p>'}, state
    page.locator('.rta[data-k="18.0"]').click()
    page.keyboard.press('Control+A')
    page.keyboard.press('Delete')
    page.locator('.rta[data-k="18.0"]').click()
    page.keyboard.type('Passwords are hashed.')
    page.click('[data-act=rtcheck]')
    expect(page.locator('.rtv.bad')).to_contain_text('1 / 3')
    expect(page.locator('#rtp .wrongbox')).to_contain_text('never says what a salt does')
    assert order(page, '#rtp .wrongbox', '#rtp .earnbox'), "What's wrong must come before what earned marks"
    assert mark_requests[-1]['answer'] == 'Passwords are hashed.', mark_requests[-1]
    page.locator('.rta[data-k="18.0"]').click()
    page.keyboard.type(' A unique salt per password defeats precomputed tables.')
    page.click('[data-act=rtcheck]')
    expect(page.locator('.rtv.rtok')).to_be_visible()
    state = page.evaluate("({full:BS('1').rt.r['18.0'].full,orig:BS('1').ans['18.0'],self:BS('1').self['18.0']})")
    assert state == {'full': True, 'orig': '<p>it is hashed</p>', 'self': 1}, state
    page.click('text=Back to the paper')
    expect(page.locator('.nav-elem[data-n="18"]')).to_have_class(__import__('re').compile(r'\brtok\b'))

    # No retries during an exam, even after choosing Continue anyway.
    # Archived banks never count as an exam in progress, so sit a current paper.
    page.evaluate("(function(){var bs=BS('11');bs.start=Date.now();bs.mode='exam';bs.done=false;save('11')})()")
    page.evaluate("location.hash='#/1/retry/1.0'")
    expect(page.locator('.lockbox')).to_be_visible()
    page.click('[data-act=examgo]')
    expect(page.locator('.pg')).to_contain_text('not available while you are sitting an exam')
    assert page.locator('input[data-k="1.0"]').count() == 0
    page.evaluate("location.hash='#/mistakes/1/1.18.0'")
    expect(page.locator('.mk-main')).to_be_visible()
    assert page.locator('.rtbtn').count() == 0, 'retry offered during an exam'
    page.evaluate("location.hash='#/1/review/18'")
    expect(page.locator('.guide').first).to_be_visible()
    assert page.locator('.rtbtn').count() == 0, 'retry offered in review during an exam'
    page.evaluate("(function(){delete S.u['11'];save('11')})()")
    browser.close()

assert not errors, errors
print('RETRY UI OK: what is wrong first, red and yellow colours, closed and AI-marked retries, exam mark unchanged, no retries during an exam')
