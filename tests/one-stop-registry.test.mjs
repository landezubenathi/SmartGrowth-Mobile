import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceRegistrationNumber,validateRegistrationInput,registrationFromBusiness,businessFromRegistration,attachRegisteredBusinesses,PRACTICE_SOURCE} from '../frontend/src/features/standalone/mock-registry.mjs';
import {blankBusiness,addTransaction,addInvoice,markInvoicePaid} from '../frontend/src/features/standalone/engine.mjs';
import {emptyCloudState} from '../frontend/src/features/standalone/cloud-store.mjs';
const make=(id='seed_registry_1')=>({ownerUid:'firebase_uid_test_1',businessId:id,email:'litha.catering@smartgrowth.example',businessName:'Litha Catering Studio',industry:'Catering',province:'Eastern Cape',registrationNumber:'2026/840201/07',source:PRACTICE_SOURCE,status:'practice',createdAt:'2026-10-21T01:00:00.000Z',modifiedAt:'2026-10-21T01:00:00.000Z'});
test('all generated practice references follow defined format',()=>{
 assert.equal(practiceRegistrationNumber(2026,123456),'2026/123456/07');
 assert.throws(()=>practiceRegistrationNumber(2026,3));
});
test('new registration requires a name business type and province',()=>{
 assert.throws(()=>validateRegistrationInput({name:'A',industry:'Catering',region:'Eastern Cape'}));
 assert.deepEqual(validateRegistrationInput({name:'  Litha  Food  ',industry:'Catering',region:'Eastern Cape'}).name,'Litha Food');
});
test('registry contains business data without passwords',()=>{
 const b=blankBusiness('New Catering','Catering','Eastern Cape');b.compliance={cipcNumber:'2026/234567/07'};
 const record=registrationFromBusiness(b,'firebase_uid_test_1','owner@smartgrowth.example');
 assert.equal(record.ownerUid,'firebase_uid_test_1');assert.equal(record.registrationNumber,'2026/234567/07');
 assert.equal(Object.hasOwn(record,'password'),false);
 assert.equal(Object.hasOwn(record,'cipcVerified'),false);
});
test('first cloud login imports seeded business and discards untouched placeholder',()=>{
 const initial=emptyCloudState();const result=attachRegisteredBusinesses(initial,[make()]);
 assert.equal(result.state.businesses.length,1);
 assert.equal(result.state.businesses[0].name,'Litha Catering Studio');
 assert.equal(result.state.businesses[0].compliance.cipcNumber,'2026/840201/07');
 assert.equal(result.state.activeId,'seed_registry_1');
 assert.equal(result.state.businesses[0].transactions.length,0);
});
test('repeated seeded logins do not duplicate business or overwrite financial data',()=>{
 const first=attachRegisteredBusinesses(emptyCloudState(),[make()]).state;
 let b=addTransaction(first.businesses[0],{kind:'income',amount:750,category:'Sales',description:'Service'});
 b=addInvoice(b,{customer:'Buyer',description:'Catering',amount:400});b=markInvoicePaid(b,b.invoices[0].id);
 const second=attachRegisteredBusinesses({...first,businesses:[b]},[make()]).state;
 assert.equal(second.businesses.length,1);assert.equal(second.businesses[0].transactions.length,2);
 assert.equal(second.businesses[0].invoices[0].status,'paid');
});
test('registry import rejects fabricated official verification statuses',()=>{
 assert.throws(()=>businessFromRegistration({...make(),status:'cipc-verified'}));
 assert.throws(()=>businessFromRegistration({...make(),registrationNumber:'WRONG'}));
});
test('a second seeded user owns different registry data',()=>{
 const a=attachRegisteredBusinesses(emptyCloudState(),[make('seed_registry_1')]);
 const b=attachRegisteredBusinesses(emptyCloudState(),[{...make('seed_registry_2'),ownerUid:'another_firebase_user',email:'another@smartgrowth.example',businessName:'Other Studio',registrationNumber:'2026/840202/07'}]);
 assert.notEqual(a.state.businesses[0].id,b.state.businesses[0].id);
 assert.notEqual(a.state.businesses[0].name,b.state.businesses[0].name);
});
