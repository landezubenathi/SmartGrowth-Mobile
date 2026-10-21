import React,{useState} from 'react';
import SmartIcon from './SmartIcon';
import {firebaseConfigured,accountLogin,accountLogout,resetPassword} from './cloud-firebase';
export default function CloudSyncPanel({user,status,workspace}){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [register,setRegister]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const submit=async e=>{
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try {await accountLogin(email,password,register);setPassword('');setMessage('Account opened. Your private workspace will load automatically.');}
  catch(e){setError(e?.message||'Sign-in failed.');}
  finally{setBusy(false);}
 };
 return <section className="sd-panel sd-cloud" aria-label="Cloud account and offline sync">
  <div className="sd-panelhead"><h2><SmartIcon name="cloud" size={20}/> Account & sync</h2><p>Your records are saved locally and sync automatically when your connection returns.</p></div>
  {!firebaseConfigured?<div className="sd-treasury-note" role="status"><b>Cloud sync has not been activated by Four Horsemen Tech.</b><p>The app still works offline with local data. Configure Firebase using <code>docs/FIREBASE_SETUP.md</code>, then rebuild the APK. No local FastAPI server is required.</p></div>:null}
  {firebaseConfigured&&!user?<>
   <p className="sd-muted">Sign in once to keep your business records connected across your devices. You can continue using saved records offline.</p>
   <form className="sd-form" onSubmit={submit}>
    <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input required minLength={6} type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button className="sd-btn" type="submit" disabled={busy}>{busy?'Connecting…':register?'Create my account':'Sign in to my workspace'}</button>
   </form>
   <div className="sd-actions"><button className="sd-btn secondary" onClick={()=>{setRegister(!register);setError('');}}>{register?'I already have an account':'Create account instead'}</button><button className="sd-btn secondary" onClick={async()=>{if(!email.trim()){setError('Enter your email address first.');return;}try{await resetPassword(email);setMessage('If the account exists, a reset email will be sent.');}catch(e){setError(e.message);}}}>Reset password</button></div>
  </>:null}
  {firebaseConfigured&&user?<>
   <div className="sd-cloud-status"><strong>{user.email}</strong><span>{status}</span><small>Changes made while offline are saved and synchronised automatically after reconnection.</small></div>
   <div className="sd-actions"><button className="sd-btn secondary" onClick={async()=>{try{await accountLogout();}catch(e){setError(e.message);}}}>Sign out</button></div>
  </>:null}
  {message&&<div className="sd-notice" role="status">{message}</div>}
  {error&&<div className="sd-error" role="alert">{error}</div>}
  <p className="sd-muted">Use a device screen lock and export backups. An internet connection is required for the first sign-in, but saved data remains accessible afterwards.</p>
 </section>;
}
