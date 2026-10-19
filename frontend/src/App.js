import React, {useCallback, useEffect, useState} from 'react';
import {BrowserRouter, HashRouter, Navigate, Route, Routes, Link, useLocation} from 'react-router-dom';
import {Capacitor} from '@capacitor/core';
import Home from './pages/SmartGrowthHome';
import BusinessJourney from './pages/BusinessJourney';
import GrowthWorkspace from './pages/GrowthWorkspace';
import AccountPage from './pages/AccountPage';
import AuthEntry from './pages/AuthEntry';
import {getSession, saveSession, clearSession, authFetch} from './config/auth';
import './styles/smartgrowth.css';

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
const navigation = [
  {to:'/',icon:'⌂',label:'Home'},
  {to:'/journey',icon:'◇',label:'Journey'},
  {to:'/growth-workspace?tab=bookkeeping',icon:'▤',label:'Money'},
  {to:'/growth-workspace?tab=passport',icon:'◈',label:'Passport'},
  {to:'/account',icon:'♙',label:'Account'},
];

function AppShell({user,onLogout}) {
  const location=useLocation();
  const selected=location.pathname==='/growth-workspace'?new URLSearchParams(location.search).get('tab'):'';
  return <div className="sg-app">
    <header className="sg-header"><div className="sg-topwrap">
      <Link className="sg-brand" to="/"><span className="sg-logo">↗</span><span>Smart<span className="sg-brand-strong">Growth</span><small>by Four Horsemen Tech</small></span></Link>
      <nav className="sg-desktopnav"><Link to="/">Overview</Link><Link to="/journey">My Journey</Link><Link to="/growth-workspace?tab=bookkeeping">Growth Tools</Link><Link to="/growth-workspace?tab=advisor">Advisor</Link><Link to="/account">My Account</Link></nav>
      <div className="sg-topright"><span className="sg-demo-pill">LOCAL PILOT</span><Link className="sg-logout" to="/account">{user.display_name?.split(' ')[0]||'Account'} ↗</Link></div>
    </div></header>
    <Routes>
      <Route path="/" element={<Home user={user}/>}/>
      <Route path="/journey" element={<BusinessJourney user={user}/>}/>
      <Route path="/business-journey" element={<Navigate to="/journey" replace/>}/>
      <Route path="/growth-workspace" element={<GrowthWorkspace user={user}/>}/>
      <Route path="/advisor" element={<Navigate to="/growth-workspace?tab=advisor" replace/>}/>
      <Route path="/profile" element={<Navigate to="/growth-workspace?tab=registration" replace/>}/>
      <Route path="/account" element={<AccountPage user={user} onLogout={onLogout}/>}/>
      <Route path="*" element={<main className="sg-notfound"><h1>Page not found</h1><Link className="sg-action" to="/journey">Go to My Journey →</Link></main>}/>
    </Routes>
    <nav className="sg-bottomnav" aria-label="Mobile main navigation">{navigation.map(item=>{
      const [pathname,query]=item.to.split('?');
      const samePage=pathname===location.pathname;
      const active=query?samePage&&selected===new URLSearchParams(query).get('tab'):samePage;
      return <Link key={item.label} to={item.to} aria-current={active?'page':undefined} className={active?'active':''}><span className="sg-navicon">{item.icon}</span><span>{item.label}</span></Link>;
    })}</nav>
    <footer className="sg-footer">SmartGrowth · Four Horsemen Tech · Local pilot. Registration and payments are not independently verified.</footer>
  </div>;
}

export default function App() {
  const [session,setSession]=useState(getSession);
  const [restoring,setRestoring]=useState(!!getSession());
  const logout=useCallback(async()=>{
    try {if(getSession()) await authFetch('/api/auth/logout',{method:'POST'});} catch (_) { /* local logout always works */ }
    clearSession();setSession(null);
  },[]);
  useEffect(()=>{
    document.title='SmartGrowth — Your Business Journey';
    const expired=()=>{clearSession();setSession(null);setRestoring(false);};
    window.addEventListener('smartgrowth-session-expired',expired);
    return ()=>window.removeEventListener('smartgrowth-session-expired',expired);
  },[]);
  useEffect(()=>{
    const saved=getSession();
    if(!saved){setRestoring(false);return;}
    let live=true;
    authFetch('/api/auth/me',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw Error('Your account session has expired');
      const {account}=await response.json();
      if(live){const next={...saved,account};saveSession(next);setSession(next);}
    }).catch(()=>{if(live){clearSession();setSession(null);}}).finally(()=>{if(live)setRestoring(false);});
    return ()=>{live=false;};
  },[]);
  const signedIn=received=>{saveSession(received);setSession(received);setRestoring(false);};
  if(restoring)return <main className="sg-loading"><span className="sg-logo">↗</span><h2>Opening SmartGrowth…</h2><p>Restoring your account.</p></main>;
  return <Router>{session?.account?<AppShell key={session.account.user_id} user={session.account} onLogout={logout}/>:<AuthEntry onSignedIn={signedIn}/>}</Router>;
}
