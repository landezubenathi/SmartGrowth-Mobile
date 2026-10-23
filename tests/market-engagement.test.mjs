import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeMarketEnquiry,enquiryDocumentId,canContactOffer,enquiryStatus} from '../frontend/src/features/standalone/market-enquiry-data.mjs';
const offer={id:'offer_123_a',ownerUid:'seller-uid',businessId:'seller-business',name:'Catering services'};
const business={id:'buyer-business',name:'BrightCode Studio',industry:'Technology',region:'Gauteng'};
const sample={offer,business,uid:'buyer-uid',email:'buyer@example.com',name:'Thabo Example',phone:'073 123 4567',message:'Please send a quotation for a team event.',intent:'quotation'};
test('quotation captures buyer details but not sensitive business records',()=>{
 const d=makeMarketEnquiry(sample);
 assert.equal(d.ownerUid,'seller-uid');assert.equal(d.senderBusinessName,'BrightCode Studio');
 assert.equal(d.senderName,'Thabo Example');assert.equal(d.senderEmail,'buyer@example.com');
 assert.equal(d.senderPhone,'073 123 4567');assert.equal(d.intent,'quotation');assert.equal(d.status,'new');
 assert.ok(!('transactions' in d));assert.ok(!('invoices' in d));assert.ok(!('password' in d));
});
test('buyers cannot enquire about their own listing',()=>{
 assert.throws(()=>makeMarketEnquiry({...sample,uid:'seller-uid'}),/own listing/);
});
test('invalid contact and too-short message are rejected',()=>{
 assert.throws(()=>makeMarketEnquiry({...sample,phone:'my password'}),/contact/);
 assert.throws(()=>makeMarketEnquiry({...sample,message:'Hi'}),/10 characters/);
});
test('one sender has a stable enquiry id per offer',()=>{
 const id=enquiryDocumentId(offer.id,'buyer-uid');assert.equal(id,'interest_offer_123_a_buyer-uid');
 assert.equal(enquiryDocumentId(offer.id,'buyer-uid'),id);
});
test('contact buttons hidden for owner or existing enquiry',()=>{
 assert.equal(canContactOffer(offer,'seller-uid',false),false);
 assert.equal(canContactOffer(offer,'buyer-uid',true),false);
 assert.equal(canContactOffer(offer,'buyer-uid',false),true);
 assert.equal(enquiryStatus('contacted'),'Contacted');
});
test('Firestore is scoped to listing owner or authenticated sender',()=>{
 const rules=readFileSync(new URL('../frontend/firestore.rules',import.meta.url),'utf8');
 assert.match(rules,/match \/marketEnquiries\/\{enquiryId\}/);
 assert.match(rules,/resource\.data\.ownerUid == request\.auth\.uid/);
 assert.match(rules,/resource\.data\.senderUid == request\.auth\.uid/);
 assert.match(rules,/d\.senderEmail == request\.auth\.token\.email/);
 assert.match(rules,/exists\(offerPath\)/);
 assert.match(rules,/exists\(senderBusinessPath\)/);
});
test('UI includes inquiry buttons and private inbox',()=>{
 const ui=readFileSync(new URL('../frontend/src/features/standalone/SharedMarketplace.js',import.meta.url),'utf8');
 assert.match(ui,/Show interest/);
 assert.match(ui,/Send enquiry \/ request quote/);
 assert.match(ui,/Enquiries received/);
 assert.match(ui,/Send to business owner/);
 assert.match(ui,/share my name, email/);
});
