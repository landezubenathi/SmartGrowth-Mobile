import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const view=readFileSync(new URL('../frontend/src/features/standalone/AccountGateway.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../frontend/src/features/standalone/onboarding.mjs',import.meta.url),'utf8');
test('registration presents consent before submission and blocks unchecked consent',()=>{
 assert.match(view,/Before you register/);
 assert.match(view,/type="checkbox" required checked=\{draft\.consentAccepted\}/);
 assert.match(engine,/form\.consentAccepted!==true/);
});
test('ID and postal inputs reject mixed paste and request numeric mobile input',()=>{
 assert.match(view,/inputMode:'numeric'/);
 assert.match(view,/onBeforeInput:/);
 assert.match(view,/onPaste:/);
 assert.match(view,/onDrop:/);
 assert.match(view,/acceptedNumericEntry\(e\.target\.value,maxLength\)/);
 assert.match(view,/numericField\('directorId',13/);
 assert.match(view,/numericField\('postalCode',4/);
});
test('completion has concise SmartGrowth reference and no previous highlighted warning box',()=>{
 assert.match(view,/SmartGrowth registration reference · not government-issued/);
 assert.doesNotMatch(view,/This is not a CIPC registration number\. No submission has been made to CIPC or BizPortal\./);
});
