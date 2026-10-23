import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registryStatus} from '../frontend/src/features/standalone/registry-status.mjs';
import {blankBusiness} from '../frontend/src/features/standalone/engine.mjs';
import {PRACTICE_SOURCE} from '../frontend/src/features/standalone/mock-registry.mjs';
const src=new URL('../frontend/src/features/standalone/',import.meta.url);
const read=(name)=>fs.readFileSync(new URL(name,src),'utf8');
test('Practice registration is always labelled as SmartGrowth, never official CIPC',()=>{
 const b={...blankBusiness('Litha','Catering','Eastern Cape'),registrySource:PRACTICE_SOURCE};
 const status=registryStatus(b);
 assert.equal(status.label,'SmartGrowth Registered');
 assert.match(status.detail,/Not verified by CIPC/);
 assert.doesNotMatch(status.label,/CIPC Verified/i);
});
test('A fictional registry match is explicitly a SmartGrowth match',()=>{
 const b={...blankBusiness('Litha Catering Studio','Catering','Eastern Cape'),compliance:{cipcNumber:'2026/840201/07'}};
 assert.equal(registryStatus(b).label,'SmartGrowth Registry Match');
 assert.doesNotMatch(registryStatus(b).label,/CIPC Verified/i);
});
test('A missing registry status is not presented as verified',()=>{
 const b=blankBusiness('Unknown Co','Retail','Eastern Cape');
 assert.equal(registryStatus(b).label,'CIPC Status Unverified');
});
test('Duplicate compliance sections are gone; official steps remain',()=>{
 const s=read('ComplianceHub.js');
 assert.doesNotMatch(s,/<h2>Business details<\/h2>/);
 assert.doesNotMatch(s,/Official CIPC verification — future integration/);
 assert.match(s,/Tax and supplier compliance services/);
 assert.doesNotMatch(s,/title:'Company registration'/);
 assert.doesNotMatch(s,/BizPortal \/ BizProfile/);
 assert.match(s,/Readiness tracker/);
});
test('Treasury source links are explicitly allowed to wrap',()=>{
 const css=read('standalone.css');
 assert.match(css,/\.sd-treasury \.sd-treasury-links \.sd-official-link\s*\{/);
 assert.match(css,/white-space:normal!important/);
 assert.match(css,/overflow-wrap:anywhere/);
});
