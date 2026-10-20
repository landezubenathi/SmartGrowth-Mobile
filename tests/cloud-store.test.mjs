import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCloudState,saveCloudState,loadCloudState,mergeBusiness,mergeState,importDeviceToCloud,userKey} from '../frontend/src/features/standalone/cloud-store.mjs';
import {starterState} from '../frontend/src/features/standalone/storage.mjs';
function mem(){const m=new Map();return {getItem:x=>m.get(x)||null,setItem:(x,v)=>m.set(x,v)}}
test('one account local cache never reads another account or demo records',()=>{
 const s=mem();const a=emptyCloudState();a.businesses[0].name='Account A Only';saveCloudState('user_aa1',a,s);
 assert.equal(loadCloudState('user_aa1',s).businesses[0].name,'Account A Only');
 assert.notEqual(loadCloudState('user_bb2',s).businesses[0].name,'Account A Only');
 assert.notEqual(userKey('user_aa1'),userKey('user_bb2'));
});
test('live and offline edits are merged by record IDs',()=>{
 const state=emptyCloudState();
 const b=state.businesses[0];
 const local={...b,modifiedAt:'2026-10-19T16:00:00Z',transactions:[{id:'sale-A',kind:'income',amount:100,created_at:'2026-10-19T15:00:00Z'}]};
 const remote={...b,modifiedAt:'2026-10-20T12:00:00Z',transactions:[{id:'sale-B',kind:'income',amount:200,created_at:'2026-10-20T11:00:00Z'}]};
 const r=mergeBusiness(local,remote);
 assert.equal(r.transactions.length,2);
 assert.equal(r.transactions.reduce((s,t)=>s+t.amount,0),300);
});
test('paid invoices remain paid after merging an older unpaid copy',()=>{
 const b=emptyCloudState().businesses[0];const inv={id:'inv-1',status:'unpaid',amount:200,createdAt:'2026-10-20T00:00:00Z'};
 const m=mergeBusiness({...b,invoices:[{...inv,status:'paid'}]},{...b,invoices:[inv]});
 assert.equal(m.invoices[0].status,'paid');
});
test('remote record is added, missing local records queued for upload',()=>{
 const s=emptyCloudState();s.businesses[0].name='My actual shop';s.businesses[0].isPlaceholder=false;const b=s.businesses[0];
 const remote={...b,id:'remote-business1',name:'New cloud business',modifiedAt:'2026-10-20T12:00:00Z'};
 const m=mergeState(s,[remote]);
 assert.equal(m.state.businesses.length,2);
 assert.ok(m.needUpload.some(x=>x.id===b.id));
});
test('offline transaction is preserved when remote profile is newer',()=>{
 const s=emptyCloudState();const b=s.businesses[0];
 s.businesses[0]={...b,transactions:[{id:'tx-local',kind:'expense',amount:55}],modifiedAt:'2026-10-20T10:00:00Z'};
 const remote={...b,transactions:[],modifiedAt:'2026-10-20T11:00:00Z'};
 const m=mergeState(s,[remote]);
 assert.equal(m.state.businesses[0].transactions.length,1);
 assert.ok(m.needUpload.length>0);
});
test('separate device examples only enter cloud on explicit import',()=>{
 const base=emptyCloudState();assert.equal(base.businesses.length,1);
 const copied=importDeviceToCloud(base,starterState());
 assert.equal(copied.businesses.length,3);
 assert.equal(base.businesses.length,1);
});
