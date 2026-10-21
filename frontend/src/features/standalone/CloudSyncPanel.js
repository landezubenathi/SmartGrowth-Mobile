import React,{useState} from 'react';
import {firebaseConfigured,accountLogin,accountLogout,resetPassword} from './cloud-firebase';
export default function CloudSyncPanel({user,status,workspace,onImport,onOpenDevice,onOpenCloud,onSignedIn}){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [register,setRegister]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const submit=async e=>{
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try {await accountLogin(email,password,register);setPassword('');setMessage('Account opened. Redirecting to Home…');onSignedIn?.();}
  catch(e){setError(e?.message||'Sign-in failed.');}
  finally{setBusy(false);}
 };
 return <section className="sd-panel sd-cloud" aria-label="Cloud account and offline sync">
  <div className="sd-panelhead"><h2>☁ Cloud account & sync</h2><p>One mobile app. Saved on-device; securely synchronised with your own Firestore account when connected.</p></div>
  {!firebaseConfigured?<div className="sd-treasury-note" role="status"><b>Cloud sync has not been activated by Four Horsemen Tech.</b><p>The app still works offline with local data. Configure Firebase using <code>docs/FIREBASE_SETUP.md</code>, then rebuild the APK. No local FastAPI server is required.</p></div>:null}
  {firebaseConfigured&&!user?<>
   <p className="sd-muted">Sign in online once. On subsequent opens, your saved session and last-synced records are available on this device even without internet.</p>
   <form className="sd-form" onSubmit={submit}>
    <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input required minLength={6} type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button className="sd-btn" type="submit" disabled={busy}>{busy?'Connecting…':register?'Create my account':'Sign in to my workspace'}</button>
   </form>
   <div className="sd-actions"><button className="sd-btn secondary" onClick={()=>{setRegister(!register);setError('');}}>{register?'I already have an account':'Create account instead'}</button><button className="sd-btn secondary" onClick={async()=>{if(!email.trim()){setError('Enter your email address first.');return;}try{await resetPassword(email);setMessage('If the account exists, a reset email will be sent.');}catch(e){setError(e.message);}}}>Reset password</button></div>
  </>:null}
  {firebaseConfigured&&user?<>
   <div className="sd-cloud-status"><strong>Signed in as {user.email}</strong><span>{status}</span><small>{workspace==='cloud'?'Your account records are separate from device demo data.':'You are browsing the device-only workspace.'}</small></div>
   <div className="sd-actions">{workspace==='cloud'?<button className="sd-btn secondary" onClick={onImport}>Copy device businesses to cloud</button>:<button className="sd-btn" onClick={onOpenCloud}>Open my cloud workspace</button>}{workspace==='cloud'&&<button className="sd-btn secondary" onClick={onOpenDevice}>Use device-only workspace</button>}<button className="sd-btn secondary" onClick={async()=>{try{await accountLogout();}catch(e){setError(e.message);}}}>Sign out</button></div>
   <p className="sd-muted">Import is optional. Two devices changing the same business simultaneously can cause conflicts; records are merged by their IDs, while the latest business profile wins. Avoid simultaneous offline edits to the same invoice.</p>
  </>:null}
  {message&&<div className="sd-notice" role="status">{message}</div>}
  {error&&<div className="sd-error" role="alert">{error}</div>}
  <p className="sd-muted">Local records are not encrypted within this app. Use a device screen lock and export backups. Do not store real customer banking secrets. Cloud accounts require a Firebase project, Firestore rules and internet for the first sign-in.</p>
 </section>;
}
