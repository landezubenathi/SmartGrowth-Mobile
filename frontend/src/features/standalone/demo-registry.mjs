/** FICTIONAL LOCAL TEST REGISTRY — never an official CIPC lookup.
 * The registration numbers and names below are invented. Do not use them to
 * claim actual registration, submit compliance evidence, or obtain finance.
 */
export const DEMO_REGISTRY = Object.freeze([
 {name:'Litha Catering Studio',number:'2026/840201/07',province:'Eastern Cape',industry:'Catering'},
 {name:'BrightCode Digital Services',number:'2026/840202/07',province:'Gauteng',industry:'Technology'},
 {name:'Makhulu Fresh Produce',number:'2026/840203/07',province:'Limpopo',industry:'Agriculture'}
]);
const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-ZA');
export const isEnterpriseNumber=s=>/^\d{4}\/\d{6}\/\d{2}$/.test(String(s||'').trim());
/** Only returns demo-match or no-match; never verified registration. */
export function demoRegistryMatch(b){
 const number=String(b?.compliance?.cipcNumber||'').trim();
 const name=norm(b?.name),province=norm(b?.region);
 if(!number)return {status:'missing',message:'Add the company registration number to check this demonstration registry.'};
 if(!isEnterpriseNumber(number))return {status:'invalid',message:'Check your enterprise number format (YYYY/NNNNNN/NN).'};
 const record=DEMO_REGISTRY.find(r=>r.number===number&&norm(r.name)===name&&norm(r.province)===province);
 return record?{status:'demo-match',message:'Matched the fictional demonstration registry. NOT officially verified by CIPC.',record}:{status:'no-match',message:'No match in the fictional demonstration registry. This does NOT mean the company is unregistered with CIPC.'};
}
