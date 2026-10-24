const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x)),stores=new Map();let revision=0;
function client(owner){
  const storage=new Map(),listeners={};
  const c={console,URL,window:{addEventListener(name,fn){listeners[name]=fn}},document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []}},
    location:{hash:'#/account'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    setTimeout(){return 1},clearTimeout(){},setInterval(){},render(){},confirm(){return false}};
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
      const result=reply(200,s);if(c.beforeReply)await c.beforeReply(p);return result;
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
  console.log('sync OK: independent devices, conflict choices, account isolation, late responses and in-flight edits');
})().catch(e=>{console.error(e);process.exitCode=1});
