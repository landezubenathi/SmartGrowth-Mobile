/** Account-specific offline cache and deterministic, per-business cloud merge.
 * Nothing from the device-only workspace is copied into a cloud account without opt-in.
 */
import {blankBusiness} from './engine.mjs';
import {validateState} from './storage.mjs';
const USER_PREFIX='smartgrowth_cloud_workspace_v1_';
const validId = value => typeof value==='string' && /^[a-zA-Z0-9_-]{3,150}$/.test(value);
export function userKey(uid){if(!validId(uid))throw Error('Invalid cloud account identifier.');return USER_PREFIX+uid;}
export function emptyCloudState(){
 const b=blankBusiness('My Business (edit profile)','Services','Eastern Cape','');
 return {version:1,activeId:b.id,businesses:[{...b,isPlaceholder:true}],updatedAt:new Date().toISOString()};
}
export function loadCloudState(uid,storage=localStorage){
 try{const raw=storage.getItem(userKey(uid));if(raw)return validateState(JSON.parse(raw));}
 catch(err){console.warn('Could not restore cached cloud workspace',err.message);}
 return emptyCloudState();
}
export function saveCloudState(uid,state,storage=localStorage){
 const next=validateState({...state,updatedAt:new Date().toISOString()});
 try{storage.setItem(userKey(uid),JSON.stringify(next));}catch(_){throw Error('The device has no room to save your account workspace. Export a backup.');}
 return next;
}
const stamp = (b={}) => String(b?.modifiedAt||b?.createdAt||'1970-01-01T00:00:00.000Z');
const asList = x => Array.isArray(x)?x:[];
const mergeEntries=(local=[],remote=[],invoice=false)=>{
 const m=new Map();
 for(const x of [...asList(remote),...asList(local)]){
  if(!x||typeof x.id!=='string')continue;
  const old=m.get(x.id);
  if(!old){m.set(x.id,x);continue;}
  const newer=String(x.updatedAt||x.created_at||x.createdAt||'') >= String(old.updatedAt||old.created_at||old.createdAt||'')?x:old;
  m.set(x.id,invoice&&(x.status==='paid'||old.status==='paid')?{...newer,status:'paid'}:newer);
 }
 return [...m.values()].sort((a,b)=>String(b.created_at||b.createdAt||'').localeCompare(String(a.created_at||a.createdAt||'')));
};
export function mergeBusiness(local,remote){
 if(!local)return remote;
 if(!remote)return local;
 if(local.id!==remote.id)throw Error('Cannot merge unrelated businesses');
 const newer=stamp(local)>=stamp(remote)?local:remote;
 return {...newer,transactions:mergeEntries(local.transactions,remote.transactions),invoices:mergeEntries(local.invoices,remote.invoices,true),listings:mergeEntries(local.listings,remote.listings),reviewedOpportunities:Boolean(local.reviewedOpportunities||remote.reviewedOpportunities),modifiedAt:stamp(local)>=stamp(remote)?stamp(local):stamp(remote)};
}
export function mergeState(local,remoteBusinesses){
 const byId=new Map(local.businesses.map(b=>[b.id,b]));
 const remoteIds=new Set();
 const remoteValid=remoteBusinesses.filter(b=>b&&validId(b.id)&&Array.isArray(b.transactions)&&Array.isArray(b.invoices)&&Array.isArray(b.listings)&&b.documents&&typeof b.documents==='object');
 // A brand-new login initially has an unsaved placeholder, not an extra real company.
 if(remoteValid.length && local.businesses.length===1 && local.businesses[0].isPlaceholder===true && !local.businesses[0].transactions.length && !local.businesses[0].invoices.length){
  byId.delete(local.businesses[0].id);
 }
 for(const incoming of remoteBusinesses){
  if(!incoming||!validId(incoming.id)||!Array.isArray(incoming.transactions)||!Array.isArray(incoming.invoices)||!Array.isArray(incoming.listings)||!incoming.documents||typeof incoming.documents!=='object')continue;
  remoteIds.add(incoming.id);
  byId.set(incoming.id,mergeBusiness(byId.get(incoming.id),incoming));
 }
 const businesses=[...byId.values()].filter(Boolean).slice(0,100);
 const state=validateState({...local,businesses,activeId:byId.has(local.activeId)?local.activeId:businesses[0].id});
 const needUpload=businesses.filter(b=>{
  const r=remoteBusinesses.find(x=>x?.id===b.id);
  if(!r)return true;
  if(stamp(b)>stamp(r))return true;
  // A transaction added offline on an older device must not disappear when profiles merge.
  return ['transactions','invoices','listings'].some(k=>
   asList(b[k]).some(entry=>!asList(r[k]).some(old=>old.id===entry.id&&(k!=='invoices'||old.status===entry.status))));
 });
 return {state,needUpload};
}
export function importDeviceToCloud(cloud,device){
 validateState(device);
 const ids=new Set(cloud.businesses.map(b=>b.id));
 const extra=device.businesses.map(b=>ids.has(b.id)?{...b,id:`copy-${(typeof crypto!=='undefined' && crypto.randomUUID)?crypto.randomUUID():Date.now()}`,modifiedAt:new Date().toISOString()}: {...b,modifiedAt:new Date().toISOString()});
 return validateState({...cloud,businesses:[...cloud.businesses,...extra].slice(0,100)});
}
