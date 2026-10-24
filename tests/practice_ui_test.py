"""Review hub, practice-mode question marking, exam lock and class panel in review. Every API call is mocked."""
import json, os
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
errors, marks, class_calls = [], [], []
ANSWERS = {'bankId': '8', 'members': 2, 'submitted': [{'name': 'Priya', 'mine': False}, {'name': 'Sam', 'mine': True}],
           'parts': {'17.0': [{'id': 'a', 'name': 'Priya', 'mine': False, 'text': 'Agile uses short sprints and feedback.'}, {'id': 'b', 'name': 'Sam', 'mine': True, 'text': 'Waterfall is linear.'}]}}

def ok(r, j, status=200): r.fulfill(status=status, content_type='application/json', body=json.dumps(j))

def route(r):
    url = urlsplit(r.request.url)
    if url.netloc != urlsplit(SITE).netloc: return r.abort()
    if url.path == '/api/mark':
        p = r.request.post_data_json; marks.append(p)
        return ok(r, {'status': 'marked', 'mark': 2, 'summary': 'Clear and relevant.', 'strengths': ['Names the methodology.'], 'improve': ['Link it to the scenario.'], 'advice': [], 'criteria': [], 'audit': {}})
    if url.path == '/api/class':
        p = r.request.post_data_json; class_calls.append(p['action'])
        if p['action'] == 'status': return ok(r, {'configured': True, 'member': True, 'name': 'Sam', 'count': 2})
        if p['action'] == 'overview': return ok(r, {'members': 2, 'counts': {'8': 2}})
        if p['action'] == 'answers': return ok(r, ANSWERS)
        return ok(r, {'error': 'unexpected'}, 400)
    if url.path.startswith('/api/'): return ok(r, {'error': 'none'}, 404)
    r.continue_()

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get('CHROME'))
    ctx = browser.new_context(viewport={'width': 1200, 'height': 900})
    if os.environ.get('ACE_DIR'): ctx.add_init_script("window.ACEBASE='/__ace__/';")
    ctx.route('**/*', route)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(SITE + '/')
    page.evaluate("S.tok='t';S.ae='sam@example.test';S.owner='sam@example.test';persist()")

    # Review hub: pick a paper and land directly in review, question 1.
    page.goto(SITE + '/#/'); page.reload()
    expect(page.locator('.pg').first).to_contain_text('Review and analyse')
    page.click('a[href="#/review"]')
    expect(page.locator('.bks')).to_contain_text('Not attempted')
    page.click('.bks a[href="#/8/review/1"]')
    expect(page).to_have_url(SITE + '/#/8/review/1')
    expect(page.locator('.guide').first).to_be_visible()
    assert page.locator('.hdr').inner_text().startswith('Review: ') or 'Review' in page.locator('.hdr').inner_text()

    # Practice mode: mark one question and get feedback straight away.
    page.goto(SITE + '/#/8'); page.click('[data-mode=practice]')
    expect(page).to_have_url(SITE + '/#/8/q/1')
    assert page.locator('.guide').count() == 0, 'no marking guide before marking'
    page.evaluate("BS('8').ans['17.0']='<p>Agile suits changing requirements because teams deliver in short sprints and the client reviews each increment.</p>';save('8')")
    page.goto(SITE + '/#/8/q/17'); page.reload()
    expect(page.locator('#pq')).to_contain_text('Mark this question')
    assert page.locator('.guide').count() == 0
    page.click('[data-act=pqmark]')
    expect(page.locator('.guide .sc').first).to_be_visible()
    expect(page.locator('.guide')).to_contain_text('Names the methodology.')
    expect(page.locator('.guide')).to_contain_text('Sample answer')
    assert len(marks) == 1 and marks[0]['questionNumber'] == 17 and marks[0]['bankId'] == '8'
    assert page.locator('.rta').get_attribute('contenteditable') == 'true', 'practice answers stay editable'
    assert page.evaluate("BS('8').done") is False
    # Class answers sit under the written part and are shared in practice mode too.
    expect(page.locator('.cvslot')).to_contain_text('Class answers')
    page.click('.cvslot [data-cv=toggle]')
    expect(page.locator('.cvslot .cvans').first).to_contain_text('Priya')
    # Another question is untouched.
    page.goto(SITE + '/#/8/q/18')
    assert page.locator('.guide').count() == 0

    # Exam lock: nothing is visible while an exam runs.
    page.goto(SITE + '/#/9'); page.click('[data-mode=exam]')
    expect(page).to_have_url(SITE + '/#/9/q/1')
    for route_hash in ['#/class', '#/review', '#/8/review/1', '#/mistakes', '#/8/results']:
        page.goto(SITE + '/' + route_hash)
        expect(page.locator('.pg')).to_contain_text('Exam in progress')
    n = len(class_calls)
    page.click('text=Return to the exam')
    expect(page).to_have_url(SITE + '/#/9/q/1')
    # Time up (or submitted): everything unlocks.
    page.evaluate("BS('9').start=Date.now()-1000*60*60*5;save('9')")
    page.goto(SITE + '/#/review')
    expect(page.locator('.pg')).to_contain_text('Review and analyse')
    assert not errors, errors
    browser.close()
print('PRACTICE UI OK: review hub opens review directly, per-question practice marking with immediate feedback, class panel in practice, exam lock and unlock')
