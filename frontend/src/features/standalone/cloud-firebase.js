/** Optional hosted sync: Firebase Auth + Firestore. No FastAPI or local server needed.
 * The Firebase Web config contains public project identifiers, never service-account keys.
 */
import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,setPersistence,browserLocalPersistence,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,onSnapshot,setDoc} from 'firebase/firestore';
const config={
 apiKey:process.env.REACT_APP_FIREBASE_API_KEY,
 authDomain:process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
 projectId:process.env.REACT_APP_FIREBASE_PROJECT_ID,
 appId:process.env.REACT_APP_FIREBASE_APP_ID,
 storageBucket:process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || undefined,
 messagingSenderId:process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || undefined,
 measurementId:process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || undefined
};
// Only the first four properties are required for account sign-in and Firestore.
// Do not require optional Analytics or Storage settings for a functioning offline app.
const required=['apiKey','authDomain','projectId','appId'];
export const firebaseConfigured=required.every(key=>typeof config[key]==='string'&&config[key].length>5&&!config[key].includes('YOUR_'));
export const firebaseProjectName = firebaseConfigured ? config.projectId : null;
let services;
export function getCloud(){
 if(!firebaseConfigured)return null;
 if(services)return services;
 const app=getApps().length?getApp():initializeApp(config);
 const auth=getAuth(app);
 let db;
 try { db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})}); }
 catch(e){if(e.code==='failed-precondition'){throw Error('Firestore is already configured differently; restart the app.');}throw e;}
 services={auth,db};return services;
}
export function observeLogin(onUser){const svc=getCloud();return svc?onAuthStateChanged(svc.auth,onUser):()=>{};}
export async function accountLogin(email,password,register=false){
 const svc=getCloud();if(!svc)throw Error('Cloud sign-in is not configured yet. Set up Firebase first.');
 await setPersistence(svc.auth,browserLocalPersistence);
 return (register?createUserWithEmailAndPassword:signInWithEmailAndPassword)(svc.auth,email.trim(),password);
}
export async function accountLogout(){const svc=getCloud();if(svc)await signOut(svc.auth);}
export async function resetPassword(email){const svc=getCloud();if(!svc)throw Error('Firebase is not configured.');return sendPasswordResetEmail(svc.auth,email.trim());}
export function watchBusinesses(uid,callback,fail){
 const svc=getCloud();if(!svc)throw Error('Firebase is not configured');
 return onSnapshot(collection(svc.db,'users',uid,'businesses'),{includeMetadataChanges:true},snapshot=>{
  callback(snapshot.docs.map(d=>d.data().payload).filter(Boolean),{fromCache:snapshot.metadata.fromCache,hasPendingWrites:snapshot.metadata.hasPendingWrites});
 },fail);
}
export async function uploadBusiness(uid,b){
 const svc=getCloud();if(!svc)throw Error('Firebase is not configured');
 const payload=JSON.parse(JSON.stringify(b));
 if(JSON.stringify(payload).length>700000)throw Error('Business record exceeds the 700 KB sync limit. Export a backup.');
 return setDoc(doc(svc.db,'users',uid,'businesses',b.id),{payload,ownerUid:uid,modifiedAt:b.modifiedAt||b.createdAt||''});
}

// Account-owned fictional registry. Never stores passwords or real CIPC credentials.
export function watchPracticeRegistry(uid,callback,fail){
 const svc=getCloud();if(!svc)throw Error('Firebase is not configured');
 return onSnapshot(collection(svc.db,'users',uid,'simulatedRegistry'),{includeMetadataChanges:true},snapshot=>{
  callback(snapshot.docs.map(d=>d.data()).filter(d=>d.source==='smartgrowth-simulated-registry'),{fromCache:snapshot.metadata.fromCache,hasPendingWrites:snapshot.metadata.hasPendingWrites});
 },fail);
}
export function createPracticeRegistryRecord(uid,record){
 const svc=getCloud();if(!svc)throw Error('Firebase is not configured');
 if(record.ownerUid!==uid||record.businessId?.length>150||record.source!=='smartgrowth-simulated-registry'||record.status!=='practice')throw Error('Invalid simulated registry record');
 return setDoc(doc(svc.db,'users',uid,'simulatedRegistry',record.businessId),record);
}
