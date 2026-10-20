import test from 'node:test';
import assert from 'node:assert/strict';
import {treasuryURL,normalizeReleases,rankForBusiness,readTreasuryCache,refreshTreasury} from '../frontend/src/features/standalone/treasury-data.mjs';
const now=new Date('2026-10-20T12:00:00.000Z');
const example={releases:[
 {ocid:'ocds-9t57fa-54321',date:'2026-10-18T12:00:00Z',buyer:{name:'Provincial Health Department'},tender:{id:'ICT-22',title:'Provision of ICT support and software',description:'Eastern Cape software services',tenderPeriod:{endDate:'2026-11-04T10:00:00Z'},status:'active'}},
 {ocid:'ocds-9t57fa-54322',date:'2026-10-16T12:00:00Z',tender:{title:'Supply of uniforms',tenderPeriod:{endDate:'2026-10-05T10:00:00Z'},status:'active'}},
 {ocid:'ocds-9t57fa-54323',date:'2026-10-17T12:00:00Z',tender:{title:'Contract for meals',status:'cancelled'}},
]};
function memory(){let data={};return{getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v}};}
test('Treasury URL uses known government OCDS API and bounded UTC publication dates',()=>{
 assert.equal(treasuryURL(now,30), 'https://ocds-api.etenders.gov.za/api/OCDSReleases?dateFrom=2026-09-20&dateTo=2026-10-20&PageNumber=1');
 assert.match(treasuryURL(now,999),/dateFrom=2026-07-22/);
});
test('OCDS releases map to clear statuses and official release URLs',()=>{
 const records=normalizeReleases(example,now);assert.equal(records.length,3);
 assert.equal(records.find(x=>x.ocid.endsWith('54321')).stage,'check-deadline');
 assert.equal(records.find(x=>x.ocid.endsWith('54322')).stage,'passed');
 assert.equal(records.find(x=>x.ocid.endsWith('54323')).stage,'withdrawn');
 assert.equal(records[0].source, 'https://ocds-api.etenders.gov.za/api/OCDSReleases/release/ocds-9t57fa-54321');
});
test('OCDS release packages, nested envelopes, duplicates and invalid records handled',()=>{
 assert.equal(normalizeReleases({data:{releases:example.releases}},now).length,3);
 assert.equal(normalizeReleases({releases:[example.releases[0],example.releases[0],{ocid:'evil"><script',tender:{title:'Danger'}}]},now).length,1);
 assert.equal(normalizeReleases({foo:12},now).length,0);
});
test('Personal matching is local and does not claim eligibility',()=>{
 const records=normalizeReleases(example,now);
 const matches=rankForBusiness(records,{industry:'Technology',region:'Eastern Cape'});
 assert.ok(matches[0].title.includes('ICT support'));
 assert.ok(matches[0].relevance>0);
 assert.equal(matches[0].source.startsWith('https://ocds-api.etenders.gov.za'),true);
});
test('Refresh caches only genuine official records after successful API response',async()=>{
 const storage=memory();const result=await refreshTreasury({storage,now:()=>now,request:async({url})=>{
  assert.match(url,/OCDSReleases/);assert.doesNotMatch(url,/Technology|Eastern%20Cape|Litha/);
  return{status:200,data:example};
 }});
 assert.equal(result.status,'live');assert.equal(result.records.length,3);
 const cache=readTreasuryCache(storage);assert.equal(cache.status,'cached');
 assert.equal(cache.records[0].title,'Provision of ICT support and software');
});
test('Offline fallback keeps source date, never marks cached information live',async()=>{
 const storage=memory();await refreshTreasury({storage,now:()=>now,request:async()=>({status:200,data:example})});
 const result=await refreshTreasury({storage,now:()=>new Date('2026-10-21'),request:async()=>{throw new Error('offline')}});
 assert.equal(result.status,'cached');assert.equal(result.fetchedAt,now.toISOString());assert.equal(result.records.length,3);
});
test('Network failure without cached data does not invent tender records',async()=>{
 const r=await refreshTreasury({storage:memory(),now:()=>now,request:async()=>{throw Error('Network unreachable')}});
 assert.equal(r.status,'unavailable');assert.deepEqual(r.records,[]);
});
test('Unexpected API response is not silently presented as valid or overwriting cached data',async()=>{
 const storage=memory();await refreshTreasury({storage,now:()=>now,request:async()=>({status:200,data:example})});
 const result=await refreshTreasury({storage,now:()=>now,request:async()=>({status:200,data:{unknown:'shape'}})});
 assert.equal(result.status,'cached');assert.equal(result.records.length,3);
});
