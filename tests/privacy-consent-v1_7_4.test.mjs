import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const gateway=readFileSync(new URL('../frontend/src/features/standalone/AccountGateway.js',import.meta.url),'utf8');
const more=readFileSync(new URL('../frontend/src/features/standalone/StandaloneApp.js',import.meta.url),'utf8');
const sync=readFileSync(new URL('../frontend/src/features/standalone/CloudSyncPanel.js',import.meta.url),'utf8');
const market=readFileSync(new URL('../frontend/src/features/standalone/SharedMarketplace.js',import.meta.url),'utf8');
test('registration notice explains purpose, POPIA and conditional government sharing',()=>{
 assert.match(gateway,/Before you register/);
 assert.match(gateway,/business-compliance requirements/);
 assert.match(gateway,/Protection of Personal Information Act \(POPIA\)/);
 assert.match(gateway,/will not send your details to government departments unless an authorised process/);
 assert.match(gateway,/type="checkbox" required checked=\{draft\.consentAccepted\}/);
});
test('registration screen and sync UI do not expose cloud provider implementation',()=>{
 assert.doesNotMatch(gateway,/through Firebase|uses Firebase Authentication|saved to Firestore/);
 assert.doesNotMatch(sync,/Configure Firebase|FastAPI server/);
 assert.doesNotMatch(market,/Check the published Firestore rules/);
});
test('More contains concise factual cloud storage and government registration disclosures',()=>{
 assert.match(more,/Privacy, consent & service information/);
 assert.match(more,/Google Firebase services/);
 assert.match(more,/not official CIPC registrations or verification/);
 assert.match(more,/not submitted to government departments through this registration flow/);
});
test('registration reference is not presented as a government number',()=>{
 assert.match(gateway,/SmartGrowth registration reference · not government-issued/);
 assert.doesNotMatch(gateway,/CIPC verified|CIPC Approved/);
});
