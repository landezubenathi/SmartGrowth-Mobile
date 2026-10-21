// Offline-first readiness checks. Nothing in this file verifies a government register.
export const BUSINESS_STRUCTURES = [
 {id:'unsure',label:'Not sure yet'},
 {id:'sole_trader',label:'Individual / sole proprietor'},
 {id:'registered_company',label:'Registered company or close corporation'},
 {id:'other',label:'Partnership, co-operative or other'}
];
export const COMPLIANCE_PORTALS = {
 cipc:{name:'CIPC BizPortal',url:'https://www.bizportal.gov.za/',purpose:'Company registration and BizProfile search (account/login may be required)'},
 cipcAPI:{name:'CIPC APIVerse',url:'https://developer.cipc.co.za/',purpose:'Authorised company data API for subscribed applications'},
 sars:{name:'SARS — Verify Tax Compliance Status',url:'https://www.sars.gov.za/individuals/manage-your-tax-compliance-status/how-to-verify-tax-compliance-status/',purpose:'Official TCS verification with taxpayer consent and PIN'},
 csd:{name:'Central Supplier Database',url:'https://secure.csd.gov.za/',purpose:'Supplier registration and registration report'}
};
export function registrationFormat(value){
 const normalized=String(value||'').trim();
 if(!normalized)return {state:'empty',message:'No company registration number entered.'};
 // Common CIPC enterprise-number representation; format alone never implies registration.
 if(/^\d{4}\/\d{6}\/\d{2}$/.test(normalized))return {state:'plausible',message:'Looks like a CIPC enterprise number. Not checked against CIPC.'};
 return {state:'invalid',message:'Typical CIPC number format: YYYY/NNNNNN/NN. Check the official certificate.'};
}
export function supplierFormat(value){
 const normalized=String(value||'').trim().toUpperCase();
 if(!normalized)return {state:'empty',message:'No CSD supplier number entered.'};
 if(/^MAAA[A-Z0-9]{5,20}$/.test(normalized))return {state:'plausible',message:'Looks like a CSD supplier number. Not checked against CSD.'};
 return {state:'invalid',message:'CSD supplier numbers commonly begin with MAAA. Confirm on your supplier report.'};
}
export function complianceDetails(business){
 const c=business?.compliance||{}, structure=c.structure||'unsure', checks=c.checks||{};
 const purchasing=Boolean(c.governmentSupplier);
 const required=[
  {id:'structure',label:'Choose your business structure',done:structure!=='unsure',type:'app',hint:'Choose the legal form that fits the business; registering a company is not compulsory for every sole trader.'},
  ...(structure==='registered_company'?[{id:'cipc',label:'Review your CIPC company record',done:Boolean(checks.cipc?.reviewedAt),type:'self-reported',hint:'Confirm the enterprise details by signing in to BizPortal or an authorised service.'}]:[]),
  {id:'sars',label:'Review applicable SARS tax obligations',done:Boolean(checks.sars?.reviewedAt),type:'self-reported',hint:'Check the official SARS guidance. Do not enter your tax PIN into SmartGrowth.'},
  ...(purchasing?[{id:'csd',label:'Review CSD supplier registration',done:Boolean(checks.csd?.reviewedAt),type:'self-reported',hint:'Confirm your MAAA number and supplier report using CSD.'}]:[])
 ];
 const done=required.filter(x=>x.done).length;
 const sectorTips={
  Catering:'Food businesses may need municipal food premises approvals. Check your local municipality.',
  'Beauty & Wellness':'Depending on services and premises, local health and trading rules may apply.',
  Construction:'For certain public construction contracts, check applicable CIDB grading and registration requirements.',
  Transport:'Transport services may require particular operating licences depending on the service.',
  Agriculture:'Food handling, water, animal or agricultural rules may apply depending on activities.'
 };
 return {items:required,done,total:required.length,percent:required.length?Math.round(done/required.length*100):0,
  sectorTip:sectorTips[business?.industry]||'Permits and licences vary by business activity and municipality. Check what applies to your circumstances.',
  disclaimer:'Readiness tracking only. Entered numbers, document declarations and portal reviews are not official government verification.'};
}
export function updateCompliance(business, fields){
 const current=business?.compliance||{},next={...current,...fields};
 if(fields.cipcNumber!==undefined&&fields.cipcNumber!==current.cipcNumber){next.checks={...current.checks, cipc:undefined};}
 if(fields.csdNumber!==undefined&&fields.csdNumber!==current.csdNumber){next.checks={...current.checks, csd:undefined};}
 if(fields.structure!==undefined&&fields.structure!==current.structure){next.checks={...current.checks,cipc:undefined};}
 return {...business,compliance:next};
}
export function markPortalReviewed(business, portal, iso=new Date().toISOString()){
 if(!['cipc','sars','csd'].includes(portal))throw Error('Unknown official source');
 const c=business?.compliance||{};
 return {...business,compliance:{...c,checks:{...c.checks,[portal]:{reviewedAt:iso,method:'self_reported_portal_review'}}}};
}
export function clearPortalReview(business,portal){
 if(!['cipc','sars','csd'].includes(portal))throw Error('Unknown official source');
 const c=business?.compliance||{};
 return {...business,compliance:{...c,checks:{...c.checks,[portal]:undefined}}};
}
