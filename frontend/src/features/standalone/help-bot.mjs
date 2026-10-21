import {answerBusinessQuestion,analyzeBusiness} from './intelligence.mjs';
import {demoVerificationFor} from './demo-verification.mjs';
/** Honest local FAQ + private analysis assistant. No external LLM/AI call is made. */
export const HELPFUL_PROMPTS=[
 'How is my business doing?', 'Where am I spending most?', 'Who still owes me?',
 'How do I create an invoice?', 'How do I publish my market listing?',
 'How do I check business registration?', 'How do I fetch tenders?',
 'How do I switch businesses?', 'How do I set a budget?'
];
export function respondToHelp(b,input){
 const q=String(input||'').toLowerCase().trim();
 if(!q)return {text:'Ask me about the app or the selected business. My answers use local FAQs and recorded information, not a live AI service.'};
 const answer=(id)=>({text:answerBusinessQuestion(b,id)});
 if(/(how.*business.*(doing|perform)|performance|revenue|surplus|income|profit|sales.*month)/.test(q))return answer('performance');
 if(/(expense|spending|cost|budget.*used)/.test(q) && !/set|create|change|edit|update/.test(q))return answer('expenses');
 if(/(owe|unpaid|outstanding|payment|overdue)/.test(q))return answer('payments');
 if(/(next|recommend|suggest|improve|advice)/.test(q))return answer('next');
 if(/(invoice|bill|customer)/.test(q))return {text:'Open More → Invoices, enter a customer, description, amount and due date, then save. Record a simulated payment only when you intend to mark it paid in this demo.',page:'invoices'};
 if(/(market|listing|publish|product|offer)/.test(q))return {text:'Open More → Market Links and create an offer. Sign in to your Firebase account before choosing Publish. Only the details you approve are shared to the common marketplace.',page:'market'};
 if(/(verify|verification|cipc|registration|registered)/.test(q)){
  const v=demoVerificationFor(b);
  return {text:`Open Verify Business and enter your registration number. Current selected business demo status: ${v.label}. The sample registry uses fictional data and cannot confirm real CIPC registration.`,page:'compliance'};
 }
 if(/(procure|tender|treasury|opportunit)/.test(q))return {text:'Open More → Procurement and choose Fetch official data. For web builds, configure an approved HTTPS Treasury proxy if browser CORS prevents a direct request. Saved results are labelled cached, not live.',page:'opportunities'};
 if(/(login|sign in|account|cloud|sync)/.test(q))return {text:'Sign in through More → Cloud account & sync. After successful login you return to Home, with the private cloud workspace active. You can still work offline with cached data.',page:'more'};
 if(/(switch|another business|change business)/.test(q))return {text:'Use the business selector near the top of the screen. The chatbot and financial summaries always use the selected business; other users’ financial records are private.',page:'home'};
 if(/(goal|set.*budget|target)/.test(q))return {text:'Open the Goals area in the assistant to adjust monthly sales and expense targets for the selected business. Alerts check your recorded expenses against the selected budget.',page:'assistant'};
 const i=analyzeBusiness(b);
 return {text:`I can help with app navigation, invoices, verification, market links, procurement and finances for ${b.name}. This business has ${i.current.transactionCount} recorded transaction(s) in the last 30 days. Try one of the suggested questions.`};
}
