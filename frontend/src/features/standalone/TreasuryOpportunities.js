import React,{useEffect,useMemo,useState} from 'react';
import {Capacitor,CapacitorHttp} from '@capacitor/core';
import {readTreasuryCache,refreshTreasury,rankForBusiness,TREASURY_DOCS,TREASURY_PORTAL} from './treasury-data.mjs';

async function requestPublic({url}){
 if(Capacitor.isNativePlatform()){
  const response=await CapacitorHttp.get({url,headers:{Accept:'application/json'},connectTimeout:12000,readTimeout:15000});
  return {status:response.status,data:response.data};
 }
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try {
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});
  return {status:response.status,data:await response.json()};
 }finally{clearTimeout(timer);}
}
const SourceLink=({href,children})=><a href={href} target="_blank" rel="noopener noreferrer" className="sd-official-link">{children} ↗</a>;
export default function TreasuryOpportunities({business}){
 const [feed,setFeed]=useState(()=>readTreasuryCache()||{status:'unavailable',records:[]});
 const [loading,setLoading]=useState(false);
 const [days,setDays]=useState(30);
 const [query,setQuery]=useState('');
 const [onlyRelevant,setOnlyRelevant]=useState(false);
 const sorted=useMemo(()=>rankForBusiness(feed.records||[],business),[feed.records,business]);
 const shown=useMemo(()=>sorted.filter(x=>(!onlyRelevant||x.relevance>0)&&(!query||[x.title,x.description,x.buyer,x.ocid].join(' ').toLowerCase().includes(query.toLowerCase()))).slice(0,40),[sorted,query,onlyRelevant]);
 async function refresh(){setLoading(true);try{setFeed(await refreshTreasury({request:requestPublic,days}));}finally{setLoading(false);}}
 useEffect(()=>{
  // Cache is safe to display immediately; an explicit action refreshes external data.
  setFeed(readTreasuryCache()||{status:'unavailable',records:[]});
 },[]);
 return <section className="sd-panel sd-treasury" aria-label="Official National Treasury procurement data">
  <div className="sd-panelhead"><h2>National Treasury procurement data</h2><p>Public OCDS records fetched from an official South African government API. Your business details remain on this device.</p></div>
  <div className="sd-treasury-state" role="status"><strong>{feed.status==='live'?'● Retrieved from official API':feed.status==='cached'?'◷ Saved official records':'○ No downloaded records yet'}</strong><small>{feed.fetchedAt?`Last successful retrieval: ${new Date(feed.fetchedAt).toLocaleString('en-ZA')}`:'Connect to the internet to retrieve records.'}</small></div>
  <div className="sd-treasury-actions"><label>Publication window <select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={60}>Last 60 days</option><option value={90}>Last 90 days</option></select></label><button className="sd-btn" onClick={refresh} disabled={loading}>{loading?'Contacting Treasury…':'↻ Fetch official data'}</button></div>
  {feed.warning&&<p className="sd-treasury-note" role="status">{feed.status==='cached'?feed.warning:`Live refresh unavailable: ${feed.warning}. Please check your connection or try the official portal.`}</p>}
  {feed.records?.length>0?<>
   <p className="sd-treasury-disclaimer">{feed.records.length} records in this retrieval. Sorted by keyword relevance for <b>{business.industry}</b> in <b>{business.region}</b>. Matching is only a text-based suggestion, not an eligibility check.</p>
   <label className="sd-treasury-search">Search results <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. cleaning, ICT, catering"/></label>
   <label className="sd-treasury-check"><input type="checkbox" checked={onlyRelevant} onChange={e=>setOnlyRelevant(e.target.checked)}/> Show records mentioning your industry or province</label>
   <div className="sd-catalog">{shown.length?shown.map(x=><article className="sd-catalogitem" key={x.ocid}>
    <span className="sd-label">{feed.status==='cached'?'SAVED OFFICIAL RECORD':'OFFICIAL OCDS RECORD'} · {x.stage==='passed'?'Deadline passed':x.stage==='withdrawn'?'Withdrawn / cancelled':x.stage==='check-deadline'?'Deadline requires checking':'Status not confirmed'}</span>
    <h3>{x.title}</h3><p>{x.description||'No description supplied in this release.'}</p>
    <small><b>Buyer:</b> {x.buyer}</small><small><b>Published:</b> {x.published||'Not provided'} · <b>Closing:</b> {x.closing||'Not provided'}</small>
    <small><b>Relevance:</b> {x.reasons.length?x.reasons.join(' · '):'General procurement listing'}</small>
    <div className="sd-treasury-links"><SourceLink href={x.source}>Original OCDS release</SourceLink><SourceLink href={TREASURY_PORTAL}>Verify tender on eTenders</SourceLink></div>
   </article>):<p className="sd-empty">No results match your filters in this downloaded page. Try different keywords, another date window or the official portal.</p>}</div>
  </>:<p className="sd-empty">No official records are available on this device yet. Your sample briefs below remain available offline.</p>}
  <p className="sd-treasury-disclaimer">Treasury's transparency data is a subset of published procurement information and may be incomplete or delayed. These records are not automatically verified as open tenders. Always check the original documents, requirements and deadline before applying. <SourceLink href={TREASURY_DOCS}>Source policy</SourceLink></p>
 </section>;
}
