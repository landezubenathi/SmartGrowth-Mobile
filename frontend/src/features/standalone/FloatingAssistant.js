import React,{useEffect,useRef,useState} from 'react';
import {chatAnswer} from './chat-advisor.mjs';
import './floating-assistant.css';
const INTRO={role:'assistant',text:'Hello! I am your SmartGrowth assistant. Ask me about this business, its finances, invoices or what to do next.'};
const readChat=(k)=>{try{const saved=JSON.parse(localStorage.getItem(k)||'null');return Array.isArray(saved)&&saved.length?saved.slice(-50):[INTRO];}catch(_){return [INTRO];}};
export default function FloatingAssistant({business,userKey,onNavigate}){
 const [open,setOpen]=useState(false);
 const [message,setMessage]=useState('');
 const key=`sg_chat_v2_${userKey}_${business.id}`;
 const [chat,setChat]=useState(()=>({key,messages:readChat(key)}));
 const messages=chat.key===key?chat.messages:[INTRO];
 const scrollRef=useRef(null),inputRef=useRef(null);
 useEffect(()=>{setChat({key,messages:readChat(key)});},[key]);
 useEffect(()=>{if(chat.key!==key)return;try{localStorage.setItem(key,JSON.stringify(chat.messages.slice(-50)));}catch(_){}},[key,chat]);
 useEffect(()=>{if(open&&scrollRef.current){scrollRef.current.scrollTop=scrollRef.current.scrollHeight;}},[open,messages]);
 function send(e){e.preventDefault();const value=message.trim();if(!value)return;
  const answer=chatAnswer(business,value);
  setChat(old=>({key,messages:[...(old.key===key?old.messages:[INTRO]),{role:'user',text:value},{role:'assistant',text:answer.body,page:answer.page}].slice(-50)}));setMessage('');
  requestAnimationFrame(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;inputRef.current?.focus();});
 }
 return <div className="sg-chat-root">
  {open&&<section className="sg-chat-panel" role="dialog" aria-label="SmartGrowth business assistant">
   <div className="sg-chat-header"><div><b>✦ SmartGrowth Assistant</b><small>{business.name} · Private, on-device answers</small></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close assistant">×</button></div>
   <div className="sg-chat-messages" aria-live="polite" aria-relevant="additions" ref={scrollRef}>
    {messages.map((item,i)=><div className={'sg-chat-bubble '+(item.role==='user'?'user':'assistant')} key={i}>
     <p>{item.text}</p>{item.page&&<button type="button" onClick={()=>{onNavigate(item.page);setOpen(false);}}>Open related page →</button>}
    </div>)}
   </div>
   <form className="sg-chat-compose" onSubmit={send}><input ref={inputRef} aria-label="Message the business assistant" placeholder="Ask about your business…" maxLength={500} value={message} onChange={e=>setMessage(e.target.value)}/><button type="submit" disabled={!message.trim()}>Send</button></form>
   <small className="sg-chat-foot">Rules-based answers from this business's records · No external AI</small>
  </section>}
  <button type="button" className="sg-chat-launcher" aria-label={open?'Close business assistant':'Open business assistant'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'×':'✦'}<span>{open?'Close':'Ask SmartGrowth'}</span></button>
 </div>;
}
