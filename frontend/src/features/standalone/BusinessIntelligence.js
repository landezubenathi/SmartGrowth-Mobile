import React,{useMemo,useState} from 'react';
import {analyzeBusiness,answerBusinessQuestion,intelligenceReport,validateInsightSettings} from './intelligence.mjs';
import {currency} from './engine.mjs';
import SmartIcon from './SmartIcon';
import './intelligence.css';

const percent=value=>value===null?'Not enough comparison data':`${value>0?'+':''}${value.toFixed(0)}% vs previous 30 days`;
const label={high:'Needs attention',medium:'Worth reviewing',info:'Next step'};

function Gauge({title,amount,target,progress,note}){
 return <div className="sg-int-goal">
  <div className="sg-int-split"><b>{title}</b><strong>{target>0?`${Math.max(0,progress)}%`:'Not set'}</strong></div>
  <p>{currency(amount)} recorded {target>0?`of ${currency(target)} target`:'this month'}</p>
  <div className="sg-int-track"><span style={{width:`${Math.min(100,Math.max(0,progress||0))}%`}}/></div>
  <small>{note}</small>
 </div>;
}

export default function BusinessIntelligence({business,workspace,accountEmail,onSaveGoals,onNavigate}){
 const [revenueGoal,setRevenueGoal]=useState('');
 const [expenseBudget,setExpenseBudget]=useState('');
 const [editing,setEditing]=useState(false);
 const [question,setQuestion]=useState('next');
 const [error,setError]=useState('');
 const intelligence=useMemo(()=>analyzeBusiness(business),[business]);
 const {current,monthly,previous,comparison,invoices,goals,quality,spending,actions}=intelligence;
 function openTargets(){setRevenueGoal(String(goals.monthlyRevenueGoal||''));setExpenseBudget(String(goals.monthlyExpenseBudget||''));setError('');setEditing(true);}
 function saveTargets(e){e.preventDefault();try{
  const target=validateInsightSettings({monthlyRevenueGoal:revenueGoal===''?0:Number(revenueGoal),monthlyExpenseBudget:expenseBudget===''?0:Number(expenseBudget)});
  onSaveGoals(target);setEditing(false);setError('');
 }catch(err){setError(err.message);}}
 function download(){
  const contents=intelligenceReport(business);
  const blob=new Blob([contents],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`smartgrowth-insights-${intelligence.generatedAt}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 return <div className="sg-int-page">
  <div className="sd-heading"><small>PERSONALISED BUSINESS INTELLIGENCE</small><h1>Your business, explained.</h1><p>Real insights from the selected business's saved records, with clear reasons and practical next steps.</p></div>
  <div className="sg-int-identity"><span><SmartIcon name="intelligence" size={14}/> {workspace==='cloud'?'PRIVATE CLOUD WORKSPACE':'DEVICE WORKSPACE'}</span><b>{business.name}</b><small>{workspace==='cloud'&&accountEmail?`Signed in: ${accountEmail} · `:''}{business.industry} · {business.region}</small></div>
  <div className="sg-int-hero">
   <div><span>LAST 30 DAYS</span><h2>{currency(current.surplus)}</h2><p>Recorded operating surplus</p><small>Income minus expenses entered into SmartGrowth—not a bank balance.</small></div>
   <div className="sg-int-hero-score"><strong>{intelligence.passportScore}<small>/100</small></strong><span>Growth Passport</span></div>
  </div>
  <div className="sg-int-metrics">
   <div><span>Recorded income</span><strong>{currency(current.income)}</strong><small>{percent(comparison.incomeChange)}</small></div>
   <div><span>Recorded expenses</span><strong>{currency(current.expenses)}</strong><small>{percent(comparison.expenseChange)}</small></div>
   <div><span>Unpaid invoices</span><strong>{currency(invoices.outstanding)}</strong><small>{invoices.unpaidCount} unpaid · {invoices.overdueCount} overdue</small></div>
  </div>
  <section className="sd-panel sg-int-section"><div className="sd-panelhead"><h2>Ask your business data</h2><p>Tap a question to understand your business records, or open the assistant for more help.</p></div>
   <div className="sg-int-questions">{[['next','What should I do next?'],['performance','How is my business doing?'],['expenses','Where am I spending most?'],['payments','Who still owes me?']].map(([id,label])=><button type="button" key={id} className={question===id?'selected':''} onClick={()=>setQuestion(id)}>{label}</button>)}</div>
   <div className="sg-int-answer" role="status"><span>SMARTGROWTH ANSWERS</span><p>{answerBusinessQuestion(business,question)}</p></div>
  </section>
  <section className="sd-panel sg-int-section"><div className="sd-panelhead"><h2>Recommended actions</h2><p>Prioritised by your records. Recommendations update as you record activity or sync changes.</p></div>
   <div className="sg-int-actions">{actions.length?actions.map(a=><div key={a.id} className="sg-int-action">
    <div className="sg-int-action-content"><span className={`sg-int-priority ${a.level}`}>{label[a.level]}</span><h3>{a.title}</h3><p>{a.why}</p><small>Based on: {a.evidence}</small></div>
    <button type="button" onClick={()=>onNavigate(a.page)} aria-label={`Open ${a.title}`}>Open →</button>
   </div>):<p className="sd-empty">No urgent actions identified from your current records. Keep recording business activity.</p>}</div>
  </section>
  <section className="sd-panel sg-int-section"><div className="sg-int-split"><div className="sd-panelhead"><h2>Your monthly goals</h2><p>Track your recorded sales and expenses for {intelligence.generatedAt.slice(0,7)}.</p></div><button className="sg-int-quiet" type="button" onClick={editing?()=>setEditing(false):openTargets}>{editing?'Cancel':'Set goals'}</button></div>
   {editing&&<form className="sd-form sg-int-goalform" onSubmit={saveTargets}>
    <label>Monthly sales target (ZAR)<input type="number" step="0.01" min="0" max="100000000" placeholder="e.g. 10000" value={revenueGoal} onChange={e=>setRevenueGoal(e.target.value)}/></label>
    <label>Monthly expense budget (ZAR)<input type="number" step="0.01" min="0" max="100000000" placeholder="e.g. 5000" value={expenseBudget} onChange={e=>setExpenseBudget(e.target.value)}/></label>
    {error&&<p role="alert" className="sd-error">{error}</p>}
    <button className="sd-btn" type="submit">Save goals</button>
   </form>}
   <div className="sg-int-goalgrid">
    <Gauge title="Sales target" amount={monthly.income} target={goals.monthlyRevenueGoal} progress={goals.revenueProgress} note="Based on this month's recorded income."/>
    <Gauge title="Expense budget" amount={monthly.expenses} target={goals.monthlyExpenseBudget} progress={goals.budgetUsed} note={goals.monthlyExpenseBudget>0&&monthly.expenses>goals.monthlyExpenseBudget?'Your recorded expenses exceed this budget.':'Based on this month’s recorded costs.'}/>
   </div>
  </section>
  <section className="sd-panel sg-int-section"><div className="sd-panelhead"><h2>Where your money goes</h2><p>Expense categories from the last 30 days.</p></div>
   {spending.length?<div className="sg-int-categories">{spending.slice(0,6).map(row=><div key={row.name}>
    <div className="sg-int-split"><b>{row.name}</b><span>{currency(row.amount)} · {row.share}%</span></div>
    <div className="sg-int-track"><span style={{width:`${Math.min(100,row.share)}%`}}/></div>
   </div>)}</div>:<p className="sd-empty">No expenses in the last 30 days. Record costs in Bookkeeping to see a breakdown.</p>}
   <p className="sg-int-sidenote">Previous 30 days: {currency(previous.income)} income and {currency(previous.expenses)} expenses. We compare equal-length periods, not forecasts.</p>
  </section>
  <section className="sd-panel sg-int-section"><div className="sd-panelhead"><h2>Data confidence & privacy</h2><p>Understand the evidence behind your insights.</p></div>
   <ul className="sg-int-quality"><li>{current.transactionCount} transactions dated within this 30-day period.</li>
    <li>{quality.sample} records labelled fictional SAMPLE across transactions and invoices.</li>
    {quality.undated>0&&<li>{quality.undated} transactions have no valid date and are excluded from period comparisons.</li>}
    <li>Calculated on this device from {workspace==='cloud'?'your signed-in account’s selected business':'this device workspace’s selected business'} only.</li>
    <li>Not a credit score, audited accounts, bank verification, financial advice or AI prediction.</li></ul>
   <button className="sg-int-quiet" type="button" onClick={download}>↓ Export private insights report</button>
  </section>
 </div>;
}
