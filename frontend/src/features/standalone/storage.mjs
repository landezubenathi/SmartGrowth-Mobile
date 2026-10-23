import {localSampleBusinesses} from './local-examples.mjs';
export const STORE_KEY='smartgrowth_standalone_device_v1';
export function starterState(){
 const businesses=localSampleBusinesses();
 return {version:1,activeId:businesses[0].id,businesses,updatedAt:new Date().toISOString()};
}

export function validateState(value){
 if(!value||value.version!==1||!Array.isArray(value.businesses)||value.businesses.length===0||value.businesses.length>100)throw Error('Unsupported backup format.');
 if(!value.businesses.some(b=>b.id===value.activeId))throw Error('Backup references a missing active business.');
 for(const b of value.businesses){
   if(typeof b.id!=='string'||typeof b.name!=='string'||!Array.isArray(b.transactions)||!Array.isArray(b.invoices)||!Array.isArray(b.listings)||typeof b.documents!=='object'||!b.documents || b.transactions.length>10000 || b.invoices.length>10000)throw Error('The backup contains invalid business records.');
 }
 return value;
}
export function loadState(){
 try {const raw=localStorage.getItem(STORE_KEY);if(raw)return validateState(JSON.parse(raw));} catch(e){console.warn('SmartGrowth backup requires attention:',e.message);}
 const initial=starterState();
 try {localStorage.setItem(STORE_KEY,JSON.stringify(initial));} catch(e){console.warn('Local demo storage not available',e);}
 return initial;
}
export function saveState(value){
 const state=validateState({...value,updatedAt:new Date().toISOString()});
 try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(e){throw Error('Unable to save on this device. Storage may be full or disabled. Export a backup before continuing.');}
 return state;
}
export function exportState(state){
 return JSON.stringify({type:'smartgrowth-standalone-backup',exportedAt:new Date().toISOString(),data:state},null,2);
}
export function parseBackup(text){
 if(text.length>6*1024*1024)throw Error('Backup is too large.');
 const value=JSON.parse(text);
 if(value.type!=='smartgrowth-standalone-backup')throw Error('This is not a SmartGrowth standalone backup.');
 return validateState(value.data);
}
