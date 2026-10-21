import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_REGISTRY,demoRegistryMatch} from '../frontend/src/features/standalone/demo-registry.mjs';
import {chatAnswer} from '../frontend/src/features/standalone/chat-advisor.mjs';
import {listingPayload} from '../frontend/src/features/standalone/market-utils.mjs';
import {normalizeReleases} from '../frontend/src/features/standalone/treasury-data.mjs';
import {blankBusiness,addTransaction} from '../frontend/src/features/standalone/engine.mjs';
const b=(r)=>({...blankBusiness(r.name,r.industry,r.province),compliance:{structure:'registered_company',cipcNumber:r.number}});
test('five fictional matching records, none implying genuine verification',()=>{
 assert.equal(DEMO_REGISTRY.length,5);
 for(const r of DEMO_REGISTRY){const m=demoRegistryMatch(b(r));assert.equal(m.status,'demo-match');assert.match(m.message,/NOT officially verified/i);}
});
test('mismatch name/number/province never verifies',()=>{
 const r=DEMO_REGISTRY[0];
 for(const change of [{name:'Different'},{region:'Gauteng'},{compliance:{cipcNumber:'2026/840206/07'}}]){
  assert.equal(demoRegistryMatch({...b(r),...change}).status,'no-match');
 }
});
test('assistant answers selected business only, routes correctly and does not invent cloud chat',()=>{
 let first=addTransaction(blankBusiness('First','Catering','Eastern Cape'),{kind:'income',amount:1234,category:'Sales',description:'Order'});
 let second=blankBusiness('Second','Technology','Gauteng');
 assert.match(chatAnswer(first,'How is my business doing?').body,/1[\s\u00a0,]*234/);
 assert.match(chatAnswer(second,'How is my business doing?').body,/R\s?0/);
 assert.equal(chatAnswer(first,'Where are my tender opportunities?').page,'opportunities');
 assert.equal(chatAnswer(first,'How to publish').page,'market');
});
test('marketplace public payload contains no private finance or email and checks input',()=>{
 const biz={...b(DEMO_REGISTRY[0]),transactions:[{email:'private@ex.com'}],userEmail:'private@ex.com'};
 const item=listingPayload(biz,{name:' Lunch ',description:' Catering ',price:350,createdAt:'2026-10-21T00:00:00.000Z'},'account-123');
 assert.deepEqual(Object.keys(item).sort(),['businessId','businessName','createdAt','description','industry','name','ownerUid','price','province','status'].sort());
 assert.doesNotMatch(JSON.stringify(item),/private@ex.com/);
 assert.equal(item.status,'published');
 assert.throws(()=>listingPayload(biz,{name:'',description:'test',price:30},'account-123'));
 assert.throws(()=>listingPayload(biz,{name:'valid',description:'test',price:30},null));
});
test('OCDS document URLs included only for HTTPS source links',()=>{
 const d=normalizeReleases({releases:[{ocid:'ocds-test-1',date:'2026-10-20',tender:{title:'Office supplies',documents:[{title:'Specification',url:'https://www.etenders.gov.za/doc.pdf'},{title:'Unsafe',url:'javascript:alert(1)'}]}}]});
 assert.equal(d.length,1);assert.equal(d[0].documents.length,1);assert.equal(d[0].documents[0].title,'Specification');
});
