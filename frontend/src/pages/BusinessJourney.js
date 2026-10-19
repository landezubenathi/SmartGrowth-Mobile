import { authFetch } from '../config/auth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiBase, saveApiBase } from '../config/api';
import './BusinessJourney.css';

const goalOptions = [
  { id: 'start', icon: '🚀', label: 'Start my business', help: 'Create a credible business profile and check documents', tasks: ['business_profile', 'registration_doc', 'tax_doc', 'bank_doc'], route: '/growth-workspace?tab=registration' },
  { id: 'money', icon: '📒', label: 'Manage my money', help: 'Record income, invoices and costs', tasks: ['first_sale', 'first_invoice', 'cash_surplus', 'follow_up_invoices'], route: '/growth-workspace?tab=bookkeeping' },
  { id: 'ready', icon: '🛡️', label: 'Get business-ready', help: 'Complete readiness steps and protect your business', tasks: ['business_profile', 'registration_doc', 'tax_doc', 'fraud_safety'], route: '/growth-workspace?tab=passport' },
  { id: 'growth', icon: '📈', label: 'Grow my business', help: 'Explore customers and suitable opportunities', tasks: ['market_listing', 'review_procurement', 'first_invoice'], route: '/growth-workspace?tab=market' },
];
const taskIcons = { business_profile: '🏢', registration_doc: '📋', tax_doc: '🧾', bank_doc: '🏦', first_sale: '💵', first_invoice: '💳', cash_surplus: '📊', follow_up_invoices: '⏰', fraud_safety: '🛡️', market_listing: '🏪', review_procurement: '📦' };
const fmt = amount => `R ${Number(amount || 0).toLocaleString('en-ZA', {maximumFractionDigits: 0})}`;
function labelForError(error, apiUrl) {
  if (error?.status === 404) return 'The connected backend is missing the Phase 3 Advisor route. Start the backend from this Phase 4 project.';
  return `Could not reach the SmartGrowth API at ${apiUrl}. If using a phone, enter a reachable backend address below.`;
}

export default function BusinessJourney({ user }) {
  const username = user?.username || user?.email || 'demo';
  const navigate = useNavigate();
  const [goalId, setGoalId] = useState(() => window.localStorage.getItem('smartgrowth_journey_goal_'+username) || 'start');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState(getApiBase);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(getApiBase);
  const [connecting, setConnecting] = useState(false);
  const goal = useMemo(() => goalOptions.find(item => item.id === goalId) || goalOptions[0], [goalId]);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    const url = getApiBase(); setApiUrl(url);
    try {
      const response = await authFetch(`/api/growth/advisor/${encodeURIComponent(username)}`, { cache: 'no-store' });
      if (!response.ok) { const err = new Error(`HTTP ${response.status}`); err.status = response.status; throw err; }
      const json = await response.json();
      if (!json.plan || !Array.isArray(json.plan.tasks)) throw new Error('Invalid Advisor response');
      setData(json);
    } catch (e) { setError(labelForError(e, url)); setData(null); }
    finally { setLoading(false); }
  }, [username]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const handler = () => refresh(); window.addEventListener('focus', handler); return () => window.removeEventListener('focus', handler); }, [refresh]);
  function chooseGoal(id) { setGoalId(id); window.localStorage.setItem('smartgrowth_journey_goal_'+username, id); }
  const tasks = useMemo(() => goal.tasks.map(id => data?.plan?.tasks?.find(task => task.id === id)).filter(Boolean), [goal, data]);
  const done = tasks.filter(task => task.completed).length;
  const percentage = tasks.length ? Math.round(100 * done / tasks.length) : 0;
  const next = tasks.find(task => !task.completed);
  async function saveConnection(event) {
    event.preventDefault(); setConnecting(true);
    try {
      const url = saveApiBase(draftUrl);
      setApiUrl(url); setSettingsOpen(false);
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setConnecting(false); }
  }

  return <main className="mobile-journey">
    <header className="journey-hero">
      <div className="journey-eyebrow">FOUR HORSEMEN TECH · SMARTGROWTH</div>
      <div className="journey-hero-row"><div><h1>Your business journey</h1><p>One goal. Clear steps. Real progress from the records you create.</p></div><div className="journey-hero-mark" aria-hidden="true">✦</div></div>
      <div className="journey-actions"><button type="button" onClick={refresh} disabled={loading}>↻ {loading ? 'Updating…' : 'Refresh progress'}</button><button type="button" onClick={() => { setDraftUrl(getApiBase()); setSettingsOpen(v => !v); }}>⚙ Backend settings</button></div>
      <div className="journey-demo">Demo data · Readiness is not an official business certification</div>
    </header>

    {settingsOpen && <section className="journey-card journey-settings" aria-label="Backend connection settings">
      <h2>Connect your mobile app</h2><p>Use an HTTPS API address for a hosted app. For testing on a phone connected to the same Wi-Fi as your PC, use your computer’s LAN IP and port 8000 (development only). Android Emulator typically uses 10.0.2.2 instead of localhost.</p>
      <form onSubmit={saveConnection}><label htmlFor="backend-url">FastAPI address</label><input id="backend-url" type="url" value={draftUrl} onChange={e=>setDraftUrl(e.target.value)} placeholder="https://api.yourdomain.co.za" required autoComplete="url"/><button type="submit" disabled={connecting}>Save connection & retry</button></form>
      <p className="journey-note">Current endpoint: {apiUrl}. A localhost address inside an installed phone app will not reach your PC.</p>
    </section>}

    <section className="journey-section" aria-labelledby="choose-goal"><div className="journey-heading"><h2 id="choose-goal">What would you like to achieve?</h2><span>Choose your goal</span></div>
      <div className="journey-goals">{goalOptions.map(item => <button key={item.id} type="button" className={`journey-goal ${item.id === goalId ? 'selected' : ''}`} aria-pressed={item.id === goalId} onClick={()=>chooseGoal(item.id)}><span className="journey-goal-icon" aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.help}</small></button>)}</div>
    </section>

    <section className="journey-card journey-progress" aria-label="Business goal progress">
      <div className="journey-progress-top"><div><span className="journey-kicker">YOUR SELECTED PATH</span><h2>{goal.label}</h2></div><strong className="journey-percentage">{percentage}%</strong></div>
      <div className="journey-progress-bar" role="progressbar" aria-label="Journey completed" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100"><div style={{width: `${percentage}%`}} /></div>
      <p>{done} of {tasks.length || goal.tasks.length} milestones completed · Completed automatically where activity is recorded</p>
      {loading && <p role="status" className="journey-note">Loading your business activity…</p>}
      {error && <div className="journey-error" role="alert"><strong>Connection needed</strong><p>{error}</p><button type="button" onClick={()=>{setDraftUrl(getApiBase());setSettingsOpen(true);}}>Set backend address</button></div>}
      {!loading && !error && <div className="journey-steps">{tasks.map((task, index) => <article className={`journey-step ${task.completed?'complete':''}`} key={task.id}>
        <div className="journey-step-symbol" aria-hidden="true">{task.completed?'✓':taskIcons[task.id] || index+1}</div>
        <div className="journey-step-content"><strong>{task.title}</strong><p>{task.completed ? `Completed · ${task.source}` : task.next_step}</p><span>{task.manual ? 'Review task · mark done in Growth Advisor' : 'Automatically checked from SmartGrowth activity'}</span></div>
        <button type="button" onClick={()=>navigate(task.route)} aria-label={`Open ${task.title}`}>{task.completed?'View':'Start'} →</button>
      </article>)}</div>}
      {!error && !loading && next && <button type="button" className="journey-cta" onClick={()=>navigate(next.route)}>Continue: {next.title} →</button>}
      {!error && !loading && !next && tasks.length>0 && <div className="journey-congrats">✨ All current milestones in this journey are complete. Explore another goal or view your Advisor.</div>}
      <Link to={goal.route} className="journey-muted-link">Open related SmartGrowth tools →</Link>
    </section>

    {data && <section className="journey-section" aria-label="Your business at a glance"><div className="journey-heading"><h2>Your business at a glance</h2><Link to="/growth-workspace?tab=advisor">View advice →</Link></div><div className="journey-metrics">
      <div><span>Growth Passport</span><strong>{data.snapshot.passport_score}<small>/100</small></strong></div>
      <div><span>Recorded surplus</span><strong>{fmt(data.snapshot.surplus)}</strong></div>
      <div><span>Unpaid invoices</span><strong>{data.snapshot.unpaid_invoices}</strong></div>
    </div></section>}
    <section className="journey-section"><div className="journey-heading"><h2>Explore your growth tools</h2><span>Everything in one place</span></div><div className="journey-shortcuts">
      {[
        ['📒','Bookkeeping','bookkeeping'],['📈','Growth Passport','passport'],['🛡️','SmartShield','shield'],
        ['🏢','Registration','registration'],['💳','Invoices','payments'],['📋','Procurement','procurement'],
        ['🏪','Market Links','market'],['✨','Growth Advisor','advisor']
      ].map(([icon,label,tab])=><Link key={tab} to={`/growth-workspace?tab=${tab}`}><span aria-hidden="true">{icon}</span>{label} <b>→</b></Link>)}
    </div></section>
    <footer className="journey-footer">Your Journey uses locally stored demo records and an explainable rules engine. External documents remain self-declared. No real payments or official registration occurs.</footer>
  </main>;
}
