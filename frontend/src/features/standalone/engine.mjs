import {INDUSTRIES, DOC_ITEMS, DEMO_OPPORTUNITIES, FRAUD_RULES} from './catalog.mjs';
import {complianceDetails} from './compliance.mjs';
export const currency = x => 'R '+Number(x||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
export const total = (xs,kind) => Math.round(xs.filter(t=>t.kind===kind).reduce((sum,t)=>sum+Number(t.amount),0)*100)/100;
export function financials(business){
 const transactions=business.transactions||[];
 const income=total(transactions,'income'),expenses=total(transactions,'expense');
 return {income,expenses,surplus:Math.round((income-expenses)*100)/100};
}
export function passport(b){
 const f=financials(b);const inv=b.invoices||[];
 const automatic=[
  {id:'profile',label:'Business profile completed',points:15,complete:Boolean(!b.isPlaceholder&&b.name?.trim()&&b.industry&&b.region)},
  {id:'invoice',label:'First invoice created',points:10,complete:inv.length>0},
  {id:'sale',label:'Income recorded',points:15,complete:f.income>0},
  {id:'surplus',label:'Positive recorded surplus',points:10,complete:f.income>0&&f.surplus>0},
  {id:'volume',label:'R5,000 in total recorded sales',points:10,complete:f.income>=5000}
 ];
 const manual=DOC_ITEMS.map(d=>({...d,completed:Boolean(b.documents?.[d.id]),points:10}));
 const autoPoints=automatic.reduce((s,v)=>s+(v.complete?v.points:0),0);
 const documentPoints=manual.reduce((s,v)=>s+(v.completed?v.points:0),0);
 return {score:autoPoints+documentPoints,autoPoints,documentPoints,automatic,manual,financials:f,
 disclaimer:'Illustrative, unverified readiness indicator. Not a credit score, official compliance check or promise of funding.'};
}
export function protectionJourney(b){
 const scans=Number(b.security?.scans||0),risk=Number(b.security?.highRiskScans||0);
 const steps=[
  {id:'scan',label:'Screen a suspicious message',done:scans>0,page:'shield',why:'Use SmartShield to examine a message and understand its warning signs.'},
  {id:'security',label:'Review fraud prevention tips',done:Boolean(b.security?.reviewedTips),page:'shield',why:'Learn why OTPs, urgent fees and unfamiliar payment links are risky.'},
  {id:'contact',label:'Check an organisation through its official channel',done:Boolean(b.security?.reviewedContacts),page:'shield',why:'Confirm funding offers and supplier contact details independently.'},
  {id:'followup',label:'Review flagged risks and next steps',done:scans>0 && Boolean(b.security?.reviewedScans),page:'shield',why:risk>0?`${risk} scan(s) raised multiple warning signs. Review your response before acting.`:'Review the screening result, even if no obvious warning was found.'}
 ];
 return {steps,completed:steps.filter(i=>i.done).length,total:steps.length,next:steps.find(i=>!i.done)};
}
export function journey(b){
 const pass=passport(b),inv=b.invoices||[];
 const activities=[
  {id:'profile',label:'Create your business profile',done:Boolean(!b.isPlaceholder&&b.name),page:'business',why:'Personalise your plan by business type and location.'},
  {id:'sale',label:'Record your first sale',done:pass.financials.income>0,page:'money',why:'Build an accurate history of your income.'},
  {id:'invoice',label:'Issue an invoice',done:inv.length>0,page:'invoices',why:'Keep track of customer payments.'},
  {id:'expenses',label:'Capture a business expense',done:pass.financials.expenses>0,page:'money',why:'Know what it costs to operate.'},
  {id:'compliance',label:'Review relevant business documents',done:Object.values(b.documents||{}).some(Boolean)||complianceDetails(b).items.some(x=>x.type==='self-reported'&&x.done),page:'compliance',why:'Review CIPC, SARS or supplier requirements through official channels; self-reported progress is not verification.'},
  {id:'opportunity',label:'Explore market and procurement resources',done:Boolean(b.reviewedOpportunities),page:'opportunities',why:'Look for real opportunities via trusted official sources.'}
 ];
 return {steps:activities,completed:activities.filter(i=>i.done).length,total:activities.length,next:activities.find(i=>!i.done)};
}
export function advice(b){
 const f=financials(b),p=passport(b),j=journey(b),unpaid=b.invoices.filter(i=>i.status!=='paid');
 const items=[];
 const compliance=complianceDetails(b);
 if(compliance.done<compliance.total)items.push({title:'Review your business compliance steps',why:`${compliance.total-compliance.done} recommended review(s) remain for this business structure. This is preparation, not official verification.`,page:'compliance',priority:'High'});
 if(j.next)items.push({title:j.next.label,why:j.next.why,page:j.next.page,priority:'First'});
 if(unpaid.length)items.push({title:`Follow up on ${unpaid.length} unpaid invoice(s)`,why:`${currency(unpaid.reduce((s,i)=>s+i.amount,0))} billed but not recorded as received.`,page:'invoices',priority:'High'});
 if(f.expenses>f.income&&f.income>0)items.push({title:'Review operating expenses',why:'Recorded expenses currently exceed income. Review costs before committing to new work.',page:'money',priority:'High'});
 if(f.income===0)items.push({title:'Build a sales history',why:'Recording regular sales helps understand demand and cash flow.',page:'money',priority:'High'});
 if(!b.documents?.tax)items.push({title:'Check applicable tax requirements',why:'Tax obligations depend on your business structure and circumstances.',page:'sources',priority:'Medium'});
 if(!b.listings?.length)items.push({title:'Create a product or service listing',why:'Describe your offer so you can prepare for connecting with customers.',page:'market',priority:'Medium'});
 const sectorHints={
  'Catering':'Track ingredient costs per order so you can price catering jobs sustainably.',
  'Retail':'Record stock purchases and daily sales separately to understand gross margins.',
  'Agriculture':'Keep produce sales and seasonal input costs separate to plan future harvests.',
  'Construction':'Prepare itemised quotations and record materials for each job.',
  'Technology':'Separate recurring support income from once-off development projects.',
  'Services':'Track travel, supplies and time spent delivering each service.',
  'Manufacturing':'Compare raw-material costs against selling prices per batch.',
  'Beauty & Wellness':'Monitor appointment revenue and consumables per treatment.',
  'Transport':'Monitor fuel and maintenance costs per delivery route.',
  'Education':'Track enrolment payments and teaching resource expenses separately.'
 };
 items.push({title:`Tip for ${b.industry||'your business'}`,why:sectorHints[b.industry]||'Track revenue and expenses for each service or product so you can see what works.',page:'money',priority:'Suggestion'});
 return {items:items.slice(0,7),summary:`${b.industry||'Business'} in ${b.region||'South Africa'} · ${p.score}/100 illustrative readiness`,
 note:'Rules-based advice using records saved on this device; not a financial prediction.'};
}
export function sampleBusiness(industry='Catering', region='Eastern Cape', name){
 const template=INDUSTRIES.find(i=>i.id===industry)||INDUSTRIES.at(-1),now=new Date().toISOString();
 return {id:`sg-${Date.now()}-${Math.floor(Math.random()*100000)}`,name:name||template.example,industry,region,
 description:`Example ${industry.toLowerCase()} business. All sample amounts and customers are fictional.`,createdAt:now,
 transactions:[
  {id:'tx-example-1',kind:'income',amount:2500,category:'Sales',description:`SAMPLE: ${template.sale}`,created_at:now,sample:true},
  {id:'tx-example-2',kind:'income',amount:1800,category:'Sales',description:`SAMPLE: second ${template.sale.toLowerCase()}`,created_at:now,sample:true},
  {id:'tx-example-3',kind:'expense',amount:1100,category:'Operating costs',description:`SAMPLE: ${template.expense}`,created_at:now,sample:true}
 ],invoices:[{id:'inv-example-1',number:'SG-DEMO-001',customer:'Example Customer',description:`Sample ${template.sale.toLowerCase()}`,amount:900,status:'unpaid',createdAt:now,sample:true}],
 documents:{},listings:[],reviewedOpportunities:false};
}
export function blankBusiness(name,industry,region,description=''){
 if(!String(name||'').trim()||!String(industry||'').trim()||!String(region||'').trim())throw Error('Enter a business name, industry and province.');
 return {...sampleBusiness(industry,region,name),description,transactions:[],invoices:[]};
}
export function addTransaction(b,{kind,amount,category,description}){
 const val=Number(amount);
 if(!['income','expense'].includes(kind)||!Number.isFinite(val)||val<=0||val>100000000)throw Error('Enter a valid positive transaction amount.');
 if(!String(category||'').trim())throw Error('Choose a category.');
 return {...b,transactions:[{id:`tx-${Date.now()}-${Math.floor(Math.random()*99999)}`,kind,amount:Math.round(val*100)/100,category:category.trim().slice(0,60),description:String(description||'').slice(0,240),created_at:new Date().toISOString()},...b.transactions]};
}
export function addInvoice(b,{customer,description,amount,due_date}){
 const val=Number(amount);
 if(!String(customer||'').trim()||!String(description||'').trim()||!Number.isFinite(val)||val<=0)throw Error('Enter the customer, description and a positive amount.');
 const id=`inv-${Date.now()}-${Math.floor(Math.random()*99999)}`;
 return {...b,invoices:[{id,number:`SG-${Date.now().toString().slice(-7)}`,customer:customer.trim().slice(0,100),description:description.trim().slice(0,200),amount:Math.round(val*100)/100,due_date:due_date||null,status:'unpaid',createdAt:new Date().toISOString(),sample:false},...b.invoices]};
}
export function markInvoicePaid(b,invoiceId){
 const invoice=b.invoices.find(i=>i.id===invoiceId);
 if(!invoice)throw Error('Invoice not found');
 if(invoice.status==='paid')return b; // idempotent
 const paid={...b,invoices:b.invoices.map(i=>i.id===invoiceId?{...i,status:'paid',paidAt:new Date().toISOString()}:i)};
 return addTransaction(paid,{kind:'income',amount:invoice.amount,category:'Invoice payment (simulated)',description:`Demo paid invoice ${invoice.number}: ${invoice.description}`});
}
export function fraudCheck(message){
 const flags=FRAUD_RULES.filter(([,rule])=>rule.test(message||'')).map(([label])=>label);
 return {signals:flags,level:flags.length>=2?'High concern':flags.length===1?'Caution':'No obvious indicators',
 recommendation:'Do not send money, banking credentials or OTPs to an unverified contact. Verify organisations through official channels. A clean text scan does not establish legitimacy.'};
}
export function matches(b){
 return DEMO_OPPORTUNITIES.map(o=>({...o,score:(o.industry===b.industry?60:0)+(o.region===b.region?30:0)+10}))
 .sort((a,z)=>z.score-a.score);
}
