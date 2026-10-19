import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Home from './pages/SmartGrowthHome';
import BusinessJourney from './pages/BusinessJourney';
import GrowthWorkspace from './pages/GrowthWorkspace';
import './styles/smartgrowth.css';

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
const demoUser = {username:'demo', displayName:'Entrepreneur'};
const navigation = [
  {to:'/', icon:'⌂', label:'Home'},
  {to:'/journey',icon:'◇',label:'Journey'},
  {to:'/growth-workspace?tab=bookkeeping',icon:'▤',label:'Money'},
  {to:'/growth-workspace?tab=passport',icon:'◈',label:'Passport'},
  {to:'/growth-workspace?tab=advisor',icon:'✦',label:'Advisor'},
];

function AppShell({user,onLogout}) {
  const location=useLocation();
  const selected = location.pathname === '/growth-workspace'
    ? new URLSearchParams(location.search).get('tab')
    : '';
  return <div className="sg-app">
    <header className="sg-header"><div className="sg-topwrap">
      <Link className="sg-brand" to="/" aria-label="SmartGrowth home"><span className="sg-logo">↗</span><span>Smart<span className="sg-brand-strong">Growth</span><small>by Four Horsemen Tech</small></span></Link>
      <nav className="sg-desktopnav" aria-label="Main navigation"><Link to="/">Overview</Link><Link to="/journey">My Journey</Link><Link to="/growth-workspace?tab=bookkeeping">Growth Tools</Link><Link to="/growth-workspace?tab=advisor">Advisor</Link></nav>
      <div className="sg-topright"><span className="sg-demo-pill">DEMO</span><button type="button" className="sg-logout" onClick={onLogout}>Exit demo</button></div>
    </div></header>
    <Routes>
      <Route path="/" element={<Home user={user} />} />
      <Route path="/journey" element={<BusinessJourney user={user} />} />
      <Route path="/business-journey" element={<Navigate to="/journey" replace/>}/>
      <Route path="/growth-workspace" element={<GrowthWorkspace user={user} />} />
      <Route path="/advisor" element={<Navigate to="/growth-workspace?tab=advisor" replace/>}/>
      <Route path="/profile" element={<Navigate to="/growth-workspace?tab=registration" replace/>}/>
      <Route path="*" element={<main className="sg-notfound"><h1>That page isn't in SmartGrowth</h1><p>The former SmartFund platform is separate from this business-growth app.</p><Link className="sg-action" to="/journey">Go to My Journey →</Link></main>}/>
    </Routes>
    <nav className="sg-bottomnav" aria-label="Mobile main navigation">{navigation.map(item=>{
      const [pathname,query] = item.to.split('?');
      const samePage = pathname===location.pathname;
      const active = query ? samePage && selected===new URLSearchParams(query).get('tab') : samePage;
      return <Link key={item.label} to={item.to} aria-current={active?'page':undefined} className={active?'active':''}><span className="sg-navicon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>;
    })}</nav>
    <footer className="sg-footer">SmartGrowth · Four Horsemen Tech · Hackathon demo. Self-reported information; no real money transfers, registrations or verified opportunities.</footer>
  </div>;
}
function DemoEntry({onEnter}) {
  return <div className="sg-welcome-wrap"><div className="sg-welcome-art"><div className="sg-welcome-brand"><span className="sg-logo">↗</span>SmartGrowth</div><div className="sg-welcome-kicker">FOUR HORSEMEN TECH PRESENTS</div><h1>Build your business.<br/><em>One step at a time.</em></h1><p>Your guided companion for keeping records, improving readiness, discovering customers and making your next move.</p><div className="sg-welcome-path"><span>01 · Start</span><span>02 · Manage</span><span>03 · Grow</span></div></div>
  <div className="sg-welcome-card"><div className="sg-welcome-illustration">✦</div><span className="sg-chip">Mobile-first · Android · iOS · Web</span><h2>Welcome to your growth journey</h2><p>Explore the working entrepreneur demo using fictional or test records.</p><button type="button" className="sg-action sg-enter" onClick={onEnter}>Explore SmartGrowth <span>→</span></button><p className="sg-safe">No account or password required in this local demo. All sessions use one shared <code>demo</code> workspace; do not enter sensitive information.</p></div></div>;
}
export default function App(){
  const [loggedIn,setLoggedIn]=useState(()=>{try{return localStorage.getItem('smartgrowth_demo_session')==='1';}catch{return false;}});
  useEffect(()=>{document.title='SmartGrowth — Your Business Journey';},[]);
  const enter=()=>{try{localStorage.setItem('smartgrowth_demo_session','1');}catch{} setLoggedIn(true);};
  const leave=()=>{try{localStorage.removeItem('smartgrowth_demo_session');}catch{} setLoggedIn(false);};
  return <Router>{loggedIn?<AppShell user={demoUser} onLogout={leave}/>:<DemoEntry onEnter={enter}/>}</Router>;
}
