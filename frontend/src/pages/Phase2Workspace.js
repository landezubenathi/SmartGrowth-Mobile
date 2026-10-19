import React, {useCallback, useEffect, useState} from 'react';

import { getApiBase } from '../config/api';
const industries=['Catering','Retail','Agriculture','Construction','Technology','Services','Manufacturing','Other'];
const regions=['Eastern Cape','Gauteng','KwaZulu-Natal','Western Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'];
const money=n=>'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const card={background:'#fff',border:'1px solid #e2e9f2',borderRadius:16,padding:20,boxShadow:'0 3px 16px rgba(16,42,70,.05)'};
const input={width:'100%',boxSizing:'border-box',padding:'11px 12px',border:'1px solid #b9c9da',borderRadius:9,background:'#fff',marginTop:5};
const primary={background:'#123d72',border:'none',color:'#fff',padding:'11px 18px',borderRadius:9,fontWeight:700,cursor:'pointer'};
const secondary={...primary,background:'#e8eef8',color:'#123d72'};
const muted={color:'#64748b',fontSize:13};
const col={display:'grid',gap:12};

async function call(path, options={}){
  let response;
  try { response=await fetch(`${getApiBase()}/api/growth${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}}); }
  catch(e){throw Error(`Cannot connect to the configured SmartGrowth backend (${e.message}).`);}
  let data;
  try {data=await response.json();} catch(e){throw Error('Unexpected response from backend. Check the FastAPI terminal.');}
  if(!response.ok){
    let msg=typeof data.detail==='string'?data.detail:(Array.isArray(data.detail)?data.detail.map(x=>x.msg).join('; '):'Request failed');
    throw Error(msg);
  }
  return data;
}
function Field({label,children}){return <label style={{display:'block',fontWeight:600,fontSize:14}}>{label}{children}</label>}
function Select({value,onChange,options,placeholder}){return <select style={input} value={value} onChange={onChange}><option value="">{placeholder||'All'}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>}
function Empty({children}){return <p style={{...muted,padding:12,background:'#f6f9fc',borderRadius:8}}>{children}</p>}
function DemoHint({children}){return <div style={{background:'#fff8e7',border:'1px solid #f1dda9',color:'#76531a',borderRadius:10,padding:'10px 13px',fontSize:13,margin:'12px 0'}}>{children}</div>}

export default function Phase2Workspace({area,userId,onFinanceUpdated}) {
  const [registration,setRegistration]=useState(null);
  const [profile,setProfile]=useState({business_name:'',industry:'Catering',region:'Eastern Cape',description:''});
  const [invoices,setInvoices]=useState(null);
  const [inv,setInv]=useState({customer:'',description:'',amount:'',due_date:''});
  const [procure,setProcure]=useState(null);
  const [market,setMarket]=useState(null);
  const [leads,setLeads]=useState(null);
  const [listing,setListing]=useState({name:'',category:'Catering',region:'Eastern Cape',description:'',price_from:''});
  const [filters,setFilters]=useState({category:'',region:''});
  const [enquiry,setEnquiry]=useState({id:null,message:''});
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');

  const load=useCallback(async()=>{
    try{
      let data;
      if(area==='registration'){
        data=await call(`/registration/${encodeURIComponent(userId)}`);setRegistration(data);
        if(data.profile) setProfile({business_name:data.profile.business_name,industry:data.profile.industry,region:data.profile.region,description:data.profile.description});
      }
      if(area==='payments'){data=await call(`/invoices/${encodeURIComponent(userId)}`);setInvoices(data);}
      if(area==='procurement'){data=await call(`/procurement/${encodeURIComponent(userId)}`);setProcure(data);}
      if(area==='market'){
        const [m,l]=await Promise.all([call('/market/listings'),call(`/market/enquiries/${encodeURIComponent(userId)}`)]);
        setMarket(m);setLeads(l);
      }
      setError('');
    }catch(e){setError(e.message);}
  },[area,userId]);
  useEffect(()=>{setError('');setNotice('');load();},[load]);
  async function run(work,success){setBusy(true);setError('');setNotice('');try{await work();await load();if(success)setNotice(success);}catch(e){setError(e.message);}finally{setBusy(false);}}
  const post=(path,data)=>call(path,{method:'POST',body:JSON.stringify(data)});

  return <div style={{display:'grid',gap:18}}>
    {error&&<div role="alert" style={{padding:14,background:'#fff0eb',borderRadius:9,color:'#9b341a'}}>{error}</div>}
    {notice&&<div role="status" style={{padding:14,background:'#eaf8f2',borderRadius:9,color:'#075f41'}}>{notice}</div>}

    {area==='registration'&&<>
      <div style={{...card,background:'linear-gradient(120deg,#f0f5fc,#fff)'}}>
        <h2 style={{marginTop:0}}>Business registration guide</h2>
        <p style={muted}>Create your business profile here, then use the official services to complete any required external registrations. Self-declared status only.</p>
        <strong>Progress: {registration?.completed??0} / {registration?.total??5} steps</strong>
        <div style={{height:11,background:'#dbe5f2',borderRadius:20,overflow:'hidden',marginTop:10}}><div style={{height:'100%',background:'#16865b',width:`${100*(registration?.completed||0)/(registration?.total||5)}%`}}/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        <section style={card}>
          <h3 style={{marginTop:0}}>Your business profile</h3>
          <form style={col} onSubmit={e=>{e.preventDefault();run(async()=>{await post('/registration/profile',{...profile,user_id:userId});if(onFinanceUpdated)await onFinanceUpdated();},'Business profile saved. Growth Passport now detects the profile automatically (+15 if new). This is not proof of CIPC registration.');}}>
            <Field label="Business name"><input style={input} value={profile.business_name} onChange={e=>setProfile({...profile,business_name:e.target.value})} minLength={2} maxLength={90} required placeholder="Example: Litha Catering"/></Field>
            <Field label="Business sector"><select style={input} value={profile.industry} onChange={e=>setProfile({...profile,industry:e.target.value})}>{industries.map(v=><option key={v}>{v}</option>)}</select></Field>
            <Field label="Province"><select style={input} value={profile.region} onChange={e=>setProfile({...profile,region:e.target.value})}>{regions.map(v=><option key={v}>{v}</option>)}</select></Field>
            <Field label="What does your business do?"><textarea style={{...input,minHeight:80}} maxLength={400} value={profile.description} onChange={e=>setProfile({...profile,description:e.target.value})}/></Field>
            <button style={primary} disabled={busy}>{busy?'Saving…':'Save profile'}</button>
          </form>
        </section>
        <section style={card}>
          <h3 style={{marginTop:0}}>Registration and compliance checklist</h3>
          {registration?.steps.map(step=><div key={step.key} style={{padding:'12px 0',borderBottom:'1px solid #e9eef4'}}>
            <label style={{display:'flex',gap:10,alignItems:'start'}}>
              <input style={{marginTop:4}} type="checkbox" disabled={busy||step.key==='profile'} checked={step.completed} onChange={e=>run(async()=>{await post('/registration/step',{user_id:userId,step:step.key,completed:e.target.checked});if(onFinanceUpdated)await onFinanceUpdated();},'Checklist updated; Growth Passport uses matching document statuses.')}/>
              <span><strong>{step.title}</strong><small style={{display:'block',fontWeight:400,...muted,marginTop:4}}>{step.note}</small>
              {step.url&&<a href={step.url} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:6,color:'#155e9d'}}>Open official service ↗</a>}</span>
            </label>
          </div>)}
          <DemoHint>Checking a step records your own declaration only. It does not create a company, validate a certificate, or establish legal compliance.</DemoHint>
        </section>
      </div>
    </>}

    {area==='payments'&&<>
      <div style={card}><h2 style={{marginTop:0}}>Invoices & simulated payments</h2><p style={muted}>Create an invoice, mark it paid in demo mode, and watch the payment appear in Bookkeeping and the Growth Passport.</p><DemoHint>DEMO ONLY — no payment gateway, payment link, card processing or money movement. Do not enter actual customer details.</DemoHint></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16}}>
        <section style={card}><h3 style={{marginTop:0}}>Create invoice</h3><form style={col} onSubmit={e=>{e.preventDefault();run(async()=>{await post('/invoices',{user_id:userId,customer:inv.customer,description:inv.description,amount:inv.amount,due_date:inv.due_date||null});if(onFinanceUpdated)await onFinanceUpdated();setInv({customer:'',description:'',amount:'',due_date:''});},'Invoice saved: Growth Passport automatically detects issued invoices (+10 if first). No income is added until payment is simulated.');}}>
          <Field label="Customer / buyer (fictional)"><input style={input} required minLength={2} maxLength={100} value={inv.customer} onChange={e=>setInv({...inv,customer:e.target.value})} placeholder="Example: Community Workshop"/></Field>
          <Field label="Product or service"><input style={input} required minLength={2} maxLength={200} value={inv.description} onChange={e=>setInv({...inv,description:e.target.value})} placeholder="Example: Catering for 25 people"/></Field>
          <Field label="Amount (ZAR)"><input style={input} required type="number" min="0.01" step="0.01" max="10000000" value={inv.amount} onChange={e=>setInv({...inv,amount:e.target.value})}/></Field>
          <Field label="Due date (optional)"><input style={input} type="date" value={inv.due_date} onChange={e=>setInv({...inv,due_date:e.target.value})}/></Field>
          <button style={primary} disabled={busy}>{busy?'Saving…':'Generate demo invoice'}</button>
        </form></section>
        <section style={card}><h3 style={{marginTop:0}}>Invoice register</h3>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}><span style={{...muted,background:'#fff5df',padding:8,borderRadius:8}}>Unpaid: <strong>{invoices?.counts.unpaid??0}</strong></span><span style={{...muted,background:'#e9f8ef',padding:8,borderRadius:8}}>Paid: <strong>{invoices?.counts.paid??0}</strong></span></div>
          {!invoices?.invoices.length?<Empty>Create your first invoice using the form.</Empty>:<div style={{maxHeight:510,overflowY:'auto'}}>{invoices.invoices.map(i=><div key={i.id} style={{borderBottom:'1px solid #e7edf4',padding:'14px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><strong>{i.invoice_number}</strong><span style={{color:i.status==='paid'?'#087342':'#986305',fontSize:13,fontWeight:700}}>{i.status==='paid'?'PAID (DEMO)':'UNPAID'}</span></div>
            <p style={{margin:'4px 0'}}>{i.customer} · {i.description}</p><strong>{money(i.amount)}</strong>{i.due_date&&<small style={{...muted,display:'block'}}>Due: {i.due_date}</small>}
            {i.status==='unpaid'&&<button style={{...secondary,display:'block',marginTop:9}} disabled={busy} onClick={()=>run(async()=>{await call(`/invoices/${i.id}/simulate-payment?user_id=${encodeURIComponent(userId)}`,{method:'POST'});if(onFinanceUpdated)await onFinanceUpdated();},'Simulated payment saved; one income transaction was added to Bookkeeping.')}>Simulate payment received</button>}
          </div>)}</div>}
        </section>
      </div>
    </>}

    {area==='procurement'&&<>
      <div style={card}><h2 style={{marginTop:0}}>Procurement opportunity matching</h2><p style={muted}>Compare fictional procurement briefs against your business sector, province and document checklist. Scores indicate demo similarity, not legal eligibility.</p>
        {!procure?.profile_complete&&<DemoHint>Add a business profile under Registration to enable industry and province matching.</DemoHint>}
        <DemoHint>ALL SIX RFQs ARE FICTIONAL EXAMPLES — they are not live public-sector tenders. For real opportunities visit <a href="https://www.etenders.gov.za/" target="_blank" rel="noopener noreferrer">National Treasury eTender Portal ↗</a> and independently verify every listing.</DemoHint>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
        {procure?.opportunities.map(o=><article style={card} key={o.id}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><small style={{color:'#697a8f',fontWeight:800}}>{o.id} · DEMO</small><strong style={{color:'#12623f'}}>{o.match_score}/100</strong></div>
          <h3 style={{margin:'12px 0 6px'}}>{o.title}</h3><p style={{...muted,margin:0}}>{o.buyer} · {o.region} · {o.sector}</p><p style={{fontWeight:800,color:'#123d72'}}>{money(o.value)} <small style={muted}>(illustrative)</small></p><p>{o.summary}</p>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}><span style={{background:o.sector_match?'#e3f5ea':'#f2f4f7',borderRadius:6,padding:6,fontSize:12}}>Sector {o.sector_match?'✓':'not matched'}</span><span style={{background:o.region_match?'#e3f5ea':'#f2f4f7',borderRadius:6,padding:6,fontSize:12}}>Province {o.region_match?'✓':'not matched'}</span></div>
          <p style={{fontSize:13,marginBottom:4}}><strong>Required evidence:</strong> {o.required.join(', ')}</p><p style={{...muted,margin:0}}><strong>Next step:</strong> {o.next_action}</p>
        </article>)}
      </div>
    </>}

    {area==='market'&&<>
      <div style={card}><h2 style={{marginTop:0}}>Market links & local supplier discovery</h2><p style={muted}>Create a demo business listing, discover other suppliers, or send an enquiry to another local demo account. Use fictional information only.</p><DemoHint>Demo supplier cards are fictional. Locally published listings and enquiries are not sent outside your computer.</DemoHint></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
        <section style={card}><h3 style={{marginTop:0}}>Publish a business listing</h3><form style={col} onSubmit={e=>{e.preventDefault();run(async()=>{await post('/market/listings',{...listing,user_id:userId});setListing({name:'',category:'Catering',region:'Eastern Cape',description:'',price_from:''});},'Local business listing created.');}}>
          <Field label="Business display name"><input style={input} required minLength={2} maxLength={90} value={listing.name} onChange={e=>setListing({...listing,name:e.target.value})}/></Field>
          <Field label="Category"><select style={input} value={listing.category} onChange={e=>setListing({...listing,category:e.target.value})}>{industries.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Field label="Province"><select style={input} value={listing.region} onChange={e=>setListing({...listing,region:e.target.value})}>{regions.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Field label="Product or service details"><textarea style={{...input,minHeight:82}} required minLength={8} maxLength={500} value={listing.description} onChange={e=>setListing({...listing,description:e.target.value})}/></Field>
          <Field label="Starting price (ZAR)"><input style={input} type="number" step="0.01" min="0.01" max="10000000" required value={listing.price_from} onChange={e=>setListing({...listing,price_from:e.target.value})}/></Field>
          <button disabled={busy} style={primary}>Publish demo listing</button>
        </form></section>
        <section style={card}><h3 style={{marginTop:0}}>Browse local listings</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:14}}><Select value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})} options={industries} placeholder="Any category"/><Select value={filters.region} onChange={e=>setFilters({...filters,region:e.target.value})} options={regions} placeholder="Any province"/></div>
          <div style={{maxHeight:550,overflowY:'auto'}}>{!market?.listings.length?<Empty>No listings yet.</Empty>:market.listings.filter(i=>(!filters.category||i.category===filters.category)&&(!filters.region||i.region===filters.region)).map(i=><article key={i.id} style={{padding:'13px 0',borderBottom:'1px solid #e7edf4'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{i.name}</strong><small style={muted}>{i.demo?'Sample':i.user_id===userId?'Your listing':'Local demo'}</small></div><p style={{...muted,margin:'4px 0'}}>{i.category} · {i.region}</p><p style={{margin:'6px 0'}}>{i.description}</p><strong style={{color:'#12623f'}}>From {money(i.price_from)}</strong>
            {!i.demo&&i.user_id===userId&&<button style={{...secondary,display:'block',marginTop:9}} disabled={busy} onClick={()=>run(()=>call(`/market/listings/${Number(i.id.replace('listing-',''))}/generate-demo-enquiry?user_id=${encodeURIComponent(userId)}`,{method:'POST'}),'Fictional customer enquiry created. See your inbox below.')}>Generate sample buyer enquiry</button>}
            {!i.demo&&i.user_id!==userId&&<button style={{...secondary,display:'block',marginTop:9}} onClick={()=>setEnquiry({id:Number(i.id.replace('listing-','')),message:''})}>Enquire</button>}
            {enquiry.id===Number(String(i.id).replace('listing-',''))&&!i.demo&&i.user_id!==userId&&<form style={{marginTop:9}} onSubmit={e=>{e.preventDefault();run(async()=>{await post('/market/enquiries',{listing_id:enquiry.id,buyer_user_id:userId,message:enquiry.message});setEnquiry({id:null,message:''});},'Local enquiry sent. The seller can see it when signed in.');}}><textarea style={{...input,minHeight:70}} required minLength={5} maxLength={500} value={enquiry.message} onChange={e=>setEnquiry({...enquiry,message:e.target.value})} placeholder="What do you need? (no sensitive details)"/><button style={{...primary,marginTop:6}} disabled={busy}>Send demo enquiry</button></form>}
          </article>)}</div>
        </section>
      </div>
      <section style={card}><h3 style={{marginTop:0}}>Your enquiries inbox</h3>{!leads?.enquiries.length?<Empty>No enquiries on your listings yet. Another demo SMME account can send an enquiry to your listing.</Empty>:leads.enquiries.map(e=><div key={e.id} style={{borderBottom:'1px solid #e7edf4',padding:'10px 0'}}><strong>{e.listing_name}</strong><span style={{...muted,marginLeft:10}}>from {e.buyer_user_id}</span><p style={{margin:'6px 0'}}>{e.message}</p></div>)}</section>
    </>}
  </div>;
}
