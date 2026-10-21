import {analyzeBusiness} from './intelligence.mjs';
import {demoVerificationFor} from './demo-verification.mjs';
/** Deterministic alerts scoped only to the currently selected private business. */
export function businessNotifications(b,now=new Date()){
 if(!b)return [];
 const data=analyzeBusiness(b,now),a=[];
 if(data.invoices.overdueCount)a.push({id:'overdue',severity:'high',title:`${data.invoices.overdueCount} overdue invoice(s)`,body:'Follow up on invoices past their recorded due dates.',page:'invoices'});
 if(data.goals.monthlyExpenseBudget>0&&data.monthly.expenses>data.goals.monthlyExpenseBudget)a.push({id:'budget',severity:'high',title:'Expense budget exceeded',body:'This month’s recorded expenses exceed your set budget.',page:'assistant'});
 if(data.current.transactionCount===0)a.push({id:'records',severity:'info',title:'No transactions for the last 30 days',body:'Record income or expenses to receive useful business insights.',page:'money'});
 const verification=demoVerificationFor(b);
 if(verification.status==='not_checked')a.push({id:'verification',severity:'info',title:'Demo business check available',body:'Try the fictional registry check in Verify Business.',page:'compliance'});
 if(!b.listings?.length)a.push({id:'listing',severity:'info',title:'Add your first market listing',body:'Create an offer to share after signing in.',page:'market'});
 return a;
}
