const h=require(process.argv[2]||'./auth.js');const assert=require('assert');
function call(body,tok){return new Promise(r=>{const res={headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.c=c;return this},json(j){r({c:this.c,j})}};h({method:'POST',body,headers:tok?{authorization:'Bearer '+tok}:{}},res)})}
(async()=>{
 const g=await new Promise(r=>{const res={setHeader(){},status(c){this.c=c;return this},json(j){r(this.c)}};h({method:'GET',headers:{}},res)});assert.equal(g,405);
 let r=await call({action:'signup',email:'A.B@Student.det.nsw.edu.au',password:'hunter22x'});assert.equal(r.c,200);const tok=r.j.token;assert.equal(r.j.email,'a.b@student.det.nsw.edu.au');
 r=await call({action:'signup',email:'a.b@student.det.nsw.edu.au',password:'other1234'});assert.equal(r.c,409);
 r=await call({action:'signup',email:'bad',password:'hunter22x'});assert.equal(r.c,400);
 r=await call({action:'signup',email:'c@d.com',password:'short'});assert.equal(r.c,400);
 const stored=JSON.stringify([...globalThis.__M.values()]);assert(!stored.includes('hunter22x'),'password stored!');
 const u=JSON.parse([...globalThis.__M.entries()].find(e=>e[0].startsWith('users/'))[1]);assert(u.salt&&u.hash&&!u.password);
 r=await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'hunter22x'});assert.equal(r.c,200);
 r=await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'wrongpass1'});assert.equal(r.c,401);
 r=await call({action:'login',email:'nobody@x.com',password:'wrongpass1'});assert.equal(r.c,401);
 r=await call({action:'load'},tok);assert.equal(r.c,200);assert.equal(r.j.data,null);
 r=await call({action:'save',data:{u:{a:1}}},tok);assert.equal(r.c,200);
 r=await call({action:'load'},tok);assert.deepEqual(r.j.data,{u:{a:1}});
 r=await call({action:'load'},tok.slice(0,-3)+'abc');assert.equal(r.c,401);
 r=await call({action:'load'});assert.equal(r.c,401);
 // tampered payload
 const [b,m]=tok.split('.');const fake=Buffer.from(JSON.stringify({id:'x',email:'e',exp:Date.now()+1e9})).toString('base64url')+'.'+m;
 r=await call({action:'load'},fake);assert.equal(r.c,401);
 // lockout
 for(let i=0;i<8;i++) await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'wrongpass'+i});
 r=await call({action:'login',email:'a.b@student.det.nsw.edu.au',password:'hunter22x'});assert.equal(r.c,429);
 r=await call({action:'save',data:{big:'x'.repeat(3600000)}},tok);assert.equal(r.c,413);
 console.log('auth OK');
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
