import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
test('Firebase Hosting sends non-breaking browser security headers and fresh HTML',()=>{
 const hosting=JSON.parse(read('frontend/firebase.json')).hosting;
 const all=hosting.headers.find(x=>x.source==='**');
 const headers=Object.fromEntries(all.headers.map(h=>[h.key,h.value]));
 assert.equal(headers['X-Content-Type-Options'],'nosniff');
 assert.equal(headers['X-Frame-Options'],'DENY');
 assert.ok(headers['Referrer-Policy']);
 for(const name of ['/index.html','/service-worker.js']){
  assert.match(hosting.headers.find(h=>h.source===name)?.headers?.[0]?.value||'',/no-cache/);
 }
 assert.equal(hosting.rewrites[0].destination,'/index.html');
});
test('unused axios is removed and React scripts remains compatible',()=>{
 const pkg=JSON.parse(read('frontend/package.json'));
 assert.equal(pkg.version,'1.7.5');
 assert.ok(!('axios' in pkg.dependencies));
 assert.equal(pkg.dependencies['react-scripts'],'5.0.1');
});
test('local demo credentials are externally configured and export uses constant SQL',()=>{
 const auth=read('backend/auth.py');
 assert.match(auth,/SMARTGROWTH_DEMO_PASSWORD/);
 assert.match(auth,/SMARTGROWTH_BUYER_PASSWORD/);
 assert.doesNotMatch(auth,/SmartDemo!2026|BuyerDemo!2026/);
 const sql=read('scripts/export_local_sqlite_to_demo.py');
 assert.doesNotMatch(sql,/f['"]SELECT \* FROM \{table\}/);
 assert.match(sql,/con.execute\(queries\[table\], \(user_id,\)\)/);
});
test('CI uses least privilege and uploads a non-blocking audit report',()=>{
 const yml=read('.github/workflows/smartgrowth-android.yml');
 assert.match(yml,/persist-credentials: false/);
 assert.match(yml,/npm audit --json/);
 assert.match(yml,/smartgrowth-npm-security-audit/);
 assert.match(read('.github/dependabot.yml'),/package-ecosystem: "npm"/);
});
