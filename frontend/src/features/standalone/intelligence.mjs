/**
 * SmartGrowth Insights v1 — deterministic, privacy-preserving calculations.
 * Nothing is transmitted to a model or external API. Calculations use only the
 * business selected in the device/account workspace by StandaloneApp.
 * All reported sales/payment records are self-entered or simulated.
 */
import {passport} from './engine.mjs';

const cent = v => Math.round((Number(v)||0)*100)/100;
const dateOnly = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(value.slice(0,10)+'T00:00:00.000Z');
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==value.slice(0,10) ? null : date;
};
const dayMS = 86400000;
const days = (date, diff) => new Date(date.getTime()+diff*dayMS);
const iso = date => date.toISOString().slice(0,10);
const money = value => 'R '+cent(value).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const goodNumber = value => typeof value==='number' && Number.isFinite(value) && value>=0 && value<=1e8;

export function validateInsightSettings(value){
 const revenueGoal=value?.monthlyRevenueGoal ?? 0;
 const expenseBudget=value?.monthlyExpenseBudget ?? 0;
 if(!goodNumber(revenueGoal)||!goodNumber(expenseBudget)) throw Error('Monthly goals must be valid non-negative amounts below R100 million.');
 return {monthlyRevenueGoal:cent(revenueGoal),monthlyExpenseBudget:cent(expenseBudget)};
}

export function analyzeBusiness(b, now=new Date()){
 if(!b || typeof b!=='object') throw Error('Choose a business first.');
 const reference = dateOnly(now instanceof Date ? iso(now) : String(now).slice(0,10));
 if(!reference) throw Error('Invalid analysis date.');
 const today = iso(reference), recentStart=iso(days(reference,-29)), priorStart=iso(days(reference,-59));
 const yearMonth=today.slice(0,7);
 const transactions=Array.isArray(b.transactions)?b.transactions:[];
 const invoices=Array.isArray(b.invoices)?b.invoices:[];
 const eligible=transactions.map(t=>({...t,_date:dateOnly(t.created_at||t.createdAt)}))
   .filter(t=>t._date && iso(t._date)<=today && goodNumber(Number(t.amount)) && ['income','expense'].includes(t.kind));
 const segment=(from,to)=>{
  const scoped=eligible.filter(t=>iso(t._date)>=from && iso(t._date)<=to);
  const income=cent(scoped.filter(t=>t.kind==='income').reduce((s,t)=>s+Number(t.amount),0));
  const expenses=cent(scoped.filter(t=>t.kind==='expense').reduce((s,t)=>s+Number(t.amount),0));
  return {income,expenses,surplus:cent(income-expenses),transactionCount:scoped.length};
 };
 const current=segment(recentStart,today);
 const previous=segment(priorStart,iso(days(reference,-30)));
 const monthly=segment(`${yearMonth}-01`,today);
 const incomeChange=previous.income>0 ? cent((current.income-previous.income)/previous.income*100) : null;
 const expenseChange=previous.expenses>0 ? cent((current.expenses-previous.expenses)/previous.expenses*100) : null;
 const counts = {sample:transactions.filter(t=>t.sample).length+invoices.filter(i=>i.sample).length,
  dated:eligible.length,undated:transactions.filter(t=>!dateOnly(t.created_at||t.createdAt)).length};
 const unpaid=invoices.filter(i=>i.status!=='paid');
 const overdue=unpaid.filter(i=>{const due=dateOnly(i.due_date);return due && iso(due)<today;});
 const outstanding=cent(unpaid.reduce((s,i)=>s+(Number(i.amount)||0),0));
 const overdueAmount=cent(overdue.reduce((s,i)=>s+(Number(i.amount)||0),0));
 const expensesByCategory=new Map();
 for(const t of eligible){
  if(t.kind!=='expense'||iso(t._date)<recentStart)continue;
  const key=String(t.category||'Uncategorised').trim().slice(0,60)||'Uncategorised';
  expensesByCategory.set(key,cent((expensesByCategory.get(key)||0)+Number(t.amount)));
 }
 const categories=[...expensesByCategory.entries()].map(([name,amount])=>({name,amount,share:current.expenses>0?Math.round(amount/current.expenses*100):0})).sort((a,b)=>b.amount-a.amount);
 const settings=validateInsightSettings(b.insightSettings||{});
 const goals={...settings,revenueProgress:settings.monthlyRevenueGoal>0?Math.min(100,Math.round(monthly.income/settings.monthlyRevenueGoal*100)):null,
  budgetUsed:settings.monthlyExpenseBudget>0?Math.round(monthly.expenses/settings.monthlyExpenseBudget*100):null};
 const pass=passport(b);
 const alerts=[];
 const actions=[];
 function add(id,level,title,why,page,evidence){const a={id,level,title,why,page,evidence};alerts.push(a);actions.push(a);}
 if(eligible.length===0)add('first-record','info','Start recording business activity','Record a sale or expense to unlock meaningful financial trends.','money',`${eligible.length} dated transactions`);
 if(overdue.length)add('overdue','high',`Follow up on ${overdue.length} overdue invoice${overdue.length===1?'':'s'}`,
  `${money(overdueAmount)} is shown as overdue based on the due dates you entered. Confirm the payment status with the customer.`,
  'invoices',`${overdue.length} overdue / ${unpaid.length} unpaid`);
 else if(unpaid.length)add('unpaid','medium',`Review ${unpaid.length} unpaid invoice${unpaid.length===1?'':'s'}`,
  `${money(outstanding)} is billed but not recorded as received. Follow up based on your agreed payment terms.`,
  'invoices',`${unpaid.length} unpaid`);
 if(current.expenses>current.income && current.expenses>0)add('negative-surplus','high','Review cash movement',
  `Expenses exceeded recorded income by ${money(current.expenses-current.income)} over the last 30 days. This is not a bank balance.`,
  'money',`${money(current.income)} income / ${money(current.expenses)} costs`);
 if(incomeChange!==null && incomeChange<=-15 && previous.income>=500)add('sales-drop','medium','Investigate a recent income decrease',
  `Recorded income is ${Math.abs(incomeChange).toFixed(0)}% below the previous 30-day period. Check seasonality and missing entries.`,
  'money',`${money(current.income)} vs ${money(previous.income)}`);
 if(goals.monthlyExpenseBudget>0 && monthly.expenses>goals.monthlyExpenseBudget)add('budget','high','Monthly expense budget exceeded',
  `Recorded expenses of ${money(monthly.expenses)} exceed your ${money(goals.monthlyExpenseBudget)} budget this month.`,
  'intelligence',`${goals.budgetUsed}% of budget`);
 if(categories.length && categories[0].share>=60 && current.expenses>=500)add('concentration','medium','Review your largest expense category',
  `${categories[0].name} accounts for ${categories[0].share}% of recorded expenses in the last 30 days. Check whether it can be better managed.`,
  'money',`${money(categories[0].amount)} in ${categories[0].name}`);
 if(!settings.monthlyRevenueGoal)add('set-goal','info','Set a monthly sales goal',
  'A target lets SmartGrowth compare this month’s recorded sales with what you want to achieve.',
  'intelligence','No target set');
 if(pass.score<60)add('passport','info','Strengthen your Growth Passport',
  `Your illustrative readiness is ${pass.score}/100. Complete applicable steps and only declare documents you actually have.`,
  'passport',`${pass.autoPoints}/60 automatic points`);
 if(!b.listings?.length)add('listings','info','Prepare a customer-facing offer',
  'Describe your product or service clearly to prepare for market access. Publish a saved listing from your signed-in cloud workspace to reach other SmartGrowth users.',
  'market','No saved listings');
 if(!b.reviewedOpportunities)add('opportunities','info','Explore verified public opportunities',
  'Review National Treasury procurement records and check notices and deadlines at the original source.',
  'opportunities','Not yet reviewed');
 const severity={high:0,medium:1,info:2};
 alerts.sort((a,z)=>severity[a.level]-severity[z.level]);
 return {
  businessId:b.id,businessName:b.name,industry:b.industry,generatedAt:today,
  period:{start:recentStart,end:today,priorStart,priorEnd:iso(days(reference,-30)),label:'Last 30 days'},
  current,previous,monthly,comparison:{incomeChange,expenseChange},
  invoices:{unpaidCount:unpaid.length,outstanding,overdueCount:overdue.length,overdueAmount},
  spending:categories,goals,alerts,actions:alerts.slice(0,6),passportScore:pass.score,quality:counts,
  coverageNote:'Calculated from entered transactions and simulated invoice payments—not bank-verified. Income/expenses are recorded movements, not cash balances or audited profit.'
 };
}

export function intelligenceReport(b,now=new Date()){
 const a=analyzeBusiness(b,now);
 const lines=[`SMARTGROWTH · PRIVATE BUSINESS INSIGHTS`,a.businessName,
  `Business type: ${a.industry||'Not specified'}`,`Generated: ${a.generatedAt}`,`Period: ${a.period.start} to ${a.period.end}`,
  '',`Recorded income: ${money(a.current.income)}`,`Recorded expenses: ${money(a.current.expenses)}`,`Recorded surplus: ${money(a.current.surplus)}`,
  `Previous 30-day income: ${money(a.previous.income)}`,`Unpaid invoices: ${a.invoices.unpaidCount} (${money(a.invoices.outstanding)})`,
  `Overdue invoices: ${a.invoices.overdueCount} (${money(a.invoices.overdueAmount)})`,
  `Growth Passport: ${a.passportScore}/100 (illustrative, unverified)`,
  '',`Recommended actions:`,...a.actions.map((item,i)=>`${i+1}. ${item.title}\n   ${item.why}\n   Evidence: ${item.evidence}`),
  '',`DATA LIMITATIONS: ${a.coverageNote}`,a.quality.sample?`Includes ${a.quality.sample} fictional sample transaction/invoice records.`:'No records explicitly labelled as samples.'];
 return lines.join('\n');
}

/** Predefined questions answered locally using the same private analysis. */
export function answerBusinessQuestion(b,question,now=new Date()){
 const a=analyzeBusiness(b,now);
 switch(question){
  case 'performance':
   return `For ${a.period.start} to ${a.period.end}, recorded income was ${money(a.current.income)}, expenses were ${money(a.current.expenses)}, and the difference was ${money(a.current.surplus)}. This is not an actual bank balance or audited profit.`;
  case 'payments':
   return `${a.invoices.unpaidCount} invoice(s) remain unpaid, totalling ${money(a.invoices.outstanding)}. ${a.invoices.overdueCount} are past their entered due dates, totalling ${money(a.invoices.overdueAmount)}. Use Invoices to confirm payment status; simulated payments are not bank verified.`;
  case 'expenses':
   return a.spending.length?`Your largest recorded expense category over the last 30 days is ${a.spending[0].name}: ${money(a.spending[0].amount)}, or ${a.spending[0].share}% of recorded expenses. Check this category in Bookkeeping.`:'There are no dated expenses in the last 30 days. Record your costs in Bookkeeping to compare categories.';
  case 'next':
   return a.actions.length?`${a.actions[0].title}. ${a.actions[0].why} Evidence: ${a.actions[0].evidence}.`:'No urgent action was identified. Keep your records up to date and review new opportunities.';
  default:throw Error('Choose one of the suggested questions.');
 }
}
