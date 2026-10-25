"""Class page in a real browser, with a mocked /api/class. No network."""
import json, os
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
errors, calls = [], []
state = {'member': False}
ANSWERS = {'bankId': '8', 'members': 2, 'submitted': [{'name': 'Priya', 'mine': False}, {'name': 'You', 'mine': True}],
           'parts': {'17.0': [{'id': 'a', 'name': 'Priya', 'mine': False, 'text': 'Agile <b>sprints</b> allow quick feedback.'}, {'id': 'b', 'name': 'Sam', 'mine': True, 'text': 'Waterfall is linear and suits fixed scope.'}]}}
RESULT = {'status': 'ready', 'names': {'A': 'Priya', 'B': 'You'}, 'count': 2, 'keyword': {'word': 'evaluate', 'meaning': 'Make a judgement based on criteria.'}, 'targetWords': 270,
          'result': {'directive': 'Evaluate means make a judgement using criteria.', 'missed': ['Cost of rework'], 'combined': 'Agile supports frequent feedback while waterfall suits fixed scope.',
                     'mainPoints': [{'point': 'Agile gives quick feedback', 'syllabus': 'Agile approach', 'answersQuestion': 'yes', 'why': 'Directly relevant.', 'madeBy': ['A'], 'quotes': [{'who': 'A', 'text': 'quick feedback'}]}]}}

def route(r):
    url = urlsplit(r.request.url)
    if url.netloc != urlsplit(SITE).netloc: return r.abort()
    if url.path == '/api/class':
        p = r.request.post_data_json; calls.append(p['action']); a = p['action']
        def ok(j): r.fulfill(status=200, content_type='application/json', body=json.dumps(j))
        if a == 'status': return ok({'configured': True, 'member': state['member'], 'name': 'Sam', 'count': 2})
        if a == 'join':
            if p['code'] != 'good-code': return r.fulfill(status=400, content_type='application/json', body=json.dumps({'code': 'bad_code', 'error': 'That class code is not right.'}))
            state['member'] = True; return ok({'ok': True, 'name': p['name']})
        if a == 'roster': return ok({'admin': True, 'members': [{'id': 'a'*64, 'name': 'Sam', 'photo': '', 'mine': True, 'joined': 1}, {'id': 'b'*64, 'name': 'Priya', 'photo': '', 'mine': False, 'joined': 2}]})
        if a == 'setphoto': return ok({'ok': True, 'photo': p['photo']})
        if a == 'overview': return ok({'members': 2, 'counts': {'8': 2}})
        if a == 'answers': return ok(ANSWERS)
        if a == 'analyse': return ok(RESULT)
    if url.path.startswith('/api/'): return r.fulfill(status=404, content_type='application/json', body='{}')
    r.continue_()

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROME'))
    ctx = browser.new_context(viewport={'width': 1200, 'height': 900})
    if os.environ.get('ACE_DIR'): ctx.add_init_script("window.ACEBASE='/__ace__/';")
    ctx.route('**/*', route)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(SITE + '/#/class')
    expect(page.locator('#cvroot')).to_contain_text('Sign in to see your class')
    page.evaluate("S.tok='t';S.ae='sam@example.test';S.owner='sam@example.test';persist()")
    page.goto(SITE + '/#/papers'); page.goto(SITE + '/#/class'); page.reload()
    page.evaluate("S.tok='t';S.ae='sam@example.test';S.owner='sam@example.test'"); page.evaluate("render()")
    expect(page.locator('#cvroot')).to_contain_text('Join your class')
    page.fill('#cvname', 'Sam'); page.fill('#cvcode', 'wrong'); page.click('[data-cv=join]')
    expect(page.locator('#cvroot')).to_contain_text('not right')
    page.fill('#cvcode', 'good-code'); page.click('[data-cv=join]')
    expect(page.locator('#cvroot')).to_contain_text('You are in the class as')
    expect(page.locator('.cv-person')).to_have_count(2)
    expect(page.locator('.cv-person').nth(1)).to_contain_text('Priya')
    assert page.locator('[data-cv=photo]').count() == 2, 'admin sees Change photo on everyone'
    page.click('a[href="#/class/8/1"]')
    expect(page.locator('#qarea .qt')).to_contain_text('Question 1 ')
    assert page.locator('.nav-bar .nav-elem').count() > 5, 'question navigator'
    assert page.locator('.tools').count() == 1 and page.locator('.band').count() == 0, 'one tools bar, not a second band above the navigator'
    page.click('.nav-elem[data-n="17"]')
    expect(page.locator('#qarea .qt')).to_contain_text('Question 17 ')
    expect(page.locator('.cvans').first).to_contain_text('Priya')
    assert page.locator('.cvtxt b').count() == 0, 'answers must be escaped'
    expect(page.locator('.cvagg').first).to_contain_text('Class model answer')
    page.click('[data-cv=toggle]')
    expect(page.locator('.cvans')).to_have_count(0)
    page.click('[data-cv=toggle]')
    page.click('[data-cv=analyse]')
    expect(page.locator('.cvres')).to_contain_text('Agile gives quick feedback')
    expect(page.locator('.cvres')).to_contain_text('Made by Priya')
    expect(page.locator('.cvbest')).to_contain_text('Agile supports frequent feedback')
    page.set_viewport_size({'width': 390, 'height': 800})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), 'no sideways scroll on a phone'
    browser.close()
assert not errors, errors
print('CLASS UI OK: sign-in gate, join with wrong then right code, escaped answers, analysis rendering, phone width')
