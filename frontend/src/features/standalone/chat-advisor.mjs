import {answerBusinessQuestion} from './intelligence.mjs';
import {demoRegistryMatch} from './demo-registry.mjs';
export function chatAnswer(b,input){
 const q=String(input||'').toLowerCase().trim();
 const say=(body,page=null)=>({body,page});
 if(!q)return say('Tell me what you would like to know about your business.');
 if(/hello|^hi\b|hey|howzit/.test(q))return say(`Hi! I can help you understand ${b.name}'s records, invoices, growth milestones and next steps.`);
 if(/how (can|do) i use|what can you do|help me|how does smartgrowth work/.test(q))return say('SmartGrowth keeps your business profile, sales, expenses, invoices, readiness and protection tasks in one place. Start on My Journey, record a sale in Money, then review personal recommendations in Insights. Sign in once under More to sync when connected.', 'journey');
 if(/registration|\bcipc\b|verify|compliance|tax|sars/.test(q))return say(`${demoRegistryMatch(b).message} Open Business Compliance to review official CIPC/SARS links and your submitted details.`, 'compliance');
 if(/tender|treasury|procure|opportunit/.test(q))return say('Explore downloaded National Treasury procurement records in Opportunities. Some records may be closed or only describe awards; check the official notice and deadlines.','opportunities');
 if(/market|publish|listing|customer|advertis/.test(q))return say('Open Market Links to create a listing. Sign in to your cloud account and select Publish to make the listing visible to other SmartGrowth users.','market');
 if(/fraud|scam|otp|suspicious/.test(q))return say('Never share OTPs or banking passwords. Paste the suspicious message into SmartShield to check warning signs; a clean scan does not prove safety.','shield');
 if(/invoice|unpaid|owe|payment|debtor/.test(q))return say(answerBusinessQuestion(b,'payments'),'invoices');
 if(/expense|spend|cost|budget/.test(q))return say(answerBusinessQuestion(b,'expenses'),'money');
 if(/revenue|income|surplus|profit|perform|sales|doing/.test(q))return say(answerBusinessQuestion(b,'performance'),'intelligence');
 if(/passport|growth|next|recommend|improv|plan/.test(q))return say(answerBusinessQuestion(b,'next'),'journey');
 return say(`I can answer from ${b.name}'s saved records. Ask about sales, expenses, invoices, Growth Passport, business registration, procurement or marketplace listings. Try one of the quick questions, or describe the area you need help with. Answers are based on recorded business information.`);
}
