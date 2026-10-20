import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationFormat,supplierFormat,complianceDetails,updateCompliance,markPortalReviewed,clearPortalReview} from '../frontend/src/features/standalone/compliance.mjs';
import {blankBusiness, passport, advice} from '../frontend/src/features/standalone/engine.mjs';

test('CIPC format check never claims registration verified',()=>{
 assert.equal(registrationFormat('2026/123456/07').state,'plausible');
 assert.match(registrationFormat('2026/123456/07').message,/not checked/i);
 assert.equal(registrationFormat('invalid').state,'invalid');
});
test('CSD number is plausibility check only',()=>{
 assert.equal(supplierFormat('MAAA12345678').state,'plausible');
 assert.match(supplierFormat('MAAA12345678').message,/Not checked/i);
});
test('sole trader receives no blanket requirement to register a company',()=>{
 let b=blankBusiness('Neighbourhood repairs','Services','Eastern Cape');
 b=updateCompliance(b,{structure:'sole_trader'});
 assert.equal(complianceDetails(b).items.some(x=>x.id==='cipc'),false);
 assert.equal(complianceDetails(b).items.some(x=>x.id==='sars'),true);
});
test('registered companies get CIPC step, suppliers get CSD step',()=>{
 let b=updateCompliance(blankBusiness('Acme','Construction','Eastern Cape'),{structure:'registered_company',governmentSupplier:true});
 assert.deepEqual(complianceDetails(b).items.map(x=>x.id),['structure','cipc','sars','csd']);
});
test('user review is labelled self-reported; cannot change Passport verification score',()=>{
 let b=updateCompliance(blankBusiness('Acme','Retail','Gauteng'),{structure:'registered_company',cipcNumber:'2026/123456/07'});
 const before=passport(b).score;
 b=markPortalReviewed(b,'cipc','2026-10-20T18:00:00.000Z');
 assert.equal(b.compliance.checks.cipc.method,'self_reported_portal_review');
 assert.equal(complianceDetails(b).done,2);
 assert.equal(passport(b).score,before);
 assert.ok(advice(b).items.some(x=>x.page==='compliance'));
});
test('changing company number resets previous self-reported check',()=>{
 let b=updateCompliance(blankBusiness('Acme','Retail','Gauteng'),{structure:'registered_company',cipcNumber:'2026/123456/07'});
 b=markPortalReviewed(b,'cipc');b=updateCompliance(b,{cipcNumber:'2025/000001/07'});
 assert.equal(b.compliance.checks.cipc,undefined);
});
test('user can clear prior review',()=>{
 let b=markPortalReviewed(blankBusiness('Acme','Retail','Gauteng'),'sars');
 b=clearPortalReview(b,'sars');assert.equal(b.compliance.checks.sars,undefined);
});
test('reviews store no SARS PINs or CSD passwords',()=>{
 const b=markPortalReviewed(blankBusiness('Acme','Retail','Gauteng'),'sars');
 assert.doesNotMatch(JSON.stringify(b.compliance),/password|tcsPin|taxPin/);
});
