/** Local, simulated registration validation. This does not check CIPC records or authenticate identity. */
import {blankBusiness} from './engine.mjs';
import {PRACTICE_SOURCE,practiceRegistrationNumber} from './mock-registry.mjs';
const trim=(v,max=120)=>String(v||'').trim().replace(/\s+/g,' ').slice(0,max);
const companyStructures=['registered_company','sole_proprietor','partnership','cooperative','nonprofit'];
function checksum(value){
 // SA ID format check including Luhn. This confirms formatting, NOT identity or CIPC status.
 const digits=String(value||'').replace(/\s/g,'');
 if(!/^\d{13}$/.test(digits))return false;
 let sum=0,twice=false;
 for(let i=digits.length-1;i>=0;i--){let n=Number(digits[i]);if(twice){n*=2;if(n>9)n-=9;}sum+=n;twice=!twice;}
 return sum%10===0;
}
export function validateOnboarding(form){
 const email=trim(form.email,254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.');
 if(String(form.password||'').length<8)throw Error('Use a SmartGrowth password with at least 8 characters.');
 const name=trim(form.businessName,90),directorName=trim(form.directorName,120),street=trim(form.street,160),city=trim(form.city,90),postalCode=trim(form.postalCode,10);
 if(name.length<3)throw Error('Enter a business name of at least 3 characters.');
 if(!companyStructures.includes(form.structure))throw Error('Select the business structure.');
 if(!trim(form.industry,80)||!trim(form.province,80))throw Error('Choose an industry and province.');
 if(!street||!city||!/^[0-9]{4}$/.test(postalCode))throw Error('Enter street, town/city and a four-digit postal code.');
 if(directorName.length<3)throw Error('Enter the owner or director’s full name.');
 if(!checksum(form.directorId))throw Error('Enter a valid 13-digit South African ID format. This check does not verify identity.');
 return {email,password:form.password,name,structure:form.structure,industry:trim(form.industry,80),province:trim(form.province,80),description:trim(form.description,400),directorName,street,city,postalCode};
}
export function makeOnboardedBusiness(data){
 const b=blankBusiness(data.name,data.industry,data.province,data.description);
 const now=new Date().toISOString();
 return {...b,registrySource:PRACTICE_SOURCE,registryId:b.id,registryStatus:'practice',
  registrationDetails:{structure:data.structure,address:{street:data.street,city:data.city,province:data.province,postalCode:data.postalCode},directorName:data.directorName,reviewStatus:'format-checked-only'},
  compliance:{...b.compliance,structure:data.structure,cipcNumber:practiceRegistrationNumber(),checks:{}},
  modifiedAt:now,isPlaceholder:false};
}
export const ONBOARDING_STEPS=[
 'Checking entered director ID format',
 'Reviewing the business name and address',
 'Preparing owner and business details',
 'Simulating registration with a practice registry — no CIPC connection',
 'Generating a SmartGrowth practice reference',
 'Saving your private business workspace'
];
