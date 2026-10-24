const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x)),stores=new Map();let revision=0;
function client(owner){
  const storage=new Map(),listeners={},timers=new Map();let timerId=0;
  const c={console,URL,AbortController,window:{addEventListener(name,fn){listeners[name]=fn}},document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []}},
    location:{hash:'#/account'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},setInterval(){},render(){},confirm(){return false}};
  c.fireAccountTimeout=()=>{const pending=[...timers].filter(([,t])=>t.ms===45000);assert.equal(pending.length,1);timers.delete(pending[0][0]);pending[0][1].fn()};
  c.fetch=async(_,request)=>{
    const p=JSON.parse(request.body),token=request.headers.authorization;
    let s=stores.get(token);if(!s){s={data:{u:{},hist:[]},revisions:{}};stores.set(token,s)}
    const reply=(status,body)=>({ok:status===200,status,json:async()=>clone(body)});
    if(c.beforeRequest)await c.beforeRequest(p);
    if(p.action==='load')return reply(200,s);
    if(p.action==='save'){
      const conflicts=p.changes.filter(id=>(p.revisions[id]||null)!==(s.revisions[id]||null));
      if(conflicts.length)return reply(409,Object.assign({error:'conflict',code:'progress_conflict',conflicts},s));
      p.changes.forEach(id=>{if(p.data.u[id])s.data.u[id]=p.data.u[id];else delete s.data.u[id];s.revisions[id]='v'+(++revision)});
      const result=reply(200,Object.assign({ok:true},s));if(c.beforeReply)await c.beforeReply(p);return result;
    }
    throw new Error('Unexpected action');
  };
  vm.createContext(c);
  for(const file of ['helpers.js','bank1.js','widgets.js','ai.js','sync.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
  c.CUR={b:null};c.acceptAccount({token:owner,email:owner},false);c.storageEvent=e=>listeners.storage(e);return c;
}
function edit(c,id,value){c.BS(id).ans['1.0']=value;c.save(id)}
(async()=>{
  const a=client('same@example.test'),b=client('same@example.test');
  await Promise.all([a.syncNow(),b.syncNow()]);
  edit(a,'1',2);const activePaper=a.S.u['1'];await a.pushRemote();assert.equal(a.S.u['1'],activePaper,'save replaced active marking state');edit(b,'2',3);await b.pushRemote();
  let remote=stores.get('Bearer same@example.test');
  assert.equal(remote.data.u['1'].ans['1.0'],2);assert.equal(remote.data.u['2'].ans['1.0'],3);
  await a.syncNow();edit(a,'1',0);edit(b,'1',1);await a.pushRemote();
  await assert.rejects(b.pushRemote());assert.equal(b.S.u['1'].ans['1.0'],1,'conflicting draft lost');
  assert(b.SYNC.conflicts['1']);b.resolveSync('1','remote');await b.SYNC.queue;
  assert.equal(b.S.u['1'].ans['1.0'],0);
  edit(a,'1',2);edit(b,'1',3);await a.pushRemote();await assert.rejects(b.pushRemote());
  b.resolveSync('1','local');await b.SYNC.queue;
  assert.equal(remote.data.u['1'].ans['1.0'],3);

  // Expiry hides all previous-account progress, but that owner's draft is recoverable.
  edit(a,'1',7);a.syncFail(Object.assign(new Error('expired'),{status:401}));
  assert.equal(Object.keys(a.S.u).length,0);assert.equal(a.S.tok,'');
  a.acceptAccount({token:'other@example.test',email:'other@example.test'},false);await a.syncNow();
  assert.equal(Object.keys(stores.get('Bearer other@example.test').data.u).length,0);
  a.acceptAccount({token:'same@example.test',email:'same@example.test'},false);
  assert.equal(a.S.u['1'].ans['1.0'],7);

  // A delayed 401 from an old account cannot sign out a new one.
  const c=client('old@example.test');let rejectOld;
  c.beforeRequest=()=>new Promise((_,reject)=>{rejectOld=reject});
  const old=c.syncNow();while(!rejectOld)await Promise.resolve();
  c.acceptAccount({token:'new@example.test',email:'new@example.test'},false);
  rejectOld(Object.assign(new Error('expired'),{status:401}));await old;
  assert.equal(c.S.tok,'new@example.test');
  // Another tab's account switch also preserves this tab's unsaved owner draft.
  edit(c,'1',9);
  c.storageEvent({key:c.KEY,newValue:JSON.stringify({owner:'third@example.test',tok:'third@example.test',u:{},hist:[],pending:{},revisions:{}})});
  assert.equal(c.S.owner,'third@example.test');assert.equal(Object.keys(c.S.u).length,0);
  c.acceptAccount({token:'new@example.test',email:'new@example.test'},false);
  assert.equal(c.S.u['1'].ans['1.0'],9);

  // Edits made while a save is in flight remain dirty and get the new base revision.
  const d=client('inflight@example.test');edit(d,'1',1);let release;
  d.beforeReply=()=>new Promise(resolve=>{release=resolve});const first=d.pushRemote();
  while(!release)await Promise.resolve();edit(d,'1',2);release();await first;
  assert(d.S.pending['1']);d.beforeReply=null;await d.pushRemote();
  assert.equal(stores.get('Bearer inflight@example.test').data.u['1'].ans['1.0'],2);
  assert.equal(Object.keys(d.S.pending).length,0);
  assert.equal(d.passTest('110',{o:'10'}),false);assert.equal(d.passTest('9990',{o:'0'}),false);
  assert.equal(d.passTest('10\n',{o:'10'}),true);assert.equal(d.passTest('debug\n10',{o:'10'}),false);
  // A hung fetch or response body must release the queue without clearing the
  // pending draft. The transport deliberately ignores abort to test late data.
  for(const stage of ['fetch','body']){
    const e=client('timeout-'+stage+'@example.test');edit(e,'10','local mini answer');
    let release,signal,calls=0;
    const success={ok:true,status:200,json:async()=>({data:{u:{'10':{ans:{'1.0':'late remote answer'}}}},revisions:{'10':'late'}})};
    e.fetch=async(_,request)=>{calls++;signal=request.signal;if(stage==='fetch')return new Promise(resolve=>{release=()=>resolve(success)});return{ok:true,status:200,json:()=>new Promise(resolve=>{release=()=>resolve({data:{u:{'10':{ans:{'1.0':'late remote answer'}}}},revisions:{'10':'late'}})})}};
    const saving=e.pushRemote().catch(e.syncFail);while(!release)await Promise.resolve();
    assert.equal(e.SYNC.state,'saving');e.fireAccountTimeout();await saving;
    assert.equal(e.SYNC.state,'error');assert.match(e.SYNC.msg,/timed out/);assert(signal.aborted);
    assert.equal(e.S.u['10'].ans['1.0'],'local mini answer');assert(e.S.pending['10']);assert.equal(e.S.tok,'timeout-'+stage+'@example.test');
    const snapshot=JSON.stringify(e.S);release();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(JSON.stringify(e.S),snapshot,'late timeout response changed local state');assert.equal(calls,1,'timeout silently retried');
    e.fetch=async()=>({ok:true,status:200,json:async()=>({ok:true,data:{u:e.S.u},revisions:{'10':'saved'}})});
    await e.pushRemote();assert.equal(e.SYNC.state,'ok');assert.equal(Object.keys(e.S.pending).length,0,'queue stayed blocked after timeout');
  }
  const switched=client('timeout-old@example.test');edit(switched,'10','old draft');let oldStarted;
  switched.fetch=()=>new Promise(()=>{oldStarted=true});const pending=switched.syncNow();while(!oldStarted)await Promise.resolve();
  switched.acceptAccount({token:'timeout-new@example.test',email:'timeout-new@example.test'},false);switched.fireAccountTimeout();await pending;
  assert.equal(switched.S.tok,'timeout-new@example.test');assert.equal(Object.keys(switched.S.u).length,0);
  switched.acceptAccount({token:'timeout-old@example.test',email:'timeout-old@example.test'},false);assert.equal(switched.S.u['10'].ans['1.0'],'old draft');
  const invalidBodies=[undefined,null,{},[],{error:'invalid success'},{ok:true,data:{},revisions:{}},{ok:true,data:{u:{}},revisions:{'10':'unconfirmed'}},{ok:true,data:{u:{'10':{ans:{}}}},revisions:{'10':'unconfirmed'}},{ok:true,data:{u:{'10':{ans:{'1.0':'local answer'}}}},revisions:{}},{ok:true,data:{u:{},hist:[null]},revisions:{}}];
  for(const invalid of invalidBodies){
    const bad=client('malformed@example.test');edit(bad,'10','local answer');const original=JSON.stringify(bad.S);let calls=0;
    bad.fetch=async()=>({ok:true,status:200,json:async()=>{calls++;if(invalid===undefined)throw new SyntaxError('Unexpected end');return invalid}});
    await bad.pushRemote().catch(bad.syncFail);
    assert.equal(bad.SYNC.state,'error');assert.equal(JSON.stringify(bad.S),original,'malformed success changed the draft');assert.equal(calls,1);
    bad.fetch=async(_,req)=>({ok:true,status:200,json:async()=>({ok:true,data:JSON.parse(req.body).data,revisions:{'10':'valid'}})});
    await bad.pushRemote();assert.equal(bad.SYNC.state,'ok');assert.equal(bad.S.u['10'].ans['1.0'],'local answer');assert(!bad.S.pending['10']);
  }
  // A malformed load or conflict response cannot remove acknowledged papers,
  // and malformed sign-in responses cannot replace the current account.
  for(const badBody of [{data:null,revisions:{}},{data:{u:{}},revisions:null},{data:{hist:[null]},revisions:{}},{}]){
    const bad=client('bad-load@example.test');edit(bad,'10','draft');const original=JSON.stringify(bad.S);let calls=0;
    bad.fetch=async()=>({ok:true,status:200,json:async()=>{calls++;return badBody}});await bad.syncNow();
    assert.equal(bad.SYNC.state,'error');assert.equal(JSON.stringify(bad.S),original);assert.equal(calls,1,'malformed load continued to save');
  }
  const badConflict=client('bad-conflict@example.test');edit(badConflict,'10','draft');const beforeConflict=JSON.stringify(badConflict.S);
  badConflict.fetch=async()=>({ok:false,status:409,json:async()=>({error:'bad conflict',code:'progress_conflict',conflicts:['10'],data:{},revisions:null})});
  await badConflict.pushRemote().catch(badConflict.syncFail);assert.equal(JSON.stringify(badConflict.S),beforeConflict);assert.equal(Object.keys(badConflict.SYNC.conflicts).length,0);
  for(const invalid of [{},{token:null,email:'a@example.test'},{token:'synthetic',email:null}]){badConflict.fetch=async()=>({ok:true,status:200,json:async()=>invalid});await assert.rejects(badConflict.api('login',{}),/invalid reply/)}
  console.log('sync OK: independent devices, conflict choices, account isolation, late responses, in-flight edits and bounded fetch/body timeouts preserving drafts');
})().catch(e=>{console.error(e);process.exitCode=1});
