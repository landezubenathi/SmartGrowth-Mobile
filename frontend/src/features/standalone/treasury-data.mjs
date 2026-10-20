/** Public National Treasury eTenders OCDS release data.
 * No private account/profile information is sent to the source. Only UTC date filters.
 * Source: https://data.etenders.gov.za/Home/LearnMore
 */
export const TREASURY_API = 'https://ocds-api.etenders.gov.za/api/OCDSReleases';
export const TREASURY_PORTAL = 'https://www.etenders.gov.za/';
export const TREASURY_DOCS = 'https://data.etenders.gov.za/Home/LearnMore';
const KEY = 'smartgrowth_treasury_public_v1';
export function treasuryURL(now=new Date(),lookback=30,page=1){
 const days=Math.min(90,Math.max(1,Number(lookback)||30));
 const to=new Date(now),from=new Date(to.getTime()-days*86400000);
 const ymd=d=>d.toISOString().slice(0,10);
 return `${TREASURY_API}?dateFrom=${ymd(from)}&dateTo=${ymd(to)}&PageNumber=${Math.max(1,Math.floor(Number(page)||1))}`;
}
function releaseArray(payload){
 if(Array.isArray(payload)) return payload;
 if(!payload||typeof payload!=='object')return [];
 for(const candidate of [payload.releases,payload.data?.releases,payload.data,payload.value,payload.results,payload.items,payload.Records,payload.Releases,payload.releasePackage?.releases,payload.result?.releases])if(Array.isArray(candidate))return candidate;
 return [];
}
export function normalizeReleases(payload, now=new Date()){
 const items=releaseArray(payload),today=now.toISOString().slice(0,10),map=new Map();
 for(const row of items){
  if(!row||typeof row!=='object')continue;
  const release=row.compiledRelease||row.release||row;
  const tender=release.tender||row.tender;
  if(!tender||typeof tender!=='object')continue;
  const rawOcid=String(release.ocid||row.ocid||'');
  if(!/^ocds-[\w-]{1,115}$/.test(rawOcid))continue;
  const title=String(tender.title||tender.name||'').trim().slice(0,250);
  if(!title)continue;
  const close=String(tender.tenderPeriod?.endDate||tender.enquiryPeriod?.endDate||tender.closingDate||'').slice(0,10);
  const validClose=/^\d{4}-\d{2}-\d{2}$/.test(close)?close:null;
  const status=String(tender.status||'').toLowerCase();
  const withdrawn=/cancelled|canceled|withdrawn|unsuccessful/.test(status);
  const stage=withdrawn?'withdrawn':validClose?(validClose<today?'passed':'check-deadline'):'unknown';
  const publication=String(release.date||row.date||'').slice(0,10);
  const buyer=String(release.buyer?.name||tender.procuringEntity?.name||row.buyer?.name||'Not specified').slice(0,180);
  const value=Number(tender.value?.amount);
  const body=[title,tender.description||'',buyer,tender.mainProcurementCategory||'',(tender.items||[]).map(x=>x.description||'').join(' ')].join(' ').toLowerCase();
  const province=String(tender.deliveryAddress?.region||tender.procuringEntity?.address?.region||release.buyer?.address?.region||'').slice(0,80);
  const safe={ocid:rawOcid,id:String(tender.id||'').slice(0,120),title,buyer,description:String(tender.description||'').slice(0,550),published:/^\d{4}-\d{2}-\d{2}$/.test(publication)?publication:null,closing:validClose,status,stage,province:province||null,category:String(tender.mainProcurementCategory||'').slice(0,60)||null,value:Number.isFinite(value)&&value>0?value:null,body:body.slice(0,2000),source: `${TREASURY_API}/release/${encodeURIComponent(rawOcid)}`};
  const existing=map.get(rawOcid);
  if(!existing||(safe.published||'')>=(existing.published||''))map.set(rawOcid,safe);
 }
 return [...map.values()].sort((a,b)=>(b.published||'').localeCompare(a.published||'')).slice(0,120);
}
const KEYWORDS={
 'Catering':['cater','food','meal','refreshment','hospitality','kitchen'],
 'Retail':['supplies','supply','goods','store','retail','stationery'],
 'Technology':['software','ict','computer','digital','network','it services','technology'],
 'Agriculture':['agricultur','farm','crop','seed','livestock'],
 'Construction':['construction','building','maintenance','civil','renovation'],
 'Beauty':['beauty','cosmetic','salon','grooming'],
 'Transport':['transport','logistics','vehicle','delivery','fleet'],
 'Education':['training','education','school','learning','teaching'],
};
export function rankForBusiness(items,business){
 const keywords=(KEYWORDS[business?.industry]||String(business?.industry||'').toLowerCase().split(/[^a-z]+/).filter(x=>x.length>2));
 const province=String(business?.region||'').toLowerCase();
 return items.map(item=>{
  const text=(item.body||'').toLowerCase();
  const keywordHits=keywords.filter(k=>text.includes(k)).length;
  const provinceMatch=!!province&&[item.province,item.body].some(t=>String(t||'').toLowerCase().includes(province));
  return {...item,relevance:Math.min(5,keywordHits*2+(provinceMatch?1:0)),reasons:[...(keywordHits?['Sector keywords mentioned']:[]),...(provinceMatch?['Province mentioned']:[])]};
 }).sort((a,b)=>b.relevance-a.relevance||(b.published||'').localeCompare(a.published||''));
}
export function readTreasuryCache(storage=typeof localStorage==='undefined'?null:localStorage){
 try {
  const saved=JSON.parse(storage?.getItem(KEY)||'null');
  if(saved?.version!==1||!Array.isArray(saved.records)||saved.records.length>120)return null;
  if(saved.records.some(i=>!/^ocds-[\w-]{1,115}$/.test(i.ocid)))return null;
  return {...saved,status:'cached'};
 }catch(_){return null;}
}
function saveCache(saved,storage){try{storage?.setItem(KEY,JSON.stringify(saved));}catch(_){/* offline cache optional */}}
/** inject request({url}) for unit tests, native HTTP in APK, normal fetch in browsers */
export async function refreshTreasury({request,now=()=>new Date(),storage=typeof localStorage==='undefined'?null:localStorage,days=30}={}){
 const cached=readTreasuryCache(storage);
 try {
  if(typeof request!=='function')throw Error('Network requester unavailable');
  const url=treasuryURL(now(),days,1);
  const response=await request({url});
  if(response.status<200||response.status>=300)throw Error(`National Treasury returned HTTP ${response.status}`);
  const data=typeof response.data==='string'?JSON.parse(response.data):response.data;
  if(!data||typeof data!=='object')throw Error('Invalid response from National Treasury');
  // Reject API error shapes rather than caching an empty, apparently successful response.
  if(data.error||data.errors)throw Error('The source returned an error');
  const array=releaseArray(data);
  if(!Array.isArray(array))throw Error('Unexpected OCDS response');
  if(array.length===0 && !Array.isArray(data) && !['releases','data','value','results','items','Releases'].some(k=>Object.prototype.hasOwnProperty.call(data,k)))throw Error('Unrecognised OCDS response format');
  const records=normalizeReleases(data,now());
  const next={version:1,status:'live',fetchedAt:now().toISOString(),days,records,source:TREASURY_API};
  saveCache(next,storage);return next;
 }catch(error){
  if(cached)return {...cached,status:'cached',warning:`Couldn't refresh National Treasury. Showing saved information (${cached.fetchedAt?.slice(0,10)||'date unknown'}).`};
  return {version:1,status:'unavailable',fetchedAt:null,days,records:[],source:TREASURY_API,warning:error instanceof Error?error.message:'Network unavailable'};
 }
}
