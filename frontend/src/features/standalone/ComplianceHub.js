import React from 'react';
import {BUSINESS_STRUCTURES,COMPLIANCE_PORTALS,complianceDetails,registrationFormat,supplierFormat,markPortalReviewed,clearPortalReview,updateCompliance} from './compliance.mjs';
import './compliance.css';
import {demoRegistryMatch} from './demo-registry.mjs';
import {PRACTICE_SOURCE} from './mock-registry.mjs';
const activities=[
 {id:'cipc',title:'Company registration',summary:'BizPortal / BizProfile',description:'Company and close corporation information can be checked through the official CIPC service. CIPC APIVerse approval is required for automated verification.'},
 {id:'sars',title:'Tax and compliance',summary:'SARS eFiling / Online Query',description:'The taxpayer may authorise a third party using a TCS PIN. SmartGrowth does not accept, keep or validate tax PINs.'},
 {id:'csd',title:'Government supplier readiness',summary:'Central Supplier Database',description:'Register or inspect your official supplier report; do not confuse a supplier number with a verified supplier record.'}
];
const ago=(d)=>{if(!d)return 'Not reviewed';const parsed=new Date(d);return Number.isNaN(parsed.valueOf())?'Review date unavailable':`Self-reported on ${parsed.toLocaleDateString('en-ZA')}`;};
export default function ComplianceHub({business,onChange}){
 const c=business.compliance||{}, checks=c.checks||{}, readiness=complianceDetails(business);
 const change=fields=>onChange(b=>updateCompliance(b,fields),'Business compliance profile updated. No official status has been verified.');
 const review=key=>onChange(b=>markPortalReviewed(b,key),'Marked as reviewed by you. This is not government verification.');
 const clear=key=>onChange(b=>clearPortalReview(b,key),'Self-reported review cleared.');
 const cipcFormat=registrationFormat(c.cipcNumber),csdFormat=supplierFormat(c.csdNumber);
 const match=business.registrySource===PRACTICE_SOURCE?{status:'practice',message:'This business is recorded in your SmartGrowth simulated registry. It is not an official CIPC record.'}:demoRegistryMatch(business);
 return <div className="sg-compliance">
  <div className="sd-heading"><small>BUSINESS COMPLIANCE INTELLIGENCE</small><h1>Know what your business needs.</h1><p>Keep track of official steps for {business.name}. Checks on this page use your entries and are not proof of registration or tax compliance.</p></div>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Readiness tracker</h2><p>{readiness.done} of {readiness.total} applicable steps reviewed. Completion is not official verification.</p></div>
   <div className="sg-compliance-meter" role="progressbar" aria-label="Compliance preparation progress" aria-valuenow={readiness.percent} aria-valuemin="0" aria-valuemax="100"><span style={{width:`${readiness.percent}%`}}/></div>
   <div className="sg-compliance-tasks">{readiness.items.map(item=><div key={item.id}><b><span aria-hidden="true">{item.done?'✓':'○'}</span> {item.label}</b><p>{item.hint}</p><small>{item.done?(item.type==='app'?'In-app choice completed':'Self-reported portal review'):'Not completed'}</small></div>)}</div>
   <p className="sg-compliance-caution">{readiness.disclaimer}</p>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Business details</h2><p>Only enter information you are comfortable saving in this business workspace. Do not provide passwords, PINs or identity numbers.</p></div>
   <div className="sd-form">
    <div className={'sg-registry-result '+match.status} role="status"><b>{match.status==='practice'?'Practice registration recorded — simulated only':match.status==='demo-match'?'✓ Practice registry match — simulated only':match.status==='no-match'?'Not found in demonstration records':'Registration details'}</b><p>{match.message}</p><small>Never use this as proof of CIPC registration. Official verification requires authorised CIPC API access.</small></div>
    <label>Business structure<select aria-label="Business structure" value={c.structure||'unsure'} onChange={e=>change({structure:e.target.value})}>{BUSINESS_STRUCTURES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
    {c.structure==='registered_company'&&<label>Company registration number<input maxLength={15} readOnly={business.registrySource===PRACTICE_SOURCE} placeholder="Enter your registration certificate number" autoComplete="off" value={c.cipcNumber||''} onChange={e=>change({cipcNumber:e.target.value})}/><small className={'sg-compliance-format '+cipcFormat.state}>{business.registrySource===PRACTICE_SOURCE?'This is your simulated SmartGrowth registration reference. It is not a government certificate.':cipcFormat.message}</small></label>}
    <label className="sg-compliance-toggle"><input type="checkbox" checked={Boolean(c.governmentSupplier)} onChange={e=>change({governmentSupplier:e.target.checked})}/> I want to supply goods/services to government</label>
    {c.governmentSupplier&&<label>CSD supplier number (optional)<input maxLength={30} placeholder="MAAA..." autoComplete="off" value={c.csdNumber||''} onChange={e=>change({csdNumber:e.target.value.toUpperCase()})}/><small className={'sg-compliance-format '+csdFormat.state}>{csdFormat.message}</small></label>}
   </div>
   <p className="sg-compliance-info">{readiness.sectorTip}</p>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Official registration and compliance services</h2><p>Follow each official site and then record that you reviewed it. This is not live API verification.</p></div>
   {activities.filter(x=>(x.id==='cipc'?c.structure==='registered_company':x.id==='csd'?Boolean(c.governmentSupplier):true)).map(x=><div className="sg-compliance-source" key={x.id}>
    <div><strong>{x.title}</strong><small>{x.summary}</small><p>{x.description}</p><span className="sg-compliance-status">{ago(checks[x.id]?.reviewedAt)} · NOT API-VERIFIED</span></div>
    <div className="sg-compliance-buttons"><a href={COMPLIANCE_PORTALS[x.id].url} target="_blank" rel="noreferrer noopener">Open official portal ↗</a><button type="button" onClick={()=>review(x.id)}>I reviewed this on the portal</button>{checks[x.id]?.reviewedAt&&<button type="button" onClick={()=>clear(x.id)}>Clear review</button>}</div>
   </div>)}
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Official CIPC verification — future integration</h2></div>
   <p>There is no public anonymous BizPortal lookup API connected to SmartGrowth. CIPC APIVerse offers a read-only Companies API, but Four Horsemen Tech must obtain authorised subscription and OAuth access before we can perform real company checks.</p>
   <div className="sg-compliance-buttons"><a href={COMPLIANCE_PORTALS.cipcAPI.url} target="_blank" rel="noreferrer noopener">Apply for CIPC API access ↗</a></div>
   <p className="sg-compliance-caution">Never put a CIPC OAuth client secret, SARS tax PIN or CSD password in React, Firebase browser configuration, Firestore or GitHub repository variables. Official lookups must eventually run via a secured server-side function.</p>
  </section>
 </div>;
}
