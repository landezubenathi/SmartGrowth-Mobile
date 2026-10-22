/** Practice-only registry. NOT CIPC, BizPortal or a government register.
 * Password authentication belongs to Firebase Auth, never these records.
 */
import {blankBusiness} from './engine.mjs';
const safeText=(s,max=90)=>String(s||'').trim().replace(/\s+/g,' ').slice(0,max);
const ID=/^[A-Za-z0-9_-]{3,150}$/;
export const PRACTICE_SOURCE='smartgrowth-simulated-registry';
export const REGISTRY_NOTICE='SmartGrowth practice registration only. This does not register a company with CIPC.';
export function practiceRegistrationNumber(year=new Date().getFullYear(),digits){
 const yr=Number(year);
 if(!Number.isInteger(yr)||yr<2000||yr>2100)throw Error('Invalid registration year.');
 let code=digits;
 if(code===undefined){
   const bytes=new Uint32Array(1);
   if(typeof crypto==='undefined'||!crypto.getRandomValues)throw Error('Secure device randomness is unavailable.');
   crypto.getRandomValues(bytes);code=100000+(bytes[0]%900000);
 }
 if(!Number.isInteger(code)||code<100000||code>999999)throw Error('Invalid practice reference.');
 return `${yr}/${code}/07`;
}
export function validateRegistrationInput(input){
 const name=safeText(input?.name),industry=safeText(input?.industry,80),region=safeText(input?.region,80);
 if(name.length<3)throw Error('Enter a business name of at least 3 characters.');
 if(!industry)throw Error('Select your business type.');
 if(!region)throw Error('Select your province.');
 return {name,industry,region,description:safeText(input?.description,400)};
}
export function registrationFromBusiness(b,ownerUid,email){
 if(!ID.test(String(ownerUid||'')))throw Error('Sign in before registering a business.');
 if(!ID.test(String(b?.id||'')))throw Error('Invalid business identifier.');
 const d=validateRegistrationInput(b);
 const registrationNumber=String(b?.compliance?.cipcNumber||'');
 if(!/^\d{4}\/\d{6}\/07$/.test(registrationNumber))throw Error('Practice registration number missing or invalid.');
 return {ownerUid,businessId:b.id,email:safeText(email,320).toLowerCase(),businessName:d.name,industry:d.industry,province:d.region,registrationNumber,source:PRACTICE_SOURCE,status:'practice',createdAt:b.createdAt||new Date().toISOString(),modifiedAt:b.modifiedAt||new Date().toISOString()};
}
export function businessFromRegistration(record){
 if(record?.source!==PRACTICE_SOURCE||record?.status!=='practice'||!ID.test(record?.businessId)||!/^\d{4}\/\d{6}\/07$/.test(record?.registrationNumber||''))throw Error('Unrecognised simulated registry record.');
 const d=validateRegistrationInput({name:record.businessName,industry:record.industry,region:record.province});
 const b=blankBusiness(d.name,d.industry,d.region,'');
 return {...b,id:record.businessId,registrySource:PRACTICE_SOURCE,registryId:record.businessId,registryStatus:'practice',compliance:{...b.compliance,structure:'registered_company',cipcNumber:record.registrationNumber,checks:{}},modifiedAt:record.modifiedAt||record.createdAt||new Date().toISOString()};
}
/** Import only previously absent registry records; never erase existing transactions. */
export function attachRegisteredBusinesses(state,registry){
 if(!Array.isArray(registry)||!registry.length)return {state,added:[]};
 const list=[...(state.businesses||[])],added=[];
 for(const record of registry){
  let b;try{b=businessFromRegistration(record);}catch(_){continue;}
  const existing=list.find(x=>x.id===b.id||(
    String(x.compliance?.cipcNumber||'')===record.registrationNumber &&
    String(x.name||'').trim().toLowerCase()===record.businessName.trim().toLowerCase()));
  if(existing){if(!existing.registryId){const idx=list.indexOf(existing);list[idx]={...existing,registryId:record.businessId,registrySource:PRACTICE_SOURCE,registryStatus:'practice'};}continue;}
  list.push(b);added.push(b);
 }
 if(!added.length)return {state: {...state,businesses:list},added};
 const withoutBlank=list.filter(x=>!(x.isPlaceholder===true && !x.transactions?.length && !x.invoices?.length && !x.listings?.length));
 const businesses=withoutBlank.slice(0,100);
 return {state:{...state,businesses,activeId:state.businesses?.some(x=>x.id===state.activeId&&!x.isPlaceholder)?state.activeId:added[0].id},added};
}
