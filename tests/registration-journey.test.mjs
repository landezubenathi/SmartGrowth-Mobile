import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOnboarding,makeOnboardedBusiness,ONBOARDING_STEPS} from '../frontend/src/features/standalone/onboarding.mjs';
import {registrationFromBusiness,PRACTICE_SOURCE} from '../frontend/src/features/standalone/mock-registry.mjs';
const input={email:'founder@example.org',password:'LongDemoPass!2026',businessName:'Rural Fresh Produce',structure:'registered_company',industry:'Agriculture',province:'Eastern Cape',street:'19 Main Road',city:'Mthatha',postalCode:'5099',directorName:'Sample Owner',directorId:'8001015009087',description:'Fresh produce and delivery'};
// SA ID format field is NEVER identity verification.
test('registration requires all business and director details',()=>{
 assert.throws(()=>validateOnboarding({...input,businessName:'A'}),/business name/i);
 assert.throws(()=>validateOnboarding({...input,street:''}),/street/i);
 assert.throws(()=>validateOnboarding({...input,password:'short'}),/password/i);
});
test('validate director ID format without storing personal ID',()=>{
 assert.throws(()=>validateOnboarding({...input,directorId:'123456'}),/ID format/);
 assert.throws(()=>validateOnboarding({...input,directorId:'8001015009088'}),/ID format/);
 const d=validateOnboarding(input);
 assert.equal('directorId' in d,false);
 assert.equal('password' in d,true);
});
test('onboarding business saves owner name and address, never password or raw ID',()=>{
 const d=validateOnboarding(input),b=makeOnboardedBusiness(d);
 assert.equal(b.name,input.businessName);
 assert.equal(b.registrationDetails.directorName,input.directorName);
 assert.equal(b.registrationDetails.address.city,input.city);
 assert.equal(b.compliance.structure,'registered_company');
 assert.equal(b.registrySource,PRACTICE_SOURCE);
 const json=JSON.stringify(b);
 assert.ok(!json.includes(input.directorId));assert.ok(!json.includes(input.password));
 const registry=registrationFromBusiness(b,'firebase_test_uid','founder@example.org');
 assert.ok(!JSON.stringify(registry).includes(input.directorId));
 assert.ok(!JSON.stringify(registry).includes(input.password));
});
test('registration animation clearly discloses the simulated government step',()=>{
 assert.ok(ONBOARDING_STEPS.length>=5);
 assert.ok(ONBOARDING_STEPS.some(s=>s.includes('no CIPC connection')));
});
