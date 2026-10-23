import React,{useEffect,useMemo,useRef,useState} from 'react';
import {INDUSTRIES,PROVINCES,OFFICIAL_SOURCES} from './catalog.mjs';
import {currency,financials,passport,journey,protectionJourney,advice,blankBusiness,sampleBusiness,addTransaction,addInvoice,markInvoicePaid,fraudCheck,matches} from './engine.mjs';
import {loadState,saveState,exportState,parseBackup} from './storage.mjs';
import LiveInsights from './LiveInsights';
import TreasuryOpportunities from './TreasuryOpportunities';
import {readTreasuryCache} from './treasury-data.mjs';
import CloudSyncPanel from './CloudSyncPanel';
import BusinessIntelligence from './BusinessIntelligence';
import ComplianceHub from './ComplianceHub';
import FloatingAssistant from './FloatingAssistant';
import SharedMarketplace from './SharedMarketplace';
import {registryStatus} from './registry-status.mjs';
import {PRACTICE_SOURCE,practiceRegistrationNumber,validateRegistrationInput,registrationFromBusiness,attachRegisteredBusinesses,REGISTRY_NOTICE} from './mock-registry.mjs';
import {validateOnboarding,makeOnboardedBusiness} from './onboarding.mjs';
import AccountGateway from './AccountGateway';
import {complianceDetails} from './compliance.mjs';
import {analyzeBusiness} from './intelligence.mjs';
import {firebaseConfigured,observeLogin,watchBusinesses,uploadBusiness,watchPracticeRegistry,createPracticeRegistryRecord,accountLogin,accountLogout} from './cloud-firebase';
import {loadCloudState,saveCloudState,mergeState} from './cloud-store.mjs';
import SmartIcon from './SmartIcon';
import './standalone.css';
const NAV=[['home','home','Home'],['journey','journey','Journey'],['money','money','Money'],['intelligence','intelligence','Insights'],['passport','passport','Passport'],['more','more','More']];
const today=()=>new Date().toISOString().slice(0,10);
function Pane({title,subtitle,children,className=''}){return <section className={'sd-panel '+className}><div className="sd-panelhead"><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{children}</section>}
function Notice({children}){return <div className="sd-notice" role="status">{children}</div>}
function Empty({children}){return <p className="sd-empty">{children}</p>}
function InlineLink({href,children}){return <a href={href} target="_blank" rel="noreferrer noopener" className="sd-official-link">{children} ↗</a>}
function Kpi({label,value,note}){return <div className="sd-kpi"><span>{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div>}
function Btn({children,onClick,light=false,type='button',disabled=false}){return <button type={type} className={light?'sd-btn secondary':'sd-btn'} onClick={onClick} disabled={disabled}>{children}</button>}
const BusinessForm=({onSave,onCancel,initial=null,practice=false})=>{
 const [draft,setDraft]=useState(initial?{...initial,cipcNumber:initial?.compliance?.cipcNumber||''}:{name:'',industry:'Catering',region:'Eastern Cape',description:'',cipcNumber:''});
 const [custom,setCustom]=useState(initial?.industry&&!INDUSTRIES.some(i=>i.id===initial.industry)?initial.industry:'');
 const [error,setError]=useState('');
 const industryChoice=INDUSTRIES.some(i=>i.id===draft.industry)?draft.industry:'Custom';
 return <form className="sd-form" onSubmit={e=>{e.preventDefault();try{onSave({...draft,industry:industryChoice==='Custom'?custom.trim():draft.industry});}catch(err){setError(err.message);}}}>
  <label>Business name<input value={draft.name} required maxLength={90} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="e.g. Khula Auto Repairs"/></label>
  <label>Business type / industry<select value={industryChoice} onChange={e=>setDraft({...draft,industry:e.target.value})}>{INDUSTRIES.map(i=><option key={i.id} value={i.id}>{i.id}</option>)}<option value="Custom">My own industry…</option></select></label>
  {industryChoice==='Custom'&&<label>Describe your industry<input value={custom} required maxLength={60} onChange={e=>setCustom(e.target.value)} placeholder="e.g. Automotive repairs"/></label>}
  <label>Province<select value={draft.region} onChange={e=>setDraft({...draft,region:e.target.value})}>{PROVINCES.map(p=><option key={p}>{p}</option>)}</select></label>
  {!practice&&<label>Company registration number (only if applicable)<input value={draft.cipcNumber||''} readOnly={initial?.registrySource===PRACTICE_SOURCE} maxLength={15} onChange={e=>setDraft({...draft,cipcNumber:e.target.value})} placeholder="Enter the number on your registration certificate"/><small>{initial?.registrySource===PRACTICE_SOURCE?'This reference belongs to your SmartGrowth practice registry business.':'Enter the exact number. Practice checks are fictional; use CIPC for official confirmation.'}</small></label>}
  {practice&&<div className="sd-registry-caution" role="note">A practice registration reference will be generated automatically. This does not register a company with CIPC.</div>}
  <label>What does the business offer?<textarea rows={3} maxLength={400} value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Describe your products, customers and services."/></label>
  {error&&<div role="alert" className="sd-error">{error}</div>}
  <div className="sd-actions"><Btn type="submit">{practice?'Create practice business record':'Save business'}</Btn>{onCancel&&<Btn light onClick={onCancel}>Cancel</Btn>}</div>
 </form>;
};
export default function StandaloneApp(){
 const [state,setState]=useState(loadState);
 const [page,setPage]=useState('home');
 const [cloudUser,setCloudUser]=useState(null);
 const [authReady,setAuthReady]=useState(false);
 const [registrationLocked,setRegistrationLocked]=useState(false);
 const registering=useRef(false);
 const [registryLoading,setRegistryLoading]=useState(true);
 const [businessLoading,setBusinessLoading]=useState(true);
 const [workspace,setWorkspace]=useState('device');
 const [cloudStatus,setCloudStatus]=useState('Saved locally · sign in once for automatic cloud sync');
 const cloudUid=cloudUser?.uid||null;
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [editBusiness,setEditBusiness]=useState(false);
 const [createBusiness,setCreateBusiness]=useState(false);
 const [transaction,setTransaction]=useState({kind:'income',amount:'',category:'Sales',description:''});
 const [invoice,setInvoice]=useState({customer:'',description:'',amount:'',due_date:''});
 const [scanText,setScanText]=useState('');
 const [scan,setScan]=useState(null);
 const [selectedGoal,setGoal]=useState('start');
 const [scenario,setScenario]=useState({revenue:0,costs:0});
 const fileRef=useRef(null);
 const current=state.businesses.find(b=>b.id===state.activeId)||state.businesses[0];
 const p=useMemo(()=>passport(current),[current]);
 const j=useMemo(()=>journey(current),[current]);
 const f=p.financials;
 const intelligence=useMemo(()=>analyzeBusiness(current),[current]);
 const compliance=useMemo(()=>complianceDetails(current),[current]);
 const guidance=useMemo(()=>advice(current),[current]);
 const goalFocus={start:['profile','compliance'],manage:['sale','invoice','expenses'],grow:['opportunity','sale']};
 const protectedJourney=useMemo(()=>protectionJourney(current),[current]);
 const activeJourney=selectedGoal==='protect'?protectedJourney:j;
 const goalSteps=selectedGoal==='protect'?activeJourney.steps:[...j.steps].sort((a,b)=>Number(goalFocus[selectedGoal]?.includes(b.id))-Number(goalFocus[selectedGoal]?.includes(a.id)));
 const opportunities=useMemo(()=>matches(current),[current]);
 const publicFeed=readTreasuryCache();
 // Firebase silently restores a previously signed-in account, even on later offline opens.
 useEffect(()=>{
  if(!firebaseConfigured)return;
  return observeLogin(user=>{
   setAuthReady(true);
   if(user){setRegistryLoading(true);setBusinessLoading(true);setCloudUser(user);setWorkspace('cloud');setState(loadCloudState(user.uid));setCloudStatus(navigator.onLine?'Connecting to your cloud records…':'Offline — your account workspace is available on this device');}
   else {setRegistryLoading(false);setBusinessLoading(false);setCloudUser(null);setWorkspace('device');setState(loadState());setCloudStatus('Saved locally · sign in to sync');}
  });
 },[]);
 useEffect(()=>{
  if(!cloudUid||workspace!=='cloud')return;
  const uid=cloudUid;
  let alive=true;
  let stop;
  try {stop=watchBusinesses(uid,(remote,meta)=>{
   if(!alive)return;
   if(!meta.fromCache||remote.length||!navigator.onLine)setBusinessLoading(false);
   const local=loadCloudState(uid);
   const result=mergeState(local,remote);
   try {saveCloudState(uid,result.state);setState(result.state);} catch(e){setError(e.message);}
   setCloudStatus(meta.hasPendingWrites?'Waiting to upload changes…':meta.fromCache?'Offline / cached — changes sync when online':'Cloud connected — records up to date');
   // Only backfill absent/newer records after confirmed server read to avoid stale cache overwriting remote.
   if(!meta.fromCache)result.needUpload.forEach(b=>uploadBusiness(uid,b).catch(e=>setCloudStatus('Sync needs attention: '+e.message)));
  },e=>setCloudStatus('Cloud connection error: '+e.message));}catch(e){setCloudStatus('Cloud configuration error: '+e.message);}
  return ()=>{alive=false;stop?.();};
 },[cloudUid,workspace]);
 // Registry records belong to this Firebase account and contain NO password.
 // Existing seeded businesses appear automatically, without importing device examples.
 useEffect(()=>{
  if(!cloudUid||workspace!=='cloud')return;
  let active=true;
  let unwatch;
  try{unwatch=watchPracticeRegistry(cloudUid,(records,meta)=>{
   if(!active)return;
   setRegistryLoading(Boolean(!records.length && meta.fromCache && navigator.onLine));
   const local=loadCloudState(cloudUid);
   const result=attachRegisteredBusinesses(local,records);
   if(result.added.length){
    try{const stored=saveCloudState(cloudUid,result.state);setState(stored);
     result.added.forEach(b=>uploadBusiness(cloudUid,b).catch(e=>setCloudStatus('Business sync needs attention: '+e.message)));
    }catch(e){setError(e.message);}
   }else if(result.state.businesses.some(b=>b.registryId&&!local.businesses.find(x=>x.id===b.id&&x.registryId))){
    try{saveCloudState(cloudUid,result.state);setState(result.state);}catch(e){setError(e.message);}
   }
  },e=>{if(active){setRegistryLoading(false);setCloudStatus('Practice registry could not be loaded: '+e.message);}});}catch(e){setRegistryLoading(false);setCloudStatus(e.message);}
  return ()=>{active=false;unwatch?.();};
 },[cloudUid,workspace]);
 function update(fn,message){try{
  setError('');const next=fn(state);
  if(workspace==='cloud'&&cloudUid){
   const changed=next.businesses.filter(b=>JSON.stringify(state.businesses.find(x=>x.id===b.id))!==JSON.stringify(b));
   const now=new Date().toISOString();const stamped={...next,businesses:next.businesses.map(b=>changed.some(x=>x.id===b.id)?{...b,modifiedAt:now}:b)};
   const saved=saveCloudState(cloudUid,stamped);setState(saved);
   if(changed.length){setCloudStatus(navigator.onLine?'Uploading business changes…':'Offline — changes queued for sync');
    stamped.businesses.filter(b=>changed.some(x=>x.id===b.id)).forEach(b=>uploadBusiness(cloudUid,b).catch(e=>setCloudStatus('Sync needs attention: '+e.message)));
   }
  }else{setState(saveState(next));}
  setNotice(message||(workspace==='cloud'?'Saved to this account and queued for sync.':'Saved on this device.'));
 }catch(e){setError(e.message);}}
 function patchBusiness(fn,message){update(old=>({...old,businesses:old.businesses.map(b=>b.id===current.id?fn(b):b)}),message)}
 function go(p){setPage(p==='advisor'?'intelligence':p);setError('');setNotice('');window.scrollTo?.(0,0)}
 function create(d,withSamples=false){
  if(!cloudUid||workspace!=='cloud')throw Error('Sign in to register your business.');
  const details=validateRegistrationInput(d);
  const b=blankBusiness(details.name,details.industry,details.region,details.description);
  b.compliance={...b.compliance,structure:'registered_company',cipcNumber:practiceRegistrationNumber(),checks:{}};
  b.registrySource=PRACTICE_SOURCE;b.registryId=b.id;b.registryStatus='practice';
  const record=registrationFromBusiness(b,cloudUid,cloudUser.email);
  update(s=>({...s,activeId:b.id,businesses:[...s.businesses.filter(x=>!(x.isPlaceholder&&x.transactions.length===0&&x.invoices.length===0)),b]}),'Business created with a simulated registry reference.');
  // Local business record is saved first. Firestore queues writes after reconnection.
  createPracticeRegistryRecord(cloudUid,record).catch(err=>setCloudStatus('Practice registry sync pending: '+err.message));
  setCreateBusiness(false);go('home');
 }
 function edit(d){
  const isPractice=current.registrySource===PRACTICE_SOURCE;
  const reg=isPractice?current.compliance?.cipcNumber:(d.cipcNumber?.trim()||'');
  const changed={...current,name:d.name.trim(),industry:d.industry,region:d.region,description:d.description||'',modifiedAt:new Date().toISOString(),compliance:{...current.compliance,cipcNumber:reg,structure:reg?'registered_company':current.compliance?.structure||'unsure',checks:reg===current.compliance?.cipcNumber?current.compliance?.checks||{}:{}},isPlaceholder:false};
  patchBusiness(()=>changed,'Business profile updated.');
  if(isPractice&&cloudUid){createPracticeRegistryRecord(cloudUid,registrationFromBusiness(changed,cloudUid,cloudUser.email)).catch(e=>setCloudStatus('Practice registry sync needs attention: '+e.message));}
  setEditBusiness(false);
 }
 function pay(id){patchBusiness(b=>markInvoicePaid(b,id),'Payment status updated and recorded in bookkeeping.');}
 async function restoreFile(e){const file=e.target.files?.[0];if(!file)return;try{if(file.size>6*1024*1024)throw Error('Backup file exceeds 6 MB.');
  const restored=parseBackup(await file.text());if(!window.confirm('Replace ALL standalone data on this device with this backup? Your current local records will be overwritten.'))return;
  if(workspace==='cloud'&&cloudUid){update(()=>restored,'Backup restored to cloud workspace; preparing to sync.');}else{setState(saveState(restored));setNotice('Backup restored from your file.');}setError('');go('home');}catch(err){setError(err.message);}finally{e.target.value='';}}
 function downloadBackup(){const raw=exportState(state);const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`smartgrowth-device-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);setNotice('Backup downloaded. Keep the file somewhere secure.');}
 async function registerFromGateway(form,onProgress){
  const values=validateOnboarding(form); // verifies format locally; does not contact CIPC or store the ID.
  registering.current=true;
  setRegistrationLocked(true);
  let createdAccount=false;
  const pause=()=>new Promise(resolve=>setTimeout(resolve,650));
  try{
   onProgress(0);await pause();
   onProgress(1);await pause();
   const credentials=await accountLogin(values.email,values.password,true);
   createdAccount=true;
   onProgress(2);await pause();
   const uid=credentials.user.uid;
   const business=makeOnboardedBusiness(values);
   const record=registrationFromBusiness(business,uid,values.email);
   onProgress(3);await pause();
   onProgress(4);await pause();
   // These are real Firestore writes to an account-owned *practice* registry, NOT to CIPC.
   // Save the completed record first; snapshots must never replace it with a partial registry import.
   const local={version:1,activeId:business.id,businesses:[business],updatedAt:new Date().toISOString()};
   saveCloudState(uid,local);setState(local);
   await uploadBusiness(uid,business);
   await createPracticeRegistryRecord(uid,record);
   onProgress(5);await pause();
   return business;
  }catch(err){
   // An Auth account might already exist if Firestore failed. Sign out and recover through login.
   if(createdAccount){try{await accountLogout();}catch(_){/* display original error */}}
   registering.current=false;setRegistrationLocked(false);
   throw Error(createdAccount?'Your SmartGrowth account was created, but business saving did not complete. Sign in and complete your business profile. Details: '+err.message:err.message);
  }
 }
 async function finishRegistration(){
  await accountLogout();
  setCloudUser(null);setWorkspace('device');registering.current=false;setRegistrationLocked(false);setRegistryLoading(false);setBusinessLoading(false);
 }
 const taxSource=OFFICIAL_SOURCES.find(x=>x.id==='sars');
 if(!firebaseConfigured)return <AccountGateway configured={false}/>;
 if(registrationLocked||!authReady||!cloudUser)return <AccountGateway configured={true} loading={!authReady&&!registrationLocked} onRegister={registerFromGateway} onFinishRegistration={finishRegistration}/>;
 const needsBusiness=state.businesses.length===1 && state.businesses[0].isPlaceholder && !state.businesses[0].transactions.length && !state.businesses[0].invoices.length && !state.businesses[0].listings.length;
 if(needsBusiness && (registryLoading||businessLoading))return <AccountGateway configured={true} loading={true}/>;
 if(needsBusiness && !registryLoading && !businessLoading && !createBusiness)return <div className="sd-shell"><header className="sd-topbar"><div className="sd-topinner"><div className="sd-brand"><span className="sd-mark">↗</span><span>Smart<b>Growth</b><small>YOUR BUSINESS JOURNEY</small></span></div><span className="sd-mode">ACCOUNT READY</span></div></header><main className="sd-content"><div className="sd-registry-welcome"><span className="sd-label">WELCOME, {cloudUser.email}</span><h1>Let's set up your business.</h1><p>No business profile is linked to this account yet. Enter your business information below to get started.</p><div className="sd-registry-caution">Use your SmartGrowth account details here. Never enter credentials for other government services.</div><BusinessForm practice onSave={d=>create(d)} onCancel={null}/></div></main></div>;
 return <div className="sd-shell">
  <header className="sd-topbar"><div className="sd-topinner"><button className="sd-brand" onClick={()=>go('home')} aria-label="SmartGrowth home"><span className="sd-mark">↗</span><span>Smart<b>Growth</b><small>YOUR BUSINESS JOURNEY</small></span></button><span className="sd-mode"><SmartIcon name={workspace==='cloud'?'cloud':'check'} size={15}/> {workspace==='cloud'?'SYNC ENABLED':'OFFLINE READY'}</span></div></header>
  <div className="sd-content">
   <div className="sd-businessbar"><div><small>{workspace==='cloud'?'MY BUSINESS':'MY WORKSPACE'}</small><span title={registryStatus(current).detail} className={`sg-demo-status ${registryStatus(current).style}`}>{registryStatus(current).label}</span><strong>{current.name}</strong><span>{current.industry} · {current.region}</span>{current.compliance?.cipcNumber&&<span>Registration reference: {current.compliance.cipcNumber}</span>}</div><select aria-label="Switch business" value={current.id} onChange={e=>{update(s=>({...s,activeId:e.target.value}), 'Switched business workspace.');go('home')}}>{state.businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
   {notice&&<Notice>{notice} <button aria-label="Dismiss notice" onClick={()=>setNotice('')}>×</button></Notice>}
   {error&&<div className="sd-error" role="alert">{error}</div>}
   {createBusiness?<Pane title="Add another business" subtitle="Create a private business workspace using your own information."><BusinessForm practice onSave={d=>create(d,false)} onCancel={()=>setCreateBusiness(false)}/></Pane>:null}
   {!createBusiness&&page==='home'&&<>
    <section className="sd-hero"><div className="sd-eyebrow">SMARTGROWTH · FOUR HORSEMEN TECH</div><h1>Build your business.<br/><em>One step at a time.</em></h1><p>Manage your records, track readiness and discover your next action—even without an internet connection.</p><Btn onClick={()=>go('journey')}>Continue my journey →</Btn></section>
    <div className="sd-kpis"><Kpi label="Recorded income" value={currency(f.income)}/><Kpi label="Recorded expenses" value={currency(f.expenses)}/><Kpi label="Operating surplus" value={currency(f.surplus)} note="From saved records"/><Kpi label="Growth Passport" value={`${p.score}/100`} note="Business readiness"/></div>
    <Pane title="Your business intelligence" subtitle="Personalised to the selected business and updated from saved or synced records.">
     <div className="sd-next"><span className="sd-nexticon"><SmartIcon name="intelligence"/></span><div><b>{currency(intelligence.current.surplus)} recorded surplus in the last 30 days</b><p>{intelligence.actions.length?intelligence.actions[0].title:'Insights are ready.'} · {intelligence.invoices.unpaidCount} unpaid invoice(s). No bank verification.</p></div><Btn onClick={()=>go('intelligence')}>Explore →</Btn></div>
    </Pane>
    <Pane title="Business compliance" subtitle="Track registration and tax guidance appropriate for your business."><div className="sd-next"><span className="sd-nexticon"><SmartIcon name="compliance"/></span><div><b>{compliance.done}/{compliance.total} preparation steps reviewed</b><p>Official records have not been independently verified.</p></div><Btn onClick={()=>go('compliance')}>Review →</Btn></div></Pane>
    <Pane title="Your next step" subtitle="Detected automatically from this business's saved records.">
     {j.next?<div className="sd-next"><span className="sd-nexticon"><SmartIcon name="journey"/></span><div><b>{j.next.label}</b><p>{j.next.why}</p></div><Btn onClick={()=>go(j.next.page)}>Start →</Btn></div>:<p>All current journey milestones complete. Continue recording business activity.</p>}
    </Pane>
    <Pane title="Quick actions"><div className="sd-shortcuts">{[['compliance','compliance','Business compliance'],['money','money','Record a sale'],['invoices','invoices','New invoice'],['business','business','Business profile'],['shield','shield','Check for scams'],['intelligence','intelligence','My Intelligence'],['insights','insights','Live Insights'],['opportunities','opportunities','Find opportunities']].map(([id,icon,label])=><button key={id} onClick={()=>go(id)}><span><SmartIcon name={icon}/></span>{label}<b>↗</b></button>)}</div></Pane>
    <Pane title="Real business opportunities" subtitle="Public National Treasury procurement records, matched to your business industry and province."><p className="sd-muted">{publicFeed?.records?.length?`${publicFeed.records.length} published OCDS records cached from ${publicFeed.fetchedAt?.slice(0,10)||'a previous fetch'}. Check the source and deadline before applying.`:'No official records saved yet. Connect to the internet and fetch the latest source data.'}</p><Btn onClick={()=>go('opportunities')}>Explore Treasury opportunities →</Btn></Pane>

   </>}
   {!createBusiness&&page==='journey'&&<>
    <div className="sd-heading"><small>PERSONALISED BUSINESS JOURNEY</small><h1>Where do you want to go?</h1><p>Your progress updates automatically from the records you save.</p></div>
    <div className="sd-goals">{[['start','start','Start a business'],['manage','manage','Manage money'],['grow','grow','Grow customers'],['protect','protect','Stay protected']].map(([id,icon,label])=><button key={id} className={selectedGoal===id?'active':''} onClick={()=>setGoal(id)}><span><SmartIcon name={icon}/></span>{label}</button>)}</div>
    <Pane title={`${selectedGoal==='protect'?'Protection journey':'Your journey'} · ${activeJourney.completed}/${activeJourney.total} steps`} subtitle={selectedGoal==='protect'?`Fraud protection progress · ${Math.round(activeJourney.completed/activeJourney.total*100)}% complete`:`${Math.round(activeJourney.completed/activeJourney.total*100)}% complete · Business readiness ${p.score}/100`}>
      <div className="sd-progress"><span style={{width:`${activeJourney.completed/activeJourney.total*100}%`}}/></div>
      <div className="sd-steps">{goalSteps.map(s=><div key={s.id} className="sd-step"><span className={s.done?'complete':''}>{s.done?'✓':'○'}</span><div><b>{s.label}</b><p>{s.why}</p></div><button onClick={()=>go(s.page)}>{s.done?'Review':'Open'} ↗</button></div>)}</div>
    </Pane>
    {selectedGoal!=='protect'&&<Pane title="Suggested focus" subtitle="A practical 30-day sprint based on this business."><div className="sd-steps">{guidance.items.slice(0,4).map((x,i)=><div className="sd-step" key={i}><span>{i+1}</span><div><b>{x.title}</b><p>{x.why}</p></div><button onClick={()=>go(x.page)}>Go →</button></div>)}</div></Pane>}
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
    <Pane title="Recent transactions" subtitle="Your saved income and expense records.">{current.transactions.length?current.transactions.map(t=><div className="sd-record" key={t.id}><div><b>{t.description||t.category}</b><small>{t.category} · {t.created_at?.slice(0,10)} {t.sample?'· SAMPLE':''}</small></div><strong className={t.kind==='income'?'pos':'neg'}>{t.kind==='income'?'+':'−'}{currency(t.amount)}</strong></div>):<Empty>No transactions yet. Start with one sale or expense.</Empty>}</Pane>
    <Pane title="What-if calculator" subtitle="Simple arithmetic only; it does not change any records."><label className="sd-range">Increase income by {scenario.revenue}%<input type="range" min="0" max="50" step="5" value={scenario.revenue} onChange={e=>setScenario({...scenario,revenue:Number(e.target.value)})}/></label><label className="sd-range">Reduce expenses by {scenario.costs}%<input type="range" min="0" max="30" step="5" value={scenario.costs} onChange={e=>setScenario({...scenario,costs:Number(e.target.value)})}/></label><b>Illustrative adjusted surplus: {currency(f.income*(1+scenario.revenue/100)-f.expenses*(1-scenario.costs/100))}</b></Pane>
   </>}
   {!createBusiness&&page==='invoices'&&<><div className="sd-heading"><small>INVOICES & PAYMENTS</small><h1>Keep track of who owes you.</h1><p>Keep invoices organised and update their status when you have confirmed payment.</p></div>
    <Pane title="Create an invoice"><form className="sd-form" onSubmit={e=>{e.preventDefault();try{patchBusiness(b=>addInvoice(b,invoice),'Invoice issued. It has not yet increased your income.');setInvoice({customer:'',description:'',amount:'',due_date:''});}catch(err){setError(err.message);}}}>
      <label>Customer<input required maxLength={100} value={invoice.customer} onChange={e=>setInvoice({...invoice,customer:e.target.value})} placeholder="Customer name"/></label><label>What did you sell?<input required maxLength={200} value={invoice.description} onChange={e=>setInvoice({...invoice,description:e.target.value})}/></label><label>Amount (ZAR)<input required min="0.01" step="0.01" type="number" value={invoice.amount} onChange={e=>setInvoice({...invoice,amount:e.target.value})}/></label><label>Due date (optional)<input type="date" value={invoice.due_date} onChange={e=>setInvoice({...invoice,due_date:e.target.value})}/></label><Btn type="submit">Create invoice</Btn>
    </form></Pane>
    <Pane title="Your invoices">{current.invoices.map(i=><div className="sd-invoice" key={i.id}><div><b>{i.number} · {i.customer}</b><p>{i.description} {i.sample?'· SAMPLE':''}</p><small>{i.status==='paid'?'Marked paid':'Unpaid'} · {currency(i.amount)}</small></div>{i.status!=='paid'&&<Btn light onClick={()=>pay(i.id)}>Mark paid</Btn>}</div>)}{!current.invoices.length&&<Empty>No invoices yet.</Empty>}</Pane>
   </>}
   {!createBusiness&&page==='intelligence'&&<BusinessIntelligence business={current} workspace={workspace} accountEmail={cloudUser?.email} onNavigate={go} onSaveGoals={settings=>patchBusiness(b=>({...b,insightSettings:settings}),'Intelligence goals saved to this business.')} />}
   {!createBusiness&&page==='passport'&&<>
    <div className="sd-heading"><small>GROWTH PASSPORT</small><h1>See how you're progressing.</h1><p>Automatic recorded actions are kept separate from self-declared external evidence.</p></div>
    <section className="sd-score"><div className="sd-bigscore">{p.score}<span>/100</span></div><div><b>{p.autoPoints}/60 from saved activity</b><p>{p.documentPoints}/40 from external document declarations</p></div><div className="sd-progress"><span style={{width:`${p.score}%`}}/></div><small>{p.disclaimer}</small></section>
    <Pane title="Automatic milestones" subtitle="No ticking required. They change when your records change."><div className="sd-steps">{p.automatic.map(s=><div key={s.id} className="sd-step"><span className={s.complete?'complete':''}>{s.complete?'✓':'○'}</span><div><b>{s.label}</b><p>{s.complete?'Detected from local records':'Not yet detected'}</p></div><b>{s.complete?s.points:0}/{s.points}</b></div>)}</div></Pane>
    <Pane title="External documents (self-declared)" subtitle="Only tick documents you really have. No CIPC, SARS or bank verification is performed."><div className="sd-actions"><Btn light onClick={()=>go('compliance')}>Review official compliance steps →</Btn></div>{p.manual.map(d=><label key={d.id} className="sd-checkrow"><input type="checkbox" checked={d.completed} onChange={e=>patchBusiness(b=>({...b,documents:{...b.documents,[d.id]:e.target.checked}}),'Document declaration updated.')}/><span>{d.name}</span><b>{d.completed?'+10':'0'}</b></label>)}</Pane>
   </>}
   {!createBusiness&&page==='compliance'&&<ComplianceHub business={current} onChange={patchBusiness}/>}
   {!createBusiness&&page==='business'&&<><div className="sd-heading"><small>BUSINESS PROFILE</small><h1>Every business is different.</h1><p>Personalise SmartGrowth for your type of business, from a spaza shop to a software studio.</p></div>
    <Pane title={current.name} subtitle={`${current.industry} · ${current.region}`}>
      <span title={registryStatus(current).detail} className={`sg-demo-status ${registryStatus(current).style}`}>{registryStatus(current).label}</span>
      <p>{current.description||'No business description was supplied.'}</p>
      {current.registrationDetails&&<div className="sg-readonly-details">
       <p><b>Business structure:</b> {String(current.registrationDetails.structure||'').replaceAll('_',' ')}</p>
       <p><b>Registered business address:</b> {[current.registrationDetails.address?.street,current.registrationDetails.address?.city,current.registrationDetails.address?.province,current.registrationDetails.address?.postalCode].filter(Boolean).join(', ')}</p>
       <p><b>Owner / director:</b> {current.registrationDetails.directorName}</p>
       <p><b>SmartGrowth practice reference:</b> {current.compliance?.cipcNumber||'Not recorded'}</p>
       <p className="sd-muted">Your saved registration details are read-only. Official registration status must be confirmed with the relevant authority.</p>
      </div>}
      <div className="sd-actions">{current.registrySource!==PRACTICE_SOURCE&&<Btn onClick={()=>setEditBusiness(!editBusiness)}>{editBusiness?'Close':'Edit profile'}</Btn>}<Btn light onClick={()=>setCreateBusiness(true)}>Add another business</Btn></div>
      {editBusiness&&current.registrySource!==PRACTICE_SOURCE&&<BusinessForm initial={current} onSave={edit} onCancel={()=>setEditBusiness(false)}/>}
    </Pane>
    <Pane title="Official registration guidance" subtitle="You can now track official registration steps in one place."><div className="sd-actions"><Btn onClick={()=>go('compliance')}>Open Business Compliance Hub →</Btn></div>{OFFICIAL_SOURCES.slice(0,3).map(s=><div className="sd-source" key={s.id}><div><b>{s.name}</b><p>{s.detail}</p></div><InlineLink href={s.url}>Open official site</InlineLink></div>)}</Pane>
   </>}
   {!createBusiness&&page==='shield'&&<><div className="sd-heading"><small>SMARTSHIELD</small><h1>Spot the warning signs.</h1><p>Review warning signs, learn safer practices and track your protection progress.</p></div><Pane title="Check a suspicious message"><form className="sd-form" onSubmit={e=>{e.preventDefault();const result=fraudCheck(scanText);setScan(result);patchBusiness(b=>({...b,security:{...b.security,scans:(b.security?.scans||0)+1,highRiskScans:(b.security?.highRiskScans||0)+(result.signals.length>=2?1:0),lastLevel:result.level,lastScanAt:new Date().toISOString()}}),'Message reviewed. Protection journey updated.');}}><label>Paste a message<textarea rows={5} required minLength={3} maxLength={10000} value={scanText} onChange={e=>setScanText(e.target.value)} placeholder="Paste a suspicious funding, invoice or payment message…"/></label><Btn type="submit">Check this message</Btn></form></Pane>{scan&&<Pane title={scan.level}><div className="sd-steps">{scan.signals.length?scan.signals.map(s=><div key={s} className="sd-flag"><SmartIcon name="warning" size={16}/> {s}</div>):<p>No obvious signs were detected. This does not prove the message is safe.</p>}</div><p>{scan.recommendation}</p></Pane>}
    <Pane title="Protection checklist" subtitle="These steps are tracked separately from business growth readiness.">
      <label className="sd-checkrow"><input type="checkbox" checked={Boolean(current.security?.reviewedTips)} onChange={e=>patchBusiness(b=>({...b,security:{...b.security,reviewedTips:e.target.checked}}),'Protection guidance updated.')}/> I understand that OTPs, upfront fees and urgent payment requests may be warning signs.</label>
      <label className="sd-checkrow"><input type="checkbox" checked={Boolean(current.security?.reviewedContacts)} onChange={e=>patchBusiness(b=>({...b,security:{...b.security,reviewedContacts:e.target.checked}}),'Official contact review updated.')}/> I know how to independently confirm a business or funder through official channels.</label>
      <label className="sd-checkrow"><input type="checkbox" checked={Boolean(current.security?.reviewedScans)} onChange={e=>patchBusiness(b=>({...b,security:{...b.security,reviewedScans:e.target.checked}}),'Screening review updated.')}/> I have reviewed my last screening result and know what to do next.</label>
      <p className="sd-muted">{current.security?.scans||0} message(s) screened for this business. Message text is not stored.</p>
      <Btn light onClick={()=>{setGoal('protect');go('journey');}}>View protection journey</Btn>
    </Pane></>}

   {!createBusiness&&page==='insights'&&<LiveInsights region={current.region} industry={current.industry}/>}
   {!createBusiness&&page==='opportunities'&&<><div className="sd-heading"><small>MARKET & PROCUREMENT ACCESS</small><h1>Find your next opportunity.</h1><p>Discover procurement notices, explore relevant briefs and check eligibility.</p></div>
    <TreasuryOpportunities business={current}/>
    <Pane title="Live opportunity source" subtitle="Official source portal for checking full notices and submission requirements."><div className="sd-source"><div><b>National Treasury eTender Portal</b><p>Search published tenders by sector and region using the official website.</p></div><InlineLink href="https://www.etenders.gov.za/">Open live portal</InlineLink></div><Btn light onClick={()=>patchBusiness(b=>({...b,reviewedOpportunities:true}),'Opportunity source marked reviewed.')}>{current.reviewedOpportunities?'✓ Reviewed':'Mark opportunity search reviewed'}</Btn></Pane>
    <Pane title="Procurement practice briefs" subtitle={`Planning exercises tailored to ${current.industry} and ${current.region}. These are not government tenders.`}><div className="sd-catalog">{opportunities.slice(0,8).map(o=><div className="sd-catalogitem" key={o.id}><span className="sd-label">Practice brief · {o.score}/100 relevance</span><h3>{o.title}</h3><p>{o.description}</p><small>{o.industry} · {o.region} · Indicative budget {currency(o.value)}</small></div>)}</div></Pane>
   </>}
   {!createBusiness&&page==='market'&&<SharedMarketplace business={current} accountId={cloudUid} workspace={workspace}
     onSaveListing={(offer,replace=false)=>patchBusiness(b=>({...b,listings:replace?(b.listings||[]).map(x=>x.id===offer.id?{...x,...offer}:x):[offer,...(b.listings||[])]}),replace?'Listing published.':'Listing saved as a draft.')}
     onRemoveListing={id=>patchBusiness(b=>({...b,listings:(b.listings||[]).filter(x=>x.id!==id)}),'Listing unpublished.')}/>}
   {!createBusiness&&page==='sources'&&<><div className="sd-heading"><small>OFFICIAL RESOURCES</small><h1>Trusted places to start.</h1><p>These are real official websites. Opening them requires connectivity, and their information can change.</p></div><Pane title="South African business resources">{OFFICIAL_SOURCES.map(x=><div className="sd-source" key={x.id}><div><span className="sd-label">{x.category}</span><b>{x.name}</b><p>{x.detail}</p></div><InlineLink href={x.url}>Visit</InlineLink></div>)}</Pane><p className="sd-footnote">Official links verified in October 2026. SmartGrowth supports self-reported portal reviews but does not independently verify registration or tax status; procurement records fetched from National Treasury must be checked against their original notices.</p></>}
   {!createBusiness&&page==='more'&&<><div className="sd-heading"><small>WORKSPACE & SETTINGS</small><h1>Make SmartGrowth yours.</h1><p>Manage your business, account and preferences.</p></div>
    <Pane title="Explore more tools"><div className="sd-shortcuts">{[['business','business','My businesses'],['compliance','compliance','Business compliance'],['invoices','invoices','Invoices'],['intelligence','intelligence','My Intelligence'],['shield','shield','SmartShield'],['market','market','Market Links'],['insights','insights','Live Insights'],['opportunities','opportunities','Procurement'],['sources','sources','Official Sources']].map(([id,icon,label])=><button onClick={()=>go(id)} key={id}><span><SmartIcon name={icon}/></span>{label}<b>↗</b></button>)}</div></Pane>
    <Pane title="Add or switch businesses" subtitle="Every business has its own finances, invoices, Passport and Journey."><div className="sd-businesslist">{state.businesses.map(b=><button key={b.id} className={b.id===current.id?'current':''} onClick={()=>{update(s=>({...s,activeId:b.id}));go('home')}}>{b.name} <small>{b.industry} · {b.region}</small></button>)}</div><Btn light onClick={()=>setCreateBusiness(true)}>+ Create another business</Btn></Pane>
    <Pane title="App version"><p className="sd-muted"><strong>SmartGrowth v1.7.4</strong></p><p className="sd-muted">Your companion for starting, managing and growing your business. Made by Four Horsemen Tech.</p></Pane>
    <Pane title="Privacy, consent & service information"><p className="sd-muted">SmartGrowth uses the personal and business information you provide for account access, business management, personalised insights and compliance guidance. You may review your details and request corrections. We aim to handle personal information responsibly in accordance with POPIA.</p><p className="sd-muted">Accounts and cloud records use Google Firebase services, with local device storage for offline access. SmartGrowth registration references and practice checks are not official CIPC registrations or verification; information is not submitted to government departments through this registration flow. Real procurement records display their source and retrieval date.</p><p className="sd-muted">For official company registration or confirmation, visit <a href="https://www.bizportal.gov.za/" target="_blank" rel="noopener noreferrer">CIPC BizPortal ↗</a>.</p></Pane>
    <Pane title="Backup and device privacy" subtitle="Keep a personal backup of your business records."><p className="sd-muted">Export regularly before uninstalling the app, clearing browser data or switching phones. Backups contain business details in readable JSON.</p><div className="sd-actions"><Btn onClick={downloadBackup}>↓ Export data</Btn><Btn light onClick={()=>fileRef.current?.click()}>↑ Restore backup</Btn><input hidden ref={fileRef} type="file" accept="application/json,.json" onChange={restoreFile}/></div></Pane>
    
    <CloudSyncPanel user={cloudUser} status={cloudStatus} workspace={workspace}/>

   </>}

  </div>
  <FloatingAssistant business={current} userKey={workspace==='cloud'?cloudUid||'unknown':'device'} onNavigate={go}/>
  <nav className="sd-bottom" aria-label="Standalone main navigation">{NAV.map(([id,icon,name])=><button key={id} aria-current={page===id?'page':undefined} className={page===id?'active':''} onClick={()=>go(id)}><span><SmartIcon name={icon} size={21}/></span><small>{name}</small></button>)}</nav>
 </div>;
}
