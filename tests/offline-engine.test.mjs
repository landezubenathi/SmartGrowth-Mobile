import test from 'node:test';
import assert from 'node:assert/strict';
import {blankBusiness, sampleBusiness, addTransaction, addInvoice, markInvoicePaid, passport, financials, journey, fraudCheck, matches} from '../frontend/src/features/standalone/engine.mjs';
import {starterState,exportState,parseBackup} from '../frontend/src/features/standalone/storage.mjs';
test('seeds distinct sample businesses with explicitly fictional data',()=>{
 const state=starterState();assert.equal(state.businesses.length,2);assert.notEqual(state.businesses[0].id,state.businesses[1].id);
 assert.ok(state.businesses[0].transactions.every(x=>x.sample));
});
test('new any-sector business starts with empty financial records',()=>{
 const b=blankBusiness('My Repair Shop','Other','Eastern Cape');assert.equal(b.transactions.length,0);assert.equal(b.invoices.length,0);assert.equal(passport(b).score,15);
});
test('invoice issue is not income; paid demo invoice is income exactly once',()=>{
 let b=blankBusiness('Food Sales','Catering','Gauteng');b=addInvoice(b,{customer:'Buyer',description:'Lunch',amount:300});assert.equal(financials(b).income,0);
 const paid=markInvoicePaid(b,b.invoices[0].id);assert.equal(financials(paid).income,300);assert.deepEqual(markInvoicePaid(paid,b.invoices[0].id),paid);
});
test('passports update automatically, self declarations are separate',()=>{
 let b=blankBusiness('Code Shop','Technology','Gauteng');assert.equal(passport(b).score,15);
 b=addTransaction(b,{kind:'income',amount:6000,category:'Sales',description:'Product'});
 assert.equal(passport(b).autoPoints,50);assert.equal(passport(b).documentPoints,0);
 b={...b,documents:{tax:true}};assert.equal(passport(b).documentPoints,10);
});
test('expenses reduce surplus, so healthy-surplus milestone can disappear',()=>{
 let b=blankBusiness('Service Biz','Services','Eastern Cape');b=addTransaction(b,{kind:'income',amount:700,category:'Sales'});
 b=addTransaction(b,{kind:'expense',amount:900,category:'Costs'});
 assert.equal(financials(b).surplus,-200);assert.ok(journey(b).completed>=3);assert.equal(passport(b).automatic.find(x=>x.id==='surplus').complete,false);
});
test('signals suspicious text and distinguishes unknown from safe',()=>{
 assert.equal(fraudCheck('Pay registration fee urgently and send OTP').level,'High concern');
 assert.equal(fraudCheck('Please send a quotation').level,'No obvious indicators');
});
test('opportunity catalogue remains simulated and matches sector',()=>{
 const b=blankBusiness('Garden','Agriculture','Eastern Cape');const m=matches(b);assert.equal(m[0].industry,'Agriculture');assert.ok(m.every(x=>x.sample));
});
test('backup round trips without requiring online API',()=>{
 const state=starterState();assert.deepEqual(parseBackup(exportState(state)),state);
});
