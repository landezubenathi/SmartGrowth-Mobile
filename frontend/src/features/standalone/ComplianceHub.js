import React from 'react';
import {COMPLIANCE_PORTALS,complianceDetails,markPortalReviewed,clearPortalReview} from './compliance.mjs';
import './compliance.css';
const activities=[
 {id:'sars',title:'Tax and compliance',summary:'SARS eFiling / Online Query',description:'The taxpayer may authorise a third party using a TCS PIN. SmartGrowth does not accept, keep or validate tax PINs.'},
 {id:'csd',title:'Government supplier readiness',summary:'Central Supplier Database',description:'Register or inspect your official supplier report; do not confuse a supplier number with a verified supplier record.'}
];
const ago=(d)=>{if(!d)return 'Not reviewed';const parsed=new Date(d);return Number.isNaN(parsed.valueOf())?'Review date unavailable':`Self-reported on ${parsed.toLocaleDateString('en-ZA')}`;};
export default function ComplianceHub({business,onChange}){
 const c=business.compliance||{}, checks=c.checks||{}, readiness=complianceDetails(business);
 const review=key=>onChange(b=>markPortalReviewed(b,key),'Marked as reviewed by you. This is not government verification.');
 const clear=key=>onChange(b=>clearPortalReview(b,key),'Self-reported review cleared.');
 return <div className="sg-compliance">
  <div className="sd-heading"><small>BUSINESS COMPLIANCE INTELLIGENCE</small><h1>Know what your business needs.</h1><p>Keep track of official steps for {business.name}. Checks on this page use your entries and are not proof of registration or tax compliance.</p></div>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Readiness tracker</h2><p>{readiness.done} of {readiness.total} applicable steps reviewed. Completion is not official verification.</p></div>
   <div className="sg-compliance-meter" role="progressbar" aria-label="Compliance preparation progress" aria-valuenow={readiness.percent} aria-valuemin="0" aria-valuemax="100"><span style={{width:`${readiness.percent}%`}}/></div>
   <div className="sg-compliance-tasks">{readiness.items.map(item=><div key={item.id}><b><span aria-hidden="true">{item.done?'✓':'○'}</span> {item.label}</b><p>{item.hint}</p><small>{item.done?(item.type==='app'?'In-app choice completed':'Self-reported portal review'):'Not completed'}</small></div>)}</div>
   <p className="sg-compliance-caution">{readiness.disclaimer}</p>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Tax and supplier compliance services</h2><p>Review official tax and supplier requirements when they apply to your business.</p></div>
   {activities.filter(x=>(x.id==='csd'?Boolean(c.governmentSupplier):true)).map(x=><div className="sg-compliance-source" key={x.id}>
    <div><strong>{x.title}</strong><small>{x.summary}</small><p>{x.description}</p><span className="sg-compliance-status">{ago(checks[x.id]?.reviewedAt)} · NOT API-VERIFIED</span></div>
    <div className="sg-compliance-buttons"><a href={COMPLIANCE_PORTALS[x.id].url} target="_blank" rel="noreferrer noopener">Open official portal ↗</a><button type="button" onClick={()=>review(x.id)}>I reviewed this on the portal</button>{checks[x.id]?.reviewedAt&&<button type="button" onClick={()=>clear(x.id)}>Clear review</button>}</div>
   </div>)}
  </section>

 </div>;
}
