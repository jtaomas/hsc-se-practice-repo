"""Real-browser feedback and improvement UI checks, with a mocked coach only."""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

SITE = os.environ.get('SITE', 'http://127.0.0.1:8767').rstrip('/')
errors = []
requests = []
report = {
    'status': 'ready', 'summary': 'Your explanations identify relevant ideas; linking the mechanism to its effect is the next priority.',
    'coverage': {'totalParts': 31, 'confirmedParts': 31, 'blankParts': 30, 'reviewParts': 0, 'unmarkedParts': 0, 'knownMark': 2, 'assessedMaxMarks': 80, 'pendingMaxMarks': 0, 'totalMaxMarks': 80},
    'lossSummary': {'totalKnownLost': 78, 'unallocatedLost': 1, 'unknownMaxMarks': 0, 'categories': [
        {'category': 'no_response', 'exactMarksLost': 77, 'holisticOccurrences': 0, 'partIds': ['1.0']},
        {'category': 'insufficient_explanation', 'exactMarksLost': 0, 'holisticOccurrences': 1, 'partIds': ['18.0']}]},
    'quality': [{'id': 'clarity', 'rating': 8, 'assessedParts': 1, 'evidencePartIds': ['18.0'], 'feedback': 'Your one-way hashing statement is easy to interpret.', 'action': 'Keep the direct opening.'},
                {'id': 'code_quality', 'rating': None, 'assessedParts': 0, 'evidencePartIds': [], 'feedback': 'No code response is available.', 'action': 'Attempt a code question before assessing this factor.'}],
    'strengths': [{'title': 'A clear technical starting point', 'detail': 'You identify hashing as one-way.', 'evidence': [{'partId': '18.0', 'source': 'answer', 'quote': 'Hashing is one-way.'}]}],
    'knowledgeGaps': [{'title': 'Explain the protection from salting', 'detail': 'The security mechanism needs development in this response.', 'occurrence': 'isolated', 'evidence': [{'partId': '18.0', 'source': 'answer', 'quote': 'Hashing is one-way.'}], 'action': 'Link a unique salt to the failure of reusable precomputed lookups.'}],
    'writingPatterns': [],
    'plan': [{'priority': 1, 'title': 'Connect mechanism and effect', 'why': 'An explanation needs the causal link.', 'evidencePartIds': ['18.0'], 'steps': ['Name the mechanism.', 'State what changes.', 'Explain the consequence for the attacker.'], 'exercise': 'Rewrite Q18 in three sentences.', 'successCheck': 'A reader can explain why identical passwords need separate precomputed lookups.', 'schedule': 'In your next 15-minute practice session.'}],
    'limitations': ['This synthetic browser fixture is not a live model evaluation.']
}

def route_request(route):
    url = urlsplit(route.request.url)
    if url.netloc != urlsplit(SITE).netloc:
        route.abort()
    elif url.path == '/api/improve':
        payload = route.request.post_data_json
        assert set(payload) == {'bankId', 'answers'}
        assert payload['bankId'] == '1'
        assert len(payload['answers']) >= 27
        answer = next(x for x in payload['answers'] if x['questionNumber'] == 18)
        assert answer['answer'] == 'Hashing is one-way.'
        assert 'markingReference' in answer
        requests.append(payload)
        route.fulfill(status=200, content_type='application/json', body=json.dumps(report))
    elif url.path.startswith('/api/'):
        errors.append('Unexpected API call: ' + url.path)
        route.abort()
    else:
        route.continue_()

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME') or None)
    page = browser.new_page(viewport={'width': 1280, 'height': 1000})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('**/*', route_request)
    page.goto(SITE + '/index.html?archive=1')
    page.evaluate("""() => {
      save=function(){};syncSoon=function(){};
      S.tok='mock-feedback';S.owner='fixture@example.test';S.ae=S.owner;
      var b=BANKS[0],bs=BS(b.id);bs.done=true;bs.checked=1;bs.start=1;bs.doneAt=2;
      bs.ans['18.0']='Hashing is one-way.';
      bs.ai['18.0']={status:'marked',g:2,stamp:aiStamp(b,18,0),audit:{inputDigest:'a'.repeat(64)},fb:{summary:'You identify hashing but need the salt mechanism.',strengths:['Hashing is one-way.'],improve:['Explain the protection of a unique salt.'],advice:[],criteria:[],losses:{allocation:'holistic',totalLost:1,items:[{category:'insufficient_explanation',marksLost:null,criterionIds:['c1'],evidence:['Hashing is one-way.'],explanation:'The salt mechanism is missing.',action:'Explain why precomputed tables cannot be reused.'}]},quality:[{id:'clarity',rating:8,evidence:['Hashing is one-way.'],feedback:'The statement is easy to interpret.',action:'Keep this direct opening.'},{id:'code_quality',rating:null,evidence:[],feedback:'This is a written response.',action:'No code-quality action needed.'}]}};
      location.hash='#/1/results';
    }""")
    expect(page.get_by_role('button', name='Create my improvement plan')).to_be_visible()
    page.get_by_role('button', name='Create my improvement plan').click()
    expect(page.get_by_text('Connect mechanism and effect', exact=False)).to_be_visible()
    expect(page.get_by_text('Success check:', exact=True)).to_be_visible()
    assert len(requests) == 1
    expect(page.get_by_text('8 / 10', exact=True)).to_be_visible()
    expect(page.get_by_text('Not assessed', exact=True)).to_be_visible()
    page.locator('#improvement .quality-card').first.locator('summary').click()
    artifact_dir = os.environ.get('FEEDBACK_UI_ARTIFACTS')
    if artifact_dir:
        Path(artifact_dir).mkdir(parents=True, exist_ok=True)
        page.locator('#improvement').evaluate('(element) => element.scrollIntoView()')
        page.screenshot(path=str(Path(artifact_dir) / 'improvement-desktop.png'))
    page.set_viewport_size({'width': 390, 'height': 844})
    if artifact_dir:
        page.locator('#improvement').evaluate('(element) => element.scrollIntoView()')
        page.screenshot(path=str(Path(artifact_dir) / 'improvement-mobile.png'))
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), page.evaluate("Array.from(document.querySelectorAll('body *')).filter(x=>x.getBoundingClientRect().right>innerWidth+1).map(x=>[x.tagName,x.className,x.getBoundingClientRect().right]).slice(0,20)")
    page.evaluate("location.hash='#/1/review/18'")
    page.locator('.guide .aib > details > summary').first.click()
    expect(page.get_by_text('Where marks were lost', exact=True)).to_be_visible()
    expect(page.get_by_text('Response quality', exact=True)).to_be_visible()
    page.get_by_text('Clarity', exact=True).click()
    expect(page.get_by_text('The statement is easy to interpret.', exact=True)).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    if artifact_dir:
        page.get_by_text('Where marks were lost', exact=True).evaluate('(element) => element.scrollIntoView()')
        page.screenshot(path=str(Path(artifact_dir) / 'response-feedback-mobile.png'))
    browser.close()
assert not errors, errors
print('Feedback browser OK: post-exam request, grounded plan, factor detail, review links, desktop/mobile layouts, no external services')
