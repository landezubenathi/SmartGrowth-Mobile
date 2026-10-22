import test from 'node:test';
import assert from 'node:assert/strict';
import {blankBusiness,addTransaction,protectionJourney,fraudCheck} from '../frontend/src/features/standalone/engine.mjs';
import {DEMO_OPPORTUNITIES} from '../frontend/src/features/standalone/catalog.mjs';
import {chatAnswer} from '../frontend/src/features/standalone/chat-advisor.mjs';

test('Stay protected is independent of revenue, invoices and business growth',()=>{
 const b=addTransaction(blankBusiness('Own Business','Technology','Eastern Cape'),{kind:'income',amount:300,category:'Sales',description:'Invoice'});
 const p=protectionJourney(b);
 assert.deepEqual(p.steps.map(s=>s.id),['scan','security','contact','followup']);
 assert.equal(p.completed,0);
 assert.ok(p.steps.every(s=>s.page==='shield'));
});
test('protection milestones reflect scans and self-reviewed safety precautions',()=>{
 const b={...blankBusiness('Testing','Retail','Gauteng'),security:{scans:1,reviewedTips:true,reviewedContacts:true,reviewedScans:true,highRiskScans:1}};
 const p=protectionJourney(b);
 assert.equal(p.completed,4);
 assert.match(p.steps.at(-1).why,/warning/i);
});
test('scam screening remains cautious even when no pattern is present',()=>{
 assert.equal(fraudCheck('Please send your quotation').signals.length,0);
 assert.match(fraudCheck('Please send your quotation').recommendation,/does not establish legitimacy/i);
});
test('procurement briefs have succinct titles without example prefixes',()=>{
 assert.ok(DEMO_OPPORTUNITIES.length>=5);
 for(const item of DEMO_OPPORTUNITIES)assert.doesNotMatch(item.title,/^(example|sample|fictional)/i);
});
test('quick questions resolve to the correct account-scoped subject',()=>{
 const a=addTransaction(blankBusiness('Cafe A','Catering','Eastern Cape'),{kind:'income',amount:3200,category:'Sales',description:'Sales'});
 const b=blankBusiness('Cafe B','Catering','Eastern Cape');
 assert.match(chatAnswer(a,'How is my business doing?').body,/3[\s\u00a0,]*200/);
 assert.match(chatAnswer(b,'How is my business doing?').body,/R\s?0/);
 assert.equal(chatAnswer(a,'How can I protect my business from scams?').page,'shield');
 assert.equal(chatAnswer(b,'How do I publish my services?').page,'market');
 assert.equal(chatAnswer(b,'How can I improve my Growth Passport?').page,'journey');
});
