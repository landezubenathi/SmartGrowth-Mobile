import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBusiness,answerBusinessQuestion,validateInsightSettings,intelligenceReport} from '../frontend/src/features/standalone/intelligence.mjs';
import {blankBusiness,addInvoice,markInvoicePaid,addTransaction} from '../frontend/src/features/standalone/engine.mjs';
const NOW='2026-10-20';
const txn=(id,kind,amount,date,category='Sales')=>({id,kind,amount,category,created_at:`${date}T12:00:00Z`});
const inv=(id,amount,due_date,status='unpaid')=>({id,amount,number:id,due_date,status,createdAt:'2026-10-01T12:00:00Z'});
const make=(name='Test')=>({...blankBusiness(name,'Catering','Eastern Cape'),transactions:[],invoices:[],listings:[]});

test('compares last 30 days against equal preceding 30-day period',()=>{
 const b=make();b.transactions=[txn('one','income',1000,'2026-09-01'),txn('two','income',900,'2026-10-01'),txn('three','expense',400,'2026-10-15','Supplies')];
 const x=analyzeBusiness(b,NOW);
 assert.equal(x.current.income,900); assert.equal(x.previous.income,1000);assert.equal(x.current.expenses,400);
 assert.equal(x.current.surplus,500); assert.equal(x.comparison.incomeChange,-10);
 assert.equal(x.period.start,'2026-09-21');assert.equal(x.period.priorEnd,'2026-09-20');
});
test('does not invent a comparison percentage when prior income is zero',()=>{
 const x=analyzeBusiness(make(),NOW);assert.equal(x.comparison.incomeChange,null);assert.equal(x.current.income,0);
});
test('flags overdue invoices only when due date precedes today and invoice is unpaid',()=>{
 const b=make();b.invoices=[inv('old',900,'2026-10-01'),inv('today',200,NOW),inv('paid',500,'2026-10-01','paid'),inv('no-date',30,null)];
 const x=analyzeBusiness(b,NOW);assert.equal(x.invoices.unpaidCount,3);assert.equal(x.invoices.overdueCount,1);assert.equal(x.invoices.overdueAmount,900);assert.equal(x.invoices.outstanding,1130);
 assert.equal(x.actions[0].id,'overdue');
});
test('checks budget against calendar month and counts only valid dated transactions',()=>{
 const b=make();b.insightSettings={monthlyRevenueGoal:2000,monthlyExpenseBudget:250};
 b.transactions=[txn('sales','income',500,'2026-10-10'),txn('cost','expense',300,'2026-10-10','Supplies'),txn('prev','income',500,'2026-09-25'),{id:'unknown',kind:'income',amount:100,category:'Sales'}];
 const x=analyzeBusiness(b,NOW);assert.equal(x.monthly.income,500);assert.equal(x.goals.revenueProgress,25);assert.equal(x.goals.budgetUsed,120);
 assert(x.alerts.some(a=>a.id==='budget'));assert.equal(x.quality.undated,1);
});
test('separates selected businesses and does not access any other user records',()=>{
 const a=make('A'),b=make('B');a.transactions=[txn('tx','income',10000,'2026-10-19')];b.transactions=[txn('tx2','expense',700,'2026-10-19')];
 assert.equal(analyzeBusiness(a,NOW).current.income,10000); assert.equal(analyzeBusiness(b,NOW).current.income,0);
 assert.equal(analyzeBusiness(b,NOW).current.expenses,700);
});
test('validates goals and permits zero for clearing a goal',()=>{
 assert.deepEqual(validateInsightSettings({monthlyRevenueGoal:5000,monthlyExpenseBudget:3000}),{monthlyRevenueGoal:5000,monthlyExpenseBudget:3000});
 assert.deepEqual(validateInsightSettings({}),{monthlyRevenueGoal:0,monthlyExpenseBudget:0});
 for(const bad of [-1,NaN,Infinity,100000001])assert.throws(()=>validateInsightSettings({monthlyRevenueGoal:bad}));
});
test('includes sample warning and does not claim financial records are verified',()=>{
 const b=make();b.transactions=[{...txn('demo','income',500,'2026-10-10'),sample:true}];
 const x=analyzeBusiness(b,NOW),report=intelligenceReport(b,new Date('2026-10-20T12:00:00Z'));
 assert.equal(x.quality.sample,1);assert.match(report,/fictional sample/);assert.match(report,/not bank-verified/i);
});
test('paid invoice created by simulator adds income once; the insights remain deterministic',()=>{
 let b=make(); b=addInvoice(b,{customer:'Someone',description:'Work',amount:2500});
 const id=b.invoices[0].id;
 let paid=markInvoicePaid(b,id);paid=markInvoicePaid(paid,id);
 const amount=paid.transactions.filter(x=>x.kind==='income').reduce((s,x)=>s+x.amount,0);
 assert.equal(amount,2500);
 const x=analyzeBusiness(paid,new Date());assert(x.invoices.unpaidCount===0);
});
test('spending categories are ranked by recorded expenses and carry explainable shares',()=>{
 const b=make();b.transactions=[txn('one','expense',500,'2026-10-01','Transport'),txn('two','expense',200,'2026-10-02','Stock'),txn('three','expense',100,'2026-10-03','Stock')];
 const x=analyzeBusiness(b,NOW);assert.equal(x.spending[0].name,'Transport');assert.equal(x.spending[0].amount,500);assert.equal(x.spending[0].share,63);
});
test('unknown/future transactions are excluded from recent-period insights',()=>{
 const b=make();b.transactions=[txn('future','income',500,'2026-11-15'),{id:'unknown',kind:'income',amount:400,created_at:'garbled'}];
 assert.equal(analyzeBusiness(b,NOW).current.income,0);
});

test('suggested natural-language questions are grounded in the current business only',()=>{
 const a=make('Cafe'),b=make('Repair Shop');a.transactions=[txn('sale','income',1250,'2026-10-10')];
 b.invoices=[inv('unpaid-123',340,'2026-10-10')];
 assert.match(answerBusinessQuestion(a,'performance',NOW),/250/);
 assert.match(answerBusinessQuestion(b,'payments',NOW),/340/);
 assert.doesNotMatch(answerBusinessQuestion(a,'payments',NOW),/340/);
 assert.throws(()=>answerBusinessQuestion(b,'arbitrary',NOW));
});
