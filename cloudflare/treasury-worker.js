/** Optional Cloudflare Worker: zero local servers; browser-safe public Treasury API.
 * Deploy with wrangler after setting ALLOWED_ORIGIN to your hosted app's exact HTTPS origin.
 * The worker never receives entrepreneur information or Firebase credentials.
 */
const UPSTREAM='https://ocds-api.etenders.gov.za/api/OCDSReleases';
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=(env.ALLOWED_ORIGINS||env.ALLOWED_ORIGIN||'').split(',').map(x=>x.trim()).filter(x=>x.startsWith('https://'));
  const accepted=allowed.includes(origin);
  const cors={'Access-Control-Allow-Origin':accepted?origin:(allowed[0]||''),'Vary':'Origin','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept, Content-Type'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')return new Response('GET only',{status:405,headers:cors});
  if(!allowed.length)return new Response('Worker origin is not configured',{status:503});
  if(origin&&!accepted)return new Response('Origin not allowed',{status:403});
  const url=new URL(request.url);
  const from=url.searchParams.get('dateFrom')||'';
  const to=url.searchParams.get('dateTo')||'';
  const page=Number(url.searchParams.get('PageNumber')||'1');
  const dateOK=/^\d{4}-\d{2}-\d{2}$/;
  if(!dateOK.test(from)||!dateOK.test(to)||!Number.isInteger(page)||page<1||page>10||from>to||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||Date.parse(to)-Date.parse(from)>90*86400000)return new Response('Invalid date/page parameters',{status:400,headers:cors});
  const target=new URL(UPSTREAM);target.searchParams.set('dateFrom',from);target.searchParams.set('dateTo',to);target.searchParams.set('PageNumber',String(page));
  try{
   const response=await fetch(target.toString(),{headers:{Accept:'application/json'},cf:{cacheEverything:true,cacheTtl:1800}});
   const raw=await response.text();
   if(raw.length>2500000)return new Response('Official API response too large',{status:502,headers:cors});
   return new Response(raw,{status:response.status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=600'}});
  }catch(_){return new Response(JSON.stringify({error:'Official source temporarily unreachable'}),{status:502,headers:{...cors,'Content-Type':'application/json'}});}
 }
};
