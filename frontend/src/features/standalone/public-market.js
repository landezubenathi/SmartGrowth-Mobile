/** Shared public marketplace. Only minimal listing information is public.
 * Does not expose email, phone number, account UID or financial records in UI.
 */
import {collection,doc,setDoc,deleteDoc,onSnapshot,query,where} from 'firebase/firestore';
import {getCloud} from './cloud-firebase';
import {listingId,listingPayload} from './market-utils.mjs';
export {listingId,listingPayload} from './market-utils.mjs';
export async function publishListing(b,listing,uid){
 const cloud=getCloud();if(!cloud)throw Error('Marketplace account services are unavailable.');
 const payload=listingPayload(b,listing,uid),id=listing.id||listingId();
 await setDoc(doc(cloud.db,'marketplace',id),payload);
 return id;
}
export async function unpublishListing(id,uid){const cloud=getCloud();if(!cloud||!uid)throw Error('Sign in to unpublish.');return deleteDoc(doc(cloud.db,'marketplace',id));}
export function watchPublicListings(onData,onError){const cloud=getCloud();if(!cloud)throw Error('Marketplace account services are unavailable.');
 // Firestore rules require a published-only query (not an unrestricted list).
 return onSnapshot(query(collection(cloud.db,'marketplace'),where('status','==','published')),
 snapshot=>onData(snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,100),snapshot.metadata),onError);
}
