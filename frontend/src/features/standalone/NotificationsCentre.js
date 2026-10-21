import React from 'react';
import {Bell,CheckCheck} from 'lucide-react';
export default function NotificationsCentre({items,seen,onMarkRead,onOpen}){
 return <><div className="sd-heading"><small>BUSINESS NOTIFICATIONS</small><h1>What needs attention?</h1><p>Alerts for the selected business update from saved records, including when offline.</p></div>
 <section className="sd-panel"><div className="sd-assistant-head"><Bell size={22}/><div><strong>{items.filter(x=>!seen.includes(x.id)).length} unread notifications</strong><small>Informational alerts · No background push service</small></div></div>
 <button className="sd-btn secondary" onClick={()=>onMarkRead(items.map(x=>x.id))}><CheckCheck size={16}/> Mark all read</button>
 {items.length?items.map(item=><div className={`sd-notification ${seen.includes(item.id)?'read':''}`} key={item.id}><div><b>{item.title}</b><p>{item.body}</p><small>{item.severity==='high'?'Action suggested':'Information'}</small></div><button className="sd-btn secondary" onClick={()=>{onMarkRead([item.id]);onOpen(item.page);}}>Review →</button></div>):<p className="sd-empty">No alerts for this business right now.</p>}
 </section></>;
}
