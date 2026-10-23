/** Private, account-authorised marketplace enquiries stored in Firestore. */
import {collection,doc,onSnapshot,query,setDoc,updateDoc,where} from 'firebase/firestore';
import {getCloud} from './cloud-firebase';
import {enquiryDocumentId,makeMarketEnquiry} from './market-enquiry-data.mjs';
export {enquiryDocumentId,makeMarketEnquiry} from './market-enquiry-data.mjs';
export async function sendMarketEnquiry(form){
 const cloud=getCloud();if(!cloud?.auth.currentUser)throw Error('Sign in to contact a business.');
 if(cloud.auth.currentUser.uid!==form.uid)throw Error('The signed-in account has changed. Sign in again.');
 const payload=makeMarketEnquiry(form);
 const id=enquiryDocumentId(payload.offerId,payload.senderUid);
 await setDoc(doc(cloud.db,'marketEnquiries',id),payload);
 return id;
}
export function watchReceivedEnquiries(uid,onData,onError){
 const cloud=getCloud();if(!cloud)throw Error('Connect your account to view enquiries.');
 return onSnapshot(query(collection(cloud.db,'marketEnquiries'),where('ownerUid','==',uid)),
   snapshot=>onData(snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))),snapshot.metadata),onError);
}
export function watchSentEnquiries(uid,onData,onError){
 const cloud=getCloud();if(!cloud)throw Error('Connect your account to view sent enquiries.');
 return onSnapshot(query(collection(cloud.db,'marketEnquiries'),where('senderUid','==',uid)),
   snapshot=>onData(snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))),snapshot.metadata),onError);
}
export async function updateMarketEnquiryStatus(enquiry,newStatus,uid){
 if(!enquiry||enquiry.ownerUid!==uid||!['contacted','closed'].includes(newStatus))throw Error('Only the listing owner may update an enquiry.');
 const cloud=getCloud();if(!cloud?.auth.currentUser||cloud.auth.currentUser.uid!==uid)throw Error('Please sign in again.');
 return updateDoc(doc(cloud.db,'marketEnquiries',enquiry.id),{status:newStatus,updatedAt:new Date().toISOString()});
}
