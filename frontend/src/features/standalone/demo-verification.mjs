/** Fictional, local-only registry adapter for demos. NEVER substitutes for CIPC. */
export const DEMO_REGISTRY = Object.freeze([
 {registrationNumber:'2026/000001/07',name:'Litha Catering (Sample)',structure:'registered_company'},
 {registrationNumber:'2026/000002/07',name:'BrightCode Studio (Sample)',structure:'registered_company'},
 {registrationNumber:'2026/000003/07',name:'Khula Digital (DEMO)',structure:'registered_company'},
]);
const normaliseName=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function verifyDemoBusiness({name='',registrationNumber='',structure='registered_company'}={}){
 const number=String(registrationNumber||'').trim();
 if(structure==='sole_trader')return {status:'not_applicable',label:'Company registration not required for all sole traders',source:'Demo registry only'};
 if(!name.trim()||!number)return {status:'not_checked',label:'Enter a business name and registration number',source:'Demo registry only'};
 if(!/^\d{4}\/\d{6}\/\d{2}$/.test(number))return {status:'invalid_format',label:'Registration number format is invalid',source:'Demo registry only'};
 const record=DEMO_REGISTRY.find(x=>x.registrationNumber===number);
 if(!record)return {status:'not_found',label:'No match in the fictional demo dataset',source:'Demo registry only'};
 if(normaliseName(record.name)!==normaliseName(name))return {status:'mismatch',label:'Company name does not match the fictional demo record',source:'Demo registry only'};
 return {status:'demo_match',label:'Matched fictional registry record — DEMO ONLY',record:{name:record.name,registrationNumber:record.registrationNumber},source:'Demo registry only'};
}
export const demoVerificationFor = b=>verifyDemoBusiness({name:b?.name||'',registrationNumber:b?.compliance?.cipcNumber||'',structure:b?.compliance?.structure||'registered_company'});
