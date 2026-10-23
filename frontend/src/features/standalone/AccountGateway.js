import React,{useState} from 'react';
import {accountLogin,resetPassword,accountLogout} from './cloud-firebase';
import {INDUSTRIES,PROVINCES} from './catalog.mjs';
import {ONBOARDING_STEPS,acceptedNumericEntry} from './onboarding.mjs';
import SmartIcon from './SmartIcon';
import {LOCAL_SAMPLE_PROFILES} from './local-examples.mjs';
import './account-gateway.css';
const fresh={email:'',password:'',businessName:'',structure:'registered_company',industry:'Catering',province:'Eastern Cape',street:'',city:'',postalCode:'',directorName:'',directorId:'',description:'',consentAccepted:false};
export default function AccountGateway({configured=true,loading=false,onRegister,onFinishRegistration}){
 const [draft,setDraft]=useState(fresh);
 const [register,setRegister]=useState(false);
 const [busy,setBusy]=useState(false);
 const [step,setStep]=useState(-1);
 const [completedNumber,setCompletedNumber]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [showSamples,setShowSamples]=useState(false);
 const [numericError,setNumericError]=useState('');
 const change=(field,value)=>setDraft(old=>({...old,[field]:value}));
 const numericField=(field,maxLength,label)=>({
  inputMode:'numeric',
  pattern:field==='postalCode'?'[0-9]{4}':'[0-9]{13}',
  maxLength,
  onChange:e=>{const value=acceptedNumericEntry(e.target.value,maxLength);if(value===null){setNumericError(label+' accepts numbers only ('+maxLength+' digits).');return;}setNumericError('');change(field,value);},
  onBeforeInput:e=>{if(e.data && /[^0-9]/.test(e.data)){e.preventDefault();setNumericError(label+' accepts numbers only.');}},
  onPaste:e=>{const pasted=e.clipboardData.getData('text');const selection=Math.max(0,(e.currentTarget.selectionEnd??0)-(e.currentTarget.selectionStart??0));if(acceptedNumericEntry(pasted,maxLength)===null || pasted.length+draft[field].length-selection>maxLength){e.preventDefault();setNumericError('Paste numbers only, up to '+maxLength+' digits, into '+label+'.');}},
  onDrop:e=>{e.preventDefault();setNumericError('Please type numbers into '+label+'.');},
  onKeyDown:e=>{if(e.key.length===1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();setNumericError(label+' accepts numbers only.');}}
 });
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
    <p>Your business has been added to your SmartGrowth account. You can now sign in with the email and password you created.</p>
    <div className="sg-practice-number"><small>SmartGrowth registration reference · not government-issued</small><strong>{completedNumber}</strong></div>
    <button type="button" className="sd-btn" onClick={async()=>{try{await accountLogout();onFinishRegistration?.();setCompletedNumber('');setStep(-1);setRegister(false);}catch(e){setError(e.message);}}}>Continue to sign in</button>
  </div> : progress ? <section className="sg-register-progress" role="status" aria-live="polite">
    <h1>Preparing your business</h1><p>Setting up your business workspace</p>
    <div className="sg-progress-track"><span style={{width:`${Math.min(100,((step+1)/ONBOARDING_STEPS.length)*100)}%`}}/></div>
    <div className="sg-progress-steps">{ONBOARDING_STEPS.map((s,i)=><div key={s} className={i<step?'done':i===step?'current':''}><SmartIcon name={i<step?'check':'shield'} size={17}/><span>{s}</span></div>)}</div>

  </section> : <>
   <h1>{loading?'Opening your workspace…':register?'Register your business':'Welcome to SmartGrowth'}</h1>
   <p>{register?'Create your account and enter your business information in one guided registration.':'Sign in to access your saved business information, finances and Journey.'}</p>
   {register&&<section className="sg-registration-notice" aria-label="Registration and privacy information"><strong>Before you register</strong><p>SmartGrowth uses your personal and business details to create your account and help you prepare for CIPC, SARS and other business-compliance requirements. We apply privacy and security safeguards guided by South Africa’s Protection of Personal Information Act (POPIA). We will not send your details to government departments unless an authorised process is available and you are informed.</p></section>}
   {loading?<p role="status">Checking your previous sign-in. Previously synced records may remain available offline.</p>:!configured?<div className="sd-error" role="alert">Account services are temporarily unavailable. Please contact the SmartGrowth support team.</div>:<>
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
      <div className="sg-form-two"><label>Town / City<input value={draft.city} required maxLength={90} onChange={e=>change('city',e.target.value)} /></label><label>Postal code<input type="text" autoComplete="postal-code" value={draft.postalCode} required {...numericField('postalCode',4,'Postal code')}/></label></div>
      <div className="sg-form-divider">Owner / director details</div>
      <label>Owner or director's full name<input required maxLength={120} value={draft.directorName} onChange={e=>change('directorName',e.target.value)}/></label>
      <label>South African ID number (format check only)<input required type="password" autoComplete="off" value={draft.directorId} {...numericField('directorId',13,'ID number')}/><small>Your ID number is checked for format only. The full number is not saved in your business profile.</small></label>
      <label>Brief business description<textarea rows={3} maxLength={400} value={draft.description} onChange={e=>change('description',e.target.value)} placeholder="What products or services will you offer?"/></label>
      {numericError&&<p className="sg-field-error" role="alert">{numericError}</p>}
      <label className="sg-consent-line"><input type="checkbox" required checked={draft.consentAccepted} onChange={e=>change('consentAccepted',e.target.checked)}/><span>I understand and consent to SmartGrowth using my information for account creation, business-registration guidance and compliance support as described above.</span></label>
     </>}
     <button className="sd-btn" type="submit" disabled={busy}>{busy?'Processing…':register?'Register business':'Sign in'}</button>
    </form>
    <div className="sg-access-actions"><button type="button" onClick={()=>{setRegister(!register);setError('');setNumericError('');}}>{register?'Already registered? Sign in':'New here? Register your business'}</button>{!register&&<button type="button" onClick={async()=>{setError('');setNotice('');if(!draft.email.trim()){setError('Enter your email first.');return;}try{await resetPassword(draft.email);setNotice('If this account exists, a password reset email will be sent.');}catch(err){setError(err.message);}}}>Forgot password?</button>}</div>
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
  <div className="sg-access-footer"><SmartIcon name="shield" size={16}/><p>Your password is managed by our secure account service and is not stored in your business profile.</p></div>
 </main></div>;
}
