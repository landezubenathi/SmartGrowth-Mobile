import React, {useState} from 'react';
import {credentialsRequest} from '../config/auth';
import {getApiBase, saveApiBase} from '../config/api';

export default function AuthEntry({onSignedIn,onStandaloneStart}) {
  const [mode,setMode] = useState('login');
  const [form,setForm] = useState({display_name:'',email:'',password:'',confirm:''});
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [server,setServer] = useState(getApiBase);
  const [editServer,setEditServer] = useState(false);
  const submit = async(event)=>{
    event.preventDefault();setError('');
    if(mode==='register'&&form.confirm!==form.password){setError('Passwords do not match.');return;}
    setBusy(true);
    try {
      const request = mode==='register'?{display_name:form.display_name,email:form.email,password:form.password}:{email:form.email,password:form.password};
      const result = await credentialsRequest(mode,request);
      onSignedIn(result);
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  const switchMode = (value)=>{setMode(value);setError('');setForm(v=>({...v,password:'',confirm:''}));};
  return <main className="sg-welcome-wrap sg-auth-screen">
    <section className="sg-welcome-art">
      <div className="sg-welcome-brand"><span className="sg-logo">↗</span>SmartGrowth</div>
      <div className="sg-welcome-kicker">FOUR HORSEMEN TECH PRESENTS</div>
      <h1>Every business<br/><em>has a journey.</em></h1>
      <p>Start your business, manage sales and expenses, build your Growth Passport and discover your next step—all in one place.</p>
      <div className="sg-welcome-path"><span>01 · Start</span><span>02 · Manage</span><span>03 · Grow</span></div>
    </section>
    <section className="sg-welcome-card sg-auth-card">
      <span className="sg-chip">Standalone Android · iOS · Web</span>
      <div className="sg-offline-callout"><strong>Run SmartGrowth without a server</strong><p>Start immediately with example businesses, or create your own. Bookkeeping, invoices, Passport, Journey and fraud screening run on this device—even without Wi-Fi.</p><button className="sg-offline-start" type="button" onClick={onStandaloneStart}>Open SmartGrowth offline →</button><small>This on-device workspace stays available offline on the same installed app. It is not password-protected or synced to your online account.</small></div>
      <details className="sg-account-disclosure"><summary>Use an online account instead (requires a hosted backend)</summary>
      <div className="sg-online-separator">OPTIONAL · ACCOUNT-BASED MODE</div>
      <h2>{mode==='register'?'Create your account':'Welcome back'}</h2>
      <p>{mode==='register'?'Create a separate workspace for your business.':'Sign in to continue your business journey.'}</p>
      <form onSubmit={submit} className="sg-auth-form">
        {mode==='register'&&<label>Your name<input type="text" required autoComplete="name" maxLength={70} minLength={2} placeholder="e.g. Thando M" value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})}/></label>}
        <label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label>Password<input type="password" required autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?10:undefined} maxLength={128} placeholder={mode==='register'?'At least 10 characters':'Your password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
        {mode==='register'&&<label>Confirm password<input type="password" required autoComplete="new-password" minLength={10} placeholder="Repeat password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/></label>}
        {error&&<div className="sg-auth-error" role="alert">{error}</div>}
        <button className="sg-auth-submit" disabled={busy}>{busy?'Please wait…':mode==='register'?'Create account →':'Sign in →'}</button>
      </form>
      <p className="sg-auth-switch">{mode==='login'?'New to SmartGrowth?':'Already have an account?'} <button type="button" onClick={()=>switchMode(mode==='login'?'register':'login')}>{mode==='login'?'Create an account':'Sign in'}</button></p>
      <div className="sg-server-settings">
        <button type="button" onClick={()=>setEditServer(!editServer)}>⚙ {editServer?'Hide':'Backend connection'} settings</button>
        {editServer&&<form onSubmit={e=>{e.preventDefault();try{saveApiBase(server);setEditServer(false);setError('');}catch(err){setError(err.message);}}}><input aria-label="Backend URL" value={server} onChange={e=>setServer(e.target.value)} placeholder="http://localhost:8000"/><button type="submit">Save server</button></form>}
      </div>
      <p className="sg-safe">Online account records are separate from the on-device demo. A server is required and the two modes do not automatically sync. Firebase is not configured in this package.</p>
      </details>
    </section>
  </main>;
}
