import React,{useEffect,useMemo,useState} from 'react';
import {listingId,publishListing,unpublishListing,watchPublicListings} from './public-market';
import {currency} from './engine.mjs';
export default function SharedMarketplace({business,accountId,workspace,onSaveListing,onRemoveListing}){
 const [form,setForm]=useState({name:'',description:'',price:''});
 const [posts,setPosts]=useState([]),[status,setStatus]=useState('');
 const [busy,setBusy]=useState(false),[search,setSearch]=useState('');
 const cloud=Boolean(accountId&&workspace==='cloud');
 useEffect(()=>{if(!cloud){setPosts([]);setStatus('Sign in to view shared listings. Local drafts remain private.');return;}
  try{return watchPublicListings((items,meta)=>{setPosts(items);setStatus(meta.fromCache?'Showing saved listings. Reconnect for updates.':'Shared marketplace connected.');},e=>setStatus(`Marketplace connection: ${e.message}. If the problem continues, contact support.`));}
  catch(e){setStatus(e.message);}
 },[cloud,accountId]);
 const visible=useMemo(()=>posts.filter(p=>[p.name,p.description,p.businessName,p.industry,p.province].join(' ').toLowerCase().includes(search.toLowerCase())),[posts,search]);
 function onSubmit(e){e.preventDefault();const price=Number(form.price);
  if(!form.name.trim()||!form.description.trim()||!Number.isFinite(price)||price<=0){setStatus('Enter a valid name, description and price.');return;}
  const listing={...form,price,id:listingId(),createdAt:new Date().toISOString(),sample:false,status:'draft'};
  onSaveListing(listing);
  setForm({name:'',description:'',price:''});setStatus('Saved a private listing. Sign in and select Publish to show it to other businesses.');
 }
 async function publish(offer){if(!cloud){setStatus('Sign in using Cloud account & sync in More. Select your cloud workspace, then publish.');return;}
  if(!navigator.onLine){setStatus('Publishing needs internet. Your draft is saved; reconnect and try again.');return;}
  setBusy(true);try{
   await publishListing(business,offer,accountId);
   onSaveListing({...offer,status:'published'},true);
   setStatus('Published successfully. Other signed-in SmartGrowth users can now see your listing.');
  }catch(e){setStatus('Publish failed: '+e.message);}finally{setBusy(false);}
 }
 async function remove(offer){if(!cloud)return;
  setBusy(true);try{await unpublishListing(offer.id,accountId);onRemoveListing(offer.id);setStatus('Listing unpublished.');}catch(e){setStatus('Unpublish failed: '+e.message);}finally{setBusy(false);}
 }
 return <>
  <div className="sd-heading"><small>SMARTGROWTH MARKET LINKS</small><h1>Make your business discoverable.</h1><p>Save a private draft, then publish it to the shared marketplace using your cloud account.</p></div>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Sell a product or service</h2><p>Your listing will display your business name, offer, province and price. Do not include private contact details.</p></div>
   <form className="sd-form" onSubmit={onSubmit}><label>Product or service<input value={form.name} required maxLength={90} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Description<textarea required rows={3} maxLength={500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   <label>Starting price (ZAR)<input type="number" min="0.01" step="0.01" max="100000000" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><button className="sd-btn" type="submit">Save draft</button></form>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Your offers</h2><p>{cloud?'Select Publish to make a listing available to other signed-in users.':'You are using a device-only workspace. Open More → Cloud account & sync to publish.'}</p></div>
   {(business.listings||[]).map(offer=><div className="sd-invoice" key={offer.id}><div><b>{offer.name}</b><p>{offer.description}</p><small>{currency(offer.price)} · {offer.status==='published'?'Published to marketplace':'Private draft'}</small></div><div className="sd-actions">{offer.status==='published'?<button className="sd-btn secondary" disabled={busy||!cloud} onClick={()=>remove(offer)}>Unpublish</button>:<button className="sd-btn" disabled={busy} onClick={()=>publish(offer)}>Publish</button>}</div></div>)}
   {!business.listings?.length&&<p className="sd-empty">You have no listings yet. Add one above to get started.</p>}
   {status&&<p className="sd-treasury-note" role="status">{status}</p>}
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Shared marketplace</h2><p>Browse offers from other SmartGrowth businesses. A published offer is user-submitted, not verified or guaranteed.</p></div>
   {cloud&&<label className="sd-treasury-search">Find a business or product<input placeholder="Search by product, industry or province" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
   <div className="sd-catalog">{visible.map(p=><div className="sd-catalogitem" key={p.id}><span className="sd-label">COMMUNITY LISTING · USER-SUBMITTED</span><h3>{p.name}</h3><p>{p.description}</p><small>{p.businessName} · {p.industry} · {p.province}</small><p><strong>From {currency(p.price)}</strong></p></div>)}</div>
   {!visible.length&&<p className="sd-empty">{cloud?'No published offers were retrieved yet. Try publishing a listing with another signed-in account.':'Sign in to view offers published by other entrepreneurs.'}</p>}
  </section>
 </>;
}
