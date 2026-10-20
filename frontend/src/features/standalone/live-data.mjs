/** Public, non-personal business context. Never send invoices, credentials or business names to these APIs. */
export const PUBLIC_DATA_SOURCES = Object.freeze({
  weather: {name:'Open-Meteo',url:'https://open-meteo.com/en/docs',note:'Weather forecast for a representative city in the selected province; not the exact business location.'},
  fx: {name:'Frankfurter',url:'https://frankfurter.dev/',note:'Daily reference rate, not a bank quote or live trading rate.'},
  inflation: {name:'World Bank',url:'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=ZA',note:'Latest published annual inflation observation, not a current monthly inflation estimate.'}
});
export const PROVINCE_CITIES=Object.freeze({
 'Eastern Cape':{city:'Mthatha',lat:-31.59,lon:28.79},
 'Western Cape':{city:'Cape Town',lat:-33.93,lon:18.42},
 'Gauteng':{city:'Johannesburg',lat:-26.20,lon:28.05},
 'KwaZulu-Natal':{city:'Durban',lat:-29.86,lon:31.02},
 'Limpopo':{city:'Polokwane',lat:-23.90,lon:29.47},
 'Mpumalanga':{city:'Mbombela',lat:-25.47,lon:30.97},
 'North West':{city:'Mahikeng',lat:-25.87,lon:25.64},
 'Northern Cape':{city:'Kimberley',lat:-28.74,lon:24.76},
 'Free State':{city:'Bloemfontein',lat:-29.12,lon:26.22}
});
const CACHE_PREFIX='smartgrowth_external_context_v1_';
const SOURCES=['weather','fx','inflation'];
export function cacheKey(region){return `${CACHE_PREFIX}${region}`;}
export function readLiveCache(region, storage=typeof localStorage==='undefined'?null:localStorage){
 try {const raw=storage?.getItem(cacheKey(region));if(!raw)return null;const saved=JSON.parse(raw);
  if(saved?.region!==region||!saved?.fields||typeof saved.fields!=='object')return null;
  return {...saved,fields:Object.fromEntries(SOURCES.map(k=>[k,saved.fields[k]?.data?{...saved.fields[k],status:'cached'}:{status:'unavailable',data:null}]))};
 }catch(_){return null;}
}
function writeLiveCache(value,storage){
 try {storage?.setItem(cacheKey(value.region),JSON.stringify({region:value.region,updatedAt:value.updatedAt,fields:value.fields}));} catch(_) { /* optional cache */ }
}
export function requestUrls(region){
 const city=PROVINCE_CITIES[region]||PROVINCE_CITIES['Eastern Cape'];
 return {
  weather:`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,precipitation,wind_speed_10m&daily=precipitation_sum,temperature_2m_max&timezone=Africa%2FJohannesburg&forecast_days=3`,
  fx:'https://api.frankfurter.dev/v2/rate/usd/zar',
  inflation:'https://api.worldbank.org/v2/country/ZAF/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20'
 };
}
export function parsePublicData(kind,payload){
 if(kind==='weather'){
  const current=payload?.current, daily=payload?.daily;
  if(!Number.isFinite(current?.temperature_2m)||!Array.isArray(daily?.precipitation_sum))throw Error('Weather data is incomplete');
  const rain=Number(daily.precipitation_sum[0]);
  return {tempC:current.temperature_2m,windKmh:Number(current.wind_speed_10m)||0,rainTodayMm:Number.isFinite(rain)?rain:null,
   forecastDate:daily.time?.[0]||null,observedAt:current.time||null};
 }
 if(kind==='fx'){
  if(payload?.base?.toUpperCase()!=='USD'||payload?.quote?.toUpperCase()!=='ZAR'||!Number.isFinite(payload.rate)||payload.rate<=0)throw Error('Exchange data is incomplete');
  return {rate:payload.rate,date:payload.date||null,pair:'USD/ZAR'};
 }
 if(kind==='inflation'){
  const rows=payload?.[1];if(!Array.isArray(rows))throw Error('Inflation data is incomplete');
  const latest=rows.filter(r=>r&&Number.isFinite(r.value)&&/^\d{4}$/.test(String(r.date))).sort((a,b)=>Number(b.date)-Number(a.date))[0];
  if(!latest)throw Error('No published inflation observation was returned');
  return {percent:latest.value,year:latest.date};
 }
 throw Error('Unknown data source');
}
async function fetchJSON(url,fetcher,timeoutMs){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try {const response=await fetcher(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error(`Service returned HTTP ${response.status}`);return await response.json();
 }finally{clearTimeout(timer);}
}
/** Independently fetch each public feed. A failed source cannot erase previously cached data. */
export async function refreshLiveInsights(region,options={}){
 const fetcher=options.fetcher||fetch;
 const storage=options.storage===undefined?(typeof localStorage==='undefined'?null:localStorage):options.storage;
 const now=options.now||(()=>new Date().toISOString());
 const old=readLiveCache(region,storage);const urls=requestUrls(region);
 const fetchedAt=now(), entries=await Promise.all(SOURCES.map(async kind=>{
  try {
   const data=parsePublicData(kind,await fetchJSON(urls[kind],fetcher,options.timeoutMs||9000));
   return [kind,{status:'live',data,fetchedAt}];
  }catch(e){
   const oldData=old?.fields?.[kind]?.data;
   return [kind,oldData?{...old.fields[kind],status:'cached',message:'Using saved data; online refresh failed.'}:{status:'unavailable',data:null,message:'Could not reach the source.'}];
  }
 }));
 const fields=Object.fromEntries(entries),updatedAt=entries.some(([,f])=>f.status==='live')?fetchedAt:old?.updatedAt||null;
 const result={region,city:(PROVINCE_CITIES[region]||PROVINCE_CITIES['Eastern Cape']).city,updatedAt,fields};
 writeLiveCache(result,storage);return result;
}
export function contextualTips(industry,fields){
 const tips=[];
 const weather=fields?.weather?.data,fx=fields?.fx?.data,inflation=fields?.inflation?.data;
 if(weather && (industry==='Agriculture'||industry==='Construction'||industry==='Transport'||industry==='Catering')){
  if(weather.rainTodayMm!==null&&weather.rainTodayMm>=8)tips.push('Rain is forecast near the provincial reference city. Check local conditions before scheduling outdoor work, produce transport or deliveries.');
  else tips.push('Review the regional weather forecast before planning outside work, delivery routes or stock transport.');
 }
 if(fx&&(industry==='Technology'||industry==='Manufacturing'||industry==='Retail')){
  tips.push('If you buy imported stock, online subscriptions or overseas services, compare your supplier’s quoted exchange rate with the daily USD/ZAR reference rate.');
 }
 if(inflation)tips.push(`South Africa's latest returned annual consumer-price inflation observation is from ${inflation.year}. Review your own current supplier costs before updating prices.`);
 return tips.slice(0,3);
}
