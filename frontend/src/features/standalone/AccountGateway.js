import React,{useState} from 'react';
import {accountLogin,resetPassword,accountLogout} from './cloud-firebase';
import {INDUSTRIES,PROVINCES} from './catalog.mjs';
import {ONBOARDING_STEPS} from './onboarding.mjs';
import SmartIcon from './SmartIcon';
import {LOCAL_SAMPLE_PROFILES} from './local-examples.mjs';
import './account-gateway.css';
const fresh={email:'',password:'',businessName:'',structure:'registered_company',industry:'Catering',province:'Eastern Cape',street:'',city:'',postalCode:'',directorName:'',directorId:'',description:''};
export default function AccountGateway({configured=true,loading=false,onRegister,onFinishRegistration}){
 const [draft,setDraft]=useState(fresh);
 const [register,setRegister]=useState(false);
 const [busy,setBusy]=useState(false);
 const [step,setStep]=useState(-1);
 const [completedNumber,setCompletedNumber]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [showSamples,setShowSamples]=useState(false);
 const change=(field,value)=>setDraft(old=>({...old,[field]:value}));
 async function submit(e){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   if(register){
    if(!onRegister)throw Error('Registration is currently unavailable.');
    const b=await onRegister(draft,index=>setStep(index));
    setCompletedNumber(b.compliance.cipcNumber);
    setDraft(old=>({...old,password:'',directorId:''}));
   }else{
    await accountLogin(draft.email,draft.password,false);
    setDraft(old=>({...old,password:'',directorId:''}));
   }
  }catch(err){
   setStep(-1);
   setError(err.code==='auth/email-already-in-use'?'That email is already registered. Select Sign in.':err.code==='auth/invalid-credential'?'Incorrect email or password. Check your details.':err.message||'Unable to proceed.');
  }finally{setBusy(false);}
 }
 const progress=step>=0;
 return <div className="sg-access-wrap"><main className="sg-access-card sg-register-card">
  <div className="sg-access-brand"><span><SmartIcon name="journey" size={28}/></span><div><strong>SmartGrowth</strong><small>Your Business Journey</small></div></div>
  {completedNumber ? <div className="sg-finish" role="status">
    <SmartIcon name="check" size={44}/><h1>Registration complete</h1>
    <p>Your business has been added to the SmartGrowth practice registry. You can now sign in with the email and password you created.</p>
    <div className="sg-practice-number"><small>Your SmartGrowth practice registration reference</small><strong>{completedNumber}</strong></div>
    <p className="sg-cipc-disclaimer">This is not a CIPC registration number. No submission has been made to CIPC or BizPortal.</p>
    <button type="button" className="sd-btn" onClick={async()=>{try{await accountLogout();onFinishRegistration?.();setCompletedNumber('');setStep(-1);setRegister(false);}catch(e){setError(e.message);}}}>Continue to sign in</button>
  </div> : progress ? <section className="sg-register-progress" role="status" aria-live="polite">
    <h1>Preparing your business</h1><p>SmartGrowth registration simulation</p>
    <div className="sg-progress-track"><span style={{width:`${Math.min(100,((step+1)/ONBOARDING_STEPS.length)*100)}%`}}/></div>
    <div className="sg-progress-steps">{ONBOARDING_STEPS.map((s,i)=><div key={s} className={i<step?'done':i===step?'current':''}><SmartIcon name={i<step?'check':'shield'} size={17}/><span>{s}</span></div>)}</div>
    <p className="sg-cipc-disclaimer">The steps above simulate a possible CIPC-connected journey. No government API or identity-verification service is contacted.</p>
  </section> : <>
   <h1>{loading?'Opening your workspace…':register?'Register your business':'Welcome to SmartGrowth'}</h1>
   <p>{register?'Create your account and enter your business information in one guided registration.':'Sign in to access your saved business information, finances and Journey.'}</p>
   {loading?<p role="status">Checking your previous sign-in. Previously synced records may remain available offline.</p>:!configured?<div className="sd-error" role="alert">Firebase is not configured in this build. Ask the administrator to check the Firebase settings and rebuild.</div>:<>
    <form className="sd-form" onSubmit={submit}>
     <label>Email address<input type="email" required autoComplete="email" value={draft.email} onChange={e=>change('email',e.target.value)} placeholder="you@example.com"/></label>
     <label>SmartGrowth password<input type="password" required minLength={register?8:6} autoComplete={register?'new-password':'current-password'} value={draft.password} onChange={e=>change('password',e.target.value)} placeholder={register?'Create a password (8+ characters)':'Your SmartGrowth password'}/></label>
     {register&&<>
      <div className="sg-form-divider">Business information</div>
      <label>Proposed business name<input value={draft.businessName} required maxLength={90} onChange={e=>change('businessName',e.target.value)} placeholder="Your business name"/></label>
      <label>Business structure<select value={draft.structure} onChange={e=>change('structure',e.target.value)}><option value="registered_company">Private company</option><option value="sole_proprietor">Sole proprietor</option><option value="partnership">Partnership</option><option value="cooperative">Co-operative</option><option value="nonprofit">Non-profit organisation</option></select></label>
      <label>Business type / industry<select value={draft.industry} onChange={e=>change('industry',e.target.value)}>{INDUSTRIES.map(x=><option key={x.id} value={x.id}>{x.id}</option>)}</select></label>
      <label>Province<select value={draft.province} onChange={e=>change('province',e.target.value)}>{PROVINCES.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      <label>Street / business address<input value={draft.street} required maxLength={160} onChange={e=>change('street',e.target.value)} placeholder="Street and area"/></label>
      <div className="sg-form-two"><label>Town / City<input value={draft.city} required maxLength={90} onChange={e=>change('city',e.target.value)} /></label><label>Postal code<input value={draft.postalCode} required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} onChange={e=>change('postalCode',e.target.value)}/></label></div>
      <div className="sg-form-divider">Owner / director details</div>
      <label>Owner or director's full name<input required maxLength={120} value={draft.directorName} onChange={e=>change('directorName',e.target.value)}/></label>
      <label>South African ID number (format check only)<input required type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{13}" maxLength={13} value={draft.directorId} onChange={e=>change('directorId',e.target.value)}/><small>We check its format locally. The full ID is not saved to Firestore, the registry or your business records.</small></label>
      <label>Brief business description<textarea rows={3} maxLength={400} value={draft.description} onChange={e=>change('description',e.target.value)} placeholder="What products or services will you offer?"/></label>
      <div className="sg-cipc-disclaimer">This creates a SmartGrowth practice registration, not a legal CIPC registration. Do not enter a real BizPortal password.</div>
     </>}
     <button className="sd-btn" type="submit" disabled={busy}>{busy?'Processing…':register?'Register business':'Sign in'}</button>
    </form>
    <div className="sg-access-actions"><button type="button" onClick={()=>{setRegister(!register);setError('');}}>{register?'Already registered? Sign in':'New here? Register your business'}</button>{!register&&<button type="button" onClick={async()=>{setError('');setNotice('');if(!draft.email.trim()){setError('Enter your email first.');return;}try{await resetPassword(draft.email);setNotice('If this account exists, a password reset email will be sent.');}catch(err){setError(err.message);}}}>Forgot password?</button>}</div>
    {!register&&<section className="sg-local-examples" aria-label="Local practice profiles">
     <button type="button" className="sg-local-toggle" aria-expanded={showSamples} onClick={()=>setShowSamples(x=>!x)}>
      {showSamples?'Hide':'View'} three local example business profiles <SmartIcon name="business" size={16}/>
     </button>
     {showSamples&&<div className="sg-local-list">
      <p>These fictional profiles demonstrate the information collected during registration. They are read-only, stored in this app and cannot be used to sign in or claim CIPC registration.</p>
      {LOCAL_SAMPLE_PROFILES.map(profile=><article key={profile.id} className="sg-local-card">
       <h3>{profile.name}</h3>
       <dl>
        <div><dt>Type</dt><dd>{profile.structure.replaceAll('_',' ')} · {profile.industry}</dd></div>
        <div><dt>Owner / director</dt><dd>{profile.owner}</dd></div>
        <div><dt>Business address</dt><dd>{profile.address.street}, {profile.address.city}, {profile.address.province} {profile.address.postalCode}</dd></div>
        <div><dt>Practice reference</dt><dd>{profile.practiceReference}</dd></div>
        <div><dt>Description</dt><dd>{profile.description}</dd></div>
       </dl>
      </article>)}
     </div>}
    </section>}
   </>}
  </>}
  {error&&<div className="sd-error" role="alert">{error}</div>}{notice&&<div className="sd-notice" role="status">{notice}</div>}
  <div className="sg-access-footer"><SmartIcon name="shield" size={16}/><p>SmartGrowth uses Firebase Authentication. Your password is not stored in the business registry or shared with CIPC.</p></div>
 </main></div>;
}
