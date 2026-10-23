import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {blankBusiness} from '../frontend/src/features/standalone/engine.mjs';
import {complianceDetails,markPortalReviewed} from '../frontend/src/features/standalone/compliance.mjs';

test('business compliance no longer asks a signed-in company to register again',()=>{
  const business={...blankBusiness('Registered company','Services','Eastern Cape'),compliance:{structure:'registered_company'}};
  const result=complianceDetails(business);
  assert.deepEqual(result.items.map(x=>x.id),['structure','sars']);
  const marked=markPortalReviewed(business,'cipc','2026-10-20T18:00:00.000Z');
  assert.ok(marked.compliance.checks.cipc?.reviewedAt,'historical review data retained');
  assert.deepEqual(complianceDetails(marked).items.map(x=>x.id),['structure','sars']);
});
test('company registration section and portal button removed, tax guidance remains',()=>{
  const page=fs.readFileSync(new URL('../frontend/src/features/standalone/ComplianceHub.js',import.meta.url),'utf8');
  assert.doesNotMatch(page,/title:'Company registration'/);
  assert.match(page,/title:'Tax and compliance'/);
  assert.match(page,/Tax and supplier compliance services/);
});
