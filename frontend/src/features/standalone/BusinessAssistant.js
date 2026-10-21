import React,{useEffect,useMemo,useState} from 'react';
import {Bot,Send,Settings2} from 'lucide-react';
import {analyzeBusiness,validateInsightSettings} from './intelligence.mjs';
import {HELPFUL_PROMPTS,respondToHelp} from './help-bot.mjs';
import {currency} from './engine.mjs';
export default function BusinessAssistant({business,onNavigate,onSaveGoals}){
 const [input,setInput]=useState('');const [messages,setMessages]=useState([]);
 const [showGoals,setShowGoals]=useState(false);const [sales,setSales]=useState('');const [budget,setBudget]=useState('');const [error,setError]=useState('');
 const info=useMemo(()=>analyzeBusiness(business),[business]);
 useEffect(()=>{setMessages([]);setInput('');setShowGoals(false);},[business.id]);
 const ask=q=>{if(!q.trim())return;const response=respondToHelp(business,q);
  setMessages(old=>[...old,{role:'user',text:q},{role:'assistant',...response}].slice(-24));setInput('');};
 const openGoals=()=>{setSales(String(info.goals.monthlyRevenueGoal||''));setBudget(String(info.goals.monthlyExpenseBudget||''));setShowGoals(true);};
 const saveGoals=e=>{e.preventDefault();try{onSaveGoals(validateInsightSettings({monthlyRevenueGoal:sales===''?0:Number(sales),monthlyExpenseBudget:budget===''?0:Number(budget)}));setShowGoals(false);setError('');}catch(ex){setError(ex.message);}};
 return <div className="sd-assistant-page">
  <div className="sd-heading"><small>SMARTGROWTH HELP</small><h1>Ask SmartGrowth</h1><p>One place for application FAQs and explanations of <b>{business.name}</b>'s recorded data.</p></div>
  <section className="sd-panel"><div className="sd-assistant-head"><Bot size={23}/><div><strong>Your business assistant</strong><small>Local FAQ + business analytics · Not connected to an external AI model</small></div></div>
   <div className="sd-assistant-conversation" role="log" aria-label="Assistant conversation" aria-live="polite">
    <div className="sd-assistant-bubble assistant">Hello! I can explain your finances, invoices, market listings, business verification and how to use SmartGrowth. I only access the currently selected business.</div>
    {messages.map((m,i)=><div className={`sd-assistant-bubble ${m.role}`} key={`${i}-${m.role}`}><span>{m.text}</span>{m.page&&<button className="sd-btn secondary" onClick={()=>onNavigate(m.page)}>Open {m.page==='compliance'?'Verify Business':m.page==='opportunities'?'Procurement':m.page==='assistant'?'Assistant':m.page} →</button>}</div>)}
   </div>
   <div className="sd-assistant-prompts">{HELPFUL_PROMPTS.map(q=><button type="button" onClick={()=>ask(q)} key={q}>{q}</button>)}</div>
   <form className="sd-assistant-entry" onSubmit={e=>{e.preventDefault();ask(input);}}><input value={input} maxLength={250} onChange={e=>setInput(e.target.value)} placeholder="Ask about your business or the app" aria-label="Message to SmartGrowth assistant"/><button className="sd-btn" disabled={!input.trim()} type="submit"><Send size={16}/><span>Send</span></button></form>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Selected business snapshot</h2><p>Calculated from saved records; not a bank statement or audited report.</p></div><div className="sd-kpis"><div className="sd-kpi"><span>Income · 30 days</span><strong>{currency(info.current.income)}</strong></div><div className="sd-kpi"><span>Expenses · 30 days</span><strong>{currency(info.current.expenses)}</strong></div><div className="sd-kpi"><span>Unpaid invoices</span><strong>{info.invoices.unpaidCount}</strong></div></div><button className="sd-btn secondary" type="button" onClick={openGoals}><Settings2 size={16}/> Set monthly goals</button>
  {showGoals&&<form className="sd-form" onSubmit={saveGoals}><label>Monthly sales goal (ZAR)<input type="number" min="0" step="0.01" value={sales} onChange={e=>setSales(e.target.value)}/></label><label>Monthly expense budget (ZAR)<input type="number" min="0" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)}/></label>{error&&<p className="sd-error" role="alert">{error}</p>}<button className="sd-btn" type="submit">Save goals</button></form>}
  </section>
  <p className="sd-footnote">Answers come from a transparent offline question matcher and existing calculations. No ChatGPT/OpenAI API is enabled in this release. This assistant cannot check government records or act on your behalf.</p>
 </div>;
}
