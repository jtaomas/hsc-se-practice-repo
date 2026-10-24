"""Comparison workflow in a real browser. All account/comparison/provider traffic is mocked."""
import copy
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
URL = SITE + '/index.html'
TOKEN = 'mock-comparison-session'
EMAIL = 'comparison@student.det.nsw.edu.au'
storage = {'data': {'u': {}, 'hist': []}, 'revisions': {}}
requests = []
page_errors = []
unexpected_requests = []
comparison_mode = 'complete'
held_routes = []
artifact_dir = os.environ.get('COMPARISON_UI_ARTIFACTS')


def package(identifier):
    return {'snapshot': {'participantId': identifier, 'bankId': '1', 'parts': []}, 'signature': 'signed-test-' + identifier}


def upload(identifier):
    return {'name': 'private-name-' + identifier + '.json', 'mimeType': 'application/json', 'buffer': json.dumps(package(identifier)).encode()}


def report(status='complete'):
    evidence = [{'participantId': 'p1', 'questionId': '18.0', 'criterionId': 'c1', 'source': 'answer', 'quote': 'Hashing is one-way. <img src=x onerror=alert(1)>'}]
    return {
        'status': status, 'summary': 'Explain causal security links; preserve relevant technical detail.',
        'profiles': [{'participantId': 'p1', 'findings': [
            {'id': 'f1', 'kind': 'strength', 'category': 'technical_accuracy', 'errorType': None, 'scope': 'single_response', 'statement': 'Correctly distinguishes a one-way hash.', 'action': 'Keep this precise term when discussing password storage.', 'evidence': evidence},
            {'id': 'f2', 'kind': 'criterion_shortfall', 'category': 'reasoning_explanation', 'errorType': 'unsupported_claim', 'scope': 'single_response', 'statement': 'The salt claim needs a security link.', 'action': 'Explain why a unique salt defeats precomputed lookup.', 'evidence': evidence},
            {'id': 'f3', 'kind': 'optional_advice', 'category': 'response_concision', 'errorType': 'irrelevant_repetition', 'scope': 'single_response', 'statement': 'Repeated wording can be shortened without removing the explanation.', 'action': 'Combine the repeated sentence, keeping the mechanism and its consequence.', 'evidence': evidence},
        ]}] if status == 'complete' else [],
        'comparisons': [{'id': 'c1', 'category': 'context_application', 'statement': 'The two responses apply the scenario at different levels of detail.', 'action': 'Both students should connect one named control to one scenario-specific threat.', 'evidence': evidence + [{'participantId': 'p2', 'questionId': '18.0', 'criterionId': 'c1', 'source': 'feedback', 'quote': 'Links unique salts to precomputed lookup resistance.'}]}] if status == 'complete' else [],
        'statistics': {'scope': 'common_verified_parts', 'commonPartIds': ['1.0', '18.0'], 'commonMaxMarks': 4,
                       'participants': [{'participantId': 'p1', 'earned': 3, 'maxMarks': 4, 'percentage': 75, 'includedParts': 2, 'excludedParts': 31, 'totalParts': 33}, {'participantId': 'p2', 'earned': 2, 'maxMarks': 4, 'percentage': 50, 'includedParts': 2, 'excludedParts': 31, 'totalParts': 33}],
                       'byTopic': [{'topic': 'Secure Software Architecture', 'maxMarks': 4, 'scores': [{'participantId': 'p1', 'earned': 3}, {'participantId': 'p2', 'earned': 2}]}],
                       'limitations': ['Only common verified question parts are compared. Diagram and self-assigned marks are excluded.']},
        'audit': {'requestedModel': 'deepseek-flash', 'returnedModels': ['deepseek-flash'], 'harnessVersion': 'mock-comparison-v1', 'checks': {'evidenceSupported': status == 'complete', 'auditorApproved': status == 'complete'}, 'reasons': []},
    }


def respond(route, body, status=200):
    route.fulfill(status=status, content_type='application/json', body=json.dumps(body))


def route_request(route):
    request = route.request
    parsed = urlsplit(request.url)
    if parsed.netloc != urlsplit(SITE).netloc:
        route.abort()
        return
    if parsed.path == '/api/auth':
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
            respond(route, dict(copy.deepcopy(storage), ok=True))
            return
    if parsed.path == '/api/compare':
        payload = request.post_data_json
        assert request.headers.get('authorization') == 'Bearer ' + TOKEN
        requests.append(copy.deepcopy(payload))
        if payload['action'] == 'export':
            assert set(payload) == {'action', 'bankId', 'parts'}
            assert storage['data']['u']['1']['done'], 'Export must await saving the submitted account paper'
            assert any(p.get('answer') == 'Hashing is one-way.' and p.get('markingDigest') == 'verified-answer-18' for p in payload['parts'])
            assert all(set(p) <= {'questionNumber', 'partIndex', 'answer', 'markingDigest'} for p in payload['parts'])
            respond(route, {'export': package('first')})
            return
        assert payload == {'action': 'compare', 'exports': [package('first'), package('second')]}
        if comparison_mode == 'hold':
            held_routes.append(route)
        elif comparison_mode == 'fail':
            respond(route, {'error': 'Mock temporary provider failure. Try again.'}, 503)
        else:
            respond(route, report(comparison_mode))
        return
    if parsed.path.startswith('/api/'):
        unexpected_requests.append(request.method + ' ' + parsed.path)
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
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
    context.route('**/*', route_request)
    page = context.new_page()
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    page.goto(URL + '#/compare')
    expect(page.locator('.comparison-page')).to_contain_text('Sign in to export your work')
    assert page.locator('#comparison-files').count() == 0
    page.goto(URL + '#/account')
    page.fill('#acemail', EMAIL)
    page.fill('#acpw', 'mock-only-password')
    page.click('[data-act=acgo]')
    page.wait_for_function('S.tok === "mock-comparison-session" && !ACC.busy')
    # Sign-in sync finishes with a home redirect after ACC.busy is cleared.
    page.wait_for_url(URL + '#/')
    page.goto(URL + '#/compare')
    expect(page.locator('.comparison-page')).to_contain_text('No submitted papers')

    # Existing marking-flow tests produce records end to end; here seed its exact current contract.
    page.evaluate("""() => {
        var b=BANKS[0],bs=BS(b.id);bs.done=true;bs.start=100;bs.doneAt=200;
        bs.ans['1.0']=0;bs.ans['18.0']='<p>Hashing is one-way.</p>';
        bs.ai['18.0']={status:'marked',g:2,stamp:aiStamp(b,18,0),audit:{inputDigest:'verified-answer-18'},fb:{summary:'Explain why the salt helps.'}};
        save(b.id);render();
    }""")
    expect(page.locator('#comparison-export')).to_be_disabled()
    page.check('#comparison-export-consent')
    with page.expect_download() as downloading:
        page.click('#comparison-export')
    downloaded = downloading.value
    assert json.loads(Path(downloaded.path()).read_text()) == package('first')
    expect(page.locator('#comparison-status')).to_contain_text('Evidence downloaded')
    expect(page.locator('#comparison-export-consent')).not_to_be_checked()
    assert requests[0]['action'] == 'export'
    capture(page, 'comparison-export.png')

    page.set_input_files('#comparison-files', [upload('first'), upload('second')])
    expect(page.locator('.comparison-file-list li')).to_have_count(2)
    page.fill('#comparison-label-0', 'Alex <private>')
    expect(page.locator('#comparison-run')).to_be_disabled()
    page.check('#comparison-run-consent')
    page.click('#comparison-run')
    expect(page.locator('#comparison-report')).to_be_visible()
    report_node = page.locator('#comparison-report')
    expect(report_node).to_contain_text('Alex <private>')
    expect(report_node).to_contain_text('same 4 available marks')
    expect(report_node).to_contain_text('75%')
    expect(report_node).to_contain_text('Unsupported claim')
    expect(report_node).to_contain_text('This advice is not a mark deduction')
    assert report_node.locator('img').count() == 0
    report_node.locator('.comparison-evidence summary').first.click()
    expect(report_node).to_contain_text('Hashing is one-way. <img src=x onerror=alert(1)>')
    report_node.locator('.comparison-provenance summary').click()
    expect(report_node).to_contain_text('mock-comparison-v1')
    capture(page, 'comparison-report-desktop.png')
    with page.expect_download() as downloading:
        page.click('#comparison-download')
    saved_report = json.loads(Path(downloading.value.path()).read_text())
    assert saved_report['localLabels'][0]['label'] == 'Alex <private>'
    assert saved_report['report']['status'] == 'complete'
    assert 'Alex' not in json.dumps(requests)
    assert 'private-name' not in json.dumps(requests)
    assert 'signed-test-first' not in page.evaluate('JSON.stringify(localStorage)')

    # The same private evidence remains in memory only; no uncontrolled request follows an error.
    comparison_mode = 'fail'
    page.check('#comparison-run-consent')
    page.click('#comparison-run')
    expect(page.locator('#comparison-error')).to_contain_text('Mock temporary provider failure')
    expect(page.locator('#comparison-run-consent')).not_to_be_checked()
    comparison_mode = 'needs_review'
    page.check('#comparison-run-consent')
    page.click('#comparison-run')
    expect(page.locator('#comparison-report')).to_contain_text('AI comparison needs review')
    assert page.locator('.comparison-profile').count() == 0
    expect(page.locator('#comparison-report')).to_contain_text('3 / 4')
    capture(page, 'comparison-needs-review.png')

    # Cancellation invalidates the pending generation even if the server already began work.
    comparison_mode = 'hold'
    page.check('#comparison-run-consent')
    page.click('#comparison-run')
    expect(page.locator('#comparison-cancel')).to_be_visible()
    expect(page.locator('#comparison-run')).to_be_disabled()
    page.click('#comparison-cancel')
    expect(page.locator('#comparison-status')).to_contain_text('Cancelled')
    assert page.locator('#comparison-report').count() == 0
    for held in held_routes:
        try:
            respond(held, report())
        except Exception:
            pass  # Chromium may have already discarded the aborted transport.

    comparison_mode = 'complete'
    page.check('#comparison-run-consent')
    page.click('#comparison-run')
    expect(page.locator('#comparison-report')).to_be_visible()
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Comparison page overflows the mobile viewport'
    capture(page, 'comparison-report-mobile.png')
    page.click('#comparison-clear')
    expect(page.locator('.comparison-file-list li')).to_have_count(0)
    assert page.locator('#comparison-report').count() == 0

    # Bad and duplicate files are rejected without losing the valid cohort.
    page.set_input_files('#comparison-files', {'name': 'bad.json', 'mimeType': 'application/json', 'buffer': b'{broken'})
    expect(page.locator('#comparison-error')).to_contain_text('not valid JSON')
    page.set_input_files('#comparison-files', [upload('first'), upload('second')])
    expect(page.locator('.comparison-file-list li')).to_have_count(2)
    page.set_input_files('#comparison-files', upload('first'))
    expect(page.locator('#comparison-error')).to_contain_text('selected twice')
    expect(page.locator('.comparison-file-list li')).to_have_count(2)
    page.goto(URL + '#/account')
    page.click('[data-act=acsignout]')
    page.wait_for_function('!S.tok')
    assert page.evaluate('COMPARISON.files.length') == 0
    assert page.evaluate('COMPARISON.report') is None
    assert not unexpected_requests, unexpected_requests
    assert not page_errors, page_errors
    context.close()
    browser.close()
    print('COMPARISON UI OK: opt-in saved export, two-person import, private local labels, escaped evidence, exact coverage, report download, retry/abstention/cancel, mobile layout, malformed/duplicate files and sign-out cleanup.')
