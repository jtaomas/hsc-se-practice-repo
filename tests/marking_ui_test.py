"""Real-browser marking UI regressions; every API response is local and mocked."""
import copy
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
URL = SITE + '/index.html?archive=1'
EMAIL = 'marking@student.det.nsw.edu.au'
TOKEN = 'mock-marking-session'
storage = {'data': {'u': {}, 'hist': []}, 'revisions': {}}
mark_requests = []
page_errors = []
unexpected_requests = []
artifact_dir = os.environ.get('MARKING_UI_ARTIFACTS')


def respond(route, body, status=200):
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body))


def route_request(route):
    request = route.request
    url = urlsplit(request.url)
    # No external request is permitted, including provider APIs and CDN assets.
    if url.netloc != urlsplit(SITE).netloc:
        route.abort()
        return
    if url.path == '/api/auth':
        payload = request.post_data_json
        action = payload['action']
        if action == 'login':
            assert payload['email'] == EMAIL
            respond(route, {'token': TOKEN, 'email': EMAIL})
            return
        assert request.headers.get('authorization') == 'Bearer ' + TOKEN
        if action == 'load':
            respond(route, dict(copy.deepcopy(storage), email=EMAIL))
            return
        if action == 'save':
            for bank in payload['changes']:
                assert payload['revisions'].get(bank) == storage['revisions'].get(bank)
                if bank in payload['data']['u']:
                    storage['data']['u'][bank] = copy.deepcopy(payload['data']['u'][bank])
                else:
                    storage['data']['u'].pop(bank, None)
                storage['revisions'][bank] = str(int(storage['revisions'].get(bank, '0')) + 1)
            storage['data']['hist'] = copy.deepcopy(payload['data'].get('hist', []))
            respond(route, dict(copy.deepcopy(storage), ok=True))
            return
        unexpected_requests.append('Unexpected auth action: ' + str(action))
        respond(route, {'error': 'Unexpected test action'}, 400)
        return
    if url.path == '/api/mark':
        payload = request.post_data_json
        assert request.method == 'POST'
        assert request.headers.get('authorization') == 'Bearer ' + TOKEN
        assert set(payload) == {'bankId', 'questionNumber', 'partIndex', 'answer'}
        assert payload['bankId'] in ('1', 'formats') and payload['partIndex'] == 0
        if payload['bankId'] == 'formats':
            assert payload['questionNumber'] == 3
            assert isinstance(payload['answer'], dict)
            assert len(payload['answer']) == 12
            assert payload['answer']['0,0'] == '2500'
        else:
            assert payload['questionNumber'] in (18, 20)
            assert isinstance(payload['answer'], str)
        mark_requests.append(copy.deepcopy(payload))
        audit = {
            'requestedModel': 'deepseek-flash',
            'returnedModels': ['deepseek-flash', 'deepseek-flash'],
            'harnessVersion': 'mock-blind-marking-v1',
            'questionVersion': 'mock-question-v1',
            'rubricVersion': 'mock-rubric-v1',
            'inputDigest': 'mock-answer-reference-' + str(payload['questionNumber']),
        }
        if payload['bankId'] == 'formats':
            respond(route, {
                'status': 'marked', 'mark': 3, 'summary': 'The table covers the branches and boundaries.',
                'strengths': ['Correct input and output pairs.'], 'improve': [], 'advice': [],
                'criteria': [], 'audit': audit,
            })
        elif payload['questionNumber'] == 18:
            respond(route, {
                'status': 'marked', 'mark': 2,
                'summary': 'Hashing is explained; the salt needs a clearer security link.',
                'strengths': ['Explains that hashing is one-way.'],
                'improve': ['Explain why unique salts prevent precomputed lookup.'],
                'advice': ['Use a concrete password example when revising.'],
                'criteria': [{'id': 'C1', 'assessment': 'partial',
                              'evidence': ['Hashing produces a one-way value.'],
                              'basis': 'The salt protection link is incomplete.'}],
                'audit': audit,
            })
        else:
            respond(route, {
                'status': 'needs_review', 'mark': None,
                'summary': 'The assessors could not establish a reliable agreed mark.',
                'strengths': [], 'improve': [], 'advice': [], 'criteria': [], 'audit': audit,
            })
        return
    if url.path.startswith('/api/'):
        unexpected_requests.append(request.method + ' ' + url.path)
        respond(route, {'error': 'Unmocked API is forbidden'}, 500)
        return
    route.continue_()


def capture(page, name):
    if artifact_dir:
        destination = Path(artifact_dir)
        destination.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(destination / name), full_page=True)


with sync_playwright() as playwright:
    options = {'executable_path': os.environ['CHROME']} if os.environ.get('CHROME') else {}
    browser = playwright.chromium.launch(**options)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('**/*', route_request)
    if os.environ.get('ACE_DIR'):
        context.add_init_script("window.ACEBASE='/__ace__/';")
    page = context.new_page()
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    page.goto(URL + '#/account')
    page.fill('#acemail', EMAIL)
    page.fill('#acpw', 'mock-only-password')
    page.click('[data-act=acgo]')
    page.wait_for_function('S.tok === "mock-marking-session" && !ACC.busy')
    expect(page.locator('.acct')).to_contain_text(EMAIL)
    paper_count = page.evaluate('BANKS.filter(function(bank){return !bank.hidden}).length')

    # Use actual question editors and submission handlers, rather than seeding answer state.
    page.goto(URL + '#/1')
    page.click('[data-mode=practice]')
    page.goto(URL + '#/1/q/18')
    page.locator('.rta').fill('Hashing produces a one-way value. A salt is added to a password.')
    page.goto(URL + '#/1/q/20')
    page.locator('.rta').fill('HTTPS protects communication using encryption and certificates.')
    page.click('.hxb[href="#/1/finish"]')
    expect(page.locator('.feature')).to_contain_text('to DeepSeek')
    page.click('[data-act=submit]')
    page.wait_for_function("BS('1').ai['18.0'] && BS('1').ai['20.0'] && !AIRUN['1']")
    expect(page.locator('.big')).to_have_text('2 / 77')
    expect(page.locator('.feature').first).to_contain_text('3 of 80 marks remain unscored')
    expect(page.locator('#aib')).to_contain_text('1 answer need review')
    assert len(mark_requests) == 2
    assert {request['questionNumber'] for request in mark_requests} == {18, 20}
    capture(page, 'marking-results.png')

    # Agreed marks expose separate improvement/advice and the evidence/provenance drawers.
    page.goto(URL + '#/1/review/18')
    marking = page.locator('.guide .aib')
    expect(marking.locator('h5')).to_contain_text('2 / 3')
    expect(marking).to_contain_text('How to gain more marks')
    expect(marking).to_contain_text('Further advice (not a mark deduction)')
    expect(marking).to_contain_text('Use a concrete password example when revising.')
    marking.get_by_text('Criterion evidence', exact=True).click()
    expect(marking).to_contain_text('C1: partial')
    expect(marking).to_contain_text('The salt protection link is incomplete.')
    marking.get_by_text('Marking provenance', exact=True).click()
    expect(marking).to_contain_text('Requested model: deepseek-flash')
    expect(marking).to_contain_text('mock-blind-marking-v1')
    expect(marking).to_contain_text('mock-rubric-v1')
    expect(marking).to_contain_text('mock-answer-reference-18')
    capture(page, 'marking-agreed-feedback.png')

    # The old exam URL remains locked after submission, including its input-event handler.
    original_answer = page.evaluate("BS('1').ans['18.0']")
    page.goto(URL + '#/1/q/18')
    expect(page.locator('.rta')).to_have_attribute('contenteditable', 'false')
    page.locator('.rta').evaluate("element => { element.innerHTML = 'Attempted edit'; element.dispatchEvent(new Event('input', {bubbles: true})); }")
    assert page.evaluate("BS('1').ans['18.0']") == original_answer

    # Abstentions remain unscored, offer no retry/re-mark button, and are absent from mistakes.
    page.goto(URL + '#/1/review/20')
    marking = page.locator('.guide .aib')
    expect(marking.locator('h5')).to_have_text('Needs review — no AI mark awarded')
    expect(page.locator('.guide > h4 .sc')).to_have_text('Unscored')
    assert marking.locator('[data-act=airetry], [data-act=airemark]').count() == 0
    assert page.evaluate("aiTodo(BANKS[0]).length") == 0
    capture(page, 'marking-needs-review.png')
    page.goto(URL + '#/mistakes/1')
    headers = page.locator('.mcard header > b').all_text_contents()
    assert any('Question 18' in header for header in headers)
    assert all('Question 20' not in header for header in headers)

    # Reloading and navigating never turn an abstention into another paid marking attempt.
    page.goto(URL + '#/1/results')
    page.wait_for_function('Object.keys(S.pending).length === 0')
    page.reload()
    expect(page.locator('.big')).to_have_text('2 / 77')
    expect(page.locator('#aib')).to_contain_text('need review')
    assert len(mark_requests) == 2

    # Self-mark redraws destroy the old Ace instance and keep the submitted editor locked.
    if os.environ.get('ACE_DIR'):
        page.goto(URL + '#/1/review/19')
        page.wait_for_selector('.cedit.ace-on', timeout=15000)
        assert page.evaluate("ACE_ED['19.0'].getReadOnly()")
        page.evaluate("() => { window.testAceDestroyed = 0; var oldEditor = ACE_ED['19.0'], oldDestroy = oldEditor.destroy; oldEditor.destroy = function(){ window.testAceDestroyed++; return oldDestroy.apply(this, arguments); }; }")
        page.locator('[data-act=sm][data-k="19.0"][data-v="0"]').click()
        page.wait_for_selector('.cedit.ace-on', timeout=15000)
        assert page.evaluate('window.testAceDestroyed') == 1
        assert page.evaluate("ACE_ED['19.0'].getReadOnly()")
        page.goto(URL + '#/1/results')
        expect(page.locator('.big')).to_have_text('2 / 77')
        assert page.evaluate('Object.keys(ACE_ED).length') == 0
        assert len(mark_requests) == 2

    # Restart archives assessed marks and explicitly retains the three unscored marks.
    page.goto(URL + '#/1')
    page.once('dialog', lambda dialog: dialog.accept())
    page.click('[data-act=restart]')
    page.wait_for_function('S.hist.length === 1')
    assert page.evaluate('({T:S.hist[0].T,M:S.hist[0].M,pending:S.hist[0].pending})') == {'T': 2, 'M': 77, 'pending': 3}
    page.goto(URL + '#/papers')
    history = page.locator('table.res').last
    expect(history).to_contain_text('2 / 77')
    expect(history).to_contain_text('3 marks unscored')
    capture(page, 'marking-history.png')
    assert len(mark_requests) == 2

    # The incoming authoring demo remains hidden, and its closed types never reach the AI API.
    expect(page.locator('.feature').first).to_contain_text(f'0 of {paper_count} papers finished')
    assert page.locator('a[href="#/formats"]').count() == 0
    page.goto(URL + '#/formats')
    page.click('[data-mode=practice]')
    order = page.evaluate("(() => { var it = CUR.b.qs[0].it[0]; return odSlots(it).map(text => it.pool.indexOf(text)); })()")
    for slot, chip in enumerate(order):
        page.locator(f'.pool .chip[data-ci="{chip}"]').click()
        page.locator(f'.dslot[data-s="{slot}"]').click()
    assert page.evaluate("score(CUR.b, 1, 0).g") == 2
    page.goto(URL + '#/formats/q/2')
    for slot in range(4):
        page.locator(f'.pool .chip[data-ci="{slot}"]').click()
        page.locator(f'.dslot[data-s="{slot}"]').click()
    assert page.evaluate("score(CUR.b, 2, 0).g") == 1
    page.goto(URL + '#/formats/q/3')
    cells = [
        ['2500', '15', 'Above 2000, tests the first branch'],
        ['2000', '9', 'Upper boundary of the middle branch'],
        ['501', '9', 'Just above the lower boundary'],
        ['500', '5', 'Boundary goes to the ELSE branch'],
    ]
    for row, values in enumerate(cells):
        for column, value in enumerate(values):
            page.locator(f'.fti[data-c="{row},{column}"]').fill(value)
    page.click('.hxb[href="#/formats/finish"]')
    page.click('[data-act=submit]')
    page.wait_for_function("BS('formats').ai['3.0'] && !AIRUN.formats")
    expect(page.locator('.big')).to_have_text('6 / 17')
    assert len(mark_requests) == 3
    assert mark_requests[-1]['bankId'] == 'formats'
    page.goto(URL + '#/formats/review/3')
    expect(page.locator('.guide .aib h5')).to_contain_text('3 / 3')
    expect(page.locator('.guide .ftab')).to_contain_text('2500')
    page.goto(URL + '#/formats/q/3')
    cell = page.locator('.fti[data-c="0,0"]')
    expect(cell).to_have_attribute('readonly', '')
    cell.evaluate("element => { element.readOnly = false; element.value = 'Attempted edit'; element.dispatchEvent(new Event('input', {bubbles: true})); }")
    assert page.evaluate("BS('formats').ans['3.0']['0,0']") == '2500'
    page.goto(URL + '#/formats/q/1')
    assert page.locator('.chip:not([disabled])').count() == 0
    original_order = page.evaluate("BS('formats').ans['1.0']")
    page.evaluate("dzPlace('1.0', '0', 999, null); dzRemove('1.0', '1')")
    assert page.evaluate("BS('formats').ans['1.0']") == original_order
    page.goto(URL + '#/papers')
    expect(page.locator('.feature').first).to_contain_text(f'0 of {paper_count} papers finished')
    assert page.locator('a[href="#/formats"]').count() == 0
    page.goto(URL + '#/mistakes')
    assert all('Question formats' not in heading for heading in page.locator('.mcard header > b').all_text_contents())
    assert len(mark_requests) == 3
    assert not page_errors, page_errors
    assert not unexpected_requests, unexpected_requests
    context.close()
    browser.close()
    print('MARKING UI OK: authenticated canonical requests, agreed feedback/advice/provenance, terminal abstention, unscored totals/history, reload persistence, hidden formats, closed drag questions, typed-table payloads and submission locks')
