import { authFetch } from '../config/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase } from '../config/api';
const money=n=>'R '+Number(n||0).toLocaleString('en-ZA',{maximumFractionDigits:0});
const areas=[
  ['🏢','Start right','Business profile and registration guide','registration'],
  ['▤','Manage money','Sales, expenses and cash flow','bookkeeping'],
  ['🧾','Get paid','Invoices and demo payments','payments'],
  ['🛡️','Stay protected','Check suspicious messages','shield'],
  ['🏪','Find customers','List your product or service','market'],
  ['📋','Find opportunities','Practise procurement readiness','procurement'],
];
export default function SmartGrowthHome({user}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(true);
  const refresh=useCallback(async()=>{
    setBusy(true);setError('');
    try {const response=await authFetch(`/api/growth/advisor/${encodeURIComponent(user.username)}`,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);setData(await response.json());}
    catch(e){setError('Growth data unavailable ('+e.message+'). Check the backend connection under My Journey.');}
    finally{setBusy(false);}
  },[user.username]);
  useEffect(()=>{refresh();},[refresh]);
  const p=data?.plan;const s=data?.snapshot;const next=(data?.priority_actions||[]).find(t=>!t.completed);
  return <main className="sg-main">
    <section className="sg-homehero"><div className="sg-homeherotext"><span className="sg-overline">YOUR BUSINESS COMPANION</span><h1>Welcome back, {user.display_name?.split(' ')[0]||'entrepreneur'}.<br/><em>Keep growing.</em></h1><p>Everything you need to build a stronger business, organised around your journey—not complicated dashboards.</p><div className="sg-heroactions"><Link to="/journey" className="sg-action">Continue my journey <span>→</span></Link><Link to="/growth-workspace?tab=bookkeeping" className="sg-outline-action">Record a sale</Link></div></div><div className="sg-herodeco" aria-hidden="true"><div className="sg-circle one">✦</div><div className="sg-circle two">↗</div><span>GROW<br/>WITH<br/>PURPOSE</span></div></section>
    <div className="sg-sec-heading"><div><span className="sg-mini">YOUR PROGRESS</span><h2>Where your business stands</h2></div><button onClick={refresh} className="sg-textbutton" disabled={busy}>{busy?'Updating…':'↻ Refresh'}</button></div>
    {error&&<div className="sg-error" role="alert">{error} <Link to="/journey">Check connection →</Link></div>}
    <section className="sg-metricrow" aria-label="Business overview">
      <Link to="/growth-workspace?tab=passport" className="sg-metric"><span>Growth Passport</span><strong>{s?s.passport_score+'/100':'—'}</strong><small>Illustrative readiness</small></Link>
      <Link to="/growth-workspace?tab=bookkeeping" className="sg-metric"><span>Recorded surplus</span><strong>{s?money(s.surplus):'—'}</strong><small>Income minus expenses</small></Link>
      <Link to="/journey" className="sg-metric"><span>Journey progress</span><strong>{p?p.completed+'/'+p.total:'—'}</strong><small>Milestones completed</small></Link>
    </section>
    <section className="sg-next"><div><span className="sg-mini">RECOMMENDED NEXT STEP</span><h2>{next?next.title:'Choose a goal to get started'}</h2><p>{next?next.next_step:'SmartGrowth will guide you through the steps relevant to your business.'}</p></div><Link to={next?.route||'/journey'} className="sg-next-arrow" aria-label="Open recommended action">↗</Link></section>
    <div className="sg-sec-heading"><div><span className="sg-mini">EXPLORE</span><h2>Your business toolkit</h2></div><Link to="/growth-workspace" className="sg-textbutton">All tools →</Link></div>
    <section className="sg-toolgrid">{areas.map(([icon,title,desc,tab])=><Link key={tab} to={`/growth-workspace?tab=${tab}`} className="sg-tool"><div className="sg-toolicon">{icon}</div><strong>{title}</strong><p>{desc}</p><span>Explore →</span></Link>)}</section>
    <p className="sg-disclaimer">This is a local educational demo. Recorded values may include simulated payments. Passport scores are not official certifications or credit scores.</p>
  </main>;
}
