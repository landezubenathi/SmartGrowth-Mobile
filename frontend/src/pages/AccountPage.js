import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { credentialsRequest } from '../config/auth';
import { getApiBase } from '../config/api';

export default function AccountPage({user,onLogout}) {
  const [form,setForm] = useState({current_password:'',new_password:'',repeat:''});
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const change=async(e)=>{
    e.preventDefault();setError('');setSuccess('');
    if(form.new_password!==form.repeat) {setError('Your new passwords do not match.');return;}
    setBusy(true);
    try {
      await credentialsRequest('change-password',{current_password:form.current_password,new_password:form.new_password});
      setSuccess('Password changed. Your other sessions have been revoked. Please sign in again.');
      setForm({current_password:'',new_password:'',repeat:''});
      await onLogout();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <main className="sg-main sg-account-page">
    <span className="sg-mini">YOUR ACCOUNT</span><h1>Account & security</h1>
    <p className="sg-subtitle">Your business records are connected to your signed-in account.</p>
    <div className="sg-account-grid">
      <section className="sg-account-card">
        <div className="sg-avatar">{(user.display_name||'S').slice(0,1).toUpperCase()}</div>
        <h2>{user.display_name}</h2><p>{user.email}</p>
        <div className="sg-detail"><span>Account ID</span><code>{user.user_id}</code></div>
        <div className="sg-detail"><span>Connection</span><small>{getApiBase()}</small></div>
        <div className="sg-account-actions"><Link className="sg-account-secondary" to="/journey">Connection settings</Link><button type="button" className="sg-account-danger" onClick={onLogout}>Sign out</button></div>
      </section>
      <section className="sg-account-card">
        <h2>Change password</h2><p>Use a unique password of at least 10 characters.</p>
        <form className="sg-auth-form" onSubmit={change}>
          <label>Current password<input type="password" autoComplete="current-password" required value={form.current_password} onChange={e=>setForm({...form,current_password:e.target.value})}/></label>
          <label>New password<input type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={form.new_password} onChange={e=>setForm({...form,new_password:e.target.value})}/></label>
          <label>Repeat new password<input type="password" autoComplete="new-password" minLength={10} required value={form.repeat} onChange={e=>setForm({...form,repeat:e.target.value})}/></label>
          {error&&<p className="sg-auth-error" role="alert">{error}</p>}
          {success&&<p className="sg-auth-success">{success}</p>}
          <button className="sg-auth-submit" disabled={busy}>{busy?'Updating…':'Update password'}</button>
        </form>
      </section>
    </div>
    <p className="sg-disclaimer">This is a local hackathon pilot. Please do not upload real customer financial information until the service has been securely hosted and reviewed for compliance.</p>
  </main>;
}
