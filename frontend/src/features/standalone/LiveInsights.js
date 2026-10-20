import React,{useEffect,useState} from 'react';
import {PUBLIC_DATA_SOURCES,readLiveCache,refreshLiveInsights,contextualTips} from './live-data.mjs';
const FEEDS=[['weather','Local weather'],['fx','Exchange rate'],['inflation','SA inflation']];
function num(value,digits=1){return Number(value).toLocaleString('en-ZA',{minimumFractionDigits:digits,maximumFractionDigits:digits});}
function dateTime(stamp){if(!stamp)return 'No saved observation';try{return new Date(stamp).toLocaleString('en-ZA');}catch(_){return stamp;}}
function Feed({id,title,field,city}){
 const source=PUBLIC_DATA_SOURCES[id],value=field?.data;
 let number='—',detail='No data available yet.';
 if(value&&id==='weather'){number=`${num(value.tempC)}°C`;detail=`${city} · ${value.forecastDate||'forecast'} · rain ${value.rainTodayMm===null?'not reported':num(value.rainTodayMm)+' mm'}`;}
 if(value&&id==='fx'){number=`R${num(value.rate,2)}`;detail=`1 USD · rate dated ${value.date||'unknown'}`;}
 if(value&&id==='inflation'){number=`${num(value.percent,2)}%`;detail=`Annual consumer-price inflation · ${value.year}`;}
 return <article className="sd-live-card">
  <div className="sd-live-cardtop"><span>{title}</span><span className={`sd-data-status ${field?.status||'unavailable'}`}>{field?.status==='live'?'API updated':field?.status==='cached'?'Saved data':'Unavailable'}</span></div>
  <strong className="sd-live-value">{number}</strong><p>{detail}</p>
  {field?.fetchedAt&&<small>Retrieved: {dateTime(field.fetchedAt)}</small>}
  <small>{source.note}</small>
  <a href={source.url} target="_blank" rel="noopener noreferrer">Source: {source.name} ↗</a>
 </article>;
}
export default function LiveInsights({region,industry}){
 const [snapshot,setSnapshot]=useState(()=>readLiveCache(region));
 const [loading,setLoading]=useState(false);
 const [attempted,setAttempted]=useState(false);
 const [refreshIndex,setRefreshIndex]=useState(0);
 useEffect(()=>{
  let active=true;setSnapshot(readLiveCache(region));setAttempted(false);
  if(typeof navigator!=='undefined'&&!navigator.onLine){setLoading(false);setAttempted(true);return ()=>{active=false;};}
  setLoading(true);refreshLiveInsights(region).then(result=>{if(active)setSnapshot(result);}).catch(()=>{}).finally(()=>{if(active){setLoading(false);setAttempted(true);}});
  return ()=>{active=false;};
 },[region,refreshIndex]);
 const fields=snapshot?.fields||{};
 const hasData=FEEDS.some(([key])=>fields[key]?.data);
 const tips=contextualTips(industry,fields);
 return <>
  <div className="sd-heading"><small>SMARTGROWTH · CONNECTED INSIGHTS</small><h1>Business conditions around you.</h1><p>Real public information when you're online; saved observations if you're offline. Your invoices, accounts and business name are never sent to these sources.</p></div>
  <section className="sd-panel">
   <div className="sd-live-head"><div><h2>Live Business Insights</h2><p className="sd-muted">Reference city for {region}: {snapshot?.city||region}. This isn't your business's precise location.</p></div>
    <button className="sd-btn" onClick={()=>setRefreshIndex(n=>n+1)} disabled={loading}>{loading?'Refreshing…':'↻ Refresh data'}</button></div>
   <div className="sd-live-grid">{FEEDS.map(([id,title])=><Feed key={id} id={id} title={title} city={snapshot?.city||region} field={fields[id]}/>)}</div>
   <p className="sd-live-caption" role="status">{loading?'Contacting public data providers…':hasData?'Source-specific dates are shown above. Saved values may be stale.':attempted?'No external information could be loaded. Connect to the internet and choose Refresh data.':'Checking available external data…'}</p>
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>What this means for {industry.toLowerCase()}</h2><p>Planning prompts based on available external observations—not forecasts of your business's future income.</p></div>
   {tips.length?<div className="sd-live-tips">{tips.map((t,i)=><div key={i}><span>✦</span><p>{t}</p></div>)}</div>:<p className="sd-empty">Refresh the public data for contextual suggestions. Your Growth Advisor still works with saved business records.</p>}
  </section>
  <section className="sd-panel"><div className="sd-panelhead"><h2>Real opportunities and registrations</h2><p>Official websites, not API-integrated tenders or automatic verification.</p></div>
   <div className="sd-live-links">
    <a href="https://www.etenders.gov.za/Home/Opportunities" target="_blank" rel="noopener noreferrer">National Treasury · Search currently advertised tenders ↗</a>
    <a href="https://www.bizportal.gov.za/" target="_blank" rel="noopener noreferrer">CIPC BizPortal · Business registration ↗</a>
    <a href="https://secure.csd.gov.za/" target="_blank" rel="noopener noreferrer">CSD · Supplier registration ↗</a>
   </div><p className="sd-muted">These services may require separate accounts. SmartGrowth does not verify documents, tender eligibility or deadlines.</p>
  </section>
  <p className="sd-footnote">Public API feeds: Open-Meteo (CC BY 4.0, non-commercial public API terms), Frankfurter, World Bank. Connected insights do not increase the Growth Passport score. External forecasts and macroeconomic indicators are not guaranteed to be complete or current.</p>
 </>;
}
