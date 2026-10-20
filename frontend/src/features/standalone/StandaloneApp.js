import React,{useMemo,useRef,useState} from 'react';
import {INDUSTRIES,PROVINCES,DOC_ITEMS,OFFICIAL_SOURCES} from './catalog.mjs';
import {currency,financials,passport,journey,advice,blankBusiness,sampleBusiness,addTransaction,addInvoice,markInvoicePaid,fraudCheck,matches} from './engine.mjs';
import {loadState,saveState,exportState,parseBackup} from './storage.mjs';
import LiveInsights from './LiveInsights';
import './standalone.css';
const NAV=[['home','⌂','Home'],['journey','◇','Journey'],['money','▤','Money'],['passport','◈','Passport'],['more','☷','More']];
const noop=()=>{};
const today=()=>new Date().toISOString().slice(0,10);
function Pane({title,subtitle,children,className=''}){return <section className={'sd-panel '+className}><div className="sd-panelhead"><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{children}</section>}
function Notice({children}){return <div className="sd-notice" role="status">{children}</div>}
function Empty({children}){return <p className="sd-empty">{children}</p>}
function InlineLink({href,children}){return <a href={href} target="_blank" rel="noreferrer noopener" className="sd-official-link">{children} ↗</a>}
function Kpi({label,value,note}){return <div className="sd-kpi"><span>{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div>}
function Btn({children,onClick,light=false,type='button',disabled=false}){return <button type={type} className={light?'sd-btn secondary':'sd-btn'} onClick={onClick} disabled={disabled}>{children}</button>}
const BusinessForm=({onSave,onCancel,initial=null})=>{
 const [draft,setDraft]=useState(initial||{name:'',industry:'Catering',region:'Eastern Cape',description:''});
 const [custom,setCustom]=useState(initial?.industry&&!INDUSTRIES.some(i=>i.id===initial.industry)?initial.industry:'');
 const [error,setError]=useState('');
 const industryChoice=INDUSTRIES.some(i=>i.id===draft.industry)?draft.industry:'Custom';
 return <form className="sd-form" onSubmit={e=>{e.preventDefault();try{onSave({...draft,industry:industryChoice==='Custom'?custom.trim():draft.industry});}catch(err){setError(err.message);}}}>
  <label>Business name<input value={draft.name} required maxLength={90} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="e.g. Khula Auto Repairs"/></label>
  <label>Business type / industry<select value={industryChoice} onChange={e=>setDraft({...draft,industry:e.target.value})}>{INDUSTRIES.map(i=><option key={i.id} value={i.id}>{i.icon} {i.id}</option>)}<option value="Custom">My own industry…</option></select></label>
  {industryChoice==='Custom'&&<label>Describe your industry<input value={custom} required maxLength={60} onChange={e=>setCustom(e.target.value)} placeholder="e.g. Automotive repairs"/></label>}
  <label>Province<select value={draft.region} onChange={e=>setDraft({...draft,region:e.target.value})}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></label>
  <label>What does the business offer?<textarea rows={3} maxLength={400} value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Describe your products, customers and services."/></label>
  {error&&<div role="alert" className="sd-error">{error}</div>}
  <div className="sd-actions"><Btn type="submit">Save business</Btn><Btn light onClick={onCancel}>Cancel</Btn></div>
 </form>;
};
export default function StandaloneApp({onExit=noop}){
 const [state,setState]=useState(loadState);
 const [page,setPage]=useState('home');
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [editBusiness,setEditBusiness]=useState(false);
 const [createBusiness,setCreateBusiness]=useState(false);
 const [transaction,setTransaction]=useState({kind:'income',amount:'',category:'Sales',description:''});
 const [invoice,setInvoice]=useState({customer:'',description:'',amount:'',due_date:''});
 const [listing,setListing]=useState({name:'',description:'',price:''});
 const [scanText,setScanText]=useState('');
 const [scan,setScan]=useState(null);
 const [selectedGoal,setGoal]=useState('start');
 const [scenario,setScenario]=useState({revenue:0,costs:0});
 const fileRef=useRef(null);
 const current=state.businesses.find(b=>b.id===state.activeId)||state.businesses[0];
 const p=useMemo(()=>passport(current),[current]);
 const j=useMemo(()=>journey(current),[current]);
 const f=p.financials;
 const guidance=useMemo(()=>advice(current),[current]);
 const goalFocus={start:['profile','compliance'],manage:['sale','invoice','expenses'],grow:['opportunity','sale'],protect:['compliance','opportunity']};
 const goalSteps=[...j.steps].sort((a,b)=>Number(goalFocus[selectedGoal]?.includes(b.id))-Number(goalFocus[selectedGoal]?.includes(a.id)));
 const opportunities=useMemo(()=>matches(current),[current]);
 function update(fn,message){try{setError('');const next=fn(state);setState(saveState(next));setNotice(message||'Saved on this device.');}catch(e){setError(e.message);}}
 function patchBusiness(fn,message){update(old=>({...old,businesses:old.businesses.map(b=>b.id===current.id?fn(b):b)}),message)}
 function go(p){setPage(p);setError('');setNotice('');window.scrollTo?.(0,0)}
 function create(d,withSamples=false){const b=withSamples?sampleBusiness(d.industry,d.region,d.name):blankBusiness(d.name,d.industry,d.region,d.description);
  if(d.description)b.description=d.description;
  update(s=>({...s,activeId:b.id,businesses:[...s.businesses,b]}),withSamples?'Fictional example business created.':'Business created. Start recording real entries only if you wish.');setCreateBusiness(false);go('home');}
 function edit(d){patchBusiness(b=>({...b,name:d.name.trim(),industry:d.industry,region:d.region,description:d.description||''}),'Business profile updated.');setEditBusiness(false);}
 function pay(id){patchBusiness(b=>markInvoicePaid(b,id),'Demo payment recorded once. No real money moved.');}
 async function restoreFile(e){const file=e.target.files?.[0];if(!file)return;try{if(file.size>6*1024*1024)throw Error('Backup file exceeds 6 MB.');
  const restored=parseBackup(await file.text());if(!window.confirm('Replace ALL standalone data on this device with this backup? Your current local records will be overwritten.'))return;
  setState(saveState(restored));setNotice('Backup restored from your file.');setError('');go('home');}catch(err){setError(err.message);}finally{e.target.value='';}}
 function downloadBackup(){const raw=exportState(state);const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`smartgrowth-device-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);setNotice('Backup downloaded. Keep the file somewhere secure.');}
 const taxSource=OFFICIAL_SOURCES.find(x=>x.id==='sars');
 return <div className="sd-shell">
  <header className="sd-topbar"><div className="sd-topinner"><button className="sd-brand" onClick={()=>go('home')} aria-label="SmartGrowth home"><span className="sd-mark">↗</span><span>Smart<b>Growth</b><small>YOUR BUSINESS JOURNEY</small></span></button><span className="sd-mode">◉ DEVICE-FIRST</span></div></header>
  <div className="sd-content">
   <div className="sd-businessbar"><div><small>ACTIVE BUSINESS</small><strong>{current.name}</strong><span>{current.industry} · {current.region}</span></div><select aria-label="Switch business" value={current.id} onChange={e=>{update(s=>({...s,activeId:e.target.value}), 'Switched business workspace.');go('home')}}>{state.businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
   {notice&&<Notice>{notice} <button aria-label="Dismiss notice" onClick={()=>setNotice('')}>×</button></Notice>}
   {error&&<div className="sd-error" role="alert">{error}</div>}
   {createBusiness?<Pane title="Add another business" subtitle="Create an empty workspace or select a fictional business example."><BusinessForm onSave={d=>create(d,false)} onCancel={()=>setCreateBusiness(false)}/><div className="sd-subtle"><p>Want a populated sample to demonstrate immediately?</p><div className="sd-samplegrid">{INDUSTRIES.slice(0,9).map(i=><button key={i.id} onClick={()=>create({name:`${i.example} (Sample)`,industry:i.id,region:'Eastern Cape'},true)}>{i.icon} {i.id}</button>)}</div></div></Pane>:null}
   {!createBusiness&&page==='home'&&<>
    <section className="sd-hero"><div className="sd-eyebrow">SMARTGROWTH · FOUR HORSEMEN TECH</div><h1>Build your business.<br/><em>One step at a time.</em></h1><p>Manage your records, track readiness and discover your next action—even without an internet connection.</p><Btn onClick={()=>go('journey')}>Continue my journey →</Btn></section>
    <div className="sd-kpis"><Kpi label="Recorded income" value={currency(f.income)}/><Kpi label="Recorded expenses" value={currency(f.expenses)}/><Kpi label="Operating surplus" value={currency(f.surplus)} note="From entered/demo records"/><Kpi label="Growth Passport" value={`${p.score}/100`} note="Unverified readiness"/></div>
    <Pane title="Your next step" subtitle="Detected automatically from the records on this device.">
     {j.next?<div className="sd-next"><span className="sd-nexticon">◇</span><div><b>{j.next.label}</b><p>{j.next.why}</p></div><Btn onClick={()=>go(j.next.page)}>Start →</Btn></div>:<p>All current journey milestones complete. Continue recording business activity.</p>}
    </Pane>
    <Pane title="Quick actions"><div className="sd-shortcuts">{[['money','➕','Record a sale'],['invoices','▤','New invoice'],['business','▣','Business profile'],['shield','♢','Check for scams'],['insights','◉','Live Insights'],['advisor','✦','Growth advice'],['opportunities','◇','Find opportunities']].map(([id,icon,label])=><button key={id} onClick={()=>go(id)}><span>{icon}</span>{label}<b>↗</b></button>)}</div></Pane>
    <p className="sd-footnote">Business data stays on this device. Sample records are fictional. Live Insights fetches public weather, currency and economic information when available; it does not connect to banks, CIPC records or tender APIs.</p>
   </>}
   {!createBusiness&&page==='journey'&&<>
    <div className="sd-heading"><small>PERSONALISED BUSINESS JOURNEY</small><h1>Where do you want to go?</h1><p>Your progress updates automatically from the records you save.</p></div>
    <div className="sd-goals">{[['start','🚀','Start a business'],['manage','💳','Manage money'],['grow','📈','Grow customers'],['protect','🛡️','Stay protected']].map(([id,icon,label])=><button key={id} className={selectedGoal===id?'active':''} onClick={()=>setGoal(id)}><span>{icon}</span>{label}</button>)}</div>
    <Pane title={`Your journey · ${j.completed}/${j.total} steps`} subtitle={`Showing ${selectedGoal} goal priorities first · ${Math.round(j.completed/j.total*100)}% complete · Readiness ${p.score}/100 (illustrative)`}>
      <div className="sd-progress"><span style={{width:`${j.completed/j.total*100}%`}}/></div>
      <div className="sd-steps">{goalSteps.map(s=><div key={s.id} className="sd-step"><span className={s.done?'complete':''}>{s.done?'✓':'○'}</span><div><b>{s.label}</b><p>{s.why}</p></div><button onClick={()=>go(s.page)}>{s.done?'Review':'Open'} ↗</button></div>)}</div>
    </Pane>
    <Pane title="Suggested focus" subtitle="A practical 30-day sprint based on this business."><div className="sd-steps">{guidance.items.slice(0,4).map((x,i)=><div className="sd-step" key={i}><span>{i+1}</span><div><b>{x.title}</b><p>{x.why}</p></div><button onClick={()=>go(x.page)}>Go →</button></div>)}</div></Pane>
   </>}
   {!createBusiness&&page==='money'&&<>
    <div className="sd-heading"><small>BOOKKEEPING</small><h1>Your money, clearly.</h1><p>Entries stay on this device; amounts you enter are not bank-verified.</p></div>
    <div className="sd-kpis"><Kpi label="Income" value={currency(f.income)}/><Kpi label="Expenses" value={currency(f.expenses)}/><Kpi label="Surplus" value={currency(f.surplus)}/></div>
    <Pane title="Record a transaction"><form className="sd-form" onSubmit={e=>{e.preventDefault();try{patchBusiness(b=>addTransaction(b,transaction),'Bookkeeping entry saved.');setTransaction({...transaction,amount:'',description:''});}catch(err){setError(err.message);}}}>
     <label>Type<select value={transaction.kind} onChange={e=>setTransaction({...transaction,kind:e.target.value})}><option value="income">Income / Sale</option><option value="expense">Expense / Cost</option></select></label>
     <label>Amount (ZAR)<input required type="number" step="0.01" min="0.01" value={transaction.amount} placeholder="e.g. 500.00" onChange={e=>setTransaction({...transaction,amount:e.target.value})}/></label>
     <label>Category<input required maxLength={60} value={transaction.category} onChange={e=>setTransaction({...transaction,category:e.target.value})}/></label>
     <label>Description<input maxLength={240} value={transaction.description} onChange={e=>setTransaction({...transaction,description:e.target.value})}/></label><Btn type="submit">Save entry</Btn>
    </form></Pane>
    <Pane title="Recent transactions" subtitle="Fictional sample entries are labelled SAMPLE.">{current.transactions.length?current.transactions.map(t=><div className="sd-record" key={t.id}><div><b>{t.description||t.category}</b><small>{t.category} · {t.created_at?.slice(0,10)} {t.sample?'· SAMPLE':''}</small></div><strong className={t.kind==='income'?'pos':'neg'}>{t.kind==='income'?'+':'−'}{currency(t.amount)}</strong></div>):<Empty>No transactions yet. Start with one sale or expense.</Empty>}</Pane>
    <Pane title="What-if calculator" subtitle="Simple arithmetic only; it does not change any records."><label className="sd-range">Increase income by {scenario.revenue}%<input type="range" min="0" max="50" step="5" value={scenario.revenue} onChange={e=>setScenario({...scenario,revenue:Number(e.target.value)})}/></label><label className="sd-range">Reduce expenses by {scenario.costs}%<input type="range" min="0" max="30" step="5" value={scenario.costs} onChange={e=>setScenario({...scenario,costs:Number(e.target.value)})}/></label><b>Illustrative adjusted surplus: {currency(f.income*(1+scenario.revenue/100)-f.expenses*(1-scenario.costs/100))}</b></Pane>
   </>}
   {!createBusiness&&page==='invoices'&&<><div className="sd-heading"><small>INVOICES & PAYMENTS</small><h1>Keep track of who owes you.</h1><p>Invoices and payment buttons are local demonstrations—not payment processing.</p></div>
    <Pane title="Create an invoice"><form className="sd-form" onSubmit={e=>{e.preventDefault();try{patchBusiness(b=>addInvoice(b,invoice),'Invoice issued. It has not yet increased your income.');setInvoice({customer:'',description:'',amount:'',due_date:''});}catch(err){setError(err.message);}}}>
      <label>Customer<input required maxLength={100} value={invoice.customer} onChange={e=>setInvoice({...invoice,customer:e.target.value})} placeholder="Customer name"/></label><label>What did you sell?<input required maxLength={200} value={invoice.description} onChange={e=>setInvoice({...invoice,description:e.target.value})}/></label><label>Amount (ZAR)<input required min="0.01" step="0.01" type="number" value={invoice.amount} onChange={e=>setInvoice({...invoice,amount:e.target.value})}/></label><label>Due date (optional)<input type="date" value={invoice.due_date} onChange={e=>setInvoice({...invoice,due_date:e.target.value})}/></label><Btn type="submit">Create invoice</Btn>
    </form></Pane>
    <Pane title="Your invoices">{current.invoices.map(i=><div className="sd-invoice" key={i.id}><div><b>{i.number} · {i.customer}</b><p>{i.description} {i.sample?'· SAMPLE':''}</p><small>{i.status==='paid'?'Paid (simulated)':'Unpaid'} · {currency(i.amount)}</small></div>{i.status!=='paid'&&<Btn light onClick={()=>pay(i.id)}>Simulate paid</Btn>}</div>)}{!current.invoices.length&&<Empty>No invoices yet.</Empty>}</Pane>
   </>}
   {!createBusiness&&page==='passport'&&<>
    <div className="sd-heading"><small>GROWTH PASSPORT</small><h1>See how you're progressing.</h1><p>Automatic recorded actions are kept separate from self-declared external evidence.</p></div>
    <section className="sd-score"><div className="sd-bigscore">{p.score}<span>/100</span></div><div><b>{p.autoPoints}/60 from saved activity</b><p>{p.documentPoints}/40 from external document declarations</p></div><div className="sd-progress"><span style={{width:`${p.score}%`}}/></div><small>{p.disclaimer}</small></section>
    <Pane title="Automatic milestones" subtitle="No ticking required. They change when your records change."><div className="sd-steps">{p.automatic.map(s=><div key={s.id} className="sd-step"><span className={s.complete?'complete':''}>{s.complete?'✓':'○'}</span><div><b>{s.label}</b><p>{s.complete?'Detected from local records':'Not yet detected'}</p></div><b>{s.complete?s.points:0}/{s.points}</b></div>)}</div></Pane>
    <Pane title="External documents (self-declared)" subtitle="Only tick documents you really have. No CIPC, SARS or bank verification is performed.">{p.manual.map(d=><label key={d.id} className="sd-checkrow"><input type="checkbox" checked={d.completed} onChange={e=>patchBusiness(b=>({...b,documents:{...b.documents,[d.id]:e.target.checked}}),'Document declaration updated.')}/><span>{d.name}</span><b>{d.completed?'+10':'0'}</b></label>)}</Pane>
   </>}
   {!createBusiness&&page==='business'&&<><div className="sd-heading"><small>BUSINESS PROFILE</small><h1>Every business is different.</h1><p>Personalise SmartGrowth for your type of business, from a spaza shop to a software studio.</p></div>
    <Pane title={current.name} subtitle={`${current.industry} · ${current.region}`}><p>{current.description||'Add a description to your profile.'}</p><div className="sd-actions"><Btn onClick={()=>setEditBusiness(!editBusiness)}>{editBusiness?'Close':'Edit profile'}</Btn><Btn light onClick={()=>setCreateBusiness(true)}>Add another business</Btn></div>{editBusiness&&<BusinessForm initial={current} onSave={edit} onCancel={()=>setEditBusiness(false)}/>}</Pane>
    <Pane title="Official registration guidance" subtitle="Opening an external official site requires internet access.">{OFFICIAL_SOURCES.slice(0,3).map(s=><div className="sd-source" key={s.id}><div><b>{s.name}</b><p>{s.detail}</p></div><InlineLink href={s.url}>Open official site</InlineLink></div>)}</Pane>
   </>}
   {!createBusiness&&page==='shield'&&<><div className="sd-heading"><small>SMARTSHIELD</small><h1>Spot the warning signs.</h1><p>Text-only rules, not an authoritative fraud verdict.</p></div><Pane title="Check a suspicious message"><form className="sd-form" onSubmit={e=>{e.preventDefault();setScan(fraudCheck(scanText));setNotice('Text screening completed locally.');}}><label>Paste a message<textarea rows={5} required minLength={3} maxLength={10000} value={scanText} onChange={e=>setScanText(e.target.value)} placeholder="Paste a suspicious funding, invoice or payment message…"/></label><Btn type="submit">Check this message</Btn></form></Pane>{scan&&<Pane title={scan.level}><div className="sd-steps">{scan.signals.length?scan.signals.map(s=><div key={s} className="sd-flag">⚠ {s}</div>):<p>No obvious signs were detected. This does not prove the message is safe.</p>}</div><p>{scan.recommendation}</p></Pane>}</>}
   {!createBusiness&&page==='advisor'&&<><div className="sd-heading"><small>GROWTH ADVISOR</small><h1>Your next best actions.</h1><p>Simple explainable recommendations based only on locally saved data.</p></div><Pane title={guidance.summary} subtitle={guidance.note}><div className="sd-steps">{guidance.items.length?guidance.items.map((x,i)=><div className="sd-step" key={i}><span>{i+1}</span><div><b>{x.title}</b><p>{x.why}</p></div><button onClick={()=>go(x.page)}>Open →</button></div>):<Empty>All current milestones have been covered. Continue tracking sales and costs.</Empty>}</div></Pane></>}
   {!createBusiness&&page==='insights'&&<LiveInsights region={current.region} industry={current.industry}/>}
   {!createBusiness&&page==='opportunities'&&<><div className="sd-heading"><small>MARKET & PROCUREMENT ACCESS</small><h1>Find your next opportunity.</h1><p>Example briefs are fictional; official external portals may contain live opportunities.</p></div>
    <Pane title="Live opportunity source" subtitle="We link to the official publication website; we do not scrape or verify its tenders."><div className="sd-source"><div><b>National Treasury eTender Portal</b><p>Search published tenders by sector and region using the official website.</p></div><InlineLink href="https://www.etenders.gov.za/">Open live portal</InlineLink></div><Btn light onClick={()=>patchBusiness(b=>({...b,reviewedOpportunities:true}),'Opportunity source marked reviewed.')}>{current.reviewedOpportunities?'✓ Reviewed':'Mark opportunity search reviewed'}</Btn></Pane>
    <Pane title="Fictional procurement practice briefs" subtitle={`Ranked by industry and province for ${current.name}. These are NOT real tenders.`}><div className="sd-catalog">{opportunities.slice(0,8).map(o=><div className="sd-catalogitem" key={o.id}><span className="sd-label">SAMPLE BRIEF · {o.score}/100 similarity</span><h3>{o.title}</h3><p>{o.description}</p><small>{o.industry} · {o.region} · Sample budget {currency(o.value)}</small></div>)}</div></Pane>
   </>}
   {!createBusiness&&page==='market'&&<><div className="sd-heading"><small>MARKET LINKS</small><h1>Show what you offer.</h1><p>On-device listings are not publicly published. Use them to prepare for customer discovery.</p></div>
    <Pane title="Create an offer"><form className="sd-form" onSubmit={e=>{e.preventDefault();const amount=Number(listing.price);if(!listing.name.trim()||!listing.description.trim()||!Number.isFinite(amount)||amount<=0){setError('Provide a service name, description and positive price.');return;}patchBusiness(b=>({...b,listings:[{id:`list-${Date.now()}`,name:listing.name,description:listing.description,price:amount,createdAt:new Date().toISOString(),sample:false},...b.listings]}),'Local business listing created.');setListing({name:'',description:'',price:''});}}><label>Product / service<input required maxLength={90} value={listing.name} onChange={e=>setListing({...listing,name:e.target.value})}/></label><label>Description<textarea required rows={3} maxLength={500} value={listing.description} onChange={e=>setListing({...listing,description:e.target.value})}/></label><label>Starting price (ZAR)<input required type="number" min="0.01" step="0.01" value={listing.price} onChange={e=>setListing({...listing,price:e.target.value})}/></label><Btn type="submit">Save listing on device</Btn></form></Pane>
    <Pane title="Your listings">{current.listings.map(x=><div className="sd-invoice" key={x.id}><div><b>{x.name}</b><p>{x.description}</p><small>From {currency(x.price)} · On-device only</small></div></div>)}{!current.listings.length&&<Empty>No listings created yet.</Empty>}</Pane>
   </>}
   {!createBusiness&&page==='sources'&&<><div className="sd-heading"><small>OFFICIAL RESOURCES</small><h1>Trusted places to start.</h1><p>These are real official websites. Opening them requires connectivity, and their information can change.</p></div><Pane title="South African business resources">{OFFICIAL_SOURCES.map(x=><div className="sd-source" key={x.id}><div><span className="sd-label">{x.category}</span><b>{x.name}</b><p>{x.detail}</p></div><InlineLink href={x.url}>Visit</InlineLink></div>)}</Pane><p className="sd-footnote">Official links verified in October 2026. SmartGrowth does not claim to provide official registration, tax verification or live tender aggregation.</p></>}
   {!createBusiness&&page==='more'&&<><div className="sd-heading"><small>WORKSPACE & SETTINGS</small><h1>Make SmartGrowth yours.</h1><p>Choose tools, switch businesses or back up your on-device data.</p></div>
    <Pane title="Explore more tools"><div className="sd-shortcuts">{[['business','▣','My businesses'],['invoices','▤','Invoices'],['advisor','✦','Growth Advisor'],['shield','♢','SmartShield'],['market','▢','Market Links'],['insights','◉','Live Insights'],['opportunities','◇','Procurement'],['sources','↗','Official Sources']].map(([id,icon,label])=><button onClick={()=>go(id)} key={id}><span>{icon}</span>{label}<b>↗</b></button>)}</div></Pane>
    <Pane title="Add or switch businesses" subtitle="Every business has its own finances, invoices, Passport and Journey."><div className="sd-businesslist">{state.businesses.map(b=><button key={b.id} className={b.id===current.id?'current':''} onClick={()=>{update(s=>({...s,activeId:b.id}));go('home')}}>{b.name} <small>{b.industry} · {b.region}</small></button>)}</div><Btn light onClick={()=>setCreateBusiness(true)}>+ Create another business</Btn></Pane>
    <Pane title="Backup and device privacy" subtitle="Your offline records live in this app/browser storage, not in your hosted account."><p className="sd-muted">Export regularly before uninstalling the app, clearing browser data or switching phones. Backups contain business details in readable JSON.</p><div className="sd-actions"><Btn onClick={downloadBackup}>↓ Export data</Btn><Btn light onClick={()=>fileRef.current?.click()}>↑ Restore backup</Btn><input hidden ref={fileRef} type="file" accept="application/json,.json" onChange={restoreFile}/></div><div className="sd-actions"><Btn light onClick={()=>{if(window.confirm('Leave this device-only demonstration? Your saved data will remain on this device.'))onExit()}}>Exit offline demo</Btn></div></Pane>
    <Pane title="Online accounts (optional)"><p>Want account-based access across multiple devices? Sign in using the separate hosted-backend mode when your SmartGrowth API is deployed securely. Data in the two modes is <b>not automatically synced</b>.</p><Btn light onClick={onExit}>Go to account login →</Btn></Pane>
   </>}
   <div className="sd-disclaimer">SMARTGROWTH · ON-DEVICE DEMONSTRATION · No real payments, official verification, cloud sync or API-integrated tenders. Public market and weather insights may be cached. <InlineLink href={taxSource.url}>Tax guidance</InlineLink></div>
  </div>
  <nav className="sd-bottom" aria-label="Standalone main navigation">{NAV.map(([id,icon,name])=><button key={id} aria-current={page===id?'page':undefined} className={page===id?'active':''} onClick={()=>go(id)}><span>{icon}</span><small>{name}</small></button>)}</nav>
 </div>;
}
