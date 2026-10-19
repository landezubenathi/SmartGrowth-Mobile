import { authFetch } from '../config/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiBase } from '../config/api';
const colors = {navy:'#163f75', teal:'#147d65', amber:'#a56510', red:'#af4434', slate:'#66758b'};
const card = {background:'#fff',border:'1px solid #dde5f0',borderRadius:16,padding:20,boxShadow:'0 4px 18px rgba(20,50,90,.045)'};
const button = {border:0,borderRadius:9,padding:'10px 14px',background:colors.navy,color:'#fff',fontWeight:700,cursor:'pointer'};
const secondary={...button,background:'#e8edf7',color:colors.navy};
const zar = value => 'R '+Number(value||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const weeks=['Understand your business','Build evidence','Find growth opportunities','Protect and follow up'];
const pointTone={risk:['#fff1ea','#a33824'], action:['#eff5ff','#224c88'], opportunity:['#e9f7f1','#166448'],positive:['#e8f7ee','#137542']};

async function request(path, options={}) {
  let response;
  try {
    response=await authFetch(`/api/growth/advisor${path}`,{
      ...options,
      headers:{'Content-Type':'application/json',...(options.headers||{})}
    });
  } catch(err) { throw new Error('Cannot reach FastAPI at '+getApiBase()+' — start the backend server on port 8000.'); }
  let result;
  try {result=await response.json();} catch(err) {throw new Error('Unexpected backend response. Check the backend terminal.');}
  if (response.status === 404) {
    throw new Error('Growth Advisor API not found (HTTP 404). Check that the configured backend address points to the updated SmartGrowth server. Test '+getApiBase()+'/api/growth/advisor/health');
  }
  if(!response.ok) throw new Error(typeof result.detail==='string'?result.detail:'Could not load growth advice (HTTP '+response.status+').');
  return result;
}

function Tag({children,tone='default'}) {
  const types={high:['#fff1e8','#9c361c'],medium:['#eef2f9','#375274'],done:['#e9f7ed','#147547'],default:['#eef3f9','#46617d']};
  const [background,color]=types[tone]||types.default;
  return <span style={{borderRadius:100,background,color,padding:'5px 9px',fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>{children}</span>;
}

export default function GrowthAdvisor({userId}) {
  const navigate=useNavigate();
  const [data,setData]=useState(null), [error,setError]=useState(''), [busy,setBusy]=useState('');
  const [onlyPending,setOnlyPending]=useState(false);
  const [scenario,setScenario]=useState({revenue:0,costs:0});
  const [updated,setUpdated]=useState('');
  const refresh=useCallback(async()=>{
    setError('');
    try {const info=await request('/'+encodeURIComponent(userId));setData(info);setUpdated(new Date().toLocaleTimeString());}
    catch(err){setError(err.message);}
  },[userId]);
  useEffect(()=>{refresh();},[refresh]);

  const go=path=>navigate(path);
  const mark=async(task)=>{
    if(!task.manual)return;
    setBusy(task.id);setError('');
    try {
      await request('/progress',{method:'POST',body:JSON.stringify({user_id:userId,task_id:task.id,completed:!task.completed})});
      await refresh();
    } catch(err) {setError(err.message);} finally {setBusy('');}
  };
  const download=()=>{
    if(!data)return;
    const summary=data.snapshot;
    const output=[
      'SMARTGROWTH GROWTH AI — 30-DAY BUSINESS GROWTH SPRINT',
      'Four Horsemen Tech | local hackathon demonstration',
      'Business: '+(data.business?.business_name||'Business profile not supplied'),
      'Generated: '+data.generated_at,
      '',
      'Readiness: '+summary.passport_score+'/100 (illustrative only)',
      'Recorded income: '+zar(summary.income),
      'Recorded expenses: '+zar(summary.expenses),
      'Recorded surplus: '+zar(summary.surplus),
      'Unpaid demo invoices: '+summary.unpaid_invoices,
      '',
      ...data.plan.tasks.map(t=>`Week ${t.week} | ${t.completed?'DONE':'TO DO'} | ${t.title}\nWhy: ${t.why}\nNext step: ${t.next_step}\nEvidence: ${t.source}\n`),
      '',data.disclaimer
    ].join('\n');
    const url=URL.createObjectURL(new Blob([output],{type:'text/plain;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='SmartGrowth-Growth-Sprint.txt';
    document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
  };

  const s=data?.snapshot;
  const testSurplus=s ? (s.income*(1+scenario.revenue/100)-s.expenses*(1-scenario.costs/100)) : 0;
  const tasks=data?.plan?.tasks||[];
  return <div style={{display:'grid',gap:18}}>
    <div style={{...card,background:'linear-gradient(135deg,#123d72,#176476)',color:'#fff'}}>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:14,alignItems:'center'}}>
        <div>
          <div style={{fontSize:12,color:'#cbe6ee',letterSpacing:1.5,fontWeight:800}}>SMARTGROWTH · EXPLAINABLE BUSINESS ADVICE</div>
          <h2 style={{fontSize:28,margin:'9px 0 6px'}}>Your Business Growth Advisor</h2>
          <p style={{margin:0,color:'#e1eef7'}}>Recommendations, supporting evidence and a practical 30-day plan for {data?.business?.business_name||'your business'}.</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={refresh} style={{...button,background:'#fff',color:colors.navy}}>↻ Refresh advice</button>
          <button onClick={download} disabled={!data} style={{...button,background:'#dff5ed',color:'#145947',opacity:data?1:.6}}>↓ Export plan</button>
        </div>
      </div>
      <div style={{marginTop:15,color:'#d4e7ef',fontSize:12}}>Local rules-based recommendations • No external AI service or API key • Updated {updated||'when data is available'}</div>
    </div>
    {error&&<div role="alert" style={{...card,background:'#fff2eb',color:'#9d3318'}}>{error}</div>}
    {!data ? <div style={card}>{error ? <>
      <h3 style={{marginTop:0,color:colors.red}}>Advisor API unavailable</h3>
      <p>The other Growth Tools modules can continue working, but the SmartGrowth backend endpoint must be available to load recommendations.</p>
      <p><strong>Step 1:</strong> Close old SmartGrowth backend terminals and confirm nothing is using port 8000.</p>
      <p><strong>Step 2:</strong> From this SmartGrowth project's <code>backend</code> folder, run <code>python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload</code>.</p>
      <p><strong>Step 3:</strong> Open the <strong>Refresh advice</strong> button after checking the server connection. Do not open private API links outside your session. Then press <strong>Refresh advice</strong>.</p>
    </> : <><h3>Loading your advisor…</h3><p>Connecting to your local SmartGrowth backend on port 8000.</p></>}</div> : <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        {[
          ['Passport readiness',`${s.passport_score}/100`,'illustrative only'],
          ['Recorded surplus',zar(s.surplus),'not verified profit'],
          ['Outstanding invoices',zar(s.unpaid_value),`${s.unpaid_invoices} unpaid · ${s.overdue_invoices} overdue`],
          ['Sprint progress',`${data.plan.completed}/${data.plan.total}`,'completed milestones'],
        ].map(([title,value,subtitle])=><div style={card} key={title}>
          <div style={{fontSize:12,fontWeight:700,color:colors.slate}}>{title}</div>
          <div style={{fontSize:25,fontWeight:800,color:colors.navy,margin:'6px 0'}}>{value}</div>
          <div style={{fontSize:12,color:colors.slate}}>{subtitle}</div>
        </div>)}
      </div>
      <section style={card}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <h3 style={{margin:0,fontSize:21}}>Your most important next actions</h3>
          <Tag>Re-evaluated when records change</Tag>
        </div>
        {data.priority_actions.length ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginTop:14}}>
          {data.priority_actions.map(task=><article key={task.id} style={{padding:16,background:'#f5f8fc',borderRadius:12,border:'1px solid #e4eaf1'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}><Tag tone={task.priority==='High'?'high':'medium'}>{task.priority} priority</Tag><small style={{color:colors.slate}}>Week {task.week}</small></div>
            <h4 style={{margin:'12px 0 8px',fontSize:16}}>{task.title}</h4>
            <p style={{fontSize:13,color:'#475569'}}>{task.why}</p>
            <button style={secondary} onClick={()=>go(task.route)}>Open relevant page →</button>
          </article>)}
        </div> : <p style={{color:colors.teal,fontWeight:700}}>All current demonstration plan actions are completed.</p>}
      </section>
      <section style={card}>
        <h3 style={{marginTop:0,fontSize:21}}>What your business records are telling you</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
          {data.insights.map((i,index)=>{
            const [bg,fg]=pointTone[i.kind]||pointTone.action;
            return <article key={index} style={{padding:16,border:'1px solid #e4e9f0',borderRadius:12,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:800,fontSize:11,letterSpacing:.4,color:fg}}>{i.kind.toUpperCase()}</div>
              <strong style={{fontSize:16}}>{i.title}</strong>
              <p style={{margin:0,color:'#475569',fontSize:13,flex:1}}>{i.body}</p>
              <span style={{background:bg,color:fg,padding:10,borderRadius:8,fontSize:12}}>Evidence: {i.evidence}</span>
              <button style={secondary} onClick={()=>go(i.route)}>Investigate →</button>
            </article>;
          })}
        </div>
      </section>
      <section style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div><h3 style={{fontSize:21,margin:'0 0 5px'}}>{data.plan.title}</h3><div style={{color:colors.slate,fontSize:13}}>{data.plan.note}</div></div>
          <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13}}><input type="checkbox" checked={onlyPending} onChange={e=>setOnlyPending(e.target.checked)}/> Only show pending actions</label>
        </div>
        <div style={{margin:'15px 0 25px',height:13,background:'#e8edf3',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:`${data.plan.completion_percent}%`,background:'#15946e',transition:'width .2s'}}/></div>
        {[1,2,3,4].map(week=>{
          const items=tasks.filter(t=>t.week===week && (!onlyPending||!t.completed));
          if(!items.length)return null;
          return <div key={week} style={{marginBottom:24}}>
            <h4 style={{color:colors.navy,fontSize:17,margin:'0 0 10px'}}>Week {week} — {weeks[week-1]}</h4>
            <div style={{display:'grid',gap:10}}>
              {items.map(t=><article key={t.id} style={{border:'1px solid #e2e8f0',borderLeft:`5px solid ${t.completed?colors.teal:t.priority==='High'?colors.amber:colors.navy}`,borderRadius:10,padding:'14px 16px',background:t.completed?'#f5fbf7':'#fff'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10,justifyContent:'space-between',flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 230px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}><strong>{t.completed?'✓ ':''}{t.title}</strong><Tag tone={t.completed?'done':t.priority==='High'?'high':'medium'}>{t.completed?'Completed':t.priority}</Tag><Tag>{t.category}</Tag></div>
                    <p style={{fontSize:13,color:'#526078',margin:'9px 0 5px'}}>{t.why}</p>
                    <p style={{fontSize:13,margin:'5px 0'}}><strong>Next:</strong> {t.next_step}</p>
                    <small style={{color:colors.slate}}>Based on: {t.source}. {t.manual?'Self-declared task completion.':'Completion detected from stored activity.'}</small>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'stretch'}}>
                    <button style={secondary} onClick={()=>go(t.route)}>Open page →</button>
                    {t.manual&&<button disabled={busy===t.id} style={{...button,background:t.completed?'#e7f0f0':colors.teal,color:t.completed?colors.navy:'#fff'}} onClick={()=>mark(t)}>{busy===t.id?'Saving…':t.completed?'Undo self-mark':'Mark reviewed'}</button>}
                  </div>
                </div>
              </article>)}
            </div>
          </div>;
        })}
      </section>
      <section style={card}>
        <h3 style={{marginTop:0,fontSize:21}}>Procurement practice opportunities</h3>
        <p style={{color:colors.slate,fontSize:13}}>All sample briefs below are fictional. Match scores indicate similarity, not real eligibility.</p>
        {(data.procurement_matches||[]).map(o=><div key={o.id} style={{border:'1px solid #e0e8f2',borderRadius:10,padding:12,marginBottom:8}}>
          <strong>{o.title}</strong><p style={{fontSize:12,color:colors.slate,margin:'5px 0'}}>{o.region} · {o.sector} · {o.match_score}/100 similarity</p>
          <div style={{fontSize:12}}>Missing declarations: {o.missing_documents.length?o.missing_documents.join(', '):'None in demo checklist'}</div>
        </div>)}
        <button style={secondary} onClick={()=>go('/growth-workspace?tab=procurement')}>View procurement practice →</button>
      </section>
      <section style={card}>
        <h3 style={{fontSize:21,marginTop:0}}>What-if cash-flow explorer</h3>
        <p style={{fontSize:13,color:colors.slate}}>Try changes to your recorded totals. This is arithmetic for planning, NOT an AI forecast, cash-flow prediction or a change to your saved bookkeeping.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>
          <label style={{fontSize:13,fontWeight:700}}>Increase recorded income by {scenario.revenue}%
            <input aria-label="Income increase percentage" style={{width:'100%',marginTop:10}} type="range" min="0" max="50" step="5" value={scenario.revenue} onChange={e=>setScenario(v=>({...v,revenue:Number(e.target.value)}))}/>
          </label>
          <label style={{fontSize:13,fontWeight:700}}>Reduce recorded expenses by {scenario.costs}%
            <input aria-label="Expense reduction percentage" style={{width:'100%',marginTop:10}} type="range" min="0" max="30" step="5" value={scenario.costs} onChange={e=>setScenario(v=>({...v,costs:Number(e.target.value)}))}/>
          </label>
        </div>
        <div style={{display:'flex',gap:16,flexWrap:'wrap',marginTop:14,alignItems:'center'}}>
          <div><div style={{fontSize:12,color:colors.slate}}>Current recorded surplus</div><strong>{zar(s.surplus)}</strong></div>
          <div><div style={{fontSize:12,color:colors.slate}}>Illustrative adjusted surplus</div><strong style={{color:testSurplus>=0?colors.teal:colors.red,fontSize:22}}>{zar(testSurplus)}</strong></div>
          <button style={secondary} onClick={()=>setScenario({revenue:0,costs:0})}>Reset scenario</button>
        </div>
      </section>
      <p style={{fontSize:12,color:colors.slate,margin:'0 0 20px'}}>{data.disclaimer}</p>
    </>}
  </div>;
}
