import React,{useState} from 'react';
import {accountLogin,resetPassword} from './cloud-firebase';
import SmartIcon from './SmartIcon';
import './account-gateway.css';
export default function AccountGateway({configured=true,loading=false}){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [register,setRegister]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 async function submit(e){e.preventDefault();setBusy(true);setError('');setNotice('');try{
  await accountLogin(email,password,register);setPassword('');
 }catch(err){setError(err.code==='auth/email-already-in-use'?'This email already has an account. Select Sign in.':err.code==='auth/invalid-credential'?'Incorrect email or password. Check your details.':err.message||'Unable to sign in.');}finally{setBusy(false);}}
 return <div className="sg-access-wrap">
  <main className="sg-access-card">
   <div className="sg-access-brand"><span><SmartIcon name="journey" size={28}/></span><div><strong>SmartGrowth</strong><small>Your Business Journey</small></div></div>
   <h1>{loading?'Opening your workspace…':register?'Create your SmartGrowth account':'Welcome to SmartGrowth'}</h1>
   <p>One place to manage your business, track progress and explore opportunities.</p>
   {loading?<p role="status">Checking your saved sign-in. Previously synced records remain available offline.</p>:!configured?<div className="sd-error" role="alert">Firebase is not configured in this build. Ask your administrator to include the SmartGrowthMobile project settings and rebuild.</div>:<>
    <form className="sd-form" onSubmit={submit}>
     <label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></label>
     <label>SmartGrowth password<input type="password" required minLength={6} autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your SmartGrowth password" /></label>
     <button className="sd-btn" type="submit" disabled={busy}>{busy?'Connecting…':register?'Create account':'Sign in'}</button>
    </form>
    <div className="sg-access-actions"><button onClick={()=>{setRegister(!register);setError('');}}>{register?'I already have an account':'New here? Create an account'}</button><button onClick={async()=>{setError('');setNotice('');if(!email.trim()){setError('Enter your email first.');return;}try{await resetPassword(email);setNotice('If that account exists, a password reset email will be sent.');}catch(err){setError(err.message);}}}>Forgot password?</button></div>
    {error&&<div className="sd-error" role="alert">{error}</div>}{notice&&<div className="sd-notice" role="status">{notice}</div>}
   </>}
   <div className="sg-access-footer"><SmartIcon name="shield" size={16}/><p>Use your <b>SmartGrowth</b> password, not a CIPC or BizPortal password. Registration inside SmartGrowth is a practice workflow and does not submit information to government.</p></div>
  </main>
 </div>;
}
