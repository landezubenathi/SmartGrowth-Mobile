import React,{useEffect,useMemo,useState} from 'react';
import {listingId,publishListing,unpublishListing,watchPublicListings} from './public-market';
import {sendMarketEnquiry,watchReceivedEnquiries,watchSentEnquiries,updateMarketEnquiryStatus} from './market-enquiries';
import {canContactOffer,enquiryStatus} from './market-enquiry-data.mjs';
import {currency} from './engine.mjs';
import SmartIcon from './SmartIcon';

const emptyEnquiry={offer:null,intent:'interest',name:'',phone:'',message:'',consent:false};
export default function SharedMarketplace({business,accountId,accountEmail='',workspace,onSaveListing,onRemoveListing}){
 const [form,setForm]=useState({name:'',description:'',price:''});
 const [posts,setPosts]=useState([]),[status,setStatus]=useState('');
 const [busy,setBusy]=useState(false),[search,setSearch]=useState('');
 const [enquiry,setEnquiry]=useState(emptyEnquiry),[received,setReceived]=useState([]),[sent,setSent]=useState([]);
 const [contactBusy,setContactBusy]=useState(false),[contactMessage,setContactMessage]=useState('');
 const cloud=Boolean(accountId&&workspace==='cloud');
 useEffect(()=>{
  setPosts([]);setReceived([]);setSent([]);setEnquiry(emptyEnquiry);setContactMessage('');
  if(!cloud){setStatus('Sign in to view shared listings. Local drafts remain private.');return;}
  const stops=[];
  try{
   stops.push(watchPublicListings((items,meta)=>{setPosts(items);setStatus(meta.fromCache?'Showing saved listings. Reconnect for updates.':'Shared marketplace connected.');},e=>setStatus(`Marketplace connection: ${e.message}. If the problem continues, contact support.`)));
   stops.push(watchReceivedEnquiries(accountId,items=>setReceived(items),e=>setContactMessage(`Unable to load received enquiries: ${e.message}`)));
   stops.push(watchSentEnquiries(accountId,items=>setSent(items),e=>setContactMessage(`Unable to load sent enquiries: ${e.message}`)));
  }catch(e){setStatus(e.message);}
  return ()=>stops.forEach(stop=>stop?.());
 },[cloud,accountId]);
 const visible=useMemo(()=>posts.filter(p=>[p.name,p.description,p.businessName,p.industry,p.province].join(' ').toLowerCase().includes(search.toLowerCase())),[posts,search]);
 const inbox=useMemo(()=>received.filter(e=>e.ownerBusinessId===business.id),[received,business.id]);
 const unread=inbox.filter(e=>e.status==='new').length;
 function onSubmit(e){e.preventDefault();const price=Number(form.price);
  if(!form.name.trim()||!form.description.trim()||!Number.isFinite(price)||price<=0){setStatus('Enter a valid name, description and price.');return;}
  const listing={...form,price,id:listingId(),createdAt:new Date().toISOString(),sample:false,status:'draft'};
  onSaveListing(listing);
  setForm({name:'',description:'',price:''});setStatus('Saved a private listing. Sign in and select Publish to show it to other businesses.');
 }
 async function publish(offer){if(!cloud){setStatus('Sign in using your account in More, then select Publish.');return;}
  if(!navigator.onLine){setStatus('Publishing needs internet. Your draft is saved; reconnect and try again.');return;}
  setBusy(true);try{
   await publishListing(business,offer,accountId);
   onSaveListing({...offer,status:'published'},true);
   setStatus('Published successfully. Other SmartGrowth users can now see your listing.');
  }catch(e){setStatus('Publish failed: '+e.message);}finally{setBusy(false);}
 }
 async function remove(offer){if(!cloud)return;
  setBusy(true);try{await unpublishListing(offer.id,accountId);onRemoveListing(offer.id);setStatus('Listing unpublished.');}catch(e){setStatus('Unpublish failed: '+e.message);}finally{setBusy(false);}
 }
 function openEnquiry(offer,intent){
  if(!cloud){setContactMessage('Sign in to contact this business.');return;}
  if(offer.ownerUid===accountId)return;
  const alreadySent=sent.some(s=>s.offerId===offer.id);
  if(alreadySent){setContactMessage('You have already sent an enquiry for this listing. Check Sent enquiries below.');return;}
  setContactMessage('');setEnquiry({offer,intent,name:business.registrationDetails?.directorName||'',phone:'',message:'',consent:false});
 }
 async function submitEnquiry(e){e.preventDefault();
  if(!enquiry.offer||!cloud)return;
  if(sent.some(item=>item.offerId===enquiry.offer.id)){setContactMessage('You have already sent an enquiry for this listing.');return;}
  if(!enquiry.consent){setContactMessage('Confirm that your contact information may be shared with the listing owner.');return;}
  if(!navigator.onLine){setContactMessage('Reconnect to send your enquiry. Your business records remain available offline.');return;}
  setContactBusy(true);setContactMessage('');
  try{
   await sendMarketEnquiry({offer:enquiry.offer,business,uid:accountId,email:accountEmail,name:enquiry.name,phone:enquiry.phone,message:enquiry.message,intent:enquiry.intent});
   setEnquiry(emptyEnquiry);setContactMessage('Enquiry sent. The listing owner can now see your details in their private Market Links inbox.');
  }catch(err){setContactMessage(err.code==='permission-denied'?'Unable to send. Ask the app administrator to deploy the updated Firestore marketplace rules.':String(err.message||err));}
  finally{setContactBusy(false);}
 }
 async function setLeadStatus(lead,next){setContactBusy(true);try{await updateMarketEnquiryStatus(lead,next,accountId);setContactMessage('Enquiry updated.');}catch(e){setContactMessage(e.message);}finally{setContactBusy(false);}}
 return <>
  <div className="sd-heading"><small>SMARTGROWTH MARKET LINKS</small><h1>Make your business discoverable.</h1><p>Publish products and services, connect with other entrepreneurs and manage enquiries in one place.</p></div>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Sell a product or service</h2><p>Your listing shows only business details, offer, province and starting price. Your private contact information is not shown publicly.</p></div>
   <form className="sd-form" onSubmit={onSubmit}><label>Product or service<input value={form.name} required maxLength={90} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label>Description<textarea required rows={3} maxLength={500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   <label>Starting price (ZAR)<input type="number" min="0.01" step="0.01" max="100000000" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><button className="sd-btn" type="submit">Save draft</button></form>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Your offers</h2><p>{cloud?'Select Publish to make a listing available to other users.':'Sign in to your account to publish.'}</p></div>
   {(business.listings||[]).map(offer=><div className="sd-invoice" key={offer.id}><div><b>{offer.name}</b><p>{offer.description}</p><small>{currency(offer.price)} · {offer.status==='published'?'Published to marketplace':'Private draft'}</small></div><div className="sd-actions">{offer.status==='published'?<button className="sd-btn secondary" disabled={busy||!cloud} onClick={()=>remove(offer)}>Unpublish</button>:<button className="sd-btn" disabled={busy} onClick={()=>publish(offer)}>Publish</button>}</div></div>)}
   {!business.listings?.length&&<p className="sd-empty">You have no listings yet. Add one above to get started.</p>}
   {status&&<p className="sd-treasury-note" role="status">{status}</p>}
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Shared marketplace</h2><p>Find products and services offered by other SmartGrowth businesses, and contact them directly through the app.</p></div>
   {cloud&&<label className="sd-treasury-search">Find a business or product<input placeholder="Search by product, industry or province" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
   <div className="sd-catalog">{visible.map(p=>{
    const alreadySent=sent.some(s=>s.offerId===p.id);const own=p.ownerUid===accountId;
    return <article className="sd-catalogitem sg-offer-card" key={p.id}>
     <span className="sd-label">COMMUNITY MARKETPLACE</span><h3>{p.name}</h3><p>{p.description}</p><small>{p.businessName} · {p.industry} · {p.province}</small><p><strong>From {currency(p.price)}</strong></p>
     {own?<small>Your business listing</small>:alreadySent?<span className="sg-market-tag"><SmartIcon name="check"/> Enquiry sent</span>:<div className="sg-market-ctas"><button type="button" disabled={!cloud} className="sd-btn" onClick={()=>openEnquiry(p,'interest')}>Show interest</button><button type="button" disabled={!cloud} className="sd-btn secondary" onClick={()=>openEnquiry(p,'quotation')}>Send enquiry / request quote</button></div>}
     {enquiry.offer?.id===p.id&&<form className="sg-market-contact" onSubmit={submitEnquiry}>
      <h4>{enquiry.intent==='quotation'?'Request a quotation':'Contact this business'}</h4>
      <p>Your contact information goes privately to this listing's owner, not onto the public marketplace.</p>
      <label>Your name<input required minLength={2} maxLength={100} value={enquiry.name} onChange={e=>setEnquiry({...enquiry,name:e.target.value})}/></label>
      <label>Email address<input value={accountEmail} readOnly type="email"/></label>
      <label>Phone / WhatsApp (optional)<input type="tel" maxLength={30} autoComplete="tel" value={enquiry.phone} onChange={e=>setEnquiry({...enquiry,phone:e.target.value})} placeholder="Contact number"/></label>
      <label>Message<textarea minLength={10} maxLength={1000} rows={3} required value={enquiry.message} onChange={e=>setEnquiry({...enquiry,message:e.target.value})} placeholder="Describe what you need, quantities and timing"/></label>
      <small>Sending as {business.name} · {business.industry} · {business.region}</small>
      <label className="sg-market-consent"><input type="checkbox" checked={enquiry.consent} onChange={e=>setEnquiry({...enquiry,consent:e.target.checked})} required/> I agree to share my name, email, optional phone number, business details and message with this listing's owner so they can respond.</label>
      <div className="sg-market-ctas"><button className="sd-btn" disabled={contactBusy||!enquiry.consent} type="submit">{contactBusy?'Sending…':'Send to business owner'}</button><button type="button" className="sd-btn secondary" onClick={()=>setEnquiry(emptyEnquiry)}>Cancel</button></div>
     </form>}
    </article>;
   })}</div>
   {!visible.length&&<p className="sd-empty">{cloud?'No published offers found. Try another search.':'Sign in to view offers published by other entrepreneurs.'}</p>}
   {contactMessage&&<p className="sd-treasury-note" role="status">{contactMessage}</p>}
  </section>
  {cloud&&<section className="sd-panel sg-market-inbox" id="market-enquiries"><div className="sd-panelhead"><h2>Enquiries received {unread>0&&<span className="sg-market-count">{unread} new</span>}</h2><p>Private enquiries for {business.name}. Only you can view contact information sent to your listings.</p></div>
   {!inbox.length&&<p className="sd-empty">No enquiries received yet. Publish an offer to make it available to potential customers.</p>}
   {inbox.map(e=><article className="sg-market-lead" key={e.id}><div className="sg-market-leadhead"><strong>{e.offerName}</strong><span className="sg-market-tag">{enquiryStatus(e.status)}</span></div>
    <p><b>{e.intent==='quotation'?'Quotation request':'Interested buyer'}</b> · {e.senderName} · {e.senderBusinessName}</p>
    <small>{e.senderIndustry} · {e.senderProvince} · {new Date(e.createdAt).toLocaleString()}</small>
    <p className="sg-market-message">{e.message}</p>
    <p><b>Email:</b> <a href={`mailto:${e.senderEmail}?subject=${encodeURIComponent('SmartGrowth enquiry: '+e.offerName)}`}>{e.senderEmail}</a>{e.senderPhone&&<> · <b>Phone:</b> {e.senderPhone}</>}</p>
    <div className="sg-market-ctas">{e.status==='new'&&<button className="sd-btn" disabled={contactBusy} onClick={()=>setLeadStatus(e,'contacted')}>Mark contacted</button>}{e.status!=='closed'&&<button className="sd-btn secondary" disabled={contactBusy} onClick={()=>setLeadStatus(e,'closed')}>Close enquiry</button>}</div>
   </article>)}
  </section>}
  {cloud&&<section className="sd-panel"><div className="sd-panelhead"><h2>Sent enquiries</h2><p>Track requests you've sent to other businesses.</p></div>
   {!sent.length&&<p className="sd-empty">You haven't contacted any businesses yet.</p>}
   {sent.map(e=><article className="sg-market-lead" key={e.id}><div className="sg-market-leadhead"><strong>{e.offerName}</strong><span className="sg-market-tag">{enquiryStatus(e.status)}</span></div><small>{e.intent==='quotation'?'Quote requested':'Interest expressed'} · {new Date(e.createdAt).toLocaleString()}</small><p>{e.message}</p></article>)}
  </section>}
 </>;
}
