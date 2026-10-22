/**
 * ONE-TIME ADMINISTRATOR SEEDER. NEVER run inside a browser or Android app.
 * Uses a local Firebase service account via GOOGLE_APPLICATION_CREDENTIALS.
 * No CIPC API interaction. All five records and email addresses are fictional.
 */
const {randomBytes}=require('node:crypto');
const admin=require('firebase-admin');
const {applicationDefault}=require('firebase-admin/app');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
 console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your LOCAL service account JSON path. Never commit the JSON.');
 process.exit(1);
}
admin.initializeApp({credential:applicationDefault(),projectId:process.env.FIREBASE_PROJECT_ID||'smartgrowthmobile'});
const examples=[
 {email:'litha.catering@smartgrowth.example',businessName:'Litha Catering Studio',industry:'Catering',province:'Eastern Cape',registrationNumber:'2026/840201/07'},
 {email:'brightcode@smartgrowth.example',businessName:'BrightCode Digital Services',industry:'Technology',province:'Gauteng',registrationNumber:'2026/840202/07'},
 {email:'makhulu.fresh@smartgrowth.example',businessName:'Makhulu Fresh Produce',industry:'Agriculture',province:'Limpopo',registrationNumber:'2026/840203/07'},
 {email:'ubuntu.repairs@smartgrowth.example',businessName:'Ubuntu Home Repairs',industry:'Construction',province:'KwaZulu-Natal',registrationNumber:'2026/840204/07'},
 {email:'sisonke.beauty@smartgrowth.example',businessName:'Sisonke Beauty Collective',industry:'Beauty & Wellness',province:'Western Cape',registrationNumber:'2026/840205/07'}
];
(async()=>{
 const auth=admin.auth();const db=admin.firestore();
 console.log('PRACTICE ACCOUNT CREDENTIALS — store securely and do not commit or post them.');
 for(let i=0;i<examples.length;i++){
  const example=examples[i];let user,pass='(existing account; password unchanged)';
  try {user=await auth.getUserByEmail(example.email);}
  catch(error){if(error.code!=='auth/user-not-found')throw error;
   pass=randomBytes(15).toString('base64url')+'aA8!';
   user=await auth.createUser({email:example.email,password:pass,displayName:example.businessName});
  }
  const now=new Date().toISOString();const businessId=`seed_registry_${i+1}`;
  await db.doc(`users/${user.uid}/simulatedRegistry/${businessId}`).set({
    ownerUid:user.uid,businessId,email:example.email,...Object.fromEntries(Object.entries(example).filter(([k])=>k!=='email')),
    source:'smartgrowth-simulated-registry',status:'practice',createdAt:now,modifiedAt:now
  },{merge:true});
  console.log(`${i+1}. ${example.email}   password: ${pass}`);
 }
 console.log('Finished: five fictional Firebase Auth accounts and private simulated registry records.');
})().catch(err=>{console.error('Seeding failed:',err.message);process.exitCode=1;});
