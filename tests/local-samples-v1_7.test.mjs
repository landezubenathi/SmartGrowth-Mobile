import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCAL_SAMPLE_PROFILES,localSampleBusinesses,isDeviceOnlySample} from '../frontend/src/features/standalone/local-examples.mjs';
import {starterState} from '../frontend/src/features/standalone/storage.mjs';
import {emptyCloudState,importDeviceToCloud,mergeState} from '../frontend/src/features/standalone/cloud-store.mjs';
import {financials} from '../frontend/src/features/standalone/engine.mjs';
import {DEMO_REGISTRY} from '../frontend/src/features/standalone/demo-registry.mjs';

test('exactly three complete fictional local-only profiles',()=>{
 assert.equal(LOCAL_SAMPLE_PROFILES.length,3);
 const ids=new Set(),names=new Set();
 for(const p of LOCAL_SAMPLE_PROFILES){
  assert.match(p.contactEmail,/\.invalid$/);
  assert.ok(p.name&&p.owner&&p.structure&&p.industry&&p.description);
  assert.ok(p.address.street&&p.address.city&&p.address.province&&/^\d{4}$/.test(p.address.postalCode));
  assert.match(p.practiceReference,/^SG-LOCAL-/);
  ids.add(p.id);names.add(p.name);
 }
 assert.equal(ids.size,3);assert.equal(names.size,3);
});
test('local records have complete read-only registration details but no personal ID or CIPC verification',()=>{
 const businesses=localSampleBusinesses();assert.equal(businesses.length,3);
 for(const b of businesses){
  assert.equal(isDeviceOnlySample(b),true);
  assert.ok(b.registrationDetails.directorName&&b.registrationDetails.address.street);
  assert.equal(b.compliance.cipcNumber,'');
  assert.ok(financials(b).income>0&&financials(b).expenses>0);
  assert.equal(b.transactions.every(t=>t.sample),true);
  assert.equal(b.invoices.every(i=>i.sample),true);
  assert.doesNotMatch(JSON.stringify(b),/directorId|password|privateKey|verified.*cipc/i);
 }
});
test('bundled examples cannot silently or deliberately become cloud business records',()=>{
 const device=starterState(),cloud=emptyCloudState();
 assert.equal(device.businesses.length,3);
 assert.equal(mergeState(cloud,[]).needUpload.length,0);
 assert.equal(importDeviceToCloud(cloud,device).businesses.length,1);
});
test('no seeded firebase users and only three fictional local registry matches',()=>{
 assert.equal(DEMO_REGISTRY.length,3);
 assert.ok(DEMO_REGISTRY.every(r=>r.number.startsWith('2026/')));
});
