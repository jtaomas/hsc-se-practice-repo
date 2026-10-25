// Browser contract and stale-result regressions; no network or provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const clone=x=>JSON.parse(JSON.stringify(x));
function client(){
  const c={console,AbortController,window:{addEventListener(){}},location:{hash:'#/1/results'},SYNC:{epoch:0},AIMARKING_VERSION:'test',
    document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []},createElement(){return {innerHTML:'',get textContent(){return this.innerHTML.replace(/<[^>]*>/g,'')}}}},
    localStorage:{getItem(){return null},setItem(){}},setTimeout(){return 1},clearTimeout(){},setInterval(){},fetch(){throw new Error('Unexpected request')}};
  vm.createContext(c);
  for(const file of ['helpers.js','kit.js','widgets.js','qtypes.js','xd.js','ai.js','feedback.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
  const b={id:'1',qs:[{tp:'Security',st:'Context',it:[{t:'tx',q:'Explain.',m:3,crit:['Band'],model:'Sample'},c.mc('Choose',['A','B'],1)]}]};
  c.BANKS.push(b);c.CUR={b,n:0};c.S.tok='session';c.S.owner='owner';const bs=c.BS('1');bs.done=true;bs.start=1;bs.doneAt=2;bs.ans['1.0']='<p>Submitted text.</p>';bs.ans['1.1']=1;
  bs.ai['1.0']={status:'marked',g:2,stamp:c.aiStamp(b,1,0),audit:{inputDigest:'a'.repeat(64)}};
  return {c,b,bs};
}
function report(){return {status:'ready',summary:'Synthetic plan.',coverage:{totalParts:2,confirmedParts:2,blankParts:0,pendingMaxMarks:0},lossSummary:{totalKnownLost:1,unallocatedLost:1,unknownMaxMarks:0,categories:[{category:'insufficient_explanation',exactMarksLost:0,holisticOccurrences:1,partIds:['1.0']}]},quality:[{id:'clarity',rating:7,assessedParts:1,evidencePartIds:['1.0'],feedback:'Meaning is clear.',action:'Keep direct wording.'}],strengths:[],knowledgeGaps:[],writingPatterns:[],plan:[{priority:1,title:'Explain the mechanism',why:'The causal link is missing.',evidencePartIds:['1.0'],steps:['Name the mechanism.','Link to the outcome.'],exercise:'Rewrite in two sentences.',successCheck:'Both mechanism and effect are stated.',schedule:'Next practice session'}],limitations:['Assistant feedback is provisional.']}}
function response(body,status=200){return {ok:status===200,status,json:async()=>clone(body)}}
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {resolve,promise}}
(async()=>{
  {
    const {c,b,bs}=client();let sent,count=0;c.fetch=async(url,req)=>{count++;assert.equal(url,'/api/improve');sent=JSON.parse(req.body);assert.equal(req.headers.authorization,'Bearer session');return response(report())};
    const one=c.runImprovement(b),two=c.runImprovement(b);assert.equal(one,two);await one;
    assert.equal(count,1);assert.deepEqual(sent,{bankId:'1',answers:[{questionNumber:1,partIndex:0,answer:'Submitted text.',markingReference:'a'.repeat(64)},{questionNumber:1,partIndex:1,answer:1}]});
    assert(c.improvementRecord(b));await c.runImprovement(b);assert.equal(count,1,'cached plan must not reroll');
    const html=c.improvementPanel(b);assert(html.includes('7 / 10'));assert(html.includes('Success check'));assert(html.includes('#/1/review/1'));assert(html.includes('marks you set yourself are excluded'));
    bs.ans['1.1']=0;assert.equal(c.improvementRecord(b),null,'closed answer changes must invalidate coach result');
  }
  for(const change of [
    ({c})=>{c.S.tok='other'},({c})=>{c.S.owner='other'},({c})=>{c.SYNC.epoch++},({bs})=>{bs.doneAt++},
    ({bs})=>{bs.ans['1.0']='edited'},({bs})=>{bs.ai['1.0'].audit.inputDigest='b'.repeat(64)},({b})=>{b.qs[0].it[0].crit=['new']},({c})=>{c.S={...c.S,u:{}}}
  ]){
    const state=client(),{c,b,bs}=state,pending=deferred();c.fetch=()=>pending.promise;const run=c.runImprovement(b);change(state);pending.resolve(response(report()));await run;assert.equal(bs.improvement,undefined);assert.equal(bs.improvementError,undefined);
  }
  {
    const {c,b,bs}=client();c.S.tok='';await c.runImprovement(b);assert(c.improvementPanel(b).includes('Sign in'));c.S.tok='session';bs.done=false;await c.runImprovement(b);assert(c.improvementPanel(b).includes('Submit the paper'));
  }
  {
    const {c,b,bs}=client();bs.ai['1.0'].status='provisional';bs.ai['1.0'].g=1;
    assert(c.improvementPanel(b).includes('Unconfirmed AI marks and their criterion feedback are excluded'));
    const payload=c.improvementPayload(b);assert.equal(payload.answers[0].markingReference,'a'.repeat(64));assert(!('mark' in payload.answers[0]));assert(!('feedback' in payload.answers[0]));
    assert(c.improvementReport(b,report()).includes('unconfirmed AI marks and any marks you set yourself are excluded'));
  }
  {
    const {c,b,bs}=client();c.fetch=async()=>response({error:'Unavailable'},503);await c.runImprovement(b);assert.equal(bs.improvementError,'Unavailable');assert.equal(bs.improvement,undefined);
    c.fetch=async()=>response({...report(),status:'needs_review',plan:[]});await c.runImprovement(b);assert(c.improvementPanel(b).includes('could not confirm'));assert(!c.improvementPanel(b).includes('Explain the mechanism'));
    assert(c.improvementPanel(b).includes('Response-quality profile'),'verified aggregate ratings remain visible when the narrative plan needs review');
    assert(c.improvementPanel(b).includes('7 / 10'));
  }
  {
    const {c,b}=client(),r=report();r.summary='<img src=x onerror=alert(1)>';r.plan[0].title='<script>bad</script>';r.plan[0].evidencePartIds=['javascript:bad','1.0'];
    const html=c.improvementReport(b,r);assert(!html.includes('<img'));assert(!html.includes('<script>'));assert(!html.includes('javascript:'));assert(html.includes('&lt;img'));
    const detail=c.feedbackDetails({losses:{allocation:'holistic',totalLost:1,items:[{category:'missing_requirement',marksLost:null,criterionIds:['c1'],evidence:['<quote>'],explanation:'Missing link.',action:'Add it.'}]},quality:[{id:'code_quality',rating:null,evidence:[],feedback:'Not applicable.',action:'No action needed.'}]});
    assert(detail.includes('not separate numerical deductions'));assert(detail.includes('Not assessed'));assert(!detail.includes('null / 10'));assert(detail.includes('&lt;quote&gt;'));
  }
  {
    const {c,b,bs}=client();
    const elements=[
      {id:'OwnerBox',type:'rectangle',boundElements:[{id:'owner-label',type:'text'}]},
      {id:'owner-label',type:'text',text:'Owner <img src=x>\nname\nphone',containerId:'OwnerBox'},
      {id:'pet-box',type:'rectangle'},
      {id:'pet-label',type:'text',text:'Pet\nname',containerId:'pet-box'},
      {id:'only-bound-box',type:'rectangle',boundElements:[{id:'only-bound-label',type:'text'}]},
      {id:'only-bound-label',type:'text',text:'Vet'},
      {id:'association',type:'line',startBinding:{elementId:'OwnerBox'},endBinding:{elementId:'pet-box'}},
      {id:'one-end',type:'arrow',startBinding:{elementId:'pet-box'}},
      {id:'empty-box',type:'rectangle'},
      {id:'nearby-text',type:'text',text:'Never infer proximity',x:0,y:0},
      {id:'deleted-text',type:'text',text:'Deleted label',containerId:'empty-box',isDeleted:true},
      {id:'wrong-container',type:'text',text:'Elsewhere',containerId:'elsewhere'},
      {id:'wrong-box',type:'rectangle',boundElements:[{id:'wrong-container',type:'text'}]},
      {id:'duplicate',type:'text',text:'Ambiguous first'},
      {id:'duplicate',type:'text',text:'Ambiguous second'}
    ];
    const beforeScene=JSON.stringify(elements),scene=c.feedbackDiagramContext({elements});
    const evidence=c.feedbackEvidence(['OwnerBox','owner-label','pet-box','only-bound-box','association','one-end','empty-box','missing<id>','wrong-box','duplicate'],scene);
    assert(evidence.includes('“Owner &lt;img src=x&gt;\nname\nphone” (diagram reference: OwnerBox)'));
    assert(evidence.includes('“Pet\nname” (diagram reference: pet-box)'));
    assert(evidence.includes('“Vet” (diagram reference: only-bound-box)'));
    assert(evidence.includes('Connector between “Owner &lt;img src=x&gt;” and “Pet” (diagram reference: association)'));
    assert(evidence.includes('Connector with endpoint “Pet” (diagram reference: one-end)'));
    for(const id of ['empty-box','wrong-box','duplicate'])assert(evidence.includes('Diagram reference: '+id));
    assert(evidence.includes('Diagram reference: missing&lt;id&gt;'));
    for(const unexpected of ['<img','Deleted label','Never infer proximity','Elsewhere','Ambiguous first','Ambiguous second'])assert(!evidence.includes(unexpected));
    assert.equal(JSON.stringify(elements),beforeScene,'display projection must not mutate the saved scene');
    assert.equal(c.feedbackEvidence(['OwnerBox','<quote>']),'<blockquote class="feedback-evidence">OwnerBox<br>&lt;quote&gt;</blockquote>','written evidence stays literal');

    b.qs[0].it[0]={t:'dr',q:'Draw the classes.',m:3,model:'Sample',crit:['Classes','Attributes','Associations']};
    bs.ans['1.0']={e:elements};
    const f={summary:'Grounded diagram feedback.',strengths:[],improve:[],advice:[],criteria:[{id:'c1',assessment:'met',evidence:['OwnerBox'],basis:'Named class.'}],
      losses:{allocation:'exact',totalLost:1,items:[{category:'missing_requirement',marksLost:1,criterionIds:['c2'],evidence:['pet-box'],explanation:'Missing property.',action:'Add the required property.'}]},
      quality:[{id:'diagram_quality',rating:8,evidence:['association'],feedback:'Clear connection.',action:'Keep the endpoints clear.'}]};
    bs.ai['1.0']={status:'marked',g:2,stamp:c.aiStamp(b,1,0),fb:f,audit:{inputDigest:'a'.repeat(64),feedbackDigest:'b'.repeat(64)}};
    const recordBefore=JSON.stringify(bs.ai['1.0']),savedBefore=JSON.stringify(bs.ans['1.0']);
    const html=c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',{e:[]},c.score(b,1,0));
    assert(html.includes('“Owner &lt;img src=x&gt;\nname\nphone” (diagram reference: OwnerBox)'),'criterion display uses the current saved scene, not caller answer');
    assert(html.includes('“Pet\nname” (diagram reference: pet-box)'),'loss evidence resolves bound labels');
    assert(html.includes('Connector between “Owner &lt;img src=x&gt;” and “Pet”'),'quality evidence resolves exact endpoint bindings');
    assert.equal(JSON.stringify(bs.ai['1.0']),recordBefore,'feedback, audit and checksum stay unchanged');
    assert.equal(JSON.stringify(bs.ans['1.0']),savedBefore,'saved answer stays unchanged');
    bs.ans['1.0'].e[1].text='Changed label';
    assert.equal(c.aiRecord(b,1,0),null);
    assert(!c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0)).includes('Grounded diagram feedback.'),'a changed scene cannot display stale evidence');
    bs.ai['1.0']={g:2,fb:f};
    const legacy=c.aiBlock(b,1,0,b.qs[0].it[0],bs,'1.0',bs.ans['1.0'],c.score(b,1,0));
    assert(!legacy.includes('Changed label'),'legacy feedback has no verified scene linkage');
    assert(legacy.includes('OwnerBox'),'legacy evidence remains literal');
  }
  console.log('Feedback client OK: complete payloads, cached plans, stale answer/account/rubric rejection, review states, escaped diagram labels, immutable evidence and separate quality ratings');
})().catch(e=>{console.error(e);process.exitCode=1});
