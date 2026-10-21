import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDemoBusiness,demoVerificationFor} from '../frontend/src/features/standalone/demo-verification.mjs';
import {respondToHelp} from '../frontend/src/features/standalone/help-bot.mjs';
import {businessNotifications} from '../frontend/src/features/standalone/notifications.mjs';
import {sampleBusiness,addTransaction} from '../frontend/src/features/standalone/engine.mjs';

test('registration demo matches exact fictional name plus number and is explicitly not official',()=>{
 const a=verifyDemoBusiness({name:'Litha Catering (Sample)',registrationNumber:'2026/000001/07'});
 assert.equal(a.status,'demo_match');assert.match(a.label,/DEMO ONLY/);
 assert.equal(verifyDemoBusiness({name:'Other',registrationNumber:'2026/000001/07'}).status,'mismatch');
 assert.equal(verifyDemoBusiness({name:'Litha Catering (Sample)',registrationNumber:'2026/987654/07'}).status,'not_found');
 assert.equal(verifyDemoBusiness({name:'Litha Catering (Sample)',registrationNumber:'wrong'}).status,'invalid_format');
 assert.equal(verifyDemoBusiness({name:'Sole Business',registrationNumber:'',structure:'sole_trader'}).status,'not_applicable');
});
test('verification automatically follows selected business changes',()=>{
 const b=sampleBusiness('Catering','Eastern Cape','Litha Catering (Sample)');
 b.compliance={cipcNumber:'2026/000001/07',structure:'registered_company'};
 assert.equal(demoVerificationFor(b).status,'demo_match');
 assert.equal(demoVerificationFor({...b,name:'Changed name'}).status,'mismatch');
});
test('assistant answers questions from only selected business and provides navigation help',()=>{
 let first=sampleBusiness('Catering','Eastern Cape','One');
 let other=sampleBusiness('Technology','Gauteng','Two');
 first={...first,transactions:[]};
 other=addTransaction({...other,transactions:[]},{kind:'income',amount:42000,category:'Sales'});
 assert.match(respondToHelp(first,'How is my business performing?').text,/R 0,00/);
 assert.match(respondToHelp(other,'How is my business performing?').text,/R 42\s?000,00/);
 assert.equal(respondToHelp(first,'How do I create an invoice?').page,'invoices');
 assert.equal(respondToHelp(first,'How to publish a market offer?').page,'market');
 assert.match(respondToHelp(first,'Does CIPC verify me?').text,/fictional/i);
});
test('notification feed is business-specific and triggers budget / overdue alerts',()=>{
 const b=sampleBusiness('Catering','Eastern Cape','Test');
 const today=new Date('2026-10-20T12:00:00.000Z');
 const extra={...b,transactions:[{id:'t1',kind:'expense',amount:2500,category:'Supplies',created_at:'2026-10-18T13:00:00.000Z'}],invoices:[{id:'a',status:'unpaid',amount:3000,due_date:'2026-10-10',createdAt:'2026-10-01T13:00:00.000Z'}],insightSettings:{monthlyRevenueGoal:0,monthlyExpenseBudget:1000}};
 const a=businessNotifications(extra,today);assert.ok(a.some(x=>x.id==='overdue'));assert.ok(a.some(x=>x.id==='budget'));
 const none=businessNotifications({...extra,transactions:[],invoices:[],insightSettings:{monthlyRevenueGoal:0,monthlyExpenseBudget:0}},today);
 assert.ok(!none.some(x=>x.id==='overdue'||x.id==='budget'));
});

test('published marketplace payload excludes customer data, private finances and registration details',async()=>{
 const {publicListingPayload,marketDocumentId}=await import('../frontend/src/features/standalone/marketplace.mjs');
 const b={id:'sg-123',name:'Test Shop',industry:'Retail',region:'Eastern Cape',invoices:[{customer:'PRIVATE'}],transactions:[{amount:9000}],compliance:{cipcNumber:'PRIVATE'}};
 const x={id:'list-1',name:'Service',description:'Service description',price:125,privateNotes:'SECRET'};
 const p=publicListingPayload('demo_user',b,x);
 assert.equal(marketDocumentId('demo_user',x.id),'demo_user_list-1');
 assert.deepEqual(Object.keys(p).sort(),['ownerUid','businessId','businessName','industry','region','name','description','price','published','createdAt'].sort());
 assert.ok(!JSON.stringify(p).includes('PRIVATE')&&!JSON.stringify(p).includes('SECRET'));
});
