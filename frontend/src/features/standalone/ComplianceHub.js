import React from 'react';
import {ShieldCheck,Info} from 'lucide-react';
import {BUSINESS_STRUCTURES,COMPLIANCE_PORTALS,registrationFormat,updateCompliance} from './compliance.mjs';
import {demoVerificationFor,DEMO_REGISTRY} from './demo-verification.mjs';
import './compliance.css';
/** Minimal demo-only business registry matching. No CIPC network or ownership validation. */
export default function ComplianceHub({business,onChange}){
 const c=business.compliance||{},result=demoVerificationFor(business);
 const change=fields=>onChange(b=>updateCompliance(b,fields),'Business registration information saved. Simulation only, not CIPC verification.');
 return <div className="sg-compliance">
  <div className="sd-heading"><small>BUSINESS VERIFICATION · DEMONSTRATION</small><h1>Check your business details.</h1><p>Match the selected business against fictional test data while the official CIPC API integration is unavailable.</p></div>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Fictional registry lookup</h2><p>Business names and registration numbers must match a demo record exactly (ignoring spaces and punctuation in names).</p></div>
   <div className="sd-form"><label>Business name<input readOnly value={business.name} aria-label="Selected business name"/><small>Edit the name in My businesses.</small></label>
   <label>Business structure<select value={c.structure||'unsure'} onChange={e=>change({structure:e.target.value})}>{BUSINESS_STRUCTURES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
   <label>Business registration number<input maxLength={15} value={c.cipcNumber||''} placeholder="2026/000001/07" autoComplete="off" onChange={e=>change({cipcNumber:e.target.value})}/><small>{registrationFormat(c.cipcNumber).message}</small></label></div>
   <div className={`sd-verification-result ${result.status==='demo_match'?'matched':''}`} role="status"><ShieldCheck size={22}/><div><strong>{result.label}</strong><p>Source: local fictional SmartGrowth demo registry. This is NOT an official CIPC registration or owner verification.</p></div></div>
   <div className="sd-treasury-note"><Info size={17}/> <span>Testing example: select the built-in business <b>Litha Catering (Sample)</b> and enter <b>2026/000001/07</b>. There are {DEMO_REGISTRY.length} fictional registry records. Any other business may correctly show “No match in the fictional demo dataset.”</span></div>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Official registration resources</h2><p>Keep official research separate from simulated verification.</p></div>
   <div className="sd-source"><div><b>CIPC / BizPortal</b><p>Visit official channels to confirm a real registration. SmartGrowth does not currently query their records.</p></div><a href={COMPLIANCE_PORTALS.cipc.url} target="_blank" rel="noreferrer noopener" className="sd-official-link">Open CIPC ↗</a></div>
   <div className="sd-source"><div><b>SARS</b><p>Review applicable tax obligations directly; this screen does not issue tax compliance status.</p></div><a href={COMPLIANCE_PORTALS.sars.url} target="_blank" rel="noreferrer noopener" className="sd-official-link">Open SARS ↗</a></div>
   <p className="sd-muted">Other compliance guidance remains available through Official Sources. Existing saved compliance information is retained in your business data for compatibility.</p>
  </section>
 </div>;
}
