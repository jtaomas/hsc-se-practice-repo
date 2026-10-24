process.env.CF_API_TOKEN=process.env.CF_API_TOKEN||'test-token';
const h=require(process.argv[2]||'./auth.js'),assert=require('node:assert/strict');
function call(body,tok){return new Promise((resolve,reject)=>{
  const res={setHeader(){},status(c){this.c=c;return this},json(j){resolve({c:this.c,j})}};
  Promise.resolve(h({method:'POST',body,headers:tok?{authorization:'Bearer '+tok}:{}},res)).catch(reject);
})}
function save(tok,data,changes,revisions){return call({action:'save',data,changes,revisions},tok)}
(async()=>{
  let r=await call({action:'signup',email:'A.B@Student.det.nsw.edu.au',password:'synthetic-test-value'});
  assert.equal(r.c,200);const tok=r.j.token;assert.equal(r.j.email,'a.b@student.det.nsw.edu.au');
  assert.equal((await call({action:'signup',email:'a.b@student.det.nsw.edu.au',password:'another-test-value'})).c,409);
  assert.equal((await call({action:'signup',email:'bad',password:'synthetic-test-value'})).c,400);
  assert.equal((await call({action:'signup',email:'c@d.com',password:'short'})).c,400);
  assert(!JSON.stringify([...globalThis.__M.values()]).includes('synthetic-test-value'));
  assert.equal((await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'synthetic-test-value'})).c,200);
  assert.equal((await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'incorrect-test-value'})).c,401);
  assert.equal((await call({action:'login',email:'nobody@example.test',password:'incorrect-test-value'})).c,401);
  assert.equal((await call({action:'load'})).c,401);
  assert.equal((await call({action:'load'},tok.slice(0,-3)+'abc')).c,401);
  const [body,mac]=tok.split('.');
  const forged=Buffer.from(JSON.stringify({id:'x',email:'e',exp:Date.now()+1e9})).toString('base64url')+'.'+mac;
  assert.equal((await call({action:'load'},forged)).c,401);
  // Parallel devices save different papers, starting from the same empty account.
  const saves=await Promise.all([
    save(tok,{u:{'1':{ans:{'1.0':2}}},hist:[]},['1'],{}),
    save(tok,{u:{'2':{ans:{'1.0':1}}},hist:[]},['2'],{})
  ]);
  assert(saves.every(x=>x.c===200));
  r=await call({action:'load'},tok);
  assert.equal(r.j.data.u['1'].ans['1.0'],2);assert.equal(r.j.data.u['2'].ans['1.0'],1);
  const revisions=r.j.revisions;
  const same=await Promise.all([
    save(tok,{u:{'1':{ans:{'1.0':0}}}},['1'],revisions),
    save(tok,{u:{'1':{ans:{'1.0':3}}}},['1'],revisions)
  ]);
  assert.deepEqual(same.map(x=>x.c).sort(),[200,409]);
  assert.equal(same.find(x=>x.c===409).j.code,'progress_conflict');
  r=await call({action:'load'},tok);
  assert.equal(r.j.data.u['2'].ans['1.0'],1,'unrelated paper lost');
  // Deletion retains a revision tombstone so old devices cannot resurrect attempts.
  const beforeDelete=r.j.revisions;
  assert.equal((await save(tok,{u:{}},['1'],beforeDelete)).c,200);
  assert.equal((await save(tok,{u:{'1':{ans:{}}}},['1'],beforeDelete)).c,409);
  // The three-question mini paper saves independently and keeps the same conflict protection.
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'Mini paper response'}}}},['10'],{})).c,200);
  r=await call({action:'load'},tok);
  assert.equal(r.j.data.u['10'].ans['1.0'],'Mini paper response');
  assert.equal(r.j.data.u['2'].ans['1.0'],1,'saving the mini paper lost another paper');
  const miniRevisions=r.j.revisions;
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'Updated mini paper response'}}}},['10'],miniRevisions)).c,200);
  const staleMini=await save(tok,{u:{'10':{ans:{'1.0':'Stale mini paper response'}}}},['10'],miniRevisions);
  assert.equal(staleMini.c,409);assert.equal(staleMini.j.code,'progress_conflict');
  assert.deepEqual(staleMini.j.conflicts,['10']);
  r=await call({action:'load'},tok);
  assert.equal(r.j.data.u['10'].ans['1.0'],'Updated mini paper response');
  const beforeInvalid=JSON.stringify(r.j);
  for(const invalid of ['0','11','01','../10','__proto__','constructor','prototype',10,['10'],null,{}]) {
    assert.equal((await save(tok,{u:{}},[invalid],r.j.revisions)).c,409,'invalid paper key accepted: '+JSON.stringify(invalid));
  }
  assert.equal(JSON.stringify((await call({action:'load'},tok)).j),beforeInvalid,'invalid keys modified progress');
  assert.equal((await call({action:'save',data:{u:{}}},tok)).c,409);
  assert.equal((await save(tok,{big:'x'.repeat(3600000)},[],{})).c,413);
  // Daily backups: the first save of a day copies the earlier state, later saves the same day do not.
  const day=new Date().toISOString().slice(0,10);
  const backupKeys=()=>[...globalThis.__M.keys()].filter(k=>k.startsWith('backup/'));
  const pk='progress/'+JSON.parse(Buffer.from(tok.split('.')[0],'base64url')).id+'.json';
  const setDay=v=>{const d=JSON.parse(globalThis.__M.get(pk));d._backupDay=v;globalThis.__M.set(pk,JSON.stringify(d))};
  setDay('2000-01-01'); // pretend the last save was on an earlier day
  r=await call({action:'load'},tok);
  const preState=r.j.data.u['10'].ans['1.0'];
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'Backup test A'}}}},['10'],r.j.revisions)).c,200);
  assert.equal(backupKeys().length,1,'first save of the day must write one backup');
  assert(backupKeys()[0].endsWith('/'+day+'.json'));
  r=await call({action:'load'},tok);
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'Backup test B'}}}},['10'],r.j.revisions)).c,200);
  assert.equal(backupKeys().length,1,'later saves the same day must not write more backups');
  assert.equal(JSON.parse(globalThis.__M.get(backupKeys()[0])).u['10'].ans['1.0'],preState,'backup holds the state before the day began');
  assert(!JSON.stringify((await call({action:'load'},tok)).j).includes('_backupDay'),'internal field leaked to the client');
  assert.equal((await call({action:'backups'})).c,401);
  r=await call({action:'backups'},tok);
  assert.deepEqual(r.j.backups,[day]);
  assert.equal((await call({action:'restore',name:'../../users/x'},tok)).c,400);
  assert.equal((await call({action:'restore',name:'2020-01-01'},tok)).c,404);
  // Another account cannot see or restore this account's backups.
  const intruder=(await call({action:'signup',email:'intruder@example.test',password:'intruder-test-pass'})).j.token;
  assert.deepEqual((await call({action:'backups'},intruder)).j.backups,[]);
  assert.equal((await call({action:'restore',name:day},intruder)).c,404);
  // Old backups are pruned, and a restore keeps a safety copy and forces other devices to reconcile.
  globalThis.__M.set('backup/'+JSON.parse(Buffer.from(tok.split('.')[0],'base64url')).id+'/'+new Date(Date.now()-9*864e5).toISOString().slice(0,10)+'.json','{}');
  r=await call({action:'load'},tok);
  const beforeRestore=r.j.revisions;
  r=await call({action:'restore',name:day},tok);
  assert.equal(r.c,200);assert.equal(r.j.data.u['10'].ans['1.0'],preState,'restore did not bring back the saved state');
  assert(backupKeys().some(k=>/before-restore-\d{13}\.json$/.test(k)),'restore must keep a safety copy');
  assert.notEqual(r.j.revisions['10'],beforeRestore['10'],'restore must change revisions so stale devices see a conflict');
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'stale device'}}}},['10'],beforeRestore)).c,409);
  // A backup failure must never fail the save itself.
  r=await call({action:'load'},tok);
  globalThis.__blobBeforePut=async(path)=>{if(path.startsWith('backup/'))throw new Error('backup storage down')};
  setDay('2000-01-01');
  const bare=await call({action:'load'},tok);
  assert.equal((await save(tok,{u:{'10':{ans:{'1.0':'after backup failure'}}}},['10'],bare.j.revisions)).c,200);
  globalThis.__blobBeforePut=null;
  // Two independent function instances share the storage, not an in-memory lock.
  const entry=require.resolve(process.argv[2]||'./auth.js');delete require.cache[entry];const other=require(entry);
  const login={action:'login',email:'parallel@example.test',password:'wrong-test-password'};
  assert.equal((await call({action:'signup',email:login.email,password:'correct-test-password'})).c,200);
  const parallel=await Promise.all(Array.from({length:16},(_,i)=>new Promise(resolve=>{
    (i%2?other:h)({method:'POST',headers:{},body:login},{setHeader(){},status(c){this.c=c;return this},json(j){resolve({c:this.c,j})}});
  })));
  assert.equal(parallel.filter(x=>x.c===401).length,8);
  assert.equal(parallel.filter(x=>x.c===429).length,8);
  assert.equal((await call({action:'login',email:login.email,password:'correct-test-password'})).c,429);
  globalThis.__blobFailWrites=true;
  assert.equal((await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'synthetic-test-value'})).c,500,'storage failure must fail closed');
  globalThis.__blobFailWrites=false;
  console.log('auth OK: signatures, atomic lockout, concurrent saves, mini-paper sync, conflicts, invalid paper keys, deletion and legacy-client safety');
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
