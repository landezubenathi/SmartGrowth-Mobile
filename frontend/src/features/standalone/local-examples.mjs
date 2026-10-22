/**
 * Three complete FICTIONAL device-only profiles for guided testing.
 * These records are bundled in the app; they are not Firebase users or CIPC records.
 * Do not insert them in user/{uid} Firestore paths or shared marketplace.
 */
import {sampleBusiness} from './engine.mjs';

export const LOCAL_SAMPLE_PROFILES = Object.freeze([
  Object.freeze({
    id:'local-sample-litha',name:'Litha Catering Studio',industry:'Catering',region:'Eastern Cape',
    structure:'registered_company',owner:'Nomonde Sample',
    address:{street:'12 Fictional Market Lane',city:'Mthatha',province:'Eastern Cape',postalCode:'5100'},
    description:'Provides event catering, lunch platters and packaged meals for community events and small offices.',
    contactEmail:'litha@example.invalid',practiceReference:'SG-LOCAL-001',testRegistryNumber:'2026/840201/07',
    revenue:12000,expense:4200,invoiceAmount:1750,invoiceCustomer:'Sample Community Centre',
    saleDescription:'Weekend catering orders',expenseDescription:'Ingredients and packaging'
  }),
  Object.freeze({
    id:'local-sample-brightcode',name:'BrightCode Digital Services',industry:'Technology',region:'Gauteng',
    structure:'registered_company',owner:'Thabo Example',
    address:{street:'8 Imaginary Innovation Avenue',city:'Johannesburg',province:'Gauteng',postalCode:'2000'},
    description:'Builds small business websites, offers maintenance packages and provides digital-skills training.',
    contactEmail:'brightcode@example.invalid',practiceReference:'SG-LOCAL-002',testRegistryNumber:'2026/840202/07',
    revenue:16500,expense:6200,invoiceAmount:3800,invoiceCustomer:'Example Printing Shop',
    saleDescription:'Website development and support',expenseDescription:'Hosting, connectivity and software'
  }),
  Object.freeze({
    id:'local-sample-makhulu',name:'Makhulu Fresh Produce',industry:'Agriculture',region:'Limpopo',
    structure:'cooperative',owner:'Lerato Fiction',
    address:{street:'23 Demonstration Farm Road',city:'Polokwane',province:'Limpopo',postalCode:'0700'},
    description:'Supplies fresh vegetables and seasonal produce to community markets and neighbourhood shops.',
    contactEmail:'makhulu@example.invalid',practiceReference:'SG-LOCAL-003',testRegistryNumber:'2026/840203/07',
    revenue:8800,expense:3900,invoiceAmount:1250,invoiceCustomer:'Sample Market Stall',
    saleDescription:'Fresh vegetable supply orders',expenseDescription:'Seeds, transport and packing materials'
  })
]);

export function localSampleBusinesses(){
 return LOCAL_SAMPLE_PROFILES.map((p,index)=>{
  const base=sampleBusiness(p.industry,p.region,p.name);
  const createdAt='2026-10-01T09:00:00.000Z';
  return {...base,
   id:p.id,
   description:p.description,
   createdAt,
   modifiedAt:createdAt,
   isLocalSample:true,
   sample:true,
   practiceReference:p.practiceReference,
   ownerName:p.owner,
   contactEmail:p.contactEmail,
   registrationDetails:{structure:p.structure,directorName:p.owner,
    address:{...p.address},reviewStatus:'fictional-sample-only'},
   compliance:{structure:p.structure,checks:{},cipcNumber:''},
   transactions:[
    {id:`${p.id}-income`,kind:'income',amount:p.revenue,category:'Sales',description:p.saleDescription,created_at:createdAt,sample:true},
    {id:`${p.id}-expense`,kind:'expense',amount:p.expense,category:'Operating costs',description:p.expenseDescription,created_at:createdAt,sample:true}
   ],
   invoices:[{id:`${p.id}-invoice`,number:`SG-SAMPLE-00${index+1}`,
    customer:p.invoiceCustomer,description:`Sample invoice for ${p.industry.toLowerCase()} services`,
    amount:p.invoiceAmount,status:'unpaid',createdAt,sample:true}],
   listings:[],documents:{},reviewedOpportunities:false
  };
 });
}

export function isDeviceOnlySample(b){return Boolean(b?.isLocalSample===true || String(b?.id||'').startsWith('local-sample-'));}
